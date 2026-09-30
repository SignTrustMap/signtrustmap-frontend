import {
  toRevalidationTaskItem,
  revalidationTaskToRouteSign,
  getRevalidationTasksInBounds,
  fetchFirstRevalidationSign,
  getTaskEvidences,
  submitRevalidationEvidence,
  FALLBACK_REVALIDATION_TASKS,
} from '@/api/revalidation/revalidation';
import type { RevalidationTaskItem } from '@/types/revalidationType';
import * as apiClient from '@/api/api-client';
import * as storage from '@/hooks/use-storage';
import * as FileSystem from 'expo-file-system/legacy';

// Mock dependencies
jest.mock('@/api/api-client', () => {
  class MockApiError extends Error {
    statusCode: number;
    constructor(msg: string, code: number) {
      super(msg);
      this.statusCode = code;
    }
  }
  return {
    apiRequest: jest.fn(),
    apiBaseUrl: jest.fn(() => 'https://api.signmap.site/api/v1'),
    ApiError: MockApiError,
  };
});

jest.mock('@/hooks/use-storage', () => ({
  getStorageItemAsync: jest.fn(),
  setStorageItemAsync: jest.fn(),
  removeStorageItemAsync: jest.fn(),
}));

jest.mock('expo-file-system/legacy', () => ({
  uploadAsync: jest.fn(),
  FileSystemUploadType: {
    MULTIPART: 0,
    BINARY_CONTENT: 1,
  },
}));

