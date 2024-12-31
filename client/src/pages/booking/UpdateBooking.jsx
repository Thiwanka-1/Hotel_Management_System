import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const stayTypes = ['Room Only', 'Bed & Breakfast', 'Full Board', 'Half Board'];

const UpdateBooking = () => {
  const { id: bookingId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useSelector((state) => state.user);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [selectedHotel, setSelectedHotel] = useState('');
  const [selectedDateRange, setSelectedDateRange] = useState({ startDate: '', endDate: '' });
  const [roomSelection, setRoomSelection] = useState({});
  const [availableRooms, setAvailableRooms] = useState([]);
  const [guestDetails, setGuestDetails] = useState({ name: '', email: '', phone: '', adults: 0, children: 0 });
  const [stayType, setStayType] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch booking details
  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        const response = await fetch(`/api/booking/${bookingId}`);
        const data = await response.json();

        if (!response.ok) {
          setErrorMessage(data.message || 'Failed to fetch booking details.');
          return;
        }

        const booking = data.booking;
        setBookingDetails(booking);
        setSelectedHotel(booking.hotelId._id || '');
        setSelectedDateRange({
          startDate: new Date(booking.dateRange.startDate).toISOString().split('T')[0],
          endDate: new Date(booking.dateRange.endDate).toISOString().split('T')[0],
        });
        setRoomSelection(booking.rooms);
        setGuestDetails({
          name: booking.customerName,
          email: booking.customerEmail,
          phone: booking.customerPhone,
          adults: booking.totalGuests.adults,
          children: booking.totalGuests.children,
        });
        setStayType(booking.stayType);
        setSpecialRequests(booking.specialRequests || '');
      } catch (error) {
        setErrorMessage('Error fetching booking details.');
      }
    };

    fetchBookingDetails();
  }, [bookingId]);

  // Fetch room availability
  const fetchRoomAvailability = async () => {
    if (!selectedHotel || !selectedDateRange.startDate || !selectedDateRange.endDate) {
      return;
    }

    try {
      const response = await fetch(
        `/api/hotel/availability/${selectedHotel}?startDate=${selectedDateRange.startDate}&endDate=${selectedDateRange.endDate}`
      );
      const data = await response.json();

      if (data.success) {
        setAvailableRooms(data.availability);
      } else {
        setErrorMessage(data.message || 'No rooms available for the selected dates.');
      }
    } catch (error) {
      setErrorMessage('Error fetching room availability.');
    }
  };

  useEffect(() => {
    fetchRoomAvailability();
  }, [selectedHotel, selectedDateRange]);

  const handleRoomSelectionChange = (e, roomType) => {
    const { value } = e.target;
    setRoomSelection((prev) => ({
      ...prev,
      [roomType]: {
        ...prev[roomType],
        count: parseInt(value, 10) || 0,
      },
    }));
  };

  const calculateTotalPrice = () => {
    if (!selectedDateRange.startDate || !selectedDateRange.endDate) return 0;

    const startDate = new Date(selectedDateRange.startDate);
    const endDate = new Date(selectedDateRange.endDate);
    const numberOfNights = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

    return Object.values(roomSelection).reduce(
      (total, room) => total + (room.count || 0) * (room.pricePerRoom || 0) * numberOfNights,
      0
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const updatedBookingData = {
      dateRange: selectedDateRange,
      rooms: roomSelection,
      totalGuests: guestDetails,
      customerName: guestDetails.name,
      customerEmail: guestDetails.email,
      customerPhone: guestDetails.phone,
      stayType,
      specialRequests,
    };

    setLoading(true);

    try {
      const response = await fetch(`/api/booking/update/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedBookingData),
      });
    
      const data = await response.json();
    
      if (data.success) {
        await fetchRoomAvailability(); // Refresh availability after update
    
        // Role-based navigation
        const destination =
          currentUser?.role === 'admin'
            ? `/booking-details/${bookingId}`
            : `/hotel-booking-details/${bookingId}`;
    
        navigate(destination);
      } else {
        setErrorMessage(data.message || 'Failed to update booking.');
      }
    } catch (error) {
      setErrorMessage('Error updating booking.');
    } finally {
      setLoading(false);
    }
    
    
  };

  return (
    <div className="container mx-auto py-8">
      <h2 className="text-3xl font-bold text-center text-indigo-700">Update Booking</h2>

      {errorMessage && <div className="bg-red-100 text-red-500 p-4 rounded-lg mb-6">{errorMessage}</div>}

      {bookingDetails ? (
        <form onSubmit={handleSubmit} className="max-w-lg mx-auto bg-white p-8 rounded-lg shadow-lg">
          {/* Hotel Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Hotel</label>
            <input
              type="text"
              value={bookingDetails.hotelId.hotelName}
              disabled
              className="block w-full border border-gray-300 rounded-md shadow-sm p-3 bg-gray-100"
            />
          </div>

          {/* Date Range */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <div className="flex gap-4">
              <input
                type="date"
                value={selectedDateRange.startDate}
                onChange={(e) => setSelectedDateRange((prev) => ({ ...prev, startDate: e.target.value }))}
                className="block w-full border border-gray-300 rounded-md shadow-sm p-3"
              />
              <input
                type="date"
                value={selectedDateRange.endDate}
                onChange={(e) => setSelectedDateRange((prev) => ({ ...prev, endDate: e.target.value }))}
                className="block w-full border border-gray-300 rounded-md shadow-sm p-3"
              />
            </div>
          </div>

          {/* Stay Type */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Stay Type</label>
            <select
              value={stayType}
              onChange={(e) => setStayType(e.target.value)}
              className="block w-full border border-gray-300 rounded-md shadow-sm p-3"
            >
              <option value="">Select Stay Type</option>
              {stayTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Room Selection */}
          {availableRooms.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Rooms</label>
              {Object.entries(availableRooms[0] || {})
                .filter(([key]) => ['single', 'double', 'triple', 'family', 'suite'].includes(key))
                .map(([roomType, count]) => (
                  <div key={roomType} className="flex flex-col mb-4">
                    <span className="text-sm capitalize font-medium">
                      {`${roomType.charAt(0).toUpperCase() + roomType.slice(1)} Rooms (Available: ${count})`}
                    </span>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-500">Room Count</label>
                        <input
                          type="number"
                          min="0"
                          value={roomSelection[roomType]?.count || 0}
                          onChange={(e) => handleRoomSelectionChange(e, roomType)}
                          className="block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-500">Price Per Room</label>
                        <input
                          type="number"
                          min="0"
                          value={roomSelection[roomType]?.pricePerRoom || 0}
                          onChange={(e) =>
                            setRoomSelection((prev) => ({
                              ...prev,
                              [roomType]: {
                                ...prev[roomType],
                                pricePerRoom: parseFloat(e.target.value) || 0,
                              },
                            }))
                          }
                          className="block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* Guest Details */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Guest Details</label>
            <input
              type="text"
              value={guestDetails.name}
              onChange={(e) => setGuestDetails((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Guest Name"
              className="block w-full border border-gray-300 rounded-md shadow-sm p-3 mb-4"
            />
            <input
              type="email"
              value={guestDetails.email}
              onChange={(e) => setGuestDetails((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="Guest Email"
              className="block w-full border border-gray-300 rounded-md shadow-sm p-3 mb-4"
            />
            <input
              type="text"
              value={guestDetails.phone}
              onChange={(e) => setGuestDetails((prev) => ({ ...prev, phone: e.target.value }))}
              placeholder="Guest Phone"
              className="block w-full border border-gray-300 rounded-md shadow-sm p-3 mb-4"
            />
            <div className="flex gap-4">
              <input
                type="number"
                value={guestDetails.adults || 0}
                onChange={(e) => setGuestDetails((prev) => ({ ...prev, adults: parseInt(e.target.value, 10) || 0 }))}
                placeholder="Adults"
                className="block w-full border border-gray-300 rounded-md shadow-sm p-3"
              />
              <input
                type="number"
                value={guestDetails.children || 0}
                onChange={(e) => setGuestDetails((prev) => ({ ...prev, children: parseInt(e.target.value, 10) || 0 }))}
                placeholder="Children"
                className="block w-full border border-gray-300 rounded-md shadow-sm p-3"
              />
            </div>
          </div>

          {/* Total Price */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Total Price</label>
            <div className="text-lg font-semibold">Rs. {calculateTotalPrice()}</div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-md hover:bg-indigo-700 transition duration-300"
          >
            {loading ? 'Updating...' : 'Update Booking'}
          </button>
        </form>
      ) : (
        <div className="text-center">Loading booking details...</div>
      )}
    </div>
  );
};

export default UpdateBooking;
