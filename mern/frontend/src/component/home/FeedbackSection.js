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
      // Request only the latest 3 feedbacks from backend; also guard on client side
      const res = await axios.get(`${baseUrl}/feedback`, { params: { limit: 3 } });
      const list = res.data.items || [];
      setItems(list.slice(0, 3));
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
    <div style={{ 
      padding: '48px 32px', 
      maxWidth: 1200, 
      margin: '60px auto', 
      background: 'rgba(255,255,255,0.8)', 
      border: '1px solid rgba(226,232,240,0.6)', 
      borderRadius: 24,
      boxShadow: '0 8px 32px rgba(0,0,0,0.08), 0 1px 0 rgba(255,255,255,0.8) inset',
      backdropFilter: 'saturate(180%) blur(20px)',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <h2 style={{ 
          margin: 0,
          fontSize: 32,
          fontWeight: 800,
          background: 'linear-gradient(135deg, #1e293b, #475569)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-0.025em',
          marginBottom: 8
        }}>
          What our users say
        </h2>
        <p style={{
          margin: 0,
          color: '#64748b',
          fontSize: 16,
          fontWeight: 500
        }}>
          Real experiences from our valued customers
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
        <div>
          <h3 style={{ 
            margin: '0 0 20px 0',
            fontSize: 20,
            fontWeight: 700,
            color: '#1e293b',
            letterSpacing: '-0.025em'
          }}>
            Latest feedback
          </h3>
          <div style={{ display: 'grid', gap: 16 }}>
            {items.map((it) => (
              <div key={it._id} style={{ 
                background: 'rgba(255,255,255,0.7)',
                border: '1px solid rgba(226,232,240,0.5)', 
                borderRadius: 16, 
                padding: 20,
                backdropFilter: 'blur(10px)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.04), 0 1px 0 rgba(255,255,255,0.6) inset',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
                }
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ 
                    fontWeight: 600,
                    color: '#1e293b',
                    fontSize: 15
                  }}>
                    {it.userName || 'User'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ 
                      color: '#f59e0b',
                      fontSize: 14,
                      textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                    }}>
                      {'★'.repeat(it.rating || 5)}
                    </div>
                  </div>
                </div>
                <div style={{ 
                  color: '#475569', 
                  marginTop: 10,
                  lineHeight: 1.5,
                  fontSize: 14
                }}>
                  {it.content}
                </div>
                <div style={{ 
                  color: '#64748b', 
                  fontSize: 12, 
                  marginTop: 10,
                  fontWeight: 500
                }}>
                  {new Date(it.createdAt).toLocaleString()}
                </div>
                {token && String(it.userId) === String(userId) && (
                  <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                    <button 
                      onClick={() => onEdit(it)} 
                      style={{ 
                        background: 'rgba(255,255,255,0.9)', 
                        border: '1px solid rgba(59,130,246,0.3)', 
                        padding: '8px 14px', 
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#3b82f6',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        cursor: 'pointer',
                        backdropFilter: 'blur(10px)'
                      }}
                      onMouseOver={(e) => {
                        e.target.style.background = 'rgba(59,130,246,0.1)';
                        e.target.style.borderColor = '#3b82f6';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.background = 'rgba(255,255,255,0.9)';
                        e.target.style.borderColor = 'rgba(59,130,246,0.3)';
                      }}
                      onFocus={(e) => {
                        e.target.style.background = 'rgba(59,130,246,0.1)';
                        e.target.style.borderColor = '#3b82f6';
                      }}
                      onBlur={(e) => {
                        e.target.style.background = 'rgba(255,255,255,0.9)';
                        e.target.style.borderColor = 'rgba(59,130,246,0.3)';
                      }}
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => onDelete(it._id)} 
                      style={{ 
                        background: 'linear-gradient(135deg, #ef4444, #dc2626)', 
                        color: 'white', 
                        border: 'none', 
                        padding: '8px 14px', 
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 600,
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(239,68,68,0.3)'
                      }}
                      onMouseOver={(e) => {
                        e.target.style.transform = 'translateY(-1px)';
                        e.target.style.boxShadow = '0 4px 16px rgba(239,68,68,0.4)';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 2px 8px rgba(239,68,68,0.3)';
                      }}
                      onFocus={(e) => {
                        e.target.style.transform = 'translateY(-1px)';
                        e.target.style.boxShadow = '0 4px 16px rgba(239,68,68,0.4)';
                      }}
                      onBlur={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 2px 8px rgba(239,68,68,0.3)';
                      }}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
            {items.length === 0 && (
              <div style={{ 
                color: '#64748b',
                textAlign: 'center',
                padding: 32,
                background: 'rgba(248,250,252,0.5)',
                borderRadius: 12,
                border: '1px dashed rgba(148,163,184,0.4)'
              }}>
                No feedback yet. Be the first to share your experience!
              </div>
            )}
          </div>
        </div>
        <div>
          <h3 style={{ 
            margin: '0 0 20px 0',
            fontSize: 20,
            fontWeight: 700,
            color: '#1e293b',
            letterSpacing: '-0.025em'
          }}>
            {editing ? 'Edit your feedback' : 'Share your feedback'}
          </h3>
          <div style={{ display: 'grid', gap: 16 }}>
            <textarea 
              value={content} 
              onChange={(e) => setContent(e.target.value)} 
              placeholder="Write your experience..." 
              rows={5} 
              style={{ 
                width: '100%', 
                borderRadius: 12, 
                border: '1px solid rgba(226,232,240,0.6)', 
                padding: 16,
                fontSize: 14,
                fontFamily: 'inherit',
                background: 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                resize: 'vertical',
                minHeight: 120
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(226,232,240,0.6)';
                e.target.style.boxShadow = 'none';
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <label htmlFor="ratingSelect" style={{ 
                fontSize: 14,
                fontWeight: 600,
                color: '#374151'
              }}>
                Rating:
              </label>
              <select 
                id="ratingSelect"
                value={rating} 
                onChange={(e) => setRating(Number(e.target.value))}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid rgba(226,232,240,0.6)',
                  background: 'rgba(255,255,255,0.8)',
                  backdropFilter: 'blur(10px)',
                  fontSize: 14,
                  fontWeight: 500,
                  color: '#374151',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(226,232,240,0.6)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                {[5,4,3,2,1].map(r => (
                  <option key={r} value={r}>
                    {r} Star{r>1?'s':''}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                onClick={submit} 
                disabled={loading} 
                style={{ 
                  background: loading 
                    ? 'rgba(148,163,184,0.5)' 
                    : 'linear-gradient(135deg, #3b82f6, #2563eb)', 
                  color: 'white', 
                  border: 'none', 
                  padding: '12px 20px', 
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: loading 
                    ? 'none' 
                    : '0 4px 16px rgba(59,130,246,0.3)',
                  backdropFilter: 'blur(10px)'
                }}
                onMouseOver={(e) => {
                  if (!loading) {
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 6px 24px rgba(59,130,246,0.4)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!loading) {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 16px rgba(59,130,246,0.3)';
                  }
                }}
                onFocus={(e) => {
                  if (!loading) {
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 6px 24px rgba(59,130,246,0.4)';
                  }
                }}
                onBlur={(e) => {
                  if (!loading) {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 16px rgba(59,130,246,0.3)';
                  }
                }}
              >
                {loading ? 'Submitting...' : (editing ? 'Update' : 'Submit')}
              </button>
              {editing && (
                <button 
                  onClick={() => { setEditing(null); setContent(''); setRating(5); }} 
                  style={{ 
                    background: 'rgba(255,255,255,0.9)', 
                    border: '1px solid rgba(148,163,184,0.3)', 
                    padding: '12px 20px', 
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#64748b',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    backdropFilter: 'blur(10px)'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = 'rgba(248,250,252,0.9)';
                    e.target.style.borderColor = '#94a3b8';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = 'rgba(255,255,255,0.9)';
                    e.target.style.borderColor = 'rgba(148,163,184,0.3)';
                  }}
                  onFocus={(e) => {
                    e.target.style.background = 'rgba(248,250,252,0.9)';
                    e.target.style.borderColor = '#94a3b8';
                  }}
                  onBlur={(e) => {
                    e.target.style.background = 'rgba(255,255,255,0.9)';
                    e.target.style.borderColor = 'rgba(148,163,184,0.3)';
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* 'My feedback' section removed as requested. */}
        </div>
      </div>
    </div>
  );
}
