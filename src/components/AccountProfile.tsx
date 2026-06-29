import React, { useEffect, useState, useCallback } from 'react';
import {
  CheckCircle2,
  CreditCard,
  ShieldCheck,
  AlertTriangle,
  Crown,
  Sparkles,
  Loader2,
  Receipt,
  X } from
'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useRealtimeData } from '../hooks/useData';
import {
  getClientProfile,
  saveClientProfile,
  subscribeToInvoices,
  ClientProfile,
  Invoice } from
'../services/dataService';

const PLANS = [
  { id: 'Starter', price: 29, tagline: 'For small teams getting started', features: ['1,000 conversations/mo', '1 chatbot', 'Email support'] },
  { id: 'Growth', price: 99, tagline: 'For scaling businesses', features: ['10,000 conversations/mo', '5 chatbots', 'CRM integrations', 'Priority support'] },
  { id: 'Enterprise', price: 299, tagline: 'For high-volume operations', features: ['Unlimited conversations', 'Unlimited chatbots', 'SLA + dedicated manager', 'SSO & audit logs'] }
] as const;

const luhnValid = (num: string): boolean => {
  const s = num.replace(/\s/g, '');
  if (!/^\d{13,19}$/.test(s)) return false;
  let sum = 0, alt = false;
  for (let i = s.length - 1; i >= 0; i--) {
    let d = parseInt(s[i], 10);
    if (alt) { d *= 2; if (d > 9) d -= 9; }
    sum += d; alt = !alt;
  }
  return sum % 10 === 0;
};

const detectBrand = (num: string): string => {
  const s = num.replace(/\s/g, '');
  if (/^4/.test(s)) return 'Visa';
  if (/^5[1-5]/.test(s)) return 'Mastercard';
  if (/^3[47]/.test(s)) return 'Amex';
  if (/^6/.test(s)) return 'Discover';
  return 'Card';
};

