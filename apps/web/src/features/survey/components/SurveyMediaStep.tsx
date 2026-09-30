import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  VideoCamera,
  Camera,
  Compass,
  CheckCircle,
  WarningCircle,
  FileText,
} from '@phosphor-icons/react'
import { Button } from '@shared/ui'

interface SurveyMediaStepProps {
  mode: 'video_gpx' | 'photo_gps'
  onModeChange: (mode: 'video_gpx' | 'photo_gps') => void
  videoFile: File | null
  gpxFile: File | null
  photoFile: File | null
  photoPreview: string | null
  hasAutoGps: boolean
  photoLat: number
  photoLng: number
  gpxPointsCount?: number
  onPhotoSelect: (file: File) => void
  onVideoSelect: (file: File) => void
  onGpxSelect: (file: File) => void
  onNext: () => void
  isDark: boolean
}

export function SurveyMediaStep({
  mode,
  onModeChange,
  videoFile,
  gpxFile,
  photoFile,
  photoPreview,
  hasAutoGps,
  photoLat,
  photoLng,
  gpxPointsCount,
  onPhotoSelect,
  onVideoSelect,
  onGpxSelect,
  onNext,
  isDark,
}: SurveyMediaStepProps) {
  const { t } = useTranslation('common')
  const [showAdvancedGpx, setShowAdvancedGpx] = useState(false)

  const isMediaSelected = mode === 'video_gpx' ? Boolean(videoFile) : Boolean(photoFile)

  return (
    <div className="space-y-6">
      {/* Mode Selector Tabs */}
      <div
        className={`p-1.5 rounded-2xl border flex gap-2 ${
          isDark ? 'bg-white/5 border-white/10' : 'bg-gray-100 border-gray-200'
        }`}
      >
        <button
          type="button"
          onClick={() => onModeChange('video_gpx')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
            mode === 'video_gpx'
              ? isDark
                ? 'bg-[#00c4de] text-black shadow-md'
                : 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <VideoCamera size={18} weight="bold" />
          <span>{t('survey.mode_video_gpx')}</span>
        </button>

        <button
          type="button"
          onClick={() => onModeChange('photo_gps')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
            mode === 'photo_gps'
              ? isDark
                ? 'bg-[#00c4de] text-black shadow-md'
                : 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Camera size={18} weight="bold" />
          <span>{t('survey.mode_photo_gps')}</span>
        </button>
      </div>

      {/* Media Dropzone Area */}
      {mode === 'video_gpx' ? (
        <div className="space-y-4">
          <div
            className={`p-6 sm:p-8 rounded-2xl border-2 border-dashed text-center flex flex-col items-center justify-center transition-all ${
              videoFile
                ? isDark
                  ? 'border-[#00c4de] bg-[#00c4de]/5'
                  : 'border-[#007b8b] bg-[#007b8b]/5'
                : isDark
                ? 'border-white/15 bg-white/[0.02]'
                : 'border-gray-300 bg-gray-50'
            }`}
          >
            <VideoCamera size={36} className="mb-2 text-[#007b8b] dark:text-[#00c4de]" weight="bold" />
            <span className="text-sm font-extrabold text-gray-900 dark:text-white truncate max-w-sm">
              {videoFile ? videoFile.name : t('survey.drop_video_title')}
            </span>
            <span className="text-xs text-gray-500 mt-1">{t('survey.video_format_hint')}</span>
            <label className="mt-4 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors bg-white/10 hover:bg-white/15 border border-white/10">
              <span>{videoFile ? t('survey.btn_change_video') : t('survey.btn_select_video')}</span>
              <input
                type="file"
                accept="video/mp4,video/quicktime,video/x-matroska"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && onVideoSelect(e.target.files[0])}
              />
            </label>
          </div>

          {/* Video GPS / Companion GPX Card (Mobile Parity) */}
          {videoFile && (
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 transition-colors ${
                hasAutoGps || gpxFile
                  ? isDark
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : isDark
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}
            >
              {hasAutoGps || gpxFile ? (
                <CheckCircle size={22} weight="bold" className="shrink-0 mt-0.5" />
              ) : (
                <WarningCircle size={22} weight="bold" className="shrink-0 mt-0.5" />
              )}
              <div className="flex-1 text-xs">
                <p className="font-bold">
                  {hasAutoGps || gpxFile
                    ? t('survey.gps_detected_title')
                    : t('survey.no_gps_title')}
                </p>
                <p className="opacity-90 mt-0.5">
                  {hasAutoGps || gpxFile
                    ? t('survey.gps_detected_desc', {
                        lat: photoLat.toFixed(5),
                        lng: photoLng.toFixed(5),
                      })
                    : t('survey.no_gps_desc')}
                </p>
                {!hasAutoGps && !gpxFile && (
                  <p className="mt-1.5 text-[11px] opacity-75 italic">
                    💡 Bạn vẫn có thể bấm &quot;{t('survey.btn_next_step')}&quot; bên dưới để chọn toạ độ trên bản đồ.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Advanced GPX & Companion Telemetry Toggle (Mobile Parity) */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowAdvancedGpx((prev) => !prev)}
              className="text-xs font-bold text-[#007b8b] dark:text-[#00c4de] hover:underline cursor-pointer flex items-center gap-1.5"
            >
              <Compass size={16} weight="bold" />
              <span>
                {showAdvancedGpx
                  ? t('survey.advanced_gpx_hide')
                  : t('survey.advanced_gpx_toggle')}
              </span>
            </button>

            {showAdvancedGpx && (
              <div
                className={`mt-3 p-5 rounded-2xl border-2 border-dashed text-center flex flex-col items-center justify-center transition-all ${
                  gpxFile
                    ? isDark
                      ? 'border-[#00c4de] bg-[#00c4de]/5'
                      : 'border-[#007b8b] bg-[#007b8b]/5'
                    : isDark
                    ? 'border-white/15 bg-white/[0.02]'
                    : 'border-gray-300 bg-gray-50'
                }`}
              >
                <Compass size={28} className="mb-1 text-[#007b8b] dark:text-[#00c4de]" weight="bold" />
                <span className="text-xs font-extrabold text-gray-900 dark:text-white truncate max-w-sm">
                  {gpxFile ? gpxFile.name : t('survey.drop_gpx_title')}
                </span>
                <span className="text-[11px] text-gray-500 mt-0.5">
                  {gpxPointsCount
                    ? `${gpxPointsCount} toạ độ hành trình sẵn sàng`
                    : t('survey.gpx_format_hint')}
                </span>
                <label className="mt-3 px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors bg-white/10 hover:bg-white/15 border border-white/10">
                  <span>{gpxFile ? t('survey.btn_change_gpx') : t('survey.btn_select_gpx')}</span>
                  <input
                    type="file"
                    accept=".gpx,application/gpx+xml,.jpg,.jpeg,.png,.json"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && onGpxSelect(e.target.files[0])}
                  />
                </label>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Photo Mode */
        <div className="space-y-4">
          <div
            className={`p-6 sm:p-8 rounded-2xl border-2 border-dashed text-center flex flex-col items-center justify-center ${
              photoFile
                ? isDark
                  ? 'border-[#00c4de] bg-[#00c4de]/5'
                  : 'border-[#007b8b] bg-[#007b8b]/5'
                : isDark
                ? 'border-white/15 bg-white/[0.02]'
                : 'border-gray-300 bg-gray-50'
            }`}
          >
            {photoPreview ? (
              <div className="space-y-3">
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="max-h-56 rounded-xl object-contain mx-auto border border-white/10 shadow-sm"
                />
                <p className="text-xs font-bold text-gray-900 dark:text-white flex items-center justify-center gap-1.5">
                  <FileText size={15} />
                  <span>{photoFile?.name}</span>
                </p>
              </div>
            ) : (
              <>
                <Camera size={36} className="mb-2 text-[#007b8b] dark:text-[#00c4de]" weight="bold" />
                <span className="text-sm font-extrabold text-gray-900 dark:text-white">
                  {t('survey.drop_photo_title')}
                </span>
                <span className="text-xs text-gray-500 mt-1">{t('survey.photo_format_hint')}</span>
              </>
            )}
            <label className="mt-4 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors bg-white/10 hover:bg-white/15 border border-white/10">
              <span>{photoFile ? t('survey.btn_change_photo') : t('survey.btn_select_photo')}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && onPhotoSelect(e.target.files[0])}
              />
            </label>
          </div>

          {/* Photo EXIF GPS Card (Mobile Parity) */}
          {photoFile && (
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 transition-colors ${
                hasAutoGps
                  ? isDark
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : isDark
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}
            >
              {hasAutoGps ? (
                <CheckCircle size={22} weight="bold" className="shrink-0 mt-0.5" />
              ) : (
                <WarningCircle size={22} weight="bold" className="shrink-0 mt-0.5" />
              )}
              <div className="flex-1 text-xs">
                <p className="font-bold">
                  {hasAutoGps ? t('survey.gps_detected_title') : t('survey.no_gps_title')}
                </p>
                <p className="opacity-90 mt-0.5">
                  {hasAutoGps
                    ? t('survey.gps_detected_desc', {
                        lat: photoLat.toFixed(5),
                        lng: photoLng.toFixed(5),
                      })
                    : t('survey.no_gps_desc')}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Next Step CTA */}
      <div className="pt-4 flex justify-end">
        <Button
          type="button"
          variant="primary"
          size="lg"
          disabled={!isMediaSelected}
          onClick={onNext}
        >
          {t('survey.btn_next_step')}
        </Button>
      </div>
    </div>
  )
}
