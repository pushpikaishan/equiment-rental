import React from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";


function AdminMenu() {
  const navigate = useNavigate();
  const role = localStorage.getItem("role"); // should be "admin"
  const userId = localStorage.getItem("userId");

  // Handle menu item clicks
  const handleMenuClick = async (action) => {
    switch (action) {
      case "editProfile": // update profile
        navigate(`/AdminProfileUpdate/${userId}`);
        break;

      case "twoFactor":
        navigate("/two-factor-auth");
        break;

      case "deactivateAccount":
        if (window.confirm("Are you sure you want to deactivate your account?")) {
          console.log("Admin account deactivated");
        }
        break;

      case "deleteAccount": // delete account
        if (window.confirm("Are you sure you want to permanently delete your account?")) {
          try {
            await axios.delete(`http://localhost:5000/admins/${userId}`);
            alert("Account deleted successfully");

            localStorage.removeItem("token");
            localStorage.removeItem("role");
            localStorage.removeItem("userId");
            navigate("/userlog");
          } catch (err) {
            console.error("Error deleting account:", err);
            alert("Failed to delete account. Check console for details.");
          }
        }
        break;

      case "signOut": // logout
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("userId");
        navigate("/userlog");
        break;

      default:
        console.log(`${action} clicked`);
    }
  };

  // -------- Menu Items for Admin --------
  const menuItems = [
    {
      id: "editProfile",
      icon: "✏️",
      title: "Edit Profile",
      description: "Update your personal information",
    },
    {
      id: "twoFactor",
      icon: "🔐",
      title: "Two-Factor Auth",
      description: "Add extra security to your account",
    },
    {
      id: "deactivateAccount",
      icon: "⏸️",
      title: "Deactivate Account",
      description: "Temporarily disable your account",
    },
    {
      id: "deleteAccount",
      icon: "🗑️",
      title: "Delete Account",
      description: "Permanently remove your account",
    },
    {
      id: "signOut",
      icon: "🚪",
      title: "Sign Out",
      description: "Log out securely",
    },
  ];

  // --------------- Styles ----------------
  const containerStyle = {
    minHeight: "100vh",
    padding: "20px",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  };
  const menuCardStyle = {
    maxWidth: "600px",
    margin: "0 auto",
    background: "white",
    borderRadius: "24px",
    boxShadow: "0 25px 50px rgba(0, 0, 0, 0.15)",
    overflow: "hidden",
  };
  const headerStyle = {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    padding: "30px",
    textAlign: "center",
    color: "white",
  };

  const iconStyle = {
    fontSize: "32px",
    marginBottom: "12px",
    display: "block",
  };
  const menuTitleStyle = {
    fontSize: "18px",
    fontWeight: "600",
    marginBottom: "8px",
    color: "#1f2937",
  };
  const menuDescStyle = {
    fontSize: "14px",
    color: "#6b7280",
    lineHeight: "1.4",
  };

  return (
    <div style={containerStyle}>
      <div style={menuCardStyle}>
        <div style={headerStyle}>
          <h1>Admin Menu</h1>
          <p>Manage your admin account settings</p>
        </div>

        <div style={{ padding: "30px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "20px",
            }}
          >
            {menuItems.map((item) => (
              <div
                key={item.id}
                style={{
                  background: "#f8f9fa",
                  border: "2px solid #e9ecef",
                  borderRadius: "16px",
                  padding: "20px",
                  cursor: "pointer",
                  textAlign: "center",
                }}
                onClick={() => handleMenuClick(item.id)}
              >
                <span style={iconStyle}>{item.icon}</span>
                <div style={menuTitleStyle}>{item.title}</div>
                <div style={menuDescStyle}>{item.description}</div>
              </div>
            ))}
          </div>

          {/* Back Button */}
          <div style={{ textAlign: "center", marginTop: "30px" }}>
            <button
              style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                border: "none",
                padding: "12px 30px",
                borderRadius: "25px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
              }}
              onClick={() => navigate("/userAccount/profile")}
            >
              ← Back to Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminMenu;
