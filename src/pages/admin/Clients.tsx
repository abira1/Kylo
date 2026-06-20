import React from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  MoreVertical,
  Building,
  CheckCircle2,
  XCircle,
  AlertCircle } from
'lucide-react';
const MOCK_CLIENTS = [
{
  id: '1',
  name: 'TechFlow Inc',
  plan: 'Enterprise',
  bots: 12,
  usage: '85%',
  status: 'Active',
  mrr: '$2,400'
},
{
  id: '2',
  name: 'Global Retail',
  plan: 'Pro',
  bots: 3,
  usage: '45%',
  status: 'Active',
  mrr: '$299'
},
{
  id: '3',
  name: 'Startup IO',
  plan: 'Starter',
  bots: 1,
  usage: '95%',
  status: 'Warning',
  mrr: '$49'
},
{
  id: '4',
  name: 'Acme Corp',
  plan: 'Enterprise',
  bots: 8,
  usage: '60%',
  status: 'Active',
  mrr: '$1,800'
},
{
  id: '5',
  name: 'Fast Logistics',
  plan: 'Pro',
  bots: 2,
  usage: '10%',
  status: 'Suspended',
  mrr: '$0'
},
{
  id: '6',
  name: 'Creative Agency',
  plan: 'Starter',
  bots: 1,
  usage: '30%',
  status: 'Active',
  mrr: '$49'
}];

export function AdminClients() {
  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Client Accounts
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage all registered clients and their subscriptions.
          </p>
        </div>
        <button className="btn-primary text-sm">Add New Client</button>
      </div>

      <div className="bento-card">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-5">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-4 top-3 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search clients by name or ID..."
              className="input-field pl-12 w-full" />
            
          </div>
          <button className="btn-secondary flex items-center gap-2 w-full sm:w-auto">
            <Filter size={18} />
            Filter
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 dark:border-navy-800">
                <th className="pb-3 font-bold text-gray-500 dark:text-gray-400 text-sm uppercase tracking-wider">
                  Client
                </th>
                <th className="pb-3 font-bold text-gray-500 dark:text-gray-400 text-sm uppercase tracking-wider">
                  Plan
                </th>
                <th className="pb-3 font-bold text-gray-500 dark:text-gray-400 text-sm uppercase tracking-wider">
                  Bots
                </th>
                <th className="pb-3 font-bold text-gray-500 dark:text-gray-400 text-sm uppercase tracking-wider">
                  Usage
                </th>
                <th className="pb-3 font-bold text-gray-500 dark:text-gray-400 text-sm uppercase tracking-wider">
                  MRR
                </th>
                <th className="pb-3 font-bold text-gray-500 dark:text-gray-400 text-sm uppercase tracking-wider">
                  Status
                </th>
                <th className="pb-3 font-bold text-gray-500 dark:text-gray-400 text-sm uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-navy-800">
              {MOCK_CLIENTS.map((client, i) =>
              <motion.tr
                initial={{
                  opacity: 0,
                  y: 10
                }}
                animate={{
                  opacity: 1,
                  y: 0
                }}
                transition={{
                  delay: i * 0.05
                }}
                key={client.id}
                className="hover:bg-gray-50 dark:hover:bg-navy-800/50 transition-colors group">
                
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-navy-800 flex items-center justify-center text-gray-500 dark:text-gray-400">
                        <Building size={16} />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 dark:text-white text-sm">
                          {client.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          ID: {client.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 text-sm">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {client.plan}
                    </span>
                  </td>
                  <td className="py-3 text-sm text-gray-600 dark:text-gray-400">
                    {client.bots}
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-gray-200 dark:bg-navy-800 rounded-full overflow-hidden">
                        <div
                        className={`h-full rounded-full ${parseInt(client.usage) > 90 ? 'bg-red-500' : 'bg-emerald-500 dark:bg-cyan-500'}`}
                        style={{
                          width: client.usage
                        }} />
                      
                      </div>
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        {client.usage}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 text-sm font-medium text-gray-900 dark:text-white">
                    {client.mrr}
                  </td>
                  <td className="py-3">
                    {client.status === 'Active' &&
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-mint-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                        <CheckCircle2 size={14} /> Active
                      </span>
                  }
                    {client.status === 'Warning' &&
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs font-bold">
                        <AlertCircle size={14} /> Limit Reached
                      </span>
                  }
                    {client.status === 'Suspended' &&
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-xs font-bold">
                        <XCircle size={14} /> Suspended
                      </span>
                  }
                  </td>
                  <td className="py-3 text-right">
                    <button className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-navy-700 transition-colors">
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </motion.tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-5 pt-5 border-t border-gray-100 dark:border-navy-800">
          <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Showing 1 to 6 of 1,284 clients
          </span>
          <div className="flex gap-2">
            <button className="btn-secondary text-sm px-3 py-1.5">
              Previous
            </button>
            <button className="btn-secondary text-sm px-3 py-1.5">Next</button>
          </div>
        </div>
      </div>
    </div>);

}