export type NotificationType =
  | 'SIGN_MISSING_DISPATCH'
  | 'REVALIDATION_RECAPTURE_REQUESTED'
  | 'REVALIDATION_CLOSED'
  | 'CONSENSUS_RESOLVED'
  | 'HAZARD_VERIFIED'
  | 'REWARD_CREDITED'
  | string;

export interface NotificationItem {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string | null;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationListResponse {
  items: NotificationItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface UnreadCountResponse {
  unreadCount: number;
}
