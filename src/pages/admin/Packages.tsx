import React from 'react';
import { motion } from 'framer-motion';
import {
  Check,
  Edit2,
  Trash2,
  Plus,
  Users,
  MessageSquare,
  Database } from
'lucide-react';
const MOCK_PACKAGES = [
{
  id: 'pkg-1',
  name: 'Starter',
  price: '$49',
  interval: 'month',
  status: 'Active',
  subscribers: 452,
  limits: {
    bots: 1,
    conversations: '1,000',
    storage: '100MB'
  },
  features: ['Basic Analytics', 'Standard Support', 'Web Widget']
},
{
  id: 'pkg-2',
  name: 'Pro',
  price: '$299',
  interval: 'month',
  status: 'Active',
  subscribers: 684,
  isPopular: true,
  limits: {
    bots: 3,
    conversations: '10,000',
    storage: '1GB'
  },
  features: [
  'Advanced Analytics',
  'Priority Support',
  'WhatsApp Integration',
  'Custom Branding']

},
{
  id: 'pkg-3',
  name: 'Enterprise',
  price: '$999',
  interval: 'month',
  status: 'Active',
  subscribers: 148,
  limits: {
    bots: 'Unlimited',
    conversations: 'Unlimited',
    storage: '10GB'
  },
  features: [
  'Custom Analytics',
  '24/7 Dedicated Support',
  'All Integrations',
  'API Access',
  'SLA Guarantee']

}];

export function AdminPackages() {
  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Packages & Billing
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage subscription tiers, pricing, and feature limits.
          </p>
        </div>
        <button className="btn-primary text-sm flex items-center gap-2">
          <Plus size={18} />
          Create Package
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        {MOCK_PACKAGES.map((pkg, i) =>
        <motion.div
          initial={{
            opacity: 0,
            y: 20
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          transition={{
            delay: i * 0.1
          }}
          key={pkg.id}
          className={`bento-card relative flex flex-col ${pkg.isPopular ? 'border-2 border-emerald-500 dark:border-cyan-500 shadow-lg' : ''}`}>
          
            {pkg.isPopular &&
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 dark:bg-cyan-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                Most Popular
              </div>
          }

            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {pkg.name}
                </h3>
                <div className="mt-1.5 flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
                    {pkg.price}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 font-medium">
                    /{pkg.interval}
                  </span>
                </div>
              </div>
              <div className="flex gap-1">
                <button className="p-1.5 text-gray-400 hover:text-emerald-600 dark:hover:text-cyan-400 rounded-lg hover:bg-mint-50 dark:hover:bg-navy-800 transition-colors">
                  <Edit2 size={16} />
                </button>
                <button className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-navy-900/50 rounded-xl p-3 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Active Subscribers
                </span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {pkg.subscribers}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-navy-800 rounded-full h-1.5">
                <div
                className="bg-emerald-500 dark:bg-cyan-500 h-1.5 rounded-full"
                style={{
                  width: `${pkg.subscribers / 1000 * 100}%`
                }} />
              
              </div>
            </div>

            <div className="space-y-3 mb-4 flex-1">
              <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                Limits
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <MessageSquare
                  size={16}
                  className="text-emerald-500 dark:text-cyan-500" />
                
                  {pkg.limits.conversations}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Users
                  size={16}
                  className="text-emerald-500 dark:text-cyan-500" />
                
                  {pkg.limits.bots} Bots
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 col-span-2">
                  <Database
                  size={16}
                  className="text-emerald-500 dark:text-cyan-500" />
                
                  {pkg.limits.storage} Storage
                </div>
              </div>

              <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mt-4">
                Features
              </h4>
              <ul className="space-y-2">
                {pkg.features.map((feature, idx) =>
              <li
                key={idx}
                className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-400">
                
                    <Check
                  size={16}
                  className="text-emerald-500 dark:text-cyan-500 shrink-0 mt-0.5" />
                
                    {feature}
                  </li>
              )}
              </ul>
            </div>
          </motion.div>
        )}
      </div>
    </div>);

}