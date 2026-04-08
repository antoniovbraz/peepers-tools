import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import type { OverlayElement } from "@/lib/overlayTemplates";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeEl(id: string): OverlayElement {
  return { id, type: "headline", text: `Element ${id}`, x: 10, y: 10 };
}

const A = [makeEl("a")];
const B = [makeEl("b")];
const C = [makeEl("c")];

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("useUndoRedo", () => {
  it("starts with empty history (canUndo=false, canRedo=false)", () => {
    const setElements = vi.fn();
    const { result } = renderHook(() => useUndoRedo(A, setElements));
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it("canUndo becomes true after pushSnapshot", () => {
    const setElements = vi.fn();
    const { result } = renderHook(() => useUndoRedo(A, setElements));
    act(() => { result.current.pushSnapshot(A); });
    expect(result.current.canUndo).toBe(true);
  });

  it("undo restores previous snapshot via setElements", () => {
    const setElements = vi.fn();
    const { result } = renderHook(() => useUndoRedo(B, setElements));
    act(() => { result.current.pushSnapshot(A); });
    act(() => { result.current.undo(); });
    expect(setElements).toHaveBeenCalledWith(A);
  });

  it("canRedo becomes true after undo", () => {
    const setElements = vi.fn();
    const { result } = renderHook(() => useUndoRedo(B, setElements));
    act(() => { result.current.pushSnapshot(A); });
    act(() => { result.current.undo(); });
    expect(result.current.canRedo).toBe(true);
  });

  it("redo restores undone snapshot via setElements", () => {
    const setElements = vi.fn();
    const { result } = renderHook(() => useUndoRedo(B, setElements));
    act(() => { result.current.pushSnapshot(A); });
    act(() => { result.current.undo(); });
    act(() => { result.current.redo(); });
    // redo should restore the current elements (B) that were captured during undo
    expect(setElements).toHaveBeenLastCalledWith(B);
  });

  it("canRedo becomes false after new pushSnapshot (clears future)", () => {
    const setElements = vi.fn();
    const { result } = renderHook(() => useUndoRedo(B, setElements));
    act(() => { result.current.pushSnapshot(A); });
    act(() => { result.current.undo(); });
    // After undo, skipRef=true. The component re-renders and calls pushSnapshot
    // once (consumed by the skip). Only a subsequent real action clears canRedo.
    act(() => { result.current.pushSnapshot(B); }); // consumed by skipRef
    act(() => { result.current.pushSnapshot(C); }); // real new action → clears redo
    expect(result.current.canRedo).toBe(false);
  });

  it("undo does nothing when history is empty", () => {
    const setElements = vi.fn();
    const { result } = renderHook(() => useUndoRedo(A, setElements));
    act(() => { result.current.undo(); });
    expect(setElements).not.toHaveBeenCalled();
  });

  it("redo does nothing when future is empty", () => {
    const setElements = vi.fn();
    const { result } = renderHook(() => useUndoRedo(A, setElements));
    act(() => { result.current.redo(); });
    expect(setElements).not.toHaveBeenCalled();
  });

  it("supports multiple undo steps", () => {
    const setElements = vi.fn();
    const { result } = renderHook(() => useUndoRedo(C, setElements));
    act(() => { result.current.pushSnapshot(A); });
    act(() => { result.current.pushSnapshot(B); });
    // First undo: restore B (snapshot), elements = B brought in from history
    act(() => { result.current.undo(); });
    expect(setElements).toHaveBeenLastCalledWith(B);
    // Second undo: restore A
    act(() => { result.current.undo(); });
    expect(setElements).toHaveBeenLastCalledWith(A);
  });

  it("caps history at MAX_HISTORY (20) entries", () => {
    const setElements = vi.fn();
    const { result } = renderHook(() => useUndoRedo(A, setElements));
    // Push 25 snapshots
    for (let i = 0; i < 25; i++) {
      act(() => { result.current.pushSnapshot([makeEl(String(i))]); });
    }
    // After 25 pushes at MAX_HISTORY=20, undo should work exactly 20 times
    let undoCount = 0;
    while (result.current.canUndo) {
      act(() => { result.current.undo(); });
      undoCount++;
      if (undoCount > 25) break; // safety guard
    }
    expect(undoCount).toBe(20);
  });

  it("skipRef prevents snapshot after undo (avoids duplicate history entry)", () => {
    const setElements = vi.fn();
    const { result } = renderHook(() => useUndoRedo(B, setElements));
    act(() => { result.current.pushSnapshot(A); });
    // Simulate what the component does: after undo => setElements fires => component
    // calls pushSnapshot again.  The first call after undo should be skipped.
    act(() => { result.current.undo(); });
    const callsBefore = setElements.mock.calls.length;
    act(() => { result.current.pushSnapshot(B); }); // this should be skipped
    // Pushing one more real snapshot should work
    act(() => { result.current.pushSnapshot(C); });
    expect(result.current.canUndo).toBe(true);
    // setElements count should not have grown from the skipped push
    expect(setElements.mock.calls.length).toBe(callsBefore);
  });
});
