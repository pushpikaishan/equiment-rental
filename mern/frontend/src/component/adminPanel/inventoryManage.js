import React, { useEffect, useState } from 'react';
import axios from 'axios';
<<<<<<< Updated upstream
import jsPDF from 'jspdf';
import { headerCard, headerTitle, headerSub, card as cardBox, btn as btnFilled, input as inputBox, select as selectBox } from './adminStyles';
=======
>>>>>>> Stashed changes

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
  // Restock modal state
  const [showRestock, setShowRestock] = useState(false);
  const [restockSelection, setRestockSelection] = useState({}); // { [equipmentId]: qtyToAdd }
  const [restockWholesaler, setRestockWholesaler] = useState('');
  const [restocking, setRestocking] = useState(false);

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

    // Numeric validation: price and quantity must be > 0
    const priceNum = Number(form.rentalPrice);
    const qtyNum = Number(form.quantity);
    if (!(priceNum > 0)) {
      setMessage('Rental price must be greater than 0.');
      return;
    }
    if (!(qtyNum > 0)) {
      setMessage('Quantity must be greater than 0.');
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
  const token = localStorage.getItem('token');

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

  // Export CSV: include image URL column
  const exportCSV = () => {
    if (!items || items.length === 0) {
      alert('No equipment to export');
      return;
    }
    const header = ['Name', 'Category', 'Description', 'Price', 'Quantity', 'Available', 'Image URL'];
    const rows = items.map((it) => [
      cleanCSV(it.name),
      cleanCSV(it.category),
      cleanCSV(it.description),
      String(it.rentalPrice ?? ''),
      String(it.quantity ?? ''),
      it.available ? 'Yes' : 'No',
      it.image ? `${baseUrl}${it.image}` : ''
    ]);

    const csv = [header, ...rows]
      .map((r) => r.map(csvEscape).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'inventory.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const csvEscape = (val) => {
    const s = String(val ?? '');
    // Escape double quotes by doubling them and wrap field with quotes
    return '"' + s.replace(/"/g, '""') + '"';
  };

  const cleanCSV = (val) => (val == null ? '' : String(val).replace(/\r|\n/g, ' ').trim());

  // Export PDF: include photo thumbnails and key fields
  const exportToPDF = async (filename = "inventory-report.pdf") => {
    try {
      // dynamic import prevents webpack from requiring 'jspdf' at build-time
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();

      // Try to serialize a table with id="inventory-table" if present, otherwise produce a simple report
      const tableEl = document.getElementById("inventory-table");
      if (tableEl) {
        const rows = Array.from(tableEl.querySelectorAll("tr")).map((tr) =>
          Array.from(tr.querySelectorAll("th,td"))
            .map((td) => td.innerText.trim())
            .join(" | ")
        );
        doc.setFontSize(10);
        rows.forEach((r, i) => doc.text(r || " ", 10, 10 + i * 6));
      } else {
        // fallback content: basic header + timestamp
        doc.setFontSize(14);
        doc.text("Inventory Report", 10, 20);
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 10, 30);
        // optionally include a short summary if you have a JS variable with items
        // doc.text(`Total items: ${items.length}`, 10, 40);
      }

      doc.save(filename);
    } catch (err) {
      console.error("PDF export failed. Ensure 'jspdf' is installed:", err);
      // User-friendly guidance
      alert(
        "PDF export failed. Install jspdf in the frontend: open a terminal in frontend folder and run:\n\nnpm install jspdf\n\nThen rebuild the app."
      );
    }
  };

  const truncate = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s);

  const toDataURL = (url) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = function () {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          const dataURL = canvas.toDataURL('image/jpeg', 0.8);
          resolve(dataURL);
        } catch (e) {
          reject(e);
        }
      };
      img.onerror = function (err) { reject(err); };
      img.src = url + (url.includes('?') ? '&' : '?') + 'cachebust=' + Date.now();
    });

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
    // Validate price and quantity > 0
    const priceNum = Number(editing.rentalPrice);
    const qtyNum = Number(editing.quantity);
    if (!(priceNum > 0)) { alert('Rental price must be greater than 0.'); return; }
    if (!(qtyNum > 0)) { alert('Quantity must be greater than 0.'); return; }
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

  // Low stock helpers
  const LOW_STOCK_QTY = 5; // threshold for low stock items
  // Exclude certain categories from the restock flow
  const EXCLUDED_RESTOCK_CATEGORIES = ['Tents & Shelters', 'Stage & Platform Equipment'];
  const lowItems = (items || []).filter(it =>
    Number(it.quantity || 0) <= LOW_STOCK_QTY && !EXCLUDED_RESTOCK_CATEGORIES.includes(String(it.category))
  );
  const WHOLESALERS = [
    { id: 'wh1', name: 'Ceylon Equip Wholesale' },
    { id: 'wh2', name: 'Lanka Gear Traders' },
    { id: 'wh3', name: 'Island Supply Co.' },
    { id: 'wh4', name: 'Colombo Bulk Rentals' },
    { id: 'wh5', name: 'Kandy Wholesale Hub' },
  ];

  return (
    <div>
      <div style={headerCard}>
        <h1 style={headerTitle}>Inventory Management</h1>
        <p style={headerSub}>Add, edit, and delete event equipment.</p>
      </div>

      <div style={{ ...cardBox, padding: 20 }}>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6 }}>Name</label>
            <input name="name" value={form.name} onChange={handleChange} placeholder="e.g., Stage Light" style={{ ...inputBox, width: '100%' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6 }}>Category</label>
            <select name="category" value={form.category} onChange={handleChange} style={{ ...selectBox, width: '100%' }}>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', marginBottom: 6 }}>Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={3} placeholder="Short description" style={{ ...inputBox, width: '100%' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6 }}>Rental Price (per day)</label>
            <input type="number" step="0.01" min="0.01" name="rentalPrice" value={form.rentalPrice} onChange={handleChange} placeholder="e.g., 1500" style={{ ...inputBox, width: '100%' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6 }}>Quantity</label>
            <input type="number" min="1" name="quantity" value={form.quantity} onChange={handleChange} placeholder="e.g., 10" style={{ ...inputBox, width: '100%' }} />
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
          <button type="submit" disabled={submitting} style={btnFilled('#2563eb')}>
            {submitting ? 'Adding...' : 'Add Equipment'}
          </button>
          {message && <span style={{ color: message.includes('success') ? '#16a34a' : '#dc2626' }}>{message}</span>}
        </div>
      </form>
      </div>

      <div style={{ ...cardBox, padding: 20, marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <h3 style={{ margin: 0 }}>Equipment List</h3>
          <div style={{ display: 'flex', gap: 8 }}>
<<<<<<< Updated upstream
            <button onClick={exportPDF} style={btnFilled('#f59e0b')}>Export PDF</button>
            <button onClick={exportCSV} style={btnFilled('#16a34a')}>Export CSV</button>
            <button
              onClick={() => { setShowRestock(true); setRestockSelection({}); setRestockWholesaler(''); }}
              disabled={lowItems.length === 0}
              title={lowItems.length === 0 ? 'No low stock items' : 'Restock low items'}
              style={btnFilled(lowItems.length ? '#1d4ed8' : '#94a3b8')}
            >
              Restock
            </button>
=======
            <button onClick={() => exportToPDF()} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#f1f5f9' }}>Export PDF</button>
            <button onClick={exportCSV} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#f1f5f9' }}>Export CSV</button>
>>>>>>> Stashed changes
          </div>
        </div>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table id="inventory-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
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
                    <td style={{ padding: 8 }}>
                      <span style={{ fontWeight: 600, color: Number(it.quantity||0) <= LOW_STOCK_QTY ? '#b91c1c' : '#0f172a' }}>{it.quantity}</span>
                    </td>
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

      {/* Damaged List Section */}
      <div style={{ marginTop: 40 }}>
        <h3 style={{ margin: 0 }}>Damaged List</h3>
        <p style={{ color: '#64748b', marginTop: 6 }}>Items with reported damage from recollect reports.</p>
        {(() => {
          const damagedItems = (items || []).filter(it => Number(it.damagedCount || 0) > 0);
          if (damagedItems.length === 0) {
            return <div style={{ padding: 12, color: '#64748b' }}>No damaged items reported.</div>;
          }
          return (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9' }}>
                    <th style={{ textAlign: 'left', padding: 8 }}>Image</th>
                    <th style={{ textAlign: 'left', padding: 8 }}>Name</th>
                    <th style={{ textAlign: 'left', padding: 8 }}>Category</th>
                    <th style={{ textAlign: 'left', padding: 8 }}>Damaged Count</th>
                    <th style={{ textAlign: 'left', padding: 8 }}>Recent Damages</th>
                  </tr>
                </thead>
                <tbody>
                  {damagedItems.map((it) => (
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
                      <td style={{ padding: 8 }}>{Number(it.damagedCount || 0)}</td>
                      <td style={{ padding: 8 }}>
                        {(it.damageLogs || []).length === 0 ? (
                          <span style={{ color: '#64748b' }}>No log entries</span>
                        ) : (
                          <details>
                            <summary style={{ cursor: 'pointer', color: '#2563eb' }}>View latest logs</summary>
                            <div style={{ padding: '6px 0', color: '#475569' }}>
                              {(it.damageLogs || []).slice().reverse().slice(0,5).map((log, idx) => (
                                <div key={idx} style={{ borderTop: '1px dashed #e2e8f0', paddingTop: 6, marginTop: 6 }}>
                                  <div><strong>Date:</strong> {new Date(log.at).toLocaleString()}</div>
                                  <div><strong>Qty:</strong> {log.qty} | <strong>Condition:</strong> {log.condition}</div>
                                  {log.note && <div><strong>Note:</strong> {log.note}</div>}
                                </div>
                              ))}
                              {it.damageLogs.length > 5 && <div style={{ marginTop: 6, fontSize: 12, color: '#94a3b8' }}>(showing latest 5)</div>}
                            </div>
                          </details>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })()}
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
                <input type="number" step="0.01" min="0.01" value={editing.rentalPrice} onChange={(e) => setEditing({ ...editing, rentalPrice: e.target.value })} style={{ width: '100%', padding: 8, border: '1px solid #e2e8f0', borderRadius: 6 }} />
              </div>
              <div>
                <label>Quantity</label>
                <input type="number" min="1" value={editing.quantity} onChange={(e) => setEditing({ ...editing, quantity: e.target.value })} style={{ width: '100%', padding: 8, border: '1px solid #e2e8f0', borderRadius: 6 }} />
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

      {/* Restock Modal */}
      {showRestock && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 50 }}>
          <div style={{ width: '100%', maxWidth: 800, background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontWeight: 700 }}>Restock Low Items</div>
              <button onClick={() => setShowRestock(false)} style={{ padding: '6px 10px', borderRadius: 8, background: 'white', border: '1px solid #cbd5e1' }}>Close</button>
            </div>
            {lowItems.length === 0 ? (
              <div>No low stock items.</div>
            ) : (
              <div style={{ display: 'grid', gap: 12 }}>
                <div style={{ fontSize: 12, color: '#64748b' }}>Select items and quantities to add, then choose a wholesaler.</div>
                <div style={{ maxHeight: 420, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #e2e8f0' }}>Select</th>
                        <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #e2e8f0' }}>Item</th>
                        <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #e2e8f0' }}>Current Qty</th>
                        <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #e2e8f0' }}>Add Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lowItems.map(it => {
                        const selQty = Number(restockSelection[it._id] || 0);
                        const checked = selQty > 0;
                        return (
                          <tr key={it._id}>
                            <td style={{ padding: 8, borderBottom: '1px solid #f1f5f9' }}>
                              <input type="checkbox" checked={checked} onChange={(e) => {
                                setRestockSelection(prev => ({ ...prev, [it._id]: e.target.checked ? (prev[it._id] || 10) : 0 }));
                              }} />
                            </td>
                            <td style={{ padding: 8, borderBottom: '1px solid #f1f5f9' }}>
                              <div style={{ fontWeight: 600 }}>{it.name}</div>
                              <div style={{ fontSize: 12, color: '#64748b' }}>{it.category}</div>
                            </td>
                            <td style={{ padding: 8, borderBottom: '1px solid #f1f5f9' }}>{it.quantity}</td>
                            <td style={{ padding: 8, borderBottom: '1px solid #f1f5f9' }}>
                              <input type="number" min={1} value={selQty || ''} placeholder="0" onChange={(e) => {
                                const val = Math.max(0, Number(e.target.value));
                                setRestockSelection(prev => ({ ...prev, [it._id]: val }));
                              }} style={{ width: 120, padding: 6, borderRadius: 8, border: '1px solid #cbd5e1' }} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4 }}>Select wholesaler</label>
                  <select value={restockWholesaler} onChange={(e) => setRestockWholesaler(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', minWidth: 280 }}>
                    <option value="">Choose wholesaler…</option>
                    {WHOLESALERS.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button onClick={() => setShowRestock(false)} style={{ padding: '8px 12px', borderRadius: 8, background: 'white', border: '1px solid #cbd5e1' }}>Cancel</button>
                  <button onClick={async () => {
                    const entries = Object.entries(restockSelection).filter(([,q]) => Number(q) > 0);
                    if (entries.length === 0) { setMessage('Select at least one item with a quantity'); return; }
                    if (!restockWholesaler) { setMessage('Please select a wholesaler'); return; }
                    setRestocking(true);
                    try {
                      const payload = {
                        items: entries.map(([id, qty]) => ({ id, qty: Number(qty) })),
                        wholesaler: { id: restockWholesaler, name: (WHOLESALERS.find(w=>w.id===restockWholesaler)||{}).name }
                      };
                      await axios.post(`${baseUrl}/equipment/restock`, payload, { headers: { Authorization: `Bearer ${token}` } });
                      setShowRestock(false);
                      setRestockSelection({});
                      setRestockWholesaler('');
                      await fetchItems();
                    } catch (e) {
                      setMessage(e.response?.data?.message || e.message);
                    } finally {
                      setRestocking(false);
                    }
                  }} disabled={restocking} style={btnFilled('#16a34a')}>{restocking ? 'Processing…' : 'Process'}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
export default InventoryManagement;