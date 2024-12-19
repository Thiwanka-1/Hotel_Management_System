import Hotel from '../models/hotel.model.js';
import User from '../models/user.model.js';
import bcryptjs from 'bcryptjs';
import { errorHandler } from '../utils/error.js';  // Assuming you have an error handler utility
import { validateHotelData } from '../utils/validate.js';  // Validation utility (optional)

/**
 * Register a new hotel with admin user
 */
export const registerHotel = async (req, res, next) => {
    try {
      const {
        hotelName,
        email,
        location,
        roomDetails,
        stayType,
        password,
      } = req.body;
  
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
        password: hashedPassword, // Store hashed password for security
      });
  
      // Create the User entry for authentication
      const user = await User.create({
        username: hotelName, // Use hotel name as username
        email,
        password: hashedPassword,
        hotelId: hotel._id, // Link User to Hotel
        isAdmin: false,
      });
  
      res.status(201).json({
        message: 'Hotel registered successfully',
        hotel,
        user,
      });
    } catch (error) {
      console.error("Error during hotel registration:", error);  // Log the error
      next(error);  // Pass the error to the global error handler
    }
  };

/**
 * Update hotel details
 */
export const updateHotel = async (req, res, next) => {
    try {
      const { id } = req.params; // Hotel ID from the URL params
      const { hotelName, email, location, roomDetails, stayType } = req.body;
  
      // Calculate total rooms
      const totalRooms = Object.values(roomDetails).reduce((acc, count) => acc + count, 0);
  
      // Update the hotel data
      const updatedHotel = await Hotel.findByIdAndUpdate(
        id,
        { hotelName, email, location, roomDetails, stayType, totalRooms },
        { new: true } // Return the updated document
      );
  
      if (!updatedHotel) {
        return res.status(404).json({
          success: false,
          message: 'Hotel not found.',
        });
      }
  
      // Update the corresponding User entry
      const updatedUser = await User.findOneAndUpdate(
        { hotelId: id }, // Match the User by the linked hotelId
        { username: hotelName, email }, // Update the User fields
        { new: true } // Return the updated document
      );
  
      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: 'User linked to the hotel not found.',
        });
      }
  
      res.status(200).json({
        success: true,
        message: 'Hotel and associated user updated successfully.',
        hotel: updatedHotel,
        user: updatedUser,
      });
    } catch (error) {
      console.error(error);
      next({
        statusCode: 500,
        message: 'Failed to update the hotel and associated user.',
      });
    }
  };


/**
 * Delete a hotel
 */
export const deleteHotel = async (req, res, next) => {
  const { id } = req.params;

  try {
    // Find and delete hotel by ID
    const deletedHotel = await Hotel.findByIdAndDelete(id);
    if (!deletedHotel) return next(errorHandler(404, 'Hotel not found'));

    // Optionally, delete associated user (admin) as well
    await User.findOneAndDelete({ hotelId: id });

    res.status(200).json({ message: 'Hotel and associated user deleted successfully.' });
  } catch (error) {
    next(errorHandler(500, 'Failed to delete the hotel.'));
  }
};

/**
 * Get details of a specific hotel
 */
export const getHotelDetails = async (req, res, next) => {
  const { id } = req.params;

  try {
    // Find hotel by ID
    const hotel = await Hotel.findById(id);
    if (!hotel) return next(errorHandler(404, 'Hotel not found'));

    res.status(200).json(hotel);
  } catch (error) {
    next(errorHandler(500, 'Failed to retrieve hotel details.'));
  }
};

/**
 * Get all hotels
 */
export const getAllHotels = async (req, res, next) => {
  try {
    // Find all hotels
    const hotels = await Hotel.find();
    res.status(200).json(hotels);
  } catch (error) {
    next(errorHandler(500, 'Failed to retrieve hotels.'));
  }
};
