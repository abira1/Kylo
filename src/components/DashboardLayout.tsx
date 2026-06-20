import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useTheme } from './ThemeProvider';
import {
  LayoutDashboard,
  Settings as SettingsIcon,
  MessageSquare,
  Users,
  CreditCard,
  BarChart3,
  BookOpen,
  Code,
  Smartphone,
  Bell,
  Search,
  Moon,
  Sun,
  Menu,
  X,
  LogOut,
  Bot } from
'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
const NAV_ITEMS = [
{
  path: '/dashboard',
  label: 'Home',
  icon: LayoutDashboard,
  exact: true
},
{
  path: '/dashboard/embed',
  label: 'Embed & Setup',
  icon: Code
},
{
  path: '/dashboard/leads',
  label: 'Lead Inbox',
  icon: Users
},
{
  path: '/dashboard/conversations',
  label: 'Conversations',
  icon: MessageSquare
},
{
  path: '/dashboard/whatsapp',
  label: 'WhatsApp',
  icon: Smartphone
},
{
  path: '/dashboard/training',
  label: 'Q&A Training',
  icon: BookOpen
},
{
  path: '/dashboard/analytics',
  label: 'Analytics',
  icon: BarChart3
},
{
  path: '/dashboard/payments',
  label: 'Payments',
  icon: CreditCard
},
{
  path: '/dashboard/settings',
  label: 'Settings',
  icon: SettingsIcon
}];

export function DashboardLayout() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const handleLogout = () => {
    navigate('/login');
  };
  return (
    <div className="min-h-screen flex bg-[#f8fafc] dark:bg-navy-950 transition-colors duration-300">
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-navy-800 z-10 shadow-soft dark:shadow-soft-dark sticky top-0 h-screen self-start">
        <div className="p-6 flex items-center gap-3">
          <img
            src="https://i.postimg.cc/FzSqZJPg/97724688056.png"
            alt="KYLO-AI"
            className="h-7 w-auto dark:hidden" />
          
          <img
            src="https://i.postimg.cc/gjRDJSW5/high-level-description-a-dark-mode-wordm-As-Wztl-DXWm-G91n-AY-i-MLQ-b-Wl27DVTe6f8Pxy6g-Wv-Lw.png"
            alt="KYLO-AI"
            className="h-7 w-auto hidden dark:block" />
          
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
          {NAV_ITEMS.map((item) =>
          <NavLink
            key={item.path}
            to={item.path}
            end={item.exact}
            className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-2xl font-medium transition-all ${isActive ? 'bg-mint-100 dark:bg-navy-700 text-emerald-700 dark:text-cyan-400 shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-navy-700/50 hover:text-gray-900 dark:hover:text-gray-200'}`
            }>
            
              <item.icon size={20} />
              {item.label}
            </NavLink>
          )}
        </nav>

        <div className="p-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-2xl font-medium text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all">
            
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen &&
        <>
            <motion.div
            initial={{
              opacity: 0
            }}
            animate={{
              opacity: 1
            }}
            exit={{
              opacity: 0
            }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm" />
          
            <motion.aside
            initial={{
              x: '-100%'
            }}
            animate={{
              x: 0
            }}
            exit={{
              x: '-100%'
            }}
            transition={{
              type: 'spring',
              bounce: 0,
              duration: 0.4
            }}
            className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-navy-900 z-50 flex flex-col shadow-2xl">
            
              <div className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                  src="https://i.postimg.cc/FzSqZJPg/97724688056.png"
                  alt="KYLO-AI"
                  className="h-6 w-auto dark:hidden" />
                
                  <img
                  src="https://i.postimg.cc/gjRDJSW5/high-level-description-a-dark-mode-wordm-As-Wztl-DXWm-G91n-AY-i-MLQ-b-Wl27DVTe6f8Pxy6g-Wv-Lw.png"
                  alt="KYLO-AI"
                  className="h-6 w-auto hidden dark:block" />
                
                </div>
                <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-gray-500 dark:text-gray-400">
                
                  <X size={24} />
                </button>
              </div>
              <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                {NAV_ITEMS.map((item) =>
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${isActive ? 'bg-mint-50 dark:bg-navy-800 text-mint-600 dark:text-cyan-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-navy-800/50'}`
                }>
                
                    <item.icon size={20} />
                    {item.label}
                  </NavLink>
              )}
              </nav>
            </motion.aside>
          </>
        }
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 sm:h-20 glass-nav flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-700">
              
              <Menu size={20} />
            </button>
            <div className="hidden md:flex items-center gap-2 bg-white dark:bg-navy-800 px-4 py-2 rounded-2xl shadow-sm focus-within:ring-2 focus-within:ring-emerald-500 dark:focus-within:ring-cyan-500 transition-all w-64 lg:w-80">
              <Search size={16} className="text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-transparent border-none outline-none text-sm w-full text-gray-700 dark:text-gray-200 placeholder-gray-400" />
              
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 sm:p-2.5 rounded-xl bg-white dark:bg-navy-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-navy-700 transition-colors shadow-sm">
              
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <button className="relative p-2 sm:p-2.5 rounded-xl bg-white dark:bg-navy-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-navy-700 transition-colors shadow-sm">
              <Bell size={18} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white dark:border-navy-800"></span>
            </button>
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-tr from-emerald-400 to-turquoise-500 dark:from-cyan-500 dark:to-emerald-500 shadow-md cursor-pointer flex items-center justify-center text-white font-bold text-sm sm:text-base">
              S
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </div>
      </main>
    </div>);

}