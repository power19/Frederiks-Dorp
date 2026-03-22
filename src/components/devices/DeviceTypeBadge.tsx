import { DeviceType } from "@/generated/prisma";
import { clsx } from "clsx";

const config: Record<DeviceType, { label: string; className: string }> = {
  SWITCH: { label: "Switch", className: "bg-blue-100 text-blue-700" },
  ROUTER: { label: "Router", className: "bg-purple-100 text-purple-700" },
  ACCESS_POINT: { label: "Access Point", className: "bg-cyan-100 text-cyan-700" },
  P2P: { label: "P2P", className: "bg-orange-100 text-orange-700" },
  POS: { label: "POS", className: "bg-pink-100 text-pink-700" },
  STARLINK: { label: "Starlink", className: "bg-indigo-100 text-indigo-700" },
};

export function DeviceTypeBadge({ type }: { type: DeviceType }) {
  const { label, className } = config[type] ?? { label: type, className: "bg-slate-100 text-slate-600" };
  return (
    <span className={clsx("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", className)}>
      {label}
    </span>
  );
}
