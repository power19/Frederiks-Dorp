"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";

type Port = {
  id: string;
  portNumber: number;
  label: string | null;
  connectedTo: string | null;
  cableType: string | null;
  notes: string | null;
};

type PortForm = {
  portNumber: string;
  label: string;
  connectedTo: string;
  cableType: string;
  notes: string;
};

const emptyForm: PortForm = { portNumber: "", label: "", connectedTo: "", cableType: "", notes: "" };

const CABLE_TYPES = ["Cat5e", "Cat6", "Cat6A", "Cat7", "Fibre", "Coax", "Other"];

export function PatchPanelPorts({ deviceId }: { deviceId: string }) {
  const [ports, setPorts] = useState<Port[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<PortForm>(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<PortForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  async function loadPorts() {
    const res = await fetch(`/api/devices/${deviceId}/ports`);
    if (res.ok) setPorts(await res.json());
    setLoading(false);
  }

  useEffect(() => { loadPorts(); }, [deviceId]);

  async function addPort() {
    if (!addForm.portNumber) return;
    setSaving(true);
    const res = await fetch(`/api/devices/${deviceId}/ports`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        portNumber: parseInt(addForm.portNumber),
        label: addForm.label || null,
        connectedTo: addForm.connectedTo || null,
        cableType: addForm.cableType || null,
        notes: addForm.notes || null,
      }),
    });
    if (res.ok) {
      setAddForm(emptyForm);
      setShowAdd(false);
      await loadPorts();
    }
    setSaving(false);
  }

  async function saveEdit(portId: string) {
    setSaving(true);
    const res = await fetch(`/api/devices/${deviceId}/ports/${portId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        portNumber: parseInt(editForm.portNumber),
        label: editForm.label || null,
        connectedTo: editForm.connectedTo || null,
        cableType: editForm.cableType || null,
        notes: editForm.notes || null,
      }),
    });
    if (res.ok) {
      setEditId(null);
      await loadPorts();
    }
    setSaving(false);
  }

  async function deletePort(portId: string, portNumber: number) {
    if (!confirm(`Delete port ${portNumber}?`)) return;
    await fetch(`/api/devices/${deviceId}/ports/${portId}`, { method: "DELETE" });
    await loadPorts();
  }

  function startEdit(port: Port) {
    setEditId(port.id);
    setEditForm({
      portNumber: String(port.portNumber),
      label: port.label ?? "",
      connectedTo: port.connectedTo ?? "",
      cableType: port.cableType ?? "",
      notes: port.notes ?? "",
    });
  }

  const inputCls = "border border-slate-300 rounded-lg px-2 py-1 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500";

  if (loading) return <div className="text-sm text-slate-400 py-4 text-center">Loading ports…</div>;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-800">Patch Panel Ports ({ports.length})</h3>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 text-sm font-medium bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={14} /> Add Port
        </button>
      </div>

      {/* Add port form */}
      {showAdd && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold text-blue-900">New Port</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Port # *</label>
              <input type="number" min="1" value={addForm.portNumber} onChange={e => setAddForm(f => ({ ...f, portNumber: e.target.value }))} className={inputCls} placeholder="1" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Label</label>
              <input value={addForm.label} onChange={e => setAddForm(f => ({ ...f, label: e.target.value }))} className={inputCls} placeholder="Reception Desk" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Connected To</label>
              <input value={addForm.connectedTo} onChange={e => setAddForm(f => ({ ...f, connectedTo: e.target.value }))} className={inputCls} placeholder="SW-Main-01 port 3" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Cable Type</label>
              <select value={addForm.cableType} onChange={e => setAddForm(f => ({ ...f, cableType: e.target.value }))} className={inputCls}>
                <option value="">— Select —</option>
                {CABLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-slate-500 mb-1 block">Notes</label>
              <input value={addForm.notes} onChange={e => setAddForm(f => ({ ...f, notes: e.target.value }))} className={inputCls} placeholder="Any notes…" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={addPort} disabled={saving || !addForm.portNumber} className="flex items-center gap-1 text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
              <Check size={13} /> Save Port
            </button>
            <button onClick={() => { setShowAdd(false); setAddForm(emptyForm); }} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors">
              <X size={13} /> Cancel
            </button>
          </div>
        </div>
      )}

      {ports.length === 0 && !showAdd ? (
        <div className="text-center py-8 text-slate-400 text-sm">
          No ports documented yet — click <strong>Add Port</strong> to start
        </div>
      ) : (
        <div className="space-y-2">
          {ports.map(port => (
            <div key={port.id} className="border border-slate-200 rounded-lg overflow-hidden">
              {editId === port.id ? (
                <div className="bg-amber-50 p-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Port #</label>
                      <input type="number" min="1" value={editForm.portNumber} onChange={e => setEditForm(f => ({ ...f, portNumber: e.target.value }))} className={inputCls} />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Label</label>
                      <input value={editForm.label} onChange={e => setEditForm(f => ({ ...f, label: e.target.value }))} className={inputCls} />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Connected To</label>
                      <input value={editForm.connectedTo} onChange={e => setEditForm(f => ({ ...f, connectedTo: e.target.value }))} className={inputCls} />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Cable Type</label>
                      <select value={editForm.cableType} onChange={e => setEditForm(f => ({ ...f, cableType: e.target.value }))} className={inputCls}>
                        <option value="">— Select —</option>
                        {CABLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs text-slate-500 mb-1 block">Notes</label>
                      <input value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} className={inputCls} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(port.id)} disabled={saving} className="flex items-center gap-1 text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                      <Check size={13} /> Save
                    </button>
                    <button onClick={() => setEditId(null)} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors">
                      <X size={13} /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 px-3 py-2.5 bg-white hover:bg-slate-50 transition-colors">
                  <div className="bg-teal-100 text-teal-800 text-xs font-bold w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
                    {port.portNumber}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {port.label && <span className="text-sm font-medium text-slate-800">{port.label}</span>}
                      {port.connectedTo && <span className="text-xs text-slate-500">→ {port.connectedTo}</span>}
                      {port.cableType && (
                        <span className="text-[11px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">{port.cableType}</span>
                      )}
                    </div>
                    {port.notes && <p className="text-xs text-slate-400 mt-0.5 truncate">{port.notes}</p>}
                    {!port.label && !port.connectedTo && <span className="text-xs text-slate-400">No details — click edit to add</span>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => startEdit(port)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => deletePort(port.id, port.portNumber)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
