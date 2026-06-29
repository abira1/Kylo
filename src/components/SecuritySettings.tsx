import React, { useState } from 'react';
import {
  Lock,
  Shield,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Smartphone,
  LogOut,
  Eye,
  EyeOff,
  Loader2 } from
'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { changePassword } from '../firebase/auth';

const strength = (pw: string): { score: number; label: string; color: string } => {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const map = [
    { label: 'Too weak', color: 'bg-red-500' },
    { label: 'Weak', color: 'bg-orange-500' },
    { label: 'Fair', color: 'bg-amber-500' },
    { label: 'Good', color: 'bg-emerald-500' },
    { label: 'Strong', color: 'bg-emerald-600' }
  ];
  return { score: s, ...map[s] };
};

export function SecuritySettings() {
  const { user, logout } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [twoFA, setTwoFA] = useState(false);

  const pw = strength(next);

  const submit = async () => {
    setMsg(null);
    if (next.length < 8) return setMsg({ type: 'err', text: 'New password must be at least 8 characters.' });
    if (pw.score < 2) return setMsg({ type: 'err', text: 'Please choose a stronger password.' });
    if (next !== confirm) return setMsg({ type: 'err', text: 'Passwords do not match.' });
    setSaving(true);
    try {
      await changePassword(current, next);
      setMsg({ type: 'ok', text: 'Password updated successfully.' });
      setCurrent(''); setNext(''); setConfirm('');
    } catch (e: any) {
      const code = e?.code || '';
      const text = code.includes('wrong-password') || code.includes('invalid-credential')
        ? 'Current password is incorrect.'
        : code.includes('too-many-requests') ? 'Too many attempts. Try again later.'
        : 'Could not update password.';
      setMsg({ type: 'err', text });
    }
    setSaving(false);
  };

  return (
    <div className="space-y-8">
      {/* Password */}
      <div className="bento-card space-y-6">
        <div className="border-b border-gray-100 dark:border-navy-700 pb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><Lock size={20} /> Change Password</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Use a strong, unique password to keep your account secure.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2"><label className="label-text">Current Password</label>
            <input type={show ? 'text' : 'password'} className="input-field" value={current} onChange={(e) => setCurrent(e.target.value)} /></div>
          <div><label className="label-text">New Password</label>
            <input type={show ? 'text' : 'password'} className="input-field" value={next} onChange={(e) => setNext(e.target.value)} /></div>
          <div><label className="label-text">Confirm New Password</label>
            <input type={show ? 'text' : 'password'} className="input-field" value={confirm} onChange={(e) => setConfirm(e.target.value)} /></div>
        </div>
        {next && (
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-gray-100 dark:bg-navy-900 rounded-full overflow-hidden">
              <div className={`h-2 rounded-full transition-all ${pw.color}`} style={{ width: `${(pw.score / 4) * 100}%` }} />
            </div>
            <span className="text-xs font-semibold text-gray-500">{pw.label}</span>
          </div>
        )}
        <button onClick={() => setShow((s) => !s)} className="text-sm text-emerald-600 dark:text-cyan-400 flex items-center gap-1.5 font-semibold">
          {show ? <EyeOff size={14} /> : <Eye size={14} />} {show ? 'Hide' : 'Show'} passwords
        </button>
        {msg && (
          <p className={`text-sm flex items-center gap-1.5 ${msg.type === 'ok' ? 'text-emerald-600' : 'text-red-500'}`}>
            {msg.type === 'ok' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />} {msg.text}
          </p>
        )}
        <div className="pt-4 border-t border-gray-100 dark:border-navy-800 flex justify-end">
          <button onClick={submit} disabled={saving} className="btn-primary disabled:opacity-60 flex items-center gap-2">
            {saving && <Loader2 size={16} className="animate-spin" />} Update Password
          </button>
        </div>
      </div>

      {/* 2FA */}
      <div className="bento-card flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-mint-100 dark:bg-navy-800 flex items-center justify-center"><Smartphone className="text-emerald-500" /></div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">Two-Factor Authentication {twoFA && <ShieldCheck size={16} className="text-emerald-500" />}</h3>
            <p className="text-sm text-gray-500">Add an extra layer of security with a code from your phone.</p>
          </div>
        </div>
        <button onClick={() => setTwoFA((v) => !v)} className={`relative w-12 h-6 rounded-full transition-colors ${twoFA ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-navy-700'}`}>
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${twoFA ? 'translate-x-6' : ''}`} />
        </button>
      </div>

      {/* Sessions */}
      <div className="bento-card space-y-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2"><Shield size={18} /> Active Session</h3>
        <div className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 dark:border-navy-700">
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">This device</p>
            <p className="text-sm text-gray-500">{user?.email} · signed in now</p>
          </div>
          <button onClick={logout} className="btn-secondary text-sm flex items-center gap-2 text-red-600"><LogOut size={16} /> Sign out</button>
        </div>
      </div>
    </div>
  );
}
