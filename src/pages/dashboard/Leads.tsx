import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Filter,
  Download,
  MoreHorizontal,
  Mail,
  Phone,
  Tag,
  Loader,
  ArrowLeft,
  RefreshCw } from
'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../../hooks/useAuth';
import { getConnectionStatus, fetchLeads as fetchCrmLeads, fetchLeadDetail } from '../../services/crmService';

interface Lead {
  id: string;
  external_id?: string;
  name: string;
  email: string;
  phone?: string;
  country?: string;
  status: string;
  createdAt: Date;
  source: string;
  conversationId?: string;
  messages?: any[];
  extractedData?: any;
}

const API_BASE_URL = (() => {
  const isLocalhost = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.includes('5173')
  );
  
  if (isLocalhost) {
    return 'http://localhost:5001';
  }
  
  return 'https://kylo-production.up.railway.app';
})();
export function Leads() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [crmConnected, setCrmConnected] = useState(false);
  const [crmProvider, setCrmProvider] = useState<string | null>(null);
  const [detailLead, setDetailLead] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  // Tracks CRM connection for the auto-refresh interval closure (avoids stale state)
  const crmConnectedRef = useRef(false);

  const demoClientId = 'gxx8SK6WQHfd9xZ2HOLUW3PDFGE3';

  // Map a CRM (e.g. Zoho) normalized lead onto the local Lead shape
  const mapCrmLead = (l: any): Lead => ({
    id: l.id || l.external_id,
    external_id: l.external_id || l.id,
    name: l.name || 'No name',
    email: l.email || '',
    phone: l.phone,
    country: l.country,
    status: l.status || 'new',
    createdAt: l.lastModified ? new Date(l.lastModified) : new Date(),
    source: l.source || 'crm',
    extractedData: l.custom_fields,
  });

  // Re-confirm whether a CRM (e.g. Zoho) is connected. Returns the connection
  // state and updates the badge. Resilient: on failure keeps the last known value.
  const confirmCrmSource = async (): Promise<boolean> => {
    // Can only check once we have an authenticated user
    if (!user?.uid) {
      return crmConnectedRef.current;
    }
    try {
      const status = await getConnectionStatus();
      const connected = !!status?.connected && status?.status === 'connected';
      crmConnectedRef.current = connected;
      setCrmConnected(connected);
      setCrmProvider(connected ? status.provider : null);
      return connected;
    } catch (e) {
      // Could not determine right now -> keep last known source
      return crmConnectedRef.current;
    }
  };

  // Function to fetch leads
  const fetchLeads = async (isRefresh = false) => {
    try {
      // Only set loading on initial load, not on refresh
      if (!isRefresh) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      // Always re-confirm the source so the inbox can NEVER get stuck on the
      // wrong one. When a CRM is connected, the inbox is sourced ENTIRELY from
      // the CRM and the local database is ignored.
      const connected = await confirmCrmSource();

      if (connected) {
        try {
          const crmLeads = await fetchCrmLeads(1, 100);
          console.log('[LEADS] Fetched', crmLeads.length, 'leads from CRM');
          setLeads(crmLeads.map(mapCrmLead));
        } catch (crmError) {
          // Connected but fetch failed -> show empty CRM state, never local
          console.error('[LEADS] CRM fetch failed:', crmError);
          if (!isRefresh) {
            setLeads([]);
          }
        }
        return;
      }

      // Use user's UID, fallback to demoClientId
      const clientId = user?.uid || demoClientId;
      console.log('[LEADS] Fetching for clientId:', clientId, '(user.uid:', user?.uid, ')');

      const response = await fetch(`${API_BASE_URL}/api/leads/${clientId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[LEADS] API Response:', { success: data.success, count: data.count, leadsCount: data.leads?.length });
        
        // Parse dates and ensure proper structure
        const parsedLeads = (data.leads || []).map((lead: any) => ({
          ...lead,
          createdAt: lead.createdAt ? new Date(lead.createdAt) : new Date(),
          updatedAt: lead.updatedAt ? new Date(lead.updatedAt) : new Date(),
        }));

        console.log('[LEADS] Parsed leads:', parsedLeads.length, '| First lead:', parsedLeads[0] ? {
          id: parsedLeads[0].id,
          name: parsedLeads[0].name,
          email: parsedLeads[0].email,
          phone: parsedLeads[0].phone,
          status: parsedLeads[0].status,
          createdAt: parsedLeads[0].createdAt
        } : 'NONE');
        
        setLeads(parsedLeads);
      } else {
        console.error('Failed to fetch leads, status:', response.status);
        // Don't clear leads on error - keep showing what we had
        if (!isRefresh) {
          setLeads([]);
        }
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
      // Don't clear leads on error - keep showing what we had
      if (!isRefresh) {
        setLeads([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch leads on mount and when user changes
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      // Determine the source up-front (so the badge appears immediately),
      // then fetch. fetchLeads also re-confirms the source on every call,
      // so this is self-healing even if the first check races with auth.
      await confirmCrmSource();
      if (cancelled) return;

      // Initial fetch
      fetchLeads(false);

      // Auto-refresh every 5 seconds to catch new leads
      refreshIntervalRef.current = setInterval(() => {
        fetchLeads(true);
      }, 5000);
    };

    init();

    // Cleanup interval on unmount
    return () => {
      cancelled = true;
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [user?.uid]); // Re-fetch when user changes

  // Manual refresh handler
  const handleRefresh = async () => {
    await fetchLeads(true);
  };

  // Open a lead. For CRM-connected inboxes this fetches the FULL record
  // (all fields) from the CRM and opens a full-page detail view.
  const openLeadDetail = async (lead: Lead) => {
    if (crmConnectedRef.current && lead.external_id) {
      setDetailLead({ ...lead, raw: null });
      setDetailLoading(true);
      setDetailError(null);
      try {
        const full = await fetchLeadDetail(lead.external_id);
        setDetailLead(full);
      } catch (err: any) {
        console.error('[LEADS] Failed to load lead detail:', err);
        setDetailError(err?.message || 'Failed to load lead details');
      } finally {
        setDetailLoading(false);
      }
    } else {
      // Local (non-CRM) lead -> existing side panel
      setSelectedLead(lead);
    }
  };

  // Pretty-print a Zoho field label (Lead_Status -> Lead Status)
  const formatLabel = (key: string) =>
    key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  // Render any Zoho field value as readable text
  const renderValue = (v: any): string => {
    if (v === null || v === undefined || v === '') return '\u2014';
    if (Array.isArray(v)) return v.map(renderValue).filter(Boolean).join(', ') || '\u2014';
    if (typeof v === 'object') return v.name || v.full_name || v.display_value || JSON.stringify(v);
    if (typeof v === 'boolean') return v ? 'Yes' : 'No';
    return String(v);
  };

  // Filter leads - apply search/status ONLY if user explicitly types/selects
  // By default, show ALL leads
  const filteredLeads = leads.filter(lead => {
    // If no search term AND status is 'all', show ALL leads
    if (!searchTerm.trim() && statusFilter === 'all') {
      return true;
    }

    // Apply search filter if user typed something
    let matchesSearch = true;
    if (searchTerm.trim()) {
      matchesSearch = 
        (lead.name && lead.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lead.phone && lead.phone.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    // Apply status filter if user selected something
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  console.log('[LEADS] Total:', leads.length, '| Shown:', filteredLeads.length, '| Search:', searchTerm, '| Status:', statusFilter);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'new':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'qualified':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'contacted':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'won':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'lost':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const calculateScore = (lead: Lead) => {
    // Score based on lead completeness
    // Base: 50 points for having name + phone (minimum required)
    // +20 each for optional fields
    let score = 0;
    
    // Base 50 points for required fields
    if (lead.name) score += 25;
    if (lead.phone) score += 25;
    
    // +20 points for each optional field
    if (lead.email) score += 20;
    if (lead.country) score += 15;
    if (lead.extractedData && Object.keys(lead.extractedData).length > 0) score += 15;
    
    return Math.min(score, 100);
  };

  const getLeadDataIndicators = (lead: Lead) => {
    const indicators = [];
    if (lead.name) indicators.push('📝');
    if (lead.phone) indicators.push('📞');
    if (lead.email) indicators.push('📧');
    if (lead.country) indicators.push('🌍');
    if (lead.extractedData && Object.keys(lead.extractedData).length > 0) indicators.push('📸');
    return indicators.length > 0 ? indicators.join(' ') : 'ℹ️';
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Country', 'Status', 'Date', 'Source'];
    const rows = filteredLeads.map(lead => [
      lead.name,
      lead.email,
      lead.phone || '',
      lead.country || '',
      lead.status,
      format(lead.createdAt, 'MMM d, yyyy'),
      lead.source
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  return (
    <div className="space-y-5 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Lead Inbox
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 font-medium">
            {crmConnected
              ? `Showing leads from your connected CRM. (${filteredLeads.length} of ${leads.length} leads)`
              : `Manage and qualify leads captured by your AI. (${filteredLeads.length} of ${leads.length} leads)`}
            {(searchTerm || statusFilter !== 'all') && (
              <span className="text-xs ml-2 text-orange-600 dark:text-orange-400">
                🔍 Filtered
              </span>
            )}
          </p>
          {crmConnected && (
            <span className="inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Synced from {(crmProvider || 'CRM').toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-secondary text-xs sm:text-sm w-full sm:w-auto disabled:opacity-60 transition-all"
            title="Refresh leads list">
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} /> 
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button 
            onClick={handleExportCSV}
            className="btn-secondary text-xs sm:text-sm w-full sm:w-auto">
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      <div className="bento-card flex-1 flex flex-col overflow-hidden p-0 sm:p-0">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 dark:border-navy-700 flex flex-col sm:flex-row gap-3 justify-between items-center bg-white dark:bg-navy-800">
          <div className="relative w-full sm:w-80">
            <Search
              className="absolute left-3 top-2.5 text-gray-400"
              size={16} />
            
            <input
              type="text"
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-9 py-2 text-sm bg-gray-50 dark:bg-navy-900" />
            
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="btn-secondary text-xs sm:text-sm py-2 px-4 w-full sm:w-auto">
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="qualified">Qualified</option>
              <option value="contacted">Contacted</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>
            {(searchTerm || statusFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  console.log('[LEADS] Cleared all filters');
                }}
                className="btn-secondary text-xs sm:text-sm py-2 px-3 w-auto hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                title="Clear all filters">
                ✕ Clear
              </button>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader className="animate-spin text-cyan-500" size={32} />
              <p className="text-gray-500 dark:text-gray-400">Loading leads...</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredLeads.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Mail className="mx-auto mb-3 text-gray-300 dark:text-gray-600" size={48} />
              <p className="text-gray-500 dark:text-gray-400">No leads found</p>
              {(searchTerm || statusFilter !== 'all') ? (
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-2 space-y-1">
                  <p>Active filters:</p>
                  {searchTerm && <p>🔍 Search: "{searchTerm}"</p>}
                  {statusFilter !== 'all' && <p>📊 Status: {statusFilter}</p>}
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                      console.log('[LEADS] Cleared all filters');
                    }}
                    className="text-cyan-600 dark:text-cyan-400 hover:underline mt-2 font-medium">
                    Clear all filters
                  </button>
                </div>
              ) : (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {leads.length > 0 
                    ? '✓ Filters active - no matches found. Try clearing filters' 
                    : '📭 No leads yet - start a chat on your website to capture leads'}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Table */}
        {!loading && filteredLeads.length > 0 && (
          <div className="flex-1 overflow-x-auto bg-white dark:bg-navy-800">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead className="bg-gray-50/50 dark:bg-navy-900/50 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-navy-700">
                    Lead
                  </th>
                  <th className="px-4 py-3 text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-navy-700">
                    Status
                  </th>
                  <th className="px-4 py-3 text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-navy-700">
                    Score
                  </th>
                  <th className="px-4 py-3 text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-navy-700 hidden sm:table-cell">
                    Source
                  </th>
                  <th className="px-4 py-3 text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-navy-700 hidden sm:table-cell">
                    Date
                  </th>
                  <th className="px-4 py-3 text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-navy-700"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-navy-700/50">
                {filteredLeads.map((lead) => {
                  const score = calculateScore(lead);
                  return (
                    <tr
                      key={lead.id}
                      onClick={() => openLeadDetail(lead)}
                      className="hover:bg-mint-50/50 dark:hover:bg-navy-700/50 cursor-pointer transition-colors">
                      
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm sm:text-base shadow-sm">
                            {(lead.name || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <div className="font-bold text-gray-900 dark:text-white text-sm">
                                {lead.name && lead.name.trim() ? lead.name.substring(0, 30) : 'No name'}
                              </div>
                              <div className="text-xs opacity-60" title="Name • Phone • Email • Country • Extracted">
                                {getLeadDataIndicators(lead)}
                              </div>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                              {lead.phone || lead.email || 'no contact info'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wide ${getStatusColor(lead.status)}`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-12 sm:w-16 h-1.5 sm:h-2 bg-gray-100 dark:bg-navy-900 rounded-full overflow-hidden shadow-inner">
                            <div
                              className={`h-full rounded-full ${score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-yellow-500' : 'bg-orange-500'}`}
                              style={{
                                width: `${score}%`
                              }} />
                          </div>
                          <span className="text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300">
                            {score}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 hidden sm:table-cell">
                        {lead.source}
                      </td>
                      <td className="px-4 py-3 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 hidden sm:table-cell">
                        {format(lead.createdAt, 'MMM d, yyyy')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-navy-700 transition-colors">
                          <MoreHorizontal size={16} className="sm:w-5 sm:h-5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Lead Detail Panel */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-end z-50">
          <div className="w-full sm:max-w-md bg-white dark:bg-navy-800 rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[80vh] overflow-auto">
            <div className="p-6 border-b border-gray-100 dark:border-navy-700 sticky top-0 bg-white dark:bg-navy-800 z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedLead.name}</h2>
                <button 
                  onClick={() => setSelectedLead(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-navy-700 rounded-lg transition-colors">
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Email</label>
                <p className="text-gray-900 dark:text-white mt-1 flex items-center gap-2">
                  <Mail size={16} className="text-cyan-500" />
                  {selectedLead.email}
                </p>
              </div>

              {selectedLead.phone && (
                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Phone</label>
                  <p className="text-gray-900 dark:text-white mt-1 flex items-center gap-2">
                    <Phone size={16} className="text-cyan-500" />
                    {selectedLead.phone}
                  </p>
                </div>
              )}

              {selectedLead.country && (
                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Country</label>
                  <p className="text-gray-900 dark:text-white mt-1">{selectedLead.country}</p>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Status</label>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wide mt-1 ${getStatusColor(selectedLead.status)}`}>
                  {selectedLead.status}
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Date</label>
                <p className="text-gray-900 dark:text-white mt-1">{format(selectedLead.createdAt, 'PPP p')}</p>
              </div>

              {selectedLead.messages && selectedLead.messages.length > 0 && (
                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Conversation</label>
                  <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                    {selectedLead.messages.map((msg, idx) => (
                      <div key={idx} className={`p-2 rounded-lg ${msg.isBot ? 'bg-gray-100 dark:bg-navy-700' : 'bg-cyan-100 dark:bg-cyan-900/30'}`}>
                        <p className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">
                          {msg.isBot ? 'Bot' : 'User'}
                        </p>
                        <p className="text-sm text-gray-900 dark:text-white">{msg.text?.substring(0, 200)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Full-page CRM Lead Detail View (all fields from Zoho) */}
      {detailLead && (
        <div className="fixed inset-0 z-50 bg-gray-50 dark:bg-navy-900 overflow-y-auto">
          {/* Sticky header */}
          <div className="sticky top-0 z-10 bg-white/95 dark:bg-navy-800/95 backdrop-blur border-b border-gray-100 dark:border-navy-700">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
              <button
                onClick={() => { setDetailLead(null); setDetailError(null); }}
                className="p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-navy-700 transition-colors text-gray-600 dark:text-gray-300"
                title="Back to inbox">
                <ArrowLeft size={20} />
              </button>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold shadow-sm shrink-0">
                {(detailLead.name || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">
                  {detailLead.name || 'No name'}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {(crmProvider || 'CRM').toUpperCase()} · ID {detailLead.external_id || detailLead.id}
                </p>
              </div>
              <span className={`hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${getStatusColor(detailLead.status || 'new')}`}>
                {detailLead.status || 'new'}
              </span>
            </div>
          </div>

          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
            {/* Quick summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="bg-white dark:bg-navy-800 rounded-xl p-4 border border-gray-100 dark:border-navy-700">
                <div className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                  <Mail size={12} className="text-cyan-500" /> Email
                </div>
                <p className="text-sm text-gray-900 dark:text-white break-words">{detailLead.email || '\u2014'}</p>
              </div>
              <div className="bg-white dark:bg-navy-800 rounded-xl p-4 border border-gray-100 dark:border-navy-700">
                <div className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                  <Phone size={12} className="text-cyan-500" /> Phone
                </div>
                <p className="text-sm text-gray-900 dark:text-white break-words">{detailLead.phone || '\u2014'}</p>
              </div>
              <div className="bg-white dark:bg-navy-800 rounded-xl p-4 border border-gray-100 dark:border-navy-700">
                <div className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                  <Tag size={12} className="text-cyan-500" /> Status
                </div>
                <p className="text-sm text-gray-900 dark:text-white break-words">{detailLead.status || '\u2014'}</p>
              </div>
            </div>

            {/* Loading / error states for the full record */}
            {detailLoading && (
              <div className="flex items-center justify-center py-10">
                <div className="flex flex-col items-center gap-3">
                  <Loader className="animate-spin text-cyan-500" size={28} />
                  <p className="text-sm text-gray-500 dark:text-gray-400">Loading all details from {(crmProvider || 'CRM').toUpperCase()}…</p>
                </div>
              </div>
            )}

            {detailError && !detailLoading && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-700 dark:text-red-400">
                {detailError}
              </div>
            )}

            {/* ALL fields from Zoho */}
            {!detailLoading && detailLead.raw && (
              <div className="bg-white dark:bg-navy-800 rounded-2xl border border-gray-100 dark:border-navy-700 overflow-hidden">
                <div className="px-4 sm:px-6 py-3 border-b border-gray-100 dark:border-navy-700 bg-gray-50/50 dark:bg-navy-900/40">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    All Information ({Object.keys(detailLead.raw).length} fields)
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 divide-gray-50 dark:divide-navy-700/50">
                  {Object.entries(detailLead.raw)
                    .filter(([, v]) => v !== null && v !== undefined && v !== '')
                    .map(([key, value], idx) => (
                      <div
                        key={key}
                        className={`px-4 sm:px-6 py-3 ${idx % 2 === 0 ? 'sm:border-r border-gray-50 dark:border-navy-700/50' : ''} border-b border-gray-50 dark:border-navy-700/50`}>
                        <div className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">
                          {formatLabel(key)}
                        </div>
                        <div className="text-sm text-gray-900 dark:text-white break-words whitespace-pre-wrap">
                          {renderValue(value)}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}