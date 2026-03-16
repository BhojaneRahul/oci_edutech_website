"use client";

import { api } from "@/lib/api";
import { User } from "@/lib/types";
import { createContext, useContext, useEffect, useState } from "react";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  signup: (payload: {
    name: string;
    email: string;
    password: string;
    university: string;
    phone?: string;
    course?: string;
    semester?: string;
  }) => Promise<User>;
  logout: () => Promise<void>;
  loginWithGoogle: () => void;
  refreshUser: () => Promise<User | null>;
  setAuthUser: (user: User | null) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const response = await api.get("/auth/me");
      setUser(response.data.user);
      return response.data.user;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.post("/auth/login", { email, password });
    setUser(response.data.user);
    return response.data.user;
  };

  const signup = async (payload: {
    name: string;
    email: string;
    password: string;
    university: string;
    phone?: string;
    course?: string;
    semester?: string;
  }) => {
    const response = await api.post("/auth/register", payload);
    setUser(response.data.user);
    return response.data.user;
  };

  const logout = async () => {
    await api.post("/auth/logout");
    setUser(null);
  };

  const loginWithGoogle = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/auth/google`;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, loginWithGoogle, refreshUser, setAuthUser: setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
