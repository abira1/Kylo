import React, { useEffect, useState } from 'react';
import { Mail, Bell, MessageSquare, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import {
  getNotificationPrefs,
  saveNotificationPrefs,
  NotificationPrefs,
  DEFAULT_NOTIFICATION_PREFS } from
'../services/dataService';

type ToggleKey = keyof NotificationPrefs;

const SECTIONS: { title: string; icon: typeof Mail; items: { key: ToggleKey; label: string; desc: string }[] }[] = [
  {
    title: 'Email', icon: Mail, items: [
      { key: 'emailNewLead', label: 'New leads', desc: 'When a new lead is captured by your chatbot.' },
      { key: 'emailWeeklyReport', label: 'Weekly report', desc: 'A summary of activity every Monday.' },
      { key: 'emailBilling', label: 'Billing & invoices', desc: 'Payment receipts and renewal reminders.' },
      { key: 'emailProductUpdates', label: 'Product updates', desc: 'News about features and improvements.' }
    ]
  },
  {
    title: 'Push', icon: Bell, items: [
      { key: 'pushNewMessage', label: 'New messages', desc: 'When a visitor sends a message.' },
      { key: 'pushMentions', label: 'Mentions', desc: 'When a teammate mentions you.' },
      { key: 'pushSystemAlerts', label: 'System alerts', desc: 'Outages and important notices.' }
    ]
  },
  {
    title: 'SMS', icon: MessageSquare, items: [
      { key: 'smsCritical', label: 'Critical alerts', desc: 'Only urgent, high-priority events.' }
    ]
  }
];

export function NotificationSettings() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_NOTIFICATION_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    getNotificationPrefs(user.uid).then((p) => { setPrefs(p); setLoading(false); });
  }, [user?.uid]);

  const toggle = (k: ToggleKey) => setPrefs((p) => ({ ...p, [k]: !p[k] }));

  const save = async () => {
    if (!user?.uid) return;
    setSaving(true);
    try {
      await saveNotificationPrefs(user.uid, prefs);
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  if (loading) {
    return <div className="bento-card flex justify-center py-20"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin" /></div>;
  }

  return (
    <div className="space-y-8">
      {SECTIONS.map((s) => (
        <div key={s.title} className="bento-card space-y-2">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-navy-700 pb-4 mb-2"><s.icon size={18} className="text-emerald-500" /> {s.title} Notifications</h2>
          {s.items.map((item) => (
            <div key={item.key} className="flex items-center justify-between py-3">
              <div className="pr-4">
                <p className="font-semibold text-gray-900 dark:text-white">{item.label}</p>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
              <button onClick={() => toggle(item.key)} className={`relative w-12 h-6 rounded-full flex-shrink-0 transition-colors ${prefs[item.key] ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-navy-700'}`}>
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${prefs[item.key] ? 'translate-x-6' : ''}`} />
              </button>
            </div>
          ))}
        </div>
      ))}
      <div className="flex justify-end items-center gap-3">
        {saved && <span className="text-emerald-600 text-sm font-semibold flex items-center gap-1"><CheckCircle2 size={16} /> Saved</span>}
        <button onClick={save} disabled={saving} className="btn-primary disabled:opacity-60">{saving ? 'Saving…' : 'Save Preferences'}</button>
      </div>
    </div>
  );
}
