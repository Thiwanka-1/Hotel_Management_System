import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  date: { type: Date, required: true, index: true }, // Ensure each date is unique
  single: { type: Number, default: 0 },
  double: { type: Number, default: 0 },
  triple: { type: Number, default: 0 },
  family: { type: Number, default: 0 },
  suite: { type: Number, default: 0 },
});

const HotelSchema = new mongoose.Schema(
  {
    hotelName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    location: { type: String, required: true },
    roomDetails: {
      single: { type: Number, default: 0 },
      double: { type: Number, default: 0 },
      triple: { type: Number, default: 0 },
      family: { type: Number, default: 0 },
      suite: { type: Number, default: 0 },
    },
    roomAvailability: {
      type: [roomSchema],
      validate: {
        validator: (val) => {
          const dates = val.map((entry) => entry.date.toISOString());
          return dates.length === new Set(dates).size; // Ensure no duplicate dates
        },
        message: 'Duplicate dates found in room availability.',
      },
    },
    stayType: { type: [String], default: [] },
    totalRooms: { type: Number, required: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);


export default mongoose.model('Hotel', HotelSchema);
