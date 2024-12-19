import Booking from '../models/booking.model.js';
import Hotel from '../models/hotel.model.js';
import nodemailer from 'nodemailer';
import { errorHandler } from '../utils/error.js';
import { v4 as uuidv4 } from 'uuid';

// Configure Nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'gamithu619@gmail.com',
        pass: 'kgqk qrxx llgr zhhp'
    },
});



// Create a new booking
export const createBooking = async (req, res, next) => {
    const { hotelId, hotelName, customerName, customerEmail, customerPhone, totalGuests, specialRequests, rooms, dateRange, stayTypes } = req.body;

    // Basic validation
    if (!hotelId || !hotelName || !customerName || !customerEmail || !customerPhone || !rooms || rooms.length === 0 || !stayTypes || stayTypes.length === 0) {
        return res.status(400).json({ success: false, message: 'Missing required fields or stay types.' });
    }

    let totalPrice = 0;
    let roomDetails = {};
    let validationErrors = [];

    // Validate room data
    rooms.forEach(room => {
        const { roomType, roomCount, pricePerRoom } = room;
        if (!['singleRoom', 'doubleRoom', 'tripleRoom', 'familyRoom', 'suiteRoom'].includes(roomType)) {
            validationErrors.push(`Invalid room type: ${roomType}`);
        }
        roomDetails[roomType] = { count: roomCount, pricePerRoom };
        totalPrice += roomCount * pricePerRoom;
    });

    if (validationErrors.length > 0) {
        return res.status(400).json({ success: false, message: validationErrors.join(", ") });
    }

    try {
        const hotel = await Hotel.findById(hotelId);
        if (!hotel) {
            return res.status(404).json({ success: false, message: 'Hotel not found.' });
        }

        const booking = await Booking.create({
            hotelId,
            hotelName,
            customerName,
            customerEmail,
            customerPhone,
            totalGuests,
            specialRequests,
            rooms: roomDetails,
            dateRange,
            stayTypes,
            totalPrice,
            confirmationNumber: uuidv4(),
            singleRoom: roomDetails.singleRoom || { count: 0, pricePerRoom: 0 },
            doubleRoom: roomDetails.doubleRoom || { count: 0, pricePerRoom: 0 },
            tripleRoom: roomDetails.tripleRoom || { count: 0, pricePerRoom: 0 },
            familyRoom: roomDetails.familyRoom || { count: 0, pricePerRoom: 0 },
            suiteRoom: roomDetails.suiteRoom || { count: 0, pricePerRoom: 0 },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: customerEmail,
            subject: `Booking Confirmation - ${hotelName}`,
            text: `Dear ${customerName},

Thank you for your booking at ${hotelName}.

Booking Details:
Confirmation Number: ${booking.confirmationNumber}
Hotel: ${hotelName}
Rooms: ${rooms.map(room => `${room.roomType} x ${room.roomCount}`).join(', ')}
Total Price: $${totalPrice}
Stay Types: ${stayTypes.join(', ')}
Date Range: ${new Date(dateRange.startDate).toLocaleDateString()} to ${new Date(dateRange.endDate).toLocaleDateString()}

Special Requests: ${specialRequests || 'No special requests'}

We look forward to hosting you.

Best regards,
${hotelName}`,
        };

        await transporter.sendMail(mailOptions);
        res.status(201).json({ success: true, message: 'Booking created successfully.', booking });
    } catch (error) {
        console.error('Failed to create booking:', error);
        next(errorHandler(500, 'Failed to create the booking.'));
    }
};

// Get bookings based on user role
export const getBookings = async (req, res, next) => {
  const { isAdmin, hotelId } = req.user; // Assume req.user contains decoded JWT payload

  try {
    let bookings;
    if (isAdmin) {
      bookings = await Booking.find();
    } else {
      bookings = await Booking.find({ hotelId });
    }

    res.status(200).json({
      success: true,
      bookings,
    });
  } catch (error) {
    next(errorHandler(500, 'Failed to retrieve bookings.'));
  }
};

// Update booking status
export const updateBookingStatus = async (req, res, next) => {
  const { bookingId, status } = req.body;

  try {
    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      { status },
      { new: true }
    );

    if (!booking) return next(errorHandler(404, 'Booking not found.'));

    res.status(200).json({
      success: true,
      message: 'Booking status updated successfully.',
      booking,
    });
  } catch (error) {
    next(errorHandler(500, 'Failed to update booking status.'));
  }
};

