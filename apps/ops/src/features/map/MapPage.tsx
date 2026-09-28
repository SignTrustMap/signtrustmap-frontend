import { useTranslation } from 'react-i18next'
import { AnimatePresence } from 'motion/react'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/features/auth/AuthContext'
import { ErrorBoundary } from '@shared/ui'
import {
  ProductMapFloatingControls,
  GuestCtaBanner,
  DestinationSearchBar,
  NavigationRoutePanel,
  PlaceDetailCard,
  CropImagePreviewModal,
} from './components'
import { useProductMap } from './hooks/useProductMap'

/**
 * Main Interactive Traffic Sign Map & Turn-by-turn Navigation Page for Ops
 * Full-frame edge-to-edge layout filling 100% of the viewport without header or card margins.
 */
export default function MapPage() {
  const { isDark } = useTheme()
  const { isAuthenticated } = useAuth()
  const { t } = useTranslation('product')

  const {
    mapContainerRef,
    tileMode,
    setTileMode,
    getTileModeLabel,
    isLoadingGis,
    userCoordinate,
    selectedDestination,
    isPlaceDetailOpen,
    isLoadingRoute,
    activeRoute,
    routeSigns,
    vehicleMode,
    previewCropUrl,
    setPreviewCropUrl,
    handleSelectDestination,
    handleRequestDirections,
    handleClosePlaceDetail,
    handleBackToPlaceDetail,
    handleChangeVehicleMode,
    handleClearRoute,
    handleRecenter,
    handleCenterOnUser,
    handleZoomIn,
    handleZoomOut,
    handleFocusSign,
    handleFocusStep,
  } = useProductMap({ isDark, t })

  return (
    <div className="w-full h-full min-h-0 flex-1 relative isolate flex flex-col overflow-hidden">
      <ErrorBoundary
        variant="card"
        title={t('map_page.error_boundary_title')}
        description={t('map_page.error_boundary_desc')}
      >
        {/* Full-bleed Leaflet Canvas */}
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* TOP-LEFT: Floating Destination Search Bar */}
        {isAuthenticated && (
          <div className="absolute top-4 left-4 z-[1000] w-full max-w-md">
            <DestinationSearchBar
              selectedDestination={selectedDestination}
              onSelectDestination={handleSelectDestination}
              onClearDestination={handleClearRoute}
              isDark={isDark}
            />
          </div>
        )}

        {/* Google Maps Controls: Top-Right (Layer Switcher) & Bottom-Right (GPS + Zoom Stack) */}
        <ProductMapFloatingControls
          tileMode={tileMode}
          onToggleTileMode={() => setTileMode((m) => (m === 'osm' ? 'esri' : 'osm'))}
          onRecenter={handleRecenter}
          onCenterOnUser={handleCenterOnUser}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          hasUserLocation={Boolean(userCoordinate)}
          hasActiveRoute={Boolean(activeRoute)}
          getTileModeLabel={getTileModeLabel}
          isLoadingGis={isLoadingGis}
          isDark={isDark}
        />

        {/* BOTTOM-LEFT: Guest Invitation Banner (if unauthenticated) */}
        {!isAuthenticated && <GuestCtaBanner isDark={isDark} />}

        {/* Left Panels with smooth enter & exit transitions */}
        <AnimatePresence mode="wait">
          {/* TOP-LEFT: Place Detail Card (WHEN DESTINATION IS SELECTED & NOT ROUTING) */}
          {isPlaceDetailOpen && selectedDestination && !activeRoute && (
            <PlaceDetailCard
              key={`place-${selectedDestination.id || selectedDestination.title}`}
              place={selectedDestination}
              userCoordinate={userCoordinate}
              onRequestDirections={handleRequestDirections}
              onClose={handleClosePlaceDetail}
              onCenterMap={handleRecenter}
              isLoadingRoute={isLoadingRoute}
              isDark={isDark}
            />
          )}

          {/* TOP-LEFT: Navigation Route Info Panel (WHEN ROUTE IS ACTIVE) */}
          {activeRoute && selectedDestination && (
            <NavigationRoutePanel
              key={`route-${selectedDestination.id || selectedDestination.title}`}
              route={activeRoute}
              destination={selectedDestination}
              routeSigns={routeSigns}
              vehicleMode={vehicleMode}
              onChangeVehicleMode={handleChangeVehicleMode}
              onClearRoute={handleClearRoute}
              onBackToPlace={handleBackToPlaceDetail}
              onFocusSign={handleFocusSign}
              onFocusStep={handleFocusStep}
              isDark={isDark}
            />
          )}
        </AnimatePresence>
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
