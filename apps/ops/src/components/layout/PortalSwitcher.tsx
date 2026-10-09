import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'
import { ArrowsLeftRight, ShieldStar } from '@phosphor-icons/react'

export function PortalSwitcher() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Only visible for admin
  if (user?.role !== 'admin') return null

  const isOnAdmin = window.location.pathname.startsWith('/admin')

  return (
    <div className="flex items-center gap-1 bg-[#F8F7F7] border border-[#E8E4E3] rounded-full px-1 py-0.5">
      <button
        onClick={() => navigate('/map')}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
          !isOnAdmin
            ? 'bg-white text-[#007b8b] shadow-sm border border-[#E8E4E3]'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        Vận hành
      </button>
      <ArrowsLeftRight size={12} className="text-gray-400 shrink-0" />
      <button
        onClick={() => navigate('/admin')}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
          isOnAdmin
            ? 'bg-white text-[#007b8b] shadow-sm border border-[#E8E4E3]'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        <ShieldStar size={12} />
        Admin
      </button>
    </div>
  )
}
