import React, { useCallback } from 'react';
import {
  X,
  Bell,
  Users,
  MessageSquare,
  CreditCard,
  AlertTriangle,
  CheckCheck,
  Trash2,
  Loader2 } from
'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useRealtimeData } from '../hooks/useData';
import {
  subscribeToNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  AppNotification,
  NotificationType } from
'../services/dataService';

const ICONS: Record<NotificationType, typeof Bell> = {
  lead: Users,
  message: MessageSquare,
  billing: CreditCard,
  system: AlertTriangle
};
const COLORS: Record<NotificationType, string> = {
  lead: 'text-emerald-600 bg-mint-100 dark:bg-emerald-900/20',
  message: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20',
  billing: 'text-purple-600 bg-purple-100 dark:bg-purple-900/20',
  system: 'text-amber-600 bg-amber-100 dark:bg-amber-900/20'
};

const ago = (iso: string): string => {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return 'just now';
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
};

export function NotificationsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const sub = useCallback((cb: (d: AppNotification[]) => void) => {
    if (user?.uid) return subscribeToNotifications(user.uid, cb);
    cb([]); return () => {};
  }, [user?.uid]);
  const { data: items, loading } = useRealtimeData<AppNotification[]>(sub, []);
  const unreadIds = items.filter((n) => !n.read).map((n) => n.id);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-[#f8fafc] dark:bg-navy-950 flex flex-col">
          <header className="h-16 sm:h-20 glass-nav flex items-center justify-between px-4 sm:px-8 flex-shrink-0">
            <div className="flex items-center gap-3">
              <Bell className="text-emerald-500" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Notifications</h1>
              {unreadIds.length > 0 && <span className="text-xs font-bold text-white bg-emerald-500 px-2 py-0.5 rounded-full">{unreadIds.length} new</span>}
            </div>
            <div className="flex items-center gap-3">
              {unreadIds.length > 0 && (
                <button onClick={() => user?.uid && markAllNotificationsRead(user.uid, unreadIds)} className="btn-secondary text-sm flex items-center gap-2"><CheckCheck size={16} /> Mark all read</button>
              )}
              <button onClick={onClose} className="p-2.5 rounded-xl bg-white dark:bg-navy-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-navy-700 shadow-sm"><X size={20} /></button>
            </div>
          </header>
          <div className="flex-1 overflow-y-auto p-4 sm:p-8">
            <div className="max-w-3xl mx-auto space-y-3">
              {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin" /></div>
              ) : items.length === 0 ? (
                <div className="text-center py-24">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-navy-800 rounded-full flex items-center justify-center"><Bell className="text-gray-400" /></div>
                  <p className="text-gray-500 dark:text-gray-400">You're all caught up. No notifications.</p>
                </div>
              ) : (
                items.map((n) => {
                  const Icon = ICONS[n.type] || Bell;
                  return (
                    <div key={n.id} onClick={() => !n.read && user?.uid && markNotificationRead(user.uid, n.id)} className={`flex items-start gap-4 p-5 rounded-2xl border transition-all cursor-pointer ${n.read ? 'border-gray-100 dark:border-navy-800 bg-white dark:bg-navy-900' : 'border-emerald-200 dark:border-emerald-900/40 bg-mint-50/40 dark:bg-navy-800'}`}>
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${COLORS[n.type]}`}><Icon size={20} /></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-900 dark:text-white">{n.title}</p>
                          {!n.read && <span className="w-2 h-2 bg-emerald-500 rounded-full" />}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">{n.body}</p>
                        <p className="text-xs text-gray-400 mt-1">{ago(n.createdAt)}</p>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); user?.uid && deleteNotification(user.uid, n.id); }} className="text-gray-300 hover:text-red-500 p-1"><Trash2 size={18} /></button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
