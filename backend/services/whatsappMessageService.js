/**
 * WhatsApp Message Service
 * Handles sending messages to WhatsApp users via Meta Graph API
 */

class WhatsAppMessageService {
  /**
   * Send a text message via WhatsApp
   */
  static async sendMessage(config, recipientPhone, messageText) {
    try {
      console.log(`[WhatsApp] Sending message to ${recipientPhone}`);

      const response = await fetch(
        `https://graph.instagram.com/v18.0/${config.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiAccessToken}`,
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: recipientPhone,
            type: 'text',
            text: {
              body: messageText,
            },
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          `Meta API error: ${error.error?.message || 'Unknown error'}`
        );
      }

      const result = await response.json();
      console.log(`[WhatsApp] Message sent successfully: ${result.messages?.[0]?.id}`);
      return result;
    } catch (error) {
      console.error('[WhatsApp] Error sending message:', error.message);
      throw error;
    }
  }

  /**
   * Send a message with quick reply buttons
   * Max 3 buttons per message (Meta API limit)
   */
  static async sendQuickReplyMessage(config, recipientPhone, messageText, buttons) {
    try {
      console.log(`[WhatsApp] Sending quick reply message to ${recipientPhone}`);

      // Limit to 3 buttons
      const limitedButtons = buttons.slice(0, 3).map((btn) => ({
        type: 'reply',
        reply: {
          id: btn.id || btn.text.toLowerCase().replace(/\s+/g, '_'),
          title: btn.text.substring(0, 20), // Max 20 chars
        },
      }));

      const response = await fetch(
        `https://graph.instagram.com/v18.0/${config.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiAccessToken}`,
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: recipientPhone,
            type: 'interactive',
            interactive: {
              type: 'button',
              body: {
                text: messageText,
              },
              action: {
                buttons: limitedButtons,
              },
            },
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          `Meta API error: ${error.error?.message || 'Unknown error'}`
        );
      }

      const result = await response.json();
      console.log(`[WhatsApp] Quick reply message sent: ${result.messages?.[0]?.id}`);
      return result;
    } catch (error) {
      console.error('[WhatsApp] Error sending quick reply:', error.message);
      throw error;
    }
  }

  /**
   * Send a list message (dropdown)
   * Used for 4 or more options
   */
  static async sendListMessage(config, recipientPhone, messageText, listSections) {
    try {
      console.log(`[WhatsApp] Sending list message to ${recipientPhone}`);

      const response = await fetch(
        `https://graph.instagram.com/v18.0/${config.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiAccessToken}`,
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: recipientPhone,
            type: 'interactive',
            interactive: {
              type: 'list',
              body: {
                text: messageText,
              },
              action: {
                button: 'Select',
                sections: listSections.map((section) => ({
                  title: section.title,
                  rows: section.rows.map((row) => ({
                    id: row.id || row.title.toLowerCase().replace(/\s+/g, '_'),
                    title: row.title.substring(0, 20),
                    description: row.description?.substring(0, 30),
                  })),
                })),
              },
            },
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          `Meta API error: ${error.error?.message || 'Unknown error'}`
        );
      }

      const result = await response.json();
      console.log(`[WhatsApp] List message sent: ${result.messages?.[0]?.id}`);
      return result;
    } catch (error) {
      console.error('[WhatsApp] Error sending list message:', error.message);
      throw error;
    }
  }

  /**
   * Send a document/file
   */
  static async sendDocument(config, recipientPhone, fileUrl, caption) {
    try {
      console.log(`[WhatsApp] Sending document to ${recipientPhone}`);

      const response = await fetch(
        `https://graph.instagram.com/v18.0/${config.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiAccessToken}`,
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: recipientPhone,
            type: 'document',
            document: {
              link: fileUrl,
              caption: caption,
            },
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          `Meta API error: ${error.error?.message || 'Unknown error'}`
        );
      }

      const result = await response.json();
      console.log(`[WhatsApp] Document sent: ${result.messages?.[0]?.id}`);
      return result;
    } catch (error) {
      console.error('[WhatsApp] Error sending document:', error.message);
      throw error;
    }
  }
}

module.exports = WhatsAppMessageService;
