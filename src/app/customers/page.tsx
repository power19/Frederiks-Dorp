import { prisma } from "@/lib/prisma";
import { getSessionScope } from "@/lib/sessionScope";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Building2 } from "lucide-react";

interface SearchParams { search?: string }

export default async function CustomersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const scope = await getSessionScope();
  if (!scope) redirect("/login");

  // Scoped users only have one customer — send them straight there
  if (scope.customerId) redirect(`/customers/${scope.customerId}`);

  const sp = await searchParams;

  const customers = await prisma.customer.findMany({
    where: sp.search ? {
      OR: [
        { name: { contains: sp.search } },
        { contacts: { some: { name: { contains: sp.search } } } },
        { contacts: { some: { email: { contains: sp.search } } } },
      ],
    } : undefined,
    include: {
      _count: { select: { devices: true } },
      contacts: { orderBy: { createdAt: "asc" }, take: 1 },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Customers</h2>
          <p className="text-slate-500 text-sm">{customers.length} customer{customers.length !== 1 ? "s" : ""} found</p>
        </div>
        <Link
          href="/customers/new"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={15} />
          Add Customer
        </Link>
      </div>

      {/* Search */}
      <form method="GET" className="flex flex-wrap gap-3">
        <input
          name="search"
          defaultValue={sp.search ?? ""}
          placeholder="Search name, contact, email…"
          className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button type="submit" className="bg-slate-800 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-slate-700 transition-colors">
          Search
        </button>
        {sp.search && (
          <Link href="/customers" className="text-slate-500 hover:text-slate-700 text-sm py-1.5">Clear</Link>
        )}
      </form>

      {customers.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Building2 size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-400">No customers found.</p>
          <Link href="/customers/new" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
            Add your first customer →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map((customer) => (
            <Link
              key={customer.id}
              href={`/customers/${customer.id}`}
              className="bg-white rounded-xl border border-slate-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Building2 size={18} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{customer.name}</h3>
                    {customer.contacts[0] && (
                      <p className="text-sm text-slate-500">
                        {customer.contacts[0].name}{customer.contacts[0].role ? ` · ${customer.contacts[0].role}` : ""}
                      </p>
                    )}
                  </div>
                </div>
                <span className="bg-slate-100 text-slate-600 text-xs font-medium px-2 py-1 rounded-lg">
                  {customer._count.devices} device{customer._count.devices !== 1 ? "s" : ""}
                </span>
              </div>
              {customer.contacts[0]?.email && (
                <p className="text-sm text-slate-500 mt-3 truncate">{customer.contacts[0].email}</p>
              )}
              {customer.contacts[0]?.phone && (
                <p className="text-sm text-slate-500 mt-1">{customer.contacts[0].phone}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
