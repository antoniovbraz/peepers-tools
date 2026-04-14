import { Check, Camera, Brain, FileText, Palette, Download } from "lucide-react";
import { useCreateListing } from "@/context/CreateListingContext";

const steps = [
  { label: "Fotos", icon: Camera },
  { label: "ID", icon: Brain },
  { label: "Anúncios", icon: FileText },
  { label: "Prompts", icon: Palette },
  { label: "Export", icon: Download },
];

export default function StepperProgress() {
  const { currentStep, completedSteps } = useCreateListing();

  return (
    <div className="px-4 md:px-8 py-3" role="progressbar" aria-valuenow={currentStep + 1} aria-valuemin={1} aria-valuemax={5} aria-label={`Passo ${currentStep + 1} de 5: ${steps[currentStep].label}`}>
      <div className="flex items-center justify-between relative">
        {/* Connector line */}
        <div className="absolute top-4 left-[10%] right-[10%] h-0.5 bg-border" />
        <div
          className="absolute top-4 left-[10%] h-0.5 bg-primary transition-all duration-500 ease-out"
          style={{ width: `${Math.max(0, (currentStep / 4) * 80)}%` }}
        />

        {steps.map((step, i) => {
          const isCompleted = completedSteps[i];
          const isCurrent = currentStep === i;
          const Icon = step.icon;

          return (
            <div key={i} className="flex flex-col items-center z-10 relative">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isCompleted
                    ? "bg-success"
                    : isCurrent
                    ? "bg-primary animate-pulse-green"
                    : "bg-muted"
                }`}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4 text-success-foreground animate-check-pop" />
                ) : (
                  <Icon
                    className={`w-4 h-4 ${
                      isCurrent ? "text-primary-foreground" : "text-muted-foreground"
                    }`}
                  />
                )}
              </div>
              <span
                className={`text-[10px] md:text-xs mt-1 font-medium ${
                  isCompleted
                    ? "text-success"
                    : isCurrent
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
