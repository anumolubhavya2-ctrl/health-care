import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

let socketInstance: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socketInstance) {
    const token = localStorage.getItem('accessToken');
    socketInstance = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });
  }
  return socketInstance;
};

export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
};

interface UseSocketOptions {
  onQueueUpdate?: (data: unknown) => void;
  onDoctorStatusChange?: (data: unknown) => void;
  onNotification?: (data: unknown) => void;
  onAppointmentUpdate?: (data: unknown) => void;
  onSupportMessage?: (data: unknown) => void;
  subscribeQueue?: string;
  subscribeDoctor?: string;
  subscribeSupport?: string;
}

export const useSocket = (options: UseSocketOptions = {}) => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    if (options.subscribeQueue) {
      socket.emit('subscribe:queue', options.subscribeQueue);
    }
    if (options.subscribeDoctor) {
      socket.emit('subscribe:doctor', options.subscribeDoctor);
    }
    if (options.subscribeSupport) {
      socket.emit('subscribe:support', options.subscribeSupport);
    }

    if (options.onQueueUpdate) socket.on('queue:updated', options.onQueueUpdate);
    if (options.onDoctorStatusChange) socket.on('doctor:status_changed', options.onDoctorStatusChange);
    if (options.onNotification) socket.on('notification:new', options.onNotification);
    if (options.onAppointmentUpdate) socket.on('appointment:updated', options.onAppointmentUpdate);
    if (options.onSupportMessage) socket.on('support:message', options.onSupportMessage);

    return () => {
      if (options.subscribeQueue) socket.emit('unsubscribe:queue', options.subscribeQueue);
      if (options.subscribeDoctor) socket.emit('unsubscribe:doctor', options.subscribeDoctor);
      if (options.subscribeSupport) socket.emit('unsubscribe:support', options.subscribeSupport);

      if (options.onQueueUpdate) socket.off('queue:updated', options.onQueueUpdate);
      if (options.onDoctorStatusChange) socket.off('doctor:status_changed', options.onDoctorStatusChange);
      if (options.onNotification) socket.off('notification:new', options.onNotification);
      if (options.onAppointmentUpdate) socket.off('appointment:updated', options.onAppointmentUpdate);
      if (options.onSupportMessage) socket.off('support:message', options.onSupportMessage);
    };
  }, [options.subscribeQueue, options.subscribeDoctor, options.subscribeSupport]);

  const emit = useCallback((event: string, data?: unknown) => {
    socketRef.current?.emit(event, data);
  }, []);

  return { socket: socketRef.current, emit };
};
