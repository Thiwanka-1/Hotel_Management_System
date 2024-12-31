import Hotel from '../models/hotel.model.js';
import User from '../models/user.model.js';
import bcryptjs from 'bcryptjs';
import { errorHandler } from '../utils/error.js';
import mongoose from 'mongoose';

/**
 * Register a new hotel with admin user
 */
export const registerHotel = async (req, res, next) => {
  try {
    const { hotelName, email, location, roomDetails, stayType, password } = req.body;

    // Calculate total rooms
    const totalRooms = Object.values(roomDetails).reduce((acc, count) => acc + count, 0);

    // Hash password
    const hashedPassword = bcryptjs.hashSync(password, 10);

    // Create the Hotel entry
    const hotel = await Hotel.create({
      hotelName,
      email,
      location,
      roomDetails,
      stayType,
      totalRooms,
      password: hashedPassword,
    });

    // Create the User entry for authentication
    const user = await User.create({
      username: hotelName,
      email,
      password: hashedPassword,
      hotelId: hotel._id,
      isAdmin: false,
    });

    res.status(201).json({
      message: 'Hotel registered successfully',
      hotel,
      user,
    });
  } catch (error) {
    console.error('Error during hotel registration:', error);
    next(errorHandler(500, 'Failed to register hotel.'));
  }
};

/**
 * Update hotel details
 */
export const updateHotel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { hotelName, email, location, roomDetails, stayType, password } = req.body;

    const totalRooms = Object.values(roomDetails).reduce((acc, count) => acc + count, 0);

    const updateData = {
      hotelName,
      email,
      location,
      roomDetails,
      stayType,
      totalRooms,
    };

    if (password) {
      const hashedPassword = bcryptjs.hashSync(password, 10);
      updateData.password = hashedPassword;
    }

    const updatedHotel = await Hotel.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedHotel) {
      return res.status(404).json({ success: false, message: 'Hotel not found.' });
    }

    await User.findOneAndUpdate(
      { hotelId: id },
      {
        username: hotelName,
        email,
        ...(password && { password: updateData.password }),
      }
    );

    res.status(200).json({
      success: true,
      message: 'Hotel and associated user updated successfully.',
      hotel: updatedHotel,
    });
  } catch (error) {
    console.error('Error updating hotel:', error);
    next(errorHandler(500, 'Failed to update hotel.'));
  }
};

/**
 * Delete a hotel
 */
export const deleteHotel = async (req, res, next) => {
  const { id } = req.params;

  try {
    const deletedHotel = await Hotel.findByIdAndDelete(id);
    if (!deletedHotel) return next(errorHandler(404, 'Hotel not found.'));

    await User.findOneAndDelete({ hotelId: id });

    res.status(200).json({ message: 'Hotel and associated user deleted successfully.' });
  } catch (error) {
    console.error('Error deleting hotel:', error);
    next(errorHandler(500, 'Failed to delete hotel.'));
  }
};

/**
 * Get details of a specific hotel
 */
export const getHotelDetails = async (req, res, next) => {
  const { id } = req.params;

  try {
    const hotel = await Hotel.findById(id);
    if (!hotel) return next(errorHandler(404, 'Hotel not found.'));

    res.status(200).json(hotel);
  } catch (error) {
    console.error('Error fetching hotel details:', error);
    next(errorHandler(500, 'Failed to retrieve hotel details.'));
  }
};

/**
 * Get all hotels with pagination
 */
export const getAllHotels = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const hotels = await Hotel.find()
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json(hotels);
  } catch (error) {
    console.error('Error fetching hotels:', error);
    next(errorHandler(500, 'Failed to retrieve hotels.'));
  }
};

/**
 * Check availability
 */
export const checkAvailability = async (req, res, next) => {
  const { id: hotelId } = req.params;
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ success: false, message: 'Start and end dates are required.' });
  }

  try {
    const hotel = await Hotel.findById(hotelId);
    if (!hotel) return res.status(404).json({ success: false, message: 'Hotel not found.' });

    const start = new Date(startDate);
    const end = new Date(endDate);

    const availability = [];
    let currentDate = new Date(start);

    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dailyAvailability = hotel.roomAvailability.find(
        (entry) => entry.date.toISOString().split('T')[0] === dateStr
      );

      availability.push({
        date: dateStr,
        ...dailyAvailability ? dailyAvailability.toObject() : hotel.roomDetails,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.status(200).json({ success: true, availability });
  } catch (error) {
    console.error('Error checking availability:', error);
    next(errorHandler(500, 'Error fetching availability.'));
  }
};
