import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import RiderHomeScreen from './src/screens/RiderHomeScreen';
import RequestRideScreen from './src/screens/RequestRideScreen';
import AvailableRidesScreen from './src/screens/AvailableRidesScreen';
import MyRidesScreen from './src/screens/MyRidesScreen';
import MyProfileScreen from './src/screens/MyProfileScreen';
import ChatroomScreen from './src/screens/ChatroomScreen';

// Utils
import { setAuthToken } from './src/utils/api';

const Stack = createNativeStackNavigator();

export default function App() {
  useEffect(() => {
    // Restore token from AsyncStorage on app load
    const restoreToken = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          setAuthToken(token);
        }
      } catch (error) {
        console.error('Error restoring token:', error);
      }
    };
    restoreToken();
  }, []);

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#007bff',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Signup" 
          component={SignupScreen}
          options={{ title: 'Sign Up' }}
        />
        <Stack.Screen 
          name="RiderHome" 
          component={RiderHomeScreen}
          options={{ title: 'Ride Share', headerLeft: () => null }}
        />
        <Stack.Screen 
          name="RequestRide" 
          component={RequestRideScreen}
          options={{ title: 'Request a Ride' }}
        />
        <Stack.Screen 
          name="AvailableRides" 
          component={AvailableRidesScreen}
          options={{ title: 'Available Rides' }}
        />
        <Stack.Screen 
          name="MyRides" 
          component={MyRidesScreen}
          options={{ title: 'My Rides' }}
        />
        <Stack.Screen 
          name="MyProfile" 
          component={MyProfileScreen}
          options={{ title: 'My Profile' }}
        />
        <Stack.Screen 
          name="Chatroom" 
          component={ChatroomScreen}
          options={{ title: 'Chatroom' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

