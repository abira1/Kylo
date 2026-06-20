import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  DollarSign,
  Bot,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { getAnalyticsSummary, getAnalyticsTrends, AnalyticsSummary, TrendsResponse } from '../../services/adminApiService';

interface KPICardProps {
  title: string;
  value: string | number;
  trend?: string;
  isPositive?: boolean;
  icon: React.ReactNode;
  color?: string;
  loading?: boolean;
}

function KPICard({ title, value, trend, isPositive, icon, color = 'emerald', loading }: KPICardProps) {
  const colorClasses = {
    emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    turquoise: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400',
    cyan: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -5 }}
      className="bento-card"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {title}
          </p>
          {loading ? (
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-24" />
          ) : (
            <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
              {value}
            </p>
          )}
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              <span>{trend}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

export function AdminHome() {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [trends, setTrends] = useState<TrendsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    try {
      setLoading(true);
      setError(null);
      const [analyticsData, trendsData] = await Promise.all([
        getAnalyticsSummary(),
        getAnalyticsTrends(30),
      ]);
      setAnalytics(analyticsData);
      setTrends(trendsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
      console.error('Error loading analytics:', err);
    } finally {
      setLoading(false);
    }
  }

  const summary = analytics?.summary;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Platform Overview
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Real-time metrics and system health for KYLO AI.
          </p>
        </div>
        <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            onClick={loadAnalytics}
            className="btn-secondary text-xs sm:text-sm flex-1 sm:flex-none"
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-200 text-sm">
          Error: {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <KPICard
          title="Total Sessions"
          value={summary?.totalSessions || 0}
          trend={`${summary?.averageStepsCompleted?.toFixed(1) || 0} avg steps`}
          icon={<Users size={24} />}
          color="emerald"
          loading={loading}
        />

        <KPICard
          title="Active Sessions"
          value={summary?.activeSessions || 0}
          trend={summary ? `${((summary.activeSessions / summary.totalSessions) * 100).toFixed(0)}% of total` : '0%'}
          isPositive={true}
          icon={<Activity size={24} />}
          color="cyan"
          loading={loading}
        />

        <KPICard
          title="Completed"
          value={summary?.completedSessions || 0}
          trend={`${summary?.successRate || 0}% success rate`}
          isPositive={true}
          icon={<CheckCircle2 size={24} />}
          color="emerald"
          loading={loading}
        />

        <KPICard
          title="Escalated"
          value={summary?.escalatedSessions || 0}
          trend={summary ? `${((summary.escalatedSessions / summary.totalSessions) * 100).toFixed(1)}% need attention` : '0%'}
          isPositive={false}
          icon={<AlertCircle size={24} />}
          color="turquoise"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Trends Chart */}
        <div className="bento-card lg:col-span-2">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              30-Day Trends
            </h2>
            <div className="flex items-center gap-2 text-xs">
              <TrendingUp size={16} />
              <span className={trends?.trend.direction === 'up' ? 'text-green-600' : trends?.trend.direction === 'down' ? 'text-red-600' : 'text-gray-600'}>
                {trends?.trend.momentum === 'positive' ? '+' : ''}{trends?.trend.percentChange}%
              </span>
            </div>
          </div>

          {loading ? (
            <div className="h-72 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
          ) : trends ? (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends.data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.1} />
                  <XAxis
                    dataKey="date"
                    stroke="#64748b"
                    tick={{ fontSize: 12 }}
                    interval={Math.floor(trends.data.length / 6)}
                  />
                  <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: 'none',
                      borderRadius: '12px',
                      color: '#fff',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="sessionsCreated"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={false}
                    name="Created"
                  />
                  <Line
                    type="monotone"
                    dataKey="sessionsCompleted"
                    stroke="#10B981"
                    strokeWidth={2}
                    dot={false}
                    name="Completed"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : null}
        </div>

        {/* Top Issues */}
        <div className="bento-card flex flex-col">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Top Issues
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Most common escalation reasons
            </p>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2">
            {loading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              ))
            ) : analytics?.topIssues && analytics.topIssues.length > 0 ? (
              analytics.topIssues.map((issue, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {issue.reason}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {issue.count} escalations
                      </p>
                    </div>
                    <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-200 text-xs font-semibold flex-shrink-0">
                      {issue.count}
                    </span>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  No escalations yet
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Statistics Summary */}
      <div className="bento-card">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5">
          Summary by Status
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Active', value: summary?.activeSessions || 0, color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' },
            { label: 'Completed', value: summary?.completedSessions || 0, color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' },
            { label: 'Escalated', value: summary?.escalatedSessions || 0, color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' },
            { label: 'Paused', value: summary?.pausedSessions || 0, color: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300' },
          ].map((stat) => (
            <div key={stat.label} className={`p-4 rounded-lg ${stat.color}`}>
              <p className="text-xs font-medium text-opacity-70">{stat.label}</p>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
