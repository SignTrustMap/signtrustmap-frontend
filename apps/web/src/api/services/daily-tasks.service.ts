import { http } from '../client'

export interface DailyTaskItem {
  id: number
  taskCode: string
  name: string
  description: string | null
  rewardCredits: number
  targetCount: number
  activityType: string
  progress: number
  isCompleted: boolean
  isClaimable: boolean
  isClaimed: boolean
  claimedAt: string | null
}

export interface MissionsOverviewResponse {
  daily: {
    date: string
    missions: Array<{
      code: string
      title: string
      description: string
      progress: number
      target: number
      completed: boolean
      rewardCredits: number
      rewardGranted: boolean
    }>
  }
  weekly?: {
    title: string
    description: string
    completedMissions: number
    target: number
    completed: boolean
    bonusCredits: number
    bonusGranted: boolean
  }
  streak?: {
    title: string
    description: string
    currentDays: number
    requiredDays: number
    badgeCode: string
    badgeEarned: boolean
    bonusCredits: number
  }
}

export const dailyTasksService = {
  /**
   * Get active daily tasks with user progress from NestJS /daily-tasks
   */
  getTasks: async (): Promise<DailyTaskItem[]> => {
    try {
      const res = await http.get<DailyTaskItem[]>('/api/v1/daily-tasks')
      return Array.isArray(res) ? res : []
    } catch (err) {
      console.warn('[DailyTasks] Failed to fetch daily tasks:', err)
      return []
    }
  },

  /**
   * Get user daily and weekly missions overview + streak from /daily-tasks/missions/me
   */
  getMissions: async (): Promise<MissionsOverviewResponse | null> => {
    try {
      return await http.get<MissionsOverviewResponse>('/api/v1/daily-tasks/missions/me')
    } catch (err) {
      console.warn('[DailyTasks] Failed to fetch missions overview:', err)
      return null
    }
  },

  /**
   * Claim daily task credit reward from /daily-tasks/:id/claim
   */
  claim: async (taskId: number): Promise<{ success: boolean; creditsAwarded?: number; message?: string }> => {
    return http.post<{ success: boolean; creditsAwarded?: number; message?: string }>(
      `/api/v1/daily-tasks/${taskId}/claim`
    )
  },
}

