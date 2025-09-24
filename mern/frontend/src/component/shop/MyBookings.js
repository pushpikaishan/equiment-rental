import React, { useEffect, useState } from 'react';
import axios from 'axios';
import UserNavbar from './UserNavbar';
import SiteFooter from '../common/SiteFooter';

export default function MyBookings() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null); // booking object being edited
  const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

  const fmt = (d) => {
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? '-' : dt.toLocaleDateString();
  };
  const fmtdt = (d) => {
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? '-' : dt.toLocaleString();
  };

  const fetchBookings = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setLoading(true);
    try {
      const res = await axios.get(`${baseUrl}/bookings/my`, { headers: { Authorization: `Bearer ${token}` } });
      const data = res.data;
      const bookings = Array.isArray(data?.bookings) ? data.bookings : (Array.isArray(data) ? data : []);
      setList(bookings);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, []);

  // Edit allowed only within 1 hour after creation (matches backend rule)
  const canEdit = (b) => {
    const created = new Date(b.createdAt).getTime();
    if (isNaN(created)) return false;
    const cutoff = created + 60 * 60 * 1000; // 1 hour window
    return Date.now() <= cutoff;
  };

  // Delete allowed within 24h after creation
  const canDelete = (b) => {
    const cutoff = new Date(b.createdAt).getTime() + 24 * 60 * 60 * 1000;
    return Date.now() <= cutoff;
  };
  const isCancelled = (b) => String(b.status).toLowerCase() === 'cancelled';

  const saveEdit = async () => {
    if (!editing) return;
    const token = localStorage.getItem('token');
    try {
      // basic client-side validation
      const bd = new Date(editing.bookingDate);
      if (isNaN(bd.getTime())) {
        alert('Please select a valid booking date');
        return;
      }
      if (editing.returnDate) {
        const rd = new Date(editing.returnDate);
        if (isNaN(rd.getTime()) || rd.getTime() < bd.getTime()) {
          alert('Return date must be on or after the booking date');
          return;
        }
      }

      const payload = {
        bookingDate: editing.bookingDate, // YYYY-MM-DD
        returnDate: editing.returnDate || '',
        customerName: editing.customerName,
        customerEmail: editing.customerEmail,
        customerPhone: editing.customerPhone,
        deliveryAddress: editing.deliveryAddress,
        notes: editing.notes || '',
        // allow editing quantities of items
        items: Array.isArray(editing.items)
          ? editing.items.map(i => ({ equipmentId: i.equipmentId, qty: Number(i.qty) || 0 }))
          : undefined,
      };
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
    if (!window.confirm('Cancel this booking?')) return;
    try {
      await axios.put(`${baseUrl}/bookings/${id}/cancel`, { reason: 'User requested cancellation' }, { headers: { Authorization: `Bearer ${token}` } });
      await fetchBookings();
      alert('Booking cancelled');
    } catch (e) {
      const msg = e.response?.data?.message || e.message;
      alert(`Cancel failed: ${msg}`);
    }
  };

  return (
    <div>
      <UserNavbar />
      <div style={{ maxWidth: 980, margin: '16px auto', padding: '0 12px' }}>
        <h2>My Bookings</h2>

        {loading && <div>Loading...</div>}
        {!loading && list.length === 0 && (
          <div style={{ marginTop: 12 }}>No bookings yet.</div>
        )}

        {!loading && list.length > 0 && (
          <div style={{ display: 'grid', gap: 12 }}>
            {list.map((b) => (
              <div key={b._id} style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden', background: '#ffffff' }}>
                <div style={{ padding: 12, display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>Booking Date: {fmt(b.bookingDate)}</div>
                    <div style={{ color: '#64748b' }}>Order ID: <code>{b._id}</code></div>
                    <div style={{ color: '#64748b' }}>Status: {b.status} • Created: {fmtdt(b.createdAt)}</div>
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
                      {Array.isArray(b.items) && b.items.map((it) => (
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
                    {isCancelled(b) && <span>Edit locked (cancelled)</span>}
                    {!isCancelled(b) && !canEdit(b) && <span>Edit locked (only within 1 hour of creation)</span>}
                    {!canDelete(b) && <span>Delete locked (after 24h from creation)</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => {
                        if (isCancelled(b) || !canEdit(b)) return;
                        setEditing({
                          ...b,
                          bookingDate: b.bookingDate ? new Date(b.bookingDate).toISOString().slice(0, 10) : '',
                          returnDate: b.returnDate ? new Date(b.returnDate).toISOString().slice(0, 10) : '',
                          customerName: b.customerName || '',
                          customerEmail: b.customerEmail || '',
                          customerPhone: b.customerPhone || '',
                          deliveryAddress: b.deliveryAddress || '',
                          notes: b.notes || ''
                        });
                      }}
                      disabled={isCancelled(b) || !canEdit(b)}
                      style={{ background: '#2563eb', color: 'white', border: 'none', padding: '8px 12px', borderRadius: 6, opacity: (isCancelled(b) || !canEdit(b)) ? 0.5 : 1 }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => remove(b._id)}
                      disabled={b.status === 'cancelled'}
                      style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', padding: '8px 12px', borderRadius: 6, opacity: b.status === 'cancelled' ? 0.5 : 1 }}
                    >
                      Cancel Booking
                    </button>
                  </div>
                </div>

                {/* Inline editor for this booking */}
                {editing && editing._id === b._id && !isCancelled(b) && (
                  <div style={{ margin: '0 12px 12px', border: '1px solid #cbd5e1', borderRadius: 8, padding: 12, background: 'white' }}>
                    <h3>Edit Booking</h3>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                      <label htmlFor={`editDate-${b._id}`}>Booking date:</label>
                      <input id={`editDate-${b._id}`} type="date" value={editing.bookingDate} onChange={(e) => setEditing({ ...editing, bookingDate: e.target.value })} />
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                      <label htmlFor={`editReturnDate-${b._id}`}>Return date:</label>
                      <input id={`editReturnDate-${b._id}`} type="date" value={editing.returnDate} onChange={(e) => setEditing({ ...editing, returnDate: e.target.value })} />
                    </div>
                    {Array.isArray(editing.items) && editing.items.length > 0 && (
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ fontWeight: 600, marginBottom: 6 }}>Items</div>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ background: '#f8fafc' }}>
                              <th style={{ textAlign: 'left', padding: 6 }}>Item</th>
                              <th style={{ textAlign: 'left', padding: 6 }}>Price/day</th>
                              <th style={{ textAlign: 'left', padding: 6 }}>Qty</th>
                            </tr>
                          </thead>
                          <tbody>
                            {editing.items.map((it, idx) => (
                              <tr key={it.equipmentId} style={{ borderTop: '1px solid #e2e8f0' }}>
                                <td style={{ padding: 6 }}>{it.name}</td>
                                <td style={{ padding: 6 }}>LKR {Number(it.pricePerDay).toFixed(2)}</td>
                                <td style={{ padding: 6 }}>
                                  <input
                                    type="number"
                                    min={1}
                                    value={it.qty}
                                    onChange={(e) => {
                                      const v = Math.max(1, Number(e.target.value) || 1);
                                      const items = editing.items.slice();
                                      items[idx] = { ...items[idx], qty: v };
                                      setEditing({ ...editing, items });
                                    }}
                                    style={{ width: 80 }}
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: 8 }}>
                      <div>
                        <label>Name</label>
                        <input type="text" value={editing.customerName} onChange={(e) => setEditing({ ...editing, customerName: e.target.value })} style={{ width: '100%' }} />
                      </div>
                      <div>
                        <label>Email</label>
                        <input type="email" value={editing.customerEmail} onChange={(e) => setEditing({ ...editing, customerEmail: e.target.value })} style={{ width: '100%' }} />
                      </div>
                      <div>
                        <label>Phone</label>
                        <input type="text" value={editing.customerPhone} onChange={(e) => setEditing({ ...editing, customerPhone: e.target.value })} style={{ width: '100%' }} />
                      </div>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <label>Delivery Address</label>
                      <input type="text" value={editing.deliveryAddress} onChange={(e) => setEditing({ ...editing, deliveryAddress: e.target.value })} style={{ width: '100%' }} />
                    </div>
                    <div>
                      <label>Notes</label>
                      <textarea value={editing.notes} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} style={{ width: '100%' }} rows={3} />
                    </div>
                    <div>
                      <p style={{ color: '#64748b' }}>To change items/quantities, re-create the booking from cart or use the quantity inputs above.</p>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button onClick={saveEdit} style={{ background: '#16a34a', color: 'white', border: 'none', padding: '8px 12px', borderRadius: 6 }}>Save</button>
                      <button onClick={() => setEditing(null)} style={{ background: 'white', border: '1px solid #cbd5e1', padding: '8px 12px', borderRadius: 6 }}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
