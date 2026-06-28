import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  MessageSquare,
  Zap,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useAuth } from '../../hooks/useAuth';
import { useRealtimeData } from '../../hooks/useData';
import * as DataService from '../../services/dataService';
import { getConnectionStatus, fetchLeads as fetchCrmLeads } from '../../services/crmService';

interface HomeCrmLead {
  id: string;
  name?: string;
  businessType?: string;
  status?: string;
}

export function Home() {
  const { user, loading: authLoading } = useAuth();
  const [timeRange, setTimeRange] = useState('7days');

  // ---- Realtime CRM (Zoho) state ----
  const [crmConnected, setCrmConnected] = useState(false);
  const [crmProvider, setCrmProvider] = useState<string | null>(null);
  const [crmLeads, setCrmLeads] = useState<HomeCrmLead[]>([]);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Subscribe to chart data from Firebase
  const { data: chartData = [] } = useRealtimeData(
    (cb) => DataService.subscribeToChartData(user?.uid || '', cb),
    []
  );

  // Subscribe to leads data from Firebase
  const { data: leadsData = [] } = useRealtimeData(
    (cb) => DataService.subscribeToLeads(user?.uid || '', cb),
    []
  );

  // Poll Zoho leads in realtime when a CRM is connected
  useEffect(() => {
    if (!user?.uid) return;
    let cancelled = false;

    const loadCrmLeads = async () => {
      try {
        const status = await getConnectionStatus();
        const hasCrm = !!status?.provider && status?.status !== 'disconnected';
        if (cancelled) return;
        setCrmConnected(hasCrm);
        setCrmProvider(hasCrm ? status.provider : null);
        if (hasCrm) {
          const leads = await fetchCrmLeads(1, 200);
          if (cancelled) return;
          setCrmLeads(Array.isArray(leads) ? (leads as HomeCrmLead[]) : []);
        }
      } catch (err) {
        console.error('[HOME] Failed to load CRM leads:', err);
        // Keep last known data on transient errors
      }
    };

    const scheduleNext = () => {
      pollTimerRef.current = setTimeout(async () => {
        if (cancelled) return;
        await loadCrmLeads();
        scheduleNext();
      }, 20000);
    };

    loadCrmLeads().then(() => {
      if (!cancelled) scheduleNext();
    });

    return () => {
      cancelled = true;
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, [user?.uid]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const displayName = user?.displayName || 'User';

  // Stat metrics: live Zoho data when connected, otherwise Firebase data
  const totalLeads = crmConnected ? crmLeads.length : leadsData.length;
  const qualifiedLeads = crmConnected
    ? crmLeads.filter((l) => (l.status || '').toLowerCase() === 'qualified').length
    : leadsData.filter((l) => l.status === 'Qualified').length;
  const newLeads = crmLeads.filter((l) => (l.status || '').toLowerCase() === 'new').length;
  const wonLeads = crmLeads.filter((l) => (l.status || '').toLowerCase() === 'won').length;
  const avgLeadScore =
    leadsData.length > 0
      ? Math.round(leadsData.reduce((sum, l) => sum + l.score, 0) / leadsData.length)
      : 0;

  // Normalized list for the "Recent Leads" panel
  const recentLeads = crmConnected
    ? crmLeads.slice(0, 4).map((l) => ({
        id: l.id,
        name: l.name || 'Unknown',
        subtitle: l.businessType || '—',
        badge: (l.status || 'new').charAt(0).toUpperCase() + (l.status || 'new').slice(1),
      }))
    : leadsData.slice(0, 4).map((l) => ({
        id: l.id,
        name: l.name,
        subtitle: l.company,
        badge: `Score: ${l.score}`,
      }));

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back, {displayName}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            {crmConnected
              ? `Live lead insights synced from your ${(crmProvider || 'CRM').toUpperCase()}.`
              : "Here's what's happening with your AI assistants today."}
          </p>
        </div>
        <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
          <button className="btn-secondary text-xs sm:text-sm flex-1 sm:flex-none">
            Download Report
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <KPICard
          title="Total Leads"
          value={totalLeads.toString()}
          trend="+12.5%"
          isPositive={true}
          icon={Users}
          color="emerald"
        />

        <KPICard
          title="Qualified Leads"
          value={qualifiedLeads.toString()}
          trend="+5.2%"
          isPositive={true}
          icon={MessageSquare}
          color="turquoise"
        />

        <KPICard
          title={crmConnected ? 'New Leads' : 'Lead Quality Score'}
          value={crmConnected ? newLeads.toString() : `${avgLeadScore}`}
          trend="+2.1%"
          isPositive={true}
          icon={Zap}
          color="cyan"
        />

        <KPICard
          title={crmConnected ? 'Won' : 'Conversations'}
          value={crmConnected ? wonLeads.toString() : '0'}
          trend="+0%"
          isPositive={true}
          icon={crmConnected ? TrendingUp : Clock}
          color="emerald"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Main Chart */}
        <div className="bento-card lg:col-span-2">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Engagement Overview
            </h2>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-gray-50 dark:bg-navy-900 border-none rounded-xl px-3 py-1.5 text-xs sm:text-sm text-gray-700 dark:text-gray-300 outline-none shadow-inner dark:shadow-none"
            >
              <option value="7days">Last 7 days</option>
              <option value="30days">Last 30 days</option>
              <option value="year">This Year</option>
            </select>
          </div>
          <div className="h-56 sm:h-72 w-full">
            {chartData && chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{
                    top: 10,
                    right: 10,
                    left: -20,
                    bottom: 0,
                  }}
                >
                  <defs>
                    <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22C55E" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient
                      id="colorInteractions"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#38BDF8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
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
                      fontWeight: 500,
                    }}
                    dy={10}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fontSize: 12,
                      fill: '#64748b',
                      fontWeight: 500,
                    }}
                  />

                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: 'none',
                      borderRadius: '12px',
                      color: '#fff',
                      boxShadow: '0 10px 40px -10px rgba(0,0,0,0.3)',
                    }}
                    itemStyle={{
                      color: '#fff',
                      fontWeight: 500,
                      fontSize: '12px',
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="visitors"
                    stroke="#22C55E"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorVisitors)"
                  />

                  <Area
                    type="monotone"
                    dataKey="interactions"
                    stroke="#38BDF8"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorInteractions)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <p>No data available yet. Start conversations to see engagement metrics.</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Leads */}
        <div className="bento-card flex flex-col">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Recent Leads
            </h2>
            <button className="text-xs sm:text-sm text-emerald-600 dark:text-cyan-400 font-medium hover:underline">
              View All
            </button>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            {recentLeads.map((lead) => (
              <div
                key={lead.id}
                className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-navy-800/50 transition-colors border border-transparent hover:border-gray-100 dark:hover:border-navy-700"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-emerald-400 to-turquoise-500 dark:from-cyan-500 dark:to-emerald-500 flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-sm">
                    {(lead.name || '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white text-xs sm:text-sm">
                      {lead.name}
                    </div>
                    <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                      {lead.subtitle}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="inline-flex items-center px-2 py-1 rounded-md bg-mint-50 dark:bg-cyan-900/30 text-emerald-700 dark:text-cyan-400 text-[10px] sm:text-xs font-medium">
                    {lead.badge}
                  </div>
                </div>
              </div>
            ))}
            {recentLeads.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                No leads yet
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


function KPICard({ title, value, trend, isPositive, icon: Icon, color }: any) {
  const colorMap: Record<string, string> = {
    emerald: 'text-emerald-600 dark:text-emerald-400 bg-mint-100 dark:bg-emerald-900/20',
    turquoise: 'text-turquoise-600 dark:text-turquoise-400 bg-aqua-100 dark:bg-turquoise-900/20',
    cyan: 'text-cyan-600 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-900/20',
  };

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 20,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      className="bento-card flex flex-col"
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl ${colorMap[color]}`}>
          <Icon size={20} className="sm:w-6 sm:h-6" />
        </div>
        <div
          className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
            isPositive
              ? 'text-emerald-600 bg-mint-100 dark:bg-emerald-900/20'
              : 'text-red-600 bg-red-50 dark:bg-red-900/20'
          }`}
        >
          {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {trend}
        </div>
      </div>
      <div className="text-gray-500 dark:text-gray-400 text-xs font-semibold mb-1 uppercase tracking-wider">
        {title}
      </div>
      <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
        {value}
      </div>
    </motion.div>
  );
}