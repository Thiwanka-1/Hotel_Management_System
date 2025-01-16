import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import socket from './socket'; // Import the Socket.IO instance

const AdminConversationsList = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await axios.get('/api/contact/messages', { params: { filter } });
        setConversations(response.data || []);
        setLoading(false);
      } catch (err) {
        setError('Error loading conversations');
        setLoading(false);
      }
    };

    fetchConversations();

    // Listen for new messages via Socket.IO
    socket.on('newMessage', (data) => {
      setConversations((prevConversations) =>
        prevConversations.map((conv) =>
          conv.conversationId === data.conversationId
            ? { ...conv, isReadByAdmin: false, status: 'Unread', updatedAt: new Date() }
            : conv
        )
      );
    });

    return () => {
      socket.off('newMessage'); // Cleanup on unmount
    };
  }, [filter]);

  // Mark conversation as read when navigating to it
  const handleNavigateToChat = async (conversationId) => {
    try {
      await axios.post('/api/contact/read', { conversationId });
      setConversations((prevConversations) =>
        prevConversations.map((conversation) =>
          conversation.conversationId === conversationId
            ? { ...conversation, isReadByAdmin: true, status: 'Read' }
            : conversation
        )
      );
      navigate(`/conversation/${conversationId}`); // Navigate to the selected conversation
    } catch (err) {
      console.error('Error marking conversation as read:', err);
    }
  };

  // Handle delete conversation
  const handleDeleteConversation = async (conversationId) => {
    try {
      const confirmDelete = window.confirm('Are you sure you want to delete this conversation?');
      if (!confirmDelete) return;

      await axios.post('/api/contact/delete', { conversationId });
      setConversations((prevConversations) =>
        prevConversations.filter((conversation) => conversation.conversationId !== conversationId)
      );
      alert('Conversation deleted successfully!');
    } catch (err) {
      console.error('Error deleting conversation:', err);
      alert('Failed to delete the conversation.');
    }
  };

  return (
    <div className="admin-conversations-list max-w-4xl mx-auto p-4">
      <h2 className="text-3xl font-semibold mb-6 text-gray-800">All Conversations</h2>
      <div className="mb-6 flex items-center">
        <label htmlFor="hotel-filter" className="mr-2 text-lg text-gray-600">
          Filter by Hotel:
        </label>
        <input
          id="hotel-filter"
          type="text"
          placeholder="Enter hotel name"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="p-2 border border-gray-300 rounded-lg w-1/3"
        />
      </div>
      {error && <div className="bg-red-100 text-red-600 p-4 mb-4 rounded-md">{error}</div>}
      {loading ? (
        <div className="flex justify-center items-center py-10 text-xl text-gray-500">Loading...</div>
      ) : (
        <div className="space-y-4">
          {conversations.length > 0 ? (
            conversations.map((conversation) => (
              <div
                key={conversation.conversationId}
                className={`block bg-white p-4 rounded-lg shadow-md hover:bg-gray-50 transition-all ${
                  !conversation.isReadByAdmin ? 'border-l-4 border-blue-500' : 'border-l-4 border-gray-300'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div
                    className="cursor-pointer"
                    onClick={() => handleNavigateToChat(conversation.conversationId)}
                  >
                    <h3 className="text-xl font-semibold text-gray-800">{`Conversation with ${conversation.senderId.username}`}</h3>
                    <p className="text-gray-600">
                      {conversation.messages[conversation.messages.length - 1]?.message || 'No message content'}
                    </p>
                    <p
                      className={`text-sm mt-2 ${
                        !conversation.isReadByAdmin ? 'text-blue-500' : 'text-gray-500'
                      }`}
                    >
                      Status: {!conversation.isReadByAdmin ? 'Unread' : 'Read'}
                    </p>
                  </div>
                  {!conversation.isReadByAdmin && (
                    <span className="text-sm bg-blue-500 text-white rounded-full px-2 py-1">New</span>
                  )}
                  <button
                    onClick={() => handleDeleteConversation(conversation.conversationId)}
                    className="ml-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-gray-500 text-center">No conversations found</div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminConversationsList;
