import { apiClient } from './client';
import type { WeeklyReport, WeeklyReportCreate, WeeklyReportUpdate } from '../types';
export const reportsApi = {
  getMyReports: (params?: { week_start_date?: string }) =>
    apiClient.get<WeeklyReport[]>('/reports', { params }),

  getReport: (reportId: number) =>
    apiClient.get<WeeklyReport>(`/reports/${reportId}`),

  createReport: (data: WeeklyReportCreate) =>
    apiClient.post<WeeklyReport>('/reports', data),

  updateReport: (reportId: number, data: WeeklyReportUpdate) =>
    apiClient.put<WeeklyReport>(`/reports/${reportId}`, data),

  submitReport: (reportId: number) =>
    apiClient.post(`/reports/${reportId}/submit`),

  getHistory: (params?: { page?: number; page_size?: number }) =>
    apiClient.get('/reports/history', { params }),
};