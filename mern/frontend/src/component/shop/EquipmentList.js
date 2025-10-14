import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { Link, useSearchParams } from 'react-router-dom';
import UserNavbar from './UserNavbar';
import SiteFooter from '../common/SiteFooter';
import { addToCart } from '../../utils/cart';
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

export default function EquipmentList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');
  const [params] = useSearchParams();
  const [page, setPage] = useState(0);
  const [columnsCount, setColumnsCount] = useState(4);

  const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

  // Banners for top carousel
  const [banners, setBanners] = useState([]);
  const [bLoading, setBLoading] = useState(false);
  const [bIndex, setBIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const bScrollRef = useRef(null);
  const fullUrl = (src) => {
    if (!src) return '';
    return src.startsWith('http://') || src.startsWith('https://')
      ? src
      : `${baseUrl}${src.startsWith('/') ? '' : '/'}${src}`;
  };

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

  // Fetch banners for homepage top carousel
  useEffect(() => {
    const loadBanners = async () => {
      setBLoading(true);
      try {
        const res = await axios.get(`${baseUrl}/banners`);
        const items = Array.isArray(res?.data) ? res.data : res?.data?.items;
        setBanners(Array.isArray(items) ? items : []);
      } catch (e) {
        // ignore for now
      } finally {
        setBLoading(false);
      }
    };
    loadBanners();
  }, [baseUrl]);

  // Initialize category from query param
  useEffect(() => {
    const c = params.get('category');
    if (c) {
      setCat(categories.includes(c) ? c : 'Select Category');
    }
  }, [params]);

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

  // Banner carousel helpers
  useEffect(() => { setBIndex(0); }, [banners.length]);
  const onBannerScroll = () => {
    const sc = bScrollRef.current;
    if (!sc) return;
    const i = Math.round(sc.scrollLeft / Math.max(1, sc.clientWidth));
    if (i !== bIndex) setBIndex(i);
  };
  const goToBanner = (i) => {
    const sc = bScrollRef.current;
    if (!sc) return;
    const clamped = Math.max(0, Math.min((banners.length || 1) - 1, i));
    sc.scrollTo({ left: clamped * sc.clientWidth, behavior: 'smooth' });
  };
  const prevBanner = () => goToBanner(bIndex - 1);
  const nextBanner = () => goToBanner(bIndex + 1);

  // Autoplay banners every 4s; pause on hover/focus/touch
  useEffect(() => {
    if (!autoPlay || banners.length < 2) return;
    const id = setInterval(() => {
      const next = (bIndex + 1) % banners.length;
      goToBanner(next);
    }, 4000);
    return () => clearInterval(id);
  }, [autoPlay, bIndex, banners.length]);

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
        
        <div style={{ 
          display: 'flex', 
          gap: 16, 
          marginBottom: 32,
          flexWrap: 'wrap'
        }}>
          <input 
            value={q} 
            onChange={(e) => setQ(e.target.value)} 
            placeholder="Search equipment..." 
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
        </div>

        {/* Banner carousel under search bar */}
        <div
          style={{ position: 'relative', width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', marginBottom: 24 }}
          onMouseEnter={() => setAutoPlay(false)}
          onMouseLeave={() => setAutoPlay(true)}
          onTouchStart={() => setAutoPlay(false)}
          onTouchEnd={() => setAutoPlay(true)}
          onFocusCapture={() => setAutoPlay(false)}
          onBlurCapture={() => setAutoPlay(true)}
        >
          {bLoading ? (
            <div style={{ padding: 16, color: '#64748b' }}>Loading banners…</div>
          ) : banners.length === 0 ? null : (
            <>
              <div
                ref={bScrollRef}
                onScroll={onBannerScroll}
                style={{
                  display: 'flex',
                  overflowX: 'auto',
                  scrollSnapType: 'x mandatory',
                  scrollBehavior: 'smooth',
                  WebkitOverflowScrolling: 'touch',
                  msOverflowStyle: 'none',
                  scrollbarWidth: 'none',
                }}
              >
                {banners.map((b) => (
                  <div key={b._id} style={{ flex: '0 0 100%', scrollSnapAlign: 'start', position: 'relative' }}>
                    <img
                      alt={b.title || 'Banner'}
                      src={fullUrl((b.image || b.imageUrl) || '')}
                      style={{ width: '100%', height: 250, objectFit: 'cover', display: 'block' }}
                    />
                    {b.title ? (
                      <div style={{ position: 'absolute', left: 16, bottom: 12, background: 'rgba(0,0,0,0.45)', color: 'white', padding: '6px 10px', borderRadius: 8, fontSize: 14 }}>
                        {b.title}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
              {banners.length > 1 && (
                <>
                  <button
                    aria-label="Previous banner"
                    onClick={prevBanner}
                    style={{ position: 'absolute', top: '50%', left: 8, transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.45)', color: 'white', border: 'none', borderRadius: 999, width: 36, height: 36, cursor: 'pointer' }}
                  >
                    ‹
                  </button>
                  <button
                    aria-label="Next banner"
                    onClick={nextBanner}
                    style={{ position: 'absolute', top: '50%', right: 8, transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.45)', color: 'white', border: 'none', borderRadius: 999, width: 36, height: 36, cursor: 'pointer' }}
                  >
                    ›
                  </button>
                  <div style={{ position: 'absolute', left: 0, right: 0, bottom: 8, display: 'flex', justifyContent: 'center', gap: 6 }}>
                    {banners.map((_, i) => (
                      <button
                        key={i}
                        aria-label={`Go to banner ${i + 1}`}
                        onClick={() => goToBanner(i)}
                        style={{ width: 8, height: 8, borderRadius: 999, border: 'none', background: i === bIndex ? '#111827' : '#cbd5e1', cursor: 'pointer' }}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>

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
            Available Equipment
          </h1>
          <p style={{
            margin: 0,
            color: '#64748b',
            fontSize: 16,
            fontWeight: 500
          }}>
            Discover and rent professional equipment for your events
          </p>
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
              onFocus={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.12), 0 4px 16px rgba(59,130,246,0.1)';
                e.currentTarget.style.borderColor = 'rgba(59,130,246,0.2)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08), 0 1px 0 rgba(255,255,255,0.8) inset';
                e.currentTarget.style.borderColor = 'rgba(226,232,240,0.6)';
              }}
            >
              <Link to={`/equipment/${it._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
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
                    color: '#64748b', 
                    fontSize: 13,
                    fontWeight: 500,
                    marginBottom: 12
                  }}>
                    {it.category}
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    {(Number(it.quantity) || 0) > 0 ? (
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
                  <div style={{ marginBottom: 14, color: '#475569', fontSize: 12, fontWeight: 600 }}>
                    In stock: {Math.max(0, Number(it.quantity) || 0)}
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
              </Link>
              <div style={{ padding: 18, display: 'flex', gap: 12 }}>
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
