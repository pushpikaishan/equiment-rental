import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

export default function FeedbackSection() {
  const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');
  const headers = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : {}), [token]);

  const [items, setItems] = useState([]);
  const [myItems, setMyItems] = useState([]);
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(5);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchAll = async () => {
    try {
      const res = await axios.get(`${baseUrl}/feedback`);
      setItems(res.data.items || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMine = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${baseUrl}/feedback/my`, { headers });
      setMyItems(res.data.items || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAll();
    fetchMine();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const submit = async () => {
    if (!token) return alert('Please login first');
    if (!content.trim()) return alert('Please write your feedback');
    setLoading(true);
    try {
      if (editing) {
        await axios.put(`${baseUrl}/feedback/${editing._id}`, { content, rating }, { headers });
      } else {
        await axios.post(`${baseUrl}/feedback`, { content, rating }, { headers });
      }
      setContent('');
      setRating(5);
      setEditing(null);
      await Promise.all([fetchAll(), fetchMine()]);
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to submit');
    } finally {
      setLoading(false);
    }
  };

  const onEdit = (it) => {
    setEditing(it);
    setContent(it.content);
    setRating(it.rating || 5);
  };

  const onDelete = async (id) => {
    if (!token) return alert('Please login first');
    if (!window.confirm('Delete this feedback?')) return;
    try {
      await axios.delete(`${baseUrl}/feedback/${id}`, { headers });
      await Promise.all([fetchAll(), fetchMine()]);
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: '40px auto', background: 'white', border: '1px solid #e2e8f0', borderRadius: 12 }}>
      <h2 style={{ marginTop: 0 }}>What our users say</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div>
          <h3 style={{ marginTop: 0 }}>Latest feedback</h3>
          <div style={{ display: 'grid', gap: 10 }}>
            {items.map((it) => (
              <div key={it._id} style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 600 }}>{it.userName || 'User'}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ color: '#eab308' }}>{'★'.repeat(it.rating || 5)}</div>
                  </div>
                </div>
                <div style={{ color: '#334155', marginTop: 6 }}>{it.content}</div>
                <div style={{ color: '#64748b', fontSize: 12, marginTop: 6 }}>{new Date(it.createdAt).toLocaleString()}</div>
                {token && String(it.userId) === String(userId) && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button onClick={() => onEdit(it)} style={{ background: 'white', border: '1px solid #cbd5e1', padding: '6px 10px', borderRadius: 6 }}>Edit</button>
                    <button onClick={() => onDelete(it._id)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 10px', borderRadius: 6 }}>Delete</button>
                  </div>
                )}
              </div>
            ))}
            {items.length === 0 && <div style={{ color: '#64748b' }}>No feedback yet.</div>}
          </div>
        </div>
        <div>
          <h3 style={{ marginTop: 0 }}>{editing ? 'Edit your feedback' : 'Share your feedback'}</h3>
          <div style={{ display: 'grid', gap: 10 }}>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write your experience..." rows={5} style={{ width: '100%', borderRadius: 8, border: '1px solid #e2e8f0', padding: 10 }} />
            <div>
              <label>Rating: </label>
              <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
                {[5,4,3,2,1].map(r => <option key={r} value={r}>{r} Star{r>1?'s':''}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={submit} disabled={loading} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '10px 16px', borderRadius: 8 }}>{editing ? 'Update' : 'Submit'}</button>
              {editing && (
                <button onClick={() => { setEditing(null); setContent(''); setRating(5); }} style={{ background: 'white', border: '1px solid #cbd5e1', padding: '10px 16px', borderRadius: 8 }}>Cancel</button>
              )}
            </div>
          </div>

          {/* 'My feedback' section removed as requested. */}
        </div>
      </div>
    </div>
  );
}
