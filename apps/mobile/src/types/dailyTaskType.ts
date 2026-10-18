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

export interface BackendDailyMission {
  code: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  completed: boolean;
  rewardCredits: number;
  rewardGranted?: boolean;
  repeatable?: boolean;
}

export interface BackendWeeklyMission {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  completedMissions: number;
  target: number;
  completed: boolean;
  bonusCredits: number;
  bonusGranted?: boolean;
}

export interface BackendStreakInfo {
  title: string;
  description: string;
  currentDays: number;
  requiredDays: number;
  badgeCode: string;
  badgeEarned: boolean;
  badgeEarnedAt?: string | null;
  bonusCredits: number;
  badges?: Array<{
    code: string;
    earnedAt: string;
  }>;
}

export interface MissionsProgressResponse {
  timeZone?: string;
  dailyStreak: number;
  daily?: {
    date: string;
    missions: BackendDailyMission[];
  };
  weekly?: BackendWeeklyMission;
  streak?: BackendStreakInfo;
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
 * Normalized mission format for unified rendering
 */
export interface GenericMissionItem {
  id: string;
  code?: string;
  title: string;
  description?: string | null;
  progress: number;
  targetCount: number;
  rewardCredits: number;
  isCompleted: boolean;
  claimed?: boolean;
  activityType?: DailyTaskActivityType;
  actionUrl?: string;
  periodLabel?: string;
}

/**
 * Filter daily tasks by user role
 */
export type WorkMissionRole = 'driver' | 'surveyor' | 'reviewer';

