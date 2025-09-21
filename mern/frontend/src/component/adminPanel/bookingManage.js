import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function BookingManagement() {
  return (
    <div style={{ background: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }}>
      <h2 style={{ color: '#1e293b', margin: '0 0 20px 0' }}>Booking Management</h2>
      <p style={{ color: '#64748b' }}>Handle customer bookings, reservations, and appointments.</p>
    </div>
  );
}
export default BookingManagement;