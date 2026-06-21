# WhatsApp Business Integration Setup Guide

## Overview
This guide helps clients connect their WhatsApp Business Account to the KYLO-AI platform, enabling their AI agent to handle customer inquiries directly on WhatsApp.

## Prerequisites
- A Meta/Facebook Business Account
- Access to WhatsApp Business API (available through Meta Business Suite)
- API credentials from Meta

## Step-by-Step Setup

### 1. Create a Meta Business Account
If you don't have a Meta Business Account:
1. Go to [business.facebook.com](https://business.facebook.com)
2. Click "Create an Account"
3. Fill in your business information
4. Verify your business identity

### 2. Create a WhatsApp Business App

1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Create a new app and select "Business" app type
3. Add WhatsApp product to your app
4. In the app dashboard, navigate to **WhatsApp** > **Getting Started**

### 3. Get Your API Credentials

You'll need three pieces of information:

#### **Phone Number ID**
1. In your WhatsApp app settings, go to **API Setup**
2. Find your business phone number
3. Copy the associated **Phone Number ID** (16-digit number)

#### **Business Account ID**
1. In WhatsApp settings, go to **Business Account**
2. Copy your **Business Account ID** (typically 10 digits)

#### **API Access Token**
1. Go to **Settings** > **User Roles**
2. Under "System User", create or select a system user
3. Generate an **API Access Token** with WhatsApp Message Template permissions
4. **Keep this token secure** - it will be encrypted in our database

### 4. Connect in KYLO-AI Dashboard

1. Log into your KYLO-AI dashboard
2. Navigate to **Dashboard** > **WhatsApp Setup**
3. Fill in the following fields:
   - **Phone Number ID**: Paste your 16-digit phone number ID
   - **Business Account ID**: Paste your business account ID
   - **Webhook Verify Token**: Create a secure random token (e.g., `kylo_webhook_secret_2024`)
   - **API Access Token**: Paste your Meta API token
4. Click **"Test Connection"** to verify credentials
5. Click **"Save Configuration"** to store encrypted credentials

### 5. Configure Webhook in Meta App

After saving in KYLO-AI:

1. Go back to your Meta app settings
2. Navigate to **WhatsApp** > **Configuration**
3. Set the following webhook settings:
   - **Webhook URL**: Copy from KYLO-AI dashboard (webhook URL section)
   - **Webhook Verify Token**: Use the same token you entered in KYLO-AI
   - **Subscribe to Fields**: Enable "messages", "message_status", "message_template_status_update"

4. Click **"Verify and Save"**

### 6. Verify Connection

After webhook configuration:

1. Return to KYLO-AI dashboard
2. The **Connection Status** should show "Connected" (green indicator)
3. You'll see WhatsApp Agent Status with:
   - **Status**: Active
   - **Messages Today**: 0
   - **Active Sessions**: 0

## How It Works

Once connected:

1. **Customer Messages**: When a customer messages your WhatsApp Business number, the message is sent to our webhook
2. **AI Processing**: Your AI agent processes the message using the same logic as your embedded chatbox
3. **Response**: The AI generates a response and sends it back to the customer on WhatsApp
4. **Multi-Step Forms**: The agent maintains session state across multiple messages, perfect for forms like your 18-step visa application

## Features

✅ **Transport-Independent Agent**
- Same AI behavior on WhatsApp and embedded chatbox
- Consistent context across channels

✅ **Multi-Step Support**
- Maintains session state and conversation history
- Handles form progression smoothly

✅ **Security**
- API tokens encrypted at rest (AES-256-CBC)
- Secure webhook verification
- Firebase Firestore access control

✅ **Monitoring**
- Real-time metrics in dashboard
- Message counts and response times
- Quality ratings and quotas

## Troubleshooting

### Connection Test Failed
- Verify your API Access Token is correct and hasn't expired
- Check that your Phone Number ID and Business Account ID match your Meta app
- Ensure your IP address isn't blocked by Meta

### Messages Not Arriving
- Verify webhook URL is correct in Meta app settings
- Check webhook verification token matches exactly
- Ensure Meta app webhook is in "Active" state
- Check KYLO-AI logs for any errors

### Agent Not Responding
- Verify your AI model is trained and configured
- Check Firebase connection is active
- Review agent session state in Firebase Console

### Rate Limiting
- Meta WhatsApp API has rate limits (typically 1000 messages/day for free tier)
- Check your Meta Business Account for quota warnings
- Contact Meta support if you need higher limits

## API Reference

### Save Configuration
```
POST /api/whatsapp/config/save
Content-Type: application/json

{
  "clientId": "user-uid",
  "phoneNumberId": "1234567890123456",
  "businessAccountId": "9876543210",
  "webhookVerifyToken": "your-secret-token",
  "apiAccessToken": "EABsBla..."
}
```

### Test Connection
```
POST /api/whatsapp/config/test
Content-Type: application/json

{
  "clientId": "user-uid",
  "phoneNumberId": "1234567890123456",
  "businessAccountId": "9876543210",
  "webhookVerifyToken": "your-secret-token",
  "apiAccessToken": "EABsBla..."
}
```

### Webhook Verification
```
GET /api/webhooks/whatsapp/{clientId}?hub.mode=subscribe&hub.verify_token=your-secret-token&hub.challenge=1234567890

Returns: {
  "challenge": "1234567890"
}
```

### Incoming Message
```
POST /api/webhooks/whatsapp/{clientId}
Content-Type: application/json

{
  "entry": [
    {
      "changes": [
        {
          "value": {
            "messages": [
              {
                "from": "1234567890",
                "type": "text",
                "text": { "body": "User message" }
              }
            ]
          }
        }
      ]
    }
  ]
}
```

## Security Considerations

1. **Never share your API Access Token** - it's equivalent to a password
2. **Webhook Verify Token** should be a strong random string (not your name or business name)
3. **HTTPS Only** - all webhook communication is encrypted in transit
4. **Firebase Access** - configure Firestore rules to ensure only your app can access configs
5. **Encryption at Rest** - tokens are AES-256-CBC encrypted with a backend key

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review logs in your KYLO-AI dashboard
3. Contact KYLO-AI support team
4. For Meta API issues, refer to [Meta Business Documentation](https://developers.facebook.com/docs/whatsapp/cloud-api)

## Advanced Configuration

### Custom System Prompt
Your AI agent uses a custom system prompt for WhatsApp. This is the same prompt used in your dashboard, ensuring consistent behavior across channels.

### Session Management
- Each WhatsApp conversation creates a unique session
- Sessions persist across multiple messages
- Agent remembers context across the entire conversation
- Sessions timeout after 24 hours of inactivity

### Message Types
Your agent can handle:
- ✅ Text messages (primary)
- ✅ Quick reply options (up to 3)
- ✅ List messages (4+ options)
- 🔜 Document attachments (coming soon)
- 🔜 Image handling (coming soon)

## FAQ

**Q: How many messages can I send per day?**
A: This depends on your Meta WhatsApp tier. Free tier typically allows 1000 messages/day. Contact Meta for higher limits.

**Q: Can I change my AI agent's behavior on WhatsApp?**
A: Yes! Your WhatsApp agent uses the same configuration as your dashboard, so any changes to your agent automatically apply to WhatsApp.

**Q: Is my customer data secure?**
A: Yes. All conversations are encrypted in transit and at rest. Your API credentials are AES-256-CBC encrypted in our database.

**Q: How do I debug issues?**
A: Check KYLO-AI dashboard logs, verify webhook configuration in Meta app, and review your Firebase project's activity.

---

**Last Updated**: December 2024  
**Version**: 1.0
