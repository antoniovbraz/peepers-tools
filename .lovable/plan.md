

## Fix: Modal content clipping and save button visibility

### Problem
1. **Mobile**: The save button at the bottom may be hidden behind system UI or not visible due to layout issues.
2. **Desktop**: The `DialogContent` with `max-h-[95vh] overflow-hidden` clips content. The `ScrollArea` uses `max-h-[calc(95vh-120px)]` which may not account for the full header + padding, causing the export button at the bottom of the scroll area to be cut off.

### Root Cause
- **Desktop**: `overflow-hidden` on `DialogContent` + insufficient height calculation in `ScrollArea`. The `120px` offset doesn't account for DialogHeader + padding + gap accurately.
- **Mobile**: `pb-24` on the scrollable area is meant to prevent overlap with the fixed bottom bar, but the bottom bar itself (`shrink-0 px-3 py-2 border-t`) may be pushed off-screen if the layout doesn't constrain properly.

### Solution

**File: `src/components/create/ImageOverlayEditor.tsx`**

**Desktop (line ~1777):**
- Change `DialogContent` to use flex column layout with `overflow-hidden` and proper height constraints
- Replace `ScrollArea max-h-[calc(95vh-120px)]` with flex-based overflow that naturally fills remaining space
- Make the grid use `min-h-0` and `overflow-hidden` so the scroll area can shrink properly

```
DialogContent: "max-w-5xl max-h-[90vh] flex flex-col overflow-hidden p-6"
Grid: "grid grid-cols-[1fr_360px] gap-4 flex-1 min-h-0 overflow-hidden"
ScrollArea: "h-full" (instead of calc-based max-h)
Right column: "min-h-0 flex flex-col overflow-hidden"
```

**Mobile (lines ~1716-1770):**
- Ensure the fixed bottom export button uses safe area insets: `pb-[env(safe-area-inset-bottom)]`
- Reduce `pb-24` to `pb-4` on scroll area since the bottom bar is already a separate `shrink-0` element outside the scroll

### Changes
Single file edit: `src/components/create/ImageOverlayEditor.tsx`, lines 1775-1802 (desktop) and 1735, 1756 (mobile).

