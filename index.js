const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

// Security headers
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:4200',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware - MUST come before rate limiters
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Strict rate limiting for auth routes - MORE SPECIFIC ROUTES FIRST
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Increased from 5 to 10 for testing/development
  skipSuccessfulRequests: true, // Changed to true - don't count successful logins
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Add this to help debug
  handler: (req, res) => {
    console.log('⚠️ Rate limit exceeded for IP:', req.ip);
    res.status(429).json({
      success: false,
      message: 'Too many login attempts. Please try again after 15 minutes.'
    });
  }
});

// Rate limiting for all other requests
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Increased from 100 for better UX
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for successful requests
  skip: (req) => {
    // Don't rate limit health checks
    return req.path === '/health';
  }
});

// Health check (before any middleware)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'Server is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Apply auth rate limiter to specific auth endpoints ONLY
app.use('/api/auth/login', authLimiter);
app.use('/login', authLimiter); // For backward compatibility

// Apply general rate limiter to everything else
app.use('/api/', generalLimiter);

// Routes - Mount in correct order
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Backward compatibility routes (without /api prefix)
app.use('/auth', authRoutes);  
app.use('/users', userRoutes);

// Direct route mounting for legacy endpoints
app.use('/', authRoutes); // This makes /login work directly
app.use('/', userRoutes); // This makes /addUser work directly  

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  console.error('Error stack:', err.stack);
  
  const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
  
  // Don't leak error details in production
  const errorMessage = isDevelopment 
    ? err.message || 'Internal server error'
    : 'An error occurred. Please try again later.';
  
  res.status(err.status || 500).json({ 
    success: false, 
    message: errorMessage,
    ...(isDevelopment && { 
      stack: err.stack?.split('\n').slice(0, 10),
      code: err.code,
      details: err.message 
    })
  });
});

// 404 handler
app.use((req, res) => {
  console.log('⚠️ 404 - Route not found:', req.method, req.path);
  res.status(404).json({ 
    success: false, 
    message: `Route not found: ${req.method} ${req.path}` 
  });
});

const PORT = process.env.PORT || 5000;

// Start server with proper error handling
const server = app.listen(PORT, () => {
  console.log('═══════════════════════════════════════');
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔒 Security features enabled`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:4200'}`);
  console.log(`⏱️  Rate limits: Auth=10/15min, General=200/15min`);
  console.log('═══════════════════════════════════════');
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Please use a different port.`);
    process.exit(1);
  } else {
    console.error('❌ Server error:', err);
    throw err;
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('⚠️ SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

module.exports = app;