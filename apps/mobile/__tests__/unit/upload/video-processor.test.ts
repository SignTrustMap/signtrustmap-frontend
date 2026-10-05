import {
  calculateTemporalChunks,
  sliceVideoChunk,
  prepareVideoChunk,
  MAX_BACKEND_CHUNK_BYTES,
} from '@/feature/upload/utils/video-processor';

describe('video-processor utility', () => {
  describe('calculateTemporalChunks', () => {
    it('calculates 1 temporal chunk for a 1-minute video', () => {
      const plan = calculateTemporalChunks(10 * 1024 * 1024, 60);
      expect(plan.totalChunks).toBe(1);
      expect(plan.durationSeconds).toBe(60);
      expect(plan.chunkSize).toBe(10 * 1024 * 1024);
    });

    it('calculates 3 temporal chunks for a 3-minute video', () => {
      const plan = calculateTemporalChunks(30 * 1024 * 1024, 180);
      expect(plan.totalChunks).toBe(3);
      expect(plan.durationSeconds).toBe(180);
      expect(plan.chunkSize).toBe(10 * 1024 * 1024);
    });

    it('handles up to 8 hours of video without exceeding backend limits', () => {
      // 8 hours = 28800 seconds -> 480 1-minute chunks
      const plan = calculateTemporalChunks(500 * 1024 * 1024, 28800);
      expect(plan.totalChunks).toBe(480);
      expect(plan.chunkSize).toBeLessThanOrEqual(MAX_BACKEND_CHUNK_BYTES);
    });

    it('enforces backend maximum chunk size (45MB safety threshold under 52428800 bytes limit)', () => {
      // Very high bitrate video: 100MB for 1 minute
      const plan = calculateTemporalChunks(100 * 1024 * 1024, 60);
      expect(plan.chunkSize).toBeLessThanOrEqual(MAX_BACKEND_CHUNK_BYTES);
      expect(plan.totalChunks).toBeGreaterThanOrEqual(3);
      // Ensure backend rule is strictly satisfied: totalSizeBytes <= totalChunks * 52428800
      expect(100 * 1024 * 1024).toBeLessThanOrEqual(plan.totalChunks * 52428800);
    });
  });

  describe('sliceVideoChunk', () => {
    it('slices an on-demand chunk with correct byte boundaries and naming', () => {
      const totalSize = 3000;
      const plan = {
        totalChunks: 3,
        chunkSize: 1000,
        totalSizeBytes: totalSize,
        durationSeconds: 180,
      };

      const mockBlob = {
        slice: jest.fn().mockImplementation((start, end, type) => ({
          size: end - start,
          type,
        })),
      };

      const chunk0 = sliceVideoChunk(mockBlob, 0, plan, 'survey.mp4');
      expect(mockBlob.slice).toHaveBeenCalledWith(0, 1000, 'video/mp4');
      expect(chunk0.chunkIndex).toBe(0);
      expect(chunk0.fileName).toBe('survey.mp4.part_0');

      const chunk2 = sliceVideoChunk(mockBlob, 2, plan, 'survey.mp4');
      expect(mockBlob.slice).toHaveBeenCalledWith(2000, 3000, 'video/mp4');
      expect(chunk2.chunkIndex).toBe(2);
      expect(chunk2.fileName).toBe('survey.mp4.part_2');
    });
  });

  describe('prepareVideoChunk', () => {
    it('returns direct file reference when totalChunks is 1 without extra disk/RAM overhead', async () => {
      const plan = {
        totalChunks: 1,
        chunkSize: 10000,
        totalSizeBytes: 10000,
        durationSeconds: 10,
      };

      const prepared = await prepareVideoChunk({
        videoUri: 'file:///data/user/0/com.anonymous.mobile/cache/video.mp4',
        chunkIndex: 0,
        plan,
        fileName: 'video.mp4',
        sessionId: 'test-session',
      });

      expect(prepared.request.chunkIndex).toBe(0);
      expect(prepared.request.fileName).toBe('video.mp4');
      expect('uri' in prepared.request.file).toBe(true);
      if ('uri' in prepared.request.file) {
        expect(prepared.request.file.uri).toBe('file:///data/user/0/com.anonymous.mobile/cache/video.mp4');
      }
    });
  });
});
