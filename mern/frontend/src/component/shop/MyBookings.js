import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import UserNavbar from './UserNavbar';
import SiteFooter from '../common/SiteFooter';

export default function MyBookings() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null); // booking object being edited
  const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

  const fetchBookings = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setLoading(true);
    try {
      const res = await axios.get(`${baseUrl}/bookings/my`, { headers: { Authorization: `Bearer ${token}` } });
      setList(res.data.bookings || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, []);

  // Edit allowed until 24h before the booking date
  const canEdit = (b) => {
    const cutoff = new Date(b.bookingDate).getTime() - 24 * 60 * 60 * 1000;
    return Date.now() <= cutoff;
  };

  // Delete allowed within 24h after creation
  const canDelete = (b) => {
    const cutoff = new Date(b.createdAt).getTime() + 24 * 60 * 60 * 1000;
    return Date.now() <= cutoff;
  };

  const saveEdit = async () => {
    if (!editing) return;
    const token = localStorage.getItem('token');
    try {
      const payload = { bookingDate: editing.bookingDate, items: editing.items.map(i => ({ equipmentId: i.equipmentId, qty: i.qty })) };
      await axios.put(`${baseUrl}/bookings/${editing._id}`, payload, { headers: { Authorization: `Bearer ${token}` } });
      setEditing(null);
      await fetchBookings();
      alert('Booking updated');
    } catch (e) {
      const msg = e.response?.data?.message || e.message;
      alert(`Update failed: ${msg}`);
    }
  };

  const remove = async (id) => {
    const token = localStorage.getItem('token');
    if (!window.confirm('Delete this booking?')) return;
    try {
      await axios.delete(`${baseUrl}/bookings/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      await fetchBookings();
      alert('Booking deleted');
    } catch (e) {
      const msg = e.response?.data?.message || e.message;
      alert(`Delete failed: ${msg}`);
    }
  };

  const fmt = (d) => new Date(d).toLocaleDateString();

  return (
    <div>
      <UserNavbar />
      <div style={{ padding: 20, maxWidth: 900, margin: '0 auto' }}>
        <h2>My Bookings</h2>
        {loading ? (
          <div>Loading...</div>
        ) : list.length === 0 ? (
          <div>No bookings yet.</div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {list.map((b) => (
              <div key={b._id} style={{ border: '1px solid #e2e8f0', borderRadius: 8, background: 'white' }}>
                <div style={{ padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>Booking Date: {fmt(b.bookingDate)}</div>
                    <div style={{ color: '#64748b' }}>Status: {b.status} • Created: {fmt(b.createdAt)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div>Subtotal: LKR {Number(b.subtotal).toFixed(2)}</div>
                    <div>Deposit: LKR {Number(b.securityDeposit).toFixed(2)}</div>
                    <div style={{ fontWeight: 700 }}>Total: LKR {Number(b.total).toFixed(2)}</div>
                  </div>
                </div>
                <div style={{ padding: 12 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        <th style={{ textAlign: 'left', padding: 6 }}>Item</th>
                        <th style={{ textAlign: 'left', padding: 6 }}>Price/day</th>
                        <th style={{ textAlign: 'left', padding: 6 }}>Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {b.items.map((it) => (
                        <tr key={it.equipmentId} style={{ borderTop: '1px solid #e2e8f0' }}>
                          <td style={{ padding: 6 }}>{it.name}</td>
                          <td style={{ padding: 6 }}>LKR {Number(it.pricePerDay).toFixed(2)}</td>
                          <td style={{ padding: 6 }}>{it.qty}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ padding: 12, display: 'flex', gap: 8, justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: 12, color: '#64748b', fontSize: 12 }}>
                    {!canEdit(b) && <span>Edit locked (within 24h of booking date)</span>}
                    {!canDelete(b) && <span>Delete locked (after 24h from creation)</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => setEditing({ ...b, bookingDate: new Date(b.bookingDate).toISOString().slice(0, 10) })}
                      disabled={!canEdit(b)}
                      style={{ background: '#2563eb', color: 'white', border: 'none', padding: '8px 12px', borderRadius: 6, opacity: canEdit(b) ? 1 : 0.5 }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => remove(b._id)}
                      disabled={!canDelete(b)}
                      style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', padding: '8px 12px', borderRadius: 6, opacity: canDelete(b) ? 1 : 0.5 }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {editing && (
          <div style={{ marginTop: 16, border: '1px solid #cbd5e1', borderRadius: 8, padding: 12, background: 'white' }}>
            <h3>Edit Booking</h3>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
              <label htmlFor="editDate">Booking date:</label>
              <input id="editDate" type="date" value={editing.bookingDate} onChange={(e) => setEditing({ ...editing, bookingDate: e.target.value })} />
            </div>
            <div>
              <p style={{ color: '#64748b' }}>To change items/quantities, re-create the booking from cart or we can enhance this editor later.</p>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button onClick={saveEdit} style={{ background: '#16a34a', color: 'white', border: 'none', padding: '8px 12px', borderRadius: 6 }}>Save</button>
              <button onClick={() => setEditing(null)} style={{ background: 'white', border: '1px solid #cbd5e1', padding: '8px 12px', borderRadius: 6 }}>Cancel</button>
            </div>
          </div>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
