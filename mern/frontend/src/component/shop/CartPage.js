import React, { useEffect, useState } from 'react';
import { getCart, updateQty, removeFromCart, clearCart } from '../../utils/cart';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import UserNavbar from './UserNavbar';
import SiteFooter from '../common/SiteFooter';

export default function CartPage() {
  const [cart, setCart] = useState([]);
  const [bookingDate, setBookingDate] = useState('');
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');
  const navigate = useNavigate();
  const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

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

  const createBooking = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login to create a booking');
      navigate('/');
      return;
    }
    if (!bookingDate) {
      alert('Please select a booking date');
      return;
    }
    const items = cart.map(i => ({ equipmentId: i._id, qty: i.qty }));
    if (!name || !email || !phone || !deliveryAddress) {
      alert('Please fill your name, email, phone, and delivery address');
      return;
    }
    setCreating(true);
    try {
      const res = await axios.post(`${baseUrl}/bookings`, { bookingDate, items, customerName: name, customerEmail: email, customerPhone: phone, deliveryAddress, notes }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Navigate to dummy payment gateway with booking data and deposit amount
      const booking = res.data?.booking || res.data;
      const amount = booking?.securityDeposit ?? total * 0.1;
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
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" style={{ width: '100%', padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#64748b' }}>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={{ width: '100%', padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#64748b' }}>Phone</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07X-XXXXXXX" style={{ width: '100%', padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 12, color: '#64748b' }}>Delivery address</label>
                <input value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} placeholder="Street, city, additional directions" style={{ width: '100%', padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#64748b' }}>Booking date</label>
                <input id="bookingDate" type="date" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} style={{ width: '100%', padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }} />
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
              <span>Security deposit (10%):</span>
              <strong>LKR {(total * 0.10).toFixed(2)}</strong>
            </div>
            <div style={{ fontWeight: 700 }}>Total (per day): LKR {total.toFixed(2)}</div>
            <button onClick={createBooking} disabled={creating || cart.length === 0} style={{ background: '#16a34a', color: 'white', border: 'none', padding: '10px 16px', borderRadius: 8, opacity: creating ? 0.8 : 1 }}>{creating ? 'Creating…' : 'Proceed to Payment'}</button>
          </div>
        </>
      )}
      </div>
      <SiteFooter />
    </div>
  );
}
