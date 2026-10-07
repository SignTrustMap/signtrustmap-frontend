import type L from 'leaflet'
import type { CollisionCandidate, CollisionThinningOptions } from '../types'

/**
 * Priority scoring for Vietnamese traffic signs (QCVN 41:2019/BGTVT):
 * Higher score = higher priority to be preserved on map during screen collision.
 */
export function getTrafficSignPriority(sign: CollisionCandidate): number {
  const rawCode = sign.signCode || sign.code || ''
  const code = rawCode.toUpperCase().trim()
  const category = (sign.category || '').toUpperCase().trim()
  const status = typeof sign.status === 'string' ? sign.status.toLowerCase().trim() : ''

  // 0. Operational Review Priority (Flagged / Revalidating signs must never be hidden from inspectors)
  if (status === 'flagged' || status === 'revalidating') {
    return 150
  }

  // 1. Critical Prohibitory Signs (Highest Priority - Life safety, major access/turn restrictions)
  if (
    code.startsWith('P.102') || // Cấm đi ngược chiều
    code.startsWith('P.101') || // Đường cấm
    code.startsWith('P.103') || // Cấm ô tô
    code.startsWith('P.106') || // Cấm xe tải
    code.startsWith('P.115') || // Hạn chế tải trọng
    code.startsWith('P.117') || // Hạn chế chiều cao (Cầu, hầm)
    code.startsWith('P.123') || // Cấm rẽ trái/phải
    code.startsWith('P.124') || // Cấm quay đầu
    code.startsWith('P.127')    // Tốc độ tối đa cho phép
  ) {
    return 100
  }

  // 2. Standard Prohibitory Signs (P - Biển cấm dừng, đỗ, các phương tiện khác)
  if (code.startsWith('P.') || code.startsWith('P') || category === 'P') {
    return 80
  }

  // 3. Danger Warning Signs (W - Biển cảnh báo nguy hiểm: Công trường, khúc cua, giao cắt)
  if (code.startsWith('W.') || code.startsWith('W') || category === 'W') {
    return 65
  }

  // 4. Mandatory Signs (R - Biển hiệu lệnh: Vòng xuyến, hướng đi phải theo)
  if (code.startsWith('R.') || code.startsWith('R') || category === 'R') {
    return 50
  }

  // 5. Information & Priority Direction Signs (I - Biển chỉ dẫn)
  if (code.startsWith('I.') || code.startsWith('I') || category === 'I') {
    return 30
  }

  // 6. Supplementary Signs (S - Biển phụ) and others
  return 15
}

/**
 * Helper to extract [latitude, longitude] from diverse sign formats.
 */
export function getCandidateLatLng(sign: CollisionCandidate): [number, number] | null {
  if (
    typeof sign.lat === 'number' &&
    typeof sign.lng === 'number' &&
    Number.isFinite(sign.lat) &&
    Number.isFinite(sign.lng)
  ) {
    return [sign.lat, sign.lng]
  }

  if (Array.isArray(sign.coordinate) && sign.coordinate.length >= 2) {
    const [lng, lat] = sign.coordinate
    if (
      typeof lat === 'number' &&
      typeof lng === 'number' &&
      Number.isFinite(lat) &&
      Number.isFinite(lng)
    ) {
      return [lat, lng]
    }
  }

  return null
}

/**
 * Filter traffic signs using dynamic screen-space collision thinning (Google Maps style):
 * - Keeps high-priority signs and culls overlapping/colliding lower-priority signs.
 * - Dynamic collision radius adjusted based on zoom level:
 *   - Zoom <= 10 (City overview): aggressive radius (70px)
 *   - Zoom 11-12: (56px)
 *   - Zoom 13-14 (District scale): medium radius (46px)
 *   - Zoom 15 (Ward scale): comfortable radius (38px)
 *   - Zoom >= 16 (Street scale): tight radius (32px)
 * - Never culls a sign if its popup is currently open or if it is currently focused.
 */
export function filterSignsByCollision<T extends CollisionCandidate>(
  signs: T[],
  map: L.Map,
  activeMarkers: Record<string | number, L.Marker> = {},
  focusedSignId?: string | number | null,
  options: CollisionThinningOptions = {}
): T[] {
  if (!signs || signs.length === 0) return []

  try {
    const zoom = map.getZoom()
    const mapBounds = map.getBounds()
    const padFactor = options.boundPadding ?? 0.08
    const paddedBounds = mapBounds.pad(padFactor)

    // Determine screen-space collision radius (in pixels)
    let collisionRadius = options.baseRadius ?? 32
    if (zoom <= 10) {
      collisionRadius = 70
    } else if (zoom <= 12) {
      collisionRadius = 56
    } else if (zoom <= 14) {
      collisionRadius = 46
    } else if (zoom === 15) {
      collisionRadius = 38
    } else {
      collisionRadius = 32
    }

    // Filter signs to current padded viewport bounds
    const candidateSigns = signs.filter((sign) => {
      const isFocused = sign.id === focusedSignId
      const isPopupOpen = activeMarkers[sign.id]?.isPopupOpen?.()
      const isStatusPreserved =
        options.preserveStatuses &&
        typeof sign.status === 'string' &&
        options.preserveStatuses.includes(sign.status.toLowerCase().trim())

      if (isFocused || isPopupOpen || isStatusPreserved) {
        return true
      }

      const coords = getCandidateLatLng(sign)
      if (!coords) return false
      return paddedBounds.contains(coords)
    })

    // If thinning is explicitly disabled (e.g. inspector requested 100% view or high zoom level)
    if (options.disabled) {
      return candidateSigns
    }

    // Sort candidate signs by Priority (Highest first)
    const sorted = [...candidateSigns].sort((a, b) => {
      const aActive = a.id === focusedSignId || activeMarkers[a.id]?.isPopupOpen?.() ? 1 : 0
      const bActive = b.id === focusedSignId || activeMarkers[b.id]?.isPopupOpen?.() ? 1 : 0
      if (aActive !== bActive) return bActive - aActive

      const pA = getTrafficSignPriority(a)
      const pB = getTrafficSignPriority(b)
      if (pA !== pB) return pB - pA

      // Stable tie-breaker to prevent marker flickering during pans
      return String(a.id ?? '').localeCompare(String(b.id ?? ''))
    })

    const acceptedSigns: T[] = []
    const acceptedPoints: { x: number; y: number }[] = []
    const radiusSq = collisionRadius * collisionRadius

    for (const sign of sorted) {
      const isFocused = sign.id === focusedSignId
      const isPopupOpen = activeMarkers[sign.id]?.isPopupOpen?.()
      const isStatusPreserved =
        options.preserveStatuses &&
        typeof sign.status === 'string' &&
        options.preserveStatuses.includes(sign.status.toLowerCase().trim())

      const coords = getCandidateLatLng(sign)
      if (!coords) continue

      const pt = map.latLngToContainerPoint(coords)

      // Forced keep if active, focused, or explicitly preserved status
      if (isFocused || isPopupOpen || isStatusPreserved) {
        acceptedSigns.push(sign)
        acceptedPoints.push(pt)
        continue
      }

      // Check collision against already accepted points
      let collides = false
      for (const other of acceptedPoints) {
        const dx = pt.x - other.x
        const dy = pt.y - other.y
        if (dx * dx + dy * dy < radiusSq) {
          collides = true
          break
        }
      }

      if (!collides) {
        acceptedSigns.push(sign)
        acceptedPoints.push(pt)
      }
    }

    return acceptedSigns
  } catch (err) {
    console.warn('[@shared/map] Collision thinning computation error:', err)
    return signs.slice(0, 100)
  }
}
