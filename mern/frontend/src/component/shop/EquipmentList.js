import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link, useSearchParams } from 'react-router-dom';
import UserNavbar from './UserNavbar';
import SiteFooter from '../common/SiteFooter';
import { addToCart } from '../../utils/cart';

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

  // Initialize category from query param
  useEffect(() => {
    const c = params.get('category');
    if (c) {
      setCat(categories.includes(c) ? c : 'All');
    }
  }, [params]);

  const filtered = useMemo(() => {
    return (items || []).filter((it) => {
      const matchQ = q ? (it.name?.toLowerCase().includes(q.toLowerCase()) || it.description?.toLowerCase().includes(q.toLowerCase())) : true;
      const matchCat = cat === 'All' ? true : it.category === cat;
      return matchQ && matchCat; // include both available and unavailable
    });
  }, [items, q, cat]);

  return (
    <div>
      <UserNavbar />
      <div style={{ padding: 20, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 20, fontWeight: 700 }}>Shop</div>
      </div>
      <h2 style={{ margin: '10px 0' }}>Available Equipment</h2>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search equipment" style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }} />
        <select value={cat} onChange={(e) => setCat(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }}>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
          {filtered.map((it) => (
            <div key={it._id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
              <Link to={`/equipment/${it._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                {it.image ? (
                  <img src={`${baseUrl}${it.image}`} alt={it.name} style={{ width: '100%', height: 150, objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: 150, background: '#e2e8f0' }} />
                )}
                <div style={{ padding: 12 }}>
                  <div style={{ fontWeight: 600 }}>{it.name}</div>
                  <div style={{ color: '#64748b', fontSize: 12 }}>{it.category}</div>
                  <div style={{ marginTop: 8 }}>
                    {it.available !== false && (Number(it.quantity) || 0) > 0 ? (
                      <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: 12, fontSize: 12 }}>Available</span>
                    ) : (
                      <span style={{ background: '#fee2e2', color: '#991b1b', padding: '2px 8px', borderRadius: 12, fontSize: 12 }}>Unavailable</span>
                    )}
                  </div>
                  <div style={{ marginTop: 8, fontWeight: 600 }}>LKR {Number(it.rentalPrice).toFixed(2)} / day</div>
                </div>
              </Link>
              <div style={{ padding: 12, display: 'flex', gap: 8 }}>
                <button
                  onClick={() => { addToCart(it, 1); alert('Added to cart'); }}
                  disabled={!(it.available !== false && (Number(it.quantity) || 0) > 0)}
                  style={{ flex: 1, background: '#2563eb', color: 'white', border: 'none', padding: '8px 12px', borderRadius: 8, opacity: (it.available !== false && (Number(it.quantity) || 0) > 0) ? 1 : 0.5, cursor: (it.available !== false && (Number(it.quantity) || 0) > 0) ? 'pointer' : 'not-allowed' }}
                >
                  Add to Cart
                </button>
                <Link to={`/equipment/${it._id}`} style={{ flex: 1 }}>
                  <button style={{ width: '100%', background: 'white', border: '1px solid #cbd5e1', padding: '8px 12px', borderRadius: 8 }}>Details</button>
                </Link>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ color: '#64748b' }}>No items found.</div>
          )}
        </div>
      )}
      </div>
      <SiteFooter />
    </div>
  );
}
