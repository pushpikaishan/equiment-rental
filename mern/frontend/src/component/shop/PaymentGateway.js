import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import UserNavbar from './UserNavbar';
import SiteFooter from '../common/SiteFooter';
import { clearCart } from '../../utils/cart';
import './PaymentGateway.css';

// Reusable gateway component (page or embedded)
export default function PaymentGateway({ embedded = false, booking: bookingProp, amount: amountProp, currency: currencyProp = 'LKR', onSuccess, onError }) {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state || {};
  const booking = bookingProp || state.booking;
  const amount = amountProp ?? state.amount;
  const currency = currencyProp || state.currency || 'LKR';
  const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

  // Form state
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expMonth, setExpMonth] = useState('');
  const [expYear, setExpYear] = useState('');
  const [cvv, setCvv] = useState('');
  const [processing, setProcessing] = useState(false);
  const [touchedName, setTouchedName] = useState(false);
  const [cardNameError, setCardNameError] = useState('');
  const [touchedNumber, setTouchedNumber] = useState(false);
  const [touchedMonth, setTouchedMonth] = useState(false);
  const [touchedYear, setTouchedYear] = useState(false);
  const [touchedCvv, setTouchedCvv] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [cardBrand, setCardBrand] = useState('');

  // Helpers
  const luhnCheck = (num) => {
    const digits = (num || '').replace(/\D/g, '');
    if (digits.length !== 16) return false; // VISA/MC are 16 digits
    let sum = 0;
    let dbl = false;
    for (let i = digits.length - 1; i >= 0; i--) {
      let d = parseInt(digits[i], 10);
      if (dbl) { d *= 2; if (d > 9) d -= 9; }
      sum += d; dbl = !dbl;
    }
    return sum % 10 === 0;
  };

  const validExpiry = (m, y) => {
    const month = Number(m), year = Number(y);
    if (!month || !year || month < 1 || month > 12) return false;
    const now = new Date();
    const cy = now.getFullYear();
    const cm = now.getMonth() + 1;
    if (year < cy) return false;
    if (year === cy && month < cm) return false;
    return true;
  };

  const digitsOnly = (cardNumber || '').replace(/\D/g, '');
  const brand = useMemo(() => detectBrand(digitsOnly), [digitsOnly]);
  const cardLengthOk = digitsOnly.length === 16;
  const cardTypeAccepted = brand === 'visa' || brand === 'mastercard';
  const cardNumberOk = cardLengthOk && cardTypeAccepted && luhnCheck(cardNumber);
  const cvvOk = /^\d{3}$/.test(cvv);

  const onCardNumberChange = (val) => {
    const digits = (val || '').replace(/\D/g, '').slice(0, 16);
    const formatted = digits.replace(/(.{4})/g, '$1 ').trim();
    setCardNumber(formatted);
    setCardBrand(detectBrand(digits));
  };
  const onMonthChange = (val) => setExpMonth(val);
  const onYearChange = (val) => setExpYear(val);
  const onCvvChange = (val) => setCvv((val || '').replace(/\D/g, '').slice(0, 3));

  const chargeAmount = useMemo(() => {
    const deposit = Number(amount ?? booking?.securityDeposit ?? 0);
    const perDay = Number(booking?.subtotal ?? 0);
    return deposit + perDay;
  }, [amount, booking]);

  const handleSuccess = async () => {
    const { valid, error } = validateCardholderName(cardName);
    if (!valid) {
      setTouchedName(true);
      setCardNameError(error);
      console.error('Cardholder name validation failed:', error);
    }
    if (!isFormValid || !acceptedTerms || !booking || chargeAmount <= 0 || !valid) {
      setTouchedName(true); setTouchedNumber(true); setTouchedMonth(true); setTouchedYear(true); setTouchedCvv(true);
      alert('Please complete valid payment details and accept the terms.');
      return;
    }
    setProcessing(true);
    try {
      const token = localStorage.getItem('token');
      if (token) await axios.post(`${baseUrl}/bookings/${booking._id}/confirm`, {}, { headers: { Authorization: `Bearer ${token}` } });
      alert('Payment successful! Invoice generated for your booking.');
      clearCart();
      if (typeof onSuccess === 'function') onSuccess(); else navigate('/bookings');
    } catch (e) {
      console.warn('Confirm payment failed:', e.response?.data || e.message);
      alert('Payment processed, but finalization failed. Your booking may still be pending.');
      if (typeof onError === 'function') onError(e); else navigate('/bookings');
    } finally {
      setProcessing(false);
    }
  };

  const handleFailure = () => {
    alert('Payment failed or cancelled. Your booking remains pending.');
    if (typeof onError === 'function') onError(new Error('Payment failed')); else navigate('/cart');
  };

  // Validation helpers for cardholder name
  const nameAllowedChars = /^[A-Za-z\s\-']*$/; // typing filter
  const nameFormatPattern = /^[A-Za-z]+(?:[-'\s][A-Za-z]+)*$/; // full format

  const sanitizeNameInput = (val) => {
    let s = String(val || '');
    // Remove disallowed characters immediately
    s = s.replace(/[^A-Za-z\s\-']/g, '');
    // Collapse multiple consecutive separators (space, hyphen, apostrophe)
    s = s.replace(/([-'\s])\1+/g, '$1');
    // Remove leading/trailing separators
    s = s.replace(/^[\s-']+/, '').replace(/[\s-']+$/, '');
    // Enforce max length 50
    if (s.length > 50) s = s.slice(0, 50);
    return s;
  };

  const titleCaseName = (val) => {
    // Title-case runs of letters while preserving separators (space, hyphen, apostrophe)
    return String(val || '')
      .toLowerCase()
      .replace(/([A-Za-z])([A-Za-z]*)/g, (_, f, r) => f.toUpperCase() + r);
  };

  const validateCardholderName = (raw) => {
    const original = String(raw || '');
    const value = original.trim();
    if (!value) return { valid: false, error: 'Cardholder name is required' };
    if (value.length < 2) return { valid: false, error: 'Name must be at least 2 characters' };
    if (value.length > 50) return { valid: false, error: 'Name must not exceed 50 characters' };
    if (!nameAllowedChars.test(original)) return { valid: false, error: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
    if (/^[\s-']|[\s-']$/.test(original)) return { valid: false, error: 'Name cannot start or end with spaces or special characters' };
    const letterCount = (value.match(/[A-Za-z]/g) || []).length;
    if (letterCount < 2) return { valid: false, error: 'Name must contain at least two letters' };
    if (/([-'\s])\1/.test(value)) return { valid: false, error: 'Name cannot contain multiple consecutive spaces or special characters' };
    if (!nameFormatPattern.test(value)) return { valid: false, error: 'Please enter a valid name format' };
    return { valid: true, error: '' };
  };

  const nameValidation = useMemo(() => validateCardholderName(cardName), [cardName]);
  const cardNameOk = nameValidation.valid;
  const isFormValid = useMemo(() => (
    cardNameOk && cardNumberOk && validExpiry(expMonth, expYear) && cvvOk && cardTypeAccepted
  ), [cardNameOk, cardNumberOk, expMonth, expYear, cvvOk, cardTypeAccepted]);

  const onCardNameChange = (val) => {
    const sanitized = sanitizeNameInput(val);
    setCardName(sanitized);
    // real-time error status (only when field touched)
    if (touchedName) {
      const { valid, error } = validateCardholderName(sanitized);
      setCardNameError(error);
    }
  };

  const onCardNameBlur = () => {
    setTouchedName(true);
    const formatted = titleCaseName(sanitizeNameInput(cardName).trim().replace(/\s+/g, ' '));
    setCardName(formatted);
    const { valid, error } = validateCardholderName(formatted);
    setCardNameError(error);
    if (!valid) console.warn('Cardholder name validation failed:', error);
  };

  // Render pieces
  const Header = (
    <div className="pg-header">
      <div className="pg-header__title">Credit & Debit cards</div>
      <div className="pg-header__brands">
        <span className="pg-header__hint">Transaction fee may apply</span>
        <BrandPill label="VISA" bg="#dbeafe" color="#1e3a8a" />
        <BrandPill label="MasterCard" bg="#ffedd5" color="#7c2d12" />
      </div>
    </div>
  );

  const Form = (
    <div className="pg-form">
      <div className="pg-form__grid">
        <div className="pg-form__field">
          <label htmlFor="pg-card-name" className="pg-label">
            Cardholder Name {cardNameOk && <span className="pg-valid-icon">✓</span>}
          </label>
          <input 
            id="pg-card-name" 
            value={cardName} 
            onChange={(e) => onCardNameChange(e.target.value)} 
            onBlur={onCardNameBlur} 
            placeholder="e.g., Mary O'Brien"
            className={`pg-input ${touchedName ? (cardNameOk ? 'is-valid' : cardNameError ? 'is-error' : '') : ''}`}
          />
          {touchedName && !cardNameOk && (
            <div className="pg-error">{cardNameError || 'Please enter the name on the card.'}</div>
          )}
          {touchedName && cardNameOk && cardName && !/\s/.test(cardName) && (
            <div className="pg-hint">Tip: enter your full name as it appears on the card.</div>
          )}
        </div>
        
        <div className="pg-form__field">
          <label htmlFor="pg-card-number" className="pg-label">
            Card Number {cardNumberOk && <span className="pg-valid-icon">✓</span>}
          </label>
          <div className="pg-input-wrapper">
            <input
              id="pg-card-number"
              value={cardNumber}
              onChange={(e) => onCardNumberChange(e.target.value)}
              onBlur={() => setTouchedNumber(true)}
              placeholder="XXXX XXXX XXXX XXXX"
              inputMode="numeric"
              maxLength={19}
              className={`pg-input ${touchedNumber && !cardNumberOk ? 'is-error' : cardNumberOk ? 'is-valid' : ''}`}
              style={{ paddingRight: brand ? '80px' : '16px' }}
            />
            {brand && (
              <span 
                className="pg-card-brand" 
                style={{ 
                  background: brand === 'visa' ? '#dbeafe' : '#ffedd5', 
                  color: brand === 'visa' ? '#1e3a8a' : '#7c2d12' 
                }}
              >
                {brand === 'visa' ? 'VISA' : 'MasterCard'}
              </span>
            )}
          </div>
          {touchedNumber && (!cardLengthOk) && (
            <div className="pg-error">Card number must be 16 digits</div>
          )}
          {touchedNumber && cardLengthOk && !cardTypeAccepted && (
            <div className="pg-error">Card type not accepted</div>
          )}
          {touchedNumber && cardLengthOk && cardTypeAccepted && !luhnCheck(cardNumber) && (
            <div className="pg-error">Invalid card number (failed Luhn check)</div>
          )}
        </div>
        
        <div className="pg-expiry-grid">
          <div className="pg-form__field">
            <label htmlFor="pg-exp-month" className="pg-label">Expiration Date</label>
            <div className="pg-expiry-inputs">
              <select 
                id="pg-exp-month" 
                value={expMonth} 
                onChange={(e) => onMonthChange(e.target.value)} 
                onBlur={() => setTouchedMonth(true)} 
                className="pg-select"
              >
                <option value="">mm</option>
                {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <select 
                id="pg-exp-year" 
                value={expYear} 
                onChange={(e) => onYearChange(e.target.value)} 
                onBlur={() => setTouchedYear(true)} 
                className="pg-select"
              >
                <option value="">yyyy</option>
                {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() + i).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            {(touchedMonth || touchedYear) && !validExpiry(expMonth, expYear) && (
              <div className="pg-error">Card has expired</div>
            )}
          </div>
          
          <div className="pg-form__field">
            <label htmlFor="pg-cvv" className="pg-label">
              CVV {cvvOk && <span className="pg-valid-icon">✓</span>}
            </label>
            <input 
              id="pg-cvv" 
              value={cvv} 
              type="password" 
              maxLength={3} 
              onChange={(e) => onCvvChange(e.target.value)} 
              onBlur={() => setTouchedCvv(true)} 
              placeholder="- - -" 
              inputMode="numeric" 
              className={`pg-input ${touchedCvv && !cvvOk ? 'is-error' : cvvOk ? 'is-valid' : ''}`}
            />
            {touchedCvv && !cvvOk && (
              <div className="pg-error">CVV must be 3 digits</div>
            )}
          </div>
        </div>
        
        <div className="pg-checkbox-wrapper">
          <input 
            type="checkbox" 
            id="pg-terms"
            checked={acceptedTerms} 
            onChange={(e) => setAcceptedTerms(e.target.checked)} 
            className="pg-checkbox"
          />
          <label htmlFor="pg-terms" className="pg-checkbox-label">
            I have read and accept the terms of use, rules of flight and privacy policy
          </label>
        </div>
        
        <div className="pg-button-wrapper">
          <button 
            onClick={handleSuccess} 
            disabled={!isFormValid || !acceptedTerms || processing || !booking || chargeAmount <= 0} 
            className="pg-button"
          >
            {processing ? 'Processing…' : 'Pay Now »'}
          </button>
        </div>
      </div>
    </div>
  );

  if (embedded) {
    return (
      <div className="pg-embedded">
        {Header}
        {Form}
      </div>
    );
  }

  return (
    <div>
      <UserNavbar />
      <div style={{ padding: 20, maxWidth: 1100, margin: '0 auto' }}>
        <h2 style={{ margin: 0, marginBottom: 10 }}>Payment Gateway</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, alignItems: 'start' }}>
          <div style={{ padding: 16, border: '1px solid #e2e8f0', borderRadius: 8, background: 'white', margin: 8 }}>
            <h3 style={{ marginTop: 0 }}>Order summary</h3>
            {booking ? (
              <div>
                <div style={{ marginBottom: 8 }}>Booking ID: <code>{booking._id}</code></div>
                <div style={{ marginBottom: 8 }}>Booking date: {new Date(booking.bookingDate).toLocaleDateString()}</div>
                <div style={{ marginBottom: 8 }}>Customer: {booking.customerName} ({booking.customerEmail})</div>
                <div style={{ marginBottom: 8 }}>Delivery address: {booking.deliveryAddress}</div>
                <div style={{ marginTop: 12, fontWeight: 600 }}>Total per day: {currency} {Number(booking.subtotal).toFixed(2)}</div>
                <div>Security deposit (30%): {currency} {Number(booking.securityDeposit).toFixed(2)}</div>
                <div style={{ marginTop: 12, borderTop: '1px dashed #e5e7eb', paddingTop: 10, fontWeight: 700 }}>Charge amount (Per day + Deposit): {currency} {chargeAmount.toFixed(2)}</div>
              </div>
            ) : (
              <div style={{ color: '#dc2626' }}>No booking data found. Return to cart.</div>
            )}
          </div>
          <div style={{ padding: 0, border: '1px solid #e2e8f0', borderRadius: 8, background: 'white', overflow: 'hidden', margin: '8px 12px 8px 8px' }}>
            {Header}
            {Form}
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}

function detectBrand(digits) {
  if (!digits) return '';
  if (/^4\d{0,15}$/.test(digits)) return 'visa';
  // MasterCard: 51-55 or 2221-2720
  if (/^(5[1-5]\d{0,14}|2(2(2[1-9]|[3-9]\d)|[3-6]\d{2}|7(0\d|1\d|20))\d{0,10})$/.test(digits)) return 'mastercard';
  return '';
}

function BrandPill({ label, bg, color }) {
  return <span className="pg-brand-pill" style={{ background: bg, color }}>{label}</span>;
}

PaymentGateway.propTypes = {
  embedded: PropTypes.bool,
  booking: PropTypes.object,
  amount: PropTypes.number,
  currency: PropTypes.string,
  onSuccess: PropTypes.func,
  onError: PropTypes.func,
};

BrandPill.propTypes = {
  label: PropTypes.string.isRequired,
  bg: PropTypes.string,
  color: PropTypes.string,
};
