import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { playStationChime } from '../utils/audio';

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'http://localhost:5000');

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [liveTrains, setLiveTrains] = useState([]);
  const [liveAlerts, setLiveAlerts] = useState([]);

  useEffect(() => {
    const socketInstance = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socketInstance.on('connect', () => {
      console.log('⚡ Connected to Real-time Railway WebSocket Server');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('⚠ Disconnected from Railway WebSocket Server');
      setIsConnected(false);
    });

    socketInstance.on('initial_tracking_state', (trains) => {
      setLiveTrains(trains);
    });

    socketInstance.on('train_tracking_update', (trains) => {
      setLiveTrains(trains);
    });

    socketInstance.on('schedule_update', (update) => {
      // Play station chime for alerts
      if (update.delayMinutes > 0) {
        playStationChime();
      }

      // Add real-time visual toast alert
      const alert = {
        id: Date.now(),
        title: `Train ${update.trainNumber || ''} Update`,
        message: update.delayMinutes > 0
          ? `Running ${update.delayMinutes} mins late. Platform: ${update.platform || '1'}`
          : `Status: ${update.currentStatus || 'ON TIME'}. Available Seats: ${update.availableSeatsCount ?? 'Updated'}`,
        type: update.delayMinutes > 0 ? 'warning' : 'info',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };

      setLiveAlerts((prev) => [alert, ...prev.slice(0, 4)]);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const dismissAlert = (id) => {
    setLiveAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const triggerDelaySimulation = (trainNumber, delayMinutes, status) => {
    if (socket && isConnected) {
      socket.emit('trigger_manual_delay', {
        trainNumber,
        delayMinutes: Number(delayMinutes),
        status,
      });
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        liveTrains,
        liveAlerts,
        dismissAlert,
        triggerDelaySimulation,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
