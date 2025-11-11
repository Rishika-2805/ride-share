import { io } from 'socket.io-client';

// Update this to match your backend URL
const SOCKET_URL = 'http://172.20.10.3:5000'; // For development
// For production or physical device, use your computer's IP: 'http://192.168.1.X:5000'

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
});

