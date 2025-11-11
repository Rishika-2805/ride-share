// frontend/src/pages/MyProfile.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, setAuthToken } from '../api';

export default function MyProfile(){
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({ 
        name: '', 
        email: '', 
        phone: '', 
        password: '', 
        confirmPassword: '',
        aadharNumber: '',
        panCardNumber: '',
        aadharFile: null,
        panCardFile: null
    });
    const [aadharPreview, setAadharPreview] = useState(null);
    const [panCardPreview, setPanCardPreview] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loadingSave, setLoadingSave] = useState(false);
    const nav = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if(!token) {
            nav('/login');
            return;
        }
        setAuthToken(token);
        
        // Fetch user profile
        const fetchProfile = async () => {
            try {
                setLoading(true);
                const response = await api.get('/auth/me');
                setUser(response.data);
                setForm({
                    name: response.data.name || '',
                    email: response.data.email || '',
                    phone: response.data.phone || '',
                    password: '',
                    confirmPassword: '',
                    aadharNumber: response.data.idVerification?.aadhar?.number || '',
                    panCardNumber: response.data.idVerification?.panCard?.number || ''
                });
                setAadharPreview(response.data.idVerification?.aadhar?.document || null);
                setPanCardPreview(response.data.idVerification?.panCard?.document || null);
            } catch (err) {
                console.error('Error fetching profile:', err);
                if (err.response?.status === 401 || err.response?.status === 403) {
                    localStorage.removeItem('token');
                    window.location.href = '/login';
                } else {
                    alert('Failed to load profile. Please refresh the page.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [nav]);

    const handleEdit = () => {
        setEditing(true);
        setError('');
        setSuccess('');
        // Reset password fields when editing
        setForm(prev => ({ ...prev, password: '', confirmPassword: '' }));
    };

    const handleCancel = () => {
        setEditing(false);
        setError('');
        setSuccess('');
        // Reset form to original user data
        if (user) {
            setForm({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                password: '',
                confirmPassword: '',
                aadharNumber: user.idVerification?.aadhar?.number || '',
                panCardNumber: user.idVerification?.panCard?.number || '',
                aadharFile: null,
                panCardFile: null
            });
            setAadharPreview(user.idVerification?.aadhar?.document || null);
            setPanCardPreview(user.idVerification?.panCard?.document || null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoadingSave(true);

        // Validation
        if (!form.name.trim()) {
            setError('Name is required');
            setLoadingSave(false);
            return;
        }

        if (form.password && form.password.length < 6) {
            setError('Password must be at least 6 characters');
            setLoadingSave(false);
            return;
        }

        if (form.password && form.password !== form.confirmPassword) {
            setError('Passwords do not match');
            setLoadingSave(false);
            return;
        }

        try {
            const updateData = {
                name: form.name.trim(),
                email: form.email.trim() || undefined,
                phone: form.phone.trim() || undefined,
            };

            // Only include password if it's provided
            if (form.password) {
                updateData.password = form.password;
            }

            // Handle ID verification
            const idVerification = {};
            if (form.aadharNumber) {
                idVerification.aadhar = { number: form.aadharNumber.trim() };
                // If file is uploaded, convert to base64 (for now - in production, use proper file upload)
                if (form.aadharFile) {
                    const reader = new FileReader();
                    reader.onloadend = async () => {
                        idVerification.aadhar.document = reader.result;
                        updateData.idVerification = idVerification;
                        await submitUpdate(updateData);
                    };
                    reader.readAsDataURL(form.aadharFile);
                    return;
                } else if (aadharPreview) {
                    idVerification.aadhar.document = aadharPreview;
                }
            }
            if (form.panCardNumber) {
                idVerification.panCard = { number: form.panCardNumber.trim() };
                if (form.panCardFile) {
                    const reader = new FileReader();
                    reader.onloadend = async () => {
                        idVerification.panCard.document = reader.result;
                        if (idVerification.aadhar) {
                            idVerification.aadhar.document = aadharPreview || '';
                        }
                        updateData.idVerification = idVerification;
                        await submitUpdate(updateData);
                    };
                    reader.readAsDataURL(form.panCardFile);
                    return;
                } else if (panCardPreview) {
                    idVerification.panCard.document = panCardPreview;
                }
            }
            
            if (Object.keys(idVerification).length > 0) {
                updateData.idVerification = idVerification;
            }

            const response = await api.put('/auth/me', updateData);
            
            setUser(response.data);
            setEditing(false);
            setSuccess('Profile updated successfully!');
            
            // Clear password fields and file inputs
            setForm(prev => ({ 
                ...prev, 
                password: '', 
                confirmPassword: '',
                aadharFile: null,
                panCardFile: null
            }));
            
            // Update previews
            if (response.data.idVerification?.aadhar?.document) {
                setAadharPreview(response.data.idVerification.aadhar.document);
            }
            if (response.data.idVerification?.panCard?.document) {
                setPanCardPreview(response.data.idVerification.panCard.document);
            }
            
            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Error updating profile:', err);
            if (err.response?.status === 401 || err.response?.status === 403) {
                localStorage.removeItem('token');
                window.location.href = '/login';
            } else {
                setError(err.response?.data?.msg || 'Failed to update profile. Please try again.');
            }
        } finally {
            setLoadingSave(false);
        }
    };

    const submitUpdate = async (updateData) => {
        try {
            const response = await api.put('/auth/me', updateData);
            setUser(response.data);
            setEditing(false);
            setSuccess('Profile updated successfully!');
            setForm(prev => ({ 
                ...prev, 
                password: '', 
                confirmPassword: '',
                aadharFile: null,
                panCardFile: null
            }));
            if (response.data.idVerification?.aadhar?.document) {
                setAadharPreview(response.data.idVerification.aadhar.document);
            }
            if (response.data.idVerification?.panCard?.document) {
                setPanCardPreview(response.data.idVerification.panCard.document);
            }
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Error updating profile:', err);
            setError(err.response?.data?.msg || 'Failed to update profile. Please try again.');
        } finally {
            setLoadingSave(false);
        }
    };

    const handleFileChange = (field, file) => {
        if (file) {
            if (field === 'aadhar') {
                setForm(prev => ({ ...prev, aadharFile: file }));
                const reader = new FileReader();
                reader.onloadend = () => setAadharPreview(reader.result);
                reader.readAsDataURL(file);
            } else if (field === 'panCard') {
                setForm(prev => ({ ...prev, panCardFile: file }));
                const reader = new FileReader();
                reader.onloadend = () => setPanCardPreview(reader.result);
                reader.readAsDataURL(file);
            }
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <p>Loading profile...</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <p>Failed to load profile. Please try again.</p>
                <Link to="/rider" style={{ color: '#007bff' }}>Back to Home</Link>
            </div>
        );
    }

    return (
        <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ color: '#333', margin: 0 }}>My Profile</h2>
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

            {error && (
                <div style={errorStyle}>
                    <span style={errorIcon}>⚠️</span>
                    {error}
                </div>
            )}

            {success && (
                <div style={successStyle}>
                    <span style={successIcon}>✓</span>
                    {success}
                </div>
            )}

            <div style={cardStyle}>
                {!editing ? (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, color: '#333' }}>Profile Information</h3>
                            <button onClick={handleEdit} style={editButtonStyle}>
                                Edit Profile
                            </button>
                        </div>

                        <div style={infoSectionStyle}>
                            <div style={infoRowStyle}>
                                <strong style={labelStyle}>Name:</strong>
                                <span style={valueStyle}>{user.name || 'N/A'}</span>
                            </div>
                            <div style={infoRowStyle}>
                                <strong style={labelStyle}>Email:</strong>
                                <span style={valueStyle}>{user.email || 'Not provided'}</span>
                            </div>
                            <div style={infoRowStyle}>
                                <strong style={labelStyle}>Phone:</strong>
                                <span style={valueStyle}>{user.phone || 'Not provided'}</span>
                            </div>
                            <div style={infoRowStyle}>
                                <strong style={labelStyle}>Role:</strong>
                                <span style={valueStyle}>{user.role || 'rider'}</span>
                            </div>
                            <div style={infoRowStyle}>
                                <strong style={labelStyle}>Member Since:</strong>
                                <span style={valueStyle}>{formatDate(user.createdAt)}</span>
                            </div>
                        </div>

                        <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '2px solid #e9ecef' }}>
                            <h4 style={{ marginBottom: '15px', color: '#333' }}>ID Verification</h4>
                            <div style={infoSectionStyle}>
                                <div style={infoRowStyle}>
                                    <strong style={labelStyle}>Aadhar Number:</strong>
                                    <span style={valueStyle}>{user.idVerification?.aadhar?.number || 'Not provided'}</span>
                                </div>
                                {aadharPreview && (
                                    <div style={{ marginTop: '10px' }}>
                                        <strong style={labelStyle}>Aadhar Document:</strong>
                                        <img src={aadharPreview} alt="Aadhar" style={{ maxWidth: '200px', marginTop: '5px', border: '1px solid #ddd', borderRadius: '4px' }} />
                                    </div>
                                )}
                                <div style={infoRowStyle}>
                                    <strong style={labelStyle}>PAN Card Number:</strong>
                                    <span style={valueStyle}>{user.idVerification?.panCard?.number || 'Not provided'}</span>
                                </div>
                                {panCardPreview && (
                                    <div style={{ marginTop: '10px' }}>
                                        <strong style={labelStyle}>PAN Card Document:</strong>
                                        <img src={panCardPreview} alt="PAN Card" style={{ maxWidth: '200px', marginTop: '5px', border: '1px solid #ddd', borderRadius: '4px' }} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, color: '#333' }}>Edit Profile</h3>
                            <button onClick={handleCancel} style={cancelButtonStyle}>
                                Cancel
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} style={formStyle}>
                            <div style={inputGroupStyle}>
                                <label style={labelStyle}>Name *</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    placeholder="Enter your name"
                                    required
                                    style={inputStyle}
                                    disabled={loadingSave}
                                />
                            </div>

                            <div style={inputGroupStyle}>
                                <label style={labelStyle}>Email</label>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    placeholder="Enter your email"
                                    style={inputStyle}
                                    disabled={loadingSave}
                                />
                            </div>

                            <div style={inputGroupStyle}>
                                <label style={labelStyle}>Phone</label>
                                <input
                                    type="tel"
                                    value={form.phone}
                                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                    placeholder="Enter your phone number"
                                    style={inputStyle}
                                    disabled={loadingSave}
                                />
                            </div>

                            <div style={inputGroupStyle}>
                                <label style={labelStyle}>New Password (leave blank to keep current)</label>
                                <input
                                    type="password"
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    placeholder="Enter new password"
                                    style={inputStyle}
                                    disabled={loadingSave}
                                />
                            </div>

                            {form.password && (
                                <div style={inputGroupStyle}>
                                    <label style={labelStyle}>Confirm New Password</label>
                                    <input
                                        type="password"
                                        value={form.confirmPassword}
                                        onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                                        placeholder="Confirm new password"
                                        style={inputStyle}
                                        disabled={loadingSave}
                                    />
                                </div>
                            )}

                            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '2px solid #e9ecef' }}>
                                <h4 style={{ marginBottom: '15px', color: '#333' }}>ID Verification</h4>
                                
                                <div style={inputGroupStyle}>
                                    <label style={labelStyle}>Aadhar Number</label>
                                    <input
                                        type="text"
                                        value={form.aadharNumber}
                                        onChange={(e) => setForm({ ...form, aadharNumber: e.target.value })}
                                        placeholder="Enter Aadhar number"
                                        style={inputStyle}
                                        disabled={loadingSave}
                                    />
                                </div>

                                <div style={inputGroupStyle}>
                                    <label style={labelStyle}>Aadhar Document (Image)</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleFileChange('aadhar', e.target.files[0])}
                                        style={inputStyle}
                                        disabled={loadingSave}
                                    />
                                    {aadharPreview && (
                                        <img src={aadharPreview} alt="Aadhar Preview" style={{ maxWidth: '200px', marginTop: '10px', border: '1px solid #ddd', borderRadius: '4px' }} />
                                    )}
                                </div>

                                <div style={inputGroupStyle}>
                                    <label style={labelStyle}>PAN Card Number</label>
                                    <input
                                        type="text"
                                        value={form.panCardNumber}
                                        onChange={(e) => setForm({ ...form, panCardNumber: e.target.value })}
                                        placeholder="Enter PAN card number"
                                        style={inputStyle}
                                        disabled={loadingSave}
                                    />
                                </div>

                                <div style={inputGroupStyle}>
                                    <label style={labelStyle}>PAN Card Document (Image)</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleFileChange('panCard', e.target.files[0])}
                                        style={inputStyle}
                                        disabled={loadingSave}
                                    />
                                    {panCardPreview && (
                                        <img src={panCardPreview} alt="PAN Card Preview" style={{ maxWidth: '200px', marginTop: '10px', border: '1px solid #ddd', borderRadius: '4px' }} />
                                    )}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loadingSave}
                                style={{
                                    ...saveButtonStyle,
                                    opacity: loadingSave ? 0.7 : 1,
                                    cursor: loadingSave ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {loadingSave ? 'Saving...' : 'Save Changes'}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}

// Styles
const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '30px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    border: '1px solid #dee2e6'
};

const infoSectionStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
};

const infoRowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid #e9ecef'
};

const labelStyle = {
    color: '#495057',
    fontSize: '14px',
    minWidth: '120px'
};

const valueStyle = {
    color: '#212529',
    fontSize: '14px',
    textAlign: 'right'
};

const formStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
};

const inputGroupStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
};

const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    fontSize: '16px',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    outline: 'none',
    transition: 'all 0.2s',
    boxSizing: 'border-box'
};

const editButtonStyle = {
    padding: '8px 16px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600'
};

const cancelButtonStyle = {
    padding: '8px 16px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600'
};

const saveButtonStyle = {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    fontWeight: '600',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    marginTop: '8px'
};

const errorStyle = {
    backgroundColor: '#fed7d7',
    color: '#c53030',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px'
};

const errorIcon = {
    fontSize: '18px'
};

const successStyle = {
    backgroundColor: '#c6f6d5',
    color: '#22543d',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px'
};

const successIcon = {
    fontSize: '18px'
};

