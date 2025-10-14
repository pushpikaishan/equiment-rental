import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import UserNavbar from './UserNavbar';
import SiteFooter from '../common/SiteFooter';
import PaymentGateway from './PaymentGateway';

export default function PaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
  const token = localStorage.getItem('token');

  const [booking, setBooking] = useState(location.state?.booking || null);
  const [activeMethod, setActiveMethod] = useState('bank'); // 'bank' | 'gateway'
  const [loading, setLoading] = useState(!location.state?.booking);
  const [error, setError] = useState('');

  // Bank deposit form
  const [depositForm, setDepositForm] = useState({
    depositorName: '',
    referenceNo: '',
    note: '',
    slip: null,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // If booking not provided via state, try loading last created booking (optional)
    const fetchLatest = async () => {
      if (booking) return;
      if (!token) { setLoading(false); return; }
      try {
        setLoading(true);
        // Try to get "my" bookings and pick the latest pending/confirmed
        const res = await axios.get(`${baseUrl}/bookings/my`, { headers: { Authorization: `Bearer ${token}` } });
        const list = res.data?.bookings || [];
        const latest = list.find(b => b.status === 'pending') || list[0] || null;
        setBooking(latest);
      } catch (e) {
        setError(e.response?.data?.message || e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchLatest();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const days = useMemo(() => {
    if (!booking?.bookingDate || !booking?.returnDate) return 1;
    const bd = new Date(booking.bookingDate);
    const rd = new Date(booking.returnDate);
    if (isNaN(bd) || isNaN(rd)) return 1;
    const d = Math.ceil((rd - bd) / (1000 * 60 * 60 * 24));
    return Math.max(1, d);
  }, [booking]);

  const subtotal = useMemo(() => {
    if (!Array.isArray(booking?.items)) return Number(booking?.subtotal) || 0;
    const perDay = booking.items.reduce((sum, it) => sum + (Number(it.pricePerDay) || 0) * (Number(it.qty) || 0), 0);
    return (perDay * days);
  }, [booking, days]);
  const deposit = Number(booking?.securityDeposit ?? Math.round(subtotal * 0.3 * 100) / 100);
  const total = Number(booking?.total ?? subtotal + deposit);
  const fmt = (n) => `LKR ${Number(n || 0).toFixed(2)}`;

  const isCancelled = String(booking?.status || '').toLowerCase() === 'cancelled';

  const submitBankDeposit = async () => {
    if (!booking?._id) { alert('No booking found'); return; }
    if (!depositForm.slip) { alert('Please upload your bank deposit slip'); return; }
    if (!depositForm.depositorName || !depositForm.referenceNo) { alert('Please fill depositor name and reference no.'); return; }
    try {
      setSubmitting(true);
      const fd = new FormData();
      fd.append('bookingId', booking._id);
      fd.append('amount', total);
      fd.append('depositorName', depositForm.depositorName);
      fd.append('referenceNo', depositForm.referenceNo);
      fd.append('note', depositForm.note || '');
      fd.append('slip', depositForm.slip);
      const res = await axios.post(`${baseUrl}/payments/bank-deposit`, fd, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });
      alert(res.data?.message || 'Deposit uploaded successfully. We will verify and confirm your booking.');
      navigate('/bookings');
    } catch (e) {
      const msg = e.response?.data?.message || e.message;
      alert(`Upload failed: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <UserNavbar />
      <div style={{ maxWidth: 1100, margin: '16px auto', padding: '0 12px' }}>
        <h2>Payment</h2>
        {loading && <div>Loading…</div>}
        {error && <div style={{ color: '#dc2626' }}>{error}</div>}

        {!loading && booking && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Left: Order Summary */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, background: '#ffffff' }}>
              <div style={{ padding: 12, borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ fontWeight: 700 }}>Order Summary</div>
                <div style={{ color: '#64748b' }}>Order ID: <code>{booking._id}</code></div>
                <div style={{ color: '#64748b' }}>Status: {booking.status || '-'}</div>
              </div>
              <div style={{ padding: 12 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th style={{ textAlign: 'left', padding: 6 }}>Item</th>
                      <th style={{ textAlign: 'left', padding: 6 }}>Price/day</th>
                      <th style={{ textAlign: 'left', padding: 6 }}>Qty</th>
                      <th style={{ textAlign: 'left', padding: 6 }}>Line total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(booking.items) && booking.items.map((it) => {
                      const price = Number(it.pricePerDay) || 0;
                      const qty = Number(it.qty) || 0;
                      const line = price * qty * days;
                      return (
                        <tr key={it.equipmentId} style={{ borderTop: '1px solid #e2e8f0' }}>
                          <td style={{ padding: 6 }}>{it.name}</td>
                          <td style={{ padding: 6 }}>{fmt(price)}</td>
                          <td style={{ padding: 6 }}>{qty}</td>
                          <td style={{ padding: 6 }}>{fmt(line)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div style={{ borderTop: '1px solid #e2e8f0', marginTop: 8, paddingTop: 8, display: 'grid', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Subtotal</span>
                    <strong>{fmt(subtotal)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Security Deposit</span>
                    <strong>{fmt(deposit)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                    <span>Total</span>
                    <span>{fmt(total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Methods */}
            <div style={{ display: 'grid', gap: 12 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => { setActiveMethod('bank'); }}
                  style={{
                    background: activeMethod === 'bank' ? '#1e293b' : '#ffffff',
                    color: activeMethod === 'bank' ? '#ffffff' : '#1e293b',
                    border: '1px solid #cbd5e1',
                    padding: '8px 12px',
                    borderRadius: 6,
                    flex: 1,
                  }}
                >
                  Bank Deposit
                </button>
                <button
                  onClick={() => { setActiveMethod('gateway'); }}
                  style={{
                    background: activeMethod === 'gateway' ? '#1e293b' : '#ffffff',
                    color: activeMethod === 'gateway' ? '#ffffff' : '#1e293b',
                    border: '1px solid #cbd5e1',
                    padding: '8px 12px',
                    borderRadius: 6,
                    flex: 1,
                  }}
                >
                  Pay Online (Gateway)
                </button>
              </div>

              {activeMethod === 'bank' && (
                <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, background: '#ffffff', padding: 12 }}>
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>Bank Deposit</div>
                  <div style={{ color: '#64748b', marginBottom: 8 }}>
                    Deposit the total to our account and upload the slip. We will verify and confirm your booking.
                  </div>
                  <div style={{ display: 'grid', gap: 8 }}>
                    <div>
                      <label htmlFor="dep-name">Depositor Name</label>
                      <input id="dep-name" type="text" value={depositForm.depositorName} onChange={(e) => setDepositForm({ ...depositForm, depositorName: e.target.value })} style={{ width: '100%' }} />
                    </div>
                    <div>
                      <label htmlFor="dep-ref">Reference No.</label>
                      <input id="dep-ref" type="text" value={depositForm.referenceNo} onChange={(e) => setDepositForm({ ...depositForm, referenceNo: e.target.value })} style={{ width: '100%' }} />
                    </div>
                    <div>
                      <label htmlFor="dep-note">Note (optional)</label>
                      <input id="dep-note" type="text" value={depositForm.note} onChange={(e) => setDepositForm({ ...depositForm, note: e.target.value })} style={{ width: '100%' }} />
                    </div>
                    <div>
                      <label htmlFor="dep-slip">Upload Deposit Slip (JPG, PNG, PDF)</label>
                      <input id="dep-slip" type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => setDepositForm({ ...depositForm, slip: e.target.files?.[0] || null })} />
                    </div>
                    <button
                      onClick={submitBankDeposit}
                      disabled={submitting || isCancelled}
                      style={{ background: '#16a34a', color: 'white', border: 'none', padding: '10px 12px', borderRadius: 6, opacity: (submitting || isCancelled) ? 0.6 : 1 }}
                    >
                      {submitting ? 'Submitting…' : `Submit Deposit (${fmt(total)})`}
                    </button>
                    {isCancelled && <div style={{ color: '#64748b' }}>Booking is cancelled.</div>}
                  </div>
                </div>
              )}

              {activeMethod === 'gateway' && (
                <PaymentGateway embedded booking={booking} amount={booking?.securityDeposit ?? deposit} currency="LKR" onSuccess={() => navigate('/bookings')} onError={() => { /* keep on page */ }} />
              )}
            </div>
          </div>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
