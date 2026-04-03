"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard, Server, GitBranch, ArrowDownUp,
  Settings, Network, Building2, LogOut, User,
} from "lucide-react";
import { clsx } from "clsx";

const navItems = [
  { href: "/dashboard", label: "Dashboard",     icon: LayoutDashboard },
  { href: "/devices",   label: "Devices",        icon: Server },
  { href: "/customers", label: "Customers",      icon: Building2 },
  { href: "/topology",  label: "Topology",       icon: GitBranch },
  { href: "/export",    label: "Import / Export",icon: ArrowDownUp },
  { href: "/settings",  label: "Settings",       icon: Settings },
];

const roleLabel: Record<string, string> = {
  admin:  "Admin",
  editor: "Editor",
  viewer: "Viewer",
  user:   "User",
};

export function Sidebar() {
  const pathname  = usePathname();
  const { data: session } = useSession();

  const userName = session?.user?.name ?? session?.user?.email ?? "…";
  const userRole = (session?.user as { role?: string })?.role ?? "user";

  return (
    <aside className="w-56 h-full bg-slate-900 text-white flex flex-col overflow-hidden">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-slate-700 shrink-0">
        <div className="bg-blue-500 p-1.5 rounded-lg">
          <Network size={18} />
        </div>
        <div>
          <p className="font-bold text-sm leading-tight">PowerMentaL</p>
          <p className="text-slate-400 text-xs">Network Inventory</p>
        </div>
      </div>

      {/* Nav — scrolls if needed */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                active ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User info + sign out — always visible at bottom */}
      <div className="shrink-0 p-3 border-t border-slate-700 space-y-2">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg bg-slate-800">
          <div className="bg-slate-600 rounded-full p-1.5 shrink-0">
            <User size={12} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-white truncate">{userName}</p>
            <p className="text-[10px] text-slate-400">{roleLabel[userRole] ?? userRole}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors"
        >
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
