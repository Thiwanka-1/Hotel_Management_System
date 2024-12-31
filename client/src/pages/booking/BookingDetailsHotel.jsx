import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const BookingDetailsHotel = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        const response = await fetch(`/api/booking/${id}`);
        const data = await response.json();
        if (data.success) {
          setBooking(data.booking);
        } else {
          setErrorMessage('Failed to fetch booking details.');
        }
      } catch (error) {
        setErrorMessage('Error fetching booking details.');
      }
    };

    fetchBookingDetails();
  }, [id]);

  if (errorMessage) {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-red-100 p-4 rounded-lg text-center">
          <p className="text-red-500">{errorMessage}</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="container mx-auto py-8">
        <p className="text-center text-gray-600">Loading booking details...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h2 className="text-3xl font-bold text-center text-indigo-600 mb-6">
        Booking Details
      </h2>
      <div className="bg-white p-8 rounded-md shadow-md">
        <div className="mb-6">
          <h3 className="text-2xl font-semibold text-gray-700 mb-4">General Information</h3>
          <p>
            <strong>Hotel:</strong> {booking.hotelName}
          </p>
          <p>
            <strong>Confirmation Number:</strong> {booking.confirmationNumber}
          </p>
          <p>
            <strong>Status:</strong> {booking.status}
          </p>
          <p>
            <strong>Stay Type:</strong> {booking.stayType}
          </p>
          <p>
            <strong>Total Price:</strong> Rs. {booking.totalPrice.toFixed(2)}
          </p>
          <p>
            <strong>Created At:</strong> {new Date(booking.createdAt).toLocaleString()}
          </p>
          <p>
            <strong>Last Updated At:</strong> {new Date(booking.updatedAt).toLocaleString()}
          </p>
        </div>
        <div className="mb-6">
          <h3 className="text-2xl font-semibold text-gray-700 mb-4">Customer Information</h3>
          <p>
            <strong>Name:</strong> {booking.customerName}
          </p>
          <p>
            <strong>Email:</strong> {booking.customerEmail}
          </p>
          <p>
            <strong>Phone:</strong> {booking.customerPhone}
          </p>
          <p>
            <strong>Special Requests:</strong> {booking.specialRequests || 'None'}
          </p>
        </div>
        <div className="mb-6">
          <h3 className="text-2xl font-semibold text-gray-700 mb-4">Booking Details</h3>
          <p>
            <strong>Date Range:</strong>{' '}
            {new Date(booking.dateRange.startDate).toLocaleDateString()} -{' '}
            {new Date(booking.dateRange.endDate).toLocaleDateString()}
          </p>
          <p>
            <strong>Total Guests:</strong>{' '}
            {`${booking.totalGuests.adults} Adults, ${booking.totalGuests.children} Children`}
          </p>
          <p>
            <strong>Rooms:</strong>{' '}
            {Object.entries(booking.rooms)
              .map(([type, details]) => `${type.charAt(0).toUpperCase() + type.slice(1)}: ${details.count}`)
              .join(', ')}
          </p>
        </div>
        <div className="flex justify-center">
        <button
          className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition"
          onClick={() => navigate('/hotelmanage')}
        >
          Back to Management
        </button>
      </div>
      </div>
    </div>
  );
};

export default BookingDetailsHotel;
