import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

const CheckRoomAvailability = () => {
  const { currentUser } = useSelector((state) => state.user);
  const [selectedHotel, setSelectedHotel] = useState('');
  const [hotels, setHotels] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [availability, setAvailability] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch hotels
  const fetchHotels = async () => {
    try {
      const response = await fetch('/api/hotel/getall');
      const data = await response.json();
      setHotels(data);
    } catch (error) {
      setErrorMessage('Error fetching hotels.');
    }
  };

  // Fetch room availability
  const fetchAvailability = async () => {
    if (!selectedHotel || !startDate || !endDate) {
      setErrorMessage('Please select a hotel and date range.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch(
        `/api/hotel/availability/${selectedHotel}?startDate=${startDate}&endDate=${endDate}`
      );
      const data = await response.json();

      if (data.success) {
        setAvailability(data.availability);
      } else {
        setErrorMessage(data.message || 'No availability found.');
      }
    } catch (error) {
      setErrorMessage('Error fetching room availability.');
    } finally {
      setLoading(false);
    }
  };

  // Initialize hotels for admin or set default for hotel accounts
  useEffect(() => {
    if (!currentUser?.isAdmin) {
      setSelectedHotel(currentUser?.hotelId || '');
    } else {
      fetchHotels();
    }
  }, [currentUser]);

  const validateDates = () => {
    const today = new Date().toISOString().split('T')[0];
    if (startDate < today || endDate < today) {
      setErrorMessage('Only today or future dates can be selected.');
      return false;
    }

    if (startDate > endDate) {
      setErrorMessage('Start date cannot be after end date.');
      return false;
    }

    setErrorMessage('');
    return true;
  };

  const filteredHotels = hotels.filter((hotel) =>
    hotel.hotelName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto py-8">
      <h2 className="text-3xl font-bold text-center text-indigo-600 mb-6">
        Check Room Availability
      </h2>

      <div className="max-w-lg mx-auto bg-white p-6 rounded-md shadow-md">
        {/* Hotel Selection */}
        {currentUser?.isAdmin ? (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Hotel</label>
            <select
              value={selectedHotel}
              onChange={(e) => setSelectedHotel(e.target.value)}
              className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2"
            >
              <option value="">Select a Hotel</option>
              {filteredHotels.map((hotel) => (
                <option key={hotel._id} value={hotel._id}>
                  {hotel.hotelName}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Hotel</label>
            <input
              type="text"
              value={currentUser?.username || 'Hotel Name Unavailable'}
              disabled
              className="block w-full border border-gray-300 rounded-md shadow-sm bg-gray-100 p-2"
            />
          </div>
        )}

        {/* Date Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2"
            min={new Date().toISOString().split('T')[0]} // Prevent past dates
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2"
            min={startDate || new Date().toISOString().split('T')[0]} // Prevent selecting a date earlier than startDate
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
          onClick={() => {
            if (validateDates()) fetchAvailability();
          }}
          className="w-full bg-indigo-600 text-white font-semibold py-2 rounded-md hover:bg-indigo-700 transition"
        >
          {loading ? 'Checking...' : 'Check Availability'}
        </button>
      </div>

      {/* Availability Table */}
      {availability.length > 0 && (
        <div className="mt-8">
          <h3 className="text-2xl font-semibold text-gray-700 mb-4 text-center">
            Room Availability
          </h3>
          <table className="min-w-full bg-white border border-gray-200 shadow-md rounded-md">
            <thead className="bg-indigo-100">
              <tr>
                <th className="px-4 py-2 border">Date</th>
                <th className="px-4 py-2 border">Single</th>
                <th className="px-4 py-2 border">Double</th>
                <th className="px-4 py-2 border">Triple</th>
                <th className="px-4 py-2 border">Family</th>
                <th className="px-4 py-2 border">Suite</th>
              </tr>
            </thead>
            <tbody>
              {availability.map((entry) => (
                <tr key={entry.date} className="hover:bg-gray-100">
                  <td className="px-4 py-2 border">{entry.date.split('T')[0]}</td>
                  <td className="px-4 py-2 border">{entry.single}</td>
                  <td className="px-4 py-2 border">{entry.double}</td>
                  <td className="px-4 py-2 border">{entry.triple}</td>
                  <td className="px-4 py-2 border">{entry.family}</td>
                  <td className="px-4 py-2 border">{entry.suite}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CheckRoomAvailability;
