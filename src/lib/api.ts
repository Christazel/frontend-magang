// ============================================
// API Service Functions
// ============================================

import type { LoginRequest, LoginResponse, ApiResponse } from "@/types";

/**
 * Error handler utility
 */
function handleApiError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Terjadi kesalahan pada server";
}

/**
 * Login user with email and password
 * @param request - Login credentials (email, password)
 * @returns Promise<LoginResponse> - Token and user data
 * @throws Error if login fails
 */
export const loginUser = async (
  request: LoginRequest
): Promise<LoginResponse> => {
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.msg || "Login gagal");
    }

    return data;
  } catch (err) {
    throw new Error(handleApiError(err));
  }
};

/**
 * Example API call wrapper for future use
 * @template T - Response data type
 * @param endpoint - API endpoint
 * @param options - Fetch options
 * @returns Promise<ApiResponse<T>>
 */
export const apiCall = async <T,>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  try {
    const response = await fetch(endpoint, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "API request failed");
    }

    return data;
  } catch (err) {
    return {
      success: false,
      message: handleApiError(err),
    };
  }
};
  