import { useRef, useCallback, useState } from "react";
import type { OverlayElement } from "@/lib/overlayTemplates";

const MAX_HISTORY = 20;

/**
 * Undo/Redo hook with debounced text snapshots.
 *
 * - `pushSnapshot` records a state snapshot for structural changes (add, delete, move).
 * - `undo` / `redo` restore previous/next snapshots.
 * - Skip-ref prevents `setElements` from triggering an unwanted snapshot push.
 * - `canUndo` / `canRedo` are React state so they trigger re-renders correctly.
 */
export function useUndoRedo(
  elements: OverlayElement[],
  setElements: React.Dispatch<React.SetStateAction<OverlayElement[]>>,
) {
  const historyRef = useRef<OverlayElement[][]>([]);
  const futureRef = useRef<OverlayElement[][]>([]);
  const skipRef = useRef(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const pushSnapshot = useCallback((snapshot: OverlayElement[]) => {
    if (skipRef.current) { skipRef.current = false; return; }
    historyRef.current = [...historyRef.current.slice(-(MAX_HISTORY - 1)), snapshot];
    futureRef.current = [];
    setCanUndo(true);
    setCanRedo(false);
  }, []);

  const undo = useCallback(() => {
    if (historyRef.current.length === 0) return;
    const prev = historyRef.current[historyRef.current.length - 1];
    historyRef.current = historyRef.current.slice(0, -1);
    futureRef.current = [...futureRef.current, elements];
    skipRef.current = true;
    setElements(prev);
    setCanUndo(historyRef.current.length > 0);
    setCanRedo(true);
  }, [elements, setElements]);

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return;
    const next = futureRef.current[futureRef.current.length - 1];
    futureRef.current = futureRef.current.slice(0, -1);
    historyRef.current = [...historyRef.current, elements];
    skipRef.current = true;
    setElements(next);
    setCanUndo(true);
    setCanRedo(futureRef.current.length > 0);
  }, [elements, setElements]);

  return { pushSnapshot, undo, redo, canUndo, canRedo };
}
