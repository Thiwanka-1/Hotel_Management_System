import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';

const ContactForm = () => {
  const { currentUser } = useSelector((state) => state.user); // Get current user from Redux
  const [hotelName, setHotelName] = useState('');
  const [hotels, setHotels] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [helpTopic, setHelpTopic] = useState(''); // For selecting the help topic

  // List of predefined help topics
  const helpTopics = [
    { label: 'Password Reset', value: 'password_reset' },
    { label: 'System Issue', value: 'system_issue' },
    { label: 'Account Query', value: 'account_query' },
    { label: 'Other', value: 'other' },
  ];

  // Fetch hotels for admin
  useEffect(() => {
    if (currentUser?.isAdmin) {
      // Fetch all hotels if the user is an admin
      axios.get('/api/hotel/getall')
        .then(response => {
          setHotels(response.data);
        })
        .catch(error => {
          setErrorMessage('Error fetching hotels.');
        });
    } else {
      // Set the logged-in user's hotel name for non-admin users
      setHotelName(currentUser?.username || 'Hotel Name Unavailable');
    }
  }, [currentUser]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
  
    // Validation to ensure all fields are filled in
    if (!hotelName || !helpTopic || !message) {
      setErrorMessage('All fields are required.');
      return;
    }
  
    setLoading(true);
    setErrorMessage('');
  
    try {
      const data = {
        hotelName,        // Hotel name
        helpTopic,        // Help topic
        message,          // Message
        senderId: currentUser._id,  // Sender ID (hotel staff ID)
      };
  
      const response = await axios.post('/api/contact', data, {
        withCredentials: true,
      });
  
      if (response.data.message === 'Message sent successfully!') {
        setMessage('');
        setHelpTopic('');
        alert('Message sent successfully');
      } else {
        setErrorMessage('Error sending message. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error.response?.data || error);
      setErrorMessage('Error sending message. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <div className="container mx-auto py-8">
      <h2 className="text-3xl font-bold text-center text-indigo-600 mb-6">
        Contact Support
      </h2>

      <div className="max-w-lg mx-auto bg-white p-6 rounded-md shadow-md">
        {/* Display hotel name for non-admin */}
        {!currentUser?.isAdmin && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Hotel Name</label>
            <input
              type="text"
              value={hotelName || 'Hotel Name Unavailable'}
              disabled
              className="block w-full border border-gray-300 rounded-md shadow-sm bg-gray-100 p-2"
            />
          </div>
        )}

        {/* Admin will be able to select hotel */}
        {currentUser?.isAdmin && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Hotel</label>
            <select
              value={hotelName}
              onChange={(e) => setHotelName(e.target.value)}
              className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2"
            >
              <option value="">Select a Hotel</option>
              {/* Map through the fetched hotels */}
              {hotels.map((hotel) => (
                <option key={hotel._id} value={hotel.hotelName}>
                  {hotel.hotelName}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Help Topic Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Help Topic</label>
          <select
            value={helpTopic}
            onChange={(e) => setHelpTopic(e.target.value)}
            className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2"
          >
            <option value="">Select Help Topic</option>
            {helpTopics.map((topic) => (
              <option key={topic.value} value={topic.value}>
                {topic.label}
              </option>
            ))}
          </select>
        </div>

        {/* Message input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-3"
            rows="4"
            required
          />
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="bg-red-100 p-4 rounded-lg mb-4">
            <p className="text-red-500 text-sm">{errorMessage}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          className="w-full bg-indigo-600 text-white font-semibold py-2 rounded-md hover:bg-indigo-700 transition"
        >
          {loading ? 'Sending...' : 'Send Message'}
        </button>
      </div>
    </div>
  );
};

export default ContactForm;
