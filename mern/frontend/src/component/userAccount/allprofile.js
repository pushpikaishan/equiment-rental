import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import UserNavbar from "../shop/UserNavbar";
import SiteFooter from "../common/SiteFooter";

function UserProfile() {
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();
  const storedRole = (localStorage.getItem('role') || '').toLowerCase();

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
  }, []);

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
      // Optionally clear other app-specific keys here
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

  // Role-based color palette (from admin profile)
  const getRoleColors = (role) => {
    const roleColors = {
      user: { primary: "#1e40af", secondary: "#3b82f6", light: "#1d4ed8" },
      staff: {primary: "#1d3ca3ff", secondary: "#3b82f6", light: "#1d4ed8" },
      supplier: { primary: "#264dccff", secondary: "#3b82f6", light: "#1d4ed8" },
      admin: { primary: "#163083ff", secondary: "#3b82f6", light: "#1d4ed8" },
    };
    return roleColors[role] || roleColors.user;
  };

  // CSS Styles
  const styles = {
    profileContainer: {
      minHeight: "100vh",
      background: "linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 50%, #f8fafc 100%)",
      padding: "2rem 1rem",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    },
    loadingWrapper: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "50vh",
      gap: "1rem",
      color: "#64748b",
      fontSize: "1.1rem",
      fontWeight: "500"
    },
    loadingSpinner: {
      width: "32px",
      height: "32px",
      border: "3px solid #e2e8f0",
      borderTop: "3px solid #3b82f6",
      borderRadius: "50%",
      animation: "spin 1s linear infinite"
    },
    profileCard: {
      maxWidth: "650px",
      margin: "0 auto",
      background: "#ffffff",
      borderRadius: "24px",
      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      overflow: "hidden",
      border: "1px solid #e2e8f0",
      animation: "slideUp 0.6s ease-out"
    },
    profileHeader: {
      // Will be overridden dynamically below using role colors
      //background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #1d4ed8 100%)",
      padding: "3rem 2rem",
      textAlign: "center",
      color: "white",
      position: "relative"
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
      backdropFilter: "blur(10px)"
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
      backdropFilter: "blur(10px)"
    },
    avatarWrapper: {
      position: "relative",
      display: "inline-block",
      marginBottom: "0.75rem"
    },
    avatarSection: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: "2rem"
    },
    profileAvatar: {
      width: "150px",
      height: "150px",
      borderRadius: "50%",
      border: "6px solid rgba(255, 255, 255, 0.9)",
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
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)"
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
      border: "0"
    },
    uploadBtn: {
      display: "inline-flex",
      alignItems: "center",
      gap: "0.5rem",
      padding: "0.75rem 1.5rem",
      background: "rgba(255, 255, 255, 0.2)",
      border: "2px solid rgba(255, 255, 255, 0.3)",
      borderRadius: "25px",
      color: "white",
      fontSize: "0.875rem",
      fontWeight: "600",
      cursor: "pointer",
      transition: "all 0.3s ease",
      backdropFilter: "blur(10px)",
      textDecoration: "none",
      marginTop: "0.5rem",
      letterSpacing: "0.5px"
    },
    profileName: {
      fontSize: "2.25rem",
      fontWeight: "500",
      margin: "0 0 0.5rem 0",
      letterSpacing: "-0.025em",
      textShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
     
    },
    profileRole: {
      fontSize: "1.125rem",
      opacity: "0.9",
      fontWeight: "500",
      margin: "0",
      textTransform: "capitalize"
    },
    profileContent: {
      padding: "3rem 2rem",
      background: "#fafafa"
    },
    fieldsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
      gap: "1rem"
    },
    fieldCard: {
      background: "white",
      padding: "1rem",
      borderRadius: "10px",
      transition: "all 0.3s ease",
      animation: "fadeInUp 0.6s ease-out forwards",
      opacity: "0",
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.2)"
    },
    fieldHeader: {
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
      marginBottom: "0.75rem"
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
      filter: "grayscale(0.2)"
    },
    fieldLabel: {
      fontSize: "0.875rem",
      fontWeight: "700",
      color: "#64748b",
      textTransform: "uppercase",
      letterSpacing: "0.05em"
    },
    fieldValue: {
      fontSize: "1.125rem",
      fontWeight: "600",
      color: "#1e293b",
      wordBreak: "break-word",
      paddingLeft: "2.75rem"
    }
  };

  if (!profile) {
    return (
      <>
        {!(storedRole === 'supplier' || storedRole === 'staff') && <UserNavbar />}
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
        {!(storedRole === 'supplier' || storedRole === 'staff') && <SiteFooter />}
      </>
    );
  }

  // Dynamic fields based on role
  const roleColors = getRoleColors(profile.role);
  const commonFields = [
    { label: "Full Name", value: profile.name, icon: "👤" },
    { label: "Email Address", value: profile.email, icon: "📧" },
   // { label: "Account Type", value: profile.role, icon: "🏷️" },
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
      {!(profile.role === 'supplier' || profile.role === 'staff') && <UserNavbar />}
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

            @media (max-width: 768px) {
              .profile-container {
                padding: 1rem 0.5rem !important;
              }
              
              .profile-header {
                padding: 2rem 1rem !important;
              }
              
              .profile-content {
                padding: 2rem 1rem !important;
              }
              
              .fields-grid {
                grid-template-columns: 1fr !important;
              }
              
              .profile-name {
                font-size: 1.75rem !important;
              }
              
              .settings-btn {
                width: 40px !important;
                height: 40px !important;
                top: 1rem !important;
                right: 1rem !important;
              }
            }
          `}
        </style>
        
        <div style={styles.profileCard}>
          {/* Header Section */}
          <div style={{
            ...styles.profileHeader,
            background: `linear-gradient(135deg, ${roleColors.primary}, ${roleColors.secondary})`
          }}>
            <button
              style={styles.logoutBtn}
              className="logout-btn"
              onClick={handleLogout}
              title="Log out"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Logout
            </button>
            <button 
              style={styles.settingsBtn} 
              className="settings-btn"
              onClick={handleSettingsClick} 
              title="Settings"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
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
                <div style={styles.roleBadge}>
                  {getRoleIcon(profile.role)}
                </div>
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
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                  <circle cx="12" cy="13" r="4"></circle>
                </svg>
                Update Photo
              </label>
            </div>

            <div style={{ marginTop: "1rem" }}>
              <h1 style={styles.profileName}>{profile.name || "User"}</h1>
              {/* <p style={styles.profileRole}>{profile.role?.charAt(0).toUpperCase() + profile.role?.slice(1)} Account</p> */}
            </div>
          </div>

          {/* Content Section */}
          <div style={styles.profileContent}>
            {(profile.role === 'supplier' || profile.role === 'staff') && (
              <div style={{ marginBottom: '1rem' }}>
                <button
                  onClick={() => navigate(profile.role === 'supplier' ? '/supplier/dashboard' : '/driver')}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: '1px solid #93c5fd',
                    background: '#dbeafe',
                    color: '#1d4ed8',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  ← Back to {profile.role === 'supplier' ? 'Supplier' : 'Driver'} Dashboard
                </button>
              </div>
            )}
            <div style={styles.fieldsGrid}>
              {commonFields.concat(extraFields).map((field, index) => (
                <div 
                  key={field.label} 
                  style={{...styles.fieldCard, animationDelay: `${index * 0.1}s`}}
                  className="field-card"
                >
                  <div style={styles.fieldHeader}>
                    <span style={{
                      ...styles.fieldIcon,
                      background: `linear-gradient(135deg, ${roleColors.primary}, ${roleColors.secondary})`
                    }}>{field.icon}</span>
                    <span style={{
                      ...styles.fieldLabel,
                      color: roleColors.primary
                    }}>{field.label}</span>
                  </div>
                  <div style={styles.fieldValue}>{field.value || "Not specified"}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {!(profile.role === 'supplier' || profile.role === 'staff') && <SiteFooter />}
    </>
  );
}

export default UserProfile;