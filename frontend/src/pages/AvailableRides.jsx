// frontend/src/pages/AvailableRides.jsx
import React, { useEffect, useState } from 'react';
import { socket } from '../socket';
import { api, setAuthToken } from '../api';

export default function AvailableRides(){
    const [availableRides, setAvailableRides] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(()=>{
        const token = localStorage.getItem('token');
        if(!token) {
            // This shouldn't happen due to ProtectedRoute, but just in case
            return;
        }
        setAuthToken(token);
        
        // Fetch existing available rides from the backend
        const fetchAvailableRides = async () => {
            try {
                setLoading(true);
                const response = await api.get('/rides/available');
                setAvailableRides(response.data || []);
            } catch (err) {
                console.error('Error fetching available rides:', err);
                if (err.response?.status === 401 || err.response?.status === 403) {
                    localStorage.removeItem('token');
                    window.location.href = '/login';
                } else {
                    alert('Failed to load available rides. Please refresh the page.');
                }
            } finally {
                setLoading(false);
            }
        };

        // Fetch rides on component mount
        fetchAvailableRides();
        
        // Ensure socket is connected to listen for new rides
        socket.connect();

        // Socket listener for new shared ride announcements
        socket.on('new_shared_ride', data => {
            // Show browser notification if permission granted
            if (data.notification && 'Notification' in window && Notification.permission === 'granted') {
                new Notification(data.notification.title, {
                    body: data.notification.body,
                    icon: '/favicon.ico'
                });
            } else if (data.notification && 'Notification' in window && Notification.permission === 'default') {
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        new Notification(data.notification.title, {
                            body: data.notification.body,
                            icon: '/favicon.ico'
                        });
                    }
                });
            }

            // Check if this ride already exists in the list (avoid duplicates)
            setAvailableRides(prev => {
                const exists = prev.some(r => r.rideId === data.rideId);
                if (exists) {
                    return prev; // Don't add duplicate
                }
                // Add the new ride to the list
                return [
                    { 
                        ...data, 
                        members: data.members || [], 
                        membersCount: data.membersCount || 2,
                        totalFare: data.totalFare || (data.memberShare * (data.membersCount || 2))
                    }, 
                    ...prev
                ];
            });
        });
        
        // Socket listener for when a member joins (to update or hide the ride)
        socket.on('ride_member_joined', data => {
            // Remove the ride from the list if it's full or no longer available
            setAvailableRides(prev => {
                // If ride is full (status changed to 'accepted'), remove it
                if (data.newStatus === 'accepted') {
                    return prev.filter(r => r.rideId !== data.rideId);
                }
                // Otherwise, update the ride's member count if needed
                return prev.map(r => {
                    if (r.rideId === data.rideId) {
                        return {
                            ...r,
                            currentMembersCount: data.currentMembers || r.currentMembersCount || 0
                        };
                    }
                    return r;
                }).filter(r => {
                    // Remove if ride is now full
                    const currentCount = r.currentMembersCount || (r.members ? r.members.length : 0);
                    return currentCount < r.membersCount;
                });
            });
        });

        return ()=>{ 
            socket.off('new_shared_ride');
            socket.off('ride_member_joined');
            socket.disconnect(); 
        }
    },[]);

    // **AvailableRides.jsx's joinRide function** (Handles Screen 6: Accept action)
    const joinRide = async (rideId) => {
        try{ 
            // Call the new backend endpoint to add this user as a member (first-come-first-serve)
            const response = await api.post(`/rides/${rideId}/join`);
            
            if (response.data.chatroomId) {
                alert('You have successfully joined this shared ride! A chatroom has been created. Redirecting to chat...');
                // Redirect to chatroom
                setTimeout(() => {
                    window.location.href = `/chatroom/${rideId}`;
                }, 1000);
            } else {
                alert('You have successfully joined this shared ride as a member!');
            }

            // Remove the joined ride from the available list locally
            setAvailableRides(prev => prev.filter(r => r.rideId !== rideId));
            
        } catch(err){
            if (err.response?.status === 401 || err.response?.status === 403) {
                localStorage.removeItem('token');
                window.location.href = '/login';
            } else {
                alert(err.response?.data?.msg || 'Could not join ride. It might be full or taken.'); 
            }
        }
    }

    return (
        <div style={{ padding: '20px' }}>
            <h2 style={{ color: '#ffc107' }}>Available Rides</h2>
            <p>View rides below and click Accept to join as a Member and split the fare.</p>

            {loading ? (
                <p>Loading available rides...</p>
            ) : (
                <div>
                    {availableRides.length === 0 && <p>No shared rides available right now. Be the first to request one!</p>}
                    {availableRides.map(r => {
                        const currentMembers = r.currentMembersCount || (r.members ? r.members.length : 0);
                        const spotsLeft = (r.membersCount || 2) - currentMembers;
                        return (
                            <div key={r.rideId} style={rideCardStyle}>
                                <h4>Join This Ride</h4>
                                {r.rider && <p style={{fontSize: '0.9em', color: '#666'}}><strong>Created by:</strong> {r.rider.name}</p>}
                                <p><strong>From:</strong> {r.pickup?.address || 'N/A'}</p>
                                <p><strong>To:</strong> {r.drop?.address || 'N/A'}</p>
                                {r.rideDetailsScreenshot && (
                                    <div style={{margin: '10px 0'}}>
                                        <strong>Ride Details Screenshot:</strong>
                                        <img src={r.rideDetailsScreenshot} alt="Ride Details" style={{maxWidth: '100%', marginTop: '5px', border: '1px solid #ddd', borderRadius: '4px'}} />
                                    </div>
                                )}
                                <hr style={{margin: '10px 0'}}/>
                                <p style={{fontWeight: 'bold'}}>Total fare: ₹{r.totalFare || 0}</p>
                                <p style={{fontWeight: 'bold'}}>Your share: ₹{r.memberShare || 0}</p>
                                <p style={{fontSize: '0.9em', color: '#555'}}>
                                    Members: {currentMembers}/{r.membersCount || 2} ({spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left)
                                </p>
                                <button onClick={() => joinRide(r.rideId)} style={acceptButtonStyle}>
                                    ACCEPT (Join)
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    )
}

// Basic styles for visualization
const rideCardStyle = {
    border: '2px solid #ffc107', 
    padding: '15px', 
    marginBottom: '15px', 
    borderRadius: '10px',
    backgroundColor: '#fffbe6'
};

const acceptButtonStyle = {
    backgroundColor: '#007bff',
    color: 'white',
    padding: '8px 15px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    marginTop: '10px'
};