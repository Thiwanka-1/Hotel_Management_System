class APIError extends Error {
  constructor(statusCode, message, isOperational = true, stack = '') {
      super(message);
      this.statusCode = statusCode;
      this.isOperational = isOperational; // Indicates if error is expected (operational) or unexpected (programmer error)
      this.stack = stack || new Error().stack; // Captures the stack trace
  }
}

export const errorHandler = (statusCode, message) => {
  return new APIError(statusCode, message);
};
