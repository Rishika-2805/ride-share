# Mobile App Installation Guide

## Step-by-Step Setup

### 1. Install Prerequisites

**Install Node.js** (if not already installed):
- Download from https://nodejs.org/ (v16 or higher)
- Verify installation: `node --version`

**Install Expo CLI globally:**
```bash
npm install -g expo-cli
```

**For iOS development (Mac only):**
- Install Xcode from App Store
- Install Xcode Command Line Tools: `xcode-select --install`

**For Android development:**
- Install Android Studio from https://developer.android.com/studio
- Set up Android SDK and emulator

### 2. Navigate to Mobile App Directory

```bash
cd "d:\minor project\ride-share\mobile-app"
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure API Endpoints

**Update `src/utils/api.js`:**
```javascript
// For Android Emulator:
const API_URL = 'http://10.0.2.2:5000/api';

// For iOS Simulator:
const API_URL = 'http://localhost:5000/api';

// For Physical Device (replace with your computer's IP):
const API_URL = 'http://192.168.1.100:5000/api';
```

**Update `src/utils/socket.js`:**
```javascript
// Use the same URL pattern as above
const SOCKET_URL = 'http://10.0.2.2:5000'; // Android Emulator
// or
const SOCKET_URL = 'http://localhost:5000'; // iOS Simulator
// or
const SOCKET_URL = 'http://192.168.1.100:5000'; // Physical Device
```

### 5. Find Your Computer's IP Address

**Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" (e.g., 192.168.1.100)

**Mac/Linux:**
```bash
ifconfig
```
Look for "inet" address

### 6. Start the Backend Server

Make sure your backend server is running:
```bash
cd "d:\minor project\ride-share\backend"
npm start
```

### 7. Start the Mobile App

```bash
cd "d:\minor project\ride-share\mobile-app"
npm start
```

This will:
- Start the Expo development server
- Show a QR code in the terminal
- Open Expo DevTools in your browser

### 8. Run on Device/Emulator

**Option A: Physical Device (Recommended for testing)**
1. Install **Expo Go** app:
   - iOS: App Store
   - Android: Play Store
2. Make sure phone and computer are on the same WiFi
3. Scan the QR code with Expo Go app

**Option B: Android Emulator**
1. Start Android Studio emulator
2. Press `a` in the terminal where `npm start` is running

**Option C: iOS Simulator (Mac only)**
1. Press `i` in the terminal where `npm start` is running

## Troubleshooting

### Connection Issues
- **"Network request failed"**: Check that API_URL matches your setup
- **"Cannot connect to server"**: Ensure backend is running and accessible
- **CORS errors**: Check backend CORS configuration allows your mobile app

### Image Upload Issues
- **Permission denied**: Grant camera/storage permissions in device settings
- **Image too large**: Images are automatically compressed, but very large images may still fail

### Build Issues
- **"Module not found"**: Run `npm install` again
- **Expo errors**: Clear cache: `expo start -c`

## Next Steps

1. Test all features:
   - Login/Signup
   - Request Ride
   - View Available Rides
   - Join Rides
   - Chatroom
   - Profile Management

2. For Production Build:
   - Configure app.json with your app details
   - Run `expo build:android` or `expo build:ios`
   - Submit to app stores

## Notes

- The app uses the same backend API as the web version
- All features from the web app are available in mobile
- Push notifications are configured but may need additional setup for production

