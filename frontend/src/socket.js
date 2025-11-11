import { io } from 'socket.io-client'
const base = import.meta.env.VITE_API_URL?.replace('/api','') || 'http://localhost:5000'
export const socket = io(base, { autoConnect: false })