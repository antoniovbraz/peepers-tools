interface ColorSwatchProps {
  color: string;
  active: boolean;
  onClick: () => void;
}

export default function ColorSwatch({ color, active, onClick }: ColorSwatchProps) {
  return (
    <button
      type="button"
      className={`w-8 h-8 rounded-full border-2 transition-all active:scale-95 ${
        active ? "border-primary ring-2 ring-primary/30 scale-110" : "border-border hover:scale-105"
      }`}
      style={{ backgroundColor: color }}
      onClick={onClick}
    />
  );
}
