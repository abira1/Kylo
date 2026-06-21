const express = require('express');
const WhatsAppConfigService = require('../services/whatsappConfigService');
const { handleWebhookVerification, handleIncomingMessage } = require('../handlers/whatsappWebhookHandler');

const router = express.Router();

/**
 * POST /api/whatsapp/config/save
 * Save WhatsApp credentials for a client
 */
router.post('/config/save', async (req, res) => {
  try {
    const { clientId, phoneNumberId, businessAccountId, webhookVerifyToken, apiAccessToken } = req.body;

    if (!clientId) {
      return res.status(400).json({ error: 'clientId required' });
    }

    await WhatsAppConfigService.saveConfig(clientId, {
      phoneNumberId,
      businessAccountId,
      webhookVerifyToken,
      apiAccessToken,
    });

    res.json({ success: true, message: 'Configuration saved' });
  } catch (error) {
    console.error('[WhatsApp API] Config save error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/whatsapp/config/test
 * Test WhatsApp connection with provided credentials
 */
router.post('/config/test', async (req, res) => {
  try {
    const { clientId, phoneNumberId, businessAccountId, webhookVerifyToken, apiAccessToken } = req.body;

    if (!clientId) {
      return res.status(400).json({ error: 'clientId required' });
    }

    const result = await WhatsAppConfigService.testConnection(clientId, {
      phoneNumberId,
      businessAccountId,
      webhookVerifyToken,
      apiAccessToken,
    });

    res.json(result);
  } catch (error) {
    console.error('[WhatsApp API] Connection test error:', error.message);
    res.status(500).json({ error: error.message || 'Connection failed' });
  }
});

/**
 * GET /api/webhooks/whatsapp/:clientId
 * Webhook verification endpoint (required by Meta)
 */
router.get('/webhooks/whatsapp/:clientId', async (req, res) => {
  const result = await handleWebhookVerification(req);
  res.status(result.statusCode).send(result.body);
});

/**
 * POST /api/webhooks/whatsapp/:clientId
 * Incoming WhatsApp message webhook (required by Meta)
 */
router.post('/webhooks/whatsapp/:clientId', async (req, res) => {
  const result = await handleIncomingMessage(req);
  res.status(result.statusCode).json({ message: result.body });
});

/**
 * GET /api/whatsapp/config/:clientId
 * Get WhatsApp configuration status (public info only, no tokens)
 */
router.get('/config/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    const config = await WhatsAppConfigService.getConfig(clientId);

    if (!config) {
      return res.json({ configured: false });
    }

    // Return only non-sensitive info
    res.json({
      configured: true,
      isConnected: config.isConnected,
      phoneNumberId: config.phoneNumberId.replace(/(.{4})(.*)(.{4})/, '$1****$3'), // Mask middle
      createdAt: config.createdAt,
    });
  } catch (error) {
    console.error('[WhatsApp API] Config retrieval error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
