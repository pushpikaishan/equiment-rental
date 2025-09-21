import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';


function DeliveryManagement() {
  return (
    <div style={{ background: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }}>
      <h2 style={{ color: '#1e293b', margin: '0 0 20px 0' }}>Delivery Management</h2>
      <p style={{ color: '#64748b' }}>Track shipments, manage delivery routes, and coordinate with drivers.</p>
    </div>
  );
}
export default DeliveryManagement;