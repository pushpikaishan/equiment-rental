import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import UserManagement from "./usermanage";
import InventoryManagement from "./inventoryManage";
import PaymentManagement from "./PaymentManage";
import BookingManagement from "./bookingManage";
import DeliveryManagement from "./deliveryManage";

import  Setting from "./adminProfile/adminMenu";
import  Profile from "./adminProfile/addminProfile";

// Main Dashboard Component
function AdminDashboard() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profile, setProfile] = useState(null);
  const [upcomingOverview, setUpcomingOverview] = useState(null);
  const navigate = useNavigate();

  // Fetch admin profile
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await axios.get("http://localhost:5000/auth/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(res.data);
      } catch (err) {
        console.error("Error fetching profile:", err.response?.data || err.message);
      }
    };

    fetchProfile();
  }, []);

  // Sidebar: upcoming overview (next 7 days) counts by status
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
    (async () => {
      try {
        const res = await axios.get(`${baseUrl}/bookings/admin/upcoming?days=7`, { headers: { Authorization: `Bearer ${token}` } });
        setUpcomingOverview(res.data?.countsByStatus || null);
      } catch (_) {
        // ignore
      }
    })();
  }, []);

  // Generate avatar based on user's name and role
  const getAvatarUrl = (name, role) => {
    const initials = name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'A';
    const colors = {
      user: '4f46e5',
      staff: '059669', 
      supplier: 'dc2626',
      admin: '7c3aed'
    };
    const bgColor = colors[role] || '7c3aed';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${bgColor}&color=fff&size=120&font-size=0.6&rounded=true&bold=true`;
  };

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/userlog');
  };

  const handleProfileClick = () => {
    setActiveSection('profile');
  };

  const containerStyle = {
    display: 'flex',
    minHeight: '100vh',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    background: '#f8fafc'
  };

  const sidebarStyle = {
    width: sidebarCollapsed ? '70px' : '280px',
    background: 'linear-gradient(180deg, #1e293b 0%, #334155 100%)',
    color: 'white',
    transition: 'width 0.3s ease',
    position: 'fixed',
    height: '100vh',
    overflowY: 'auto',
    boxShadow: '4px 0 12px rgba(0, 0, 0, 0.15)'
  };

  const mainContentStyle = {
    flex: 1,
    marginLeft: sidebarCollapsed ? '70px' : '280px',
    transition: 'margin-left 0.3s ease',
    padding: '20px',
    background: '#f8fafc',
    minHeight: '100vh'
  };

  const sidebarHeaderStyle = {
    padding: '20px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    textAlign: 'center'
  };

  const logoStyle = {
    fontSize: sidebarCollapsed ? '20px' : '24px',
    fontWeight: '700',
    color: '#60a5fa'
  };

  // Profile section styles
  const profileSectionStyle = {
    padding: '20px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    // Ensure content (image, name, role, button) is centered horizontally
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  };

  const profileImageStyle = {
    width: sidebarCollapsed ? '35px' : '60px',
    height: sidebarCollapsed ? '35px' : '60px',
    borderRadius: '50%',
    border: '3px solid rgba(255, 255, 255, 0.2)',
    transition: 'all 0.3s ease',
    // Block + auto margins to guarantee horizontal centering
    display: 'block',
    margin: sidebarCollapsed ? '0 auto' : '0 auto 12px auto'
  };

  const profileNameStyle = {
    fontSize: '14px',
    fontWeight: '600',
    color: 'white',
    marginBottom: '4px',
    opacity: sidebarCollapsed ? 0 : 1,
    transition: 'opacity 0.3s ease'
  };

  const profileRoleStyle = {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.7)',
    textTransform: 'capitalize',
    opacity: sidebarCollapsed ? 0 : 1,
    transition: 'opacity 0.3s ease'
  };

  const menuItemStyle = {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 20px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    borderLeft: '3px solid transparent'
  };

  const menuItems = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard', color: '#3b82f6' },
    { id: 'inventory', icon: '📦', label: 'Inventory Manage', color: '#10b981' },
    { id: 'users', icon: '👥', label: 'User Manage', color: '#f59e0b' },
    { id: 'bookings', icon: '📋', label: 'Booking Manage', color: '#8b5cf6' },
    { id: 'payments', icon: '💳', label: 'Payment Manage', color: '#06b6d4' },
    { id: 'delivery', icon: '🚚', label: 'Delivery Manage', color: '#ef4444' }
  ];

  return (
    <div style={containerStyle}>
      {/* Sidebar */}
      <div style={sidebarStyle}>
        <div style={sidebarHeaderStyle}>
          <div style={logoStyle}>
            {sidebarCollapsed ? 'A' : 'Admin Panel'}
          </div>
        </div>

        {/* Profile Section */}
        {profile && (
          <div
            style={{
              ...profileSectionStyle,
              backgroundColor: activeSection === 'profile' ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
            }}
            onClick={handleProfileClick}
            onMouseOver={(e) => {
              if (activeSection !== 'profile') {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
              }
            }}
            onMouseOut={(e) => {
              if (activeSection !== 'profile') {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            <img
              src={
                profile.profileImage
                  ? `http://localhost:5000${profile.profileImage}`
                  : getAvatarUrl(profile.name, profile.role)
              }
              alt="Profile"
              style={profileImageStyle}
              onMouseOver={(e) => {
                if (!sidebarCollapsed) {
                  e.target.style.transform = 'scale(1.05)';
                }
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'scale(1)';
              }}
            />
            {!sidebarCollapsed && (
              <div>
                <div style={profileNameStyle}>
                  {profile.name || 'Admin User'}
                </div>
                <div style={profileRoleStyle}>
                  {profile.role || 'Administrator'}
                </div>
                <button
                  style={{
                    marginTop: '10px',
                    padding: '6px 12px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '15px',
                    color: 'white',
                    fontSize: '11px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveSection('editProfile');
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  Profile Setting
                </button>
              </div>
            )}
          </div>
        )}

        {/* Upcoming Overview (next 7 days) */}
        {!sidebarCollapsed && (
          <div style={{ padding: '16px 16px 0 16px' }}>
            <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: 12 }}>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 8 }}>Upcoming (7 days)</div>
              {upcomingOverview ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { key: 'confirmed', label: 'Confirmed', color: '#10b981' },
                    { key: 'pending', label: 'Pending', color: '#e2e8f0' },
                    { key: 'cancelled', label: 'Cancelled', color: '#ef4444' },
                    { key: 'disputed', label: 'Disputed', color: '#f59e0b' },
                  ].map((it) => (
                    <div key={it.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: it.color, display: 'inline-block' }} />
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.9)' }}>{it.label}</span>
                      </div>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>{Number(upcomingOverview[it.key] || 0)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>No data</div>
              )}
            </div>
          </div>
        )}

        <nav style={{ padding: '20px 0' }}>
          {menuItems.map((item) => (
            <div
              key={item.id}
              style={{
                ...menuItemStyle,
                backgroundColor: activeSection === item.id ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                borderLeftColor: activeSection === item.id ? item.color : 'transparent'
              }}
              onClick={() => setActiveSection(item.id)}
              onMouseOver={(e) => {
                if (activeSection !== item.id) {
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                }
              }}
              onMouseOut={(e) => {
                if (activeSection !== item.id) {
                  e.target.style.backgroundColor = 'transparent';
                }
              }}
            >
              <span style={{ fontSize: '18px', marginRight: sidebarCollapsed ? '0' : '12px' }}>
                {item.icon}
              </span>
              {!sidebarCollapsed && (
                <span style={{ fontSize: '14px', fontWeight: '500' }}>
                  {item.label}
                </span>
              )}
            </div>
          ))}

          <div
            style={{
              ...menuItemStyle,
              marginTop: '40px',
              color: '#ef4444'
            }}
            onClick={handleSignOut}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = 'transparent';
            }}
          >
            <span style={{ fontSize: '18px', marginRight: sidebarCollapsed ? '0' : '12px' }}>
              🚪
            </span>
            {!sidebarCollapsed && (
              <span style={{ fontSize: '14px', fontWeight: '500' }}>
                Sign Out
              </span>
            )}
          </div>
        </nav>

        {/* Collapse Toggle */}
        <div
          style={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(255, 255, 255, 0.1)',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          onMouseOver={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.2)';
          }}
          onMouseOut={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.1)';
          }}
        >
          {sidebarCollapsed ? '→' : '←'}
        </div>
      </div>

      {/* Main Content */}
      <div style={mainContentStyle}>
        {activeSection === 'dashboard' && <DashboardContent />}
        {activeSection === 'profile' && <Profile profile={profile} />}
        {activeSection === 'editProfile' && <Setting profile={profile} setProfile={setProfile} setActiveSection={setActiveSection} />}
        {activeSection === 'deleteProfile' && <UserManagement />}
        {activeSection === 'users' && <UserManagement />}
        {activeSection === 'inventory' && <InventoryManagement />}
        {activeSection === 'bookings' && <BookingManagement />}
        {activeSection === 'payments' && <PaymentManagement />}
        {activeSection === 'delivery' && <DeliveryManagement />}
      </div>
    </div>
  );
}




