import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function TwoFactorSetup() {
  const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [msg, setMsg] = useState('');

  useEffect(() => { setMsg(''); }, [enabled]);

  // Load current 2FA status
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await axios.get(`${baseUrl}/auth/2fa/status`, { headers });
        if (mounted) setEnabled(!!res.data?.enabled);
      } catch (e) {
        // ignore; default false
      } finally {
        if (mounted) setInitLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const save = async () => {
    try {
      setLoading(true);
      const res = await axios.post(`${baseUrl}/auth/2fa/set`, { enabled }, { headers });
      setMsg(enabled ? 'Two-Factor enabled' : 'Two-Factor disabled');
    } catch (e) {
      setMsg(e.response?.data?.msg || 'Failed to save');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ maxWidth: 520, margin: '40px auto', background: 'white', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0' }}>
      <h2>Email Two-Factor Authentication</h2>
      <p>When enabled, we will send a 6-digit code to your account email after you enter your password.</p>
      {initLoading ? (
        <div style={{ marginTop: 12, color: '#64748b' }}>Loading current status…</div>
      ) : (
        <>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} /> Enable 2FA on this account
          </label>
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button onClick={save} disabled={loading} style={{ background: '#0ea5e9', color: 'white', border: 'none', padding: '8px 12px', borderRadius: 8 }}>
              {loading ? 'Saving…' : (enabled ? 'Save (Enabled)' : 'Save (Disabled)')}
            </button>
            {enabled && (
              <button
                onClick={async () => { setEnabled(false); await save(); }}
                disabled={loading}
                style={{ background: '#ef4444', color: 'white', border: 'none', padding: '8px 12px', borderRadius: 8 }}
              >
                {loading ? 'Disabling…' : 'Disable Two-Factor'}
              </button>
            )}
          </div>
        </>
      )}
      {msg && <div style={{ marginTop: 8, color: '#334155' }}>{msg}</div>}
    </div>
  );
}
