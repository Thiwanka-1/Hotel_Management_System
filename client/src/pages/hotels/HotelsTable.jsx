import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const HotelsTable = () => {
  const [hotels, setHotels] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/hotel/getall', { withCredentials: true });
        setHotels(response.data);
      } catch (err) {
        setError('Error fetching hotels.');
      }
    };

    fetchHotels();
  }, []);

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this hotel?');
    if (!confirmDelete) return;

    try {
      const response = await axios.delete(`http://localhost:3000/api/hotel/delete/${id}`, { withCredentials: true });
      setMessage(response.data.message || 'Hotel deleted successfully.');
      setHotels((prev) => prev.filter((hotel) => hotel._id !== id));
    } catch (err) {
      setError('Error deleting hotel.');
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-6xl mx-auto bg-white shadow-lg rounded-lg p-4">
        <h1 className="text-2xl font-bold text-center mb-6">Manage Hotels</h1>
        {message && <p className="text-green-600 text-center mb-4">{message}</p>}
        {error && <p className="text-red-600 text-center mb-4">{error}</p>}
        <table className="w-full border-collapse border border-gray-200 text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 border border-gray-200">Name</th>
              <th className="p-3 border border-gray-200">Location</th>
              <th className="p-3 border border-gray-200">Email</th>
              <th className="p-3 border border-gray-200">Actions</th>
            </tr>
          </thead>
          <tbody>
            {hotels.map((hotel) => (
              <tr key={hotel._id} className="hover:bg-gray-50">
                <td className="p-3 border border-gray-200 text-blue-600 underline">
                  <Link to={`/hotels/${hotel._id}`}>{hotel.hotelName}</Link>
                </td>
                <td className="p-3 border border-gray-200">{hotel.location}</td>
                <td className="p-3 border border-gray-200">{hotel.email}</td>
                <td className="p-3 border border-gray-200 space-x-2">
                  <Link
                    to={`/hotels/update/${hotel._id}`}
                    className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                  >
                    Update
                  </Link>
                  <button
                    onClick={() => handleDelete(hotel._id)}
                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HotelsTable;
