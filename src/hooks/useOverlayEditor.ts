import { useState, useRef, useCallback, useEffect } from "react";
import type { OverlayElement, ElementType } from "@/components/create/overlay-editor/types";
import { migrateElement } from "@/components/create/overlay-editor/types";
import { ELEMENT_DEFAULTS, TEXT_SNAPSHOT_DEBOUNCE_MS } from "@/components/create/overlay-editor/constants";
import { getDefaultTemplate } from "@/lib/overlayTemplates";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { useCreateListing } from "@/context/CreateListingContext";

export interface UseOverlayEditorReturn {
  elements: OverlayElement[];
  setElements: React.Dispatch<React.SetStateAction<OverlayElement[]>>;
  selectedId: string | null;
  checkedIds: Set<string>;
  selectedElement: OverlayElement | undefined;

  addElement: (type: ElementType, headlineColor: string, accentColor: string) => void;
  deleteElement: (id: string) => void;
  updateElement: (id: string, updates: Partial<OverlayElement>) => void;
  updateElementText: (id: string, text: string) => void;
  duplicateElement: (id: string) => void;

  setSelectedId: (id: string | null) => void;
  toggleCheck: (id: string) => void;
  clearChecked: () => void;
  setSheetOpen: (open: boolean) => void;

  moveLayer: (id: string, direction: "up" | "down") => void;

  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  pushStructuralSnapshot: () => void;
  pushTextSnapshot: () => void;

  alignElements: (
    axis: "x" | "y",
    align: "start" | "center" | "end",
    getElSize: (el: OverlayElement) => { w: number; h: number },
  ) => void;
  distributeElements: (
    axis: "x" | "y",
    getElSize: (el: OverlayElement) => { w: number; h: number },
  ) => void;

  updateCheckedElements: (updates: Partial<OverlayElement>) => void;
  deleteCheckedElements: () => void;

  loadElements: (imageIndex: number, headlineColor: string, accentColor: string) => void;
}

