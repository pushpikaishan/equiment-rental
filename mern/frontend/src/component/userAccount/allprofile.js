import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import UserNavbar from "../shop/UserNavbar";
import SupplierTopbar from "../supplierPanel/SupplierTopbar";
import SiteFooter from "../common/SiteFooter";

function UserProfile() {
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/", { replace: true });
        return;
      }

      try {
        const res = await axios.get("http://localhost:5000/auth/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(res.data);
      } catch (err) {
        console.error(
          "Error fetching profile:",
          err.response?.data || err.message
        );
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("role");
          localStorage.removeItem("userId");
          navigate("/", { replace: true });
        }
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("profileImage", file);

    try {
      let uploadUrl = "";
      switch (profile.role) {
        case "admin":
          uploadUrl = `http://localhost:5000/admins/${profile._id}/upload`;
          break;
        case "staff":
          uploadUrl = `http://localhost:5000/staff/${profile._id}/upload`;
          break;
        case "supplier":
          uploadUrl = `http://localhost:5000/suppliers/${profile._id}/upload`;
          break;
        case "user":
          uploadUrl = `http://localhost:5000/users/${profile._id}/upload`;
          break;
        default:
          throw new Error("Unknown role");
      }

      const token = localStorage.getItem("token");
      const res = await axios.post(uploadUrl, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setProfile(res.data.user);
    } catch (err) {
      console.error("Upload error:", err.response?.data || err.message);
    }
  };

  const handleSettingsClick = () => {
    navigate("/UserMenu");
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("userId");
    } catch (_) {
      // ignore
    }
    navigate("/");
  };

  const getAvatarUrl = (name, role) => {
    const initials = name
      ? name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
      : "?";
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      initials
    )}&background=1e40af&color=fff&size=200&font-size=0.6&rounded=true&bold=true`;
  };

  const getRoleIcon = (role) => {
    const icons = {
      user: "👤",
      staff: "👨‍💼",
      supplier: "🏢",
      admin: "👑",
    };
    return icons[role] || "👤";
  };

  // CSS Styles
  const styles = {
    profileContainer: {
      minHeight: "100vh",
      background:
        "linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 50%, #f8fafc 100%)",
      padding: "2rem 1rem",
      fontFamily:
        "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    },
    loadingWrapper: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "50vh",
      gap: "1rem",
      color: "#64748b",
      fontSize: "1.1rem",
      fontWeight: "500",
    },
    loadingSpinner: {
      width: "32px",
      height: "32px",
      border: "3px solid #e2e8f0",
      borderTop: "3px solid #3b82f6",
      borderRadius: "50%",
      animation: "spin 1s linear infinite",
    },
    profileCard: {
      maxWidth: "650px",
      margin: "0 auto",
      background: "#ffffff",
      borderRadius: "24px",
      boxShadow:
        "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      overflow: "hidden",
      border: "1px solid #e2e8f0",
      animation: "slideUp 0.6s ease-out",
    },
    profileHeader: {
      background:
        "linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #1d4ed8 100%)",
      padding: "3rem 2rem",
      textAlign: "center",
      color: "white",
      position: "relative",
    },
    settingsBtn: {
      position: "absolute",
      top: "1.5rem",
      right: "1.5rem",
      width: "48px",
      height: "48px",
      background: "rgba(255, 255, 255, 0.15)",
      border: "1px solid rgba(255, 255, 255, 0.2)",
      borderRadius: "12px",
      color: "white",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "all 0.3s ease",
      backdropFilter: "blur(10px)",
    },
    logoutBtn: {
      position: "absolute",
      top: "1.5rem",
      left: "1.5rem",
      height: "48px",
      padding: "0 14px",
      background: "rgba(255, 255, 255, 0.15)",
      border: "1px solid rgba(255, 255, 255, 0.2)",
      borderRadius: "12px",
      color: "white",
      cursor: "pointer",
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      fontWeight: 600,
      transition: "all 0.3s ease",
      backdropFilter: "blur(10px)",
    },
    avatarWrapper: {
      position: "relative",
      display: "inline-block",
      marginBottom: "0.75rem",
    },
    avatarSection: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: "2rem",
    },
    profileAvatar: {
      width: "150px",
      height: "150px",
      borderRadius: "50%",
      border: "4px solid rgba(255, 255, 255, 0.9)",
      boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
      transition: "all 0.3s ease",
      objectFit: "cover",
    },
    roleBadge: {
      position: "absolute",
      bottom: "4px",
      right: "4px",
      width: "36px",
      height: "36px",
      background: "rgba(255, 255, 255, 0.95)",
      border: "2px solid white",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "16px",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    },
    fileInput: {
      position: "absolute",
      width: "1px",
      height: "1px",
      padding: "0",
      margin: "-1px",
      overflow: "hidden",
      clip: "rect(0,0,0,0)",
      whiteSpace: "nowrap",
      border: "0",
    },
    uploadBtn: {
      display: "inline-flex",
      alignItems: "center",
      gap: "0.5rem",
      padding: "0.75rem 1.5rem",
      background: "rgba(255, 255, 255, 0.2)",
      border: "1px solid rgba(255, 255, 255, 0.3)",
      borderRadius: "12px",
      color: "white",
      fontSize: "0.875rem",
      fontWeight: "600",
      cursor: "pointer",
      transition: "all 0.3s ease",
      backdropFilter: "blur(10px)",
      textDecoration: "none",
      marginTop: "0.5rem",
    },
    profileName: {
      fontSize: "2.25rem",
      fontWeight: "500",
      margin: "0 0 0.5rem 0",
      letterSpacing: "-0.025em",
      textShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
    },
    profileContent: {
      padding: "3rem 2rem",
      background: "#fafafa",
    },
    fieldsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
      gap: "1rem",
    },
    fieldCard: {
      background: "white",
      padding: "1rem",
      borderRadius: "10px",
      transition: "all 0.3s ease",
      animation: "fadeInUp 0.6s ease-out forwards",
      opacity: "0",
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.2)",
    },
    fieldHeader: {
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
      marginBottom: "0.75rem",
    },
    fieldIcon: {
      fontSize: "1.25rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "32px",
      height: "32px",
      background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
      borderRadius: "8px",
      filter: "grayscale(0.2)",
    },
    fieldLabel: {
      fontSize: "0.875rem",
      fontWeight: "700",
      color: "#64748b",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
    },
    fieldValue: {
      fontSize: "1.125rem",
      fontWeight: "600",
      color: "#1e293b",
      wordBreak: "break-word",
      paddingLeft: "2.75rem",
    },
  };

  if (!profile) {
    return (
      <>
        <UserNavbar />
        <div style={styles.profileContainer}>
          <div style={styles.loadingWrapper}>
            <div style={styles.loadingSpinner}></div>
            <span>Loading Profile...</span>
          </div>
          <style>
            {`
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}
          </style>
        </div>
        <SiteFooter />
      </>
    );
  }

  const commonFields = [
    { label: "Full Name", value: profile.name, icon: "👤" },
    { label: "Email Address", value: profile.email, icon: "📧" },
  ];

  let extraFields = [];
  switch (profile.role) {
    case "user":
      extraFields = [
        { label: "National ID", value: profile.nic, icon: "🆔" },
        { label: "Phone Number", value: profile.phoneno, icon: "📱" },
        { label: "Location", value: profile.district, icon: "📍" },
      ];
      break;
    case "staff":
      extraFields = [
        { label: "Phone Number", value: profile.phoneno, icon: "📱" },
        { label: "National ID", value: profile.nicNo, icon: "🆔" },
      ];
      break;
    case "supplier":
      extraFields = [
        { label: "Company Name", value: profile.companyName, icon: "🏢" },
        { label: "Phone Number", value: profile.phone, icon: "📱" },
        { label: "District", value: profile.district, icon: "📍" },
      ];
      break;
    case "admin":
      extraFields = [];
      break;
    default:
      extraFields = [];
  }

  return (
    <>
      {profile?.role === "supplier" ? (
        <SupplierTopbar title="Supplier Profile" hideProfile />
      ) : profile?.role === "staff" ? (
        <SupplierTopbar title="Driver Profile" hideProfile />
      ) : (
        <UserNavbar />
      )}

      <div style={styles.profileContainer}>
        <style>
          {`
            @keyframes slideUp {
              from {
                opacity: 0;
                transform: translateY(30px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }

            @keyframes fadeInUp {
              from {
                opacity: 0;
                transform: translateY(20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }

            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }

            .profile-avatar:hover {
              transform: scale(1.05);
              box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
            }

            .upload-btn:hover {
              background: rgba(255, 255, 255, 0.3) !important;
              border-color: rgba(255, 255, 255, 0.5) !important;
              transform: translateY(-2px);
            }

            .settings-btn:hover {
              background: rgba(255, 255, 255, 0.25) !important;
              transform: scale(1.05);
              border-color: rgba(255, 255, 255, 0.4) !important;
            }

            .logout-btn:hover {
              background: rgba(255, 255, 255, 0.25) !important;
              transform: translateY(-1px);
              border-color: rgba(255, 255, 255, 0.4) !important;
            }

            .field-card:hover {
              transform: translateY(-4px);
              box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1) !important;
              border-color: #3b82f6 !important;
            }
          `}
        </style>

        <div style={styles.profileCard}>
          <div style={styles.profileHeader}>
            <button
              style={styles.logoutBtn}
              className="logout-btn"
              onClick={handleLogout}
              title="Log out"
            >
              Logout
            </button>
            <button
              style={styles.settingsBtn}
              className="settings-btn"
              onClick={handleSettingsClick}
              title="Settings"
            >
              ⚙
            </button>

            <div style={styles.avatarSection}>
              <div style={styles.avatarWrapper}>
                <img
                  src={
                    profile.profileImage
                      ? `http://localhost:5000${profile.profileImage}`
                      : getAvatarUrl(profile.name, profile.role)
                  }
                  alt="Profile"
                  style={styles.profileAvatar}
                  className="profile-avatar"
                />
                <div style={styles.roleBadge}>{getRoleIcon(profile.role)}</div>
              </div>

              <input
                type="file"
                accept="image/*"
                id="profileUpload"
                onChange={handleFileChange}
                style={styles.fileInput}
              />
              <label
                htmlFor="profileUpload"
                style={styles.uploadBtn}
                className="upload-btn"
              >
                Update Photo
              </label>
            </div>

            <div style={{ marginTop: "1rem" }}>
              <h1 style={styles.profileName}>{profile.name || "User"}</h1>
            </div>
          </div>

          <div style={styles.profileContent}>
            <div style={styles.fieldsGrid}>
              {commonFields.concat(extraFields).map((field, index) => (
                <div
                  key={field.label}
                  style={{
                    ...styles.fieldCard,
                    animationDelay: `${index * 0.1}s`,
                  }}
                  className="field-card"
                >
                  <div style={styles.fieldHeader}>
                    <span style={styles.fieldIcon}>{field.icon}</span>
                    <span style={styles.fieldLabel}>{field.label}</span>
                  </div>
                  <div style={styles.fieldValue}>
                    {field.value || "Not specified"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <SiteFooter />
    </>
  );
}

export default UserProfile;
