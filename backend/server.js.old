#!/usr/bin/env node
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// ============================================================
// INITIALIZE FIREBASE ADMIN SDK FIRST (before any services!)
// ============================================================
const admin = require('firebase-admin');

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './kylo-firebase-key.json';
const serviceAccount = require(path.resolve(serviceAccountPath));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});

console.log('[STARTUP] Firebase Admin SDK initialized');

// Import Anthropic SDK - use default export directly
const Anthropic = require('@anthropic-ai/sdk');

// Import WhatsApp routes (NOW safe to import after Firebase init)
const whatsappRoutes = require('./routes/whatsappRoutes');

console.log('[STARTUP] Anthropic imported');
console.log('[STARTUP] Creating client...');

const client = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

console.log('[STARTUP] Client created successfully');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

function buildSystemPrompt(qaContext = []) {
  let prompt = 'You are a helpful AI support assistant for KYLO AI.';
  if (qaContext && qaContext.length > 0) {
    prompt += '\n\nKNOWLEDGE BASE:\n';
    qaContext.forEach((item, i) => {
      prompt += `${i + 1}. Q: ${item.question}\nA: ${item.answer}\n\n`;
    });
  }
  return prompt;
}

app.post('/api/chat', async (req, res) => {
  try {
    console.log('[HANDLER] POST /api/chat received');
    console.log('[HANDLER] client type:', typeof client);
    console.log('[HANDLER] client.messages type:', typeof client.messages);
    console.log('[HANDLER] client.messages.create type:', typeof client.messages?.create);
    
    const { messages, qaContext } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'No messages' });
    }

    const systemPrompt = buildSystemPrompt(qaContext);
    const claudeMessages = messages.map(m => ({
      role: m.role,
      content: m.content
    }));

    console.log('[REQUEST] Calling Claude with', claudeMessages.length, 'messages...');
    
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      messages: claudeMessages,
    });

    console.log('[SUCCESS] Claude responded');
    res.json({
      message: response.content[0].text,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    });
  } catch (error) {
    console.error('[ERROR]', error.message);
    res.status(500).json({
      error: 'Failed to process chat message',
      details: error.message,
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    claudeApiConfigured: !!process.env.CLAUDE_API_KEY,
  });
});

// Register WhatsApp routes
app.use('/api/whatsapp', whatsappRoutes);

app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}\n`);
});
