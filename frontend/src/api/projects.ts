import { apiClient } from './client';
import type { Project, ProjectCreate, ProjectUpdate } from '../types';
export const projectsApi = {
  getAll: () => apiClient.get<Project[]>('/projects'),

  create: (data: ProjectCreate) =>
    apiClient.post<Project>('/projects', data),

  update: (projectId: number, data: ProjectUpdate) =>
    apiClient.put<Project>(`/projects/${projectId}`, data),

  delete: (projectId: number) =>
    apiClient.delete(`/projects/${projectId}`),
};