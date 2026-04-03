"use client";

import { useState, useEffect } from "react";
import {
  Wifi, Router, Server, Radio, ShoppingCart, Satellite,
  LayoutGrid, MapPin, Loader2, CheckCircle, ChevronDown, X
} from "lucide-react";

const DEVICE_TYPES = [
  { value: "SWITCH",       label: "Switch",      icon: Server,       color: "bg-blue-500" },
  { value: "ROUTER",       label: "Router",      icon: Router,       color: "bg-purple-500" },
  { value: "ACCESS_POINT", label: "AP",           icon: Wifi,         color: "bg-cyan-500" },
  { value: "P2P",          label: "P2P",          icon: Radio,        color: "bg-orange-500" },
  { value: "PATCH_PANEL",  label: "Patch Panel", icon: LayoutGrid,   color: "bg-teal-500" },
  { value: "STARLINK",     label: "Starlink",    icon: Satellite,    color: "bg-indigo-500" },
  { value: "POS",          label: "POS",          icon: ShoppingCart, color: "bg-pink-500" },
];

type Customer = { id: string; name: string };
type Location = { id: string; name: string };

export default function QuickAddPage() {
  const [type, setType]           = useState("");
  const [name, setName]           = useState("");
  const [customerId, setCustomerId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [ip, setIp]               = useState("");
  const [notes, setNotes]         = useState("");
  const [lat, setLat]             = useState("");
  const [lng, setLng]             = useState("");
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError]   = useState("");

  const [customers, setCustomers]   = useState<Customer[]>([]);
  const [locations, setLocations]   = useState<Location[]>([]);

  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState("");

  // Load customers once
  useEffect(() => {
    fetch("/api/customers").then(r => r.json()).then(data => {
      if (Array.isArray(data)) setCustomers(data);
    });
  }, []);

  // Load locations when customer changes
  useEffect(() => {
    if (!customerId) { setLocations([]); setLocationId(""); return; }
    fetch(`/api/customers/${customerId}`).then(r => r.json()).then(data => {
      setLocations(data.locations ?? []);
      setLocationId("");
    });
  }, [customerId]);

  function getGPS() {
    setGpsError("");
    if (!navigator.geolocation) {
      setGpsError("GPS not supported on this device");
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
        setGpsLoading(false);
      },
      (err) => {
        setGpsError("Could not get location: " + err.message);
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!type || !name.trim()) return;
    setSaving(true);
    setError("");

    const res = await fetch("/api/devices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        type,
        status: "ACTIVE",
        ipAddress: ip.trim() || null,
        notes: notes.trim() || null,
        customerId: customerId || null,
        locationId: locationId || null,
        latitude:  lat ? parseFloat(lat) : null,
        longitude: lng ? parseFloat(lng) : null,
      }),
    });

    if (!res.ok) {
      setError("Failed to save — please try again");
      setSaving(false);
      return;
    }

    setSaved(true);
    setTimeout(() => {
      // Reset for next device
      setName(""); setType(""); setIp(""); setNotes("");
      setLat(""); setLng(""); setGpsError("");
      setSaved(false); setSaving(false);
    }, 1800);
  }

  const inputCls = "w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500";
  const selectCls = inputCls + " appearance-none";

  if (saved) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-emerald-50 gap-4 px-6">
        <div className="bg-emerald-100 rounded-full p-6">
          <CheckCircle size={56} className="text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-emerald-800">Device saved!</h2>
        <p className="text-emerald-600 text-center">Adding next device…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-slate-900 text-white px-5 pt-12 pb-5 sticky top-0 z-10">
        <h1 className="text-xl font-bold">Quick Add Device</h1>
        <p className="text-slate-400 text-sm mt-0.5">Log equipment on-site</p>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-5 space-y-5 max-w-lg mx-auto">

        {/* Device type — tap grid */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Device type *</label>
          <div className="grid grid-cols-4 gap-2">
            {DEVICE_TYPES.map(({ value, label, icon: Icon, color }) => (
              <button
                key={value}
                type="button"
                onClick={() => setType(value)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all active:scale-95 ${
                  type === value
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className={`${color} rounded-lg p-2`}>
                  <Icon size={18} className="text-white" />
                </div>
                <span className="text-[11px] font-medium text-slate-700 leading-tight text-center">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Device name *</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. AP-Keuken-01"
            className={inputCls}
            autoComplete="off"
            autoCapitalize="none"
          />
        </div>

        {/* Customer */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Customer</label>
          <div className="relative">
            <select value={customerId} onChange={e => setCustomerId(e.target.value)} className={selectCls}>
              <option value="">— Select customer —</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Location (shown when customer selected and has locations) */}
        {customerId && locations.length > 0 && (
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Location</label>
            <div className="relative">
              <select value={locationId} onChange={e => setLocationId(e.target.value)} className={selectCls}>
                <option value="">— Select location —</option>
                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
              <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
        )}

        {/* GPS */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">GPS Coordinates</label>
          <button
            type="button"
            onClick={getGPS}
            disabled={gpsLoading}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 active:bg-emerald-700 disabled:bg-emerald-300 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {gpsLoading ? (
              <><Loader2 size={18} className="animate-spin" /> Getting location…</>
            ) : (
              <><MapPin size={18} /> Use my location</>
            )}
          </button>
          {gpsError && <p className="text-red-600 text-sm mt-1.5">{gpsError}</p>}
          {(lat || lng) && (
            <div className="mt-2 flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
              <MapPin size={14} className="text-emerald-600 shrink-0" />
              <span className="text-sm text-emerald-800 font-mono flex-1">{lat}, {lng}</span>
              <button type="button" onClick={() => { setLat(""); setLng(""); }} className="text-emerald-500 hover:text-emerald-700">
                <X size={14} />
              </button>
            </div>
          )}
          {/* Manual fallback */}
          {!lat && !lng && (
            <div className="mt-2 grid grid-cols-2 gap-2">
              <input type="text" inputMode="decimal" value={lat} onChange={e => setLat(e.target.value)}
                placeholder="Latitude" className={inputCls + " text-sm"} />
              <input type="text" inputMode="decimal" value={lng} onChange={e => setLng(e.target.value)}
                placeholder="Longitude" className={inputCls + " text-sm"} />
            </div>
          )}
        </div>

        {/* IP (optional) */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">IP Address <span className="text-slate-400 font-normal">(optional)</span></label>
          <input
            type="text"
            value={ip}
            onChange={e => setIp(e.target.value)}
            placeholder="192.168.1.x"
            inputMode="decimal"
            className={inputCls}
            autoComplete="off"
          />
        </div>

        {/* Notes (optional) */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Notes <span className="text-slate-400 font-normal">(optional)</span></label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Location details, serial number, anything useful…"
            rows={3}
            className={inputCls + " resize-none"}
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>
        )}

        {/* Save button */}
        <button
          type="submit"
          disabled={!type || !name.trim() || saving}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 active:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-400 text-white text-lg font-bold py-4 rounded-2xl transition-colors"
        >
          {saving ? <><Loader2 size={20} className="animate-spin" /> Saving…</> : "Save Device"}
        </button>

        <div className="h-4" />
      </form>
    </div>
  );
}
