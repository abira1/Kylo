/**
 * Webhook Handler Service
 * Processes incoming WhatsApp messages and orchestrates session flow
 * 
 * Responsibilities:
 * - Parse incoming messages from Meta WhatsApp API
 * - Route messages to appropriate session handler
 * - Coordinate with Claude for conversation
 * - Update session state based on Claude responses
 * - Send responses back to user
 */

const sessionManager = require('./sessionManagerService');
const claudeService = require('./claudeService');
const whatsappService = require('./whatsappService');
const emailService = require('./emailService');
const stepEngine = require('./stepEngine');
const toolExecutor = require('./toolExecutor');

class WebhookHandler {
  constructor() {
    this.messageQueue = new Map(); // For handling multiple messages from same user
    this.sessionCache = new Map(); // Cache sessions for quick lookup
  }

  /**
   * Parse incoming webhook message from Meta
   * @param {Object} webhookData - Raw webhook data from Meta
   * @returns {Object} Parsed message with phoneNumber, text, type, etc.
   */
  parseWebhookMessage(webhookData) {
    try {
      // Meta webhook structure
      if (!webhookData.entry || !webhookData.entry[0]) {
        console.log('[WEBHOOK_HANDLER] Invalid webhook structure');
        return null;
      }

      const changes = webhookData.entry[0].changes[0];
      if (!changes || !changes.value || !changes.value.messages) {
        console.log('[WEBHOOK_HANDLER] No messages in webhook');
        return null;
      }

      const message = changes.value.messages[0];
      const phoneNumber = changes.value.contacts[0].wa_id;
      
      const parsed = {
        messageId: message.id,
        phoneNumber: `+${phoneNumber}`,
        timestamp: new Date(parseInt(message.timestamp) * 1000),
        type: message.type, // 'text', 'image', 'document', 'button', 'list', etc.
        from: message.from,
      };

      // Extract content based on message type
      switch (message.type) {
        case 'text':
          parsed.text = message.text.body;
          parsed.content = message.text.body;
          break;
        case 'image':
          parsed.image = message.image;
          parsed.content = message.image.link;
          parsed.caption = message.image.caption || '';
          break;
        case 'document':
          parsed.document = message.document;
          parsed.content = message.document.link;
          parsed.filename = message.document.filename;
          break;
        case 'button':
          parsed.buttonResponse = message.button;
          parsed.content = message.button.text;
          break;
        case 'interactive':
          const interactive = message.interactive;
          if (interactive.type === 'button_reply') {
            parsed.content = interactive.button_reply.title;
            parsed.buttonId = interactive.button_reply.id;
          } else if (interactive.type === 'list_reply') {
            parsed.content = interactive.list_reply.title;
            parsed.listId = interactive.list_reply.id;
          }
          break;
        default:
          parsed.content = '';
      }

      console.log(`[WEBHOOK_HANDLER] Parsed message from ${parsed.phoneNumber} (type: ${parsed.type})`);
      return parsed;
    } catch (error) {
      console.error('[WEBHOOK_HANDLER] Error parsing webhook:', error.message);
      return null;
    }
  }

  /**
   * Find or create session based on phone number
   * @param {string} phoneNumber - WhatsApp phone number
   * @returns {Promise<Object>} Session object
   */
  async findOrCreateSession(phoneNumber) {
    try {
      // Check cache first
      const cacheKey = `session_${phoneNumber}`;
      if (this.sessionCache.has(cacheKey)) {
        const cached = this.sessionCache.get(cacheKey);
        if (Date.now() - cached.cachedAt < 300000) { // 5 min cache
          console.log('[WEBHOOK_HANDLER] Using cached session');
          return cached.session;
        }
      }

      // Query Firestore for existing session with this phone number
      // For now, we'll create a new session per message
      // TODO: Implement cross-session lookup
      console.log('[WEBHOOK_HANDLER] No cached session, will create or use existing');
      return null;
    } catch (error) {
      console.error('[WEBHOOK_HANDLER] Error finding session:', error.message);
      return null;
    }
  }

