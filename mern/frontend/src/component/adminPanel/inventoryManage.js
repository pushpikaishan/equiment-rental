import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function InventoryManagement() {
  return (
    <div style={{ background: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }}>
      <h2 style={{ color: '#1e293b', margin: '0 0 20px 0' }}>Inventory Management</h2>
      <p style={{ color: '#64748b' }}>Manage your product inventory, stock levels, and categories.</p>
    </div>
  );
}
export default InventoryManagement;