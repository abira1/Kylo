const admin = require('firebase-admin');
const WhatsAppConfigService = require('../services/whatsappConfigService');
const WhatsAppMessageService = require('../services/whatsappMessageService');
const SessionStateManager = require('../services/sessionStateManager');
const ToolHandlers = require('../services/toolHandlers');
const { SYSTEM_PROMPT } = require('../prompts/uaeAgentSystemPrompt');

const db = admin.firestore();

/**
 * Webhook receiver for Meta WhatsApp Business API
 * This handles:
 * 1. Webhook verification (GET request from Meta)
 * 2. Incoming messages (POST request)
 */

async function handleWebhookVerification(req) {
  const { token, challenge } = req.query;
  const clientId = req.params.clientId;

  try {
    const config = await WhatsAppConfigService.getConfig(clientId);
    if (!config) {
      console.error(`[WhatsApp] Config not found for client: ${clientId}`);
      return { statusCode: 404, body: 'Config not found' };
    }

    // Verify token matches
    if (token !== config.webhookVerifyToken) {
      console.warn(`[WhatsApp] Invalid webhook token for client: ${clientId}`);
      return { statusCode: 403, body: 'Invalid token' };
    }

    console.log(`[WhatsApp] Webhook verified for client: ${clientId}`);
    return { statusCode: 200, body: challenge };
  } catch (error) {
    console.error('[WhatsApp] Webhook verification error:', error.message);
    return { statusCode: 500, body: 'Internal error' };
  }
}

