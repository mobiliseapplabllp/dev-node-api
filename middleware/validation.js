/**
 * Input validation middleware
 * Provides security and data validation for API endpoints
 */

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return { valid: false, message: 'Password must be a string' };
  }
  if (password.length < 6) {
    return { valid: false, message: 'Password must be at least 6 characters long' };
  }
  if (password.length > 128) {
    return { valid: false, message: 'Password must be less than 128 characters' };
  }
  return { valid: true };
};

const sanitizeInput = (input) => {
  if (typeof input !== 'string') {
    return input;
  }
  // Remove leading/trailing whitespace and limit length
  return input.trim().substring(0, 255);
};

const validateLogin = (req, res, next) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Username and password are required'
    });
  }

  const sanitizedUsername = sanitizeInput(String(username));
  const sanitizedPassword = String(password);

  if (sanitizedUsername.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Username cannot be empty'
    });
  }

  if (sanitizedPassword.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Password cannot be empty'
    });
  }

  // Prevent SQL injection attempts (basic check)
  const sqlInjectionPattern = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i;
  if (sqlInjectionPattern.test(sanitizedUsername) || sqlInjectionPattern.test(sanitizedPassword)) {
    console.warn(`⚠️  Potential SQL injection attempt detected from IP: ${req.ip}`);
    return res.status(400).json({
      success: false,
      message: 'Invalid characters in input'
    });
  }

  req.body.username = sanitizedUsername;
  req.body.password = sanitizedPassword;
  next();
};

const validateUserRegistration = (req, res, next) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Username, email, and password are required'
    });
  }

  const sanitizedUsername = sanitizeInput(String(username));
  const sanitizedEmail = sanitizeInput(String(email).toLowerCase());
  const sanitizedPassword = String(password);

  if (sanitizedUsername.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Username cannot be empty'
    });
  }

  if (!validateEmail(sanitizedEmail)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email format'
    });
  }

  const passwordValidation = validatePassword(sanitizedPassword);
  if (!passwordValidation.valid) {
    return res.status(400).json({
      success: false,
      message: passwordValidation.message
    });
  }

  req.body.username = sanitizedUsername;
  req.body.email = sanitizedEmail;
  req.body.password = sanitizedPassword;
  next();
};

module.exports = {
  validateLogin,
  validateUserRegistration,
  validateEmail,
  validatePassword,
  sanitizeInput
};

