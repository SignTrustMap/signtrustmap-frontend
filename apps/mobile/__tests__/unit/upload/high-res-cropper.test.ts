import { Platform } from 'react-native';
import {
  normalizeBoundingBox,
  cropHighResSignPatch,
  batchCropCandidateSigns,
  cropWebVideoFrame,
  type SignCandidateBox,
} from '@/feature/upload/utils/high-res-cropper';
import { handleBackgroundSilentPush } from '@/feature/upload/utils/crop-sync-manager';

describe('high-res-cropper utility', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe('normalizeBoundingBox', () => {
    it('normalizes relative coordinates (0..1) to 4K resolution (3840x2160)', () => {
      const box = [0.1, 0.2, 0.3, 0.4];
      const norm = normalizeBoundingBox(box, 3840, 2160);

      expect(norm.x).toBe(384);
      expect(norm.y).toBe(432);
      expect(norm.width).toBe(768);
      expect(norm.height).toBe(432);
    });

    it('handles absolute pixel coordinates correctly', () => {
      const box = [100, 200, 500, 600];
      const norm = normalizeBoundingBox(box, 3840, 2160);

      expect(norm.x).toBe(100);
      expect(norm.y).toBe(200);
      expect(norm.width).toBe(400);
      expect(norm.height).toBe(400);
    });

    it('handles inverted coordinates where x1 > x2 or y1 > y2 and bounds clamping', () => {
      const box = [500, 600, 100, 200];
      const norm = normalizeBoundingBox(box, 1000, 1000);

      expect(norm.x).toBe(100);
      expect(norm.y).toBe(200);
      expect(norm.width).toBe(400);
      expect(norm.height).toBe(400);
    });

    it('handles undefined or invalid box gracefully', () => {
      const norm = normalizeBoundingBox(undefined, 1920, 1080);
      expect(norm).toEqual({ x: 0, y: 0, width: 1920, height: 1080 });

      const normEmpty = normalizeBoundingBox([1, 2], 1920, 1080);
      expect(normEmpty).toEqual({ x: 0, y: 0, width: 1920, height: 1080 });
    });
  });

  describe('cropHighResSignPatch', () => {
    it('falls back to low-res server candidate image if original 4K video is not accessible', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const candidate: SignCandidateBox = {
        id: 'sign-cand-01',
        timestamp_seconds: 12.5,
        box_xyxy: [0.2, 0.3, 0.5, 0.6],
        best_frame_url: 'https://s3.signmap.site/stm-sign-crops/frames/best-01.jpg',
        sign_crop_url: 'https://s3.signmap.site/stm-sign-crops/crops/sign-01.jpg',
      };

      const result = await cropHighResSignPatch(candidate, 'file:///invalid/nonexistent/video.mp4');

      expect(result.candidateId).toBe('sign-cand-01');
      expect(result.success).toBe(true);
      expect(result.isLowResFallback).toBe(true);
      expect(result.cropUri).toBe('https://s3.signmap.site/stm-sign-crops/frames/best-01.jpg');
    });

    it('returns high-res crop descriptor when video file is accessible on native', async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: true, type: 'basic' } as any);

      const candidate: SignCandidateBox = {
        id: 'sign-cand-02',
        timestamp_seconds: 5.0,
        box_xyxy: [100, 100, 300, 300],
        best_frame_url: 'https://s3.signmap.site/frames/best-02.jpg',
      };

      const result = await cropHighResSignPatch(candidate, 'file:///storage/video.mp4');

      expect(result.candidateId).toBe('sign-cand-02');
      expect(result.success).toBe(true);
      expect(result.isLowResFallback).toBe(false);
      expect(result.cropUri).toBe('https://s3.signmap.site/frames/best-02.jpg');
    });

    it('handles unexpected errors gracefully and returns success: false', async () => {
      // Pass a non-string or throw inside fetch
      global.fetch = jest.fn().mockImplementation(() => {
        throw new Error('Fatal error');
      });

      const candidate: SignCandidateBox = {
        id: 'sign-cand-err',
      };

      const result = await cropHighResSignPatch(candidate, 'invalid-uri');
      expect(result.candidateId).toBe('sign-cand-err');
      expect(result.success).toBe(false);
      expect(result.isLowResFallback).toBe(true);
    });
  });

  describe('cropWebVideoFrame & Web Platform Cropping', () => {
    it('returns original videoUri if document is undefined', async () => {
      const originalDoc = (global as any).document;
      delete (global as any).document;

      try {
        const res = await cropWebVideoFrame('https://example.com/video.mp4', 5, { x: 0, y: 0, width: 100, height: 100 });
        expect(res).toBe('https://example.com/video.mp4');
      } finally {
        (global as any).document = originalDoc;
      }
    });

    it('crops frame via HTML5 video and canvas when document is present', async () => {
      let createdVideo: any = null;
      const mockCtx = {
        drawImage: jest.fn(),
      };
      const mockCanvas = {
        width: 0,
        height: 0,
        getContext: jest.fn().mockReturnValue(mockCtx),
        toDataURL: jest.fn().mockReturnValue('data:image/jpeg;base64,mockcroppeddata'),
      };

      const originalDoc = (global as any).document;
      (global as any).document = {
        createElement: (tag: string) => {
          if (tag === 'video') {
            createdVideo = {
              videoWidth: 1920,
              videoHeight: 1080,
              duration: 30,
              set src(val: string) {
                if (!val) return;
                queueMicrotask(() => {
                  createdVideo.onloadedmetadata?.();
                  queueMicrotask(() => {
                    createdVideo.onseeked?.();
                  });
                });
              },
            };
            return createdVideo;
          }
          if (tag === 'canvas') {
            return mockCanvas;
          }
          return {};
        },
      };

      try {
        const cropPromise = cropWebVideoFrame('https://example.com/video.mp4', 10, {
          x: 50,
          y: 50,
          width: 200,
          height: 200,
        });

        const result = await cropPromise;
        expect(result).toBe('data:image/jpeg;base64,mockcroppeddata');
        expect(mockCtx.drawImage).toHaveBeenCalled();
      } finally {
        (global as any).document = originalDoc;
      }
    });

    it('rejects with error when video element fails to load', async () => {
      const originalDoc = (global as any).document;
      (global as any).document = {
        createElement: (tag: string) => {
          if (tag === 'video') {
            const v: any = {
              set src(val: string) {
                if (!val) return;
                queueMicrotask(() => {
                  v.onerror?.();
                });
              },
            };
            return v;
          }
          return {};
        },
      };

      try {
        await expect(
          cropWebVideoFrame('https://example.com/bad-video.mp4', 5, { x: 0, y: 0, width: 10, height: 10 })
        ).rejects.toThrow();
      } finally {
        (global as any).document = originalDoc;
      }
    });

    it('handles Web platform in cropHighResSignPatch', async () => {
      const originalPlatform = Platform.OS;
      Platform.OS = 'web';
      global.fetch = jest.fn().mockResolvedValue({ ok: true } as any);

      const originalDoc = (global as any).document;
      (global as any).document = {
        createElement: (tag: string) => {
          if (tag === 'video') {
            const v: any = {
              videoWidth: 1920,
              videoHeight: 1080,
              duration: 30,
              set src(val: string) {
                if (!val) return;
                queueMicrotask(() => {
                  v.onloadedmetadata?.();
                  v.onseeked?.();
                });
              },
            };
            return v;
          }
          if (tag === 'canvas') {
            return {
              getContext: () => ({ drawImage: jest.fn() }),
              toDataURL: () => 'data:image/jpeg;base64,webpatch',
            };
          }
          return {};
        },
      };

      try {
        const candidate: SignCandidateBox = {
          id: 'web-cand-1',
          timestamp_seconds: 2,
          box_xyxy: [0.1, 0.1, 0.3, 0.3],
        };

        const result = await cropHighResSignPatch(candidate, 'https://example.com/webvideo.mp4');
        expect(result.candidateId).toBe('web-cand-1');
        expect(result.success).toBe(true);
        expect(result.cropUri).toBe('data:image/jpeg;base64,webpatch');
      } finally {
        Platform.OS = originalPlatform;
        (global as any).document = originalDoc;
      }
    });
  });

  describe('batchCropCandidateSigns', () => {
    it('processes multiple candidates in batch', async () => {
      const candidates: SignCandidateBox[] = [
        {
          id: 'sign-1',
          timestamp_seconds: 5,
          best_frame_url: 'https://s3.signmap.site/stm-sign-crops/frame1.jpg',
        },
        {
          id: 'sign-2',
          timestamp_seconds: 15,
          best_frame_url: 'https://s3.signmap.site/stm-sign-crops/frame2.jpg',
        },
      ];

      const results = await batchCropCandidateSigns(candidates, 'file:///nonexistent.mp4');
      expect(results).toHaveLength(2);
      expect(results[0].candidateId).toBe('sign-1');
      expect(results[1].candidateId).toBe('sign-2');
    });
  });

  describe('handleBackgroundSilentPush', () => {
    it('safely handles silent push when no pending zero-copy draft exists', async () => {
      const result = await handleBackgroundSilentPush({
        submissionId: 'sub-unknown-999',
        candidates: [],
      });

      expect(result.success).toBe(true);
      expect(result.processedCount).toBe(0);
    });
  });
});
