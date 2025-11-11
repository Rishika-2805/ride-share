# How to Start the Backend Server

## Prerequisites
1. Make sure MongoDB is running (either locally or via Docker)
2. Create a `.env` file in the `backend` directory with the following:

```
JWT_SECRET=your-secret-jwt-key-change-this-in-production
MONGO_URI=mongodb://localhost:27017/ride-share
PORT=5000
FRONTEND_URL=http://localhost:5173
```

## Start the Server

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies (if not already installed):
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm start
   ```
   
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

## Verify Server is Running

You should see:
- "MongoDB connected" message
- "Server listening on 5000" message

If you see errors:
- Check that MongoDB is running
- Verify the `.env` file exists and has correct values
- Check that port 5000 is not already in use

