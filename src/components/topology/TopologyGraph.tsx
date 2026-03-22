"use client";

import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  NodeTypes,
  Handle,
  Position,
  Node,
  Edge,
} from "reactflow";
import "reactflow/dist/style.css";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DeviceStatus, DeviceType } from "@/generated/prisma";
import { X, ExternalLink, Wifi, WifiOff, Wrench } from "lucide-react";

const typeColors: Record<DeviceType, string> = {
  SWITCH:       "#3b82f6",
  ROUTER:       "#8b5cf6",
  ACCESS_POINT: "#06b6d4",
  P2P:          "#f97316",
  POS:          "#ec4899",
  STARLINK:     "#6366f1",
  PATCH_PANEL:  "#0d9488",
};

const typeLabels: Record<DeviceType, string> = {
  SWITCH:       "Switch",
  ROUTER:       "Router",
  ACCESS_POINT: "AP",
  P2P:          "P2P",
  POS:          "POS",
  STARLINK:     "Starlink",
  PATCH_PANEL:  "Patch Panel",
};

const statusDot: Record<DeviceStatus, string> = {
  ACTIVE:      "#10b981",
  INACTIVE:    "#94a3b8",
  MAINTENANCE: "#f59e0b",
};

export type DeviceNodeData = {
  label: string;
  deviceType: DeviceType;
  status: DeviceStatus;
  ipAddress: string | null;
  macAddress: string | null;
  manufacturer: string | null;
  model: string | null;
  serialNumber: string | null;
  location: string | null;
  notes: string | null;
  deviceId: string;
};

function DeviceNode({ data }: { data: DeviceNodeData }) {
  const color = typeColors[data.deviceType] ?? "#94a3b8";
  const dot   = statusDot[data.status]     ?? "#94a3b8";

  return (
    <div
      style={{ borderColor: color }}
      className="bg-white border-2 rounded-xl shadow-lg px-4 py-3 min-w-[140px] cursor-pointer hover:shadow-xl transition-shadow"
    >
      <Handle type="target" position={Position.Top}    style={{ background: color }} />

      <div className="flex items-center gap-2 mb-1">
        <div style={{ background: color }} className="text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
          {typeLabels[data.deviceType] ?? data.deviceType}
        </div>
        <div style={{ background: dot }} className="w-2 h-2 rounded-full" title={data.status} />
      </div>

      <p className="text-sm font-semibold text-slate-800 leading-tight">{data.label}</p>
      {data.ipAddress && (
        <p className="text-[11px] text-slate-400 font-mono mt-0.5">{data.ipAddress}</p>
      )}

      <Handle type="source" position={Position.Bottom} style={{ background: color }} />
    </div>
  );
}

const nodeTypes: NodeTypes = { deviceNode: DeviceNode };

// ── Status badge ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: DeviceStatus }) {
  if (status === "ACTIVE")
    return (
      <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 text-xs font-medium px-2 py-0.5 rounded-full">
        <Wifi size={11} /> Active
      </span>
    );
  if (status === "MAINTENANCE")
    return (
      <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 text-xs font-medium px-2 py-0.5 rounded-full">
        <Wrench size={11} /> Maintenance
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-slate-500 bg-slate-100 border border-slate-200 text-xs font-medium px-2 py-0.5 rounded-full">
      <WifiOff size={11} /> Inactive
    </span>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-slate-400 w-24 shrink-0">{label}</span>
      <span className="text-slate-800 font-medium break-all">{value}</span>
    </div>
  );
}

// ── Popup card ─────────────────────────────────────────────────────────────

function DevicePopup({ data, onClose }: { data: DeviceNodeData; onClose: () => void }) {
  const router    = useRouter();
  const color     = typeColors[data.deviceType] ?? "#94a3b8";
  const typeLabel = typeLabels[data.deviceType]  ?? data.deviceType;

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-80 overflow-hidden border border-slate-200"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ background: color }} className="px-4 py-3 flex items-start justify-between">
          <div>
            <span className="text-white/70 text-[11px] font-semibold uppercase tracking-wider">
              {typeLabel}
            </span>
            <h3 className="text-white font-bold text-base leading-tight mt-0.5">{data.label}</h3>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white mt-0.5 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-4 py-3 space-y-2.5">
          <div><StatusBadge status={data.status} /></div>

          <div className="space-y-1.5 pt-1">
            <Row label="IP Address"   value={data.ipAddress} />
            <Row label="MAC Address"  value={data.macAddress} />
            <Row label="Manufacturer" value={data.manufacturer} />
            <Row label="Model"        value={data.model} />
            <Row label="Serial No."   value={data.serialNumber} />
            <Row label="Location"     value={data.location} />
          </div>

          {data.notes && (
            <div className="bg-slate-50 rounded-lg px-3 py-2 text-xs text-slate-500 border border-slate-100 leading-relaxed">
              {data.notes}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50">
          <button
            onClick={() => router.push(`/devices/${data.deviceId}`)}
            className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ExternalLink size={13} /> Open full details
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main graph ─────────────────────────────────────────────────────────────

interface Props {
  nodes: Node[];
  edges: Edge[];
}

export function TopologyGraph({ nodes, edges }: Props) {
  const [selected, setSelected] = useState<DeviceNodeData | null>(null);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelected(node.data as DeviceNodeData);
  }, []);

  return (
    <div style={{ width: "100%", height: "calc(100vh - 112px)" }} className="relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        onNodeClick={onNodeClick}
      >
        <Background />
        <Controls />
        <MiniMap nodeColor={(n) => typeColors[n.data.deviceType as DeviceType] ?? "#94a3b8"} />
      </ReactFlow>

      {selected && (
        <DevicePopup data={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
