import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";
import { format } from "date-fns";
import { AddUserForm } from "@/components/settings/AddUserForm";

export default async function SettingsPage() {
  const session = await requireAuth();
  const isAdmin = session.user.role === "admin";

  const users = isAdmin
    ? await prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      })
    : [];

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Settings</h2>
        <p className="text-slate-500 text-sm">User management and preferences</p>
      </div>

      {!isAdmin ? (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-sm">
          Only administrators can manage users.
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <h3 className="font-semibold text-slate-800">Users</h3>
            <div className="divide-y divide-slate-100">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{user.name ?? "—"}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full capitalize">
                      {user.role}
                    </span>
                    <span className="text-xs text-slate-400">
                      {format(new Date(user.createdAt), "MMM d, yyyy")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 mb-4">Add User</h3>
            <AddUserForm />
          </div>
        </>
      )}
    </div>
  );
}
