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

  const container = {
    position: 'sticky',
    top: 0,
    zIndex: 50,
    background: 'rgba(255,255,255,0.92)',
    borderBottom: '1px solid rgba(226,232,240,0.6)',
    backdropFilter: 'saturate(180%) blur(20px)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.08), 0 1px 0 rgba(255,255,255,0.5) inset',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
  };
  const inner = { 
    maxWidth: 1200, 
    margin: '0 auto', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: '12px 20px', 
    gap: 16,
    minHeight: 64
  };
  const left = { display: 'flex', alignItems: 'center', gap: 20 };
  const right = { display: 'flex', alignItems: 'center', gap: 16 };
  const link = { 
    textDecoration: 'none', 
    color: '#1e293b', 
    padding: '8px 14px', 
    borderRadius: 12, 
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
    border: '1px solid transparent',
    fontWeight: 500,
    fontSize: 14,
    letterSpacing: '-0.025em',
    position: 'relative'
  };
  const brand = {
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '6px 12px',
    borderRadius: 16,
    color: '#0f172a',
    fontWeight: 800,
    letterSpacing: '-0.5px',
    fontSize: 20,
    lineHeight: 1,
    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    border: '1px solid rgba(148,163,184,0.2)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08), 0 1px 0 rgba(255,255,255,0.8) inset',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
  };
  const dropdownButton = {
    padding: '8px 14px',
    borderRadius: 12,
    border: '1px solid rgba(226,232,240,0.8)',
    background: 'rgba(255,255,255,0.8)',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    fontSize: 14,
    fontWeight: 500,
    color: '#374151',
    letterSpacing: '-0.025em',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
  };
  const dropdownMenu = {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    left: 0,
    background: 'rgba(255,255,255,0.95)',
    border: '1px solid rgba(226,232,240,0.6)',
    borderRadius: 16,
    boxShadow: '0 20px 60px rgba(0,0,0,0.12), 0 8px 25px rgba(0,0,0,0.08)',
    padding: 12,
    display: 'block',
    zIndex: 100,
    minWidth: 240,
    backdropFilter: 'saturate(180%) blur(20px)',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    opacity: 1
  };


  return (
    <div style={container}>
      <div style={inner}>
        <div style={left}>
          <Link to="/home" style={brand} aria-label="Eventrix Home"
            onMouseOver={(e) => { 
              e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'; 
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15), 0 3px 12px rgba(14,165,233,0.2)'; 
              e.currentTarget.style.background = 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)';
            }}
            onMouseOut={(e) => { 
              e.currentTarget.style.transform = 'none'; 
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08), 0 1px 0 rgba(255,255,255,0.8) inset'; 
              e.currentTarget.style.background = 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)';
            }}
          >
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 28,
              height: 28,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              color: 'white',
              fontSize: 16,
              fontWeight: 800,
              boxShadow: '0 4px 12px rgba(59,130,246,0.4), 0 2px 4px rgba(0,0,0,0.1) inset'
            }}>E</span>
            <span style={{ background: 'linear-gradient(135deg, #1e293b, #475569)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Eventrix
            </span>
          </Link>
          <Link
            to="/home"
            style={{ ...link, fontWeight: 600 }}
            onMouseOver={(e) => { 
              e.currentTarget.style.background = 'rgba(59,130,246,0.08)'; 
              e.currentTarget.style.borderColor = 'rgba(59,130,246,0.2)'; 
              e.currentTarget.style.color = '#2563eb';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseOut={(e) => { 
              e.currentTarget.style.background = 'transparent'; 
              e.currentTarget.style.borderColor = 'transparent'; 
              e.currentTarget.style.color = '#1e293b';
              e.currentTarget.style.transform = 'none';
            }}
          >
            Home
          </Link>
          <div style={{ position: 'relative' }} ref={menuRef}>
            <button
              onClick={() => setOpen((v) => !v)}
              onMouseEnter={() => setOpen(true)}
              style={dropdownButton}
              onMouseOver={(e) => { 
                e.currentTarget.style.background = 'rgba(59,130,246,0.08)'; 
                e.currentTarget.style.borderColor = 'rgba(59,130,246,0.2)';
                e.currentTarget.style.color = '#2563eb';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseOut={(e) => { 
                e.currentTarget.style.background = 'rgba(255,255,255,0.8)'; 
                e.currentTarget.style.borderColor = 'rgba(226,232,240,0.8)';
                e.currentTarget.style.color = '#374151';
                e.currentTarget.style.transform = 'none';
              }}
            >
              Category ▾
            </button>
            {open && (
              <div
                onMouseLeave={() => setOpen(false)}
                style={dropdownMenu}
              >
                {categories.map((c) => (
                  <div
                    key={c}
                    onClick={() => goCategory(c)}
                    style={{ 
                      padding: '10px 14px', 
                      borderRadius: 10, 
                      cursor: 'pointer', 
                      background: currentCategory === c ? 'rgba(59,130,246,0.1)' : 'transparent', 
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      fontSize: 14,
                      fontWeight: currentCategory === c ? 600 : 500,
                      color: currentCategory === c ? '#2563eb' : '#374151',
                      border: currentCategory === c ? '1px solid rgba(59,130,246,0.2)' : '1px solid transparent'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = currentCategory === c ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.08)';
                      e.currentTarget.style.transform = 'translateX(2px)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = currentCategory === c ? 'rgba(59,130,246,0.1)' : 'transparent';
                      e.currentTarget.style.transform = 'none';
                    }}
                  >
                    {c}
                  </div>
                ))}
              </div>
            )}
          </div>
          <Link
            to="/bookings"
            style={link}
            onMouseOver={(e) => { 
              e.currentTarget.style.background = 'rgba(59,130,246,0.08)'; 
              e.currentTarget.style.borderColor = 'rgba(59,130,246,0.2)'; 
              e.currentTarget.style.color = '#2563eb';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseOut={(e) => { 
              e.currentTarget.style.background = 'transparent'; 
              e.currentTarget.style.borderColor = 'transparent'; 
              e.currentTarget.style.color = '#1e293b';
              e.currentTarget.style.transform = 'none';
            }}
          >
            My Bookings
          </Link>
        </div>
        <div style={right}>
          <Link to="/notifications" style={link} 
            onMouseOver={(e) => { 
              e.currentTarget.style.background = 'rgba(59,130,246,0.08)'; 
              e.currentTarget.style.borderColor = 'rgba(59,130,246,0.2)'; 
              e.currentTarget.style.color = '#2563eb';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }} 
            onMouseOut={(e) => { 
              e.currentTarget.style.background = 'transparent'; 
              e.currentTarget.style.borderColor = 'transparent'; 
              e.currentTarget.style.color = '#1e293b';
              e.currentTarget.style.transform = 'none';
            }}>
            Notifications
          </Link>
          <Link to="/cart" style={{ ...link, position: 'relative' }} 
            onMouseOver={(e) => { 
              e.currentTarget.style.background = 'rgba(59,130,246,0.08)'; 
              e.currentTarget.style.borderColor = 'rgba(59,130,246,0.2)'; 
              e.currentTarget.style.color = '#2563eb';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }} 
            onMouseOut={(e) => { 
              e.currentTarget.style.background = 'transparent'; 
              e.currentTarget.style.borderColor = 'transparent'; 
              e.currentTarget.style.color = '#1e293b';
              e.currentTarget.style.transform = 'none';
            }}>
            Booking Cart
            <span style={{ 
              marginLeft: 8, 
              background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', 
              color: 'white', 
              borderRadius: 999, 
              padding: '4px 10px', 
              fontSize: 12, 
              fontWeight: 600,
              boxShadow: '0 2px 8px rgba(59,130,246,0.3)',
              minWidth: 20,
              textAlign: 'center'
            }}>{count}</span>
          </Link>
          <Link to="/support" style={link} 
            onMouseOver={(e) => { 
              e.currentTarget.style.background = 'rgba(59,130,246,0.08)'; 
              e.currentTarget.style.borderColor = 'rgba(59,130,246,0.2)'; 
              e.currentTarget.style.color = '#2563eb';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }} 
            onMouseOut={(e) => { 
              e.currentTarget.style.background = 'transparent'; 
              e.currentTarget.style.borderColor = 'transparent'; 
              e.currentTarget.style.color = '#1e293b';
              e.currentTarget.style.transform = 'none';
            }}>
            Support
          </Link>
          <Link to="/userAccount/profile" style={link} 
            onMouseOver={(e) => { 
              e.currentTarget.style.background = 'rgba(59,130,246,0.08)'; 
              e.currentTarget.style.borderColor = 'rgba(59,130,246,0.2)'; 
              e.currentTarget.style.color = '#2563eb';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }} 
            onMouseOut={(e) => { 
              e.currentTarget.style.background = 'transparent'; 
              e.currentTarget.style.borderColor = 'transparent'; 
              e.currentTarget.style.color = '#1e293b';
              e.currentTarget.style.transform = 'none';
            }}>
            Profile
          </Link>
        </div>
      </div>
    </div>
  );
}
