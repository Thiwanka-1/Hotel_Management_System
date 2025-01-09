// routes/contactRoutes.js
import express from 'express';
import {
  addMessage,
  getMessages,
  replyToMessage,
  markAsRead,
  deleteConversation,
  getConversationById,
  getHotelChats,
} from '../controllers/contactController.js';
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

// POST - Submit a new message (hotel staff to admin)
router.post('/', addMessage);

// GET - Retrieve all messages for admin (can filter by hotel name)
router.get('/messages', verifyToken, getMessages);

// GET - Retrieve a specific conversation by conversationId
router.get('/conversation/:conversationId', verifyToken, getConversationById);

// POST - Admin replies to a message
router.post('/reply', verifyToken, replyToMessage);

// POST - Mark a conversation as read
router.post('/read', verifyToken, markAsRead);

// POST - Delete a conversation
router.post('/delete', verifyToken, deleteConversation);

router.get('/get-hot', verifyToken, getHotelChats);

export default router;
