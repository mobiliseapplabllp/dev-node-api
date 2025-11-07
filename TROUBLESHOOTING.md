# 🔧 Troubleshooting Guide

## Problem: "An error occurred. Please try again later."

If you're getting this error even with correct credentials, follow these steps:

### Step 1: Check Server Logs

When you try to login, check your server console. You should now see detailed logs like:
- 🔍 Login attempt started
- 📥 Received username: present
- 🔍 Querying database for user: [username]
- 📊 Database query executed. Rows found: X

**Look for error messages** - they will tell you exactly what's wrong.

### Step 2: Run Database Test

Run this command to test your database connection and table structure:

```bash
node scripts/testDatabase.js
```

This will:
- Test database connection
- Check if table exists
- Verify column names
- Show sample data
- Test queries

### Step 3: Common Issues and Solutions

#### Issue 1: Database Connection Error
**Symptoms**: Error in logs about database connection
**Solution**:
1. Check your `.env` file has correct database credentials
2. Make sure MySQL is running
3. Verify database name exists

#### Issue 2: Table Name Mismatch
**Symptoms**: Error like "Table 'database.users' doesn't exist"
**Solution**:
- Your table MUST be named `user` (singular), not `users` (plural)
- Run: `SHOW TABLES;` in MySQL to check

#### Issue 3: Column Name Mismatch
**Symptoms**: Error about column not found
**Solution**:
- Primary key column MUST be `userid` (lowercase), not `userId` or `user_id`
- Run the test script to verify column names

#### Issue 4: Password Not Hashed
**Symptoms**: User found but password comparison fails
**Solution**:
- Run: `node scripts/migratePasswords.js` to hash all passwords

#### Issue 5: JWT_SECRET Missing
**Symptoms**: Error about JWT_SECRET
**Solution**:
- Add `JWT_SECRET=your_secret_key_here` to `.env` file
- Make sure it's at least 32 characters long

#### Issue 6: Environment Variables Not Loading
**Symptoms**: Variables are undefined
**Solution**:
- Make sure `.env` file is in the root directory (same level as `index.js`)
- Restart the server after changing `.env`

### Step 4: Enable Development Mode

Make sure your `.env` file has:
```env
NODE_ENV=development
```

This will show you detailed error messages instead of generic ones.

### Step 5: Test with Debug Endpoint

Try using the debug endpoint (without validation middleware):
```bash
POST http://localhost:5000/api/auth/login-debug
```

This helps identify if the validation middleware is causing issues.

### Step 6: Check Database Schema

Your table should look like this:
```sql
CREATE TABLE user (
  userid INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  dob DATE,
  mobile VARCHAR(20),
  status INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Step 7: Manual Database Check

Run these SQL queries to verify:

```sql
-- Check table exists
SHOW TABLES LIKE 'user';

-- Check table structure
DESCRIBE user;

-- Check if user exists
SELECT userid, username, email FROM user WHERE username = 'your_username';

-- Check password format
SELECT userid, username, 
       CASE 
         WHEN password LIKE '$2b$%' THEN 'Hashed'
         ELSE 'Plain Text'
       END as password_type
FROM user;
```

### Step 8: Check Logs for Specific Errors

After trying to login, look for these in your console:

1. **Database Query Error**: Check error code and message
2. **Password Comparison Error**: Might be bcrypt issue
3. **JWT Token Error**: Check JWT_SECRET
4. **User Not Found**: Username doesn't exist
5. **Invalid Password**: Password doesn't match

### Step 9: Verify Request Format

Make sure your request is:
```json
POST /api/auth/login
Content-Type: application/json

{
  "username": "your_username",
  "password": "your_password"
}
```

### Step 10: Check for CORS Issues

If calling from Angular, make sure:
- Backend CORS allows your Angular URL
- Request includes `Content-Type: application/json` header

## Quick Fix Checklist

- [ ] MySQL is running
- [ ] `.env` file exists with all required variables
- [ ] Table name is `user` (singular)
- [ ] Column name is `userid` (lowercase)
- [ ] JWT_SECRET is set in `.env`
- [ ] NODE_ENV=development for detailed errors
- [ ] Server was restarted after changing `.env`
- [ ] Database test script runs successfully
- [ ] User exists in database
- [ ] Password is correct

## Still Having Issues?

1. **Run the test script**: `node scripts/testDatabase.js`
2. **Check server logs** for the exact error message
3. **Try the debug endpoint**: `/api/auth/login-debug`
4. **Verify your database** with the SQL queries above
5. **Share the error logs** from your console

The detailed logging will now show you exactly where the problem is!

