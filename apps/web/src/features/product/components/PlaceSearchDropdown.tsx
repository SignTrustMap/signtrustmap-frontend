import { type ApiPlace } from '@shared/types'
import {
  Clock,
  BookmarkSimple,
  MapPin,
  SpinnerGap,
  House,
  Briefcase,
} from '@phosphor-icons/react'

interface PlaceSearchDropdownProps {
  query: string
  savedPlaces: ApiPlace[]
  recentSearches: ApiPlace[]
  searchResults: ApiPlace[]
  isSearching: boolean
  onSelectPlace: (place: ApiPlace) => void
  isDark: boolean
}

export function PlaceSearchDropdown({
  query,
  savedPlaces,
  recentSearches,
  searchResults,
  isSearching,
  onSelectPlace,
  isDark,
}: PlaceSearchDropdownProps) {
  const isTyping = query.trim().length >= 2

  const getPlaceIcon = (place: ApiPlace) => {
    const titleLower = place.title.toLowerCase()
    if (titleLower.includes('nhà') || titleLower.includes('home')) {
      return <House weight="fill" className="w-4 h-4 text-emerald-500" />
    }
    if (titleLower.includes('cơ quan') || titleLower.includes('công ty') || titleLower.includes('work')) {
      return <Briefcase weight="fill" className="w-4 h-4 text-blue-500" />
    }
    if (place.type === 'saved') {
      return <BookmarkSimple weight="fill" className="w-4 h-4 text-amber-500" />
    }
    return <Clock weight="regular" className="w-4 h-4 text-gray-400" />
  }

  return (
    <div
      className={`absolute left-0 right-0 top-full mt-2 rounded-2xl shadow-2xl border overflow-hidden max-h-[360px] overflow-y-auto z-[1500] backdrop-blur-md transition-all ${
        isDark
          ? 'bg-[#071317]/95 border-white/10 text-white shadow-black/60 divide-white/5'
          : 'bg-white/95 border-[#E8E4E3] text-gray-900 shadow-slate-300/60 divide-gray-100'
      }`}
    >
      {/* Search results while typing */}
      {isTyping ? (
        <div className="p-2">
          {isSearching ? (
            <div className="flex items-center justify-center gap-2 py-6 text-xs text-gray-400">
              <SpinnerGap className="w-4 h-4 animate-spin text-[#007b8b] dark:text-[#00c4de]" />
              <span>Đang tìm kiếm địa điểm...</span>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-1">
              <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Kết quả tìm kiếm ({searchResults.length})
              </div>
              {searchResults.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectPlace(item)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-3 transition-colors cursor-pointer ${
                    isDark ? 'hover:bg-white/5' : 'hover:bg-gray-100/80'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-[#007b8b]/10 dark:bg-[#00c4de]/15 text-[#007b8b] dark:text-[#00c4de] flex items-center justify-center shrink-0">
                    <MapPin weight="bold" className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold truncate">{item.title}</div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                      {item.address}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-gray-400">
              Không tìm thấy địa điểm phù hợp với &quot;{query}&quot;
            </div>
          )}
        </div>
      ) : (
        /* Default suggestions: Saved & Recent */
        <div className="p-2 divide-y divide-inherit">
          {/* Saved Places */}
          {savedPlaces.length > 0 && (
            <div className="pb-2">
              <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Địa điểm đã lưu
              </div>
              <div className="space-y-1">
                {savedPlaces.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectPlace(item)}
                    className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-3 transition-colors cursor-pointer ${
                      isDark ? 'hover:bg-white/5' : 'hover:bg-gray-100/80'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center shrink-0">
                      {getPlaceIcon(item)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold truncate">{item.title}</div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                        {item.address}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recent Searches */}
          {recentSearches.length > 0 ? (
            <div className={savedPlaces.length > 0 ? 'pt-2' : ''}>
              <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Tìm kiếm gần đây
              </div>
              <div className="space-y-1">
                {recentSearches.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectPlace(item)}
                    className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-3 transition-colors cursor-pointer ${
                      isDark ? 'hover:bg-white/5' : 'hover:bg-gray-100/80'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center shrink-0">
                      <Clock weight="regular" className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold truncate">{item.title}</div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                        {item.address || 'Địa điểm trước đó'}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : savedPlaces.length === 0 ? (
            <div className="py-6 text-center text-xs text-gray-400">
              Nhập tên đường, phường/xã hoặc quận/huyện để bắt đầu tìm đường.
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
