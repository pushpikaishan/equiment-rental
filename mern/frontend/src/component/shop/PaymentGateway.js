import React, { useMemo, useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import UserNavbar from './UserNavbar';
import SiteFooter from '../common/SiteFooter';
import { clearCart } from '../../utils/cart';

export default function PaymentGateway() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state || {};
  const { booking, amount, currency = 'LKR' } = state;
  const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

  // Dummy card form state
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState(''); // MM/YY
  const [cvv, setCvv] = useState('');
  const [processing, setProcessing] = useState(false);
  const [touchedName, setTouchedName] = useState(false);
  const [touchedNumber, setTouchedNumber] = useState(false);
  const [touchedExpiry, setTouchedExpiry] = useState(false);
  const [touchedCvv, setTouchedCvv] = useState(false);

  const luhnCheck = (num) => {
    const digits = (num || '').replace(/\D/g, '');
    if (digits.length < 12) return false;
    let sum = 0;
    let shouldDouble = false;
    for (let i = digits.length - 1; i >= 0; i--) {
      let d = parseInt(digits[i], 10);
      if (shouldDouble) {
        d *= 2;
        if (d > 9) d -= 9;
      }
      sum += d;
      shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
  };

  const validExpiry = (val) => {
    // Expect MM/YY
    const m = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(val);
    if (!m) return false;
    const month = parseInt(m[1], 10);
    const yearTwo = parseInt(m[2], 10);
    const now = new Date();
    const currentTwo = now.getFullYear() % 100;
    const currentMonth = now.getMonth() + 1;
    if (yearTwo < currentTwo) return false;
    if (yearTwo === currentTwo && month < currentMonth) return false;
    return true;
  };

  const isFormValid = useMemo(() => {
    return cardName.trim().length > 1 && luhnCheck(cardNumber) && validExpiry(expiry) && /^(\d{3,4})$/.test(cvv);
  }, [cardName, cardNumber, expiry, cvv]);

  // Input formatters/handlers
  const onCardNumberChange = (val) => {
    const digits = (val || '').replace(/\D/g, '').slice(0, 16);
    const formatted = digits.replace(/(.{4})/g, '$1 ').trim();
    setCardNumber(formatted);
  };

  const onExpiryChange = (val) => {
    const digits = (val || '').replace(/\D/g, '').slice(0, 4);
    let mm = digits.slice(0, 2);
    let yy = digits.slice(2, 4);
    // Auto-correct month first digit if >1 by prefixing 0 e.g., "9" -> "09"
    if (digits.length === 1 && parseInt(digits, 10) > 1) {
      mm = '0' + digits;
      yy = '';
    }
    const out = yy ? `${mm}/${yy}` : mm;
    setExpiry(out);
  };

  const onCvvChange = (val) => {
    const digits = (val || '').replace(/\D/g, '').slice(0, 4);
    setCvv(digits);
  };

  const handleSuccess = async () => {
    if (!isFormValid || !booking || chargeAmount <= 0) {
      setTouchedName(true);
      setTouchedNumber(true);
      setTouchedExpiry(true);
      setTouchedCvv(true);
      alert('Please enter valid payment details.');
      return;
    }
    setProcessing(true);
    try {
      // Simulate a successful payment; then inform backend to mark booking as confirmed
      const token = localStorage.getItem('token');
      if (token) {
        await axios.post(`${baseUrl}/bookings/${booking._id}/confirm`, {}, { headers: { Authorization: `Bearer ${token}` } });
      }
      alert('Payment successful! Invoice generated for your booking.');
      clearCart();
      navigate('/bookings');
    } catch (e) {
      console.warn('Confirm payment failed, continuing:', e.response?.data || e.message);
      alert('Payment processed, but failed to finalize on server. Your booking may still be pending.');
      navigate('/bookings');
    } finally {
      setProcessing(false);
    }
  };

  const handleFailure = () => {
    alert('Payment failed or cancelled. Your booking remains pending.');
    navigate('/cart');
  };

  const chargeAmount = useMemo(() => {
    const deposit = Number(amount ?? booking?.securityDeposit ?? 0);
    const perDay = Number(booking?.subtotal ?? 0);
    return deposit + perDay;
  }, [amount, booking]);

  return (
    <div>
      <UserNavbar />
      <div style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
        <h2>Test Payment Gateway</h2>
        <p style={{ color: '#64748b' }}>This is a dummy page to simulate a payment provider. Use the buttons below to continue testing.</p>

        <div style={{ marginTop: 16, padding: 16, border: '1px solid #e2e8f0', borderRadius: 8, background: 'white' }}>
          <h3 style={{ marginTop: 0 }}>Order summary</h3>
          {booking ? (
            <div>
              <div style={{ marginBottom: 8 }}>Booking ID: <code>{booking._id}</code></div>
              <div style={{ marginBottom: 8 }}>Booking date: {new Date(booking.bookingDate).toLocaleDateString()}</div>
              <div style={{ marginBottom: 8 }}>Customer: {booking.customerName} ({booking.customerEmail})</div>
              <div style={{ marginBottom: 8 }}>Delivery address: {booking.deliveryAddress}</div>
              <div style={{ marginTop: 12, fontWeight: 600 }}>Total per day: {currency} {Number(booking.subtotal).toFixed(2)}</div>
              <div>Security deposit (10%): {currency} {Number(booking.securityDeposit).toFixed(2)}</div>
            </div>
          ) : (
            <div style={{ color: '#dc2626' }}>No booking data found. Return to cart.</div>
          )}
        </div>

        {/* Dummy card form */}
        <div style={{ marginTop: 16, padding: 16, border: '1px solid #e2e8f0', borderRadius: 8, background: 'white' }}>
          <h3 style={{ marginTop: 0 }}>Card details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#64748b' }}>Cardholder name</label>
              <input value={cardName} onChange={(e) => setCardName(e.target.value)} onBlur={() => setTouchedName(true)} placeholder="Name on card" style={{ width: '100%', padding: 10, border: '1px solid #cbd5e1', borderRadius: 6 }} />
              {touchedName && cardName.trim().length <= 1 && (
                <div style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>Please enter the name on the card.</div>
              )}
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#64748b' }}>Card number</label>
              <input value={cardNumber} onChange={(e) => onCardNumberChange(e.target.value)} onBlur={() => setTouchedNumber(true)} placeholder="4242 4242 4242 4242" inputMode="numeric" style={{ width: '100%', padding: 10, border: '1px solid #cbd5e1', borderRadius: 6 }} />
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Use any valid-looking number; Luhn check enforced (e.g., 4242 4242 4242 4242)</div>
              {touchedNumber && !luhnCheck(cardNumber) && (
                <div style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>Enter a valid card number.</div>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#64748b' }}>Expiry (MM/YY)</label>
                <input value={expiry} onChange={(e) => onExpiryChange(e.target.value)} onBlur={() => setTouchedExpiry(true)} placeholder="MM/YY" inputMode="numeric" style={{ width: '100%', padding: 10, border: '1px solid #cbd5e1', borderRadius: 6 }} />
                {touchedExpiry && !validExpiry(expiry) && (
                  <div style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>Enter a valid future date in MM/YY.</div>
                )}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#64748b' }}>CVV</label>
                <input value={cvv} onChange={(e) => onCvvChange(e.target.value)} onBlur={() => setTouchedCvv(true)} placeholder="3 or 4 digits" inputMode="numeric" style={{ width: '100%', padding: 10, border: '1px solid #cbd5e1', borderRadius: 6 }} />
                {touchedCvv && !/^(\d{3,4})$/.test(cvv) && (
                  <div style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>CVV must be 3 or 4 digits.</div>
                )}
              </div>
            </div>
          </div>
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ fontWeight: 600 }}>Charge amount (Total per day + Deposit): {currency} {chargeAmount.toFixed(2)}</div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={handleSuccess} disabled={!isFormValid || processing || !booking || chargeAmount <= 0} style={{ background: '#16a34a', color: 'white', border: 'none', padding: '10px 16px', borderRadius: 8, opacity: (!isFormValid || processing || !booking || chargeAmount <= 0) ? 0.6 : 1 }}>
                {processing ? 'Processing…' : 'Pay now'}
              </button>
              <button onClick={handleFailure} disabled={processing} style={{ background: '#f59e0b', color: 'white', border: 'none', padding: '10px 16px', borderRadius: 8 }}>Cancel</button>
            </div>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
