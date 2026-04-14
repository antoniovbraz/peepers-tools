import { describe, it, expect, vi, beforeEach } from "vitest";
import { compressImage } from "./compressImage";

// Mock OffscreenCanvas
const mockConvertToBlob = vi.fn();
const mockDrawImage = vi.fn();
const mockClose = vi.fn();

beforeEach(() => {
  vi.restoreAllMocks();

  // Mock createImageBitmap
  vi.stubGlobal("createImageBitmap", vi.fn().mockResolvedValue({
    width: 3000,
    height: 2000,
    close: mockClose,
  }));

  // Mock OffscreenCanvas
  vi.stubGlobal("OffscreenCanvas", vi.fn().mockImplementation(() => ({
    getContext: () => ({ drawImage: mockDrawImage }),
    convertToBlob: mockConvertToBlob,
  })));
});

function makeFile(name: string, size: number, type = "image/jpeg"): File {
  const buf = new ArrayBuffer(size);
  return new File([buf], name, { type });
}

describe("compressImage", () => {
  it("returns original if not an image", async () => {
    const file = makeFile("doc.pdf", 1000, "application/pdf");
    const result = await compressImage(file);
    expect(result).toBe(file);
  });

  it("returns original if small and within dimensions", async () => {
    vi.mocked(createImageBitmap).mockResolvedValueOnce({
      width: 800,
      height: 600,
      close: mockClose,
    } as unknown as ImageBitmap);

    const file = makeFile("small.jpg", 100_000); // 100KB < 500KB
    const result = await compressImage(file);
    expect(result).toBe(file);
    expect(mockClose).toHaveBeenCalled();
  });

  it("compresses large images and returns smaller file", async () => {
    const originalSize = 2_000_000; // 2MB
    const compressedBlob = new Blob([new ArrayBuffer(500_000)], { type: "image/jpeg" });
    mockConvertToBlob.mockResolvedValueOnce(compressedBlob);

    const file = makeFile("big.jpg", originalSize);
    const result = await compressImage(file);

    expect(result).not.toBe(file);
    expect(result.size).toBeLessThan(originalSize);
    expect(result.type).toBe("image/jpeg");
    expect(result.name).toBe("big.jpg");
  });

  it("returns original if compression produces larger file", async () => {
    const originalSize = 100_000;
    // Image is 3000x2000 (needs resize) but compressed is bigger
    const compressedBlob = new Blob([new ArrayBuffer(originalSize + 1000)], { type: "image/jpeg" });
    mockConvertToBlob.mockResolvedValueOnce(compressedBlob);

    const file = makeFile("photo.jpg", originalSize);
    const result = await compressImage(file);
    expect(result).toBe(file);
  });

  it("scales down to MAX_DIMENSION on longest side", async () => {
    const compressedBlob = new Blob([new ArrayBuffer(100)], { type: "image/jpeg" });
    mockConvertToBlob.mockResolvedValueOnce(compressedBlob);

    const file = makeFile("huge.jpg", 5_000_000);
    await compressImage(file);

    // 3000x2000 → scale = 1920/3000 = 0.64 → 1920x1280
    const [OffscreenCanvasMock] = vi.mocked(OffscreenCanvas).mock.calls[0];
    expect(OffscreenCanvasMock).toBe(1920);
  });
});
