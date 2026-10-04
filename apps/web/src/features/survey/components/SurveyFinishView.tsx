import { CheckCircle, Plus, Compass } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Button } from '@shared/ui'

interface SurveyFinishViewProps {
  submissionId?: string
  status?: string
  isDark: boolean
  onReset: () => void
}

export function SurveyFinishView({
  submissionId: _submissionId,
  status = 'QUEUED',
  isDark: _isDark,
  onReset,
}: SurveyFinishViewProps) {
  const { t } = useTranslation('common')
  const navigate = useNavigate()

  return (
    <div className="max-w-xl mx-auto py-12 px-4 text-center space-y-6">
      {/* Icon */}
      <div className="w-20 h-20 rounded-full bg-emerald-500/15 text-emerald-500 mx-auto flex items-center justify-center">
        <CheckCircle size={48} weight="fill" />
      </div>

      {/* Copy */}
      <div className="space-y-2">
        <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
          {t('survey.finish_title', 'Chuyến khảo sát đã gửi thành công')}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
          {t(
            'survey.finish_desc',
            'Dữ liệu của bạn đã được tải lên máy chủ an toàn và được đưa vào hàng đợi AI trích xuất biển báo.'
          )}
        </p>

        {status && (
          <div className="pt-2 flex justify-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#007b8b]/10 dark:bg-[#00c4de]/10 text-[#007b8b] dark:text-[#00c4de] border border-[#007b8b]/20 dark:border-[#00c4de]/20 uppercase">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Trạng thái: {status}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
        <Button
          variant="primary"
          size="lg"
          onClick={onReset}
          leftIcon={<Plus size={18} weight="bold" />}
          className="w-full sm:w-auto"
        >
          {t('survey.btn_submit_another', 'Tải lên chuyến khác')}
        </Button>

        <Button
          variant="outline"
          size="lg"
          onClick={() => navigate('/survey/history')}
          leftIcon={<Compass size={18} weight="bold" />}
          className="w-full sm:w-auto"
        >
          {t('survey.btn_view_telemetry_history', 'Theo dõi tiến trình AI và lịch sử')}
        </Button>
      </div>
    </div>
  )
}
