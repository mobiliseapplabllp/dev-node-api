const db = require('../config/db');

const userController = {
  addUser: (req, res) => {
    try {
      const { username, email, password, dob, mobile } = req.body;
      
      if (!username || !email || !password) {
        return res.status(400).json({ 
          success: false, 
          message: 'Username, email, and password are required' 
        });
      }

      const sql = 'INSERT INTO `user` (`username`,`email`,`password`,`dob`,`mobile`) VALUES (?,?,?,?,?)';
      
      db.query(sql, [username, email, password, dob, mobile], (err, result) => {
        if (err) {
          console.error('Database error:', err);
          
          if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ 
              success: false, 
              message: 'Username or email already exists' 
            });
          }
          
          return res.status(500).json({ 
            success: false, 
            message: 'Database error' 
          });
        }
        
        res.status(201).json({ 
          success: true, 
          message: 'User added successfully!',
          userId: result.insertId 
        });
      });
    } catch (error) {
      console.error('Add user error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error' 
      });
    }
  },

  getAllUsers: (req, res) => {
    try {
      const { username } = req.body;       

      if (!username) {
        return res.status(400).json({
          success: false,
          message: 'Username is required'
        });
      }

      const sql = `
        SELECT *FROM user WHERE username = ?
      `;

      db.query(sql, [username], (err, results) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({
            success: false,
            message: 'Database error'
          });
        }

        if (results.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'User not found'
          });
        }

        res.json({
          success: true,
          user: results[0]
        });
      });
    } catch (error) {
      console.error('Server error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  },



  getUserProfile: (req, res) => {
    try {
      const userId = req.user.userId;
      const sql = 'SELECT userId, username, name, email, status, dob, mobile FROM user WHERE userId = ?';
      
      db.query(sql, [userId], (err, result) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ 
            success: false, 
            message: 'Database error' 
          });
        }
        
        if (result.length > 0) {
          res.json({ 
            success: true, 
            user: result[0] 
          });
        } else {
          res.status(404).json({ 
            success: false, 
            message: 'User not found' 
          });
        }
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error' 
      });
    }
  },

  getUserById: (req, res) => {
    try {
      const { id } = req.params;
      const sql = 'SELECT userId, username, name, email, status, dob, mobile FROM user WHERE userId = ?';
      
      db.query(sql, [id], (err, result) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ 
            success: false, 
            message: 'Database error' 
          });
        }
        
        if (result.length > 0) {
          res.json({ 
            success: true, 
            user: result[0] 
          });
        } else {
          res.status(404).json({ 
            success: false, 
            message: 'User not found' 
          });
        }
      });
    } catch (error) {
      console.error('Get user by ID error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error' 
      });
    }
  },
  updatePassword: (req, res) => {
    try {
      const { userId, newPassword } = req.body;
  
      if (!userId || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'User ID and new password are required'
        });
      }
  
      const sql = 'UPDATE user SET password = ? WHERE userId = ?';
  
      db.query(sql, [newPassword, userId], (err, result) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({
            success: false,
            message: 'Database error'
          });
        }
  
        if (result.affectedRows > 0) {
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
      });
    } catch (error) {
      console.error('Update password error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  },
  
};

module.exports = userController;