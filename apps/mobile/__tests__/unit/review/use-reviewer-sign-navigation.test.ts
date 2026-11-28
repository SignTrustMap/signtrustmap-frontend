import { renderHook, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import {
  useReviewerSignNavigation,
  isWithinReviewerRadius,
  REVIEWER_FREE_NAVIGATION_RADIUS_METERS,
} from '@/feature/review/hooks/use-reviewer-sign-navigation';
import { extractCoordinateFromCandidate, toSubmission } from '@/api/reviews/review-workflow';
import * as gpsUtils from '@/feature/navigation/utils/gps';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('useReviewerSignNavigation & extractCoordinateFromCandidate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  describe('isWithinReviewerRadius', () => {
    it('returns true when distance is <= 5000m', () => {
      // 0 distance
      expect(isWithinReviewerRadius([106.7, 10.7], [106.7, 10.7])).toBe(true);
      // Custom radius
      expect(isWithinReviewerRadius([106.7, 10.7], [106.7, 10.71], 2000)).toBe(true);
    });

    it('returns false when distance is > 5000m', () => {
      // Coordinates far apart (~100km)
      expect(isWithinReviewerRadius([106.7, 10.7], [107.7, 11.7])).toBe(false);
    });
  });

  describe('extractCoordinateFromCandidate', () => {
    it('returns nulls for invalid inputs', () => {
      expect(extractCoordinateFromCandidate(null)).toEqual({ latitude: null, longitude: null });
      expect(extractCoordinateFromCandidate(undefined)).toEqual({ latitude: null, longitude: null });
      expect(extractCoordinateFromCandidate('')).toEqual({ latitude: null, longitude: null });
      expect(extractCoordinateFromCandidate(123)).toEqual({ latitude: null, longitude: null });
    });

    it('extracts direct numeric and string coordinates', () => {
      expect(extractCoordinateFromCandidate({ latitude: 10.77, longitude: 106.69 })).toEqual({
        latitude: 10.77,
        longitude: 106.69,
      });

      expect(extractCoordinateFromCandidate({ latitude: '10.77', longitude: '106.69' })).toEqual({
        latitude: 10.77,
        longitude: 106.69,
      });

      expect(extractCoordinateFromCandidate({ lat: '10.77', lng: '106.69' })).toEqual({
        latitude: 10.77,
        longitude: 106.69,
      });
    });

    it('extracts from locationContext (object or GeoJSON array)', () => {
      expect(
        extractCoordinateFromCandidate({
          locationContext: { coordinates: { latitude: 10.8, longitude: 106.7 } },
        }),
      ).toEqual({ latitude: 10.8, longitude: 106.7 });

      expect(
        extractCoordinateFromCandidate({
          locationContext: { coordinates: [106.72, 10.82] },
        }),
      ).toEqual({ latitude: 10.82, longitude: 106.72 });

      expect(
        extractCoordinateFromCandidate({
          locationContext: { latitude: 10.85, longitude: 106.75 },
        }),
      ).toEqual({ latitude: 10.85, longitude: 106.75 });
    });

    it('extracts from location or coordinates array', () => {
      expect(
        extractCoordinateFromCandidate({
          location: [106.65, 10.75],
        }),
      ).toEqual({ latitude: 10.75, longitude: 106.65 });

      expect(
        extractCoordinateFromCandidate({
          location: { coordinates: [106.66, 10.76] },
        }),
      ).toEqual({ latitude: 10.76, longitude: 106.66 });

      expect(
        extractCoordinateFromCandidate({
          location: { lat: 10.77, lon: 106.67 },
        }),
      ).toEqual({ latitude: 10.77, longitude: 106.67 });

      expect(
        extractCoordinateFromCandidate({
          coordinates: [106.68, 10.78],
        }),
      ).toEqual({ latitude: 10.78, longitude: 106.68 });
    });

    it('extracts from nested submission or rawCandidate', () => {
      expect(
        extractCoordinateFromCandidate({
          submission: { latitude: 10.79, longitude: 106.69 },
        }),
      ).toEqual({ latitude: 10.79, longitude: 106.69 });

      expect(
        extractCoordinateFromCandidate({
          candidateSign: { latitude: 10.81, longitude: 106.71 },
        }),
      ).toEqual({ latitude: 10.81, longitude: 106.71 });

      expect(
        extractCoordinateFromCandidate({
          rawCandidate: { latitude: 10.83, longitude: 106.73 },
        }),
      ).toEqual({ latitude: 10.83, longitude: 106.73 });
    });

    it('integrates properly with toSubmission', () => {
      const candidate: any = {
        id: 'cand-geo-1',
        createdAt: '2026-11-20T10:00:00Z',
        predictedSignType: { id: 1, signCode: 'P.102', nameVi: 'Cấm đi ngược chiều' },
        locationContext: {
          coordinates: [106.68, 10.78],
          displayLocation: 'Quận 1, TP.HCM',
        },
      };

      const submission = toSubmission(candidate);
      expect(submission.latitude).toBe(10.78);
      expect(submission.longitude).toBe(106.68);
      expect(submission.location).toBe('Quận 1, TP.HCM');
    });
  });

  describe('navigateToSign', () => {
    it('alerts when coordinates are missing or invalid', async () => {
      const { result } = await renderHook(() => useReviewerSignNavigation());

      // Null coordinates
      await act(async () => {
        await result.current.navigateToSign({
          latitude: null,
          longitude: null,
          title: 'Biển báo',
        });
      });
      expect(Alert.alert).toHaveBeenCalledWith(
        'Không có tọa độ',
        'Không có thông tin vị trí biển báo để điều hướng.',
      );

      // Invalid coordinate numbers (e.g. latitude out of range)
      await act(async () => {
        await result.current.navigateToSign({
          latitude: 999,
          longitude: 106.7,
          title: 'Biển báo',
        });
      });
      expect(Alert.alert).toHaveBeenCalledWith(
        'Thông báo',
        'Tọa độ của biển báo không hợp lệ.',
      );
    });

    it('alerts when location permission is not granted', async () => {
      jest.spyOn(gpsUtils, 'ensureLocationPermission').mockResolvedValueOnce(false);
      const { result } = await renderHook(() => useReviewerSignNavigation());

      await act(async () => {
        await result.current.navigateToSign({
          latitude: 10.77,
          longitude: 106.7,
          title: 'Biển báo P.102',
        });
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        'Quyền truy cập vị trí',
        expect.stringContaining('Vui lòng cấp quyền truy cập vị trí'),
      );
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('alerts when GPS position cannot be retrieved', async () => {
      jest.spyOn(gpsUtils, 'ensureLocationPermission').mockResolvedValueOnce(true);
      jest.spyOn(gpsUtils, 'fetchFreshGpsPosition').mockResolvedValueOnce(null);
      const { result } = await renderHook(() => useReviewerSignNavigation());

      await act(async () => {
        await result.current.navigateToSign({
          latitude: 10.77,
          longitude: 106.7,
          title: 'Biển báo P.102',
        });
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        'Không thể định vị',
        expect.stringContaining('Không thể lấy vị trí GPS hiện tại'),
      );
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('routes free navigation when within 5km radius', async () => {
      jest.spyOn(gpsUtils, 'ensureLocationPermission').mockResolvedValueOnce(true);
      // Close GPS position (e.g. ~100m away)
      jest.spyOn(gpsUtils, 'fetchFreshGpsPosition').mockResolvedValueOnce([106.701, 10.771]);
      const { result } = await renderHook(() => useReviewerSignNavigation());

      await act(async () => {
        await result.current.navigateToSign({
          latitude: 10.77,
          longitude: 106.7,
          title: 'Biển báo P.102',
          subtitle: 'Đường Nguyễn Huệ',
        });
      });

      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/home',
        params: {
          destinationLat: '10.77',
          destinationLng: '106.7',
          destinationTitle: 'Biển báo P.102',
          destinationSubtitle: 'Đường Nguyễn Huệ',
          isFreeNavigation: 'true',
          returnToReviewer: 'true',
        },
      });
    });

    it('presents option to route when outside 5km radius and handles view route action', async () => {
      jest.spyOn(gpsUtils, 'ensureLocationPermission').mockResolvedValueOnce(true);
      // GPS position ~50km away
      jest.spyOn(gpsUtils, 'fetchFreshGpsPosition').mockResolvedValueOnce([107.2, 11.2]);
      const { result } = await renderHook(() => useReviewerSignNavigation());

      await act(async () => {
        await result.current.navigateToSign({
          latitude: 10.77,
          longitude: 106.7,
          title: 'Biển báo P.102',
        });
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        'Ngoài bán kính miễn phí 5km',
        expect.stringContaining('Chế độ điều hướng miễn phí chỉ áp dụng trong phạm vi 5km'),
        expect.any(Array),
      );

      // Trigger the "Xem lộ trình" action
      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const buttons = alertCall[2];
      const viewRouteButton = buttons.find((b: any) => b.text === 'Xem lộ trình');
      expect(viewRouteButton).toBeDefined();

      viewRouteButton.onPress();

      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/home',
        params: {
          destinationLat: '10.77',
          destinationLng: '106.7',
          destinationTitle: 'Biển báo P.102',
          destinationSubtitle: 'Vị trí biển báo khảo sát',
          isFreeNavigation: 'false',
          returnToReviewer: 'true',
        },
      });
    });

    it('handles unexpected exceptions gracefully', async () => {
      jest.spyOn(gpsUtils, 'ensureLocationPermission').mockRejectedValueOnce(new Error('Location service died'));
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const { result } = await renderHook(() => useReviewerSignNavigation());

      await act(async () => {
        await result.current.navigateToSign({
          latitude: 10.77,
          longitude: 106.7,
          title: 'Biển báo P.102',
        });
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        'Lỗi',
        'Đã xảy ra lỗi khi kiểm tra vị trí. Vui lòng thử lại.',
      );
      consoleErrorSpy.mockRestore();
    });
  });
});
