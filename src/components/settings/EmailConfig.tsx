"use client";

import { useState, useEffect } from "react";
import { Save, Send, CheckCircle, Loader2, Eye, EyeOff } from "lucide-react";

const inputCls = "border border-slate-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500";

type Config = {
  smtp_host?: string;
  smtp_port?: string;
  smtp_secure?: string;
  smtp_user?: string;
  smtp_pass?: string;
  smtp_from?: string;
};

export function EmailConfig() {
  const [cfg, setCfg]           = useState<Config>({});
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testing, setTesting]   = useState(false);
  const [testResult, setTestResult] = useState<{ ok?: boolean; error?: string } | null>(null);

  useEffect(() => {
    fetch("/api/settings/config").then(r => r.json()).then(d => {
      setCfg(d);
      setLoading(false);
    });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setSaved(false);
    await fetch("/api/settings/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cfg),
    });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function sendTest(e: React.FormEvent) {
    e.preventDefault();
    setTesting(true); setTestResult(null);
    const res = await fetch("/api/settings/config/test-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: testEmail }),
    });
    const d = await res.json();
    setTesting(false);
    setTestResult(res.ok ? { ok: true } : { error: d.error });
  }

  if (loading) return <div className="py-4 text-center text-slate-400 text-sm">Loading…</div>;

  return (
    <div className="space-y-6">
      <form onSubmit={save} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs font-medium text-slate-600 mb-1">SMTP Host</label>
            <input value={cfg.smtp_host ?? ""} onChange={e => setCfg({...cfg, smtp_host: e.target.value})}
              placeholder="smtp.gmail.com" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Port</label>
            <input value={cfg.smtp_port ?? "587"} onChange={e => setCfg({...cfg, smtp_port: e.target.value})}
              placeholder="587" className={inputCls} />
          </div>
          <div className="col-span-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <div
                onClick={() => setCfg({...cfg, smtp_secure: cfg.smtp_secure === "true" ? "false" : "true"})}
                className={`w-9 h-5 rounded-full transition-colors ${cfg.smtp_secure === "true" ? "bg-blue-600" : "bg-slate-300"}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full shadow mt-0.5 transition-transform ${cfg.smtp_secure === "true" ? "translate-x-4" : "translate-x-0.5"}`} />
              </div>
              <span className="text-sm text-slate-700">Use SSL/TLS (port 465)</span>
            </label>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">SMTP Username</label>
            <input type="email" value={cfg.smtp_user ?? ""} onChange={e => setCfg({...cfg, smtp_user: e.target.value})}
              placeholder="you@gmail.com" className={inputCls} autoComplete="off" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">SMTP Password</label>
            <div className="relative">
              <input type={showPass ? "text" : "password"} autoComplete="new-password"
                value={cfg.smtp_pass ?? ""} onChange={e => setCfg({...cfg, smtp_pass: e.target.value})}
                placeholder="App password or SMTP password" className={inputCls + " pr-9"} />
              <button type="button" onClick={() => setShowPass(s => !s)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-600 mb-1">From Address</label>
            <input value={cfg.smtp_from ?? ""} onChange={e => setCfg({...cfg, smtp_from: e.target.value})}
              placeholder="FD Network <noreply@yourdomain.com>" className={inputCls} />
          </div>
        </div>

        <button type="submit" disabled={saving}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <CheckCircle size={14} /> : <Save size={14} />}
          {saving ? "Saving…" : saved ? "Saved!" : "Save settings"}
        </button>
      </form>

      {/* Test email */}
      <div className="border-t border-slate-100 pt-4">
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">Send test email</p>
        <form onSubmit={sendTest} className="flex gap-2">
          <input type="email" required value={testEmail} onChange={e => setTestEmail(e.target.value)}
            placeholder="Send test to…" className={inputCls + " flex-1"} />
          <button type="submit" disabled={testing}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shrink-0">
            {testing ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
            {testing ? "Sending…" : "Send"}
          </button>
        </form>
        {testResult?.ok    && <p className="mt-2 text-sm text-emerald-600 font-medium">✓ Test email sent successfully!</p>}
        {testResult?.error && <p className="mt-2 text-sm text-red-600">{testResult.error}</p>}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-800 space-y-1">
        <p className="font-semibold">Gmail tip:</p>
        <p>Use <strong>smtp.gmail.com</strong>, port <strong>587</strong>, and an <strong>App Password</strong> (not your regular password). Enable 2FA first, then create an App Password in your Google Account security settings.</p>
      </div>
    </div>
  );
}
