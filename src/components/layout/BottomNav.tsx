"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { LayoutDashboard, Server, Building2, PlusCircle, LogOut } from "lucide-react";
import { clsx } from "clsx";

export function BottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const navItems = [
    { href: "/dashboard",  label: "Home",     icon: LayoutDashboard },
    { href: "/devices",    label: "Devices",  icon: Server },
    { href: "/quick-add",  label: "Add",      icon: PlusCircle, primary: true },
    { href: "/customers",  label: "Customers",icon: Building2 },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 flex items-center justify-around px-2 py-1">
      {navItems.map(({ href, label, icon: Icon, primary }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        if (primary) {
          return (
            <Link key={href} href={href} className="flex flex-col items-center gap-0.5 -mt-5">
              <div className={clsx(
                "w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95",
                active ? "bg-blue-700" : "bg-blue-600"
              )}>
                <Icon size={26} className="text-white" />
              </div>
              <span className="text-[10px] font-medium text-blue-600">{label}</span>
            </Link>
          );
        }
        return (
          <Link key={href} href={href} className="flex flex-col items-center gap-0.5 px-3 py-1">
            <Icon size={22} className={active ? "text-blue-600" : "text-slate-400"} />
            <span className={clsx("text-[10px] font-medium", active ? "text-blue-600" : "text-slate-400")}>
              {label}
            </span>
          </Link>
        );
      })}

      {/* Sign out */}
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="flex flex-col items-center gap-0.5 px-3 py-1 active:opacity-70"
      >
        <div className="w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center">
          <LogOut size={14} />
        </div>
        <span className="text-[10px] font-medium text-red-500">Sign out</span>
      </button>
    </nav>
  );
}
