import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { DeviceForm } from "@/components/devices/DeviceForm";

export default async function EditDevicePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAuth();
  const { id } = await params;

  const [device, allDevices, allCustomers] = await Promise.all([
    prisma.device.findUnique({ where: { id } }),
    prisma.device.findMany({
      where: { id: { not: id } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.customer.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!device) notFound();

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <Link href={`/devices/${id}`} className="flex items-center gap-1 text-slate-500 hover:text-slate-700 text-sm mb-3">
          <ChevronLeft size={14} /> Back to Device
        </Link>
        <h2 className="text-xl font-bold text-slate-900">Edit Device</h2>
        <p className="text-slate-500 text-sm">{device.name}</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <DeviceForm
          deviceId={id}
          devices={allDevices}
          customers={allCustomers}
          defaultValues={{
            name: device.name,
            type: device.type,
            ipAddress: device.ipAddress ?? undefined,
            macAddress: device.macAddress ?? undefined,
            manufacturer: device.manufacturer ?? undefined,
            model: device.model ?? undefined,
            serialNumber: device.serialNumber ?? undefined,
            location: device.location ?? undefined,
            status: device.status,
            notes: device.notes ?? undefined,
            parentId: device.parentId ?? undefined,
            latitude: device.latitude ?? undefined,
            longitude: device.longitude ?? undefined,
            customerId: device.customerId ?? undefined,
          }}
        />
      </div>
    </div>
  );
}
