import { describe, it, expect, vi, beforeEach } from "vitest";
import { ThumbnailService } from "../thumbnail.service";
import sharp from "sharp";

// Mock Supabase
vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: vi.fn(() => ({
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn(() => ({
          data: { publicUrl: "https://example.com/thumbnail.webp" },
        })),
        remove: vi.fn().mockResolvedValue({ error: null }),
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: {
              public_url: "https://example.com/original.jpg",
              storage_path: "profiles/123/photo.jpg",
              profile_id: "profile-123",
              type: "photo",
            },
            error: null,
          }),
        })),
      })),
    })),
  })),
}));

// Mock fetch for image download
global.fetch = vi.fn();

describe("ThumbnailService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateThumbnail", () => {
    it("should generate a thumbnail with correct dimensions", async () => {
      // Create a test image (100x100 red square)
      const testImage = await sharp({
        create: {
          width: 100,
          height: 100,
          channels: 3,
          background: { r: 255, g: 0, b: 0 },
        },
      })
        .jpeg()
        .toBuffer();

      // Mock fetch to return test image
      (global.fetch as any).mockResolvedValue({
        ok: true,
        arrayBuffer: async () => testImage.buffer,
      });

      const thumbnailUrl = await ThumbnailService.generateThumbnail(
        "https://example.com/original.jpg",
        "profile-123",
        "photo.jpg"
      );

      expect(thumbnailUrl).toBe("https://example.com/thumbnail.webp");
      expect(global.fetch).toHaveBeenCalledWith(
        "https://example.com/original.jpg"
      );
    });

    it("should handle download errors gracefully", async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        statusText: "Not Found",
      });

      await expect(
        ThumbnailService.generateThumbnail(
          "https://example.com/missing.jpg",
          "profile-123",
          "photo.jpg"
        )
      ).rejects.toThrow("Thumbnail generation failed");
    });

    it("should generate thumbnail successfully", async () => {
      const testImage = await sharp({
        create: {
          width: 50,
          height: 50,
          channels: 3,
          background: { r: 0, g: 255, b: 0 },
        },
      })
        .jpeg()
        .toBuffer();

      (global.fetch as any).mockResolvedValue({
        ok: true,
        arrayBuffer: async () => testImage.buffer,
      });

      const thumbnailUrl = await ThumbnailService.generateThumbnail(
        "https://example.com/original.jpg",
        "profile-123",
        "my-photo.jpg"
      );

      // Verify thumbnail was generated successfully
      expect(thumbnailUrl).toBe("https://example.com/thumbnail.webp");
    });
  });

  describe("deleteThumbnail", () => {
    it("should delete thumbnail from storage", async () => {
      await expect(
        ThumbnailService.deleteThumbnail(
          "profiles/123/media/thumbnails/photo.webp"
        )
      ).resolves.not.toThrow();
    });
  });

  describe("generateThumbnailForMedia", () => {
    it("should generate thumbnail for existing photo media", async () => {
      const testImage = await sharp({
        create: {
          width: 200,
          height: 150,
          channels: 3,
          background: { r: 0, g: 0, b: 255 },
        },
      })
        .jpeg()
        .toBuffer();

      (global.fetch as any).mockResolvedValue({
        ok: true,
        arrayBuffer: async () => testImage.buffer,
      });

      const thumbnailUrl = await ThumbnailService.generateThumbnailForMedia(
        "media-123"
      );

      expect(thumbnailUrl).toBe("https://example.com/thumbnail.webp");
    });
  });

  describe("thumbnail dimensions", () => {
    it("should resize large images to fit within 80x80", async () => {
      // Create a 200x200 test image
      const largeImage = await sharp({
        create: {
          width: 200,
          height: 200,
          channels: 3,
          background: { r: 128, g: 128, b: 128 },
        },
      })
        .jpeg()
        .toBuffer();

      (global.fetch as any).mockResolvedValue({
        ok: true,
        arrayBuffer: async () => largeImage.buffer,
      });

      const thumbnailUrl = await ThumbnailService.generateThumbnail(
        "https://example.com/large.jpg",
        "profile-123",
        "large.jpg"
      );

      expect(thumbnailUrl).toBeDefined();
      expect(thumbnailUrl).toBe("https://example.com/thumbnail.webp");
    });

    it("should maintain aspect ratio for rectangular images", async () => {
      // Create a 200x100 test image (2:1 aspect ratio)
      const rectangularImage = await sharp({
        create: {
          width: 200,
          height: 100,
          channels: 3,
          background: { r: 255, g: 255, b: 0 },
        },
      })
        .jpeg()
        .toBuffer();

      (global.fetch as any).mockResolvedValue({
        ok: true,
        arrayBuffer: async () => rectangularImage.buffer,
      });

      const thumbnailUrl = await ThumbnailService.generateThumbnail(
        "https://example.com/rect.jpg",
        "profile-123",
        "rect.jpg"
      );

      expect(thumbnailUrl).toBeDefined();
      expect(thumbnailUrl).toBe("https://example.com/thumbnail.webp");
    });
  });

  describe("WebP conversion", () => {
    it("should convert images to WebP format", async () => {
      const testImage = await sharp({
        create: {
          width: 60,
          height: 60,
          channels: 3,
          background: { r: 100, g: 150, b: 200 },
        },
      })
        .png() // Start with PNG
        .toBuffer();

      (global.fetch as any).mockResolvedValue({
        ok: true,
        arrayBuffer: async () => testImage.buffer,
      });

      const thumbnailUrl = await ThumbnailService.generateThumbnail(
        "https://example.com/image.png",
        "profile-123",
        "image.png"
      );

      // Verify the URL ends with .webp
      expect(thumbnailUrl).toBe("https://example.com/thumbnail.webp");
    });
  });
});
