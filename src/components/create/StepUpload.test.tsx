import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StepUpload from "./StepUpload";

// --- mocks ---
const mockUpdatePhotos = vi.fn();
const mockCompleteStep = vi.fn();
const mockGoNext = vi.fn();

vi.mock("@/context/CreateListingContext", () => ({
  useCreateListing: () => ({
    data: { photos: [], photoUrls: [] },
    updatePhotos: mockUpdatePhotos,
    completeStep: mockCompleteStep,
    goNext: mockGoNext,
  }),
}));

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ user: { id: "user-123" } }),
}));

vi.mock("@/hooks/use-toast", () => ({ toast: vi.fn() }));
vi.mock("@/hooks/useErrorHandler", () => ({ useErrorHandler: () => vi.fn() }));

// compressImage returns the file unchanged in tests
vi.mock("@/lib/compressImage", () => ({
  compressImage: (f: File) => Promise.resolve(f),
}));

// Supabase storage mock
const mockUpload = vi.fn().mockResolvedValue({ error: null });
const mockGetPublicUrl = vi.fn().mockReturnValue({ data: { publicUrl: "https://cdn.example.com/photo.jpg" } });

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    storage: {
      from: () => ({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
        remove: vi.fn().mockResolvedValue({}),
      }),
    },
  },
}));

import { toast } from "@/hooks/use-toast";
const mockToast = vi.mocked(toast);

function makeFile(name = "photo.jpg", size = 1024): File {
  return new File(["a".repeat(size)], name, { type: "image/jpeg" });
}

describe("StepUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: no share API (desktop)
    Object.defineProperty(navigator, "maxTouchPoints", { value: 0, configurable: true });
    Object.defineProperty(navigator, "share", { value: undefined, configurable: true });
  });

  it("renders upload area", () => {
    render(<StepUpload />);
    expect(screen.getAllByText(/arrastar|adicionar|foto/i).length).toBeGreaterThan(0);
  });

  it("uploads a file and calls updatePhotos", async () => {
    render(<StepUpload />);
    const input = document.querySelector<HTMLInputElement>("input[type=file]");
    expect(input).toBeTruthy();

    const file = makeFile();
    await userEvent.upload(input!, file);

    await waitFor(() => {
      expect(mockUpload).toHaveBeenCalled();
      expect(mockUpdatePhotos).toHaveBeenCalledWith(
        expect.arrayContaining([file]),
        expect.arrayContaining(["https://cdn.example.com/photo.jpg"]),
      );
    });
  });

  it("shows error toast when file exceeds 10MB limit", async () => {
    render(<StepUpload />);
    const input = document.querySelector<HTMLInputElement>("input[type=file]");
    const bigFile = makeFile("big.jpg", 11 * 1024 * 1024);
    await userEvent.upload(input!, bigFile);
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: "destructive" }),
      );
    });
  });

  it("offers gallery save toast on mobile with share API support", async () => {
    // Mock mobile device with share API
    Object.defineProperty(navigator, "maxTouchPoints", { value: 2, configurable: true });
    const mockShare = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", { value: mockShare, configurable: true });
    Object.defineProperty(navigator, "canShare", {
      value: () => true,
      configurable: true,
    });

    render(<StepUpload />);
    const input = document.querySelector<HTMLInputElement>("input[type=file]");
    await userEvent.upload(input!, makeFile());

    await waitFor(() => {
      // Toast should have been called with a description about saving to gallery
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ description: expect.stringMatching(/galeria/i) }),
      );
    });
  });

  it("does NOT offer gallery save on desktop", async () => {
    // navigator.maxTouchPoints is 0 (default) and no share API
    render(<StepUpload />);
    const input = document.querySelector<HTMLInputElement>("input[type=file]");
    await userEvent.upload(input!, makeFile());

    await waitFor(() => {
      // Upload succeeds — any toast shown should NOT mention galeria
      const galeriaCalls = mockToast.mock.calls.filter(([[arg]]) =>
        typeof arg?.description === "string" && /galeria/i.test(arg.description),
      );
      expect(galeriaCalls).toHaveLength(0);
    });
  });
});
