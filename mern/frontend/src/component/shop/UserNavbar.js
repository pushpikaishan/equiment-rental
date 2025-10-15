import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { getCartCount } from '../../utils/cart';
// axios was used for notifications polling; removed with notifications feature

const categories = [
  'All',
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
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState(params.get('q') || '');
  const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

  // Check if we're on the home page
  const isHomePage = location.pathname === '/home';

  // User info - you can replace this with actual user data from your auth context/state
  const [userName, setUserName] = useState('User');
  const [userImage, setUserImage] = useState(null);

  // Fetch user info on mount
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.name) setUserName(user.name);
    if (user.image) setUserImage(user.image);
  }, []);

  // Sync search query with URL params
  useEffect(() => {
    setSearchQuery(params.get('q') || '');
  }, [params]);

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Update URL params
    const newParams = new URLSearchParams(params);
    if (value) {
      newParams.set('q', value);
    } else {
      newParams.delete('q');
    }
    setParams(newParams);
  };

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

  // Colors based on page
  const linkColor = isHomePage ? '#ffffff' : '#2563eb';
  const hoverColor = isHomePage ? 'rgba(255, 255, 255, 0.8)' : '#1d4ed8';

  const container = {
    position: isHomePage ? 'absolute' : 'sticky',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    background: isHomePage ? 'transparent' : '#ffffff',
    borderBottom: isHomePage ? 'none' : '1px solid #e5e7eb',
    boxShadow: 'none',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    backdropFilter: 'none',
    transition: 'all 0.3s ease'
  };
  const inner = { 
    maxWidth: 1440, 
    margin: '0 auto', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: '14px 32px', 
    gap: 48,
    minHeight: 60
  };
  const left = { display: 'flex', alignItems: 'center', gap: 32 };
  const right = { display: 'flex', alignItems: 'center', gap: 20 };
  const link = { 
    textDecoration: 'none', 
    color: isHomePage ? '#ffffff' : '#6b7280', 
    padding: '8px 4px', 
    borderRadius: 0, 
    transition: 'color 0.2s ease', 
    border: 'none',
    fontWeight: 500,
    fontSize: 14,
    letterSpacing: '0',
    position: 'relative',
    background: 'transparent'
  };
  const brand = {
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '4px 0',
    borderRadius: 0,
    color: isHomePage ? '#ffffff' : '#2563eb',
    fontWeight: 700,
    letterSpacing: '-0.02em',
    fontSize: 22,
    lineHeight: 1,
    background: 'transparent',
    border: 'none',
    boxShadow: 'none',
    transition: 'none'
  };
  const dropdownButton = {
    padding: '8px 4px',
    borderRadius: 0,
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    transition: 'color 0.2s ease',
    fontSize: 14,
    fontWeight: 500,
    color: isHomePage ? '#ffffff' : '#6b7280',
    letterSpacing: '0',
    boxShadow: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4
  };
  const dropdownMenu = {
    position: 'absolute',
    top: 'calc(100% + 12px)',
    left: 0,
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    boxShadow: '0 10px 40px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.06)',
    padding: 8,
    display: 'block',
    zIndex: 100,
    minWidth: 220,
    backdropFilter: 'none',
    transition: 'opacity 0.15s ease, transform 0.15s ease',
    opacity: 1
  };


  return (
    <div style={container}>
      <div style={inner}>
        <div style={left}>
          <Link to="/home" style={brand} aria-label="Eventrix Home">
            <span style={{ color: isHomePage ? '#ffffff' : '#2563eb', fontWeight: 700 }}>Eventrix</span>
          </Link>
          <Link
            to="/home"
            style={{ ...link, fontWeight: 500 }}
            onFocus={(e) => { e.currentTarget.style.color = hoverColor; }}
            onBlur={(e) => { e.currentTarget.style.color = linkColor; }}
            onMouseOver={(e) => { e.currentTarget.style.color = hoverColor; }}
            onMouseOut={(e) => { e.currentTarget.style.color = linkColor; }}
          >
            Home
          </Link>
          <Link
            to="/suppliers-inventories"
            style={link}
            onFocus={(e) => { e.currentTarget.style.color = hoverColor; }}
            onBlur={(e) => { e.currentTarget.style.color = linkColor; }}
            onMouseOver={(e) => { e.currentTarget.style.color = hoverColor; }}
            onMouseOut={(e) => { e.currentTarget.style.color = linkColor; }}
          >
            Nearby Suppliers
          </Link>
          {isHomePage && (
            <div style={{ 
              position: 'relative', 
              display: 'flex', 
              alignItems: 'center',
              width: 250
            }}>
              <input 
                value={searchQuery} 
                onChange={handleSearchChange} 
                placeholder="Search..." 
                style={{ 
                  padding: '10px 45px 10px 16px', 
                  borderRadius: 25, 
                  border: isHomePage ? '2px solid rgba(255,255,255,0.3)' : '2px solid #3b82f6',
                  background: isHomePage ? 'rgba(255,255,255,0.15)' : '#ffffff',
                  fontSize: 14,
                  fontWeight: 400,
                  color: isHomePage ? '#ffffff' : '#374151',
                  transition: 'all 0.2s ease',
                  width: '100%',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = isHomePage ? 'rgba(255,255,255,0.5)' : '#3b82f6';
                  e.target.style.background = isHomePage ? 'rgba(255,255,255,0.25)' : '#ffffff';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = isHomePage ? 'rgba(255,255,255,0.3)' : '#3b82f6';
                  e.target.style.background = isHomePage ? 'rgba(255,255,255,0.15)' : '#ffffff';
                }}
              />
              <button
                style={{
                  position: 'absolute',
                  right: 4,
                  background: '#3b82f6',
                  border: 'none',
                  borderRadius: '50%',
                  width: 36,
                  height: 36,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(59,130,246,0.3)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#2563eb';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = '#3b82f6';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                onFocus={(e) => {
                  e.currentTarget.style.background = '#2563eb';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.background = '#3b82f6';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                onClick={(e) => {
                  e.preventDefault();
                  // Search is already handled by onChange
                }}
                aria-label="Search"
              >
                <svg 
                  width="18" 
                  height="18" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="white" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
              </button>
            </div>
          )}
          {isHomePage && (
            <div style={{ position: 'relative' }} ref={menuRef}>
              <button
                onClick={() => setOpen((v) => !v)}
                onMouseEnter={() => setOpen(true)}
                style={dropdownButton}
                onFocus={(e) => { e.currentTarget.style.color = hoverColor; }}
                onBlur={(e) => { e.currentTarget.style.color = linkColor; }}
                onMouseOver={(e) => { e.currentTarget.style.color = hoverColor; }}
                onMouseOut={(e) => { e.currentTarget.style.color = linkColor; }}
              >
                Category ▾
              </button>
              {open && (
                <div
                  onMouseLeave={() => setOpen(false)}
                  style={dropdownMenu}
                >
                  {categories.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => goCategory(c)}
                      style={{ 
                        padding: '8px 12px', 
                        borderRadius: 6, 
                        cursor: 'pointer', 
                        background: currentCategory === c ? '#f3f4f6' : 'transparent', 
                        transition: 'background 0.15s ease',
                        fontSize: 14,
                        fontWeight: currentCategory === c ? 500 : 400,
                        color: currentCategory === c ? '#111827' : '#6b7280',
                        border: 'none',
                        width: '100%',
                        textAlign: 'left'
                      }}
                      onFocus={(e) => { e.currentTarget.style.background = '#f3f4f6'; }}
                      onBlur={(e) => { e.currentTarget.style.background = currentCategory === c ? '#f3f4f6' : 'transparent'; }}
                      onMouseOver={(e) => { e.currentTarget.style.background = '#f3f4f6'; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = currentCategory === c ? '#f3f4f6' : 'transparent'; }}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <Link
            to="/bookings"
            style={link}
            onFocus={(e) => { e.currentTarget.style.color = hoverColor; }}
            onBlur={(e) => { e.currentTarget.style.color = linkColor; }}
            onMouseOver={(e) => { e.currentTarget.style.color = hoverColor; }}
            onMouseOut={(e) => { e.currentTarget.style.color = linkColor; }}
          >
            My Bookings
          </Link>
          
          <Link to="/support" style={link} 
            onFocus={(e) => { e.currentTarget.style.color = hoverColor; }} 
            onBlur={(e) => { e.currentTarget.style.color = linkColor; }} 
            onMouseOver={(e) => { e.currentTarget.style.color = hoverColor; }} 
            onMouseOut={(e) => { e.currentTarget.style.color = linkColor; }}>
            Support
          </Link>
        </div>
        <div style={right}>
          <Link to="/notifications" 
            style={{ 
              ...link, 
              position: 'relative',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }} 
            onFocus={(e) => { e.currentTarget.style.color = hoverColor; }} 
            onBlur={(e) => { e.currentTarget.style.color = linkColor; }} 
            onMouseOver={(e) => { e.currentTarget.style.color = hoverColor; }} 
            onMouseOut={(e) => { e.currentTarget.style.color = linkColor; }}
            aria-label="Notifications">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              focusable="false"
            >
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </Link>
          <Link to="/cart" 
            style={{ 
              ...link, 
              position: 'relative',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }} 
            onFocus={(e) => { e.currentTarget.style.color = hoverColor; }} 
            onBlur={(e) => { e.currentTarget.style.color = linkColor; }} 
            onMouseOver={(e) => { e.currentTarget.style.color = hoverColor; }} 
            onMouseOut={(e) => { e.currentTarget.style.color = linkColor; }}
            aria-label="Booking Cart">
            <span style={{ fontSize: 20 }}>🛒</span>
            {count > 0 && (
              <span style={{ 
                position: 'absolute',
                top: 4,
                right: 4,
                background: isHomePage ? 'rgba(255, 255, 255, 0.9)' : '#2563eb', 
                color: isHomePage ? '#2563eb' : '#ffffff', 
                borderRadius: 10, 
                padding: '2px 6px', 
                fontSize: 10, 
                fontWeight: 700,
                minWidth: 18,
                textAlign: 'center',
                lineHeight: '14px',
                border: isHomePage ? '1px solid rgba(255, 255, 255, 1)' : 'none'
              }}>{count}</span>
            )}
          </Link>
          <Link to="/userAccount/profile" 
            style={{ 
              textDecoration: 'none',
              padding: '6px 12px',
              borderRadius: 24,
              background: isHomePage ? 'rgba(255, 255, 255, 0.2)' : '#f3f4f6',
              color: isHomePage ? '#ffffff' : '#111827',
              fontSize: 14,
              fontWeight: 500,
              transition: 'all 0.2s ease',
              border: isHomePage ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }} 
            onFocus={(e) => { 
              e.currentTarget.style.background = isHomePage ? 'rgba(255, 255, 255, 0.3)' : '#e5e7eb'; 
            }} 
            onBlur={(e) => { 
              e.currentTarget.style.background = isHomePage ? 'rgba(255, 255, 255, 0.2)' : '#f3f4f6'; 
            }} 
            onMouseOver={(e) => { 
              e.currentTarget.style.background = isHomePage ? 'rgba(255, 255, 255, 0.3)' : '#e5e7eb'; 
            }} 
            onMouseOut={(e) => { 
              e.currentTarget.style.background = isHomePage ? 'rgba(255, 255, 255, 0.2)' : '#f3f4f6'; 
            }}
            aria-label="User Profile">
            {userImage ? (
              <img 
                src={userImage.startsWith('http') ? userImage : `${baseUrl}${userImage}`}
                alt={userName}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: isHomePage ? '2px solid rgba(255,255,255,0.5)' : '2px solid #cbd5e1'
                }}
              />
            ) : (
              <div style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: isHomePage ? 'rgba(255,255,255,0.3)' : '#cbd5e1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                fontWeight: 600,
                color: isHomePage ? '#ffffff' : '#475569'
              }}>
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
            <span style={{ fontWeight: 500 }}>{userName}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
