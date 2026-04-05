import { prisma } from "@/lib/prisma";
import { getSessionScope } from "@/lib/sessionScope";
import { DeviceForm } from "@/components/devices/DeviceForm";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { redirect } from "next/navigation";

export default async function NewDevicePage({
  searchParams,
}: {
  searchParams: Promise<{ customerId?: string; locationId?: string }>;
}) {
  const scope = await getSessionScope();
  if (!scope) redirect("/login");
  if (scope.isViewer) redirect("/devices");

  const { customerId: qCustomerId, locationId } = await searchParams;

  // Scoped users are locked to their own customer
  const effectiveCustomerId = scope.customerId ?? qCustomerId;

  const customerWhere = scope.customerId
    ? { id: scope.customerId }
    : scope.resellerId
    ? { resellerId: scope.resellerId }
    : {};

  const deviceWhere = scope.customerId
    ? { customerId: scope.customerId }
    : scope.resellerId
    ? { customer: { resellerId: scope.resellerId } }
    : {};

  const [allDevices, allCustomers] = await Promise.all([
    prisma.device.findMany({
      where: deviceWhere,
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.customer.findMany({
      where: customerWhere,
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <Link href="/devices" className="flex items-center gap-1 text-slate-500 hover:text-slate-700 text-sm mb-3">
          <ChevronLeft size={14} /> Back to Devices
        </Link>
        <h2 className="text-xl font-bold text-slate-900">Add Device</h2>
        <p className="text-slate-500 text-sm">Register a new network device</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <DeviceForm
          devices={allDevices}
          customers={allCustomers}
          defaultValues={{
            customerId: effectiveCustomerId ?? undefined,
            locationId: locationId ?? undefined,
          }}
          lockedCustomerId={effectiveCustomerId}
        />
      </div>
    </div>
  );
}
