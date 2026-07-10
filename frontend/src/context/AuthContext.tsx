import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { authApi } from "../api/auth";
import { tokenStorage } from "../api/client";
import type { User } from "../types";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      if (tokenStorage.getAccess()) {
        try {
          const me = await authApi.me();
          setUser(me);
        } catch {
          tokenStorage.clear();
        }
      }
      setIsLoading(false);
    };
    bootstrap();
  }, []);

  const login = async (email: string, password: string) => {
    const tokens = await authApi.login({ email, password });
    tokenStorage.set(tokens.access_token, tokens.refresh_token);
    const me = await authApi.me();
    setUser(me);
  };

  const register = async (email: string, password: string, fullName: string) => {
    await authApi.register({ email, password, full_name: fullName });
    await login(email, password);
  };

  const logout = () => {
    tokenStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
