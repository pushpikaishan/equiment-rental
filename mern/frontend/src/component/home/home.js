import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";


function Home() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);
  const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

  const fullUrl = (src) => {
    if (!src) return '';
    return src.startsWith('http://') || src.startsWith('https://') ? src : `${baseUrl}${src.startsWith('/') ? '' : '/'}${src}`;
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
  const res = await axios.get(`${baseUrl}/banners`);
  const items = Array.isArray(res?.data) ? res.data : res?.data?.items;
  setBanners(Array.isArray(items) ? items : []);
      } catch (_) {
        // ignore for now
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div>
      {/* Banner strip */}
      <div style={{ width: '100%', overflowX: 'auto', whiteSpace: 'nowrap', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ display: 'inline-flex', gap: 12, padding: 12 }}>
          {loading ? (
            <div style={{ color: '#64748b' }}>Loading banners…</div>
          ) : banners.length === 0 ? (
            <div style={{ color: '#64748b' }}>No banners available.</div>
          ) : (
            banners.map((b) => (
              <div key={b._id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', minWidth: 280 }}>
                <img alt={b.title || 'Banner'} src={fullUrl(b.image || b.imageUrl)} style={{ width: '100%', height: 140, objectFit: 'cover' }} />
                <div style={{ padding: 8 }}>
                  <div style={{ fontSize: 13, color: '#0f172a', fontWeight: 600 }}>{b.title || 'Banner'}</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{new Date(b.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <Link to="/userlog" className="userlog">
        <h1>User Log</h1>
      </Link>


      <Link to="/userRegister" className="register">
        <h1>user register</h1>
      </Link>

       <Link to="/SupplierRegister" className="SupplierRegister">
        <h1>SupplierRegister</h1>
      </Link>

      <Link to="/AdminRegister" className="AdminRegister">
        <h1>AdminRegister</h1>
      </Link>

      <Link to="/StaffRegister" className="StaffRegister">
        <h1>StaffRegister</h1>
      </Link>





      <Link to="/DisAllUsers" className="DisAllUsers">
        <h1>Dis All User</h1>
      </Link>

      
      <Link to="/DisAllStaff" className="DisAllStaff">
        <h1>Dis All Staff</h1>
      </Link>

      <Link to="/DisAllSupplier" className="DisAllSupplier">
        <h1>Dis All Supplier</h1>
      </Link>

      
      <Link to="/DisAllAdmins" className="DisAllAdmins">
        <h1>Dis All Admins</h1>
      </Link>

      <Link to="/adminDashbooard" className="adminDashbooard">
        <h2>Admin Dashboard</h2>
      </Link>

      <Link to="/test" className="test">
        <h2>test</h2>
      </Link>


      
    </div>
  );
}

export default Home;
