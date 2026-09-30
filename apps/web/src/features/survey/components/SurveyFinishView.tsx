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
  submissionId,
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

        {submissionId && (
          <p className="font-mono text-xs text-gray-500 font-bold pt-1">
            Reference {submissionId.slice(0, 8)} •{' '}
            <span className="text-[#007b8b] dark:text-[#00c4de] uppercase font-black">
              {status}
            </span>
          </p>
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
