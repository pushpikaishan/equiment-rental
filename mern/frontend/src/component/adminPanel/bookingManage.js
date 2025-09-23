import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

export default function BookingManagement() {
  const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
  const token = localStorage.getItem('token');
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  // Pagination only (show all bookings without filters)
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState(''); // '', 'confirmed', 'cancelled', 'pending'
  const [summary, setSummary] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const paramsObj = { page, limit: 10 };
      if (statusFilter) paramsObj.status = statusFilter;
      const params = new URLSearchParams(paramsObj);
      const res = await axios.get(`${baseUrl}/bookings/admin?${params.toString()}`, { headers });
      setItems(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const res = await axios.get(`${baseUrl}/bookings/admin/summary`, { headers });
      setSummary(res.data);
    } catch {}
  };

  useEffect(() => { fetchData(); /* eslint-disable-next-line */ }, [page, statusFilter]);
  useEffect(() => { fetchSummary(); /* eslint-disable-next-line */ }, []);

  const toggleDispute = async (id, current) => {
    const note = window.prompt(current ? 'Update dispute note (optional):' : 'Enter dispute note (optional):', '');
    await axios.put(`${baseUrl}/bookings/admin/${id}/dispute`, { disputed: !current, note }, { headers });
    fetchData();
  };
  const cancelBooking = async (id) => {
    const reason = window.prompt('Reason for cancellation? (optional)', '');
    await axios.put(`${baseUrl}/bookings/admin/${id}/cancel`, { reason }, { headers });
    fetchData();
  };
  const download = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };
  const exportCSV = async () => {
    try {
      const res = await axios.get(`${baseUrl}/bookings/admin/export/csv`, { headers, responseType: 'blob' });
      download(new Blob([res.data], { type: 'text/csv' }), 'bookings-report.csv');
    } catch (e) {
      alert('Failed to export CSV');
    }
  };
  const exportPDF = async () => {
    try {
      const res = await axios.get(`${baseUrl}/bookings/admin/export/pdf`, { headers, responseType: 'blob' });
      download(new Blob([res.data], { type: 'application/pdf' }), 'bookings-report.pdf');
    } catch (e) {
      alert('Failed to export PDF');
    }
  };

  const card = { background: 'white', padding: 20, borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' };
  const input = { padding: 10, border: '1px solid #e2e8f0', borderRadius: 8 };
  const select = input;
  const btn = (bg) => ({ background: bg, color: 'white', border: 'none', padding: '8px 12px', borderRadius: 8, cursor: 'pointer' });

  return (
    <div>
      <div style={{ ...card, marginBottom: 16 }}>
        <h2 style={{ marginTop: 0 }}>Booking Management</h2>
        <p style={{ color: '#64748b', marginTop: 4 }}>Monitor system usage, handle disputes/cancellations, and export booking reports.</p>
        {summary && (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
            <div style={{ ...input }}>Total: {summary.total}</div>
            <div style={{ ...input }}>Pending: {summary.pending}</div>
            <div style={{ ...input }}>Confirmed: {summary.confirmed}</div>
            <div style={{ ...input }}>Cancelled: {summary.cancelled}</div>
            <div style={{ ...input }}>Disputed: {summary.disputed}</div>
            <div style={{ ...input }}>Totals: subtotal {Number(summary.totals?.subtotal||0).toFixed(2)} | deposit {Number(summary.totals?.deposit||0).toFixed(2)} | total {Number(summary.totals?.totalAmount||0).toFixed(2)}</div>
          </div>
        )}
      </div>

      {/* Toolbar with simple status filter and export actions */}
      <div style={{ ...card, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ fontWeight: 600, color: '#334155' }}>Bookings</div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ color: '#334155', fontSize: 14 }}>Status:</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={select}>
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button onClick={exportCSV} style={btn('#16a34a')}>Export CSV</button>
          <button onClick={exportPDF} style={btn('#f59e0b')}>Export PDF</button>
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
                <th style={{ padding: 10 }}>Date</th>
                <th style={{ padding: 10 }}>Status</th>
                <th style={{ padding: 10 }}>Disputed</th>
                <th style={{ padding: 10, textAlign: 'right' }}>Total</th>
                <th style={{ padding: 10 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" style={{ padding: 10 }}>Loading…</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan="8" style={{ padding: 10 }}>No bookings found.</td></tr>
              ) : (
                items.map((b) => (
                  <tr key={b._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: 10 }}>{new Date(b.createdAt).toLocaleString()}</td>
                    <td style={{ padding: 10 }}><code>{b._id}</code></td>
                    <td style={{ padding: 10 }}>{b.customerName} ({b.customerEmail})</td>
                    <td style={{ padding: 10 }}>{new Date(b.bookingDate).toLocaleDateString()}</td>
                    <td style={{ padding: 10 }}>
                      <span style={{
                        textTransform: 'capitalize',
                        padding: '2px 8px',
                        borderRadius: 9999,
                        background: b.status === 'cancelled' ? '#fee2e2' : b.status === 'confirmed' ? '#dcfce7' : '#e2e8f0',
                        color: b.status === 'cancelled' ? '#dc2626' : b.status === 'confirmed' ? '#166534' : '#334155',
                        fontWeight: 600,
                        fontSize: 12
                      }}>{b.status}</span>
                    </td>
                    <td style={{ padding: 10 }}>{b.disputed ? 'Yes' : 'No'}</td>
                    <td style={{ padding: 10, textAlign: 'right' }}>{Number(b.total).toFixed(2)}</td>
                    <td style={{ padding: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button onClick={() => toggleDispute(b._id, b.disputed)} style={btn('#8b5cf6')}>{b.disputed ? 'Resolve' : 'Mark Dispute'}</button>
                      {b.status !== 'cancelled' && (
                        <button onClick={() => cancelBooking(b._id)} style={btn('#ef4444')}>Cancel</button>
                      )}
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
    </div>
  );
}