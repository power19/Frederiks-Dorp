"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Server,
  GitBranch,
  ArrowDownUp,
  Settings,
  Building2,
  Network,
  LogOut,
} from "lucide-react";
import { clsx } from "clsx";

const navItems = [
  { href: "/dashboard",  label: "Dashboard",    icon: LayoutDashboard },
  { href: "/devices",    label: "Devices",       icon: Server },
  { href: "/customers",  label: "Customers",     icon: Building2 },
  { href: "/topology",   label: "Topology",      icon: GitBranch },
  { href: "/export",     label: "Import/Export", icon: ArrowDownUp },
  { href: "/settings",   label: "Settings",      icon: Settings },
];

export function FloatingNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const initial = (session?.user?.name ?? session?.user?.email ?? "?")[0].toUpperCase();

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50">
      <nav className="flex items-center gap-1 bg-slate-900/95 backdrop-blur-md border border-slate-700/60 rounded-2xl px-3 py-2 shadow-2xl shadow-slate-900/40">
        {/* Logo mark */}
        <div className="flex items-center gap-2 pr-3 mr-1 border-r border-slate-700">
          <div className="bg-blue-500 p-1.5 rounded-lg">
            <Network size={14} />
          </div>
          <span className="text-white text-xs font-bold hidden sm:block">PM</span>
        </div>

        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={clsx(
                "group relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-150",
                active
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              )}
            >
              <Icon size={17} />
              <span className="text-[10px] leading-none">{label}</span>
            </Link>
          );
        })}

        {/* Divider */}
        <div className="w-px h-6 bg-slate-700 mx-1" />

        {/* Sign out */}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          title="Sign out"
          className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-xs font-medium text-red-400 hover:text-white hover:bg-red-600 transition-all duration-150"
        >
          <LogOut size={17} />
          <span className="text-[10px] leading-none">Sign out</span>
        </button>
      </nav>
    </div>
  );
}
