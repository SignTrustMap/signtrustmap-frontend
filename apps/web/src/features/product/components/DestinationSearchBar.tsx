import { useState, useRef, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { MagnifyingGlass, X, NavigationArrow } from '@phosphor-icons/react'
import type { ApiPlace } from '@shared/types'
import { placesService } from '@/api/services/places.service'
import { PlaceSearchDropdown } from './PlaceSearchDropdown'

interface DestinationSearchBarProps {
  onSelectDestination: (place: ApiPlace) => void
  selectedDestination: ApiPlace | null
  onClearDestination: () => void
  isDark: boolean
}

export function DestinationSearchBar({
  onSelectDestination,
  selectedDestination,
  onClearDestination,
  isDark,
}: DestinationSearchBarProps) {
  const { t } = useTranslation('product')
  const [query, setQuery] = useState(selectedDestination?.title || '')
  const [isOpen, setIsOpen] = useState(false)
  const [savedPlaces, setSavedPlaces] = useState<ApiPlace[]>([])
  const [recentSearches, setRecentSearches] = useState<ApiPlace[]>([])
  const [searchResults, setSearchResults] = useState<ApiPlace[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const isInputFocusedRef = useRef(false)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Synchronize search input text when selectedDestination changes externally
  useEffect(() => {
    if (!selectedDestination) {
      setQuery('')
    } else if (!isInputFocusedRef.current && selectedDestination.title) {
      setQuery(selectedDestination.title)
    }
  }, [selectedDestination])

  // Load initial saved & recent places
  const loadUserPlaces = useCallback(async () => {
    try {
      const [saved, recent] = await Promise.all([
        placesService.getSavedPlaces(),
        placesService.getRecentSearches(10),
      ])

      setSavedPlaces(
        saved.map((p) => ({
          id: p.id,
          title: p.label,
          address: p.address,
          latitude: p.latitude,
          longitude: p.longitude,
          type: 'saved',
        }))
      )

      setRecentSearches(
        recent.map((r) => ({
          id: r.id,
          title: r.query,
          address: r.address,
          latitude: r.latitude,
          longitude: r.longitude,
          type: 'recent',
        }))
      )
    } catch (err) {
      console.warn('[Places] Could not load user places:', err)
    }
  }, [])

  useEffect(() => {
    loadUserPlaces()
  }, [loadUserPlaces])

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const executeSearch = useCallback(async (val: string) => {
    const trimmed = val.trim()
    if (trimmed.length < 2) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    try {
      const results = await placesService.searchAddresses(trimmed, 10)
      setSearchResults(results)
    } catch {
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  // Debounced search when query changes
  const handleQueryChange = (val: string) => {
    setQuery(val)
    setIsOpen(true)

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)

    // When the user clears the search text, immediately dismiss route & destination panels
    if (val.trim() === '') {
      setSearchResults([])
      setIsSearching(false)
      if (selectedDestination) {
        onClearDestination()
      }
      return
    }

    if (val.trim().length < 2) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    debounceTimerRef.current = setTimeout(() => {
      executeSearch(val)
    }, 300)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (searchResults.length > 0) {
        handleSelectPlace(searchResults[0])
      } else {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
        executeSearch(query)
      }
    }
  }

  const handleSelectPlace = (place: ApiPlace) => {
    setQuery(place.title)
    setIsOpen(false)
    onSelectDestination(place)
    // Persist to recent searches
    placesService.saveRecentSearch(place)
  }

  const handleClear = () => {
    setQuery('')
    setSearchResults([])
    setIsOpen(false)
    onClearDestination()
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-md pointer-events-auto"
    >
      <div
        className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl shadow-xl border backdrop-blur-md transition-all ${
          isDark
            ? 'bg-[#071317]/90 border-white/15 text-white shadow-black/40 focus-within:border-[#00c4de]'
            : 'bg-white/95 border-[#E8E4E3] text-gray-900 shadow-slate-300/50 focus-within:border-[#007b8b]'
        }`}
      >
        <div className="w-8 h-8 rounded-xl bg-[#007b8b]/10 dark:bg-[#00c4de]/15 text-[#007b8b] dark:text-[#00c4de] flex items-center justify-center shrink-0">
          {selectedDestination ? (
            <NavigationArrow weight="fill" className="w-4 h-4 text-[#007b8b] dark:text-[#00c4de]" />
          ) : (
            <MagnifyingGlass weight="bold" className="w-4 h-4 text-[#007b8b] dark:text-[#00c4de]" />
          )}
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            isInputFocusedRef.current = true
            setIsOpen(true)
            loadUserPlaces()
            if (query.trim().length >= 2 && searchResults.length === 0 && !isSearching) {
              executeSearch(query)
            }
          }}
          onBlur={() => {
            isInputFocusedRef.current = false
          }}
          placeholder={t(
            'map_page.destination_search_placeholder',
            'Tìm kiếm trên SignTrustMap'
          )}
          className="flex-1 bg-transparent text-xs sm:text-sm font-medium outline-hidden placeholder:text-gray-400 placeholder:text-xs"
        />

        {query || selectedDestination ? (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
            title={t('map_page.clear_search', 'Xóa tìm kiếm')}
          >
            <X className="w-4 h-4" />
          </button>
        ) : null}
      </div>

      {isOpen && (
        <PlaceSearchDropdown
          query={query}
          savedPlaces={savedPlaces}
          recentSearches={recentSearches}
          searchResults={searchResults}
          isSearching={isSearching}
          onSelectPlace={handleSelectPlace}
          isDark={isDark}
        />
      )}
    </div>
  )
}
