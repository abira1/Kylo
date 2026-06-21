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
      model: 'claude-3-haiku-20240307',
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
 * Get conversation history
 */
app.get('/api/conversations/:clientId/:conversationId', async (req, res) => {
  try {
    const { clientId, conversationId } = req.params;

    await validateClientAccess(clientId);
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
