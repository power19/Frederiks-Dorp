"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Server,
  GitBranch,
  ArrowDownUp,
  Settings,
  Network,
  Building2,
} from "lucide-react";
import { clsx } from "clsx";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/devices", label: "Devices", icon: Server },
  { href: "/customers", label: "Customers", icon: Building2 },
  { href: "/topology", label: "Topology", icon: GitBranch },
  { href: "/export", label: "Import / Export", icon: ArrowDownUp },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 min-h-screen bg-slate-900 text-white flex flex-col">
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-slate-700">
        <div className="bg-blue-500 p-1.5 rounded-lg">
          <Network size={18} />
        </div>
        <div>
          <p className="font-bold text-sm leading-tight">Frederiks-Dorp</p>
          <p className="text-slate-400 text-xs">Network Inventory</p>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-700">
        <p className="text-slate-500 text-xs text-center">v1.0.0</p>
      </div>
    </aside>
  );
}
