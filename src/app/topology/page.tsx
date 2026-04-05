import { prisma } from "@/lib/prisma";
import { getSessionScope } from "@/lib/sessionScope";
import { redirect } from "next/navigation";
import { TopologyClient } from "@/components/topology/TopologyClient";

export default async function TopologyPage() {
  const scope = await getSessionScope();
  if (!scope) redirect("/login");

  const deviceWhere = scope.customerId
    ? { customerId: scope.customerId }
    : scope.resellerId
    ? { customer: { resellerId: scope.resellerId } }
    : {};

  const [devices, customers] = await Promise.all([
    prisma.device.findMany({
      where: Object.keys(deviceWhere).length ? deviceWhere : undefined,
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
      where: scope.customerId
        ? { id: scope.customerId }
        : scope.resellerId
        ? { resellerId: scope.resellerId }
        : {},
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return <TopologyClient devices={devices} customers={customers} />;
}
