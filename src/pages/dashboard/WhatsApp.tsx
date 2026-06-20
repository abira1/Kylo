import React, { useState, useCallback } from 'react';
import {
  Smartphone,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Settings2,
  MessageCircle } from
'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useRealtimeData } from '../../hooks/useData';
import { subscribeToWhatsAppMetrics, WhatsAppMetrics } from '../../services/dataService';

export function WhatsApp() {
  const { user, loading: authLoading } = useAuth();
  const [isConnected, setIsConnected] = useState(true);
  const [savedSettings, setSavedSettings] = useState(false);

  const subscribe = useCallback((cb: (data: WhatsAppMetrics) => void) => {
    if (user?.uid) {
      return subscribeToWhatsAppMetrics(user.uid, cb);
    }
    cb({
      messagesCount: 0,
      resolutionRate: 0,
      responseTime: '---',
      quotaUsed: 0,
      qualityRating: 'Unknown'
    });
    return () => {};
  }, [user?.uid]);

  const { data: metrics, loading: metricsLoading } = useRealtimeData<WhatsAppMetrics>(
    subscribe,
    {
      messagesCount: 0,
      resolutionRate: 0,
      responseTime: '---',
      quotaUsed: 0,
      qualityRating: 'Unknown'
    }
  );

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  const handleSaveSettings = () => {
    setSavedSettings(true);
    setTimeout(() => setSavedSettings(false), 2000);
  };

  // Use Firebase data if available, otherwise show placeholders
  const messagesCount = metrics?.messagesCount || 0;
  const resolutionRate = metrics?.resolutionRate || 0;
  const responseTime = metrics?.responseTime || '---';
  const quotaUsed = metrics?.quotaUsed || 0;
  const qualityRating = metrics?.qualityRating || 'Unknown';

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            WhatsApp Integration
          </h1>
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            Connect your WhatsApp Business API to automate conversations.
          </p>
        </div>
        {isConnected && (
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-mint-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-sm font-bold shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Connected
          </div>
        )}
      </div>

      {!isConnected ? (
        <div className="bento-card text-center py-24 max-w-3xl mx-auto">
          <div className="w-24 h-24 bg-mint-100 dark:bg-emerald-900/30 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
            <MessageCircle className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Connect WhatsApp Business
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-10 max-w-lg mx-auto leading-relaxed">
            Link your WhatsApp Business account to let your AI handle customer
            inquiries, capture leads, and provide 24/7 support directly on
            WhatsApp.
          </p>
          <button
            onClick={() => setIsConnected(true)}
            className="btn-primary mx-auto text-lg px-10 py-4">
            Connect Account
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Stats */}
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bento-card bg-gradient-to-br from-mint-50 to-white dark:from-navy-800 dark:to-navy-900">
              <div className="text-emerald-600 dark:text-emerald-400 mb-4">
                <MessageCircle size={32} />
              </div>
              <div className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2">
                {metricsLoading ? '...' : messagesCount.toLocaleString()}
              </div>
              <div className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Messages Sent (This Month)
              </div>
            </div>
            <div className="bento-card">
              <div className="text-turquoise-500 dark:text-cyan-400 mb-4">
                <CheckCircle2 size={32} />
              </div>
              <div className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2">
                {metricsLoading ? '...' : `${resolutionRate}%`}
              </div>
              <div className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Automated Resolution Rate
              </div>
            </div>
            <div className="bento-card">
              <div className="text-cyan-500 dark:text-electric-400 mb-4">
                <BarChart3 size={32} />
              </div>
              <div className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2">
                {metricsLoading ? '...' : responseTime}
              </div>
              <div className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Average Response Time
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="lg:col-span-2 bento-card space-y-6">
            <div className="flex items-center gap-3 border-b border-gray-100 dark:border-navy-800 pb-4">
              <Settings2 className="text-gray-400" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Automation Settings
              </h2>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    AI Auto-Reply
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Let AI handle incoming messages automatically
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    defaultChecked
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-navy-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-mint-500 dark:peer-checked:bg-cyan-500"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    Human Handoff
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Transfer to human agent when AI cannot resolve
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    defaultChecked
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-navy-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-mint-500 dark:peer-checked:bg-cyan-500"></div>
                </label>
              </div>

              <div>
                <label className="label-text">Business Phone Number</label>
                <input
                  type="text"
                  className="input-field bg-gray-100 dark:bg-navy-900 text-gray-500"
                  value="+1 (555) 123-4567"
                  disabled
                />
              </div>

              <div>
                <label className="label-text">Welcome Message Template</label>
                <textarea
                  className="input-field min-h-[100px]"
                  defaultValue="Hi there! 👋 I'm the AI assistant for Nexus. How can I help you today?"
                />
              </div>

              <button
                onClick={handleSaveSettings}
                className="btn-primary">
                {savedSettings ? 'Changes Saved! ✓' : 'Save Changes'}
              </button>
            </div>
          </div>

          {/* Status/Info */}
          <div className="bento-card space-y-6 h-fit">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-navy-800 pb-4">
              Connection Status
            </h2>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800/30 flex gap-3">
              <AlertCircle
                className="text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5"
                size={20}
              />
              <div className="text-sm text-blue-800 dark:text-blue-300">
                Your WhatsApp Business API is active and receiving messages. You
                have used {quotaUsed}% of your monthly message quota.
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">
                  Account ID
                </span>
                <span className="font-mono text-gray-900 dark:text-white">
                  wa_8f7d6c5b
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">
                  Quality Rating
                </span>
                <span className={`font-medium ${
                  qualityRating === 'High' ? 'text-emerald-600 dark:text-emerald-400' :
                  qualityRating === 'Medium' ? 'text-yellow-600 dark:text-yellow-400' :
                  'text-red-600 dark:text-red-400'
                }`}>
                  {qualityRating}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">
                  Messaging Limit
                </span>
                <span className="text-gray-900 dark:text-white">
                  10K / 24hrs
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}