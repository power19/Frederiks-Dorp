"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function EditCustomerPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [defaultValues, setDefaultValues] = useState<{
    name: string;
    address: string;
    notes: string;
  }>({ name: "", address: "", notes: "" });

  useEffect(() => {
    fetch(`/api/customers/${id}`)
      .then(r => r.json())
      .then(data => {
        setDefaultValues({
          name: data.name ?? "",
          address: data.address ?? "",
          notes: data.notes ?? "",
        });
        setLoading(false);
      });
  }, [id]);

  const field = "border border-slate-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const form = e.currentTarget;
    const data = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value,
      address: (form.elements.namedItem("address") as HTMLInputElement).value || null,
      notes: (form.elements.namedItem("notes") as HTMLTextAreaElement).value || null,
    };

    const res = await fetch(`/api/customers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    setSaving(false);

    if (!res.ok) {
      const err = await res.json();
      setError(err.error?.message ?? "Something went wrong");
      return;
    }

    router.push(`/customers/${id}`);
    router.refresh();
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-slate-400 text-sm">Loading…</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <Link href={`/customers/${id}`} className="flex items-center gap-1 text-slate-500 hover:text-slate-700 text-sm mb-3">
          <ChevronLeft size={14} /> Back to Customer
        </Link>
        <h2 className="text-xl font-bold text-slate-900">Edit Customer</h2>
        <p className="text-slate-500 text-sm">{defaultValues.name}</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-5">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
              <input name="name" required defaultValue={defaultValues.name} className={field} placeholder="e.g. Acme Corp" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
              <input name="address" defaultValue={defaultValues.address} className={field} placeholder="123 Main St, City" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <textarea name="notes" rows={3} defaultValue={defaultValues.notes} className={field} placeholder="Any additional notes…" />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium px-5 py-2 rounded-lg text-sm transition-colors"
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
            <Link
              href={`/customers/${id}`}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-5 py-2 rounded-lg text-sm transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
