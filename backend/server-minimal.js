#!/usr/bin/env node
// MINIMAL TEST SERVER - ONLY /api/leads
require('dotenv').config();
const express = require('express');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,Accept');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Minimal server running' });
});

// LEADS ENDPOINT - MINIMAL VERSION
app.get('/api/leads/:clientId', (req, res) => {
  res.json({
    success: true,
    message: 'MINIMAL SERVER: /api/leads endpoint works!',
    clientId: req.params.clientId,
    leads: []
  });
});

app.listen(PORT, () => {
  console.log(`\n✓ MINIMAL test server running on port ${PORT}\n`);
});
