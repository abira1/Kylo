/**
 * CRM Integration Panel Component
 *
 * Allows users to manage CRM connections (Zoho, HubSpot, etc.)
 * Displays connection status, handles OAuth flow, and manages sync operations.
 *
 * Fully responsive & accessible: modals close on backdrop click / Escape,
 * stack gracefully on mobile, and provide clear loading & error feedback.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle,
  Zap,
  RefreshCw,
  X,
  Loader,
  Plug,
  Globe,
} from 'lucide-react';
import * as crmService from '../services/crmService';

interface CrmProvider {
  id: string;
  name: string;
  logo: string;
  description: string;
  supported: boolean;
}

const AVAILABLE_PROVIDERS: CrmProvider[] = [
  {
    id: 'zoho',
    name: 'Zoho CRM',
    logo: '🔶',
    description: 'Sync leads & contacts with your Zoho CRM',
    supported: true,
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    logo: '🧡',
    description: 'Coming soon',
    supported: false,
  },
  {
    id: 'pipedrive',
    name: 'Pipedrive',
    logo: '💚',
    description: 'Coming soon',
    supported: false,
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    logo: '🔵',
    description: 'Coming soon',
    supported: false,
  },
];

const ZOHO_REGIONS = [
  { label: 'United States', value: '.com', flag: '🇺🇸' },
  { label: 'Europe', value: '.eu', flag: '🇪🇺' },
  { label: 'India', value: '.in', flag: '🇮🇳' },
  { label: 'Australia', value: '.com.au', flag: '🇦🇺' },
  { label: 'Japan', value: '.jp', flag: '🇯🇵' },
  { label: 'Canada', value: '.ca', flag: '🇨🇦' },
  { label: 'Germany', value: '.de', flag: '🇩🇪' },
  { label: 'France', value: '.fr', flag: '🇫🇷' },
  { label: 'United Kingdom', value: '.uk', flag: '🇬🇧' },
];

interface ConnectionState {
  connected: boolean;
  provider: string | null;
  status: 'connected' | 'error' | 'pending' | 'disconnected';
  region?: string;
  lastSync?: string;
  errorMessage?: string;
}

export function CrmIntegrationPanel() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionState>({
    connected: false,
    provider: null,
    status: 'disconnected',
  });

  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showRegionSelect, setShowRegionSelect] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [showConnectingState, setShowConnectingState] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadConnectionStatus = useCallback(async () => {
    try {
      setLoading(true);
      const status = await crmService.getConnectionStatus();
      setConnectionStatus(status);
    } catch (err) {
      console.error('Failed to load connection status:', err);
      setConnectionStatus({
        connected: false,
        provider: null,
        status: 'disconnected',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Load connection status on mount + handle OAuth callback query params
  useEffect(() => {
    loadConnectionStatus();

    const params = new URLSearchParams(window.location.search);

    if (params.get('status') === 'connected') {
      setSuccess('CRM connected successfully! 🎉');
      // Clean the URL so a refresh doesn't repeat the toast
      window.history.replaceState({}, document.title, window.location.pathname);
      setTimeout(() => setSuccess(null), 5000);
    }

    const errParam = params.get('error');
    if (errParam) {
      setError(decodeURIComponent(errParam));
      window.history.replaceState({}, document.title, window.location.pathname);
      setTimeout(() => setError(null), 6000);
    }
  }, [loadConnectionStatus]);

  // Close modals on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowRegionSelect(false);
        setShowDisconnectConfirm(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleConnectClick = (provider: string) => {
    setSelectedProvider(provider);
    if (provider === 'zoho') {
      setShowRegionSelect(true);
    } else {
      setError(`${provider} is not yet supported`);
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleRegionSelect = async (region: string) => {
    try {
      setShowRegionSelect(false);
      setShowConnectingState(true);
      // Redirects the browser to the provider's OAuth screen
      await crmService.initiateOAuth(selectedProvider || 'zoho', region);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect');
      setShowConnectingState(false);
      setShowRegionSelect(true);
    }
  };

  const handleDisconnect = async () => {
    try {
      setDisconnecting(true);
      await crmService.disconnectCRM();
      setConnectionStatus({
        connected: false,
        provider: null,
        status: 'disconnected',
      });
      setShowDisconnectConfirm(false);
      setSuccess('CRM disconnected.');
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect');
      setShowDisconnectConfirm(false);
    } finally {
      setDisconnecting(false);
    }
  };

  const handleManualSync = async () => {
    try {
      setSyncing(true);
      const result = await crmService.syncLeads();
      setConnectionStatus((prev) => ({
        ...prev,
        lastSync: new Date().toISOString(),
      }));
      setSuccess(
        `Synced ${result.synced} lead${result.synced === 1 ? '' : 's'} from ${result.provider}.`
      );
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const regionLabel = (value?: string) =>
    ZOHO_REGIONS.find((r) => r.value === value)?.label || value || '—';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader className="h-7 w-7 animate-spin text-cyan-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toasts */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" />
            <p className="text-sm text-red-700 dark:text-red-300 break-words">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-600"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20"
          >
            <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400" />
            <p className="text-sm text-green-700 dark:text-green-300 break-words">{success}</p>
            <button
              onClick={() => setSuccess(null)}
              className="ml-auto text-green-400 hover:text-green-600"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Current Connection Status */}
      {connectionStatus.connected && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-green-200 bg-green-50 p-5 dark:border-green-800 dark:bg-green-900/20"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <CheckCircle className="mt-0.5 h-6 w-6 flex-shrink-0 text-green-600 dark:text-green-400" />
              <div className="min-w-0">
                <h4 className="font-bold text-green-900 dark:text-green-100">
                  {connectionStatus.provider?.toUpperCase()} Connected
                </h4>
                <p className="mt-1 text-sm text-green-700 dark:text-green-300">
                  Region: <span className="font-medium">{regionLabel(connectionStatus.region)}</span>
                </p>
                {connectionStatus.lastSync && (
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Last synced: {new Date(connectionStatus.lastSync).toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-shrink-0 gap-2">
              <button
                onClick={handleManualSync}
                disabled={syncing}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50 sm:flex-none"
              >
                {syncing ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    Syncing…
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Sync Now
                  </>
                )}
              </button>

              <button
                onClick={() => setShowDisconnectConfirm(true)}
                className="inline-flex flex-1 items-center justify-center rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 dark:border-red-800 dark:bg-transparent dark:text-red-400 dark:hover:bg-red-900/20 sm:flex-none"
              >
                Disconnect
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Available CRMs */}
      <div className="space-y-3">
        <h3 className="flex items-center gap-2 text-base font-bold text-gray-900 dark:text-white">
          <Zap className="h-5 w-5 text-cyan-500" />
          Available Integrations
        </h3>

        <div className="grid grid-cols-1 gap-3">
          {AVAILABLE_PROVIDERS.map((provider) => {
            const isThisConnected =
              connectionStatus.connected && connectionStatus.provider === provider.id;

            return (
              <div
                key={provider.id}
                className="rounded-2xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-sm dark:border-navy-700 dark:bg-navy-800/50"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="text-2xl">{provider.logo}</div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {provider.name}
                      </h4>
                      <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                        {provider.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    {isThisConnected ? (
                      <span className="inline-flex items-center gap-1.5 rounded-xl bg-green-100 px-4 py-2 text-sm font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        <CheckCircle className="h-4 w-4" /> Connected
                      </span>
                    ) : provider.supported ? (
                      <button
                        onClick={() => handleConnectClick(provider.id)}
                        disabled={connectionStatus.connected}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                      >
                        <Plug className="h-4 w-4" />
                        Connect
                      </button>
                    ) : (
                      <span className="inline-flex items-center rounded-xl bg-gray-100 px-4 py-2 text-sm font-medium text-gray-500 dark:bg-navy-700 dark:text-gray-400">
                        Coming Soon
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Info Box */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <strong>💡 Tip:</strong> Once connected, your CRM leads appear automatically in your Lead
          Inbox. Use <strong>Sync Now</strong> anytime to pull the latest.
        </p>
      </div>

      {/* ---------- Modals ---------- */}

      {/* Region Selector Modal */}
      <AnimatePresence>
        {showRegionSelect && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={() => setShowRegionSelect(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-navy-800"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-cyan-500" />
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Select your Zoho region
                  </h3>
                </div>
                <button
                  onClick={() => setShowRegionSelect(false)}
                  className="text-gray-400 transition-colors hover:text-gray-700 dark:hover:text-gray-200"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                Choose the data center where your Zoho account is hosted.
              </p>

              <div className="grid max-h-72 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
                {ZOHO_REGIONS.map((region) => (
                  <button
                    key={region.value}
                    onClick={() => handleRegionSelect(region.value)}
                    className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700 transition-colors hover:border-cyan-400 hover:bg-cyan-50 dark:border-navy-700 dark:text-gray-200 dark:hover:border-cyan-500 dark:hover:bg-navy-700"
                  >
                    <span className="text-lg">{region.flag}</span>
                    <span className="truncate">{region.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Disconnect Confirmation Modal */}
      <AnimatePresence>
        {showDisconnectConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={() => setShowDisconnectConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-navy-800"
            >
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Disconnect CRM?</h3>
              </div>
              <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
                This will remove the connection and stop syncing leads. You can reconnect anytime.
              </p>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  onClick={() => setShowDisconnectConfirm(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-navy-700 dark:text-gray-200 dark:hover:bg-navy-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                >
                  {disconnecting ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" /> Disconnecting…
                    </>
                  ) : (
                    'Disconnect'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Connecting Overlay */}
      <AnimatePresence>
        {showConnectingState && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          >
            <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-2xl dark:bg-navy-800">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                className="mx-auto mb-4 w-fit"
              >
                <Loader className="h-12 w-12 text-cyan-600" />
              </motion.div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Redirecting to Zoho…
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                You'll be sent to Zoho to authorize access. This only takes a few seconds.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
