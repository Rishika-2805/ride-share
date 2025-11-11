// frontend/src/pages/MyRides.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, setAuthToken } from '../api';

export default function MyRides(){
    const [myRides, setMyRides] = useState([]);
    const [loading, setLoading] = useState(true);
    const nav = useNavigate();

    useEffect(()=>{
        const token = localStorage.getItem('token');
        if(!token) {
            nav('/login');
            return;
        }
        setAuthToken(token);
        
        // Fetch user's rides from the backend
        const fetchMyRides = async () => {
            try {
                setLoading(true);
                const response = await api.get('/rides/my-rides');
                setMyRides(response.data || []);
            } catch (err) {
                console.error('Error fetching my rides:', err);
                if (err.response?.status === 401 || err.response?.status === 403) {
                    localStorage.removeItem('token');
                    window.location.href = '/login';
                } else {
                    alert('Failed to load your rides. Please refresh the page.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchMyRides();
    },[nav]);

    const getStatusBadge = (status) => {
        const statusColors = {
            'awaiting_member_join': { bg: '#fff3cd', color: '#856404', text: 'Awaiting Members' },
            'accepted': { bg: '#d4edda', color: '#155724', text: 'Accepted' },
            'started': { bg: '#cce5ff', color: '#004085', text: 'In Progress' },
            'completed': { bg: '#d1ecf1', color: '#0c5460', text: 'Completed' },
            'cancelled': { bg: '#f8d7da', color: '#721c24', text: 'Cancelled' }
        };
        const style = statusColors[status] || { bg: '#e2e3e5', color: '#383d41', text: status };
        return (
            <span style={{
                backgroundColor: style.bg,
                color: style.color,
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '0.85em',
                fontWeight: '600'
            }}>
                {style.text}
            </span>
        );
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ color: '#333', margin: 0 }}>My Ride History</h2>
                <Link to="/rider" style={{ 
                    padding: '8px 16px', 
                    backgroundColor: '#6c757d', 
                    color: 'white', 
                    textDecoration: 'none', 
                    borderRadius: '4px',
                    fontSize: '14px'
                }}>
                    ← Back to Home
                </Link>
            </div>

            {loading ? (
                <p>Loading your rides...</p>
            ) : (
                <div>
                    {myRides.length === 0 ? (
                        <div style={{
                            padding: '40px',
                            textAlign: 'center',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '8px',
                            border: '1px solid #dee2e6'
                        }}>
                            <p style={{ fontSize: '18px', color: '#6c757d', margin: 0 }}>
                                No rides yet. <Link to="/rider/request" style={{ color: '#007bff' }}>Request a ride</Link> to get started!
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {myRides.map(ride => {
                                const spotsLeft = (ride.membersCount || 2) - (ride.currentMembersCount || ride.members?.length || 0);
                                return (
                                    <div key={ride.rideId} style={rideCardStyle}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                            <div>
                                                <h3 style={{ margin: '0 0 8px 0', color: '#333' }}>
                                                    {ride.isCreator ? '🛵 Your Requested Ride' : '👥 Joined Ride'}
                                                </h3>
                                                {ride.isCreator && (
                                                    <p style={{ margin: '0 0 8px 0', fontSize: '0.9em', color: '#666' }}>
                                                        You created this ride
                                                    </p>
                                                )}
                                            </div>
                                            {getStatusBadge(ride.status)}
                                        </div>
                                        
                                        <div style={{ marginBottom: '12px' }}>
                                            <p style={{ margin: '4px 0' }}>
                                                <strong>From:</strong> {ride.pickup?.address || 'N/A'}
                                            </p>
                                            <p style={{ margin: '4px 0' }}>
                                                <strong>To:</strong> {ride.drop?.address || 'N/A'}
                                            </p>
                                        </div>
                                        
                                        <hr style={{ margin: '12px 0', border: 'none', borderTop: '1px solid #dee2e6' }} />
                                        
                                        <div style={{ 
                                            display: 'grid', 
                                            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                                            gap: '10px',
                                            marginBottom: '12px'
                                        }}>
                                            <div>
                                                <p style={{ margin: '4px 0', fontSize: '0.9em', color: '#666' }}>Total Fare</p>
                                                <p style={{ margin: '4px 0', fontWeight: 'bold', fontSize: '1.1em' }}>
                                                    ₹{ride.totalFare || 0}
                                                </p>
                                            </div>
                                            <div>
                                                <p style={{ margin: '4px 0', fontSize: '0.9em', color: '#666' }}>Your Share</p>
                                                <p style={{ margin: '4px 0', fontWeight: 'bold', fontSize: '1.1em' }}>
                                                    ₹{ride.memberShare || 0}
                                                </p>
                                            </div>
                                            <div>
                                                <p style={{ margin: '4px 0', fontSize: '0.9em', color: '#666' }}>Members</p>
                                                <p style={{ margin: '4px 0', fontWeight: 'bold' }}>
                                                    {ride.currentMembersCount || ride.members?.length || 0}/{ride.membersCount || 2}
                                                    {spotsLeft > 0 && ` (${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} left)`}
                                                </p>
                                            </div>
                                        </div>

                                        {ride.members && ride.members.length > 0 && (
                                            <div style={{ marginTop: '12px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                                                <p style={{ margin: '0 0 8px 0', fontSize: '0.9em', fontWeight: '600', color: '#495057' }}>
                                                    Members:
                                                </p>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                    {ride.members.map((member, idx) => (
                                                        <span key={member.id || idx} style={{
                                                            padding: '4px 8px',
                                                            backgroundColor: '#e9ecef',
                                                            borderRadius: '4px',
                                                            fontSize: '0.85em',
                                                            color: '#495057'
                                                        }}>
                                                            {member.name} {ride.rider?.id === member.id && '(Creator)'}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div style={{ marginTop: '12px', fontSize: '0.85em', color: '#6c757d' }}>
                                            <p style={{ margin: '4px 0' }}>
                                                <strong>Created:</strong> {formatDate(ride.createdAt)}
                                            </p>
                                            {ride.acceptedAt && (
                                                <p style={{ margin: '4px 0' }}>
                                                    <strong>Accepted:</strong> {formatDate(ride.acceptedAt)}
                                                </p>
                                            )}
                                            {ride.completedAt && (
                                                <p style={{ margin: '4px 0' }}>
                                                    <strong>Completed:</strong> {formatDate(ride.completedAt)}
                                                </p>
                                            )}
                                        </div>

                                        {ride.status === 'accepted' && (
                                            <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #dee2e6' }}>
                                                <Link 
                                                    to={`/chatroom/${ride.rideId}`}
                                                    style={{
                                                        display: 'inline-block',
                                                        padding: '8px 16px',
                                                        backgroundColor: '#007bff',
                                                        color: 'white',
                                                        textDecoration: 'none',
                                                        borderRadius: '4px',
                                                        fontSize: '14px',
                                                        fontWeight: '600'
                                                    }}
                                                >
                                                    💬 Open Chatroom
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// Styles
const rideCardStyle = {
    border: '1px solid #dee2e6',
    borderRadius: '8px',
    padding: '20px',
    backgroundColor: 'white',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    transition: 'box-shadow 0.2s',
};

