import type { ReactNode } from 'react'

interface PlaceholderPageProps {
  title: string
  description?: string
  icon?: ReactNode
}

export default function PlaceholderPage({
  title,
  description = 'Tính năng này đang được phát triển.',
}: PlaceholderPageProps) {
  return (
    <div className="p-6 flex items-center justify-center min-h-64">
      <div className="text-center">
        <div className="w-12 h-12 rounded-[12px] bg-[#d3f7ff] flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🚧</span>
        </div>
        <h2 className="text-sm font-semibold text-gray-900 mb-1" style={{ fontFamily: 'Public Sans, sans-serif' }}>
          {title}
        </h2>
        <p className="text-xs text-gray-400">{description}</p>
      </div>
    </div>
  )
}
