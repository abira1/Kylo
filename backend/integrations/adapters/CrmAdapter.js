/**
 * CRM Adapter Base Class
 * 
 * Defines the interface that all CRM adapters must implement.
 * Ensures consistent method signatures across different CRM providers.
 * 
 * Usage:
 *   class MyAdapter extends CrmAdapter { ... }
 */

class CrmAdapter {
  constructor(clientId, config = {}) {
    if (new.target === CrmAdapter) {
      throw new TypeError('CrmAdapter is an abstract class. Use a concrete adapter like ZohoCrmAdapter.');
    }
    this.clientId = clientId;
    this.config = config;
    this.provider = 'unknown';
  }

  /**
   * Retrieve leads from the CRM
   * @param {number} page - Page number (1-indexed)
   * @param {number} limit - Results per page
   * @returns {Promise<Array>} Array of normalized leads
   */
  async getLeads(page = 1, limit = 50) {
    throw new Error('getLeads() must be implemented by subclass');
  }

  /**
   * Create a new lead in the CRM
   * @param {Object} lead - Normalized lead object
   * @returns {Promise<Object>} { id: internal_id, external_id: crm_id }
   */
  async createLead(lead) {
    throw new Error('createLead() must be implemented by subclass');
  }

  /**
   * Update an existing lead in the CRM
   * @param {string} externalId - CRM-specific lead ID
   * @param {Object} updates - Partial lead object with fields to update
   * @returns {Promise<void>}
   */
  async updateLead(externalId, updates) {
    throw new Error('updateLead() must be implemented by subclass');
  }

  /**
   * Get summary statistics about leads in the CRM
   * @returns {Promise<Object>} Summary with totalLeads, newLeads, qualifiedLeads, etc.
   */
  async getSummary() {
    throw new Error('getSummary() must be implemented by subclass');
  }

  /**
   * Refresh the access token using the stored refresh token
   * @returns {Promise<string>} New access token
   */
  async refreshAccessToken() {
    throw new Error('refreshAccessToken() must be implemented by subclass');
  }

  /**
   * Fetch field schema from the CRM (e.g., for dynamic form rendering)
   * @returns {Promise<Object>} Field metadata { fieldName: { type, required, values?, etc } }
   */
  async getFieldSchema() {
    throw new Error('getFieldSchema() must be implemented by subclass');
  }

  /**
   * Normalize CRM lead response to internal NormalizedLead format
   * @protected
   * @param {Object} crmLead - Raw lead object from CRM
   * @returns {Object} Normalized lead
   */
  normalizeLead(crmLead) {
    throw new Error('normalizeLead() must be implemented by subclass');
  }
}

module.exports = CrmAdapter;
