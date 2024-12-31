import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const HotelDetails = () => {
  const { id } = useParams();
  const [hotel, setHotel] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHotelDetails = async () => {
      try {
        const response = await axios.get(`http://localhost:3000/api/hotel/get/${id}`, { withCredentials: true });
        setHotel(response.data);
      } catch (err) {
        setError('Error fetching hotel details.');
      }
    };

    fetchHotelDetails();
  }, [id]);

  if (error) return <p className="text-red-600 text-center">{error}</p>;
  if (!hotel) return <p className="text-center">Loading...</p>;

  return (
    <div className="p-8 bg-gradient-to-r from-blue-200 to-indigo-300 min-h-screen flex justify-center items-center">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-xl p-8">
        <h1 className="text-4xl font-extrabold text-center text-indigo-700 mb-6">
          {hotel.hotelName}
        </h1>
        <div className="border-t border-gray-200 pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {/* Left Column */}
            <div>
              <h2 className="text-lg font-semibold text-indigo-600 mb-2">Hotel Information</h2>
              <ul className="space-y-2 text-gray-700">
                <li>
                  <strong className="block text-gray-900">Location:</strong> {hotel.location}
                </li>
                <li>
                  <strong className="block text-gray-900">Email:</strong> {hotel.email}
                </li>
                <li>
                  <strong className="block text-gray-900">Total Rooms:</strong> {hotel.totalRooms}
                </li>
                <li>
                  <strong className="block text-gray-900">Stay Types:</strong> {hotel.stayType.join(', ')}
                </li>
              </ul>
            </div>
            {/* Right Column */}
            <div>
              <h2 className="text-lg font-semibold text-indigo-600 mb-2">Room Details</h2>
              <ul className="space-y-2 text-gray-700">
                {Object.entries(hotel.roomDetails).map(([type, count]) => (
                  <li key={type}>
                    <strong className="block text-gray-900">
                      {type.charAt(0).toUpperCase() + type.slice(1)} Rooms:
                    </strong>{' '}
                    {count}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelDetails;
