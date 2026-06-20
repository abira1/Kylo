import React, { useState } from 'react';
import { User, Shield, Key, Bell, Building } from 'lucide-react';
export function Settings() {
  const [activeTab, setActiveTab] = useState('account');
  const tabs = [
  {
    id: 'account',
    label: 'Account',
    icon: User
  },
  {
    id: 'team',
    label: 'Team',
    icon: Building
  },
  {
    id: 'security',
    label: 'Security',
    icon: Shield
  },
  {
    id: 'api',
    label: 'API Keys',
    icon: Key
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell
  }];

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400 font-medium">
          Manage your account preferences and platform settings.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-10">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-72 space-y-2 flex-shrink-0">
          {tabs.map((tab) =>
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all text-left ${activeTab === tab.id ? 'bg-mint-100 dark:bg-navy-800 text-emerald-700 dark:text-cyan-400 shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-navy-800/50'}`}>
            
              <tab.icon size={20} />
              {tab.label}
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1">
          {activeTab === 'account' &&
          <div className="bento-card space-y-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-navy-700 pb-6">
                Profile Information
              </h2>

              <div className="flex items-center gap-8 mb-8">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-400 to-turquoise-500 dark:from-cyan-500 dark:to-emerald-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                  S
                </div>
                <div>
                  <button className="btn-secondary text-sm mb-3">
                    Change Avatar
                  </button>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                    JPG, GIF or PNG. Max size of 800K
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="label-text">First Name</label>
                  <input
                  type="text"
                  className="input-field"
                  defaultValue="Sarah" />
                
                </div>
                <div>
                  <label className="label-text">Last Name</label>
                  <input
                  type="text"
                  className="input-field"
                  defaultValue="Jenkins" />
                
                </div>
                <div className="md:col-span-2">
                  <label className="label-text">Email Address</label>
                  <input
                  type="email"
                  className="input-field"
                  defaultValue="sarah@techflow.io" />
                
                </div>
                <div className="md:col-span-2">
                  <label className="label-text">Company Name</label>
                  <input
                  type="text"
                  className="input-field"
                  defaultValue="TechFlow Inc." />
                
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-navy-800 flex justify-end">
                <button className="btn-primary">Save Changes</button>
              </div>
            </div>
          }

          {activeTab === 'api' &&
          <div className="bento-card space-y-6">
              <div className="flex justify-between items-center border-b border-gray-100 dark:border-navy-800 pb-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  API Keys
                </h2>
                <button className="btn-secondary text-sm">
                  Generate New Key
                </button>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400">
                Use these keys to authenticate API requests from your backend.
                Do not share your secret keys in publicly accessible areas.
              </p>

              <div className="space-y-4">
                <div className="p-4 border border-gray-200 dark:border-navy-700 rounded-xl bg-gray-50 dark:bg-navy-950">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-900 dark:text-white text-sm">
                      Production Key
                    </span>
                    <span className="text-xs text-gray-500">
                      Created Oct 12, 2023
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                    type="password"
                    readOnly
                    value="sk_live_51Nx...89ab"
                    className="flex-1 bg-transparent border-none outline-none font-mono text-sm text-gray-600 dark:text-gray-300" />
                  
                    <button className="text-mint-600 dark:text-cyan-400 text-sm font-medium hover:underline">
                      Reveal
                    </button>
                    <button className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-sm font-medium">
                      Copy
                    </button>
                  </div>
                </div>

                <div className="p-4 border border-gray-200 dark:border-navy-700 rounded-xl bg-gray-50 dark:bg-navy-950">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-900 dark:text-white text-sm">
                      Test Key
                    </span>
                    <span className="text-xs text-gray-500">
                      Created Oct 12, 2023
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                    type="text"
                    readOnly
                    value="sk_test_42Mx...12cd"
                    className="flex-1 bg-transparent border-none outline-none font-mono text-sm text-gray-600 dark:text-gray-300" />
                  
                    <button className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-sm font-medium">
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            </div>
          }

          {/* Placeholders for other tabs to keep the file concise but functional */}
          {['team', 'security', 'notifications'].includes(activeTab) &&
          <div className="bento-card flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-navy-800 rounded-full flex items-center justify-center mb-4">
                <Settings2 className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 capitalize">
                {activeTab} Settings
              </h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                This section is available in the full platform. Configure your{' '}
                {activeTab} preferences here.
              </p>
            </div>
          }
        </div>
      </div>
    </div>);

}
// Add missing import for Settings2
import { Settings2 } from 'lucide-react';