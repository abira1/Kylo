import React from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  DollarSign,
  Bot,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Building } from
'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer } from
'recharts';
import { MOCK_REVENUE_DATA } from '../../lib/mockData';
export function AdminHome() {
  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Platform Overview
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Global metrics and system health for KYLO.
          </p>
        </div>
        <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
          <button className="btn-secondary text-xs sm:text-sm flex-1 sm:flex-none">
            Export Data
          </button>
          <button className="btn-primary text-xs sm:text-sm flex-1 sm:flex-none">
            System Report
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <KPICard
          title="Total Clients"
          value="1,284"
          trend="+12.5%"
          isPositive={true}
          icon={Users}
          color="emerald" />
        
        <KPICard
          title="Monthly Recurring Revenue"
          value="$142,500"
          trend="+8.2%"
          isPositive={true}
          icon={DollarSign}
          color="turquoise" />
        
        <KPICard
          title="Active Chatbots"
          value="3,492"
          trend="+15.1%"
          isPositive={true}
          icon={Bot}
          color="cyan" />
        
        <KPICard
          title="System Health"
          value="99.99%"
          trend="-0.01%"
          isPositive={false}
          icon={Activity}
          color="emerald" />
        
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Main Chart */}
        <div className="bento-card lg:col-span-2">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Revenue Growth
            </h2>
            <select className="bg-gray-50 dark:bg-navy-900 border-none rounded-xl px-3 py-1.5 text-xs sm:text-sm text-gray-700 dark:text-gray-300 outline-none shadow-inner dark:shadow-none">
              <option>Last 6 Months</option>
              <option>This Year</option>
              <option>All Time</option>
            </select>
          </div>
          <div className="h-56 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={MOCK_REVENUE_DATA}
                margin={{
                  top: 10,
                  right: 10,
                  left: -20,
                  bottom: 0
                }}>
                
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#334155"
                  opacity={0.1} />
                
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 12,
                    fill: '#64748b',
                    fontWeight: 500
                  }}
                  dy={10} />
                
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 12,
                    fill: '#64748b',
                    fontWeight: 500
                  }}
                  tickFormatter={(value) => `$${value / 1000}k`} />
                
                <Tooltip
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
                  formatter={(value: number) => [
                  `$${value.toLocaleString()}`,
                  'Revenue']
                  } />
                
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#22C55E"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRevenue)" />
                
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Signups */}
        <div className="bento-card flex flex-col">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Recent Signups
            </h2>
            <button className="text-xs sm:text-sm text-emerald-600 dark:text-cyan-400 font-medium hover:underline">
              View All
            </button>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            {[
            {
              name: 'Acme Corp',
              plan: 'Enterprise',
              time: '2 hours ago',
              status: 'Active'
            },
            {
              name: 'TechFlow Inc',
              plan: 'Pro',
              time: '5 hours ago',
              status: 'Active'
            },
            {
              name: 'Global Retail',
              plan: 'Starter',
              time: '1 day ago',
              status: 'Pending'
            },
            {
              name: 'Startup IO',
              plan: 'Pro',
              time: '1 day ago',
              status: 'Active'
            }].
            map((client, i) =>
            <div
              key={i}
              className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-navy-800/50 transition-colors border border-transparent hover:border-gray-100 dark:hover:border-navy-700">
              
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gray-100 dark:bg-navy-800 flex items-center justify-center text-gray-500 dark:text-gray-400 shadow-sm">
                    <Building size={16} />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white text-xs sm:text-sm">
                      {client.name}
                    </div>
                    <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                      {client.time}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-gray-900 dark:text-white">
                    {client.plan}
                  </div>
                  <div
                  className={`text-[10px] sm:text-xs font-medium ${client.status === 'Active' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  
                    {client.status}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>);

}
function KPICard({ title, value, trend, isPositive, icon: Icon, color }: any) {
  const colorMap: Record<string, string> = {
    emerald:
    'text-emerald-600 dark:text-emerald-400 bg-mint-100 dark:bg-emerald-900/20',
    turquoise:
    'text-turquoise-600 dark:text-turquoise-400 bg-aqua-100 dark:bg-turquoise-900/20',
    cyan: 'text-cyan-600 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-900/20'
  };
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 20
      }}
      animate={{
        opacity: 1,
        y: 0
      }}
      className="bento-card flex flex-col">
      
      <div className="flex justify-between items-start mb-4">
        <div
          className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl ${colorMap[color]}`}>
          
          <Icon size={20} className="sm:w-6 sm:h-6" />
        </div>
        <div
          className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${isPositive ? 'text-emerald-600 bg-mint-100 dark:bg-emerald-900/20' : 'text-red-600 bg-red-50 dark:bg-red-900/20'}`}>
          
          {isPositive ?
          <ArrowUpRight size={14} /> :

          <ArrowDownRight size={14} />
          }
          {trend}
        </div>
      </div>
      <div className="text-gray-500 dark:text-gray-400 text-xs font-semibold mb-1 uppercase tracking-wider">
        {title}
      </div>
      <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
        {value}
      </div>
    </motion.div>);

}