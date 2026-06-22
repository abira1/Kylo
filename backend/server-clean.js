#!/usr/bin/env node
require('dotenv').config();
const express = require('express');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');

console.log('\n' + '='.repeat(70));
console.log('🚀 DIAGNOSTIC: server-clean.js loaded at', new Date().toISOString());
console.log('='.repeat(70) + '\n');

// Import services and routes
const { buildSystemPrompt, validateClientAccess } = require('./services/multiTenantService');
const { db: firestore, saveConversation, getConversation, getLeads, saveLead, updateLead, getConversations, saveFileMetadata, cleanupInvalidLeads } = require('./services/firebaseService');
const kbRoutes = require('./routes/knowledgeBase');
const adminKbRoutes = require('./routes/admin-kb-upload');
const kyloAIRoutes = require('./routes/kylo-ai-sessions');
const adminRoutes = require('./routes/admin');

console.log('[STARTUP] Anthropic imported');
console.log('[STARTUP] Creating client...');

const anthropicClient = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

console.log('[STARTUP] Client created successfully');

const app = express();
const PORT = process.env.PORT || 5000;

// Request logger middleware - log EVERY request
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Allowed origins for CORS
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:3000',
  'https://kylo-support.web.app'
];



// CORS middleware - try using res.header() method  
app.use((req, res, next) => {
  const origin = req.get('origin') || '*';
  
  // Try res.header() method instead of res.setHeader()
  res.header('Access-Control-Allow-Origin', origin);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,Accept');
  res.header('Access-Control-Expose-Headers', 'Content-Type');
  
  // Handle OPTIONS requests
  if (req.method === 'OPTIONS') {
    return res.status(200).json({ok: true});
  }
  
  next();
});

app.use(express.json({ limit: '10mb' }));

// Serve static files (widget.js, etc.)
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, filePath) => {
    // Cache widget.js for 1 hour
    if (filePath.endsWith('.js')) {
      res.set('Cache-Control', 'public, max-age=3600');
    }
    // Never cache HTML files (embed.html) - always revalidate
    if (filePath.endsWith('.html')) {
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
    }
    // Allow CORS for widget.js
    res.set('Access-Control-Allow-Origin', '*');
  }
}));

console.log('[STARTUP] Static file serving enabled from /public');

/**
 * UTILITY: Generate a public widget key
 * Format: pk_live_[random alphanumeric]
 */
const generatePublicKey = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = '';
  for (let i = 0; i < 20; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `pk_live_${key}`;
};

/**
 * BRANDING ENDPOINT
 * Resolves public key to client record and returns branding data
 */
app.get('/api/branding/:publicKey', async (req, res) => {
  try {
    const { publicKey } = req.params;
    
    console.log(`[BRANDING] Lookup request for publicKey: ${publicKey}`);
    
    if (!publicKey || !publicKey.startsWith('pk_live_')) {
      return res.status(400).json({ error: 'Invalid public key format' });
    }
    
    // Server-side lookup: find client by publicWidgetKey
    const clientsSnapshot = await firestore.collection('clients')
      .where('publicWidgetKey', '==', publicKey)
      .limit(1)
      .get();
    
    let branding;
    
    if (clientsSnapshot.empty) {
      // For demo keys, return demo branding
      if (publicKey === 'pk_live_demo_d4f2k9xq1m4r7') {
        console.log(`[BRANDING] Using demo branding for demo key`);
        branding = {
          agentName: 'KYLO Assistant',
          primaryColor: '#06b6d4',
          logoURL: null,
          position: 'bottom-right',
          cachedUntil: new Date(Date.now() + 5 * 60 * 1000).toISOString()
        };
      } else {
        console.warn(`[BRANDING] Public key not found: ${publicKey}`);
        return res.status(404).json({ error: 'Widget key not found' });
      }
    } else {
      const clientDoc = clientsSnapshot.docs[0];
      const clientData = clientDoc.data();
      const clientId = clientDoc.id;
      
      console.log(`[BRANDING] Resolved publicKey ${publicKey} to clientId ${clientId}`);
      
      branding = {
        agentName: clientData.agentName || 'Support Assistant',
        primaryColor: clientData.primaryColor || '#06b6d4',
        logoURL: clientData.logoURL || null,
        position: clientData.position || 'bottom-right',
        cachedUntil: new Date(Date.now() + 5 * 60 * 1000).toISOString() // Cache for 5 minutes
      };
    }
    
    // Return branding (for both demo and real clients)
    res.json(branding);
  } catch (error) {
    console.error('[BRANDING] Error:', error);
    res.status(500).json({ error: 'Failed to fetch branding' });
  }
});

