import React from 'react';
import UserNavbar from './UserNavbar';
import SiteFooter from '../common/SiteFooter';

export default function SupportPage() {
  return (
    <div>
      <UserNavbar />
      <div style={{ padding: 20, maxWidth: 900, margin: '0 auto' }}>
        <h2>Support</h2>
        <p>Contact us at support@example.com or call 011-123-4567.</p>
      </div>
      <SiteFooter />
    </div>
  );
}
