import React from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function UserMenu() {
  const navigate = useNavigate();
  const role = localStorage.getItem("role"); // 👈 role saved at login (user/supplier/staff/admin)
  const userId = localStorage.getItem("userId");

  // Handle menu item clicks
  const handleMenuClick = async (action) => {
    switch (action) {
      case "editProfile"://update profile.........................
        if (role === "supplier") {
          navigate(`/update-supplier/${userId}`);
        } else if (role === "user") {
          navigate(`/update-user/${userId}`);
        } else if (role === "staff") {
          navigate(`/update-staff/${userId}`);
        } else if (role === "admin") {
          navigate(`/update-admin/${userId}`);
        }
        break;

      case "twoFactor":
        navigate("/two-factor-auth");
        break;

      case "myCart":
        navigate("/my-cart");
        break;

      case "sellItem":
        navigate("/sell-item");
        break;

      case "deactivateAccount":
        if (
          window.confirm("Are you sure you want to deactivate your account?")
        ) {
          console.log("Account deleted");
        }
        break;

      case "deleteAccount": //delete account.......................
        if (
          window.confirm(
            "Are you sure you want to permanently delete your account?"
          )
        ) {
          try {
            let res;
            if (role === "user") {
              res = await axios.delete(`http://localhost:5000/users/${userId}`);
            } else if (role === "admin") {
              res = await axios.delete(
                `http://localhost:5000/admins/${userId}`
              );
            } else if (role === "staff") {
              res = await axios.delete(`http://localhost:5000/staff/${userId}`);
            } else if (role === "supplier") {
              res = await axios.delete(
                `http://localhost:5000/suppliers/${userId}`
              );
            }

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

      case "signOut"://logout................................
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("userId");
        navigate("/userlog");
        break;

      default:
        console.log(`${action} clicked`);
    }
  };

  // -------- Menu Items by Role --------
  const allMenuItems = {
    supplier: [
      {
        id: "editProfile",
        icon: "✏️",
        title: "Edit Profile",
        description: "Update your personal information",
        category: "profile",
      },
      {
        id: "twoFactor",
        icon: "🔐",
        title: "Two-Factor Auth",
        description: "Add extra security to your account",
        category: "security",
      },
      {
        id: "sellItem",
        icon: "💰",
        title: "Sell Item",
        description: "List a new item for sale",
        category: "commerce",
      },
      {
        id: "deactivateAccount",
        icon: "⏸️",
        title: "Deactivate Account",
        description: "Temporarily disable your account",
        category: "account",
      },
      {
        id: "deleteAccount",
        icon: "🗑️",
        title: "Delete Account",
        description: "Permanently remove your account",
        category: "danger",
      },
      {
        id: "signOut",
        icon: "🚪",
        title: "Sign Out",
        description: "Log out securely",
        category: "action",
      },
    ],
    user: [
      {
        id: "editProfile",
        icon: "✏️",
        title: "Edit Profile",
        description: "Update your personal information",
        category: "profile",
      },
      {
        id: "twoFactor",
        icon: "🔐",
        title: "Two-Factor Auth",
        description: "Add extra security to your account",
        category: "security",
      },
      {
        id: "myCart",
        icon: "🛒",
        title: "My Cart",
        description: "View and manage your cart",
        category: "commerce",
      },
      {
        id: "deactivateAccount",
        icon: "⏸️",
        title: "Deactivate Account",
        description: "Temporarily disable your account",
        category: "account",
      },
      {
        id: "deleteAccount",
        icon: "🗑️",
        title: "Delete Account",
        description: "Permanently remove your account",
        category: "danger",
      },
      {
        id: "signOut",
        icon: "🚪",
        title: "Sign Out",
        description: "Log out securely",
        category: "action",
      },
    ],
    staff: [
      {
        id: "editProfile",
        icon: "✏️",
        title: "Edit Profile",
        description: "Update your personal information",
        category: "profile",
      },
      {
        id: "twoFactor",
        icon: "🔐",
        title: "Two-Factor Auth",
        description: "Add extra security to your account",
        category: "security",
      },
      {
        id: "deactivateAccount",
        icon: "⏸️",
        title: "Deactivate Account",
        description: "Temporarily disable your account",
        category: "account",
      },
      {
        id: "deleteAccount",
        icon: "🗑️",
        title: "Delete Account",
        description: "Permanently remove your account",
        category: "danger",
      },
      {
        id: "signOut",
        icon: "🚪",
        title: "Sign Out",
        description: "Log out securely",
        category: "action",
      },
    ],
    admin: [
      {
        id: "editProfile",
        icon: "✏️",
        title: "Edit Profile",
        description: "Update your personal information",
        category: "profile",
      },
      {
        id: "twoFactor",
        icon: "🔐",
        title: "Two-Factor Auth",
        description: "Add extra security to your account",
        category: "security",
      },
      {
        id: "deactivateAccount",
        icon: "⏸️",
        title: "Deactivate Account",
        description: "Temporarily disable your account",
        category: "account",
      },
      {
        id: "deleteAccount",
        icon: "🗑️",
        title: "Delete Account",
        description: "Permanently remove your account",
        category: "danger",
      },
      {
        id: "signOut",
        icon: "🚪",
        title: "Sign Out",
        description: "Log out securely",
        category: "action",
      },
    ],
  };

  const menuItems = allMenuItems[role] || [];

  // --------------- Styles (same as yours, trimmed for brevity) ----------------
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
    background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
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
          <h1>Account Menu</h1>
          <p>Manage your account settings and preferences</p>
        </div>

        <div style={{ padding: "30px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "20px",
            }}
          >
            {menuItems.map((item, index) => (
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

export default UserMenu;
