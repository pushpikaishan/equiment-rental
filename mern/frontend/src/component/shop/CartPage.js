import React, { useEffect, useState } from 'react';
import { getCart, updateQty, removeFromCart, clearCart } from '../../utils/cart';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import UserNavbar from './UserNavbar';
import SiteFooter from '../common/SiteFooter';
import './PaymentPage.css';

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
    const { name, email, phone, deliveryAddress, bookingDate, returnDate, notes, cart } = data;

    // Full name: Required, letters and spaces only, 3–50 characters
    if (!name || name.trim().length === 0) {
      errs.name = 'Full name is required';
    } else if (name.trim().length < 3) {
      errs.name = 'Full name must be at least 3 characters';
    } else if (name.trim().length > 50) {
      errs.name = 'Full name must not exceed 50 characters';
    } else if (!/^[a-zA-Z\s]+$/.test(name.trim())) {
      errs.name = 'Full name must contain only letters and spaces';
    }

    // Email: Required, valid email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || email.trim().length === 0) {
      errs.email = 'Email is required';
    } else if (!emailRegex.test(email.trim())) {
      errs.email = 'Please enter a valid email address';
    }

    // Phone: Required, Sri Lankan format (07XXXXXXXX or +947XXXXXXXX)
    const phoneRegex = /^(?:\+94|0)?7[0-9]{8}$/;
    if (!phone || phone.trim().length === 0) {
      errs.phone = 'Phone number is required';
    } else if (!phoneRegex.test(phone.trim().replace(/[\s-]/g, ''))) {
      errs.phone = 'Enter a valid Sri Lankan mobile (e.g., 07XXXXXXXX or +947XXXXXXXX)';
    }

    // Delivery address: Required, at least 10 characters
    if (!deliveryAddress || deliveryAddress.trim().length === 0) {
      errs.deliveryAddress = 'Delivery address is required';
    } else if (deliveryAddress.trim().length < 10) {
      errs.deliveryAddress = 'Delivery address must be at least 10 characters long';
    }

    // Booking date: Required, must be today or future
    if (!bookingDate) {
      errs.bookingDate = 'Booking date is required';
    } else {
      const bd = new Date(bookingDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (isNaN(bd.getTime())) {
        errs.bookingDate = 'Invalid booking date';
      } else if (bd.getTime() < today.getTime()) {
        errs.bookingDate = 'Booking date must be today or a future date';
      }
    }

    // Return date: Optional, but if filled, must be later than booking date
    if (returnDate) {
      const rd = new Date(returnDate);
      if (isNaN(rd.getTime())) {
        errs.returnDate = 'Invalid return date';
      } else if (bookingDate) {
        const bd = new Date(bookingDate);
        if (rd.getTime() <= bd.getTime()) {
          errs.returnDate = 'Return date must be later than the booking date';
        }
      }
    }

    // Notes: Optional, maximum 300 characters
    if (notes && notes.length > 300) {
      errs.notes = 'Notes must not exceed 300 characters';
    }

    // Cart
    if (!Array.isArray(cart) || cart.length === 0) {
      errs.cart = 'Your cart is empty';
    } else if (cart.some(i => !i || Number(i.qty) <= 0)) {
      errs.cart = 'Item quantities must be at least 1';
    } else {
      // Prevent exceeding available quantity
      const over = cart.filter(i => Number(i.qty) > (Number(i.quantity) || 0));
      if (over.length > 0) {
        errs.cart = `Some items exceed available stock: ${over.map(i => i.name).join(', ')}`;
      }
    }

    return errs;
  };

  // Re-validate on changes
  useEffect(() => {
    setErrors(validate({ name, email, phone, deliveryAddress, bookingDate, returnDate, notes, cart }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, email, phone, deliveryAddress, bookingDate, returnDate, notes, cart]);

  const setFieldTouched = (field) => setTouched(t => ({ ...t, [field]: true }));
  const markAllTouched = () => setTouched({
    name: true,
    email: true,
    phone: true,
    deliveryAddress: true,
    bookingDate: true,
    returnDate: true,
    notes: true,
  });

  useEffect(() => {
    const init = async () => {
      const local = getCart();
      try {
        const res = await axios.get(`${baseUrl}/equipment`);
        const items = res.data?.items || [];
        const map = new Map(items.map(it => [it._id, Number(it.quantity) || 0]));
        const merged = local.map(i => ({ ...i, quantity: map.has(i._id) ? map.get(i._id) : (Number(i.quantity) || 0) }));
        setCart(merged);
      } catch {
        setCart(local);
      }
    };
    init();
  }, [baseUrl]);

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
    const currentErrors = validate({ name, email, phone, deliveryAddress, bookingDate, returnDate, notes, cart });
    setErrors(currentErrors);
    if (Object.keys(currentErrors).length) {
      markAllTouched();
      const firstField = ['name','email','phone','deliveryAddress','bookingDate','returnDate','notes'].find(f => currentErrors[f]);
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
      // Go to payment options page (summary + bank deposit or gateway)
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
      {/* Overlay */}
      <div
        aria-hidden
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, left: 0,
          background: 'rgba(29, 45, 71, 0.75)', pointerEvents: 'none', zIndex: 0,
        }}
      />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <UserNavbar />
        <div className="ppage-container">
          <h2 className="pp-title">Your Booking Cart</h2>
          {cart.length === 0 ? (
            <div className="pp-card" style={{ padding: 20 }}>
              <div className="pp-hint">Your cart is empty.</div>
            </div>
          ) : (
            <div className="ppage-grid" style={{ gridTemplateColumns: '1fr' }}>
              {/* Single combined section */}
              <div className="pp-card">
                <div className="pp-card__header">
                  <div className="pp-section-title">Cart & Booking details</div>
                  <div className="pp-hint">Review items, then provide your details to continue</div>
                </div>
                <div className="pp-card__body">
                  {/* Items table */}
                  <table className="pp-table">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Price / day</th>
                        <th>Qty</th>
                        <th className="right">Subtotal</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart.map((i) => (
                        <tr key={i._id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              {i.image ? (
                                <img src={`http://localhost:5000${i.image}`} alt={i.name} style={{ width: 60, height: 40, objectFit: 'cover', borderRadius: 6 }} />
                              ) : (
                                <div style={{ width: 60, height: 40, background: '#e2e8f0', borderRadius: 6 }} />
                              )}
                              <div>
                                <div style={{ fontWeight: 600 }}>{i.name}</div>
                                <div className="pp-hint" style={{ marginTop: 2 }}>Available: {Number(i.quantity) || 0}</div>
                              </div>
                            </div>
                          </td>
                          <td>LKR {Number(i.price).toFixed(2)}</td>
                          <td>
                            <input
                              type="number"
                              min={1}
                              max={Number(i.quantity) || 1}
                              value={i.qty}
                              onChange={(e) => {
                                const avail = Number(i.quantity) || 0;
                                const raw = Number(e.target.value);
                                const clamped = Math.max(1, Math.min(avail || 1, raw || 1));
                                handleQty(i._id, clamped);
                              }}
                              className="pp-input"
                              style={{ width: 100 }}
                            />
                          </td>
                          <td className="right">LKR {(Number(i.price) * i.qty).toFixed(2)}</td>
                          <td>
                            <button onClick={() => handleRemove(i._id)} className="pp-btn-danger">Remove</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {errors.cart && (<div className="pp-error" style={{ marginTop: 10 }}>{errors.cart}</div>)}

                  {/* Divider to details */}
                  <div style={{ borderTop: '1px solid #e2e8f0', marginTop: 12, paddingTop: 12 }} />

                  {/* Booking form */}
                  <div className="pp-form" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                    <div>
                      <label htmlFor="name" className="pp-label">Full name</label>
                      <input id="name" value={name} onChange={(e) => setName(e.target.value)} onBlur={() => setFieldTouched('name')} placeholder="Your name" className={`pp-input ${touched.name && errors.name ? 'is-error' : touched.name && !errors.name ? 'is-valid' : ''}`} aria-invalid={!!(touched.name && errors.name)} aria-describedby={touched.name && errors.name ? 'name-error' : undefined} />
                      {touched.name && errors.name && (<div id="name-error" className="pp-error">{errors.name}</div>)}
                    </div>
                    <div>
                      <label htmlFor="email" className="pp-label">Email</label>
                      <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => setFieldTouched('email')} placeholder="you@example.com" className={`pp-input ${touched.email && errors.email ? 'is-error' : touched.email && !errors.email ? 'is-valid' : ''}`} aria-invalid={!!(touched.email && errors.email)} aria-describedby={touched.email && errors.email ? 'email-error' : undefined} />
                      {touched.email && errors.email && (<div id="email-error" className="pp-error">{errors.email}</div>)}
                    </div>
                    <div>
                      <label htmlFor="phone" className="pp-label">Phone</label>
                      <input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9+]/g, '');
                          if (value.length <= 10 || (value.startsWith('+94') && value.length <= 12)) {
                            setPhone(value);
                          }
                        }}
                        onBlur={() => setFieldTouched('phone')}
                        placeholder="0712345678"
                        maxLength={12}
                        className={`pp-input ${touched.phone && errors.phone ? 'is-error' : touched.phone && !errors.phone ? 'is-valid' : ''}`}
                        aria-invalid={!!(touched.phone && errors.phone)}
                        aria-describedby={touched.phone && errors.phone ? 'phone-error' : undefined}
                      />
                      {touched.phone && errors.phone && (<div id="phone-error" className="pp-error">{errors.phone}</div>)}
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label htmlFor="deliveryAddress" className="pp-label">Delivery address</label>
                      <input id="deliveryAddress" value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} onBlur={() => setFieldTouched('deliveryAddress')} placeholder="Street, city, additional directions" className={`pp-input ${touched.deliveryAddress && errors.deliveryAddress ? 'is-error' : touched.deliveryAddress && !errors.deliveryAddress ? 'is-valid' : ''}`} aria-invalid={!!(touched.deliveryAddress && errors.deliveryAddress)} aria-describedby={touched.deliveryAddress && errors.deliveryAddress ? 'deliveryAddress-error' : undefined} />
                      {touched.deliveryAddress && errors.deliveryAddress && (<div id="deliveryAddress-error" className="pp-error">{errors.deliveryAddress}</div>)}
                    </div>
                    <div>
                      <label htmlFor="bookingDate" className="pp-label">Booking date</label>
                      <input id="bookingDate" type="date" value={bookingDate} min={todayStr} onChange={(e) => setBookingDate(e.target.value)} onBlur={() => setFieldTouched('bookingDate')} className={`pp-input ${touched.bookingDate && errors.bookingDate ? 'is-error' : touched.bookingDate && !errors.bookingDate ? 'is-valid' : ''}`} aria-invalid={!!(touched.bookingDate && errors.bookingDate)} aria-describedby={touched.bookingDate && errors.bookingDate ? 'bookingDate-error' : undefined} />
                      {touched.bookingDate && errors.bookingDate && (<div id="bookingDate-error" className="pp-error">{errors.bookingDate}</div>)}
                    </div>
                    <div>
                      <label htmlFor="returnDate" className="pp-label">Return date (optional)</label>
                      <input
                        id="returnDate"
                        type="date"
                        value={returnDate}
                        min={bookingDate ? new Date(new Date(bookingDate).getTime() + 86400000).toISOString().slice(0, 10) : undefined}
                        onChange={(e) => setReturnDate(e.target.value)}
                        onBlur={() => setFieldTouched('returnDate')}
                        className={`pp-input ${touched.returnDate && errors.returnDate ? 'is-error' : touched.returnDate && !errors.returnDate ? 'is-valid' : ''}`}
                        aria-invalid={!!(touched.returnDate && errors.returnDate)}
                        aria-describedby={touched.returnDate && errors.returnDate ? 'returnDate-error' : undefined}
                      />
                      {touched.returnDate && errors.returnDate && (<div id="returnDate-error" className="pp-error">{errors.returnDate}</div>)}
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label htmlFor="notes" className="pp-label">
                        Notes (optional)
                        <span style={{ float: 'right', fontSize: 11, color: notes.length > 300 ? '#dc2626' : '#94a3b8' }}>{notes.length}/300</span>
                      </label>
                      <textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        onBlur={() => setFieldTouched('notes')}
                        rows={3}
                        placeholder="Any instructions or notes"
                        className={`pp-input ${touched.notes && errors.notes ? 'is-error' : touched.notes && !errors.notes ? 'is-valid' : ''}`}
                        aria-invalid={!!(touched.notes && errors.notes)}
                        aria-describedby={touched.notes && errors.notes ? 'notes-error' : undefined}
                        maxLength={300}
                      />
                      {touched.notes && errors.notes && (<div id="notes-error" className="pp-error">{errors.notes}</div>)}
                    </div>
                  </div>

                  {/* Totals + actions */}
                  <div style={{ borderTop: '1px solid #e2e8f0', marginTop: 12, paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <button onClick={handleClear} className="pp-btn-danger">Clear Cart</button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div><strong>Total (per day):</strong> LKR {total.toFixed(2)}</div>
                      <div className="pp-hint">Security deposit (30%): <strong>LKR {(total * 0.30).toFixed(2)}</strong></div>
                    </div>
                  </div>

                  <button onClick={createBooking} disabled={creating || cart.length === 0 || !isValid} className="pp-submit" style={{ marginTop: 12 }}>
                    {creating ? 'Creating…' : 'Proceed to Payment'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        <SiteFooter />
      </div>
    </div>
  );
}
