"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Customer = { id: string; name: string };

export function AddUserForm() {
  const router = useRouter();
  const [currentRole, setCurrentRole] = useState<string>("");
  const [form, setForm]         = useState({ name: "", email: "", role: "viewer", customerId: "" });
  const [createdPassword, setCreatedPassword] = useState<{ password: string; emailSent: boolean } | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    fetch("/api/customers")
      .then(r => r.json())
      .then((data) => setCustomers(Array.isArray(data) ? data : []))
      .catch(() => {});
    fetch("/api/auth/session")
      .then(r => r.json())
      .then(s => setCurrentRole(s?.user?.role ?? ""))
      .catch(() => {});
  }, []);

  const needsCustomer = !["admin", "reseller"].includes(form.role);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (needsCustomer && !form.customerId) {
      setError("Please select a customer for this role.");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    setCreatedPassword(null);

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        customerId: needsCustomer ? form.customerId : null,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      const raw = data.error;
      if (typeof raw === "string") {
        setError(raw);
      } else if (raw?.fieldErrors) {
        const first = Object.values(raw.fieldErrors as Record<string, string[]>)[0]?.[0]
          ?? raw.formErrors?.[0]
          ?? "Validation error";
        setError(first);
      } else {
        setError(raw?.message ?? "Failed to create user");
      }
    } else {
      const data = await res.json();
      setCreatedPassword({ password: data.plainPassword, emailSent: data.emailSent });
      setSuccess("User created successfully");
      setForm({ name: "", email: "", role: "viewer", customerId: "" });
      router.refresh();
    }
  }

  const field = "border border-slate-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}
      {success && createdPassword && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg text-sm space-y-1.5">
          <p className="font-semibold">✓ User created successfully</p>
          <p>Generated password: <span className="font-mono bg-emerald-100 px-2 py-0.5 rounded text-emerald-900 select-all">{createdPassword.password}</span></p>
          {createdPassword.emailSent
            ? <p className="text-emerald-600">✉ Welcome email sent with credentials.</p>
            : <p className="text-amber-600">⚠ Email could not be sent — share the password manually.</p>
          }
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={field}
            placeholder="John Doe"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className={field}
            placeholder="john@example.com"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value, customerId: "" })}
            className={field}
          >
            {currentRole === "admin" && (
              <>
                <option value="admin">Admin — full global access</option>
                <option value="reseller">Reseller — manages their own customers</option>
              </>
            )}
            <option value="manager">Manager — resets team passwords</option>
            <option value="editor">Editor — add &amp; edit devices</option>
            <option value="viewer">Viewer — read only</option>
          </select>
        </div>

        {needsCustomer && (
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Customer <span className="text-red-500">*</span>
            </label>
            <select
              value={form.customerId}
              onChange={(e) => setForm({ ...form, customerId: e.target.value })}
              className={field}
              required
            >
              <option value="">— Select a customer —</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-1">
              This user will only see data for the selected customer.
            </p>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium px-5 py-2 rounded-lg text-sm transition-colors"
      >
        {loading ? "Creating…" : "Create User"}
      </button>
    </form>
  );
}
