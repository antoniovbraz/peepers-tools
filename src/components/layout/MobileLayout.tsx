import { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { PlusCircle, ClipboardList } from "lucide-react";

const tabs = [
  { path: "/create", label: "Criar", icon: PlusCircle },
  { path: "/history", label: "Histórico", icon: ClipboardList },
];

export default function MobileLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="flex flex-col min-h-[100dvh] bg-background">
      {/* Header */}
      <header className="flex items-center justify-center px-4 py-3 border-b bg-card">
        <h1 className="font-display text-lg font-bold tracking-tight text-foreground">
          ✏️ Paper Shop
        </h1>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t flex justify-around py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] z-50">
        {tabs.map(tab => {
          const isActive = location.pathname.startsWith(tab.path);
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center gap-0.5 px-6 py-1 rounded-lg transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
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
