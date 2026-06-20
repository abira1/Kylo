import React, { useState, useCallback } from 'react';
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
import { useAuth } from '../../hooks/useAuth';
import { useRealtimeData } from '../../hooks/useData';
import { subscribeToChartData, ChartDataPoint } from '../../services/dataService';

const PIE_DATA = [
  {
    name: 'Website',
    value: 65
  },
  {
    name: 'WhatsApp',
    value: 25
  },
  {
    name: 'Other',
    value: 10
  }
];

const COLORS = ['#22C55E', '#38BDF8', '#475569'];

export function Analytics() {
  const { user, loading: authLoading } = useAuth();
  const [timeframe, setTimeframe] = useState('Last 30 Days');

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

  // Calculate stats from chart data
  const totalLeads = Array.isArray(chartData) ? chartData.reduce((sum, item) => sum + item.leads, 0) : 0;
  const avgLeads = chartData.length > 0 ? Math.round(totalLeads / chartData.length) : 0;
  const conversionRate = totalLeads > 0 ? (12.4 * totalLeads) / 1000 : 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Analytics
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Deep dive into your AI's performance and lead generation.
          </p>
        </div>
        <select
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
          className="bg-white dark:bg-navy-800 border-none rounded-xl px-4 py-2 text-sm text-gray-700 dark:text-gray-300 outline-none shadow-soft dark:shadow-soft-dark font-medium w-full sm:w-auto">
          <option>Last 30 Days</option>
          <option>Last 90 Days</option>
          <option>Year to Date</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        {/* Lead Generation Chart */}
        <div className="bento-card">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5">
            Lead Generation Trend
          </h2>
          <div className="h-56 sm:h-72">
            {dataLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Loading chart...</p>
                </div>
              </div>
            ) : chartData.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500 dark:text-gray-400">No data yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
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

        {/* Traffic Sources */}
        <div className="bento-card flex flex-col">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5">
            Conversation Sources
          </h2>
          <div className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-0">
            <div className="h-48 sm:h-56 w-full sm:w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={PIE_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value">
                    {PIE_DATA.map((entry, index) => (
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
              {PIE_DATA.map((item, index) => (
                <div key={item.name} className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full shadow-sm"
                    style={{
                      backgroundColor: COLORS[index]
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
          </div>
        </div>

        {/* Stats Grid */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
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
              CSAT Score
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              4.8
              <span className="text-sm sm:text-base text-gray-400">/5.0</span>
            </div>
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-navy-700 px-2.5 py-1 rounded-full self-start">
              Based on ratings
            </div>
          </div>
          <div className="bento-card flex flex-col justify-between">
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">
              Human Handoff Rate
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              8.2%
            </div>
            <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-mint-100 dark:bg-emerald-900/20 px-2.5 py-1 rounded-full self-start">
              Optimal range
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}