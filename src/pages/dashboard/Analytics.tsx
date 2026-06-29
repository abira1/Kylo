import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell } from
'recharts';
import { RefreshCw } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useRealtimeData } from '../../hooks/useData';
import { subscribeToChartData, ChartDataPoint } from '../../services/dataService';
import { getConnectionStatus, fetchLeads as fetchCrmLeads } from '../../services/crmService';

const COLORS = ['#22C55E', '#38BDF8', '#475569', '#F59E0B', '#8B5CF6'];

// ---- Realtime CRM (Zoho) analytics helpers --------------------------------

interface CrmAnalyticsLead {
  status?: string;
  businessType?: string;
  lastModified?: string;
}

// Group normalized lead statuses into 4 display buckets
const STATUS_BUCKETS: { name: string; match: string[]; color: string; bgColor: string }[] = [
  { name: 'New', match: ['new'], color: '#3B82F6', bgColor: '#DBEAFE' },
  { name: 'In Progress', match: ['contacted', 'qualified'], color: '#8B5CF6', bgColor: '#EDE9FE' },
  { name: 'Won', match: ['won'], color: '#10B981', bgColor: '#D1FAE5' },
  { name: 'Lost', match: ['lost'], color: '#EF4444', bgColor: '#FEE2E2' }
];

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getWindowDays(timeframe: string): number {
  if (timeframe === 'Last 90 Days') return 90;
  if (timeframe === 'Year to Date') {
    const start = new Date(new Date().getFullYear(), 0, 1).getTime();
    return Math.max(1, Math.ceil((Date.now() - start) / 86400000) + 1);
  }
  return 30;
}

function buildStatusData(leads: CrmAnalyticsLead[]) {
  return STATUS_BUCKETS.map((bucket) => ({
    name: bucket.name,
    count: leads.filter((l) => bucket.match.includes((l.status || '').toLowerCase())).length,
    color: bucket.color,
    bgColor: bucket.bgColor
  }));
}

