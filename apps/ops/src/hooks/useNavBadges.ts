import { useState, useEffect, useCallback, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'
import { escalationService } from '@/api/services/escalation.service'
import { catalogService } from '@/api/services/catalog.service'
import { revalidationService } from '@/api/services/revalidation.service'
import { http } from '@/api/client'
import { API_ENDPOINTS } from '@/api/endpoints'

export interface NavBadges {
  escalations?: number
  candidates?: number
  tasks?: number
  newTypes?: number
}

function extractTotal(res: any): number {
  if (typeof res?.total === 'number') return res.total
  if (typeof res?.data?.total === 'number') return res.data.total
  if (typeof res?.meta?.total === 'number') return res.meta.total
  if (Array.isArray(res?.items)) return res.items.length
  if (Array.isArray(res?.data)) return res.data.length
  if (Array.isArray(res)) return res.length
  return 0
}

/**
 * Custom hook to dynamically fetch and keep navigation badge counts synchronized
 * with live backend queues for both Admin and Staff users.
 */
export function useNavBadges() {
  const { user, isAuthenticated } = useAuth()
  const location = useLocation()
  const [badges, setBadges] = useState<NavBadges>({})
  const lastFetchTimeRef = useRef<number>(0)
  const abortControllerRef = useRef<AbortController | null>(null)

  const isAdmin = user?.role === 'admin'

  const fetchBadges = useCallback(async (force = false) => {
    if (!isAuthenticated) {
      setBadges({})
      return
    }

    const now = Date.now()
    // Throttle automatic refetches if triggered within 3 seconds unless forced
    if (!force && now - lastFetchTimeRef.current < 3000) {
      return
    }
    lastFetchTimeRef.current = now

    // Cancel any previous in-flight badge fetch
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      if (isAdmin) {
        // Admin workflow: Fetch pending escalations queue with fast 8s timeout and abort signal
        const escRes = await escalationService
          .getCases(
            { status: 'PENDING', page: 1, pageSize: 1 },
            { timeout: 8000, signal: controller.signal }
          )
          .catch(() => null)

        if (controller.signal.aborted) return

        if (escRes) {
          const totalEscalations = extractTotal(escRes)
          setBadges((prev) => ({
            ...prev,
            escalations: totalEscalations > 0 ? totalEscalations : undefined,
          }))
        }
      } else {
        // Staff workflow: Fetch review queue candidates, active revalidation tasks, and pending missing types in parallel
        const [candRes, tasksRes, newTypesRes] = await Promise.allSettled([
          http.get<any>(API_ENDPOINTS.MODERATION.CANDIDATES, {
            params: { page: 1, pageSize: 1 },
            timeout: 8000,
            signal: controller.signal,
          }),
          revalidationService.getTasks(
            { page: 1, pageSize: 1 },
            { timeout: 8000, signal: controller.signal }
          ),
          catalogService.getMissingReports(
            { status: 'PENDING', page: 1, pageSize: 1 },
            { timeout: 8000, signal: controller.signal }
          ),
        ])

        if (controller.signal.aborted) return

        const candTotal = candRes.status === 'fulfilled' ? extractTotal(candRes.value) : 0
        const tasksTotal = tasksRes.status === 'fulfilled' ? extractTotal(tasksRes.value) : 0
        const newTypesTotal = newTypesRes.status === 'fulfilled' ? extractTotal(newTypesRes.value) : 0

        setBadges((prev) => ({
          ...prev,
          candidates: candRes.status === 'fulfilled' ? (candTotal > 0 ? candTotal : undefined) : prev.candidates,
          tasks: tasksRes.status === 'fulfilled' ? (tasksTotal > 0 ? tasksTotal : undefined) : prev.tasks,
          newTypes: newTypesRes.status === 'fulfilled' ? (newTypesTotal > 0 ? newTypesTotal : undefined) : prev.newTypes,
        }))
      }
    } catch {
      // Background badge fetch fails silently on timeout/abort to avoid console noise
    }
  }, [isAuthenticated, isAdmin])

  // Initial fetch and on auth / role change
  useEffect(() => {
    fetchBadges(true)
  }, [fetchBadges])

  // Refetch when navigating between pages (e.g. after resolving items)
  useEffect(() => {
    fetchBadges(false)
  }, [location.pathname, fetchBadges])

  // Periodic polling every 60s and on window focus or custom refresh event
  useEffect(() => {
    if (!isAuthenticated) return

    const interval = setInterval(() => {
      fetchBadges(false)
    }, 60000)

    const onFocus = () => {
      fetchBadges(false)
    }

    const onCustomRefresh = () => {
      fetchBadges(true)
    }

    window.addEventListener('focus', onFocus)
    window.addEventListener('stm:refresh-badges', onCustomRefresh)

    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('stm:refresh-badges', onCustomRefresh)
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [isAuthenticated, fetchBadges])

  return {
    badges,
    refreshBadges: () => fetchBadges(true),
  }
}
