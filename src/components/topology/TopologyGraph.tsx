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
import { useRouter } from "next/navigation";
import { DeviceStatus, DeviceType } from "@/generated/prisma";

const typeColors: Record<DeviceType, string> = {
  SWITCH: "#3b82f6",
  ROUTER: "#8b5cf6",
  ACCESS_POINT: "#06b6d4",
  P2P: "#f97316",
  POS: "#ec4899",
  STARLINK: "#6366f1",
};

const typeLabels: Record<DeviceType, string> = {
  SWITCH: "Switch",
  ROUTER: "Router",
  ACCESS_POINT: "AP",
  P2P: "P2P",
  POS: "POS",
  STARLINK: "Starlink",
};

const statusDot: Record<DeviceStatus, string> = {
  ACTIVE: "#10b981",
  INACTIVE: "#94a3b8",
  MAINTENANCE: "#f59e0b",
};

function DeviceNode({ data }: { data: { label: string; deviceType: DeviceType; status: DeviceStatus; ipAddress: string | null; deviceId: string } }) {
  const color = typeColors[data.deviceType] ?? "#94a3b8";
  const dot = statusDot[data.status] ?? "#94a3b8";

  return (
    <div
      style={{ borderColor: color }}
      className="bg-white border-2 rounded-xl shadow-lg px-4 py-3 min-w-[140px] cursor-pointer hover:shadow-xl transition-shadow"
    >
      <Handle type="target" position={Position.Top} style={{ background: color }} />

      <div className="flex items-center gap-2 mb-1">
        <div
          style={{ background: color }}
          className="text-white text-[10px] font-bold px-1.5 py-0.5 rounded"
        >
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

interface Props {
  nodes: Node[];
  edges: Edge[];
}

export function TopologyGraph({ nodes, edges }: Props) {
  const router = useRouter();

  return (
    <div style={{ width: "100%", height: "calc(100vh - 112px)" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        onNodeClick={(_, node) => router.push(`/devices/${node.data.deviceId}`)}
      >
        <Background />
        <Controls />
        <MiniMap nodeColor={(n) => typeColors[n.data.deviceType as DeviceType] ?? "#94a3b8"} />
      </ReactFlow>
    </div>
  );
}
