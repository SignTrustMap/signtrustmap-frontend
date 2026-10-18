/**
 * Daily Tasks & Gamification Mission Types
 * Derived from SignTrustMap OpenAPI specification (/api/v1/daily-tasks)
 */

export type DailyTaskActivityType =
  | 'SURVEY_SUBMISSION'
  | 'SURVEY_REWARD'
  | 'REVALIDATION_EVIDENCE'
  | 'REVALIDATION_REWARD'
  | 'RECAPTURE_SUBMISSION'
  | 'REVIEW_VOTE'
  | 'REVIEW_REWARD'
  | 'REVIEW_CONSENSUS'
  | 'REVALIDATION_VOTE'
  | 'MISSING_TYPE_REPORT'
  | 'NAVIGATION_SESSION'
  | 'HAZARD_REPORT'
  | 'HAZARD_CONFIRM'
  | 'SIGN_CONFIRM'
  | 'DAILY_TASK_REWARD'
  | string;

export interface DailyTask {
  id: number;
  taskCode: string;
  name: string;
  description: string | null;
  targetCount: number;
  rewardCredits: number;
  activityType: DailyTaskActivityType;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DailyTaskCompletion {
  id: string;
  userId: string;
  dailyTaskId: number;
  completionDate: string; // YYYY-MM-DD
  progress: number;
  isCompleted: boolean;
  claimed: boolean;
  claimedAt: string | null;
  createdAt: string;
  updatedAt: string;
  dailyTask: DailyTask;
}

export interface MissionBadge {
  id: string;
  code: string;
  title: string;
  iconUrl?: string;
  earnedAt?: string;
}

export interface MissionsProgressResponse {
  dailyStreak: number;
  lastActiveDate?: string;
  streakFreezeAvailable?: boolean;
  dailyTasks?: DailyTaskCompletion[];
  weeklyMissions?: Array<{
    id: string;
    title: string;
    description: string;
    progress: number;
    targetCount: number;
    rewardCredits: number;
    isCompleted: boolean;
    claimed: boolean;
  }>;
  earnedBadges?: MissionBadge[];
}


/**
 * Filter daily tasks by user role
 */
export type WorkMissionRole = 'driver' | 'surveyor' | 'reviewer';
