import React, { useState } from 'react';

export default function SupplierTopbar({ title = 'Supplier Dashboard', hideProfile = false, navItems = [], activeKey, onNavChange }) {
  const [hoveredKey, setHoveredKey] = useState('');
  const btn = (primary=false) => ({ padding: '8px 12px', borderRadius: 8, border: primary? '1px solid #2563eb' : '1px solid #cbd5e1', background: primary? '#2563eb' : 'white', color: primary? 'white' : '#0f172a', cursor: 'pointer' });
  const onLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    window.location.href = '/userlog';
  };
  return (
    <div style={{ background: '#111827', color: 'white', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      <div style={{ fontWeight: 700 }}>{title}</div>
      {Array.isArray(navItems) && navItems.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
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
                  padding: '6px 10px',
                  borderRadius: 9999,
                  border: '1px solid #cbd5e1',
                  background: isActive ? '#2563eb' : (isHover ? '#e2e8f0' : 'white'),
                  color: isActive ? 'white' : '#0f172a',
                  fontWeight: 700,
                  transition: 'background 120ms ease'
                }}
              >
                {it.label}
              </button>
            );
          })}
        </div>
      )}
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
        {/* If nav is provided, Profile should be accessible via tabs; hide the standalone button */}
        {!hideProfile && (!navItems || navItems.length === 0) && (
          <button style={btn(false)} onClick={() => window.location.href = '/userAccount/profile'}>Profile</button>
        )}
        <button style={btn(true)} onClick={onLogout}>Logout</button>
      </div>
    </div>
  );
}
