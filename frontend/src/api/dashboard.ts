import { apiClient } from './client';

export const dashboardApi = {
  getSummary: (params?: { week_start_date?: string }) =>
    apiClient.get('/dashboard', { params }),
};