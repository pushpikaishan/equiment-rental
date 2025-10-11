import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { headerCard, headerTitle, headerSub } from './adminStyles';

export default function SupplierAdsManagement() {
  const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
  const token = localStorage.getItem('token') || '';
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const [q, setQ] = useState({ q: '', status: '', supplierId: '' });
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ ...q, page, limit: 12 });
      const res = await axios.get(`${baseUrl}/supplier-inventories/admin?${params.toString()}`, { headers });
      setItems(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (e) {
      //
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); /* eslint-disable-next-line */ }, [page]);

  const updateModeration = async (id, body) => {
    await axios.put(`${baseUrl}/supplier-inventories/admin/${id}`, body, { headers });
    await fetchData();
  };
  const hardDelete = async (id) => {
    if (!window.confirm('Permanently delete this ad?')) return;
    await axios.delete(`${baseUrl}/supplier-inventories/admin/${id}`, { headers });
    await fetchData();
  };

  // Fixed 2-column grid layout
  const grid = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16, alignItems: 'start' };
  const card = { background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: 12 };
  const pill = { display: 'inline-block', padding: '2px 8px', borderRadius: 9999, fontSize: 12, fontWeight: 700 };

  const statusPill = (it) => {
    const now = Date.now();
    if (it.adminRemoved) return <span style={{ ...pill, background: '#fee2e2', color: '#991b1b' }}>Removed</span>;
    if (it.adExpiresAt && new Date(it.adExpiresAt).getTime() <= now) return <span style={{ ...pill, background: '#fef3c7', color: '#92400e' }}>Expired</span>;
    if (it.adActive) return <span style={{ ...pill, background: '#dcfce7', color: '#166534' }}>Active</span>;
    return <span style={{ ...pill, background: '#e2e8f0', color: '#334155' }}>Inactive</span>;
  };

  return (
    <div>
      <div style={headerCard}>
        <h1 style={headerTitle}>Supplier Ads Management</h1>
        <p style={headerSub}>Review, edit, or remove supplier listings. Require reasons for removals.</p>
      </div>

      <div className="pm-card" style={{ marginBottom: 12 }}>
        <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
          <input placeholder="Search name/desc/category" value={q.q} onChange={(e) => setQ({ ...q, q: e.target.value })} className="pm-input" />
          <select value={q.status} onChange={(e) => setQ({ ...q, status: e.target.value })} className="pm-select">
            <option value="">Any status</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="removed">Removed</option>
          </select>
          <input placeholder="Supplier ID" value={q.supplierId} onChange={(e) => setQ({ ...q, supplierId: e.target.value })} className="pm-input" />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { setPage(1); fetchData(); }} className="pm-btn pm-btn--info">Apply</button>
            <button onClick={() => { setQ({ q: '', status: '', supplierId: '' }); setPage(1); fetchData(); }} className="pm-btn pm-btn--secondary">Reset</button>
          </div>
        </div>
      </div>

      <div style={grid}>
        {loading ? (
          <div>Loading…</div>
        ) : items.length === 0 ? (
          <div>No supplier ads found.</div>
        ) : (
          items.map((it) => (
            <div key={it._id} style={card}>
              <div style={{ display: 'grid', gridTemplateColumns: '72px 1fr', gap: 8 }}>
                <div>
                  {it.image ? (
                    <img alt={it.name} src={`${baseUrl}${it.image}`} style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8 }} />
                  ) : (
                    <div style={{ width: 72, height: 72, background: '#e2e8f0', borderRadius: 8 }} />
                  )}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{it.name}</div>
                    {statusPill(it)}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{it.category} • {it.district} • Qty {it.quantity} • LKR {Number(it.rentalPrice || 0).toFixed(2)}/d</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>Supplier: <code>{String(it.supplierId)}</code></div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>Ad: {it.adActive ? 'Active' : 'Inactive'} {it.adExpiresAt ? `• exp ${new Date(it.adExpiresAt).toLocaleDateString()}` : ''}</div>
                </div>
              </div>

              <div style={{ marginTop: 8 }}>
                <label style={{ display: 'block', fontSize: 12, color: '#334155' }}>Admin Note</label>
                <textarea value={it.adminNote || ''} onChange={(e) => setItems((prev) => prev.map(x => x._id === it._id ? { ...x, adminNote: e.target.value } : x))} rows={2} className="pm-input" style={{ width: '100%' }} />
              </div>
              <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr', marginTop: 8 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#334155' }}>Removal Reason</label>
                  <input value={it.adminRemovedReason || ''} onChange={(e) => setItems((prev) => prev.map(x => x._id === it._id ? { ...x, adminRemovedReason: e.target.value } : x))} className="pm-input" />
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                  {!it.adminRemoved ? (
                    <button onClick={() => updateModeration(it._id, { adminRemoved: true, adminRemovedReason: it.adminRemovedReason || 'Not suitable equipment' })} className="pm-btn pm-btn--danger">Remove</button>
                  ) : (
                    <button onClick={() => updateModeration(it._id, { adminRemoved: false })} className="pm-btn pm-btn--success">Restore</button>
                  )}
                  <button onClick={() => updateModeration(it._id, { adminNote: it.adminNote, adminRemovedReason: it.adminRemovedReason })} className="pm-btn pm-btn--primary">Save Note</button>
                  <button onClick={() => hardDelete(it._id)} className="pm-btn pm-btn--muted">Delete</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="pm-pagination" style={{ marginTop: 12 }}>
        <div>Page {page} of {Math.max(1, Math.ceil(total / 12))}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="pm-btn pm-btn--secondary">Prev</button>
          <button disabled={page >= Math.ceil(total / 12)} onClick={() => setPage(p => p + 1)} className="pm-btn pm-btn--secondary">Next</button>
        </div>
      </div>
    </div>
  );
}
