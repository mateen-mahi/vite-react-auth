import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({
    loading: true,
    user: null,
    role: null,
  });

  useEffect(() => {
    api
      .get("/check-auth", { withCredentials: true })
      .then((res) => {
        setAuth({
          loading: false,
          user: res.data.user,
          role: res.data.user?.role || null,
        });
      })
      .catch(() => {
        setAuth({
          loading: false,
          user: null,
          role: null,
        });
      });
  }, []);

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);