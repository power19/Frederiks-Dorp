import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FloatingNav } from "@/components/layout/FloatingNav";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {children}
      <FloatingNav />
    </div>
  );
}
