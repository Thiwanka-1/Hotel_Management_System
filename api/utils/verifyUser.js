import jwt from 'jsonwebtoken';
import { errorHandler } from './error.js';

export const verifyToken = (req, res, next) => {
  const token = req.cookies.access_token; // Using cookies to store token

  if (!token) {
    console.error('No token found in cookies');
    return next(errorHandler(401, 'You are not authenticated!'));
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error('Invalid token:', err.message);
      return next(errorHandler(403, 'Invalid token!'));
    }

    console.log('Decoded user from token:', user); // Log decoded user info
    req.user = user; // Attach user to the request
    next(); // Continue to the next middleware or route handler
  });
};


