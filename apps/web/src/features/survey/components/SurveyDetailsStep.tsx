import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  Clock,
  MapPin,
  VideoCamera,
  Camera,
  FileText,
  CircleNotch,
  WarningCircle,
} from '@phosphor-icons/react'
import { Button } from '@shared/ui'
import { PhotoLocationPicker } from './PhotoLocationPicker'
import { reverseGeocodeCoordinates, type ResolvedLocation } from '../utils/reverseGeocode'

interface SurveyDetailsStepProps {
  mode: 'video_gpx' | 'photo_gps'
  videoFile: File | null
  photoFile: File | null
  photoPreview: string | null
  capturedAt: string
  note: string
  lat?: number
  lng?: number
  endLat?: number
  endLng?: number
  routeCoordinates?: [number, number][]
  durationSeconds?: number
  hasAutoGps: boolean
  isUploading: boolean
  isDark: boolean
  onCapturedAtChange: (val: string) => void
  onNoteChange: (val: string) => void
  onBack: () => void
  onSubmit: () => void
  gpxFile?: File | null
  onChangeLocation?: (lat: number, lng: number) => void
  onChangeEndLocation?: (lat: number, lng: number) => void
  onGpxSelect?: (file: File) => void
}

function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c)
}

export function SurveyDetailsStep({
  mode,
  videoFile,
  photoFile,
  photoPreview,
  capturedAt,
  note,
  lat,
  lng,
  endLat,
  endLng,
  routeCoordinates,
  durationSeconds = 60,
  hasAutoGps,
  isUploading,
  isDark,
  onCapturedAtChange,
  onNoteChange,
  onBack,
  onSubmit,
}: SurveyDetailsStepProps) {
  const { t } = useTranslation('common')
  const isVideo = mode === 'video_gpx'
  const activeFile = isVideo ? videoFile : photoFile

  // Reverse geocoded address states
  const [startAddress, setStartAddress] = useState<ResolvedLocation | null>(null)
  const [endAddress, setEndAddress] = useState<ResolvedLocation | null>(null)
  const [isResolvingStart, setIsResolvingStart] = useState(false)
  const [isResolvingEnd, setIsResolvingEnd] = useState(false)

  // Reverse Geocode Start Coordinate
  useEffect(() => {
    if (lat == null || lng == null) {
      setStartAddress(null)
      return
    }
    let active = true
    setIsResolvingStart(true)
    reverseGeocodeCoordinates(lat, lng)
      .then((res) => {
        if (active) setStartAddress(res)
      })
      .finally(() => {
        if (active) setIsResolvingStart(false)
      })
    return () => {
      active = false
    }
  }, [lat, lng])

  // Reverse Geocode End Coordinate (for Video)
  useEffect(() => {
    if (!isVideo || endLat == null || endLng == null) return
    let active = true
    setIsResolvingEnd(true)
    reverseGeocodeCoordinates(endLat, endLng)
      .then((res) => {
        if (active) setEndAddress(res)
      })
      .finally(() => {
        if (active) setIsResolvingEnd(false)
      })
    return () => {
      active = false
    }
  }, [isVideo, endLat, endLng])

  const estimatedDistance =
    isVideo && lat != null && lng != null && endLat != null && endLng != null
      ? calculateDistanceMeters(lat, lng, endLat, endLng)
      : null

  return (
    <div className="space-y-6">
      {/* 1. Media Summary Header Card */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border flex items-center justify-between flex-wrap gap-4 ${
          isDark ? 'bg-white/[0.02] border-white/10' : 'bg-gray-50/80 border-gray-200'
        }`}
      >
        <div className="flex items-center gap-3.5">
          {isVideo ? (
            <div className="w-12 h-12 rounded-xl bg-[#007b8b]/15 dark:bg-[#00c4de]/15 text-[#007b8b] dark:text-[#00c4de] flex items-center justify-center shrink-0">
              <VideoCamera size={26} weight="bold" />
            </div>
          ) : photoPreview ? (
            <img
              src={photoPreview}
              alt="Thumbnail"
              className="w-12 h-12 rounded-xl object-cover border border-white/20 shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-[#007b8b]/15 dark:bg-[#00c4de]/15 text-[#007b8b] dark:text-[#00c4de] flex items-center justify-center shrink-0">
              <Camera size={26} weight="bold" />
            </div>
          )}

          <div>
            <p className="text-sm font-black text-gray-900 dark:text-white truncate max-w-xs sm:max-w-md">
              {activeFile?.name || 'media-survey-file'}
            </p>
            <p className="text-xs text-gray-500 font-mono mt-0.5">
              {activeFile ? `${(activeFile.size / (1024 * 1024)).toFixed(1)} MB` : ''}
              {isVideo && durationSeconds ? ` • ~${Math.round(durationSeconds)}s` : ''}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Location & Telemetry Cards */}
      {isVideo ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Start Point Card */}
          <div
            className={`p-4 rounded-2xl border space-y-2.5 transition-colors ${
              isDark ? 'bg-white/[0.03] border-white/10' : 'bg-white border-gray-200 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                {t('survey.start_point', 'Điểm bắt đầu')}
              </span>
            </div>

            {/* Resolved Address Box */}
            {lat != null && lng != null ? (
              <div className="space-y-1 pt-0.5">
                <div className="flex items-center gap-1.5">
                  <MapPin size={14} className="text-[#007b8b] dark:text-[#00c4de] shrink-0" weight="bold" />
                  <span className="font-bold text-sm text-gray-900 dark:text-white truncate">
                    {startAddress?.roadName || 'Tuyến đường khảo sát'}
                  </span>
                  {isResolvingStart && (
                    <CircleNotch size={12} className="animate-spin text-[#007b8b] dark:text-[#00c4de] shrink-0" />
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 pl-5">
                  {startAddress?.displayAddress || 'Đang xác định địa chỉ...'}
                </p>
              </div>
            ) : (
              <div className="py-2.5 px-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs flex items-center gap-2">
                <WarningCircle size={16} className="shrink-0" weight="bold" />
                <span>{t('survey.no_coords_warning', 'Chưa có tọa độ GPS')}</span>
              </div>
            )}

            {/* Coordinates Display */}
            <div className="pt-2 flex items-center justify-between border-t border-gray-100 dark:border-white/5 text-[11px] font-mono text-gray-500">
              <span className="text-gray-400">Tọa độ:</span>
              {lat != null && lng != null ? (
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  {lat.toFixed(6)}, {lng.toFixed(6)}
                </span>
              ) : (
                <span className="text-amber-600 dark:text-amber-400 italic">
                  {t('survey.coords_unassigned', 'Chưa xác định')}
                </span>
              )}
            </div>
          </div>

          {/* End Point Card */}
          <div
            className={`p-4 rounded-2xl border space-y-2.5 transition-colors ${
              isDark ? 'bg-white/[0.03] border-white/10' : 'bg-white border-gray-200 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                {t('survey.end_point', 'Điểm kết thúc')}
              </span>
            </div>

            {/* Resolved Address Box */}
            {endLat != null && endLng != null ? (
              <div className="space-y-1 pt-0.5">
                <div className="flex items-center gap-1.5">
                  <MapPin size={14} className="text-[#007b8b] dark:text-[#00c4de] shrink-0" weight="bold" />
                  <span className="font-bold text-sm text-gray-900 dark:text-white truncate">
                    {endAddress?.roadName || 'Điểm kết thúc khảo sát'}
                  </span>
                  {isResolvingEnd && (
                    <CircleNotch size={12} className="animate-spin text-[#007b8b] dark:text-[#00c4de] shrink-0" />
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 pl-5">
                  {endAddress?.displayAddress || 'Đang xác định địa chỉ...'}
                </p>
              </div>
            ) : (
              <div className="py-2.5 px-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs flex items-center gap-2">
                <WarningCircle size={16} className="shrink-0" weight="bold" />
                <span>Chưa có tọa độ điểm kết thúc</span>
              </div>
            )}

            {/* Coordinates Display */}
            <div className="pt-2 flex items-center justify-between border-t border-gray-100 dark:border-white/5 text-[11px] font-mono text-gray-500">
              <span className="text-gray-400">Tọa độ:</span>
              {endLat != null && endLng != null ? (
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  {endLat.toFixed(6)}, {endLng.toFixed(6)}
                </span>
              ) : (
                <span className="text-amber-600 dark:text-amber-400 italic">
                  {t('survey.coords_unassigned', 'Chưa xác định')}
                </span>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Photo Single Location Card */
        <div
          className={`p-4 rounded-2xl border space-y-2.5 transition-colors ${
            isDark ? 'bg-white/[0.03] border-white/10' : 'bg-white border-gray-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
              {t('survey.sign_location_title', 'Vị trí biển báo')}
            </span>
          </div>

          {lat != null && lng != null ? (
            <div className="space-y-1 pt-0.5">
              <div className="flex items-center gap-1.5">
                <MapPin size={14} className="text-[#007b8b] dark:text-[#00c4de] shrink-0" weight="bold" />
                <span className="font-bold text-sm text-gray-900 dark:text-white truncate">
                  {startAddress?.roadName || 'Vị trí biển báo'}
                </span>
                {isResolvingStart && (
                  <CircleNotch size={12} className="animate-spin text-[#007b8b] dark:text-[#00c4de] shrink-0" />
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 pl-5">
                {startAddress?.displayAddress || 'Đang xác định địa chỉ...'}
              </p>
            </div>
          ) : (
            <div className="py-2.5 px-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs flex items-center gap-2">
              <WarningCircle size={16} className="shrink-0" weight="bold" />
              <span>{t('survey.no_coords_warning', 'Chưa có tọa độ GPS')}</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-between border-t border-gray-100 dark:border-white/5 text-[11px] font-mono text-gray-500">
            <span className="text-gray-400">Tọa độ:</span>
            {lat != null && lng != null ? (
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                {lat.toFixed(6)}, {lng.toFixed(6)}
              </span>
            ) : (
              <span className="text-amber-600 dark:text-amber-400 italic">
                {t('survey.coords_unassigned', 'Chưa xác định')}
              </span>
            )}
          </div>
        </div>
      )}

      {/* 3. Interactive Map Preview */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase font-mono flex items-center gap-1.5">
            <MapPin size={16} className="text-[#007b8b] dark:text-[#00c4de]" weight="bold" />
            <span>{isVideo ? t('survey.route_map_preview') : t('survey.sign_map_preview', 'Vị trí trên bản đồ')}</span>
          </label>
          {isVideo && (
            <span className="text-[11px] font-mono text-gray-500 font-semibold">
              {routeCoordinates && routeCoordinates.length > 1
                ? `Lộ trình: ${routeCoordinates.length} điểm toạ độ`
                : estimatedDistance != null
                ? `Chiều dài ước tính: ~${estimatedDistance} m`
                : ''}
            </span>
          )}
        </div>

        <PhotoLocationPicker
          mode={mode}
          lat={lat}
          lng={lng}
          endLat={endLat}
          endLng={endLng}
          routeCoordinates={routeCoordinates}
          height="320px"
        />
      </div>

      {/* 4. Details & Note */}
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase font-mono flex items-center gap-1.5">
            <Clock size={15} />
            <span>{t('survey.lbl_captured_at')}</span>
          </label>
          <input
            type="datetime-local"
            value={capturedAt ? capturedAt.slice(0, 16) : ''}
            onChange={(e) => onCapturedAtChange(new Date(e.target.value).toISOString())}
            className={`w-full px-3.5 py-2.5 text-xs sm:text-sm font-medium rounded-xl border outline-none transition-all ${
              isDark
                ? 'bg-black/50 border-white/15 text-white focus:border-[#00c4de]'
                : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-[#007b8b]'
            }`}
          />
        </div>

        {/* Note / Additional Details */}
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase font-mono flex items-center gap-1.5">
            <FileText size={15} />
            <span>{t('survey.lbl_survey_note')}</span>
          </label>
          <textarea
            rows={3}
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
            placeholder={t('survey.ph_survey_note', 'Nhập ghi chú khảo sát...')}
            className={`w-full px-3.5 py-2.5 text-xs sm:text-sm font-medium rounded-xl border outline-none transition-all resize-y ${
              isDark
                ? 'bg-black/50 border-white/15 text-white focus:border-[#00c4de]'
                : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-[#007b8b]'
            }`}
          />
        </div>
      </div>

      {/* 5. Action Footer (Back & Submit) */}
      <div className="pt-4 flex items-center justify-between border-t border-gray-100 dark:border-white/10">
        <Button
          type="button"
          variant="outline"
          size="md"
          onClick={onBack}
          leftIcon={<ArrowLeft size={16} weight="bold" />}
        >
          {t('survey.btn_back_step')}
        </Button>

        <Button
          type="button"
          variant="primary"
          size="lg"
          disabled={isUploading || !lat || !lng || !hasAutoGps}
          isLoading={isUploading}
          onClick={onSubmit}
        >
          {isUploading ? t('survey.btn_uploading') : t('survey.btn_submit_job')}
        </Button>
      </div>
    </div>
  )
}
