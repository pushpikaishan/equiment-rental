import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

export default function DeliveryManagement() {
  const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
  const token = localStorage.getItem('token');
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]); // { booking, delivery }
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const card = { background: 'white', padding: 20, borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' };
  const btn = (bg) => ({ background: bg, color: 'white', border: 'none', padding: '8px 12px', borderRadius: 8, cursor: 'pointer' });
  const input = { padding: 10, border: '1px solid #e2e8f0', borderRadius: 8 };

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 10 });
      const res = await axios.get(`${baseUrl}/deliveries/admin?${params.toString()}`, { headers });
      setItems(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); /* eslint-disable-next-line */ }, [page]);

  const [assigning, setAssigning] = useState(null); // bookingId
  const [drivers, setDrivers] = useState([]);
  const [driverId, setDriverId] = useState('');

  const startAssign = (bookingId, current) => {
    setAssigning(bookingId);
    setDriverId(current?.driverId || '');
  };

  const submitAssign = async () => {
    if (!assigning) return;
    if (!driverId) { alert('Select a driver'); return; }
    await axios.post(`${baseUrl}/deliveries/admin/${assigning}/assign`, { driverId }, { headers });
    setAssigning(null);
    setDriverId('');
    fetchData();
  };

  useEffect(() => {
    const loadDrivers = async () => {
      try {
        const res = await axios.get(`${baseUrl}/deliveries/admin/drivers`, { headers });
        setDrivers(res.data.drivers || []);
      } catch {}
    };
    loadDrivers();
    // eslint-disable-next-line
  }, []);

  const markDelivered = async (bookingId) => {
    await axios.put(`${baseUrl}/deliveries/admin/${bookingId}/complete`, {}, { headers });
    fetchData();
  };

  const purgeAll = async () => {
    if (!window.confirm('Remove ALL deliveries? This cannot be undone.')) return;
    await axios.delete(`${baseUrl}/deliveries/admin`, { headers });
    fetchData();
  };

  return (
    <div>
      <div style={{ ...card, marginBottom: 16 }}>
        <h2 style={{ marginTop: 0 }}>Delivery Management</h2>
        <p style={{ color: '#64748b', marginTop: 4 }}>Manage deliveries for confirmed bookings only. Assign a staff driver and mark as delivered.</p>
        <div>
          <button onClick={purgeAll} style={btn('#dc2626')}>Remove All Deliveries</button>
        </div>
      </div>

      <div style={{ ...card }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: 10 }}>Created</th>
                <th style={{ padding: 10 }}>Booking</th>
                <th style={{ padding: 10 }}>Customer</th>
                <th style={{ padding: 10 }}>Address</th>
                <th style={{ padding: 10 }}>Date</th>
                <th style={{ padding: 10 }}>Driver</th>
                <th style={{ padding: 10 }}>Delivery Status</th>
                <th style={{ padding: 10 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" style={{ padding: 10 }}>Loading…</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan="8" style={{ padding: 10 }}>No confirmed bookings to deliver.</td></tr>
              ) : (
                items.map(({ booking: b, delivery: d }) => (
                  <tr key={b._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: 10 }}>{new Date(b.createdAt).toLocaleString()}</td>
                    <td style={{ padding: 10 }}><code>{b._id}</code></td>
                    <td style={{ padding: 10 }}>{b.customerName} ({b.customerEmail})</td>
                    <td style={{ padding: 10 }}>{b.deliveryAddress || '-'}</td>
                    <td style={{ padding: 10 }}>{new Date(b.bookingDate).toLocaleDateString()}</td>
                    <td style={{ padding: 10 }}>{d?.driver || '-'}</td>
                    <td style={{ padding: 10, textTransform: 'capitalize' }}>{d?.status || 'unassigned'}</td>
                    <td style={{ padding: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button onClick={() => startAssign(b._id, d)} style={btn('#2563eb')}>{d ? 'Reassign' : 'Assign'}</button>
                      <button onClick={() => markDelivered(b._id)} disabled={!d || d.status !== 'assigned'} style={btn('#16a34a')}>Mark Delivered</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between' }}>
          <div>Page {page} of {Math.max(1, Math.ceil(total / 10))}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} style={btn('#64748b')}>Prev</button>
            <button disabled={page >= Math.ceil(total / 10)} onClick={() => setPage((p) => p + 1)} style={btn('#64748b')}>Next</button>
          </div>
        </div>
      </div>
      {assigning && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', padding: 20, borderRadius: 12, width: 420 }}>
            <h3 style={{ marginTop: 0 }}>Assign Delivery</h3>
            <div style={{ display: 'grid', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#64748b' }}>Choose Driver (Staff)</label>
                <select value={driverId} onChange={(e) => setDriverId(e.target.value)} style={input}>
                  <option value="">-- Select driver --</option>
                  {drivers.map(d => (
                    <option key={d._id} value={d._id}>{d.name} ({d.email})</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => setAssigning(null)} style={btn('#64748b')}>Cancel</button>
                <button onClick={submitAssign} style={btn('#2563eb')}>Assign</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}