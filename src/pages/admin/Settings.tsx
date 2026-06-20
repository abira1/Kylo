import React, { useState } from 'react';
import { Shield, Key, Building, Settings2, Database, Mail } from 'lucide-react';
export function AdminSettings() {
  const [activeTab, setActiveTab] = useState('platform');
  const tabs = [
  {
    id: 'platform',
    label: 'Platform Branding',
    icon: Building
  },
  {
    id: 'security',
    label: 'Security & Roles',
    icon: Shield
  },
  {
    id: 'ai',
    label: 'AI Providers',
    icon: Database
  },
  {
    id: 'api',
    label: 'Global API Keys',
    icon: Key
  },
  {
    id: 'email',
    label: 'Email Server',
    icon: Mail
  }];

  return (
    <div className="space-y-5">
      <div className="mb-5">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
          Platform Settings
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
          Configure global system parameters, security, and integrations.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-5 sm:gap-6">
        <div className="w-full md:w-64 space-y-1.5 flex-shrink-0">
          {tabs.map((tab) =>
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all text-left ${activeTab === tab.id ? 'bg-mint-100 dark:bg-navy-800 text-emerald-700 dark:text-cyan-400 shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-navy-800/50'}`}>
            
              <tab.icon size={18} />
              {tab.label}
            </button>
          )}
        </div>

        <div className="flex-1">
          {activeTab === 'platform' &&
          <div className="bento-card space-y-5">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-navy-700 pb-4">
                Platform Branding
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                <div className="md:col-span-2">
                  <label className="label-text">Platform Name</label>
                  <input
                  type="text"
                  className="input-field"
                  defaultValue="KYLO" />
                
                </div>
                <div>
                  <label className="label-text">Support Email</label>
                  <input
                  type="email"
                  className="input-field"
                  defaultValue="support@kylo.ai" />
                
                </div>
                <div>
                  <label className="label-text">Billing Email</label>
                  <input
                  type="email"
                  className="input-field"
                  defaultValue="billing@kylo.ai" />
                
                </div>
                <div className="md:col-span-2">
                  <label className="label-text">Custom Domain</label>
                  <div className="flex gap-2">
                    <input
                    type="text"
                    className="input-field"
                    defaultValue="app.kylo.ai" />
                  
                    <button className="btn-secondary">Verify</button>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-navy-800 flex justify-end">
                <button className="btn-primary">Save Changes</button>
              </div>
            </div>
          }

          {activeTab === 'ai' &&
          <div className="bento-card space-y-5">
              <div className="flex justify-between items-center border-b border-gray-100 dark:border-navy-700 pb-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  AI Providers
                </h2>
                <button className="btn-secondary text-sm">Add Provider</button>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 border border-gray-200 dark:border-navy-700 rounded-xl bg-gray-50 dark:bg-navy-950">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-emerald-100 dark:bg-cyan-900/30 rounded-lg flex items-center justify-center text-emerald-600 dark:text-cyan-400 font-bold">
                        O
                      </div>
                      <span className="font-bold text-gray-900 dark:text-white">
                        OpenAI
                      </span>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-mint-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                      Active (Default)
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                        API Key
                      </label>
                      <input
                      type="password"
                      value="sk-1234567890abcdef"
                      readOnly
                      className="w-full bg-transparent border-b border-gray-200 dark:border-navy-700 py-1 text-sm text-gray-900 dark:text-white outline-none" />
                    
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                        Default Model
                      </label>
                      <select className="w-full bg-transparent border-b border-gray-200 dark:border-navy-700 py-1 text-sm text-gray-900 dark:text-white outline-none">
                        <option>gpt-4-turbo</option>
                        <option>gpt-3.5-turbo</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 border border-gray-200 dark:border-navy-700 rounded-xl bg-gray-50 dark:bg-navy-950 opacity-60">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold">
                        A
                      </div>
                      <span className="font-bold text-gray-900 dark:text-white">
                        Anthropic
                      </span>
                    </div>
                    <button className="text-xs font-bold text-emerald-600 dark:text-cyan-400 hover:underline">
                      Configure
                    </button>
                  </div>
                </div>
              </div>
            </div>
          }

          {['security', 'api', 'email'].includes(activeTab) &&
          <div className="bento-card flex flex-col items-center justify-center py-14 text-center">
              <div className="w-14 h-14 bg-gray-100 dark:bg-navy-800 rounded-full flex items-center justify-center mb-4">
                <Settings2 className="w-7 h-7 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 capitalize">
                {activeTab} Settings
              </h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                This configuration section is available in the full platform
                deployment.
              </p>
            </div>
          }
        </div>
      </div>
    </div>);

}