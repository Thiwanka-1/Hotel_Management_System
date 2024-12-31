import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const stayTypes = ['Room Only', 'Bed & Breakfast', 'Full Board', 'Half Board'];

const AdminBooking = () => {
    const { currentUser } = useSelector((state) => state.user);
    const [selectedDateRange, setSelectedDateRange] = useState({ startDate: '', endDate: '' });
    const [selectedHotel, setSelectedHotel] = useState('');
    const [availableRooms, setAvailableRooms] = useState([]);
    const [roomSelection, setRoomSelection] = useState({});
    const [guestDetails, setGuestDetails] = useState({ name: '', email: '', phone: '', adults: '', children: '' });
    const [stayType, setStayType] = useState('');
    const [specialRequests, setSpecialRequests] = useState('');
    const [bookingDetails, setBookingDetails] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [hotels, setHotels] = useState([]);
    const navigate = useNavigate();

    // Fetch available hotels
    const fetchHotels = async () => {
        try {
            const response = await fetch('/api/hotel/getall');
            const data = await response.json();
            setHotels(data);
        } catch (error) {
            setErrorMessage('Error fetching hotels.');
        }
    };

    // Fetch room availability for selected hotel and date range
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
                setErrorMessage('');
            } else {
                setAvailableRooms([]);
                setErrorMessage('No rooms available for the selected dates.');
            }
        } catch (error) {
            setErrorMessage('Error fetching room availability.');
        }
    };

    // Handle room selection input and validate dynamically
    const handleRoomSelectionChange = (e, roomType) => {
        const { value } = e.target;
        const updatedRoomSelection = {
            ...roomSelection,
            [roomType]: {
                count: parseInt(value, 10) || 0,
                pricePerRoom: roomSelection[roomType]?.pricePerRoom || 0,
            },
        };

        setRoomSelection(updatedRoomSelection);

        // Validate availability dynamically
        const unavailableDays = [];
        const insufficientRooms = [];

        availableRooms.forEach((roomData) => {
            const { date, ...rooms } = roomData;

            Object.entries(updatedRoomSelection).forEach(([type, details]) => {
                const { count } = details;
                if (count > 0) {
                    if (rooms[type] < count) {
                        if (rooms[type] === 0) {
                            unavailableDays.push(new Date(date).toISOString().split('T')[0]);
                        } else {
                            insufficientRooms.push({
                                date: new Date(date).toISOString().split('T')[0],
                                roomType: type,
                                available: rooms[type],
                            });
                        }
                    }
                }
            });
        });

        if (unavailableDays.length > 0) {
            setErrorMessage(
                `No availability for selected rooms on the following dates: ${unavailableDays.join(', ')}`
            );
        } else if (insufficientRooms.length > 0) {
            const message = insufficientRooms
                .map(
                    ({ date, roomType, available }) =>
                        `${roomType.charAt(0).toUpperCase() + roomType.slice(1)}: Only ${available} room(s) available on ${date}`
                )
                .join('. ');
            setErrorMessage(`Insufficient rooms: ${message}`);
        } else {
            setErrorMessage('');
        }
    };

    // Validate date range dynamically
    const validateDateRange = () => {
        const today = new Date();
        const startDate = new Date(selectedDateRange.startDate);
        const endDate = new Date(selectedDateRange.endDate);

        if (startDate < today || endDate < today) {
            setErrorMessage('You can only select today or future dates.');
            return false;
        }

        if (startDate > endDate) {
            setErrorMessage('Start date cannot be after end date.');
            return false;
        }

        setErrorMessage('');
        return true;
    };

    const validatePhone = (phone) => {
        const phoneRegex = /^[0-9]{10,15}$/; // Matches 10 to 15 digits
        return phoneRegex.test(phone);
    };

    const validateName = (name) => {
        const nameRegex = /^[a-zA-Z\s]+$/;
        return nameRegex.test(name);
    };

    const handleGuestDetailsChange = (e) => {
        const { name, value } = e.target;

        if (name === 'name' && !validateName(value) && value) {
            setErrorMessage('Name should contain only letters and spaces.');
            return;
        }

        if (name === 'phone') {
            if (value && !/^[0-9]*$/.test(value)) {
                setErrorMessage('Phone number can only contain digits.');
                return;
            }

            if (value.length >= 10 && !validatePhone(value)) {
                setErrorMessage('Please enter a valid phone number.');
                return;
            }

            setErrorMessage(''); // Clear error if valid
        }

        setErrorMessage(''); // Clear error message if validation passes
        setGuestDetails((prev) => ({ ...prev, [name]: value }));
    };

    // Calculate total price based on rooms and date range
