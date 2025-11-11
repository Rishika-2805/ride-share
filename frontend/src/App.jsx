import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/Signup'
import RiderHome from './pages/RiderHome'
import RequestRide from './pages/RequestRide'
import AvailableRides from './pages/AvailableRides'
import MyRides from './pages/MyRides'
import MyProfile from './pages/MyProfile'
import Chatroom from './pages/Chatroom'
import ProtectedRoute from './components/ProtectedRoute'
import { setAuthToken } from './api'

function App(){
  // Restore token from localStorage on app load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setAuthToken(token);
    }
  }, []);

  return (
    <Routes>
      <Route path='/' element={<Navigate to='/login' />} />
      <Route path='/login' element={<Login/>} />
      <Route path='/signup' element={<Signup/>} />
      
      {/* Protected Rider/Member Routes */}
      <Route path='/rider' element={
        <ProtectedRoute>
          <RiderHome/>
        </ProtectedRoute>
      } />
      <Route path='/rider/home' element={
        <ProtectedRoute>
          <RiderHome/>
        </ProtectedRoute>
      } />
      <Route path='/rider/request' element={
        <ProtectedRoute>
          <RequestRide/>
        </ProtectedRoute>
      } />
      <Route path='/rider/available' element={
        <ProtectedRoute>
          <AvailableRides/>
        </ProtectedRoute>
      } />
      <Route path='/rider/my-rides' element={
        <ProtectedRoute>
          <MyRides/>
        </ProtectedRoute>
      } />
      <Route path='/rider/profile' element={
        <ProtectedRoute>
          <MyProfile/>
        </ProtectedRoute>
      } />
      <Route path='/chatroom/:rideId' element={
        <ProtectedRoute>
          <Chatroom/>
        </ProtectedRoute>
      } />
    </Routes>
  )
}
export default App