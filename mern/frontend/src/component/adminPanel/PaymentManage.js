import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import './PaymentManage.css';
import { headerCard, headerTitle, headerSub } from './adminStyles';

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
  const [refundType, setRefundType] = useState('custom'); // 'custom' | 'deposit' | 'cancel'
  const [successPopup, setSuccessPopup] = useState('');
  const [depositModal, setDepositModal] = useState(null); // holds selected bank deposit payment
  const [depositBusy, setDepositBusy] = useState(false);
  const [activeTab, setActiveTab] = useState('paid'); // 'paid' | 'refunds' | 'supplier'
  // Track last time admin viewed Supplier tab to show only new supplier payments count
  const [supplierLastSeenAt, setSupplierLastSeenAt] = useState(() => {
    const raw = localStorage.getItem('supplierPaymentsLastSeenAt');
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  });

  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const fetchData = async (overrides) => {
    setLoading(true);
    try {
      const nextQ = overrides?.q ?? q;
      const nextPage = overrides?.page ?? page;
      const params = new URLSearchParams({ ...nextQ, page: nextPage, limit: 10 });
      const res = await axios.get(`${baseUrl}/payments?${params.toString()}`, { headers });
      setItems(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (e) {
      console.warn('Payments fetch failed:', e?.response?.data || e?.message || e);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const res = await axios.get(`${baseUrl}/payments/summary`, { headers });
      setSummary(res.data);
    } catch (e) {
      console.warn('Payments summary failed:', e?.response?.data || e?.message || e);
      setSummary(null);
    }
  };

  useEffect(() => { fetchData(); /* eslint-disable-next-line */ }, [page]);
  useEffect(() => { fetchSummary(); /* eslint-disable-next-line */ }, []);

  const switchTab = (tab) => {
    setActiveTab(tab);
    const nextQ = { ...q, status: '' };
    setQ(nextQ);
    setPage(1);
    fetchData({ q: nextQ, page: 1 });
    // When opening Supplier tab, mark as read now
    if (tab === 'supplier') {
      const now = Date.now();
      setSupplierLastSeenAt(now);
      localStorage.setItem('supplierPaymentsLastSeenAt', String(now));
    }
  };

  const markReceived = async (id, method) => {
    await axios.put(`${baseUrl}/payments/${id}/mark-received`, method ? { method } : {}, { headers });
    await fetchData();
  };
  const openDepositModal = (payment) => setDepositModal(payment);
  const closeDepositModal = () => setDepositModal(null);
  // Open a generic refund modal (currently not used; prefer specific helpers below)
  const openCancelFullRefund = (payment) => {
    setRefundModal(payment);
    const amt = Number(payment?.amount || 0);
    setRefundAmount(amt > 0 ? amt.toFixed(2) : '');
    setRefundType('cancel');
  };
  const openDepositRefund = (payment) => {
    setRefundModal(payment);
    const rec = computeRecollect(payment);
    const amt = Number(rec?.suggestedRefund || 0);
    if (amt <= 0) {
      alert('No refundable deposit based on the driver report');
      setRefundModal(null);
      return;
    }
    setRefundAmount(amt.toFixed(2));
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
    if (refundType === 'cancel') body.note = 'Full refund due to cancellation';
    await axios.post(`${baseUrl}/payments/${refundModal._id}/refund`, body, { headers });
    closeRefundModal();
    await fetchData();
    setSuccessPopup('Refund completed');
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

  const statusChip = (status) => {
    if (status === 'paid') return <span className="pm-chip pm-chip--paid">Paid</span>;
    if (status === 'failed') return <span className="pm-chip pm-chip--failed">Failed</span>;
    if (status === 'refunded') return <span className="pm-chip pm-chip--refunded">Refunded</span>;
    if (status === 'partial_refunded') return <span className="pm-chip pm-chip--partial">Partial Refunded</span>;
    return <span className="pm-chip pm-chip--pending">{String(status || 'pending').replace('_',' ')}</span>;
  };

  const bookingChip = (status) => {
    if (status === 'confirmed') return <span className="pm-chip pm-chip--confirmed">Confirmed</span>;
    if (status === 'cancelled') return <span className="pm-chip pm-chip--cancelled">Cancelled</span>;
    return <span className="pm-chip pm-chip--pending">Pending</span>;
  };

  const isSupplierAd = (it) => String(it?.meta?.type || '') === 'supplier_ad';

  // Compute recollect-derived refund values if backend hasn't materialized them
  const computeRecollect = (it) => {
    const r = it?.recollect || {};
    const deposit = Number(r.deposit || 0);
    const estimateTotal = Number(r.estimateTotal || 0);
    const hasReport = r.hasReport === true;
    const depositRefunded = (r.depositRefunded === true) || (it.depositRefunded === true);
    const suggestedRefund = Math.max(0, deposit - estimateTotal);
    return { deposit, estimateTotal, hasReport, suggestedRefund, depositRefunded };
  };

  return (
    <div className="pm-container">
      <div style={headerCard}>
        <h1 style={headerTitle}>Payment Management</h1>
        <p style={headerSub}>Monitor transactions, process refunds, export reports.</p>
        {summary && (
          <div className="pm-metrics">
            <div className="pm-pill">Total revenue: {summary.totalRevenue.toFixed(2)}</div>
            <div className="pm-pill">Monthly: {summary.monthlyRevenue.toFixed(2)}</div>
            <div className="pm-pill">Today: {summary.dailyRevenue.toFixed(2)}</div>
            <div className="pm-pill">By method: {Object.entries(summary.byMethod).map(([m,c]) => `${m}:${c}`).join(', ')}</div>
          </div>
        )}
      </div>

      <div className="pm-card" style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 700, color: '#334155', marginBottom: 8 }}>Payments</div>
        {summary && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8, marginBottom: 8 }}>
            <div className="pm-pill" style={{ justifyContent: 'space-between' }}>
              <span>Paid</span>
              <strong>{summary.countPaid}</strong>
            </div>
            <div className="pm-pill" style={{ justifyContent: 'space-between' }}>
              <span>Refunded</span>
              <strong>{summary.countRefunded}</strong>
            </div>
            <div className="pm-pill" style={{ justifyContent: 'space-between' }}>
              <span>Partial Refunded</span>
              <strong>{summary.countPartialRefunded}</strong>
            </div>
            <div className="pm-pill" style={{ justifyContent: 'space-between' }}>
              <span>Pending</span>
              <strong>{summary.countPending}</strong>
            </div>
            <div className="pm-pill" style={{ justifyContent: 'space-between' }}>
              <span>Bank Deposits Pending</span>
              <strong>{summary.countBankDepositPending}</strong>
            </div>
          </div>
        )}
        <div className="pm-grid-auto" style={{ marginBottom: 8 }}>
          <select value={q.status} onChange={(e) => setQ({ ...q, status: e.target.value })} className="pm-select">
            <option value="">Status</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
            <option value="partial_refunded">Partial Refunded</option>
          </select>
          <select value={q.method} onChange={(e) => setQ({ ...q, method: e.target.value })} className="pm-select">
            <option value="">Method</option>
            <option value="card">Card</option>
            <option value="cash">Cash</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="paypal">PayPal</option>
            <option value="stripe">Stripe</option>
            <option value="payhere">PayHere</option>
          </select>
          <input placeholder="Gateway" value={q.gateway} onChange={(e) => setQ({ ...q, gateway: e.target.value })} className="pm-input" />
          <input placeholder="Customer/email" value={q.customer} onChange={(e) => setQ({ ...q, customer: e.target.value })} className="pm-input" />
          <input placeholder="Order ID" value={q.orderId} onChange={(e) => setQ({ ...q, orderId: e.target.value })} className="pm-input" />
          <input type="date" value={q.from} onChange={(e) => setQ({ ...q, from: e.target.value })} className="pm-input" />
          <input type="date" value={q.to} onChange={(e) => setQ({ ...q, to: e.target.value })} className="pm-input" />
        </div>
        <div className="pm-toolbar">
          <button onClick={() => { setPage(1); fetchData(); }} className="pm-btn pm-btn--info">Apply Filters</button>
          <button onClick={() => { setQ({ status:'', method:'', gateway:'', customer:'', orderId:'', from:'', to:'' }); setPage(1); fetchData(); }} className="pm-btn pm-btn--secondary">Reset</button>
          <div className="pm-spacer" />
          <button onClick={exportCSV} className="pm-btn pm-btn--csv">Export CSV</button>
          <button onClick={exportPDF} className="pm-btn pm-btn--pdf">Export PDF</button>
        </div>
      </div>

      <div className="pm-card">
        {/* Paid / Refunds / Supplier navigation */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
          <button
            onClick={() => switchTab('paid')}
            className="pm-btn"
            style={{
              background: activeTab === 'paid' ? '#0ea5e9' : 'white',
              color: activeTab === 'paid' ? 'white' : '#0f172a',
              border: '1px solid #cbd5e1',
              fontWeight: 700
            }}
          >Paid</button>
          <button
            onClick={() => switchTab('refunds')}
            className="pm-btn"
            style={{
              background: activeTab === 'refunds' ? '#0ea5e9' : 'white',
              color: activeTab === 'refunds' ? 'white' : '#0f172a',
              border: '1px solid #cbd5e1',
              fontWeight: 700,
              position: 'relative'
            }}
          >
            Refunds
            {(() => {
              const count = (items || []).filter(it => {
                if (isSupplierAd(it)) return false;
                const rec = computeRecollect(it);
                const isPaidOrPartial = (it.status === 'paid' || it.status === 'partial_refunded');
                const cancelledCandidate = (it.booking && it.booking.status === 'cancelled' && isPaidOrPartial);
                const depositCandidate = (rec.hasReport && !rec.depositRefunded && rec.suggestedRefund > 0 && isPaidOrPartial);
                return cancelledCandidate || depositCandidate;
              }).length;
              return (
                <span style={{ position: 'absolute', top: -8, right: -8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 18, height: 18, fontSize: 11, lineHeight: '18px', borderRadius: 9999, background: '#ef4444', color: 'white', padding: '0 5px', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }}>{count}</span>
              );
            })()}
          </button>
          <button
            onClick={() => switchTab('supplier')}
            className="pm-btn"
            style={{
              background: activeTab === 'supplier' ? '#0ea5e9' : 'white',
              color: activeTab === 'supplier' ? 'white' : '#0f172a',
              border: '1px solid #cbd5e1',
              fontWeight: 700,
              position: 'relative'
            }}
          >
            Supplier Paid
            {(() => {
              const unread = (items || []).filter(it => {
                if (!isSupplierAd(it)) return false;
                const created = Number(new Date(it.createdAt).getTime());
                return Number.isFinite(created) && created > supplierLastSeenAt;
              }).length;
              if (!unread) return null; // hide when 0
              return (
                <span style={{ position: 'absolute', top: -8, right: -8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 18, height: 18, fontSize: 11, lineHeight: '18px', borderRadius: 9999, background: '#22c55e', color: 'white', padding: '0 5px', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }}>{unread}</span>
              );
            })()}
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="pm-table">
            <thead>
              {activeTab === 'supplier' ? (
                <tr>
                  <th>Created</th>
                  <th>Order</th>
                  <th>Supplier</th>
                  <th>Method</th>
                  <th>Payment Status</th>
                  <th className="text-right">Amount</th>
                  <th>Actions</th>
                </tr>
              ) : (
                <tr>
                  <th>Created</th>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Address</th>
                  <th>Booking Date</th>
                  <th>Booking Status</th>
                  <th>Method</th>
                  <th>Payment Status</th>
                  <th className="text-right">Amount</th>
                  <th>Actions</th>
                </tr>
              )}
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={activeTab === 'supplier' ? 7 : 10}>Loading…</td></tr>
              ) : (() => {
                const visibleItems = (items || []).filter(it => {
                  if (activeTab === 'paid') {
                    return !isSupplierAd(it) && (String(it.status) === 'paid' || (String(it.status) === 'pending' && it.method === 'bank_transfer'));
                  }
                  if (activeTab === 'refunds') {
                    return (
                      String(it.status) === 'refunded' ||
                      String(it.status) === 'partial_refunded' ||
                      (it.booking && it.booking.status === 'cancelled') ||
                      (!isSupplierAd(it) && computeRecollect(it).hasReport === true)
                    );
                  }
                  return isSupplierAd(it);
                });
                if (visibleItems.length === 0) {
                  return (<tr><td colSpan={activeTab === 'supplier' ? 7 : 10}>No payments found for this view.</td></tr>);
                }
                return visibleItems.map((it) => (
                  activeTab === 'supplier' ? (
                    <tr key={it._id}>
                      <td>{new Date(it.createdAt).toLocaleString()}</td>
                      <td>
                        <div><code>{it.orderId || it._id}</code></div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>Supplier Ad Fee{it.meta?.inventoryId ? ` · Ad ID: ${String(it.meta.inventoryId).slice(-6)}` : ''}</div>
                      </td>
                      <td>{it.customerName || it.customerEmail || '-'}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span>{it.method || it.gateway || '-'}</span>
                          <span className="pm-pill">Supplier Ad</span>
                        </div>
                      </td>
                      <td><div>{statusChip(it.status)}</div></td>
                      <td style={{ textAlign: 'right' }}>{it.currency} {Number(it.amount).toFixed(2)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                          {(it.status !== 'paid') && (
                            it.method === 'bank_transfer'
                              ? (<button onClick={() => openDepositModal(it)} className="pm-btn pm-btn--success">Mark Supplier Paid</button>)
                              : (<button onClick={() => markReceived(it._id, it.method)} className="pm-btn pm-btn--success">Mark Supplier Paid</button>)
                          )}
                          <button onClick={() => removePayment(it._id)} className="pm-btn pm-btn--muted">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={it._id}>
                      <td>{new Date(it.createdAt).toLocaleString()}</td>
                      <td>
                        <div><code>{it.orderId || it.bookingId || it._id}</code></div>
                        {isSupplierAd(it) && (
                          <div style={{ fontSize: 12, color: '#64748b' }}>Supplier Ad Fee</div>
                        )}
                      </td>
                      <td>{it.customerName || it.customerEmail || it.booking?.customerName || it.booking?.customerEmail || '-'}</td>
                      <td>{isSupplierAd(it) ? '-' : (it.booking?.deliveryAddress || '-')}</td>
                      <td>{isSupplierAd(it) ? '-' : (it.booking?.bookingDate ? new Date(it.booking.bookingDate).toLocaleDateString() : '-')}</td>
                      <td>
                        {isSupplierAd(it) ? (
                          <span className="pm-chip pm-chip--pending">Supplier Ad</span>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {bookingChip(it.booking?.status)}
                            {(activeTab === 'refunds' && it.booking?.status === 'cancelled' && it.booking?.cancelReason) && (
                              <span style={{ fontSize: 12, color: '#64748b' }}>Reason: {it.booking.cancelReason}</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span>{it.method || it.gateway || '-'}</span>
                          {isSupplierAd(it) && (<span className="pm-pill">Supplier Ad Fee</span>)}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <div>{statusChip(it.status)}</div>
                          {isSupplierAd(it) && (<div style={{ fontSize: 12, color: '#64748b' }}>Supplier Ad Fee</div>)}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>{it.currency} {Number(it.amount).toFixed(2)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                          {(it.status === 'refunded' || it.status === 'partial_refunded') ? (
                            <button onClick={() => removePayment(it._id)} className="pm-btn pm-btn--muted">Delete</button>
                          ) : (
                            (() => {
                              const rec = computeRecollect(it);
                              return (
                                <>
                                  {(!isSupplierAd(it) && it.method === 'bank_transfer' && it.status === 'pending') ? (
                                    <button onClick={() => openDepositModal(it)} className="pm-btn pm-btn--success">View Deposit</button>
                                  ) : (
                                    (!isSupplierAd(it) && it.status !== 'paid' && (
                                      <button onClick={() => markReceived(it._id)} className="pm-btn pm-btn--success">Mark Received</button>
                                    ))
                                  )}
                                  {(activeTab === 'refunds' && !isSupplierAd(it) && it.booking?.status === 'cancelled' && (it.status === 'paid' || it.status === 'partial_refunded')) && (
                                    <button onClick={() => openCancelFullRefund(it)} className="pm-btn pm-btn--refund">Refund</button>
                                  )}
                                  {(() => {
                                    if (activeTab !== 'refunds' || isSupplierAd(it)) return null;
                                    const rec = computeRecollect(it);
                                    if (!rec.hasReport || rec.depositRefunded) return null;
                                    if (!(it.status === 'paid' || it.status === 'partial_refunded' || it.status === 'refunded')) return null;
                                    if (rec.suggestedRefund <= 0) return null;
                                    return (
                                      <button onClick={() => openDepositRefund(it)} className="pm-btn pm-btn--refund">Refund Deposit</button>
                                    );
                                  })()}
                                  <button onClick={() => removePayment(it._id)} className="pm-btn pm-btn--muted">Delete</button>
                                </>
                              );
                            })()
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                ));
              })()}
            </tbody>
          </table>
        </div>

        {/* Refund Modal */}
        {refundModal && (
          <div className="pm-modal">
            <div className="pm-modal__content">
              <h3 className="pm-modal__title">{
                refundType === 'deposit' ? 'Refund Security Deposit' :
                refundType === 'cancel' ? 'Refund Payment (Cancellation)' :
                'Process Refund'
              }</h3>
              <div className="pm-modal__hint">
                {refundType === 'deposit'
                  ? 'Security deposit minus estimate total calculated from recollect report.'
                  : refundType === 'cancel'
                    ? 'Full refund due to booking cancellation.'
                    : 'Confirm customer and amount below.'}
              </div>
              <div className="pm-modal__grid">
                <div>
                  <div className="pm-subtitle" style={{ margin: 0 }}>Customer Name</div>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>{refundModal.booking?.customerName || refundModal.customerName || '-'}</div>
                </div>
                <div>
                  <div className="pm-subtitle" style={{ margin: 0 }}>Customer Email</div>
                  <div>{refundModal.booking?.customerEmail || refundModal.customerEmail || '-'}</div>
                </div>
                <div>
                  <div className="pm-subtitle" style={{ margin: 0 }}>Customer Phone</div>
                  <div>{refundModal.booking?.customerPhone || '-'}</div>
                </div>
                <div>
                  <div className="pm-subtitle" style={{ margin: 0 }}>Address</div>
                  <div>{refundModal.booking?.deliveryAddress || '-'}</div>
                </div>
              </div>
              <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <div className="pm-pill">Paid: <strong>{refundModal.currency} {Number(refundModal.amount || 0).toFixed(2)}</strong></div>
                {refundModal?.recollect?.hasReport && (
                  <>
                    {(() => { const rec = computeRecollect(refundModal); return (
                      <>
                        <div className="pm-pill">Deposit: <strong>{refundModal.currency} {rec.deposit.toFixed(2)}</strong></div>
                        <div className="pm-pill">Estimate: <strong>{refundModal.currency} {rec.estimateTotal.toFixed(2)}</strong></div>
                        <div className="pm-pill">Suggested: <strong>{refundModal.currency} {rec.suggestedRefund.toFixed(2)}</strong></div>
                      </>
                    ); })()}
                  </>
                )}
              </div>
              <div style={{ marginTop: 10 }}>
                <label style={{ display: 'block', color: '#0f172a', fontSize: 12, marginBottom: 6 }}>
                  {refundType === 'deposit'
                    ? 'Refund Amount (calculated)'
                    : refundType === 'cancel'
                      ? 'Full Refund Amount'
                      : 'Refund Amount (leave blank for full)'}
                </label>
                <input type="number" value={refundAmount}
                  onChange={(e) => (refundType !== 'custom') ? null : setRefundAmount(e.target.value)}
                  min="0" step="0.01" className="pm-input" style={{ width: '100%' }}
                  readOnly={refundType !== 'custom'} />
              </div>
              <div className="pm-modal__footer">
                <button onClick={closeRefundModal} className="pm-btn pm-btn--secondary">Cancel</button>
                <button onClick={refund} className="pm-btn pm-btn--refund">{
                  refundType === 'deposit' ? 'Refund Deposit' :
                  refundType === 'cancel' ? 'Refund Payment' :
                  'Proceed'
                }</button>
              </div>
            </div>
          </div>
        )}

        {/* Deposit Details Modal */}
        {depositModal && (
          <div className="pm-modal">
            <div className="pm-modal__content">
              <h3 className="pm-modal__title">{isSupplierAd(depositModal) ? 'Supplier Payment Approval' : 'Bank Deposit Details'}</h3>
              <div className="pm-modal__hint">{isSupplierAd(depositModal) ? 'Verify the payment and mark the supplier ad fee as received.' : 'Verify the depositor information and slip. Mark received to confirm the booking.'}</div>
              <div className="pm-modal__grid" style={{ marginBottom: 8 }}>
                <div>
                  <div className="pm-subtitle" style={{ margin: 0 }}>Order</div>
                  <div><code>{depositModal.orderId || depositModal.bookingId || depositModal._id}</code></div>
                </div>
                <div>
                  <div className="pm-subtitle" style={{ margin: 0 }}>Created</div>
                  <div>{new Date(depositModal.createdAt).toLocaleString()}</div>
                </div>
                <div>
                  <div className="pm-subtitle" style={{ margin: 0 }}>Customer</div>
                  <div>{depositModal.customerName || depositModal.booking?.customerName || '-'}</div>
                </div>
                <div>
                  <div className="pm-subtitle" style={{ margin: 0 }}>Amount</div>
                  <div>{depositModal.currency} {Number(depositModal.amount || 0).toFixed(2)}</div>
                </div>
              </div>
              <div className="pm-card" style={{ padding: 12, marginBottom: 10 }}>
                <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))' }}>
                  <div>
                    <div className="pm-subtitle" style={{ margin: 0 }}>Depositor Name</div>
                    <div>{depositModal.meta?.depositorName || '-'}</div>
                  </div>
                  <div>
                    <div className="pm-subtitle" style={{ margin: 0 }}>Reference No</div>
                    <div>{depositModal.meta?.referenceNo || '-'}</div>
                  </div>
                  <div>
                    <div className="pm-subtitle" style={{ margin: 0 }}>Note</div>
                    <div>{depositModal.meta?.note || '-'}</div>
                  </div>
                </div>
                {depositModal.meta?.slipPath ? (
                  <div style={{ marginTop: 10 }}>
                    <div className="pm-subtitle" style={{ margin: '0 0 6px 0' }}>Deposit Slip</div>
                    <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 6 }}>
                      <img
                        src={`${baseUrl}${depositModal.meta.slipPath}`}
                        alt="Deposit slip"
                        style={{ display: 'block', width: '100%', maxHeight: 240, objectFit: 'contain', borderRadius: 6 }}
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                      <div style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <a href={`${baseUrl}${depositModal.meta.slipPath}`} target="_blank" rel="noreferrer">Open full size</a>
                        <span style={{ fontSize: 12, color: '#64748b' }}>Preview scaled for compact view</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ marginTop: 10, color: '#64748b' }}>No slip provided.</div>
                )}
              </div>
              <div className="pm-modal__footer">
                <button onClick={closeDepositModal} className="pm-btn pm-btn--secondary">Close</button>
                <button
                  onClick={async () => {
                    try {
                      setDepositBusy(true);
                      await markReceived(depositModal._id, 'bank_transfer');
                      setSuccessPopup(isSupplierAd(depositModal) ? 'Supplier payment marked received' : 'Marked received and booking confirmed');
                      setTimeout(() => setSuccessPopup(''), 1500);
                    } catch (e) {
                      alert(e.response?.data?.message || 'Failed to mark received');
                    } finally {
                      setDepositBusy(false);
                      closeDepositModal();
                    }
                  }}
                  className="pm-btn pm-btn--success"
                  disabled={depositBusy}
                >{depositBusy ? 'Processing…' : (isSupplierAd(depositModal) ? 'Mark Supplier Paid' : 'Mark Received & Confirm')}</button>
              </div>
            </div>
          </div>
        )}

        {/* Success Popup */}
        {successPopup && (
          <div className="pm-toast">{successPopup}</div>
        )}

        {/* Pagination */}
        <div className="pm-pagination">
          <div>Page {page} of {Math.max(1, Math.ceil(total / 10))}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="pm-btn pm-btn--secondary">Prev</button>
            <button disabled={page >= Math.ceil(total / 10)} onClick={() => setPage((p) => p + 1)} className="pm-btn pm-btn--secondary">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}