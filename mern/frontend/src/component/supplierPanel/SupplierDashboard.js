import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import SupplierTopbar from './SupplierTopbar';
import { useNavigate } from 'react-router-dom';

// Simple top bar with Profile and Logout buttons, no global navbar
export default function SupplierDashboard() {
  const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
  const token = localStorage.getItem('token') || '';
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);
  const navigate = useNavigate();

  const [me, setMe] = useState(null);
  const [items, setItems] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [error, setError] = useState('');
  const [progressChoice, setProgressChoice] = useState({}); // { [requestId]: 'ready'|'shipped'|'returned'|'completed' }

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
    } catch (_) {}
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

  useEffect(() => { loadProfile(); loadItems(); loadRequests(); // eslint-disable-next-line
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
        const res = await axios.post(`${baseUrl}/supplier-inventories`, fd, { headers: { ...headers, 'Content-Type': 'multipart/form-data' } });
        const created = res.data?.item;
        const requiresAdFee = !!res.data?.requiresAdFee;
        const adFeeAmount = Number(res.data?.adFeeAmount || 1000);
        if (created && requiresAdFee) {
          // Redirect to payment gateway in supplier-ad mode
          navigate('/payment', { state: { mode: 'supplier_ad', inventoryId: created._id, amount: adFeeAmount, currency: res.data?.currency || 'LKR' } });
        }
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
      <SupplierTopbar title="Supplier Dashboard" />

      <div style={{ padding: 16, display: 'grid', gap: 16 }}>
        {error && <div style={{ ...card, borderColor: '#fecaca', background: '#fef2f2', color: '#991b1b' }}>{error}</div>}

        {/* Orders section removed per request */}

        {/* Incoming Requests */}
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
                      <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #e2e8f0' }}>Items</th>
                      <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #e2e8f0' }}>Status</th>
                      <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #e2e8f0' }}>Progress</th>
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
                          <div style={{ fontSize: 12, color: '#64748b' }}>{r.deliveryAddress}</div>
                        </td>
                        <td style={{ padding: 8, borderBottom: '1px solid #f1f5f9' }}>
                          {(r.items||[]).map((it, idx) => (
                            <div key={idx} style={{ fontSize: 12 }}>
                              {it.name} × {it.qty} @ LKR {Number(it.pricePerDay||0).toFixed(2)} /d
                            </div>
                          ))}
                        </td>
                        <td style={{ padding: 8, borderBottom: '1px solid #f1f5f9' }}>{r.status}</td>
                        <td style={{ padding: 8, borderBottom: '1px solid #f1f5f9' }}>
                          <span style={{
                            padding: '2px 8px', borderRadius: 9999,
                            background: r.fulfillmentStatus === 'completed' ? '#dcfce7' : r.fulfillmentStatus === 'shipped' ? '#e0e7ff' : r.fulfillmentStatus === 'ready' ? '#fef3c7' : r.fulfillmentStatus === 'returned' ? '#fde68a' : '#e2e8f0',
                            color: '#0f172a', fontSize: 12, fontWeight: 600
                          }}>{r.fulfillmentStatus || 'new'}</span>
                        </td>
                        <td style={{ padding: 8, borderBottom: '1px solid #f1f5f9', textAlign: 'right' }}>
                          <button disabled={r.status !== 'pending'} onClick={async () => { try { await axios.put(`${baseUrl}/supplier-requests/${r._id}/status`, { status: 'accepted' }, { headers }); await loadRequests(); } catch (e) { setError(e.response?.data?.message || e.message); } }} style={{ padding: '6px 10px', borderRadius: 8, background: '#16a34a', color: 'white', border: '1px solid #15803d', marginRight: 6 }}>Accept</button>
                          <button disabled={r.status !== 'pending'} onClick={async () => { try { await axios.put(`${baseUrl}/supplier-requests/${r._id}/status`, { status: 'rejected' }, { headers }); await loadRequests(); } catch (e) { setError(e.response?.data?.message || e.message); } }} style={{ padding: '6px 10px', borderRadius: 8, background: '#ef4444', color: 'white', border: '1px solid #dc2626', marginRight: 8 }}>Reject</button>
                          {/* Progress dropdown */}
                          <span>
                            <select
                              disabled={r.status !== 'accepted'}
                              value={progressChoice[r._id] || ''}
                              onChange={(e) => setProgressChoice(prev => ({ ...prev, [r._id]: e.target.value }))}
                              style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #cbd5e1', marginRight: 6 }}
                            >
                              <option value="">Select status…</option>
                              <option value="ready" disabled={['ready','shipped','returned','completed'].includes(r.fulfillmentStatus)}>Ready</option>
                              <option value="shipped" disabled={!['ready'].includes(r.fulfillmentStatus)}>Shipped</option>
                              <option value="returned" disabled={!['shipped'].includes(r.fulfillmentStatus)}>Returned</option>
                              <option value="completed" disabled={!['returned'].includes(r.fulfillmentStatus)}>Completed</option>
                            </select>
                            <button
                              disabled={r.status !== 'accepted' || !progressChoice[r._id]}
                              onClick={async () => {
                                const sel = progressChoice[r._id];
                                if (!sel) return;
                                try {
                                  await axios.put(`${baseUrl}/supplier-requests/${r._id}/progress`, { status: sel }, { headers });
                                  setProgressChoice(prev => ({ ...prev, [r._id]: '' }));
                                  await loadRequests();
                                } catch (e) {
                                  setError(e.response?.data?.message || e.message);
                                }
                              }}
                              style={{ padding: '6px 10px', borderRadius: 8, background: '#2563eb', color: 'white', border: '1px solid #1d4ed8' }}
                            >
                              Update
                            </button>
                          </span>
                        </td>
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
                        <AdStatusRow baseUrl={baseUrl} headers={headers} item={it} onRenew={(payload) => navigate('/payment', { state: payload })} />
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

function AdStatusRow({ baseUrl, headers, item, onRenew }) {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${baseUrl}/supplier-inventories/${item._id}/renew`, { headers });
        if (mounted) setInfo(res.data);
      } catch (_) {}
      finally { if (mounted) setLoading(false); }
    })();
    return () => { mounted = false; };
  }, [baseUrl, headers, item._id]);

  if (loading) return <div style={{ fontSize: 12, color: '#64748b' }}>Checking ad status…</div>;
  const remaining = info?.item?.remainingDays ?? 0;
  const active = info?.item?.adActive ?? false;
  const exp = info?.item?.adExpiresAt ? new Date(info.item.adExpiresAt).toLocaleDateString() : 'N/A';
  const fee = info?.adFeeAmount || 1000;
  const curr = info?.currency || 'LKR';

  return (
    <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 9999, background: active ? '#dcfce7' : '#fee2e2', color: active ? '#166534' : '#991b1b', fontWeight: 600 }}>
        {active ? `Ad active • ${remaining} day${remaining===1?'':'s'} left (exp ${exp})` : 'Ad inactive'}
      </span>
      <button
        onClick={() => onRenew({ mode: 'supplier_ad', inventory: { _id: item._id, name: item.name }, amount: fee, currency: curr })}
        style={{ padding: '4px 8px', borderRadius: 8, background: '#2563eb', color: 'white', border: '1px solid #1d4ed8' }}
      >{active ? 'Renew for 1 month' : 'Activate (Pay 1000)'}</button>
    </div>
  );
}
