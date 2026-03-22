import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Edit2 } from "lucide-react";
import { StatusBadge } from "@/components/devices/StatusBadge";
import { DeviceTypeBadge } from "@/components/devices/DeviceTypeBadge";
import { PingButton } from "@/components/devices/PingButton";
import { ChangelogList } from "@/components/devices/ChangelogList";
import { DeleteDeviceButton } from "@/components/devices/DeleteDeviceButton";
import { format } from "date-fns";

export default async function DeviceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAuth();
  const { id } = await params;

  const device = await prisma.device.findUnique({
    where: { id },
    include: {
      parent: { select: { id: true, name: true } },
      children: { select: { id: true, name: true, type: true, status: true } },
      changelog: { orderBy: { createdAt: "desc" }, take: 50 },
    },
  });

  if (!device) notFound();

  const fields = [
    ["Name", device.name],
    ["Type", null],
    ["IP Address", device.ipAddress],
    ["MAC Address", device.macAddress],
    ["Manufacturer", device.manufacturer],
    ["Model", device.model],
    ["Serial Number", device.serialNumber],
    ["Location", device.location],
    ["Status", null],
    ["Connected To", device.parent ? device.parent.name : null],
    ["Created", format(device.createdAt, "MMM d, yyyy HH:mm")],
    ["Last Updated", format(device.updatedAt, "MMM d, yyyy HH:mm")],
  ];

  return (
    <div className="p-6 max-w-5xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/devices" className="flex items-center gap-1 text-slate-500 hover:text-slate-700 text-sm mb-2">
            <ChevronLeft size={14} /> Back to Devices
          </Link>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-900">{device.name}</h2>
            <DeviceTypeBadge type={device.type} />
            <StatusBadge status={device.status} />
          </div>
        </div>
        <div className="flex gap-2">
          {device.ipAddress && <PingButton deviceId={device.id} />}
          <Link
            href={`/devices/${device.id}/edit`}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm rounded-lg transition-colors"
          >
            <Edit2 size={14} /> Edit
          </Link>
          <DeleteDeviceButton deviceId={device.id} deviceName={device.name} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Device info */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 mb-4">Device Information</h3>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
              {fields.map(([label, value]) => (
                <div key={String(label)}>
                  <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</dt>
                  <dd className="mt-0.5 text-sm text-slate-900 font-mono">
                    {label === "Type" ? (
                      <DeviceTypeBadge type={device.type} />
                    ) : label === "Status" ? (
                      <StatusBadge status={device.status} />
                    ) : label === "Connected To" && device.parent ? (
                      <Link href={`/devices/${device.parent.id}`} className="text-blue-600 hover:underline not-italic font-sans">
                        {device.parent.name}
                      </Link>
                    ) : (
                      <span className={!value ? "text-slate-400 font-sans not-italic" : ""}>{value ?? "—"}</span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {device.notes && (
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-800 mb-2">Notes</h3>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{device.notes}</p>
            </div>
          )}

          {device.children.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-800 mb-3">Connected Devices ({device.children.length})</h3>
              <div className="space-y-2">
                {device.children.map((child) => (
                  <Link
                    key={child.id}
                    href={`/devices/${child.id}`}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-blue-50 transition-colors"
                  >
                    <span className="text-sm font-medium text-slate-800">{child.name}</span>
                    <div className="flex gap-2">
                      <DeviceTypeBadge type={child.type} />
                      <StatusBadge status={child.status} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Changelog */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-800 mb-4">Change History</h3>
          <ChangelogList entries={device.changelog as never} />
        </div>
      </div>
    </div>
  );
}
