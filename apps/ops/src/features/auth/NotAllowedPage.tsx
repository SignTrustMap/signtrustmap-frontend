import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { UnexpectedErrorCanvas } from '@shared/ui'

export default function NotAllowedPage() {
  const { t } = useTranslation('ops')
  const navigate = useNavigate()

  return (
    <UnexpectedErrorCanvas
      code="403"
      title={t('not_allowed.title')}
      description={t('not_allowed.desc')}
      layoutVariant="embedded"
      showBackgroundMesh={false}
      onBack={() => navigate(-1)}
      backText={t('not_allowed.btn_back')}
      onHome={() => navigate('/')}
      homeUrl="/"
      homeText={t('not_allowed.btn_home')}
    />
  )
}
