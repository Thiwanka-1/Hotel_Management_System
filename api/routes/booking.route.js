import express from 'express';
import {
  createBooking,
  cancelBooking,
  updateBooking,
  getAllBookings,
  getHotelBookings,
  toggleBookingStatus,
  getBookingById ,
} from '../controllers/booking.controller.js';

const router = express.Router();

// Create a new booking
router.post('/add', createBooking);

// Cancel a booking
router.delete('/cancel/:id', cancelBooking);

// Update a booking
router.put('/update/:id', updateBooking);

// Get all bookings (for admin)
router.get('/all', getAllBookings);

// Get bookings for a specific hotel
router.get('/hotel/:hotelId', getHotelBookings);

router.put('/toggle-status/:id', toggleBookingStatus);

router.get('/:id', getBookingById);

export default router;
