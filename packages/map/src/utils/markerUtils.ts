import L from 'leaflet'
import type { DirectionalMarkerIconOptions } from '../types'

/** Standard category colors mapped to QCVN 41:2019 */
export const CATEGORY_COLORS: Record<string, { hex: string; name: string }> = {
  P: { hex: '#ef4444', name: 'Biển Cấm' },
  R: { hex: '#007b8b', name: 'Biển Hiệu Lệnh' },
  W: { hex: '#f59e0b', name: 'Biển Cảnh Báo' },
  I: { hex: '#00c4de', name: 'Biển Chỉ Dẫn' },
  S: { hex: '#6b7280', name: 'Biển Phụ' },
  ALL: { hex: '#007b8b', name: 'Tất cả' },
}

/**
 * Create a custom Leaflet DivIcon with category styling and optional directional cone/arrow.
 */
export function createDirectionalDivIcon(options: DirectionalMarkerIconOptions): L.DivIcon {
  const {
    category = 'P',
    code = '',
    mainColor = CATEGORY_COLORS[category]?.hex ?? '#007b8b',
    ringColor = 'rgba(0, 123, 139, 0.4)',
    bearing = 0,
    isSelected = false,
    size = isSelected ? 42 : 34,
  } = options

  const hasBearing = typeof bearing === 'number' && !isNaN(bearing)

  // Outer container size includes the pointer cone
  const outerWidth = size + 16
  const outerHeight = size + 16

  const html = `
    <div style="
      position: relative;
      width: ${outerWidth}px;
      height: ${outerHeight}px;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      ${
        hasBearing
          ? `
        <!-- Directional Pointer Cone (Rotates according to bearing angle) -->
        <div style="
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transform: rotate(${bearing}deg);
          pointer-events: none;
          transition: transform 0.3s ease;
        ">
          <div style="
            position: absolute;
            top: 2px;
            width: 0;
            height: 0;
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-bottom: 12px solid ${mainColor};
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));
          "></div>
        </div>
      `
          : ''
      }

      <!-- Center Marker Node -->
      <div style="
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: ${mainColor};
        border: ${isSelected ? '3px solid #ffffff' : '2px solid #ffffff'};
        box-shadow: ${
          isSelected
            ? `0 0 0 4px ${ringColor}, 0 8px 24px rgba(0,0,0,0.5)`
            : `0 4px 12px rgba(0,0,0,0.3)`
        };
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ffffff;
        font-weight: 800;
        font-size: ${isSelected ? '13px' : '11px'};
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        user-select: none;
      ">
        ${category || code?.slice(0, 1) || '•'}
      </div>
    </div>
  `

  return L.divIcon({
    className: 'shared-directional-marker',
    html,
    iconSize: [outerWidth, outerHeight],
    iconAnchor: [outerWidth / 2, outerHeight / 2],
  })
}

const S3_BASE = 'https://s3.signmap.site'

/**
 * Resolves standard representative traffic sign image URL (vector/PNG) from S3 CDN.
 */
export function resolveRepresentativeSignUrl(nameEn?: string, signCode?: string): string {
  if (nameEn) {
    const slug = nameEn
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
    if (slug) {
      return `${S3_BASE}/stm-sign-crops/representative/${slug}.png`
    }
  }
  if (signCode) {
    return `${S3_BASE}/stm-sign-crops/representative/${signCode.toUpperCase().trim()}.png`
  }
  return ''
}

export interface VisualSignMarkerOptions {
  code: string
  name?: string
  category?: string
  heading?: number
  status?: string
  imageUrl?: string
  isSelected?: boolean
  size?: number
}

/**
 * Creates a modern Google Maps-styled traffic sign DivIcon:
 * - Displays the actual traffic sign graphic (from CDN).
 * - Rotated directional pointer cone according to heading angle.
 * - Glowing status ring (emerald for verified, red pulsing for flagged, purple for revalidating).
 * - Smooth scale-on-hover effect.
 * - Graceful fallback to colored QCVN badge if the image is unavailable.
 */
export function createVisualSignDivIcon(options: VisualSignMarkerOptions): L.DivIcon {
  const {
    code = '',
    name = '',
    category = 'P',
    heading = 0,
    status = 'verified',
    imageUrl = resolveRepresentativeSignUrl(undefined, code),
    isSelected = false,
    size = isSelected ? 42 : 36,
  } = options

  const hasHeading = typeof heading === 'number' && !isNaN(heading)
  const outerWidth = size + 16
  const outerHeight = size + 16

  // Status colors
  let statusColor = '#007b8b' // verified teal
  let ringColor = 'rgba(0, 123, 139, 0.4)'
  let isPulsing = false

  if (status === 'flagged') {
    statusColor = '#dc2626' // red
    ringColor = 'rgba(220, 38, 38, 0.5)'
    isPulsing = true
  } else if (status === 'revalidating') {
    statusColor = '#8b5cf6' // purple
    ringColor = 'rgba(139, 92, 246, 0.5)'
    isPulsing = true
  }

  // Fallback category color
  const catColor = CATEGORY_COLORS[category]?.hex ?? '#007b8b'

  const html = `
    <div style="
      position: relative;
      width: ${outerWidth}px;
      height: ${outerHeight}px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: transform 0.18s cubic-bezier(0.16, 1, 0.3, 1);
    "
    onmouseover="this.style.transform='scale(1.18)';"
    onmouseout="this.style.transform='scale(1)';"
    >
      ${
        hasHeading
          ? `
        <!-- Directional Heading Pointer Cone -->
        <div style="
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transform: rotate(${heading}deg);
          pointer-events: none;
          transition: transform 0.3s ease;
        ">
          <div style="
            position: absolute;
            top: 1px;
            width: 0;
            height: 0;
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-bottom: 12px solid ${statusColor};
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.45));
          "></div>
        </div>
      `
          : ''
      }

      <!-- Pulsing Ring for Selected or Flagged -->
      ${
        isSelected || isPulsing
          ? `
        <div style="
          position: absolute;
          inset: ${isSelected ? '-3px' : '0px'};
          border-radius: 50%;
          background: ${ringColor};
          animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
          pointer-events: none;
        "></div>
      `
          : ''
      }

      <!-- Visual Sign Graphic Node -->
      <div style="
        position: relative;
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: #ffffff;
        border: ${isSelected ? `3px solid ${statusColor}` : `2px solid #ffffff`};
        box-shadow: ${
          isSelected
            ? `0 0 0 3px ${ringColor}, 0 8px 24px rgba(0,0,0,0.55)`
            : `0 4px 14px rgba(0,0,0,0.35)`
        };
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      ">
        <img
          src="${imageUrl}"
          alt="${name || code}"
          style="width: 100%; height: 100%; object-fit: contain; pointer-events: none;"
          onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
        />
        <!-- Fallback QCVN Badge if CDN image fails -->
        <div style="
          display: none;
          width: 100%;
          height: 100%;
          background: ${catColor};
          color: #ffffff;
          font-weight: 800;
          font-size: ${isSelected ? '10px' : '9px'};
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          align-items: center;
          justify-content: center;
          letter-spacing: -0.5px;
          text-align: center;
          padding: 1px;
        ">
          ${code || category}
        </div>
      </div>
    </div>
  `

  return L.divIcon({
    className: 'shared-visual-sign-marker',
    html,
    iconSize: [outerWidth, outerHeight],
    iconAnchor: [outerWidth / 2, outerHeight / 2],
    popupAnchor: [0, -outerHeight / 2],
  })
}