export function useOverlayEditor(): UseOverlayEditorReturn {
  const [elements, setElements] = useState<OverlayElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [, setSheetOpenState] = useState(false);

  const { updateOverlayElements, getOverlayElements } = useCreateListing();
  const { pushSnapshot, undo, redo, canUndo, canRedo, reset } = useUndoRedo(elements, setElements);

  const loadedForRef = useRef<string | null>(null);
  const textDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const preTextSnapshotRef = useRef<OverlayElement[] | null>(null);

  const selectedElement = elements.find((el) => el.id === selectedId);

  // Smart undo snapshots
  const pushStructuralSnapshot = useCallback(() => {
    if (textDebounceRef.current) {
      clearTimeout(textDebounceRef.current);
      textDebounceRef.current = null;
    }
    if (preTextSnapshotRef.current) {
      pushSnapshot(preTextSnapshotRef.current);
      preTextSnapshotRef.current = null;
    } else {
      pushSnapshot([...elements]);
    }
  }, [elements, pushSnapshot]);

  const pushTextSnapshot = useCallback(() => {
    if (!preTextSnapshotRef.current) {
      preTextSnapshotRef.current = [...elements];
    }
    if (textDebounceRef.current) clearTimeout(textDebounceRef.current);
    textDebounceRef.current = setTimeout(() => {
      if (preTextSnapshotRef.current) {
        pushSnapshot(preTextSnapshotRef.current);
        preTextSnapshotRef.current = null;
      }
      textDebounceRef.current = null;
    }, TEXT_SNAPSHOT_DEBOUNCE_MS);
  }, [elements, pushSnapshot]);

  // Load
  const loadElements = useCallback(
    (imageIndex: number, headlineColor: string, accentColor: string) => {
      const key = `${imageIndex}`;
      if (loadedForRef.current === key) return;
      loadedForRef.current = key;

      const saved = getOverlayElements(imageIndex);
      if (saved && saved.length > 0) {
        // Migrate old format elements from localStorage/DB
        const migrated = saved.map((el) =>
          migrateElement(el as unknown as Record<string, unknown>),
        );
        setElements(migrated);
      } else {
        setElements(getDefaultTemplate(imageIndex, headlineColor, accentColor));
      }
      setSelectedId(null);
      setCheckedIds(new Set());
      setSheetOpenState(false);
      reset();
    },
    [getOverlayElements, reset],
  );

  // Persist elements to context on change
  useEffect(() => {
    if (elements.length > 0 && loadedForRef.current) {
      const imageIndex = parseInt(loadedForRef.current, 10);
      if (!isNaN(imageIndex)) {
        updateOverlayElements(imageIndex, elements);
      }
    }
  }, [elements, updateOverlayElements]);

  // CRUD
  const addElement = useCallback(
    (type: ElementType, headlineColor: string, accentColor: string) => {
      pushStructuralSnapshot();
      const id = `${type}-${Date.now()}`;
      const defaults = ELEMENT_DEFAULTS[type];

      let newEl: OverlayElement;
      switch (type) {
        case "headline":
        case "subheadline":
        case "bullet":
          newEl = {
            id,
            type,
            text: (defaults.text as string) ?? "",
            fontSize: (defaults.fontSize as number) ?? 16,
            color: headlineColor,
            bold: (defaults.bold as boolean) ?? false,
            width: (defaults.width as number) ?? 40,
            textAlign: "left",
            textStyle: "none",
            opacity: 100,
            x: (defaults.x as number) ?? 10,
            y: (defaults.y as number) ?? 10,
          };
          break;
        case "badge":
          newEl = {
            id,
            type: "badge",
            text: (defaults.text as string) ?? "Badge",
            fontSize: (defaults.fontSize as number) ?? 14,
            color: "#FFFFFF",
            bgColor: accentColor,
            opacity: 100,
            x: (defaults.x as number) ?? 10,
            y: (defaults.y as number) ?? 80,
          };
          break;
        case "arrow":
          newEl = {
            id,
            type: "arrow",
            text: (defaults.text as string) ?? "Detalhe",
            fontSize: (defaults.fontSize as number) ?? 14,
            color: headlineColor,
            length: (defaults.length as number) ?? 10,
            rotation: (defaults.rotation as number) ?? -30,
            opacity: 100,
            x: (defaults.x as number) ?? 50,
            y: (defaults.y as number) ?? 50,
          };
          break;
        case "circle":
          newEl = {
            id,
            type: "circle",
            radius: (defaults.radius as number) ?? 10,
            color: accentColor,
            strokeWidth: (defaults.strokeWidth as number) ?? 3,
            opacity: 100,
            x: (defaults.x as number) ?? 50,
            y: (defaults.y as number) ?? 50,
          };
          break;
      }

      setElements((prev) => [...prev, newEl]);
      setSelectedId(id);
    },
    [pushStructuralSnapshot],
  );

  const deleteElement = useCallback(
    (id: string) => {
      pushStructuralSnapshot();
      setElements((prev) => prev.filter((el) => el.id !== id));
      setCheckedIds((prev) => {
        const n = new Set(prev);
        n.delete(id);
        return n;
      });
      if (selectedId === id) {
        setSelectedId(null);
        setSheetOpenState(false);
      }
    },
    [selectedId, pushStructuralSnapshot],
  );

  const updateElement = useCallback((id: string, updates: Partial<OverlayElement>) => {
    setElements((prev) =>
      prev.map((el) => (el.id === id ? ({ ...el, ...updates } as OverlayElement) : el)),
    );
  }, []);

  const updateElementText = useCallback(
    (id: string, text: string) => {
      pushTextSnapshot();
      setElements((prev) =>
        prev.map((el) => (el.id === id ? ({ ...el, text } as OverlayElement) : el)),
      );
    },
    [pushTextSnapshot],
  );

  const duplicateElement = useCallback(
    (id: string) => {
      pushStructuralSnapshot();
      const el = elements.find((e) => e.id === id);
      if (!el) return;
      const newEl: OverlayElement = {
        ...el,
        id: `${el.type}-${Date.now()}`,
        x: Math.min(95, el.x + 5),
        y: Math.min(95, el.y + 5),
      };
      setElements((prev) => [...prev, newEl]);
      setSelectedId(newEl.id);
    },
    [elements, pushStructuralSnapshot],
  );

  // Selection
  const toggleCheck = useCallback((id: string) => {
    setCheckedIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }, []);

  const clearChecked = useCallback(() => {
    setCheckedIds(new Set());
  }, []);

  const setSheetOpen = useCallback((open: boolean) => {
    setSheetOpenState(open);
  }, []);

  // Layers
  const moveLayer = useCallback(
    (id: string, direction: "up" | "down") => {
      pushStructuralSnapshot();
      setElements((prev) => {
        const idx = prev.findIndex((el) => el.id === id);
        if (idx < 0) return prev;
        const target = direction === "up" ? idx + 1 : idx - 1;
        if (target < 0 || target >= prev.length) return prev;
        const next = [...prev];
        [next[idx], next[target]] = [next[target], next[idx]];
        return next;
      });
    },
    [pushStructuralSnapshot],
  );

  // Alignment
  const alignElements = useCallback(
    (
      axis: "x" | "y",
      align: "start" | "center" | "end",
      getElSize: (el: OverlayElement) => { w: number; h: number },
    ) => {
      pushStructuralSnapshot();
      const ids =
        checkedIds.size >= 2
          ? checkedIds
          : selectedId
            ? new Set([selectedId])
            : new Set<string>();
      if (ids.size === 0) return;

      const targets = elements.filter((el) => ids.has(el.id));
      if (targets.length === 0) return;

      if (targets.length === 1) {
        const el = targets[0];
        const size = getElSize(el);
        let val: number;
        if (axis === "x") {
          val = align === "start" ? 2 : align === "center" ? 50 - size.w / 2 : 98 - size.w;
        } else {
          val = align === "start" ? 2 : align === "center" ? 50 - size.h / 2 : 98 - size.h;
        }
        setElements((prev) =>
          prev.map((e) =>
            e.id === el.id ? { ...e, [axis]: Math.max(0, Math.min(100, val)) } : e,
          ),
        );
      } else {
        const sized = targets.map((el) => ({ el, size: getElSize(el) }));
        if (axis === "x") {
          const minX = Math.min(...sized.map((s) => s.el.x));
          const maxX = Math.max(...sized.map((s) => s.el.x + s.size.w));
          setElements((prev) =>
            prev.map((e) => {
              if (!ids.has(e.id)) return e;
              const s = sized.find((ss) => ss.el.id === e.id);
              if (!s) return e;
              let newX: number;
              if (align === "start") newX = minX;
              else if (align === "center") newX = (minX + maxX) / 2 - s.size.w / 2;
              else newX = maxX - s.size.w;
              return { ...e, x: Math.max(0, Math.min(100 - s.size.w, newX)) };
            }),
          );
        } else {
          const minY = Math.min(...sized.map((s) => s.el.y));
          const maxY = Math.max(...sized.map((s) => s.el.y + s.size.h));
          setElements((prev) =>
            prev.map((e) => {
              if (!ids.has(e.id)) return e;
              const s = sized.find((ss) => ss.el.id === e.id);
              if (!s) return e;
              let newY: number;
              if (align === "start") newY = minY;
              else if (align === "center") newY = (minY + maxY) / 2 - s.size.h / 2;
              else newY = maxY - s.size.h;
              return { ...e, y: Math.max(0, Math.min(100 - s.size.h, newY)) };
            }),
          );
        }
      }
    },
    [checkedIds, selectedId, elements, pushStructuralSnapshot],
  );

  const distributeElements = useCallback(
    (
      axis: "x" | "y",
      getElSize: (el: OverlayElement) => { w: number; h: number },
    ) => {
      if (checkedIds.size < 3) return;
      pushStructuralSnapshot();
      const targets = elements.filter((el) => checkedIds.has(el.id));
      const sized = targets.map((el) => ({ el, size: getElSize(el) }));

      if (axis === "x") {
        sized.sort((a, b) => a.el.x - b.el.x);
        const minX = sized[0].el.x;
        const maxX = sized[sized.length - 1].el.x + sized[sized.length - 1].size.w;
        const totalW = sized.reduce((sum, s) => sum + s.size.w, 0);
        const gap = (maxX - minX - totalW) / (sized.length - 1);
        let currentX = minX;
        const updates: Record<string, number> = {};
        for (const s of sized) {
          updates[s.el.id] = currentX;
          currentX += s.size.w + gap;
        }
        setElements((prev) =>
          prev.map((e) =>
            updates[e.id] !== undefined
              ? { ...e, x: Math.max(0, Math.min(100, updates[e.id])) }
              : e,
          ),
        );
      } else {
        sized.sort((a, b) => a.el.y - b.el.y);
        const minY = sized[0].el.y;
        const maxY = sized[sized.length - 1].el.y + sized[sized.length - 1].size.h;
        const totalH = sized.reduce((sum, s) => sum + s.size.h, 0);
        const gap = (maxY - minY - totalH) / (sized.length - 1);
        let currentY = minY;
        const updates: Record<string, number> = {};
        for (const s of sized) {
          updates[s.el.id] = currentY;
          currentY += s.size.h + gap;
        }
        setElements((prev) =>
          prev.map((e) =>
            updates[e.id] !== undefined
              ? { ...e, y: Math.max(0, Math.min(100, updates[e.id])) }
              : e,
          ),
        );
      }
    },
    [checkedIds, elements, pushStructuralSnapshot],
  );

  // Group
  const updateCheckedElements = useCallback(
    (updates: Partial<OverlayElement>) => {
      pushStructuralSnapshot();
      setElements((prev) =>
        prev.map((el) =>
          checkedIds.has(el.id) ? ({ ...el, ...updates } as OverlayElement) : el,
        ),
      );
    },
    [checkedIds, pushStructuralSnapshot],
  );

  const deleteCheckedElements = useCallback(() => {
    pushStructuralSnapshot();
    setElements((prev) => prev.filter((el) => !checkedIds.has(el.id)));
    setCheckedIds(new Set());
    setSelectedId(null);
    setSheetOpenState(false);
  }, [checkedIds, pushStructuralSnapshot]);

  return {
    elements,
    setElements,
    selectedId,
    checkedIds,
    selectedElement,
    addElement,
    deleteElement,
    updateElement,
    updateElementText,
    duplicateElement,
    setSelectedId,
    toggleCheck,
    clearChecked,
    setSheetOpen,
    moveLayer,
    undo,
    redo,
    canUndo,
    canRedo,
    pushStructuralSnapshot,
    pushTextSnapshot,
    alignElements,
    distributeElements,
    updateCheckedElements,
    deleteCheckedElements,
    loadElements,
  };
}
