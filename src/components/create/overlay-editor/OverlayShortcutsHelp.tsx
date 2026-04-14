import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Keyboard } from "lucide-react";

interface OverlayShortcutsHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const shortcuts = [
  { keys: ["Ctrl", "Z"], desc: "Desfazer" },
  { keys: ["Ctrl", "Shift", "Z"], desc: "Refazer" },
  { keys: ["Delete"], desc: "Deletar elemento" },
  { keys: ["Esc"], desc: "Desselecionar" },
  { keys: ["←", "→", "↑", "↓"], desc: "Mover 1%" },
  { keys: ["Shift", "←→↑↓"], desc: "Mover 5%" },
  { keys: ["?"], desc: "Mostrar atalhos" },
];

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[1.5rem] px-1.5 h-6 rounded border border-border bg-muted text-[11px] font-mono font-medium text-muted-foreground">
      {children}
    </kbd>
  );
}

export default function OverlayShortcutsHelp({ open, onOpenChange }: OverlayShortcutsHelpProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm font-bold flex items-center gap-2">
            <Keyboard className="w-4 h-4" />
            Atalhos do teclado
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2 pt-1">
          {shortcuts.map((s, i) => (
            <div key={i} className="flex items-center justify-between py-1">
              <span className="text-sm text-muted-foreground">{s.desc}</span>
              <div className="flex items-center gap-1">
                {s.keys.map((k, j) => (
                  <Kbd key={j}>{k}</Kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
