/**
 * CRM Factory
 * 
 * Factory pattern for creating CRM adapter instances.
 * Ensures consistent adapter creation and adds new providers easily.
 * 
 * Usage:
 *   const adapter = CrmFactory.createAdapter('zoho', clientId, config);
 */

const ZohoCrmAdapter = require('./adapters/ZohoCrmAdapter');

class CrmFactory {
  /**
   * Create a CRM adapter instance for the specified provider
   * @param {string} provider - Provider name (e.g., 'zoho', 'hubspot', 'pipedrive')
   * @param {string} clientId - Client ID for multi-tenant isolation
   * @param {Object} config - Provider-specific configuration
   * @returns {CrmAdapter} Adapter instance
   */
  static createAdapter(provider, clientId, config) {
    if (!provider) {
      throw new Error('Provider must be specified');
    }

    console.log(`[CRM_FACTORY] Creating adapter for provider: ${provider}`);

    switch (provider.toLowerCase()) {
      case 'zoho':
        return new ZohoCrmAdapter(clientId, config);

      case 'hubspot':
        // TODO: Implement HubSpot adapter
        throw new Error('HubSpot adapter not yet implemented');

      case 'pipedrive':
        // TODO: Implement Pipedrive adapter
        throw new Error('Pipedrive adapter not yet implemented');

      case 'salesforce':
        // TODO: Implement Salesforce adapter
        throw new Error('Salesforce adapter not yet implemented');

      default:
        throw new Error(`Unknown CRM provider: ${provider}`);
    }
  }

  /**
   * Get list of available providers
   * @returns {Array<string>} Available provider names
   */
  static getAvailableProviders() {
    return ['zoho', 'hubspot', 'pipedrive', 'salesforce'];
  }

  /**
   * Check if a provider is implemented
   * @param {string} provider - Provider name
   * @returns {boolean} True if provider adapter exists
   */
  static isProviderImplemented(provider) {
    return ['zoho'].includes(provider.toLowerCase());
  }
}

module.exports = CrmFactory;
