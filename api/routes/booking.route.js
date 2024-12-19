import express from 'express';
import { 
  createBooking, 
  getBookings, 
  updateBookingStatus, 
  updateBooking, 
  getBookingByConfirmationNumber, 
  deleteBooking
} from '../controllers/booking.controller.js';
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

// CREATE a new booking (Authenticated users)
router.post('/create', verifyToken, createBooking);

// GET all bookings (Admin only or hotel-specific based on user role)
router.get('/', verifyToken, getBookings);

// UPDATE booking status (Admin only)
router.put('/update-status', verifyToken, updateBookingStatus);

// UPDATE booking details (Authenticated users)
router.put('/update/:id', verifyToken, updateBooking);

// GET booking by confirmation number (Authenticated users)
router.get('/:confirmationNumber', verifyToken, getBookingByConfirmationNumber);

// Route to delete a booking
router.delete('/delete/:id',verifyToken, deleteBooking);


export default router;
