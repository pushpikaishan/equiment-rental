import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { getCartCount } from '../../utils/cart';
// axios was used for notifications polling; removed with notifications feature

const categories = [
  'Lighting',
  'Audio',
  'Camera',
  'Tents & Shelters',
  'Visual & AV Equipment',
  'Stage & Platform Equipment',
  'Furniture',
  'Catering & Dining Equipment',
  'Power & Electrical',
  'Climate Control'
];

export default function UserNavbar() {
  const [count, setCount] = useState(getCartCount());
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

  // Update cart count periodically and on storage events
  useEffect(() => {
    const interval = setInterval(() => setCount(getCartCount()), 1000);
    const onStorage = (e) => { if (e.key === 'cart') setCount(getCartCount()); };
    window.addEventListener('storage', onStorage);
    return () => { clearInterval(interval); window.removeEventListener('storage', onStorage); };
  }, []);

  // Notifications removed per revert request

  // Close on outside click
  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  const currentCategory = useMemo(() => params.get('category') || '', [params]);

  const goCategory = (c) => {
    setOpen(false);
    navigate(`/home?category=${encodeURIComponent(c)}`);
  };

  const container = { position: 'sticky', top: 0, zIndex: 50, background: 'white', borderBottom: '1px solid #e2e8f0' };
  const inner = { maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px' };
  const left = { display: 'flex', alignItems: 'center', gap: 16 };
  const right = { display: 'flex', alignItems: 'center', gap: 12 };
  const link = { textDecoration: 'none', color: '#0f172a', padding: '6px 10px', borderRadius: 8 };

  return (
    <div style={container}>
      <div style={inner}>
        <div style={left}>
          <Link to="/home" style={{ ...link, fontWeight: 700 }}>Home</Link>
          <div style={{ position: 'relative' }} ref={menuRef}>
            <button
              onClick={() => setOpen((v) => !v)}
              onMouseEnter={() => setOpen(true)}
              style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer' }}
            >
              Category ▾
            </button>
            {open && (
              <div
                onMouseLeave={() => setOpen(false)}
                style={{ position: 'absolute', top: '120%', left: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 8px 20px rgba(0,0,0,0.06)', padding: 8, display: 'block', zIndex: 100 }}
              >
                {categories.map((c) => (
                  <div
                    key={c}
                    onClick={() => goCategory(c)}
                    style={{ padding: '6px 10px', borderRadius: 6, cursor: 'pointer', background: currentCategory === c ? '#f1f5f9' : 'transparent' }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#f8fafc'}
                    onMouseOut={(e) => e.currentTarget.style.background = currentCategory === c ? '#f1f5f9' : 'transparent'}
                  >
                    {c}
                  </div>
                ))}
              </div>
            )}
          </div>
          <Link to="/bookings" style={link}>My Bookings</Link>
        </div>
        <div style={right}>
          <Link to="/notifications" style={link}>Notifications</Link>
          <Link to="/cart" style={link}>Booking Cart ({count})</Link>
          <Link to="/support" style={link}>Support</Link>
          <Link to="/userAccount/profile" style={link}>Profile</Link>
        </div>
      </div>
    </div>
  );
}
