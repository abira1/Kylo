/**
 * DEPRECATED: Mock Data
 * 
 * This file has been deprecated in favor of Firebase Realtime Database.
 * All data should now be fetched from Firebase using the services in:
 * - src/firebase/database.ts
 * - src/services/dataService.ts
 * 
 * Instead of importing from this file, use:
 * 
 * import { subscribeToLeads, subscribeToChartData } from '../../services/dataService';
 * import { useRealtimeData } from '../../hooks/useData';
 * 
 * const { data: leads } = useRealtimeData(
 *   (cb) => subscribeToLeads(clientId, cb),
 *   []
 * );
 */

// Kept for backward compatibility - DO NOT USE
export const MOCK_CHART_DATA = [
  { name: 'Mon', visitors: 4000, interactions: 2400, leads: 240 },
  { name: 'Tue', visitors: 3000, interactions: 1398, leads: 210 },
  { name: 'Wed', visitors: 2000, interactions: 9800, leads: 290 },
  { name: 'Thu', visitors: 2780, interactions: 3908, leads: 310 },
  { name: 'Fri', visitors: 1890, interactions: 4800, leads: 180 },
  { name: 'Sat', visitors: 2390, interactions: 3800, leads: 250 },
  { name: 'Sun', visitors: 3490, interactions: 4300, leads: 320 },
];

export const MOCK_REVENUE_DATA = [
  { month: 'Jan', revenue: 4000, expenses: 2400 },
  { month: 'Feb', revenue: 5000, expenses: 2398 },
  { month: 'Mar', revenue: 6500, expenses: 2800 },
  { month: 'Apr', revenue: 8200, expenses: 3908 },
  { month: 'May', revenue: 9800, expenses: 4800 },
  { month: 'Jun', revenue: 12500, expenses: 3800 },
];

export const MOCK_LEADS = [];

export const MOCK_CONVERSATIONS = [];

export const MOCK_INVOICES = [];

export const MOCK_TRAINING_FILES = [];