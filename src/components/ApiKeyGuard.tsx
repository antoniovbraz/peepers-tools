import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

/**
 * Checks if the user has at least one API key configured.
 * If not, redirects to /settings with a toast message.
 * Passes through silently if already on /settings.
 */
export function ApiKeyGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Don't block /settings itself
    if (location.pathname === "/settings") {
      setChecked(true);
      return;
    }

    let cancelled = false;

    async function check() {
      try {
        const { data, error } = await supabase.functions.invoke("manage-api-keys", {
          method: "GET",
        });

        if (cancelled) return;

        if (!error && Array.isArray(data?.keys) && data.keys.length > 0) {
          setChecked(true);
          return;
        }

        // No keys — redirect to settings
        toast({
          title: "Configure sua IA",
          description:
            "Você precisa adicionar pelo menos uma chave de API de IA para começar.",
        });
        navigate("/settings", { replace: true });
      } catch {
        // On error, allow through (don't block the app)
        setChecked(true);
      }
    }

    check();
    return () => { cancelled = true; };
  }, [location.pathname, navigate]);

  if (!checked && location.pathname !== "/settings") {
    return (
      <div className="flex items-center justify-center min-h-[60dvh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
