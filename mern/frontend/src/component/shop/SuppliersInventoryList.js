import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import UserNavbar from './UserNavbar';
import SiteFooter from '../common/SiteFooter';
import FeedbackSection from '../home/FeedbackSection';

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

export default function SuppliersInventoryList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');
  const [district, setDistrict] = useState('');

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
    return ['All', ...Array.from(set)];
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
          <input 
            value={q} 
            onChange={(e) => setQ(e.target.value)} 
            placeholder="Search supplier items..." 
            style={{ 
              flex: 1,
              minWidth: 250,
              padding: '14px 18px', 
              borderRadius: 12, 
              border: '1px solid rgba(226,232,240,0.8)',
              background: 'rgba(255,255,255,0.8)',
              fontSize: 14,
              fontWeight: 500,
              color: '#374151',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              backdropFilter: 'saturate(180%) blur(20px)'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'rgba(59,130,246,0.4)';
              e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1), 0 4px 12px rgba(0,0,0,0.08)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(226,232,240,0.8)';
              e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
            }}
          />
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
            value={district || 'All'} 
            onChange={(e) => setDistrict(e.target.value === 'All' ? '' : e.target.value)} 
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
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', 
          gap: 20 
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
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.12), 0 4px 16px rgba(59,130,246,0.1)';
                e.currentTarget.style.borderColor = 'rgba(59,130,246,0.2)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08), 0 1px 0 rgba(255,255,255,0.8) inset';
                e.currentTarget.style.borderColor = 'rgba(226,232,240,0.6)';
              }}
            >
              {it.image ? (
                <img
                  src={
                    it.image.startsWith('http')
                      ? it.image
                      : `${baseUrl}${it.image.startsWith('/') ? '' : '/'}${it.image}`
                  }
                  alt={it.name}
                  style={{ width: '100%', height: 250, objectFit: 'cover' }}
                />
              ) : (
                <div style={{ width: '100%', height: 150, background: '#e2e8f0' }} />
              )}
              <div style={{ padding: 18 }}>
                <div style={{ 
                  fontWeight: 700, 
                  fontSize: 16,
                  color: '#1e293b',
                  marginBottom: 6,
                  letterSpacing: '-0.025em'
                }}>
                  {it.name}
                </div>
                <div style={{ 
                  display: 'flex',
                  gap: 8,
                  alignItems: 'center',
                  marginBottom: 12
                }}>
                  <span style={{ 
                    color: '#64748b', 
                    fontSize: 13,
                    fontWeight: 500
                  }}>
                    {it.category}
                  </span>
                  {it.district && (
                    <span style={{ 
                      color: '#94a3b8', 
                      fontSize: 12,
                      border: '1px solid rgba(148,163,184,0.3)',
                      padding: '4px 8px',
                      borderRadius: 999
                    }}>
                      {it.district}
                    </span>
                  )}
                </div>
                <div style={{ marginBottom: 14 }}>
                  {it.available !== false && (Number(it.quantity) || 0) > 0 ? (
                    <span style={{ 
                      background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)', 
                      color: '#166534', 
                      padding: '6px 12px', 
                      borderRadius: 20, 
                      fontSize: 12,
                      fontWeight: 600,
                      border: '1px solid rgba(22,101,52,0.2)',
                      boxShadow: '0 2px 4px rgba(22,101,52,0.1)'
                    }}>
                      Available
                    </span>
                  ) : (
                    <span style={{ 
                      background: 'linear-gradient(135deg, #fee2e2, #fecaca)', 
                      color: '#991b1b', 
                      padding: '6px 12px', 
                      borderRadius: 20, 
                      fontSize: 12,
                      fontWeight: 600,
                      border: '1px solid rgba(153,27,27,0.2)',
                      boxShadow: '0 2px 4px rgba(153,27,27,0.1)'
                    }}>
                      Unavailable
                    </span>
                  )}
                </div>
                <div style={{ 
                  fontWeight: 800, 
                  fontSize: 18,
                  color: '#2563eb',
                  letterSpacing: '-0.025em'
                }}>
                  LKR {Number(it.rentalPrice).toFixed(2)} / day
                </div>
              </div>
              <div style={{ padding: 18, display: 'flex', gap: 12 }}>
                <button
                  disabled
                  title="Booking via suppliers is coming soon"
                  style={{ 
                    flex: 1, 
                    background: '#e2e8f0', 
                    color: '#94a3b8', 
                    border: 'none', 
                    padding: '12px 16px', 
                    borderRadius: 12, 
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: 'not-allowed',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                  }}
                >
                  Add to Cart (Soon)
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
      <FeedbackSection />
      <SiteFooter />
    </div>
  );
}
