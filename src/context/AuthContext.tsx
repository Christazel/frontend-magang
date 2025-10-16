"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { jwtDecode } from "jwt-decode"; // gunakan named import

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type AuthContextType = {
  user: User | null;
  login: (email: string, password: string) => Promise<User>; // ✅ return User
  logout: () => void;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        setUser({
          id: decoded.id,
          name: decoded.name,
          email: decoded.email,
          role: decoded.role,
        });
      } catch (err) {
        console.error("Token invalid", err);
        logout();
      }
    }
  }, []);

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
      const decoded: any = jwtDecode(data.token);

      const loggedInUser: User = {
        id: decoded.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
      };

      setUser(loggedInUser);
      return loggedInUser; // ✅ dikembalikan
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
