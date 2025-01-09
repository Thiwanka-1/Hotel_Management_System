import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useSelector } from 'react-redux';

const ConversationsList = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { currentUser } = useSelector((state) => state.user); // Get logged-in hotel user

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await axios.get('/api/contact/get-hot', {
          params: { hotelId: currentUser._id }, // Pass the logged-in hotel's ID
        });
        setConversations(response.data.chats || []);
        setLoading(false);
      } catch (err) {
        console.error('Error loading conversations:', err);
        setError('Error loading conversations');
        setLoading(false);
      }
    };

    fetchConversations();
  }, [currentUser]);

  const markAsRead = async (conversationId) => {
    try {
      await axios.post('/api/contact/read', { conversationId });
      setConversations((prevConversations) =>
        prevConversations.map((conversation) =>
          conversation.conversationId === conversationId
            ? { ...conversation, isReadByHotel: true }
            : conversation
        )
      );
    } catch (err) {
      console.error('Error marking conversation as read:', err);
    }
  };

  return (
    <div className="conversations-list max-w-4xl mx-auto p-6">
      <h2 className="text-3xl font-semibold mb-6 text-gray-800">Your Conversations</h2>

      {error && <div className="bg-red-100 text-red-600 p-4 mb-4 rounded-md">{error}</div>}

      {loading ? (
        <div className="flex justify-center items-center py-10 text-xl text-gray-500">Loading...</div>
      ) : (
        <div className="space-y-4">
          {conversations.length > 0 ? (
            conversations.map((conversation) => (
              <Link
                key={conversation.conversationId}
                to={`/hotel/conversation/${conversation.conversationId}`}
                onClick={() => markAsRead(conversation.conversationId)} // Mark as read when clicked
                className={`block bg-white p-4 rounded-lg shadow-md hover:bg-gray-50 transition-all ${
                  !conversation.isReadByHotel ? 'border-l-4 border-blue-500' : 'border-l-4 border-gray-300'
                }`}
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-gray-800">Conversation with Admin</h3>
                  {!conversation.isReadByHotel && (
                    <span className="text-sm bg-blue-500 text-white rounded-full px-2 py-1">New</span>
                  )}
                </div>
                <p className="text-gray-600">
                  {conversation.messages[conversation.messages.length - 1]?.message}
                </p>
                <p
                  className={`text-sm mt-2 ${
                    !conversation.isReadByHotel ? 'text-blue-500' : 'text-gray-500'
                  }`}
                >
                  Status: {!conversation.isReadByHotel ? 'Unread' : 'Read'}
                </p>
              </Link>
            ))
          ) : (
            <div className="text-gray-500 text-center">No conversations found</div>
          )}
        </div>
      )}
    </div>
  );
};

export default ConversationsList;
