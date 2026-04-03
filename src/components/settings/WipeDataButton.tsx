"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, AlertTriangle, ShieldAlert, CheckCircle } from "lucide-react";

const CONFIRM_WORD = "WIPE";

export function WipeDataButton() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [typed, setTyped]         = useState("");
  const [wiping, setWiping]       = useState(false);
  const [done, setDone]           = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const canWipe = typed === CONFIRM_WORD;

  function open() {
    setTyped(""); setError(null); setDone(false); setShowModal(true);
  }
  function close() {
    if (wiping) return;
    setShowModal(false); setTyped(""); setError(null);
  }

  async function handleWipe() {
    if (!canWipe || wiping) return;
    setWiping(true); setError(null);
    try {
      const res = await fetch("/api/admin/reset", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: "WIPE" }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Something went wrong");
        setWiping(false);
        return;
      }
      setDone(true);
      setTimeout(() => { router.push("/dashboard"); router.refresh(); }, 2000);
    } catch {
      setError("Network error — please try again");
      setWiping(false);
    }
  }

  return (
    <>
      {/* Danger Zone card */}
      <section className="border border-red-200 rounded-2xl overflow-hidden">
        <div className="bg-red-50 px-5 py-3 flex items-center gap-2 border-b border-red-200">
          <ShieldAlert size={15} className="text-red-600" />
          <h3 className="font-semibold text-red-800 text-sm">Danger Zone</h3>
        </div>
        <div className="p-5 flex items-start justify-between gap-6">
          <div>
            <p className="font-medium text-slate-800">Wipe all data</p>
            <p className="text-sm text-slate-500 mt-1">
              Permanently deletes all devices, customers, contacts, locations,
              patch panel documentation and change history. Cannot be undone.
            </p>
          </div>
          <button
            onClick={open}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shrink-0"
          >
            <Trash2 size={14} /> Wipe everything
          </button>
        </div>
      </section>

      {/* Confirmation modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">

            {done ? (
              <div className="p-10 flex flex-col items-center gap-3 text-center">
                <div className="bg-emerald-100 p-4 rounded-full">
                  <CheckCircle size={36} className="text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">All data wiped</h3>
                <p className="text-slate-500 text-sm">Redirecting to dashboard…</p>
              </div>
            ) : (
              <>
                {/* Modal header */}
                <div className="bg-red-600 px-5 py-4 flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <AlertTriangle size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-base">Wipe all data?</h3>
                    <p className="text-red-200 text-xs mt-0.5">This is permanent and cannot be undone</p>
                  </div>
                </div>

                {/* Modal body */}
                <div className="px-6 py-5 space-y-4">
                  <p className="text-sm text-slate-600">The following will be <strong>permanently deleted</strong>:</p>
                  <ul className="text-sm text-slate-700 space-y-1.5">
                    {[
                      "All devices and configurations",
                      "All customers and contact persons",
                      "All locations",
                      "All patch panel port documentation",
                      "All change history / audit logs",
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 text-xs text-amber-800">
                    Type <strong className="font-mono tracking-widest">{CONFIRM_WORD}</strong> to confirm
                  </div>

                  <input
                    autoFocus
                    type="text"
                    value={typed}
                    onChange={(e) => setTyped(e.target.value.toUpperCase())}
                    onKeyDown={(e) => { if (e.key === "Enter") handleWipe(); if (e.key === "Escape") close(); }}
                    placeholder={`Type ${CONFIRM_WORD} to confirm`}
                    className={`w-full border rounded-lg px-3 py-2.5 text-sm font-mono tracking-widest focus:outline-none focus:ring-2 transition-colors ${
                      typed && !canWipe
                        ? "border-red-300 focus:ring-red-400"
                        : canWipe
                        ? "border-emerald-400 focus:ring-emerald-400"
                        : "border-slate-300 focus:ring-red-300"
                    }`}
                  />

                  {error && (
                    <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      {error}
                    </p>
                  )}
                </div>

                {/* Modal footer */}
                <div className="px-6 pb-6 flex gap-3">
                  <button
                    onClick={close}
                    disabled={wiping}
                    className="flex-1 border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleWipe}
                    disabled={!canWipe || wiping}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
                  >
                    {wiping ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Wiping…
                      </>
                    ) : (
                      <>
                        <Trash2 size={14} /> Wipe everything
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
