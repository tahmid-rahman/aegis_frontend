// types/notification.ts
export interface Notification {
  id: string;
  type: 'emergency' | 'system' | 'message' | 'alert';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  created_at: string;
  emergency_id?: string;
  responder_id?: string;
}

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
}