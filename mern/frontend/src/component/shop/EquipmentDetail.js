import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { addToCart } from '../../utils/cart';
import UserNavbar from './UserNavbar';
import SiteFooter from '../common/SiteFooter';

export default function EquipmentDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [qty, setQty] = useState(1);
  const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchItem = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${baseUrl}/equipment/${id}`);
        setItem(res.data.item);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [id, baseUrl]);

  if (loading) return <div><UserNavbar /><div style={{ padding: 20 }}>Loading...</div><SiteFooter /></div>;
  if (!item) return <div><UserNavbar /><div style={{ padding: 20 }}>Item not found</div><SiteFooter /></div>;

  const maxQty = Number(item.quantity) || 0;

  return (
    <div>
      <UserNavbar />
      <div style={{ padding: 20, maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
      <div>
        {item.image ? (
          <img src={`${baseUrl}${item.image}`} alt={item.name} style={{ width: '100%', height: 400, objectFit: 'cover', borderRadius: 12 }} />
        ) : (
          <div style={{ width: '100%', height: 400, background: '#e2e8f0', borderRadius: 12 }} />
        )}
      </div>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h2 style={{ margin: '0 0 8px 0' }}>{item.name}</h2>
          {item.available !== false && (Number(item.quantity) || 0) > 0 ? (
            <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: 12, fontSize: 12 }}>Available</span>
          ) : (
            <span style={{ background: '#fee2e2', color: '#991b1b', padding: '2px 8px', borderRadius: 12, fontSize: 12 }}>Unavailable</span>
          )}
        </div>
        <div style={{ color: '#64748b', marginBottom: 10 }}>{item.category}</div>
        <div style={{ margin: '12px 0', color: '#334155' }}>{item.description}</div>
        <div style={{ fontWeight: 700, marginBottom: 12 }}>LKR {Number(item.rentalPrice).toFixed(2)} / day</div>
        <div style={{ marginBottom: 12 }}>Available Quantity: {item.quantity}</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="number" min={1} max={maxQty} value={qty} onChange={(e) => setQty(Math.min(maxQty, Math.max(1, Number(e.target.value))))} style={{ width: 80, padding: 8, borderRadius: 8, border: '1px solid #e2e8f0' }} />
          <button onClick={() => { addToCart(item, qty); alert('Added to cart'); }} disabled={maxQty <= 0} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '10px 16px', borderRadius: 8 }}>
            Add to Cart
          </button>
        </div>
      </div>
      </div>
      <SiteFooter />
    </div>
  );
}
