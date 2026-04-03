"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Check, X, MapPin, Loader2 } from "lucide-react";

type Location = {
  id: string;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
  _count: { devices: number };
};

type Form = {
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  notes: string;
};

const emptyForm: Form = { name: "", address: "", latitude: "", longitude: "", notes: "" };

export function LocationManager({ customerId }: { customerId: string }) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<Form>(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Form>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/customers/${customerId}/locations`);
      if (res.ok) setLocations(await res.json());
      setLoading(false);
    }
    load();
  }, [customerId]);

  function getGps(setForm: (fn: (f: Form) => Form) => void) {
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm(f => ({
          ...f,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
        setGpsLoading(false);
      },
      () => setGpsLoading(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function addLocation() {
    if (!addForm.name) return;
    setSaving(true);
    await fetch(`/api/customers/${customerId}/locations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: addForm.name,
        address: addForm.address || null,
        latitude: addForm.latitude ? parseFloat(addForm.latitude) : null,
        longitude: addForm.longitude ? parseFloat(addForm.longitude) : null,
        notes: addForm.notes || null,
      }),
    });
    setAddForm(emptyForm);
    setShowAdd(false);
    setSaving(false);
    await load();
  }

  async function saveEdit(id: string) {
    setSaving(true);
    await fetch(`/api/locations/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editForm.name,
        address: editForm.address || null,
        latitude: editForm.latitude ? parseFloat(editForm.latitude) : null,
        longitude: editForm.longitude ? parseFloat(editForm.longitude) : null,
        notes: editForm.notes || null,
      }),
    });
    setEditId(null);
    setSaving(false);
    await load();
  }

  async function deleteLocation(id: string, name: string) {
    if (!confirm(`Delete location "${name}"? Devices assigned here will lose their location.`)) return;
    await fetch(`/api/locations/${id}`, { method: "DELETE" });
    await load();
  }

  function startEdit(loc: Location) {
    setEditId(loc.id);
    setEditForm({
      name: loc.name,
      address: loc.address ?? "",
      latitude: loc.latitude != null ? String(loc.latitude) : "",
      longitude: loc.longitude != null ? String(loc.longitude) : "",
      notes: loc.notes ?? "",
    });
  }

  const inp = "border border-slate-300 rounded-lg px-2 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500";

  if (loading) return <div className="text-sm text-slate-400 py-4 text-center">Loading locations…</div>;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-800">Locations ({locations.length})</h3>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 text-sm font-medium bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={14} /> Add Location
        </button>
      </div>

      {showAdd && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold text-blue-900">New Location</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-xs text-slate-500 mb-1 block">Name *</label>
              <input value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} className={inp} placeholder="e.g. Main Office" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-slate-500 mb-1 block">Address</label>
              <input value={addForm.address} onChange={e => setAddForm(f => ({ ...f, address: e.target.value }))} className={inp} placeholder="Street, City" />
            </div>
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-slate-500">GPS Coordinates</label>
                <button type="button" onClick={() => getGps(setAddForm)} disabled={gpsLoading} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50">
                  {gpsLoading ? <Loader2 size={11} className="animate-spin" /> : <MapPin size={11} />}
                  Use My Location
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input type="number" step="any" value={addForm.latitude} onChange={e => setAddForm(f => ({ ...f, latitude: e.target.value }))} className={inp} placeholder="Latitude" />
                <input type="number" step="any" value={addForm.longitude} onChange={e => setAddForm(f => ({ ...f, longitude: e.target.value }))} className={inp} placeholder="Longitude" />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-slate-500 mb-1 block">Notes</label>
              <input value={addForm.notes} onChange={e => setAddForm(f => ({ ...f, notes: e.target.value }))} className={inp} placeholder="Any notes…" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={addLocation} disabled={saving || !addForm.name} className="flex items-center gap-1 text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
              <Check size={13} /> Save Location
            </button>
            <button onClick={() => { setShowAdd(false); setAddForm(emptyForm); }} className="flex items-center gap-1 text-sm text-slate-500 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
              <X size={13} /> Cancel
            </button>
          </div>
        </div>
      )}

      {locations.length === 0 && !showAdd ? (
        <p className="text-sm text-slate-400 text-center py-4">No locations yet — click Add Location to start</p>
      ) : (
        <div className="space-y-2">
          {locations.map(loc => (
            <div key={loc.id} className="border border-slate-200 rounded-lg overflow-hidden">
              {editId === loc.id ? (
                <div className="bg-amber-50 p-3 space-y-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="text-xs text-slate-500 mb-1 block">Name *</label>
                      <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className={inp} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs text-slate-500 mb-1 block">Address</label>
                      <input value={editForm.address} onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))} className={inp} />
                    </div>
                    <div className="sm:col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs text-slate-500">GPS Coordinates</label>
                        <button type="button" onClick={() => getGps(setEditForm)} disabled={gpsLoading} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50">
                          {gpsLoading ? <Loader2 size={11} className="animate-spin" /> : <MapPin size={11} />}
                          Use My Location
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input type="number" step="any" value={editForm.latitude} onChange={e => setEditForm(f => ({ ...f, latitude: e.target.value }))} className={inp} placeholder="Latitude" />
                        <input type="number" step="any" value={editForm.longitude} onChange={e => setEditForm(f => ({ ...f, longitude: e.target.value }))} className={inp} placeholder="Longitude" />
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs text-slate-500 mb-1 block">Notes</label>
                      <input value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} className={inp} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(loc.id)} disabled={saving} className="flex items-center gap-1 text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                      <Check size={13} /> Save
                    </button>
                    <button onClick={() => setEditId(null)} className="flex items-center gap-1 text-sm text-slate-500 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                      <X size={13} /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors">
                  <div className="bg-blue-100 p-1.5 rounded-lg shrink-0">
                    <MapPin size={14} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-800">{loc.name}</span>
                      <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">{loc._count.devices} devices</span>
                    </div>
                    {loc.address && <p className="text-xs text-slate-400 mt-0.5">{loc.address}</p>}
                    {loc.latitude != null && loc.longitude != null && (
                      <a href={`https://maps.google.com/?q=${loc.latitude},${loc.longitude}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">
                        {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)} →
                      </a>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => startEdit(loc)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => deleteLocation(loc.id, loc.name)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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
