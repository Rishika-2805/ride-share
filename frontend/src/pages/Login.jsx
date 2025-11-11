import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api, setAuthToken } from '../api'

export default function Login(){
  const [form, setForm] = useState({ emailOrPhone:'', password:'' })
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
    
    try{
      const res = await api.post('/auth/login', { 
        emailOrPhone: form.emailOrPhone, 
        password: form.password 
      })
      const { token, user } = res.data
      localStorage.setItem('token', token)
      setAuthToken(token)
      nav('/rider')
    }catch(err){ 
      setError(err.response?.data?.msg || 'Login failed. Please check your credentials.')
      setLoading(false)
    }
  }

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={headerStyle}>
          <h1 style={titleStyle}>Welcome Back</h1>
          <p style={subtitleStyle}>Login to your account</p>
        </div>

        {error && (
          <div style={errorStyle}>
            <span style={errorIcon}>⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={submit} style={formStyle}>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Email or Phone</label>
            <input 
              value={form.emailOrPhone}
              onChange={e=>setForm({...form,emailOrPhone:e.target.value})} 
              placeholder='Enter your email or phone'
              required
              style={inputStyle}
              disabled={loading}
            />
          </div>

          <div style={inputGroupStyle}>
            <label style={labelStyle}>Password</label>
            <input 
              type='password' 
              value={form.password}
              onChange={e=>setForm({...form,password:e.target.value})}
              placeholder='Enter your password'
              required
              style={inputStyle}
              disabled={loading}
            />
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
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div style={footerStyle}>
          <p style={footerTextStyle}>
            Don't have an account?{' '}
            <Link to='/signup' style={linkStyle}>Sign up</Link>
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
  maxWidth: '420px'
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

const buttonStyle = {
  width: '100%',
  padding: '14px',
  fontSize: '16px',
  fontWeight: '600',
  backgroundColor: '#4299e1',
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
