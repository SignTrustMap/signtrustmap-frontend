import { skipToken, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import {
  getDailyTasks,
  getMyMissionsProgress,
  getMyTaskCompletions,
} from '@/api/daily-tasks/daily-tasks';
import { useSession } from '@/context/session-provider';
import type {
  DailyTask,
  DailyTaskCompletion,
  MissionsProgressResponse,
  WorkMissionRole,
} from '@/types/dailyTaskType';

export const dailyTaskKeys = {
  all: (accountId: string | undefined) => ['daily-tasks', accountId] as const,
  list: (accountId: string | undefined) => [...dailyTaskKeys.all(accountId), 'list'] as const,
  completions: (accountId: string | undefined, date: string) =>
    [...dailyTaskKeys.all(accountId), 'completions', date] as const,
  missions: (accountId: string | undefined) =>
    [...dailyTaskKeys.all(accountId), 'missions'] as const,
};

function getTodayDateString(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Hook to retrieve all active daily tasks and contributor challenge list
 */
export function useGetDailyTasks(enabled = true) {
  const { session } = useSession();
  return useQuery({
    queryKey: dailyTaskKeys.list(session?.account.id),
    queryFn: session
      ? ({ signal }) => getDailyTasks(session.accessToken, signal)
      : skipToken,
    enabled: Boolean(session && enabled),
    staleTime: 60_000 * 2, // 2 minutes
  });
}

/**
 * Hook to retrieve task completions and progress for a specific date
 */
export function useGetMyTaskCompletions(date?: string, enabled = true) {
  const { session } = useSession();
  const targetDate = date ?? getTodayDateString();

  return useQuery({
    queryKey: dailyTaskKeys.completions(session?.account.id, targetDate),
    queryFn: session
      ? ({ signal }) => getMyTaskCompletions(targetDate, session.accessToken, signal)
      : skipToken,
    enabled: Boolean(session && enabled),
    staleTime: 30_000,
  });
}

/**
 * Hook to retrieve user streak, badges, and daily/weekly mission overview
 */
export function useGetMyMissions(enabled = true) {
  const { session } = useSession();
  return useQuery({
    queryKey: dailyTaskKeys.missions(session?.account.id),
    queryFn: session
      ? ({ signal }) => getMyMissionsProgress(session.accessToken, signal)
      : skipToken,
    enabled: Boolean(session && enabled),
    staleTime: 30_000,
  });
}


/**
 * Role matching predicate for a daily task
 */
export function isTaskForRole(task: DailyTask, role: WorkMissionRole): boolean {
  const act = (task.activityType || '').toUpperCase();
  const code = (task.taskCode || '').toUpperCase();

  if (role === 'surveyor') {
    return (
      act.includes('SURVEY') ||
      act.includes('REVALIDATION') ||
      act.includes('RECAPTURE') ||
      code.includes('SURVEY') ||
      code.includes('REVAL') ||
      code.includes('RECAPTURE') ||
      code.includes('CAMERA')
    );
  }

  if (role === 'reviewer') {
    return (
      act.includes('REVIEW') ||
      act.includes('CONSENSUS') ||
      act.includes('VOTE') ||
      act.includes('MISSING_TYPE') ||
      code.includes('REVIEW') ||
      code.includes('VOTE') ||
      code.includes('CONSENSUS')
    );
  }

  if (role === 'driver') {
    return (
      act.includes('NAV') ||
      act.includes('DRIVE') ||
      act.includes('HAZARD') ||
      act.includes('SIGN_CONFIRM') ||
      code.includes('NAV') ||
      code.includes('DRIVE') ||
      code.includes('HAZARD') ||
      code.includes('CONFIRM')
    );
  }

  return true;
}

/**
 * Default seeded fallback missions when backend returns empty completion list
 */
export function getFallbackMissionsForRole(role: WorkMissionRole): DailyTaskCompletion[] {
  const today = getTodayDateString();

  if (role === 'surveyor') {
    return [
      {
        id: 'fb-surveyor-1',
        userId: 'me',
        dailyTaskId: 101,
        completionDate: today,
        progress: 1,
        isCompleted: false,
        claimed: false,
        claimedAt: null,
        createdAt: today,
        updatedAt: today,
        dailyTask: {
          id: 101,
          taskCode: 'SURVEY_RUN_1',
          name: 'Nộp 1 phiên khảo sát video thực địa',
          description: 'Ghi hình tuyến đường hoặc tải video dashcam lên hệ thống AI phân tích',
          targetCount: 1,
          rewardCredits: 25,
          activityType: 'SURVEY_SUBMISSION',
          isActive: true,
          createdAt: today,
          updatedAt: today,
        },
      },
      {
        id: 'fb-surveyor-2',
        userId: 'me',
        dailyTaskId: 102,
        completionDate: today,
        progress: 0,
        isCompleted: false,
        claimed: false,
        claimedAt: null,
        createdAt: today,
        updatedAt: today,
        dailyTask: {
          id: 102,
          taskCode: 'REVAL_ON_SITE_1',
          name: 'Tái xác nhận 1 biển báo trên bản đồ',
          description: 'Đến điểm biển báo cần kiểm tra và chụp ảnh xác minh thực tế',
          targetCount: 1,
          rewardCredits: 15,
          activityType: 'REVALIDATION_EVIDENCE',
          isActive: true,
          createdAt: today,
          updatedAt: today,
        },
      },
    ];
  }

  if (role === 'reviewer') {
    return [
      {
        id: 'fb-reviewer-1',
        userId: 'me',
        dailyTaskId: 201,
        completionDate: today,
        progress: 3,
        isCompleted: false,
        claimed: false,
        claimedAt: null,
        createdAt: today,
        updatedAt: today,
        dailyTask: {
          id: 201,
          taskCode: 'REVIEW_CANDIDATES_5',
          name: 'Thẩm định 5 biển báo trong hàng đợi',
          description: 'Bỏ phiếu xác nhận hoặc đính chính biển báo do cộng đồng tải lên',
          targetCount: 5,
          rewardCredits: 15,
          activityType: 'REVIEW_VOTE',
          isActive: true,
          createdAt: today,
          updatedAt: today,
        },
      },
      {
        id: 'fb-reviewer-2',
        userId: 'me',
        dailyTaskId: 202,
        completionDate: today,
        progress: 1,
        isCompleted: true,
        claimed: false,
        claimedAt: null,
        createdAt: today,
        updatedAt: today,
        dailyTask: {
          id: 202,
          taskCode: 'REVAL_VOTE_1',
          name: 'Đánh giá 1 minh chứng tái xác thực',
          description: 'Kiểm duyệt ảnh chụp thực địa từ người khảo sát',
          targetCount: 1,
          rewardCredits: 10,
          activityType: 'REVALIDATION_VOTE',
          isActive: true,
          createdAt: today,
          updatedAt: today,
        },
      },
    ];
  }

  // Driver fallback
  return [
    {
      id: 'fb-driver-1',
      userId: 'me',
      dailyTaskId: 301,
      completionDate: today,
      progress: 1,
      isCompleted: true,
      claimed: false,
      claimedAt: null,
      createdAt: today,
      updatedAt: today,
      dailyTask: {
        id: 301,
        taskCode: 'NAV_TRIP_1',
        name: 'Hoàn thành 1 chuyến đi điều hướng an toàn',
        description: 'Bật chế độ điều hướng thông minh khi di chuyển trên đường',
        targetCount: 1,
        rewardCredits: 10,
        activityType: 'NAVIGATION_SESSION',
        isActive: true,
        createdAt: today,
        updatedAt: today,
      },
    },
    {
      id: 'fb-driver-2',
      userId: 'me',
      dailyTaskId: 302,
      completionDate: today,
      progress: 0,
      isCompleted: false,
      claimed: false,
      claimedAt: null,
      createdAt: today,
      updatedAt: today,
      dailyTask: {
        id: 302,
        taskCode: 'HAZARD_REPORT_1',
        name: 'Báo cáo hoặc xác nhận 1 sự cố đường bộ',
        description: 'Chia sẻ cảnh báo bẫy tốc độ, ổ gà hoặc sự cố cho các tài xế khác',
        targetCount: 1,
        rewardCredits: 15,
        activityType: 'HAZARD_REPORT',
        isActive: true,
        createdAt: today,
        updatedAt: today,
      },
    },
  ];
}
