export type UserRole = 'admin' | 'student';
export type AccountType = 'subscription' | 'drop_in';
export type PaymentStatus = 'paid' | 'overdue';
export type AttendanceStatus = 'going' | 'not_going' | 'unconfirmed';
export type StudentStatus = 'active' | 'pending' | 'rejected' | 'inactive';

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
  username: string;
  password?: string;
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
  target_group_id: string;
  title: string;
  message: string;
  type: 'reminder' | 'schedule' | 'urgent' | 'announcement';
  created_at: string;
}
