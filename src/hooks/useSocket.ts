import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './UseAuth';

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user && !socketRef.current) {
      socketRef.current = io(import.meta.env.VITE_API_URL || 'http://localhost:3001', {
        auth: {
          token: localStorage.getItem('supabase.auth.token')
        }
      });

      socketRef.current.on('connect', () => {
        console.log('Connected to server');
        socketRef.current?.emit('join_user_room', user.id);
      });

      socketRef.current.on('disconnect', () => {
        console.log('Disconnected from server');
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user]);

  return socketRef.current;
};