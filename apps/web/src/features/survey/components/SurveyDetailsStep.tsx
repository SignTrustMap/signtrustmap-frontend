import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  Clock,
  MapPin,
  VideoCamera,
  Camera,
  NavigationArrow,
  FlagCheckered,
  Compass,
  FileText,
  CaretDown,
  CaretUp,
  CircleNotch,
} from '@phosphor-icons/react'
import { Button } from '@shared/ui'
import { PhotoLocationPicker } from './PhotoLocationPicker'
import { reverseGeocodeCoordinates, type ResolvedLocation } from '../utils/reverseGeocode'

interface SurveyDetailsStepProps {
  mode: 'video_gpx' | 'photo_gps'
  videoFile: File | null
  gpxFile: File | null
  photoFile: File | null
  photoPreview: string | null
  capturedAt: string
  note: string
  lat: number
  lng: number
  endLat?: number
  endLng?: number
  durationSeconds?: number
  hasAutoGps: boolean
  isUploading: boolean
  isDark: boolean
  onCapturedAtChange: (val: string) => void
  onNoteChange: (val: string) => void
  onChangeLocation: (lat: number, lng: number) => void
  onChangeEndLocation?: (lat: number, lng: number) => void
  onGpxSelect?: (file: File) => void
  onBack: () => void
  onSubmit: () => void
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
  gpxFile,
  photoFile,
  photoPreview,
  capturedAt,
  note,
  lat,
  lng,
  endLat,
  endLng,
  durationSeconds = 60,
  hasAutoGps,
  isUploading,
  isDark,
  onCapturedAtChange,
  onNoteChange,
  onChangeLocation,
  onChangeEndLocation,
  onGpxSelect,
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

  // Accordion state
  const [isGpxAccordionOpen, setIsGpxAccordionOpen] = useState(false)

