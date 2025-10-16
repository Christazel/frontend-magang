// src/lib/api.ts
export const loginUser = async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
  
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || "Login gagal");
  
      return data; // token dan user
    } catch (err) {
      throw err;
    }
  };
  