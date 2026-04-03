"use client";

import { signOut, useSession } from "next-auth/react";
import { LogOut } from "lucide-react";

const roleLabel: Record<string, string> = {
  admin:  "Admin",
  editor: "Editor",
  viewer: "Viewer",
};

export function TopBar() {
  const { data: session } = useSession();
  const userName = session?.user?.name ?? session?.user?.email ?? "…";
  const userRole = (session?.user as { role?: string })?.role ?? "viewer";
  const initial  = userName[0].toUpperCase();

  return (
    <header className="shrink-0 h-12 bg-white border-b border-slate-200 px-4 flex items-center justify-end gap-3 z-40">
      {/* User avatar + name */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-slate-700 text-white flex items-center justify-center text-xs font-bold shrink-0">
          {initial}
        </div>
        <div className="leading-tight hidden sm:block">
          <p className="text-xs font-medium text-slate-800 truncate max-w-[140px]">{userName}</p>
          <p className="text-[10px] text-slate-400">{roleLabel[userRole] ?? userRole}</p>
        </div>
      </div>

      {/* Sign out — always visible */}
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-semibold transition-colors"
      >
        <LogOut size={13} />
        Sign out
      </button>
    </header>
  );
}
