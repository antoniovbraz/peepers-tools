import { CreateListingProvider, useCreateListing } from "@/context/CreateListingContext";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Save } from "lucide-react";
import StepperProgress from "@/components/create/StepperProgress";
import StepUpload from "@/components/create/StepUpload";
import StepIdentify from "@/components/create/StepIdentify";
import StepAds from "@/components/create/StepAds";
import StepPrompts from "@/components/create/StepPrompts";
import StepExport from "@/components/create/StepExport";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { toast } from "@/hooks/use-toast";

const steps = [StepUpload, StepIdentify, StepAds, StepPrompts, StepExport];

function CreateListingInner() {
  const { currentStep } = useCreateListing();
  const navigate = useNavigate();
  const StepComponent = steps[currentStep];

  // Wrap image-heavy steps (Prompts=3, Export=4) with dedicated ErrorBoundary
  // so canvas/image crashes don't lose the entire wizard state
  const needsBoundary = currentStep >= 3;

  const handleSaveAndExit = () => {
    toast({ title: "Rascunho salvo", description: "Você pode continuar de onde parou." });
    navigate("/history");
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-2 px-4 md:px-8 pt-3">
        <button
          onClick={handleSaveAndExit}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          <Save className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Salvar e sair</span>
        </button>
        <div className="flex-1">
          <StepperProgress />
        </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
        >
          {needsBoundary ? (
            <ErrorBoundary key={`boundary-${currentStep}`}>
              <StepComponent />
            </ErrorBoundary>
          ) : (
            <StepComponent />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default function CreateListing() {
  return (
    <CreateListingProvider>
      <CreateListingInner />
    </CreateListingProvider>
  );
}
