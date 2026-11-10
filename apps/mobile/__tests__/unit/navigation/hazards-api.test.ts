import {
  reportHazard,
  confirmHazard,
  listHazards,
  getHazard,
} from '@/api/navigation/hazards';
import * as apiClient from '@/api/api-client';

jest.mock('@/api/api-client', () => ({
  apiRequest: jest.fn(),
  jsonApiRequest: jest.fn(),
}));

describe('Hazards API Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('reportHazard', () => {
    it('sends POST to /hazards/report with dto and returns result', async () => {
      const dto = {
        hazardType: 'POTHOLE',
        latitude: 10.772,
        longitude: 106.698,
        description: 'Ổ gà lớn sau mưa',
      };
      const mockRes = { success: true, id: 'hz-101', message: 'Báo cáo thành công' };
      (apiClient.jsonApiRequest as jest.Mock).mockResolvedValueOnce(mockRes);

      const res = await reportHazard(dto as any, 'token-123');

      expect(apiClient.jsonApiRequest).toHaveBeenCalledWith(
        '/hazards/report',
        dto,
        'token-123',
        undefined,
        'POST',
      );
      expect(res).toEqual(mockRes);
    });
  });

  describe('confirmHazard', () => {
    it('sends POST to /hazards/:id/confirm with vote status', async () => {
      const dto = { isStillThere: true };
      const mockRes = { success: true, message: 'Đã xác nhận sự cố' };
      (apiClient.jsonApiRequest as jest.Mock).mockResolvedValueOnce(mockRes);

      const res = await confirmHazard('hz 101', dto as any, 'token-123');

      expect(apiClient.jsonApiRequest).toHaveBeenCalledWith(
        '/hazards/hz%20101/confirm',
        dto,
        'token-123',
        undefined,
        'POST',
      );
      expect(res).toEqual(mockRes);
    });
  });

  describe('listHazards', () => {
    it('calls GET /hazards with serialized query params', async () => {
      const params = {
        status: 'ACTIVE',
        lat: 10.77,
        lon: 106.69,
        radiusMeters: 500,
        minLat: 10.7,
        minLon: 106.6,
        maxLat: 10.8,
        maxLon: 106.7,
        page: 1,
        pageSize: 10,
      };
      const mockItems = [{ id: 'hz-1', hazardType: 'ACCIDENT' }];
      (apiClient.apiRequest as jest.Mock).mockResolvedValueOnce(mockItems);

      const res = await listHazards(params as any);

      expect(apiClient.apiRequest).toHaveBeenCalledWith(
        expect.stringMatching(/^\/hazards\?status=ACTIVE&lat=10\.77/),
        { signal: undefined },
      );
      expect(res).toEqual(mockItems);
    });

    it('calls GET /hazards without query string when params are empty', async () => {
      (apiClient.apiRequest as jest.Mock).mockResolvedValueOnce([]);

      const res = await listHazards({});

      expect(apiClient.apiRequest).toHaveBeenCalledWith('/hazards', { signal: undefined });
      expect(res).toEqual([]);
    });
  });

  describe('getHazard', () => {
    it('calls GET /hazards/:id with URI encoding', async () => {
      const mockItem = { id: 'hz-202', hazardType: 'SPEED_TRAP' };
      (apiClient.apiRequest as jest.Mock).mockResolvedValueOnce(mockItem);

      const res = await getHazard('hz/202');

      expect(apiClient.apiRequest).toHaveBeenCalledWith(
        '/hazards/hz%2F202',
        { signal: undefined },
      );
      expect(res).toEqual(mockItem);
    });
  });
});