export function AccountProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);

  // Card form
  const [cardNum, setCardNum] = useState('');
  const [cardExp, setCardExp] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardErr, setCardErr] = useState('');

  const sub = useCallback((cb: (d: Invoice[]) => void) => {
    if (user?.uid) return subscribeToInvoices(user.uid, cb);
    cb([]); return () => {};
  }, [user?.uid]);
  const { data: invoices } = useRealtimeData<Invoice[]>(sub, []);

  useEffect(() => {
    if (!user?.uid) return;
    getClientProfile(user.uid).then((p) => {
      const [first, ...rest] = (user.displayName || '').split(' ');
      setProfile({
        ...p,
        firstName: p.firstName || first || '',
        lastName: p.lastName || rest.join(' ') || '',
        email: p.email || user.email || ''
      });
    });
  }, [user?.uid, user?.displayName, user?.email]);

  const update = (k: keyof ClientProfile, v: any) =>
    setProfile((p) => (p ? { ...p, [k]: v } : p));

  const handleSave = async () => {
    if (!user?.uid || !profile) return;
    setSaving(true);
    try {
      await saveClientProfile(user.uid, profile);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const validateAndSaveCard = async () => {
    if (!user?.uid || !profile) return;
    setCardErr('');
    if (!luhnValid(cardNum)) return setCardErr('Card number is invalid.');
    const m = cardExp.match(/^(\d{2})\/(\d{2})$/);
    if (!m) return setCardErr('Expiry must be MM/YY.');
    const mm = +m[1], yy = 2000 + +m[2];
    if (mm < 1 || mm > 12) return setCardErr('Invalid expiry month.');
    const exp = new Date(yy, mm, 0, 23, 59);
    if (exp < new Date()) return setCardErr('Card is expired.');
    if (!/^\d{3,4}$/.test(cardCvc)) return setCardErr('CVC is invalid.');
    const last4 = cardNum.replace(/\s/g, '').slice(-4);
    const card = { brand: detectBrand(cardNum), last4, expMonth: mm, expYear: yy };
    const next = { ...profile, card, planStatus: 'active' as const };
    setProfile(next);
    await saveClientProfile(user.uid, { card, planStatus: 'active' });
    setShowCardModal(false);
    setCardNum(''); setCardExp(''); setCardCvc('');
  };

  if (!profile) {
    return (
      <div className="bento-card flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  const initials = `${profile.firstName?.[0] || ''}${profile.lastName?.[0] || 'C'}`.toUpperCase();
  const cardValid = profile.card &&
    new Date(profile.card.expYear, profile.card.expMonth, 0) >= new Date();
  const statusBadge: Record<string, string> = {
    active: 'text-emerald-700 dark:text-emerald-400 bg-mint-100 dark:bg-emerald-900/20',
    trialing: 'text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20',
    past_due: 'text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/20',
    canceled: 'text-gray-700 dark:text-gray-400 bg-gray-100 dark:bg-navy-800'
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bento-card flex flex-col sm:flex-row sm:items-center gap-6">
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-400 to-turquoise-500 dark:from-cyan-500 dark:to-emerald-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {profile.firstName || 'Your'} {profile.lastName || 'Name'}
            </h2>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-cyan-400 bg-mint-100 dark:bg-navy-800 px-3 py-1 rounded-full">
              <Crown size={13} /> {profile.plan}
            </span>
            <span className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full ${statusBadge[profile.planStatus] || statusBadge.canceled}`}>
              {profile.planStatus.replace('_', ' ')}
            </span>
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">{profile.email}</p>
          {profile.company && <p className="text-sm text-gray-400 mt-0.5">{profile.company}</p>}
        </div>
        <button onClick={() => document.getElementById('avatar-input')?.click()} className="btn-secondary text-sm">
          Change Avatar
        </button>
        <input id="avatar-input" type="file" accept="image/*" className="hidden" />
      </div>

      {/* Profile info */}
      <div className="bento-card space-y-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-navy-700 pb-4">
          Profile Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div><label className="label-text">First Name</label>
            <input className="input-field" value={profile.firstName} onChange={(e) => update('firstName', e.target.value)} /></div>
          <div><label className="label-text">Last Name</label>
            <input className="input-field" value={profile.lastName} onChange={(e) => update('lastName', e.target.value)} /></div>
          <div><label className="label-text">Email Address</label>
            <input className="input-field" type="email" value={profile.email} onChange={(e) => update('email', e.target.value)} /></div>
          <div><label className="label-text">Phone</label>
            <input className="input-field" value={profile.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+1 555 000 0000" /></div>
          <div><label className="label-text">Company Name</label>
            <input className="input-field" value={profile.company} onChange={(e) => update('company', e.target.value)} /></div>
          <div><label className="label-text">Job Title</label>
            <input className="input-field" value={profile.jobTitle} onChange={(e) => update('jobTitle', e.target.value)} placeholder="Founder" /></div>
        </div>
        <div className="pt-4 border-t border-gray-100 dark:border-navy-800 flex justify-end items-center gap-3">
          {saved && <span className="text-emerald-600 text-sm font-semibold flex items-center gap-1"><CheckCircle2 size={16} /> Saved</span>}
          <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-60">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Plan & Package */}
      <div className="bento-card space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-navy-700 pb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Plan & Package</h3>
          <span className="text-sm text-gray-500">{profile.renewsAt ? `Renews ${new Date(profile.renewsAt).toLocaleDateString()}` : 'No renewal date'}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PLANS.map((plan) => {
            const active = plan.id === profile.plan;
            return (
              <div key={plan.id} className={`rounded-2xl border-2 p-6 transition-all ${active ? 'border-emerald-500 bg-mint-50/50 dark:bg-navy-800/60' : 'border-gray-100 dark:border-navy-700'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-gray-900 dark:text-white">{plan.id}</span>
                  {active && <span className="text-xs font-bold text-emerald-600">Current</span>}
                </div>
                <div className="text-3xl font-extrabold text-gray-900 dark:text-white mb-1">${plan.price}<span className="text-sm font-medium text-gray-400">/mo</span></div>
                <p className="text-xs text-gray-500 mb-4">{plan.tagline}</p>
                <ul className="space-y-2 mb-5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300"><CheckCircle2 size={14} className="text-emerald-500" /> {f}</li>
                  ))}
                </ul>
                <button onClick={() => update('plan', plan.id)} className={active ? 'btn-secondary w-full text-sm' : 'btn-primary w-full text-sm'}>
                  {active ? 'Active' : 'Choose'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment method */}
      <div className="bento-card space-y-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-navy-700 pb-4">Payment Method</h3>
        {profile.card ? (
          <div className="flex items-center justify-between p-5 rounded-2xl border border-gray-100 dark:border-navy-700 bg-gray-50 dark:bg-navy-900">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white dark:bg-navy-800 flex items-center justify-center shadow-inner"><CreditCard className="text-emerald-500" /></div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white">{profile.card.brand} •••• {profile.card.last4}</p>
                <p className="text-sm text-gray-500">Expires {String(profile.card.expMonth).padStart(2, '0')}/{profile.card.expYear}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {cardValid ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-mint-100 dark:bg-emerald-900/20 px-3 py-1.5 rounded-full"><ShieldCheck size={14} /> Valid</span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-100 dark:bg-red-900/20 px-3 py-1.5 rounded-full"><AlertTriangle size={14} /> Expired</span>
              )}
              <button onClick={() => setShowCardModal(true)} className="btn-secondary text-sm">Update</button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between p-5 rounded-2xl border border-dashed border-gray-200 dark:border-navy-700">
            <div className="flex items-center gap-3 text-gray-500"><AlertTriangle className="text-amber-500" /> No payment method on file.</div>
            <button onClick={() => setShowCardModal(true)} className="btn-primary text-sm">Add Card</button>
          </div>
        )}
      </div>

      {/* Billing history */}
      <div className="bento-card space-y-4">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-navy-700 pb-4 flex items-center gap-2"><Receipt size={20} /> Billing History</h3>
        {invoices.length === 0 ? (
          <p className="text-center text-gray-500 py-6">No invoices yet.</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-navy-800">
            {invoices.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between py-4">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{inv.number} · {inv.plan}</p>
                  <p className="text-sm text-gray-500">{new Date(inv.date).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-gray-900 dark:text-white">${inv.amount}</span>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${inv.status === 'Paid' ? 'text-emerald-600 bg-mint-100 dark:bg-emerald-900/20' : inv.status === 'Overdue' ? 'text-red-600 bg-red-100 dark:bg-red-900/20' : 'text-amber-600 bg-amber-100 dark:bg-amber-900/20'}`}>{inv.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Card modal */}
      {showCardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-white dark:bg-navy-800 rounded-3xl shadow-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><Sparkles size={20} className="text-emerald-500" /> Payment Details</h3>
              <button onClick={() => setShowCardModal(false)} className="text-gray-400 hover:text-gray-600"><X /></button>
            </div>
            <div className="space-y-4">
              <div><label className="label-text">Card Number</label>
                <input className="input-field font-mono" value={cardNum} onChange={(e) => setCardNum(e.target.value)} placeholder="4242 4242 4242 4242" maxLength={19} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label-text">Expiry</label>
                  <input className="input-field font-mono" value={cardExp} onChange={(e) => setCardExp(e.target.value)} placeholder="MM/YY" maxLength={5} /></div>
                <div><label className="label-text">CVC</label>
                  <input className="input-field font-mono" value={cardCvc} onChange={(e) => setCardCvc(e.target.value)} placeholder="123" maxLength={4} /></div>
              </div>
              {cardErr && <p className="text-red-500 text-sm flex items-center gap-1"><AlertTriangle size={14} /> {cardErr}</p>}
              <button onClick={validateAndSaveCard} className="btn-primary w-full py-3">Save Card</button>
              <p className="text-xs text-gray-400 text-center">Card details are validated and stored securely.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
