import { prisma } from "@/lib/prisma";
import { getSessionScope } from "@/lib/sessionScope";
import { redirect } from "next/navigation";
import { Server, Wifi, Router, Monitor, Satellite, ArrowRightLeft, Camera } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default async function DashboardPage() {
  const scope = await getSessionScope();
  if (!scope) redirect("/login");

  // Scoped users only see their customer's data
  const deviceWhere = scope.customerId
    ? { customerId: scope.customerId }
    : scope.resellerId
    ? { customer: { resellerId: scope.resellerId } }
    : undefined;

  const changelogWhere = scope.customerId
    ? { device: { customerId: scope.customerId } }
    : scope.resellerId
    ? { device: { customer: { resellerId: scope.resellerId } } }
    : undefined;

  const [totalDevices, byStatus, byType, recentChanges] = await Promise.all([
    prisma.device.count({ where: deviceWhere }),
    prisma.device.groupBy({ by: ["status"], where: deviceWhere, _count: { _all: true } }),
    prisma.device.groupBy({ by: ["type"],   where: deviceWhere, _count: { _all: true } }),
    prisma.changelogEntry.findMany({
      where: changelogWhere,
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { device: { select: { id: true, name: true } } },
    }),
  ]);

  const statusMap = Object.fromEntries(byStatus.map((s) => [s.status, s._count._all]));
  const typeMap   = Object.fromEntries(byType.map((t) => [t.type,   t._count._all]));

  const kpiCards = [
    { label: "Total Devices", value: totalDevices,           icon: Server,  color: "bg-blue-500" },
    { label: "Active",        value: statusMap.ACTIVE ?? 0,  icon: Wifi,    color: "bg-emerald-500" },
    { label: "Inactive",      value: statusMap.INACTIVE ?? 0,icon: Monitor, color: "bg-slate-500" },
    { label: "Maintenance",   value: statusMap.MAINTENANCE ?? 0, icon: Router, color: "bg-amber-500" },
  ];

  const typeCards = [
    { label: "Switches",       key: "SWITCH",       icon: Server },
    { label: "Routers",        key: "ROUTER",       icon: Router },
    { label: "Access Points",  key: "ACCESS_POINT", icon: Wifi },
    { label: "Point-to-Point", key: "P2P",          icon: ArrowRightLeft },
    { label: "POS Systems",    key: "POS",          icon: Monitor },
    { label: "Starlink",       key: "STARLINK",     icon: Satellite },
    { label: "IP Cameras",     key: "CAMERA",       icon: Camera },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Dashboard</h2>
        <p className="text-slate-500 text-sm">Network inventory overview</p>
      </div>

      {/* Status KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
            <div className={`${color} text-white p-2.5 rounded-lg`}>
              <Icon size={18} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{value}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Device type breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-800 mb-4">Devices by Type</h3>
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
          {typeCards.map(({ label, key, icon: Icon }) => (
            <Link
              key={key}
              href={`/devices?type=${key}${scope.customerId ? `&customerId=${scope.customerId}` : ""}`}
              className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-slate-50 hover:bg-blue-50 hover:text-blue-700 transition-colors text-center"
            >
              <Icon size={20} className="text-slate-500" />
              <span className="text-lg font-bold">{typeMap[key] ?? 0}</span>
              <span className="text-xs text-slate-500">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800">Recent Activity</h3>
          <Link href="/devices" className="text-blue-600 hover:text-blue-700 text-sm">View all →</Link>
        </div>
        {recentChanges.length === 0 ? (
          <p className="text-slate-400 text-sm">No activity yet.</p>
        ) : (
          <div className="space-y-2">
            {recentChanges.map((entry) => (
              <div key={entry.id} className="flex items-start justify-between gap-3 py-2 border-b border-slate-50 last:border-0">
                <div className="min-w-0">
                  <p className="text-sm text-slate-800 truncate">
                    <Link href={`/devices/${entry.device.id}`} className="font-medium hover:text-blue-600">
                      {entry.device.name}
                    </Link>
                    {" — "}
                    <span className="text-slate-600">{entry.summary}</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{entry.author}</p>
                </div>
                <time className="text-xs text-slate-400 whitespace-nowrap">
                  {format(new Date(entry.createdAt), "MMM d, HH:mm")}
                </time>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
