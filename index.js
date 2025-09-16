const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const db = require('./config/db');
const { authenticateToken } = require('./middleware/auth');
require('dotenv').config();

const app = express();

// Enable CORS for Angular frontend
app.use(cors({
  origin: 'http://localhost:4200', // Angular default port
  credentials: true
}));

app.use(express.json());

// Login user 
app.post('/login', (req, res) => {
  let { username, password } = req.body;
  username = String(username);
  const sql = 'SELECT * FROM user WHERE username = ? AND password = ?';
  
  db.query(sql, [username, password], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    if (result.length > 0) {
      const user = result[0];
      
      // Generate JWT token
      const token = jwt.sign(
        { 
          userName: user.username, 
          name: user.name,
          email: user.email 
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );
      
      // Send response with token
      res.json({ 
        success: true, 
        user: {
          userName: user.username,
          name: user.name,
          email: user.email,
          userId: user.userid,
          status : user.status,
          dob: user.dob
        },
        token: token,
        expiresIn: process.env.JWT_EXPIRES_IN
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  });
});

// Insert user (public for now - you can protect this later)
app.post('/addUser', (req, res) => {
  const { username, email, password, dob, mobile } = req.body;
  const sql = 'INSERT INTO `user` (`username`,`email`,`password`,`dob`,`mobile`) VALUES (?,?,?,?,?)';

  
  db.query(sql, [username, email, password, dob, mobile], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    res.json({ success: true, message: 'User added successfully!' });
  });
});

// Get all users (Protected route)
app.get('/users', authenticateToken, (req, res) => {
  db.query('SELECT userId, name, email FROM user', (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    res.json({ success: true, users: results });
  });
});

// Get user profile (Protected route)
app.get('/profile', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const sql = 'SELECT userId, name, email FROM user WHERE userId = ?';
  
  db.query(sql, [userId], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    if (result.length > 0) {
      res.json({ success: true, user: result[0] });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  });
});

// Verify token endpoint
app.post('/verify-token', authenticateToken, (req, res) => {
  res.json({ 
    success: true, 
    message: 'Token is valid',
    user: req.user 
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running!' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});