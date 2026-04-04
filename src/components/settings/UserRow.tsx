"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Eye, Pencil, Shield, Loader2, KeyRound, X, Check, UserCog } from "lucide-react";

type User = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  customerId: string | null;
  createdAt: Date;
};
type Customer = { id: string; name: string };

const ROLE_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  admin:    { label: "Admin",    icon: <Shield size={11} />,  color: "bg-blue-100 text-blue-700" },
  reseller: { label: "Reseller", icon: <Shield size={11} />,  color: "bg-orange-100 text-orange-700" },
  manager:  { label: "Manager",  icon: <UserCog size={11} />, color: "bg-purple-100 text-purple-700" },
  editor:   { label: "Editor",   icon: <Pencil size={11} />,  color: "bg-emerald-100 text-emerald-700" },
  viewer:   { label: "Viewer",   icon: <Eye size={11} />,     color: "bg-slate-100 text-slate-600" },
};

export function UserRow({
  user,
  customers,
  isSelf,
  currentUserRole,
}: {
  user: User;
  customers: Customer[];
  isSelf: boolean;
  currentUserRole: string;
}) {
  const router = useRouter();

  const [role, setRole]             = useState(user.role);
  const [customerId, setCustomerId] = useState(user.customerId ?? "");
  const [saving, setSaving]         = useState(false);
  const [deleting, setDeleting]     = useState(false);

  // Password reset state
  const [showReset, setShowReset]       = useState(false);
  const [newPassword, setNewPassword]   = useState("");
  const [resetSaving, setResetSaving]   = useState(false);
  const [resetError, setResetError]     = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);

  async function patch(data: Record<string, unknown>) {
    setSaving(true);
    await fetch(`/api/admin/users/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSaving(false);
    router.refresh();
  }

  async function handleRoleChange(newRole: string) {
    setRole(newRole);
    if (newRole === "admin") {
      setCustomerId("");
      await patch({ role: newRole, customerId: null });
    } else {
      await patch({ role: newRole });
    }
  }

  async function handleCustomerChange(newCustomerId: string) {
    setCustomerId(newCustomerId);
    await patch({ customerId: newCustomerId || null });
  }

  async function deleteUser() {
    if (!confirm(`Delete "${user.email}"? This cannot be undone.`)) return;
    setDeleting(true);
    await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
    router.refresh();
  }

  async function resetPassword(e: React.FormEvent) {
    e.preventDefault();
    setResetSaving(true);
    setResetError("");
    setResetSuccess(false);
    const res = await fetch(`/api/admin/users/${user.id}/password`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: newPassword }),
    });
    setResetSaving(false);
    if (!res.ok) {
      const d = await res.json();
      setResetError(d.error ?? "Failed to reset password");
    } else {
      setResetSuccess(true);
      setNewPassword("");
      setTimeout(() => { setShowReset(false); setResetSuccess(false); }, 1500);
    }
  }

  const meta    = ROLE_META[role] ?? ROLE_META.viewer;
  const isAdmin = role === "admin";

  // Who can reset whose password:
  // - global admin: can reset anyone (except self)
  // - manager: cannot reset from this page (they use customer detail page)
  const canResetPassword = !isSelf && currentUserRole === "admin";

  return (
    <div className="py-3 space-y-2">
      <div className="flex items-center gap-3 flex-wrap">
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-semibold text-sm shrink-0">
          {(user.name ?? user.email)[0].toUpperCase()}
        </div>

        {/* Name + email */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-800 truncate flex items-center gap-1.5">
            {user.name ?? "—"}
            {isSelf && (
              <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">you</span>
            )}
          </p>
          <p className="text-xs text-slate-400 truncate">{user.email}</p>
        </div>

        {saving && <Loader2 size={14} className="animate-spin text-slate-400 shrink-0" />}

        {/* Role selector */}
        {isSelf ? (
          <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full shrink-0 ${meta.color}`}>
            {meta.icon}{meta.label}
          </span>
        ) : (
          <select
            value={role}
            disabled={saving}
            onChange={(e) => handleRoleChange(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 shrink-0"
          >
            <option value="admin">Admin</option>
            <option value="reseller">Reseller</option>
            <option value="manager">Manager</option>
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>
        )}

        {/* Customer assignment — hidden for admins and self */}
        {!isSelf && !isAdmin && (
          <select
            value={customerId}
            disabled={saving}
            onChange={(e) => handleCustomerChange(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 max-w-[160px] shrink-0"
          >
            <option value="">— No customer —</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}

        {/* Reset password button */}
        {canResetPassword && (
          <button
            onClick={() => { setShowReset(!showReset); setResetError(""); setNewPassword(""); }}
            title="Reset password"
            className={`p-1.5 rounded-lg transition-colors shrink-0 ${showReset ? "text-amber-600 bg-amber-50" : "text-slate-300 hover:text-amber-500 hover:bg-amber-50"}`}
          >
            {showReset ? <X size={14} /> : <KeyRound size={14} />}
          </button>
        )}

        {/* Delete */}
        {!isSelf && (
          <button
            onClick={deleteUser}
            disabled={deleting}
            title="Delete user"
            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40 shrink-0"
          >
            {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
          </button>
        )}
      </div>

      {/* Inline password reset form */}
      {showReset && (
        <form onSubmit={resetPassword} className="ml-11 flex items-center gap-2 flex-wrap">
          <input
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="New password (min 8 chars)"
            minLength={8}
            required
            className="text-xs border border-amber-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400 w-52"
          />
          <button
            type="submit"
            disabled={resetSaving}
            className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-50 transition-colors"
          >
            {resetSaving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
            {resetSaving ? "Saving…" : "Set password"}
          </button>
          {resetError   && <span className="text-xs text-red-600">{resetError}</span>}
          {resetSuccess && <span className="text-xs text-emerald-600 font-medium">✓ Password updated</span>}
        </form>
      )}
    </div>
  );
}
