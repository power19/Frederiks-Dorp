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
  Connection,
  addEdge,
  useNodesState,
  useEdgesState,
  EdgeProps,
  getBezierPath,
  BaseEdge,
  EdgeLabelRenderer,
} from "reactflow";
import "reactflow/dist/style.css";
import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DeviceStatus, DeviceType } from "@/generated/prisma";
import { X, ExternalLink, Wifi, WifiOff, Wrench, Unlink } from "lucide-react";
import { PatchPort } from "@/lib/topology";

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
  customerId: string | null;
  customerName: string | null;
  customerColor: string;
  locationName: string | null;
  ports: PatchPort[];
};

function DeviceNode({ data }: { data: DeviceNodeData }) {
  const borderColor = data.customerColor;
  const typeColor   = typeColors[data.deviceType] ?? "#94a3b8";
  const dot         = statusDot[data.status]      ?? "#94a3b8";

  return (
    <div
      style={{ borderColor }}
      className="bg-white border-2 rounded-xl shadow-lg px-4 py-3 min-w-[150px] cursor-pointer hover:shadow-xl transition-shadow"
    >
      <Handle type="target" position={Position.Top} style={{ background: borderColor }} />

      <div className="flex items-center gap-2 mb-1">
        <div style={{ background: typeColor }} className="text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
          {typeLabels[data.deviceType] ?? data.deviceType}
        </div>
        <div style={{ background: dot }} className="w-2 h-2 rounded-full" title={data.status} />
      </div>

      <p className="text-sm font-semibold text-slate-800 leading-tight">{data.label}</p>
      {data.ipAddress && (
        <p className="text-[11px] text-slate-400 font-mono mt-0.5">{data.ipAddress}</p>
      )}
      {(data.customerName || data.locationName) && (
        <p className="text-[10px] mt-1 truncate" style={{ color: borderColor }}>
          {[data.customerName, data.locationName].filter(Boolean).join(" · ")}
        </p>
      )}

      <Handle type="source" position={Position.Bottom} style={{ background: borderColor }} />
    </div>
  );
}

// ── Patch Panel Node ────────────────────────────────────────────────────────

const CABLE_COLORS: Record<string, string> = {
  "Cat5e": "#64748b",
  "Cat6":  "#3b82f6",
  "Cat6A": "#6366f1",
  "Cat7":  "#8b5cf6",
  "Fibre": "#f97316",
  "Coax":  "#eab308",
  "Other": "#94a3b8",
};

