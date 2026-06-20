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

    // Prepare request body - handle both parsed objects and raw bodies
    let requestBody = undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      if (typeof req.body === 'string') {
        requestBody = req.body;
      } else if (req.body) {
        requestBody = JSON.stringify(req.body);
      }
    }

    const response = await fetch(backendUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: requestBody,
    });

    const data = await response.text();
    let parsedData = data;
    
    try {
      parsedData = JSON.parse(data);
    } catch (e) {
      // Keep as text if not JSON
    }

    // Forward response status and data
    res.status(response.status);
    
    // Forward content type if available
    if (response.headers.get('content-type')) {
      res.setHeader('Content-Type', response.headers.get('content-type'));
    }
    
    return res.send(parsedData);
  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ error: error.message, message: 'Failed to proxy request to backend' });
  }
}
