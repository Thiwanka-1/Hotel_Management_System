import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
    {
      username: {
        type: String,
        required: true,
        unique: true,
      },
      email: {
        type: String,
        required: true,
        unique: true,
      },
      password: {
        type: String,
        required: true,
      },
      profilePicture: {
        type: String,
        default: "https://static.vecteezy.com/system/resources/previews/013/215/160/non_2x/picture-profile-icon-male-icon-human-or-people-sign-and-symbol-vector.jpg",
      },
      isAdmin: {
        type: Boolean,
        default: false, // Admin flag
      },
      hotelId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hotel',
        default: null, // Links to Hotel if it's a hotel account
      },
    },
    { timestamps: true }
  );
  
  export default mongoose.model('User', userSchema);
  