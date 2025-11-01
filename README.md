# BETalentBoard API Documentation

## Setup & Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Setup database:**
   ```bash
   # Generate Prisma client
   npm run prisma:generate
   
   # Push schema to database (untuk development)
   npm run prisma:push
   
   # Atau buat migration (untuk production)
   npm run prisma:migrate
   ```

3. **Setup environment variables:**
   - Copy `.env` file dan isi dengan data yang sesuai
   - Pastikan `DATABASE_URL` mengarah ke database kamu

4. **Run server:**
   ```bash
   # Development mode (auto-reload)
   npm run dev
   
   # Production mode
   npm start
   ```

5. **Open Prisma Studio (optional):**
   ```bash
   npm run prisma:studio
   ```

---

## Authentication Endpoints

### 1. Register User
**POST** `/api/auth/register`

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "username": "johndoe" // optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "username": "johndoe",
      "name": "John Doe",
      "role": "USER",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token"
  }
}
```

### 2. Login User
**POST** `/api/auth/login`

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### 3. Logout User
**POST** `/api/auth/logout`

**Headers:**
```
Authorization: Bearer <access_token>
```

### 4. Refresh Token
**POST** `/api/auth/refresh-token`

**Body:**
```json
{
  "refreshToken": "jwt_refresh_token" // optional jika sudah ada di cookie
}
```

### 5. Forgot Password
**POST** `/api/auth/forgot-password`

**Body:**
```json
{
  "email": "user@example.com"
}
```

### 6. Reset Password
**POST** `/api/auth/reset-password`

**Body:**
```json
{
  "token": "reset_token",
  "newPassword": "newpassword123"
}
```

---

## User Management Endpoints

### 1. Get All Users (Admin Only)
**GET** `/api/users`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `search`: Search by name, email, or username
- `role`: Filter by role (USER/ADMIN)

### 2. Get User by ID
**GET** `/api/users/:id`

**Headers:**
```
Authorization: Bearer <access_token>
```

### 3. Update User
**PUT** `/api/users/:id`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Body:**
```json
{
  "name": "Updated Name",
  "username": "newusername",
  "email": "newemail@example.com",
  "role": "ADMIN", // Admin only
  "isActive": false // Admin only
}
```

### 4. Delete User (Admin Only)
**DELETE** `/api/users/:id`

**Headers:**
```
Authorization: Bearer <access_token>
```

### 5. Get My Profile
**GET** `/api/users/me`

**Headers:**
```
Authorization: Bearer <access_token>
```

### 6. Change My Password
**PATCH** `/api/users/me/password`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Body:**
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword123"
}
```

### 7. Update My Avatar
**PATCH** `/api/users/me/avatar`

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Body:**
- `avatar`: Image file (max 5MB)

---

## Testing dengan Postman/Thunder Client

### 1. Testing Register
```bash
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123",
  "name": "Test User",
  "username": "testuser"
}
```

### 2. Testing Login
```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}
```

### 3. Testing Protected Route
```bash
GET http://localhost:5000/api/users/me
Authorization: Bearer <your_access_token>
```

---

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Success message",
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "errors": null // Optional error details
}
```

---

## Security Features

1. **Password Hashing**: Menggunakan bcrypt dengan salt rounds 12
2. **JWT Tokens**: Access token (15 menit) dan Refresh token (7 hari)
3. **HTTP-only Cookies**: Token disimpan di secure cookies
4. **Role-based Access**: Admin dan User roles
5. **Input Validation**: Email format dan password minimum 6 karakter
6. **File Upload Security**: Hanya accept image files, max 5MB

---

## Project Structure

```
src/
├── config/
│   └── database.js          # Prisma connection
├── controllers/
│   ├── authController.js    # Authentication logic
│   └── userController.js    # User management logic
├── middlewares/
│   └── auth.js             # Authentication & authorization
├── routes/
│   ├── auth.route.js       # Auth routes
│   └── user.route.js       # User routes
├── utils/
│   ├── helpers.js          # Response helpers & validation
│   ├── jwt.js              # JWT utilities
│   └── password.js         # Password utilities
└── server.js               # Main server file
```

---

## Database Schema

```sql
model User {
  id               String    @id @default(cuid())
  email            String    @unique
  username         String?   @unique
  password         String
  name             String?
  avatar           String?
  role             Role      @default(USER)
  isActive         Boolean   @default(true)
  resetToken       String?
  resetTokenExpiry DateTime?
  refreshToken     String?
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
}

enum Role {
  USER
  ADMIN
}
```