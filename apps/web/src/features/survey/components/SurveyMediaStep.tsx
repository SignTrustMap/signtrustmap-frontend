import { useTranslation } from 'react-i18next'
import {
  VideoCamera,
  Camera,
  CheckCircle,
  WarningCircle,
  CircleNotch,
  FileText,
} from '@phosphor-icons/react'
import { Button } from '@shared/ui'

interface SurveyMediaStepProps {
  mode: 'video_gpx' | 'photo_gps'
  onModeChange: (mode: 'video_gpx' | 'photo_gps') => void
  videoFile: File | null
  photoFile: File | null
  photoPreview: string | null
  hasAutoGps: boolean
  photoLat?: number
  photoLng?: number
  gpxPointsCount?: number
  isAnalyzingGps?: boolean
  onPhotoSelect: (file: File) => void
  onVideoSelect: (file: File) => void
  onNext: () => void
  isDark: boolean
  gpxFile?: File | null
  onGpxSelect?: (file: File) => void
}

export function SurveyMediaStep({
  mode,
  onModeChange,
  videoFile,
  photoFile,
  photoPreview,
  hasAutoGps,
  photoLat,
  photoLng,
  gpxPointsCount,
  isAnalyzingGps = false,
  onPhotoSelect,
  onVideoSelect,
  onNext,
  isDark,
}: SurveyMediaStepProps) {
  const { t } = useTranslation('common')
  const isMediaSelected = mode === 'video_gpx' ? Boolean(videoFile) : Boolean(photoFile)
  const hasRequiredGps =
    mode === 'video_gpx'
      ? Boolean(hasAutoGps)
      : Boolean(hasAutoGps && photoLat != null && photoLng != null)
  const canProceed = Boolean(isMediaSelected && hasRequiredGps && !isAnalyzingGps)

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

          {/* Video GPS / Companion GPX Card */}
          {videoFile && (
            isAnalyzingGps ? (
              <div className="p-3.5 sm:p-4 rounded-xl border flex items-center gap-3 transition-colors bg-[#007b8b]/5 dark:bg-[#00c4de]/5 border-[#007b8b]/20 dark:border-[#00c4de]/20 text-[#007b8b] dark:text-[#00c4de]">
                <CircleNotch size={20} className="animate-spin shrink-0" />
                <div className="text-xs">
                  <p className="font-bold">{t('survey.checking_gps_title', 'Đang kiểm tra tọa độ GPS...')}</p>
                  <p className="opacity-80 text-[11px] mt-0.5">{t('survey.checking_gps_desc', 'Hệ thống đang quét siêu dữ liệu vị trí nhúng trong tệp.')}</p>
                </div>
              </div>
            ) : (
              <div
                className={`p-3.5 sm:p-4 rounded-xl border flex items-start gap-3 transition-colors ${
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
                  <CheckCircle size={22} weight="bold" className="shrink-0 mt-0.5 text-emerald-500" />
                ) : (
                  <WarningCircle size={20} weight="bold" className="shrink-0 mt-0.5 text-amber-500" />
                )}
                <div className="flex-1 text-xs">
                  <p className="font-bold">
                    {hasAutoGps
                      ? 'Đã nhận diện toạ độ GPS từ video'
                      : t('survey.no_gps_title')}
                  </p>
                  <p className="opacity-90 mt-0.5 leading-relaxed">
                    {hasAutoGps
                      ? gpxPointsCount
                        ? `Lộ trình gồm ${gpxPointsCount} toạ độ hành trình sẵn sàng trình chiếu.`
                        : t('survey.gps_detected_desc', {
                            lat: photoLat != null ? photoLat.toFixed(5) : '',
                            lng: photoLng != null ? photoLng.toFixed(5) : '',
                          })
                      : t('survey.no_gps_desc')}
                  </p>
                </div>
              </div>
            )
          )}
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
            isAnalyzingGps ? (
              <div className="p-3.5 sm:p-4 rounded-xl border flex items-center gap-3 transition-colors bg-[#007b8b]/5 dark:bg-[#00c4de]/5 border-[#007b8b]/20 dark:border-[#00c4de]/20 text-[#007b8b] dark:text-[#00c4de]">
                <CircleNotch size={20} className="animate-spin shrink-0" />
                <div className="text-xs">
                  <p className="font-bold">{t('survey.checking_gps_title', 'Đang kiểm tra tọa độ GPS...')}</p>
                  <p className="opacity-80 text-[11px] mt-0.5">{t('survey.checking_gps_desc', 'Hệ thống đang quét siêu dữ liệu vị trí nhúng trong tệp.')}</p>
                </div>
              </div>
            ) : (
              <div
                className={`p-3.5 sm:p-4 rounded-xl border flex items-start gap-3 transition-colors ${
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
                  <CheckCircle size={22} weight="bold" className="shrink-0 mt-0.5 text-emerald-500" />
                ) : (
                  <WarningCircle size={20} weight="bold" className="shrink-0 mt-0.5 text-amber-500" />
                )}
                <div className="flex-1 text-xs">
                  <p className="font-bold">
                    {hasAutoGps
                      ? t('survey.gps_detected_title')
                      : t('survey.photo_no_gps_title', 'Ảnh không có toạ độ GPS')}
                  </p>
                  <p className="opacity-90 mt-0.5 leading-relaxed">
                    {hasAutoGps
                      ? t('survey.gps_detected_desc', {
                          lat: photoLat != null ? photoLat.toFixed(5) : '',
                          lng: photoLng != null ? photoLng.toFixed(5) : '',
                        })
                      : t('survey.photo_no_gps_desc', 'Ảnh cần có toạ độ GPS trong dữ liệu EXIF để nộp khảo sát.')}
                  </p>
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* Next Step CTA */}
      <div className="pt-4 flex justify-end">
        <Button
          type="button"
          variant="primary"
          size="lg"
          disabled={!canProceed}
          onClick={onNext}
        >
          {t('survey.btn_next_step')}
        </Button>
      </div>
    </div>
  )
}
