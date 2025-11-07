const mysql = require('mysql2');
require('dotenv').config();

// Validate required environment variables
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
  console.error('Please create a .env file with all required variables.');
  process.exit(1);
}

// Create connection pool for better performance and reliability
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Test the connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    console.error('Error code:', err.code);
    console.error('SQL State:', err.sqlState);
    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('Please check your database credentials in .env file');
      console.error('DB_USER:', process.env.DB_USER);
      console.error('DB_HOST:', process.env.DB_HOST);
      console.error('DB_NAME:', process.env.DB_NAME);
    } else if (err.code === 'ECONNREFUSED') {
      console.error('Cannot connect to database server. Please ensure MySQL is running.');
      console.error('Trying to connect to:', process.env.DB_HOST);
    } else if (err.code === 'ER_BAD_DB_ERROR') {
      console.error('Database does not exist. Please create the database first.');
      console.error('Database name:', process.env.DB_NAME);
    } else if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      console.error('Database connection was closed. Please check MySQL server status.');
    }
    console.error('Full error:', err);
    // Don't exit in development to see the error
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    return;
  }
  
  console.log('✅ Connected to MySQL database');
  console.log(`📊 Database: ${process.env.DB_NAME}`);
  console.log(`🔌 Host: ${process.env.DB_HOST}`);
  console.log(`👤 User: ${process.env.DB_USER}`);
  
  // Test a simple query
  connection.query('SELECT 1 as test', (queryErr, results) => {
    if (queryErr) {
      console.error('❌ Database query test failed:', queryErr);
    } else {
      console.log('✅ Database query test successful');
    }
    connection.release();
  });
});

// Promisify for async/await support
const promisePool = pool.promise();

// Add error handling for pool
pool.on('error', (err) => {
  console.error('❌ Unexpected database pool error:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.error('Database connection was closed. Attempting to reconnect...');
  } else if (err.fatal) {
    console.error('Fatal database error. Please restart the server.');
  }
});

// Export pool with a test function
const testConnection = async () => {
  try {
    const connection = await promisePool.getConnection();
    await connection.query('SELECT 1');
    connection.release();
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
};

module.exports = { pool, promisePool, testConnection };