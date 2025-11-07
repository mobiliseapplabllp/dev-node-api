const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { promisePool } = require('../config/db');

const authController = {
  login: async (req, res) => {
    try {
      console.log('🔍 Login attempt started');
      let { username, password } = req.body;
      console.log('📥 Received username:', username ? 'present' : 'missing');

      // Input validation
      if (!username || !password) {
        console.log('❌ Missing username or password');
        return res.status(400).json({
          success: false,
          message: 'Username and password are required'
        });
      }

      // Sanitize inputs
      username = String(username).trim();
      password = String(password);

      if (username.length === 0 || password.length === 0) {
        console.log('❌ Username or password is empty');
        return res.status(400).json({
          success: false,
          message: 'Username and password cannot be empty'
        });
      }

      // Check JWT_SECRET
      if (!process.env.JWT_SECRET) {
        console.error('❌ JWT_SECRET is not set in environment variables');
        return res.status(500).json({
          success: false,
          message: 'Server configuration error. Please contact administrator.'
        });
      }

      console.log('🔍 Querying database for user:', username);
      console.log('🔍 Database name:', process.env.DB_NAME);
      console.log('🔍 Database host:', process.env.DB_HOST);
      
      // Query user from database - FIXED: using 'user' table instead of 'users'
      // Note: Removed 'name' column as it doesn't exist in the database
      const sql = 'SELECT userid, username, password, email, status, dob, phone FROM user WHERE username = ?';
      console.log('🔍 SQL Query:', sql);
      console.log('🔍 SQL Parameters:', [username]);
      
      let rows;
      try {
        // First, test if we can get a connection
        console.log('🔍 Testing database connection...');
        const connection = await promisePool.getConnection();
        console.log('✅ Got database connection');
        connection.release();
        console.log('✅ Released database connection');
        
        // Now execute the query
        console.log('🔍 Executing query...');
        [rows] = await promisePool.execute(sql, [username]);
        console.log('✅ Database query executed successfully');
        console.log('📊 Rows found:', rows.length);
      } catch (dbError) {
        console.error('❌ Database query error occurred!');
        console.error('Error name:', dbError.name);
        console.error('Error message:', dbError.message);
        console.error('Error code:', dbError.code);
        console.error('SQL State:', dbError.sqlState);
        console.error('SQL Message:', dbError.sqlMessage);
        console.error('Full error object:', JSON.stringify(dbError, Object.getOwnPropertyNames(dbError)));
        
        // Always show detailed error in development or if NODE_ENV is not set
        const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
        
        let errorMessage = 'Database connection error. Please try again later.';
        let errorDetails = {};
        
        if (isDevelopment) {
          errorMessage = `Database error: ${dbError.message}`;
          if (dbError.code) {
            errorMessage += ` (Code: ${dbError.code})`;
          }
          errorDetails = {
            error: dbError.message,
            code: dbError.code,
            sqlState: dbError.sqlState,
            sqlMessage: dbError.sqlMessage,
            name: dbError.name
          };
          
          // Provide helpful hints based on error code
          if (dbError.code === 'ER_BAD_DB_ERROR') {
            errorMessage += ` - Database '${process.env.DB_NAME}' does not exist`;
          } else if (dbError.code === 'ER_ACCESS_DENIED_ERROR') {
            errorMessage += ' - Access denied. Check database credentials in .env file';
          } else if (dbError.code === 'ECONNREFUSED') {
            errorMessage += ' - Cannot connect to MySQL server. Is MySQL running?';
          } else if (dbError.code === 'ETIMEDOUT') {
            errorMessage += ' - Connection timeout. Check if MySQL server is accessible';
          } else if (dbError.code === 'ER_NO_SUCH_TABLE') {
            errorMessage += ' - Table "user" does not exist in database';
          }
        }
        
        return res.status(500).json({
          success: false,
          message: errorMessage,
          ...(isDevelopment && errorDetails)
        });
      }
      
      if (rows.length === 0) {
        // Log failed login attempt (without revealing if user exists)
        console.log(`⚠️  Failed login attempt for username: ${username} - User not found`);
        return res.status(401).json({
          success: false,
          message: 'Invalid username or password'
        });
      }

      const user = rows[0];
      console.log('✅ User found. User ID:', user.userid);

      // Check if password exists
      if (!user.password) {
        console.error('❌ User password is null or undefined for user:', user.userid);
        return res.status(500).json({
          success: false,
          message: 'User account error. Please contact administrator.'
        });
      }

      // Verify password
      let isValidPassword = false;
      try {
        console.log('🔐 Verifying password...');
        console.log('🔐 Stored password type:', user.password ? (user.password.startsWith('$2b$') ? 'Hashed (bcrypt)' : 'Plain text') : 'NULL');
        
        // Check if password is hashed (starts with $2b$)
        if (user.password && user.password.startsWith('$2b$')) {
          console.log('🔐 Password is hashed, using bcrypt comparison');
          isValidPassword = await bcrypt.compare(password, user.password);
          console.log('🔐 Bcrypt comparison result:', isValidPassword);
        } else {
          // Legacy plain text password support (for migration)
          console.warn(`⚠️  User ${user.userid} has unhashed password. Using plain text comparison.`);
          console.log('🔐 Comparing plain text passwords...');
          console.log('🔐 Input password:', password);
          console.log('🔐 Stored password:', user.password);
          
          // Trim both passwords for comparison (in case of whitespace issues)
          const inputPasswordTrimmed = String(password).trim();
          const storedPasswordTrimmed = String(user.password).trim();
          
          isValidPassword = inputPasswordTrimmed === storedPasswordTrimmed;
          console.log('🔐 Plain text password comparison result:', isValidPassword);
          
          if (!isValidPassword) {
            console.log('🔐 Password mismatch details:');
            console.log('   Input length:', inputPasswordTrimmed.length);
            console.log('   Stored length:', storedPasswordTrimmed.length);
            console.log('   Input === Stored:', inputPasswordTrimmed === storedPasswordTrimmed);
          }
        }
      } catch (bcryptError) {
        console.error('❌ Password comparison error:', bcryptError);
        console.error('Error stack:', bcryptError.stack);
        return res.status(500).json({
          success: false,
          message: 'Authentication error. Please try again later.'
        });
      }

      if (!isValidPassword) {
        console.log(`⚠️  Failed login attempt for username: ${username} - Invalid password`);
        return res.status(401).json({
          success: false,
          message: 'Invalid username or password'
        });
      }

      console.log('✅ Password verified successfully');

      // Check if user account is active (if status field exists)
      // Handle both string 'active' and numeric 1 as active status
      const isActive = user.status === 1 || 
                       user.status === '1' || 
                       user.status === 'active' || 
                       user.status === 'Active' || 
                       user.status === 'ACTIVE';
      
      if (user.status !== undefined && !isActive) {
        console.log(`⚠️  Inactive account login attempt for user: ${username} (Status: ${user.status})`);
        return res.status(403).json({
          success: false,
          message: 'Your account is inactive. Please contact administrator.'
        });
      }
      
      console.log('✅ Account status check passed. Status:', user.status);

      // Generate JWT token
      console.log('🔑 Generating JWT token...');
      let token;
      try {
        token = jwt.sign(
          {
            userId: user.userid,
            username: user.username
          },
          process.env.JWT_SECRET,
          { 
            expiresIn: process.env.JWT_EXPIRES_IN || '24h',
            issuer: process.env.JWT_ISSUER || 'your-app-name',
            audience: process.env.JWT_AUDIENCE || 'your-app-users'
          }
        );
        console.log('✅ JWT token generated successfully');
      } catch (jwtError) {
        console.error('❌ JWT token generation error:', jwtError);
        console.error('Error message:', jwtError.message);
        return res.status(500).json({
          success: false,
          message: 'Token generation error. Please try again later.'
        });
      }

      console.log(`✅ Successful login for user: ${username} (ID: ${user.userid})`);

      // Return user data (without password)
      res.json({
        success: true,
        user: {
          userId: user.userid,
          username: user.username,
          email: user.email || null,
          dob: user.dob || null,
          phone: user.phone || null,
          status: user.status || null
        },
        token: token,
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
      });

    } catch (error) {
      console.error('❌ Unexpected login error:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('Error code:', error.code);
      
      // Provide more detailed error in development
      const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
      
      res.status(500).json({
        success: false,
        message: isDevelopment 
          ? `An error occurred: ${error.message} (${error.name})` 
          : 'An error occurred. Please try again later.',
        ...(isDevelopment && { 
          error: error.message, 
          name: error.name,
          code: error.code,
          stack: error.stack.split('\n').slice(0, 5) // First 5 lines of stack
        })
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

