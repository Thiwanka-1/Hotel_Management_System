import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const UpdateHotel = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false); // For password toggle

  useEffect(() => {
    const fetchHotel = async () => {
      try {
        const response = await axios.get(`http://localhost:3000/api/hotel/get/${id}`, { withCredentials: true });
        const { password, ...rest } = response.data; // Remove password from response data
        setFormData({ ...rest, password: '' }); // Initialize password field as empty
      } catch (err) {
        setError('Error fetching hotel details.');
      }
    };

    fetchHotel();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.includes('roomDetails.')) {
      const roomType = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        roomDetails: {
          ...prev.roomDetails,
          [roomType]: value === '' ? '' : Number(value), // Allow empty value
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const payload = { ...formData };

      // If the password field is empty, remove it from the payload
      if (!payload.password) {
        delete payload.password;
      }

      const response = await axios.put(`http://localhost:3000/api/hotel/update/${id}`, payload, { withCredentials: true });
      setMessage(response.data.message || 'Hotel updated successfully.');
      setTimeout(() => {
        navigate('/hotels', { state: { successMessage: response.data.message } }); // Redirect with success message
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating hotel.');
    }
  };

  if (error) return <p className="text-red-600 text-center">{error}</p>;
  if (!formData) return <p className="text-center">Loading...</p>;

  return (
    <div className="p-6 bg-gradient-to-r from-blue-200 to-indigo-300 min-h-screen">
      <div className="max-w-2xl mx-auto bg-white shadow-lg rounded-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-6 text-indigo-700">Update Hotel</h1>
        {message && <p className="text-green-600 text-center mb-4">{message}</p>}
        {error && <p className="text-red-600 text-center mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="hotelName"
            value={formData.hotelName}
            onChange={handleChange}
            className="w-full border rounded-lg p-3 focus:ring focus:ring-indigo-200"
            required
          />
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="w-full border rounded-lg p-3 focus:ring focus:ring-indigo-200"
            required
          />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full border rounded-lg p-3 focus:ring focus:ring-indigo-200"
            required
          />
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Enter new password (optional)"
              value={formData.password}
              onChange={handleChange}
              className="w-full border rounded-lg p-3 focus:ring focus:ring-indigo-200"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-3 flex items-center text-indigo-500"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">Room Details:</h4>
            {Object.entries(formData.roomDetails).map(([type, count]) => (
              <div key={type} className="flex items-center">
                <label className="w-32 capitalize">{type}:</label>
                <input
                  type="number"
                  name={`roomDetails.${type}`}
                  value={count === 0 ? '' : count} // Allow empty and display 0 placeholder
                  onChange={handleChange}
                  className="border rounded-lg p-2 flex-1 focus:ring focus:ring-indigo-200"
                  placeholder="0"
                  min="0"
                />
              </div>
            ))}
          </div>
          <div className="space-y-3">
            <h4 className="font-medium">Stay Type:</h4>
            {['Room Only', 'Bed & Breakfast', 'Full Board', 'Half Board'].map((type) => (
              <label key={type} className="flex items-center">
                <input
                  type="checkbox"
                  value={type}
                  checked={formData.stayType.includes(type)}
                  onChange={handleCheckboxChange}
                  className="mr-2"
                />
                {type}
              </label>
            ))}
          </div>
          <button type="submit" className="w-full bg-indigo-600 text-white rounded-lg p-3 hover:bg-indigo-700 focus:ring focus:ring-indigo-200">
            Update Hotel
          </button>
        </form>
      </div>
    </div>
  );
};

export default UpdateHotel;
