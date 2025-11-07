const bcrypt = require('bcrypt');
const { promisePool } = require('../config/db');

const userController = {
  addUser: async (req, res) => {
    try {
      const { username, email, password, dob, mobile, role } = req.body;
      
      // Input validation
      if (!username || !email || !password) {
        return res.status(400).json({ 
          success: false, 
          message: 'Username, email, and password are required' 
        });
      }
  
      // Sanitize inputs
      const sanitizedUsername = String(username).trim();
      const sanitizedEmail = String(email).trim().toLowerCase();
      const sanitizedPassword = String(password);
      const sanitizedDob = dob ? String(dob).trim() : null;
      const sanitizedPhone = mobile ? String(mobile).trim() : null;
      const sanitizedRole = role ? String(role).trim() : 'user'; // Default to 'user' if not provided
  
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(sanitizedEmail)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid email format' 
        });
      }
  
      // Validate password strength
      if (sanitizedPassword.length < 6) {
        return res.status(400).json({ 
          success: false, 
          message: 'Password must be at least 6 characters long' 
        });
      }
  
      // Hash password before storing
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(sanitizedPassword, saltRounds);
  
      // Check if role column exists, if not, don't include it
      const sql = 'INSERT INTO `user` (`username`, `email`, `password`, `dob`, `phone`, `role`) VALUES (?, ?, ?, ?, ?, ?)';
      
      const [result] = await promisePool.execute(sql, [
        sanitizedUsername, 
        sanitizedEmail, 
        hashedPassword, 
        sanitizedDob, 
        sanitizedPhone,
        sanitizedRole
      ]);
      
      console.log(`✅ User added successfully: ${sanitizedUsername} (ID: ${result.insertId})`);
      
      res.status(201).json({ 
        success: true, 
        message: 'User added successfully!',
        userId: result.insertId 
      });
    } catch (error) {
      console.error('❌ Add user error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('SQL State:', error.sqlState);
      
      if (error.code === 'ER_DUP_ENTRY') {
        const field = error.message.includes('username') ? 'username' : 'email';
        return res.status(409).json({ 
          success: false, 
          message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists` 
        });
      }
      
      // Handle missing column error
      if (error.code === 'ER_BAD_FIELD_ERROR') {
        return res.status(500).json({ 
          success: false, 
          message: 'Database schema error: ' + error.message
        });
      }
      
      const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
      
      res.status(500).json({ 
        success: false, 
        message: isDevelopment 
          ? `Database error: ${error.message}` 
          : 'Failed to add user. Please try again later.',
        ...(isDevelopment && {
          errorCode: error.code,
          sqlState: error.sqlState,
          sqlMessage: error.sqlMessage
        })
      });
    }
  },

  getAllUsers: async (req, res) => {
    try {
      const { username } = req.body;       

      if (!username) {
        return res.status(400).json({
          success: false,
          message: 'Username is required'
        });
      }

      const sanitizedUsername = String(username).trim();
      
      // FIXED: Removed 'name' column (doesn't exist) and changed 'mobile' to 'phone'
      const sql = 'SELECT userid, username, email, dob, phone, status FROM user WHERE username = ?';

      const [results] = await promisePool.execute(sql, [sanitizedUsername]);

      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Remove sensitive data before sending
      const user = results[0];

      res.json({
        success: true,
        user: user
      });
    } catch (error) {
      console.error('❌ Get user error:', error);
      console.error('Error code:', error.code);
      
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      res.status(500).json({
        success: false,
        message: isDevelopment 
          ? `Database error: ${error.message}` 
          : 'Failed to retrieve user. Please try again later.'
      });
    }
  },



  getUserProfile: async (req, res) => {
    try {
      const userId = req.user.userId;
      
      // FIXED: Removed 'name' column and changed 'mobile' to 'phone' to match database
      const sql = 'SELECT userid, username, email, status, dob, phone FROM user WHERE userid = ?';
      
      const [results] = await promisePool.execute(sql, [userId]);
      
      if (results.length > 0) {
        res.json({ 
          success: true, 
          user: results[0] 
        });
      } else {
        res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }
    } catch (error) {
      console.error('❌ Get profile error:', error);
      console.error('Error code:', error.code);
      
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      res.status(500).json({ 
        success: false, 
        message: isDevelopment 
          ? `Database error: ${error.message}` 
          : 'Failed to retrieve profile. Please try again later.'
      });
    }
  },

  getUserById: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Validate ID
      const userId = parseInt(id);
      if (isNaN(userId) || userId <= 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid user ID' 
        });
      }
      
      // FIXED: Removed 'name' column and changed 'mobile' to 'phone' to match database
      const sql = 'SELECT userid, username, email, status, dob, phone FROM user WHERE userid = ?';
      
      const [results] = await promisePool.execute(sql, [userId]);
      
      if (results.length > 0) {
        res.json({ 
          success: true, 
          user: results[0] 
        });
      } else {
        res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }
    } catch (error) {
      console.error('❌ Get user by ID error:', error);
      console.error('Error code:', error.code);
      
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      res.status(500).json({ 
        success: false, 
        message: isDevelopment 
          ? `Database error: ${error.message}` 
          : 'Failed to retrieve user. Please try again later.'
      });
    }
  },
  updatePassword: async (req, res) => {
    try {
      const { userId, newPassword } = req.body;
  
      if (!userId || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'User ID and new password are required'
        });
      }

      // Validate password strength
      if (String(newPassword).length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long'
        });
      }

      // Hash the new password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(String(newPassword), saltRounds);
  
      // FIXED: Use 'userid' (lowercase) to match database column name
      const sql = 'UPDATE user SET password = ? WHERE userid = ?';
  
      const [result] = await promisePool.execute(sql, [hashedPassword, userId]);
  
      if (result.affectedRows > 0) {
        console.log(`✅ Password updated for user ID: ${userId}`);
        res.json({
          success: true,
          message: 'Password updated successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
    } catch (error) {
      console.error('❌ Update password error:', error);
      console.error('Error code:', error.code);
      
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      res.status(500).json({
        success: false,
        message: isDevelopment 
          ? `Database error: ${error.message}` 
          : 'Failed to update password. Please try again later.'
      });
    }
  },
  
};

module.exports = userController;