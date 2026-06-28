/**
 * Zoho CRM Adapter
 * 
 * Implements the CrmAdapter interface for Zoho CRM.
 * Handles OAuth token management, lead CRUD operations, and data normalization.
 * 
 * Supports all Zoho regions: .com, .eu, .in, .com.au, .jp, .ca, .de, .fr, .uk
 * 
 * Usage:
 *   const adapter = new ZohoCrmAdapter(clientId, {
 *     accessToken: '...',
 *     refreshToken: '...',
 *     region: '.com',
 *     expiresAt: Date
 *   });
 *   const leads = await adapter.getLeads();
 */

const CrmAdapter = require('./CrmAdapter');
const axios = require('axios');

class ZohoCrmAdapter extends CrmAdapter {
  constructor(clientId, config = {}) {
    super(clientId, config);
    this.provider = 'zoho';
    
    const { accessToken, refreshToken, region = '.com' } = config;
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.region = region;
    
    // Map region to Zoho domain
    // NOTE: the CRM API is served from zohoapis.<region> (e.g. www.zohoapis.com),
    // NOT www.zoho.<region> (the marketing site, which returns 404).
    this.accountsDomain = `accounts.zoho${region}`;
    this.apiDomain = `www.zohoapis${region}`;
    
    // Zoho API endpoints
    this.authUrl = `https://${this.accountsDomain}/oauth/v2/token`;
    this.apiBaseUrl = `https://${this.apiDomain}/crm/v2`;
    
    // Ensure env vars are set
    if (!process.env.ZOHO_CLIENT_ID || !process.env.ZOHO_CLIENT_SECRET) {
      throw new Error('ZOHO_CLIENT_ID and ZOHO_CLIENT_SECRET must be set in environment');
    }
    
    this.clientId_zoho = process.env.ZOHO_CLIENT_ID;
    this.clientSecret = process.env.ZOHO_CLIENT_SECRET;
    
    console.log(`[ZOHO_ADAPTER] Initialized for region ${region}`);
  }

  /**
   * Get current access token, refreshing if expired
   * @private
   */
  async getValidAccessToken() {
    // If token is still valid, return it
    if (this.accessToken && this.config.tokenExpiresAt) {
      const now = new Date();
      const buffer = 5 * 60 * 1000; // 5 minute buffer
      if (new Date(this.config.tokenExpiresAt).getTime() > now.getTime() + buffer) {
        return this.accessToken;
      }
    }
    
    // Token expired, refresh it
    return await this.refreshAccessToken();
  }

