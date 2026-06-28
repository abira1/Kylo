/**
 * CRM Service - Frontend API Wrapper
 * 
 * Provides functions to interact with CRM backend endpoints.
 * All API calls are tenant-scoped to the current user's clientId.
 */

import { auth } from '../firebase/config';

/**
 * Determine API base URL based on environment.
 * - Development (localhost / Vite dev server): use local backend on port 5001
 * - Production: use the public Railway backend
 *
 * IMPORTANT: This must be the FULL backend origin (not a relative path),
 * otherwise the OAuth redirect would navigate to the Firebase-hosted
 * frontend (which serves index.html) instead of the backend.
 */
function getBackendBaseUrl(): string {
  const isLocalhost = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.includes('5173')
  );

  if (isLocalhost) {
    return 'http://localhost:5001';
  }

  return (import.meta as any).env?.VITE_API_BASE_URL || 'https://kylo-production.up.railway.app';
}

const API_BASE = `${getBackendBaseUrl()}/api/crm`;

interface ConnectionStatus {
  connected: boolean;
  provider: string | null;
  status: 'connected' | 'error' | 'pending' | 'disconnected';
  region?: string;
  lastSync?: string;
  errorMessage?: string;
}

interface NormalizedLead {
  id: string;
  external_id: string;
  name: string;
  email?: string;
  phone?: string;
  country?: string;
  businessType?: string;
  status: 'new' | 'qualified' | 'contacted' | 'won' | 'lost';
  source: 'chat' | 'form' | 'whatsapp' | 'crm';
  notes?: string;
  custom_fields?: Record<string, unknown>;
  lastModified?: string;
}

interface FieldSchema {
  [key: string]: {
    name: string;
    type: string;
    required: boolean;
    editable: boolean;
    values?: string[];
    maxLength?: number;
  };
}

/**
 * Initiate OAuth 2.0 flow with specified CRM provider
 */
export async function initiateOAuth(provider: string, region: string = '.com'): Promise<void> {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const clientId = user.uid;
    const authUrl = `${API_BASE}/oauth/authorize?provider=${provider}&region=${region}&clientId=${clientId}`;
    window.location.href = authUrl;
  } catch (error) {
    console.error('[CRM_SERVICE] Failed to initiate OAuth:', error);
    throw error;
  }
}

/**
 * Get current CRM connection status
 */
export async function getConnectionStatus(): Promise<ConnectionStatus> {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const clientId = user.uid;
    const response = await fetch(`${API_BASE}/connection?clientId=${clientId}`);

    if (!response.ok) {
      throw new Error(`Failed to get connection status: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[CRM_SERVICE] Connection status:', data.status);
    return data;
  } catch (error) {
    console.error('[CRM_SERVICE] Failed to get connection status:', error);
    throw error;
  }
}

/**
 * Disconnect current CRM connection
 */
export async function disconnectCRM(): Promise<void> {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const clientId = user.uid;
    const response = await fetch(`${API_BASE}/connection`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ clientId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to disconnect: ${response.statusText}`);
    }

    console.log('[CRM_SERVICE] CRM disconnected successfully');
  } catch (error) {
    console.error('[CRM_SERVICE] Failed to disconnect CRM:', error);
    throw error;
  }
}

/**
 * Fetch leads from connected CRM
 */
export async function fetchLeads(page: number = 1, limit: number = 50): Promise<NormalizedLead[]> {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const clientId = user.uid;
    const response = await fetch(`${API_BASE}/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ clientId, page, limit }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to fetch leads: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[CRM_SERVICE] Fetched', data.leads.length, 'leads from CRM');
    return data.leads;
  } catch (error) {
    console.error('[CRM_SERVICE] Failed to fetch leads:', error);
    throw error;
  }
}

export interface CrmLeadDetail extends NormalizedLead {
  raw?: Record<string, unknown>;
}

/**
 * Fetch a single lead with ALL fields from the connected CRM
 */
export async function fetchLeadDetail(externalId: string): Promise<CrmLeadDetail> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }

  const clientId = user.uid;
  const response = await fetch(`${API_BASE}/leads/detail`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ clientId, externalId }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error((error as any).error || `Failed to fetch lead detail: ${response.statusText}`);
  }

  const data = await response.json();
  return data.lead;
}

/**
 * Create a new lead in the connected CRM
 */
export async function createLead(lead: Omit<NormalizedLead, 'id' | 'external_id'>): Promise<{ id: string; external_id: string }> {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const clientId = user.uid;
    const response = await fetch(`${API_BASE}/leads/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ clientId, lead }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to create lead: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[CRM_SERVICE] Lead created with ID:', data.id);
    return {
      id: data.id,
      external_id: data.external_id,
    };
  } catch (error) {
    console.error('[CRM_SERVICE] Failed to create lead:', error);
    throw error;
  }
}

/**
 * Manually trigger a sync of leads from CRM
 */
export async function syncLeads(): Promise<{ synced: number; provider: string }> {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const clientId = user.uid;
    const response = await fetch(`${API_BASE}/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ clientId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to sync: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[CRM_SERVICE] Synced', data.synced, 'leads from', data.provider);
    return {
      synced: data.synced,
      provider: data.provider,
    };
  } catch (error) {
    console.error('[CRM_SERVICE] Failed to sync leads:', error);
    throw error;
  }
}

/**
 * Get field schema for dynamic form rendering
 */
export async function getFieldSchema(): Promise<FieldSchema> {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const clientId = user.uid;
    const response = await fetch(`${API_BASE}/fields?clientId=${clientId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to fetch fields: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[CRM_SERVICE] Fetched schema with', Object.keys(data.fields).length, 'fields');
    return data.fields;
  } catch (error) {
    console.error('[CRM_SERVICE] Failed to get field schema:', error);
    throw error;
  }
}
