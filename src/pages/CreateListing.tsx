import { CreateListingProvider, useCreateListing } from "@/context/CreateListingContext";
import { AnimatePresence, motion } from "framer-motion";
import StepperProgress from "@/components/create/StepperProgress";
import StepUpload from "@/components/create/StepUpload";
import StepIdentify from "@/components/create/StepIdentify";
import StepAds from "@/components/create/StepAds";
import StepPrompts from "@/components/create/StepPrompts";
import StepExport from "@/components/create/StepExport";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const steps = [StepUpload, StepIdentify, StepAds, StepPrompts, StepExport];

function CreateListingInner() {
  const { currentStep } = useCreateListing();
  const StepComponent = steps[currentStep];

  // Wrap image-heavy steps (Prompts=3, Export=4) with dedicated ErrorBoundary
  // so canvas/image crashes don't lose the entire wizard state
  const needsBoundary = currentStep >= 3;

  return (
    <div className="max-w-3xl mx-auto">
      <StepperProgress />
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
