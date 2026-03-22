"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

interface Props {
  customerId: string;
  customerName: string;
}

export function DeleteCustomerButton({ customerId, customerName }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete customer "${customerName}"? This will not delete their devices.`)) return;
    setDeleting(true);
    const res = await fetch(`/api/customers/${customerId}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/customers");
      router.refresh();
    } else {
      setDeleting(false);
      alert("Failed to delete customer.");
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-sm rounded-lg transition-colors disabled:opacity-50"
    >
      <Trash2 size={14} /> {deleting ? "Deleting…" : "Delete"}
    </button>
  );
}
