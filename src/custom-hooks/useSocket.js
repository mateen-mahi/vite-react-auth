import { useEffect, useState } from 'react';
import socket from '../socket/socket.js';

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [socketId, setSocketId] = useState(socket.id);
  const [connectionError, setConnectionError] = useState(null);

  useEffect(() => {
    const onConnect = () => {
      console.log("✅ Socket connected successfully");
      setIsConnected(true);
      setSocketId(socket.id);
      setConnectionError(null);
    };

    const onDisconnect = () => {
      console.log("❌ Socket disconnected");
      setIsConnected(false);
      setSocketId(null);
    };

    const onConnectError = (err) => {
      console.error("❌ Socket connection error:", err.message);
      setConnectionError(err.message);
      setIsConnected(false);
    };

    // Add event listeners
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);

    // Cleanup listeners on unmount
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
    };
  }, []);

  // Helper functions
  const connectSocket = (authData) => {
    if (authData) {
      socket.auth = authData;
    }
    socket.connect();
  };

  const disconnectSocket = () => {
    if (socket.connected) {
      socket.disconnect();
    }
  };

  const emitEvent = (event, data) => {
    if (socket.connected) {
      socket.emit(event, data);
      return true;
    } else {
      console.warn("Socket not connected, can't emit event:", event);
      return false;
    }
  };

  const onEvent = (event, callback) => {
    socket.on(event, callback);
    // Return cleanup function
    return () => {
      socket.off(event, callback);
    };
  };

  return { 
    socket,
    isConnected, 
    socketId, 
    connectionError,
    connectSocket,
    disconnectSocket,
    emitEvent,
    onEvent
  };
};