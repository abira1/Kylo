import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Download,
  MoreHorizontal,
  Mail,
  Phone,
  Tag,
  Loader } from
'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../../hooks/useAuth';

interface Lead {
  id: string;
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
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const demoClientId = 'gxx8SK6WQHfd9xZ2HOLUW3PDFGE3';

  // Fetch leads from backend (once on mount)
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        setLoading(true);
        // Always use demoClientId for this demo
        const clientId = demoClientId;

        const response = await fetch(`${API_BASE_URL}/api/leads/${clientId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log('[LEADS] Fetched leads:', data.leads?.length || 0);
          setLeads(data.leads || []);
        } else {
          console.error('Failed to fetch leads');
          setLeads([]);
        }
      } catch (error) {
        console.error('Error fetching leads:', error);
        setLeads([]);
      } finally {
        setLoading(false);
      }
    };

    // Only fetch once on component mount
    fetchLeads();
  }, []);

  // Filter leads
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
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
    // Score based on completeness of lead data
    let score = 0;
    if (lead.name) score += 20;
    if (lead.email) score += 20;
    if (lead.phone) score += 20;
    if (lead.country) score += 20;
    if (lead.extractedData && Object.keys(lead.extractedData).length > 0) score += 20;
    return score;
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
            Manage and qualify leads captured by your AI. ({filteredLeads.length} leads)
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
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
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {searchTerm ? 'Try adjusting your search' : 'Leads will appear here when captured from chats'}
              </p>
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
                      onClick={() => setSelectedLead(lead)}
                      className="hover:bg-mint-50/50 dark:hover:bg-navy-700/50 cursor-pointer transition-colors">
                      
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm sm:text-base shadow-sm">
                            {lead.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 dark:text-white text-sm">
                              {lead.name || 'Unknown'}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                              {lead.email}
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
    </div>
  );
}