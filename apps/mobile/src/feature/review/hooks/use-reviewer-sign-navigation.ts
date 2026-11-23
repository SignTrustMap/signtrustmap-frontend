import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import type { MapCoordinate } from '@/types/navigationType';
import { calculateDistanceMeters, isValidCoordinate } from '@/feature/navigation/utils/geo';
import { ensureLocationPermission, fetchFreshGpsPosition } from '@/feature/navigation/utils/gps';

export const REVIEWER_FREE_NAVIGATION_RADIUS_METERS = 5000;

export interface ReviewerSignTarget {
  latitude?: number | null;
  longitude?: number | null;
  title: string;
  subtitle?: string;
  signId?: string;
}

export function isWithinReviewerRadius(
  userCoord: MapCoordinate,
  signCoord: MapCoordinate,
  radiusMeters = REVIEWER_FREE_NAVIGATION_RADIUS_METERS,
): boolean {
  return calculateDistanceMeters(userCoord, signCoord) <= radiusMeters;
}

function showAlert(
  title: string,
  message?: string,
  buttons?: Parameters<typeof Alert.alert>[2],
) {
  if (typeof Alert !== 'undefined' && Alert && typeof Alert.alert === 'function') {
    if (buttons) {
      Alert.alert(title, message, buttons);
    } else {
      Alert.alert(title, message);
    }
  } else {
    console.warn(`[Alert] ${title}: ${message}`);
  }
}

export function useReviewerSignNavigation() {
  const router = useRouter();
  const [isNavigatingToSign, setIsNavigatingToSign] = useState(false);

  const navigateToSign = useCallback(
    async (target: ReviewerSignTarget) => {
      const lat = target.latitude != null ? Number(target.latitude) : null;
      const lon = target.longitude != null ? Number(target.longitude) : null;

      if (lat == null || lon == null || !Number.isFinite(lat) || !Number.isFinite(lon)) {
        showAlert('Không có tọa độ', 'Không có thông tin vị trí biển báo để điều hướng.');
        return;
      }

      const signCoordinate: MapCoordinate = [lon, lat];
      if (!isValidCoordinate(signCoordinate)) {
        showAlert('Thông báo', 'Tọa độ của biển báo không hợp lệ.');
        return;
      }

      setIsNavigatingToSign(true);

      try {
        const hasPermission = await ensureLocationPermission();
        if (!hasPermission) {
          showAlert(
            'Quyền truy cập vị trí',
            'Vui lòng cấp quyền truy cập vị trí để hệ thống xác định khoảng cách và chỉ đường tới biển báo.',
          );
          return;
        }

        const userGps = await fetchFreshGpsPosition(4000);
        if (!userGps || !isValidCoordinate(userGps)) {
          showAlert(
            'Không thể định vị',
            'Không thể lấy vị trí GPS hiện tại của bạn. Vui lòng bật định vị và thử lại.',
          );
          return;
        }

        const distanceMeters = calculateDistanceMeters(userGps, signCoordinate);
        const isFree = distanceMeters <= REVIEWER_FREE_NAVIGATION_RADIUS_METERS;

        if (isFree) {
          router.push({
            pathname: '/home',
            params: {
              destinationLat: String(lat),
              destinationLng: String(lon),
              destinationTitle: target.title || 'Biển báo cần thẩm định',
              destinationSubtitle: target.subtitle || 'Vị trí biển báo khảo sát',
              isFreeNavigation: 'true',
              returnToReviewer: 'true',
              ...(target.signId ? { reviewerSubmissionId: target.signId } : {}),
            },
          });
        } else {
          const distanceKm = (distanceMeters / 1000).toFixed(1);
          showAlert(
            'Ngoài bán kính miễn phí 5km',
            `Bạn đang ở cách biển báo này khoảng ${distanceKm} km. Chế độ điều hướng miễn phí chỉ áp dụng trong phạm vi 5km.\n\nBạn có muốn xem lộ trình tới biển báo này không?`,
            [
              { text: 'Hủy', style: 'cancel' },
              {
                text: 'Xem lộ trình',
                onPress: () => {
                  router.push({
                    pathname: '/home',
                    params: {
                      destinationLat: String(lat),
                      destinationLng: String(lon),
                      destinationTitle: target.title || 'Biển báo cần thẩm định',
                      destinationSubtitle: target.subtitle || 'Vị trí biển báo khảo sát',
                      isFreeNavigation: 'false',
                      returnToReviewer: 'true',
                      ...(target.signId ? { reviewerSubmissionId: target.signId } : {}),
                    },
                  });
                },
              },
            ],
          );
        }
      } catch (err: any) {
        console.error('[useReviewerSignNavigation] Error:', err);
        showAlert('Lỗi', 'Đã xảy ra lỗi khi kiểm tra vị trí. Vui lòng thử lại.');
      } finally {
        setIsNavigatingToSign(false);
      }
    },
    [router],
  );

  return {
    isNavigatingToSign,
    navigateToSign,
  };
}
