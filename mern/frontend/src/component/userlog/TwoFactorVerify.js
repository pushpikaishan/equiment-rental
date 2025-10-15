import React, { useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';

export default function TwoFactorVerify() {
  const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
  const nav = useNavigate();
  const { state } = useLocation();
  const pending = state?.pending || {}; // { userId, role, email, name }
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const verify = async () => {
    try {
      setLoading(true);
      const res = await axios.post(`${baseUrl}/auth/2fa/verify`, { userId: pending.userId || pending.id, role: pending.role, code });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.role);
      localStorage.setItem('userId', res.data.user.id);
      // redirect by role
      switch (res.data.role) {
        case 'user': nav('/home'); break;
        case 'supplier': nav('/supplier/dashboard'); break;
        case 'admin': nav('/adminDashbooard'); break;
        case 'staff': nav('/driver'); break;
        default: nav('/');
      }
    } catch (e) {
      setMsg(e.response?.data?.msg || 'Invalid code');
    } finally { setLoading(false); }
  };

  const resend = async () => {
    try {
      setResendLoading(true);
      await axios.post(`${baseUrl}/auth/2fa/resend`, { userId: pending.userId || pending.id, role: pending.role });
      setMsg('Code resent to your email');
    } catch (e) {
      setMsg(e.response?.data?.msg || 'Failed to resend');
    } finally { setResendLoading(false); }
  };

  if (!pending?.role || !pending?.id) {
    return <div style={{ padding: 20 }}>No pending verification. Go to login.</div>;
  }

  return (
    <div style={{
      display: 'grid',
      placeItems: 'center',
      minHeight: '100vh',
      backgroundImage: "linear-gradient(rgba(15, 23, 42, 0.45), rgba(15, 23, 42, 0.45)), url('/logback.png')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }}>
      <style>
        {`
          @keyframes spinSmallLoader { 0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);} }
        `}
      </style>
  <div style={{ background: 'white', padding: 24, borderRadius: 12, border: '1px solid #1d4ed8', width: 360 }}>
        <img
          src="/favicon.ico"
          alt="Logo"
          style={{ display: 'block', margin: '0 auto 12px', width: 64, height: 64 }}
        />
        <h3 style={{ marginTop: 0 }}>Two-Factor Verification</h3>
        <p>We sent a 6-digit code to {pending.email || 'your email'}.</p>
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Enter 6-digit code" style={{ width: '100%', padding: 12, border: '1px solid #e2e8f0', borderRadius: 8 }} />
        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <button onClick={verify} disabled={loading} style={{ background: '#16a34a', color: 'white', border: 'none', padding: '8px 12px', borderRadius: 8, opacity: loading ? 0.85 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span aria-hidden style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.6)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spinSmallLoader 0.9s linear infinite' }} />
                Verifying...
              </span>
            ) : 'Verify'}
          </button>
          <button onClick={resend} type="button" disabled={resendLoading} style={{ background: '#1d4ed8', color: 'white', border: 'none', padding: '8px 12px', borderRadius: 8, opacity: resendLoading ? 0.85 : 1, cursor: resendLoading ? 'not-allowed' : 'pointer' }}>
            {resendLoading ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span aria-hidden style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.6)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spinSmallLoader 0.9s linear infinite' }} />
                Resending...
              </span>
            ) : 'Resend'}
          </button>
        </div>
        {msg && <div style={{ marginTop: 8, color: '#334155' }}>{msg}</div>}
      </div>
    </div>
  );
}
