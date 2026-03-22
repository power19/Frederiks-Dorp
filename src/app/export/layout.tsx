import { requireAuth } from "@/lib/requireAuth";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function Layout({ children }: { children: React.ReactNode }) {
  await requireAuth();
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
