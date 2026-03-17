import { ClipboardList } from "lucide-react";

export default function History() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 gap-4">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
        <ClipboardList className="w-8 h-8 text-muted-foreground" />
      </div>
      <div className="text-center space-y-1">
        <h2 className="font-display text-xl font-bold text-foreground">Histórico</h2>
        <p className="text-sm text-muted-foreground">
          Seus anúncios criados aparecerão aqui
        </p>
      </div>
    </div>
  );
}
