import React, { useEffect, useState } from 'react';
import axios from 'axios';

function InventoryManagement() {
  const [form, setForm] = useState({
    name: '',
    description: '',
    rentalPrice: '',
    quantity: '',
    category: 'Lighting',
    available: true,
  });
  const [image, setImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null); // item being edited
  const [editImage, setEditImage] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleImage = (e) => {
    setImage(e.target.files?.[0] || null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    // Basic validation
    if (!form.name || !form.description || !form.rentalPrice || !form.quantity) {
      setMessage('Please fill in name, description, rental price, and quantity.');
      return;
    }

    const data = new FormData();
    data.append('name', form.name);
    data.append('description', form.description);
    data.append('rentalPrice', form.rentalPrice);
    data.append('quantity', form.quantity);
    data.append('category', form.category);
    data.append('available', String(form.available));
    if (image) data.append('image', image);

    setSubmitting(true);
    try {
      const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      const res = await axios.post(`${baseUrl}/equipment`, data, {
        headers: { Authorization: `Bearer ${token}` }, // let axios set Content-Type with boundary
      });
      setMessage('Equipment added successfully.');
  // Reset form
  setForm({ name: '', description: '', rentalPrice: '', quantity: '', category: 'Lighting', available: true });
      setImage(null);
      // Refresh list
      fetchItems();
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || 'Failed to add equipment.');
    } finally {
      setSubmitting(false);
    }
  };

  const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${baseUrl}/equipment`);
      setItems(res.data.items || []);
    } catch (err) {
      console.error(err);
      setMessage('Failed to load equipment.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const startEdit = (item) => {
    setEditing({ ...item });
    setEditImage(null);
  };

  const cancelEdit = () => {
    setEditing(null);
    setEditImage(null);
  };

  const saveEdit = async () => {
    if (!editing) return;
    const token = localStorage.getItem('token');
    const data = new FormData();
    data.append('name', editing.name || '');
    data.append('description', editing.description || '');
    data.append('rentalPrice', editing.rentalPrice);
    data.append('quantity', editing.quantity);
    data.append('category', editing.category || 'General');
    data.append('available', String(!!editing.available));
    if (editImage) data.append('image', editImage);

    try {
      await axios.put(`${baseUrl}/equipment/${editing._id}`, data, {
        headers: { Authorization: `Bearer ${token}` }, // let axios set Content-Type with boundary
      });
      setMessage('Equipment updated successfully.');
      cancelEdit();
      fetchItems();
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || 'Failed to update equipment.');
    }
  };

  const deleteItem = async (id) => {
    if (!window.confirm('Delete this equipment?')) return;
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${baseUrl}/equipment/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage('Equipment deleted.');
      fetchItems();
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || 'Failed to delete equipment.');
    }
  };

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

  return (
    <div style={{ background: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', maxWidth: 1000, margin: '0 auto' }}>
      <h2 style={{ color: '#1e293b', margin: '0 0 20px 0' }}>Inventory Management</h2>
      <p style={{ color: '#64748b' }}>Add, edit, and delete event equipment.</p>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6 }}>Name</label>
            <input name="name" value={form.name} onChange={handleChange} placeholder="e.g., Stage Light" style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6 }}>Category</label>
            <select name="category" value={form.category} onChange={handleChange} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }}>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', marginBottom: 6 }}>Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={3} placeholder="Short description" style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6 }}>Rental Price (per day)</label>
            <input type="number" step="0.01" min="0" name="rentalPrice" value={form.rentalPrice} onChange={handleChange} placeholder="e.g., 1500" style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6 }}>Quantity</label>
            <input type="number" min="0" name="quantity" value={form.quantity} onChange={handleChange} placeholder="e.g., 10" style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6 }}>Image</label>
            <input type="file" accept="image/*" onChange={handleImage} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" id="available" name="available" checked={form.available} onChange={handleChange} />
            <label htmlFor="available">Available</label>
          </div>
        </div>

        <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
          <button type="submit" disabled={submitting} style={{ background: '#2563eb', color: 'white', padding: '10px 16px', borderRadius: 8, border: 'none' }}>
            {submitting ? 'Adding...' : 'Add Equipment'}
          </button>
          {message && <span style={{ color: message.includes('success') ? '#16a34a' : '#dc2626' }}>{message}</span>}
        </div>
      </form>

      <div style={{ marginTop: 30 }}>
        <h3 style={{ marginBottom: 10 }}>Equipment List</h3>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f1f5f9' }}>
                  <th style={{ textAlign: 'left', padding: 8 }}>Image</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Name</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Category</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Price</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Qty</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Available</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it._id} style={{ borderTop: '1px solid #e2e8f0' }}>
                    <td style={{ padding: 8 }}>
                      {it.image ? (
                        <img src={`http://localhost:5000${it.image}`} alt={it.name} style={{ width: 60, height: 40, objectFit: 'cover', borderRadius: 6 }} />
                      ) : (
                        <div style={{ width: 60, height: 40, background: '#e2e8f0', borderRadius: 6 }} />
                      )}
                    </td>
                    <td style={{ padding: 8 }}>{it.name}</td>
                    <td style={{ padding: 8 }}>{it.category}</td>
                    <td style={{ padding: 8 }}>{it.rentalPrice}</td>
                    <td style={{ padding: 8 }}>{it.quantity}</td>
                    <td style={{ padding: 8 }}>{it.available ? 'Yes' : 'No'}</td>
                    <td style={{ padding: 8, display: 'flex', gap: 8 }}>
                      <button onClick={() => startEdit(it)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #cbd5e1', background: 'white' }}>Edit</button>
                      <button onClick={() => deleteItem(it._id)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #fecaca', background: '#fee2e2', color: '#dc2626' }}>Delete</button>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ padding: 12, textAlign: 'center', color: '#64748b' }}>No equipment found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal (simple inline panel) */}
      {editing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', padding: 20, borderRadius: 12, width: 500, maxWidth: '90%' }}>
            <h3 style={{ marginTop: 0 }}>Edit Equipment</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label>Name</label>
                <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} style={{ width: '100%', padding: 8, border: '1px solid #e2e8f0', borderRadius: 6 }} />
              </div>
              <div>
                <label>Category</label>
                <select value={categories.includes(editing.category) ? editing.category : 'Lighting'} onChange={(e) => setEditing({ ...editing, category: e.target.value })} style={{ width: '100%', padding: 8, border: '1px solid #e2e8f0', borderRadius: 6 }}>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label>Description</label>
                <textarea value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={3} style={{ width: '100%', padding: 8, border: '1px solid #e2e8f0', borderRadius: 6 }} />
              </div>
              <div>
                <label>Price</label>
                <input type="number" value={editing.rentalPrice} onChange={(e) => setEditing({ ...editing, rentalPrice: e.target.value })} style={{ width: '100%', padding: 8, border: '1px solid #e2e8f0', borderRadius: 6 }} />
              </div>
              <div>
                <label>Quantity</label>
                <input type="number" value={editing.quantity} onChange={(e) => setEditing({ ...editing, quantity: e.target.value })} style={{ width: '100%', padding: 8, border: '1px solid #e2e8f0', borderRadius: 6 }} />
              </div>
              <div style={{ gridColumn: 'span 2', display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="checkbox" id="editAvailable" checked={!!editing.available} onChange={(e) => setEditing({ ...editing, available: e.target.checked })} />
                <label htmlFor="editAvailable">Available</label>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label>Replace Image</label>
                <input type="file" accept="image/*" onChange={(e) => setEditImage(e.target.files?.[0] || null)} />
              </div>
            </div>
            <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={cancelEdit} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', background: 'white' }}>Cancel</button>
              <button onClick={saveEdit} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #93c5fd', background: '#dbeafe', color: '#1d4ed8' }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default InventoryManagement;