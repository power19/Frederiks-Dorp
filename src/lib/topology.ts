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

export function buildTopologyGraph(
  devices: DeviceNode[],
  customerIndex: Map<string, number>
): {
  nodes: TopologyNode[];
  edges: TopologyEdge[];
} {
  const nodeMap = new Map<string, DeviceNode>();
  devices.forEach((d) => nodeMap.set(d.id, d));

  // Build children map
  const childrenMap = new Map<string | null, string[]>();
  devices.forEach((d) => {
    const key = d.parentId ?? null;
    if (!childrenMap.has(key)) childrenMap.set(key, []);
    childrenMap.get(key)!.push(d.id);
  });

  // Assign positions using BFS tree layout
  const levelWidth = 220;
  const levelHeight = 160;

  const positions = new Map<string, { x: number; y: number }>();

  function assignPositions(ids: string[], depth: number, xOffset: number): number {
    let currentX = xOffset;
    for (const id of ids) {
      const children = childrenMap.get(id) ?? [];
      const subtreeWidth = Math.max(1, children.length) * levelWidth;
      const centerX = currentX + subtreeWidth / 2 - levelWidth / 2;
      positions.set(id, { x: centerX, y: depth * levelHeight });
      if (children.length > 0) assignPositions(children, depth + 1, currentX);
      currentX += subtreeWidth;
    }
    return currentX;
  }

  const roots = childrenMap.get(null) ?? [];
  assignPositions(roots, 0, 0);

  // Devices with no position yet (orphaned)
  let orphanX = 0;
  devices.forEach((d) => {
    if (!positions.has(d.id)) {
      positions.set(d.id, { x: orphanX, y: -levelHeight });
      orphanX += levelWidth;
    }
  });

  const nodes: TopologyNode[] = devices.map((d) => ({
    id: d.id,
    type: d.type === "PATCH_PANEL" ? "patchPanelNode" : "deviceNode",
    position: positions.get(d.id)!,
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
  }));

  const edges: TopologyEdge[] = devices
    .filter((d) => d.parentId && nodeMap.has(d.parentId))
    .map((d) => ({
      id: `e-${d.parentId}-${d.id}`,
      source: d.parentId!,
      target: d.id,
      animated: d.status === "ACTIVE",
    }));

  return { nodes, edges };
}
