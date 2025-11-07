# Node.js Authentication API

A secure, production-ready Node.js authentication API with MySQL database integration.

## 🔧 Fixed Issues

### Critical Fixes
1. **Table Name Mismatch**: Fixed `authController` to query `user` table instead of `users`
2. **Column Name Consistency**: Fixed all queries to use `userid` (lowercase) to match database schema
3. **Database Connection**: Replaced single connection with connection pool for better performance and reliability
4. **Password Hashing**: Added bcrypt hashing for all password operations (create, update)
5. **Error Handling**: Improved error logging and messages with detailed development mode support

### Security Enhancements
- ✅ Input validation and sanitization
- ✅ SQL injection prevention (parameterized queries + pattern detection)
- ✅ Password strength validation
- ✅ JWT token security with issuer/audience validation
- ✅ Rate limiting on authentication endpoints
- ✅ CORS configuration
- ✅ Helmet security headers
- ✅ Environment variable validation
- ✅ Detailed error logging (development mode)

## 📋 Prerequisites

- Node.js (v14 or higher)
- MySQL Database
- npm or yarn

## 🚀 Installation

1. **Clone the repository**
   ```bash
   cd /Users/mobilise/Documents/NodeJs
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create `.env` file** in the root directory:
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password_here
   DB_NAME=your_database_name

   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key_here_minimum_32_characters_long
   JWT_EXPIRES_IN=24h
   JWT_ISSUER=your-app-name
   JWT_AUDIENCE=your-app-users

   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # Frontend Configuration
   FRONTEND_URL=http://localhost:4200
   ```

4. **Database Setup**
   - Ensure MySQL is running
   - Create the database:
     ```sql
     CREATE DATABASE your_database_name;
     ```
   - Create the `user` table (adjust based on your schema):
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

5. **Migrate existing passwords** (if you have plain text passwords):
   ```bash
   node scripts/migratePasswords.js
   ```

## 🏃 Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:5000` (or the PORT specified in .env)

## 📡 API Endpoints

### Authentication

#### POST `/api/auth/login`
Login with username and password.

**Request:**
```json
{
  "username": "your_username",
  "password": "your_password"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "userId": 1,
    "username": "your_username",
    "name": "Your Name",
    "email": "your@email.com"
  },
  "token": "jwt_token_here",
  "expiresIn": "24h"
}
```

#### POST `/api/auth/verify-token`
Verify JWT token validity.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Token is valid",
  "user": {
    "userId": 1,
    "username": "your_username"
  }
}
```

### User Management

#### POST `/api/users/addUser`
Create a new user.

**Request:**
```json
{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "securepassword",
  "dob": "1990-01-01",
  "mobile": "1234567890"
}
```

#### POST `/api/users/getAllUsers`
Get user by username (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "username": "username_to_search"
}
```

#### GET `/api/users/profile`
Get current user's profile (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

#### GET `/api/users/:id`
Get user by ID (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

#### PUT `/api/users/updatePassword`
Update user password (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "userId": 1,
  "newPassword": "newsecurepassword"
}
```

## 🔒 Security Features

### Rate Limiting
- General API: 100 requests per 15 minutes per IP
- Authentication endpoints: 5 requests per 15 minutes per IP

### Password Security
- Passwords are hashed using bcrypt with 10 salt rounds
- Minimum password length: 6 characters
- Maximum password length: 128 characters

### Input Validation
- Email format validation
- SQL injection pattern detection
- Input sanitization (trim, length limits)
- Required field validation

### JWT Security
- Configurable expiration time
- Issuer and audience validation
- Secure token generation

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify MySQL is running
   - Check database credentials in `.env`
   - Ensure database exists

2. **"Invalid username or password" Error**
   - Check if user exists in database
   - Verify password is hashed (run migration script if needed)
   - Check table name is `user` (not `users`)
   - Verify column name is `userid` (lowercase)

3. **JWT Token Errors**
   - Ensure `JWT_SECRET` is set in `.env`
   - Check token expiration
   - Verify token format: `Bearer <token>`

4. **Port Already in Use**
   - Change `PORT` in `.env` file
   - Or stop the process using the port

### Development Mode
Set `NODE_ENV=development` in `.env` to get detailed error messages for debugging.

## 📝 Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DB_HOST` | MySQL host | Yes | - |
| `DB_USER` | MySQL username | Yes | - |
| `DB_PASSWORD` | MySQL password | Yes | - |
| `DB_NAME` | Database name | Yes | - |
| `JWT_SECRET` | JWT secret key | Yes | - |
| `JWT_EXPIRES_IN` | Token expiration | No | 24h |
| `JWT_ISSUER` | JWT issuer | No | your-app-name |
| `JWT_AUDIENCE` | JWT audience | No | your-app-users |
| `PORT` | Server port | No | 5000 |
| `NODE_ENV` | Environment | No | development |
| `FRONTEND_URL` | Frontend URL | No | http://localhost:4200 |

## 🔄 Migration

If you have existing users with plain text passwords, run:

```bash
node scripts/migratePasswords.js
```

This will hash all plain text passwords in the database.

## 📦 Dependencies

- `express` - Web framework
- `mysql2` - MySQL client
- `bcrypt` - Password hashing
- `jsonwebtoken` - JWT authentication
- `dotenv` - Environment variables
- `cors` - CORS middleware
- `helmet` - Security headers
- `express-rate-limit` - Rate limiting

## 🎯 Best Practices Implemented

- ✅ Connection pooling for database
- ✅ Parameterized queries (SQL injection prevention)
- ✅ Password hashing with bcrypt
- ✅ Input validation and sanitization
- ✅ Error handling with proper logging
- ✅ Environment variable validation
- ✅ Rate limiting
- ✅ CORS configuration
- ✅ Security headers (Helmet)
- ✅ JWT token security
- ✅ Async/await for better error handling

## 📄 License

ISC

## 👤 Author

Lohiya

---

**Note**: Make sure to keep your `.env` file secure and never commit it to version control. Use `.env.example` as a template.

