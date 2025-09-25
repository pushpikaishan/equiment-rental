import React, { useEffect, useState } from 'react';
import { getCart, updateQty, removeFromCart, clearCart } from '../../utils/cart';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import UserNavbar from './UserNavbar';
import SiteFooter from '../common/SiteFooter';

export default function CartPage() {
  const [cart, setCart] = useState([]);
  const [bookingDate, setBookingDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');
  // Validation state
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const navigate = useNavigate();
  const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

  // Helpers for validation
  const todayStr = new Date().toISOString().slice(0, 10);
  const validate = (data) => {
    const errs = {};
    const { name, email, phone, deliveryAddress, bookingDate, returnDate, cart } = data;

    // Name
    if (!name || name.trim().length < 2) {
      errs.name = 'Please enter your full name (min 2 characters)';
    }

    // Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      errs.email = 'Please enter a valid email address';
    }

    // Phone (Sri Lanka: 0 or +94 followed by 7XXXXXXXX)
    const digits = (phone || '').replace(/\D/g, '');
    let phoneValid = false;
    if (digits.startsWith('94')) {
      phoneValid = digits.length === 11 && digits[2] === '7';
    } else if (digits.startsWith('0')) {
      phoneValid = digits.length === 10 && digits[1] === '7';
    }
    if (!phoneValid) {
      errs.phone = 'Enter a valid Sri Lankan mobile (e.g., 07XXXXXXXX or +947XXXXXXXX)';
    }

    // Address
    if (!deliveryAddress || deliveryAddress.trim().length < 5) {
      errs.deliveryAddress = 'Please provide your delivery address (min 5 characters)';
    }

    // Dates
    if (!bookingDate) {
      errs.bookingDate = 'Please select a booking date';
    } else {
      const bd = new Date(bookingDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (isNaN(bd.getTime())) {
        errs.bookingDate = 'Invalid booking date';
      } else if (bd.getTime() < today.getTime()) {
        errs.bookingDate = 'Booking date cannot be in the past';
      }
    }
    if (returnDate) {
      const bd = new Date(bookingDate);
      const rd = new Date(returnDate);
      if (isNaN(rd.getTime()) || (bookingDate && rd.getTime() < bd.getTime())) {
        errs.returnDate = 'Return date must be on or after the booking date';
      }
    }

    // Cart
    if (!Array.isArray(cart) || cart.length === 0) {
      errs.cart = 'Your cart is empty';
    } else if (cart.some(i => !i || Number(i.qty) <= 0)) {
      errs.cart = 'Item quantities must be at least 1';
    }

    return errs;
  };

  // Re-validate on changes
  useEffect(() => {
    setErrors(validate({ name, email, phone, deliveryAddress, bookingDate, returnDate, cart }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, email, phone, deliveryAddress, bookingDate, returnDate, cart]);

  const setFieldTouched = (field) => setTouched(t => ({ ...t, [field]: true }));
  const markAllTouched = () => setTouched({
    name: true,
    email: true,
    phone: true,
    deliveryAddress: true,
    bookingDate: true,
    returnDate: true,
  });

  useEffect(() => {
    setCart(getCart());
  }, []);

  const handleQty = (id, q) => {
    const updated = updateQty(id, q);
    setCart([...updated]);
  };

  const handleRemove = (id) => {
    const updated = removeFromCart(id);
    setCart([...updated]);
  };

  const handleClear = () => {
    clearCart();
    setCart([]);
  };

  const total = cart.reduce((sum, i) => sum + (Number(i.price) || 0) * (i.qty || 0), 0);
  const isValid = Object.keys(errors).length === 0;

  const createBooking = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login to create a booking');
      navigate('/');
      return;
    }
    // Final validation before submit
    const currentErrors = validate({ name, email, phone, deliveryAddress, bookingDate, returnDate, cart });
    setErrors(currentErrors);
    if (Object.keys(currentErrors).length) {
      markAllTouched();
      const firstField = ['name','email','phone','deliveryAddress','bookingDate','returnDate'].find(f => currentErrors[f]);
      if (firstField) {
        const el = document.getElementById(firstField);
        if (el && typeof el.scrollIntoView === 'function') el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    const items = cart.map(i => ({ equipmentId: i._id, qty: i.qty }));
    setCreating(true);
    try {
      const res = await axios.post(`${baseUrl}/bookings`, { bookingDate, returnDate: returnDate || undefined, items, customerName: name, customerEmail: email, customerPhone: phone, deliveryAddress, notes }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Navigate to dummy payment gateway with booking data and deposit amount
      const booking = res.data?.booking || res.data;
  const amount = booking?.securityDeposit ?? total * 0.3;
      navigate('/payment', { state: { booking, amount, currency: 'LKR' } });
    } catch (e) {
      const msg = e.response?.data?.message || e.message;
      alert(`Failed to create booking: ${msg}`);
      if (e.response?.status === 401) navigate('/');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <UserNavbar />
      <div style={{ padding: 20, maxWidth: 900, margin: '0 auto' }}>
      <h2>Your Booking Cart</h2>
      {cart.length === 0 ? (
        <div>Your cart is empty.</div>
      ) : (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                <th style={{ textAlign: 'left', padding: 8 }}>Item</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Price / day</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Qty</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Subtotal</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {cart.map((i) => (
                <tr key={i._id} style={{ borderTop: '1px solid #e2e8f0' }}>
                  <td style={{ padding: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {i.image ? (
                      <img src={`http://localhost:5000${i.image}`} alt={i.name} style={{ width: 60, height: 40, objectFit: 'cover', borderRadius: 6 }} />
                    ) : (
                      <div style={{ width: 60, height: 40, background: '#e2e8f0', borderRadius: 6 }} />
                    )}
                    <div>{i.name}</div>
                  </td>
                  <td style={{ padding: 8 }}>LKR {Number(i.price).toFixed(2)}</td>
                  <td style={{ padding: 8 }}>
                    <input type="number" min={1} value={i.qty} onChange={(e) => handleQty(i._id, Math.max(1, Number(e.target.value)))} style={{ width: 80, padding: 6, borderRadius: 6, border: '1px solid #e2e8f0' }} />
                  </td>
                  <td style={{ padding: 8 }}>LKR {(Number(i.price) * i.qty).toFixed(2)}</td>
                  <td style={{ padding: 8 }}>
                    <button onClick={() => handleRemove(i._id)} style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', padding: '6px 10px', borderRadius: 6 }}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Checkout form */}
          <div style={{ marginTop: 20, padding: 12, border: '1px solid #e2e8f0', borderRadius: 8, background: 'white' }}>
            <h3 style={{ marginTop: 0 }}>Booking details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#64748b' }}>Full name</label>
                <input id="name" value={name} onChange={(e) => setName(e.target.value)} onBlur={() => setFieldTouched('name')} placeholder="Your name" style={{ width: '100%', padding: 8, border: `1px solid ${touched.name && errors.name ? '#ef4444' : '#cbd5e1'}`, borderRadius: 6 }} aria-invalid={!!(touched.name && errors.name)} aria-describedby={touched.name && errors.name ? 'name-error' : undefined} />
                {touched.name && errors.name && (
                  <div id="name-error" style={{ color: '#dc2626', fontSize: 12, marginTop: 6 }}>{errors.name}</div>
                )}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#64748b' }}>Email</label>
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => setFieldTouched('email')} placeholder="you@example.com" style={{ width: '100%', padding: 8, border: `1px solid ${touched.email && errors.email ? '#ef4444' : '#cbd5e1'}`, borderRadius: 6 }} aria-invalid={!!(touched.email && errors.email)} aria-describedby={touched.email && errors.email ? 'email-error' : undefined} />
                {touched.email && errors.email && (
                  <div id="email-error" style={{ color: '#dc2626', fontSize: 12, marginTop: 6 }}>{errors.email}</div>
                )}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#64748b' }}>Phone</label>
                <input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} onBlur={() => setFieldTouched('phone')} placeholder="07X-XXXXXXX" style={{ width: '100%', padding: 8, border: `1px solid ${touched.phone && errors.phone ? '#ef4444' : '#cbd5e1'}`, borderRadius: 6 }} aria-invalid={!!(touched.phone && errors.phone)} aria-describedby={touched.phone && errors.phone ? 'phone-error' : undefined} />
                {touched.phone && errors.phone && (
                  <div id="phone-error" style={{ color: '#dc2626', fontSize: 12, marginTop: 6 }}>{errors.phone}</div>
                )}
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 12, color: '#64748b' }}>Delivery address</label>
                <input id="deliveryAddress" value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} onBlur={() => setFieldTouched('deliveryAddress')} placeholder="Street, city, additional directions" style={{ width: '100%', padding: 8, border: `1px solid ${touched.deliveryAddress && errors.deliveryAddress ? '#ef4444' : '#cbd5e1'}`, borderRadius: 6 }} aria-invalid={!!(touched.deliveryAddress && errors.deliveryAddress)} aria-describedby={touched.deliveryAddress && errors.deliveryAddress ? 'deliveryAddress-error' : undefined} />
                {touched.deliveryAddress && errors.deliveryAddress && (
                  <div id="deliveryAddress-error" style={{ color: '#dc2626', fontSize: 12, marginTop: 6 }}>{errors.deliveryAddress}</div>
                )}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#64748b' }}>Booking date</label>
                <input id="bookingDate" type="date" value={bookingDate} min={todayStr} onChange={(e) => setBookingDate(e.target.value)} onBlur={() => setFieldTouched('bookingDate')} style={{ width: '100%', padding: 8, border: `1px solid ${touched.bookingDate && errors.bookingDate ? '#ef4444' : '#cbd5e1'}`, borderRadius: 6 }} aria-invalid={!!(touched.bookingDate && errors.bookingDate)} aria-describedby={touched.bookingDate && errors.bookingDate ? 'bookingDate-error' : undefined} />
                {touched.bookingDate && errors.bookingDate && (
                  <div id="bookingDate-error" style={{ color: '#dc2626', fontSize: 12, marginTop: 6 }}>{errors.bookingDate}</div>
                )}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#64748b' }}>Return date (optional)</label>
                <input
                  id="returnDate"
                  type="date"
                  value={returnDate}
                  min={bookingDate || undefined}
                  onChange={(e) => setReturnDate(e.target.value)}
                  onBlur={() => setFieldTouched('returnDate')}
                  style={{ width: '100%', padding: 8, border: `1px solid ${touched.returnDate && errors.returnDate ? '#ef4444' : '#cbd5e1'}`, borderRadius: 6 }}
                  aria-invalid={!!(touched.returnDate && errors.returnDate)}
                  aria-describedby={touched.returnDate && errors.returnDate ? 'returnDate-error' : undefined}
                />
                {touched.returnDate && errors.returnDate && (
                  <div id="returnDate-error" style={{ color: '#dc2626', fontSize: 12, marginTop: 6 }}>{errors.returnDate}</div>
                )}
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 12, color: '#64748b' }}>Notes (optional)</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Any instructions or notes" style={{ width: '100%', padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }} />
              </div>
            </div>
          </div>

          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button onClick={handleClear} style={{ background: 'white', border: '1px solid #cbd5e1', padding: '8px 12px', borderRadius: 8 }}>Clear Cart</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>Security deposit (30%):</span>
              <strong>LKR {(total * 0.30).toFixed(2)}</strong>
            </div>
            <div style={{ fontWeight: 700 }}>Total (per day): LKR {total.toFixed(2)}</div>
            <button onClick={createBooking} disabled={creating || cart.length === 0 || !isValid} style={{ background: '#16a34a', color: 'white', border: 'none', padding: '10px 16px', borderRadius: 8, opacity: (creating || !isValid) ? 0.8 : 1 }}>{creating ? 'Creating…' : 'Proceed to Payment'}</button>
          </div>
        </>
      )}
      </div>
      <SiteFooter />
    </div>
  );
}
