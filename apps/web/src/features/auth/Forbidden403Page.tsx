import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { UnexpectedErrorCanvas } from '@shared/ui'

export default function Forbidden403Page() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <UnexpectedErrorCanvas
      code="403"
      title={t('auth_403.title')}
      description={t('auth_403.desc')}
      layoutVariant="fullscreen"
      showBackgroundMesh={true}
      onBack={() => navigate(-1)}
      backText={t('auth_403.btn_back')}
      onHome={() => navigate('/')}
      homeUrl="/"
      homeText={t('auth_403.btn_home')}
    />
  )
}
