import { Link } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'
import { LockKey, ArrowLeft, EnvelopeSimple } from '@phosphor-icons/react'

export default function NotAllowedPage() {
  const { user } = useAuth()

  return (
    <div className="min-h-[100dvh] bg-[#F8F7F7] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-[16px] bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-6">
          <LockKey size={32} weight="duotone" className="text-red-500" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Public Sans, sans-serif' }}>
          Không có quyền truy cập
        </h1>
        <p className="text-sm text-gray-500 mb-2">
          Trang này yêu cầu quyền <strong>Admin</strong>.
        </p>
        {user && (
          <p className="text-xs text-gray-400 mb-6 bg-white border border-[#E8E4E3] rounded-[8px] px-4 py-2 inline-block">
            Tài khoản: <span className="font-medium text-gray-600">{user.email}</span>{' '}
            <span className="text-[#007b8b]">({user.role})</span>
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-2 justify-center mt-4">
          <Link
            to="/map"
            className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 border border-[#E8E4E3] rounded-[4px] hover:bg-white transition-colors"
          >
            <ArrowLeft size={14} />
            Quay về Vận hành
          </Link>
          <a
            href="mailto:admin@signtrustmap.site"
            className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#007b8b] rounded-[4px] hover:bg-[#006272] transition-colors"
          >
            <EnvelopeSimple size={14} />
            Liên hệ Admin
          </a>
        </div>
      </div>
    </div>
  )
}