// Update booking
export const updateBooking = async (req, res, next) => {
    const { id } = req.params;
    const {
      customerName,
      customerEmail,
      customerPhone,
      totalGuests,
      specialRequests,
      rooms,
      dateRange,
      stayTypes  // Include stayTypes in the data received from the request
    } = req.body;
  
    try {
      const booking = await Booking.findById(id);
      if (!booking) return next(errorHandler(404, 'Booking not found.'));
  
      // Calculate total price and update room details
      let totalPrice = 0;
      let roomDetails = {};
      rooms.forEach(room => {
        const { roomType, roomCount, pricePerRoom } = room;
        roomDetails[roomType] = { count: roomCount, pricePerRoom };
        totalPrice += roomCount * pricePerRoom;
      });
  
      // Update booking details
      booking.customerName = customerName;
      booking.customerEmail = customerEmail;
      booking.customerPhone = customerPhone;
      booking.totalGuests = totalGuests;
      booking.specialRequests = specialRequests;
      booking.rooms = roomDetails;  // Store the structured room details
      booking.dateRange = dateRange;
      booking.stayTypes = stayTypes;  // Make sure to update the stayTypes
      booking.totalPrice = totalPrice;
  
      await booking.save();
  
      // Send updated confirmation email
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: customerEmail,
        subject: `Booking Updated - ${booking.hotelName}`,
        text: `Dear ${customerName},
  
  Your booking at ${booking.hotelName} has been updated successfully.
  
  Updated Booking Details:
  Confirmation Number: ${booking.confirmationNumber}
  Hotel: ${booking.hotelName}
  Rooms: ${rooms.map(room => `${room.roomType} x ${room.roomCount}`).join(', ')}
  Total Price: $${totalPrice}
  Stay Types: ${stayTypes.join(', ')}
  Date Range: ${new Date(dateRange.startDate).toLocaleDateString()} to ${new Date(dateRange.endDate).toLocaleDateString()}
  
  Special Requests: ${specialRequests || 'No special requests'}
  
  We look forward to hosting you.
  
  Best regards,
  ${booking.hotelName}`,
      };
  
      await transporter.sendMail(mailOptions);
  
      res.status(200).json({
        success: true,
        message: 'Booking updated successfully.',
        booking,
      });
    } catch (error) {
      console.error('Failed to update booking:', error);
      next(errorHandler(500, 'Failed to update the booking.'));
    }
  };
  

// Get booking by confirmation number
export const getBookingByConfirmationNumber = async (req, res, next) => {
  const { confirmationNumber } = req.params;

  try {
    const booking = await Booking.findOne({ confirmationNumber });
    if (!booking) return next(errorHandler(404, 'Booking not found'));

    res.status(200).json({
      success: true,
      booking,
    });
  } catch (error) {
    next(errorHandler(500, 'Failed to retrieve booking.'));
  }
};

// Delete booking
export const deleteBooking = async (req, res, next) => {
    const { id } = req.params; // The ID of the booking to delete
  
    try {
      const booking = await Booking.findById(id);
      if (!booking) {
        return next(errorHandler(404, 'Booking not found.'));
      }
  
      // Optional: Add additional checks here if you need to verify the user's permission to delete the booking
  
      await Booking.findByIdAndDelete(id);
      res.status(200).json({ success: true, message: 'Booking deleted successfully.' });
    } catch (error) {
      console.error('Failed to delete booking:', error);
      next(errorHandler(500, 'Failed to delete the booking.'));
    }
  };
  