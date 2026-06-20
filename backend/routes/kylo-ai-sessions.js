/**
 * AS AI Agent Routes
 * REST API endpoints for WhatsApp-based UAE Business License Application
 * 
 * Endpoints:
 * POST /api/kylo/session/init            - Initialize new session
 * GET  /api/kylo/session/{sessionId}     - Get session state (admin)
 * POST /api/kylo/session/{sessionId}/step - Process user response
 * POST /api/kylo/otp/send                - Send OTP to user
 * POST /api/kylo/otp/verify              - Verify OTP submission
 * POST /api/kylo/document/upload         - Upload document
 * GET  /api/kylo/document/{docId}        - Get document (admin)
 * POST /api/kylo/escalation/list         - List escalations (admin)
 * POST /api/kylo/webhook/whatsapp        - WhatsApp webhook receiver
 */

const express = require('express');
const router = express.Router();
const sessionManager = require('../services/sessionManagerService');
const otpService = require('../services/otpService');
const toolExecutor = require('../services/toolExecutor');
const webhookHandler = require('../services/webhookHandler');
const stepEngine = require('../services/stepEngine');

/**
 * INIT SESSION ENDPOINT
 * POST /api/kylo/session/init
 * Initialize new AS AI session
 */
router.post('/session/init', async (req, res) => {
  try {
    const { clientId, cspId, phoneNumber, jurisdiction = 'UAE' } = req.body;

    // Validate required fields
    if (!clientId || !cspId || !phoneNumber) {
      return res.status(400).json({
        error: 'Missing required fields: clientId, cspId, phoneNumber'
      });
    }

    // Create session
    const session = await sessionManager.createSession(
      clientId,
      cspId,
      phoneNumber,
      jurisdiction
    );

    console.log(`[API] Session initialized: ${session.sessionId}`);

    return res.status(201).json({
      success: true,
      session: {
        sessionId: session.sessionId,
        step: session.state.currentStep,
        status: session.state.status,
        createdAt: session.createdAt,
        message: 'Session initialized. Ready to start application process.'
      }
    });
  } catch (error) {
    console.error('[API] Error initializing session:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET SESSION ENDPOINT
 * GET /api/kylo/session/{sessionId}
 * Retrieve session state (admin view)
 */
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    const session = await sessionManager.getSession(sessionId);

    return res.status(200).json({
      success: true,
      session: {
        sessionId: session.sessionId,
        clientId: session.clientId,
        cspId: session.cspId,
        phoneNumber: session.phoneNumber,
        state: session.state,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt
      }
    });
  } catch (error) {
    console.error('[API] Error getting session:', error.message);
    return res.status(404).json({ error: error.message });
  }
});

/**
 * PROCESS STEP ENDPOINT
 * POST /api/kylo/session/{sessionId}/step
 * Process user response and progress to next step
 */
router.post('/session/:sessionId/step', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { userMessage, nextStep, collectedData = {}, toolCalls = [] } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    const session = await sessionManager.getSession(sessionId);

    // Process collected data
    for (const [fieldName, value] of Object.entries(collectedData)) {
      await sessionManager.addCollectedField(sessionId, fieldName, value);
    }

    // Execute any tool calls
    const toolResults = [];
    for (const toolCall of toolCalls) {
      const result = await toolExecutor.executeTool(
        toolCall.name,
        toolCall.input,
        sessionId
      );
      toolResults.push(result);
    }

    // Move to next step if provided
    if (nextStep) {
      await sessionManager.updateStep(sessionId, nextStep);
    }

    // Get updated session
    const updatedSession = await sessionManager.getSession(sessionId);

    return res.status(200).json({
      success: true,
      session: {
        sessionId,
        currentStep: updatedSession.state.currentStep,
        status: updatedSession.state.status,
        collectedFields: updatedSession.state.collectedFields,
        pendingItems: updatedSession.state.pendingItems
      },
      toolResults: toolResults.length > 0 ? toolResults : null,
      message: `Step ${nextStep} processed successfully`
    });
  } catch (error) {
    console.error('[API] Error processing step:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * SEND OTP ENDPOINT
 * POST /api/kylo/otp/send
 * Send OTP to user's phone
 */
router.post('/otp/send', async (req, res) => {
  try {
    const { sessionId, phoneNumber, email, language = 'en' } = req.body;

    if (!sessionId || !phoneNumber) {
      return res.status(400).json({ error: 'sessionId and phoneNumber are required' });
    }

    const result = await otpService.sendOTP(sessionId, phoneNumber, email, language);

    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }

    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      expiresInMinutes: otpService.OTP_EXPIRY_MINUTES,
      channels: result.channels
    });
  } catch (error) {
    console.error('[API] Error sending OTP:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * VERIFY OTP ENDPOINT
 * POST /api/kylo/otp/verify
 * Verify OTP code submitted by user
 */
router.post('/otp/verify', async (req, res) => {
  try {
    const { sessionId, code } = req.body;

    if (!sessionId || !code) {
      return res.status(400).json({ error: 'sessionId and code are required' });
    }

    const result = await otpService.verifyOTP(sessionId, code);

    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }

    // Update session with verified flag
    const session = await sessionManager.getSession(sessionId);
    const newState = { ...session.state };
    newState.otpVerified = true;
    await sessionManager.updateSession(sessionId, { state: newState });

    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      nextAction: 'Proceed with personal information collection'
    });
  } catch (error) {
    console.error('[API] Error verifying OTP:', error.message);
    return res.status(400).json({ error: error.message });
  }
});

/**
 * UPLOAD DOCUMENT ENDPOINT
 * POST /api/kylo/document/upload
 * Upload document for extraction
 */
router.post('/document/upload', async (req, res) => {
  try {
    const { sessionId, documentType, fileUrl, fileName = '' } = req.body;

    if (!sessionId || !documentType || !fileUrl) {
      return res.status(400).json({
        error: 'sessionId, documentType, and fileUrl are required'
      });
    }

    // TODO: Extract document data using Claude Vision

    // For now, just store the document reference
    const updatedSession = await sessionManager.addDocument(sessionId, documentType, fileUrl);

    return res.status(200).json({
      success: true,
      message: `${documentType} document uploaded successfully`,
      document: {
        type: documentType,
        fileUrl,
        uploadedAt: new Date().toISOString(),
        status: 'pending_extraction'
      }
    });
  } catch (error) {
    console.error('[API] Error uploading document:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET ESCALATIONS ENDPOINT
 * GET /api/kylo/escalations
 * List all escalations (admin view)
 */
router.get('/escalations', async (req, res) => {
  try {
    const { status = 'pending' } = req.query;

    // TODO: Query escalations from Firestore
    // For now, return empty array

    return res.status(200).json({
      success: true,
      escalations: [],
      total: 0,
      status: status
    });
  } catch (error) {
    console.error('[API] Error getting escalations:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * WHATSAPP WEBHOOK ENDPOINT
 * POST /api/kylo/webhook/whatsapp
 * Receive messages from WhatsApp Business API
 */
router.post('/webhook/whatsapp', async (req, res) => {
  try {
    const { entry } = req.body;

    if (!entry || !Array.isArray(entry)) {
      return res.status(400).json({ error: 'Invalid webhook payload' });
    }

    console.log(`[WEBHOOK] Received WhatsApp message`);

    // Parse incoming message
    const message = webhookHandler.parseWebhookMessage(req.body);
    
    if (!message) {
      console.log('[WEBHOOK] Failed to parse message');
      return res.status(200).json({ success: true }); // Still return 200 to ack webhook
    }

    // Process message asynchronously (don't wait for completion)
    webhookHandler.handleMessage(message.phoneNumber, message)
      .catch(error => {
        console.error('[WEBHOOK] Error in message handler:', error.message);
      });

    // Always return 200 OK to acknowledge webhook receipt
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[WEBHOOK] Error processing WhatsApp message:', error.message);
    // Still return 200 to avoid webhook redelivery
    return res.status(200).json({ success: true });
  }
});

/**
 * WHATSAPP WEBHOOK VERIFICATION
 * GET /api/kylo/webhook/whatsapp
 * Verify webhook with WhatsApp
 */
router.get('/webhook/whatsapp', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && webhookHandler.verifyWebhookToken(token)) {
    console.log('[WEBHOOK] WhatsApp webhook verified');
    return res.status(200).send(challenge);
  }

  console.log('[WEBHOOK] Webhook verification failed');
  return res.status(403).json({ error: 'Webhook verification failed' });
});

/**
 * HEALTH CHECK ENDPOINT
 * GET /api/kylo/health
 * Check if AS AI service is running
 */
router.get('/health', (req, res) => {
  return res.status(200).json({
    status: 'ok',
    service: 'kylo-ai-agent',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

module.exports = router;
