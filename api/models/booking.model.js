import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

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
      default: () => uuidv4(),
    },
    totalGuests: {
      adults: { type: Number, default: 0 },
      children: { type: Number, default: 0 },
    },
    rooms: {
      single: { count: { type: Number, default: 0 }, pricePerRoom: { type: Number, default: 0 } },
      double: { count: { type: Number, default: 0 }, pricePerRoom: { type: Number, default: 0 } },
      triple: { count: { type: Number, default: 0 }, pricePerRoom: { type: Number, default: 0 } },
      family: { count: { type: Number, default: 0 }, pricePerRoom: { type: Number, default: 0 } },
      suite: { count: { type: Number, default: 0 }, pricePerRoom: { type: Number, default: 0 } },
    },
    dateRange: {
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
    },
    stayType: {
      type: String,
      enum: ['Room Only', 'Bed & Breakfast', 'Full Board', 'Half Board'],
      required: true,
    },
    specialRequests: {
      type: String,
      default: 'No special requests',
    },
    totalPrice: { type: Number, required: true },
    status: { type: String, enum: ['confirmed', 'pending'], default: 'pending' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    notifications: {
      lowAvailability: { type: Boolean, default: false }, // New field for low availability alerts
    },
  },
  { timestamps: true } // Automatically manage `createdAt` and `updatedAt`
);

export default mongoose.model('Booking', BookingSchema);
