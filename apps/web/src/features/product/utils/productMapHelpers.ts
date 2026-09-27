import L from 'leaflet'
import type { TFunction } from 'i18next'
import type { SignItem } from '@/data'
import type { CategoryMeta } from '../components/ProductMapSidebar'

// Fix Leaflet default marker icons using localized assets
export function setupLeafletDefaultIcons() {
  delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: '/leaflet/marker-icon-2x.png',
    iconUrl: '/leaflet/marker-icon.png',
    shadowUrl: '/leaflet/marker-shadow.png',
  })
}

export function getCategoryMeta(cat: string, t: TFunction): CategoryMeta {
  switch (cat) {
    case 'P':
      return {
        code: 'P',
        name: t('map_page.groups.P'),
        bgHex: '#ef4444',
        badgeClass:
          'bg-red-100 text-red-950 border-red-300 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30',
      }
    case 'R':
      return {
        code: 'R',
        name: t('map_page.groups.R'),
        bgHex: '#007b8b',
        badgeClass:
          'bg-teal-100 text-teal-950 border-teal-300 dark:bg-teal-500/20 dark:text-teal-300 dark:border-teal-500/30',
      }
    case 'W':
      return {
        code: 'W',
        name: t('map_page.groups.W'),
        bgHex: '#f59e0b',
        badgeClass:
          'bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30',
      }
    case 'I':
      return {
        code: 'I',
        name: t('map_page.groups.I'),
        bgHex: '#00c4de',
        badgeClass:
          'bg-cyan-100 text-cyan-950 border-cyan-300 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/30',
      }
    case 'S':
      return {
        code: 'S',
        name: t('map_page.groups.S'),
        bgHex: '#6b7280',
        badgeClass:
          'bg-gray-200 text-gray-900 border-gray-300 dark:bg-gray-700/50 dark:text-gray-300 dark:border-gray-600',
      }
    default:
      return {
        code: 'ALL',
        name: t('map_page.groups.ALL'),
        bgHex: '#007b8b',
        badgeClass:
          'bg-teal-100 text-teal-950 border-teal-300 dark:bg-teal-500/20 dark:text-teal-300 dark:border-teal-500/30',
      }
  }
}

interface CreateMarkerParams {
  sign: SignItem
  meta: CategoryMeta
  isSelected: boolean
  isDark: boolean
  isDriver: boolean
  t: TFunction
  onSelect: (signId: string) => void
}

export function createSignMarker({
  sign,
  meta,
  isSelected,
  isDark,
  isDriver,
  t,
  onSelect,
}: CreateMarkerParams): L.Marker {
  const customIcon = L.divIcon({
    className: 'custom-sign-marker',
    html: `
      <div style="
        background: ${meta.bgHex};
        width: ${isSelected ? '38px' : '32px'};
        height: ${isSelected ? '38px' : '32px'};
        border-radius: 50%;
        border: ${isSelected ? '3px solid #ffffff' : '2px solid #ffffff'};
        box-shadow: ${
          isSelected
            ? '0 0 0 4px ' + meta.bgHex + ', 0 8px 20px rgba(0,0,0,0.5)'
            : '0 4px 12px rgba(0,0,0,0.35)'
        };
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ffffff;
        font-weight: 800;
        font-size: ${isSelected ? '13px' : '11px'};
        font-family: monospace;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      ">
        ${sign.category}
      </div>
    `,
    iconSize: [isSelected ? 38 : 32, isSelected ? 38 : 32],
    iconAnchor: [isSelected ? 19 : 16, isSelected ? 19 : 16],
  })

  const marker = L.marker([sign.lat, sign.lng], { icon: customIcon })

  const popupBg = isDark ? '#081215' : '#ffffff'
  const textColor = isDark ? '#f8fafc' : '#0f172a'
  const subTextColor = isDark ? '#94a3b8' : '#475569'
  const borderColor = isDark ? 'rgba(255,255,255,0.12)' : '#e2e8f0'
  const specColor = isDark ? '#cbd5e1' : '#334155'

  const popupContent = `
    <div style="font-family: system-ui, -apple-system, sans-serif; padding: 4px; background: ${popupBg}; color: ${textColor}; min-width: 230px; border-radius: 12px;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; gap: 8px;">
        <span style="background: ${meta.bgHex}; color: #ffffff; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 800; font-family: monospace;">${sign.code}</span>
        <span style="color: #047857; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 2px 7px; border-radius: 6px; font-size: 10.5px; font-weight: 800;">✓ ${sign.trustScore}% ${t('mini_map.popup_trust')}</span>
      </div>
      <p style="font-size: 13px; font-weight: 800; margin: 4px 0 3px 0; line-height: 1.35; color: ${textColor};">${sign.name}</p>
      <p style="font-size: 11.5px; color: ${subTextColor}; margin: 0 0 8px 0; font-weight: 500;">${sign.location}</p>
      <div style="display: flex; justify-content: space-between; font-size: 10.5px; color: ${specColor}; font-family: monospace; font-weight: 600; border-top: 1px solid ${borderColor}; padding-top: 6px;">
        <span>${t('mini_map.popup_heading')} ${sign.heading}°</span>
        <span>GPS: ${sign.lat.toFixed(4)}, ${sign.lng.toFixed(4)}</span>
      </div>
      ${
        isDriver
          ? `
        <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid ${borderColor};">
          <button
            type="button"
            data-report-sign-id="${sign.id}"
            style="
              width: 100%;
              padding: 6px 10px;
              border-radius: 8px;
              background: #f59e0b;
              color: #000000;
              border: none;
              font-size: 11px;
              font-weight: 800;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 5px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.15);
            "
          >
            🚩 ${t('map_page.btn_report_issue')}
          </button>
        </div>
      `
          : ''
      }
    </div>
  `

  marker.bindPopup(popupContent, {
    closeButton: true,
    className: isDark ? 'dark-leaflet-popup' : 'light-leaflet-popup',
  })

  marker.on('click', () => {
    onSelect(sign.id)
  })

  return marker
}
