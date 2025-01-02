import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logo from './logo.png';

const HotelBookingManagement = () => {
  const { currentUser } = useSelector((state) => state.user);
  const [bookings, setBookings] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [reportType, setReportType] = useState('');
  const [reportDateRange, setReportDateRange] = useState({ startDate: '', endDate: '' });
  const [reportMonth, setReportMonth] = useState('');
  const [reportYear, setReportYear] = useState('');
  const navigate = useNavigate();

  // Fetch bookings for the logged-in hotel
  const fetchHotelBookings = async () => {
    try {
      const response = await fetch(`/api/booking/hotel/${currentUser.hotelId}`);
      const data = await response.json();
      if (data.success) {
        setBookings(data.bookings);
      } else {
        setErrorMessage('Failed to fetch bookings for this hotel.');
      }
    } catch (error) {
      setErrorMessage('Error fetching bookings for this hotel.');
    }
  };

  useEffect(() => {
    if (currentUser?.hotelId) {
      fetchHotelBookings();
    }
  }, [currentUser]);

  // Apply filters
  const filteredBookings = bookings.filter((booking) => {
    const matchesStatus = !statusFilter || booking.status === statusFilter;
    const matchesSearch =
      !searchTerm || booking.confirmationNumber.toLowerCase().includes(searchTerm.toLowerCase());
  
    // Filter by report criteria
    const bookingStartDate = new Date(booking.dateRange.startDate);
    const bookingEndDate = new Date(booking.dateRange.endDate);
    let matchesReportCriteria = true;
  
    if (reportType === 'range' && reportDateRange.startDate && reportDateRange.endDate) {
      const reportStartDate = new Date(reportDateRange.startDate);
      const reportEndDate = new Date(reportDateRange.endDate);
      matchesReportCriteria =
        bookingStartDate >= reportStartDate && bookingEndDate <= reportEndDate;
    } else if (reportType === 'month' && reportMonth) {
      const [year, month] = reportMonth.split('-');
      matchesReportCriteria =
        bookingStartDate.getFullYear() === parseInt(year, 10) &&
        bookingStartDate.getMonth() === parseInt(month, 10) - 1;
    } else if (reportType === 'year' && reportYear) {
      matchesReportCriteria = bookingStartDate.getFullYear() === parseInt(reportYear, 10);
    }
  
    return matchesStatus && matchesSearch && matchesReportCriteria;
  });
  

  // Toggle booking confirmation
  const handleToggleConfirmation = async (bookingId, currentStatus) => {
    const updatedStatus = currentStatus === 'pending' ? 'confirmed' : 'pending';
    try {
      const response = await fetch(`/api/booking/toggle-status/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: updatedStatus }),
      });
      const data = await response.json();
      if (data.success) {
        setSuccessMessage(`Booking status updated to ${updatedStatus}.`);
        fetchHotelBookings(); // Refresh bookings
      } else {
        setErrorMessage(data.message);
      }
    } catch (error) {
      setErrorMessage('Error updating booking status.');
    }
  };

  // Cancel a booking
  const handleCancelBooking = async (bookingId) => {
    try {
      const response = await fetch(`/api/booking/cancel/${bookingId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        setSuccessMessage('Booking cancelled successfully.');
        fetchHotelBookings(); // Refresh bookings
      } else {
        setErrorMessage(data.message);
      }
    } catch (error) {
      setErrorMessage('Error cancelling booking.');
    }
  };

  const generateReport = () => {
    const doc = new jsPDF();
  
    // Add logo
    doc.addImage(logo, 'PNG', 10, 25, 40, 20);
  
    // Add header
    doc.setFontSize(16);
    doc.text('Bookings Report', 55, 20);
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 55, 28);
    doc.text('Company: Lavendish Leisure Hotels & Resorts', 55, 36);
    doc.text('Address: No: 12, Level 5, Dehiwala Road, Maharagama', 55, 44);
    doc.text('Phone: +94 11 208 8865 / +94 75 220 0202', 55, 52);
    doc.text('Website: www.lavendishleisure.com', 55, 59);
  
    // Add line separator
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(10, 65, 200, 65);
  
    // Add report period
    let reportDetailsY = 70;
    if (reportType === 'range' && reportDateRange.startDate && reportDateRange.endDate) {
      doc.text(`Report Period: ${reportDateRange.startDate} to ${reportDateRange.endDate}`, 10, reportDetailsY);
    } else if (reportType === 'month' && reportMonth) {
      doc.text(`Report Month: ${reportMonth}`, 10, reportDetailsY);
    } else if (reportType === 'year' && reportYear) {
      doc.text(`Report Year: ${reportYear}`, 10, reportDetailsY);
    }
  
    // Calculate totals
    const totalRevenue = filteredBookings.reduce((sum, booking) => sum + booking.totalPrice, 0);
    const roomCounts = filteredBookings.reduce((counts, booking) => {
      for (const [roomType, details] of Object.entries(booking.rooms || {})) {
        counts[roomType] = (counts[roomType] || 0) + (details.count || 0);
      }
      return counts;
    }, {});
  
    // Add summary section
    const summaryStartY = reportDetailsY + 10;
    doc.setFontSize(14);
    doc.text('Summary:', 10, summaryStartY);
    doc.setFontSize(12);
    doc.text(`Total Bookings: ${filteredBookings.length}`, 10, summaryStartY + 10);
    doc.text(`Total Revenue: Rs. ${totalRevenue.toFixed(2)}`, 10, summaryStartY + 20);
    doc.text('Rooms Booked:', 10, summaryStartY + 30);
  
    let yPosition = summaryStartY + 40;
    for (const [roomType, count] of Object.entries(roomCounts)) {
      doc.text(`${roomType.charAt(0).toUpperCase() + roomType.slice(1)}: ${count}`, 15, yPosition);
      yPosition += 10;
    }
  
    // Add bookings table
    doc.autoTable({
      startY: yPosition + 10,
      head: [['Customer', 'Date Range', 'Total Price', 'Status']],
      body: filteredBookings.map((booking) => [
        booking.customerName,
        `${new Date(booking.dateRange.startDate).toLocaleDateString()} - ${new Date(
          booking.dateRange.endDate
        ).toLocaleDateString()}`,
        `Rs. ${booking.totalPrice.toFixed(2)}`,
        booking.status,
      ]),
    });
  
    // Save the PDF
    doc.save('Hotel_Bookings_Report.pdf');
  };
  

  return (
    <div className="container mx-auto py-8">
      <h2 className="text-4xl font-bold text-center text-indigo-600 mb-8">Manage Hotel Bookings</h2>
  
      {/* Generate Report Section */}
      <div className="mb-6 flex flex-col items-end bg-gray-100 p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Generate Report</h3>
        <div className="flex flex-col gap-4 w-full max-w-md">
          <div>
            <label className="block text-sm font-medium text-gray-700">Select Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-3"
            >
              <option value="range">Date Range</option>
              <option value="month">Specific Month</option>
              <option value="year">Specific Year</option>
            </select>
          </div>
          {reportType === 'range' && (
            <div className="flex gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Start Date</label>
                <input
                  type="date"
                  value={reportDateRange.startDate}
                  onChange={(e) =>
                    setReportDateRange((prev) => ({ ...prev, startDate: e.target.value }))
                  }
                  className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">End Date</label>
                <input
                  type="date"
                  value={reportDateRange.endDate}
                  onChange={(e) =>
                    setReportDateRange((prev) => ({ ...prev, endDate: e.target.value }))
                  }
                  className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-3"
                />
              </div>
            </div>
          )}
          {reportType === 'month' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Select Month</label>
              <input
                type="month"
                value={reportMonth}
                onChange={(e) => setReportMonth(e.target.value)}
                className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-3"
              />
            </div>
          )}
          {reportType === 'year' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Select Year</label>
              <input
                type="number"
                value={reportYear}
                onChange={(e) => setReportYear(e.target.value)}
                placeholder="Enter year (e.g., 2023)"
                className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-3"
              />
            </div>
          )}
          <button
            onClick={generateReport}
            className="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700"
          >
            Generate Report
          </button>
        </div>
      </div>
  
      {/* Filters Section */}
      <div className="flex flex-wrap gap-6 mb-6 justify-between">
        <div className="w-full md:w-1/3">
          <label className="block text-sm font-medium text-gray-700">Filter by Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-3"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
          </select>
        </div>
        <div className="w-full md:w-1/3">
          <label className="block text-sm font-medium text-gray-700">Search by Confirmation Number</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Enter confirmation number"
            className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-3"
          />
        </div>
      </div>
  
      {/* Success and Error Messages */}
      {errorMessage && (
        <div className="bg-red-100 p-4 rounded-lg mb-6">
          <p className="text-red-500 text-sm">{errorMessage}</p>
        </div>
      )}
      {successMessage && (
        <div className="bg-green-100 p-4 rounded-lg mb-6">
          <p className="text-green-500 text-sm">{successMessage}</p>
        </div>
      )}
  
      {/* Bookings Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 shadow-sm rounded-md">
          <thead className="bg-indigo-100">
            <tr>
              <th className="px-4 py-2 border">Customer</th>
              <th className="px-4 py-2 border">Date Range</th>
              <th className="px-4 py-2 border">Confirmation Number</th>
              <th className="px-4 py-2 border">Status</th>
              <th className="px-4 py-2 border">Created At</th>
              <th className="px-4 py-2 border">Last Updated At</th>
              <th className="px-4 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.map((booking) => (
              <tr key={booking._id} className="hover:bg-gray-100">
                <td className="px-4 py-2 border">{booking.customerName}</td>
                <td className="px-4 py-2 border">
                  {new Date(booking.dateRange.startDate).toLocaleDateString()} -{' '}
                  {new Date(booking.dateRange.endDate).toLocaleDateString()}
                </td>
                <td className="px-4 py-2 border">{booking.confirmationNumber}</td>
                <td className="px-4 py-2 border">{booking.status}</td>
                <td className="px-4 py-2 border">{new Date(booking.createdAt).toLocaleString()}</td>
                <td className="px-4 py-2 border">{new Date(booking.updatedAt).toLocaleString()}</td>
                <td className="px-4 py-2 border flex gap-2">
                  <button
                    onClick={() => navigate(`/hotel-booking-details/${booking._id}`)}
                    className="bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600"
                  >
                    Details
                  </button>
                  <button
                    onClick={() => navigate(`/update-booking/${booking._id}`)}
                    className="bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600"
                  >
                    Update
                  </button>
                  <button
                    onClick={() => handleToggleConfirmation(booking._id, booking.status)}
                    className={`px-3 py-1 rounded-md ${
                      booking.status === 'pending'
                        ? 'bg-yellow-500 hover:bg-yellow-600'
                        : 'bg-gray-500 hover:bg-gray-600'
                    } text-white`}
                  >
                    {booking.status === 'pending' ? 'Confirm' : 'Pending'}
                  </button>
                  <button
                    onClick={() => handleCancelBooking(booking._id)}
                    className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600"
                  >
                    Cancel
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

export default HotelBookingManagement;
