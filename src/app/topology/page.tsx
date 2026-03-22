import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";
import { TopologyClient } from "@/components/topology/TopologyClient";

export default async function TopologyPage() {
  await requireAuth();

  const [devices, customers] = await Promise.all([
    prisma.device.findMany({
      select: {
        id: true, name: true, type: true, status: true,
        ipAddress: true, macAddress: true, manufacturer: true,
        model: true, serialNumber: true, location: true,
        notes: true, parentId: true,
        customerId: true,
        locationId: true,
        customer: { select: { id: true, name: true } },
        assignedLocation: { select: { id: true, name: true } },
        ports: {
          orderBy: { portNumber: "asc" },
          select: {
            id: true, portNumber: true, label: true,
            connectedTo: true, cableType: true, notes: true,
          },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.customer.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return <TopologyClient devices={devices} customers={customers} />;
}