function buildTrendData(leads: CrmAnalyticsLead[], timeframe: string): { name: string; leads: number }[] {
  const days = getWindowDays(timeframe);
  const granularity: 'day' | 'week' | 'month' = days <= 31 ? 'day' : days <= 92 ? 'week' : 'month';

  const now = new Date();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(now.getDate() - (days - 1));

  const keyFor = (d: Date) => {
    if (granularity === 'day') return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (granularity === 'week') {
      const ws = new Date(d);
      ws.setHours(0, 0, 0, 0);
      ws.setDate(d.getDate() - d.getDay());
      return `${ws.getFullYear()}-${ws.getMonth()}-${ws.getDate()}`;
    }
    return `${d.getFullYear()}-${d.getMonth()}`;
  };
  const labelFor = (d: Date) => {
    if (granularity === 'month') return MONTH_NAMES[d.getMonth()];
    return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;
  };

  const buckets: { name: string; leads: number }[] = [];
  const indexByKey = new Map<string, number>();
  const cursor = new Date(start);
  while (cursor <= now) {
    const key = keyFor(cursor);
    if (!indexByKey.has(key)) {
      indexByKey.set(key, buckets.length);
      buckets.push({ name: labelFor(cursor), leads: 0 });
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  for (const lead of leads) {
    if (!lead.lastModified) continue;
    const d = new Date(lead.lastModified);
    if (isNaN(d.getTime()) || d < start) continue;
    const idx = indexByKey.get(keyFor(d));
    if (idx !== undefined) buckets[idx].leads += 1;
  }

  return buckets;
}

function buildSourceData(leads: CrmAnalyticsLead[]): { name: string; value: number }[] {
  const counts: Record<string, number> = {};
  for (const l of leads) {
    const bt = (l.businessType || '').toLowerCase();
    let src = 'Other';
    if (bt.includes('whatsapp')) src = 'WhatsApp';
    else if (bt.includes('instagram')) src = 'Instagram';
    else if (bt.includes('facebook') || bt.includes('messenger')) src = 'Facebook';
    else if (bt.includes('web') || bt.includes('kylo')) src = 'Website';
    counts[src] = (counts[src] || 0) + 1;
  }
  const total = leads.length || 1;
  return Object.entries(counts)
    .map(([name, count]) => ({ name, value: Math.round((count / total) * 100), count }))
    .sort((a, b) => b.count - a.count)
    .map(({ name, value }) => ({ name, value }));
}

export function Analytics() {
  const { user, loading: authLoading } = useAuth();
  const [timeframe, setTimeframe] = useState('Last 30 Days');
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  // ---- Realtime CRM (Zoho) state ----
  const [crmConnected, setCrmConnected] = useState(false);
  const [crmProvider, setCrmProvider] = useState<string | null>(null);
  const [crmLeads, setCrmLeads] = useState<CrmAnalyticsLead[]>([]);
  const [crmLoading, setCrmLoading] = useState(false);

  const subscribe = useCallback((cb: (data: ChartDataPoint[]) => void) => {
    if (user?.uid) {
      return subscribeToChartData(user.uid, cb);
    }
    cb([]);
    return () => {};
  }, [user?.uid]);

  const { data: chartData, loading: dataLoading } = useRealtimeData<ChartDataPoint[]>(
    subscribe,
    []
  );

  // Load Zoho leads (manual — triggered on mount and via the Refresh button)
  const loadCrmLeads = useCallback(async (showSpinner: boolean) => {
    if (!user?.uid) return;
    try {
      const status = await getConnectionStatus();
      const hasCrm = !!status?.provider && status?.status !== 'disconnected';
      setCrmConnected(hasCrm);
      setCrmProvider(hasCrm ? status.provider : null);

      if (hasCrm) {
        if (showSpinner) setCrmLoading(true);
        const leads = await fetchCrmLeads(1, 200);
        setCrmLeads(Array.isArray(leads) ? (leads as CrmAnalyticsLead[]) : []);
      }
    } catch (err) {
      console.error('[ANALYTICS] Failed to load CRM analytics:', err);
      // Keep last known data; do not wipe the dashboard on a transient error
    } finally {
      if (showSpinner) setCrmLoading(false);
    }
  }, [user?.uid]);

  // Initial load only — no auto-polling (refresh is manual)
  useEffect(() => {
    loadCrmLeads(true);
  }, [loadCrmLeads]);

  // Derived analytics from Zoho leads (recomputed as leads/timeframe change)
  const crmStatusData = useMemo(() => buildStatusData(crmLeads), [crmLeads]);
  const crmTrendData = useMemo(() => buildTrendData(crmLeads, timeframe), [crmLeads, timeframe]);
  const crmSourceData = useMemo(() => buildSourceData(crmLeads), [crmLeads]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  // Active data sources: live Zoho when connected, otherwise empty (new accounts start clean)
  const statusData = crmConnected ? crmStatusData : buildStatusData([]);
  const trendData = crmConnected ? crmTrendData : chartData;
  const sourceData = crmConnected ? crmSourceData : [];
  const trendLoading = crmConnected ? crmLoading : dataLoading;

  // Calculate stats from the active data source
  const totalLeads = crmConnected
    ? crmLeads.length
    : (Array.isArray(chartData) ? chartData.reduce((sum, item) => sum + item.leads, 0) : 0);
  const windowDays = getWindowDays(timeframe);
  const avgLeads = crmConnected
    ? Math.round(totalLeads / windowDays)
    : (chartData.length > 0 ? Math.round(totalLeads / chartData.length) : 0);
  const wonLeads = crmLeads.filter((l) => (l.status || '').toLowerCase() === 'won').length;
  const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 1000) / 10 : 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Analytics
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            {crmConnected
              ? `Insights from your ${(crmProvider || 'CRM').toUpperCase()} leads.`
              : "Deep dive into your AI's performance and lead generation."}
          </p>
          {crmConnected && (
            <span className="inline-flex items-center gap-1.5 mt-1.5 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Synced from {(crmProvider || 'CRM').toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {crmConnected && (
            <button
              onClick={() => loadCrmLeads(true)}
              disabled={crmLoading}
              className="inline-flex items-center gap-2 bg-white dark:bg-navy-800 rounded-xl px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-soft dark:shadow-soft-dark outline-none hover:opacity-90 disabled:opacity-60">
              <RefreshCw size={15} className={crmLoading ? 'animate-spin' : ''} />
              Refresh
            </button>
          )}
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="bg-white dark:bg-navy-800 border-none rounded-xl px-4 py-2 text-sm text-gray-700 dark:text-gray-300 outline-none shadow-soft dark:shadow-soft-dark font-medium flex-1 sm:flex-none">
            <option>Last 30 Days</option>
            <option>Last 90 Days</option>
            <option>Year to Date</option>
          </select>
        </div>
      </div>

      {/* Row 1: Lead Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {statusData.map((status) => {
          const total = statusData.reduce((sum, s) => sum + s.count, 0);
          const percentage = total > 0 ? ((status.count / total) * 100).toFixed(1) : '0.0';
          return (
            <div
              key={status.name}
              onClick={() => setSelectedStatus(selectedStatus === status.name ? null : status.name)}
              className={`bento-card flex flex-col p-4 sm:p-5 transition-all cursor-pointer group hover:shadow-lg ${
                selectedStatus === status.name
                  ? 'ring-2'
                  : ''
              }`}
              style={{
                borderColor: selectedStatus === status.name ? status.color : 'transparent',
                backgroundColor: selectedStatus === status.name ? status.bgColor + '15' : 'transparent'
              }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full shadow-sm group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: status.color }}
                  ></div>
                  <span className="font-bold text-sm sm:text-base text-gray-900 dark:text-white">
                    {status.name}
                  </span>
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">
                {status.count}
              </div>
              <div className="w-full rounded-full h-1.5 overflow-hidden bg-gray-200 dark:bg-navy-700 mb-2">
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: status.color
                  }}
                ></div>
              </div>
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {percentage}% of total
              </div>
            </div>
          );
        })}
      </div>

      {/* Row 2: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        {/* Lead Generation Chart */}
        <div className="bento-card">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5">
            Lead Generation Trend
          </h2>
          <div className="h-64 sm:h-80">
            {trendLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Loading chart...</p>
                </div>
              </div>
            ) : trendData.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500 dark:text-gray-400">No data yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={trendData}
                  margin={{
                    top: 10,
                    right: 10,
                    left: -20,
                    bottom: 0
                  }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#334155"
                    opacity={0.1}
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fontSize: 12,
                      fill: '#64748b',
                      fontWeight: 500
                    }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fontSize: 12,
                      fill: '#64748b',
                      fontWeight: 500
                    }}
                  />
                  <Tooltip
                    cursor={{
                      fill: 'rgba(148, 163, 184, 0.05)'
                    }}
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: 'none',
                      borderRadius: '12px',
                      color: '#fff',
                      boxShadow: '0 10px 40px -10px rgba(0,0,0,0.3)'
                    }}
                    itemStyle={{
                      color: '#fff',
                      fontWeight: 500,
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="leads" fill="#22D3EE" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Conversation Sources */}
        <div className="bento-card flex flex-col">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5">
            Lead Sources
          </h2>
          <div className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-0">
            {sourceData.length === 0 ? (
              <div className="flex items-center justify-center h-56 sm:h-64 w-full">
                <p className="text-gray-500 dark:text-gray-400">No data yet</p>
              </div>
            ) : (
            <>
            <div className="h-56 sm:h-64 w-full sm:w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sourceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value">
                    {sourceData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: 'none',
                      borderRadius: '12px',
                      color: '#fff',
                      boxShadow: '0 10px 40px -10px rgba(0,0,0,0.3)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3 sm:space-y-4 w-full sm:w-1/2 flex flex-col justify-center">
              {sourceData.map((item, index) => (
                <div key={item.name} className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full shadow-sm"
                    style={{
                      backgroundColor: COLORS[index % COLORS.length]
                    }}>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900 dark:text-white">
                      {item.name}
                    </div>
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      {item.value}% of total
                    </div>
                  </div>
                </div>
              ))}
            </div>
            </>
            )}
          </div>
        </div>
      </div>
      {/* Row 3: Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="bento-card flex flex-col justify-between">
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">
            Total Leads
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {totalLeads}
          </div>
          <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-mint-100 dark:bg-emerald-900/20 px-2.5 py-1 rounded-full self-start">
            {timeframe}
          </div>
        </div>
        <div className="bento-card flex flex-col justify-between">
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">
            Avg. Per Day
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {avgLeads}
          </div>
          <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-mint-100 dark:bg-emerald-900/20 px-2.5 py-1 rounded-full self-start">
            Based on data
          </div>
        </div>
        <div className="bento-card flex flex-col justify-between">
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">
            {crmConnected ? 'Won' : 'CSAT Score'}
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {crmConnected ? (
              wonLeads
            ) : (
              <>
                0
                <span className="text-sm sm:text-base text-gray-400">/5.0</span>
              </>
            )}
          </div>
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-navy-700 px-2.5 py-1 rounded-full self-start">
            {crmConnected ? 'Closed deals' : 'Based on ratings'}
          </div>
        </div>
        <div className="bento-card flex flex-col justify-between">
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">
            {crmConnected ? 'Conversion Rate' : 'Human Handoff Rate'}
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {crmConnected ? `${conversionRate}%` : '0%'}
          </div>
          <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-mint-100 dark:bg-emerald-900/20 px-2.5 py-1 rounded-full self-start">
            {crmConnected ? 'Won / total leads' : 'Optimal range'}
          </div>
        </div>
      </div>
    </div>
  );
}
