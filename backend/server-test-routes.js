#!/usr/bin/env node
// Minimal server to test if routes are registered

const express = require('express');
const app = express();
const PORT = process.env.PORT || 5003;

app.use(express.json());

// Test routes
console.log('[TEST] Registering /api/leads route...');
app.get('/api/leads/:clientId', async (req, res) => {
  res.json({ message: 'SUCCESS: /api/leads endpoint works' });
});

console.log('[TEST] Registering /api/upload route...');
app.post('/api/upload', async (req, res) => {
  res.json({ message: 'SUCCESS: /api/upload endpoint works' });
});

console.log('[TEST] Registering /api/conversations route...');
app.get('/api/conversations/:clientId', async (req, res) => {
  res.json({ message: 'SUCCESS: /api/conversations endpoint works' });
});

app.listen(PORT, () => {
  console.log(`✓ Test server running on port ${PORT}`);
  console.log('Test: curl http://localhost:5002/api/leads/testclient');
  console.log('Test: curl http://localhost:5002/api/conversations/testclient');
});