async function handleIncomingMessage(req) {
  const { clientId } = req.params;
  const body = req.body;

  try {
    console.log(`[WhatsApp] Incoming webhook for client: ${clientId}`);

    // Extract message from Meta webhook payload
    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];

    if (!message) {
      console.log('[WhatsApp] No message in webhook, ignoring');
      return { statusCode: 200, body: 'ok' }; // Still return 200 to acknowledge receipt
    }

    const senderPhone = message.from;
    const messageId = message.id;
    const messageType = message.type; // text, image, document, etc.

    console.log(`[WhatsApp] Message from ${senderPhone}: type=${messageType}, id=${messageId}`);

    // Get client config
    const config = await WhatsAppConfigService.getConfig(clientId);
    if (!config) {
      console.error(`[WhatsApp] Config not found for client: ${clientId}`);
      return { statusCode: 404, body: 'Config not found' };
    }

    // Extract message content based on type
    let messageContent = '';
    if (messageType === 'text') {
      messageContent = message.text?.body || '';
    } else if (messageType === 'image') {
      messageContent = `[Image: ${message.image?.id}]`;
    } else if (messageType === 'document') {
      messageContent = `[Document: ${message.document?.id}]`;
    } else {
      messageContent = `[${messageType.toUpperCase()}]`;
    }

    if (!messageContent.trim()) {
      console.log('[WhatsApp] Empty message content');
      return { statusCode: 200, body: 'ok' };
    }

    // Store WhatsApp session link
    const sessionDocRef = db.collection('whatsappSessions').doc(senderPhone);
    await sessionDocRef.set(
      {
        clientId,
        senderPhone,
        lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'active',
      },
      { merge: true }
    );

    // Create agent session or link to existing one
    let agentSession = await db
      .collection('clients')
      .doc(clientId)
      .collection('agentSessions')
      .where('whatsappPhone', '==', senderPhone)
      .limit(1)
      .get();

    let sessionId;
    if (agentSession.empty) {
      // Create new agent session
      const newSession = await db
        .collection('clients')
        .doc(clientId)
        .collection('agentSessions')
        .add({
          whatsappPhone: senderPhone,
          currentStep: 1,
          status: 'active',
          collectedFields: {},
          pendingItems: [],
          shareholderQueue: [],
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      sessionId = newSession.id;
      console.log(`[WhatsApp] Created new agent session: ${sessionId}`);
    } else {
      sessionId = agentSession.docs[0].id;
      console.log(`[WhatsApp] Using existing agent session: ${sessionId}`);
    }

    // Send to agent processor
    const agentResponse = await processMessageThroughAgent(
      clientId,
      sessionId,
      messageContent,
      senderPhone,
      config
    );

    // Send response back via WhatsApp
    if (agentResponse?.message) {
      await WhatsAppMessageService.sendMessage(
        config,
        senderPhone,
        agentResponse.message
      );
    }

    // Send message delivery acknowledgment to Meta
    await sendMessageRead(config, messageId);

    return { statusCode: 200, body: 'Message processed' };
  } catch (error) {
    console.error('[WhatsApp] Error processing message:', error.message);
    return { statusCode: 500, body: 'Error processing message' };
  }
}

async function processMessageThroughAgent(clientId, sessionId, message, senderPhone, config) {
  try {
    // Get current session state
    const sessionRef = db
      .collection('clients')
      .doc(clientId)
      .collection('agentSessions')
      .doc(sessionId);

    const sessionDoc = await sessionRef.get();
    let sessionState = sessionDoc.data();

    // Add message to history
    await SessionStateManager.addMessageToHistory(clientId, sessionId, message, 'user');

    // Build system prompt with complete training document
    // The session state is injected as context
    const systemPromptWithContext = buildCompleteSystemPrompt(sessionState);

    // Create Claude client
    const Anthropic = require('@anthropic-ai/sdk');
    const client = new Anthropic({
      apiKey: process.env.CLAUDE_API_KEY,
    });

    console.log(`[Agent] Calling Claude for session ${sessionId}, step ${sessionState.currentStep}`);

    // Call Claude with system prompt + session context
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      system: systemPromptWithContext,
      messages: [
        {
          role: 'user',
          content: message,
        },
      ],
    });

    let agentMessage = response.content[0].text;

    // Check for tool calls in the response
    // Claude may request tools like: [TOOL CALL: send_otp(...)]
    // We'll handle this in a separate parsing step
    let toolResults = null;
    if (agentMessage.includes('[TOOL CALL:') || agentMessage.includes('Tool:')) {
      const toolParseResult = await parseAndExecuteToolCalls(
        agentMessage,
        clientId,
        sessionId,
        senderPhone,
        sessionState
      );
      toolResults = toolParseResult.results;
      agentMessage = toolParseResult.cleanMessage;
    }

    // Update session state with response
    await sessionRef.update({
      lastUserMessage: message,
      lastAgentResponse: agentMessage,
      currentStep: sessionState.currentStep,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Add agent response to history
    await SessionStateManager.addMessageToHistory(clientId, sessionId, agentMessage, 'agent');

    return {
      message: agentMessage,
      toolResults: toolResults,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    };
  } catch (error) {
    console.error('[WhatsApp Agent] Error:', error.message);
    return {
      message: 'Sorry, I encountered an error. Please try again shortly.',
      error: error.message,
    };
  }
}

/**
 * Build complete system prompt with session context injected
 */
function buildCompleteSystemPrompt(sessionState) {
  // Start with the comprehensive training document
  let prompt = SYSTEM_PROMPT;

  // Inject current session state as context
  prompt += `\n\n================================================================================
CURRENT SESSION STATE (inject this at the start of every turn)
================================================================================

${JSON.stringify(
    {
      currentStep: sessionState?.currentStep || 1,
      agentName: sessionState?.agentName,
      cspName: sessionState?.cspName,
      clientName: sessionState?.clientName,
      jurisdiction: sessionState?.jurisdiction,
      businessActivity: sessionState?.businessActivity,
      visaAllocation: sessionState?.visaAllocation,
      shareholderCount: sessionState?.shareholderCount,
      collectedFields: sessionState?.collectedFields || {},
      pendingItems: sessionState?.pendingItems || [],
      shareholderQueue: sessionState?.shareholderQueue || [],
      otpVerified: sessionState?.otpVerified,
      otpAttempts: sessionState?.otpAttempts,
      rescheduleUntil: sessionState?.rescheduleUntil,
    },
    null,
    2
  )}

================================================================================
INSTRUCTIONS FOR THIS TURN
================================================================================

You are currently at STEP ${sessionState?.currentStep || 1} of the 18-step process.

1. Check rescheduleUntil in the session state. If it is set to a future time,
   do NOT continue with data collection. Respond warmly and wait until that
   time has passed.

2. If otpVerified is false and currentStep >= 3, the user has not passed the
   identity gate. Go back to Step 2 immediately.

3. Every response must be a SINGLE WhatsApp message bubble. Never split
   questions and acknowledgements across two bubbles.

4. If you need to call a tool (send_otp, verify_otp, extract_passport,
   escalate_to_human, or log_pending), format it EXACTLY as:
   [TOOL CALL: send_otp(clientPhone="${sessionState?.collectedFields?.mobileNumber}", clientEmail="${sessionState?.collectedFields?.email}")]
   or similar. The backend will parse and execute this.

5. Never invent data. If you cannot extract a value cleanly, ask the user
   directly or call the appropriate tool.

6. Follow the exact step order in Section 5 of the training document.
   Only deviate if a branch in Section 6 explicitly tells you to.

7. When sending message options:
   - For ≤3 options: use [BUTTON: Option 1] [BUTTON: Option 2] format
   - For 4+ options: use [LIST_MESSAGE: Item 1, Item 2, Item 3, Item 4] format

================================================================================
`;

  return prompt;
}

/**
 * Parse and execute tool calls from Claude's response
 */
async function parseAndExecuteToolCalls(agentMessage, clientId, sessionId, senderPhone, sessionState) {
  try {
    const toolCallRegex = /\[TOOL CALL: (\w+)\((.*?)\)\]/g;
    const results = [];
    let cleanMessage = agentMessage;

    let match;
    while ((match = toolCallRegex.exec(agentMessage)) !== null) {
      const toolName = match[1];
      const argsStr = match[2];

      console.log(`[Tool] Executing: ${toolName}(${argsStr})`);

      let result = { tool: toolName, status: 'error', message: 'Unknown tool' };

      if (toolName === 'send_otp') {
        result = await ToolHandlers.sendOtp(
          clientId,
          senderPhone,
          sessionState.collectedFields?.email,
          sessionId
        );
      } else if (toolName === 'verify_otp') {
        // Extract the OTP code from args
        const codeMatch = argsStr.match(/submittedCode="([^"]+)"/);
        const code = codeMatch ? codeMatch[1] : null;
        result = await ToolHandlers.verifyOtp(clientId, sessionId, code);
      } else if (toolName === 'extract_passport') {
        const fileUrlMatch = argsStr.match(/fileUrl="([^"]+)"/);
        const fileUrl = fileUrlMatch ? fileUrlMatch[1] : null;
        result = await ToolHandlers.extractPassport(fileUrl, sessionId);
      } else if (toolName === 'escalate_to_human') {
        const reasonMatch = argsStr.match(/reason="([^"]+)"/);
        const reason = reasonMatch ? reasonMatch[1] : 'Escalation requested';
        result = await ToolHandlers.escalateToHuman(clientId, sessionId, reason, {
          phoneNumber: senderPhone,
          sessionState,
        });
      } else if (toolName === 'log_pending') {
        const itemMatch = argsStr.match(/item="([^"]+)"/);
        const item = itemMatch ? itemMatch[1] : 'Unknown pending item';
        result = await ToolHandlers.logPending(clientId, sessionId, item);
      }

      results.push(result);

      // Remove tool call from message (clean output)
      cleanMessage = cleanMessage.replace(match[0], '');
    }

    return {
      cleanMessage: cleanMessage.trim(),
      results: results.length > 0 ? results : null,
    };
  } catch (error) {
    console.error('[ToolExecution] Error:', error.message);
    return {
      cleanMessage: agentMessage,
      results: [{ status: 'error', message: error.message }],
    };
  }
}

async function sendMessageRead(config, messageId) {
  try {
    await fetch(
      `https://graph.instagram.com/v18.0/${config.businessAccountId}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiAccessToken}`,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          status: 'read',
          message_id: messageId,
        }),
      }
    );
  } catch (error) {
    console.warn('[WhatsApp] Failed to send read receipt:', error.message);
  }
}

module.exports = {
  handleWebhookVerification,
  handleIncomingMessage,
  processMessageThroughAgent,
  buildCompleteSystemPrompt,
};
