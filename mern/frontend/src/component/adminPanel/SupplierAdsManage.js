import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

export default function SupplierAdsManage() {
  const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
  const token = localStorage.getItem('token');

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [district, setDistrict] = useState('');
  const [adStatus, setAdStatus] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [editItem, setEditItem] = useState(null);
  const [editReason, setEditReason] = useState('');
  const [editUpdates, setEditUpdates] = useState({});

  const [deleteItem, setDeleteItem] = useState(null);
  const [deleteReason, setDeleteReason] = useState('');

  const headers = useMemo(() => token ? { Authorization: `Bearer ${token}` } : {}, [token]);

  const fetchList = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${baseUrl}/supplier-inventories/admin`, { params: { q, category, district, adStatus, page, limit }, headers });
      setItems(res.data?.items || []);
      setTotal(res.data?.total || 0);
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    setPage(1);
    fetchList();
  };

  const resetFilters = () => {
    setQ('');
    setCategory('');
    setDistrict('');
    setAdStatus('all');
    setPage(1);
    fetchList();
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const onOpenEdit = (it) => {
    setEditItem(it);
    setEditReason('Policy adjustment');
    setEditUpdates({ name: it.name, rentalPrice: it.rentalPrice, available: it.available, adActive: it.adActive });
  };
  const onSubmitEdit = async () => {
    if (!editItem) return;
    if (!editReason || editReason.trim().length < 3) return alert('Please provide a reason (min 3 characters).');
    try {
      await axios.put(`${baseUrl}/supplier-inventories/admin/${editItem._id}`, { updates: editUpdates, reason: editReason }, { headers });
      setEditItem(null);
      setEditUpdates({});
      setEditReason('');
      fetchList();
    } catch (e) {
      alert(e.response?.data?.message || e.message);
    }
  };

  const onToggleActive = async (it) => {
    try {
      await axios.put(`${baseUrl}/supplier-inventories/admin/${it._id}`, { updates: { adActive: !it.adActive }, reason: it.adActive ? 'Deactivate expired/misleading ad' : 'Activate upon review' }, { headers });
      fetchList();
    } catch (e) {
      alert(e.response?.data?.message || e.message);
    }
  };

  const onSubmitDelete = async () => {
    if (!deleteItem) return;
    if (!deleteReason || deleteReason.trim().length < 3) return alert('Please provide a reason (min 3 characters).');
    try {
      await axios.delete(`${baseUrl}/supplier-inventories/admin/${deleteItem._id}`, { data: { reason: deleteReason }, headers });
      setDeleteItem(null);
      setDeleteReason('');
      fetchList();
    } catch (e) {
      alert(e.response?.data?.message || e.message);
    }
  };

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Supplier Ads Management</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8, margin: '12px 0' }}>
        <input placeholder="Search..." value={q} onChange={e => setQ(e.target.value)}
               style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 8 }} />
        <input placeholder="Category" value={category} onChange={e => setCategory(e.target.value)}
               style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 8 }} />
        <input placeholder="District" value={district} onChange={e => setDistrict(e.target.value)}
               style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 8 }} />
        <select value={adStatus} onChange={e => setAdStatus(e.target.value)}
                style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 8 }}>
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="expired">Expired</option>
        </select>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <button onClick={applyFilters} style={{ background: '#06b6d4', color: 'white', border: 'none', padding: '8px 12px', borderRadius: 8, fontWeight: 700 }}>Apply Filters</button>
        <button onClick={resetFilters} style={{ background: 'white', border: '1px solid #cbd5e1', padding: '8px 12px', borderRadius: 8, fontWeight: 700 }}>Reset</button>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 12, color: '#64748b' }}>Results: {total}</div>
      </div>
      {error && <div style={{ color: '#dc2626', marginBottom: 8 }}>{error}</div>}
      {loading ? (
        <div>Loading…</div>
      ) : (
        <div>
          {/* 2-column grid for cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
            {items.map(it => (
              <div key={it._id} style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden', background: 'white' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 12, padding: 12 }}>
                  <div>
                    {it.image ? (
                      <img
                        src={/^https?:\/\//i.test(it.image) ? it.image : `${baseUrl}${it.image.startsWith('/') ? it.image : `/${it.image}`}`}
                        alt={it.name}
                        style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 6 }}
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <div style={{ width: '100%', height: 120, background: '#f1f5f9', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>No Image</div>
                    )}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontWeight: 700 }}>{it.name}</div>
                      <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 12, background: it.adActive && !it.expired ? '#dcfce7' : '#fee2e2', color: it.adActive && !it.expired ? '#166534' : '#991b1b' }}>
                        {it.adActive && !it.expired ? `Active · ${it.remainingDays}d left` : (it.expired ? 'Expired' : 'Inactive')}
                      </span>
                    </div>
                    <div style={{ color: '#475569', fontSize: 13, marginTop: 4 }}>{it.description?.slice(0, 120) || '—'}</div>
                    <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
                      <Info label="Category" value={it.category} />
                      <Info label="District" value={it.district || '—'} />
                      <Info label="Price" value={`LKR ${Number(it.rentalPrice || 0).toFixed(2)}`} />
                      <Info label="Qty" value={String(it.quantity ?? 0)} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                      <button onClick={() => onOpenEdit(it)} style={{ background: '#f59e0b', color: 'white', border: 'none', padding: '8px 10px', borderRadius: 6, fontWeight: 700 }}>Edit</button>
                      <button onClick={() => onToggleActive(it)} style={{ background: it.adActive ? '#ef4444' : '#22c55e', color: 'white', border: 'none', padding: '8px 10px', borderRadius: 6, fontWeight: 700 }}>{it.adActive ? 'Deactivate' : 'Activate'}</button>
                      <button onClick={() => setDeleteItem(it)} style={{ background: '#991b1b', color: 'white', border: 'none', padding: '8px 10px', borderRadius: 6, fontWeight: 700 }}>Delete</button>
                    </div>
                    {it.supplierId && (
                      <div style={{ marginTop: 10, fontSize: 12, color: '#64748b' }}>
                        Supplier: <strong>{it.supplierId.companyName || it.supplierId.name}</strong> · {it.supplierId.email}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div style={{ marginTop: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>Prev</button>
            <div>Page {page} / {totalPages}</div>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next</button>
            <select value={limit} onChange={e => { setLimit(parseInt(e.target.value, 10)); setPage(1); }}>
              <option value={6}>6</option>
              <option value={12}>12</option>
              <option value={24}>24</option>
            </select>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editItem && (
        <div style={backdrop} onClick={() => setEditItem(null)}>
          <div style={modal} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Edit Ad</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <label>Name<input value={editUpdates.name || ''} onChange={e => setEditUpdates(v => ({ ...v, name: e.target.value }))} /></label>
              <label>Price<input type="number" value={editUpdates.rentalPrice ?? ''} onChange={e => setEditUpdates(v => ({ ...v, rentalPrice: e.target.value }))} /></label>
              <label>Available<select value={String(editUpdates.available)} onChange={e => setEditUpdates(v => ({ ...v, available: e.target.value === 'true' }))}><option value="true">true</option><option value="false">false</option></select></label>
              <label>Ad Active<select value={String(editUpdates.adActive)} onChange={e => setEditUpdates(v => ({ ...v, adActive: e.target.value === 'true' }))}><option value="true">true</option><option value="false">false</option></select></label>
              <label style={{ gridColumn: '1 / -1' }}>Reason<textarea value={editReason} onChange={e => setEditReason(e.target.value)} rows={3} /></label>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
              <button onClick={() => setEditItem(null)}>Cancel</button>
              <button onClick={onSubmitEdit} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '8px 10px', borderRadius: 6, fontWeight: 700 }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteItem && (
        <div style={backdrop} onClick={() => setDeleteItem(null)}>
          <div style={modal} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Delete Ad</h3>
            <p>Please provide a reason. This will be recorded in the activity log.</p>
            <textarea value={deleteReason} onChange={e => setDeleteReason(e.target.value)} rows={3} style={{ width: '100%' }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
              <button onClick={() => setDeleteItem(null)}>Cancel</button>
              <button onClick={onSubmitDelete} style={{ background: '#b91c1c', color: 'white', border: 'none', padding: '8px 10px', borderRadius: 6, fontWeight: 700 }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Info({ label, value }) {
  return (
    <span style={{ fontSize: 12, color: '#334155', background: '#f1f5f9', padding: '2px 8px', borderRadius: 12 }}>
      <strong style={{ color: '#0f172a' }}>{label}:</strong> {value}
    </span>
  );
}

const backdrop = { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 };
const modal = { width: 'min(560px, 96vw)', background: 'white', borderRadius: 8, padding: 16 };
