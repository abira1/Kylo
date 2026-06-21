/**
 * WhatsApp Message Service - Enhanced with Button & List Support
 * Sends different types of WhatsApp messages:
 * 1. Text messages (plain)
 * 2. Quick Reply Messages (≤3 buttons)
 * 3. List Messages (4+ options)
 * 4. Documents
 */

const axios = require('axios');

const API_VERSION = 'v18.0';
const API_BASE = 'https://graph.instagram.com';

/**
 * Send a plain text message
 */
async function sendTextMessage(config, recipientPhone, text) {
  try {
    const response = await axios.post(
      `${API_BASE}/${API_VERSION}/${config.phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: recipientPhone,
        type: 'text',
        text: {
          body: text,
        },
      },
      {
        headers: {
          'Authorization': `Bearer ${config.apiAccessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(`[WhatsApp] Text sent to ${recipientPhone}: ${response.data.messages[0].id}`);
    return { success: true, messageId: response.data.messages[0].id };
  } catch (error) {
    console.error('[WhatsApp Text] Error:', error.response?.data || error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send Quick Reply Message (≤3 buttons)
 * Example: { buttonLabels: ['Yes', 'No', 'Maybe'] }
 * Max 3 buttons per Meta API limits
 */
async function sendQuickReplyMessage(config, recipientPhone, messageBody, buttonLabels) {
  try {
    if (!buttonLabels || buttonLabels.length === 0) {
      throw new Error('No buttons provided');
    }

    if (buttonLabels.length > 3) {
      throw new Error('Quick Reply buttons limited to 3 per Meta API. Use List Message for 4+ options.');
    }

    const buttons = buttonLabels.map((label, idx) => ({
      type: 'reply',
      reply: {
        id: `btn_${idx}`,
        title: label.substring(0, 20), // Max 20 chars per button
      },
    }));

    const response = await axios.post(
      `${API_BASE}/${API_VERSION}/${config.phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: recipientPhone,
        type: 'interactive',
        interactive: {
          type: 'button',
          body: {
            text: messageBody,
          },
          action: {
            buttons: buttons,
          },
        },
      },
      {
        headers: {
          'Authorization': `Bearer ${config.apiAccessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(`[WhatsApp] Quick Reply sent to ${recipientPhone}: ${response.data.messages[0].id}`);
    return { success: true, messageId: response.data.messages[0].id };
  } catch (error) {
    console.error('[WhatsApp Button] Error:', error.response?.data || error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send List Message (4+ options)
 * Example: {
 *   bodyText: "Select a document type",
 *   sections: [
 *     {
 *       title: "Visa Documents",
 *       options: [
 *         { id: "visa_1", title: "Cancelled UAE Residence", description: "Visa card" },
 *         { id: "visa_2", title: "Tourist/Visit Visa", description: "Entry stamp" }
 *       ]
 *     }
 *   ]
 * }
 */
async function sendListMessage(config, recipientPhone, bodyText, sections) {
  try {
    if (!sections || sections.length === 0) {
      throw new Error('No sections provided for list message');
    }

    const flatOptions = sections.flatMap(s => s.options);
    if (flatOptions.length > 10) {
      throw new Error('List messages limited to 10 items total');
    }

    const response = await axios.post(
      `${API_BASE}/${API_VERSION}/${config.phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: recipientPhone,
        type: 'interactive',
        interactive: {
          type: 'list',
          body: {
            text: bodyText,
          },
          action: {
            button: 'Select',
            sections: sections,
          },
        },
      },
      {
        headers: {
          'Authorization': `Bearer ${config.apiAccessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(`[WhatsApp] List Message sent to ${recipientPhone}: ${response.data.messages[0].id}`);
    return { success: true, messageId: response.data.messages[0].id };
  } catch (error) {
    console.error('[WhatsApp List] Error:', error.response?.data || error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send Document Message
 */
async function sendDocumentMessage(config, recipientPhone, documentUrl, caption = null) {
  try {
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: recipientPhone,
      type: 'document',
      document: {
        link: documentUrl,
      },
    };

    if (caption) {
      payload.document.caption = caption;
    }

    const response = await axios.post(
      `${API_BASE}/${API_VERSION}/${config.phoneNumberId}/messages`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${config.apiAccessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(`[WhatsApp] Document sent to ${recipientPhone}: ${response.data.messages[0].id}`);
    return { success: true, messageId: response.data.messages[0].id };
  } catch (error) {
    console.error('[WhatsApp Document] Error:', error.response?.data || error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send Generic Message (detects type and routes to correct handler)
 */
async function sendMessage(config, recipientPhone, messageContent) {
  try {
    // If messageContent is an object, use specific message type
    if (typeof messageContent === 'object') {
      if (messageContent.type === 'quick_reply') {
        return sendQuickReplyMessage(config, recipientPhone, messageContent.text, messageContent.buttons);
      } else if (messageContent.type === 'list') {
        return sendListMessage(config, recipientPhone, messageContent.text, messageContent.sections);
      } else if (messageContent.type === 'document') {
        return sendDocumentMessage(config, recipientPhone, messageContent.url, messageContent.caption);
      }
    }

    // Default to text message
    return sendTextMessage(config, recipientPhone, messageContent);
  } catch (error) {
    console.error('[WhatsApp] Generic send error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Convenience: Send Yes/No buttons
 */
async function sendYesNoButtons(config, recipientPhone, messageBody) {
  return sendQuickReplyMessage(config, recipientPhone, messageBody, ['Yes', 'No']);
}

/**
 * Convenience: Send UAE Entry Status options (4 items = List Message)
 */
async function sendUaeEntryStatusList(config, recipientPhone) {
  const sections = [
    {
      title: 'Inside UAE',
      options: [
        { id: 'visa_1', title: 'Cancelled UAE Residence', description: 'Valid residence visa cancellation' },
        { id: 'visa_2', title: 'Tourist / Visit / Leisure Visa', description: 'Active or expired' },
        { id: 'visa_3', title: 'Visa on Arrival (entry stamp)', description: 'Entry stamp in passport' },
        { id: 'visa_4', title: 'Other visa', description: 'Another type of visa' },
      ],
    },
  ];

  return sendListMessage(
    config,
    recipientPhone,
    'Kindly select the type of entry proof you have:',
    sections
  );
}

module.exports = {
  sendTextMessage,
  sendQuickReplyMessage,
  sendListMessage,
  sendDocumentMessage,
  sendMessage,
  sendYesNoButtons,
  sendUaeEntryStatusList,
};
