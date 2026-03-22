"use client";

import { useState } from "react";
import { FileText, FileSpreadsheet, Download } from "lucide-react";

const DEVICE_TYPES = [
  { value: "", label: "All Types" },
  { value: "SWITCH", label: "Switch" },
  { value: "ROUTER", label: "Router" },
  { value: "ACCESS_POINT", label: "Access Point" },
  { value: "P2P", label: "Point-to-Point" },
  { value: "POS", label: "POS System" },
  { value: "STARLINK", label: "Starlink" },
];

const STATUSES = [
  { value: "", label: "All Statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "MAINTENANCE", label: "Maintenance" },
];

export default function ExportPage() {
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");

  function buildUrl(format: "csv" | "pdf") {
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    if (status) params.set("status", status);
    return `/api/export/${format}?${params.toString()}`;
  }

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Export</h2>
        <p className="text-slate-500 text-sm">Download your inventory as CSV or PDF</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <h3 className="font-semibold text-slate-800">Filters</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Device Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
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
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Export buttons */}
      <div className="grid grid-cols-2 gap-4">
        <a
          href={buildUrl("csv")}
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
          href={buildUrl("pdf")}
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
    </div>
  );
}
