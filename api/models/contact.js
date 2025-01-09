import mongoose from 'mongoose';

const ContactSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to the User model
    required: true,
  },
  hotelName: {
    type: String,
    required: true,
  },
  helpTopic: {
    type: String,
    required: true,
  },
  conversationId: {
    type: String,
    required: true,
  },
  messages: [
    {
      senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      receiverId: {
        type: mongoose.Schema.Types.ObjectId, // Add receiverId here
        ref: 'User',
      },
      message: {
        type: String,
        required: true,
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  status: {
    type: String,
    enum: ['Unread', 'Read', 'Replied'],
    default: 'Unread',
  },
  isReadByAdmin: {
    type: Boolean,
    default: true, // Admin starts as having "read" the conversation
  },
  isReadByHotel: {
    type: Boolean,
    default: true, // Hotel starts as having "read" the conversation
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const Contact = mongoose.model('Contact', ContactSchema);
export default Contact;
