import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';

// Import route modules
import userRoutes from './routes/user.route.js';
import authRoutes from './routes/auth.route.js';
import contactRoutes from './routes/contactRoutes.js';
import hotelRoutes from './routes/hotel.routes.js';  // Hotel routes
import bookingRoutes from './routes/booking.route.js';  // Booking routes (new)

// Load environment variables from .env file
dotenv.config();

// Initialize the Express app
const app = express();

// Middleware setup
app.use(express.json());        // For parsing application/json
app.use(cookieParser());        // For parsing cookies in the requests

// CORS Configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',  // Allow requests from frontend URL (use .env variable for flexibility)
  credentials: true,                // Enable credentials like cookies, headers
}));

// MongoDB connection using Mongoose
mongoose.connect(process.env.MONGO, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB');
})
.catch((err) => {
  console.error('MongoDB connection error:', err);
  process.exit(1); // Exit the process if MongoDB connection fails
});

// Define API routes
app.use('/api/user', userRoutes);         // User management routes
app.use('/api/auth', authRoutes);         // Authentication routes
app.use('/api', contactRoutes);   // Contact routes
app.use('/api/hotel', hotelRoutes);       // Hotel management routes
app.use('/api/booking', bookingRoutes);  // Booking management routes (new)

// Global error handling middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  return res.status(statusCode).json({
    success: false,
    message,
    statusCode,
  });
});

// Start the server
const PORT = process.env.PORT || 3000; // Use PORT from .env or default to 3000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