  /**
   * Main webhook message handler
   * Routes message through appropriate handler based on session state
   * @param {string} phoneNumber - User's WhatsApp phone number
   * @param {Object} message - Parsed message object
   * @returns {Promise<boolean>} Success status
   */
  async handleMessage(phoneNumber, message) {
    try {
      console.log(`[WEBHOOK_HANDLER] Processing message from ${phoneNumber}`);

      // Find or create session
      let session = await this.findOrCreateSession(phoneNumber);
      
      if (!session) {
        // New user - create session
        session = await sessionManager.createSession(
          'whatsapp-user', // clientId - could be extracted from webhook
          'as-ai-platform',
          phoneNumber,
          'UAE'
        );
        console.log(`[WEBHOOK_HANDLER] Created new session: ${session.sessionId}`);
      }

      const sessionId = session.sessionId;

      // Get current step
      const currentStep = session.currentStep || 1;
      console.log(`[WEBHOOK_HANDLER] Session at step ${currentStep}`);

      // Route based on step
      let response;
      let toolCalls = [];

      // Build context for Claude
      const context = {
        sessionId,
        phoneNumber,
        step: currentStep,
        sessionData: session,
        messageType: message.type,
        userContent: message.content,
        language: session.preferredLanguage || 'en',
      };

      // Get step prompt
      const stepPrompt = stepEngine.getStepPrompt(currentStep, context);
      
      // Build Claude message with step context
      const claudeMessages = [
        {
          role: 'user',
          content: `${stepPrompt}\n\nUser response: ${message.content}`,
        }
      ];

      // Get Claude response with tools
      const claudeResponse = await claudeService.chat(claudeMessages);
      console.log(`[WEBHOOK_HANDLER] Claude response received for step ${currentStep}`);

      // Parse tool calls from Claude
      toolCalls = toolExecutor.parseToolCalls(claudeResponse);

      // Execute tools if any
      let toolResults = [];
      if (toolCalls.length > 0) {
        console.log(`[WEBHOOK_HANDLER] Executing ${toolCalls.length} tools`);
        for (const tool of toolCalls) {
          const result = await toolExecutor.executeTool(
            tool.name,
            tool.input,
            sessionId
          );
          toolResults.push({ tool: tool.name, result });
        }
      }

      // Extract response text from Claude
      const responseText = this.extractResponseText(claudeResponse);

      // Validate and process response based on step
      const stepResult = await stepEngine.processStepResponse(
        currentStep,
        message,
        claudeResponse,
        context
      );

      if (stepResult.isValid) {
        // Update session with collected data
        if (stepResult.collectedData) {
          for (const [key, value] of Object.entries(stepResult.collectedData)) {
            await sessionManager.addCollectedField(sessionId, key, value);
          }
        }

        // Move to next step
        const nextStep = currentStep + 1;
        if (nextStep <= 18) {
          await sessionManager.updateStep(sessionId, nextStep);
          console.log(`[WEBHOOK_HANDLER] Advanced from step ${currentStep} to ${nextStep}`);

          // Get next step prompt
          const nextStepPrompt = stepEngine.getStepPrompt(nextStep, context);
          
          // Send next question to user
          await whatsappService.sendTextMessage(
            phoneNumber,
            nextStepPrompt,
            context.language
          );
        } else {
          // All steps complete
          console.log('[WEBHOOK_HANDLER] All 18 steps complete');
          await this.completeSession(sessionId, phoneNumber, context.language);
        }
      } else {
        // Invalid response - ask for retry
        const retryPrompt = stepEngine.getRetryPrompt(currentStep, stepResult.error, context.language);
        await whatsappService.sendTextMessage(phoneNumber, retryPrompt, context.language);
      }

      // Cache session for next message
      const updatedSession = await sessionManager.getSession(sessionId);
      this.sessionCache.set(`session_${phoneNumber}`, {
        session: updatedSession,
        cachedAt: Date.now(),
      });

      return true;
    } catch (error) {
      console.error('[WEBHOOK_HANDLER] Error handling message:', error.message);
      
      // Send error message to user
      await whatsappService.sendTextMessage(
        phoneNumber,
        'Sorry, there was an issue processing your message. Please try again.',
        'en'
      );

      return false;
    }
  }

  /**
   * Extract text response from Claude response
   * @param {string} claudeResponse - Full Claude response
   * @returns {string} Extracted text
   */
  extractResponseText(claudeResponse) {
    const lines = claudeResponse.split('\n');
    let text = '';
    
    for (const line of lines) {
      if (line.includes('<tool_use')) {
        // Skip tool use blocks
        continue;
      }
      if (line.trim()) {
        text += line + '\n';
      }
    }
    
    return text.trim();
  }

  /**
   * Handle session completion
   * @param {string} sessionId - Session ID
   * @param {string} phoneNumber - User's phone number
   * @param {string} language - Preferred language
   */
  async completeSession(sessionId, phoneNumber, language = 'en') {
    try {
      console.log(`[WEBHOOK_HANDLER] Completing session ${sessionId}`);

      // Get final session data
      const session = await sessionManager.getSession(sessionId);

      // Send completion message
      const completionMessage = language === 'ar' 
        ? 'تم استكمال جميع الخطوات بنجاح! سيتم مراجعة بياناتك قريباً.' 
        : 'All steps completed successfully! Your application is being reviewed.';

      await whatsappService.sendTextMessage(phoneNumber, completionMessage, language);

      // Update session status
      await sessionManager.updateSessionStatus(sessionId, 'completed');

      // Send email confirmation
      await emailService.sendSessionAlert(
        session.email || 'user@example.com',
        session,
        language
      );

      // Log completion
      await sessionManager.logAction(sessionId, 'COMPLETION', {
        completedAt: new Date(),
        totalSteps: 18,
        documentCount: (session.documents || []).length,
      });
    } catch (error) {
      console.error('[WEBHOOK_HANDLER] Error completing session:', error.message);
    }
  }

  /**
   * Verify webhook token from Meta (for endpoint verification)
   * @param {string} token - Token from Meta
   * @returns {boolean} Is valid
   */
  verifyWebhookToken(token) {
    const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN || 'kylo-verify-token';
    return token === expectedToken;
  }

  /**
   * Get webhook status
   * @returns {Object} Webhook status info
   */
  getWebhookStatus() {
    return {
      active: true,
      endpoint: '/api/kylo/webhook/whatsapp',
      verifyToken: !!process.env.WHATSAPP_VERIFY_TOKEN,
      messageQueueSize: this.messageQueue.size,
      cachedSessions: this.sessionCache.size,
      timestamp: new Date(),
    };
  }
}

module.exports = new WebhookHandler();