describe('Revalidation API Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (storage.getStorageItemAsync as jest.Mock).mockResolvedValue(
      JSON.stringify({ accessToken: 'mock-stored-jwt-token' }),
    );
  });

  describe('toRevalidationTaskItem', () => {
    it('normalizes raw API item with snake_case fields', () => {
      const raw = {
        id: 'task-101',
        verified_sign_id: 'sign-v101',
        sign_code: 'P.102',
        name_vi: 'Cấm đi ngược chiều',
        name_en: 'No Entry',
        priority: 'URGENT',
        status: 'OPEN',
        latitude: '10.7769',
        longitude: '106.7009',
        sign_crop_url: 'https://cdn.signmap.site/stm-sign-crops/crop101.jpg',
        created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
        freshness_score: 65,
        reason: 'Sign reported obstructed',
        reward_credits: 50,
      } as any;

      const item = toRevalidationTaskItem(raw);

      expect(item.id).toBe('task-101');
      expect(item.verifiedSignId).toBe('sign-v101');
      expect(item.code).toBe('P.102');
      expect(item.name).toBe('Cấm đi ngược chiều');
      expect(item.category).toBe('PROHIBITORY');
      expect(item.priority).toBe('URGENT');
      expect(item.status).toBe('OPEN');
      expect(item.latitude).toBeCloseTo(10.7769);
      expect(item.longitude).toBeCloseTo(106.7009);
      expect(item.currentTrustScore).toBe(65);
      expect(item.rewardCredits).toBe(50);
      expect(item.staleDays).toBe(5);
    });

    it('normalizes raw API item with camelCase fields', () => {
      const raw = {
        id: 'task-102',
        verifiedSignId: 'sign-v102',
        signCode: 'W.207a',
        nameVi: 'Giao nhau với đường không ưu tiên',
        nameEn: 'Crossroad',
        priority: 'critical',
        status: 'evaluating',
        latitude: 10.7554,
        longitude: 106.6781,
        signCropUrl: 'crop102.jpg',
        freshnessScore: 78,
        rewardCredits: 40,
      } as any;

      const item = toRevalidationTaskItem(raw);

      expect(item.id).toBe('task-102');
      expect(item.code).toBe('W.207a');
      expect(item.category).toBe('WARNING');
      expect(item.priority).toBe('URGENT');
      expect(item.status).toBe('EVALUATING');
      expect(item.currentTrustScore).toBe(78);
      expect(item.staleDays).toBe(60); // Default when created_at is omitted
    });

    it('handles various priority variants correctly', () => {
      const makeWithPriority = (p?: string) =>
        toRevalidationTaskItem({ id: '1', priority: p, latitude: 10, longitude: 106 } as any);

      expect(makeWithPriority('CRITICAL').priority).toBe('URGENT');
      expect(makeWithPriority('URGENT').priority).toBe('URGENT');
      expect(makeWithPriority('HIGH').priority).toBe('HIGH');
      expect(makeWithPriority('LOW').priority).toBe('LOW');
      expect(makeWithPriority('NORMAL').priority).toBe('NORMAL');
      expect(makeWithPriority('unknown').priority).toBe('NORMAL');
      expect(makeWithPriority(undefined).priority).toBe('NORMAL');
    });

    it('handles various status variants correctly', () => {
      const makeWithStatus = (s?: string) =>
        toRevalidationTaskItem({ id: '1', status: s, latitude: 10, longitude: 106 } as any);

      expect(makeWithStatus('EVALUATING').status).toBe('EVALUATING');
      expect(makeWithStatus('closed').status).toBe('CLOSED');
      expect(makeWithStatus('expired').status).toBe('EXPIRED');
      expect(makeWithStatus('open').status).toBe('OPEN');
      expect(makeWithStatus(undefined).status).toBe('OPEN');
    });
  });

  describe('revalidationTaskToRouteSign', () => {
    const baseTask: RevalidationTaskItem = {
      id: 'reval-1',
      verifiedSignId: 'sign-100',
      code: 'P.102',
      name: 'Cấm đi ngược chiều',
      roadName: 'Đường Nguyễn Huệ',
      category: 'PROHIBITORY',
      priority: 'URGENT',
      status: 'OPEN',
      staleDays: 45,
      latitude: 10.7769,
      longitude: 106.7009,
      historicalCropUrl: 'https://example.com/crop.jpg',
      representativeUrl: 'https://example.com/rep.png',
      lastVerifiedDate: '2026-01-01',
      currentTrustScore: 75,
      reason: 'Sign staleness test',
      rewardCredits: 30,
    };

    it('correctly maps task fields to RouteSign and inverts coordinate order to [lon, lat]', () => {
      const routeSign = revalidationTaskToRouteSign(baseTask);

      expect(routeSign.id).toBe('sign-100');
      expect(routeSign.taskId).toBe('reval-1');
      expect(routeSign.coordinate).toEqual([106.7009, 10.7769]);
      expect(routeSign.signCode).toBe('P.102');
      expect(routeSign.name).toBe('Cấm đi ngược chiều');
      expect(routeSign.status).toBe('STALE');
      expect(routeSign.roadName).toBe('Đường Nguyễn Huệ');
      expect(routeSign.displayAddress).toBe('Đường Nguyễn Huệ');
      expect(routeSign.lastVerifiedAt).toBe('2026-01-01');
    });

    it('normalizes freshness scores > 1 to decimal 0..1 without artificial capping', () => {
      // 88 should become 0.88, NOT capped at 0.55
      const sign88 = revalidationTaskToRouteSign({ ...baseTask, currentTrustScore: 88 });
      expect(sign88.freshnessScore).toBeCloseTo(0.88);

      // 55 should become 0.55
      const sign55 = revalidationTaskToRouteSign({ ...baseTask, currentTrustScore: 55 });
      expect(sign55.freshnessScore).toBeCloseTo(0.55);

      // 30 should become 0.30
      const sign30 = revalidationTaskToRouteSign({ ...baseTask, currentTrustScore: 30 });
      expect(sign30.freshnessScore).toBeCloseTo(0.30);
    });

    it('keeps score as-is when already in decimal format <= 1', () => {
      const signDecimal = revalidationTaskToRouteSign({ ...baseTask, currentTrustScore: 0.72 });
      expect(signDecimal.freshnessScore).toBeCloseTo(0.72);
    });

    it('defaults freshnessScore to 0.55 when trust score is undefined or invalid', () => {
      const signUndefined = revalidationTaskToRouteSign({ ...baseTask, currentTrustScore: undefined });
      expect(signUndefined.freshnessScore).toBe(0.55);

      const signNaN = revalidationTaskToRouteSign({ ...baseTask, currentTrustScore: NaN });
      expect(signNaN.freshnessScore).toBe(0.55);
    });
  });

  describe('getRevalidationTasksInBounds', () => {
    const testBounds = {
      minLat: 10.7,
      maxLat: 10.8,
      minLon: 106.6,
      maxLon: 106.75,
      pageSize: 20,
    };

    it('calls apiRequest with query params and uses stored access token', async () => {
      const mockRawResponse = {
        items: [
          {
            id: 'task-api-1',
            verified_sign_id: 'sign-api-1',
            sign_code: 'P.102',
            name_vi: 'Cấm đi ngược chiều',
            latitude: '10.75',
            longitude: '106.68',
            created_at: new Date().toISOString(),
            freshness_score: 55,
            priority: 'HIGH',
            status: 'OPEN',
          },
        ],
        total: 1,
      };
      (apiClient.apiRequest as jest.Mock).mockResolvedValueOnce(mockRawResponse);

      const tasks = await getRevalidationTasksInBounds(testBounds);

      expect(tasks).toHaveLength(1);
      expect(tasks[0].id).toBe('task-api-1');
      expect(tasks[0].code).toBe('P.102');

      // Verify token was resolved from storage and passed to apiRequest
      expect(apiClient.apiRequest).toHaveBeenCalledWith(
        expect.stringContaining('/revalidation/tasks/map?'),
        expect.objectContaining({ signal: undefined }),
        'mock-stored-jwt-token',
      );
    });

    it('uses explicitly provided accessToken if passed', async () => {
      (apiClient.apiRequest as jest.Mock).mockResolvedValueOnce({
        items: [],
      });

      await getRevalidationTasksInBounds(testBounds, undefined, 'custom-explicit-token');

      expect(apiClient.apiRequest).toHaveBeenCalledWith(
        expect.any(String),
        expect.anything(),
        'custom-explicit-token',
      );
      // Storage should not be queried if token was provided
      expect(storage.getStorageItemAsync).not.toHaveBeenCalled();
    });

    it('falls back to filtered FALLBACK_REVALIDATION_TASKS when apiRequest fails', async () => {
      (apiClient.apiRequest as jest.Mock).mockRejectedValueOnce(new Error('Network failure'));

      const tasks = await getRevalidationTasksInBounds(testBounds);

      // Should return items from FALLBACK_REVALIDATION_TASKS that fit within testBounds
      expect(Array.isArray(tasks)).toBe(true);
      expect(tasks.length).toBeGreaterThan(0);
      for (const t of tasks) {
        expect(t.latitude).toBeGreaterThanOrEqual(testBounds.minLat);
        expect(t.latitude).toBeLessThanOrEqual(testBounds.maxLat);
        expect(t.longitude).toBeGreaterThanOrEqual(testBounds.minLon);
        expect(t.longitude).toBeLessThanOrEqual(testBounds.maxLon);
      }
    });

    it('falls back to FALLBACK_REVALIDATION_TASKS when API returns empty items', async () => {
      (apiClient.apiRequest as jest.Mock).mockResolvedValueOnce({ items: [] });

      const tasks = await getRevalidationTasksInBounds(testBounds);
      expect(Array.isArray(tasks)).toBe(true);
      expect(tasks.length).toBeGreaterThan(0);
    });
  });

  describe('fetchFirstRevalidationSign', () => {
    it('returns first revalidation sign near user coordinates when available', async () => {
      const userCoord: [number, number] = [106.7009, 10.7769];

      (apiClient.apiRequest as jest.Mock).mockResolvedValueOnce({
        items: [
          {
            id: 'task-near-1',
            verified_sign_id: 'sign-near-1',
            sign_code: 'P.102',
            name_vi: 'Cấm đi ngược chiều',
            latitude: '10.7769',
            longitude: '106.7009',
            freshness_score: 55,
          },
        ],
      });

      const sign = await fetchFirstRevalidationSign(userCoord);

      expect(sign).not.toBeNull();
      expect(sign?.id).toBe('sign-near-1');
      expect(sign?.signCode).toBe('P.102');
      expect(sign?.freshnessScore).toBeCloseTo(0.55);
    });

    it('falls back to broad query if near-user query returns no items', async () => {
      // User is far from HCMC fallback tasks (e.g. Hanoi [105.85, 21.03])
      const userCoord: [number, number] = [105.85, 21.03];

      // First query (near): returns empty
      (apiClient.apiRequest as jest.Mock).mockResolvedValueOnce({ items: [] });
      // Second query (broad): returns a task
      (apiClient.apiRequest as jest.Mock).mockResolvedValueOnce({
        items: [
          {
            id: 'task-broad-1',
            verified_sign_id: 'sign-broad-1',
            sign_code: 'W.207a',
            name_vi: 'Giao nhau với đường không ưu tiên',
            latitude: '10.7554',
            longitude: '106.6781',
            freshness_score: 80,
          },
        ],
      });

      const sign = await fetchFirstRevalidationSign(userCoord);

      expect(sign).not.toBeNull();
      expect(sign?.id).toBe('sign-broad-1');
      expect(sign?.signCode).toBe('W.207a');
    });

    it('falls back to FALLBACK_REVALIDATION_TASKS[0] when all API queries fail', async () => {
      // User coordinates far from HCMC fallbacks so near search yields 0 fallbacks
      const userCoord: [number, number] = [105.85, 21.03];
      (apiClient.apiRequest as jest.Mock).mockRejectedValue(new Error('Complete offline'));

      const sign = await fetchFirstRevalidationSign(userCoord);

      expect(sign).not.toBeNull();
      expect(sign?.id).toBe(FALLBACK_REVALIDATION_TASKS[0].verifiedSignId);
      expect(sign?.signCode).toBe(FALLBACK_REVALIDATION_TASKS[0].code);
    });

    it('works without userCoordinate provided', async () => {
      (apiClient.apiRequest as jest.Mock).mockResolvedValueOnce({
        items: [
          {
            id: 'task-anywhere-1',
            verified_sign_id: 'sign-any-1',
            sign_code: 'R.301a',
            name_vi: 'Hướng đi phải theo',
            latitude: '10.7981',
            longitude: '106.7145',
            freshness_score: 54,
          },
        ],
      });

      const sign = await fetchFirstRevalidationSign(undefined);

      expect(sign).not.toBeNull();
      expect(sign?.id).toBe('sign-any-1');
      expect(sign?.signCode).toBe('R.301a');
    });
  });

  describe('getTaskEvidences', () => {
    it('fetches evidence reviews for a task with authorization header', async () => {
      const mockEvidences = [
        {
          id: 'ev-1',
          taskId: 'task-123',
          mediaUrl: 'https://cdn.example.com/signs/crop1.jpg',
          evidenceType: 'STILL_ACTIVE',
          capturedAt: '2026-09-28T14:30:00Z',
          distanceMeters: 4.2,
        },
        {
          id: 'ev-2',
          taskId: 'task-123',
          mediaUrl: 'https://cdn.example.com/signs/crop2.jpg',
          evidenceType: 'STILL_ACTIVE',
          capturedAt: '2026-09-27T10:15:00Z',
          distanceMeters: 2.1,
        },
      ];
      (apiClient.apiRequest as jest.Mock).mockResolvedValueOnce(mockEvidences);

      const result = await getTaskEvidences('task-123');

      expect(apiClient.apiRequest).toHaveBeenCalledWith(
        '/revalidation/tasks/task-123/evidences',
        { signal: undefined },
        'mock-stored-jwt-token',
      );
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('ev-1');
      expect(result[0].evidenceType).toBe('STILL_ACTIVE');
    });

    it('returns empty array when api request fails or throws', async () => {
      (apiClient.apiRequest as jest.Mock).mockRejectedValueOnce(new Error('Network disconnected'));

      const result = await getTaskEvidences('task-error');

      expect(result).toEqual([]);
    });
  });

  describe('submitRevalidationEvidence', () => {
    const dto = {
      latitude: 10.7769,
      longitude: 106.7009,
      capturedAt: '2026-09-29T08:00:00Z',
      note: 'Sign is clearly visible now',
    };

    it('submits evidence with file attachment using provided access token', async () => {
      const mockSuccessResponse = {
        id: 'evidence-999',
        taskId: 'task-101',
        latitude: 10.7769,
        longitude: 106.7009,
        status: 'EVALUATING',
        remainingDailySubmissions: 3,
      };
      (FileSystem.uploadAsync as jest.Mock).mockResolvedValueOnce({
        status: 201,
        body: JSON.stringify(mockSuccessResponse),
      });

      const mediaFile = {
        uri: 'file:///data/evidence.jpg',
        fileName: 'evidence.jpg',
        mimeType: 'image/jpeg',
      };

      const result = await submitRevalidationEvidence(
        'task-101',
        dto,
        mediaFile,
        'custom-auth-token',
      );

      expect(result.id).toBe('evidence-999');
      expect(result.status).toBe('EVALUATING');
      expect(FileSystem.uploadAsync).toHaveBeenCalledWith(
        'https://api.signmap.site/api/v1/revalidation/tasks/task-101/evidence',
        'file:///data/evidence.jpg',
        expect.objectContaining({
          fieldName: 'file',
          httpMethod: 'POST',
          uploadType: FileSystem.FileSystemUploadType.MULTIPART,
          mimeType: 'image/jpeg',
          headers: {
            Authorization: 'Bearer custom-auth-token',
          },
          parameters: expect.objectContaining({
            latitude: '10.7769',
            longitude: '106.7009',
            evidenceType: 'STILL_ACTIVE',
          }),
        }),
      );
      expect((FileSystem.uploadAsync as jest.Mock).mock.calls[0][2].parameters.note).toBeUndefined();
    });

    it('submits evidence with mediaUrl when no file is passed, auto-resolving token from storage', async () => {
      const mockSuccessResponse = {
        id: 'evidence-1000',
        taskId: 'sign-v002',
        mediaUrl: 'https://example.com/captured.jpg',
        latitude: 10.7735,
        longitude: 106.699,
        status: 'EVALUATING',
      };
      (apiClient.apiRequest as jest.Mock).mockResolvedValueOnce(mockSuccessResponse);

      const result = await submitRevalidationEvidence(
        'sign-v002',
        { ...dto, mediaUrl: 'https://example.com/captured.jpg' },
        undefined,
      );

      expect(result.id).toBe('evidence-1000');
      expect(apiClient.apiRequest).toHaveBeenCalledWith(
        '/revalidation/tasks/sign-v002/evidence',
        expect.objectContaining({ method: 'POST' }),
        'mock-stored-jwt-token',
      );
    });

    it('returns graceful fallback confirmation when remote submit fails', async () => {
      (apiClient.apiRequest as jest.Mock).mockRejectedValueOnce(new Error('Server 500 error'));

      const result = await submitRevalidationEvidence('task-offline', dto);

      expect(result).toBeDefined();
      expect(result.id).toMatch(/^evidence-/);
      expect(result.taskId).toBe('task-offline');
      expect(result.status).toBe('EVALUATING');
      expect(result.latitude).toBe(dto.latitude);
      expect(result.longitude).toBe(dto.longitude);
      expect(result.distanceMeters).toBe(5);
    });
  });
});
