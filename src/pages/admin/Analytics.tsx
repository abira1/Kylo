import React from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line } from
'recharts';
import { Cpu, Zap, MessageSquare, Users } from 'lucide-react';
const MOCK_TOKEN_DATA = [
{
  name: 'Mon',
  tokens: 450000
},
{
  name: 'Tue',
  tokens: 520000
},
{
  name: 'Wed',
  tokens: 480000
},
{
  name: 'Thu',
  tokens: 610000
},
{
  name: 'Fri',
  tokens: 590000
},
{
  name: 'Sat',
  tokens: 320000
},
{
  name: 'Sun',
  tokens: 280000
}];

const MOCK_GROWTH_DATA = [
{
  month: 'Jan',
  clients: 850,
  churn: 12
},
{
  month: 'Feb',
  clients: 920,
  churn: 15
},
{
  month: 'Mar',
  clients: 1050,
  churn: 10
},
{
  month: 'Apr',
  clients: 1120,
  churn: 18
},
{
  month: 'May',
  clients: 1210,
  churn: 14
},
{
  month: 'Jun',
  clients: 1284,
  churn: 8
}];

export function AdminAnalytics() {
  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Platform Analytics
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Deep dive into system usage, AI consumption, and growth metrics.
          </p>
        </div>
        <div className="flex gap-2">
          <select className="bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-xl px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 outline-none shadow-sm">
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>This Quarter</option>
          </select>
          <button className="btn-secondary text-sm">Export CSV</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          title="Total AI Tokens"
          value="3.2M"
          subtext="Last 7 days"
          icon={Cpu}
          color="emerald" />
        
        <StatCard
          title="Avg Processing Time"
          value="0.8s"
          subtext="-0.2s from last week"
          icon={Zap}
          color="turquoise" />
        
        <StatCard
          title="Total Conversations"
          value="142.5K"
          subtext="+12% from last week"
          icon={MessageSquare}
          color="cyan" />
        
        <StatCard
          title="Net Client Growth"
          value="+74"
          subtext="This month"
          icon={Users}
          color="emerald" />
        
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        <div className="bento-card">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">
            AI Token Consumption
          </h2>
          <div className="h-56 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={MOCK_TOKEN_DATA}
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
                  opacity={0.1} />
                
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 12,
                    fill: '#64748b'
                  }}
                  dy={10} />
                
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 12,
                    fill: '#64748b'
                  }}
                  tickFormatter={(val) => `${val / 1000}k`} />
                
                <Tooltip
                  cursor={{
                    fill: '#334155',
                    opacity: 0.1
                  }}
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff'
                  }}
                  itemStyle={{
                    color: '#fff',
                    fontWeight: 500,
                    fontSize: '12px'
                  }} />
                
                <Bar dataKey="tokens" fill="#22C55E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bento-card">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">
            Client Growth vs Churn
          </h2>
          <div className="h-56 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={MOCK_GROWTH_DATA}
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
                  opacity={0.1} />
                
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 12,
                    fill: '#64748b'
                  }}
                  dy={10} />
                
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 12,
                    fill: '#64748b'
                  }} />
                
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff'
                  }}
                  itemStyle={{
                    color: '#fff',
                    fontWeight: 500,
                    fontSize: '12px'
                  }} />
                
                <Line
                  type="monotone"
                  dataKey="clients"
                  stroke="#38BDF8"
                  strokeWidth={3}
                  dot={{
                    r: 4,
                    fill: '#38BDF8',
                    strokeWidth: 0
                  }} />
                
                <Line
                  type="monotone"
                  dataKey="churn"
                  stroke="#EF4444"
                  strokeWidth={3}
                  dot={{
                    r: 4,
                    fill: '#EF4444',
                    strokeWidth: 0
                  }} />
                
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>);

}
function StatCard({ title, value, subtext, icon: Icon, color }: any) {
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
      className="bento-card flex items-center gap-3">
      
      <div className={`p-2.5 rounded-xl sm:rounded-2xl ${colorMap[color]}`}>
        <Icon size={20} />
      </div>
      <div>
        <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {title}
        </div>
        <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
          {value}
        </div>
        <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {subtext}
        </div>
      </div>
    </motion.div>);

}