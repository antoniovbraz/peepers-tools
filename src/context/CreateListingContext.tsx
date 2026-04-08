import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { toast } from "@/hooks/use-toast";
import type { OverlayElement } from "@/lib/overlayTemplates";

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
    ean?: string;
    originalSku?: string;
    internalSku?: string;
    skuMappingNote?: string;
  };
  ads: {
    mercadoLivre: AdData;
    shopee: AdData;
  };
  prompts: PromptCard[];
  visualDNA?: VisualDNA;
  overlayUrls: Record<number, string>;
  overlayElements: Record<number, OverlayElement[]>;
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
  updateOverlayElements: (imageIndex: number, elements: OverlayElement[]) => void;
  getOverlayElements: (imageIndex: number) => OverlayElement[] | undefined;
  getAllOverlayCopies: () => string[];
  goNext: () => void;
  goBack: () => void;
  reset: () => void;
  clearDraft: () => void;
}

const DEFAULT_PROMPT_COUNT = 3;
const MAX_PROMPT_COUNT = 7;

const defaultPrompts: PromptCard[] = Array.from({ length: DEFAULT_PROMPT_COUNT }, (_, i) => ({
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
  overlayElements: {},
};

const DRAFT_KEY = "draft_product_v2";
const DRAFT_KEY_V1 = "draft_listing_v1";

interface DraftState {
  currentStep: number;
  completedSteps: boolean[];
  data: Omit<ListingData, "photos">; // Files are not serializable
}

function saveDraft(step: number, completed: boolean[], data: ListingData): boolean {
  try {
    const draft: DraftState = {
      currentStep: step,
      completedSteps: completed,
      data: {
        photoUrls: data.photoUrls,
        identification: data.identification,
        ads: data.ads,
        prompts: data.prompts,
        visualDNA: data.visualDNA,
        overlayUrls: data.overlayUrls,
        overlayElements: data.overlayElements,
      },
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    return true;
  } catch {
    return false;
  }
}

function loadDraft(): DraftState | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY) || localStorage.getItem(DRAFT_KEY_V1);
    if (!raw) return null;
    const draft = JSON.parse(raw) as DraftState;
    // Basic validation: must have photoUrls array and identification
    if (!draft?.data?.photoUrls || !draft?.data?.identification) return null;
    // Only restore if there's meaningful data (at least photos uploaded)
    if (draft.data.photoUrls.length === 0 && !draft.data.identification.name) return null;
    return draft;
  } catch {
    return null;
  }
}

function clearDraftStorage() {
  try {
    localStorage.removeItem(DRAFT_KEY);
    localStorage.removeItem(DRAFT_KEY_V1);
  } catch {
    // ignore
  }
}

const CreateListingContext = createContext<CreateListingContextType | null>(null);

export function CreateListingProvider({ children }: { children: React.ReactNode }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<boolean[]>([false, false, false, false, false]);
  const [data, setData] = useState<ListingData>({ ...initialData, prompts: defaultPrompts.map(p => ({ ...p })) });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftChecked = useRef(false);

  // Check for draft on mount
  useEffect(() => {
    if (draftChecked.current) return;
    draftChecked.current = true;

    const draft = loadDraft();
    if (draft) {
      toast({
        title: "📝 Rascunho encontrado",
        description: `Continuar editando "${draft.data.identification?.name || "seu produto"}"?`,
        duration: 10000,
        action: (
          <div className="flex gap-2 mt-2">
            <button
              className="px-3 py-1.5 text-xs font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => {
                setCurrentStep(draft.currentStep);
                setCompletedSteps(draft.completedSteps);
                setData({
                  photos: [],
                  photoUrls: draft.data.photoUrls || [],
                  identification: draft.data.identification,
                  ads: draft.data.ads,
                  prompts: draft.data.prompts,
                  visualDNA: draft.data.visualDNA,
                  overlayUrls: draft.data.overlayUrls || {},
                  overlayElements: draft.data.overlayElements || {},
                });
                toast({ title: "Rascunho restaurado ✓" });
              }}
            >
              Continuar
            </button>
            <button
              className="px-3 py-1.5 text-xs font-semibold rounded-md border border-border text-foreground hover:bg-muted"
              onClick={() => {
                clearDraftStorage();
                toast({ title: "Rascunho descartado" });
              }}
            >
              Descartar
            </button>
          </div>
        ),
      });
    }
  }, []);

  // Auto-save draft with debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const saved = saveDraft(currentStep, completedSteps, data);
      if (!saved) {
        toast({
          title: "Rascunho não salvo",
          description: "O armazenamento local está cheio. Libere espaço ou exporte seu trabalho.",
          variant: "destructive",
          duration: 8000,
        });
      }
    }, 2000);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [currentStep, completedSteps, data]);

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

  const updateVisualDNA = useCallback((visualDNA: VisualDNA) => {
    setData(prev => ({ ...prev, visualDNA }));
  }, []);

  const updateOverlayUrl = useCallback((promptId: number, url: string) => {
    setData(prev => ({
      ...prev,
      overlayUrls: { ...prev.overlayUrls, [promptId]: url },
    }));
  }, []);

  const updateOverlayElements = useCallback((imageIndex: number, elements: OverlayElement[]) => {
    setData(prev => ({
      ...prev,
      overlayElements: { ...prev.overlayElements, [imageIndex]: elements },
    }));
  }, []);

  const getOverlayElements = useCallback((imageIndex: number): OverlayElement[] | undefined => {
    return data.overlayElements[imageIndex];
  }, [data.overlayElements]);

  const getAllOverlayCopies = useCallback((): string[] => {
    const copies: string[] = [];
    for (const elements of Object.values(data.overlayElements)) {
      for (const el of elements) {
        if (el.text && (el.type === "headline" || el.type === "bullet" || el.type === "badge")) {
          copies.push(el.text);
        }
      }
    }
    return copies;
  }, [data.overlayElements]);

  const goNext = useCallback(() => {
    setCurrentStep(prev => Math.min(prev + 1, 4));
  }, []);

  const goBack = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  }, []);

  const clearDraft = useCallback(() => {
    clearDraftStorage();
  }, []);

  const reset = useCallback(() => {
    setCurrentStep(0);
    setCompletedSteps([false, false, false, false, false]);
    setData({ ...initialData, prompts: defaultPrompts.map(p => ({ ...p })), overlayUrls: {}, overlayElements: {} });
    clearDraftStorage();
  }, []);

  return (
    <CreateListingContext.Provider
      value={{
        currentStep, completedSteps, data,
        setCurrentStep, completeStep,
        updatePhotos, updateIdentification, updateAds, updatePrompts,
        updateVisualDNA, updateOverlayUrl, updateOverlayElements,
        getOverlayElements, getAllOverlayCopies,
        goNext, goBack, reset, clearDraft,
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
