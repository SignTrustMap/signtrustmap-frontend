import {
  normalizeBoundingBox,
  cropHighResSignPatch,
  batchCropCandidateSigns,
  type SignCandidateBox,
} from '../high-res-cropper';
import { handleBackgroundSilentPush } from '../crop-sync-manager';

describe('high-res-cropper utility', () => {
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

    it('handles undefined or invalid box gracefully', () => {
      const norm = normalizeBoundingBox(undefined, 1920, 1080);
      expect(norm).toEqual({ x: 0, y: 0, width: 1920, height: 1080 });
    });
  });

  describe('cropHighResSignPatch', () => {
    it('falls back to low-res server candidate image if original 4K video is not accessible', async () => {
      const candidate: SignCandidateBox = {
        id: 'sign-cand-01',
        timestamp_seconds: 12.5,
        box_xyxy: [0.2, 0.3, 0.5, 0.6],
        best_frame_url: 'https://cdn.signmap.site/frames/best-01.jpg',
        sign_crop_url: 'https://cdn.signmap.site/crops/sign-01.jpg',
      };

      const result = await cropHighResSignPatch(candidate, 'file:///invalid/nonexistent/video.mp4');

      expect(result.candidateId).toBe('sign-cand-01');
      expect(result.success).toBe(true);
      expect(result.isLowResFallback).toBe(true);
      expect(result.cropUri).toBe('https://cdn.signmap.site/frames/best-01.jpg');
    });
  });

  describe('batchCropCandidateSigns', () => {
    it('processes multiple candidates in batch', async () => {
      const candidates: SignCandidateBox[] = [
        {
          id: 'sign-1',
          timestamp_seconds: 5,
          best_frame_url: 'https://cdn.signmap.site/frame1.jpg',
        },
        {
          id: 'sign-2',
          timestamp_seconds: 15,
          best_frame_url: 'https://cdn.signmap.site/frame2.jpg',
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
