import { createContext, useContext, useEffect, useState, useCallback } from "react";
import socket from "../socket/socket.js";
import api from "../services/api";
import { useSocket } from "../custom-hooks/useSocket.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({
    loading: true,
    user: null,
    role: null,
  });

  const { 
    isConnected, 
    socketId, 
    connectionError,
    connectSocket,
    disconnectSocket,
    emitEvent,
    onEvent 
  } = useSocket();

  const checkAuth = useCallback(async () => {
    try {
      const res = await api.get("/users/check-auth", { withCredentials: true });
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

  // Socket connection management
  useEffect(() => {
    if (!auth.loading && auth.user) {
      // Connect socket with auth data
      connectSocket({ userId: auth.user._id });
      console.log("🔌 Socket connecting for user:", auth.user._id);
    } else if (!auth.loading && !auth.user) {
      disconnectSocket();
      console.log("❌ Socket disconnected for unauthenticated user");
    }
  }, [auth.user, auth.loading, connectSocket, disconnectSocket]);

  // Log connection status
  useEffect(() => {
    if (isConnected) {
      console.log(`✅ Socket connected with ID: ${socketId}`);
    }
    if (connectionError) {
      console.error(`❌ Socket error: ${connectionError}`);
    }
  }, [isConnected, socketId, connectionError]);

  const value = {
    ...auth,
    refreshAuth: checkAuth,
    // Socket related values
    socket,
    isConnected,
    socketId,
    connectionError,
    emitEvent,
    onEvent,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);