  // Reverse Geocode Start Coordinate
  useEffect(() => {
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

  // Handle GPS location for Start Point
  const handleGetStartLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          onChangeLocation(
            Number(pos.coords.latitude.toFixed(6)),
            Number(pos.coords.longitude.toFixed(6))
          )
        },
        () => {
          onChangeLocation(10.7769, 106.7009)
        }
      )
    }
  }

  // Handle GPS location for End Point
  const handleGetEndLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          onChangeEndLocation?.(
            Number(pos.coords.latitude.toFixed(6)),
            Number(pos.coords.longitude.toFixed(6))
          )
        },
        () => {
          onChangeEndLocation?.(10.781, 106.705)
        }
      )
    }
  }

  const estimatedDistance =
    isVideo && endLat != null && endLng != null
      ? calculateDistanceMeters(lat, lng, endLat, endLng)
      : null

  return (
    <div className="space-y-6">
      {/* 1. Media Summary Header Card (Mobile Parity) */}
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
            <span className="text-[11px] font-mono text-gray-500 uppercase tracking-wider block">
              {t('survey.selected_media_title')}
            </span>
            <p className="text-sm font-black text-gray-900 dark:text-white truncate max-w-xs sm:max-w-md">
              {activeFile?.name || 'media-survey-file'}
            </p>
            <p className="text-xs text-gray-500 font-mono">
              {activeFile ? `${(activeFile.size / (1024 * 1024)).toFixed(1)} MB` : ''}
              {isVideo && durationSeconds ? ` • ~${Math.round(durationSeconds)}s` : ''}
              {gpxFile ? ` • ${gpxFile.name}` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${
              hasAutoGps || gpxFile
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                : 'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300'
            }`}
          >
            {hasAutoGps || gpxFile ? 'GPS: Locked' : 'GPS: Manual Pin'}
          </span>
        </div>
      </div>

      {/* 2. Location & Telemetry Cards (Mobile Parity: Start S, End D & Reverse Geocoded Address) */}
      {isVideo ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Start Point (S) Card */}
          <div
            className={`p-4 rounded-2xl border space-y-2.5 transition-colors ${
              isDark ? 'bg-white/[0.03] border-white/10' : 'bg-white border-gray-200 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#16a34a] text-white font-mono font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                  S
                </span>
                <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                  {t('survey.start_point')}
                </span>
              </div>
              <button
                type="button"
                onClick={handleGetStartLocation}
                className="text-[11px] font-bold text-[#007b8b] dark:text-[#00c4de] hover:underline flex items-center gap-1 cursor-pointer transition-colors"
              >
                <NavigationArrow size={13} weight="bold" />
                <span>{t('survey.lbl_current_loc', 'Lấy GPS')}</span>
              </button>
            </div>

            {/* Resolved Address Box */}
            <div className="space-y-1 pt-0.5">
              <div className="flex items-center gap-1.5">
                <MapPin size={14} className="text-[#16a34a] shrink-0" weight="bold" />
                <span className="font-bold text-sm text-gray-900 dark:text-white truncate">
                  {startAddress?.roadName || 'Tuyến đường khảo sát'}
                </span>
                {isResolvingStart && (
                  <CircleNotch size={12} className="animate-spin text-[#16a34a] shrink-0" />
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 pl-5">
                {startAddress?.displayAddress || 'Đang xác định địa chỉ...'}
              </p>
            </div>

            {/* Coordinates Display */}
            <div className="pt-2 flex items-center justify-between border-t border-gray-100 dark:border-white/5 text-[11px] font-mono text-gray-500">
              <span className="text-gray-400">Tọa độ:</span>
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                {lat.toFixed(6)}, {lng.toFixed(6)}
              </span>
            </div>
          </div>

          {/* End Point (D) Card */}
          <div
            className={`p-4 rounded-2xl border space-y-2.5 transition-colors ${
              isDark ? 'bg-white/[0.03] border-white/10' : 'bg-white border-gray-200 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#dc2626] text-white font-mono font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                  D
                </span>
                <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                  {t('survey.end_point')}
                </span>
              </div>
              <button
                type="button"
                onClick={handleGetEndLocation}
                className="text-[11px] font-bold text-[#007b8b] dark:text-[#00c4de] hover:underline flex items-center gap-1 cursor-pointer transition-colors"
              >
                <NavigationArrow size={13} weight="bold" />
                <span>{t('survey.lbl_current_loc', 'Lấy GPS')}</span>
              </button>
            </div>

            {/* Resolved Address Box */}
            <div className="space-y-1 pt-0.5">
              <div className="flex items-center gap-1.5">
                <FlagCheckered size={14} className="text-[#dc2626] shrink-0" weight="bold" />
                <span className="font-bold text-sm text-gray-900 dark:text-white truncate">
                  {endAddress?.roadName || 'Điểm kết thúc dự kiến'}
                </span>
                {isResolvingEnd && (
                  <CircleNotch size={12} className="animate-spin text-[#dc2626] shrink-0" />
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 pl-5">
                {endAddress?.displayAddress || 'Đang xác định địa chỉ...'}
              </p>
            </div>

            {/* Coordinates Display */}
            <div className="pt-2 flex items-center justify-between border-t border-gray-100 dark:border-white/5 text-[11px] font-mono text-gray-500">
              <span className="text-gray-400">Tọa độ:</span>
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                {endLat != null && endLng != null
                  ? `${endLat.toFixed(6)}, ${endLng.toFixed(6)}`
                  : 'Đang ước lượng...'}
              </span>
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
            <div className="flex items-center gap-2">
              <MapPin size={18} className="text-[#007b8b] dark:text-[#00c4de]" weight="bold" />
              <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                {t('survey.start_point')}
              </span>
            </div>
            <button
              type="button"
              onClick={handleGetStartLocation}
              className="text-[11px] font-bold text-[#007b8b] dark:text-[#00c4de] hover:underline flex items-center gap-1 cursor-pointer transition-colors"
            >
              <NavigationArrow size={13} weight="bold" />
              <span>{t('survey.lbl_current_loc', 'Lấy GPS')}</span>
            </button>
          </div>

          <div className="space-y-1 pt-0.5">
            <div className="flex items-center gap-1.5">
              <MapPin size={14} className="text-[#007b8b] dark:text-[#00c4de] shrink-0" weight="bold" />
              <span className="font-bold text-sm text-gray-900 dark:text-white truncate">
                {startAddress?.roadName || 'Địa chỉ biển báo'}
              </span>
              {isResolvingStart && (
                <CircleNotch size={12} className="animate-spin text-[#007b8b] dark:text-[#00c4de] shrink-0" />
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 pl-5">
              {startAddress?.displayAddress || 'Đang xác định địa chỉ...'}
            </p>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-gray-100 dark:border-white/5 text-[11px] font-mono text-gray-500">
            <span className="text-gray-400">Tọa độ:</span>
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              {lat.toFixed(6)}, {lng.toFixed(6)}
            </span>
          </div>
        </div>
      )}

      {/* 3. Interactive Map Preview (Mobile Parity: MapView with S & D pins and Route Line) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase font-mono flex items-center gap-1.5">
            <MapPin size={16} className="text-[#007b8b] dark:text-[#00c4de]" weight="bold" />
            <span>{t('survey.route_map_preview')}</span>
          </label>
          {isVideo && estimatedDistance != null && (
            <span className="text-[11px] font-mono text-gray-500 font-semibold">
              Chiều dài ước tính: ~{estimatedDistance} m
            </span>
          )}
        </div>

        <PhotoLocationPicker
          mode={mode}
          lat={lat}
          lng={lng}
          endLat={endLat}
          endLng={endLng}
          onChangeLocation={onChangeLocation}
          onChangeEndLocation={onChangeEndLocation}
          height="320px"
        />
      </div>

      {/* 4. Details & Note (Mobile Parity: Capture time & Optional Note) */}
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

        {/* Note / Additional Details (Mobile Parity: Optional Note) */}
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase font-mono flex items-center gap-1.5">
            <FileText size={15} />
            <span>{t('survey.lbl_survey_note')}</span>
          </label>
          <textarea
            rows={3}
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
            placeholder={t('survey.ph_survey_note', 'Nhập chi tiết bổ sung, ghi chú thiết bị hoặc điều kiện thời tiết (tùy chọn)...')}
            className={`w-full px-3.5 py-2.5 text-xs sm:text-sm font-medium rounded-xl border outline-none transition-all resize-y ${
              isDark
                ? 'bg-black/50 border-white/15 text-white focus:border-[#00c4de]'
                : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-[#007b8b]'
            }`}
          />
        </div>
      </div>

      {/* 5. Advanced GPX Accordion (Mobile Parity) */}
      {isVideo && (
        <div
          className={`rounded-2xl border transition-all ${
            isDark ? 'border-white/10 bg-white/[0.01]' : 'border-gray-200 bg-gray-50/50'
          }`}
        >
          <button
            type="button"
            onClick={() => setIsGpxAccordionOpen((prev) => !prev)}
            className="w-full p-4 flex items-center justify-between text-left cursor-pointer"
          >
            <div className="flex items-center gap-2.5 text-xs font-bold text-gray-900 dark:text-white">
              <Compass size={18} className="text-[#007b8b] dark:text-[#00c4de]" weight="bold" />
              <span>{t('survey.advanced_gpx_accordion')}</span>
            </div>
            {isGpxAccordionOpen ? <CaretUp size={16} /> : <CaretDown size={16} />}
          </button>

          {isGpxAccordionOpen && (
            <div className="p-4 pt-0 text-xs space-y-3 border-t border-gray-100 dark:border-white/5">
              <p className="text-gray-500 text-[11px] leading-relaxed">
                Hệ thống tự động đồng bộ toạ độ S và D để sinh tệp companion GPX hợp lệ khi gửi khảo sát.
                Bạn chỉ cần đính kèm tệp GPX nếu muốn sử dụng dữ liệu ghi từ thiết bị GPS chuyên dụng.
              </p>
              <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                <span className="font-mono text-gray-600 dark:text-gray-300 font-bold truncate max-w-xs">
                  {gpxFile ? gpxFile.name : 'Tự động trích xuất từ GPS video'}
                </span>
                <label className="px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition-colors bg-white/10 hover:bg-white/15 border-white/10">
                  <span>{gpxFile ? 'Đổi tệp GPX' : 'Chọn tệp GPX (.gpx)'}</span>
                  <input
                    type="file"
                    accept=".gpx,application/gpx+xml"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && onGpxSelect?.(e.target.files[0])}
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      )}


      {/* 6. Action Footer (Back & Submit) */}
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
          disabled={isUploading}
          isLoading={isUploading}
          onClick={onSubmit}
        >
          {isUploading ? t('survey.btn_uploading') : t('survey.btn_submit_job')}
        </Button>
      </div>
    </div>
  )
}
