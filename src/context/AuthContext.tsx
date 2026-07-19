"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { jwtDecode } from "jwt-decode";
import type { User, AuthContextType } from "@/types";

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  /**
   * Logout user and clear stored token
   */
  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setUser(null);
    window.location.href = "/login";
  }, []);

  /**
   * Initialize user from stored token on component mount
   */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode<User>(token);
        setUser({
          id: decoded.id,
          name: decoded.name,
          email: decoded.email,
          role: decoded.role,
        });
      } catch (err) {
        console.error("Token invalid:", err);
        logout();
      }
    }
  }, [logout]);

  /**
   * Global Fetch Interceptor for 401 Unauthorized
   */
  useEffect(() => {
    if (typeof window === "undefined") return;

    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);

      // Jika response 401 dan bukan dari endpoint login
      if (response.status === 401) {
        const url = args[0] as string;
        if (typeof url === "string" && !url.includes("/api/auth/login")) {
          console.warn("Session expired (401). Auto logout...");
          logout();
        }
      }
      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [logout]);

  /**
   * Login user with email and password
   * @param email - User email
   * @param password - User password
   * @returns Promise<User> - Logged in user
   */
  const login = async (email: string, password: string): Promise<User> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login gagal");

      localStorage.setItem("token", data.token);
      const decoded = jwtDecode<User>(data.token);

      const loggedInUser: User = {
        id: decoded.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
      };

      setUser(loggedInUser);
      return loggedInUser;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };



  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook to use auth context
 * @throws Error if used outside of AuthProvider
 * @returns AuthContextType - Auth context value
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
