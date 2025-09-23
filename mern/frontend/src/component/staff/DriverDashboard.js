import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

export default function DriverDashboard() {
  const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');
  const role = localStorage.getItem('role');
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const [profile, setProfile] = useState(null);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchProfile = async () => {
    try {
      if (!userId) return;
      const res = await axios.get(`${baseUrl}/users/${userId}`, { headers });
      setProfile(res.data);
    } catch (e) {
      // ignore
    }
  };

  const fetchDeliveries = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${baseUrl}/deliveries/driver/my`, { headers });
      const list = res.data?.deliveries || [];
      // enrich with booking fields if populated
      const normalized = list.map(d => {
        const b = d.bookingId || {};
        return {
          _id: d._id,
          bookingId: b?._id || d.bookingId,
          driverId: d.driverId,
          status: d.status,
          createdAt: d.createdAt,
          updatedAt: d.updatedAt,
          customerName: b.customerName,
          deliveryAddress: b.deliveryAddress,
          bookingDate: b.bookingDate,
          total: b.total,
        };
      });
      setDeliveries(normalized);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); fetchDeliveries(); /* eslint-disable-next-line */ }, []);

  const updateStatus = async (bookingId, status) => {
    try {
      await axios.put(`${baseUrl}/deliveries/driver/${bookingId}/status`, { status }, { headers });
      await fetchDeliveries();
      alert('Status updated');
    } catch (e) {
      alert(e.response?.data?.message || e.message);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    window.location.href = '/';
  };

  const Card = ({ children, style }) => (
    <div style={{ background: 'white', padding: 16, borderRadius: 12, boxShadow: '0 4px 10px rgba(0,0,0,0.05)', ...style }}>{children}</div>
  );

  return (
    <div style={{ maxWidth: 1000, margin: '16px auto', padding: '0 12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Driver Dashboard</h2>
        <button onClick={logout} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '8px 12px', borderRadius: 8 }}>Log out</button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>Profile</h3>
        {profile ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px,1fr))', gap: 12 }}>
            <div><strong>Name:</strong> {profile.name}</div>
            <div><strong>Email:</strong> {profile.email}</div>
            <div><strong>Phone:</strong> {profile.phoneno || '-'}</div>
            <div><strong>Role:</strong> {profile.role}</div>
          </div>
        ) : (
          <div>Loading profile…</div>
        )}
      </Card>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ marginTop: 0 }}>Assigned Deliveries</h3>
          {role !== 'staff' && <span style={{ color: '#dc2626', fontSize: 12 }}>Not a staff account</span>}
        </div>
        {loading ? (
          <div>Loading…</div>
        ) : deliveries.length === 0 ? (
          <div>No deliveries assigned.</div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {deliveries.map(d => (
              <div key={d._id} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>Order: <code>{d.bookingId}</code></div>
                    <div style={{ color: '#64748b' }}>Customer: {d.customerName || '-'}</div>
                    <div style={{ color: '#64748b' }}>Address: {d.deliveryAddress || '-'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div>Status: <span style={{ textTransform: 'capitalize' }}>{d.status}</span></div>
                    <div>Booking Date: {d.bookingDate ? new Date(d.bookingDate).toLocaleDateString() : '-'}</div>
                    <div>Total: LKR {Number(d.total || 0).toFixed(2)}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                  <button onClick={() => updateStatus(d.bookingId, 'in-progress')} disabled={d.status !== 'assigned'} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '8px 12px', borderRadius: 8 }}>Start</button>
                  <button onClick={() => updateStatus(d.bookingId, 'delivered')} disabled={!(d.status === 'assigned' || d.status === 'in-progress')} style={{ background: '#16a34a', color: 'white', border: 'none', padding: '8px 12px', borderRadius: 8 }}>Completed</button>
                  <button onClick={() => updateStatus(d.bookingId, 'failed')} disabled={d.status === 'delivered'} style={{ background: '#f59e0b', color: 'white', border: 'none', padding: '8px 12px', borderRadius: 8 }}>Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
