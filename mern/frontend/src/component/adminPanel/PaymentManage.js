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
  const removePayment = async (id) => {
    if (!window.confirm('Delete this payment? This cannot be undone.')) return;
    try {
      await axios.delete(`${baseUrl}/payments/${id}`, { headers });
      await fetchData();
      setSuccessPopup('Payment deleted');
      setTimeout(() => setSuccessPopup(''), 1500);
    } catch (e) {
      alert('Failed to delete payment');
    }
  };

  const card = 'bg-white dark:bg-[var(--surface)] rounded-2xl shadow-md border border-gray-200 dark:border-[var(--border)] p-5';
  const input = 'px-3 py-2 border border-gray-300 dark:border-[var(--border)] rounded-md bg-white dark:bg-[var(--surface-2)] text-gray-800 dark:text-[var(--text)] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500';
  const select = input;
  const btn = (extra) => `inline-flex items-center justify-center px-3 py-2 rounded-md font-semibold text-white shadow-sm ${extra}`;

  return (
    <div>
      <div className={`${card} mb-4`}>
        <h2 className="m-0 text-2xl font-bold text-gray-900 dark:text-[var(--text)]">Payment Management</h2>
        <p className="text-sm text-gray-500 mt-1">Monitor transactions, process refunds, export reports.</p>
        {summary && (
          <div className="flex flex-wrap gap-3 mt-2">
            <div className={`${input}`}>Total revenue: {summary.totalRevenue.toFixed(2)}</div>
            <div className={`${input}`}>Monthly: {summary.monthlyRevenue.toFixed(2)}</div>
            <div className={`${input}`}>Today: {summary.dailyRevenue.toFixed(2)}</div>
            <div className={`${input}`}>By method: {Object.entries(summary.byMethod).map(([m,c]) => `${m}:${c}`).join(', ')}</div>
          </div>
        )}
      </div>

      <div className={`${card} mb-4`}>
        <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
          <select value={q.status} onChange={(e) => setQ({ ...q, status: e.target.value })} className={select}>
            <option value="">Status</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
            <option value="partial_refunded">Partial Refunded</option>
          </select>
          <select value={q.method} onChange={(e) => setQ({ ...q, method: e.target.value })} className={select}>
            <option value="">Method</option>
            <option value="card">Card</option>
            <option value="cash">Cash</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="paypal">PayPal</option>
            <option value="stripe">Stripe</option>
            <option value="payhere">PayHere</option>
          </select>
          <input placeholder="Gateway" value={q.gateway} onChange={(e) => setQ({ ...q, gateway: e.target.value })} className={input} />
          <input placeholder="Customer/email" value={q.customer} onChange={(e) => setQ({ ...q, customer: e.target.value })} className={input} />
          <input placeholder="Order ID" value={q.orderId} onChange={(e) => setQ({ ...q, orderId: e.target.value })} className={input} />
          <input type="date" value={q.from} onChange={(e) => setQ({ ...q, from: e.target.value })} className={input} />
          <input type="date" value={q.to} onChange={(e) => setQ({ ...q, to: e.target.value })} className={input} />
        </div>
        <div className="mt-2 flex gap-2 items-center">
          <button onClick={() => { setPage(1); fetchData(); }} className={btn('bg-sky-600 hover:bg-sky-700')}>Apply Filters</button>
          <button onClick={() => { setQ({ status:'', method:'', gateway:'', customer:'', orderId:'', from:'', to:'' }); setPage(1); fetchData(); }} className={btn('bg-slate-500 hover:bg-slate-600')}>Reset</button>
          <div className="ml-auto flex gap-2">
            <button onClick={exportCSV} className={btn('bg-emerald-600 hover:bg-emerald-700')}>Export CSV</button>
            <button onClick={exportPDF} className={btn('bg-amber-500 hover:bg-amber-600')}>Export PDF</button>
          </div>
        </div>
      </div>

      <div className={`${card}`}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left border-b border-gray-200 dark:border-[var(--border)]">
                <th className="p-2">Created</th>
                <th className="p-2">Order</th>
                <th className="p-2">Customer</th>
                <th className="p-2">Address</th>
                <th className="p-2">Booking Date</th>
                <th className="p-2">Booking Status</th>
                <th className="p-2">Method</th>
                <th className="p-2">Payment Status</th>
                <th className="p-2 text-right">Amount</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="10" className="p-2">Loading…</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan="10" className="p-2">No payments found.</td></tr>
              ) : (
                items.map((it) => (
                  <tr key={it._id} className="border-b border-gray-100 dark:border-[var(--border)]">
                    <td className="p-2">{new Date(it.createdAt).toLocaleString()}</td>
                    <td className="p-2"><code>{it.orderId || it.bookingId || it._id}</code></td>
                    <td className="p-2">{it.customerName || it.customerEmail || it.booking?.customerName || it.booking?.customerEmail || '-'}</td>
                    <td className="p-2">{it.booking?.deliveryAddress || '-'}</td>
                    <td className="p-2">{it.booking?.bookingDate ? new Date(it.booking.bookingDate).toLocaleDateString() : '-'}</td>
                    <td className="p-2">
                      <span className={`capitalize px-2 py-0.5 rounded-full text-xs font-semibold ${it.booking?.status === 'cancelled' ? 'bg-red-100 text-red-600' : it.booking?.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
                        {it.booking?.status || '-'}
                      </span>
                    </td>
                    <td className="p-2">{it.method || it.gateway || '-'}</td>
                    <td className="p-2 capitalize">{it.status}</td>
                    <td className="p-2 text-right">{it.currency} {Number(it.amount).toFixed(2)}</td>
                    <td className="p-2">
                      <div className="flex gap-1 flex-wrap items-center">
                      {/* Determine refund state */}
                      {!(it.status === 'paid' || it.status === 'refunded' || it.status === 'partial_refunded') && (
                        <button onClick={() => markReceived(it._id)} className={btn('bg-emerald-600 hover:bg-emerald-700')}>Mark Received</button>
                      )}
                      {(it.booking?.status === 'cancelled' && !(it.status === 'refunded' || it.status === 'partial_refunded')) && (
                        <button onClick={() => openRefundModal(it)} className={btn('bg-rose-600 hover:bg-rose-700')}>Refund</button>
                      )}
                      {/* Refund deposit after recollect report */}
                      {(it?.recollect?.suggestedRefund > 0 && !(it.status === 'refunded' || it.status === 'partial_refunded')) && (
                        <button onClick={() => openDepositRefund(it)} className={btn('bg-sky-600 hover:bg-sky-700')}>Refund Deposit</button>
                      )}
                      {(it.status === 'refunded' || it.status === 'partial_refunded') && (
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${it.status === 'refunded' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {it.depositRefunded ? 'Security Deposit Refunded' : (it.status === 'refunded' ? 'Refunded' : 'Partial Refunded')}
                        </span>
                      )}
                      <button onClick={() => removePayment(it._id)} className={btn('bg-slate-700 hover:bg-slate-800')}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Refund Modal */}
        {refundModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-[var(--surface)] p-5 rounded-xl w-[480px] border border-gray-200 dark:border-[var(--border)]">
              <h3 className="mt-0 text-lg font-bold">{refundType === 'deposit' ? 'Refund Security Deposit' : 'Process Refund'}</h3>
              <div className="mb-2 text-slate-500 text-sm">
                {refundType === 'deposit' ? 'Security deposit minus estimate total calculated from recollect report.' : 'Confirm customer and amount below.'}
              </div>
              <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))' }}>
                <div>
                  <div className="text-xs text-slate-400">Customer Name</div>
                  <div className="font-semibold">{refundModal.booking?.customerName || refundModal.customerName || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Customer Email</div>
                  <div>{refundModal.booking?.customerEmail || refundModal.customerEmail || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Customer Phone</div>
                  <div>{refundModal.booking?.customerPhone || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Address</div>
                  <div>{refundModal.booking?.deliveryAddress || '-'}</div>
                </div>
              </div>
              <div className="mt-2">
                <div className="flex gap-3 flex-wrap mb-2">
                  <div className="bg-slate-50 dark:bg-[var(--surface-2)] border border-gray-200 dark:border-[var(--border)] rounded-md px-3 py-2">
                    <span className="text-xs text-slate-500 mr-2">Paid Amount</span>
                    <strong>{refundModal.currency} {Number(refundModal.amount || 0).toFixed(2)}</strong>
                  </div>
                  {refundModal?.recollect?.hasReport && (
                    <>
                      <div className="bg-slate-50 dark:bg-[var(--surface-2)] border border-gray-200 dark:border-[var(--border)] rounded-md px-3 py-2">
                        <span className="text-xs text-slate-500 mr-2">Security Deposit</span>
                        <strong>{refundModal.currency} {Number(refundModal.recollect.deposit || 0).toFixed(2)}</strong>
                      </div>
                      <div className="bg-slate-50 dark:bg-[var(--surface-2)] border border-gray-200 dark:border-[var(--border)] rounded-md px-3 py-2">
                        <span className="text-xs text-slate-500 mr-2">Estimate Total</span>
                        <strong>{refundModal.currency} {Number(refundModal.recollect.estimateTotal || 0).toFixed(2)}</strong>
                      </div>
                      <div className="bg-cyan-50 border border-cyan-200 rounded-md px-3 py-2">
                        <span className="text-xs text-cyan-700 mr-2">Suggested Refund</span>
                        <strong>{refundModal.currency} {Number(refundModal.recollect.suggestedRefund || 0).toFixed(2)}</strong>
                      </div>
                    </>
                  )}
                </div>
                <label className="block text-xs text-slate-700 dark:text-[var(--text)] mb-1">
                  {refundType === 'deposit' ? 'Refund Amount (calculated)' : 'Refund Amount (leave blank for full)'}
                </label>
                <input type="number" value={refundAmount}
                  onChange={(e) => refundType === 'deposit' ? null : setRefundAmount(e.target.value)}
                  min="0" step="0.01" className="w-full px-3 py-2 border border-gray-300 dark:border-[var(--border)] rounded-md"
                  readOnly={refundType === 'deposit'} />
              </div>
              <div className="flex gap-2 justify-end mt-3">
                <button onClick={closeRefundModal} className={btn('bg-slate-500 hover:bg-slate-600')}>Cancel</button>
                <button onClick={refund} className={btn('bg-rose-600 hover:bg-rose-700')}>{refundType === 'deposit' ? 'Refund Deposit' : 'Proceed'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Success Popup */}
        {!!successPopup && (
          <div className="fixed right-5 bottom-5 bg-emerald-600 text-white px-3 py-2 rounded-md shadow-xl">
            {successPopup}
          </div>
        )}

        {/* Pagination */}
        <div className="mt-2 flex items-center justify-between">
          <div>Page {page} of {Math.max(1, Math.ceil(total / 10))}</div>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className={btn('bg-slate-500 hover:bg-slate-600 disabled:opacity-50')}>Prev</button>
            <button disabled={page >= Math.ceil(total / 10)} onClick={() => setPage((p) => p + 1)} className={btn('bg-slate-500 hover:bg-slate-600 disabled:opacity-50')}>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}