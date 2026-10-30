import { useTranslation } from 'react-i18next'
import { AnimatePresence } from 'motion/react'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/context/AuthContext'
import { ErrorBoundary, PageHeader } from '@shared/ui'
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
 * Main Interactive Traffic Sign Map & Turn-by-turn Navigation Page
 *
 * Flow 1 (Mobile Navigation Alignment):
 * - Guest Users: Public viewport signs view with S3 representative icons & field crop thumbnails.
 *   Destination search bar is hidden; Guest CTA banner prompts sign in.
 * - Authenticated Users: Destination search bar unlocked (saved places, recent searches, address search).
 *   Route calculation (Car/Bike), polyline rendering, signs along route, turn-by-turn directions,
 *   and step-by-step active navigation mode with upcoming sign alerts.
 */
export default function ProductMap() {
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
    <div
      className={`w-full min-h-[calc(100vh-80px)] py-6 sm:py-8 transition-colors ${
        isDark ? 'bg-[#030708] text-gray-100' : 'bg-[#F8F7F7] text-gray-900'
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Page Header */}
        <PageHeader
          title={t('map_page.title')}
          subtitle={
            isAuthenticated
              ? t('map_page.subtitle_auth')
              : t('map_page.subtitle_guest')
          }
          bordered
        />

        {/* Interactive Map Box */}
        <div
          className={`w-full rounded-2xl border overflow-hidden h-[calc(100vh-230px)] min-h-[620px] relative isolate flex flex-col transition-colors ${
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

            {/* TOP-LEFT: Floating Destination Search Bar (FOR AUTHENTICATED USERS) */}
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

            {/* BOTTOM-LEFT: Guest Invitation Banner (ONLY FOR GUEST USERS) */}
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
        </div>
      </div>

      {/* Lightbox Modal for Real Camera Crop Images */}
      <CropImagePreviewModal
        imageUrl={previewCropUrl}
        onClose={() => setPreviewCropUrl(null)}
        isDark={isDark}
      />
    </div>
  )
}
