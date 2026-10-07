import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { UnexpectedErrorCanvas } from '@shared/ui'

export default function NotFound404Page() {
  const { t } = useTranslation('ops')
  const navigate = useNavigate()

  return (
    <UnexpectedErrorCanvas
      code="404"
      title={t('not_found_404.title')}
      description={t('not_found_404.desc')}
      layoutVariant="embedded"
      showBackgroundMesh={false}
      onHome={() => navigate('/')}
      homeUrl="/"
      homeText={t('not_found_404.btn_home')}
      onBack={() => navigate(-1)}
      backText={t('not_found_404.btn_back')}
    />
  )
}
