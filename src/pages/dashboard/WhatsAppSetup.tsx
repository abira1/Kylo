import React, { useState, useCallback } from 'react';
import {
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Copy,
  Eye,
  EyeOff,
  Loader,
  Shield,
  Book,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useRealtimeData } from '../../hooks/useData';
import { subscribeToWhatsAppConfig, WhatsAppConfig } from '../../services/dataService';

export function WhatsAppSetup() {
  const { user, loading: authLoading } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [showAccess, setShowAccess] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    phoneNumberId: '',
    businessAccountId: '',
    webhookVerifyToken: '',
    apiAccessToken: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');

  // Subscribe to saved WhatsApp config
  const subscribe = useCallback((cb: (data: WhatsAppConfig | null) => void) => {
    if (user?.uid) {
      return subscribeToWhatsAppConfig(user.uid, cb);
    }
    cb(null);
    return () => {};
  }, [user?.uid]);

  const { data: savedConfig } = useRealtimeData<WhatsAppConfig | null>(
    subscribe,
    null
  );

  // Populate form with saved config
  React.useEffect(() => {
    if (savedConfig) {
      setFormData({
        phoneNumberId: savedConfig.phoneNumberId || '',
        businessAccountId: savedConfig.businessAccountId || '',
        webhookVerifyToken: savedConfig.webhookVerifyToken || '',
        apiAccessToken: savedConfig.apiAccessToken || '',
      });
      setIsConnected(savedConfig.isConnected || false);
    }
  }, [savedConfig]);

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

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.phoneNumberId.trim()) newErrors.phoneNumberId = 'Phone Number ID required';
    if (!formData.businessAccountId.trim()) newErrors.businessAccountId = 'Business Account ID required';
    if (!formData.webhookVerifyToken.trim()) newErrors.webhookVerifyToken = 'Webhook Verify Token required';
    if (!formData.apiAccessToken.trim()) newErrors.apiAccessToken = 'API Access Token required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/whatsapp/config/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: user?.uid,
          ...formData,
        }),
      });

      if (!response.ok) throw new Error('Failed to save configuration');

      setSavedMessage('✅ WhatsApp configuration saved successfully!');
      setTimeout(() => setSavedMessage(''), 3000);
    } catch (error) {
      setSavedMessage('❌ ' + (error instanceof Error ? error.message : 'Failed to save'));
      setTimeout(() => setSavedMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!validateForm()) return;

    setIsTesting(true);
    try {
      const response = await fetch('/api/whatsapp/config/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: user?.uid,
          ...formData,
        }),
      });

      if (!response.ok) throw new Error('Connection test failed');

      setIsConnected(true);
      setSavedMessage('✅ WhatsApp connection verified!');
      setTimeout(() => setSavedMessage(''), 3000);
    } catch (error) {
      setSavedMessage('❌ ' + (error instanceof Error ? error.message : 'Connection failed'));
      setIsConnected(false);
      setTimeout(() => setSavedMessage(''), 3000);
    } finally {
      setIsTesting(false);
    }
  };

  const webhookUrl = `https://kylo-support.web.app/api/webhooks/whatsapp/${user?.uid}`;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            WhatsApp Business Integration
          </h1>
          <p className="text-gray-600 dark:text-gray-400 font-medium mt-2">
            Connect your WhatsApp Business Account to enable your AI agent on WhatsApp
          </p>
        </div>
        {isConnected && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-semibold">
            <CheckCircle2 size={16} />
            Connected
          </div>
        )}
      </div>

      {/* Status Message */}
      {savedMessage && (
        <div className={`p-4 rounded-lg text-sm font-medium ${
          savedMessage.startsWith('✅')
            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
        }`}>
          {savedMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Setup Instructions */}
        <div className="lg:col-span-1">
          <div className="bento-card p-6 h-full">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Book size={20} className="text-emerald-500" />
              Setup Guide
            </h2>
            <div className="space-y-4 text-sm">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Step 1: Create Business Account</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Go to <a href="https://business.facebook.com" target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:underline">business.facebook.com</a> and create a WhatsApp Business Account
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Step 2: Get API Credentials</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Find your Phone Number ID, Business Account ID, and generate an API Access Token in App Settings
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Step 3: Configure Webhook</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Set the webhook URL below in your Meta app settings
                </p>
              </div>
              <div className="pt-4 border-t border-gray-200 dark:border-navy-700">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Webhook URL</h3>
                <div className="flex gap-2 items-center">
                  <code className="text-xs bg-gray-100 dark:bg-navy-900 p-2 rounded flex-1 break-all">
                    {webhookUrl}
                  </code>
                  <button
                    onClick={() => handleCopy(webhookUrl, 'webhook')}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-navy-700 rounded"
                  >
                    {copied === 'webhook' ? (
                      <CheckCircle2 size={16} className="text-emerald-500" />
                    ) : (
                      <Copy size={16} className="text-gray-500" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Configuration Form */}
        <div className="lg:col-span-2">
          <div className="bento-card p-6 space-y-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Shield size={20} className="text-emerald-500" />
              API Credentials
            </h2>

            {/* Phone Number ID */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Phone Number ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g., 1234567890123456"
                value={formData.phoneNumberId}
                onChange={(e) => setFormData({ ...formData, phoneNumberId: e.target.value })}
                className={`w-full input-field ${errors.phoneNumberId ? 'border-red-500' : ''}`}
              />
              {errors.phoneNumberId && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.phoneNumberId}
                </p>
              )}
            </div>

            {/* Business Account ID */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Business Account ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g., 9876543210"
                value={formData.businessAccountId}
                onChange={(e) => setFormData({ ...formData, businessAccountId: e.target.value })}
                className={`w-full input-field ${errors.businessAccountId ? 'border-red-500' : ''}`}
              />
              {errors.businessAccountId && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.businessAccountId}
                </p>
              )}
            </div>

            {/* Webhook Verify Token */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Webhook Verify Token <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showToken ? 'text' : 'password'}
                  placeholder="Create a secure token (e.g., your_secret_token)"
                  value={formData.webhookVerifyToken}
                  onChange={(e) => setFormData({ ...formData, webhookVerifyToken: e.target.value })}
                  className={`w-full input-field ${errors.webhookVerifyToken ? 'border-red-500' : ''}`}
                />
                <button
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showToken ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.webhookVerifyToken && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.webhookVerifyToken}
                </p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Set this same token in Meta App webhook settings
              </p>
            </div>

            {/* API Access Token */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                API Access Token <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showAccess ? 'text' : 'password'}
                  placeholder="Paste your Meta API Access Token"
                  value={formData.apiAccessToken}
                  onChange={(e) => setFormData({ ...formData, apiAccessToken: e.target.value })}
                  className={`w-full input-field ${errors.apiAccessToken ? 'border-red-500' : ''}`}
                />
                <button
                  onClick={() => setShowAccess(!showAccess)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showAccess ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.apiAccessToken && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.apiAccessToken}
                </p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                🔐 Never share this token. It's encrypted in our database.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleTestConnection}
                disabled={loading || isTesting}
                className="flex-1 btn-secondary flex items-center justify-center gap-2"
              >
                {isTesting ? <Loader size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                {isTesting ? 'Testing...' : 'Test Connection'}
              </button>
              <button
                onClick={handleSave}
                disabled={loading || isTesting}
                className="flex-1 btn-primary flex items-center justify-center gap-2"
              >
                {loading ? <Loader size={16} className="animate-spin" /> : <Shield size={16} />}
                {loading ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp Agent Status */}
      {isConnected && (
        <div className="bento-card p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Smartphone size={20} className="text-emerald-500" />
            WhatsApp Agent Status
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">Active</p>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Messages Today</p>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">0</p>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Sessions</p>
              <p className="text-xl font-bold text-purple-600 dark:text-purple-400 mt-1">0</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
            Your AI agent is now connected to WhatsApp. Clients can start messaging you on WhatsApp, and your agent will respond with the same training and behavior as your embedded chatbox.
          </p>
        </div>
      )}
    </div>
  );
}
