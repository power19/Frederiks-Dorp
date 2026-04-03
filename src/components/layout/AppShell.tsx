import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { TopBar } from "./Topbar";
import { SessionProvider } from "./SessionProvider";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <div className="flex h-screen overflow-hidden bg-slate-50">
        {/* Sidebar — only on md+ screens */}
        <div className="hidden md:flex md:flex-col md:w-56 md:shrink-0 h-full">
          <Sidebar />
        </div>

        {/* Right side: topbar always visible + scrollable content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* TopBar with sign out — ALWAYS shown on all screen sizes */}
          <TopBar />

          {/* Main content scrolls independently */}
          <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div className="md:hidden">
        <BottomNav />
      </div>
    </SessionProvider>
  );
}
