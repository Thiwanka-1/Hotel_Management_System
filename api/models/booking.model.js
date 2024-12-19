import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid'; // Import UUID for generating unique confirmation numbers

const BookingSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      required: true,
    },
    hotelName: {
      type: String,
      required: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    customerEmail: {
      type: String,
      required: true,
    },
    customerPhone: {
      type: String,
      required: true,
    },
    confirmationNumber: {
      type: String,
      unique: true,
      default: () => uuidv4(), // Generate a unique confirmation number
    },
    totalGuests: {
      type: Number,
      required: true,
      min: 1,
    },
    singleRoom: {
      count: { type: Number, default: 0, min: 0 },
      pricePerRoom: { type: Number, default: 0, min: 0 },
    },
    doubleRoom: {
      count: { type: Number, default: 0, min: 0 },
      pricePerRoom: { type: Number, default: 0, min: 0 },
    },
    tripleRoom: {
      count: { type: Number, default: 0, min: 0 },
      pricePerRoom: { type: Number, default: 0, min: 0 },
    },
    familyRoom: {
      count: { type: Number, default: 0, min: 0 },
      pricePerRoom: { type: Number, default: 0, min: 0 },
    },
    suiteRoom: {
      count: { type: Number, default: 0, min: 0 },
      pricePerRoom: { type: Number, default: 0, min: 0 },
    },
    stayTypes: {
      type: [String], // Multiple options dropdown for stay types
      default: [],
    },
    dateRange: {
      startDate: {
        type: Date,
        required: true,
      },
      endDate: {
        type: Date,
        required: true,
      },
    },
    specialRequests: {
      type: String,
      default: 'No',
    },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Cancelled'],
      default: 'Pending',
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Booking', BookingSchema);

