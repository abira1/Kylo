const functions = require('firebase-functions');

// Backend URL from Railway
const BACKEND_URL = 'https://kylo-production.up.railway.app';

/**
 * CORS Proxy Function - proxies requests from frontend to Railway backend
 * This bypasses CORS issues because:
 * - Frontend calls THIS function (same domain as Firebase = no CORS)
 * - This function calls Railway backend (server-to-server = no CORS needed)
 */
exports.apiProxy = functions.https.onRequest(async (req, res) => {
  // Enable CORS for Firebase domain
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).send('');
    return;
  }

  try {
    const path = req.query.path || req.body.path || '/api/chat';
    const backendUrl = `${BACKEND_URL}${path}`;

    console.log(`Proxying ${req.method} request to: ${backendUrl}`);

    // Forward the request to Railway backend
    const backendResponse = await fetch(backendUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        ...req.headers,
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
    });

    const responseData = await backendResponse.text();
    
    // Try to parse as JSON, otherwise return as-is
    let parsedData;
    try {
      parsedData = JSON.parse(responseData);
    } catch {
      parsedData = responseData;
    }

    res.status(backendResponse.status).send(parsedData);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({
      error: 'Failed to proxy request to backend',
      message: error.message,
    });
  }
});

/**
 * Direct Chat Proxy - specific endpoint for /api/chat
 */
exports.chat = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).send('');
    return;
  }

  try {
    const backendUrl = `${BACKEND_URL}/api/chat`;

    console.log(`Chat proxy: forwarding request to ${backendUrl}`);

    const backendResponse = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    const responseData = await backendResponse.json();

    res.status(backendResponse.status).json(responseData);
  } catch (error) {
    console.error('Chat proxy error:', error);
    res.status(500).json({
      error: 'Failed to call chat endpoint',
      message: error.message,
    });
  }
});

/**
 * Health Check Proxy
 */
exports.health = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  
  try {
    const backendUrl = `${BACKEND_URL}/api/health`;
    const backendResponse = await fetch(backendUrl);
    const responseData = await backendResponse.json();

    res.status(backendResponse.status).json(responseData);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      error: 'Failed to check backend health',
      message: error.message,
    });
  }
});
