import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', { transports: ['websocket'] }); // Replace with your backend URL
export default socket;
