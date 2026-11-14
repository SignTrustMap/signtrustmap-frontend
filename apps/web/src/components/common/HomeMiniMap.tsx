import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@/context/ThemeContext'
import { ErrorBoundary } from '@shared/ui'
import { mockSigns } from '@/data'
import { useProductMap } from '@/features/product/hooks/useProductMap'
import {
  ProductMapFloatingControls,
  CropImagePreviewModal,
} from '@/features/product/components'
import {
  resolveRepresentativeSignUrl,
  determineSignCategory,
} from '@/features/product/utils/signUrlHelpers'
import type { RouteSign } from '@shared/types'

/**
 * Interactive Traffic Sign Preview Map on Home Page
 * Renders the exact map experience from /product/map (Esri tiles, live GIS signs,
 * representative S3 icons & Google Maps floating controls), proportioned cleanly
 * to balance with the descriptive text and CTA button on the left.
 */
export function HomeMiniMap() {
  const { isDark } = useTheme()
  const { t } = useTranslation('product')

  // Convert mockSigns to RouteSign format so markers render immediately on homepage
  const initialSigns: RouteSign[] = useMemo(() => {
    return mockSigns.map((s) => ({
      id: s.id,
      coordinate: [s.lng, s.lat] as [number, number],
      imageUrl: resolveRepresentativeSignUrl('', s.code),
      actualCropUrl: s.actualCropUrl,
      name: s.name,
      signCode: s.code,
      category: determineSignCategory(s.code),
    }))
  }, [])

  const {
    mapContainerRef,
    tileMode,
    setTileMode,
    getTileModeLabel,
    isLoadingGis,
    userCoordinate,
    handleRecenter,
    handleCenterOnUser,
    handleZoomIn,
    handleZoomOut,
    previewCropUrl,
    setPreviewCropUrl,
  } = useProductMap({
    isDark,
    t,
    initialSigns,
    scrollWheelZoom: false,
  })

  return (
    <div
      className={`w-full rounded-2xl border overflow-hidden h-[360px] sm:h-[400px] lg:h-[425px] relative isolate flex flex-col transition-colors ${
        isDark
          ? 'bg-[#071317] border-white/10 shadow-lg shadow-black/40'
          : 'bg-white border-[#E8E4E3] shadow-xs'
      }`}
    >
      <ErrorBoundary
        variant="card"
        title={t('map_page.error_boundary_title')}
        description={t('map_page.error_boundary_desc')}
      >
        {/* Leaflet Canvas */}
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Google Maps Controls: Top-Right (Layer Switcher) & Bottom-Right (GPS + Zoom Stack) */}
        <ProductMapFloatingControls
          tileMode={tileMode}
          onToggleTileMode={() => setTileMode((m) => (m === 'osm' ? 'esri' : 'osm'))}
          onRecenter={handleRecenter}
          onCenterOnUser={handleCenterOnUser}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          hasUserLocation={Boolean(userCoordinate)}
          hasActiveRoute={false}
          getTileModeLabel={getTileModeLabel}
          isLoadingGis={isLoadingGis}
          isDark={isDark}
        />
      </ErrorBoundary>

      {/* Lightbox Modal for Real Camera Crop Images */}
      <CropImagePreviewModal
        imageUrl={previewCropUrl}
        onClose={() => setPreviewCropUrl(null)}
        isDark={isDark}
      />
    </div>
  )
}
