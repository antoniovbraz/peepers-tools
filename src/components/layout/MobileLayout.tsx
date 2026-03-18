import { ReactNode } from "react";
import logo from "@/assets/logo.png";
import { useNavigate, useLocation } from "react-router-dom";
import { PlusCircle, ClipboardList, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const tabs = [
  { path: "/create", label: "Criar", icon: PlusCircle },
  { path: "/history", label: "Histórico", icon: ClipboardList },
];

export default function MobileLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();

  return (
    <div className="flex flex-col min-h-[100dvh] bg-background">
      <header className="flex items-center justify-between px-4 py-3 border-b bg-card">
        <h1 className="font-display text-lg font-bold tracking-tight text-foreground">
          <img src={logo} alt="Peepers Shop" className="h-7 mr-2 inline-block" />
          Peepers Shop
        </h1>
        <button onClick={signOut} className="text-muted-foreground hover:text-foreground transition-colors p-1">
          <LogOut className="w-4 h-4" />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>

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
