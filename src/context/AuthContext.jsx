import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({
    loading: true,
    user: null,
    role: null,
  });


  const checkAuth = useCallback(async () => {
    try {
      const res = await api.get("/check-auth", { withCredentials: true });
      setAuth({
        loading: false,
        user: res.data.user,
        role: res.data.user?.role || null,
      });
    } catch {
      setAuth({
        loading: false,
        user: null,
        role: null,
      });
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <AuthContext.Provider value={{ ...auth, refreshAuth: checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);