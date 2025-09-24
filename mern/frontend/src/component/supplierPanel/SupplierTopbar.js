import React from 'react';

export default function SupplierTopbar({ title = 'Supplier Dashboard', hideProfile = false }) {
  const btn = (primary=false) => ({ padding: '8px 12px', borderRadius: 8, border: primary? '1px solid #2563eb' : '1px solid #cbd5e1', background: primary? '#2563eb' : 'white', color: primary? 'white' : '#0f172a', cursor: 'pointer' });
  const onLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    window.location.href = '/userlog';
  };
  return (
    <div style={{ background: '#111827', color: 'white', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ fontWeight: 700 }}>{title}</div>
      <div style={{ display: 'flex', gap: 8 }}>
        {!hideProfile && (
          <button style={btn(false)} onClick={() => window.location.href = '/userAccount/profile'}>Profile</button>
        )}
        <button style={btn(true)} onClick={onLogout}>Logout</button>
      </div>
    </div>
  );
}
