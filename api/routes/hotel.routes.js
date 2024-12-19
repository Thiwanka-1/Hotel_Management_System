import express from 'express';
import { 
  registerHotel, 
  updateHotel, 
  deleteHotel, 
  getHotelDetails, 
  getAllHotels 
} from '../controllers/hotel.controller.js';
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

// CREATE a new hotel (Admin Only)
router.post('/add', verifyToken, registerHotel);

// UPDATE hotel details (Admin Only)
router.put('/update/:id', verifyToken, updateHotel);

// DELETE a hotel (Admin Only)
router.delete('/delete/:id', verifyToken, deleteHotel);

// GET details of a specific hotel (Authenticated users)
router.get('/get/:id', verifyToken, getHotelDetails);

// GET all hotels (Admin Only)
router.get('/getall', verifyToken, getAllHotels);

export default router;
