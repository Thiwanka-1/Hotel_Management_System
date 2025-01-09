// controllers/contactController.js
import Contact from '../models/contact.js';
import User from '../models/user.model.js';

// Add new message (hotel staff to admin)
export const addMessage = async (req, res) => {
  const { senderId, message, hotelName, helpTopic } = req.body;

  // Ensure all required fields are provided
  if (!senderId || !message || !hotelName || !helpTopic) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // Check if sender (hotel staff) exists
    const sender = await User.findById(senderId);
    if (!sender) return res.status(404).json({ message: 'Sender not found' });

    // Fetch the admin user dynamically
    const adminUser = await User.findOne({ isAdmin: true }); // Assuming `isAdmin` is a field in your user schema
    if (!adminUser) return res.status(404).json({ message: 'Admin user not found' });

    // Generate a conversationId, combining senderId and hotelName
    const conversationId = `${senderId}-${hotelName}`;

    // Check if a conversation already exists
    let conversation = await Contact.findOne({ conversationId });

    if (!conversation) {
      // Create a new conversation
      conversation = new Contact({
        senderId,
        receiverId: adminUser._id, // Use the fetched admin user's ObjectId
        hotelName,
        helpTopic,
        conversationId,
        messages: [
          {
            senderId,
            message,
          },
        ],
        isRead: false,
        status: 'Unread',
      });
    } else {
      // Append the new message to the existing conversation
      conversation.messages.push({
        senderId,
        message,
      });
      conversation.isRead = false;
      conversation.status = 'Unread';
      conversation.updatedAt = Date.now();
    }

    await conversation.save();
    res.status(201).json({ message: 'Message sent successfully!' });
  } catch (error) {
    console.error('Error adding message:', error);
    res.status(500).json({ message: 'Error saving message', error });
  }
};


// Get all conversations for admin (with optional hotel name filter)
export const getMessages = async (req, res) => {
  const { filter } = req.query; // Get filter from query parameters

  try {
    const query = filter ? { hotelName: { $regex: filter, $options: 'i' } } : {};

    const conversations = await Contact.find(query)
      .populate('senderId', 'username email')
      .populate('receiverId', 'username email')
      .exec();

    res.status(200).json(conversations);
  } catch (error) {
    console.error('Error retrieving messages:', error);
    res.status(500).json({ message: 'Error retrieving messages', error });
  }
};

// Get a specific conversation by conversationId
export const getConversationById = async (req, res) => {
  const { conversationId } = req.params;

  try {
    const conversation = await Contact.findOne({ conversationId })
      .populate('messages.senderId', 'username email') // Populate sender details for each message
      .populate('senderId', 'username email') // Populate hotel sender details
      .exec();

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    res.status(200).json(conversation);
  } catch (error) {
    console.error('Error retrieving conversation:', error);
    res.status(500).json({ message: 'Error retrieving conversation', error });
  }
};


// Reply to a conversation (admin replies to hotel staff)
export const replyToMessage = async (req, res) => {
  const { conversationId, replyMessage } = req.body;

  if (!conversationId || !replyMessage) {
    return res.status(400).json({ message: 'conversationId and replyMessage are required' });
  }

  try {
    const conversation = await Contact.findOne({ conversationId });
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Add the reply
    conversation.messages.push({
      senderId: req.user.id,
      message: replyMessage,
      timestamp: new Date(),
    });

    // Update the "isRead" fields based on the sender
    if (req.user.isAdmin) {
      conversation.isReadByHotel = false; // Hotel hasn't read the new admin message
      conversation.isReadByAdmin = true; // Admin always "reads" their own messages
    } else {
      conversation.isReadByAdmin = false; // Admin hasn't read the new hotel message
      conversation.isReadByHotel = true; // Hotel always "reads" their own messages
    }

    conversation.updatedAt = Date.now();

    await conversation.save();

    res.status(200).json({ message: 'Reply sent successfully!' });
  } catch (error) {
    console.error('Error replying to message:', error);
    res.status(500).json({ message: 'Error replying to message', error });
  }
};






// Mark conversation as read
export const markAsRead = async (req, res) => {
  const { conversationId } = req.body;

  try {
    const conversation = await Contact.findOne({ conversationId });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Update the "isRead" field based on the user's role
    if (req.user.isAdmin) {
      conversation.isReadByAdmin = true;
    } else {
      conversation.isReadByHotel = true;
    }

    conversation.updatedAt = Date.now();

    await conversation.save();
    res.status(200).json({ message: 'Conversation marked as read!' });
  } catch (error) {
    console.error('Error marking conversation as read:', error);
    res.status(500).json({ message: 'Error marking conversation as read', error });
  }
};


// Delete a conversation
export const deleteConversation = async (req, res) => {
  const { conversationId } = req.body;

  if (!conversationId) {
    return res.status(400).json({ message: 'Conversation ID is required' });
  }

  try {
    const deletedConversation = await Contact.findOneAndDelete({ conversationId });

    if (!deletedConversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    res.status(200).json({ message: 'Conversation deleted successfully' });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ message: 'Error deleting conversation', error });
  }
};

// Get conversations for a specific hotel user
export const getHotelChats = async (req, res) => {
  const { hotelId } = req.query; // Extract hotelId from query parameters

  if (!hotelId) {
    return res.status(400).json({ message: 'Hotel ID is required' });
  }

  try {
    // Fetch chats where the hotel user is the sender
    const chats = await Contact.find({ senderId: hotelId })
      .sort({ createdAt: -1 })
      .populate('messages.senderId', 'username email') // Populate sender details
      .populate('messages.receiverId', 'username email') // Populate receiver details
      .exec();

    res.status(200).json({ chats });
  } catch (error) {
    console.error('Error retrieving hotel chats:', error);
    res.status(500).json({ message: 'Error retrieving hotel chats', error });
  }
};
