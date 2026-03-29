import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("cc_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const login = ({ token, name, email, id }) => {
    const userData = {
      name,
      email,
      id,
      avatar: name.slice(0, 2).toUpperCase(),
      token,
    };
    localStorage.setItem("cc_user", JSON.stringify(userData)); // keeps user info
    localStorage.setItem("token", token);                      // axios interceptor reads this
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("cc_user");
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}