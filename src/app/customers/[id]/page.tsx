import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Edit2, Building2 } from "lucide-react";
import { StatusBadge } from "@/components/devices/StatusBadge";
import { DeviceTypeBadge } from "@/components/devices/DeviceTypeBadge";
import { DeleteCustomerButton } from "@/components/customers/DeleteCustomerButton";
import { format } from "date-fns";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAuth();
  const { id } = await params;

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      devices: {
        include: { parent: { select: { id: true, name: true } } },
        orderBy: { name: "asc" },
      },
    },
  });

  if (!customer) notFound();

  return (
    <div className="p-6 max-w-5xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/customers" className="flex items-center gap-1 text-slate-500 hover:text-slate-700 text-sm mb-2">
            <ChevronLeft size={14} /> Back to Customers
          </Link>
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Building2 size={20} className="text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">{customer.name}</h2>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/customers/${customer.id}/edit`}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm rounded-lg transition-colors"
          >
            <Edit2 size={14} /> Edit
          </Link>
          <DeleteCustomerButton customerId={customer.id} customerName={customer.name} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Customer info */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 mb-4">Customer Information</h3>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
              {[
                ["Name", customer.name],
                ["Contact Name", customer.contactName],
                ["Email", customer.email],
                ["Phone", customer.phone],
                ["Address", customer.address],
                ["Added", format(customer.createdAt, "MMM d, yyyy")],
              ].map(([label, value]) => (
                <div key={String(label)}>
                  <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</dt>
                  <dd className="mt-0.5 text-sm text-slate-900">
                    {label === "Email" && value ? (
                      <a href={`mailto:${value}`} className="text-blue-600 hover:underline">{value}</a>
                    ) : (
                      <span className={!value ? "text-slate-400" : ""}>{value ?? "—"}</span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {customer.notes && (
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-800 mb-2">Notes</h3>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{customer.notes}</p>
            </div>
          )}

          {/* Devices */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">
                Assigned Devices ({customer.devices.length})
              </h3>
              <Link
                href={`/devices/new`}
                className="text-sm text-blue-600 hover:underline"
              >
                Add device →
              </Link>
            </div>
            {customer.devices.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No devices assigned to this customer</p>
            ) : (
              <div className="space-y-2">
                {customer.devices.map((device) => (
                  <Link
                    key={device.id}
                    href={`/devices/${device.id}`}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-blue-50 transition-colors"
                  >
                    <div>
                      <span className="text-sm font-medium text-slate-800">{device.name}</span>
                      {device.parent && (
                        <span className="text-xs text-slate-400 ml-2">via {device.parent.name}</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <DeviceTypeBadge type={device.type} />
                      <StatusBadge status={device.status} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick stats */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 mb-3">Summary</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Total Devices</span>
                <span className="font-semibold text-slate-900">{customer.devices.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Active</span>
                <span className="font-semibold text-green-600">
                  {customer.devices.filter(d => d.status === "ACTIVE").length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Inactive</span>
                <span className="font-semibold text-slate-500">
                  {customer.devices.filter(d => d.status === "INACTIVE").length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Maintenance</span>
                <span className="font-semibold text-amber-600">
                  {customer.devices.filter(d => d.status === "MAINTENANCE").length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
