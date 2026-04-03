"use client";

import { useState, useRef, useEffect } from "react";
import {
  FileText,
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileDown,
} from "lucide-react";

const DEVICE_TYPES = [
  { value: "", label: "All Types" },
  { value: "SWITCH", label: "Switch" },
  { value: "ROUTER", label: "Router" },
  { value: "ACCESS_POINT", label: "Access Point" },
  { value: "P2P", label: "Point-to-Point" },
  { value: "POS", label: "POS System" },
  { value: "STARLINK", label: "Starlink" },
  { value: "PATCH_PANEL", label: "Patch Panel" },
];

const STATUSES = [
  { value: "", label: "All Statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "MAINTENANCE", label: "Maintenance" },
];

type Customer  = { id: string; name: string };
type Location  = { id: string; name: string };

type ImportRow = {
  row: number;
  name: string;
  status: "ok" | "error" | "skipped";
  message?: string;
};

type ImportResult = {
  total: number;
  created?: number;
  skipped?: number;
  errors?: number;
  linked?: number;
  missed?: number;
  dryRun: boolean;
  linkOnly?: boolean;
  results: ImportRow[];
};

const CSV_TEMPLATE_HEADERS =
  "name,type,ipAddress,macAddress,manufacturer,model,serialNumber,location,status,notes";
const CSV_TEMPLATE_ROWS = [
  "Core-Router-01,ROUTER,192.168.1.1,AA:BB:CC:11:22:33,MikroTik,RB4011,,Main Site,ACTIVE,Core router",
  "SW-Main-01,SWITCH,192.168.1.10,,Ubiquiti,US-24-Pro,,Main Site,ACTIVE,",
  "AP-Main-01,ACCESS_POINT,192.168.1.20,,Ubiquiti,U6-Pro,,Main Site,ACTIVE,",
  "P2P-Site2,P2P,10.0.0.1,,Ubiquiti,LiteBeam 5AC,,Main Site,ACTIVE,Link to Site 2",
  "POS-Terminal-01,POS,192.168.1.50,,Verifone,VX520,,Front Desk,ACTIVE,",
  "Starlink-Main,STARLINK,192.168.100.1,,SpaceX,Standard,,Roof,ACTIVE,Primary uplink",
  "PP-Main-01,PATCH_PANEL,,,Generic,24-Port,,Server Room,ACTIVE,Main distribution patch panel",
];
const CSV_TEMPLATE = [CSV_TEMPLATE_HEADERS, ...CSV_TEMPLATE_ROWS].join("\n");

function downloadTemplate() {
  const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "device-import-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

const sel =
  "border border-slate-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";

export default function ImportExportPage() {
  // ── Export filters ────────────────────────────────────────────────────────
  const [exportCustomerId, setExportCustomerId] = useState("");
  const [exportLocationId, setExportLocationId] = useState("");
  const [exportType,       setExportType]       = useState("");
  const [exportStatus,     setExportStatus]     = useState("");
  const [exporting,        setExporting]        = useState<"csv" | "pdf" | null>(null);
  const [exportError,      setExportError]      = useState<string | null>(null);

  // ── Customer / location data ──────────────────────────────────────────────
  const [customers,  setCustomers]  = useState<Customer[]>([]);
  const [locations,  setLocations]  = useState<Location[]>([]);

  useEffect(() => {
    fetch("/api/customers").then(r => r.json()).then(d => setCustomers(Array.isArray(d) ? d : []));
  }, []);

  useEffect(() => {
    setExportLocationId("");
    if (!exportCustomerId) { setLocations([]); return; }
    fetch(`/api/customers/${exportCustomerId}`)
      .then(r => r.json())
      .then(d => setLocations(Array.isArray(d.locations) ? d.locations : []));
  }, [exportCustomerId]);

  // ── Import state ──────────────────────────────────────────────────────────
  const [file,       setFile]       = useState<File | null>(null);
  const [preview,    setPreview]    = useState<ImportResult | null>(null);
  const [importing,  setImporting]  = useState(false);
  const [importDone, setImportDone] = useState<ImportResult | null>(null);
  const [linkOnly,   setLinkOnly]   = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Export helpers ────────────────────────────────────────────────────────
  function buildDeviceParams() {
    const p = new URLSearchParams();
    if (exportCustomerId) p.set("customerId", exportCustomerId);
    if (exportLocationId) p.set("locationId", exportLocationId);
    if (exportType)       p.set("type",       exportType);
    if (exportStatus)     p.set("status",     exportStatus);
    return p;
  }

  function buildExportFilterLabel() {
    const parts: string[] = [];
    if (exportCustomerId) parts.push(customers.find(c => c.id === exportCustomerId)?.name ?? "");
    if (exportLocationId) parts.push(locations.find(l => l.id === exportLocationId)?.name ?? "");
    if (exportType)       parts.push(DEVICE_TYPES.find(t => t.value === exportType)?.label ?? "");
    if (exportStatus)     parts.push(STATUSES.find(s => s.value === exportStatus)?.label ?? "");
    return parts.length ? parts.join(" · ") : "All devices";
  }

  async function handleExport(format: "csv" | "pdf") {
    setExporting(format);
    setExportError(null);
    try {
      if (format === "csv") {
        const params = buildDeviceParams();
        const res = await fetch(`/api/export/csv?${params}`);
        if (!res.ok) { setExportError(`Export failed (${res.status})`); return; }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `network-inventory-${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        const params = buildDeviceParams();
        const res = await fetch(`/api/devices?${params}`);
        if (!res.ok) { setExportError(`Failed to load devices (${res.status})`); return; }
        const { devices } = await res.json();
        openPrintWindow(devices, buildExportFilterLabel());
      }
    } catch {
      setExportError("Network error — is the server running?");
    } finally {
      setExporting(null);
    }
  }

  function openPrintWindow(devices: Record<string, string | null>[], filterLabel: string) {
    const date = new Date().toLocaleString();
    const rows = devices.map((d) => `
      <tr>
        <td>${d.name ?? ""}</td>
        <td>${d.type ?? ""}</td>
        <td>${d.ipAddress ?? ""}</td>
        <td>${d.macAddress ?? ""}</td>
        <td>${d.manufacturer ?? ""}</td>
        <td>${d.model ?? ""}</td>
        <td>${d.serialNumber ?? ""}</td>
        <td>${d.location ?? ""}</td>
        <td class="status ${(d.status ?? "").toLowerCase()}">${d.status ?? ""}</td>
        <td>${d.notes ?? ""}</td>
      </tr>`).join("");

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
      <title>Network Inventory — ${filterLabel}</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 10px; margin: 20px; color: #0f172a; }
        h1 { font-size: 18px; margin-bottom: 2px; }
        .sub { color: #3b82f6; font-weight: 600; font-size: 12px; margin-bottom: 2px; }
        .meta { color: #64748b; font-size: 10px; margin-bottom: 14px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #1e40af; color: white; padding: 6px 8px; text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: .05em; }
        td { padding: 5px 8px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
        tr:nth-child(even) td { background: #f8fafc; }
        .status.active   { color: #059669; font-weight: 600; }
        .status.inactive { color: #dc2626; }
        .status.maintenance { color: #d97706; }
        @media print { button { display: none !important; } }
      </style></head><body>
      <h1>Network Inventory Report</h1>
      <p class="sub">${filterLabel}</p>
      <p class="meta">Generated: ${date} &nbsp;·&nbsp; ${devices.length} device${devices.length !== 1 ? "s" : ""}</p>
      <button onclick="window.print()" style="margin-bottom:14px;padding:7px 16px;background:#1e40af;color:white;border:none;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;">
        🖨&nbsp; Print / Save as PDF
      </button>
      <table>
        <thead><tr>
          <th>Name</th><th>Type</th><th>IP Address</th><th>MAC</th>
          <th>Manufacturer</th><th>Model</th><th>Serial #</th>
          <th>Location</th><th>Status</th><th>Notes</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table></body></html>`;

    const win = window.open("", "_blank");
    if (win) { win.document.write(html); win.document.close(); }
    else setExportError("Pop-up blocked — please allow pop-ups for this site.");
  }

  // ── Import handlers ───────────────────────────────────────────────────────
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f); setPreview(null); setImportDone(null);
    if (!f) return;
    const fd = new FormData();
    fd.append("file", f); fd.append("dryRun", "true");
    fd.append("linkOnly", linkOnly ? "true" : "false");
    const res = await fetch("/api/import/csv", { method: "POST", body: fd });
    const data = await res.json();
    if (res.ok) setPreview(data);
  }

  async function handleImport() {
    if (!file) return;
    setImporting(true);
    const fd = new FormData();
    fd.append("file", file); fd.append("dryRun", "false");
    fd.append("linkOnly", linkOnly ? "true" : "false");
    const res = await fetch("/api/import/csv", { method: "POST", body: fd });
    const data = await res.json();
    setImporting(false);
    if (res.ok) {
      setImportDone(data); setPreview(null); setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function resetImport() {
    setFile(null); setPreview(null); setImportDone(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-3xl space-y-8">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Import / Export</h2>
        <p className="text-slate-500 text-sm">Bulk import devices from CSV or export your inventory</p>
      </div>

      {/* ── IMPORT ── */}
      <section className="space-y-4">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <Upload size={16} className="text-blue-600" /> Import Devices
        </h3>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900">Download CSV Template</p>
              <p className="text-xs text-blue-600 mt-0.5">
                Columns: name, type, ipAddress, macAddress, manufacturer, model, serialNumber, location, status, <strong>connectedTo</strong>, notes
              </p>
            </div>
            <div className="flex gap-2 ml-4 shrink-0">
              <button onClick={downloadTemplate} className="flex items-center gap-1.5 bg-blue-600 text-white text-sm font-medium px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                <FileDown size={14} /> Blank template
              </button>
              <a href="/sample-network-import.csv" download className="flex items-center gap-1.5 bg-indigo-600 text-white text-sm font-medium px-3 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                <FileDown size={14} /> Sample network
              </a>
            </div>
          </div>
        </div>

        <label className="flex items-center gap-3 cursor-pointer select-none">
          <div
            onClick={() => { setLinkOnly(l => !l); setFile(null); setPreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
            className={`w-10 h-5 rounded-full transition-colors ${linkOnly ? "bg-indigo-600" : "bg-slate-300"}`}
          >
            <div className={`w-4 h-4 bg-white rounded-full shadow mt-0.5 transition-transform ${linkOnly ? "translate-x-5" : "translate-x-1"}`} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-800">Link connections only</p>
            <p className="text-xs text-slate-500">Only reads the <code className="bg-slate-100 px-1 rounded">connectedTo</code> column — links existing devices without creating new ones</p>
          </div>
        </label>

        {!importDone && (
          <div className="bg-white border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors">
            <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden" id="csv-upload" />
            <label htmlFor="csv-upload" className="cursor-pointer">
              <div className="flex flex-col items-center gap-2">
                <div className="bg-slate-100 p-3 rounded-full"><Upload size={22} className="text-slate-500" /></div>
                <p className="text-sm font-medium text-slate-700">{file ? file.name : "Click to select a CSV file"}</p>
                <p className="text-xs text-slate-400">Only .csv files are supported</p>
              </div>
            </label>
          </div>
        )}

        {preview && !importDone && (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <p className="font-semibold text-slate-800 text-sm">Preview — {preview.total} rows</p>
              <div className="flex items-center gap-3 text-xs">
                {preview.linkOnly ? (
                  <><span className="text-emerald-700 font-medium">{preview.linked} to link</span><span className="text-amber-600 font-medium">{preview.missed} not found</span></>
                ) : (
                  <><span className="text-emerald-700 font-medium">{preview.created} to create</span><span className="text-amber-600 font-medium">{preview.skipped} to skip</span><span className="text-red-600 font-medium">{preview.errors} errors</span></>
                )}
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
              {preview.results.map((r) => (
                <div key={r.row} className="flex items-center gap-3 px-4 py-2 text-sm">
                  {r.status === "ok"      && <CheckCircle  size={14} className="text-emerald-500 shrink-0" />}
                  {r.status === "error"   && <XCircle      size={14} className="text-red-500 shrink-0" />}
                  {r.status === "skipped" && <AlertCircle  size={14} className="text-amber-500 shrink-0" />}
                  <span className="text-slate-400 w-8 shrink-0 text-xs">#{r.row}</span>
                  <span className="font-medium text-slate-800 flex-1 truncate">{r.name}</span>
                  <span className={r.status === "ok" ? "text-emerald-600 text-xs" : r.status === "error" ? "text-red-600 text-xs" : "text-amber-600 text-xs"}>{r.message}</span>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50">
              <button onClick={resetImport} className="text-sm text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">Cancel</button>
              {(preview.linkOnly ? (preview.linked ?? 0) > 0 : (preview.created ?? 0) > 0) && (
                <button onClick={handleImport} disabled={importing} className="flex items-center gap-1.5 bg-blue-600 text-white text-sm font-medium px-4 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors">
                  <Upload size={13} />
                  {importing
                    ? (preview.linkOnly ? "Linking…" : "Importing…")
                    : preview.linkOnly
                      ? `Link ${preview.linked} connection${(preview.linked ?? 0) !== 1 ? "s" : ""}`
                      : `Import ${preview.created} device${(preview.created ?? 0) !== 1 ? "s" : ""}`}
                </button>
              )}
            </div>
          </div>
        )}

        {importDone && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-emerald-800 font-semibold">
              <CheckCircle size={18} className="text-emerald-600" />
              {importDone.linkOnly ? "Connections linked" : "Import complete"}
            </div>
            {importDone.linkOnly ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-lg p-3 text-center border border-emerald-100"><p className="text-2xl font-bold text-emerald-700">{importDone.linked}</p><p className="text-xs text-slate-500 mt-0.5">Linked</p></div>
                <div className="bg-white rounded-lg p-3 text-center border border-amber-100"><p className="text-2xl font-bold text-amber-600">{importDone.missed}</p><p className="text-xs text-slate-500 mt-0.5">Not found</p></div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-lg p-3 text-center border border-emerald-100"><p className="text-2xl font-bold text-emerald-700">{importDone.created}</p><p className="text-xs text-slate-500 mt-0.5">Created</p></div>
                <div className="bg-white rounded-lg p-3 text-center border border-amber-100"><p className="text-2xl font-bold text-amber-600">{importDone.skipped}</p><p className="text-xs text-slate-500 mt-0.5">Skipped</p></div>
                <div className="bg-white rounded-lg p-3 text-center border border-red-100"><p className="text-2xl font-bold text-red-600">{importDone.errors}</p><p className="text-xs text-slate-500 mt-0.5">Errors</p></div>
              </div>
            )}
            <button onClick={resetImport} className="text-sm text-emerald-700 hover:underline">Import another file</button>
          </div>
        )}
      </section>

      <hr className="border-slate-200" />

      {/* ── EXPORT ── */}
      <section className="space-y-4">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <Download size={16} className="text-slate-600" /> Export Inventory
        </h3>

        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <p className="text-sm text-slate-500">Filter before exporting — all filters are optional</p>

          {/* Row 1: Customer + Location */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Customer</label>
              <select value={exportCustomerId} onChange={e => setExportCustomerId(e.target.value)} className={sel}>
                <option value="">All Customers</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
              <select value={exportLocationId} onChange={e => setExportLocationId(e.target.value)} disabled={!exportCustomerId || locations.length === 0} className={`${sel} disabled:opacity-50 disabled:cursor-not-allowed`}>
                <option value="">All Locations</option>
                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
          </div>

          {/* Row 2: Type + Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Device Type</label>
              <select value={exportType} onChange={e => setExportType(e.target.value)} className={sel}>
                {DEVICE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select value={exportStatus} onChange={e => setExportStatus(e.target.value)} className={sel}>
                {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>

          {/* Active filter summary */}
          {(exportCustomerId || exportLocationId || exportType || exportStatus) && (
            <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
              <p className="text-xs text-blue-800 font-medium">Exporting: <span className="font-bold">{buildExportFilterLabel()}</span></p>
              <button onClick={() => { setExportCustomerId(""); setExportLocationId(""); setExportType(""); setExportStatus(""); }} className="text-xs text-blue-600 hover:text-blue-800 hover:underline">Clear all</button>
            </div>
          )}
        </div>

        {exportError && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{exportError}</p>
        )}

        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => handleExport("csv")} disabled={exporting !== null}
            className="flex flex-col items-center gap-3 bg-white border border-slate-200 rounded-xl p-6 hover:border-emerald-300 hover:bg-emerald-50 transition-colors group disabled:opacity-60 disabled:cursor-not-allowed">
            <div className="bg-emerald-100 text-emerald-700 p-3 rounded-xl group-hover:bg-emerald-200 transition-colors"><FileSpreadsheet size={24} /></div>
            <div className="text-center">
              <p className="font-semibold text-slate-800">Export CSV</p>
              <p className="text-xs text-slate-500 mt-0.5">Opens in Excel, Google Sheets</p>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-emerald-700 font-medium">
              {exporting === "csv" ? <><div className="w-3.5 h-3.5 border-2 border-emerald-300 border-t-emerald-700 rounded-full animate-spin" /> Generating…</> : <><Download size={14} /> Download</>}
            </div>
          </button>

          <button onClick={() => handleExport("pdf")} disabled={exporting !== null}
            className="flex flex-col items-center gap-3 bg-white border border-slate-200 rounded-xl p-6 hover:border-red-300 hover:bg-red-50 transition-colors group disabled:opacity-60 disabled:cursor-not-allowed">
            <div className="bg-red-100 text-red-700 p-3 rounded-xl group-hover:bg-red-200 transition-colors"><FileText size={24} /></div>
            <div className="text-center">
              <p className="font-semibold text-slate-800">Export PDF</p>
              <p className="text-xs text-slate-500 mt-0.5">Print-ready report, opens in new tab</p>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-red-700 font-medium">
              {exporting === "pdf" ? <><div className="w-3.5 h-3.5 border-2 border-red-300 border-t-red-700 rounded-full animate-spin" /> Generating…</> : <><Download size={14} /> Open report</>}
            </div>
          </button>
        </div>
      </section>
    </div>
  );
}
