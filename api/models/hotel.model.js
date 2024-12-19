import mongoose from 'mongoose';

const hotelSchema = new mongoose.Schema({
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
  totalRooms: { type: Number, required: true },
  stayType: [{ type: String, enum: ['Bed & Breakfast', 'Full Board', 'Half Board'] }],
  password: { type: String, required: true }, // For hotel account login
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model('Hotel', hotelSchema);
