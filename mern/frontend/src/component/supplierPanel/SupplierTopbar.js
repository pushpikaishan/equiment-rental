import React, { useState } from 'react';
import PropTypes from 'prop-types';

export default function SupplierTopbar({ title = 'Supplier Dashboard', hideProfile = false, navItems = [], activeKey, onNavChange }) {
  const [hoveredKey, setHoveredKey] = useState('');
  
  const onLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    window.location.href = '/userlog';
  };

  return (
    <div style={{ 
      background: 'white', 
      borderBottom: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    }}>
      {/* Top Bar */}
      <div style={{ 
        padding: '16px 32px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        gap: 16
      }}>
        <div>
          <h1 style={{ 
            margin: 0, 
            fontSize: 24, 
            fontWeight: 700, 
            color: '#111827' 
          }}>
            {title}
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {!hideProfile && (!navItems || navItems.length === 0) && (
            <button 
              style={{ 
                padding: '8px 16px', 
                borderRadius: 6, 
                border: '1px solid #d1d5db', 
                background: 'white', 
                color: '#374151',
                fontWeight: 500,
                cursor: 'pointer',
                fontSize: 14
              }} 
              onClick={() => window.location.href = '/userAccount/profile'}
            >
              Profile
            </button>
          )}
          <button 
            style={{ 
              padding: '8px 16px', 
              borderRadius: 6, 
              border: 'none', 
              background: '#ef4444', 
              color: 'white',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: 14
            }} 
            onClick={onLogout}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      {Array.isArray(navItems) && navItems.length > 0 && (
        <div style={{ 
          borderTop: '1px solid #e5e7eb',
          padding: '0 32px',
          display: 'flex', 
          gap: 0,
          overflowX: 'auto'
        }}>
          {navItems.map(it => {
            const isActive = activeKey === it.key;
            const isHover = hoveredKey === it.key;
            return (
              <button
                key={it.key}
                onClick={() => onNavChange && onNavChange(it.key)}
                onMouseEnter={() => setHoveredKey(it.key)}
                onMouseLeave={() => setHoveredKey('')}
                style={{
                  padding: '14px 20px',
                  border: 'none',
                  borderBottom: isActive ? '2px solid #3b82f6' : '2px solid transparent',
                  background: isHover && !isActive ? '#f9fafb' : 'transparent',
                  color: isActive ? '#3b82f6' : '#6b7280',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: 14,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                {it.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

SupplierTopbar.propTypes = {
  title: PropTypes.string,
  hideProfile: PropTypes.bool,
  navItems: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.node.isRequired,
    })
  ),
  activeKey: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onNavChange: PropTypes.func,
};

SupplierTopbar.defaultProps = {
  title: 'Supplier Dashboard',
  hideProfile: false,
  navItems: [],
};
