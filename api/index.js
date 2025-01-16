import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { Server } from 'socket.io';
import http from 'http';
import Contact from './models/contact.js'; // Import Contact model

// Import route modules
import userRoutes from './routes/user.route.js';
import authRoutes from './routes/auth.route.js';
import contactRoutes from './routes/contactRoutes.js';
import hotelRoutes from './routes/hotel.routes.js';
import bookingRoutes from './routes/booking.route.js';

// Load environment variables from .env file
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Middleware setup
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// MongoDB connection
mongoose
  .connect(process.env.MONGO, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Routes
app.use('/api/user', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/hotel', hotelRoutes);
app.use('/api/booking', bookingRoutes);

// Global error handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  res.status(statusCode).json({
    success: false,
    message,
    statusCode,
  });
});

// Socket.IO Event Handling
io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('sendMessage', async (data) => {
    const { conversationId, senderId, message, timestamp } = data;

    try {
      // Save the message to the database
      const conversation = await Contact.findOne({ conversationId });
      if (conversation) {
        conversation.messages.push({ senderId, message, timestamp });
        await conversation.save();

        // Emit the message to all connected clients in the conversation room
        io.to(conversationId).emit('newMessage', {
          conversationId,
          senderId,
          message,
          timestamp,
        });
      }
    } catch (err) {
      console.error('Error saving message:', err);
    }
  });

  socket.on('joinConversation', (conversationId) => {
    socket.join(conversationId); // Join the specific conversation room
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


export { io };