# Ride Share Backend

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Create Environment Variables File

Create a `.env` file in the `backend` directory with the following variables:

```env
# MongoDB Connection URI
# For Docker Compose (use service name 'mongo'):
MONGO_URI=mongodb://mongo:27017/ride-share
# For local development without Docker:
# MONGO_URI=mongodb://localhost:27017/ride-share

# JWT Secret Key (REQUIRED - change this to a secure random string)
# Generate a secure random string:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your-secret-jwt-key-change-this-in-production

# Server Port (optional, defaults to 5000)
PORT=5000

# Frontend URL for CORS (optional)
FRONTEND_URL=http://localhost:3000
```

### 3. Start the Server

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

### 4. Using Docker Compose

If using Docker Compose from the project root:
```bash
docker-compose up
```

Make sure the `.env` file exists in the `backend` directory before starting.

## Troubleshooting

### "Invalid credentials" Error

This error can occur due to:
1. **Missing JWT_SECRET**: The server requires JWT_SECRET to be set in the `.env` file
2. **Missing MONGO_URI**: The server cannot connect to the database
3. **Wrong password**: Make sure you're using the correct password for your user
4. **User not found**: Ensure the user exists in the database

### Environment Variables Not Loading

- Make sure the `.env` file is in the `backend` directory
- Check that the file is named exactly `.env` (not `.env.txt` or similar)
- Restart the server after creating/modifying the `.env` file

