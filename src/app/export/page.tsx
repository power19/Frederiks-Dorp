"use client";

import { useState, useRef } from "react";
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

type ImportRow = {
  row: number;
  name: string;
  status: "ok" | "error" | "skipped";
  message?: string;
};

type ImportResult = {
  total: number;
  created: number;
  skipped: number;
  errors: number;
  dryRun: boolean;
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

export default function ImportExportPage() {
  // Export state
  const [exportType, setExportType] = useState("");
  const [exportStatus, setExportStatus] = useState("");

  // Import state
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [importDone, setImportDone] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function buildExportUrl(format: "csv" | "pdf") {
    const params = new URLSearchParams();
    if (exportType) params.set("type", exportType);
    if (exportStatus) params.set("status", exportStatus);
    return `/api/export/${format}?${params.toString()}`;
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setPreview(null);
    setImportDone(null);
    if (!f) return;

    const fd = new FormData();
    fd.append("file", f);
    fd.append("dryRun", "true");
    const res = await fetch("/api/import/csv", { method: "POST", body: fd });
    const data = await res.json();
    if (res.ok) setPreview(data);
  }

  async function handleImport() {
    if (!file) return;
    setImporting(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("dryRun", "false");
    const res = await fetch("/api/import/csv", { method: "POST", body: fd });
    const data = await res.json();
    setImporting(false);
    if (res.ok) {
      setImportDone(data);
      setPreview(null);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function resetImport() {
    setFile(null);
    setPreview(null);
    setImportDone(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

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

        {/* Template download */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-900">Download CSV Template</p>
            <p className="text-xs text-blue-600 mt-0.5">
              Fill in the template and upload it below. Supported types: SWITCH, ROUTER, ACCESS_POINT, P2P, POS, STARLINK
            </p>
          </div>
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-1.5 bg-blue-600 text-white text-sm font-medium px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors shrink-0 ml-4"
          >
            <FileDown size={14} /> Template
          </button>
        </div>

        {/* Upload area */}
        {!importDone && (
          <div className="bg-white border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="csv-upload"
            />
            <label htmlFor="csv-upload" className="cursor-pointer">
              <div className="flex flex-col items-center gap-2">
                <div className="bg-slate-100 p-3 rounded-full">
                  <Upload size={22} className="text-slate-500" />
                </div>
                <p className="text-sm font-medium text-slate-700">
                  {file ? file.name : "Click to select a CSV file"}
                </p>
                <p className="text-xs text-slate-400">Only .csv files are supported</p>
              </div>
            </label>
          </div>
        )}

        {/* Dry-run preview */}
        {preview && !importDone && (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <p className="font-semibold text-slate-800 text-sm">Preview — {preview.total} rows</p>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-emerald-700 font-medium">{preview.created} to create</span>
                <span className="text-amber-600 font-medium">{preview.skipped} to skip</span>
                <span className="text-red-600 font-medium">{preview.errors} errors</span>
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
              {preview.results.map((r) => (
                <div key={r.row} className="flex items-center gap-3 px-4 py-2 text-sm">
                  {r.status === "ok" && <CheckCircle size={14} className="text-emerald-500 shrink-0" />}
                  {r.status === "error" && <XCircle size={14} className="text-red-500 shrink-0" />}
                  {r.status === "skipped" && <AlertCircle size={14} className="text-amber-500 shrink-0" />}
                  <span className="text-slate-400 w-8 shrink-0 text-xs">#{r.row}</span>
                  <span className="font-medium text-slate-800 flex-1 truncate">{r.name}</span>
                  <span className={
                    r.status === "ok" ? "text-emerald-600 text-xs" :
                    r.status === "error" ? "text-red-600 text-xs" : "text-amber-600 text-xs"
                  }>{r.message}</span>
                </div>
              ))}
            </div>

            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50">
              <button
                onClick={resetImport}
                className="text-sm text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
              >
                Cancel
              </button>
              {preview.created > 0 && (
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="flex items-center gap-1.5 bg-blue-600 text-white text-sm font-medium px-4 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
                >
                  <Upload size={13} />
                  {importing ? "Importing…" : `Import ${preview.created} device${preview.created !== 1 ? "s" : ""}`}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Success result */}
        {importDone && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-emerald-800 font-semibold">
              <CheckCircle size={18} className="text-emerald-600" />
              Import complete
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-lg p-3 text-center border border-emerald-100">
                <p className="text-2xl font-bold text-emerald-700">{importDone.created}</p>
                <p className="text-xs text-slate-500 mt-0.5">Created</p>
              </div>
              <div className="bg-white rounded-lg p-3 text-center border border-amber-100">
                <p className="text-2xl font-bold text-amber-600">{importDone.skipped}</p>
                <p className="text-xs text-slate-500 mt-0.5">Skipped</p>
              </div>
              <div className="bg-white rounded-lg p-3 text-center border border-red-100">
                <p className="text-2xl font-bold text-red-600">{importDone.errors}</p>
                <p className="text-xs text-slate-500 mt-0.5">Errors</p>
              </div>
            </div>
            <button
              onClick={resetImport}
              className="text-sm text-emerald-700 hover:underline"
            >
              Import another file
            </button>
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
          <p className="text-sm text-slate-500">Optionally filter before downloading</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Device Type</label>
              <select
                value={exportType}
                onChange={(e) => setExportType(e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {DEVICE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select
                value={exportStatus}
                onChange={(e) => setExportStatus(e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <a
            href={buildExportUrl("csv")}
            className="flex flex-col items-center gap-3 bg-white border border-slate-200 rounded-xl p-6 hover:border-emerald-300 hover:bg-emerald-50 transition-colors group"
          >
            <div className="bg-emerald-100 text-emerald-700 p-3 rounded-xl group-hover:bg-emerald-200 transition-colors">
              <FileSpreadsheet size={24} />
            </div>
            <div className="text-center">
              <p className="font-semibold text-slate-800">Export CSV</p>
              <p className="text-xs text-slate-500 mt-0.5">Opens in Excel, Google Sheets</p>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-emerald-700 font-medium">
              <Download size={14} /> Download
            </div>
          </a>

          <a
            href={buildExportUrl("pdf")}
            className="flex flex-col items-center gap-3 bg-white border border-slate-200 rounded-xl p-6 hover:border-red-300 hover:bg-red-50 transition-colors group"
          >
            <div className="bg-red-100 text-red-700 p-3 rounded-xl group-hover:bg-red-200 transition-colors">
              <FileText size={24} />
            </div>
            <div className="text-center">
              <p className="font-semibold text-slate-800">Export PDF</p>
              <p className="text-xs text-slate-500 mt-0.5">Formatted report, print-ready</p>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-red-700 font-medium">
              <Download size={14} /> Download
            </div>
          </a>
        </div>
      </section>
    </div>
  );
}
