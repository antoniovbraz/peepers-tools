import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export default function TabUsage() {
  const [stats, setStats] = useState<{ function_name: string; count: number; avg_latency: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await supabase
          .from("usage_logs")
          .select("function_name, latency_ms")
          .order("created_at", { ascending: false })
          .limit(500);

        if (data) {
          const map = new Map<string, { count: number; totalLatency: number }>();
          for (const row of data) {
            const fn = row.function_name;
            const existing = map.get(fn) || { count: 0, totalLatency: 0 };
            existing.count++;
            existing.totalLatency += row.latency_ms || 0;
            map.set(fn, existing);
          }
          setStats(
            Array.from(map.entries()).map(([fn, { count, totalLatency }]) => ({
              function_name: fn,
              count,
              avg_latency: Math.round(totalLatency / count),
            }))
          );
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const fnLabels: Record<string, string> = {
    identify: "Identificar Produto",
    ads: "Gerar Anúncios",
    prompts: "Gerar Prompts",
    image: "Gerar Imagem",
    overlay_copy: "Gerar Copy Overlay",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Uso da IA</h3>
        <p className="text-sm text-muted-foreground">Suas últimas 500 chamadas à IA</p>
      </div>

      {stats.length === 0 ? (
        <div className="bg-card border rounded-lg p-8 text-center text-muted-foreground">
          Nenhum uso registrado ainda.
        </div>
      ) : (
        <div className="bg-card border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium">Função</th>
                <th className="text-right px-4 py-3 font-medium">Chamadas</th>
                <th className="text-right px-4 py-3 font-medium">Latência média</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((s) => (
                <tr key={s.function_name} className="border-b last:border-0">
                  <td className="px-4 py-3">{fnLabels[s.function_name] || s.function_name}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{s.count}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                    {s.avg_latency}ms
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
