/**
 * CRM Routes
 * 
 * Endpoints for CRM integration:
 * - OAuth authorization and callback
 * - Connection management (status, disconnect)
 * - Data fetching (leads, summary)
 * - Lead creation
 * - Manual sync
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');
const crypto = require('crypto');

const CrmFactory = require('../integrations/CrmFactory');
const CrmTokenService = require('../services/crmTokenService');
const { db } = require('../services/firebaseService');

// Public URLs (override via env in other environments)
// BACKEND_URL must exactly match the redirect URI registered in the Zoho
// Developer Console. FRONTEND_URL is where users are sent after OAuth.
const BACKEND_URL = process.env.BACKEND_URL || 'https://kylo-production.up.railway.app';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://kylo-support.web.app';

// In-memory store for OAuth state tokens (consider Redis in production)
const oauthStates = new Map();

// Middleware to extract and validate clientId
router.use((req, res, next) => {
  const clientId = req.body?.clientId || req.query?.clientId;
  
  if (!clientId && req.path !== '/oauth/authorize' && req.path !== '/oauth/callback') {
    return res.status(400).json({ error: 'clientId is required' });
  }
  
  req.clientId = clientId;
  next();
});

/**
 * GET /api/crm/oauth/authorize
 * Redirect user to CRM provider's authorization screen
 */
router.get('/oauth/authorize', async (req, res) => {
  try {
    const { provider = 'zoho', region = '.com', clientId } = req.query;

    if (!provider) {
      return res.status(400).json({ error: 'provider parameter required' });
    }

    if (!clientId) {
      return res.status(400).json({ error: 'clientId parameter required' });
    }

    console.log(`[CRM_ROUTES] OAuth authorize request for ${provider} (region: ${region})`);

    // Generate CSRF state token
    const state = crypto.randomBytes(32).toString('hex');
    oauthStates.set(state, {
      clientId,
      provider,
      region,
      createdAt: Date.now(),
    });

    // Clean up old states (older than 10 minutes)
    for (const [key, value] of oauthStates.entries()) {
      if (Date.now() - value.createdAt > 10 * 60 * 1000) {
        oauthStates.delete(key);
      }
    }

    let authUrl;

    if (provider === 'zoho') {
      // Fail fast with a clear message if the Zoho app credentials are not
      // configured on the server, instead of sending client_id=undefined to
      // Zoho (which produces a confusing "Invalid Client" error).
      if (!process.env.ZOHO_CLIENT_ID || !process.env.ZOHO_CLIENT_SECRET) {
        console.error('[CRM_ROUTES] ZOHO_CLIENT_ID/ZOHO_CLIENT_SECRET not configured');
        return res.redirect(
          `${FRONTEND_URL}/dashboard/settings?tab=integrations&error=${encodeURIComponent(
            'Zoho is not configured on the server yet. Please add ZOHO_CLIENT_ID and ZOHO_CLIENT_SECRET.'
          )}`
        );
      }

      const accountsDomain = `accounts.zoho${region}`;
      const redirectUri = `${BACKEND_URL}/api/crm/oauth/callback`;

      authUrl = `https://${accountsDomain}/oauth/v2/auth?` +
        `client_id=${process.env.ZOHO_CLIENT_ID}&` +
        `response_type=code&` +
        `scope=ZohoCRM.modules.leads.READ,ZohoCRM.modules.leads.CREATE,ZohoCRM.modules.leads.UPDATE,ZohoCRM.modules.accounts.READ&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `state=${state}&` +
        `access_type=offline`;
    } else {
      return res.status(400).json({ error: `Provider ${provider} not supported yet` });
    }

    console.log('[CRM_ROUTES] Redirecting to authorization URL');
    res.redirect(authUrl);
  } catch (error) {
    console.error('[CRM_ROUTES] Authorization failed:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/crm/oauth/callback
 * Handle OAuth provider redirect with authorization code
 */
router.get('/oauth/callback', async (req, res) => {
  try {
    const { code, state, error, error_description } = req.query;

    console.log('[CRM_ROUTES] OAuth callback received');

    // Check for authorization errors
    if (error) {
      console.error('[CRM_ROUTES] Authorization error:', error, error_description);
      return res.redirect(`${FRONTEND_URL}/dashboard/settings?tab=integrations&error=${encodeURIComponent(error_description || error)}`);
    }

    if (!code || !state) {
      return res.redirect(`${FRONTEND_URL}/dashboard/settings?tab=integrations&error=Missing authorization code or state`);
    }

    // Validate state token (CSRF protection)
    const stateData = oauthStates.get(state);
    if (!stateData) {
      console.error('[CRM_ROUTES] Invalid state token');
      return res.redirect(`${FRONTEND_URL}/dashboard/settings?tab=integrations&error=Invalid state token. Please try again.`);
    }

    oauthStates.delete(state); // Consume state token

    const { clientId, provider, region } = stateData;

    console.log(`[CRM_ROUTES] Exchanging code for ${provider} tokens (clientId: ${clientId})`);

    // Exchange authorization code for tokens
    let tokens;

    if (provider === 'zoho') {
      const accountsDomain = `accounts.zoho${region}`;
      const redirectUri = `${BACKEND_URL}/api/crm/oauth/callback`;

      const response = await axios.post(
        `https://${accountsDomain}/oauth/v2/token`,
        null,
        {
          params: {
            grant_type: 'authorization_code',
            code,
            client_id: process.env.ZOHO_CLIENT_ID,
            client_secret: process.env.ZOHO_CLIENT_SECRET,
            redirect_uri: redirectUri,
          },
        }
      );

      tokens = {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in || 3600,
        region,
      };
    } else {
      throw new Error(`Provider ${provider} not supported yet`);
    }

    // Store connection with encrypted refresh token
    await CrmTokenService.storeConnection(clientId, provider, tokens);

    // Fetch and store field schema for dynamic form rendering
    try {
      console.log('[CRM_ROUTES] Fetching field schema...');
      const adapter = CrmFactory.createAdapter(provider, clientId, {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        region: tokens.region,
        tokenExpiresAt: new Date(Date.now() + tokens.expiresIn * 1000),
      });

      const fieldSchema = await adapter.getFieldSchema();
      await CrmTokenService.storeFieldMappings(clientId, fieldSchema);
      console.log('[CRM_ROUTES] Field schema stored');
    } catch (schemaError) {
      console.warn('[CRM_ROUTES] Failed to fetch field schema:', schemaError.message);
      // Don't fail the connection if schema fetch fails
    }

    // Redirect to success page
    console.log('[CRM_ROUTES] OAuth callback completed successfully');
    res.redirect(`${FRONTEND_URL}/dashboard/settings?tab=integrations&status=connected&provider=${provider}`);
  } catch (error) {
    console.error('[CRM_ROUTES] OAuth callback error:', error.message);
    const errorMsg = error.response?.data?.error_description || error.message;
    res.redirect(`${FRONTEND_URL}/dashboard/settings?tab=integrations&error=${encodeURIComponent(errorMsg)}`);
  }
});

