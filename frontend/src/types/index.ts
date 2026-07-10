export type UserRole = "team_member" | "manager" | "admin";
export type ReportStatus = "draft" | "submitted" | "late";

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface Project {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WeeklyReport {
  id: number;
  user_id: number;
  project_id: number;
  week_start_date: string;
  week_end_date: string;
  tasks_completed: string;
  tasks_planned: string;
  blockers: string | null;
  hours_worked: number | null;
  notes: string | null;
  status: ReportStatus;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
  project: Project;
}

export interface WeeklyReportCreate {
  project_id: number;
  week_start_date: string;
  week_end_date: string;
  tasks_completed: string;
  tasks_planned: string;
  blockers?: string | null;
  hours_worked?: number | null;
  notes?: string | null;
}

export interface WeeklyReportUpdate {
  project_id?: number;
  week_start_date?: string;
  week_end_date?: string;
  tasks_completed?: string;
  tasks_planned?: string;
  blockers?: string | null;
  hours_worked?: number | null;
  notes?: string | null;
}

export interface WeeklyReportHistoryPage {
  items: WeeklyReport[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface DashboardSummary {
  week_start_date: string;
  total_team_members: number;
  total_reports_submitted: number;
  total_pending: number;
  total_late: number;
  compliance_rate: number;
  open_blockers_count: number;
}

export interface MemberSubmissionStatus {
  user_id: number;
  full_name: string;
  email: string;
  status: ReportStatus;
  submitted_at: string | null;
  report_id: number | null;
}

export interface TaskTrendPoint {
  week_start_date: string;
  reports_submitted: number;
}

export interface ProjectWorkload {
  project_id: number;
  project_name: string;
  report_count: number;
}
export interface ProjectCreate {
  name: string;
  description?: string | null;
}

export interface ProjectUpdate {
  name?: string;
  description?: string | null;
  is_active?: boolean;
}


export interface ActivityItem {
  report_id: number;
  user_full_name: string;
  project_name: string;
  status: ReportStatus;
  week_start_date: string;
  updated_at: string;
}