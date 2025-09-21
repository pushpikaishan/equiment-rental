import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Adduser from "../userregister/userregister";
import Addadmin from "../userregister/adminRegister";
import Addsupplier from "../userregister/supplierRegister";
import Addstaff from "../userregister/staffRegister"; 

import ManageUsers from "../disalluser/allUsers";
import ManageAdmins from "../disalluser/alladmin";
import ManageSuppliers from "../disalluser/allSuppliers";
import ManageStaffs from "../disalluser/allstaff"; 



// User Overview Component
function UserOverview() {
  const statsStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px'
  };

  const statItemStyle = {
    padding: '20px',
    background: '#f8fafc',
    borderRadius: '12px',
    textAlign: 'center',
    border: '2px solid #e2e8f0'
  };

  const userStats = [
    { type: 'Admins', count: 5, icon: '👑', color: '#8b5cf6' },
    { type: 'Staff', count: 25, icon: '👨‍💼', color: '#10b981' },
    { type: 'Suppliers', count: 150, icon: '🏢', color: '#f59e0b' },
    { type: 'Users', count: 1054, icon: '👥', color: '#3b82f6' }
  ];

  return (
    <div>
      <h3 style={{ margin: '0 0 20px 0', color: '#1e293b' }}>User Statistics</h3>
      <div style={statsStyle}>
        {userStats.map((stat, index) => (
          <div key={index} style={statItemStyle}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>{stat.icon}</div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: stat.color, marginBottom: '5px' }}>
              {stat.count}
            </div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>{stat.type}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function UserManagement() {
  const [activeTab, setActiveTab] = useState('overview');

  const headerStyle = {
    background: 'white',
    padding: '30px',
    borderRadius: '16px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
    marginBottom: '30px'
  };

  const tabsStyle = {
    display: 'flex',
    gap: '10px',
    marginBottom: '30px',
    flexWrap: 'wrap'
  };

  const tabStyle = (isActive) => ({
    padding: '12px 20px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    background: isActive ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' : '#f1f5f9',
    color: isActive ? 'white' : '#64748b'
  });

  const cardStyle = {
    background: 'white',
    padding: '30px',
    borderRadius: '16px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'add-admin', label: 'Add Admin' },
    { id: 'add-supplier', label: 'Add Supplier' },
    { id: 'add-staff', label: 'Add Staff' },
    { id: 'add-user', label: 'Add User' },
    { id: 'manage-admin', label: 'Manage Admin' },
    { id: 'manage-supplier', label: 'Manage Supplier' },
    { id: 'manage-staff', label: 'Manage Staff' },
    { id: 'manage-user', label: 'Manage User' }
  ];

  return (
    <div>
      <div style={headerStyle}>
        <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#1e293b', margin: '0 0 8px 0' }}>
          User Management
        </h1>
        <p style={{ color: '#64748b', margin: '0' }}>
          Manage all user accounts and permissions
        </p>
      </div>

      <div style={tabsStyle}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            style={tabStyle(activeTab === tab.id)}
            onClick={() => setActiveTab(tab.id)}
            onMouseOver={(e) => {
              if (activeTab !== tab.id) {
                e.target.style.background = '#e2e8f0';
              }
            }}
            onMouseOut={(e) => {
              if (activeTab !== tab.id) {
                e.target.style.background = '#f1f5f9';
              }
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={cardStyle}>
        {activeTab === 'overview' && <UserOverview />}
        {activeTab === 'add-admin' && <Addadmin userType="Admin" />}
        {activeTab === 'add-supplier' && <Addsupplier userType="Supplier" />}
        {activeTab === 'add-staff' && <Addstaff userType="Staff" />}
        {activeTab === 'add-user' && <Adduser userType="User" />}
        {activeTab === 'manage-admin' && <ManageAdmins userType="Admin" />}
        {activeTab === 'manage-supplier' && <ManageSuppliers userType="Supplier" />}
        {activeTab === 'manage-staff' && <ManageStaffs userType="Staff" />}
        {activeTab === 'manage-user' && <ManageUsers userType="User" />}
      </div>
    </div>
  );
}
export default UserManagement;