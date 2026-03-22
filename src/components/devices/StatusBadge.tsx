import { DeviceStatus } from "@/generated/prisma";
import { clsx } from "clsx";

const config: Record<DeviceStatus, { label: string; className: string }> = {
  ACTIVE: { label: "Active", className: "bg-emerald-100 text-emerald-700" },
  INACTIVE: { label: "Inactive", className: "bg-slate-100 text-slate-600" },
  MAINTENANCE: { label: "Maintenance", className: "bg-amber-100 text-amber-700" },
};

export function StatusBadge({ status }: { status: DeviceStatus }) {
  const { label, className } = config[status] ?? config.INACTIVE;
  return (
    <span className={clsx("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", className)}>
      {label}
    </span>
  );
}
