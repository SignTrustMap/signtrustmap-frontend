import {
  resolveS3Url,
  resolveCdnUrl,
  selectReviewQueue,
  selectReviewHistory,
} from '@/api/reviews/review-workflow';

describe('Review Workflow API & Transformation Module', () => {
  describe('resolveS3Url & resolveCdnUrl', () => {
    it('returns empty string for null or undefined url', () => {
      expect(resolveS3Url(null)).toBe('');
      expect(resolveS3Url(undefined)).toBe('');
      expect(resolveCdnUrl('')).toBe('');
    });

    it('returns local device uris (file://, content://) unchanged', () => {
      expect(resolveS3Url('file:///data/user/0/cache/photo.jpg')).toBe('file:///data/user/0/cache/photo.jpg');
      expect(resolveS3Url('content://media/external/images/media/42')).toBe('content://media/external/images/media/42');
    });

    it('transforms CDN URLs to storage URLs with proper bucket prefix', () => {
      const cdnUrlWithBucket = 'https://cdn.signmap.site/stm-sign-crops/crop_123.jpg';
      expect(resolveS3Url(cdnUrlWithBucket)).toBe('https://s3.signmap.site/stm-sign-crops/crop_123.jpg');

      const cdnUrlWithoutBucket = 'https://cdn.signmap.site/custom_crop_456.jpg';
      expect(resolveS3Url(cdnUrlWithoutBucket)).toBe('https://s3.signmap.site/stm-sign-crops/custom_crop_456.jpg');
    });

    it('preserves generic http and https URLs', () => {
      expect(resolveS3Url('https://example.com/photo.png')).toBe('https://example.com/photo.png');
      expect(resolveS3Url('http://insecure.site/test.jpg')).toBe('http://insecure.site/test.jpg');
    });

    it('prepends default bucket when given a relative key without known bucket', () => {
      expect(resolveS3Url('relative_crop.jpg')).toBe('https://s3.signmap.site/stm-sign-crops/relative_crop.jpg');
      expect(resolveS3Url('stm-raw-videos/clip.mp4')).toBe('https://s3.signmap.site/stm-raw-videos/clip.mp4');
    });
  });

  describe('selectReviewQueue', () => {
    it('maps review queue response into formatted submissions with Vietnamese title fallback', () => {
      const mockResponse = {
        items: [
          {
            id: 'cand-1',
            signCropUrl: 'crop1.jpg',
            bestFrameUrl: 'frame1.jpg',
            predictedSignType: {
              id: 101,
              signCode: 'P.102',
              nameVi: 'Cấm đi ngược chiều',
              nameEn: 'No Entry',
            },
            locationContext: {
              coordinates: { latitude: 10.772, longitude: 106.698 },
              displayLocation: 'Đường Lê Lợi, Quận 1',
            },
            submission: {
              id: 'sub-1',
              surveyorId: 'surv-1',
              createdAt: '2026-11-07T08:00:00Z',
            },
          },
          {
            id: 'cand-2',
            signCropUrl: null,
            bestFrameUrl: 'frame2.jpg',
            predictedSignType: null,
            latitude: 10.775,
            longitude: 106.701,
            createdAt: 'invalid-date',
          },
        ],
        total: 2,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      };

      const result = selectReviewQueue(mockResponse as any);

      expect(result.total).toBe(2);
      expect(result.submissions).toHaveLength(2);

      // Candidate 1
      expect(result.submissions[0].id).toBe('cand-1');
      expect(result.submissions[0].title).toBe('Cấm đi ngược chiều (P.102)');
      expect(result.submissions[0].location).toBe('Đường Lê Lợi, Quận 1');
      expect(result.submissions[0].latitude).toBe(10.772);
      expect(result.submissions[0].longitude).toBe(106.698);
      expect(result.submissions[0].image?.uri).toContain('crop1.jpg');

      // Candidate 2 (fallback branch)
      expect(result.submissions[1].id).toBe('cand-2');
      expect(result.submissions[1].title).toBe('Unidentified sign');
      expect(result.submissions[1].latitude).toBe(10.775);
      expect(result.submissions[1].captured).toBe('invalid-date');
    });

    it('handles empty queue response gracefully', () => {
      const result = selectReviewQueue({} as any);
      expect(result.submissions).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('selectReviewHistory', () => {
    it('maps vote 1 to approved and vote -1 to declined', () => {
      const mockHistoryResponse = {
        items: [
          {
            id: 'rev-1',
            vote: 1,
            candidate: {
              id: 'cand-1',
              predictedSignType: { signCode: 'P.101', nameVi: 'Đường cấm' },
            },
          },
          {
            id: 'rev-2',
            vote: -1,
            candidate: {
              id: 'cand-2',
              predictedSignType: { signCode: 'W.201', nameEn: 'Curve ahead' },
            },
          },
        ],
        total: 2,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      };

      const history = selectReviewHistory(mockHistoryResponse as any);

      expect(history).toHaveLength(2);
      expect(history[0].action).toBe('approved');
      expect(history[0].submission.title).toBe('Đường cấm (P.101)');
      expect(history[1].action).toBe('declined');
      expect(history[1].submission.title).toBe('Curve ahead');
    });
  });
});
