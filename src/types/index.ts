import { DeviceStatus, DeviceType } from "@/generated/prisma";

export type { DeviceStatus, DeviceType };

export interface DeviceWithRelations {
  id: string;
  name: string;
  type: DeviceType;
  ipAddress: string | null;
  macAddress: string | null;
  manufacturer: string | null;
  model: string | null;
  serialNumber: string | null;
  location: string | null;
  status: DeviceStatus;
  notes: string | null;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  parent?: { id: string; name: string } | null;
  children?: { id: string; name: string; type: DeviceType; status: DeviceStatus }[];
  changelog?: ChangelogEntry[];
}

export interface ChangelogEntry {
  id: string;
  deviceId: string;
  action: string;
  summary: string;
  diff: string | null;
  author: string;
  createdAt: Date;
}

export interface TopologyNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    deviceType: DeviceType;
    status: DeviceStatus;
    ipAddress: string | null;
    deviceId: string;
  };
}

export interface TopologyEdge {
  id: string;
  source: string;
  target: string;
  animated?: boolean;
}
