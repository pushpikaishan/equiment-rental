import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { pageContainer, headerCard, headerTitle, headerSub, tabButton, card as cardBox } from './adminStyles';

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
  const [counts, setCounts] = useState({ admins: 0, staff: 0, suppliers: 0, users: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [adminsRes, staffRes, suppliersRes, usersRes] = await Promise.all([
          axios.get('http://localhost:5000/admins'),
          axios.get('http://localhost:5000/staff'),
          axios.get('http://localhost:5000/suppliers'),
          axios.get('http://localhost:5000/users'),
        ]);

        const adminsArr = Array.isArray(adminsRes.data)
          ? adminsRes.data
          : (Array.isArray(adminsRes.data.admins) ? adminsRes.data.admins : []);
        const staffArr = Array.isArray(staffRes.data)
          ? staffRes.data
          : (Array.isArray(staffRes.data.staff) ? staffRes.data.staff : []);
        const suppliersArr = Array.isArray(suppliersRes.data)
          ? suppliersRes.data
          : (Array.isArray(suppliersRes.data.suppliers) ? suppliersRes.data.suppliers : []);
        const usersArr = Array.isArray(usersRes.data)
          ? usersRes.data
          : (Array.isArray(usersRes.data.users) ? usersRes.data.users : []);

        setCounts({
          admins: adminsArr.length,
          staff: staffArr.length,
          suppliers: suppliersArr.length,
          users: usersArr.length,
        });
      } catch (e) {
        console.error('Failed to load overview counts:', e);
        setError('Failed to load overview');
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
  }, []);
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
    { type: 'Admins', count: counts.admins, icon: '👑', color: '#8b5cf6' },
    { type: 'Staff', count: counts.staff, icon: '👨‍💼', color: '#10b981' },
    { type: 'Suppliers', count: counts.suppliers, icon: '🏢', color: '#f59e0b' },
    { type: 'Users', count: counts.users, icon: '👥', color: '#3b82f6' }
  ];

  return (
    <div>
      <h3 style={{ margin: '0 0 20px 0', color: '#1e293b' }}>User Statistics</h3>
      {loading ? (
        <div style={{ padding: '20px', color: '#64748b' }}>Loading overview...</div>
      ) : error ? (
        <div style={{ padding: '20px', color: '#dc2626' }}>{error}</div>
      ) : (
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
      )}
    </div>
  );
}

function UserManagement() {
  const [activeTab, setActiveTab] = useState('overview');

  const headerStyle = headerCard;

  const tabsStyle = {
    display: 'flex',
    gap: '10px',
    marginBottom: '30px',
    flexWrap: 'wrap'
  };

  const tabStyle = (isActive) => tabButton(isActive);

  const cardStyle = { ...cardBox, padding: '30px' };

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
    <div style={pageContainer}>
      <div style={headerStyle}>
        <h1 style={headerTitle}>User Management</h1>
        <p style={headerSub}>Manage all user accounts and permissions</p>
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