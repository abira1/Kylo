#!/usr/bin/env node
require('dotenv').config();
const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');

// Import services and routes
const { buildSystemPrompt, validateClientAccess } = require('./services/multiTenantService');
const { saveConversation, getConversation } = require('./services/firebaseService');
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

/**
 * HEALTH CHECK ENDPOINT
 * Simple health check to verify server is running
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '2.0-with-lead-persistence'
  });
});

/**
 * MULTI-TENANT CHAT ENDPOINT
 * Accepts: clientId, conversationId, messages
 */
app.post('/api/chat', async (req, res) => {
  try {
    const { clientId, conversationId, messages, qaContext } = req.body;

    // Validate required fields
    if (!clientId) {
      return res.status(400).json({ error: 'clientId is required' });
    }
    if (!conversationId) {
      return res.status(400).json({ error: 'conversationId is required' });
    }
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    console.log(`[CHAT] clientId: ${clientId}, conversationId: ${conversationId}`);

    // Validate client access
    const client = await validateClientAccess(clientId);
    console.log(`[CHAT] Client validated: ${client.name}`);

    // Build system prompt WITH client-specific context
    const systemPrompt = await buildSystemPrompt(clientId, qaContext);
    console.log('[CHAT] System prompt built');

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
    
    saveConversation(clientId, conversationId, updatedMessages).catch(err => {
      console.error('[CHAT] Failed to save conversation:', err.message);
    });

    // Return response
    res.json({
      message: assistantMessage,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
      clientId,
      conversationId
    });

  } catch (error) {
    console.error('[ERROR] Chat endpoint error:', {
      message: error.message,
      status: error.status,
      type: error.type,
      fullError: JSON.stringify(error, null, 2)
    });
    res.status(500).json({
      error: 'Failed to process chat message',
      details: {
        message: error.message,
        status: error.status,
        type: error.type
      }
    });
  }
});

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    claudeApiConfigured: !!process.env.CLAUDE_API_KEY,
  });
});

/**
 * FILE UPLOAD ENDPOINT
 * Handles document uploads with OCR simulation
 */
app.post('/api/upload', async (req, res) => {
  try {
    const { clientId, conversationId, fileData, fileName, fileType } = req.body;

    // Validate
    if (!clientId || !fileName || !fileData) {
      return res.status(400).json({ error: 'clientId, fileName, and fileData required' });
    }

    await validateClientAccess(clientId);
    console.log(`[UPLOAD] File: ${fileName} for client ${clientId}`);

    // Simulate OCR extraction based on file type
    let extractedData = {};

    if (fileType.includes('image') || fileName.endsWith('.pdf')) {
      // Simulate passport/document extraction
      extractedData = {
        documentType: 'passport', // Would be detected from actual OCR
        name: 'Ahmed Al Mansouri', // Would be extracted from actual OCR
        passportNumber: 'UAE12345678',
        dateOfBirth: '1990-05-15',
        nationality: 'UAE',
        gender: 'M',
        expiryDate: '2030-05-15',
        issueDate: '2020-05-15',
        confidence: 0.92 // OCR confidence score
      };
      
      console.log('[UPLOAD] Simulated OCR extraction for passport');
    } else if (fileType.includes('word') || fileType.includes('document')) {
      extractedData = {
        documentType: 'document',
        text: 'Document content extracted via OCR',
        pages: 1,
        language: 'en'
      };
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
  try {
    const { clientId } = req.params;
    const { limit = 50 } = req.query;

    await validateClientAccess(clientId);
    
    const { getLeads } = require('./services/firebaseService');
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
    const { clientId, leadData } = req.body;

    if (!clientId) {
      return res.status(400).json({ error: 'clientId is required' });
    }

    await validateClientAccess(clientId);
    
    const { saveLead } = require('./services/firebaseService');
    const lead = await saveLead(clientId, leadData);

    res.json({
      success: true,
      leadId: lead.id,
      message: 'Lead saved successfully'
    });

  } catch (error) {
    console.error('[SAVE LEAD ERROR]', error.message);
    res.status(500).json({ error: error.message });
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
