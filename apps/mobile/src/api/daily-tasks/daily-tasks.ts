import { API_PATHS } from '@/api/api';
import { apiRequest } from '@/api/api-client';
import type {
  DailyTask,
  DailyTaskCompletion,
  MissionsProgressResponse,
} from '@/types/dailyTaskType';

/**
 * Fetches all active daily tasks with contributor progress and claimability.
 */
export function getDailyTasks(accessToken: string, signal?: AbortSignal) {
  return apiRequest<{ tasks: DailyTask[]; completions?: DailyTaskCompletion[] } | DailyTask[]>(
    API_PATHS.DAILY_TASKS,
    { signal },
    accessToken,
  );
}

/**
 * Fetches current authenticated user's task completions for a specific date (YYYY-MM-DD).
 */
export function getMyTaskCompletions(
  date: string,
  accessToken: string,
  signal?: AbortSignal,
) {
  const query = new URLSearchParams({ date });
  return apiRequest<DailyTaskCompletion[]>(
    `${API_PATHS.DAILY_TASKS_COMPLETIONS_ME}?${query.toString()}`,
    { signal },
    accessToken,
  );
}

/**
 * Fetches authenticated user's daily and weekly mission progress, current streak, and badges.
 */
export function getMyMissionsProgress(accessToken: string, signal?: AbortSignal) {
  return apiRequest<MissionsProgressResponse>(
    API_PATHS.DAILY_TASKS_MISSIONS_ME,
    { signal },
    accessToken,
  );
}

/**
 * Claims credit rewards for an accomplished daily task.
 */
export function claimDailyTaskReward(
  taskId: number | string,
  accessToken: string,
  signal?: AbortSignal,
) {
  return apiRequest<{ success: boolean; creditsAwarded?: number; message?: string }>(
    `${API_PATHS.DAILY_TASKS}/${taskId}/claim`,
    {
      method: 'POST',
      signal,
    },
    accessToken,
  );
}
