import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import UserNavbar from './UserNavbar';
import SiteFooter from '../common/SiteFooter';

const categories = [
  'Categories',
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

export default function SuppliersInventoryList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');
  const [district, setDistrict] = useState('');
  // New: details modal state
  const [showDetails, setShowDetails] = useState(false);
  const [detailsItem, setDetailsItem] = useState(null);
  const [showReq, setShowReq] = useState(false);
  const [reqItem, setReqItem] = useState(null);
  const [reqQty, setReqQty] = useState(1);
  const [reqDate, setReqDate] = useState('');
  const [reqReturn, setReqReturn] = useState('');
  const [reqName, setReqName] = useState('');
  const [reqEmail, setReqEmail] = useState('');
  const [reqPhone, setReqPhone] = useState('');
  const [reqAddress, setReqAddress] = useState('');
  const [reqNotes, setReqNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = {};
        if (q) params.q = q;
        if (cat && cat !== 'All') params.category = cat;
        if (district) params.district = district;
        const res = await axios.get(`${baseUrl}/supplier-inventories/public`, { params });
        setItems(res.data.items || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [baseUrl, q, cat, district]);

  const filtered = useMemo(() => {
    // Server already filters, but keep client filter for responsiveness
    return (items || []).filter((it) => {
      const matchQ = q ? (it.name?.toLowerCase().includes(q.toLowerCase()) || it.description?.toLowerCase().includes(q.toLowerCase())) : true;
      const matchCat = cat === 'All' ? true : it.category === cat;
      const matchDistrict = district ? (it.district || '').toLowerCase() === district.toLowerCase() : true;
      return matchQ && matchCat && matchDistrict;
    });
  }, [items, q, cat, district]);

  const districts = useMemo(() => {
    const set = new Set();
    (items || []).forEach(it => { if (it.district) set.add(it.district); });
    // Use 'District' as placeholder label instead of 'All'
    return ['District', ...Array.from(set)];
  }, [items]);

  return (
    <div style={{ 
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
      minHeight: '100vh'
    }}>
      <UserNavbar />
      <div style={{ 
        padding: '32px 20px', 
        maxWidth: 1200, 
        margin: '0 auto'
      }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ 
            margin: 0,
            fontSize: 32,
            fontWeight: 800,
            background: 'linear-gradient(135deg, #1e293b, #475569)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.025em',
            marginBottom: 8
          }}>
            Suppliers Inventories
          </h1>
          <p style={{
            margin: 0,
            color: '#64748b',
            fontSize: 16,
            fontWeight: 500
          }}>
            Browse items offered directly by our partner suppliers
          </p>
        </div>
        
        <div style={{ 
          display: 'flex', 
          gap: 16, 
          marginBottom: 32,
          flexWrap: 'wrap'
        }}>
          {/* Home-style search bar */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: 1, minWidth: 280 }}>
            <input 
              value={q} 
              onChange={(e) => setQ(e.target.value)} 
              placeholder="Search supplier items..." 
              style={{ 
                padding: '10px 45px 10px 16px', 
                borderRadius: 25, 
                border: '2px solid #3b82f6',
                background: '#ffffff',
                fontSize: 14,
                fontWeight: 400,
                color: '#374151',
                transition: 'all 0.2s ease',
                width: '100%',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#2563eb';
                e.target.style.background = '#ffffff';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.background = '#ffffff';
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
                // search triggers onChange already
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
          <select 
            value={cat} 
            onChange={(e) => setCat(e.target.value)} 
            style={{ 
              padding: '14px 18px', 
              borderRadius: 12, 
              border: '1px solid rgba(226,232,240,0.8)',
              background: 'rgba(255,255,255,0.8)',
              fontSize: 14,
              fontWeight: 500,
              color: '#374151',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              backdropFilter: 'saturate(180%) blur(20px)',
              minWidth: 160
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'rgba(59,130,246,0.4)';
              e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1), 0 4px 12px rgba(0,0,0,0.08)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(226,232,240,0.8)';
              e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
            }}
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select 
            aria-label="Filter by district"
            value={district || 'District'} 
            onChange={(e) => setDistrict(e.target.value === 'District' ? '' : e.target.value)} 
            style={{ 
              padding: '14px 18px', 
              borderRadius: 12, 
              border: '1px solid rgba(226,232,240,0.8)',
              background: 'rgba(255,255,255,0.8)',
              fontSize: 14,
              fontWeight: 500,
              color: '#374151',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              backdropFilter: 'saturate(180%) blur(20px)',
              minWidth: 160
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'rgba(59,130,246,0.4)';
              e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1), 0 4px 12px rgba(0,0,0,0.08)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(226,232,240,0.8)';
              e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
            }}
          >
            {districts.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

      {loading ? (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 200,
          fontSize: 16,
          color: '#64748b',
          fontWeight: 500
        }}>
          Loading...
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: 35
        }}>
          {filtered.map((it) => (
            <div 
              key={it._id} 
              style={{ 
                background: 'rgba(255,255,255,0.8)', 
                border: '1px solid rgba(226,232,240,0.6)', 
                borderRadius: 16, 
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08), 0 1px 0 rgba(255,255,255,0.8) inset',
                backdropFilter: 'saturate(180%) blur(20px)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                flexDirection: 'column',
                height: '100%'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.boxShadow = '0 16px 48px rgba(0,0,0,0.15), 0 4px 16px rgba(59,130,246,0.15)';
                e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08), 0 1px 0 rgba(255,255,255,0.8) inset';
                e.currentTarget.style.borderColor = 'rgba(226,232,240,0.6)';
              }}
              onFocus={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.boxShadow = '0 16px 48px rgba(0,0,0,0.15), 0 4px 16px rgba(59,130,246,0.15)';
                e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08), 0 1px 0 rgba(255,255,255,0.8) inset';
                e.currentTarget.style.borderColor = 'rgba(226,232,240,0.6)';
              }}
            >
              <div style={{ position: 'relative', overflow: 'hidden' }}>
                {it.image ? (
                  <img
                    src={
                      it.image.startsWith('http')
                        ? it.image
                        : `${baseUrl}${it.image.startsWith('/') ? '' : '/'}${it.image}`
                    }
                    alt={it.name}
                    style={{ 
                      width: '100%', 
                      height: 250, 
                      objectFit: 'cover',
                      transition: 'transform 0.3s ease'
                    }}
                    onMouseOver={(e) => { e.target.style.transform = 'scale(1.05)'; }}
                    onMouseOut={(e) => { e.target.style.transform = 'scale(1)'; }}
                    onFocus={(e) => { e.target.style.transform = 'scale(1.05)'; }}
                    onBlur={(e) => { e.target.style.transform = 'scale(1)'; }}
                  />
                ) : (
                  <div style={{ width: '100%', height: 250, background: '#e2e8f0' }} />
                )}
                <div style={{ 
                  position: 'absolute', 
                  top: 12, 
                  right: 12,
                  zIndex: 2
                }}>
                  {(Number(it.quantity) || 0) > 0 ? (
                    <span style={{ 
                      background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)', 
                      color: '#166534', 
                      padding: '6px 14px', 
                      borderRadius: 20, 
                      fontSize: 11,
                      fontWeight: 700,
                      border: '1px solid rgba(22,101,52,0.2)',
                      boxShadow: '0 2px 8px rgba(22,101,52,0.2)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Available
                    </span>
                  ) : (
                    <span style={{ 
                      background: 'linear-gradient(135deg, #fee2e2, #fecaca)', 
                      color: '#991b1b', 
                      padding: '6px 14px', 
                      borderRadius: 20, 
                      fontSize: 11,
                      fontWeight: 700,
                      border: '1px solid rgba(153,27,27,0.2)',
                      boxShadow: '0 2px 8px rgba(153,27,27,0.2)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Unavailable
                    </span>
                  )}
                </div>
              </div>
              <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ 
                  color: '#64748b', 
                  fontSize: 11,
                  fontWeight: 600,
                  marginBottom: 8,
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  {it.category}
                </div>
                <div style={{ 
                  fontWeight: 700, 
                  fontSize: 17,
                  color: '#1e293b',
                  marginBottom: 12,
                  letterSpacing: '-0.025em',
                  lineHeight: '1.3',
                  minHeight: 44
                }}>
                  {it.name}
                </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 8,
                  marginBottom: 16,
                  paddingTop: 12,
                  borderTop: '1px solid rgba(226,232,240,0.8)'
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 7h-9"></path>
                    <path d="M14 17H5"></path>
                    <circle cx="17" cy="17" r="3"></circle>
                    <circle cx="7" cy="7" r="3"></circle>
                  </svg>
                  <span style={{ color: '#475569', fontSize: 13, fontWeight: 600 }}>
                    Stock: {Math.max(0, Number(it.quantity) || 0)} units {it.district ? `• ${it.district}` : ''}
                  </span>
                </div>
                <div style={{ 
                  fontWeight: 800, 
                  fontSize: 20,
                  color: '#2563eb',
                  letterSpacing: '-0.025em',
                  marginTop: 'auto'
                }}>
                  LKR {Number(it.rentalPrice).toFixed(2)}
                  <span style={{ fontSize: 13, fontWeight: 500, color: '#64748b' }}> / day</span>
                </div>
              </div>
              <div style={{ padding: '0 20px 20px 20px', display: 'flex', gap: 12 }}>
                <button
                  onClick={() => { setReqItem(it); setReqQty(1); setShowReq(true); }}
                  disabled={!((Number(it.quantity) || 0) > 0)}
                  style={{ 
                    flex: 1, 
                    background: ((Number(it.quantity) || 0) > 0)
                      ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)'
                      : '#e2e8f0',
                    color: ((Number(it.quantity) || 0) > 0) ? 'white' : '#94a3b8',
                    border: 'none', 
                    padding: '12px 16px', 
                    borderRadius: 12, 
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: ((Number(it.quantity) || 0) > 0) ? 'pointer' : 'not-allowed',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: ((Number(it.quantity) || 0) > 0)
                      ? '0 4px 12px rgba(59,130,246,0.3)'
                      : '0 2px 4px rgba(0,0,0,0.05)'
                  }}
                  onMouseOver={(e) => {
                    if ((Number(it.quantity) || 0) > 0) {
                      e.target.style.transform = 'translateY(-1px)';
                      e.target.style.boxShadow = '0 6px 20px rgba(59,130,246,0.4)';
                    }
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = 'none';
                    e.target.style.boxShadow = ((Number(it.quantity) || 0) > 0)
                      ? '0 4px 12px rgba(59,130,246,0.3)'
                      : '0 2px 4px rgba(0,0,0,0.05)';
                  }}
                  onFocus={(e) => {
                    if ((Number(it.quantity) || 0) > 0) {
                      e.target.style.transform = 'translateY(-1px)';
                      e.target.style.boxShadow = '0 6px 20px rgba(59,130,246,0.4)';
                    }
                  }}
                  onBlur={(e) => {
                    e.target.style.transform = 'none';
                    e.target.style.boxShadow = ((Number(it.quantity) || 0) > 0)
                      ? '0 4px 12px rgba(59,130,246,0.3)'
                      : '0 2px 4px rgba(0,0,0,0.05)';
                  }}
                >
                  Book 
                </button>
                <button
                  onClick={() => { setDetailsItem(it); setShowDetails(true); }}
                  style={{ 
                    flex: 1,
                    width: '100%', 
                    background: 'rgba(255,255,255,0.8)', 
                    border: '1px solid rgba(226,232,240,0.8)', 
                    padding: '12px 16px', 
                    borderRadius: 12,
                    fontWeight: 600,
                    fontSize: 14,
                    color: '#374151',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = 'rgba(59,130,246,0.08)';
                    e.target.style.borderColor = 'rgba(59,130,246,0.2)';
                    e.target.style.color = '#2563eb';
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = 'rgba(255,255,255,0.8)';
                    e.target.style.borderColor = 'rgba(226,232,240,0.8)';
                    e.target.style.color = '#374151';
                    e.target.style.transform = 'none';
                    e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                  }}
                  onFocus={(e) => {
                    e.target.style.background = 'rgba(59,130,246,0.08)';
                    e.target.style.borderColor = 'rgba(59,130,246,0.2)';
                    e.target.style.color = '#2563eb';
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                  }}
                  onBlur={(e) => {
                    e.target.style.background = 'rgba(255,255,255,0.8)';
                    e.target.style.borderColor = 'rgba(226,232,240,0.8)';
                    e.target.style.color = '#374151';
                    e.target.style.transform = 'none';
                    e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                  }}
                >
                  Details
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ 
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: 60,
              color: '#64748b',
              fontSize: 16,
              fontWeight: 500
            }}>
              <div style={{
                fontSize: 48,
                marginBottom: 16,
                opacity: 0.5
              }}>🔍</div>
              No supplier items found. Try adjusting filters.
            </div>
          )}
        </div>
      )}
      </div>
      <SiteFooter />
      {showReq && reqItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 520, background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontWeight: 700 }}>Request: {reqItem.name}</div>
              <button onClick={() => setShowReq(false)} style={{ background: 'white', border: '1px solid #cbd5e1', borderRadius: 8, padding: '6px 10px' }}>Close</button>
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label htmlFor="reqBookingDate" style={{ fontSize: 12, color: '#64748b' }}>Booking date</label>
                  <input id="reqBookingDate" type="date" value={reqDate} min={new Date().toISOString().slice(0,10)} onChange={e => setReqDate(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #cbd5e1' }} />
                </div>
                <div>
                  <label htmlFor="reqReturnDate" style={{ fontSize: 12, color: '#64748b' }}>Return date (optional)</label>
                  <input id="reqReturnDate" type="date" value={reqReturn} min={reqDate || undefined} onChange={e => setReqReturn(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #cbd5e1' }} />
                </div>
              </div>
              <div>
                <label htmlFor="reqQty" style={{ fontSize: 12, color: '#64748b' }}>Quantity</label>
                <input id="reqQty" type="number" min={1} max={Number(reqItem.quantity)||undefined} value={reqQty} onChange={e => setReqQty(Math.max(1, Number(e.target.value)))} style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #cbd5e1' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label htmlFor="reqName" style={{ fontSize: 12, color: '#64748b' }}>Your name</label>
                  <input id="reqName" value={reqName} onChange={e => setReqName(e.target.value)} placeholder="Full name" style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #cbd5e1' }} />
                </div>
                <div>
                  <label htmlFor="reqEmail" style={{ fontSize: 12, color: '#64748b' }}>Email</label>
                  <input id="reqEmail" type="email" value={reqEmail} onChange={e => setReqEmail(e.target.value)} placeholder="you@example.com" style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #cbd5e1' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label htmlFor="reqPhone" style={{ fontSize: 12, color: '#64748b' }}>Phone</label>
                  <input id="reqPhone" value={reqPhone} onChange={e => setReqPhone(e.target.value)} placeholder="07X-XXXXXXX" style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #cbd5e1' }} />
                </div>
                <div>
                  <label htmlFor="reqAddress" style={{ fontSize: 12, color: '#64748b' }}>Delivery address</label>
                  <input id="reqAddress" value={reqAddress} onChange={e => setReqAddress(e.target.value)} placeholder="Street, city" style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #cbd5e1' }} />
                </div>
              </div>
              <div>
                <label htmlFor="reqNotes" style={{ fontSize: 12, color: '#64748b' }}>Notes (optional)</label>
                <textarea id="reqNotes" rows={3} value={reqNotes} onChange={e => setReqNotes(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #cbd5e1' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                <div style={{ fontWeight: 600 }}>Price/day: LKR {Number(reqItem.rentalPrice||0).toFixed(2)}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setShowReq(false)} style={{ background: 'white', border: '1px solid #cbd5e1', padding: '8px 12px', borderRadius: 8 }}>Cancel</button>
                  <button onClick={async () => {
                    const token = localStorage.getItem('token');
                    if (!token) { alert('Please login first'); return; }
                    if (!reqDate) { alert('Select a booking date'); return; }
                    if (!reqName || !reqEmail || !reqPhone || !reqAddress) { alert('Fill contact details'); return; }
                    setSubmitting(true);
                    try {
                      const payload = {
                        bookingDate: reqDate,
                        returnDate: reqReturn || undefined,
                        items: [{ inventoryId: reqItem._id, qty: reqQty }],
                        customerName: reqName,
                        customerEmail: reqEmail,
                        customerPhone: reqPhone,
                        deliveryAddress: reqAddress,
                        notes: reqNotes,
                      };
                      await axios.post(`${baseUrl}/supplier-requests`, payload, { headers: { Authorization: `Bearer ${token}` } });
                      alert('Request sent to supplier');
                      setShowReq(false);
                    } catch (e) {
                      alert(e.response?.data?.message || e.message);
                    } finally {
                      setSubmitting(false);
                    }
                  }} disabled={submitting} style={{ background: '#2563eb', color: 'white', border: '1px solid #1d4ed8', padding: '8px 12px', borderRadius: 8 }}>{submitting ? 'Sending…' : 'Send Request'}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {showDetails && detailsItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div role="dialog" aria-modal="true" style={{ width: '100%', maxWidth: 860, background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 800, fontSize: 18 }}>Item Details</div>
              <button onClick={() => setShowDetails(false)} style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}>Close</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 0 }}>
              <div style={{ padding: 16, borderRight: '1px solid #e2e8f0' }}>
                <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0', marginBottom: 12 }}>
                  {detailsItem.image ? (
                    <img
                      src={
                        detailsItem.image.startsWith('http')
                          ? detailsItem.image
                          : `${baseUrl}${detailsItem.image.startsWith('/') ? '' : '/'}${detailsItem.image}`
                      }
                      alt={detailsItem.name}
                      style={{ width: '100%', height: 320, objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: 320, background: '#e2e8f0' }} />
                  )}
                </div>
                <div style={{ color: '#64748b', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>{detailsItem.category}</div>
                <div style={{ fontWeight: 800, fontSize: 22, color: '#0f172a', marginBottom: 8 }}>{detailsItem.name}</div>
                <div style={{ color: '#475569', fontSize: 14, lineHeight: 1.6, marginBottom: 12 }}>{detailsItem.description || 'No description provided.'}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <span style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 999, padding: '4px 10px', fontSize: 12, fontWeight: 700 }}>LKR {Number(detailsItem.rentalPrice).toFixed(2)} / day</span>
                  <span style={{ background: '#ecfeff', color: '#0e7490', border: '1px solid #a5f3fc', borderRadius: 999, padding: '4px 10px', fontSize: 12, fontWeight: 700 }}>Stock: {Math.max(0, Number(detailsItem.quantity) || 0)}</span>
                  {detailsItem.district && (<span style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', borderRadius: 999, padding: '4px 10px', fontSize: 12, fontWeight: 700 }}>{detailsItem.district}</span>)}
                </div>
                {detailsItem.location && (
                  <div style={{ color: '#64748b', fontSize: 13, marginBottom: 8 }}>Pickup location: <span style={{ color: '#0f172a', fontWeight: 600 }}>{detailsItem.location}</span></div>
                )}
                {detailsItem.specs && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Specifications</div>
                    <pre style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, color: '#334155', fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{typeof detailsItem.specs === 'string' ? detailsItem.specs : JSON.stringify(detailsItem.specs, null, 2)}</pre>
                  </div>
                )}
              </div>
              <div style={{ padding: 16 }}>
                <div style={{ fontWeight: 800, fontSize: 18, color: '#0f172a', marginBottom: 12 }}>Supplier</div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', overflow: 'hidden', border: '1px solid #e2e8f0', background: '#f1f5f9' }}>
                    {detailsItem.supplierId?.profileImage ? (
                      <img
                        alt={detailsItem.supplierId?.companyName || detailsItem.supplierId?.name || 'Supplier'}
                        src={detailsItem.supplierId.profileImage.startsWith('http') ? detailsItem.supplierId.profileImage : `${baseUrl}${detailsItem.supplierId.profileImage.startsWith('/') ? '' : '/'}${detailsItem.supplierId.profileImage}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontWeight: 800 }}>
                        {((detailsItem.supplierId?.companyName || detailsItem.supplierId?.name || 'S')[0] || 'S').toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, color: '#0f172a' }}>{detailsItem.supplierId?.companyName || detailsItem.supplierId?.name || 'Supplier'}</div>
                    <div style={{ color: '#475569', fontSize: 13 }}>{detailsItem.supplierId?.district || '—'}</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
                  <div style={{ color: '#334155', fontSize: 14 }}><strong>Contact:</strong> {detailsItem.supplierId?.name || '—'}</div>
                  <div style={{ color: '#334155', fontSize: 14 }}><strong>Email:</strong> {detailsItem.supplierId?.email || '—'}</div>
                  <div style={{ color: '#334155', fontSize: 14 }}><strong>Phone:</strong> {detailsItem.supplierId?.phone || '—'}</div>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  <button
                    onClick={() => { setShowDetails(false); setReqItem(detailsItem); setReqQty(1); setShowReq(true); }}
                    style={{ flex: 1, background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: 'white', border: 'none', padding: '10px 14px', borderRadius: 10, fontWeight: 700, boxShadow: '0 4px 12px rgba(59,130,246,0.3)', cursor: 'pointer' }}
                  >
                    Book from Supplier
                  </button>
                  <button onClick={() => setShowDetails(false)} style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '10px 14px', borderRadius: 10, fontWeight: 600, color: '#0f172a' }}>Close</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
