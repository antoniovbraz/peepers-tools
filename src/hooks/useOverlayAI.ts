import { useState, useCallback } from "react";
import type { OverlayElement } from "@/components/create/overlay-editor/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface UseOverlayAIParams {
  productName: string;
  characteristics: string[];
  imageIndex: number;
  imageRole: string;
  elements: OverlayElement[];
  setElements: React.Dispatch<React.SetStateAction<OverlayElement[]>>;
  pushStructuralSnapshot: () => void;
  getAllOverlayCopies: () => string[];
  headlineColor: string;
}

export interface UseOverlayAIReturn {
  generateCopy: (targetIds?: string[]) => Promise<void>;
  generateSingleCopy: (elementId: string) => Promise<void>;
  generatingCopy: boolean;
  generatingElementId: string | null;
}

export function useOverlayAI(params: UseOverlayAIParams): UseOverlayAIReturn {
  const {
    productName,
    characteristics,
    imageIndex,
    imageRole,
    elements,
    setElements,
    pushStructuralSnapshot,
    getAllOverlayCopies,
    headlineColor,
  } = params;

  const [generatingCopy, setGeneratingCopy] = useState(false);
  const [generatingElementId, setGeneratingElementId] = useState<string | null>(null);

  const generateCopy = useCallback(
    async (targetIds?: string[]) => {
      setGeneratingCopy(true);
      try {
        const previousCopies = getAllOverlayCopies();

        let targetElements: string[] | undefined;
        if (targetIds && targetIds.length > 0) {
          targetElements = [
            ...new Set(elements.filter((el) => targetIds.includes(el.id)).map((el) => el.type)),
          ];
        }

        const { data, error } = await supabase.functions.invoke("generate-overlay-copy", {
          body: {
            productName,
            characteristics,
            imageRole,
            imageIndex,
            previousCopies,
            targetElements,
          },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        pushStructuralSnapshot();

        const idsToUpdate =
          targetIds && targetIds.length > 0 ? new Set(targetIds) : null;

        if (data?.headline) {
          setElements((prev) =>
            prev.map((el) => {
              if (el.type !== "headline") return el;
              if (idsToUpdate && !idsToUpdate.has(el.id)) return el;
              return { ...el, text: data.headline };
            }),
          );
        }

        if (data?.subheadline) {
          setElements((prev) =>
            prev.map((el) => {
              if (el.type !== "subheadline") return el;
              if (idsToUpdate && !idsToUpdate.has(el.id)) return el;
              return { ...el, text: data.subheadline };
            }),
          );
        }

        if (data?.badges && Array.isArray(data.badges)) {
          setElements((prev) => {
            const badgeEls = prev.filter((el) => el.type === "badge");
            const targetBadges = idsToUpdate
              ? badgeEls.filter((el) => idsToUpdate.has(el.id))
              : badgeEls;

            const badgeTexts = data.badges.slice(
              0,
              targetBadges.length || 5,
            ) as string[];
            return prev.map((el) => {
              if (el.type !== "badge") return el;
              if (idsToUpdate && !idsToUpdate.has(el.id)) return el;
              const idx = targetBadges.indexOf(el);
              if (idx >= 0 && idx < badgeTexts.length) {
                return { ...el, text: badgeTexts[idx] };
              }
              return el;
            });
          });
        }

        if (data?.bullets && Array.isArray(data.bullets)) {
          setElements((prev) => {
            const bulletEls = prev.filter((el) => el.type === "bullet");
            const targetBullets = idsToUpdate
              ? bulletEls.filter((el) => idsToUpdate.has(el.id))
              : bulletEls;

            const bulletTexts = data.bullets.slice(
              0,
              targetBullets.length || 5,
            ) as string[];
            const updated = prev.map((el) => {
              if (el.type !== "bullet") return el;
              if (idsToUpdate && !idsToUpdate.has(el.id)) return el;
              const idx = targetBullets.indexOf(el);
              if (idx >= 0 && idx < bulletTexts.length) {
                return { ...el, text: bulletTexts[idx] };
              }
              return el;
            });

            // Only create new bullets if there are no badge-only templates
            if (!idsToUpdate) {
              const hasBadges = prev.some((el) => el.type === "badge");
              const hasBullets = bulletEls.length > 0;
              if (hasBullets || !hasBadges) {
                const existingBulletCount = bulletEls.length;
                for (
                  let i = existingBulletCount;
                  i < bulletTexts.length && i < 5;
                  i++
                ) {
                  updated.push({
                    id: `bullet-gen-${Date.now()}-${i}`,
                    type: "bullet",
                    text: bulletTexts[i],
                    x: 5,
                    y: 35 + i * 10,
                    width: 40,
                    fontSize: 16,
                    color: headlineColor,
                    bold: false,
                    opacity: 100,
                    textAlign: "left",
                    textStyle: "none",
                  });
                }
              }
            }
            return updated;
          });
        }

        toast({ title: "Copy gerado com sucesso!" });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Erro desconhecido";
        console.error("Generate copy error:", err);
        toast({
          title: "Erro ao gerar copy",
          description: msg,
          variant: "destructive",
        });
      } finally {
        setGeneratingCopy(false);
      }
    },
    [
      productName,
      characteristics,
      imageRole,
      imageIndex,
      elements,
      setElements,
      pushStructuralSnapshot,
      getAllOverlayCopies,
      headlineColor,
    ],
  );

  const generateSingleCopy = useCallback(
    async (elementId: string) => {
      setGeneratingElementId(elementId);
      try {
        await generateCopy([elementId]);
      } finally {
        setGeneratingElementId(null);
      }
    },
    [generateCopy],
  );

  return {
    generateCopy,
    generateSingleCopy,
    generatingCopy,
    generatingElementId,
  };
}
