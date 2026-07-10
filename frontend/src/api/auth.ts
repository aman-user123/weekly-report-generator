import { apiClient } from "./client";
import type { TokenPair, User, UserRole } from "../types";

export interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
  role?: UserRole;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const authApi = {
  register: (payload: RegisterPayload) =>
  apiClient.post<User>("/auth/register", {
    ...payload,
    role: payload.role ?? "TEAM_MEMBER",   // default role if not provided
  }).then((r) => r.data),


  login: (payload: LoginPayload) =>
    apiClient.post<TokenPair>("/auth/login", payload).then((r) => r.data),

  me: () => apiClient.get<User>("/auth/me").then((r) => r.data),
};
