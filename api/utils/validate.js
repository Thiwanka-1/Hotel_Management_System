export const validateHotelData = (data) => {
    const errors = {};
    let isValid = true;
  
    if (!data.hotelName || typeof data.hotelName !== 'string') {
      errors.hotelName = 'Hotel name is required and should be a string.';
      isValid = false;
    }
  
    if (!data.email || !/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(data.email)) {
      errors.email = 'A valid email address is required.';
      isValid = false;
    }
  
    if (!data.location || typeof data.location !== 'string') {
      errors.location = 'Location is required and should be a string.';
      isValid = false;
    }
  
    if (!data.roomDetails || typeof data.roomDetails !== 'object') {
      errors.roomDetails = 'Room details should be provided as an object.';
      isValid = false;
    }
  
    if (!data.stayType || !Array.isArray(data.stayType)) {
      errors.stayType = 'Stay type should be an array.';
      isValid = false;
    }
  
    if (!data.password || data.password.length < 6) {
      errors.password = 'Password should be at least 6 characters long.';
      isValid = false;
    }
  
    return { isValid, errors };
  };
  