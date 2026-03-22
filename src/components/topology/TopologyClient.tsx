"use client";

import { useState, useMemo } from "react";
import { buildTopologyGraph, PatchPort } from "@/lib/topology";
import { TopologyGraph } from "./TopologyGraph";
import { DeviceType, DeviceStatus } from "@/generated/prisma";

type DeviceRaw = {
  id: string;
  name: string;
  type: DeviceType;
  status: DeviceStatus;
  ipAddress: string | null;
  macAddress: string | null;
  manufacturer: string | null;
  model: string | null;
  serialNumber: string | null;
  location: string | null;
  notes: string | null;
  parentId: string | null;
  customerId: string | null;
  locationId: string | null;
  customer: { id: string; name: string } | null;
  assignedLocation: { id: string; name: string } | null;
  ports: PatchPort[];
};

type Customer = { id: string; name: string };

interface Props {
  devices: DeviceRaw[];
  customers: Customer[];
}

export function TopologyClient({ devices, customers }: Props) {
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id ?? "");
  const [selectedLocationId, setSelectedLocationId] = useState("");

  // Build a stable customer → color index
  const customerIndex = useMemo(() => {
    const map = new Map<string, number>();
    customers.forEach((c, i) => map.set(c.id, i));
    return map;
  }, [customers]);

  // Locations for the selected customer
  const locationOptions = useMemo(() => {
    if (!selectedCustomerId) return [];
    const seen = new Map<string, string>();
    devices.forEach((d) => {
      if (
        d.customerId === selectedCustomerId &&
        d.locationId &&
        d.assignedLocation
      ) {
        seen.set(d.locationId, d.assignedLocation.name);
      }
    });
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
  }, [selectedCustomerId, devices]);

  // Filter devices
  const filtered = useMemo(() => {
    return devices.filter((d) => {
      if (selectedCustomerId && d.customerId !== selectedCustomerId) return false;
      if (selectedLocationId && d.locationId !== selectedLocationId) return false;
      return true;
    });
  }, [devices, selectedCustomerId, selectedLocationId]);

  const { nodes, edges } = useMemo(
    () => buildTopologyGraph(filtered, customerIndex),
    [filtered, customerIndex]
  );

  const selectCls =
    "border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 57px)" }}>
      {/* Header */}
      <div className="px-6 py-3 bg-white border-b border-slate-200 flex items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Network Topology</h2>
          <p className="text-slate-500 text-sm">
            {customers.find((c) => c.id === selectedCustomerId)?.name ?? ""}
            {selectedLocationId
              ? ` · ${locationOptions.find((l) => l.id === selectedLocationId)?.name}`
              : ""}
            {" · "}{filtered.length} device{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedCustomerId}
            onChange={(e) => {
              setSelectedCustomerId(e.target.value);
              setSelectedLocationId("");
            }}
            className={selectCls}
          >
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {locationOptions.length > 0 && (
            <select
              value={selectedLocationId}
              onChange={(e) => setSelectedLocationId(e.target.value)}
              className={selectCls}
            >
              <option value="">All Locations</option>
              {locationOptions.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          )}

          {selectedLocationId && (
            <button
              onClick={() => setSelectedLocationId("")}
              className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              All Locations
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
          No devices match the current filter
        </div>
      ) : (
        <div className="flex-1">
          <TopologyGraph nodes={nodes} edges={edges} />
        </div>
      )}
    </div>
  );
}
