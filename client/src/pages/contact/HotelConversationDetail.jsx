import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';

const HotelConversationDetail = () => {
  const { conversationId } = useParams(); // Get conversation ID from URL params
  const [messages, setMessages] = useState([]); // State for messages
  const [newMessage, setNewMessage] = useState(''); // State for the input message
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState(''); // Error state

  const { currentUser } = useSelector((state) => state.user); // Get the logged-in hotel user

  // Fetch conversation details
  const fetchConversation = async () => {
    try {
      const response = await axios.get(`/api/contact/conversation/${conversationId}`);
      setMessages(response.data.messages || []); // Set messages

      // Mark conversation as read
      await axios.post('/api/contact/read', { conversationId });
    } catch (err) {
      console.error('Error loading conversation:', err);
      setError('Error loading conversation');
    } finally {
      setLoading(false);
    }
  };

  // Fetch conversation on component mount or when conversationId changes
  useEffect(() => {
    if (conversationId) {
      fetchConversation();
    }
  }, [conversationId]);

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return; // Prevent sending empty messages

    try {
      await axios.post('/api/contact/reply', {
        conversationId,
        replyMessage: newMessage,
      });

      setNewMessage(''); // Clear the input field
      await fetchConversation(); // Fetch updated messages
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Error sending the message');
    }
  };

  return (
    <div className="conversation-detail max-w-4xl mx-auto p-6">
      {loading ? (
        <div className="text-center text-gray-500">Loading...</div>
      ) : error ? (
        <div className="bg-red-100 text-red-600 p-4 rounded-lg">{error}</div>
      ) : (
        <>
          {/* Messages Section */}
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
                    {msg.senderId._id === currentUser._id
                      ? `You (${currentUser.username})`
                      : 'Admin'}
                  </p>
                  <p>{msg.message}</p>
                  <p className="text-sm text-opacity-70 mt-2">
                    {new Date(msg.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Reply Section */}
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
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition shadow-md"
            >
              Send Message
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default HotelConversationDetail;
