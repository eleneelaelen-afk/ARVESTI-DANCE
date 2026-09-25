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
  description?: string;
  created_at?: string;
}

export interface ProfileRow {
  id: string;
  username?: string;
  password?: string;
  phone: string;
  full_name: string;
  role: UserRole;
  group_id: string | null;
  account_type: AccountType;
  payment_status: PaymentStatus;
  payment_due_date: string;
  status: StudentStatus;
  notes?: string;
  attendance_status?: AttendanceStatus;
  attendance_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LessonRow {
  id: string;
  group_id: string;
  date: string;
  date_formatted: string;
  time: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  cancellation_reason?: string;
  created_at?: string;
}

export interface AttendanceRow {
  id: string;
  lesson_id: string;
  student_id: string;
  status: AttendanceStatus;
  confirmed_at?: string;
  actual_present?: boolean;
  created_at?: string;
}

export interface DropInRequestRow {
  id: string;
  student_id: string | null;
  student_name: string;
  student_phone: string;
  group_id: string;
  lesson_id?: string | null;
  visit_date: string;
  status: DropInStatus;
  notes?: string;
  created_at?: string;
}

export interface LessonPlanRow {
  id: string;
  group_id: string;
  lesson_id?: string | null;
  date: string;
  title: string;
  warmup_notes?: string;
  technique_notes?: string;
  choreography_notes?: string;
  general_notes?: string;
  updated_at?: string;
}

export interface AppNotificationRow {
  id: string;
  target_group_id: string;
  title: string;
  message: string;
  type: 'reminder' | 'schedule' | 'urgent' | 'announcement';
  created_at?: string;
  is_read?: boolean;
}

export interface NewsRow {
  id: string;
  title: string;
  content: string;
  date: string;
  author: string;
  category: 'schedule_change' | 'payment_reminder' | 'announcement' | 'event';
  pinned?: boolean;
  created_at?: string;
}

export interface StudioDetailsRow {
  id: number;
  name: string;
  full_name: string;
  city: string;
  address: string;
  founder: string;
  founder_role: string;
  phone: string;
  contact_person: string;
  instagram: string;
  motto: string;
}

export interface StudioRuleSection {
  id: number;
  title: string;
  items: string[];
  sort_order: number;
}
