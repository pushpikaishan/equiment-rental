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
  const [refundModal, setRefundModal] = useState(null); // holds selected payment
  const [refundAmount, setRefundAmount] = useState('');
  const [refundType, setRefundType] = useState('custom'); // 'custom' | 'deposit'
  const [successPopup, setSuccessPopup] = useState('');

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
  const openRefundModal = (payment) => {
    setRefundModal(payment);
    setRefundAmount('');
    setRefundType('custom');
  };
  const openDepositRefund = (payment) => {
    setRefundModal(payment);
    const amt = Number(payment?.recollect?.suggestedRefund || 0);
    setRefundAmount(amt > 0 ? amt.toFixed(2) : '');
    setRefundType('deposit');
  };
  const closeRefundModal = () => {
    setRefundModal(null);
    setRefundAmount('');
  };
  const refund = async () => {
    if (!refundModal) return;
    const body = {};
    if (refundAmount) body.amount = Number(refundAmount);
    if (refundType === 'deposit') body.note = 'Security deposit refund after recollect report';
    await axios.post(`${baseUrl}/payments/${refundModal._id}/refund`, body, { headers });
    closeRefundModal();
    await fetchData();
    setSuccessPopup('Refund processed successfully');
    setTimeout(() => setSuccessPopup(''), 2000);
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
                <th style={{ padding: 10 }}>Created</th>
                <th style={{ padding: 10 }}>Order</th>
                <th style={{ padding: 10 }}>Customer</th>
                <th style={{ padding: 10 }}>Address</th>
                <th style={{ padding: 10 }}>Booking Date</th>
                <th style={{ padding: 10 }}>Booking Status</th>
                <th style={{ padding: 10 }}>Method</th>
                <th style={{ padding: 10 }}>Payment Status</th>
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
                    <td style={{ padding: 10 }}><code>{it.orderId || it.bookingId || it._id}</code></td>
                    <td style={{ padding: 10 }}>{it.customerName || it.customerEmail || it.booking?.customerName || it.booking?.customerEmail || '-'}</td>
                    <td style={{ padding: 10 }}>{it.booking?.deliveryAddress || '-'}</td>
                    <td style={{ padding: 10 }}>{it.booking?.bookingDate ? new Date(it.booking.bookingDate).toLocaleDateString() : '-'}</td>
                    <td style={{ padding: 10 }}>
                      <span style={{
                        textTransform: 'capitalize',
                        padding: '2px 8px',
                        borderRadius: 9999,
                        background: it.booking?.status === 'cancelled' ? '#fee2e2' : it.booking?.status === 'confirmed' ? '#dcfce7' : '#e2e8f0',
                        color: it.booking?.status === 'cancelled' ? '#dc2626' : it.booking?.status === 'confirmed' ? '#166534' : '#334155',
                        fontWeight: 600,
                        fontSize: 12
                      }}>{it.booking?.status || '-'}</span>
                    </td>
                    <td style={{ padding: 10 }}>{it.method || it.gateway || '-'}</td>
                    <td style={{ padding: 10, textTransform: 'capitalize' }}>{it.status}</td>
                    <td style={{ padding: 10, textAlign: 'right' }}>{it.currency} {Number(it.amount).toFixed(2)}</td>
                    <td style={{ padding: 10, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                      {/* Determine refund state */}
                      {!(it.status === 'paid' || it.status === 'refunded' || it.status === 'partial_refunded') && (
                        <button onClick={() => markReceived(it._id)} style={btn('#22c55e')}>Mark Received</button>
                      )}
                      {(it.booking?.status === 'cancelled' && !(it.status === 'refunded' || it.status === 'partial_refunded')) && (
                        <button onClick={() => openRefundModal(it)} style={btn('#ef4444')}>Refund</button>
                      )}
                      {/* Refund deposit after recollect report */}
                      {(it?.recollect?.suggestedRefund > 0 && !(it.status === 'refunded' || it.status === 'partial_refunded')) && (
                        <button onClick={() => openDepositRefund(it)} style={btn('#0ea5e9')}>Refund Deposit</button>
                      )}
                      {(it.status === 'refunded' || it.status === 'partial_refunded') && (
                        <span style={{
                          background: it.status === 'refunded' ? '#dcfce7' : '#fef3c7',
                          color: it.status === 'refunded' ? '#166534' : '#92400e',
                          padding: '4px 10px',
                          borderRadius: 9999,
                          fontWeight: 600,
                          fontSize: 12
                        }}>{it.depositRefunded ? 'Security Deposit Refunded' : (it.status === 'refunded' ? 'Refunded' : 'Partial Refunded')}</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Refund Modal */}
        {refundModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
            <div style={{ background: 'white', padding: 20, borderRadius: 12, width: 480 }}>
              <h3 style={{ marginTop: 0 }}>{refundType === 'deposit' ? 'Refund Security Deposit' : 'Process Refund'}</h3>
              <div style={{ marginBottom: 10, color: '#64748b' }}>
                {refundType === 'deposit' ? 'Security deposit minus estimate total calculated from recollect report.' : 'Confirm customer and amount below.'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 10, marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>Customer Name</div>
                  <div style={{ fontWeight: 600 }}>{refundModal.booking?.customerName || refundModal.customerName || '-'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>Customer Email</div>
                  <div>{refundModal.booking?.customerEmail || refundModal.customerEmail || '-'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>Customer Phone</div>
                  <div>{refundModal.booking?.customerPhone || '-'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>Address</div>
                  <div>{refundModal.booking?.deliveryAddress || '-'}</div>
                </div>
              </div>
              <div style={{ marginTop: 8 }}>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 10px' }}>
                    <span style={{ color: '#64748b', fontSize: 12, marginRight: 6 }}>Paid Amount</span>
                    <strong>{refundModal.currency} {Number(refundModal.amount || 0).toFixed(2)}</strong>
                  </div>
                  {refundModal?.recollect?.hasReport && (
                    <>
                      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 10px' }}>
                        <span style={{ color: '#64748b', fontSize: 12, marginRight: 6 }}>Security Deposit</span>
                        <strong>{refundModal.currency} {Number(refundModal.recollect.deposit || 0).toFixed(2)}</strong>
                      </div>
                      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 10px' }}>
                        <span style={{ color: '#64748b', fontSize: 12, marginRight: 6 }}>Estimate Total</span>
                        <strong>{refundModal.currency} {Number(refundModal.recollect.estimateTotal || 0).toFixed(2)}</strong>
                      </div>
                      <div style={{ background: '#ecfeff', border: '1px solid #a5f3fc', borderRadius: 8, padding: '8px 10px' }}>
                        <span style={{ color: '#0891b2', fontSize: 12, marginRight: 6 }}>Suggested Refund</span>
                        <strong>{refundModal.currency} {Number(refundModal.recollect.suggestedRefund || 0).toFixed(2)}</strong>
                      </div>
                    </>
                  )}
                </div>
                <label style={{ display: 'block', fontSize: 12, color: '#334155', marginBottom: 6 }}>
                  {refundType === 'deposit' ? 'Refund Amount (calculated)' : 'Refund Amount (leave blank for full)'}
                </label>
                <input type="number" value={refundAmount}
                  onChange={(e) => refundType === 'deposit' ? null : setRefundAmount(e.target.value)}
                  min="0" step="0.01" style={{ width: '100%', padding: 10, border: '1px solid #e2e8f0', borderRadius: 8 }}
                  readOnly={refundType === 'deposit'} />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 14 }}>
                <button onClick={closeRefundModal} style={btn('#64748b')}>Cancel</button>
                <button onClick={refund} style={btn('#ef4444')}>{refundType === 'deposit' ? 'Refund Deposit' : 'Proceed'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Success Popup */}
        {!!successPopup && (
          <div style={{ position: 'fixed', right: 20, bottom: 20, background: '#22c55e', color: 'white', padding: '10px 14px', borderRadius: 8, boxShadow: '0 10px 20px rgba(0,0,0,0.15)' }}>
            {successPopup}
          </div>
        )}

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