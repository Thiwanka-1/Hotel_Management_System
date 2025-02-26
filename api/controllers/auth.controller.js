import User from '../models/user.model.js';
import bcryptjs from 'bcryptjs';
import { errorHandler } from '../utils/error.js';
import jwt from 'jsonwebtoken';

export const signup = async (req, res, next) => {
  const { username, email, password, isAdmin } = req.body;
  const hashedPassword = bcryptjs.hashSync(password, 10);

  // Allow creating admin accounts only when explicitly requested
  const newUser = new User({
    username,
    email,
    password: hashedPassword,
    isAdmin: isAdmin || false, // Default to false if not provided
  });

  try {
    await newUser.save();
    res.status(201).json({ message: 'User created successfully', isAdmin: newUser.isAdmin });
  } catch (error) {
    next(error);
  }
};


export const signin = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    // Find the user by email
    const validUser = await User.findOne({ email });
    if (!validUser) return next(errorHandler(404, 'User not found'));

    // Validate the password
    const validPassword = bcryptjs.compareSync(password, validUser.password);
    if (!validPassword) return next(errorHandler(401, 'Wrong credentials'));

    // Create the token payload
    const tokenPayload = {
      id: validUser._id,          // User ID
      isAdmin: validUser.isAdmin, // Admin flag
      hotelId: validUser.hotelId || null, // Hotel ID for hotel users
    };

    // Generate the JWT token
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '1d' });

    // Exclude the password from the response
    const { password: hashedPassword, ...rest } = validUser._doc;

    // Set the cookie and send the response
    const expiryDate = new Date(Date.now() + 86400000); // 1 day
    res
      .cookie('access_token', token, { httpOnly: true, expires: expiryDate })
      .status(200)
      .json({ ...rest, token, role: validUser.isAdmin ? 'admin' : 'user' });
  } catch (error) {
    next(error);
  }
};


export const google = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (user) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
      const { password: hashedPassword, ...rest } = user._doc;
      const expiryDate = new Date(Date.now() + 86400000); // 1 hour
      res
        .cookie('access_token', token, {
          httpOnly: true,
          expires: expiryDate,
        })
        .status(200)
        .json(rest);
    } else {
      const generatedPassword =
        Math.random().toString(36).slice(-8) +
        Math.random().toString(36).slice(-8);
      const hashedPassword = bcryptjs.hashSync(generatedPassword, 10);
      const newUser = new User({
        username:
          req.body.name.split(' ').join('').toLowerCase() +
          Math.random().toString(36).slice(-8),
        email: req.body.email,
        password: hashedPassword,
        profilePicture: req.body.photo,
      });
      await newUser.save();
      const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET);
      const { password: hashedPassword2, ...rest } = newUser._doc;
      const expiryDate = new Date(Date.now() + 86400000); // 1 hour
      res
        .cookie('access_token', token, {
          httpOnly: true,
          expires: expiryDate,
        })
        .status(200)
        .json(rest);
    }
  } catch (error) {
    next(error);
  }
};

export const signout = (req, res) => {
  res.clearCookie('access_token').status(200).json('Signout success!');
};