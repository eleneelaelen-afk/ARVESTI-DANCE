export type UserRole = 'admin' | 'student';
export type AccountType = 'subscription' | 'drop_in';
export type PaymentStatus = 'paid' | 'overdue';
export type AttendanceStatus = 'going' | 'not_going' | 'unconfirmed';
export type StudentStatus = 'active' | 'pending' | 'rejected' | 'inactive';
export type DropInStatus = 'pending' | 'approved' | 'rejected' | 'completed';

export interface GroupRow {
  id: string;
  name: string;
  age_category: string;
  schedule: string;
  time: string;
  days_of_week: string[];
}

export interface ProfileRow {
  id: string;
  phone: string;
  full_name: string;
  role: UserRole;
  group_id: string | null;
  account_type: AccountType;
  payment_status: PaymentStatus;
  payment_due_date?: string;
  status: StudentStatus;
  notes?: string;
  created_at?: string;
}

export interface LessonRow {
  id: string;
  group_id: string;
  date: string;
  date_formatted: string;
  time: string;
  status: 'upcoming' | 'completed' | 'cancelled';
}

export interface AttendanceRow {
  id: string;
  lesson_id: string;
  student_id: string;
  status: AttendanceStatus;
  confirmed_at?: string;
}

export interface NewsRow {
  id: string;
  title: string;
  content: string;
  date: string;
  author: string;
  category: 'announcement' | 'schedule_change' | 'payment_reminder' | 'event';
  pinned?: boolean;
}

export interface AppNotificationRow {
  id: string;
  target_group_id: string; // 'all' или ID группы
  title: string;
  message: string;
  type: 'reminder' | 'schedule' | 'urgent' | 'announcement';
  created_at: string;
}

export interface StudioRuleSection {
  id: number;
  title: string;
  items: string[];
  sort_order: number;
}
