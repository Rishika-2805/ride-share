import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api, setAuthToken } from '../api'

export default function Signup(){
  const [form, setForm] = useState({ name:'', email:'', phone:'', password:'', role:'rider' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const nav = useNavigate()

  // Redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      nav('/rider');
    }
  }, [nav]);

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validation
    if (!form.name || !form.password) {
      setError('Name and password are required');
      setLoading(false);
      return;
    }
    if (!form.email && !form.phone) {
      setError('Email or phone is required');
      setLoading(false);
      return;
    }

    try{
      const res = await api.post('/auth/signup', form)
      const { token, user } = res.data
      localStorage.setItem('token', token)
      setAuthToken(token)
      nav('/rider')
    }catch(err){ 
      setError(err.response?.data?.msg || 'Signup failed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={headerStyle}>
          <h1 style={titleStyle}>Create Account</h1>
          <p style={subtitleStyle}>Join us to start sharing rides</p>
        </div>

        {error && (
          <div style={errorStyle}>
            <span style={errorIcon}>⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={submit} style={formStyle}>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Full Name</label>
            <input 
              placeholder='Enter your full name' 
              value={form.name}
              onChange={e=>setForm({...form,name:e.target.value})}
              required
              style={inputStyle}
              disabled={loading}
            />
          </div>

          <div style={inputGroupStyle}>
            <label style={labelStyle}>Email <span style={optionalStyle}>(optional)</span></label>
            <input 
              placeholder='Enter your email' 
              value={form.email}
              onChange={e=>setForm({...form,email:e.target.value})}
              type='email'
              style={inputStyle}
              disabled={loading}
            />
          </div>

          <div style={inputGroupStyle}>
            <label style={labelStyle}>Phone <span style={optionalStyle}>(optional)</span></label>
            <input 
              placeholder='Enter your phone number' 
              value={form.phone}
              onChange={e=>setForm({...form,phone:e.target.value})}
              type='tel'
              style={inputStyle}
              disabled={loading}
            />
          </div>

          <div style={inputGroupStyle}>
            <label style={labelStyle}>Password</label>
            <input 
              placeholder='Create a password' 
              type='password' 
              value={form.password}
              onChange={e=>setForm({...form,password:e.target.value})}
              required
              style={inputStyle}
              disabled={loading}
            />
          </div>

          <div style={infoBoxStyle}>
            <p style={infoTextStyle}>
              💡 At least one of Email or Phone is required
            </p>
          </div>

          <button 
            type='submit'
            disabled={loading}
            style={{
              ...buttonStyle,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div style={footerStyle}>
          <p style={footerTextStyle}>
            Already have an account?{' '}
            <Link to='/login' style={linkStyle}>Login</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

// Styles
const containerStyle = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#f5f7fa',
  padding: '20px',
  fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
}

const cardStyle = {
  backgroundColor: 'white',
  borderRadius: '12px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
  padding: '40px',
  width: '100%',
  maxWidth: '480px'
}

const headerStyle = {
  textAlign: 'center',
  marginBottom: '30px'
}

const titleStyle = {
  fontSize: '28px',
  fontWeight: '700',
  color: '#1a202c',
  margin: '0 0 8px 0'
}

const subtitleStyle = {
  fontSize: '14px',
  color: '#718096',
  margin: '0'
}

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
}

const errorIcon = {
  fontSize: '18px'
}

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px'
}

const inputGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
}

const labelStyle = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#2d3748'
}

const optionalStyle = {
  fontSize: '12px',
  fontWeight: '400',
  color: '#a0aec0'
}

const inputStyle = {
  width: '100%',
  padding: '12px 16px',
  fontSize: '16px',
  border: '2px solid #e2e8f0',
  borderRadius: '8px',
  outline: 'none',
  transition: 'all 0.2s',
  boxSizing: 'border-box'
}

const infoBoxStyle = {
  backgroundColor: '#edf2f7',
  padding: '12px 16px',
  borderRadius: '8px',
  marginTop: '4px'
}

const infoTextStyle = {
  fontSize: '13px',
  color: '#4a5568',
  margin: '0'
}

const buttonStyle = {
  width: '100%',
  padding: '14px',
  fontSize: '16px',
  fontWeight: '600',
  backgroundColor: '#48bb78',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  transition: 'all 0.2s',
  marginTop: '8px'
}

const footerStyle = {
  marginTop: '24px',
  textAlign: 'center'
}

const footerTextStyle = {
  fontSize: '14px',
  color: '#718096',
  margin: '0'
}

const linkStyle = {
  color: '#4299e1',
  textDecoration: 'none',
  fontWeight: '600'
}
