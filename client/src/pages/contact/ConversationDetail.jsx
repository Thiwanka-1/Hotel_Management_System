import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import socket from './socket'; // Import the Socket.IO instance

const ConversationDetail = () => {
  const { conversationId } = useParams(); // Get conversation ID from URL params
  const [messages, setMessages] = useState([]); // State for messages
  const [senderDetails, setSenderDetails] = useState(null); // State for sender details
  const [newMessage, setNewMessage] = useState(''); // State for the input message
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState(''); // Error state

  const { currentUser } = useSelector((state) => state.user); // Get the logged-in user

  // Fetch conversation details
  const fetchConversation = async () => {
    try {
      const response = await axios.get(`/api/contact/conversation/${conversationId}`);
      const conversation = response.data;

      setMessages(conversation.messages || []); // Set messages
      setSenderDetails({
        hotelName: conversation.hotelName,
        senderName: conversation.senderId?.username,
        senderEmail: conversation.senderId?.email,
      });

      // Mark conversation as read
      await axios.post('/api/contact/read', { conversationId });
    } catch (err) {
      console.error('Error loading conversation:', err);
      setError('Error loading conversation');
    } finally {
      setLoading(false);
    }
  };

  // Real-time message listener and room joining
  useEffect(() => {
    if (conversationId) {
      fetchConversation();

      // Join the conversation room
      socket.emit('joinConversation', conversationId);

      // Listen for new messages via Socket.IO
      const handleNewMessage = (data) => {
        if (data.conversationId === conversationId) {
          setMessages((prevMessages) => {
            const isDuplicate = prevMessages.some((msg) => msg.timestamp === data.timestamp);
            if (!isDuplicate) {
              return [...prevMessages, data];
            }
            return prevMessages;
          });
        }
      };

      socket.on('newMessage', handleNewMessage);

      return () => {
        socket.off('newMessage', handleNewMessage); // Cleanup listener
      };
    }
  }, [conversationId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const messageData = {
      conversationId,
      senderId: currentUser._id,
      message: newMessage,
      timestamp: new Date().toISOString(),
    };

    try {
      // Optimistically add the message to the UI
      setMessages((prevMessages) => [...prevMessages, { ...messageData, senderId: { _id: currentUser._id } }]);

      // Emit the new message to the server
      socket.emit('sendMessage', messageData);

      // Clear the input field
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Error sending the message');
    }
  };

  const renderConversationInfo = () => {
    if (loading) {
      return <div>Loading...</div>;
    }

    if (error) {
      return <div>{error}</div>;
    }

    if (!senderDetails) {
      return <div>No sender details available.</div>;
    }

    return (
      <div className="conversation-info mb-6 p-4 border border-gray-200 rounded-lg shadow-md">
        <p className="font-medium text-gray-700">Hotel Name: {senderDetails.hotelName}</p>
        <p className="font-medium text-gray-700">Sender Name: {senderDetails.senderName}</p>
        <p className="font-medium text-gray-700">Sender Email: {senderDetails.senderEmail}</p>
      </div>
    );
  };

  return (
    <div className="conversation-detail max-w-4xl mx-auto p-6">
      {renderConversationInfo()}

      <div className="messages space-y-4 mb-6">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`message flex ${
              msg.senderId._id === currentUser._id ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`chat-bubble p-4 rounded-lg shadow-md max-w-sm ${
                msg.senderId._id === currentUser._id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-black'
              }`}
            >
              <p className="font-medium">
                {msg.senderId._id === currentUser._id ? 'You (Admin)' : msg.senderId.username || 'Hotel'}
              </p>
              <p>{msg.message}</p>
              <p className="text-sm text-opacity-70 mt-2">
                {new Date(msg.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="reply-section mt-6">
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your reply here..."
          className="w-full p-4 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
          rows="3"
        ></textarea>

        <button
          onClick={handleSendMessage}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
        >
          Send Message
        </button>
      </div>
    </div>
  );
};

export default ConversationDetail;
