import { useRef, useCallback, useState, useEffect } from "react";
import type { OverlayElement } from "@/components/create/overlay-editor/types";
import { HIT_TEST_THRESHOLD_DESKTOP, HIT_TEST_THRESHOLD_MOBILE } from "@/components/create/overlay-editor/constants";
import { hitTest } from "@/components/create/overlay-editor/helpers/hitTesting";
import { getElementSizePercent } from "@/components/create/overlay-editor/helpers/hitTesting";
import { getSnappedPos, clampToCanvas } from "@/components/create/overlay-editor/helpers/dragEngine";
import type { UseOverlayEditorReturn } from "@/hooks/useOverlayEditor";

export interface UseCanvasInteractionReturn {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  hoveredId: string | null;
  activeGuides: { x: number[]; y: number[] };
  showDragBadge: boolean;
  handleMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  handleMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  handleMouseUp: () => void;
  handleTouchStart: (e: React.TouchEvent<HTMLCanvasElement>) => void;
  handleTouchMove: (e: React.TouchEvent<HTMLCanvasElement>) => void;
  handleTouchEnd: () => void;
  handleMouseLeave: () => void;
  getElSize: (el: OverlayElement) => { w: number; h: number };
}

export function useCanvasInteraction(params: {
  editor: UseOverlayEditorReturn;
  isMobile: boolean;
  onSheetOpen: () => void;
  textInputRef: React.RefObject<HTMLInputElement | null>;
  open: boolean;
}): UseCanvasInteractionReturn {
  const { editor, isMobile, onSheetOpen, textInputRef, open } = params;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [activeGuides, setActiveGuides] = useState<{ x: number[]; y: number[] }>({
    x: [],
    y: [],
  });
  const [showDragBadge, setShowDragBadge] = useState(true);

  const draggingRef = useRef<string | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const dragPosRef = useRef<{ x: number; y: number } | null>(null);
  const rafRef = useRef<number | null>(null);
  const dragMovedRef = useRef(false);
  const dragElementRef = useRef<OverlayElement | null>(null);
  const lastTapRef = useRef<{ time: number; id: string | null }>({ time: 0, id: null });

  // Badge fade-out
  useEffect(() => {
    if (!open) return;
    setShowDragBadge(true);
    const t = setTimeout(() => setShowDragBadge(false), 3000);
    return () => clearTimeout(t);
  }, [open]);

  const getElSize = useCallback(
    (el: OverlayElement) => {
      const canvas = canvasRef.current;
      if (!canvas) return { w: 0, h: 0 };
      const ctx = canvas.getContext("2d");
      if (!ctx) return { w: 0, h: 0 };
      return getElementSizePercent(el, ctx, canvas.width, canvas.height);
    },
    [],
  );

  const getCanvasCoords = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      mx: (clientX - rect.left) * scaleX,
      my: (clientY - rect.top) * scaleY,
      canvas,
    };
  }, []);

  const doHitTest = useCallback(
    (mx: number, my: number, canvas: HTMLCanvasElement) => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      const threshold = isMobile ? HIT_TEST_THRESHOLD_MOBILE : HIT_TEST_THRESHOLD_DESKTOP;
      return hitTest(mx, my, editor.elements, ctx, canvas.width, canvas.height, threshold);
    },
    [editor.elements, isMobile],
  );

  // rAF drag loop
  const dragLoop = useCallback(() => {
    const pos = dragPosRef.current;
    const id = draggingRef.current;
    if (!pos || !id) return;

    const el = dragElementRef.current;
    let elW = 0;
    let elH = 0;
    if (el) {
      const size = getElSize(el);
      elW = size.w;
      elH = size.h;
    }

    const clamped = clampToCanvas(pos.x, pos.y, elW, elH);
    const snapped = getSnappedPos(clamped.x, clamped.y, elW, elH);
    setActiveGuides({ x: snapped.guidesX, y: snapped.guidesY });
    editor.setElements((prev) => {
      const updated = prev.map((e) =>
        e.id === id ? { ...e, x: snapped.x, y: snapped.y } : e,
      );
      const updatedEl = updated.find((e) => e.id === id);
      if (updatedEl) dragElementRef.current = updatedEl;
      return updated;
    });
    dragPosRef.current = null;
    rafRef.current = null;
  }, [getElSize, editor]);

  const scheduleRaf = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(dragLoop);
  }, [dragLoop]);

  const startDrag = useCallback(
    (clientX: number, clientY: number) => {
      const c = getCanvasCoords(clientX, clientY);
      if (!c) return false;
      const result = doHitTest(c.mx, c.my, c.canvas);
      if (result) {
        editor.setSelectedId(result.element.id);
        dragMovedRef.current = false;
        draggingRef.current = result.element.id;
        dragElementRef.current = result.element;
        dragOffsetRef.current = {
          x: c.mx - (result.element.x / 100) * c.canvas.width,
          y: c.my - (result.element.y / 100) * c.canvas.height,
        };
        editor.pushStructuralSnapshot();
        return true;
      } else {
        editor.setSelectedId(null);
        if (isMobile) editor.setSheetOpen(false);
        return false;
      }
    },
    [getCanvasCoords, doHitTest, editor, isMobile],
  );

  const moveDrag = useCallback(
    (clientX: number, clientY: number) => {
      if (!draggingRef.current) return;
      dragMovedRef.current = true;
      const c = getCanvasCoords(clientX, clientY);
      if (!c) return;
      dragPosRef.current = {
        x: ((c.mx - dragOffsetRef.current.x) / c.canvas.width) * 100,
        y: ((c.my - dragOffsetRef.current.y) / c.canvas.height) * 100,
      };
      scheduleRaf();
    },
    [getCanvasCoords, scheduleRaf],
  );

  const endDrag = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    const pos = dragPosRef.current;
    const id = draggingRef.current;

    if (pos && id) {
      const el = dragElementRef.current;
      let elW = 0;
      let elH = 0;
      if (el) {
        const size = getElSize(el);
        elW = size.w;
        elH = size.h;
      }
      const clamped = clampToCanvas(pos.x, pos.y, elW, elH);
      const snapped = getSnappedPos(clamped.x, clamped.y, elW, elH);
      editor.setElements((prev) =>
        prev.map((e) => (e.id === id ? { ...e, x: snapped.x, y: snapped.y } : e)),
      );
    }

    if (isMobile && !dragMovedRef.current && (id || draggingRef.current)) {
      onSheetOpen();
    }

    draggingRef.current = null;
    dragPosRef.current = null;
    dragElementRef.current = null;
    dragMovedRef.current = false;
    setActiveGuides({ x: [], y: [] });
  }, [getElSize, editor, isMobile, onSheetOpen]);

  // Mouse handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const now = Date.now();
      const c = getCanvasCoords(e.clientX, e.clientY);
      if (c) {
        const result = doHitTest(c.mx, c.my, c.canvas);
        if (
          result &&
          lastTapRef.current.id === result.element.id &&
          now - lastTapRef.current.time < 400
        ) {
          setTimeout(() => textInputRef.current?.focus(), 50);
          lastTapRef.current = { time: 0, id: null };
          return;
        }
        lastTapRef.current = { time: now, id: result?.element.id || null };
      }
      startDrag(e.clientX, e.clientY);
    },
    [getCanvasCoords, doHitTest, startDrag, textInputRef],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (draggingRef.current) {
        moveDrag(e.clientX, e.clientY);
      } else if (!isMobile) {
        const c = getCanvasCoords(e.clientX, e.clientY);
        if (c) {
          const result = doHitTest(c.mx, c.my, c.canvas);
          setHoveredId(result?.element.id || null);
        }
      }
    },
    [moveDrag, isMobile, getCanvasCoords, doHitTest],
  );

  const handleMouseUp = useCallback(() => endDrag(), [endDrag]);

  const handleMouseLeave = useCallback(() => {
    endDrag();
    setHoveredId(null);
  }, [endDrag]);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      const t = e.touches[0];
      if (!t) return;
      const now = Date.now();
      const c = getCanvasCoords(t.clientX, t.clientY);
      if (c) {
        const result = doHitTest(c.mx, c.my, c.canvas);
        if (
          result &&
          lastTapRef.current.id === result.element.id &&
          now - lastTapRef.current.time < 400
        ) {
          setTimeout(() => textInputRef.current?.focus(), 50);
          lastTapRef.current = { time: 0, id: null };
          e.preventDefault();
          return;
        }
        lastTapRef.current = { time: now, id: result?.element.id || null };
      }
      const didHit = startDrag(t.clientX, t.clientY);
      if (didHit) e.preventDefault();
    },
    [getCanvasCoords, doHitTest, startDrag, textInputRef],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      if (!draggingRef.current) return;
      e.preventDefault();
      const t = e.touches[0];
      if (!t) return;
      moveDrag(t.clientX, t.clientY);
    },
    [moveDrag],
  );

  const handleTouchEnd = useCallback(() => endDrag(), [endDrag]);

  return {
    canvasRef,
    containerRef,
    hoveredId,
    activeGuides,
    showDragBadge,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleMouseLeave,
    getElSize,
  };
}
