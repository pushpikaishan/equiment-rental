import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import SupplierTopbar from './SupplierTopbar';

// Simple top bar with Profile and Logout buttons, no global navbar
export default function SupplierDashboard() {
  const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
  const token = localStorage.getItem('token') || '';
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const [me, setMe] = useState(null);
  const [orders, setOrders] = useState([]);
  const [items, setItems] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [error, setError] = useState('');

  // Inventory form state
  const emptyForm = { name: '', description: '', category: '', district: '', location: '', rentalPrice: '', quantity: '', available: true, specs: '' };
  const [form, setForm] = useState(emptyForm);
  const [image, setImage] = useState(null);
  const [editing, setEditing] = useState(null); // editing item object

  const loadProfile = async () => {
    try {
      const res = await axios.get(`${baseUrl}/auth/profile`, { headers });
      setMe(res.data || null);
    } catch (_) {}
  };
  const loadOrders = async () => {
    setLoadingOrders(true);
    try {
      // Using user bookings as stand-in for supplier orders until a supplier-specific orders endpoint exists
      const res = await axios.get(`${baseUrl}/bookings/my`, { headers });
      setOrders(Array.isArray(res.data?.bookings) ? res.data.bookings : []);
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    } finally { setLoadingOrders(false); }
  };
  const loadItems = async () => {
    setLoadingItems(true);
    try {
      const res = await axios.get(`${baseUrl}/supplier-inventories/mine`, { headers });
      setItems(Array.isArray(res.data) ? res.data : (res.data?.items || res.data || []));
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    } finally { setLoadingItems(false); }
  };

  useEffect(() => { loadProfile(); loadOrders(); loadItems(); // eslint-disable-next-line
  }, []);

  const onLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    window.location.href = '/userlog';
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const fd = new FormData();
      const fields = ['name','description','category','district','location','rentalPrice','quantity','available','specs'];
      for (const k of fields) {
        const v = form[k];
        if (typeof v !== 'undefined' && v !== null && v !== '') fd.append(k, v);
      }
      if (image) fd.append('image', image);
      // client-side validations for price/qty
      const price = Number(form.rentalPrice);
      const qty = Number(form.quantity);
      if (!(price > 0) || !(qty > 0)) {
        setError('Rental price and quantity must be greater than zero');
        return;
      }
      if (editing) {
        await axios.put(`${baseUrl}/supplier-inventories/${editing._id}`, fd, { headers: { ...headers, 'Content-Type': 'multipart/form-data' } });
      } else {
        await axios.post(`${baseUrl}/supplier-inventories`, fd, { headers: { ...headers, 'Content-Type': 'multipart/form-data' } });
      }
      setForm(emptyForm); setImage(null); setEditing(null);
      await loadItems();
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    }
  };

  const startEdit = (it) => {
    setEditing(it);
    setForm({
      name: it.name || '',
      description: it.description || '',
      category: it.category || '',
      district: it.district || '',
      location: it.location || '',
      rentalPrice: it.rentalPrice ?? '',
      quantity: it.quantity ?? '',
      available: it.available !== false,
      specs: it.specs || ''
    });
    setImage(null);
  };

  const removeItem = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      await axios.delete(`${baseUrl}/supplier-inventories/${id}`, { headers });
      await loadItems();
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    }
  };

  // Basic styles
  const shell = { minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column' };
  // topbar moved to shared SupplierTopbar
  const card = { background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16 };
  const grid = { display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' };

  return (
    <div style={shell}>
      <SupplierTopbar title="Supplier Dashboard" />

      <div style={{ padding: 16, display: 'grid', gap: 16 }}>
        {error && <div style={{ ...card, borderColor: '#fecaca', background: '#fef2f2', color: '#991b1b' }}>{error}</div>}

        {/* Orders */}
        <div style={card}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Recent Orders</div>
          {loadingOrders ? 'Loading…' : (
            orders.length === 0 ? <div>No orders found.</div> : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #e2e8f0' }}>Created</th>
                      <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #e2e8f0' }}>Customer</th>
                      <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #e2e8f0' }}>Status</th>
                      <th style={{ textAlign: 'right', padding: 8, borderBottom: '1px solid #e2e8f0' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 10).map((b) => (
                      <tr key={b._id}>
                        <td style={{ padding: 8, borderBottom: '1px solid #f1f5f9' }}>{new Date(b.createdAt).toLocaleString()}</td>
                        <td style={{ padding: 8, borderBottom: '1px solid #f1f5f9' }}>{b.customerName}</td>
                        <td style={{ padding: 8, borderBottom: '1px solid #f1f5f9' }}>{b.status}{b.disputed ? ' (disputed)' : ''}</td>
                        <td style={{ padding: 8, borderBottom: '1px solid #f1f5f9', textAlign: 'right' }}>{Number(b.total || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>

        {/* Inventory form and list */}
        <div style={grid}>
          <form onSubmit={onSubmit} style={card}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>{editing ? 'Edit Inventory Item' : 'Add Inventory Item'}</div>
            <div style={{ display: 'grid', gap: 8 }}>
              <input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 8 }} required />
              <textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 8 }} rows={3} />
              <input placeholder="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 8 }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <input placeholder="District" value={form.district} onChange={e => setForm({ ...form, district: e.target.value })} style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 8 }} />
                <input placeholder="Location" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 8 }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <input type="number" min="0.01" step="0.01" placeholder="Rental Price (per day)" value={form.rentalPrice} onChange={e => setForm({ ...form, rentalPrice: e.target.value })} style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 8 }} required />
                <input type="number" min="1" step="1" placeholder="Quantity" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 8 }} required />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input id="avail" type="checkbox" checked={!!form.available} onChange={e => setForm({ ...form, available: e.target.checked })} />
                <label htmlFor="avail">Available</label>
              </div>
              <input type="file" accept="image/*" onChange={e => setImage(e.target.files?.[0] || null)} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button type="submit" style={{ padding: '8px 12px', borderRadius: 8, background: '#2563eb', color: 'white', border: '1px solid #1d4ed8' }}>{editing ? 'Update' : 'Add'}</button>
              {editing && <button type="button" onClick={() => { setEditing(null); setForm(emptyForm); setImage(null); }} style={{ padding: '8px 12px', borderRadius: 8, background: 'white', border: '1px solid #cbd5e1' }}>Cancel</button>}
            </div>
          </form>

          <div style={card}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Your Inventory</div>
            {loadingItems ? 'Loading…' : (
              items.length === 0 ? <div>No items yet.</div> : (
                <div style={{ display: 'grid', gap: 12 }}>
                  {items.map(it => (
                    <div key={it._id} style={{ display: 'grid', gap: 8, gridTemplateColumns: '80px 1fr auto', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: 8 }}>
                      <div>
                        {it.image ? (
                          <img src={`${baseUrl}${it.image}`} alt={it.name} style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8 }} />
                        ) : (
                          <div style={{ width: 72, height: 72, background: '#e2e8f0', borderRadius: 8 }} />
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{it.name}</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>{it.category} • {it.district} • Qty {it.quantity} • LKR {Number(it.rentalPrice || 0).toFixed(2)}/day</div>
                        <div style={{ fontSize: 12, color: it.available !== false ? '#16a34a' : '#b91c1c' }}>{it.available !== false ? 'Available' : 'Unavailable'}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => startEdit(it)} style={{ padding: '6px 10px', borderRadius: 8, background: 'white', border: '1px solid #cbd5e1' }}>Edit</button>
                        <button onClick={() => removeItem(it._id)} style={{ padding: '6px 10px', borderRadius: 8, background: '#ef4444', color: 'white', border: '1px solid #dc2626' }}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
