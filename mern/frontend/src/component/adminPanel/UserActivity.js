import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function UserActivity() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ email: '', role: '', action: '', status: '', from: '', to: '' });

  const token = useMemo(() => localStorage.getItem('token') || '', []);
  const role = useMemo(() => localStorage.getItem('role') || '', []);
  const api = useMemo(() => process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000', []);

  const load = async (p = page, l = limit, f = filters) => {
    try {
      setLoading(true);
      if (!token) {
        setError('Please log in as an admin or staff to view activity.');
        setItems([]);
        return;
      }
      if (role !== 'admin' && role !== 'staff') {
        setError('Forbidden: Admins and staff only.');
        setItems([]);
        return;
      }
      const params = new URLSearchParams({ page: String(p), limit: String(l) });
      Object.entries(f).forEach(([k, v]) => { if (v) params.set(k, String(v)); });
      const res = await axios.get(`${api}/activity?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setItems(Array.isArray(res.data?.items) ? res.data.items : []);
      setTotal(Number(res.data?.total || 0));
      setPage(Number(res.data?.page || p));
      setLimit(Number(res.data?.limit || l));
      setError('');
    } catch (e) {
      console.error('Load activity error:', e);
      const status = e?.response?.status;
      if (status === 401) setError('Unauthorized: Please log in again.');
      else if (status === 403) setError('Forbidden: Admins and staff only.');
      else setError('Failed to load activity');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(1, limit, filters); /* eslint-disable-next-line */ }, []);

  const pages = Math.max(1, Math.ceil(total / limit));

  const applyFilters = () => load(1, limit, filters);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <h1 style={{ margin: 0, color: '#0f172a' }}>User Activity</h1>
        <button
          onClick={() => navigate('/adminDashbooard')}
          style={{
            background:"linear-gradient(135deg, rgba(121, 13, 131, 1) 0%, #1d4ed8 100%)",
            color: '#fff',
            border: 0,
            borderRadius: 8,
            padding: '8px 12px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
          onMouseOver={(e)=> e.currentTarget.style.background = '#rgba(121, 13, 131, 1)'}
          onMouseOut={(e)=> e.currentTarget.style.background = '#1d4ed8'}
        >
          ← Back to Dashboard
        </button>
      </div>
      <p style={{ color: '#475569', marginTop: 8 }}>View login attempts, password resets, and 2FA actions.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginTop: 12 }}>
        <input placeholder="Email" value={filters.email} onChange={e=>setFilters(f=>({...f,email:e.target.value}))}
               style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }} />
        <select value={filters.role} onChange={e=>setFilters(f=>({...f,role:e.target.value}))}
                style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }}>
          <option value="">Any role</option>
          <option value="user">User</option>
          <option value="supplier">Supplier</option>
          <option value="staff">Staff</option>
          <option value="admin">Admin</option>
        </select>
        <select value={filters.action} onChange={e=>setFilters(f=>({...f,action:e.target.value}))}
                style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }}>
          <option value="">Any action</option>
          <option value="login">Login</option>
          <option value="2fa_challenge">2FA Challenge</option>
          <option value="2fa_resend">2FA Resend</option>
          <option value="2fa_verify">2FA Verify</option>
          <option value="2fa_enable">2FA Enable</option>
          <option value="2fa_disable">2FA Disable</option>
          <option value="password_reset_request">Password Reset Request</option>
          <option value="password_reset">Password Reset</option>
        </select>
        <select value={filters.status} onChange={e=>setFilters(f=>({...f,status:e.target.value}))}
                style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }}>
          <option value="">Any status</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
          <option value="info">Info</option>
        </select>
        <input type="date" value={filters.from} onChange={e=>setFilters(f=>({...f,from:e.target.value}))}
               style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }} />
        <input type="date" value={filters.to} onChange={e=>setFilters(f=>({...f,to:e.target.value}))}
               style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }} />
        <button onClick={applyFilters} style={{ background: '#1d4ed8', color: '#fff', border: 0, borderRadius: 6, padding: '8px 12px', fontWeight: 600 }}>Apply</button>
      </div>

      <div style={{ marginTop: 16, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}>
        {loading ? (
          <div style={{ padding: 16, color: '#475569' }}>Loading...</div>
        ) : error ? (
          <div style={{ padding: 16, color: '#dc2626' }}>{error}</div>
        ) : items.length === 0 ? (
          <div style={{ padding: 16, color: '#475569' }}>No activity found.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#e2e8f0' }}>
                  {['Time','Email','Role','Action','Status','IP','User-Agent'].map((h,i)=> (
                    <th key={i} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 12, color: '#0f172a', borderBottom: '1px solid #cbd5e1' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it._id}>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0' }}>{new Date(it.createdAt).toLocaleString()}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0' }}>{it.email || '-'}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', textTransform: 'capitalize' }}>{it.role || '-'}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0' }}>{it.action}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', color: it.status === 'success' ? '#16a34a' : it.status === 'failed' ? '#dc2626' : '#334155' }}>{it.status}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0' }}>{it.ip || '-'}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.userAgent || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, alignItems: 'center' }}>
        <div style={{ color: '#475569' }}>Page {page} of {pages} • Total {total}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button disabled={page<=1} onClick={()=>load(page-1, limit, filters)} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff' }}>Prev</button>
          <button disabled={page>=pages} onClick={()=>load(page+1, limit, filters)} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff' }}>Next</button>
        </div>
      </div>
    </div>
  );
}
