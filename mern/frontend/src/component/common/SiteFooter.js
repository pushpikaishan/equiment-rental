import React from "react";
import { Link } from "react-router-dom";

const currentYear = new Date().getFullYear();

function SiteFooter() {
  return (
    <footer style={styles.footer}>
      <div style={styles.container}>
        {/* Brand & Short Description */}
        <div style={styles.column}>
          <h3 style={styles.brand}>Eventrix</h3>
          <p style={styles.tagline}>Your trusted partner for event equipment rentals</p>
          {/* Payment icons (placeholder text/icons) */}
          <div style={styles.payments}>
            <span 
              style={styles.payIcon}
              onMouseOver={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(255, 255, 255, 0.15)';
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              💳 Visa
            </span>
            <span 
              style={styles.payIcon}
              onMouseOver={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(255, 255, 255, 0.15)';
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              💳 MasterCard
            </span>
            <span 
              style={styles.payIcon}
              onMouseOver={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(255, 255, 255, 0.15)';
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              💰 PayPal
            </span>
          </div>
        </div>

        {/* Quick Navigation Links */}
        <div style={styles.column}>
          <h4 style={styles.heading}>Quick Links</h4>
          <ul style={styles.list}>
            <li>
              <Link 
                style={styles.link} 
                to="/home"
                onMouseOver={(e) => {
                  e.target.style.color = '#3b82f6';
                  e.target.style.paddingLeft = '12px';
                }}
                onMouseOut={(e) => {
                  e.target.style.color = '#cbd5e1';
                  e.target.style.paddingLeft = '0px';
                }}
              >
                Home
              </Link>
            </li>
            <li>
              <Link 
                style={styles.link} 
                to="/home"
                onMouseOver={(e) => {
                  e.target.style.color = '#3b82f6';
                  e.target.style.paddingLeft = '12px';
                }}
                onMouseOut={(e) => {
                  e.target.style.color = '#cbd5e1';
                  e.target.style.paddingLeft = '0px';
                }}
              >
                Browse Equipment
              </Link>
            </li>
            <li>
              <Link 
                style={styles.link} 
                to="/bookings"
                onMouseOver={(e) => {
                  e.target.style.color = '#3b82f6';
                  e.target.style.paddingLeft = '12px';
                }}
                onMouseOut={(e) => {
                  e.target.style.color = '#cbd5e1';
                  e.target.style.paddingLeft = '0px';
                }}
              >
                My Bookings
              </Link>
            </li>
            <li>
              <Link 
                style={styles.link} 
                to="/cart"
                onMouseOver={(e) => {
                  e.target.style.color = '#3b82f6';
                  e.target.style.paddingLeft = '12px';
                }}
                onMouseOut={(e) => {
                  e.target.style.color = '#cbd5e1';
                  e.target.style.paddingLeft = '0px';
                }}
              >
                Booking Cart
              </Link>
            </li>
            <li>
              <Link 
                style={styles.link} 
                to="/userAccount/profile"
                onMouseOver={(e) => {
                  e.target.style.color = '#3b82f6';
                  e.target.style.paddingLeft = '12px';
                }}
                onMouseOut={(e) => {
                  e.target.style.color = '#cbd5e1';
                  e.target.style.paddingLeft = '0px';
                }}
              >
                Profile / Login
              </Link>
            </li>
            <li>
              <Link 
                style={styles.link} 
                to="/support"
                onMouseOver={(e) => {
                  e.target.style.color = '#3b82f6';
                  e.target.style.paddingLeft = '12px';
                }}
                onMouseOut={(e) => {
                  e.target.style.color = '#cbd5e1';
                  e.target.style.paddingLeft = '0px';
                }}
              >
                Support
              </Link>
            </li>
          </ul>
        </div>

        {/* Policies */}
        <div style={styles.column}>
          <h4 style={styles.heading}>Policies</h4>
          <ul style={styles.list}>
            <li>
              <Link 
                style={styles.link} 
                to="/faqs"
                onMouseOver={(e) => {
                  e.target.style.color = '#3b82f6';
                  e.target.style.paddingLeft = '12px';
                }}
                onMouseOut={(e) => {
                  e.target.style.color = '#cbd5e1';
                  e.target.style.paddingLeft = '0px';
                }}
              >
                FAQs
              </Link>
            </li>
            <li>
              <Link 
                style={styles.link} 
                to="/contact"
                onMouseOver={(e) => {
                  e.target.style.color = '#3b82f6';
                  e.target.style.paddingLeft = '12px';
                }}
                onMouseOut={(e) => {
                  e.target.style.color = '#cbd5e1';
                  e.target.style.paddingLeft = '0px';
                }}
              >
                Contact Us
              </Link>
            </li>
            <li>
              <Link 
                style={styles.link} 
                to="/terms"
                onMouseOver={(e) => {
                  e.target.style.color = '#3b82f6';
                  e.target.style.paddingLeft = '12px';
                }}
                onMouseOut={(e) => {
                  e.target.style.color = '#cbd5e1';
                  e.target.style.paddingLeft = '0px';
                }}
              >
                Terms & Conditions
              </Link>
            </li>
            <li>
              <Link 
                style={styles.link} 
                to="/privacy"
                onMouseOver={(e) => {
                  e.target.style.color = '#3b82f6';
                  e.target.style.paddingLeft = '12px';
                }}
                onMouseOut={(e) => {
                  e.target.style.color = '#cbd5e1';
                  e.target.style.paddingLeft = '0px';
                }}
              >
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link 
                style={styles.link} 
                to="/refunds"
                onMouseOver={(e) => {
                  e.target.style.color = '#3b82f6';
                  e.target.style.paddingLeft = '12px';
                }}
                onMouseOut={(e) => {
                  e.target.style.color = '#cbd5e1';
                  e.target.style.paddingLeft = '0px';
                }}
              >
                Refund/Return Policy
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact & Social */}
        <div style={styles.column}>
          <h4 style={styles.heading}>Contact</h4>
          <ul style={styles.list}>
            <li>
              <a 
                style={styles.link} 
                href="mailto:support@eventrentals.com"
                onMouseOver={(e) => {
                  e.target.style.color = '#3b82f6';
                  e.target.style.paddingLeft = '12px';
                }}
                onMouseOut={(e) => {
                  e.target.style.color = '#cbd5e1';
                  e.target.style.paddingLeft = '0px';
                }}
              >
                support@eventrentals.com
              </a>
            </li>
            <li>
              <a 
                style={styles.link} 
                href="tel:+1234567890"
                onMouseOver={(e) => {
                  e.target.style.color = '#3b82f6';
                  e.target.style.paddingLeft = '12px';
                }}
                onMouseOut={(e) => {
                  e.target.style.color = '#cbd5e1';
                  e.target.style.paddingLeft = '0px';
                }}
              >
                +1 (234) 567-890
              </a>
            </li>
            <li><span style={{color:'#cbd5e1'}}>123 Event Street, City</span></li>
          </ul>

          <h4 style={{...styles.heading, marginTop: 10}}>Follow Us</h4>
          <div style={styles.socialRow}>
            <a 
              style={styles.social} 
              href="#" 
              aria-label="Facebook"
              onMouseOver={(e) => {
                e.target.style.background = 'rgba(59, 89, 152, 0.2)';
                e.target.style.transform = 'translateY(-3px) scale(1.05)';
                e.target.style.boxShadow = '0 8px 25px rgba(59, 89, 152, 0.4)';
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                e.target.style.transform = 'translateY(0) scale(1)';
                e.target.style.boxShadow = 'none';
              }}
            >
              📘
            </a>
            <a 
              style={styles.social} 
              href="#" 
              aria-label="Instagram"
              onMouseOver={(e) => {
                e.target.style.background = 'rgba(225, 48, 108, 0.2)';
                e.target.style.transform = 'translateY(-3px) scale(1.05)';
                e.target.style.boxShadow = '0 8px 25px rgba(225, 48, 108, 0.4)';
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                e.target.style.transform = 'translateY(0) scale(1)';
                e.target.style.boxShadow = 'none';
              }}
            >
              📸
            </a>
            <a 
              style={styles.social} 
              href="#" 
              aria-label="LinkedIn"
              onMouseOver={(e) => {
                e.target.style.background = 'rgba(0, 119, 181, 0.2)';
                e.target.style.transform = 'translateY(-3px) scale(1.05)';
                e.target.style.boxShadow = '0 8px 25px rgba(0, 119, 181, 0.4)';
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                e.target.style.transform = 'translateY(0) scale(1)';
                e.target.style.boxShadow = 'none';
              }}
            >
              💼
            </a>
            <a 
              style={styles.social} 
              href="#" 
              aria-label="Twitter"
              onMouseOver={(e) => {
                e.target.style.background = 'rgba(29, 161, 242, 0.2)';
                e.target.style.transform = 'translateY(-3px) scale(1.05)';
                e.target.style.boxShadow = '0 8px 25px rgba(29, 161, 242, 0.4)';
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                e.target.style.transform = 'translateY(0) scale(1)';
                e.target.style.boxShadow = 'none';
              }}
            >
              🐦
            </a>
          </div>

          <div style={styles.newsletter}>
            <input 
              style={styles.input} 
              type="email" 
              placeholder="Your email"
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.15)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(226, 232, 240, 0.15)';
                e.target.style.boxShadow = 'none';
              }}
            />
            <button 
              style={styles.subscribeBtn} 
              type="button"
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.4)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 16px rgba(59, 130, 246, 0.3)';
              }}
            >
              Subscribe
            </button>
          </div>

          <div style={{marginTop: 10}}>
            <Link 
              style={styles.ctaLink} 
              to="/RegCusOrSupButton"
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.4)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 16px rgba(59, 130, 246, 0.3)';
              }}
            >
              Become a Supplier
            </Link>
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
    background: 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)',
    color: '#e2e8f0',
    paddingTop: 60,
    marginTop: 80,
    borderTop: '1px solid rgba(59, 130, 246, 0.2)',
    boxShadow: '0 -20px 60px rgba(0, 0, 0, 0.15), 0 -1px 0 rgba(59, 130, 246, 0.1) inset',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    position: 'relative',
    overflow: 'hidden'
  },
  container: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 32,
    maxWidth: 1300,
    margin: '0 auto',
    padding: '0 40px 40px 40px',
    position: 'relative',
    zIndex: 1
  },
  column: {
    minWidth: 260,
    background: 'rgba(255, 255, 255, 0.03)',
    padding: '32px 28px',
    borderRadius: 20,
    border: '1px solid rgba(226, 232, 240, 0.1)',
    backdropFilter: 'blur(15px)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), 0 1px 0 rgba(255, 255, 255, 0.05) inset'
  },
  brand: {
    margin: 0,
    fontSize: 32,
    fontWeight: 800,
    color: '#ffffff',
    letterSpacing: '-0.025em',
    marginBottom: 12,
    position: 'relative'
  },
  tagline: {
    marginTop: 0,
    color: '#cbd5e1',
    fontSize: 16,
    fontWeight: 500,
    lineHeight: 1.6,
    marginBottom: 24,
    opacity: 0.9
  },
  payments: {
    display: 'flex',
    gap: 12,
    marginTop: 20,
    flexWrap: 'wrap'
  },
  payIcon: {
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    padding: '10px 14px',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    color: '#cbd5e1',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
    backdropFilter: 'blur(10px)'
  },
  heading: {
    margin: '0 0 20px 0',
    fontSize: 20,
    fontWeight: 800,
    color: '#ffffff',
    letterSpacing: '-0.025em',
    position: 'relative'
  },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'grid',
    gap: 12,
  },
  link: {
    color: '#cbd5e1',
    textDecoration: 'none',
    fontSize: 15,
    fontWeight: 500,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    padding: '8px 0',
    display: 'block',
    borderRadius: 6,
    position: 'relative'
  },
  ctaLink: {
    display: 'inline-block',
    marginTop: 16,
    padding: '12px 20px',
    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    color: '#ffffff',
    textDecoration: 'none',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 4px 16px rgba(59, 130, 246, 0.3)',
    backdropFilter: 'blur(10px)'
  },
  socialRow: {
    display: 'flex',
    gap: 12,
    marginTop: 20,
  },
  social: {
    width: 44,
    height: 44,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    color: '#e2e8f0',
    textDecoration: 'none',
    fontSize: 18,
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    backdropFilter: 'blur(10px)'
  },
  newsletter: {
    display: 'flex',
    gap: 8,
    marginTop: 24,
    width: '100%',
    boxSizing: 'border-box'
  },
  input: {
    flex: 1,
    minWidth: 0,
    background: 'rgba(255, 255, 255, 0.05)',
    color: '#e2e8f0',
    border: '1px solid rgba(226, 232, 240, 0.15)',
    borderRadius: 8,
    padding: '12px 14px',
    fontSize: 14,
    fontWeight: 500,
    backdropFilter: 'blur(10px)',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    fontFamily: 'inherit',
    boxSizing: 'border-box'
  },
  subscribeBtn: {
    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    color: '#ffffff',
    border: 'none',
    borderRadius: 8,
    padding: '12px 16px',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 4px 16px rgba(59, 130, 246, 0.3)',
    backdropFilter: 'blur(10px)',
    flexShrink: 0,
    whiteSpace: 'nowrap'
  },
  bottomBar: {
    borderTop: '1px solid rgba(59, 130, 246, 0.2)',
    marginTop: 40,
    padding: '24px 40px',
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 15,
    fontWeight: 500,
    background: 'linear-gradient(90deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.2) 50%, rgba(0, 0, 0, 0.3) 100%)',
    backdropFilter: 'blur(15px)',
    boxShadow: '0 -1px 0 rgba(59, 130, 246, 0.1) inset'
  },
};

export default SiteFooter;
