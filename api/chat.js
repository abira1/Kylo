const RAILWAY_BACKEND = 'https://kylo-production.up.railway.app';

export default async function handler(req, res) {
  // Enable CORS for all origins
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Type');

  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const backendUrl = `${RAILWAY_BACKEND}/api/chat`;

    // Prepare request body for forwarding
    let requestBody = undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      // Handle different body types
      if (req.body) {
        if (typeof req.body === 'string') {
          requestBody = req.body;
        } else if (Buffer.isBuffer(req.body)) {
          requestBody = req.body.toString();
        } else {
          // Already parsed object
          requestBody = JSON.stringify(req.body);
        }
      }
    }

    // Forward request to backend
    const response = await fetch(backendUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: requestBody,
    });

    // Parse response
    const responseText = await response.text();
    
    // Try to parse as JSON, fall back to text
    let responseData = responseText;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      // Keep as text if not valid JSON
    }

    // Return response with proper headers
    res.status(response.status);
    res.setHeader('Content-Type', 'application/json');
    return res.send(responseData);
  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ 
      error: error.message,
      message: 'Failed to proxy request to backend'
    });
  }
}
