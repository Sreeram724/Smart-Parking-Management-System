import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { getEffectiveSocketUrl } from "../services/api";

const SocketContext = createContext();

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketUrl = getEffectiveSocketUrl();
    const socketInstance = io(socketUrl, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 4,
      reconnectionDelay: 3000,
      timeout: 4000,
    });

    socketInstance.on("connect", () => {
      console.log("[SocketContext] Connected to realtime gateway with ID:", socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on("disconnect", () => {
      console.log("[SocketContext] Disconnected from realtime gateway");
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
