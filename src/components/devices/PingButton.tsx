"use client";

import { useState } from "react";
import { Wifi, WifiOff, Loader2 } from "lucide-react";

interface PingResult {
  alive: boolean;
  latency: number | null;
  checkedAt: string;
}

export function PingButton({ deviceId }: { deviceId: string }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PingResult | null>(null);

  async function ping() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`/api/devices/${deviceId}/ping`, { method: "POST" });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ alive: false, latency: null, checkedAt: new Date().toISOString() });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={ping}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 text-sm rounded-lg transition-colors"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Wifi size={14} />}
        Ping
      </button>

      {result && (
        <span
          className={`flex items-center gap-1.5 text-sm font-medium ${
            result.alive ? "text-emerald-600" : "text-red-500"
          }`}
        >
          {result.alive ? <Wifi size={14} /> : <WifiOff size={14} />}
          {result.alive
            ? result.latency != null
              ? `${result.latency}ms`
              : "Reachable"
            : "Unreachable"}
        </span>
      )}
    </div>
  );
}
