import { CreateListingProvider, useCreateListing } from "@/context/CreateListingContext";
import StepperProgress from "@/components/create/StepperProgress";
import StepUpload from "@/components/create/StepUpload";
import StepIdentify from "@/components/create/StepIdentify";
import StepAds from "@/components/create/StepAds";
import StepPrompts from "@/components/create/StepPrompts";
import StepExport from "@/components/create/StepExport";

const steps = [StepUpload, StepIdentify, StepAds, StepPrompts, StepExport];

function CreateListingInner() {
  const { currentStep } = useCreateListing();
  const StepComponent = steps[currentStep];

  return (
    <div>
      <StepperProgress />
      <StepComponent />
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
