import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import SupplierTopbar from '../supplierPanel/SupplierTopbar';

export default function DriverDashboard() {
  const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');
  const role = localStorage.getItem('role');
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const [profile, setProfile] = useState(null);
  const [deliveries, setDeliveries] = useState([]);
  const [recollects, setRecollects] = useState([]);
  const [reportFor, setReportFor] = useState(null); // bookingId
  const [reportBooking, setReportBooking] = useState(null);
  const [reportItems, setReportItems] = useState([]);
  const [reportComment, setReportComment] = useState('');
  const [reportReturnDate, setReportReturnDate] = useState(() => new Date().toISOString().slice(0,10));
  const [reportSavedActual, setReportSavedActual] = useState(null);

  // Dynamic repair total hint based on current selections
  const repairTotalHint = useMemo(() => {
    if (!reportBooking || !Array.isArray(reportItems)) return 0;
    const items = reportBooking.items || [];
    const unitMap = new Map(items.map(x => [String(x.equipmentId || x.name), Number(x.pricePerDay || 0)]));
    return reportItems.reduce((sum, it) => {
      const key = String(it.equipmentId || it.name);
      const unit = unitMap.get(key) || 0;
      const damaged = Math.max(0, Number(it.expectedQty || 0) - Number(it.collectedQty || 0));
      let cost = 0;
      if (it.condition === 'minor') cost = 0.5 * unit * damaged;
      if (it.condition === 'major') cost = 1.0 * unit * damaged;
      return sum + cost;
    }, 0);
  }, [reportItems, reportBooking]);

  const lateFineHint = useMemo(() => {
    if (!reportBooking) return 0;
    // planned vs actual
    const planned = reportBooking.returnDate ? new Date(reportBooking.returnDate) : null;
    const actual = reportReturnDate ? new Date(reportReturnDate) : null;
    if (!planned || !actual) return 0;
    const lateDays = Math.max(0, Math.ceil((actual - planned) / (1000 * 60 * 60 * 24)));
    // totalPerDay = sum(pricePerDay * qty)
    const items = reportBooking.items || [];
    const totalPerDay = items.reduce((sum, bi) => sum + Number(bi.pricePerDay || 0) * Number(bi.qty || 0), 0);
    // Updated formula: late fine = lateDays * (totalPerDay * 0.2)
    return lateDays * (totalPerDay * 0.2);
  }, [reportBooking, reportReturnDate]);
  const [loading, setLoading] = useState(false);

  const fetchProfile = async () => {
    try {
      if (!userId) return;
      const res = await axios.get(`${baseUrl}/users/${userId}`, { headers });
      setProfile(res.data);
    } catch (e) {
      // ignore
    }
  };

  const fetchDeliveries = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${baseUrl}/deliveries/driver/my`, { headers });
      const list = res.data?.deliveries || [];
      // enrich with booking fields if populated
      const normalized = list.map(d => {
        const b = d.bookingId || {};
        return {
          _id: d._id,
          bookingId: b?._id || d.bookingId,
          driverId: d.driverId,
          status: d.status,
          createdAt: d.createdAt,
          updatedAt: d.updatedAt,
          customerName: b.customerName,
          deliveryAddress: b.deliveryAddress,
          bookingDate: b.bookingDate,
          total: b.total,
        };
      });
      setDeliveries(normalized);
      // recollect tasks
      const rres = await axios.get(`${baseUrl}/deliveries/driver/recollect/my`, { headers });
      const rlist = rres.data?.deliveries || [];
      const rnorm = rlist.map(d => {
        const b = d.bookingId || {};
        return {
          _id: d._id,
          bookingId: b?._id || d.bookingId,
          status: d.recollectStatus,
          customerName: b.customerName,
          deliveryAddress: b.deliveryAddress,
          bookingDate: b.bookingDate,
          booking: b,
          recollectReport: d.recollectReport || null,
        };
      });
      setRecollects(rnorm);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); fetchDeliveries(); /* eslint-disable-next-line */ }, []);

  const updateStatus = async (bookingId, status) => {
    try {
      await axios.put(`${baseUrl}/deliveries/driver/${bookingId}/status`, { status }, { headers });
      await fetchDeliveries();
      alert('Status updated');
    } catch (e) {
      alert(e.response?.data?.message || e.message);
    }
  };

  // Live location tracking when driver starts a delivery
  const trackers = useMemo(() => new Map(), []);
  useEffect(() => {
    return () => {
      // cleanup geolocation watches on unmount
      trackers.forEach((entry) => {
        if (entry?.watchId && navigator.geolocation) {
          navigator.geolocation.clearWatch(entry.watchId);
        }
      });
      trackers.clear();
    };
  }, [trackers]);

  const startTracking = (bookingId) => {
    if (!navigator.geolocation) return;
    if (trackers.has(bookingId)) return; // already tracking
    const send = async (pos) => {
      try {
        const { latitude, longitude, accuracy } = pos.coords || {};
        if (typeof latitude === 'number' && typeof longitude === 'number') {
          await axios.put(
            `${baseUrl}/deliveries/driver/${bookingId}/location`,
            { lat: latitude, lng: longitude, accuracy },
            { headers }
          );
        }
      } catch (_) {}
    };
    const watchId = navigator.geolocation.watchPosition(
      send,
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
    );
    trackers.set(bookingId, { watchId });
  };

  const stopTracking = (bookingId) => {
    const entry = trackers.get(bookingId);
    if (entry?.watchId && navigator.geolocation) {
      navigator.geolocation.clearWatch(entry.watchId);
    }
    trackers.delete(bookingId);
  };

  const updateRecollectStatus = async (bookingId, status) => {
    try {
      await axios.put(`${baseUrl}/deliveries/driver/${bookingId}/recollect/status`, { status }, { headers });
      await fetchDeliveries();
      alert('Recollect status updated');
    } catch (e) {
      alert(e.response?.data?.message || e.message);
    }
  };

  const openReport = (rec) => {
    setReportFor(rec.bookingId);
    setReportBooking(rec.booking || null);
    const baseItems = Array.isArray(rec.booking?.items)
      ? rec.booking.items.map(it => ({
          equipmentId: it.equipmentId,
          name: it.name,
          expectedQty: it.qty,
          collectedQty: it.qty,
          condition: 'none',
          note: ''
        }))
      : [];
    setReportItems(baseItems);
    setReportComment('');
    const savedActual = rec.recollectReport?.actualReturnDate ? new Date(rec.recollectReport.actualReturnDate) : null;
    setReportReturnDate((savedActual || new Date()).toISOString().slice(0,10));
    setReportSavedActual(savedActual ? savedActual.toISOString() : null);
  };

  const closeReport = () => {
    setReportFor(null);
    setReportBooking(null);
    setReportItems([]);
    setReportComment('');
  };

  const submitReport = async () => {
    try {
      await axios.post(
        `${baseUrl}/deliveries/driver/${reportFor}/recollect/report`,
        { items: reportItems, comment: reportComment, actualReturnDate: reportReturnDate },
        { headers }
      );
      closeReport();
      await fetchDeliveries();
      alert('Report submitted');
    } catch (e) {
      alert(e.response?.data?.message || e.message);
    }
  };

  // Logout handled by shared topbar

  const Card = ({ children, style }) => (
    <div style={{ background: 'white', padding: 16, borderRadius: 12, boxShadow: '0 4px 10px rgba(0,0,0,0.05)', ...style }}>{children}</div>
  );

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <SupplierTopbar title="Driver Dashboard" />
      <div style={{ padding: '16px 12px' }}>
      {/* Profile card removed as per request */}

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ marginTop: 0 }}>Assigned Deliveries</h3>
          {role !== 'staff' && <span style={{ color: '#dc2626', fontSize: 12 }}>Not a staff account</span>}
        </div>
        {loading ? (
          <div>Loading…</div>
        ) : deliveries.length === 0 ? (
          <div>No deliveries assigned.</div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {deliveries.map(d => (
              <div key={d._id} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>Order: <code>{d.bookingId}</code></div>
                    <div style={{ color: '#64748b' }}>Customer: {d.customerName || '-'}</div>
                    <div style={{ color: '#64748b' }}>Address: {d.deliveryAddress || '-'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div>Status: <span style={{ textTransform: 'capitalize' }}>{d.status}</span></div>
                    <div>Booking Date: {d.bookingDate ? new Date(d.bookingDate).toLocaleDateString() : '-'}</div>
                    <div>Total: LKR {Number(d.total || 0).toFixed(2)}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                  <button onClick={() => { updateStatus(d.bookingId, 'in-progress'); startTracking(d.bookingId); }} disabled={d.status !== 'assigned'} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '8px 12px', borderRadius: 8 }}>Start</button>
                  <button onClick={() => { updateStatus(d.bookingId, 'delivered'); stopTracking(d.bookingId); }} disabled={!(d.status === 'assigned' || d.status === 'in-progress')} style={{ background: '#16a34a', color: 'white', border: 'none', padding: '8px 12px', borderRadius: 8 }}>Completed</button>
                  <button onClick={() => updateStatus(d.bookingId, 'failed')} disabled={d.status === 'delivered'} style={{ background: '#f59e0b', color: 'white', border: 'none', padding: '8px 12px', borderRadius: 8 }}>Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ marginTop: 0 }}>Recollect Tasks</h3>
        </div>
        {loading ? (
          <div>Loading…</div>
        ) : recollects.length === 0 ? (
          <div>No recollect tasks assigned.</div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {recollects.map(r => (
              <div key={r._id} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>Order: <code>{r.bookingId}</code></div>
                    <div style={{ color: '#64748b' }}>Customer: {r.customerName || '-'}</div>
                    <div style={{ color: '#64748b' }}>Address: {r.deliveryAddress || '-'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div>Status: <span style={{ textTransform: 'capitalize' }}>{r.status}</span></div>
                    <div>Booking Date: {r.bookingDate ? new Date(r.bookingDate).toLocaleDateString() : '-'}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                  <button onClick={() => updateRecollectStatus(r.bookingId, 'accepted')} disabled={!(r.status === 'assigned')} style={{ background: '#22c55e', color: 'white', border: 'none', padding: '8px 12px', borderRadius: 8 }}>Accept</button>
                  <button onClick={() => updateRecollectStatus(r.bookingId, 'rejected')} disabled={!(r.status === 'assigned')} style={{ background: '#f97316', color: 'white', border: 'none', padding: '8px 12px', borderRadius: 8 }}>Reject</button>
                  {/* Removed Start button as requested */}
                  <button onClick={() => openReport(r)} disabled={['report_submitted','returned','completed'].includes(String(r.status || ''))} style={{ background: '#7c3aed', color: 'white', border: 'none', padding: '8px 12px', borderRadius: 8 }}>Report</button>
                  <button onClick={() => updateRecollectStatus(r.bookingId, 'completed')} disabled={!(r.status === 'accepted' || r.status === 'in-progress')} style={{ background: '#16a34a', color: 'white', border: 'none', padding: '8px 12px', borderRadius: 8 }}>Completed</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {reportFor && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', padding: 20, borderRadius: 12, width: 640, maxHeight: '80vh', overflow: 'auto' }}>
            <h3 style={{ marginTop: 0 }}>Recollect Report</h3>
            <div style={{ marginBottom: 10, color: '#64748b' }}>Review booking details and enter collected quantities.</div>
            {reportBooking ? (
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, marginBottom: 12 }}>
                <div style={{ fontWeight: 600 }}>Order: <code>{reportBooking._id}</code></div>
                <div>Customer: {reportBooking.customerName} ({reportBooking.customerEmail})</div>
                <div>Address: {reportBooking.deliveryAddress}</div>
                <div>Booking Date: {reportBooking.bookingDate ? new Date(reportBooking.bookingDate).toLocaleDateString() : '-'}</div>
                <div>Planned Return Date: {reportBooking.returnDate ? new Date(reportBooking.returnDate).toLocaleDateString() : '-'}</div>
                {reportSavedActual && (
                  <div>Saved Actual Return Date: {new Date(reportSavedActual).toLocaleDateString()}</div>
                )}
                <div>Total Payment: LKR {Number(reportBooking.total || 0).toFixed(2)}</div>
                <div>Security Deposit: LKR {Number(reportBooking.securityDeposit || 0).toFixed(2)}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: 8, marginTop: 8 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#334155', marginBottom: 4 }}>Actual Return Date</label>
                    <input type="date" value={reportReturnDate} onChange={(e) => setReportReturnDate(e.target.value)} style={{ width: '100%', padding: 8, border: '1px solid #e2e8f0', borderRadius: 6 }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#334155', marginBottom: 4 }}>Days Late</label>
                    <div style={{ padding: 8, border: '1px solid #e2e8f0', borderRadius: 6, background: '#f8fafc' }}>
                      {(() => {
                        const planned = reportBooking.returnDate ? new Date(reportBooking.returnDate) : null;
                        const actual = reportReturnDate ? new Date(reportReturnDate) : null;
                        if (!planned || !actual) return '-';
                        const diff = Math.ceil((actual - planned) / (1000 * 60 * 60 * 24));
                        return diff > 0 ? `${diff} day(s)` : '0';
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: 8 }}>Equipment</th>
                    <th style={{ padding: 8 }}>Expected Qty</th>
                    <th style={{ padding: 8 }}>Collected Qty</th>
                    <th style={{ padding: 8 }}>Condition</th>
                    <th style={{ padding: 8 }}>Damaged Qty</th>
                    <th style={{ padding: 8 }}>Repair Cost (hint)</th>
                    <th style={{ padding: 8 }}>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {reportItems.map((it, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: 8 }}>{it.name}</td>
                      <td style={{ padding: 8 }}>{it.expectedQty}</td>
                      <td style={{ padding: 8 }}>
                        <input type="number" min="0" value={it.collectedQty}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            setReportItems((prev) => prev.map((p, j) => j === idx ? { ...p, collectedQty: v } : p));
                          }}
                          style={{ width: 100, padding: 6, border: '1px solid #e2e8f0', borderRadius: 6 }} />
                      </td>
                      <td style={{ padding: 8 }}>
                        <select value={it.condition}
                          onChange={(e) => setReportItems((prev) => prev.map((p, j) => j === idx ? { ...p, condition: e.target.value } : p))}
                          style={{ padding: 6, border: '1px solid #e2e8f0', borderRadius: 6 }}>
                          <option value="none">None</option>
                          <option value="minor">Minor broken</option>
                          <option value="major">Major broken</option>
                        </select>
                      </td>
                      <td style={{ padding: 8 }}>
                        {Math.max(0, Number(it.expectedQty || 0) - Number(it.collectedQty || 0))}
                      </td>
                      <td style={{ padding: 8, whiteSpace: 'nowrap' }}>
                        {(() => {
                          const damaged = Math.max(0, Number(it.expectedQty || 0) - Number(it.collectedQty || 0));
                          // We do not have unit price in this component; backend will compute authoritative cost
                          // Show a hint only when damaged > 0 and condition is set
                          if (!reportBooking) return '-';
                          // Try to locate unit price from booking items
                          const bi = (reportBooking.items || []).find(x => String(x.equipmentId) === String(it.equipmentId) || x.name === it.name);
                          const unit = Number(bi?.pricePerDay || 0);
                          let cost = 0;
                          if (it.condition === 'minor') cost = 0.5 * unit * damaged;
                          if (it.condition === 'major') cost = 1.0 * unit * damaged;
                          return cost > 0 ? `LKR ${cost.toFixed(2)}` : '-';
                        })()}
                      </td>
                      <td style={{ padding: 8 }}>
                        <input value={it.note} onChange={(e) => setReportItems((prev) => prev.map((p, j) => j === idx ? { ...p, note: e.target.value } : p))} style={{ width: '100%', padding: 6, border: '1px solid #e2e8f0', borderRadius: 6 }} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 10, display: 'grid', gap: 6, justifyItems: 'end' }}>
              <div>
                <strong>Estimated Repair Total: </strong>
                <span>LKR {repairTotalHint.toFixed(2)}</span>
              </div>
              <div>
                <strong>Estimated Late Fine: </strong>
                <span>LKR {lateFineHint.toFixed(2)}</span>
              </div>
              <div>
                <strong>Estimated Total: </strong>
                <span>LKR {(repairTotalHint + lateFineHint).toFixed(2)}</span>
              </div>
            </div>
            <div style={{ marginTop: 10 }}>
              <label style={{ display: 'block', fontSize: 12, color: '#334155', marginBottom: 4 }}>Comment</label>
              <textarea value={reportComment} onChange={(e) => setReportComment(e.target.value)} rows={3} style={{ width: '100%', padding: 8, border: '1px solid #e2e8f0', borderRadius: 6 }} />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
              <button onClick={closeReport} style={{ background: '#64748b', color: 'white', border: 'none', padding: '8px 12px', borderRadius: 8 }}>Cancel</button>
              <button onClick={submitReport} style={{ background: '#7c3aed', color: 'white', border: 'none', padding: '8px 12px', borderRadius: 8 }}>Submit Report</button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
