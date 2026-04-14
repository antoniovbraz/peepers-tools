import { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { PlusCircle, ClipboardList, LogOut, Settings } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import logoHorizontal from "@/assets/logo-horizontal.png";

const navItems = [
  { path: "/create", label: "Criar", icon: PlusCircle },
  { path: "/history", label: "Histórico", icon: ClipboardList },
  { path: "/settings", label: "Configurações", icon: Settings },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="flex flex-col min-h-[100dvh] bg-background">
        <header className="flex items-center justify-between px-4 py-3 border-b bg-card">
          <img src={logoHorizontal} alt="Peepers Shop" className="h-8" />
          <button onClick={signOut} aria-label="Sair" className="text-muted-foreground hover:text-foreground transition-colors p-1">
            <LogOut className="w-4 h-4" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto pb-24">
          {children}
        </main>

        <nav className="fixed bottom-0 left-0 right-0 bg-card border-t flex justify-around py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] z-40">
          {navItems.map(tab => {
            const isActive = location.pathname.startsWith(tab.path);
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                aria-current={isActive ? "page" : undefined}
                className={`flex flex-col items-center gap-0.5 px-6 py-1 rounded-lg transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="text-[11px] font-medium">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    );
  }

  // Desktop layout with sidebar
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-60 border-r bg-card flex flex-col shrink-0">
        <div className="px-5 py-5 border-b">
          <img src={logoHorizontal} alt="Peepers Shop" className="h-8" />
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(item => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                aria-current={isActive ? "page" : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t">
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
