import dagre from "dagre";
import { DeviceStatus, DeviceType } from "@/generated/prisma";
import { TopologyEdge, TopologyNode } from "@/types";

// Cycle through these for customer color coding
export const CUSTOMER_COLORS = [
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#06b6d4", // cyan
  "#f97316", // orange
  "#ec4899", // pink
];

export function getCustomerColor(
  customerId: string | null,
  customerIndex: Map<string, number>
): string {
  if (!customerId) return "#94a3b8"; // slate for unassigned
  const idx = customerIndex.get(customerId) ?? 0;
  return CUSTOMER_COLORS[idx % CUSTOMER_COLORS.length];
}

export interface PatchPort {
  id: string;
  portNumber: number;
  label: string | null;
  connectedTo: string | null;
  cableType: string | null;
  notes: string | null;
}

interface DeviceNode {
  id: string;
  name: string;
  type: DeviceType;
  status: DeviceStatus;
  ipAddress: string | null;
  macAddress?: string | null;
  manufacturer?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  location?: string | null;
  notes?: string | null;
  parentId: string | null;
  customerId?: string | null;
  locationId?: string | null;
  customer?: { id: string; name: string } | null;
  assignedLocation?: { id: string; name: string } | null;
  ports?: PatchPort[];
}

// Node dimensions used for dagre spacing
const NODE_WIDTH = 200;
const NODE_HEIGHT = 80;
const PATCH_PANEL_HEIGHT = 160; // taller for port grid

export function buildTopologyGraph(
  devices: DeviceNode[],
  customerIndex: Map<string, number>
): {
  nodes: TopologyNode[];
  edges: TopologyEdge[];
} {
  const nodeMap = new Map<string, DeviceNode>();
  devices.forEach((d) => nodeMap.set(d.id, d));

  // Valid edges (parent must exist in the filtered set)
  const validEdges: TopologyEdge[] = devices
    .filter((d) => d.parentId && nodeMap.has(d.parentId))
    .map((d) => ({
      id: `e-${d.parentId}-${d.id}`,
      source: d.parentId!,
      target: d.id,
      animated: d.status === "ACTIVE",
    }));

  // Build dagre graph for automatic layout
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: "TB",   // top-to-bottom hierarchy
    ranksep: 80,     // vertical gap between levels
    nodesep: 40,     // horizontal gap between siblings
    marginx: 40,
    marginy: 40,
  });

  devices.forEach((d) => {
    const height = d.type === "PATCH_PANEL" ? PATCH_PANEL_HEIGHT : NODE_HEIGHT;
    g.setNode(d.id, { width: NODE_WIDTH, height });
  });

  validEdges.forEach((e) => {
    g.setEdge(e.source, e.target);
  });

  dagre.layout(g);

  const nodes: TopologyNode[] = devices.map((d) => {
    const pos = g.node(d.id);
    return {
      id: d.id,
      type: d.type === "PATCH_PANEL" ? "patchPanelNode" : "deviceNode",
      position: {
        x: pos.x - NODE_WIDTH / 2,
        y: pos.y - (d.type === "PATCH_PANEL" ? PATCH_PANEL_HEIGHT : NODE_HEIGHT) / 2,
      },
      data: {
        label: d.name,
        deviceType: d.type,
        status: d.status,
        ipAddress: d.ipAddress ?? null,
        macAddress: d.macAddress ?? null,
        manufacturer: d.manufacturer ?? null,
        model: d.model ?? null,
        serialNumber: d.serialNumber ?? null,
        location: d.location ?? null,
        notes: d.notes ?? null,
        deviceId: d.id,
        customerId: d.customerId ?? null,
        customerName: d.customer?.name ?? null,
        customerColor: getCustomerColor(d.customerId ?? null, customerIndex),
        locationName: d.assignedLocation?.name ?? null,
        ports: d.ports ?? [],
      },
    };
  });

  return { nodes, edges: validEdges };
}