/**
 * HEALTH CHECK ENDPOINT
 * Simple health check to verify server is running
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '2.0-with-lead-persistence',
    diagnostic: 'THIS_IS_SERVER_CLEAN_JS_LATEST'
  });
});

/**
 * EMBED PAGE ENDPOINT
 * Serves the iframe page for the chat widget
 * URL: /embed?publicKey=pk_live_...&agent=AgentName
 */
app.get('/embed', (req, res) => {
  res.set('Content-Type', 'text/html; charset=utf-8');
  res.set('X-Frame-Options', 'ALLOWALL');
  res.set('Access-Control-Allow-Origin', '*');
  
  const embedPath = path.join(__dirname, 'public', 'embed.html');
  res.sendFile(embedPath);
});

/**
 * CLIENT PROFILE ENDPOINT
 * Returns user's client profile including publicWidgetKey
 * Requires: Authorization header with user ID (or Bearer token)
 */
app.get('/api/client-profile', async (req, res) => {
  try {
    // Get clientId from Authorization header or Bearer token
    const authHeader = req.headers.authorization || '';
    const clientId = authHeader.replace('Bearer ', '').trim();
    
    if (!clientId) {
      return res.status(401).json({ error: 'Unauthorized: clientId required' });
    }
    
    console.log(`[CLIENT-PROFILE] Fetching profile for clientId: ${clientId}`);
    
    const clientDoc = await firestore.collection('clients').doc(clientId).get();
    
    if (!clientDoc.exists) {
      console.warn(`[CLIENT-PROFILE] Client not found: ${clientId}`);
      return res.status(404).json({ error: 'Client not found' });
    }
    
    const clientData = clientDoc.data();
    
    // Return only safe client data (never internal IDs, only public keys)
    res.json({
      id: clientId,
      agentName: clientData.agentName || 'Support Assistant',
      primaryColor: clientData.primaryColor || '#06b6d4',
      logoURL: clientData.logoURL || null,
      position: clientData.position || 'bottom-right',
      publicWidgetKey: clientData.publicWidgetKey || null,
    });
    
  } catch (error) {
    console.error('[CLIENT-PROFILE] Error:', error);
    res.status(500).json({ error: 'Failed to fetch client profile' });
  }
});

/**
 * SIMPLE TEST ENDPOINT - moved before /api/chat
 */
app.post('/api/test-endpoint', async (req, res) => {
  res.json({ message: 'This endpoint is before /api/chat' });
});

/**
 * MULTI-TENANT CHAT ENDPOINT
 * Accepts: clientId, conversationId, messages
 */
