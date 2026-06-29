import React, { useState, useCallback } from 'react';
import {
  UserPlus,
  Shield,
  Eye,
  Crown,
  Trash2,
  Mail,
  X,
  Loader2,
  CheckCircle2 } from
'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useRealtimeData } from '../hooks/useData';
import {
  subscribeToTeamMembers,
  addTeamMember,
  updateTeamMember,
  removeTeamMember,
  TeamMember,
  TeamRole } from
'../services/dataService';

const ROLES: { id: TeamRole; label: string; desc: string; icon: typeof Shield }[] = [
  { id: 'Admin', label: 'Admin', desc: 'Full access including billing & team', icon: Crown },
  { id: 'Moderator', label: 'Moderator', desc: 'Manage chats, leads & knowledge base', icon: Shield },
  { id: 'Viewer', label: 'Viewer', desc: 'Read-only access to dashboards', icon: Eye }
];

const roleBadge: Record<TeamRole, string> = {
  Admin: 'text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/20',
  Moderator: 'text-emerald-700 dark:text-emerald-400 bg-mint-100 dark:bg-emerald-900/20',
  Viewer: 'text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-navy-800'
};

export function TeamSettings() {
  const { user } = useAuth();
  const [showInvite, setShowInvite] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<TeamRole>('Moderator');
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const sub = useCallback((cb: (d: TeamMember[]) => void) => {
    if (user?.uid) return subscribeToTeamMembers(user.uid, cb);
    cb([]); return () => {};
  }, [user?.uid]);
  const { data: members, loading } = useRealtimeData<TeamMember[]>(sub, []);

  const invite = async () => {
    if (!user?.uid) return;
    setErr('');
    if (!name.trim()) return setErr('Name is required.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setErr('Enter a valid email.');
    if (members.some((m) => m.email.toLowerCase() === email.toLowerCase())) return setErr('This person is already on the team.');
    setSaving(true);
    try {
      await addTeamMember(user.uid, {
        name: name.trim(), email: email.trim().toLowerCase(), role,
        status: 'invited', invitedAt: new Date().toISOString()
      });
      setName(''); setEmail(''); setRole('Moderator'); setShowInvite(false);
    } catch (e) { console.error(e); setErr('Failed to send invite.'); }
    setSaving(false);
  };

  const changeRole = async (id: string, r: TeamRole) => {
    if (!user?.uid) return; setBusy(id);
    await updateTeamMember(user.uid, id, { role: r });
    setBusy(null);
  };
  const remove = async (id: string) => {
    if (!user?.uid) return; setBusy(id);
    await removeTeamMember(user.uid, id);
    setBusy(null);
  };

  return (
    <div className="space-y-8">
      <div className="bento-card space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-navy-700 pb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Team & Moderators</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Invite teammates and control who can manage your workspace.</p>
          </div>
          <button onClick={() => setShowInvite(true)} className="btn-primary text-sm flex items-center gap-2">
            <UserPlus size={16} /> Invite Member
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-7 h-7 text-emerald-500 animate-spin" /></div>
        ) : members.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-14 h-14 mx-auto mb-3 bg-gray-100 dark:bg-navy-800 rounded-full flex items-center justify-center"><UserPlus className="text-gray-400" /></div>
            <p className="text-gray-500 dark:text-gray-400">No team members yet. Invite your first moderator.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((m) => (
              <div key={m.id} className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 dark:border-navy-700 bg-white dark:bg-navy-800">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-400 to-turquoise-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {m.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 dark:text-white truncate">{m.name}</p>
                    <p className="text-sm text-gray-500 truncate">{m.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {m.status === 'invited' && <span className="text-xs font-bold text-amber-600 bg-amber-100 dark:bg-amber-900/20 px-2.5 py-1 rounded-full">Invited</span>}
                  <select
                    value={m.role}
                    onChange={(e) => changeRole(m.id, e.target.value as TeamRole)}
                    disabled={busy === m.id}
                    className={`text-xs font-bold px-3 py-1.5 rounded-full border-none outline-none cursor-pointer ${roleBadge[m.role]}`}>
                    {ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                  </select>
                  <button onClick={() => remove(m.id)} disabled={busy === m.id} className="text-gray-400 hover:text-red-500 p-2 disabled:opacity-50"><Trash2 size={18} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bento-card">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Role Permissions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ROLES.map((r) => (
            <div key={r.id} className="p-4 rounded-2xl border border-gray-100 dark:border-navy-700">
              <div className="flex items-center gap-2 mb-2 font-bold text-gray-900 dark:text-white"><r.icon size={18} className="text-emerald-500" /> {r.label}</div>
              <p className="text-sm text-gray-500">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-white dark:bg-navy-800 rounded-3xl shadow-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><Mail size={20} className="text-emerald-500" /> Invite Member</h3>
              <button onClick={() => setShowInvite(false)} className="text-gray-400 hover:text-gray-600"><X /></button>
            </div>
            <div className="space-y-4">
              <div><label className="label-text">Full Name</label><input className="input-field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" /></div>
              <div><label className="label-text">Email</label><input className="input-field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@company.com" /></div>
              <div>
                <label className="label-text">Role</label>
                <div className="space-y-2">
                  {ROLES.map((r) => (
                    <button key={r.id} onClick={() => setRole(r.id)} className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${role === r.id ? 'border-emerald-500 bg-mint-50/50 dark:bg-navy-900' : 'border-gray-100 dark:border-navy-700'}`}>
                      <r.icon size={18} className="text-emerald-500" />
                      <div className="flex-1"><span className="font-bold text-gray-900 dark:text-white text-sm">{r.label}</span><p className="text-xs text-gray-500">{r.desc}</p></div>
                      {role === r.id && <CheckCircle2 size={18} className="text-emerald-500" />}
                    </button>
                  ))}
                </div>
              </div>
              {err && <p className="text-red-500 text-sm">{err}</p>}
              <button onClick={invite} disabled={saving} className="btn-primary w-full py-3 disabled:opacity-60">{saving ? 'Sending…' : 'Send Invite'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
