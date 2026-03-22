import { DeviceStatus, DeviceType } from "@/generated/prisma";
import { TopologyEdge, TopologyNode } from "@/types";

interface DeviceNode {
  id: string;
  name: string;
  type: DeviceType;
  status: DeviceStatus;
  ipAddress: string | null;
  parentId: string | null;
}

export function buildTopologyGraph(devices: DeviceNode[]): {
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
  const positions = new Map<string, { x: number; y: number }>();
  const levelWidth = 220;
  const levelHeight = 160;

  function assignPositions(ids: string[], depth: number, xOffset: number): number {
    let currentX = xOffset;
    for (const id of ids) {
      const children = childrenMap.get(id) ?? [];
      const subtreeWidth = Math.max(1, children.length) * levelWidth;
      const centerX = currentX + subtreeWidth / 2 - levelWidth / 2;
      positions.set(id, { x: centerX, y: depth * levelHeight });
      if (children.length > 0) {
        assignPositions(children, depth + 1, currentX);
      }
      currentX += subtreeWidth;
    }
    return currentX;
  }

  const roots = childrenMap.get(null) ?? [];
  assignPositions(roots, 0, 0);

  // Devices with no position yet (orphaned somehow)
  let orphanX = 0;
  devices.forEach((d) => {
    if (!positions.has(d.id)) {
      positions.set(d.id, { x: orphanX, y: -levelHeight });
      orphanX += levelWidth;
    }
  });

  const nodes: TopologyNode[] = devices.map((d) => ({
    id: d.id,
    type: "deviceNode",
    position: positions.get(d.id)!,
    data: {
      label: d.name,
      deviceType: d.type,
      status: d.status,
      ipAddress: d.ipAddress,
      deviceId: d.id,
    },
  }));

  const edges: TopologyEdge[] = devices
    .filter((d) => d.parentId)
    .map((d) => ({
      id: `e-${d.parentId}-${d.id}`,
      source: d.parentId!,
      target: d.id,
      animated: d.status === "ACTIVE",
    }));

  return { nodes, edges };
}
