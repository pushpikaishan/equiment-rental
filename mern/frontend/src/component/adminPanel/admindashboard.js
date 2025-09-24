import React, { useState, useEffect } from 'react';
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

  const stats = [
    { title: 'Total Users', value: '1,234', icon: '👥', color: '#3b82f6' },
    { title: 'Active Orders', value: '56', icon: '📋', color: '#10b981' },
    { title: 'Revenue', value: '$12,345', icon: '💰', color: '#f59e0b' },
    { title: 'Products', value: '789', icon: '📦', color: '#8b5cf6' }
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
        {stats.map((stat, index) => (
          <div key={index} style={statCardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 8px 0' }}>
                  {stat.title}
                </p>
                <p style={{ fontSize: '28px', fontWeight: '700', color: '#1e293b', margin: '0' }}>
                  {stat.value}
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
    </div>
  );
}



export default AdminDashboard;