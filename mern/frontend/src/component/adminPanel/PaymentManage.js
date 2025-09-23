import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

export default function PaymentManagement() {
  const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
  const token = localStorage.getItem('token');

  // Filters
  const [q, setQ] = useState({ status: '', method: '', gateway: '', customer: '', orderId: '', from: '', to: '' });
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);

  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ ...q, page, limit: 10 });
      const res = await axios.get(`${baseUrl}/payments?${params.toString()}`, { headers });
      setItems(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (e) {
      // handle silently for now
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const res = await axios.get(`${baseUrl}/payments/summary`, { headers });
      setSummary(res.data);
    } catch {}
  };

  useEffect(() => { fetchData(); /* eslint-disable-next-line */ }, [page]);
  useEffect(() => { fetchSummary(); /* eslint-disable-next-line */ }, []);

  const markReceived = async (id) => {
    await axios.put(`${baseUrl}/payments/${id}/mark-received`, { method: 'cash' }, { headers });
    fetchData();
  };
  const refund = async (id) => {
    const amount = window.prompt('Enter refund amount (leave blank for full):');
    await axios.post(`${baseUrl}/payments/${id}/refund`, amount ? { amount: Number(amount) } : {}, { headers });
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
      const res = await axios.get(`${baseUrl}/payments/export/csv`, { headers, responseType: 'blob' });
      download(new Blob([res.data], { type: 'text/csv' }), 'payments-report.csv');
    } catch (e) { alert('Failed to export CSV'); }
  };
  const exportPDF = async () => {
    try {
      const res = await axios.get(`${baseUrl}/payments/export/pdf`, { headers, responseType: 'blob' });
      download(new Blob([res.data], { type: 'application/pdf' }), 'payments-report.pdf');
    } catch (e) { alert('Failed to export PDF'); }
  };

  const card = { background: 'white', padding: 20, borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' };
  const input = { padding: 10, border: '1px solid #e2e8f0', borderRadius: 8 };
  const select = input;
  const btn = (bg) => ({ background: bg, color: 'white', border: 'none', padding: '8px 12px', borderRadius: 8, cursor: 'pointer' });

  return (
    <div>
      <div style={{ ...card, marginBottom: 16 }}>
        <h2 style={{ marginTop: 0 }}>Payment Management</h2>
        <p style={{ color: '#64748b', marginTop: 4 }}>Monitor transactions, process refunds, export reports.</p>
        {summary && (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
            <div style={{ ...input }}>Total revenue: {summary.totalRevenue.toFixed(2)}</div>
            <div style={{ ...input }}>Monthly: {summary.monthlyRevenue.toFixed(2)}</div>
            <div style={{ ...input }}>Today: {summary.dailyRevenue.toFixed(2)}</div>
            <div style={{ ...input }}>By method: {Object.entries(summary.byMethod).map(([m,c]) => `${m}:${c}`).join(', ')}</div>
          </div>
        )}
      </div>

      <div style={{ ...card, marginBottom: 16 }}>
        <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
          <select value={q.status} onChange={(e) => setQ({ ...q, status: e.target.value })} style={select}>
            <option value="">Status</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
            <option value="partial_refunded">Partial Refunded</option>
          </select>
          <select value={q.method} onChange={(e) => setQ({ ...q, method: e.target.value })} style={select}>
            <option value="">Method</option>
            <option value="card">Card</option>
            <option value="cash">Cash</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="paypal">PayPal</option>
            <option value="stripe">Stripe</option>
            <option value="payhere">PayHere</option>
          </select>
          <input placeholder="Gateway" value={q.gateway} onChange={(e) => setQ({ ...q, gateway: e.target.value })} style={input} />
          <input placeholder="Customer/email" value={q.customer} onChange={(e) => setQ({ ...q, customer: e.target.value })} style={input} />
          <input placeholder="Order ID" value={q.orderId} onChange={(e) => setQ({ ...q, orderId: e.target.value })} style={input} />
          <input type="date" value={q.from} onChange={(e) => setQ({ ...q, from: e.target.value })} style={input} />
          <input type="date" value={q.to} onChange={(e) => setQ({ ...q, to: e.target.value })} style={input} />
        </div>
        <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
          <button onClick={() => { setPage(1); fetchData(); }} style={btn('#0ea5e9')}>Apply Filters</button>
          <button onClick={() => { setQ({ status:'', method:'', gateway:'', customer:'', orderId:'', from:'', to:'' }); setPage(1); fetchData(); }} style={btn('#64748b')}>Reset</button>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button onClick={exportCSV} style={btn('#16a34a')}>Export CSV</button>
            <button onClick={exportPDF} style={btn('#f59e0b')}>Export PDF</button>
          </div>
        </div>
      </div>

      <div style={{ ...card }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: 10 }}>Date</th>
                <th style={{ padding: 10 }}>Order</th>
                <th style={{ padding: 10 }}>Customer</th>
                <th style={{ padding: 10 }}>Method</th>
                <th style={{ padding: 10 }}>Status</th>
                <th style={{ padding: 10, textAlign: 'right' }}>Amount</th>
                <th style={{ padding: 10 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ padding: 10 }}>Loading…</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan="7" style={{ padding: 10 }}>No payments found.</td></tr>
              ) : (
                items.map((it) => (
                  <tr key={it._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: 10 }}>{new Date(it.createdAt).toLocaleString()}</td>
                    <td style={{ padding: 10 }}>{it.orderId || it.bookingId || it._id}</td>
                    <td style={{ padding: 10 }}>{it.customerName || it.customerEmail}</td>
                    <td style={{ padding: 10 }}>{it.method || it.gateway || '-'}</td>
                    <td style={{ padding: 10, textTransform: 'capitalize' }}>{it.status}</td>
                    <td style={{ padding: 10, textAlign: 'right' }}>{it.currency} {Number(it.amount).toFixed(2)}</td>
                    <td style={{ padding: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button onClick={() => markReceived(it._id)} style={btn('#22c55e')}>Mark Received</button>
                      <button onClick={() => refund(it._id)} style={btn('#ef4444')}>Refund</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
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