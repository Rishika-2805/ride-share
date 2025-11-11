// frontend/src/pages/RequestRide.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setAuthToken } from '../api';

export default function RequestRide(){
    const [form, setForm] = useState({ 
        pickup: {lat:'',lng:'',address:''}, 
        drop: {lat:'',lng:'',address:''},
        totalFare: '',       
        membersCount: '2', // Default to 2 members (including the requestor)
        memberShare: 0,
        rideDetailsScreenshot: null
    });
    const [screenshotPreview, setScreenshotPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const nav = useNavigate();

    // Ensure token is set
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            nav('/login');
            return;
        }
        setAuthToken(token);
    }, [nav]);

    // Calculates memberShare dynamically (matching your "Your share" concept)
    useEffect(() => {
        const fare = parseFloat(form.totalFare) || 0;
        const count = parseInt(form.membersCount) || 1;
        
        if (fare > 0 && count > 0) {
            const share = fare / count;
            setForm(prevForm => ({ ...prevForm, memberShare: share.toFixed(2) }));
        } else {
            setForm(prevForm => ({ ...prevForm, memberShare: 0 }));
        }
    }, [form.totalFare, form.membersCount]);

    const submit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        if (!form.pickup.address || !form.drop.address || parseFloat(form.totalFare) <= 0 || parseInt(form.membersCount) < 2) {
            alert('Please fill out all location, fare, and member details. Minimum 2 members required.');
            setLoading(false);
            return;
        }

        try{
            // Ensure token is set before making request
            const token = localStorage.getItem('token');
            if (!token) {
                alert('You are not logged in. Please login again.');
                nav('/login');
                return;
            }
            setAuthToken(token);

            // Convert screenshot to base64 if provided (with compression)
            let screenshotBase64 = null;
            if (form.rideDetailsScreenshot) {
                // Check file size first (warn if > 10MB before compression)
                const fileSizeMB = form.rideDetailsScreenshot.size / (1024 * 1024);
                if (fileSizeMB > 10) {
                    alert(`Warning: The image is very large (${fileSizeMB.toFixed(2)}MB). It will be compressed, but this may take a moment.`);
                }

                // Compress image before converting to base64
                screenshotBase64 = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const img = new Image();
                        img.onload = () => {
                            // Create canvas to resize/compress
                            const canvas = document.createElement('canvas');
                            const maxWidth = 1200;
                            const maxHeight = 1200;
                            let width = img.width;
                            let height = img.height;

                            // Calculate new dimensions
                            if (width > height) {
                                if (width > maxWidth) {
                                    height = (height * maxWidth) / width;
                                    width = maxWidth;
                                }
                            } else {
                                if (height > maxHeight) {
                                    width = (width * maxHeight) / height;
                                    height = maxHeight;
                                }
                            }

                            canvas.width = width;
                            canvas.height = height;

                            // Draw and compress
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(img, 0, 0, width, height);
                            
                            // Convert to base64 with compression (quality 0.7 = 70% quality)
                            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
                            
                            // Check compressed size
                            const compressedSizeMB = (compressedBase64.length * 3/4) / (1024 * 1024);
                            console.log(`Compressed image size: ${compressedSizeMB.toFixed(2)}MB`);
                            
                            if (compressedSizeMB > 5) {
                                console.warn('Compressed image is still large, consider using a smaller image');
                            }
                            
                            resolve(compressedBase64);
                        };
                        img.onerror = () => reject(new Error('Failed to load image'));
                        img.src = reader.result;
                    };
                    reader.onerror = () => reject(new Error('Failed to read file'));
                    reader.readAsDataURL(form.rideDetailsScreenshot);
                });
            }

            console.log('Making request to /rides');
            console.log('Token in localStorage:', token ? 'Exists' : 'Missing');
            console.log('Authorization header:', api.defaults.headers.common['Authorization'] ? 'Set' : 'Not set');
            
            await api.post('/rides', { 
                pickup: { 
                    lat: parseFloat(form.pickup.lat) || 0,
                    lng: parseFloat(form.pickup.lng) || 0, 
                    address: form.pickup.address 
                }, 
                drop: { 
                    lat: parseFloat(form.drop.lat) || 0, 
                    lng: parseFloat(form.drop.lng) || 0, 
                    address: form.drop.address 
                },
                totalFare: parseFloat(form.totalFare),
                membersCount: parseInt(form.membersCount),
                memberShare: parseFloat(form.memberShare),
                rideDetailsScreenshot: screenshotBase64
            });
            alert('Shared Ride Requested! Awaiting members.');
            // Clear form
            setForm({ 
                pickup: {lat:'',lng:'',address:''}, 
                drop: {lat:'',lng:'',address:''},
                totalFare: '',       
                membersCount: '2',
                memberShare: 0,
                rideDetailsScreenshot: null
            });
            setScreenshotPreview(null);
            // Redirect to available rides
            nav('/rider/available');
        }catch(err){
            console.error('Request ride error:', err);
            if (err.response?.status === 401 || err.response?.status === 403) {
                localStorage.removeItem('token');
                nav('/login');
            } else if (err.code === 'ECONNREFUSED' || err.message?.includes('Network Error')) {
                alert('Cannot connect to server. Please make sure the backend server is running on port 5000.'); 
            } else {
                alert(err.response?.data?.msg || err.message || 'Request failed. Check if server is running.'); 
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ padding: '20px' }}>
            <h2 style={{ color: '#007bff' }}>Request a Shared Ride</h2>
            <form onSubmit={submit}>
                
                <div style={formCardStyle}>
                    <h4>Location Details</h4>
                    <input 
                        type='text' 
                        placeholder='Location From (address)' 
                        required
                        value={form.pickup.address}
                        onChange={e=>setForm({...form, pickup:{...form.pickup,address:e.target.value}})} 
                        style={{width: '100%', padding: '8px', marginBottom: '10px'}}
                    />
                    <input 
                        type='text' 
                        placeholder='Location To (address)' 
                        required
                        value={form.drop.address}
                        onChange={e=>setForm({...form, drop:{...form.drop,address:e.target.value}})} 
                        style={{width: '100%', padding: '8px', marginBottom: '10px'}}
                    />
                </div>

                <div style={formCardStyle}>
                    <h4>Share Details</h4>
                    <input 
                        type='number' 
                        placeholder='Total Fare Estimate' 
                        required
                        min='0'
                        step='0.01'
                        value={form.totalFare}
                        onChange={e=>setForm({...form, totalFare:e.target.value})} 
                        style={{width: '100%', padding: '8px', marginBottom: '10px'}}
                    />
                    
                    <label style={{ marginTop: '10px', display: 'block', marginBottom: '5px' }}>
                        Members Required (Including You):
                    </label>
                    <input 
                        type='number' 
                        min='2'
                        placeholder='e.g., 2 or 3' 
                        required
                        value={form.membersCount}
                        onChange={e=>setForm({...form, membersCount:e.target.value})} 
                        style={{width: '100%', padding: '8px', marginBottom: '10px'}}
                    />
                        
                    <p style={shareTextStyle}>
                        Calculated Your Share: <strong>{form.memberShare}</strong>
                    </p>
                </div>

                <div style={formCardStyle}>
                    <h4>Ride Details Screenshot (Optional)</h4>
                    <input 
                        type='file' 
                        accept='image/*'
                        onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                                setForm({...form, rideDetailsScreenshot: file});
                                const reader = new FileReader();
                                reader.onloadend = () => setScreenshotPreview(reader.result);
                                reader.readAsDataURL(file);
                            }
                        }}
                        style={{width: '100%', padding: '8px', marginBottom: '10px'}}
                    />
                    {screenshotPreview && (
                        <img src={screenshotPreview} alt="Ride Details Screenshot" style={{maxWidth: '100%', marginTop: '10px', border: '1px solid #ddd', borderRadius: '4px'}} />
                    )}
                </div>

                <button type='submit' disabled={loading} style={{...buttonStyle, opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer'}}>
                    {loading ? 'Submitting...' : 'MAKE A REQUEST'}
                </button>
            </form>
        </div>
    )
}

const formCardStyle = { border: '1px solid #ddd', padding: '15px', marginBottom: '20px', borderRadius: '6px' };
const shareTextStyle = { fontWeight: 'bold', borderTop: '1px dashed #ccc', paddingTop: '10px', marginTop: '15px' };
const buttonStyle = { backgroundColor: '#28a745', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer', width: '100%', fontSize: '1.1em' };