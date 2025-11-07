/**
 * Database Test Script
 * This script helps diagnose database connection and table structure issues
 */

require('dotenv').config();
const { promisePool } = require('../config/db');

async function testDatabase() {
  try {
    console.log('🔍 Testing database connection...\n');
    
    // Test 1: Simple query
    console.log('Test 1: Simple SELECT query');
    const [testRows] = await promisePool.execute('SELECT 1 as test');
    console.log('✅ Simple query successful:', testRows);
    console.log('');
    
    // Test 2: Check if table exists
    console.log('Test 2: Checking if "user" table exists');
    const [tables] = await promisePool.execute(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'user'",
      [process.env.DB_NAME]
    );
    
    if (tables.length === 0) {
      console.error('❌ Table "user" does not exist in database:', process.env.DB_NAME);
      console.log('Available tables:');
      const [allTables] = await promisePool.execute(
        "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?",
        [process.env.DB_NAME]
      );
      allTables.forEach(table => console.log('  -', table.TABLE_NAME));
      return;
    }
    console.log('✅ Table "user" exists');
    console.log('');
    
    // Test 3: Check table structure
    console.log('Test 3: Checking table structure');
    const [columns] = await promisePool.execute(
      "SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'user' ORDER BY ORDINAL_POSITION",
      [process.env.DB_NAME]
    );
    
    console.log('Table columns:');
    columns.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE}) - ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'} ${col.COLUMN_KEY ? '- ' + col.COLUMN_KEY : ''}`);
    });
    console.log('');
    
    // Test 4: Check if userid column exists (case-sensitive)
    const useridColumn = columns.find(col => col.COLUMN_NAME === 'userid');
    if (!useridColumn) {
      console.error('❌ Column "userid" (lowercase) not found!');
      console.log('Found columns with similar names:');
      columns.forEach(col => {
        if (col.COLUMN_NAME.toLowerCase().includes('user') || col.COLUMN_NAME.toLowerCase().includes('id')) {
          console.log(`  - ${col.COLUMN_NAME}`);
        }
      });
    } else {
      console.log('✅ Column "userid" (lowercase) found');
    }
    console.log('');
    
    // Test 5: Count users
    console.log('Test 4: Counting users in table');
    const [countRows] = await promisePool.execute('SELECT COUNT(*) as count FROM user');
    console.log('✅ Total users in table:', countRows[0].count);
    console.log('');
    
    // Test 6: Sample user data (without password)
    console.log('Test 5: Sample user data (first 3 users, without password)');
    const [sampleUsers] = await promisePool.execute(
      'SELECT userid, username, email, name, status FROM user LIMIT 3'
    );
    console.log('Sample users:');
    sampleUsers.forEach(user => {
      console.log(`  - ID: ${user.userid}, Username: ${user.username}, Email: ${user.email || 'N/A'}`);
    });
    console.log('');
    
    // Test 7: Test query with username
    console.log('Test 6: Testing query with username parameter');
    const testUsername = 'test'; // Change this to a username that exists in your database
    const [testUserRows] = await promisePool.execute(
      'SELECT userid, username, password, name, email, status FROM user WHERE username = ?',
      [testUsername]
    );
    
    if (testUserRows.length === 0) {
      console.log(`⚠️  No user found with username: ${testUsername}`);
      console.log('   (This is normal if the username doesn\'t exist)');
    } else {
      console.log(`✅ User found: ${testUserRows[0].username} (ID: ${testUserRows[0].userid})`);
      console.log(`   Password field: ${testUserRows[0].password ? 'Present' : 'NULL'}`);
      console.log(`   Password length: ${testUserRows[0].password ? testUserRows[0].password.length : 0}`);
      console.log(`   Password starts with $2b$: ${testUserRows[0].password && testUserRows[0].password.startsWith('$2b$') ? 'Yes (hashed)' : 'No (plain text or empty)'}`);
    }
    console.log('');
    
    console.log('✅ All database tests completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Database test failed:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('SQL State:', error.sqlState);
    console.error('Error stack:', error.stack);
    process.exit(1);
  }
}

testDatabase();

