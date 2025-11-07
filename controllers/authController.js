const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('../config/db');
const { promisify } = require('util');

const query = promisify(db.query).bind(db);

const authController = {
  login: async (req, res) => {
    try {
      let { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username and password are required'
        });
      }

      username = String(username).trim();
      const sql = 'SELECT * FROM users WHERE username = ?';
      const result = await query(sql, [username]);
      if (result.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Invalid username or password'
        });
      }
      const user = result[0];
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid username or password'
        });
      }
      const token = jwt.sign(
        {
          userId: user.userid,
          username: user.username
        },
        process.env.JWT_SECRET,
        { 
          expiresIn: process.env.JWT_EXPIRES_IN || '24h',
          issuer: 'your-app-name',
          audience: 'your-app-users'
        }
      );

      const { password: _, ...userWithoutPassword } = user;

      res.json({
        success: true,
        user: {
          userId: user.userid,
          username: user.username,
          name: user.name,
          email: user.email
        },
        token: token,
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred. Please try again later.'
      });
    }
  },

  verifyToken: (req, res) => {
    res.json({
      success: true,
      message: 'Token is valid',
      user: req.user
    });
  },

  logout: async (req, res) => {
    try {
      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Logout failed'
      });
    }
  }
};

module.exports = authController;

