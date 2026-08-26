import { MapTrifold, FunnelSimple, MagnifyingGlass, ArrowSquareOut } from '@phosphor-icons/react'
import { useState } from 'react'

const SIGN_GROUPS = [
  'Tất cả',
  'Biển báo cấm',
  'Biển hiệu lệnh',
  'Biển cảnh báo',
  'Biển chỉ dẫn',
  'Biển phụ',
]

export default function MapPage() {
  const [activeGroup, setActiveGroup] = useState('Tất cả')

  return (
    <div className="flex flex-col h-full">
      {/* Filter bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-[#E8E4E3] bg-white shrink-0 overflow-x-auto">
        {/* Search */}
        <div className="relative flex-shrink-0">
          <MagnifyingGlass
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="search"
            placeholder="Tìm biển báo..."
            className="pl-8 pr-3 py-1.5 text-xs rounded-[4px] border border-[#E8E4E3] bg-white w-44 focus:outline-none focus:border-[#007b8b] transition-colors"
          />
        </div>

        {/* Group pills */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {SIGN_GROUPS.map((g) => (
            <button
              key={g}
              onClick={() => setActiveGroup(g)}
              className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors whitespace-nowrap ${
                activeGroup === g
                  ? 'bg-[#007b8b] text-white border-[#007b8b]'
                  : 'bg-white text-gray-600 border-[#E8E4E3] hover:border-[#007b8b] hover:text-[#007b8b]'
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2 flex-shrink-0">
          <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-600 border border-[#E8E4E3] rounded-[4px] hover:border-[#007b8b] hover:text-[#007b8b] transition-colors">
            <FunnelSimple size={13} />
            Lọc nâng cao
          </button>
          <a
            href="/"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-600 border border-[#E8E4E3] rounded-[4px] hover:border-[#007b8b] hover:text-[#007b8b] transition-colors"
          >
            <ArrowSquareOut size={13} />
            Toàn màn hình
          </a>
        </div>
      </div>

      {/* Map canvas */}
      <div className="flex-1 relative bg-[#e8f4f6]">
        {/* Simulated tile pattern */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'linear-gradient(rgba(0,123,139,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(0,123,139,0.12) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        {/* Sample markers */}
        {[
          { top: '35%', left: '45%', label: 'R.301', trust: 95 },
          { top: '50%', left: '55%', label: 'P.102', trust: 88 },
          { top: '60%', left: '35%', label: 'W.201', trust: 72 },
          { top: '40%', left: '65%', label: 'I.407', trust: 99 },
        ].map((m) => (
          <button
            key={m.label}
            style={{ top: m.top, left: m.left }}
            className="absolute -translate-x-1/2 -translate-y-1/2 group"
            title={`${m.label} — Trust ${m.trust}%`}
          >
            <div className={`w-5 h-5 rounded-full border-2 border-white shadow-md flex items-center justify-center transition-transform group-hover:scale-125 ${
              m.trust >= 90 ? 'bg-[#007b8b]' : m.trust >= 75 ? 'bg-amber-500' : 'bg-red-500'
            }`}>
              <MapTrifold size={10} weight="fill" className="text-white" />
            </div>
          </button>
        ))}

        {/* Info overlay */}
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-[8px] border border-[#E8E4E3] px-3 py-2 text-xs text-gray-600 shadow-sm">
          <span className="font-semibold text-gray-900">142,381</span> biển báo •{' '}
          <span className="font-semibold text-gray-900">{activeGroup}</span>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm rounded-[8px] border border-[#E8E4E3] px-3 py-2 shadow-sm flex flex-col gap-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">Trust Score</p>
          {[
            { color: 'bg-[#007b8b]', label: '≥ 90%' },
            { color: 'bg-amber-500', label: '75–89%' },
            { color: 'bg-red-500', label: '< 75%' },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${l.color}`} />
              <span className="text-[10px] text-gray-600">{l.label}</span>
            </div>
          ))}
        </div>

        {/* Leaflet placeholder note */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-amber-50 border border-amber-200 rounded-[8px] px-3 py-1.5 text-[11px] text-amber-700 shadow-sm whitespace-nowrap">
          Leaflet map integration — install react-leaflet để mount bản đồ thật
        </div>
      </div>
    </div>
  )
}
