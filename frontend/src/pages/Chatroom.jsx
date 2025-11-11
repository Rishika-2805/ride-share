// frontend/src/pages/Chatroom.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api, setAuthToken } from '../api';
import { socket } from '../socket';

export default function Chatroom() {
    const { rideId } = useParams();
    const [chatroom, setChatroom] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);
    const messagesEndRef = useRef(null);
    const nav = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            nav('/login');
            return;
        }
        setAuthToken(token);

        const fetchChatroom = async () => {
            try {
                setLoading(true);
                // Get current user ID
                const userResponse = await api.get('/auth/me');
                setCurrentUserId(userResponse.data._id || userResponse.data.id);
                
                // Get chatroom
                const response = await api.get(`/chat/ride/${rideId}`);
                setChatroom(response.data);
                setMessages(response.data.messages || []);
            } catch (err) {
                console.error('Error fetching chatroom:', err);
                if (err.response?.status === 401 || err.response?.status === 403) {
                    localStorage.removeItem('token');
                    window.location.href = '/login';
                } else {
                    alert('Failed to load chatroom. Please try again.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchChatroom();

        // Connect to socket
        socket.connect();

        return () => {
            socket.disconnect();
        };
    }, [rideId, nav]);

    useEffect(() => {
        // Listen for new messages after chatroom is loaded
        if (chatroom?._id) {
            socket.on(`chatroom:${chatroom._id}:message`, (data) => {
                setMessages(prev => [...prev, data.message]);
            });
        }

        return () => {
            if (chatroom?._id) {
                socket.off(`chatroom:${chatroom._id}:message`);
            }
        };
    }, [chatroom]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !chatroom) return;

        try {
            setSending(true);
            const response = await api.post(`/chat/chatroom/${chatroom._id}/message`, {
                message: newMessage.trim()
            });
            setMessages(response.data.messages || []);
            setNewMessage('');
        } catch (err) {
            console.error('Error sending message:', err);
            alert('Failed to send message. Please try again.');
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <p>Loading chatroom...</p>
            </div>
        );
    }

    if (!chatroom) {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <p>Chatroom not found.</p>
                <Link to="/rider/my-rides" style={{ color: '#007bff' }}>Back to My Rides</Link>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ color: '#333', margin: 0 }}>Chatroom</h2>
                <Link to="/rider/my-rides" style={{ 
                    padding: '8px 16px', 
                    backgroundColor: '#6c757d', 
                    color: 'white', 
                    textDecoration: 'none', 
                    borderRadius: '4px',
                    fontSize: '14px'
                }}>
                    ← Back to My Rides
                </Link>
            </div>

            <div style={{ 
                flex: 1, 
                border: '1px solid #ddd', 
                borderRadius: '8px', 
                padding: '20px', 
                overflowY: 'auto',
                backgroundColor: '#f9f9f9',
                marginBottom: '20px'
            }}>
                {messages.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#666' }}>No messages yet. Start the conversation!</p>
                ) : (
                    messages.map((msg, idx) => {
                        const senderId = msg.sender?._id?.toString() || msg.sender?.id?.toString();
                        const isOwnMessage = senderId === currentUserId?.toString();
                        return (
                            <div
                                key={idx}
                                style={{
                                    display: 'flex',
                                    justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
                                    marginBottom: '15px'
                                }}
                            >
                                <div style={{
                                    maxWidth: '70%',
                                    padding: '10px 15px',
                                    borderRadius: '12px',
                                    backgroundColor: isOwnMessage ? '#007bff' : '#fff',
                                    color: isOwnMessage ? '#fff' : '#333',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                }}>
                                    {!isOwnMessage && (
                                        <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '5px', color: isOwnMessage ? '#fff' : '#666' }}>
                                            {msg.sender?.name || 'Unknown'}
                                        </div>
                                    )}
                                    <div>{msg.message}</div>
                                    <div style={{ fontSize: '10px', marginTop: '5px', opacity: 0.7 }}>
                                        {new Date(msg.timestamp).toLocaleTimeString()}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} style={{ display: 'flex', gap: '10px' }}>
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    style={{
                        flex: 1,
                        padding: '12px 16px',
                        fontSize: '16px',
                        border: '2px solid #e2e8f0',
                        borderRadius: '8px',
                        outline: 'none'
                    }}
                    disabled={sending}
                />
                <button
                    type="submit"
                    disabled={sending || !newMessage.trim()}
                    style={{
                        padding: '12px 24px',
                        fontSize: '16px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: sending || !newMessage.trim() ? 'not-allowed' : 'pointer',
                        opacity: sending || !newMessage.trim() ? 0.6 : 1
                    }}
                >
                    {sending ? 'Sending...' : 'Send'}
                </button>
            </form>
        </div>
    );
}

