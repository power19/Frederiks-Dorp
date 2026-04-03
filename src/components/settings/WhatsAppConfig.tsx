"use client";

import { useState, useEffect } from "react";
import { Save, CheckCircle, Loader2 } from "lucide-react";

const inputCls = "border border-slate-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500";

type Config = {
  whatsapp_phone?: string;
  whatsapp_token?: string;
  whatsapp_webhook_secret?: string;
};

export function WhatsAppConfig() {
  const [cfg, setCfg]         = useState<Config>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);

  useEffect(() => {
    fetch("/api/settings/config").then(r => r.json()).then(d => {
      setCfg({
        whatsapp_phone:          d.whatsapp_phone ?? "",
        whatsapp_token:          d.whatsapp_token ?? "",
        whatsapp_webhook_secret: d.whatsapp_webhook_secret ?? "",
      });
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

  if (loading) return <div className="py-4 text-center text-slate-400 text-sm">Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-800">
        <p className="font-semibold mb-1">Coming soon: WhatsApp Bot</p>
        <p className="text-xs text-emerald-700 leading-relaxed">
          Save your WhatsApp Business details here now. When the bot is ready, it will use these credentials to let field engineers log devices by sending a WhatsApp message — no app required.
        </p>
      </div>

      <form onSubmit={save} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            WhatsApp Business Phone Number
          </label>
          <input
            type="tel"
            value={cfg.whatsapp_phone ?? ""}
            onChange={e => setCfg({...cfg, whatsapp_phone: e.target.value})}
            placeholder="+597 xxx xxxx (include country code)"
            className={inputCls}
          />
          <p className="text-xs text-slate-400 mt-1">The number registered with WhatsApp Business API</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Access Token <span className="text-slate-400 font-normal">(WhatsApp Business API)</span>
          </label>
          <input
            type="password"
            autoComplete="new-password"
            value={cfg.whatsapp_token ?? ""}
            onChange={e => setCfg({...cfg, whatsapp_token: e.target.value})}
            placeholder="From Meta Developer Console"
            className={inputCls}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Webhook Verify Token <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <input
            value={cfg.whatsapp_webhook_secret ?? ""}
            onChange={e => setCfg({...cfg, whatsapp_webhook_secret: e.target.value})}
            placeholder="A secret string you choose"
            className={inputCls}
          />
          <p className="text-xs text-slate-400 mt-1">Used to verify incoming webhook calls from Meta</p>
        </div>

        <button type="submit" disabled={saving}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <CheckCircle size={14} /> : <Save size={14} />}
          {saving ? "Saving…" : saved ? "Saved!" : "Save settings"}
        </button>
      </form>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 space-y-1">
        <p className="font-semibold text-slate-700">How to get a WhatsApp Business API token:</p>
        <ol className="list-decimal list-inside space-y-0.5 text-slate-500">
          <li>Go to <strong>developers.facebook.com</strong> and create an app</li>
          <li>Add the <strong>WhatsApp</strong> product to your app</li>
          <li>Under WhatsApp &gt; API Setup, copy your <strong>temporary access token</strong></li>
          <li>Register your phone number and paste it above</li>
        </ol>
      </div>
    </div>
  );
}
