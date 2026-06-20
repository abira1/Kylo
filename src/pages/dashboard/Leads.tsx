import React, { useState } from 'react';
import {
  Search,
  Filter,
  Download,
  MoreHorizontal,
  Mail,
  Phone,
  Tag } from
'lucide-react';
import { MOCK_LEADS } from '../../lib/mockData';
import { format } from 'date-fns';
export function Leads() {
  const [selectedLead, setSelectedLead] = useState<
    (typeof MOCK_LEADS)[0] | null>(
    null);
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
  return (
    <div className="space-y-5 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Lead Inbox
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 font-medium">
            Manage and qualify leads captured by your AI.
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button className="btn-secondary text-xs sm:text-sm w-full sm:w-auto">
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
              className="input-field pl-9 py-2 text-sm bg-gray-50 dark:bg-navy-900" />
            
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button className="btn-secondary text-xs sm:text-sm py-2 px-4 w-full sm:w-auto">
              <Filter size={16} /> Filter
            </button>
          </div>
        </div>

        {/* Table */}
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
              {MOCK_LEADS.map((lead) =>
              <tr
                key={lead.id}
                onClick={() => setSelectedLead(lead)}
                className="hover:bg-mint-50/50 dark:hover:bg-navy-700/50 cursor-pointer transition-colors">
                
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gray-100 dark:bg-navy-700 flex items-center justify-center text-gray-700 dark:text-gray-300 font-bold text-sm sm:text-base shadow-sm">
                        {lead.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 dark:text-white text-sm">
                          {lead.name}
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
                        className={`h-full rounded-full ${lead.score >= 80 ? 'bg-emerald-500' : lead.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{
                          width: `${lead.score}%`
                        }} />
                      
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300">
                        {lead.score}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 hidden sm:table-cell">
                    {lead.source}
                  </td>
                  <td className="px-4 py-3 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 hidden sm:table-cell">
                    {format(new Date(lead.date), 'MMM d, yyyy')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-navy-700 transition-colors">
                      <MoreHorizontal size={16} className="sm:w-5 sm:h-5" />
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over Panel for Lead Details (Simplified for mock) */}
      {selectedLead &&
      <div className="fixed inset-0 z-50 overflow-hidden">
          <div
          className="absolute inset-0 bg-black/20 backdrop-blur-sm"
          onClick={() => setSelectedLead(null)} />
        
          <div className="absolute inset-y-0 right-0 w-full max-w-md bg-white dark:bg-navy-900 shadow-2xl border-l border-gray-200 dark:border-navy-800 flex flex-col transform transition-transform">
            <div className="p-6 border-b border-gray-200 dark:border-navy-800 flex justify-between items-center bg-gray-50 dark:bg-navy-950">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Lead Details
              </h2>
              <button
              onClick={() => setSelectedLead(null)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              
                ✕
              </button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-mint-400 to-mint-600 dark:from-cyan-500 dark:to-electric-500 flex items-center justify-center text-white font-bold text-2xl shadow-md">
                  {selectedLead.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {selectedLead.name}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    {selectedLead.company}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 btn-primary py-2 text-sm">
                  <Mail size={16} /> Email
                </button>
                <button className="flex-1 btn-secondary py-2 text-sm">
                  <Phone size={16} /> Call
                </button>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-navy-800 pb-2">
                  Information
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500 dark:text-gray-400 mb-1">
                      Status
                    </div>
                    <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedLead.status)}`}>
                    
                      {selectedLead.status}
                    </span>
                  </div>
                  <div>
                    <div className="text-gray-500 dark:text-gray-400 mb-1">
                      Lead Score
                    </div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {selectedLead.score} / 100
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-gray-500 dark:text-gray-400 mb-1">
                      Email
                    </div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {selectedLead.email}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-gray-500 dark:text-gray-400 mb-1">
                      Source
                    </div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {selectedLead.source}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-navy-800 pb-2">
                  Tags
                </h4>
                <div className="flex gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-gray-100 dark:bg-navy-800 text-gray-700 dark:text-gray-300 text-xs font-medium">
                    <Tag size={12} /> Enterprise
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-gray-100 dark:bg-navy-800 text-gray-700 dark:text-gray-300 text-xs font-medium">
                    <Tag size={12} /> High Intent
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    </div>);

}