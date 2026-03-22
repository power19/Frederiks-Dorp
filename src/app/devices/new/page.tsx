import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";
import { DeviceForm } from "@/components/devices/DeviceForm";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function NewDevicePage() {
  await requireAuth();

  const allDevices = await prisma.device.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

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
        <DeviceForm devices={allDevices} />
      </div>
    </div>
  );
}
