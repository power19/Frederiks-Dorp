import { requireAuth } from "@/lib/requireAuth";
import { FloatingNav } from "@/components/layout/FloatingNav";

export default async function Layout({ children }: { children: React.ReactNode }) {
  await requireAuth();
  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {children}
      <FloatingNav />
    </div>
  );
}
