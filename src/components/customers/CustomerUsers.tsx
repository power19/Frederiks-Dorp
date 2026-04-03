"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Users, Plus, Trash2, Eye, Pencil, Shield, Loader2, X, ChevronDown, KeyRound, Check, UserCog } from "lucide-react";

type User = { id: string; name: string | null; email: string; role: string; customerId: string | null };

const ROLE_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  manager: { label: "Manager", icon: <UserCog size={10} />, color: "bg-purple-100 text-purple-700" },
  editor:  { label: "Editor",  icon: <Pencil size={10} />,  color: "bg-emerald-100 text-emerald-700" },
  viewer:  { label: "Viewer",  icon: <Eye size={10} />,     color: "bg-slate-100 text-slate-600" },
  admin:   { label: "Admin",   icon: <Shield size={10} />,  color: "bg-blue-100 text-blue-700" },
};

const inputCls = "border border-slate-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500";

function ResetPasswordInline({ userId }: { userId: string }) {
  const [open, setOpen]         = useState(false);
  const [password, setPassword] = useState("");
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");
  const [done, setDone]         = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError("");
    const r = await fetch(`/api/admin/users/${userId}/password`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setSaving(false);
    if (!r.ok) {
      const d = await r.json();
      setError(d.error ?? "Failed");
    } else {
      setDone(true);
      setPassword("");
      setTimeout(() => { setOpen(false); setDone(false); }, 1500);
    }
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => { setOpen(!open); setError(""); setPassword(""); }}
        title="Reset password"
        className={`p-1.5 rounded-lg transition-colors ${open ? "text-amber-600 bg-amber-50" : "text-slate-300 hover:text-amber-500 hover:bg-amber-50"}`}
      >
        {open ? <X size={13} /> : <KeyRound size={13} />}
      </button>

      {open && (
        <form onSubmit={submit} className="flex items-center gap-1.5">
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="New password"
            minLength={8}
            required
            className="text-xs border border-amber-300 rounded-lg px-2 py-1 w-36 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-50"
          >
            {saving ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
          </button>
          {error && <span className="text-xs text-red-500">{error}</span>}
          {done  && <span className="text-xs text-emerald-600 font-medium">✓ Done</span>}
        </form>
      )}
    </div>
  );
}

export function CustomerUsers({ customerId }: { customerId: string }) {
  const router = useRouter();
  const { data: session } = useSession();

  const callerRole = (session?.user as { role?: string })?.role ?? "viewer";
  const isAdmin    = callerRole === "admin";
  const isManager  = callerRole === "manager";
  const canManage  = isAdmin || isManager;

  const [users, setUsers]       = useState<User[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");

  const [form, setForm] = useState({ name: "", email: "", password: "", role: "editor" });

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch(`/api/customers/${customerId}/users`);
    if (r.ok) setUsers(await r.json());
    setLoading(false);
  }, [customerId]);

  useEffect(() => { load(); }, [load]);

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError("");
    const r = await fetch(`/api/customers/${customerId}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!r.ok) {
      const d = await r.json();
      setError(d.error ?? "Failed to create user");
    } else {
      setForm({ name: "", email: "", password: "", role: "editor" });
      setShowForm(false);
      await load();
      router.refresh();
    }
    setSaving(false);
  }

  async function changeRole(userId: string, role: string) {
    await fetch(`/api/admin/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    await load();
  }

  async function removeUser(userId: string) {
    if (!confirm("Remove this user from the customer? Their account will be deleted.")) return;
    await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
    await load();
    router.refresh();
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-slate-500" />
          <h3 className="font-semibold text-slate-800">Users &amp; Access</h3>
          {!loading && (
            <span className="text-xs text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">{users.length}</span>
          )}
        </div>
        {canManage && (
          <button
            onClick={() => { setShowForm(!showForm); setError(""); }}
            className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 border border-blue-200 hover:border-blue-400 px-2.5 py-1.5 rounded-lg transition-colors"
          >
            {showForm ? <><X size={12} /> Cancel</> : <><Plus size={12} /> Add user</>}
          </button>
        )}
      </div>

      {/* Add user form */}
      {showForm && canManage && (
        <form onSubmit={createUser} className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">New user for this customer</p>

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Full name</label>
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                placeholder="Jane Doe" className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Email *</label>
              <input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                placeholder="jane@example.com" className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Password *</label>
              <input type="password" autoComplete="new-password" required minLength={8} value={form.password}
                onChange={e => setForm({...form, password: e.target.value})}
                placeholder="Min 8 characters" className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Access level</label>
              <div className="relative">
                <select value={form.role} onChange={e => setForm({...form, role: e.target.value})}
                  className={inputCls + " appearance-none pr-8"}>
                  {isAdmin && <option value="manager">Manager — can manage team passwords</option>}
                  <option value="editor">Editor — can add &amp; edit devices</option>
                  <option value="viewer">Viewer — read only</option>
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <button type="submit" disabled={saving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            {saving ? <><Loader2 size={14} className="animate-spin" />Creating…</> : "Create user"}
          </button>
        </form>
      )}

      {/* User list */}
      {loading ? (
        <div className="flex items-center justify-center py-6 text-slate-400">
          <Loader2 size={18} className="animate-spin mr-2" /> Loading…
        </div>
      ) : users.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-4">
          No users yet — click <strong>Add user</strong> to give someone access.
        </p>
      ) : (
        <div className="divide-y divide-slate-100">
          {users.map(user => {
            const meta = ROLE_META[user.role] ?? ROLE_META.viewer;
            const isSubordinate = ["editor", "viewer"].includes(user.role);
            // Managers can reset editors/viewers; admins can reset anyone
            const canReset = canManage && (isAdmin || (isManager && isSubordinate));
            // Only admins can change roles
            const canChangeRole = isAdmin;

            return (
              <div key={user.id} className="flex items-center gap-3 py-3 flex-wrap">
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-semibold text-sm shrink-0">
                  {(user.name ?? user.email)[0].toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{user.name ?? "—"}</p>
                  <p className="text-xs text-slate-400 truncate">{user.email}</p>
                </div>

                {/* Role selector — admin only */}
                {canChangeRole ? (
                  <select
                    defaultValue={user.role}
                    onChange={e => changeRole(user.id, e.target.value)}
                    className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 shrink-0"
                  >
                    <option value="manager">Manager</option>
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                ) : (
                  <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${meta.color}`}>
                    {meta.icon}{meta.label}
                  </span>
                )}

                {/* Role badge (always shown alongside selector on desktop) */}
                {canChangeRole && (
                  <span className={`hidden sm:flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${meta.color}`}>
                    {meta.icon}{meta.label}
                  </span>
                )}

                {/* Reset password */}
                {canReset && <ResetPasswordInline userId={user.id} />}

                {/* Remove — admin only */}
                {isAdmin && (
                  <button onClick={() => removeUser(user.id)}
                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
