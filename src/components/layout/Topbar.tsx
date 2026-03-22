"use client";

import { signOut, useSession } from "next-auth/react";
import { LogOut, User } from "lucide-react";

export function Topbar({ title }: { title: string }) {
  const { data: session } = useSession();

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      <h1 className="font-semibold text-slate-800">{title}</h1>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <div className="bg-slate-100 p-1 rounded-full">
            <User size={14} />
          </div>
          <span>{session?.user?.name ?? session?.user?.email}</span>
          {session?.user?.role && (
            <span className="bg-slate-100 text-slate-500 text-xs px-2 py-0.5 rounded-full capitalize">
              {session.user.role}
            </span>
          )}
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-1.5 text-slate-400 hover:text-red-500 text-sm transition-colors"
        >
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </header>
  );
}
