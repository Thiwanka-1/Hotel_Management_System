import Booking from '../models/booking.model.js';
import Hotel from '../models/hotel.model.js';
import { v4 as uuidv4 } from 'uuid';
import nodemailer from 'nodemailer';
import { errorHandler } from '../utils/error.js';
import dotenv from 'dotenv';
dotenv.config();
import crypto from 'crypto';

// Email Configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Utility: Send Email
const sendEmail = async (to, subject, text) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
  };
  await transporter.sendMail(mailOptions);
};

// Utility: Initialize Room Availability for Missing Dates
const initializeRoomAvailability = (date, hotel) => {
  // Ensure the hotel has roomDetails properly configured
  if (!hotel.roomDetails) {
    throw new Error("Room details not found for the hotel.");
  }

  return {
    date,
    single: hotel.roomDetails.single || 0,
    double: hotel.roomDetails.double || 0,
    triple: hotel.roomDetails.triple || 0,
    family: hotel.roomDetails.family || 0,
    suite: hotel.roomDetails.suite || 0,
  };
};

const syncRoomAvailability = async (hotelId, dateRange) => {
  const hotel = await Hotel.findById(hotelId).populate("roomAvailability");
  if (!hotel) throw new Error("Hotel not found.");

  const { startDate, endDate } = dateRange;
  const start = new Date(startDate);
  const end = new Date(endDate);

  let currentDate = new Date(start);
  while (currentDate <= end) {
    const dateStr = currentDate.toISOString().split("T")[0];
    let roomAvailability = hotel.roomAvailability.find(
      (entry) => entry.date.toISOString().split("T")[0] === dateStr
    );

    if (!roomAvailability) {
      // Initialize if missing
      roomAvailability = initializeRoomAvailability(new Date(currentDate), hotel);
      hotel.roomAvailability.push(roomAvailability);
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  await hotel.save();
};

// Utility: Validate Rooms
const validateRooms = (rooms) => {
  const validRoomTypes = ['single', 'double', 'triple', 'family', 'suite'];
  const validatedRooms = {};

  for (const roomType of validRoomTypes) {
    const room = rooms[roomType];
    if (typeof room === 'number') {
      validatedRooms[roomType] = { count: room, pricePerRoom: 0 };
    } else if (typeof room === 'object' && typeof room.count === 'number') {
      validatedRooms[roomType] = room;
    } else if (room) {
      throw new Error(`Invalid count for room type: ${roomType}`);
    }
  }
  return validatedRooms;
};

// Utility: Check Room Availability
const checkRoomAvailability = async (hotelId, dateRange, rooms) => {
  const hotel = await Hotel.findById(hotelId).populate("roomAvailability");
  if (!hotel) throw new Error("Hotel not found.");

  const { startDate, endDate } = dateRange;
  const start = new Date(startDate);
  const end = new Date(endDate);

  let currentDate = new Date(start);
  while (currentDate <= end) {
    const dateStr = currentDate.toISOString().split("T")[0];
    const dailyAvailability = hotel.roomAvailability.find(
      (entry) => entry.date.toISOString().split("T")[0] === dateStr
    );

    for (const roomType in rooms) {
      const availableCount = dailyAvailability?.[roomType] ?? hotel.roomDetails[roomType];
      if (availableCount < rooms[roomType].count) {
        throw new Error(`Not enough ${roomType} rooms available on ${dateStr}`);
      }
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
};

// Utility: Update Room Availability
const updateRoomAvailability = async (hotelId, dateRange, rooms, action) => {
  const hotel = await Hotel.findById(hotelId);
  if (!hotel) throw new Error("Hotel not found.");

  const { startDate, endDate } = dateRange;
  const start = new Date(startDate);
  const end = new Date(endDate);

  let currentDate = new Date(start);
  while (currentDate <= end) {
    const dateStr = currentDate.toISOString().split("T")[0];

    // Find the specific date entry in roomAvailability
    let roomAvailability = hotel.roomAvailability.find(
      (entry) => entry.date.toISOString().split("T")[0] === dateStr
    );

    if (!roomAvailability) {
      // Initialize availability if missing
      roomAvailability = initializeRoomAvailability(new Date(currentDate), hotel);
      hotel.roomAvailability.push(roomAvailability);
    }

    // Update the room counts based on the action
    for (const roomType in rooms) {
      if (rooms[roomType]?.count) {
        if (action === "deduct") {
          roomAvailability[roomType] -= rooms[roomType].count;
          if (roomAvailability[roomType] < 0) {
            throw new Error(`Overbooking detected for ${roomType} on ${dateStr}`);
          }
        } else if (action === "restore") {
          const maxRoomCount = hotel.roomDetails[roomType] || 0; // Max limit from hotel details
          roomAvailability[roomType] += rooms[roomType].count;
          if (roomAvailability[roomType] > maxRoomCount) {
            roomAvailability[roomType] = maxRoomCount; // Enforce max limit
          }
        }
      }
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Ensure the hotel document is saved after modifying availability
  await hotel.save();
};

// Create Booking
export const createBooking = async (req, res, next) => {
  const {
    hotelId,
    customerName,
    customerEmail,
    customerPhone,
    totalGuests = {},
    specialRequests,
    rooms,
    dateRange,
    stayType,
  } = req.body;

  try {
    if (!hotelId || !customerName || !customerEmail || !customerPhone || !rooms || !dateRange) {
      return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    const { adults = 0, children = 0 } = totalGuests;
    if (adults < 0 || children < 0) {
      return res.status(400).json({ success: false, message: "Guest count cannot be negative." });
    }

    const validatedRooms = validateRooms(rooms);

    // Step 1: Sync and Validate Room Availability
    await syncRoomAvailability(hotelId, dateRange);
    await checkRoomAvailability(hotelId, dateRange, validatedRooms);

    // Step 2: Deduct Room Availability
    await updateRoomAvailability(hotelId, dateRange, validatedRooms, "deduct");

    const hotel = await Hotel.findById(hotelId);
    const hotelName = hotel.hotelName;

    // Step 3: Calculate Total Price
    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);
    const numberOfNights = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

    let totalPrice = 0;
    for (const roomType in validatedRooms) {
      totalPrice += validatedRooms[roomType].count * validatedRooms[roomType].pricePerRoom * numberOfNights;
    }

    // Step 4: Create a simpler confirmation number
    const confirmationNumber = `BK${new Date().getTime().toString(36).toUpperCase()}-${crypto.randomInt(10000, 99999)}`;

    // Step 5: Create the Booking Record
    const booking = await Booking.create({
      hotelId,
      hotelName,
      customerName,
      customerEmail,
      customerPhone,
      totalGuests: { adults, children },
      specialRequests,
      rooms: validatedRooms,
      dateRange,
      stayType,
      totalPrice,
      confirmationNumber,
    });

    // Step 6: Send Confirmation Email
    const emailText = `
Dear ${customerName},

Thank you for booking with ${hotelName}!

Here are your booking details:

- Confirmation Number: ${confirmationNumber}
- Hotel: ${hotelName}
- Stay Type: ${stayType}
- Date Range: ${new Date(dateRange.startDate).toDateString()} to ${new Date(dateRange.endDate).toDateString()}
- Total Guests: ${adults} Adults, ${children} Children
- Rooms Booked: ${Object.keys(validatedRooms)
      .map((type) => `${type}: ${validatedRooms[type].count}`)
      .join(", ")}
- Total Price: Rs. ${totalPrice}
- Special Requests: ${specialRequests || "None"}

We look forward to hosting you.

Best regards,
${hotelName}
    `;
    await sendEmail(customerEmail, `Booking Confirmation - ${hotelName}`, emailText);

    res.status(201).json({ success: true, message: "Booking created successfully.", booking });
  } catch (error) {
    console.error("Error in createBooking:", error);
    next(errorHandler(500, error.message || "Failed to create booking."));
  }
};

// Cancel Booking
export const cancelBooking = async (req, res, next) => {
  const { id } = req.params;

  try {
    // Fetch the booking by ID
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    // Fetch the hotel and its room availability
    const hotel = await Hotel.findById(booking.hotelId);
    if (!hotel) {
      return res.status(404).json({ success: false, message: 'Hotel not found.' });
    }

    // Restore room availability for the booking's date range
    const { startDate, endDate } = booking.dateRange;
    const start = new Date(startDate);
    const end = new Date(endDate);

    let currentDate = new Date(start);
    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];

      // Find the specific date entry in roomAvailability
      const availabilityEntry = hotel.roomAvailability.find(
        (entry) => entry.date.toISOString().split('T')[0] === dateStr
      );

      if (availabilityEntry) {
        // Update the room counts correctly
        for (const roomType in booking.rooms) {
          if (booking.rooms[roomType]?.count) {
            availabilityEntry[roomType] = Math.max(
              availabilityEntry[roomType] + booking.rooms[roomType].count,
              0
            ); // Ensure availability doesn't go below 0
          }
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Save the updated hotel room availability
    await hotel.save();

    // Delete the booking after restoring availability
    await Booking.findByIdAndDelete(id);

    // Send cancellation email to the customer
    const emailText = `
Dear ${booking.customerName},

Your booking at ${booking.hotelName} has been successfully cancelled.

Booking Details:
- Confirmation Number: ${booking.confirmationNumber}
- Hotel: ${booking.hotelName}
- Date Range: ${new Date(booking.dateRange.startDate).toDateString()} to ${new Date(booking.dateRange.endDate).toDateString()}
- Rooms Cancelled: ${Object.keys(booking.rooms)
        .map((type) => `${type}: ${booking.rooms[type].count}`)
        .join(', ')}

We hope to serve you in the future.

Best regards,
${booking.hotelName}
    `;
    await sendEmail(booking.customerEmail, `Booking Cancellation - ${booking.hotelName}`, emailText);

    // Send a success response
    res.status(200).json({ success: true, message: 'Booking cancelled successfully.' });
  } catch (error) {
    console.error('Error in cancelBooking:', error);
    next(errorHandler(500, error.message || 'Failed to cancel booking.'));
  }
};

// Get all bookings (for admin)
export const getAllBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find().populate('hotelId', 'hotelName location');
    res.status(200).json({ success: true, bookings });
  } catch (error) {
    next(errorHandler(500, 'Failed to fetch bookings.'));
  }
};

// Get bookings for a specific hotel
export const getHotelBookings = async (req, res, next) => {
  const { hotelId } = req.params;

  try {
    const bookings = await Booking.find({ hotelId }).populate('hotelId', 'hotelName location');
    res.status(200).json({ success: true, bookings });
  } catch (error) {
    next(errorHandler(500, 'Failed to fetch bookings for hotel.'));
  }
};

// Update a booking
export const updateBooking = async (req, res, next) => {
  const { id } = req.params;
  const {
    dateRange,
    rooms,
    totalGuests,
    specialRequests,
    stayType,
    customerName,
    customerEmail,
    customerPhone,
  } = req.body;

  try {
    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    const hotel = await Hotel.findById(booking.hotelId);
    if (!hotel) return res.status(404).json({ success: false, message: 'Hotel not found.' });

    // Restore availability for the old date range
    await updateRoomAvailability(booking.hotelId, booking.dateRange, booking.rooms, 'restore');

    // Sync availability for the new date range
    await syncRoomAvailability(booking.hotelId, dateRange);

    // Validate availability for the new date range
    const validatedRooms = validateRooms(rooms);
    await checkRoomAvailability(booking.hotelId, dateRange, validatedRooms);

    // Deduct availability for the new date range
    await updateRoomAvailability(booking.hotelId, dateRange, validatedRooms, 'deduct');

    // Calculate the updated total price
    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);
    const numberOfNights = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

    let updatedTotalPrice = 0;
    for (const roomType in validatedRooms) {
      updatedTotalPrice += validatedRooms[roomType].count * validatedRooms[roomType].pricePerRoom * numberOfNights;
    }

    // Update booking details
    booking.dateRange = dateRange;
    booking.rooms = validatedRooms;
    booking.totalGuests = totalGuests;
    booking.specialRequests = specialRequests;
    booking.stayType = stayType;
    booking.customerName = customerName; // Update guest name
    booking.customerEmail = customerEmail; // Update guest email
    booking.customerPhone = customerPhone; // Update guest phone
    booking.totalPrice = updatedTotalPrice;
    await booking.save();


    // Send an email notification for the updated booking
    const emailText = `
Dear ${customerName},

Your booking with ${hotel.hotelName} has been updated.

Here are the updated details:

- Confirmation Number: ${booking.confirmationNumber}
- Hotel: ${hotel.hotelName}
- Stay Type: ${stayType}
- Updated Date Range: ${new Date(dateRange.startDate).toDateString()} to ${new Date(dateRange.endDate).toDateString()}
- Total Guests: ${totalGuests.adults} Adults, ${totalGuests.children} Children
- Rooms Booked: ${Object.keys(validatedRooms)
        .map((type) => `${type}: ${validatedRooms[type].count}`)
        .join(', ')}
- Total Price: Rs. ${updatedTotalPrice}
- Special Requests: ${specialRequests || 'None'}

We look forward to hosting you.

Best regards,
${hotel.hotelName}
    `;
    await sendEmail(customerEmail, `Booking Updated - ${hotel.hotelName}`, emailText);

    res.status(200).json({ success: true, message: 'Booking updated successfully.', booking });
  } catch (error) {
    console.error('Error in updateBooking:', error);
    next(errorHandler(500, error.message || 'Failed to update booking.'));
  }
};

// Toggle Booking Status
export const toggleBookingStatus = async (req, res, next) => {
  const { id } = req.params;

  try {
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    // Toggle status
    const newStatus = booking.status === 'pending' ? 'confirmed' : 'pending';

    // Update the booking status
    booking.status = newStatus;
    await booking.save();

    // Send an email notification for status update
    const emailText = `
Dear ${booking.customerName},

The status of your booking with confirmation number ${booking.confirmationNumber} has been updated.

Booking Details:
- Hotel: ${booking.hotelName}
- Stay Type: ${booking.stayType}
- Date Range: ${new Date(booking.dateRange.startDate).toDateString()} to ${new Date(booking.dateRange.endDate).toDateString()}
- Current Status: ${newStatus}

Thank you for choosing ${booking.hotelName}.

Best regards,
${booking.hotelName}
    `;
    await sendEmail(booking.customerEmail, `Booking Status Updated - ${booking.hotelName}`, emailText);

    res.status(200).json({
      success: true,
      message: `Booking status updated to ${newStatus}.`,
      status: newStatus,
    });
  } catch (error) {
    console.error('Error in toggleBookingStatus:', error);
    next(errorHandler(500, error.message || 'Failed to update booking status.'));
  }
};

// Get Booking by ID
export const getBookingById = async (req, res, next) => {
  const { id } = req.params;

  try {
    const booking = await Booking.findById(id).populate('hotelId', 'hotelName location');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    res.status(200).json({ success: true, booking });
  } catch (error) {
    next(errorHandler(500, 'Failed to fetch booking.'));
  }
};

