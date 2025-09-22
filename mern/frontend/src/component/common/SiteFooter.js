import React from "react";
import { Link } from "react-router-dom";

const currentYear = new Date().getFullYear();

function SiteFooter() {
  return (
    <footer style={styles.footer}>
      <div style={styles.container}>
        {/* Brand & Short Description */}
        <div style={styles.column}>
          <h3 style={styles.brand}>Event Equipment Rental</h3>
          <p style={styles.tagline}>Your trusted partner for event equipment rentals</p>
          {/* Payment icons (placeholder text/icons) */}
          <div style={styles.payments}>
            <span style={styles.payIcon}>💳 Visa</span>
            <span style={styles.payIcon}>💳 MasterCard</span>
            <span style={styles.payIcon}>💰 PayPal</span>
          </div>
        </div>

        {/* Quick Navigation Links */}
        <div style={styles.column}>
          <h4 style={styles.heading}>Quick Links</h4>
          <ul style={styles.list}>
            <li><Link style={styles.link} to="/home">Home</Link></li>
            <li><Link style={styles.link} to="/home">Browse Equipment</Link></li>
            <li><Link style={styles.link} to="/bookings">My Bookings</Link></li>
            <li><Link style={styles.link} to="/cart">Booking Cart</Link></li>
            <li><Link style={styles.link} to="/userAccount/profile">Profile / Login</Link></li>
            <li><Link style={styles.link} to="/support">Support</Link></li>
          </ul>
        </div>

        {/* Policies */}
        <div style={styles.column}>
          <h4 style={styles.heading}>Policies</h4>
          <ul style={styles.list}>
            <li><Link style={styles.link} to="/faqs">FAQs</Link></li>
            <li><Link style={styles.link} to="/contact">Contact Us</Link></li>
            <li><Link style={styles.link} to="/terms">Terms & Conditions</Link></li>
            <li><Link style={styles.link} to="/privacy">Privacy Policy</Link></li>
            <li><Link style={styles.link} to="/refunds">Refund/Return Policy</Link></li>
          </ul>
        </div>

        {/* Contact & Social */}
        <div style={styles.column}>
          <h4 style={styles.heading}>Contact</h4>
          <ul style={styles.list}>
            <li><a style={styles.link} href="mailto:support@eventrentals.com">support@eventrentals.com</a></li>
            <li><a style={styles.link} href="tel:+1234567890">+1 (234) 567-890</a></li>
            <li><span style={{color:'#cbd5e1'}}>123 Event Street, City</span></li>
          </ul>

          <h4 style={{...styles.heading, marginTop: 10}}>Follow Us</h4>
          <div style={styles.socialRow}>
            <a style={styles.social} href="#" aria-label="Facebook">📘</a>
            <a style={styles.social} href="#" aria-label="Instagram">📸</a>
            <a style={styles.social} href="#" aria-label="LinkedIn">💼</a>
            <a style={styles.social} href="#" aria-label="Twitter">🐦</a>
          </div>

          <div style={styles.newsletter}>
            <input style={styles.input} type="email" placeholder="Your email" />
            <button style={styles.subscribeBtn} type="button">Subscribe</button>
          </div>

          <div style={{marginTop: 10}}>
            <Link style={styles.ctaLink} to="/RegCusOrSupButton">Become a Supplier</Link>
          </div>
        </div>
      </div>

      <div style={styles.bottomBar}>
        <span>© {currentYear} Event Equipment Rental System. All rights reserved.</span>
      </div>
    </footer>
  );
}

const styles = {
  footer: {
    background: '#0f172a',
    color: '#e2e8f0',
    paddingTop: 30,
    marginTop: 40,
  },
  container: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 24,
    maxWidth: 1100,
    margin: '0 auto',
    padding: '0 20px 20px 20px',
  },
  column: {
    minWidth: 200,
  },
  brand: {
    margin: 0,
    fontSize: 22,
    color: '#ffffff',
  },
  tagline: {
    marginTop: 8,
    color: '#cbd5e1',
  },
  payments: {
    display: 'flex',
    gap: 8,
    marginTop: 12,
    flexWrap: 'wrap',
    color: '#94a3b8',
  },
  payIcon: {
    background: 'rgba(255,255,255,0.06)',
    padding: '6px 10px',
    borderRadius: 6,
    fontSize: 12,
  },
  heading: {
    margin: '0 0 8px 0',
    fontSize: 16,
    color: '#ffffff',
  },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'grid',
    gap: 6,
  },
  link: {
    color: '#cbd5e1',
    textDecoration: 'none',
  },
  ctaLink: {
    display: 'inline-block',
    marginTop: 6,
    color: '#22d3ee',
    textDecoration: 'none',
  },
  socialRow: {
    display: 'flex',
    gap: 10,
    marginTop: 6,
  },
  social: {
    width: 34,
    height: 34,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255,255,255,0.06)',
    borderRadius: 6,
    color: '#e2e8f0',
    textDecoration: 'none',
    fontSize: 18,
  },
  newsletter: {
    display: 'flex',
    gap: 8,
    marginTop: 10,
  },
  input: {
    flex: 1,
    background: '#0b1220',
    color: '#e2e8f0',
    border: '1px solid #1e293b',
    borderRadius: 6,
    padding: '8px 10px',
  },
  subscribeBtn: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: 6,
    padding: '8px 14px',
    cursor: 'pointer',
  },
  bottomBar: {
    borderTop: '1px solid #1e293b',
    marginTop: 16,
    padding: '12px 20px',
    textAlign: 'center',
    color: '#94a3b8',
  },
};

export default SiteFooter;
