import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import UserManagement from "./usermanage";
import InventoryManagement from "./inventoryManage";
import PaymentManagement from "./PaymentManage";
import BookingManagement from "./bookingManage";
import DeliveryManagement from "./deliveryManage";

import Setting from "./adminProfile/adminMenu";
import Profile from "./adminProfile/addminProfile";

// Define logos for dark and light theme
const logoDark = `${process.env.PUBLIC_URL}/logo-evoqrentals-dark.svg`;
const logoLight = `${process.env.PUBLIC_URL}/logo-evoqrentals.svg`;

// Dashboard content component
const DashboardContent = ({ themeMode, toggleTheme }) => (
  <div>
    <h2>Dashboard Overview</h2>
    {/* Add your dashboard content here */}
  </div>
);

// Reports content component
const ReportsContent = () => (
  <div>
    <h3>Reports</h3>
    <p>Generate and export revenue, utilization, and inventory reports. (Coming soon)</p>
  </div>
);

// Settings content component
const SettingsContent = ({ themeMode, toggleTheme }) => (
  <div>
    <h3>Settings</h3>
    <div>
      <span>Appearance:</span>
      <button onClick={toggleTheme}>
        Switch to {themeMode === 'dark' ? 'Light' : 'Dark'} Mode
      </button>
    </div>
  </div>
);

// Main Dashboard Component
function AdminDashboard() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profile, setProfile] = useState(null);
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem('themeMode') || 'dark');
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

  // THEME: apply CSS variables for light/dark with dark-brown primary and teal accent
  useEffect(() => {
    const root = document.documentElement.style;
    const isDark = themeMode === 'dark';
    const vars = isDark
      ? {
          '--primary': '#4e342e',
          '--accent': '#14b8a6',
          '--bg': '#1b1613',
          '--surface': '#241c18',
          '--surface-2': '#2b221d',
          '--text': '#f3f4f6',
          '--muted': '#9ca3af',
          '--border': '#3f3430',
          '--sidebar-start': '#2b1f1b',
          '--sidebar-end': '#3e2723',
          '--shadow': 'rgba(0,0,0,0.35)'
        }
      : {
          '--primary': '#5d4037',
          '--accent': '#0fb5ae',
          '--bg': '#f7f7f6',
          '--surface': '#ffffff',
          '--surface-2': '#f2f3f5',
          '--text': '#1f2937',
          '--muted': '#6b7280',
          '--border': '#e5e7eb',
          '--sidebar-start': '#3e2723',
          '--sidebar-end': '#5d4037',
          '--shadow': 'rgba(0,0,0,0.08)'
        };
    Object.entries(vars).forEach(([k, v]) => root.setProperty(k, v));
    localStorage.setItem('themeMode', themeMode);
  }, [themeMode]);

  const toggleTheme = () => setThemeMode((m) => (m === 'dark' ? 'light' : 'dark'));

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

  // Define styles
  const containerStyle = {
    display: 'flex',
    minHeight: '100vh',
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial, 'Apple Color Emoji', 'Segoe UI Emoji'",
    background: 'var(--bg)',
    color: 'var(--text)'
  };

  const sidebarStyle = {
    width: sidebarCollapsed ? '70px' : '280px',
    background: 'linear-gradient(180deg, var(--sidebar-start) 0%, var(--sidebar-end) 100%)',
    color: 'var(--text)',
    transition: 'width 0.3s ease',
    position: 'fixed',
    height: '100vh',
    overflowY: 'auto',
    boxShadow: '4px 0 12px var(--shadow)'
  };

  const sidebarHeaderStyle = {
    padding: '20px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    textAlign: 'center'
  };

  const profileSectionStyle = {
    padding: '20px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  };

  const profileImageStyle = {
    width: sidebarCollapsed ? '35px' : '60px',
    height: sidebarCollapsed ? '35px' : '60px',
    borderRadius: '50%',
    border: '3px solid rgba(255, 255, 255, 0.2)',
    transition: 'all 0.3s ease',
    marginBottom: sidebarCollapsed ? '0' : '12px'
  };

  const profileNameStyle = {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--text)',
    marginBottom: '4px',
    opacity: sidebarCollapsed ? 0 : 1,
    transition: 'opacity 0.3s ease'
  };

  const profileRoleStyle = {
    fontSize: '12px',
    color: 'var(--muted)',
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
    { id: 'delivery', icon: '🚚', label: 'Delivery Manage', color: '#ef4444' },
    { id: 'reports', icon: '📈', label: 'Reports', color: '#22c55e' },
    { id: 'settings', icon: '⚙️', label: 'Settings', color: '#14b8a6' }
  ];

  // Main content style
  const mainContentStyle = {
    flex: 1,
    marginLeft: sidebarCollapsed ? '70px' : '280px',
    transition: 'margin-left 0.3s ease',
    padding: '20px',
    background: 'var(--bg)',
    minHeight: '100vh'
  };

  return (
    <div style={containerStyle}>
      {/* Sidebar */}
      <div style={sidebarStyle}>
        <div style={sidebarHeaderStyle}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer'
            }}
            onClick={() => setActiveSection('dashboard')}
            title="EvoqRentals Admin"
          >
            <img
              src={logoDark}
              alt="EvoqRentals"
              onError={(e) => {
                if (e.currentTarget.src !== logoLight) {
                  e.currentTarget.src = logoLight;
                }
              }}
              style={{
                height: sidebarCollapsed ? '28px' : '40px',
                width: 'auto',
                filter: 'drop-shadow(0 1px 0 rgba(0,0,0,0.2))'
              }}
            />
            {!sidebarCollapsed && (
              <span style={{ color: '#93c5fd', fontSize: '18px', marginTop: '8px', fontWeight: 700 }}>
                Admin Panel
              </span>
            )}
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
              src={profile.profileImage ? `http://localhost:5000${profile.profileImage}` : getAvatarUrl(profile.name, profile.role)}
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
                >
                  Profile Setting
                </button>
              </div>
            )}
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
        >
          {sidebarCollapsed ? '→' : '←'}
        </div>
      </div>

      {/* Main Content */}
      <div style={mainContentStyle}>
        {activeSection === 'dashboard' && (
          <DashboardContent themeMode={themeMode} toggleTheme={toggleTheme} />
        )}
        {activeSection === 'profile' && <Profile profile={profile} />}
        {activeSection === 'editProfile' && <Setting profile={profile} setProfile={setProfile} setActiveSection={setActiveSection} />}
        {activeSection === 'deleteProfile' && <UserManagement />}
        {activeSection === 'users' && <UserManagement />}
        {activeSection === 'inventory' && <InventoryManagement />}
        {activeSection === 'bookings' && <BookingManagement />}
        {activeSection === 'payments' && <PaymentManagement />}
        {activeSection === 'delivery' && <DeliveryManagement />}
        {activeSection === 'reports' && <ReportsContent />}
        {activeSection === 'settings' && <SettingsContent themeMode={themeMode} toggleTheme={toggleTheme} />}
      </div>
    </div>
  );
}

export default AdminDashboard;
