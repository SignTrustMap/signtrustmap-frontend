import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { UnexpectedErrorCanvas } from '@shared/ui'

export default function UnexpectedError500Page() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <UnexpectedErrorCanvas
      code="500"
      title={t('unexpected_error_500.title')}
      description={t('unexpected_error_500.desc')}
      layoutVariant="fullscreen"
      showBackgroundMesh={true}
      onReload={() => window.location.reload()}
      reloadText={t('unexpected_error_500.btn_retry')}
      onHome={() => navigate('/')}
      homeUrl="/"
      homeText={t('unexpected_error_500.btn_home')}
    />
  )
}
