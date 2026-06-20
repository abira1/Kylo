/**
 * WhatsApp Service for AS AI Agent
 * Handles WhatsApp message sending and webhook parsing
 * 
 * Integrates with Meta WhatsApp Business API
 * Documentation: https://developers.facebook.com/docs/whatsapp/cloud-api
 */

const axios = require('axios');

/**
 * WhatsApp Configuration
 */
const WHATSAPP_CONFIG = {
  businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
  apiVersion: 'v18.0',
  baseUrl: 'https://graph.instagram.com',
};

/**
 * Message Types
 */
const MESSAGE_TYPES = {
  TEXT: 'text',
  TEMPLATE: 'template',
  BUTTON: 'button',
  LIST: 'list',
  LOCATION: 'location',
  IMAGE: 'image',
  DOCUMENT: 'document',
};

/**
 * Validate WhatsApp Configuration
 */
function validateConfig() {
  const required = ['phoneNumberId', 'accessToken'];
  for (const field of required) {
    if (!WHATSAPP_CONFIG[field]) {
      console.warn(`[WHATSAPP_SERVICE] Missing config: ${field}`);
    }
  }
}

validateConfig();

/**
 * SEND TEXT MESSAGE
 * Send simple text message via WhatsApp
 */
async function sendTextMessage(phoneNumber, message, language = 'en') {
  try {
    if (!phoneNumber || !message) {
      throw new Error('phoneNumber and message are required');
    }

    // Format phone number (remove spaces, ensure +)
    const formattedPhone = phoneNumber.replace(/\D/g, '');
    const finalPhone = formattedPhone.startsWith('1') 
      ? formattedPhone 
      : formattedPhone;

    const url = `${WHATSAPP_CONFIG.baseUrl}/${WHATSAPP_CONFIG.apiVersion}/${WHATSAPP_CONFIG.phoneNumberId}/messages`;

    const payload = {
      messaging_product: 'whatsapp',
      to: finalPhone,
      type: 'text',
      text: {
        preview_url: false,
        body: message,
      },
    };

    const response = await axios.post(url, payload, {
      headers: {
        'Authorization': `Bearer ${WHATSAPP_CONFIG.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`[WHATSAPP_SERVICE] Text message sent to ${phoneNumber}`);

    return {
      success: true,
      messageId: response.data.messages[0].id,
      status: 'sent',
      phoneNumber,
      sentAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[WHATSAPP_SERVICE] Error sending text message:', error.message);
    // In development, return success anyway (API may not be configured)
    if (process.env.NODE_ENV === 'development') {
      console.log(`[WHATSAPP_SERVICE] [DEV MODE] Would send: "${message}" to ${phoneNumber}`);
      return {
        success: true,
        messageId: `dev-msg-${Date.now()}`,
        status: 'sent-dev',
        phoneNumber,
        sentAt: new Date().toISOString(),
      };
    }
    throw error;
  }
}

/**
 * SEND TEMPLATE MESSAGE
 * Send pre-approved template message with parameters
 */
async function sendTemplateMessage(phoneNumber, templateName, parameters = [], language = 'en') {
  try {
    if (!phoneNumber || !templateName) {
      throw new Error('phoneNumber and templateName are required');
    }

    const formattedPhone = phoneNumber.replace(/\D/g, '');

    const url = `${WHATSAPP_CONFIG.baseUrl}/${WHATSAPP_CONFIG.apiVersion}/${WHATSAPP_CONFIG.phoneNumberId}/messages`;

    const payload = {
      messaging_product: 'whatsapp',
      to: formattedPhone,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: language === 'ar' ? 'ar' : 'en_US',
        },
        parameters: parameters.length > 0 ? { body: { parameters } } : undefined,
      },
    };

    // Remove undefined parameters
    if (!payload.template.parameters) {
      delete payload.template.parameters;
    }

    const response = await axios.post(url, payload, {
      headers: {
        'Authorization': `Bearer ${WHATSAPP_CONFIG.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`[WHATSAPP_SERVICE] Template message sent to ${phoneNumber}`);

    return {
      success: true,
      messageId: response.data.messages[0].id,
      status: 'sent',
      template: templateName,
      phoneNumber,
      sentAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[WHATSAPP_SERVICE] Error sending template message:', error.message);
    if (process.env.NODE_ENV === 'development') {
      return {
        success: true,
        messageId: `dev-template-${Date.now()}`,
        status: 'sent-dev',
        template: templateName,
        phoneNumber,
        sentAt: new Date().toISOString(),
      };
    }
    throw error;
  }
}

/**
 * SEND BUTTON MESSAGE
 * Send interactive button message (up to 3 buttons)
 * Format: [{ id: "1", title: "Yes" }, { id: "2", title: "No" }]
 */
async function sendButtonMessage(phoneNumber, bodyText, buttons, footerText = '') {
  try {
    if (!phoneNumber || !bodyText || !Array.isArray(buttons) || buttons.length === 0) {
      throw new Error('phoneNumber, bodyText, and buttons are required');
    }

    if (buttons.length > 3) {
      throw new Error('Maximum 3 buttons allowed per message (WhatsApp limit)');
    }

    const formattedPhone = phoneNumber.replace(/\D/g, '');

    const url = `${WHATSAPP_CONFIG.baseUrl}/${WHATSAPP_CONFIG.apiVersion}/${WHATSAPP_CONFIG.phoneNumberId}/messages`;

    const payload = {
      messaging_product: 'whatsapp',
      to: formattedPhone,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: {
          text: bodyText,
        },
        footer: footerText ? { text: footerText } : undefined,
        action: {
          buttons: buttons.map((btn, idx) => ({
            type: 'reply',
            reply: {
              id: btn.id || idx.toString(),
              title: btn.title.substring(0, 20), // Max 20 chars per WhatsApp
            },
          })),
        },
      },
    };

    // Remove undefined footer
    if (!payload.interactive.footer) {
      delete payload.interactive.footer;
    }

    const response = await axios.post(url, payload, {
      headers: {
        'Authorization': `Bearer ${WHATSAPP_CONFIG.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`[WHATSAPP_SERVICE] Button message sent to ${phoneNumber}`);

    return {
      success: true,
      messageId: response.data.messages[0].id,
      status: 'sent',
      buttons: buttons.length,
      phoneNumber,
      sentAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[WHATSAPP_SERVICE] Error sending button message:', error.message);
    if (process.env.NODE_ENV === 'development') {
      return {
        success: true,
        messageId: `dev-button-${Date.now()}`,
        status: 'sent-dev',
        buttons: buttons.length,
        phoneNumber,
        sentAt: new Date().toISOString(),
      };
    }
    throw error;
  }
}

/**
 * SEND LIST MESSAGE
 * Send interactive list message (up to 10 options)
 */
async function sendListMessage(phoneNumber, headerText, bodyText, sections, footerText = '') {
  try {
    if (!phoneNumber || !bodyText || !Array.isArray(sections) || sections.length === 0) {
      throw new Error('phoneNumber, bodyText, and sections are required');
    }

    const formattedPhone = phoneNumber.replace(/\D/g, '');

    const url = `${WHATSAPP_CONFIG.baseUrl}/${WHATSAPP_CONFIG.apiVersion}/${WHATSAPP_CONFIG.phoneNumberId}/messages`;

    const payload = {
      messaging_product: 'whatsapp',
      to: formattedPhone,
      type: 'interactive',
      interactive: {
        type: 'list',
        header: headerText ? { type: 'text', text: headerText } : undefined,
        body: {
          text: bodyText,
        },
        footer: footerText ? { text: footerText } : undefined,
        action: {
          button: 'Select',
          sections: sections.map(section => ({
            title: section.title,
            rows: section.rows.map((row, idx) => ({
              id: row.id || idx.toString(),
              title: row.title.substring(0, 24), // Max 24 chars
              description: row.description ? row.description.substring(0, 72) : undefined, // Max 72 chars
            })),
          })),
        },
      },
    };

    // Remove undefined fields
    if (!payload.interactive.header) delete payload.interactive.header;
    if (!payload.interactive.footer) delete payload.interactive.footer;

    const response = await axios.post(url, payload, {
      headers: {
        'Authorization': `Bearer ${WHATSAPP_CONFIG.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`[WHATSAPP_SERVICE] List message sent to ${phoneNumber}`);

    return {
      success: true,
      messageId: response.data.messages[0].id,
      status: 'sent',
      options: sections.reduce((sum, s) => sum + s.rows.length, 0),
      phoneNumber,
      sentAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[WHATSAPP_SERVICE] Error sending list message:', error.message);
    if (process.env.NODE_ENV === 'development') {
      const totalOptions = sections.reduce((sum, s) => sum + s.rows.length, 0);
      return {
        success: true,
        messageId: `dev-list-${Date.now()}`,
        status: 'sent-dev',
        options: totalOptions,
        phoneNumber,
        sentAt: new Date().toISOString(),
      };
    }
    throw error;
  }
}

/**
 * PARSE WEBHOOK MESSAGE
 * Extract message data from WhatsApp webhook
 */
function parseWebhookMessage(webhookData) {
  try {
    if (!webhookData || !webhookData.entry || !Array.isArray(webhookData.entry)) {
      throw new Error('Invalid webhook payload structure');
    }

    const messages = [];

    for (const entry of webhookData.entry) {
      if (!entry.changes) continue;

      for (const change of entry.changes) {
        if (change.field !== 'messages') continue;

        const value = change.value;
        if (!value.messages) continue;

        for (const message of value.messages) {
          const contact = value.contacts ? value.contacts[0] : {};
          
          messages.push({
            messageId: message.id,
            phoneNumber: value.messages[0].from,
            timestamp: message.timestamp,
            type: message.type,
            text: message.type === 'text' ? message.text.body : null,
            contactName: contact.profile ? contact.profile.name : null,
            messageData: message,
          });
        }
      }
    }

    return messages;
  } catch (error) {
    console.error('[WHATSAPP_SERVICE] Error parsing webhook message:', error.message);
    return [];
  }
}

/**
 * MARK MESSAGE AS READ
 * Update delivery status
 */
async function markMessageAsRead(messageId) {
  try {
    if (!messageId) {
      throw new Error('messageId is required');
    }

    const url = `${WHATSAPP_CONFIG.baseUrl}/${WHATSAPP_CONFIG.apiVersion}/${WHATSAPP_CONFIG.phoneNumberId}/messages`;

    const payload = {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId,
    };

    await axios.post(url, payload, {
      headers: {
        'Authorization': `Bearer ${WHATSAPP_CONFIG.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`[WHATSAPP_SERVICE] Message marked as read: ${messageId}`);

    return { success: true, messageId };
  } catch (error) {
    console.error('[WHATSAPP_SERVICE] Error marking message as read:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendTextMessage,
  sendTemplateMessage,
  sendButtonMessage,
  sendListMessage,
  parseWebhookMessage,
  markMessageAsRead,
  MESSAGE_TYPES,
  WHATSAPP_CONFIG,
};
