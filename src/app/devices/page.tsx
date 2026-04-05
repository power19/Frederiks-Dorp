import { prisma } from "@/lib/prisma";
import { getSessionScope } from "@/lib/sessionScope";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { StatusBadge } from "@/components/devices/StatusBadge";
import { DeviceTypeBadge } from "@/components/devices/DeviceTypeBadge";
import { DeviceStatus, DeviceType } from "@/generated/prisma";

interface SearchParams {
  type?: string;
  status?: string;
  search?: string;
  customerId?: string;
}

export default async function DevicesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const scope = await getSessionScope();
  if (!scope) redirect("/login");

  const sp = await searchParams;

  // Scoped users are always locked to their customer; admins can filter optionally
  const scopedCustomerId = scope.customerId ?? sp.customerId ?? null;

  const resellerFilter = !scopedCustomerId && scope.resellerId
    ? { customer: { resellerId: scope.resellerId } }
    : {};

  const [devices, customers] = await Promise.all([
    prisma.device.findMany({
      where: {
        ...(sp.type       && { type: sp.type as DeviceType }),
        ...(sp.status     && { status: sp.status as DeviceStatus }),
        ...(scopedCustomerId && { customerId: scopedCustomerId }),
        ...resellerFilter,
        ...(sp.search && {
          OR: [
            { name: { contains: sp.search } },
            { ipAddress: { contains: sp.search } },
            { location: { contains: sp.search } },
            { manufacturer: { contains: sp.search } },
            { model: { contains: sp.search } },
            { serialNumber: { contains: sp.search } },
          ],
        }),
      },
      include: {
        parent: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true } },
      },
      orderBy: { name: "asc" },
    }),
    // Admins and resellers see the customer filter dropdown
    scope.isAdmin
      ? prisma.customer.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } })
      : scope.isReseller
      ? prisma.customer.findMany({ where: { resellerId: scope.resellerId! }, select: { id: true, name: true }, orderBy: { name: "asc" } })
      : Promise.resolve([]),
  ]);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Devices</h2>
          <p className="text-slate-500 text-sm">{devices.length} device{devices.length !== 1 ? "s" : ""} found</p>
        </div>
        {!scope.isViewer && (
          <Link
            href="/devices/new"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={15} />
            Add Device
          </Link>
        )}
      </div>

      {/* Filters */}
      <form method="GET" className="flex flex-wrap gap-3">
        <input
          name="search"
          defaultValue={sp.search ?? ""}
          placeholder="Search name, IP, location…"
          className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select name="type" defaultValue={sp.type ?? ""}
          className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Types</option>
          <option value="SWITCH">Switch</option>
          <option value="ROUTER">Router</option>
          <option value="ACCESS_POINT">Access Point</option>
          <option value="P2P">Point-to-Point</option>
          <option value="POS">POS System</option>
          <option value="STARLINK">Starlink</option>
          <option value="PATCH_PANEL">Patch Panel</option>
        </select>
        <select name="status" defaultValue={sp.status ?? ""}
          className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="MAINTENANCE">Maintenance</option>
        </select>
        {/* Customer filter — admins only */}
        {scope.isAdmin && (
          <select name="customerId" defaultValue={sp.customerId ?? ""}
            className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Customers</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
        <button type="submit"
          className="bg-slate-800 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-slate-700 transition-colors">
          Filter
        </button>
        {(sp.type || sp.status || sp.search || sp.customerId) && (
          <Link href="/devices" className="text-slate-500 hover:text-slate-700 text-sm py-1.5">Clear</Link>
        )}
      </form>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {devices.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-400">No devices found.</p>
            {!scope.isViewer && (
              <Link href="/devices/new" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
                Add your first device →
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Type</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">IP Address</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Location</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Connected To</th>
                  {scope.isAdmin && <th className="text-left px-4 py-3 font-semibold text-slate-600">Customer</th>}
                  <th className="text-left px-4 py-3 font-semibold text-slate-600"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {devices.map((device) => (
                  <tr key={device.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      <Link href={`/devices/${device.id}`} className="hover:text-blue-600">{device.name}</Link>
                    </td>
                    <td className="px-4 py-3"><DeviceTypeBadge type={device.type} /></td>
                    <td className="px-4 py-3 text-slate-600 font-mono text-xs">{device.ipAddress ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{device.location ?? "—"}</td>
                    <td className="px-4 py-3"><StatusBadge status={device.status} /></td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {device.parent ? (
                        <Link href={`/devices/${device.parent.id}`} className="hover:text-blue-600">{device.parent.name}</Link>
                      ) : "—"}
                    </td>
                    {scope.isAdmin && (
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {device.customer ? (
                          <Link href={`/customers/${device.customer.id}`} className="hover:text-blue-600">{device.customer.name}</Link>
                        ) : "—"}
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <Link href={`/devices/${device.id}`} className="text-blue-600 hover:text-blue-700 text-xs font-medium">
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