  /**
   * Refresh the access token using refresh token
   */
  async refreshAccessToken() {
    try {
      console.log('[ZOHO_ADAPTER] Refreshing access token');
      
      const response = await axios.post(this.authUrl, null, {
        params: {
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken,
          client_id: this.clientId_zoho,
          client_secret: this.clientSecret,
        },
      });
      
      this.accessToken = response.data.access_token;
      
      // Store expiry time for next check
      const expiresIn = response.data.expires_in || 3600; // Default 1 hour
      this.config.tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);
      
      console.log('[ZOHO_ADAPTER] Access token refreshed successfully');
      return this.accessToken;
    } catch (error) {
      console.error('[ZOHO_ADAPTER] Token refresh failed:', error.response?.data || error.message);
      throw new Error(`Zoho token refresh failed: ${error.response?.data?.error_description || error.message}`);
    }
  }

  /**
   * Make authenticated request to Zoho API
   * @private
   */
  async request(method, endpoint, data = null, params = {}) {
    const token = await this.getValidAccessToken();
    
    const config = {
      method,
      url: `${this.apiBaseUrl}${endpoint}`,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      params,
    };
    
    if (data) {
      config.data = data;
    }
    
    try {
      const response = await axios(config);
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('[ZOHO_ADAPTER] Received 401, refreshing token and retrying');
        // Token may be revoked, try to refresh
        try {
          await this.refreshAccessToken();
          config.headers.Authorization = `Bearer ${this.accessToken}`;
          const retryResponse = await axios(config);
          return retryResponse.data;
        } catch (retryError) {
          throw new Error('Zoho authorization failed. Please reconnect.');
        }
      }
      
      if (error.response?.status === 429) {
        throw new Error('Zoho API rate limit exceeded. Please try again in a moment.');
      }
      
      console.error('[ZOHO_ADAPTER] API request failed:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Retrieve leads from Zoho
   */
  async getLeads(page = 1, limit = 50) {
    try {
      console.log(`[ZOHO_ADAPTER] Fetching leads (page ${page}, limit ${limit})`);
      
      const response = await this.request('GET', '/Leads', null, {
        per_page: limit,
        page: page,
        fields: 'id,Email,Phone,Full_Name,Company,Lead_Status,Created_Time',
      });
      
      const leads = (response.data || []).map(crmLead => this.normalizeLead(crmLead));
      
      console.log(`[ZOHO_ADAPTER] Retrieved ${leads.length} leads`);
      return leads;
    } catch (error) {
      console.error('[ZOHO_ADAPTER] getLeads failed:', error.message);
      throw error;
    }
  }

  /**
   * Create a new lead in Zoho
   */
  async createLead(lead) {
    try {
      console.log('[ZOHO_ADAPTER] Creating new lead:', lead.name);
      
      const zohoDead = this.denormalizeLead(lead);
      
      const response = await this.request('POST', '/Leads', {
        data: [zohoDead],
      });
      
      if (!response.data || response.data.length === 0) {
        throw new Error('Zoho did not return created lead ID');
      }
      
      const createdLead = response.data[0];
      const internalId = `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log('[ZOHO_ADAPTER] Lead created with Zoho ID:', createdLead.id);
      
      return {
        id: internalId,
        external_id: createdLead.id,
      };
    } catch (error) {
      console.error('[ZOHO_ADAPTER] createLead failed:', error.message);
      throw error;
    }
  }

  /**
   * Update an existing lead in Zoho
   */
  async updateLead(externalId, updates) {
    try {
      console.log('[ZOHO_ADAPTER] Updating lead:', externalId);
      
      const zohoUpdates = this.denormalizeLead(updates);
      
      await this.request('PUT', `/Leads/${externalId}`, {
        data: [zohoUpdates],
      });
      
      console.log('[ZOHO_ADAPTER] Lead updated:', externalId);
    } catch (error) {
      console.error('[ZOHO_ADAPTER] updateLead failed:', error.message);
      throw error;
    }
  }

  /**
   * Get summary statistics about leads
   */
  async getSummary() {
    try {
      console.log('[ZOHO_ADAPTER] Fetching leads summary');
      
      // Fetch all leads to calculate summary (Zoho doesn't have direct count API)
      const response = await this.request('GET', '/Leads', null, {
        fields: 'id,Lead_Status,Created_Time',
      });
      
      const allLeads = response.data || [];
      
      const summary = {
        totalLeads: allLeads.length,
        newLeads: allLeads.filter(l => l.Lead_Status === 'New').length,
        qualifiedLeads: allLeads.filter(l => l.Lead_Status === 'Qualified').length,
        contacted: allLeads.filter(l => l.Lead_Status === 'Contacted').length,
        won: allLeads.filter(l => l.Lead_Status === 'Won').length,
        lost: allLeads.filter(l => l.Lead_Status === 'Lost').length,
        provider: 'zoho',
        lastSync: new Date(),
      };
      
      console.log('[ZOHO_ADAPTER] Summary:', summary);
      return summary;
    } catch (error) {
      console.error('[ZOHO_ADAPTER] getSummary failed:', error.message);
      throw error;
    }
  }

  /**
   * Fetch field schema for dynamic form rendering
   */
  async getFieldSchema() {
    try {
      console.log('[ZOHO_ADAPTER] Fetching Lead module field schema');
      
      const response = await this.request('GET', '/settings/fields/Leads');
      
      const fields = {};
      for (const field of response.fields || []) {
        fields[field.api_name] = {
          name: field.field_label,
          type: this.mapFieldType(field.data_type),
          required: field.mandatory,
          editable: field.read_only === false,
          values: field.pick_list_values || null, // For picklists
          maxLength: field.length || null,
        };
      }
      
      console.log('[ZOHO_ADAPTER] Schema fetched with', Object.keys(fields).length, 'fields');
      return fields;
    } catch (error) {
      console.error('[ZOHO_ADAPTER] getFieldSchema failed:', error.message);
      throw error;
    }
  }

  /**
   * Map Zoho field types to standard types
   * @private
   */
  mapFieldType(zohoType) {
    const typeMap = {
      'text': 'text',
      'long': 'number',
      'double': 'number',
      'currency': 'currency',
      'email': 'email',
      'phone': 'phone',
      'url': 'url',
      'date': 'date',
      'datetime': 'datetime',
      'picklist': 'select',
      'multi_select': 'multiselect',
      'checkbox': 'checkbox',
      'lookup': 'lookup',
      'textarea': 'textarea',
    };
    return typeMap[zohoType] || 'text';
  }

  /**
   * Normalize Zoho lead to internal NormalizedLead format
   * @private
   */
  normalizeLead(crmLead) {
    return {
      id: `lead_${crmLead.id}`,
      external_id: crmLead.id,
      name: crmLead.Full_Name || '',
      email: crmLead.Email || '',
      phone: crmLead.Phone || '',
      country: '',
      businessType: crmLead.Company || '',
      status: this.normalizeStatus(crmLead.Lead_Status),
      source: 'crm',
      notes: crmLead.Notes || '',
      custom_fields: {},
      lastModified: new Date(crmLead.Created_Time || Date.now()),
    };
  }

  /**
   * Convert normalized lead to Zoho format
   * @private
   */
  denormalizeLead(lead) {
    return {
      Full_Name: lead.name,
      Email: lead.email,
      Phone: lead.phone,
      Company: lead.businessType,
      Lead_Status: this.denormalizeStatus(lead.status),
      Notes: lead.notes,
      ...lead.custom_fields,
    };
  }

  /**
   * Normalize Zoho status to internal status enum
   * @private
   */
  normalizeStatus(zohoStatus) {
    const statusMap = {
      'New': 'new',
      'Qualified': 'qualified',
      'Contacted': 'contacted',
      'Won': 'won',
      'Lost': 'lost',
    };
    return statusMap[zohoStatus] || 'new';
  }

  /**
   * Convert internal status to Zoho status
   * @private
   */
  denormalizeStatus(internalStatus) {
    const statusMap = {
      'new': 'New',
      'qualified': 'Qualified',
      'contacted': 'Contacted',
      'won': 'Won',
      'lost': 'Lost',
    };
    return statusMap[internalStatus] || 'New';
  }
}

module.exports = ZohoCrmAdapter;
