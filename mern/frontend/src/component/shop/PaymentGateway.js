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
  const [expMonth, setExpMonth] = useState('');
  const [expYear, setExpYear] = useState('');
  const [cvv, setCvv] = useState('');
  const [processing, setProcessing] = useState(false);
  const [touchedName, setTouchedName] = useState(false);
  const [touchedNumber, setTouchedNumber] = useState(false);
  const [touchedMonth, setTouchedMonth] = useState(false);
  const [touchedYear, setTouchedYear] = useState(false);
  const [touchedCvv, setTouchedCvv] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [cardBrand, setCardBrand] = useState(''); // 'visa' | 'mastercard' | 'maestro' | ''

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

  const validExpiry = (m, y) => {
    const month = Number(m);
    const year = Number(y);
    if (!month || !year) return false;
    if (month < 1 || month > 12) return false;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    if (year < currentYear) return false;
    if (year === currentYear && month < currentMonth) return false;
    return true;
  };

  const isFormValid = useMemo(() => {
    return cardName.trim().length > 1 && luhnCheck(cardNumber) && validExpiry(expMonth, expYear) && /^(\d{3,4})$/.test(cvv);
  }, [cardName, cardNumber, expMonth, expYear, cvv]);

  // Input formatters/handlers
  const onCardNumberChange = (val) => {
    const digits = (val || '').replace(/\D/g, '').slice(0, 19); // allow up to 19 for some brands
    const formatted = digits.replace(/(.{4})/g, '$1 ').trim();
    setCardNumber(formatted);
    // Detect card brand
    const brand = detectBrand(digits);
    setCardBrand(brand);
  };

  const onMonthChange = (val) => {
    setExpMonth(val);
  };
  const onYearChange = (val) => {
    setExpYear(val);
  };

  const onCvvChange = (val) => {
    const digits = (val || '').replace(/\D/g, '').slice(0, 4);
    setCvv(digits);
  };

  const handleSuccess = async () => {
    if (!isFormValid || !acceptedTerms || !booking || chargeAmount <= 0) {
      setTouchedName(true);
      setTouchedNumber(true);
      setTouchedMonth(true);
      setTouchedYear(true);
      setTouchedCvv(true);
      alert('Please complete valid payment details and accept the terms.');
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

  // Card brand detection helper
  function detectBrand(digits) {
    if (!digits) return '';
    // Visa: starts with 4
    if (/^4\d{0,18}$/.test(digits)) return 'visa';
    // MasterCard: 51-55 or 2221-2720
    if (/^(5[1-5]\d{0,14}|2(2(2[1-9]|[3-9]\d)|[3-6]\d{2}|7(0\d|1\d|20))\d{0,10})$/.test(digits)) return 'mastercard';
    // Maestro (broad, EU): 50, 56-69 ranges
    if (/^(50|5[6-9]|6[0-9])\d{0,17}$/.test(digits)) return 'maestro';
    return '';
  }

  return (
    <div>
      <UserNavbar />
      <div style={{ padding: 20, maxWidth: 1100, margin: '0 auto' }}>
        <h2 style={{ margin: 0, marginBottom: 10 }}>Payment Gateway</h2>

        {/* Two-column responsive layout */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, alignItems: 'start' }}>
          {/* Left: Order Summary */}
          <div style={{ padding: 16, border: '1px solid #e2e8f0', borderRadius: 8, background: 'white', margin: 8 }}>
            <h3 style={{ marginTop: 0 }}>Order summary</h3>
            {booking ? (
              <div>
                <div style={{ marginBottom: 8 }}>Booking ID: <code>{booking._id}</code></div>
                <div style={{ marginBottom: 8 }}>Booking date: {new Date(booking.bookingDate).toLocaleDateString()}</div>
                <div style={{ marginBottom: 8 }}>Customer: {booking.customerName} ({booking.customerEmail})</div>
                <div style={{ marginBottom: 8 }}>Delivery address: {booking.deliveryAddress}</div>
                <div style={{ marginTop: 12, fontWeight: 600 }}>Total : {currency} {Number(booking.subtotal).toFixed(2)}</div>
                <div>Security deposit (30%): {currency} {Number(booking.securityDeposit).toFixed(2)}</div>
                <div style={{ marginTop: 12, borderTop: '1px dashed #e5e7eb', paddingTop: 10, fontWeight: 700 }}>Charge amount (Total + Deposit): {currency} {chargeAmount.toFixed(2)}</div>
              </div>
            ) : (
              <div style={{ color: '#dc2626' }}>No booking data found. Return to cart.</div>
            )}
          </div>

          {/* Right: Payment Form */}
          <div style={{ padding: 0, border: '1px solid #e2e8f0', borderRadius: 8, background: 'white', overflow: 'hidden', margin: '8px 12px 8px 8px' }}>
            {/* Header bar similar to screenshot */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 700, color: '#0f172a' }}>Credit & Debit cards</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: '#64748b', marginRight: 8 }}>Transaction fee may apply</span>
                <BrandPill label="VISA" color="#1e3a8a" bg="#dbeafe" />
                <BrandPill label="MasterCard" color="#7c2d12" bg="#ffedd5" />
                <BrandPill label="Maestro" color="#065f46" bg="#d1fae5" />
              </div>
            </div>

            {/* Body form */}
            <div style={{ padding: '16px 24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#64748b' }}>Cardholder Name</label>
                  <input value={cardName} onChange={(e) => setCardName(e.target.value)} onBlur={() => setTouchedName(true)} placeholder="Name on card" style={{ width: '100%', padding: 10, border: '1px solid #cbd5e1', borderRadius: 6, outline: 'none' }} />
                  {touchedName && cardName.trim().length <= 1 && (
                    <div style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>Please enter the name on the card.</div>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#64748b' }}>Card Number</label>
                  <div style={{ position: 'relative' }}>
                    <input value={cardNumber} onChange={(e) => onCardNumberChange(e.target.value)} onBlur={() => setTouchedNumber(true)} placeholder="4242 4242 4242 4242" inputMode="numeric" style={{ width: '100%', padding: '10px 64px 10px 10px', border: '1px solid #cbd5e1', borderRadius: 6, outline: 'none' }} />
                    {/* Brand badge on the right of input */}
                    {cardBrand && (
                      <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, padding: '2px 8px', borderRadius: 12, background: cardBrand === 'visa' ? '#dbeafe' : cardBrand === 'mastercard' ? '#ffedd5' : '#d1fae5', color: cardBrand === 'visa' ? '#1e3a8a' : cardBrand === 'mastercard' ? '#7c2d12' : '#065f46' }}>
                        {cardBrand === 'visa' ? 'VISA' : cardBrand === 'mastercard' ? 'MasterCard' : 'Maestro'}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Use any valid-looking number; Luhn check enforced (e.g., 4242 4242 4242 4242)</div>
                  {touchedNumber && ((cardNumber || '').replace(/\D/g, '').length >= 16) && !luhnCheck(cardNumber) && (
                    <div style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>Enter a valid card number.</div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#64748b' }}>End Date</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <select value={expMonth} onChange={(e) => onMonthChange(e.target.value)} onBlur={() => setTouchedMonth(true)} style={{ width: '100%', padding: 10, border: '1px solid #cbd5e1', borderRadius: 6, outline: 'none' }}>
                        <option value="">mm</option>
                        {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                      <select value={expYear} onChange={(e) => onYearChange(e.target.value)} onBlur={() => setTouchedYear(true)} style={{ width: '100%', padding: 10, border: '1px solid #cbd5e1', borderRadius: 6, outline: 'none' }}>
                        <option value="">yyyy</option>
                        {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() + i).map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                    {(touchedMonth || touchedYear) && !validExpiry(expMonth, expYear) && (
                      <div style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>Enter a valid future date.</div>
                    )}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#64748b' }}>CVV</label>
                    <input value={cvv} onChange={(e) => onCvvChange(e.target.value)} onBlur={() => setTouchedCvv(true)} placeholder="3 or 4 digits" inputMode="numeric" style={{ width: '100%', padding: 10, border: '1px solid #cbd5e1', borderRadius: 6, outline: 'none' }} />
                    {touchedCvv && !/^(\d{3,4})$/.test(cvv) && (
                      <div style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>CVV must be 3 or 4 digits.</div>
                    )}
                  </div>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#0f172a', marginTop: 8 }}>
                  <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} />
                  <span>I have read and accept the terms of use, rules of flight and privacy policy</span>
                </label>

                <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={handleSuccess} disabled={!isFormValid || !acceptedTerms || processing || !booking || chargeAmount <= 0} style={{ background: '#22c55e', color: 'white', border: 'none', padding: '12px 18px', borderRadius: 6, fontWeight: 700, cursor: (!isFormValid || !acceptedTerms || processing || !booking || chargeAmount <= 0) ? 'not-allowed' : 'pointer', opacity: (!isFormValid || !acceptedTerms || processing || !booking || chargeAmount <= 0) ? 0.6 : 1, margin: '8px 4px 8px 4px' }}>
                    {processing ? 'Processing…' : 'Pay Now »'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}

// Small brand pill component
function BrandPill({ label, bg, color }) {
  return (
    <span style={{ background: bg, color, fontSize: 12, padding: '2px 8px', borderRadius: 12, fontWeight: 700 }}>{label}</span>
  );
}
