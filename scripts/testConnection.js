/**
 * Test Database Connection Script
 * Run this to verify your database connection is working
 */

require('dotenv').config();

console.log('🔍 Testing database connection...');
console.log('');

// Check environment variables
console.log('Environment Variables:');
console.log('  DB_HOST:', process.env.DB_HOST || '❌ NOT SET');
console.log('  DB_USER:', process.env.DB_USER || '❌ NOT SET');
console.log('  DB_PASSWORD:', process.env.DB_PASSWORD ? '***' : '❌ NOT SET');
console.log('  DB_NAME:', process.env.DB_NAME || '❌ NOT SET');
console.log('  JWT_SECRET:', process.env.JWT_SECRET ? '***' : '❌ NOT SET');
console.log('');

// Try to connect
const { promisePool } = require('../config/db');

async function test() {
  try {
    console.log('🔄 Attempting to connect to database...');
    
    // Test 1: Get connection
    console.log('Test 1: Getting connection from pool...');
    const connection = await promisePool.getConnection();
    console.log('✅ Connection obtained');
    
    // Test 2: Simple query
    console.log('Test 2: Executing simple query...');
    const [rows] = await connection.query('SELECT 1 as test');
    console.log('✅ Simple query successful:', rows);
    
    // Test 3: Check database
    console.log('Test 3: Checking current database...');
    const [dbRows] = await connection.query('SELECT DATABASE() as current_db');
    console.log('✅ Current database:', dbRows[0].current_db);
    
    // Test 4: Check if table exists
    console.log('Test 4: Checking if "user" table exists...');
    const [tableRows] = await connection.query(
      "SELECT COUNT(*) as count FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'user'",
      [process.env.DB_NAME]
    );
    
    if (tableRows[0].count > 0) {
      console.log('✅ Table "user" exists');
    } else {
      console.log('❌ Table "user" does NOT exist');
      console.log('   Available tables:');
      const [tables] = await connection.query(
        "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?",
        [process.env.DB_NAME]
      );
      tables.forEach(t => console.log('   -', t.TABLE_NAME));
    }
    
    // Test 5: Count users
    if (tableRows[0].count > 0) {
      console.log('Test 5: Counting users in table...');
      const [countRows] = await connection.query('SELECT COUNT(*) as count FROM user');
      console.log('✅ Total users:', countRows[0].count);
    }
    
    connection.release();
    console.log('');
    console.log('✅ All tests passed! Database connection is working.');
    process.exit(0);
    
  } catch (error) {
    console.error('');
    console.error('❌ Database connection test FAILED!');
    console.error('');
    console.error('Error Details:');
    console.error('  Error Name:', error.name);
    console.error('  Error Message:', error.message);
    console.error('  Error Code:', error.code);
    console.error('  SQL State:', error.sqlState);
    console.error('');
    
    // Provide helpful error messages
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('💡 Solution: Check your database credentials in .env file');
      console.error('   - Verify DB_USER is correct');
      console.error('   - Verify DB_PASSWORD is correct');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('💡 Solution: Database does not exist');
      console.error('   - Create the database:', process.env.DB_NAME);
      console.error('   - Or update DB_NAME in .env file');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('💡 Solution: Cannot connect to MySQL server');
      console.error('   - Make sure MySQL is running');
      console.error('   - Check DB_HOST in .env file (should be "localhost" or IP address)');
      console.error('   - Check if MySQL port (3306) is accessible');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('💡 Solution: Connection timeout');
      console.error('   - Check if MySQL server is running');
      console.error('   - Check network connectivity');
      console.error('   - Verify DB_HOST is correct');
    } else if (error.code === 'PROTOCOL_CONNECTION_LOST') {
      console.error('💡 Solution: Database connection was lost');
      console.error('   - Restart MySQL server');
      console.error('   - Check MySQL server logs');
    }
    
    console.error('');
    process.exit(1);
  }
}

// Wait a bit for connection pool to initialize
setTimeout(test, 1000);

