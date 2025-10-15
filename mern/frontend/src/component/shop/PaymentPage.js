import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import UserNavbar from './UserNavbar';
import SiteFooter from '../common/SiteFooter';
import PaymentGateway from './PaymentGateway';
import './PaymentPage.css';

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
  const [nameError, setNameError] = useState('');
  const [refError, setRefError] = useState('');
  const [slipError, setSlipError] = useState('');

  // Simple name validator: letters and spaces only, 2-60 chars, at least two letters
  const isValidName = (val) => {
    const v = String(val || '').trim();
    if (v.length < 2 || v.length > 60) return false;
    // Only letters and spaces
    if (!/^[A-Za-z ]+$/.test(v)) return false;
    // Require at least 2 letters
    const letters = v.replace(/[^A-Za-z]/g, '');
    if (letters.length < 2) return false;
    // No multiple consecutive spaces
    if (/ {2,}/.test(v)) return false;
    return true;
  };

  // Reference number: alphanumeric only, length 6-15
  const isValidRef = (val) => {
    const v = String(val || '').trim();
    return /^[A-Za-z0-9]{6,15}$/.test(v);
  };

  // Slip validation: require file; allow jpg/jpeg/png/pdf; optionally up to 10MB
  const isValidSlip = (file) => {
    if (!file) return false;
    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowed.includes(file.type)) return false;
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size <= 0 || file.size > maxSize) return false;
    return true;
  };

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
    if (!isValidSlip(depositForm.slip)) { setSlipError('Upload JPG, PNG, or PDF (max 10MB)'); return; }
    // Validate depositor name strictly
    if (!isValidName(depositForm.depositorName)) { setNameError('Enter a valid name (letters and spaces, 2+ characters)'); return; }
  if (!isValidRef(depositForm.referenceNo)) { setRefError('Reference should be 6-15 letters/numbers only'); return; }
    try {
      setSubmitting(true);
      const fd = new FormData();
      fd.append('bookingId', booking._id);
      fd.append('amount', total);
      fd.append('depositorName', String(depositForm.depositorName || '').trim());
  fd.append('referenceNo', String(depositForm.referenceNo || '').trim().toUpperCase());
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
    <div 
      className="ppage"
      style={{
        position: 'relative',
        minHeight: '100vh',
        backgroundImage: "url('/logback.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Semi-transparent overlay for readability */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          background: 'rgba(29, 45, 71, 0.75)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      
      <div style={{ position: 'relative', zIndex: 1 }}>
        <UserNavbar />
        <div className="ppage-container">
        <h2 className="pp-title">Payment</h2>
        {loading && <div className="pp-hint" style={{ color: '#ffffff' }}>Loading…</div>}
        {error && <div style={{ color: '#dc2626' }}>{error}</div>}

        {!loading && booking && (
          <div className="ppage-grid">
            {/* Left: Order Summary */}
            <div className="pp-card">
              <div className="pp-card__header">
                <div className="pp-section-title">Order Summary</div>
                <div className="pp-hint">Order ID: <code className="pp-mono">{booking._id}</code></div>
                <div className="pp-hint">Status: {booking.status || '-'}</div>
              </div>
              <div className="pp-card__body">
                <table className="pp-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th className="right">Price/day</th>
                      <th>Qty</th>
                      <th className="right">Line total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(booking.items) && booking.items.map((it) => {
                      const price = Number(it.pricePerDay) || 0;
                      const qty = Number(it.qty) || 0;
                      const line = price * qty * days;
                      return (
                        <tr key={it.equipmentId}>
                          <td>{it.name}</td>
                          <td className="right">{fmt(price)}</td>
                          <td>{qty}</td>
                          <td className="right">{fmt(line)}</td>
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
              <div className="pp-tabs">
                <button onClick={() => { setActiveMethod('bank'); }} className={`pp-tab ${activeMethod === 'bank' ? 'is-active' : ''}`}>Bank Deposit</button>
                <button onClick={() => { setActiveMethod('gateway'); }} className={`pp-tab ${activeMethod === 'gateway' ? 'is-active' : ''}`}>Pay Online (Gateway)</button>
              </div>

              {activeMethod === 'bank' && (
                <div className="pp-card" style={{ padding: 12 }}>
                  <div className="pp-section-title" style={{ marginBottom: 8 }}>Bank Deposit</div>
                  <div className="pp-hint" style={{ marginBottom: 8 }}>
                    Deposit the total to our account and upload the slip. We will verify and confirm your booking.
                  </div>
                  <div className="pp-form">
                    <div>
                      <label className="pp-label" htmlFor="dep-name">Depositor Name {isValidName(depositForm.depositorName) && <span style={{ color: '#16a34a', marginLeft: 6 }}>✓</span>}</label>
                      <input
                        id="dep-name"
                        type="text"
                        value={depositForm.depositorName}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDepositForm({ ...depositForm, depositorName: val });
                          if (val && !isValidName(val)) setNameError('Only letters and spaces, 2-60 characters');
                          else setNameError('');
                        }}
                        onBlur={(e) => {
                          const val = e.target.value;
                          if (!isValidName(val)) setNameError('Enter a valid name (letters and spaces, 2+ characters)');
                        }}
                        placeholder="e.g., John Doe"
                        className={`pp-input ${nameError ? 'is-error' : isValidName(depositForm.depositorName) ? 'is-valid' : ''}`}
                      />
                      {nameError && <div className="pp-error" style={{ animation: 'fadeIn 0.3s ease' }}>{nameError}</div>}
                    </div>
                    <div>
                      <label className="pp-label" htmlFor="dep-ref">Reference No. {isValidRef(depositForm.referenceNo) && <span style={{ color: '#16a34a', marginLeft: 6 }}>✓</span>}</label>
                      <input
                        id="dep-ref"
                        type="text"
                        value={depositForm.referenceNo}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDepositForm({ ...depositForm, referenceNo: val.toUpperCase() });
                          if (val && !isValidRef(val)) setRefError('Reference should be 6-15 letters/numbers only');
                          else setRefError('');
                        }}
                        onBlur={(e) => { const val = e.target.value; if (!isValidRef(val)) setRefError('Reference should be 6-15 letters/numbers only'); }}
                        placeholder="e.g., ABC12345"
                        className={`pp-input ${refError ? 'is-error' : isValidRef(depositForm.referenceNo) ? 'is-valid' : ''}`}
                        style={{ textTransform: 'uppercase' }}
                      />
                      {refError && <div className="pp-error" style={{ animation: 'fadeIn 0.3s ease' }}>{refError}</div>}
                    </div>
                    <div>
                      <label className="pp-label" htmlFor="dep-note">Note (optional)</label>
                      <input id="dep-note" type="text" value={depositForm.note} onChange={(e) => setDepositForm({ ...depositForm, note: e.target.value })} className="pp-input" />
                    </div>
                    <div>
                      <label className="pp-label" htmlFor="dep-slip">Upload Deposit Slip (JPG, PNG, PDF) {isValidSlip(depositForm.slip) && <span style={{ color: '#16a34a', marginLeft: 6 }}>✓</span>}</label>
                      <input
                        id="dep-slip"
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setDepositForm({ ...depositForm, slip: file });
                          if (!isValidSlip(file)) setSlipError('Upload JPG, PNG, or PDF (max 10MB)'); else setSlipError('');
                        }}
                        className={`pp-file ${slipError ? 'is-error' : isValidSlip(depositForm.slip) ? 'is-valid' : ''}`}
                      />
                      {depositForm.slip && (
                        <div className={`pp-hint ${isValidSlip(depositForm.slip) ? 'pp-hint--success' : ''}`} style={{ marginTop: 4 }}>
                          {depositForm.slip.name} · {(depositForm.slip.size / 1024).toFixed(0)} KB
                        </div>
                      )}
                      {slipError && <div className="pp-error" style={{ animation: 'fadeIn 0.3s ease' }}>{slipError}</div>}
                    </div>
                    {(() => {
                      const disabled = submitting || isCancelled || !isValidName(depositForm.depositorName) || !isValidRef(depositForm.referenceNo) || !isValidSlip(depositForm.slip);
                      return (
                        <button onClick={submitBankDeposit} disabled={disabled} className="pp-submit">
                          {submitting ? (<><span className="pp-spinner" />Submitting…</>) : `Submit Deposit (${fmt(total)})`}
                        </button>
                      );
                    })()}
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
    </div>
  );
}
