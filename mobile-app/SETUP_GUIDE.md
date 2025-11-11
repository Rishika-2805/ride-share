# Mobile App Setup Guide

## Quick Start

1. **Install Expo CLI globally:**
```bash
npm install -g expo-cli
```

2. **Navigate to mobile-app directory:**
```bash
cd mobile-app
```

3. **Install dependencies:**
```bash
npm install
```

4. **Update API Configuration:**
   - Open `src/utils/api.js`
   - Change `API_URL` to your backend server URL
   - For physical device: Use your computer's IP (e.g., `http://192.168.1.100:5000/api`)
   - For emulator: Use `http://10.0.2.2:5000/api` (Android) or `http://localhost:5000/api` (iOS)

5. **Update Socket Configuration:**
   - Open `src/utils/socket.js`
   - Change `SOCKET_URL` to match your backend server

6. **Start the app:**
```bash
npm start
```

## Finding Your Computer's IP Address

### Windows:
```bash
ipconfig
```
Look for "IPv4 Address" under your active network adapter.

### Mac/Linux:
```bash
ifconfig
```
Look for "inet" address (usually starts with 192.168.x.x)

## Testing on Physical Device

1. Install **Expo Go** app from App Store (iOS) or Play Store (Android)
2. Make sure your phone and computer are on the same WiFi network
3. Run `npm start` in the mobile-app directory
4. Scan the QR code with Expo Go app

## Important Notes

- The backend server must be running and accessible
- CORS must be configured in backend to allow mobile app requests
- For production, you'll need to configure proper API endpoints

## Remaining Screens to Complete

The following screens still need to be created:
- AvailableRidesScreen.js
- MyRidesScreen.js
- MyProfileScreen.js
- ChatroomScreen.js

These will be created in the next steps.

