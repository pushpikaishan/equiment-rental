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
  // Filters for Requests tab
  const [statusFilter, setStatusFilter] = useState(''); // '', 'pending', 'accepted', 'rejected', 'cancelled'
  const [fromDate, setFromDate] = useState(''); // YYYY-MM-DD
  const [toDate, setToDate] = useState(''); // YYYY-MM-DD
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

  // Apply client-side filters to the loaded requests for display
  const filteredRequests = useMemo(() => {
    const list = Array.isArray(requests) ? requests : [];
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;
    if (to) { to.setHours(23, 59, 59, 999); }
    return list.filter(r => {
      if (statusFilter && r.status !== statusFilter) return false;
      const created = new Date(r.createdAt || r.updatedAt || Date.now());
      if (from && created < from) return false;
      if (to && created > to) return false;
      return true;
    });
  }, [requests, statusFilter, fromDate, toDate]);
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

  // Modern styles matching admin booking management theme
  const shell = { minHeight: '100vh', background: '#f3f4f6', display: 'flex', flexDirection: 'column' };
  const container = { flex: 1, padding: '32px', maxWidth: 1400, margin: '0 auto', width: '100%' };
  const card = { 
    background: '#ffffff', 
    border: '1px solid #e5e7eb', 
    borderRadius: 8, 
    padding: 24,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  };
  const statCard = {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    padding: 20,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.2s ease',
    cursor: 'default'
  };
  const grid = { display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' };
  const btn = (bg) => ({ 
    padding: '10px 20px', 
    borderRadius: 6, 
    background: bg, 
    color: 'white', 
    border: 'none',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  });

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

      <div style={container}>
        {error && (
          <div style={{ 
            ...card, 
            borderLeft: '4px solid #ef4444', 
            background: '#fef2f2', 
            color: '#991b1b',
            marginBottom: 20
          }}>
            <span>{error}</span>
          </div>
        )}

        {/* Summary Tab: Running ads and monthly stats */}
        {activeTab === 'summary' && (
        <div style={card}>
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ margin: 0, marginBottom: 8, fontSize: 28, fontWeight: 700, color: '#1f2937' }}>Inventory Summary</h2>
            <p style={{ margin: 0, color: '#6b7280', fontSize: 15 }}>Monitor your equipment inventory and monthly performance.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
            <div style={{ 
              ...statCard,
              borderTop: '4px solid #3b82f6'
            }}>
              <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8, fontWeight: 500 }}>Total Running Ads</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: '#1f2937' }}>{runningAdsCount}</div>
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>Active listings</div>
            </div>
            <div style={{ 
              ...statCard,
              borderTop: '4px solid #10b981'
            }}>
              <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8, fontWeight: 500 }}>This Month Earnings</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: '#1f2937' }}>LKR {Number(monthlyAdStats.totalRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>Total revenue</div>
            </div>
            <div style={{ 
              ...statCard,
              borderTop: '4px solid #f59e0b'
            }}>
              <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8, fontWeight: 500 }}>Items Rented</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: '#1f2937' }}>{monthlyAdStats.totalQty || 0}</div>
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>Total quantity</div>
            </div>
          </div>
          <div style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: '#1f2937' }}>Top Performing Equipment</h3>
            {monthlyAdStats.list.length === 0 ? (
              <div style={{ 
                padding: 60, 
                textAlign: 'center', 
                color: '#6b7280',
                background: '#f9fafb',
                borderRadius: 8,
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ fontSize: 14 }}>No sales recorded this month.</div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
                  <thead>
                    <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                      <th style={{ textAlign: 'left', padding: 12, fontWeight: 600, color: '#374151', fontSize: 14 }}>Equipment</th>
                      <th style={{ textAlign: 'center', padding: 12, fontWeight: 600, color: '#374151', fontSize: 14 }}>Qty Rented</th>
                      <th style={{ textAlign: 'right', padding: 12, fontWeight: 600, color: '#374151', fontSize: 14 }}>Earnings (LKR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyAdStats.list.map((row, idx) => (
                      <tr key={row.inventoryId} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            {row.image ? (
                              <img src={`${baseUrl}${row.image}`} alt={row.name} style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: 40, height: 40, borderRadius: 6, background: '#e5e7eb' }} />
                            )}
                            <div>
                              <div style={{ fontWeight: 600, color: '#111827', fontSize: 14 }}>{row.name}</div>
                              <div style={{ fontSize: 12, color: '#9ca3af' }}>ID: {row.inventoryId.slice(-8)}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: 12, textAlign: 'center', fontWeight: 600, color: '#111827' }}>{row.qty}</td>
                        <td style={{ padding: 12, textAlign: 'right', fontWeight: 600, color: '#111827' }}>{Number(row.revenue).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <h2 style={{ margin: 0, marginBottom: 8, fontSize: 28, fontWeight: 700, color: '#1f2937' }}>Admin Notices</h2>
              <p style={{ margin: 0, color: '#6b7280', fontSize: 15 }}>Important updates from administrators about your inventory.</p>
            </div>
            <button onClick={loadNotices} style={{ ...btn('#3b82f6') }}>Refresh</button>
          </div>
          {loadingNotices ? (
            <div style={{ 
              textAlign: 'center', 
              padding: 60, 
              color: '#6b7280',
              background: '#f9fafb',
              borderRadius: 8,
              border: '1px solid #e5e7eb'
            }}>
              <div>Loading notices...</div>
            </div>
          ) : (notices.length === 0 ? (
            <div style={{ 
              padding: 60, 
              textAlign: 'center', 
              color: '#6b7280',
              background: '#f9fafb',
              borderRadius: 8,
              border: '1px solid #e5e7eb'
            }}>
              <div>No recent admin notices.</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 16 }}>
              {notices.map(n => (
                <div key={n.id} style={{ 
                  border: '1px solid #e5e7eb', 
                  borderRadius: 8, 
                  padding: 20, 
                  background: 'white'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontWeight: 600, color: '#111827', fontSize: 15 }}>{n.name || 'An item'}</span>
                      <span style={{ 
                        fontSize: 11, 
                        padding: '4px 10px', 
                        borderRadius: 4, 
                        background: n.kind === 'deleted' ? '#fee2e2' : '#dbeafe', 
                        color: n.kind === 'deleted' ? '#991b1b' : '#1e40af',
                        fontWeight: 600,
                        textTransform: 'uppercase'
                      }}>
                        {n.kind === 'deleted' ? 'Deleted' : 'Updated'}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: '#9ca3af' }}>{new Date(n.at).toLocaleString()}</div>
                  </div>
                  <div style={{ marginTop: 8, padding: 12, background: '#f9fafb', borderRadius: 6, borderLeft: '3px solid #3b82f6' }}>
                    <span style={{ fontSize: 13, color: '#4b5563', fontWeight: 600 }}>Reason:</span> <span style={{ fontSize: 13, color: '#6b7280' }}>{n.reason || 'No reason provided'}</span>
                  </div>
                  {n.inventoryId && (
                    <div style={{ marginTop: 8, fontSize: 12, color: '#9ca3af' }}>ID: {n.inventoryId}</div>
                  )}
                  {n.kind === 'updated' && n.updates && Object.keys(n.updates).length > 0 && (
                    <div style={{ marginTop: 8, fontSize: 13, color: '#4b5563', background: '#eff6ff', padding: 10, borderRadius: 6 }}>
                      <strong>Changed fields:</strong> {Object.keys(n.updates).join(', ')}
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
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ margin: 0, marginBottom: 8, fontSize: 28, fontWeight: 700, color: '#1f2937' }}>Booking Requests</h2>
            <p style={{ margin: 0, color: '#6b7280', fontSize: 15 }}>Monitor incoming requests, handle cancellations and export booking reports.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <label htmlFor="supplier-req-status" style={{ fontSize: 14, color: '#374151', fontWeight: 500 }}>Status:</label>
              <select id="supplier-req-status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, background: 'white', fontSize: 14 }}>
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>
              {(statusFilter || fromDate || toDate) && (
                <button onClick={() => { setStatusFilter(''); setFromDate(''); setToDate(''); }} style={{ ...btn('#6b7280'), padding: '8px 16px', fontSize: 14 }}>Clear</button>
              )}
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button
                onClick={async () => {
                  try {
                    const res = await axios.get(`${baseUrl}/supplier-requests/export/csv`, {
                      headers,
                      responseType: 'blob',
                      params: { status: statusFilter || undefined, from: fromDate || undefined, to: toDate || undefined }
                    });
                    const blob = new Blob([res.data], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url; a.download = 'supplier-bookings.csv'; a.click();
                    window.URL.revokeObjectURL(url);
                  } catch (e) { alert('Failed to export CSV'); }
                }}
                style={{ ...btn('#10b981') }}
              >
                Export CSV
              </button>
              <button
                onClick={async () => {
                  try {
                    const res = await axios.get(`${baseUrl}/supplier-requests/export/pdf`, {
                      headers,
                      responseType: 'blob',
                      params: { status: statusFilter || undefined, from: fromDate || undefined, to: toDate || undefined }
                    });
                    const blob = new Blob([res.data], { type: 'application/pdf' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url; a.download = 'supplier-bookings.pdf'; a.click();
                    window.URL.revokeObjectURL(url);
                  } catch (e) { alert('Failed to export PDF'); }
                }}
                style={{ ...btn('#f59e0b') }}
              >
                Export PDF
              </button>
            </div>
          </div>
          {loadingRequests ? (
            <div style={{ 
              padding: 60, 
              textAlign: 'center', 
              background: '#f9fafb',
              borderRadius: 8,
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ fontSize: 14, color: '#6b7280' }}>Loading requests...</div>
            </div>
          ) : (
            filteredRequests.length === 0 ? (
              <div style={{ 
                padding: 60, 
                textAlign: 'center', 
                background: '#f9fafb',
                borderRadius: 8,
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ color: '#6b7280', fontSize: 14 }}>No booking requests found</div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
                  <thead style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                    <tr>
                      <th style={{ textAlign: 'left', padding: 12, fontWeight: 600, color: '#374151', fontSize: 14 }}>Requested</th>
                      <th style={{ textAlign: 'left', padding: 12, fontWeight: 600, color: '#374151', fontSize: 14 }}>Customer</th>
                      <th style={{ textAlign: 'left', padding: 12, fontWeight: 600, color: '#374151', fontSize: 14 }}>Address</th>
                      <th style={{ textAlign: 'left', padding: 12, fontWeight: 600, color: '#374151', fontSize: 14 }}>Items</th>
                      <th style={{ textAlign: 'left', padding: 12, fontWeight: 600, color: '#374151', fontSize: 14 }}>Status</th>
                      <th style={{ textAlign: 'right', padding: 12, fontWeight: 600, color: '#374151', fontSize: 14 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.map((r, i) => (
                      <tr key={r._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: 12, color: '#111827', fontSize: 14 }}>{new Date(r.createdAt).toLocaleString()}</td>
                        <td style={{ padding: 12 }}>
                          <div style={{ fontWeight: 600, color: '#111827', fontSize: 14 }}>{r.customerName}</div>
                          <div style={{ fontSize: 13, color: '#9ca3af' }}>{r.customerEmail} • {r.customerPhone}</div>
                        </td>
                        <td style={{ padding: 12 }}>
                          <div style={{ fontSize: 13, color: '#6b7280' }}>{r.deliveryAddress || '—'}</div>
                        </td>
                        <td style={{ padding: 12 }}>
                          {(r.items||[]).map((it, idx) => (
                            <div key={idx} style={{ fontSize: 13, color: '#4b5563', marginBottom: 4 }}>
                              <strong>{it.name}</strong> × {it.qty} @ <span style={{ fontWeight: 600 }}>LKR {Number(it.pricePerDay||0).toFixed(2)}</span> /day
                            </div>
                          ))}
                        </td>
                        <td style={{ padding: 12 }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '4px 12px',
                            borderRadius: 4,
                            fontSize: 12,
                            fontWeight: 600,
                            background: r.status === 'accepted' ? '#d1fae5' :
                                        r.status === 'pending' ? '#fef3c7' :
                                        r.status === 'rejected' ? '#fee2e2' :
                                        '#e5e7eb',
                            color: r.status === 'accepted' ? '#065f46' :
                                   r.status === 'pending' ? '#92400e' :
                                   r.status === 'rejected' ? '#991b1b' :
                                   '#374151'
                          }}>
                            {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                          </span>
                        </td>
                        <td style={{ padding: 12, textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                            <button 
                              disabled={r.status !== 'pending'} 
                              onClick={async () => { 
                                try { 
                                  await axios.put(`${baseUrl}/supplier-requests/${r._id}/status`, { status: 'accepted' }, { headers }); 
                                  await loadRequests(); 
                                } catch (e) { 
                                  setError(e.response?.data?.message || e.message); 
                                } 
                              }} 
                              style={{ 
                                ...btn('#10b981'), 
                                padding: '6px 14px', 
                                fontSize: 13,
                                opacity: r.status !== 'pending' ? 0.5 : 1,
                                cursor: r.status !== 'pending' ? 'not-allowed' : 'pointer'
                              }}
                            >
                              Accept
                            </button>
                            <button 
                              disabled={r.status !== 'pending'} 
                              onClick={async () => { 
                                try { 
                                  await axios.put(`${baseUrl}/supplier-requests/${r._id}/status`, { status: 'rejected' }, { headers }); 
                                  await loadRequests(); 
                                } catch (e) { 
                                  setError(e.response?.data?.message || e.message); 
                                } 
                              }} 
                              style={{ 
                                ...btn('#ef4444'), 
                                padding: '6px 14px', 
                                fontSize: 13,
                                opacity: r.status !== 'pending' ? 0.5 : 1,
                                cursor: r.status !== 'pending' ? 'not-allowed' : 'pointer'
                              }}
                            >
                              Reject
                            </button>
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
                              style={{ ...btn('#3b82f6'), padding: '6px 14px', fontSize: 13 }}
                            >
                              Shipped
                            </button>
                          </div>
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <h2 style={{ margin: 0, marginBottom: 8, fontSize: 28, fontWeight: 700, color: '#1f2937' }}>My Profile</h2>
              <p style={{ margin: 0, color: '#6b7280', fontSize: 15 }}>Your supplier account information and contact details.</p>
            </div>
            {me?._id && (
              <button 
                onClick={() => window.location.href = `/update-supplier/${me._id}`}
                style={{ ...btn('#3b82f6') }}
              >
                Edit Profile
              </button>
            )}
          </div>
          {!me ? (
            <div style={{ 
              padding: 60, 
              textAlign: 'center', 
              background: '#f9fafb',
              borderRadius: 8,
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ fontSize: 14, color: '#6b7280' }}>Loading profile...</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
              <div style={{ 
                ...statCard,
                borderTop: '4px solid #3b82f6'
              }}>
                <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8, fontWeight: 500 }}>Name</div>
                <div style={{ fontWeight: 600, color: '#111827', fontSize: 16 }}>{me.name || me.fullName || '—'}</div>
              </div>
              <div style={{ 
                ...statCard,
                borderTop: '4px solid #8b5cf6'
              }}>
                <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8, fontWeight: 500 }}>Email</div>
                <div style={{ fontWeight: 600, color: '#111827', fontSize: 14, wordBreak: 'break-all' }}>{me.email || '—'}</div>
              </div>
              <div style={{ 
                ...statCard,
                borderTop: '4px solid #10b981'
              }}>
                <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8, fontWeight: 500 }}>District</div>
                <div style={{ fontWeight: 600, color: '#111827', fontSize: 16 }}>{me.district || '—'}</div>
              </div>
              <div style={{ 
                ...statCard,
                borderTop: '4px solid #f59e0b'
              }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8, fontWeight: 500 }}>Phone</div>
                <div style={{ fontWeight: 600, color: '#111827', fontSize: 16 }}>{me.phone || me.mobile || '—'}</div>
              </div>
            </div>
          )}
        </div>
        )}

  {/* Equipments: Inventory form and list */}
  {activeTab === 'equipment' && (
  <div style={grid}>
          <form onSubmit={onSubmit} style={card}>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ margin: 0, marginBottom: 8, fontSize: 20, fontWeight: 700, color: '#1f2937' }}>
                {editing ? 'Edit Inventory Item' : 'Add Inventory Item'}
              </h2>
              <p style={{ margin: 0, color: '#6b7280', fontSize: 13 }}>Fill in the details below to {editing ? 'update' : 'add'} equipment to your inventory.</p>
            </div>
            <div style={{ display: 'grid', gap: 14 }}>
              <div>
                <label htmlFor="supplier-item-name" style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Item Name</label>
                <input 
                  id="supplier-item-name"
                  placeholder="Enter item name" 
                  value={form.name} 
                  onChange={e => setForm({ ...form, name: e.target.value })} 
                  style={{ 
                    width: '100%', 
                    padding: '10px 12px', 
                    border: '1px solid #d1d5db', 
                    borderRadius: 6,
                    fontSize: 14
                  }}
                  required 
                />
              </div>
              <div>
                <label htmlFor="supplier-item-desc" style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Description</label>
                <textarea 
                  id="supplier-item-desc"
                  placeholder="Describe your item" 
                  value={form.description} 
                  onChange={e => setForm({ ...form, description: e.target.value })} 
                  style={{ 
                    width: '100%', 
                    padding: '10px 12px', 
                    border: '1px solid #d1d5db', 
                    borderRadius: 6,
                    fontSize: 14,
                    resize: 'vertical'
                  }}
                  rows={3} 
                />
              </div>
              <div>
                <label htmlFor="supplier-item-category" style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Category</label>
                <select 
                  id="supplier-item-category"
                  value={form.category} 
                  onChange={e => setForm({ ...form, category: e.target.value })} 
                  style={{ 
                    width: '100%', 
                    padding: '10px 12px', 
                    border: '1px solid #d1d5db', 
                    borderRadius: 6,
                    fontSize: 14,
                    background: 'white'
                  }}
                >
                  <option value="">Select Category</option>
                  {['Lighting','Audio','Camera','Tents & Shelters','Visual & AV Equipment','Stage & Platform Equipment','Furniture','Catering & Dining Equipment','Power & Electrical','Climate Control'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="supplier-item-district" style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>District (from profile)</label>
                <input
                  id="supplier-item-district"
                  placeholder="District"
                  value={form.district}
                  onChange={() => { /* disabled - district is managed by profile */ }}
                  disabled
                  style={{ 
                    width: '100%', 
                    padding: '10px 12px', 
                    border: '1px solid #d1d5db', 
                    borderRadius: 6, 
                    background: '#f9fafb', 
                    color: '#9ca3af',
                    fontSize: 14
                  }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label htmlFor="supplier-item-price" style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Rental Price (LKR/day)</label>
                  <input 
                    id="supplier-item-price"
                    type="number" 
                    min="0.01" 
                    step="0.01" 
                    placeholder="0.00" 
                    value={form.rentalPrice} 
                    onChange={e => setForm({ ...form, rentalPrice: e.target.value })} 
                    style={{ 
                      width: '100%', 
                      padding: '10px 12px', 
                      border: '1px solid #d1d5db', 
                      borderRadius: 6,
                      fontSize: 14
                    }} 
                    required 
                  />
                </div>
                <div>
                  <label htmlFor="supplier-item-qty" style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Quantity</label>
                  <input 
                    id="supplier-item-qty"
                    type="number" 
                    min="1" 
                    step="1" 
                    placeholder="1" 
                    value={form.quantity} 
                    onChange={e => setForm({ ...form, quantity: e.target.value })} 
                    style={{ 
                      width: '100%', 
                      padding: '10px 12px', 
                      border: '1px solid #cbd5e1', 
                      borderRadius: 6,
                      fontSize: 14
                    }} 
                    required 
                  />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 10, background: '#f9fafb', borderRadius: 6, border: '1px solid #e5e7eb' }}>
                <input id="avail" type="checkbox" checked={!!form.available} onChange={e => setForm({ ...form, available: e.target.checked })} style={{ width: 16, height: 16 }} />
                <label htmlFor="avail" style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>Available for rent</label>
              </div>
              <div>
                <label htmlFor="supplier-item-image" style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Item Image</label>
                <input 
                  id="supplier-item-image"
                  type="file" 
                  accept="image/*" 
                  onChange={e => setImage(e.target.files?.[0] || null)} 
                  style={{ 
                    width: '100%', 
                    padding: 8, 
                    border: '1px solid #d1d5db', 
                    borderRadius: 6,
                    fontSize: 14
                  }} 
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button type="submit" style={{ ...btn('#3b82f6'), flex: 1 }}>
                {editing ? 'Update Item' : 'Add Item'}
              </button>
              {editing && (
                <button 
                  type="button" 
                  onClick={() => { setEditing(null); setForm(emptyForm); setImage(null); }} 
                  style={{ ...btn('#6b7280'), flex: 1 }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          <div style={card}>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ margin: 0, marginBottom: 8, fontSize: 20, fontWeight: 700, color: '#1f2937' }}>Your Inventory</h2>
              <p style={{ margin: 0, color: '#6b7280', fontSize: 13 }}>Manage your equipment listings and availability.</p>
            </div>
            {loadingItems ? (
              <div style={{ 
                padding: 60, 
                textAlign: 'center', 
                background: '#f9fafb',
                borderRadius: 8,
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ fontSize: 14, color: '#6b7280' }}>Loading items...</div>
              </div>
            ) : (
              items.length === 0 ? (
                <div style={{ 
                  padding: 60, 
                  textAlign: 'center', 
                  background: '#f9fafb',
                  borderRadius: 8,
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ color: '#6b7280', fontSize: 14 }}>No items in your inventory yet</div>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 12 }}>
                  {items.map((it, idx) => (
                    <div key={it._id} style={{ 
                      display: 'grid', 
                      gap: 16, 
                      gridTemplateColumns: '80px 1fr auto', 
                      alignItems: 'center', 
                      border: '1px solid #e5e7eb',
                      borderRadius: 8,
                      padding: 16,
                      background: 'white'
                    }}>
                      <div>
                        {it.image ? (
                          <img src={`${baseUrl}${it.image}`} alt={it.name} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6 }} />
                        ) : (
                          <div style={{ width: 80, height: 80, background: '#e5e7eb', borderRadius: 6 }} />
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#111827', fontSize: 15, marginBottom: 6 }}>{it.name}</div>
                        <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 6 }}>
                          <strong>{it.category}</strong> • {it.district} • Qty: <strong>{it.quantity}</strong> • <span style={{ color: '#10b981', fontWeight: 600 }}>LKR {Number(it.rentalPrice || 0).toFixed(2)}/day</span>
                        </div>
                        <div style={{ 
                          display: 'inline-block',
                          fontSize: 11, 
                          fontWeight: 600,
                          padding: '3px 10px',
                          borderRadius: 4,
                          background: it.available !== false ? '#d1fae5' : '#fee2e2',
                          color: it.available !== false ? '#065f46' : '#991b1b'
                        }}>
                          {it.available !== false ? 'Available' : 'Unavailable'}
                        </div>
                        <AdStatusRow baseUrl={baseUrl} headers={headers} item={it} />
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
                        <button onClick={() => startEdit(it)} style={{ ...btn('#3b82f6'), padding: '6px 14px', fontSize: 13 }}>Edit</button>
                        <button onClick={() => removeItem(it._id)} style={{ ...btn('#ef4444'), padding: '6px 14px', fontSize: 13 }}>Delete</button>
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