function PatchPanelNode({ data }: { data: DeviceNodeData }) {
  const [hoveredPort, setHoveredPort] = useState<PatchPort | null>(null);
  const borderColor = data.customerColor;
  const dot = statusDot[data.status] ?? "#94a3b8";
  const ports = data.ports ?? [];
  const COLS = 12;
  const usedPorts = ports.filter(p => p.label || p.connectedTo);

  return (
    <div
      style={{ borderColor, minWidth: Math.min(ports.length, COLS) * 36 + 24 }}
      className="bg-white border-2 rounded-xl shadow-lg overflow-visible cursor-default"
    >
      <Handle type="target" position={Position.Top} style={{ background: borderColor }} />

      {/* Header */}
      <div style={{ background: borderColor }} className="px-3 py-2 rounded-t-[10px] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-white text-[10px] font-bold uppercase tracking-wider">Patch Panel</span>
          <div style={{ background: dot }} className="w-2 h-2 rounded-full" title={data.status} />
        </div>
        <span className="text-white/80 text-[10px]">{usedPorts.length}/{ports.length} ports</span>
      </div>

      {/* Name + location */}
      <div className="px-3 pt-2 pb-1">
        <p className="text-sm font-bold text-slate-800">{data.label}</p>
        {(data.customerName || data.locationName) && (
          <p className="text-[10px] truncate" style={{ color: borderColor }}>
            {[data.customerName, data.locationName].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>

      {/* Port grid */}
      {ports.length > 0 ? (
        <div className="px-3 pb-3 pt-1">
          <div
            className="grid gap-1"
            style={{ gridTemplateColumns: `repeat(${Math.min(ports.length, COLS)}, 32px)` }}
          >
            {ports.map((port) => {
              const hasData = !!(port.label || port.connectedTo);
              const cableColor = port.cableType ? (CABLE_COLORS[port.cableType] ?? "#94a3b8") : null;
              return (
                <div
                  key={port.id}
                  className="relative"
                  onMouseEnter={() => setHoveredPort(port)}
                  onMouseLeave={() => setHoveredPort(null)}
                >
                  <div
                    className="w-8 h-8 rounded flex flex-col items-center justify-center text-[9px] font-bold cursor-pointer transition-all border"
                    style={{
                      background: hasData ? (cableColor ?? "#0d9488") + "20" : "#f8fafc",
                      borderColor: hasData ? (cableColor ?? "#0d9488") : "#e2e8f0",
                      color: hasData ? (cableColor ?? "#0d9488") : "#94a3b8",
                    }}
                  >
                    <span>{port.portNumber}</span>
                    {hasData && (
                      <div
                        className="w-2 h-1 rounded-full mt-0.5"
                        style={{ background: cableColor ?? "#0d9488" }}
                      />
                    )}
                  </div>

                  {/* Tooltip */}
                  {hoveredPort?.id === port.id && (
                    <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 bg-slate-900 text-white rounded-lg shadow-xl p-2.5 text-[11px] pointer-events-none">
                      <p className="font-bold text-xs mb-1">Port {port.portNumber}</p>
                      {port.label && (
                        <p className="text-slate-300"><span className="text-slate-500">Label:</span> {port.label}</p>
                      )}
                      {port.connectedTo && (
                        <p className="text-slate-300"><span className="text-slate-500">→</span> {port.connectedTo}</p>
                      )}
                      {port.cableType && (
                        <p className="mt-1">
                          <span
                            className="px-1.5 py-0.5 rounded text-white text-[10px] font-medium"
                            style={{ background: CABLE_COLORS[port.cableType] ?? "#94a3b8" }}
                          >
                            {port.cableType}
                          </span>
                        </p>
                      )}
                      {port.notes && (
                        <p className="text-slate-400 mt-1 text-[10px] italic">{port.notes}</p>
                      )}
                      {!port.label && !port.connectedTo && (
                        <p className="text-slate-500 italic">Empty port</p>
                      )}
                      {/* Tooltip arrow */}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Cable legend */}
          {ports.some(p => p.cableType) && (
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-2">
              {Array.from(new Set(ports.filter(p => p.cableType).map(p => p.cableType!))).map(ct => (
                <span key={ct} className="flex items-center gap-1 text-[9px] text-slate-500">
                  <span className="w-2 h-2 rounded-full" style={{ background: CABLE_COLORS[ct] ?? "#94a3b8" }} />
                  {ct}
                </span>
              ))}
            </div>
          )}
        </div>
      ) : (
        <p className="px-3 pb-3 text-[11px] text-slate-400 italic">No ports documented</p>
      )}

      <Handle type="source" position={Position.Bottom} style={{ background: borderColor }} />
    </div>
  );
}

const nodeTypes: NodeTypes = { deviceNode: DeviceNode, patchPanelNode: PatchPanelNode };

// ── Deletable edge ──────────────────────────────────────────────────────────

function DeletableEdge({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition, data, animated, markerEnd,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });

  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={{ stroke: "#94a3b8", strokeWidth: 2, ...(animated ? { strokeDasharray: "5 3" } : {}) }} />
      <EdgeLabelRenderer>
        <div
          style={{ position: "absolute", transform: `translate(-50%,-50%) translate(${labelX}px,${labelY}px)`, pointerEvents: "all" }}
          className="nodrag nopan"
        >
          <button
            onClick={() => data?.onDelete(id)}
            title="Remove connection"
            className="w-5 h-5 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ opacity: 0 }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "0")}
          >
            <Unlink size={10} />
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

const edgeTypes = { deletable: DeletableEdge };

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
            <Row label="Customer"     value={data.customerName} />
            <Row label="Location"     value={data.locationName} />
            <Row label="IP Address"   value={data.ipAddress} />
            <Row label="MAC Address"  value={data.macAddress} />
            <Row label="Manufacturer" value={data.manufacturer} />
            <Row label="Model"        value={data.model} />
            <Row label="Serial No."   value={data.serialNumber} />
            <Row label="Site Location" value={data.location} />
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

async function saveConnection(childId: string, parentId: string | null) {
  await fetch(`/api/devices/${childId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ parentId }),
  });
}

export function TopologyGraph({ nodes: initNodes, edges: initEdges }: Props) {
  const [selected, setSelected]   = useState<DeviceNodeData | null>(null);
  const [saving, setSaving]        = useState(false);

  // Attach onDelete callback to every edge
  const withDeleteCb = useCallback((edges: Edge[]) =>
    edges.map(e => ({
      ...e,
      type: "deletable",
      animated: e.animated,
      data: { ...e.data, onDelete: handleDeleteEdge },
    })),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  []);

  const [nodes, setNodes, onNodesChange] = useNodesState(initNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(withDeleteCb(initEdges));

  // Re-sync when parent passes new data (customer switch)
  useEffect(() => { setNodes(initNodes); },  [initNodes, setNodes]);
  useEffect(() => { setEdges(withDeleteCb(initEdges)); }, [initEdges, setEdges, withDeleteCb]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelected(node.data as DeviceNodeData);
  }, []);

  // Draw a new connection
  const onConnect = useCallback(async (connection: Connection) => {
    if (!connection.source || !connection.target) return;
    setSaving(true);
    try {
      await saveConnection(connection.target, connection.source);
      setEdges(eds => addEdge(
        { ...connection, type: "deletable", data: { onDelete: handleDeleteEdge } },
        eds
      ));
    } finally {
      setSaving(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setEdges]);

  // Remove a connection
  // eslint-disable-next-line react-hooks/exhaustive-deps
  function handleDeleteEdge(edgeId: string) {
    const edge = edges.find(e => e.id === edgeId);
    if (!edge) return;
    setSaving(true);
    saveConnection(edge.target, null).finally(() => setSaving(false));
    setEdges(eds => eds.filter(e => e.id !== edgeId));
  }

  return (
    <div style={{ width: "100%", height: "calc(100vh - 112px)" }} className="relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        fitView
        deleteKeyCode="Delete"
        connectOnClick={false}
      >
        <Background />
        <Controls />
        <MiniMap nodeColor={(n) => (n.data as DeviceNodeData).customerColor ?? "#94a3b8"} />
      </ReactFlow>

      {/* Saving indicator */}
      {saving && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-3 py-1.5 rounded-full shadow-lg z-50">
          Saving…
        </div>
      )}

      {/* Hint bar */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur border border-slate-200 text-slate-500 text-xs px-4 py-1.5 rounded-full shadow z-40 pointer-events-none">
        Drag from a node's <strong className="text-slate-700">bottom handle</strong> to another node to connect · Hover an edge then click <strong className="text-red-500">✕</strong> to remove
      </div>

      {selected && (
        <DevicePopup data={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
