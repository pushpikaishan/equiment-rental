import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import SupplierTopbar from './SupplierTopbar';

// Simple top bar with Profile and Logout buttons, no global navbar
export default function SupplierDashboard() {
  const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
  const token = localStorage.getItem('token') || '';
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);
  const [activeTab, setActiveTab] = useState('equipment'); // equipment | notices | requests
  const navigate = useNavigate();

  const [me, setMe] = useState(null);
  const [items, setItems] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [error, setError] = useState('');
  // Progress dropdown removed per request
  const [notices, setNotices] = useState([]);
  const [loadingNotices, setLoadingNotices] = useState(false);

  // Derived: running ads and monthly stats
  const runningAdsCount = useMemo(() => {
    const now = Date.now();
    return (items || []).filter(it => it.adActive && it.adExpiresAt && new Date(it.adExpiresAt).getTime() > now).length;
  }, [items]);

  const monthlyAdStats = useMemo(() => {
    // Computes per-ad sold qty and earnings for requests created this month (excluding rejected/cancelled)
    const start = new Date(); start.setDate(1); start.setHours(0,0,0,0);
    const end = new Date(start); end.setMonth(end.getMonth() + 1);
    const msDay = 24 * 60 * 60 * 1000;
    const map = new Map();
    const byId = new Map((items || []).map(it => [String(it._id), it]));
    for (const r of (requests || [])) {
      const created = new Date(r.createdAt || r.updatedAt || Date.now());
      if (!(created >= start && created < end)) continue;
      if (['rejected','cancelled'].includes(r.status)) continue;
      const bd = new Date(r.bookingDate || created);
      const rd = r.returnDate ? new Date(r.returnDate) : null;
      let days = 1;
      if (rd && !isNaN(rd.getTime()) && !isNaN(bd.getTime())) {
        const diff = Math.ceil((rd.getTime() - bd.getTime()) / msDay);
        days = Math.max(1, diff);
      }
      for (const it of (r.items || [])) {
        const key = String(it.inventoryId || it.equipmentId || it.name);
        const prev = map.get(key) || { inventoryId: key, name: it.name, qty: 0, revenue: 0, image: (byId.get(String(it.inventoryId)) || {}).image || '' };
        const qty = Number(it.qty) || 0;
        const price = Number(it.pricePerDay) || 0;
        prev.qty += qty;
        prev.revenue += qty * price * days;
        if (!prev.name && byId.get(String(it.inventoryId))) prev.name = byId.get(String(it.inventoryId)).name;
        map.set(key, prev);
      }
    }
    const arr = Array.from(map.values());
    arr.sort((a,b) => b.revenue - a.revenue);
    const totalRevenue = arr.reduce((s,x) => s + x.revenue, 0);
    const totalQty = arr.reduce((s,x) => s + x.qty, 0);
    return { list: arr, totalRevenue, totalQty };
  }, [requests, items]);

  // Inventory form state
  const emptyForm = { name: '', description: '', category: '', district: '', rentalPrice: '', quantity: '', available: true, specs: '' };
  const [form, setForm] = useState(emptyForm);
  const [image, setImage] = useState(null);
  const [editing, setEditing] = useState(null); // editing item object

  const loadProfile = async () => {
    try {
      const res = await axios.get(`${baseUrl}/auth/profile`, { headers });
      setMe(res.data || null);
      if (res.data && res.data.role === 'supplier' && res.data.district) {
        setForm(prev => ({ ...prev, district: res.data.district }));
      }
    } catch (e) {
      // Non-fatal: supplier dashboard can operate with limited context
      // Use debug to avoid surfacing a user-facing error here
      // eslint-disable-next-line no-console
      console.debug('SupplierDashboard: failed to load profile', e);
    }
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
  const loadRequests = async () => {
    setLoadingRequests(true);
    try {
      const res = await axios.get(`${baseUrl}/supplier-requests/mine`, { headers });
      setRequests(Array.isArray(res.data?.items) ? res.data.items : []);
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    } finally { setLoadingRequests(false); }
  };
  const loadNotices = async () => {
    setLoadingNotices(true);
    try {
      const [delRes, updRes] = await Promise.all([
        axios.get(`${baseUrl}/supplier-inventories/deletions/mine`, { headers, params: { limit: 10 } }),
        axios.get(`${baseUrl}/supplier-inventories/updates/mine`, { headers, params: { limit: 10 } }),
      ]);
      const delItems = Array.isArray(delRes.data?.items) ? delRes.data.items.map(x => ({ ...x, kind: 'deleted' })) : [];
      const updItems = Array.isArray(updRes.data?.items) ? updRes.data.items.map(x => ({ ...x, kind: 'updated' })) : [];
      const all = [...delItems, ...updItems].sort((a,b) => new Date(b.at) - new Date(a.at));
      setNotices(all);
    } catch (e) {
      // Surface a lightweight warning in the notices card
      setNotices([{ id: 'err', at: new Date(), name: '—', reason: e.response?.data?.message || e.message }]);
    } finally {
      setLoadingNotices(false);
    }
  };

  useEffect(() => { loadProfile(); loadItems(); loadRequests(); loadNotices(); // eslint-disable-next-line
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
      const fields = ['name','description','category','district','rentalPrice','quantity','available','specs'];
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
      <SupplierTopbar
        title="Supplier Dashboard"
        navItems={[
          { key: 'summary', label: 'Summary' },
          { key: 'equipment', label: 'Equipments' },
          { key: 'notices', label: 'Admin notices' },
          { key: 'requests', label: 'Booking requests' },
          { key: 'profile', label: 'Profile' },
        ]}
        activeKey={activeTab}
        onNavChange={(key) => {
          if (key === 'profile') {
            // Redirect to the unified profile page
            navigate('/userAccount/profile');
            return;
          }
          setActiveTab(key);
        }}
      />

      <div style={{ padding: 16, display: 'grid', gap: 16 }}>
        {error && <div style={{ ...card, borderColor: '#fecaca', background: '#fef2f2', color: '#991b1b' }}>{error}</div>}

        {/* Summary Tab: Running ads and monthly stats */}
        {activeTab === 'summary' && (
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontWeight: 700 }}>This Month Summary</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 8 }}>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 12, background: '#f8fafc' }}>
              <div style={{ fontSize: 12, color: '#64748b' }}>Total running ads</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>{runningAdsCount}</div>
            </div>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 12, background: '#f8fafc' }}>
              <div style={{ fontSize: 12, color: '#64748b' }}>This month earnings</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>LKR {Number(monthlyAdStats.totalRevenue || 0).toFixed(2)}</div>
            </div>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 12, background: '#f8fafc' }}>
              <div style={{ fontSize: 12, color: '#64748b' }}>Items sold (qty)</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>{monthlyAdStats.totalQty || 0}</div>
            </div>
          </div>
          <div style={{ marginTop: 8 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Per Ad — This Month</div>
            {monthlyAdStats.list.length === 0 ? (
              <div style={{ color: '#64748b' }}>No sales recorded this month.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #e2e8f0' }}>Ad</th>
                      <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #e2e8f0' }}>Qty sold</th>
                      <th style={{ textAlign: 'right', padding: 8, borderBottom: '1px solid #e2e8f0' }}>Earnings (LKR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyAdStats.list.map((row) => (
                      <tr key={row.inventoryId}>
                        <td style={{ padding: 8, borderBottom: '1px solid #f1f5f9' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {row.image ? (
                              <img src={`${baseUrl}${row.image}`} alt={row.name} style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: 36, height: 36, borderRadius: 6, background: '#e2e8f0' }} />
                            )}
                            <div>
                              <div style={{ fontWeight: 600 }}>{row.name}</div>
                              <div style={{ fontSize: 12, color: '#64748b' }}><code>{row.inventoryId}</code></div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: 8, borderBottom: '1px solid #f1f5f9' }}>{row.qty}</td>
                        <td style={{ padding: 8, borderBottom: '1px solid #f1f5f9', textAlign: 'right' }}>{Number(row.revenue).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        )}

        {/* Admin Notices */}
        {activeTab === 'notices' && (
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Admin Notices</div>
            <button onClick={loadNotices} style={{ padding: '6px 10px', borderRadius: 8, background: 'white', border: '1px solid #cbd5e1' }}>Refresh</button>
          </div>
          {loadingNotices ? (
            <div>Loading…</div>
          ) : (notices.length === 0 ? (
            <div style={{ color: '#64748b' }}>No recent admin notices.</div>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {notices.map(n => (
                <div key={n.id} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 10, background: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>
                      {n.name || 'An ad'}
                      <span style={{ marginLeft: 8, fontSize: 11, padding: '2px 6px', borderRadius: 9999, background: n.kind === 'deleted' ? '#fee2e2' : '#e0e7ff', color: '#0f172a' }}>
                        {n.kind === 'deleted' ? 'Deleted' : 'Updated'}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{new Date(n.at).toLocaleString()}</div>
                  </div>
                  <div style={{ marginTop: 4 }}>
                    <span style={{ fontSize: 12, color: '#334155' }}>Reason:</span> {n.reason || 'No reason provided'}
                  </div>
                  {n.inventoryId && (
                    <div style={{ marginTop: 4, fontSize: 12, color: '#64748b' }}>Inventory ID: <code>{n.inventoryId}</code></div>
                  )}
                  {n.kind === 'updated' && n.updates && Object.keys(n.updates).length > 0 && (
                    <div style={{ marginTop: 6, fontSize: 12, color: '#475569' }}>
                      Changed: {Object.keys(n.updates).join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
        )}

        {/* Orders section removed per request */}

        {/* Booking Requests */}
        {activeTab === 'requests' && (
        <div style={card}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Incoming Booking Requests</div>
          {loadingRequests ? 'Loading…' : (
            requests.length === 0 ? <div>No incoming requests.</div> : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #e2e8f0' }}>Requested</th>
                      <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #e2e8f0' }}>Customer</th>
                      <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #e2e8f0' }}>Address</th>
                      <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #e2e8f0' }}>Items</th>
                      <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #e2e8f0' }}>Status</th>
                      <th style={{ textAlign: 'right', padding: 8, borderBottom: '1px solid #e2e8f0' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map(r => (
                      <tr key={r._id}>
                        <td style={{ padding: 8, borderBottom: '1px solid #f1f5f9' }}>{new Date(r.createdAt).toLocaleString()}</td>
                        <td style={{ padding: 8, borderBottom: '1px solid #f1f5f9' }}>
                          <div style={{ fontWeight: 600 }}>{r.customerName}</div>
                          <div style={{ fontSize: 12, color: '#64748b' }}>{r.customerEmail} • {r.customerPhone}</div>
                        </td>
                        <td style={{ padding: 8, borderBottom: '1px solid #f1f5f9' }}>
                          <div style={{ fontSize: 12, color: '#0f172a' }}>{r.deliveryAddress || '—'}</div>
                        </td>
                        <td style={{ padding: 8, borderBottom: '1px solid #f1f5f9' }}>
                          {(r.items||[]).map((it, idx) => (
                            <div key={idx} style={{ fontSize: 12 }}>
                              {it.name} × {it.qty} @ LKR {Number(it.pricePerDay||0).toFixed(2)} /d
                            </div>
                          ))}
                        </td>
                        <td style={{ padding: 8, borderBottom: '1px solid #f1f5f9' }}>{r.status}</td>
                        <td style={{ padding: 8, borderBottom: '1px solid #f1f5f9', textAlign: 'right' }}>
                          <button disabled={r.status !== 'pending'} onClick={async () => { try { await axios.put(`${baseUrl}/supplier-requests/${r._id}/status`, { status: 'accepted' }, { headers }); await loadRequests(); } catch (e) { setError(e.response?.data?.message || e.message); } }} style={{ padding: '6px 10px', borderRadius: 8, background: '#16a34a', color: 'white', border: '1px solid #15803d', marginRight: 6 }}>Accept</button>
                          <button disabled={r.status !== 'pending'} onClick={async () => { try { await axios.put(`${baseUrl}/supplier-requests/${r._id}/status`, { status: 'rejected' }, { headers }); await loadRequests(); } catch (e) { setError(e.response?.data?.message || e.message); } }} style={{ padding: '6px 10px', borderRadius: 8, background: '#ef4444', color: 'white', border: '1px solid #dc2626', marginRight: 8 }}>Reject</button>
                          {/* Shipped action: only when accepted and current progress is 'ready' */}
                          <button
                            onClick={async () => {
                              try {
                                await axios.put(`${baseUrl}/supplier-requests/${r._id}/progress`, { status: 'shipped' }, { headers });
                                await loadRequests();
                                alert('Marked as shipped. Customer will be notified.');
                              } catch (e) {
                                setError(e.response?.data?.message || e.message);
                              }
                            }}
                            style={{ padding: '6px 10px', borderRadius: 8, background: '#2563eb', color: 'white', border: '1px solid #1d4ed8' }}
                          >
                            Shipped
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
        )}

        {/* Profile */}
        {activeTab === 'profile' && (
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>My Profile</div>
            {me?._id && (
              <button onClick={() => window.location.href = `/update-supplier/${me._id}`}
                style={{ padding: '6px 10px', borderRadius: 8, background: '#2563eb', color: 'white', border: '1px solid #1d4ed8' }}>
                Edit Profile
              </button>
            )}
          </div>
          {!me ? (
            <div style={{ color: '#64748b' }}>Loading profile…</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 12, background: '#f8fafc' }}>
                <div style={{ fontSize: 12, color: '#64748b' }}>Name</div>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>{me.name || me.fullName || '—'}</div>
              </div>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 12, background: '#f8fafc' }}>
                <div style={{ fontSize: 12, color: '#64748b' }}>Email</div>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>{me.email || '—'}</div>
              </div>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 12, background: '#f8fafc' }}>
                <div style={{ fontSize: 12, color: '#64748b' }}>District</div>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>{me.district || '—'}</div>
              </div>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 12, background: '#f8fafc' }}>
                <div style={{ fontSize: 12, color: '#64748b' }}>Phone</div>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>{me.phone || me.mobile || '—'}</div>
              </div>
            </div>
          )}
        </div>
        )}

  {/* Equipments: Inventory form and list */}
  {activeTab === 'equipment' && (
  <div style={grid}>
          <form onSubmit={onSubmit} style={card}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>{editing ? 'Edit Inventory Item' : 'Add Inventory Item'}</div>
            <div style={{ display: 'grid', gap: 8 }}>
              <input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 8 }} required />
              <textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 8 }} rows={3} />
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 8 }}>
                <option value="">Select Category</option>
                {['Lighting','Audio','Camera','Tents & Shelters','Visual & AV Equipment','Stage & Platform Equipment','Furniture','Catering & Dining Equipment','Power & Electrical','Climate Control'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
                <input
                  placeholder="District"
                  value={form.district}
                  onChange={() => { /* disabled - district is managed by profile */ }}
                  disabled
                  style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 8, background: '#f8fafc', color: '#64748b' }}
                />
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
                        <AdStatusRow baseUrl={baseUrl} headers={headers} item={it} />
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
        )}
      </div>
    </div>
  );
}

function AdStatusRow({ baseUrl, headers, item }) {
  const [info, setInfo] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState('');
  const [showPay, setShowPay] = React.useState(false);
  const [processing, setProcessing] = React.useState(false);
  // simple card form state
  const [cardName, setCardName] = React.useState('');
  const [cardNumber, setCardNumber] = React.useState('');
  const [expMonth, setExpMonth] = React.useState('');
  const [expYear, setExpYear] = React.useState('');
  const [cvv, setCvv] = React.useState('');
  const [accepted, setAccepted] = React.useState(false);

  React.useEffect(() => {
    let cancel = false;
    const run = async () => {
      setLoading(true);
      setErr('');
      try {
        const res = await axios.get(`${baseUrl}/supplier-inventories/${item._id}/renew`, { headers });
        if (!cancel) setInfo(res.data);
      } catch (e) {
        if (!cancel) setErr(e.response?.data?.message || e.message);
      } finally {
        if (!cancel) setLoading(false);
      }
    };
    run();
    return () => { cancel = true; };
  }, [baseUrl, headers, item._id]);

  const luhnCheck = (num) => {
    const digits = (num || '').replace(/\D/g, '');
    if (digits.length < 12) return false;
    let sum = 0; let dbl = false;
    for (let i = digits.length - 1; i >= 0; i--) {
      let d = parseInt(digits[i], 10);
      if (dbl) { d *= 2; if (d > 9) d -= 9; }
      sum += d; dbl = !dbl;
    }
    return sum % 10 === 0;
  };
  const validExpiry = (m, y) => {
    const month = Number(m), year = Number(y);
    if (!month || !year || month < 1 || month > 12) return false;
    const now = new Date(); const cy = now.getFullYear(); const cm = now.getMonth() + 1;
    if (year < cy) return false; if (year === cy && month < cm) return false; return true;
  };

  const onCardNumberChange = (val) => {
    const digits = (val || '').replace(/\D/g, '').slice(0, 19);
    const formatted = digits.replace(/(.{4})/g, '$1 ').trim();
    setCardNumber(formatted);
  };

  const refreshInfo = async () => {
    try {
      const res = await axios.get(`${baseUrl}/supplier-inventories/${item._id}/renew`, { headers });
      setInfo(res.data);
    } catch (e) {
      // keep old info, but surface error
      setErr(e.response?.data?.message || e.message);
    }
  };

  const onPay = async () => {
    if (!info) return;
    const { adFeeAmount } = info;
    if (!(cardName.trim().length > 1 && luhnCheck(cardNumber) && validExpiry(expMonth, expYear) && /(\d{3,4})/.test(cvv) && accepted)) {
      alert('Please fill valid card details and accept terms.');
      return;
    }
    setProcessing(true);
    setErr('');
    try {
      await axios.post(`${baseUrl}/payments/supplier-ad`, { inventoryId: item._id, amount: adFeeAmount, method: 'card' }, { headers });
      setShowPay(false);
      // reset form
      setCardName(''); setCardNumber(''); setExpMonth(''); setExpYear(''); setCvv(''); setAccepted(false);
      await refreshInfo();
      alert('Payment successful. Your ad has been activated/extended.');
    } catch (e) {
      const msg = e.response?.data?.message || e.message;
      setErr(msg);
      alert(`Payment failed: ${msg}`);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div style={{ fontSize: 12, color: '#64748b' }}>Checking ad status…</div>;
  if (err) return <div style={{ fontSize: 12, color: '#b91c1c' }}>{err}</div>;
  if (!info) return null;

  const { adActive, remainingDays, requiresAdFee, adFeeAmount, currency } = info;
  const expired = Number(remainingDays || 0) <= 0;

  return (
    <div style={{ marginTop: 6 }}>
      {/* Status pill */}
      <div style={{ marginBottom: 6 }}>
        {!adActive ? (
          <span style={{ padding: '2px 8px', borderRadius: 9999, background: '#fee2e2', color: '#991b1b', fontSize: 12, fontWeight: 600 }}>Inactive</span>
        ) : (
          <span style={{ padding: '2px 8px', borderRadius: 9999, background: expired ? '#fee2e2' : '#dcfce7', color: '#0f172a', fontSize: 12, fontWeight: 600 }}>
            {expired ? 'Expired' : `Active • ${remainingDays} day${remainingDays === 1 ? '' : 's'} left`}
          </span>
        )}
      </div>

      {/* Action: pay to activate/renew */}
      {requiresAdFee && (
        <div style={{ marginTop: 6 }}>
          <button onClick={() => setShowPay(v => !v)} style={{ padding: '6px 10px', borderRadius: 8, background: '#22c55e', color: 'white', border: '1px solid #16a34a', fontWeight: 700 }}>
            {adActive && expired ? 'Renew Ad' : 'Activate Ad'} · {currency || 'LKR'} {Number(adFeeAmount || 1000).toFixed(2)}
          </button>
        </div>
      )}

      {/* Inline payment form */}
      {requiresAdFee && showPay && (
        <div style={{ marginTop: 8, border: '1px solid #e2e8f0', borderRadius: 8, background: 'white', padding: 12 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Pay {currency || 'LKR'} {Number(adFeeAmount || 1000).toFixed(2)} to {adActive && expired ? 'renew' : 'activate'} this ad</div>
          <div style={{ display: 'grid', gap: 8 }}>
            <div>
              <label htmlFor={`cn-${item._id}`} style={{ display: 'block', fontSize: 12, color: '#64748b' }}>Cardholder Name</label>
              <input id={`cn-${item._id}`} value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="Name on card" style={{ width: '100%', padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }} />
            </div>
            <div>
              <label htmlFor={`cc-${item._id}`} style={{ display: 'block', fontSize: 12, color: '#64748b' }}>Card Number</label>
              <input id={`cc-${item._id}`} value={cardNumber} onChange={(e) => onCardNumberChange(e.target.value)} placeholder="4242 4242 4242 4242" inputMode="numeric" style={{ width: '100%', padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <div>
                <label htmlFor={`mm-${item._id}`} style={{ display: 'block', fontSize: 12, color: '#64748b' }}>MM</label>
                <select id={`mm-${item._id}`} value={expMonth} onChange={(e) => setExpMonth(e.target.value)} style={{ width: '100%', padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }}>
                  <option value="">mm</option>
                  {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(m => (<option key={m} value={m}>{m}</option>))}
                </select>
              </div>
              <div>
                <label htmlFor={`yy-${item._id}`} style={{ display: 'block', fontSize: 12, color: '#64748b' }}>YYYY</label>
                <select id={`yy-${item._id}`} value={expYear} onChange={(e) => setExpYear(e.target.value)} style={{ width: '100%', padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }}>
                  <option value="">yyyy</option>
                  {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() + i).map(y => (<option key={y} value={y}>{y}</option>))}
                </select>
              </div>
              <div>
                <label htmlFor={`cvv-${item._id}`} style={{ display: 'block', fontSize: 12, color: '#64748b' }}>CVV</label>
                <input id={`cvv-${item._id}`} value={cvv} onChange={(e) => setCvv((e.target.value || '').replace(/\D/g, '').slice(0, 4))} placeholder="3 or 4 digits" inputMode="numeric" style={{ width: '100%', padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }} />
              </div>
            </div>
            <label htmlFor={`terms-${item._id}`} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
              <input id={`terms-${item._id}`} type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
              <span>I accept the terms and privacy policy</span>
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={onPay} disabled={processing} style={{ padding: '8px 12px', borderRadius: 8, background: '#2563eb', color: 'white', border: '1px solid #1d4ed8', fontWeight: 700 }}>
                {processing ? 'Processing…' : `Pay ${currency || 'LKR'} ${Number(adFeeAmount || 1000).toFixed(2)}`}
              </button>
              <button onClick={() => setShowPay(false)} disabled={processing} style={{ padding: '8px 12px', borderRadius: 8, background: 'white', border: '1px solid #cbd5e1' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

AdStatusRow.propTypes = {
  baseUrl: PropTypes.string.isRequired,
  headers: PropTypes.object.isRequired,
  item: PropTypes.shape({
    _id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  }).isRequired,
};