app.post('/api/chat', async (req, res) => {
  try {
    // Log ALL incoming requests with full details
    console.log('');
    console.log('========== /API/CHAT REQUEST ==========');
    console.log('Time:', new Date().toISOString());
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    
    // Log body size and message count
    const bodyStr = JSON.stringify(req.body);
    console.log('Body size:', bodyStr.length, 'bytes');
    console.log('Messages count:', req.body.messages?.length || 0);
    console.log('First message:', JSON.stringify(req.body.messages?.[0]).substring(0, 100));
    if (req.body.messages?.length > 1) {
      console.log('Last message:', JSON.stringify(req.body.messages?.[req.body.messages.length - 1]).substring(0, 150));
    }
    
    console.log('Full body:', JSON.stringify(req.body, null, 2));
    console.log('Method:', req.method);
    console.log('Path:', req.path);
    console.log('URL:', req.originalUrl);
    console.log('========================================');
    console.log('');
    
    let { clientId, conversationId, messages, qaContext, publicKey } = req.body;

    // If publicKey is provided (from widget embed), resolve it to clientId
    if (publicKey && !clientId) {
      console.log(`[CHAT] Resolving publicKey: ${publicKey}`);
      
      if (!publicKey.startsWith('pk_live_')) {
        return res.status(400).json({ error: 'Invalid public key format' });
      }
      
      // Server-side lookup: find client by publicWidgetKey
      const clientsSnapshot = await firestore.collection('clients')
        .where('publicWidgetKey', '==', publicKey)
        .limit(1)
        .get();
      
      if (clientsSnapshot.empty) {
        // For demo keys, use a demo client ID
        if (publicKey === 'pk_live_demo_d4f2k9xq1m4r7') {
          console.log(`[CHAT] Using demo client for demo key`);
          clientId = 'demo_client_test';
        } else {
          console.warn(`[CHAT] Public key not found: ${publicKey}`);
          return res.status(404).json({ error: 'Widget key not found' });
        }
      } else {
        const clientDoc = clientsSnapshot.docs[0];
        clientId = clientDoc.id;
        console.log(`[CHAT] Resolved publicKey ${publicKey} to clientId ${clientId}`);
      }
    }

    // Validate required fields
    if (!clientId) {
      return res.status(400).json({ error: 'clientId or publicKey is required' });
    }
    if (!conversationId) {
      return res.status(400).json({ error: 'conversationId is required' });
    }
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    console.log(`[CHAT] clientId: ${clientId}, conversationId: ${conversationId}`);

    // Validate client access (skip for demo clients)
    let client = null;
    if (clientId !== 'demo_client_test') {
      client = await validateClientAccess(clientId);
      console.log(`[CHAT] Client validated: ${client.name}`);
    } else {
      console.log(`[CHAT] Using demo client (no validation needed)`);
      client = { name: 'Demo Client', id: 'demo_client_test' };
    }

    // Build system prompt WITH client-specific context
    // Pass message count to determine which prompt to use
    const systemPrompt = await buildSystemPrompt(clientId, qaContext, messages.length);
    console.log('[CHAT] System prompt built (message count:', messages.length, ')');

    // Prepare messages
    const claudeMessages = messages.map(m => ({
      role: m.role,
      content: m.content
    }));

    console.log('[CHAT] Calling Claude with', claudeMessages.length, 'messages...');

    // Call Claude
    const response = await anthropicClient.messages.create({
      model: 'claude-opus-4-5-20251101',
      max_tokens: 1024,
      system: systemPrompt,
      messages: claudeMessages,
    });

    const assistantMessage = response.content[0].text;
    console.log('[CHAT] Claude responded');

    // Save conversation to Firestore (async - don't wait)
    const updatedMessages = [...messages, {
      role: 'assistant',
      content: assistantMessage
    }];
    
    if (clientId !== 'demo_client_test') {
      saveConversation(clientId, conversationId, updatedMessages).catch(err => {
        console.error('[CHAT] Failed to save conversation:', err.message);
      });
    }

    // Return response with both 'message' and 'reply' for compatibility
    res.json({
      message: assistantMessage,
      reply: assistantMessage, // For embed.html compatibility
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
      clientId,
      conversationId
    });

  } catch (error) {
    console.error('[ERROR] Chat endpoint error:');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    console.error('Status:', error.status);
    console.error('Type:', error.type);
    console.error('Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    
    res.status(500).json({
      error: 'Failed to process chat message',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * SIMPLE TEST ENDPOINT
 * Test if Express can register this route
 */
app.post('/api/test-upload', async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'TEST ENDPOINT WORKS'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * FILE UPLOAD ENDPOINT
 * Handles document uploads with OCR simulation
 */
app.post('/api/upload', async (req, res) => {
  try {
    const { clientId, conversationId, fileData, fileName, fileType, documentType } = req.body;

    // Validate
    if (!clientId || !fileName || !fileData) {
      return res.status(400).json({ error: 'clientId, fileName, and fileData required' });
    }

    await validateClientAccess(clientId);
    console.log(`[UPLOAD] File: ${fileName} for client ${clientId}, type: ${documentType || fileType}`);

    // Extract data using Claude's vision capabilities for images
    let extractedData = {};

    // Use Claude vision for ANY image file - let Claude intelligently extract whatever data is present
    if (fileType.includes('image')) {
      try {
        console.log('[UPLOAD] Using Claude vision to extract data from image...');
        
        // Determine the prompt based on document type if provided
        let extractionPrompt = `Please analyze this image and extract any personal or document information you can clearly see. 
Return ONLY a valid JSON object with ALL fields you can extract. Use these field names if applicable:
- fullName, firstName, lastName, passportNumber, dateOfBirth, nationality, gender
- expiryDate, issueDate, placeOfBirth, documentType, documentNumber
- confidence (0.0 to 1.0 indicating extraction confidence)

For any field present in the image, include it. For fields not visible, omit them or set to null.
Return ONLY valid JSON, no other text.`;

        if (documentType === 'passport') {
          extractionPrompt = `Please extract passport information from this image. Extract ONLY the fields that are clearly visible and readable.
Return ONLY a valid JSON object with these fields (omit fields you cannot clearly see):
{
  "fullName": null,
  "passportNumber": null,
  "dateOfBirth": null,
  "nationality": null,
  "gender": null,
  "expiryDate": null,
  "issueDate": null,
  "placeOfBirth": null,
  "confidence": 0.5
}
Return ONLY valid JSON, no other text. Empty fields should be null, not "unknown" or "N/A".`;
        }
        
        const response = await anthropicClient.messages.create({
          model: 'claude-opus-4-5-20251101',
          max_tokens: 800,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: fileType || 'image/jpeg',
                    data: fileData
                  }
                },
                {
                  type: 'text',
                  text: extractionPrompt
                }
              ]
            }
          ]
        });

        try {
          let extractedText = response.content[0].type === 'text' ? response.content[0].text : '{}';
          
          // Clean up the response - remove markdown code blocks if present
          extractedText = extractedText
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();
          
          extractedData = JSON.parse(extractedText);
          
          // Filter out null values and empty strings for cleaner display
          Object.keys(extractedData).forEach(key => {
            if (extractedData[key] === null || extractedData[key] === '' || extractedData[key] === undefined) {
              delete extractedData[key];
            }
          });
          
          console.log('[UPLOAD] Claude extracted data:', Object.keys(extractedData).join(', '));
        } catch (parseError) {
          console.log('[UPLOAD] Could not parse Claude response:', parseError.message);
          // Return empty data instead of fallback - let frontend ask user for manual entry
          extractedData = {};
        }
      } catch (visionError) {
        console.error('[UPLOAD] Vision extraction failed:', visionError.message);
        // Return empty data - frontend will show fallback message
        extractedData = {};
      }
    } else if (fileName.endsWith('.pdf')) {
      // PDF extraction - for now just acknowledge receipt
      extractedData = {};
      console.log('[UPLOAD] PDF received, manual entry may be needed');
    } else if (fileType.includes('word') || fileType.includes('document')) {
      extractedData = {};
    }

    // Save file metadata to Firestore
    const { saveFileMetadata } = require('./services/firebaseService');
    const fileMetadata = await saveFileMetadata(clientId, conversationId, {
      name: fileName,
      type: fileType,
      size: fileData.length,
      extractedData,
      uploadUrl: `https://storage.googleapis.com/kylo-ai-files/${clientId}/${conversationId}/${fileName}`
    });

    res.json({
      success: true,
      fileId: fileMetadata.id,
      fileName,
      extractedData,
      message: 'File uploaded and processed successfully'
    });

  } catch (error) {
    console.error('[UPLOAD ERROR]', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET LEADS ENDPOINT
 * Fetch all leads for a client
 */
app.get('/api/leads/:clientId', async (req, res) => {
  console.log('[DIAGNOSTIC] /api/leads route handler called');
  try {
    const { clientId } = req.params;
    const { limit = 50 } = req.query;

    console.log('[DIAGNOSTIC] clientId:', clientId);

    // Use firebaseService to fetch actual leads
    const leads = await getLeads(clientId, parseInt(limit));

    res.json({
      success: true,
      clientId,
      count: leads.length,
      leads
    });

  } catch (error) {
    console.error('[LEADS ERROR]', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * SAVE LEAD ENDPOINT
 * Save a lead from chat completion
 */
app.post('/api/leads', async (req, res) => {
  try {
    console.log('[LEADS POST] Received request body:', JSON.stringify(req.body).substring(0, 200) + '...');
    
    const { clientId, leadData } = req.body;

    if (!clientId) {
      console.error('[LEADS POST] Missing clientId');
      return res.status(400).json({ error: 'clientId is required' });
    }

    console.log(`[LEADS POST] Validating client access for: ${clientId}`);
    await validateClientAccess(clientId);
    console.log(`[LEADS POST] Client validation passed`);
    
    console.log('[LEADS POST] Calling saveLead function...');
    const { saveLead } = require('./services/firebaseService');
    const lead = await saveLead(clientId, leadData);
    console.log('[LEADS POST] Lead saved successfully:', lead.id);

    res.json({
      success: true,
      leadId: lead.id,
      message: 'Lead saved successfully'
    });

  } catch (error) {
    console.error('[LEADS POST ERROR]', error.message, error.stack);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

/**
 * UPDATE LEAD ENDPOINT
 * Update a lead status or details
 */
app.put('/api/leads/:clientId/:leadId', async (req, res) => {
  try {
    const { clientId, leadId } = req.params;
    const { updates } = req.body;

    await validateClientAccess(clientId);
    
    const { updateLead } = require('./services/firebaseService');
    await updateLead(clientId, leadId, updates);

    res.json({
      success: true,
      message: 'Lead updated successfully'
    });

  } catch (error) {
    console.error('[UPDATE LEAD ERROR]', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE LEAD ENDPOINT
 * Delete a specific lead
 */
app.delete('/api/leads/:clientId/:leadId', async (req, res) => {
  try {
    const { clientId, leadId } = req.params;

    await validateClientAccess(clientId);
    
    const { deleteLead } = require('./services/firebaseService');
    await deleteLead(clientId, leadId);

    res.json({
      success: true,
      message: 'Lead deleted successfully'
    });

  } catch (error) {
    console.error('[DELETE LEAD ERROR]', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * CLEANUP ENDPOINT - REMOVE INVALID LEADS
 * DELETE /api/cleanup/invalid-leads/:clientId
 */
app.delete('/api/cleanup/invalid-leads/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    
    // Require admin auth token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log(`[API CLEANUP] Processing cleanup request for: ${clientId}`);
    
    const result = await cleanupInvalidLeads(clientId);
    
    res.json({
      success: true,
      deletedCount: result.deleted,
      totalLeads: result.total,
      message: `Removed ${result.deleted} invalid leads from ${result.total} total`
    });
    
  } catch (error) {
    console.error('[API CLEANUP ERROR]', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET CONVERSATIONS ENDPOINT
 * Fetch all conversations for a client
 */
app.get('/api/conversations/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    const { limit = 50 } = req.query;

    await validateClientAccess(clientId);
    
    const { getConversations } = require('./services/firebaseService');
    const conversations = await getConversations(clientId, parseInt(limit));

    res.json({
      success: true,
      clientId,
      count: conversations.length,
      conversations
    });

  } catch (error) {
    console.error('[CONVERSATIONS ERROR]', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET CONVERSATION DETAIL ENDPOINT
 * Fetch a specific conversation's messages
 */
app.get('/api/conversation/:clientId/:conversationId', async (req, res) => {
  try {
    const { clientId, conversationId } = req.params;

    await validateClientAccess(clientId);
    const { getConversation } = require('./services/firebaseService');
    const messages = await getConversation(clientId, conversationId);

    res.json({ messages, clientId, conversationId });
  } catch (error) {
    console.error('[ERROR]', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Knowledge Base routes
app.use('/api/clients', kbRoutes);

// Admin Knowledge Base upload routes
app.use('/api/admin/kb', adminKbRoutes);

// KYLO-AI AS Agent routes (NEW)
app.use('/api/kylo', kyloAIRoutes);

// Admin Dashboard routes (WEEK 6)
app.use('/api/kylo/admin', adminRoutes);

app.listen(PORT, () => {
  console.log(`\n🚀 Multi-tenant server running on port ${PORT}\n`);
});
