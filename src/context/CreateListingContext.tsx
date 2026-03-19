import React, { createContext, useContext, useState, useCallback } from "react";

export interface PromptCard {
  id: number;
  prompt: string;
  imageUrl?: string;
  approved: boolean;
  feedback?: string;
}

export interface AdData {
  title: string;
  description: string;
}

export interface VisualDNA {
  background: string;
  lighting: string;
  style: string;
  tone: string;
  accentColor: string;
  headlineColor: string;
}

export interface ListingData {
  photos: File[];
  photoUrls: string[];
  identification: {
    name: string;
    category: string;
    characteristics: string[];
    extras: string;
  };
  ads: {
    mercadoLivre: AdData;
    shopee: AdData;
  };
  prompts: PromptCard[];
  visualDNA?: VisualDNA;
  overlayUrls: Record<number, string>; // promptId -> overlay image URL
}

interface CreateListingContextType {
  currentStep: number;
  completedSteps: boolean[];
  data: ListingData;
  setCurrentStep: (step: number) => void;
  completeStep: (step: number) => void;
  updatePhotos: (photos: File[], urls: string[]) => void;
  updateIdentification: (id: ListingData["identification"]) => void;
  updateAds: (ads: ListingData["ads"]) => void;
  updatePrompts: (prompts: PromptCard[]) => void;
  updateVisualDNA: (dna: VisualDNA) => void;
  updateOverlayUrl: (promptId: number, url: string) => void;
  goNext: () => void;
  goBack: () => void;
  reset: () => void;
}

const defaultPrompts: PromptCard[] = Array.from({ length: 7 }, (_, i) => ({
  id: i + 1,
  prompt: "",
  approved: false,
}));

const initialData: ListingData = {
  photos: [],
  photoUrls: [],
  identification: { name: "", category: "", characteristics: [], extras: "" },
  ads: {
    mercadoLivre: { title: "", description: "" },
    shopee: { title: "", description: "" },
  },
  prompts: defaultPrompts,
  visualDNA: undefined,
  overlayUrls: {},
};

const CreateListingContext = createContext<CreateListingContextType | null>(null);

export function CreateListingProvider({ children }: { children: React.ReactNode }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<boolean[]>([false, false, false, false, false]);
  const [data, setData] = useState<ListingData>({ ...initialData, prompts: defaultPrompts.map(p => ({ ...p })) });

  const completeStep = useCallback((step: number) => {
    setCompletedSteps(prev => {
      const next = [...prev];
      next[step] = true;
      return next;
    });
  }, []);

  const updatePhotos = useCallback((photos: File[], urls: string[]) => {
    setData(prev => ({ ...prev, photos, photoUrls: urls }));
  }, []);

  const updateIdentification = useCallback((identification: ListingData["identification"]) => {
    setData(prev => ({ ...prev, identification }));
  }, []);

  const updateAds = useCallback((ads: ListingData["ads"]) => {
    setData(prev => ({ ...prev, ads }));
  }, []);

  const updatePrompts = useCallback((prompts: PromptCard[]) => {
    setData(prev => ({ ...prev, prompts }));
  }, []);

  const goNext = useCallback(() => {
    setCurrentStep(prev => Math.min(prev + 1, 4));
  }, []);

  const goBack = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  }, []);

  const reset = useCallback(() => {
    setCurrentStep(0);
    setCompletedSteps([false, false, false, false, false]);
    setData({ ...initialData, prompts: defaultPrompts.map(p => ({ ...p })), overlayUrls: {} });
  }, []);

  return (
    <CreateListingContext.Provider
      value={{
        currentStep, completedSteps, data,
        setCurrentStep, completeStep,
        updatePhotos, updateIdentification, updateAds, updatePrompts,
        updateVisualDNA, updateOverlayUrl,
        goNext, goBack, reset,
      }}
    >
      {children}
    </CreateListingContext.Provider>
  );
}

export function useCreateListing() {
  const ctx = useContext(CreateListingContext);
  if (!ctx) throw new Error("useCreateListing must be used within CreateListingProvider");
  return ctx;
}
