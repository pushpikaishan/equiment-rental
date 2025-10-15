import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link, useSearchParams } from 'react-router-dom';
import UserNavbar from './UserNavbar';
import SiteFooter from '../common/SiteFooter';
import { addToCart } from '../../utils/cart';
import FeedbackSection from '../home/FeedbackSection';
import HeroSlider from './HeroSlider';


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

export default function EquipmentList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [params] = useSearchParams();
  const [page, setPage] = useState(0);
  const [columnsCount, setColumnsCount] = useState(4);

  // Get search query and category from URL params
  const q = params.get('q') || '';
  const cat = params.get('category') || 'All';

  const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${baseUrl}/equipment`);
        setItems(res.data.items || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [baseUrl]);

  const filtered = useMemo(() => {
    const list = (items || []).filter((it) => {
      const matchQ = q ? (it.name?.toLowerCase().includes(q.toLowerCase()) || it.description?.toLowerCase().includes(q.toLowerCase())) : true;
      const matchCat = cat === 'All' ? true : it.category === cat;
      return matchQ && matchCat; // include both available and unavailable
    });
    // Reset to first page when filters change
    setPage(0);
    return list;
  }, [items, q, cat]);

  // Determine approximate columns based on container width
  useEffect(() => {
    const computeCols = () => {
      // Using window width approximation against container maxWidth 1200 and min card width ~240 including gaps
      const w = Math.min(window.innerWidth - 40, 1200); // padding ~20px each side
      if (w >= 1100) return 5;
      if (w >= 900) return 4;
      if (w >= 680) return 3;
      if (w >= 460) return 2;
      return 1;
    };
    const update = () => setColumnsCount(computeCols());
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const rowsPerPage = 4;
  const itemsPerPage = Math.max(1, columnsCount) * rowsPerPage;
  const totalPages = Math.max(1, Math.ceil((filtered?.length || 0) / itemsPerPage));
  const currentPage = Math.min(page, totalPages - 1);
  const start = currentPage * itemsPerPage;
  const end = start + itemsPerPage;
  const paged = (filtered || []).slice(start, end);

  return (
    <div style={{ 
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
      minHeight: '100vh',
      margin: 0,
      padding: 0,
      position: 'relative'
    }}>
      <UserNavbar />
      
      {/* Hero Slider */}
      <HeroSlider />

      <div style={{ 
        padding: '16px 10px', 
        maxWidth: 1200, 
        margin: '0 auto'
      }}
      data-equipment-list>


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
          gap: 35,
          '@media (max-width: 1200px)': {
            gridTemplateColumns: 'repeat(3, 1fr)'
          },
          '@media (max-width: 900px)': {
            gridTemplateColumns: 'repeat(2, 1fr)'
          },
          '@media (max-width: 600px)': {
            gridTemplateColumns: '1fr'
          }
        }}>
          {paged.map((it) => (
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
              <Link to={`/equipment/${it._id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', flex: 1 }}>
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
                      Stock: {Math.max(0, Number(it.quantity) || 0)} units
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
              </Link>
              <div style={{ padding: '0 20px 20px 20px', display: 'flex', gap: 12 }}>
                <button
                  onClick={() => { addToCart(it, 1); alert('Added to cart'); }}
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
                  Add to Cart
                </button>
                <Link to={`/equipment/${it._id}`} style={{ flex: 1 }}>
                  <button style={{ 
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
                </Link>
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
              No equipment found matching your criteria.
            </div>
          )}
          {/* Pagination controls */}
          {filtered.length > 0 && (
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 8 }}>
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={currentPage <= 0}
                style={{
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1px solid #e2e8f0',
                  background: currentPage <= 0 ? '#f1f5f9' : 'white',
                  color: currentPage <= 0 ? '#94a3b8' : '#0f172a',
                  cursor: currentPage <= 0 ? 'not-allowed' : 'pointer'
                }}
              >
                Previous
              </button>
              <span style={{ fontSize: 13, color: '#64748b' }}>Page {currentPage + 1} of {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage >= totalPages - 1}
                style={{
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1px solid #e2e8f0',
                  background: currentPage >= totalPages - 1 ? '#f1f5f9' : 'white',
                  color: currentPage >= totalPages - 1 ? '#94a3b8' : '#0f172a',
                  cursor: currentPage >= totalPages - 1 ? 'not-allowed' : 'pointer'
                }}
              >
                Next Page
              </button>
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
