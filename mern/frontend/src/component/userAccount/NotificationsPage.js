import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import UserNavbar from '../shop/UserNavbar';
import SiteFooter from '../common/SiteFooter';

export default function NotificationsPage() {
	const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
	const token = localStorage.getItem('token');
	const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);
	const [loading, setLoading] = useState(true);
	const [deliveries, setDeliveries] = useState([]);
	const [payments, setPayments] = useState([]);

	const downloadBlob = (blob, fileName) => {
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = fileName;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		window.URL.revokeObjectURL(url);
	};

	const downloadRefundReceipt = async (payment) => {
		try {
			const res = await axios.get(`${baseUrl}/payments/${payment._id}/refund-receipt`, { headers, responseType: 'blob' });
			const name = `refund-receipt-${payment.orderId || payment.bookingId || payment._id}.pdf`;
			downloadBlob(new Blob([res.data], { type: 'application/pdf' }), name);
		} catch (e) {
			alert('Failed to download refund receipt');
		}
	};

	const load = async () => {
		setLoading(true);
		try {
			const [dres, pres] = await Promise.all([
				axios.get(`${baseUrl}/deliveries/user/my`, { headers }),
				axios.get(`${baseUrl}/payments/my`, { headers }),
			]);
			const ditems = dres.data?.items || [];
			setDeliveries(
				ditems.map(({ delivery, booking }) => ({
					id: delivery?._id || `${booking?._id}-no-delivery`,
					bookingId: booking?._id,
					customerName: booking?.customerName,
					address: booking?.deliveryAddress,
					bookingDate: booking?.bookingDate,
					status: delivery?.status || 'unassigned',
					driverName: delivery?.driverId?.name || delivery?.driver || '-',
					driverPhone: delivery?.driverId?.phoneno || '-',
				}))
			);
			// Normalize payments to an array regardless of backend shape
			const pRaw = pres.data;
			let pList = [];
			if (Array.isArray(pRaw)) pList = pRaw;
			else if (Array.isArray(pRaw?.payments)) pList = pRaw.payments;
			else if (Array.isArray(pRaw?.items)) pList = pRaw.items;
			setPayments(pList);
		} catch (e) {
			// noop
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

	const card = { background: 'white', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0' };
	const btn = (bg, color = 'white') => ({ background: bg, color, border: 'none', padding: '6px 10px', borderRadius: 6, cursor: 'pointer' });
	const pill = (bg, color = 'white') => ({ background: bg, color, borderRadius: 999, padding: '2px 8px', fontSize: 12, display: 'inline-block' });
	const statusColor = (s) => ({
		assigned: '#0ea5e9',
		'in-progress': '#2563eb',
		delivered: '#16a34a',
		failed: '#ef4444',
	}[(s || '').toLowerCase()] || '#9ca3af');

	const fakeTrack = (id) => alert(`Live tracking (demo): Booking ${id} — driver en route…`);

	return (
		<div>
			<UserNavbar />
			<div style={{ padding: 20, maxWidth: 1000, margin: '0 auto' }}>
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
					<h2 style={{ margin: 0 }}>Notifications</h2>
					<button onClick={load} style={btn('#0ea5e9')}>Refresh</button>
				</div>

				{/* Booking status notifications */}
				<div style={{ ...card, marginTop: 12 }}>
					<h3 style={{ marginTop: 0 }}>Booking Status</h3>
					{loading ? (
						<div>Loading…</div>
					) : deliveries.length === 0 ? (
						<div>No delivery updates yet.</div>
					) : (
						<div style={{ display: 'grid', gap: 10 }}>
							{deliveries.map((d) => (
								<div key={d.id} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 12 }}>
									<div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
										<div>
											<div style={{ fontWeight: 700 }}>Order ID: <code>{d.bookingId}</code></div>
											<div style={{ color: '#64748b' }}>Customer: {d.customerName || '-'}</div>
											<div style={{ color: '#64748b' }}>Address: {d.address || '-'}</div>
											<div style={{ color: '#64748b' }}>Date: {d.bookingDate ? new Date(d.bookingDate).toLocaleDateString() : '-'}</div>
											<div style={{ marginTop: 4 }}>
												<span style={pill(statusColor(d.status))}>Status: {String(d.status).toUpperCase()}</span>
											</div>
											<div style={{ color: '#0f172a', marginTop: 4 }}>
												Driver: {d.driverName} {d.driverPhone && `(${d.driverPhone})`}
											</div>
										</div>
										<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
											<button onClick={() => fakeTrack(d.bookingId)} style={btn('#10b981')}>Tracking Live Location</button>
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</div>

				{/* Payments & Refunds */}
				<div style={{ ...card, marginTop: 12 }}>
					<h3 style={{ marginTop: 0 }}>Payments & Refunds</h3>
								{loading ? (
						<div>Loading…</div>
								) : !Array.isArray(payments) || payments.length === 0 ? (
						<div>No payments yet.</div>
					) : (
						<div style={{ overflowX: 'auto' }}>
							<table style={{ width: '100%', borderCollapse: 'collapse' }}>
								<thead>
									<tr style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
										<th style={{ padding: 8 }}>Created</th>
										<th style={{ padding: 8 }}>Order ID</th>
										<th style={{ padding: 8 }}>Status</th>
										<th style={{ padding: 8 }}>Amount</th>
										<th style={{ padding: 8 }}>Download</th>
									</tr>
								</thead>
								<tbody>
									{Array.isArray(payments) && payments.map((p) => (
										<tr key={p._id || `${p.bookingId}-pay`} style={{ borderBottom: '1px solid #f1f5f9' }}>
											<td style={{ padding: 8 }}>{p.createdAt ? new Date(p.createdAt).toLocaleString() : '-'}</td>
											<td style={{ padding: 8 }}><code>{p.bookingId || '-'}</code></td>
											<td style={{ padding: 8 }}>
												<span style={{
													background: (p.status === 'paid') ? '#dcfce7' : (p.status === 'partial_refunded') ? '#fef3c7' : (p.status === 'refunded') ? '#fee2e2' : '#e2e8f0',
													color: (p.status === 'paid') ? '#166534' : (p.status === 'partial_refunded') ? '#92400e' : (p.status === 'refunded') ? '#dc2626' : '#334155',
													padding: '2px 8px',
													borderRadius: 9999,
													fontWeight: 600,
													fontSize: 12,
													textTransform: 'capitalize'
												}}>{(p.status || '').replace(/_/g, ' ')}</span>
											</td>
											<td style={{ padding: 8 }}>LKR {Number(p.amount || 0).toFixed(2)}</td>
											<td style={{ padding: 8 }}>
												<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
													{p.invoicePath && (
														<a href={`${baseUrl}${p.invoicePath}`} target="_blank" rel="noreferrer" style={{ ...btn('#64748b'), textDecoration: 'none', display: 'inline-block' }}>Invoice</a>
													)}
													{(p.status === 'refunded' || p.status === 'partial_refunded') && p._id && (
														<button onClick={() => downloadRefundReceipt(p)} style={btn('#0ea5e9')}>Refund Receipt</button>
													)}
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</div>
			<SiteFooter />
		</div>
	);
}