// Dashboard Content Component
function DashboardContent() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paySummary, setPaySummary] = useState(null);
  const [deliverySummary, setDeliverySummary] = useState(null);
  const [bookSummary, setBookSummary] = useState(null);
  const [upcoming, setUpcoming] = useState({ days: [], countsByStatus: {} });
  const [selectedDate, setSelectedDate] = useState(null);
  const [activePayIdx, setActivePayIdx] = useState(null);
  const [activeBookIdx, setActiveBookIdx] = useState(null);
  const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
  const token = localStorage.getItem('token');
  useEffect(() => {
    const load = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const [sres, pres, bres, dres, ures] = await Promise.all([
          axios.get(`${baseUrl}/admins/stats`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${baseUrl}/payments/summary`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${baseUrl}/bookings/admin/summary`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${baseUrl}/deliveries/admin/summary`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${baseUrl}/bookings/admin/upcoming?days=7`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
  setStats(sres.data);
        setPaySummary(pres.data);
        setBookSummary(bres.data);
        setDeliverySummary(dres.data);
        const ud = ures.data?.days || [];
        setUpcoming({ days: ud, countsByStatus: ures.data?.countsByStatus || {} });
        if (ud.length > 0) setSelectedDate(ud[0].date);
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const statusColors = {
    pending: '#e2e8f0',
    confirmed: '#10b981',
    cancelled: '#ef4444',
    disputed: '#f59e0b',
  };
  const statusLabel = (s, disputed) => disputed ? 'disputed' : s;
  const headerStyle = {
    background: 'white',
    padding: '30px',
    borderRadius: '16px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
    marginBottom: '30px'
  };

  const statsGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '30px'
  };

  const statCardStyle = {
    background: 'white',
    padding: '25px',
    borderRadius: '16px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
    border: '2px solid #f1f5f9'
  };

  const cards = [
    { key: 'users', title: 'Total Users', value: stats?.users ?? '-', icon: '👥', color: '#3b82f6' },
    { key: 'activeOrders', title: 'Active Orders', value: stats?.activeOrders ?? '-', icon: '📋', color: '#10b981' },
    { key: 'refundCount', title: 'Total Refund Orders', value: stats?.refundCount ?? 0, icon: '↩️', color: '#ef4444' },
    { key: 'monthlyRevenue', title: 'Monthly Revenue', value: `LKR ${(Number(stats?.monthlyRevenue || 0)).toFixed(2)}`, icon: '💰', color: '#f59e0b' },
  ];

  return (
    <div>
      <div style={headerStyle}>
        <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#1e293b', margin: '0 0 8px 0' }}>
          Admin Dashboard
        </h1>
        <p style={{ color: '#64748b', margin: '0' }}>
          Welcome back! Here's what's happening with your platform.
        </p>
      </div>

      <div style={statsGridStyle}>
        {cards.map((stat, index) => (
          <div key={index} style={statCardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 8px 0' }}>
                  {stat.title}
                </p>
                <p style={{ fontSize: '28px', fontWeight: '700', color: '#1e293b', margin: '0' }}>
                  {loading ? '…' : stat.value}
                </p>
              </div>
              <div style={{
                fontSize: '32px',
                backgroundColor: `${stat.color}20`,
                padding: '12px',
                borderRadius: '12px'
              }}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px,1fr))', gap: 20, marginBottom: 20 }}>
        {/* Current Month Revenue Line Chart */}
        <div style={{ background: 'white', padding: 20, borderRadius: 16, border: '2px solid #f1f5f9', position: 'relative', overflow: 'hidden' }}>
          {/* subtle gradient backdrop */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(59,130,246,0.06), rgba(59,130,246,0.0))', pointerEvents: 'none' }} />
          <h3 style={{ marginTop: 0, position: 'relative' }}>Current Month Revenue</h3>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <LineChart data={(stats?.dailySeries || []).map((d, idx) => ({ ...d, colorIdx: idx }))} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <defs>
                  <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 12 }} interval="preserveStartEnd" />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(v) => `${Math.round(v).toLocaleString()}`} />
                <Tooltip formatter={(v) => [`LKR ${Number(v).toFixed(2)}`, 'Revenue']} labelFormatter={(l) => `Day ${l}`} />
                <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, stroke: '#1d4ed8', strokeWidth: 2, fill: 'white' }} activeDot={{ r: 6 }} />
                {/* Labels on each point */}
                {(stats?.dailySeries || []).length > 0 && (
                  <Line type="monotone" dataKey="value" strokeOpacity={0} dot={false} label={{ position: 'top', formatter: (v) => `LKR ${(Number(v)||0).toFixed(0)}`, fill: '#0f172a', fontSize: 11 }} />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        {/* Payments by Method (interactive pie) */}
        <div style={{ background: 'white', padding: 20, borderRadius: 16, border: '2px solid #f1f5f9', position: 'relative' }}>
          <h3 style={{ marginTop: 0 }}>Payments by Method</h3>
          {loading ? 'Loading…' : (
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <PieChart>
                  <defs>
                    <filter id="pieShadow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#94a3b8" floodOpacity="0.4" />
                    </filter>
                  </defs>
                  <Pie
                    dataKey="value"
                    data={Object.entries(paySummary?.byMethod || {}).map(([name, value]) => ({ name, value: Number(value || 0) }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={84}
                    paddingAngle={2}
                    onMouseEnter={(_, idx) => setActivePayIdx(idx)}
                    onMouseLeave={() => setActivePayIdx(null)}
                    activeIndex={activePayIdx ?? -1}
                    activeShape={(props) => {
                      const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
                      const radiusBoost = 6;
                      return (
                        <g filter="url(#pieShadow)">
                          <path d={props.sectorPath(cx, cy, innerRadius, outerRadius + radiusBoost, startAngle, endAngle)} fill={fill} />
                        </g>
                      );
                    }}
                  >
                    {Object.entries(paySummary?.byMethod || {}).map(([name], idx) => (
                      <Cell key={`pm-${name}`} fill={["#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#64748b"][idx % 7]} />
                    ))}
                  </Pie>
                  <Tooltip content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const p = payload[0];
                    const percent = (p.percent || 0) * 100;
                    return (
                      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: '6px 10px', boxShadow: '0 4px 10px rgba(0,0,0,0.06)' }}>
                        <div style={{ fontSize: 12, color: '#0f172a' }}>{p.name}</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>{percent.toFixed(1)}% • {p.value}</div>
                      </div>
                    );
                  }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        <div style={{ background: 'white', padding: 20, borderRadius: 16, border: '2px solid #f1f5f9' }}>
          <h3 style={{ marginTop: 0 }}>Bookings by Status</h3>
          {loading ? 'Loading…' : (
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <PieChart>
                  <defs>
                    <filter id="pieShadow2" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#94a3b8" floodOpacity="0.4" />
                    </filter>
                  </defs>
                  <Pie
                    dataKey="value"
                    data={[
                      { name: 'pending', value: Number(bookSummary?.pending || 0) },
                      { name: 'confirmed', value: Number(bookSummary?.confirmed || 0) },
                      { name: 'cancelled', value: Number(bookSummary?.cancelled || 0) },
                      { name: 'disputed', value: Number(bookSummary?.disputed || 0) },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={84}
                    paddingAngle={2}
                    onMouseEnter={(_, idx) => setActiveBookIdx(idx)}
                    onMouseLeave={() => setActiveBookIdx(null)}
                    activeIndex={activeBookIdx ?? -1}
                    activeShape={(props) => {
                      const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
                      const radiusBoost = 6;
                      return (
                        <g filter="url(#pieShadow2)">
                          <path d={props.sectorPath(cx, cy, innerRadius, outerRadius + radiusBoost, startAngle, endAngle)} fill={fill} />
                        </g>
                      );
                    }}
                  >
                    {["#e2e8f0","#10b981","#ef4444","#f59e0b"].map((c, idx) => (
                      <Cell key={`bcell-${idx}`} fill={c} />
                    ))}
                  </Pie>
                  <Tooltip content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const p = payload[0];
                    const percent = (p.percent || 0) * 100;
                    return (
                      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: '6px 10px', boxShadow: '0 4px 10px rgba(0,0,0,0.06)' }}>
                        <div style={{ fontSize: 12, color: '#0f172a' }}>{p.name}</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>{percent.toFixed(1)}% • {p.value}</div>
                      </div>
                    );
                  }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Upcoming 7-day calendar */}
      <div style={{ background: 'white', padding: 20, borderRadius: 16, border: '2px solid #f1f5f9', marginBottom: 20 }}>
        <h3 style={{ marginTop: 0 }}>Upcoming Bookings (Next 7 Days)</h3>
        {loading ? (
          <div>Loading…</div>
        ) : (
          <>
            {/* 7-day strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(120px, 1fr))', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
              {upcoming.days.map((d) => {
                const isSel = selectedDate === d.date;
                return (
                  <div key={d.date}
                    onClick={() => setSelectedDate(d.date)}
                    style={{ cursor: 'pointer', background: isSel ? '#f0f9ff' : '#ffffff', border: `2px solid ${isSel ? '#06b6d4' : '#f1f5f9'}`, borderRadius: 12, padding: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>{new Date(d.date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short' })}</div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: '#1e293b' }}>{new Date(d.date + 'T00:00:00').getDate()}</div>
                        <div style={{ fontSize: 12, color: '#94a3b8' }}>{new Date(d.date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short' })}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 12, color: '#64748b' }}>Total</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>{d.items.length}</div>
                      </div>
                    </div>
                    {/* Status dots preview */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                      {d.items.slice(0, 5).map((b, idx) => (
                        <span key={idx} title={b.customerName}
                          style={{ width: 10, height: 10, borderRadius: '50%', background: statusColors[statusLabel(b.status, b.disputed)] || '#64748b', display: 'inline-block' }} />
                      ))}
                      {d.items.length > 5 && (
                        <span style={{ fontSize: 12, color: '#64748b' }}>+{d.items.length - 5} more</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected date details */}
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 14, color: '#64748b', marginBottom: 8 }}>
                {selectedDate ? new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Select a date'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
                {(() => {
                  const day = upcoming.days.find(x => x.date === selectedDate);
                  const items = day?.items || [];
                  if (items.length === 0) return <div style={{ color: '#64748b' }}>No bookings for this date.</div>;
                  return items.map((b) => (
                    <div key={b._id} style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{b.customerName}</div>
                        <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 12, background: (statusColors[statusLabel(b.status, b.disputed)] || '#64748b') + '20', color: '#0f172a', border: `1px solid ${(statusColors[statusLabel(b.status, b.disputed)] || '#64748b')}30` }}>
                          {statusLabel(b.status, b.disputed)}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>Payment: {String(b.paymentMethod || 'cash').toUpperCase()}</div>
                      <div style={{ marginTop: 8 }}>
                        <div style={{ fontSize: 12, color: '#64748b' }}>Order Details</div>
                        <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
                          {b.items.slice(0, 4).map((it, idx) => (
                            <li key={idx} style={{ fontSize: 13, color: '#1e293b' }}>{it.name} × {it.qty} <span style={{ color: '#64748b' }}>@ {Number(it.pricePerDay || 0).toFixed(2)}</span></li>
                          ))}
                          {b.items.length > 4 && (
                            <li style={{ fontSize: 12, color: '#64748b' }}>+{b.items.length - 4} more…</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Low stock inventory - Card list */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        <div style={{ background: 'white', padding: 20, borderRadius: 16, border: '2px solid #f1f5f9' }}>
          <h3 style={{ marginTop: 0 }}>Low Stock Inventory</h3>
          {loading ? (
            <div>Loading…</div>
          ) : !stats?.lowStock || stats.lowStock.length === 0 ? (
            <div>All inventory levels are healthy.</div>
          ) : (
            <div style={{ maxHeight: 260, overflowY: 'auto', paddingRight: 6 }}>
              {stats.lowStock.slice(0, 5).map((it) => {
                const qty = Number(it.quantity || 0);
                const critical = qty <= 2;
                return (
                  <div key={it._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #e2e8f0', borderRadius: 12, padding: 12, marginBottom: 10, background: critical ? '#fef2f2' : '#ffffff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: critical ? '#ef4444' : '#f59e0b' }} />
                      <div>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{it.name}</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>{it.category}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 12, color: '#64748b' }}>Stock</div>
                      <div style={{ fontWeight: 700, color: critical ? '#b91c1c' : '#b45309' }}>{qty}</div>
                    </div>
                  </div>
                );
              })}
              {/* View more button removed by request */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



export default AdminDashboard;