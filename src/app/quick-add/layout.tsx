import { SessionProvider } from "@/components/layout/SessionProvider";
import { FloatingNav } from "@/components/layout/FloatingNav";

export default function QuickAddLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <div className="pb-24">
        {children}
      </div>
      <FloatingNav />
    </SessionProvider>
  );
}
