import React from "react";
import { Link } from "react-router-dom";
import FeedbackSection from "./FeedbackSection";

function Home() {
  const links = [
    { to: "/userlog", label: "User Login", icon: "🔐" },
    { to: "/userRegister", label: "User Register", icon: "📝" },
    { to: "/SupplierRegister", label: "Supplier Register", icon: "🏭" },
    { to: "/AdminRegister", label: "Admin Register", icon: "🛡️" },
    { to: "/StaffRegister", label: "Staff Register", icon: "👩‍💼" },
    { to: "/DisAllUsers", label: "All Users", icon: "👥" },
    { to: "/DisAllStaff", label: "All Staff", icon: "👨‍🔧" },
    { to: "/DisAllSupplier", label: "All Suppliers", icon: "🚚" },
    { to: "/DisAllAdmins", label: "All Admins", icon: "👑" },
    { to: "/adminDashbooard", label: "Admin Dashboard", icon: "📊" },
    { to: "/test", label: "Test Page", icon: "🧪" },
  ];

  return (
    <div className="page-center">
      <div className="card animate-slide-in" style={{ width: "100%", maxWidth: 1000 }}>
        <div className="card-header">
          <h2 className="section-title" style={{ margin: 0 }}>Welcome</h2>
          <p className="muted" style={{ marginTop: 6 }}>Quick navigation</p>
        </div>
        <div className="card-body">
          <div className="grid grid-3">
            {links.map((link) => (
              <Link key={link.to} to={link.to} className="card" style={{ textDecoration: "none" }}>
                <div className="card-section" style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ fontSize: 28 }}>{link.icon}</div>
                  <div>
                    <div style={{ fontWeight: 700 }}>{link.label}</div>
                    <div className="muted" style={{ fontSize: 13 }}>Go to {link.label}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 20, width: "100%", maxWidth: 1000 }}>
        <FeedbackSection />
      </div>
    </div>
  );
}

export default Home;
