import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";
import { AddUserForm } from "@/components/settings/AddUserForm";
import { WipeDataButton } from "@/components/settings/WipeDataButton";
import { UserRow } from "@/components/settings/UserRow";
import { EmailConfig } from "@/components/settings/EmailConfig";
import { WhatsAppConfig } from "@/components/settings/WhatsAppConfig";
import { Shield, Building2, Users, Mail, MessageCircle, Store } from "lucide-react";

export default async function SettingsPage() {
  const session = await requireAuth();
  const isAdmin    = session.user.role === "admin";
  const isReseller = session.user.role === "reseller";
  const selfId     = (session.user as { id?: string }).id ?? "";

  if (!isAdmin && !isReseller) {
    return (
      <div className="p-6 max-w-2xl">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Settings</h2>
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-sm">
          Only administrators can manage users.
        </div>
      </div>
    );
  }

  // Resellers only see their own customers + users
  const [users, customers] = await Promise.all([
    isReseller
      ? prisma.user.findMany({
          where: { customer: { resellerId: selfId } },
          select: { id: true, name: true, email: true, role: true, customerId: true, createdAt: true },
          orderBy: { createdAt: "asc" },
        })
      : prisma.user.findMany({
          select: { id: true, name: true, email: true, role: true, customerId: true, createdAt: true },
          orderBy: { createdAt: "asc" },
        }),
    isReseller
      ? prisma.customer.findMany({
          where: { resellerId: selfId },
          select: { id: true, name: true, resellerId: true },
          orderBy: { name: "asc" },
        })
      : prisma.customer.findMany({
          select: { id: true, name: true, resellerId: true },
          orderBy: { name: "asc" },
        }),
  ]);

  const globalAdmins = users.filter(u => u.role === "admin");
  const resellers    = users.filter(u => u.role === "reseller");
  const scopedUsers  = users.filter(u => u.role !== "admin" && u.role !== "reseller");

  // Map resellerId → reseller name for displaying on customer cards
  const resellerMap = new Map(resellers.map(r => [r.id, r.name ?? r.email]));

  // Group scoped users by customerId
  const byCustomer = new Map<string | null, typeof scopedUsers>();
  for (const u of scopedUsers) {
    const key = u.customerId ?? null;
    if (!byCustomer.has(key)) byCustomer.set(key, []);
    byCustomer.get(key)!.push(u);
  }

  return (
    <div className="p-6 max-w-3xl space-y-8">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Settings</h2>
        <p className="text-slate-500 text-sm mt-1">User accounts and access control</p>
      </div>

      {/* Global Admins — only visible to super admin */}
      {isAdmin && <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
          <Shield size={15} className="text-blue-600" />
          <h3 className="font-semibold text-slate-800">Global Administrators</h3>
          <span className="ml-auto text-xs text-slate-400">{globalAdmins.length} user{globalAdmins.length !== 1 ? "s" : ""}</span>
        </div>
        <div className="px-5 divide-y divide-slate-100">
          {globalAdmins.length === 0 && (
            <p className="py-4 text-sm text-slate-400 text-center">No global admins</p>
          )}
          {globalAdmins.map(u => (
            <UserRow key={u.id} user={u} customers={customers} isSelf={u.id === selfId} currentUserRole="admin" />
          ))}
        </div>
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Admins have full access to all customers and settings. Only another global admin can reset an admin&apos;s password.
          </p>
        </div>
      </section>}

      {/* Resellers — only visible to super admin */}
      {isAdmin && resellers.length > 0 && (
        <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
            <Store size={15} className="text-orange-500" />
            <h3 className="font-semibold text-slate-800">Resellers</h3>
            <span className="ml-auto text-xs text-slate-400">{resellers.length} reseller{resellers.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="px-5 divide-y divide-slate-100">
            {resellers.map(u => (
              <UserRow key={u.id} user={u} customers={customers} isSelf={u.id === selfId} currentUserRole="admin" />
            ))}
          </div>
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-100">
            <p className="text-xs text-slate-500">Resellers manage their own customers independently. They cannot see each other&apos;s data.</p>
          </div>
        </section>
      )}

      {/* Customer-scoped users — grouped */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Building2 size={15} className="text-slate-500" />
          <h3 className="font-semibold text-slate-800">Customer Users</h3>
          <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
            Managers can reset their own team&apos;s passwords
          </span>
        </div>

        {customers.map(customer => {
          const members = byCustomer.get(customer.id) ?? [];
          const managers = members.filter(u => u.role === "manager");
          const workers  = members.filter(u => u.role !== "manager");
          return (
            <div key={customer.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
                <Building2 size={14} className="text-blue-500" />
                <span className="font-medium text-slate-800 text-sm">{customer.name}</span>
                {managers.length > 0 && (
                  <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-medium">
                    {managers.length} manager{managers.length !== 1 ? "s" : ""}
                  </span>
                )}
                {isAdmin && customer.resellerId && (
                  <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-medium flex items-center gap-0.5">
                    <Store size={9} /> {resellerMap.get(customer.resellerId) ?? "Reseller"}
                  </span>
                )}
                <span className="ml-auto text-xs text-slate-400">{members.length} user{members.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="px-5 divide-y divide-slate-100">
                {members.length === 0 ? (
                  <p className="py-4 text-sm text-slate-400 text-center italic">No users assigned to this customer yet</p>
                ) : (
                  [...managers, ...workers].map(u => (
                    <UserRow key={u.id} user={u} customers={customers} isSelf={u.id === selfId} currentUserRole="admin" />
                  ))
                )}
              </div>
            </div>
          );
        })}

        {/* Unassigned non-admin, non-reseller users */}
        {(byCustomer.get(null)?.length ?? 0) > 0 && (
          <div className="bg-white rounded-2xl border border-amber-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-amber-100 flex items-center gap-2 bg-amber-50">
              <Users size={14} className="text-amber-500" />
              <span className="font-medium text-amber-800 text-sm">Unassigned Users</span>
              <span className="ml-auto text-xs text-amber-500">No customer restriction</span>
            </div>
            <div className="px-5 divide-y divide-slate-100">
              {byCustomer.get(null)!.map(u => (
                <UserRow key={u.id} user={u} customers={customers} isSelf={u.id === selfId} currentUserRole="admin" />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Add User */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-800 mb-1">Add User</h3>
        <p className="text-xs text-slate-500 mb-4">
          Create a new account. Assign them to a customer and set their access level below.
        </p>
        <AddUserForm />
      </section>

      {/* Email, WhatsApp, Danger zone — admin only */}
      {isAdmin && <>
      {/* Email configuration */}
      <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
          <Mail size={15} className="text-blue-600" />
          <h3 className="font-semibold text-slate-800">Email Configuration</h3>
          <span className="ml-auto text-xs text-slate-400">SMTP · Password reset emails</span>
        </div>
        <div className="px-5 py-5">
          <EmailConfig />
        </div>
      </section>

      {/* WhatsApp configuration */}
      <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
          <MessageCircle size={15} className="text-emerald-600" />
          <h3 className="font-semibold text-slate-800">WhatsApp Bot</h3>
          <span className="ml-auto text-xs text-slate-400">Coming soon · Field device logging</span>
        </div>
        <div className="px-5 py-5">
          <WhatsAppConfig />
        </div>
      </section>

      {/* Danger zone */}
      <WipeDataButton />
      </>}
    </div>
  );
}
