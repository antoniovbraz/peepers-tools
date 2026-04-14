import { useEffect, useRef } from "react";
import { Copy, Trash2, ChevronUp, ChevronDown, Crosshair } from "lucide-react";

interface OverlayContextMenuProps {
  x: number;
  y: number;
  elementId: string;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onMoveLayer: (id: string, direction: "up" | "down") => void;
  onCenterH: () => void;
  onClose: () => void;
}

export default function OverlayContextMenu({
  x, y, elementId, onDuplicate, onDelete, onMoveLayer, onCenterH, onClose,
}: OverlayContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("mousedown", handler, true);
    window.addEventListener("keydown", keyHandler);
    return () => {
      window.removeEventListener("mousedown", handler, true);
      window.removeEventListener("keydown", keyHandler);
    };
  }, [onClose]);

  const items = [
    { label: "Duplicar", icon: Copy, action: () => onDuplicate(elementId) },
    { label: "Centralizar H", icon: Crosshair, action: onCenterH },
    { label: "Mover acima", icon: ChevronUp, action: () => onMoveLayer(elementId, "up") },
    { label: "Mover abaixo", icon: ChevronDown, action: () => onMoveLayer(elementId, "down") },
    { label: "Deletar", icon: Trash2, action: () => onDelete(elementId), destructive: true },
  ];

  return (
    <div
      ref={ref}
      role="menu"
      className="absolute z-50 min-w-[160px] rounded-md border bg-popover p-1 shadow-md animate-in fade-in-0 zoom-in-95"
      style={{ left: x, top: y }}
    >
      {items.map((item) => (
        <button
          key={item.label}
          role="menuitem"
          type="button"
          className={`flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground ${
            "destructive" in item && item.destructive ? "text-destructive hover:text-destructive" : ""
          }`}
          onClick={() => { item.action(); onClose(); }}
        >
          <item.icon className="w-3.5 h-3.5" />
          {item.label}
        </button>
      ))}
    </div>
  );
}
