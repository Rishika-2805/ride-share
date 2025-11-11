import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { setAuthToken } from '../api';

export default function RiderHome(){
  const nav = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    setAuthToken(null);
    nav('/login');
  };

  return (
    <div style={containerStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={titleStyle}>Vehicle-pool Member Home</h2>
        <button 
          onClick={handleLogout}
          style={{ padding: '8px 16px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Logout
        </button>
      </div>

      <div style={optionsGridStyle}>
        <Link to='/rider/request' style={{...cardStyle, backgroundColor: '#d4edda'}}>
            <h3>Request a Shared Ride</h3>
            <p>Start a new request with a share price.</p>
        </Link>

        <Link to='/rider/available' style={{...cardStyle, backgroundColor: '#fff3cd'}}>
            <h3>View Available Rides</h3>
            <p>See requests from others and Accept to join.</p>
        </Link>
        
        <Link to='/rider/profile' style={{...cardStyle, backgroundColor: '#f8d7da'}}>
            <h3>My Profile & Wallet</h3>
            <p>View and edit your profile information.</p>
        </Link>
        
        <Link to='/rider/my-rides' style={{...cardStyle, backgroundColor: '#cce5ff'}}>
            <h3>My Ride History</h3>
            <p>View all your requested and joined rides.</p>
        </Link>
   </div>
  </div>
 );
}

// Basic styles for better visualization
const containerStyle = { textAlign: 'center', padding: '20px' };
const titleStyle = { fontSize: '1.5em', marginBottom: '30px', color: '#333' };
const optionsGridStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', maxWidth: '800px', margin: '0 auto' };
const cardStyle = {
    padding: '20px',
    border: '1px solid #ccc',
    borderRadius: '8px',
    textDecoration: 'none',
    color: '#333',
    boxShadow: '2px 2px 5px rgba(0,0,0,0.1)'
};