const calculateTotalPrice = () => {
    if (!selectedDateRange.startDate || !selectedDateRange.endDate) return 0;

    const startDate = new Date(selectedDateRange.startDate);
    const endDate = new Date(selectedDateRange.endDate);
    const numberOfNights = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

    let total = 0;
    Object.values(roomSelection).forEach((room) => {
        total += (room.count || 0) * (room.pricePerRoom || 0) * numberOfNights;
    });
    return total;
};


    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedHotel || !guestDetails.name || !guestDetails.email || !guestDetails.phone || !stayType) {
            setErrorMessage('Please fill out all required fields.');
            return;
        }

        if (!validateDateRange()) {
            return; // Stop submission if date range validation fails
        }

        const bookingData = {
            hotelId: selectedHotel,
            customerName: guestDetails.name,
            customerEmail: guestDetails.email,
            customerPhone: guestDetails.phone,
            totalGuests: { adults: parseInt(guestDetails.adults, 10) || 0, children: parseInt(guestDetails.children, 10) || 0 },
            rooms: roomSelection,
            dateRange: selectedDateRange,
            stayType,
            specialRequests,
            totalPrice: calculateTotalPrice(),
        };

        try {
            const response = await fetch('/api/booking/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(bookingData),
            });
            const result = await response.json();
            if (result.success) {
                setBookingDetails(result.booking);
                setErrorMessage('');
                setSelectedHotel('');
                setSelectedDateRange({ startDate: '', endDate: '' });
                setRoomSelection({});
                setGuestDetails({ name: '', email: '', phone: '', adults: '', children: '' });
                setStayType('');
                setSpecialRequests('');
            } else {
                setErrorMessage(result.message);
            }
        } catch (error) {
            setErrorMessage('Error creating booking.');
        }
    };

    useEffect(() => {
        fetchHotels();
    }, []);

    useEffect(() => {
        fetchRoomAvailability();
    }, [selectedHotel, selectedDateRange]);

    // Filter hotels for non-admin users
    const filteredHotels = currentUser?.role === 'admin'
        ? hotels
        : hotels.filter((hotel) => hotel._id === currentUser?.hotelId);

    return (
        <div className="container mx-auto py-8">
            <h2 className="text-3xl font-bold text-center text-indigo-700">Book a Hotel Room</h2>
            <form onSubmit={handleSubmit} className="max-w-lg mx-auto bg-white p-8 rounded-lg shadow-lg mt-6">
                {/* Hotel Selection */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Hotel</label>
                    <select
                        value={selectedHotel}
                        onChange={(e) => setSelectedHotel(e.target.value)}
                        className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-3"
                        required
                    >
                        <option value="">Select a Hotel</option>
                        {filteredHotels.map((hotel) => (
                            <option key={hotel._id} value={hotel._id}>
                                {hotel.hotelName}
                            </option>
                        ))}
                    </select>
                </div>

            {/* Date Selection */}
              <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Date Range</label>
                  <div className="flex gap-4">
                      <input
                          type="date"
                          value={selectedDateRange.startDate}
                          onChange={(e) =>
                              setSelectedDateRange((prev) => ({ ...prev, startDate: e.target.value }))
                          }
                          className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-3"
                          min={new Date().toISOString().split('T')[0]} // Prevent past dates
                          required
                      />
                      <input
                          type="date"
                          value={selectedDateRange.endDate}
                          onChange={(e) =>
                              setSelectedDateRange((prev) => ({ ...prev, endDate: e.target.value }))
                          }
                          className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-3"
                          min={selectedDateRange.startDate} // Prevent selecting a date earlier than startDate
                          required
                      />
                  </div>
              </div>
  
              {/* Stay Type */}
              <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stay Type</label>
                  <select
                      value={stayType}
                      onChange={(e) => setStayType(e.target.value)}
                      className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-3"
                      required
                  >
                      <option value="">Select Stay Type</option>
                      {stayTypes.map((type) => (
                          <option key={type} value={type}>{type}</option>
                      ))}
                  </select>
              </div>
  
              {/* Special Requests */}
              <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Special Requests</label>
                  <textarea
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      placeholder="Enter any special requests (optional)"
                      className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-3"
                  />
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
                                              max={count}
                                              value={roomSelection[roomType]?.count || 0}
                                              onChange={(e) => handleRoomSelectionChange(e, roomType)}
                                              className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2"
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
                                              className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2"
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
                  <div className="mb-4">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Full Name</label>
                      <input
                          type="text"
                          name="name"
                          value={guestDetails.name}
                          onChange={handleGuestDetailsChange}
                          placeholder="Enter Guest Name"
                          className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-3"
                          required
                      />
                  </div>
                  <div className="mb-4">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Email Address</label>
                      <input
                          type="email"
                          name="email"
                          value={guestDetails.email}
                          onChange={handleGuestDetailsChange}
                          placeholder="Enter Email"
                          className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-3"
                          required
                      />
                  </div>
                  <div className="mb-4">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Phone Number</label>
                      <input
                          type="text"
                          name="phone"
                          value={guestDetails.phone}
                          onChange={handleGuestDetailsChange}
                          placeholder="Enter Phone Number"
                          className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-3"
                          required
                      />
                  </div>
                  <div className="flex gap-4">
                      <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-500 mb-1">Adults Count</label>
                          <input
                              type="number"
                              name="adults"
                              min="0"
                              value={guestDetails.adults || 0}
                              onChange={(e) =>
                                  setGuestDetails((prev) => ({ ...prev, adults: parseInt(e.target.value, 10) || 0 }))
                              }
                              placeholder="Number of Adults"
                              className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-3"
                              required
                          />
                      </div>
                      <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-500 mb-1">Children Count</label>
                          <input
                              type="number"
                              name="children"
                              min="0"
                              value={guestDetails.children || 0}
                              onChange={(e) =>
                                  setGuestDetails((prev) => ({ ...prev, children: parseInt(e.target.value, 10) || 0 }))
                              }
                              placeholder="Number of Children"
                              className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-3"
                          />
                      </div>
                  </div>
              </div>
  
              {/* Total Price */}
              <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Total Price</label>
                  <div className="text-lg font-semibold">Rs. {calculateTotalPrice()}</div>
              </div>
  
              {/* Error Message */}
              {errorMessage && (
                  <div className="bg-red-100 p-4 rounded-lg mb-6">
                      <p className="text-red-500 text-sm">{errorMessage}</p>
                  </div>
              )}
  
              {/* Submit Button */}
              <button
                  type="submit"
                  className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-md hover:bg-indigo-700 transition duration-300"
              >
                  Book Room
              </button>

            </form>
          {/* Booking Confirmation */}
          {bookingDetails && (
              <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50">
                  <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
                      <h3 className="text-lg font-semibold text-indigo-700 text-center mb-4">Booking Confirmed</h3>
                      <div className="space-y-2 text-center">
                          <p className="text-gray-700"><strong>Name:</strong> {bookingDetails.customerName}</p>
                          <p className="text-gray-700"><strong>Email:</strong> {bookingDetails.customerEmail}</p>
                          <p className="text-gray-700"><strong>Phone:</strong> {bookingDetails.customerPhone}</p>
                          <p className="text-gray-700"><strong>Confirmation Number:</strong> {bookingDetails.confirmationNumber}</p>
                          <p className="text-gray-700"><strong>Date Range:</strong> {new Date(bookingDetails.dateRange.startDate).toDateString()} - {new Date(bookingDetails.dateRange.endDate).toDateString()}</p>
                          <p className="text-gray-700"><strong>Total Price:</strong> Rs. {bookingDetails.totalPrice}</p>
                      </div>
                      <div className="mt-6 text-center">
                          <button
                              onClick={() => setBookingDetails(null)}
                              className="mt-4 bg-indigo-600 text-white font-semibold py-2 px-6 rounded-md hover:bg-indigo-700"
                          >
                              Close
                          </button>
                      </div>
                  </div>
              </div>
          )}
        </div>
    );
};

export default AdminBooking;
