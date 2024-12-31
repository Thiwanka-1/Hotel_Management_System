import React, { useState, useRef } from 'react';
import axios from 'axios';

const AddHotel = () => {
  const [formData, setFormData] = useState({
    hotelName: '',
    email: '',
    location: '',
    password: '',
    roomDetails: {
      single: '',
      double: '',
      triple: '',
      family: '',
      suite: '',
    },
    stayType: [],
  });

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false); // For password toggle
  const stayTypeRef = useRef([]); // Ref to track stayType checkboxes

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.includes('roomDetails.')) {
      const roomType = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        roomDetails: {
          ...prev.roomDetails,
          [roomType]: Number(value),
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      stayType: checked
        ? [...prev.stayType, value]
        : prev.stayType.filter((type) => type !== value),
    }));
  };

  const resetCheckboxes = () => {
    stayTypeRef.current.forEach((checkbox) => {
      if (checkbox) checkbox.checked = false;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      // Correct total rooms calculation logic
      const totalRooms = Object.values(formData.roomDetails).reduce(
        (sum, count) => sum + Number(count || 0),
        0
      );

      const dataToSubmit = {
        ...formData,
        totalRooms, // Add total rooms to the form data
      };

      const response = await axios.post(
        'http://localhost:3000/api/hotel/add', // Adjust URL as needed
        dataToSubmit,
        { withCredentials: true }
      );

      setMessage(response.data.message || 'Hotel added successfully!');
      setFormData({
        hotelName: '',
        email: '',
        location: '',
        password: '',
        roomDetails: {
          single: '',
          double: '',
          triple: '',
          family: '',
          suite: '',
        },
        stayType: [],
      });
      resetCheckboxes(); // Reset the checkboxes
    } catch (err) {
      setError(err.response?.data?.message || 'Error adding hotel.');
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-r from-blue-200 to-indigo-300">
      <div className="w-full max-w-lg bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-3xl font-bold text-center mb-6 text-indigo-700">
          Add New Hotel
        </h2>
        {message && <p className="text-green-600 text-center mb-4">{message}</p>}
        {error && <p className="text-red-600 text-center mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="hotelName"
            placeholder="Hotel Name"
            value={formData.hotelName}
            onChange={handleChange}
            className="w-full border rounded-lg p-3 focus:ring focus:ring-indigo-200"
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className="w-full border rounded-lg p-3 focus:ring focus:ring-indigo-200"
            required
          />
          <input
            type="text"
            name="location"
            placeholder="Location"
            value={formData.location}
            onChange={handleChange}
            className="w-full border rounded-lg p-3 focus:ring focus:ring-indigo-200"
            required
          />
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className="w-full border rounded-lg p-3 focus:ring focus:ring-indigo-200"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-3 flex items-center text-indigo-500"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          <div className="space-y-3">
            <h4 className="font-medium">Room Details:</h4>
            {['single', 'double', 'triple', 'family', 'suite'].map((roomType) => (
              <div key={roomType} className="flex items-center">
                <label className="w-32 capitalize">{roomType} Rooms:</label>
                <input
                  type="number"
                  name={`roomDetails.${roomType}`}
                  value={formData.roomDetails[roomType]}
                  onChange={handleChange}
                  className="border rounded-lg p-2 flex-1 focus:ring focus:ring-indigo-200"
                  min="0"
                  placeholder="0"
                />
              </div>
            ))}
          </div>
          <div className="space-y-3">
            <h4 className="font-medium">Stay Type:</h4>
            {['Room Only', 'Bed & Breakfast', 'Full Board', 'Half Board'].map((type, index) => (
              <label key={type} className="flex items-center">
                <input
                  type="checkbox"
                  value={type}
                  onChange={handleCheckboxChange}
                  className="mr-2"
                  ref={(el) => (stayTypeRef.current[index] = el)} // Track checkbox reference
                />
                {type}
              </label>
            ))}
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white rounded-lg p-3 hover:bg-indigo-700 focus:ring focus:ring-indigo-200"
          >
            Add Hotel
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddHotel;