/**
 * GET /api/crm/connection
 * Get current CRM connection status
 */
router.get('/connection', async (req, res) => {
  try {
    const clientId = req.clientId;

    console.log(`[CRM_ROUTES] Getting connection status for ${clientId}`);

    const status = await CrmTokenService.getConnectionStatus(clientId);

    res.json(status);
  } catch (error) {
    console.error('[CRM_ROUTES] Failed to get connection status:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/crm/connection
 * Disconnect CRM provider
 */
router.delete('/connection', async (req, res) => {
  try {
    const clientId = req.clientId;

    console.log(`[CRM_ROUTES] Disconnecting CRM for ${clientId}`);

    await CrmTokenService.removeConnection(clientId);

    res.json({ success: true, message: 'CRM disconnected' });
  } catch (error) {
    console.error('[CRM_ROUTES] Failed to disconnect:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/crm/leads
 * Fetch leads from connected CRM
 */
router.post('/leads', async (req, res) => {
  try {
    const clientId = req.clientId;
    const { page = 1, limit = 50 } = req.body;

    console.log(`[CRM_ROUTES] Fetching leads for ${clientId} (page ${page}, limit ${limit})`);

    // Get connection and create adapter
    const connection = await CrmTokenService.loadConnection(clientId);
    if (!connection) {
      return res.status(400).json({ error: 'No CRM connection found' });
    }

    if (connection.status !== 'connected') {
      return res.status(400).json({ error: 'CRM connection is not active' });
    }

    // Get valid access token (refreshes if needed)
    const accessToken = await CrmTokenService.getValidAccessToken(clientId);

    // Create adapter
    const adapter = CrmFactory.createAdapter(connection.provider, clientId, {
      accessToken,
      refreshToken: connection.refreshToken,
      region: connection.region,
      tokenExpiresAt: connection.tokenExpiresAt,
    });

    // Fetch leads
    const leads = await adapter.getLeads(page, limit);

    res.json({
      success: true,
      leads,
      provider: connection.provider,
      total: leads.length,
    });
  } catch (error) {
    console.error('[CRM_ROUTES] Failed to fetch leads:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/crm/leads/create
 * Create a new lead in the connected CRM
 */
router.post('/leads/create', async (req, res) => {
  try {
    const clientId = req.clientId;
    const { lead } = req.body;

    if (!lead) {
      return res.status(400).json({ error: 'Lead data is required' });
    }

    console.log(`[CRM_ROUTES] Creating new lead for ${clientId}`);

    // Get connection
    const connection = await CrmTokenService.loadConnection(clientId);
    if (!connection) {
      return res.status(400).json({ error: 'No CRM connection found' });
    }

    if (connection.status !== 'connected') {
      return res.status(400).json({ error: 'CRM connection is not active' });
    }

    // Get valid access token
    const accessToken = await CrmTokenService.getValidAccessToken(clientId);

    // Create adapter
    const adapter = CrmFactory.createAdapter(connection.provider, clientId, {
      accessToken,
      refreshToken: connection.refreshToken,
      region: connection.region,
      tokenExpiresAt: connection.tokenExpiresAt,
    });

    // Create lead
    const result = await adapter.createLead(lead);

    // Also save to internal Firestore leads collection for consistency
    try {
      const leadDoc = {
        ...lead,
        external_id: result.external_id,
        source: 'crm',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.collection('leads').doc(clientId).collection('items').doc(result.id).set(leadDoc);
    } catch (dbError) {
      console.warn('[CRM_ROUTES] Failed to save lead to internal DB:', dbError.message);
      // Don't fail the response if internal DB save fails
    }

    res.json({
      success: true,
      id: result.id,
      external_id: result.external_id,
    });
  } catch (error) {
    console.error('[CRM_ROUTES] Failed to create lead:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/crm/sync
 * Manually trigger a sync of leads from CRM
 */
router.post('/sync', async (req, res) => {
  try {
    const clientId = req.clientId;

    console.log(`[CRM_ROUTES] Manual sync requested for ${clientId}`);

    // Get connection
    const connection = await CrmTokenService.loadConnection(clientId);
    if (!connection) {
      return res.status(400).json({ error: 'No CRM connection found' });
    }

    if (connection.status !== 'connected') {
      return res.status(400).json({ error: 'CRM connection is not active' });
    }

    // Get valid access token
    const accessToken = await CrmTokenService.getValidAccessToken(clientId);

    // Create adapter
    const adapter = CrmFactory.createAdapter(connection.provider, clientId, {
      accessToken,
      refreshToken: connection.refreshToken,
      region: connection.region,
      tokenExpiresAt: connection.tokenExpiresAt,
    });

    // Fetch all leads
    let allLeads = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const pageLeads = await adapter.getLeads(page, 50);
      allLeads = allLeads.concat(pageLeads);
      hasMore = pageLeads.length === 50;
      page++;
    }

    // Save to internal Firestore
    const batch = db.batch();
    const leadsRef = db.collection('leads').doc(clientId).collection('items');

    for (const lead of allLeads) {
      const docRef = leadsRef.doc(lead.id);
      batch.set(docRef, {
        ...lead,
        source: 'crm',
        updatedAt: new Date(),
      });
    }

    await batch.commit();

    // Update last sync time
    await CrmTokenService.updateConnectionStatus(clientId, 'connected');
    await db.collection('connections').doc(clientId).update({
      lastSync: new Date(),
    });

    console.log(`[CRM_ROUTES] Sync completed, ${allLeads.length} leads synced`);

    res.json({
      success: true,
      synced: allLeads.length,
      provider: connection.provider,
    });
  } catch (error) {
    console.error('[CRM_ROUTES] Sync failed:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/crm/fields
 * Get field schema for form rendering
 */
router.get('/fields', async (req, res) => {
  try {
    const clientId = req.clientId;

    console.log(`[CRM_ROUTES] Fetching field schema for ${clientId}`);

    const connection = await CrmTokenService.loadConnection(clientId);
    if (!connection) {
      return res.status(400).json({ error: 'No CRM connection found' });
    }

    if (!connection.fieldMappings) {
      return res.status(400).json({ error: 'Field mappings not available. Try reconnecting.' });
    }

    res.json({
      success: true,
      fields: connection.fieldMappings,
      provider: connection.provider,
    });
  } catch (error) {
    console.error('[CRM_ROUTES] Failed to get field schema:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
