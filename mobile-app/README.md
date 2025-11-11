# Ride Share Mobile App

React Native mobile application for the Ride Share platform.

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- For iOS: Xcode (Mac only)
- For Android: Android Studio

## Installation

1. Navigate to the mobile-app directory:
```bash
cd mobile-app
```

2. Install dependencies:
```bash
npm install
```

3. Update API URL:
   - Open `src/utils/api.js`
   - Change `API_URL` to your backend server URL
   - For physical device testing, use your computer's IP address (e.g., `http://192.168.1.100:5000/api`)
   - For emulator/simulator, use `http://localhost:5000/api` (Android) or `http://localhost:5000/api` (iOS)

4. Update Socket URL:
   - Open `src/utils/socket.js`
   - Change `SOCKET_URL` to match your backend server URL

## Running the App

### Development Mode

```bash
npm start
```

This will start the Expo development server. You can then:
- Press `a` to open on Android emulator
- Press `i` to open on iOS simulator
- Scan QR code with Expo Go app on your physical device

### Platform-Specific

```bash
npm run android  # Android
npm run ios      # iOS (Mac only)
npm run web      # Web browser
```

## Building for Production

### Android APK
```bash
expo build:android
```

### iOS IPA
```bash
expo build:ios
```

## Features

- ✅ User Authentication (Login/Signup)
- ✅ Request Rides with Screenshot Upload
- ✅ View Available Rides
- ✅ First-Come-First-Serve Ride Acceptance
- ✅ Real-time Notifications
- ✅ Chatroom for Matched Users
- ✅ Profile Management with ID Verification
- ✅ Image Compression for Uploads

## Important Notes

1. **Network Configuration**: 
   - For physical device testing, ensure your phone and computer are on the same WiFi network
   - Update the API_URL in `src/utils/api.js` with your computer's local IP address
   - You may need to allow the port in your firewall

2. **Permissions**:
   - Camera: For taking photos
   - Storage: For selecting images
   - Notifications: For push notifications

3. **Backend Server**:
   - Ensure your backend server is running
   - CORS must be configured to allow requests from your mobile app

## Troubleshooting

- **Connection Issues**: Check that API_URL matches your backend server
- **Image Upload Fails**: Ensure image compression is working and file size is reasonable
- **Notifications Not Working**: Check notification permissions in device settings

