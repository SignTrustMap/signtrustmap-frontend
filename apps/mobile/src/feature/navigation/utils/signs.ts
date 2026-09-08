import type { RouteSign } from '@/api/navigation/navigation';
import type { VerifiedMapSign } from '@/types/sign-map/signMapType';

export function toRouteSign(sign: VerifiedMapSign): RouteSign {
  return {
    coordinate: [sign.longitude, sign.latitude],
    id: sign.id,
    imageUrl: sign.signCropUrl,
    name: sign.signType.nameEn,
    signCode: sign.signType.signCode,
  };
}
