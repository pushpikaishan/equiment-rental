import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import UserNavbar from "../shop/UserNavbar";
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
          // Clear stale/invalid token and redirect to login
          localStorage.removeItem("token");
          localStorage.removeItem("role");
          localStorage.removeItem("userId");
          navigate("/", { replace: true });
        }
      }
    };

    fetchProfile();
  }, []);

  //profile image upload handler handleFileChange
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
      headers: { Authorization: `Bearer ${token}` }, // let axios set multipart boundary
    });

    setProfile(res.data.user); // refresh profile with new image
  } catch (err) {
    console.error("Upload error:", err.response?.data || err.message);
  }
};


  // Settings button click handler
 const handleSettingsClick = () => {
    //alert("Settings clicked!");
    navigate("/UserMenu");   // 
  };

  // Generate avatar based on user's name and role
  const getAvatarUrl = (name, role) => {
    const initials = name
      ? name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
      : "?";
    const colors = {
      user: "4f46e5",
      staff: "059669",
      supplier: "dc2626",
      admin: "7c3aed",
    };
    const bgColor = colors[role] || "6b7280";
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      initials
    )}&background=${bgColor}&color=fff&size=200&font-size=0.6&rounded=true&bold=true`;
  };

  // Get role-specific gradient colors
  const getRoleColors = (role) => {
    const roleColors = {
      user: { primary: "#4f46e5", secondary: "#7c3aed", light: "#e0e7ff" },
      staff: { primary: "#059669", secondary: "#0d9488", light: "#d1fae5" },
      supplier: { primary: "#dc2626", secondary: "#ea580c", light: "#fee2e2" },
      admin: { primary: "#7c3aed", secondary: "#c026d3", light: "#f3e8ff" },
    };
    return roleColors[role] || roleColors.user;
  };

  const containerStyle = {
    minHeight: "100vh",
    padding: "60px 32px",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f1f5f9 100%)',
  };

  const cardStyle = {
    maxWidth: "900px",
    margin: "0 auto",
    background: 'rgba(255, 255, 255, 0.8)',
    borderRadius: "24px",
    boxShadow: "0 32px 64px rgba(0, 0, 0, 0.12), 0 8px 32px rgba(0, 0, 0, 0.04), 0 1px 0 rgba(255, 255, 255, 0.8) inset",
    backdropFilter: 'saturate(180%) blur(20px)',
    border: '1px solid rgba(226, 232, 240, 0.6)',
    overflow: "hidden",
    animation: "slideUp 0.6s ease-out",
    position: "relative",
  };

  const loadingStyle = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "50vh",
    color: "white",
    fontSize: "20px",
    fontWeight: "500",
  };

  if (!profile) {
    return (
      <div style={containerStyle}>
        <div style={loadingStyle}>
          <div
            style={{
              width: "40px",
              height: "40px",
              border: "4px solid rgba(255, 255, 255, 0.3)",
              borderTop: "4px solid white",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              marginRight: "15px",
            }}
          ></div>
          Loading Profile...
        </div>
      </div>
    );
  }

  // Dynamic fields based on role
  const commonFields = [
    { label: "Name", value: profile.name },
    { label: "Email", value: profile.email },
    { label: "Role", value: profile.role },
  ];

  // Optional fields for different roles
  let extraFields = [];

  switch (profile.role) {
    case "user":
      extraFields = [
        { label: "NIC", value: profile.nic },
        { label: "Phone", value: profile.phoneno },
        { label: "District", value: profile.district },
      ];
      break;
    case "staff":
      extraFields = [
        { label: "Phone", value: profile.phoneno },
        { label: "NIC", value: profile.nicNo },
      ];
      break;
    case "supplier":
      extraFields = [
        { label: "Company Name", value: profile.companyName },
        { label: "Phone", value: profile.phone },
        { label: "District", value: profile.district },
      ];
      break;
    case "admin":
      extraFields = []; // Admin only has name, email, role
      break;
    default:
      extraFields = [];
  }

  const roleColors = getRoleColors(profile.role);

  const headerStyle = {
    background: `linear-gradient(135deg, ${roleColors.primary} 0%, ${roleColors.secondary} 50%, ${roleColors.primary} 100%)`,
    padding: "48px 40px",
    textAlign: "center",
    color: "white",
    position: "relative",
    backdropFilter: 'blur(20px)',
    boxShadow: '0 1px 0 rgba(255, 255, 255, 0.1) inset',
  };

  // Settings button styles
  const settingsButtonStyle = {
    position: "absolute",
    top: "24px",
    right: "24px",
    width: "48px",
    height: "48px",
    background: "rgba(255, 255, 255, 0.2)",
    border: "1px solid rgba(255, 255, 255, 0.3)",
    borderRadius: "16px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    color: "white",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    backdropFilter: "blur(15px)",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15), 0 1px 0 rgba(255, 255, 255, 0.2) inset",
  };

  const profileImageContainerStyle = {
    position: "relative",
    display: "inline-block",
    marginBottom: "20px",
    
  };

  const profileImageStyle = {
    width: "140px",
    height: "140px",
    borderRadius: "50%",
    border: "6px solid rgba(255, 255, 255, 0.95)",
    boxShadow: "0 16px 48px rgba(0, 0, 0, 0.25), 0 8px 16px rgba(0, 0, 0, 0.1)",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  };

  const roleIconStyle = {
    position: "absolute",
    bottom: "8px",
    right: "8px",
    width: "40px",
    height: "40px",
    background: "rgba(255, 255, 255, 0.98)",
    border: "2px solid rgba(255, 255, 255, 1)",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.2), 0 4px 8px rgba(0, 0, 0, 0.1)",
    backdropFilter: "blur(10px)",
  };

  // Custom file upload styles
  const fileUploadContainerStyle = {
    position: "relative",
    display: "inline-block",
    marginTop: "15px"
  };

  const hiddenFileInputStyle = {
    position: "absolute",
    width: "1px",
    height: "1px",
    padding: "0",
    margin: "-1px",
    overflow: "hidden",
    clip: "rect(0,0,0,0)",
    whiteSpace: "nowrap",
    border: "0"
  };

  const customFileButtonStyle = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "12px 24px",
    background: "rgba(255, 255, 255, 0.25)",
    border: "1px solid rgba(255, 255, 255, 0.4)",
    borderRadius: "16px",
    color: "white",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    backdropFilter: "blur(15px)",
    letterSpacing: "0.025em",
    gap: "10px",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15), 0 1px 0 rgba(255, 255, 255, 0.2) inset"
  };

  const titleStyle = {
    fontSize: "36px",
    fontWeight: "800",
    marginBottom: "12px",
    textShadow: "0 4px 8px rgba(0, 0, 0, 0.15)",
    margin: "0 0 12px 0",
    letterSpacing: "-0.025em",
  };

  const subtitleStyle = {
    fontSize: "20px",
    opacity: "0.95",
    fontWeight: "500",
    textTransform: "capitalize",
    margin: "0",
    letterSpacing: "0.025em",
  };

  const contentStyle = {
    padding: "48px 40px",
    background: 'rgba(255, 255, 255, 0.5)',
    backdropFilter: 'blur(10px)',
  };

  const fieldsGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "24px",
    marginTop: "40px",
  };

  const fieldCardStyle = {
    background: 'rgba(255, 255, 255, 0.8)',
    padding: "24px",
    borderRadius: "20px",
    border: `1px solid rgba(226, 232, 240, 0.6)`,
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    position: "relative",
    overflow: "hidden",
    backdropFilter: 'blur(15px)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06), 0 1px 0 rgba(255, 255, 255, 0.8) inset',
  };

  const fieldLabelStyle = {
    fontSize: "12px",
    fontWeight: "800",
    color: '#64748b',
    marginBottom: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
  };

  const fieldValueStyle = {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1e293b",
    wordBreak: "break-word",
    letterSpacing: "-0.025em",
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

  const statsStyle = {
    display: "flex",
    justifyContent: "center",
    gap: "30px",
    marginTop: "30px",
    flexWrap: "wrap",
  };

  const statItemStyle = {
    textAlign: "center",
    padding: "15px 20px",
    background: "rgba(255, 255, 255, 0.1)",
    borderRadius: "12px",
    minWidth: "100px",
  };

  const statNumberStyle = {
    fontSize: "24px",
    fontWeight: "700",
    display: "block",
    marginBottom: "5px",
  };

  const statLabelStyle = {
    fontSize: "12px",
    opacity: "0.8",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  };

  return (
    <div>
      <UserNavbar />
      <div style={containerStyle}>
      <style>
        {`
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(50px);
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
        `}
      </style>

  <div style={cardStyle}>
        <div style={headerStyle}>
          {/* Settings Button */}
          <button
            style={settingsButtonStyle}
            onClick={handleSettingsClick}
            onMouseOver={(e) => {
              e.target.style.background = "rgba(255, 255, 255, 0.35)";
              e.target.style.transform = "scale(1.05) rotate(90deg)";
              e.target.style.boxShadow = "0 12px 48px rgba(0, 0, 0, 0.2)";
              e.target.style.borderColor = "rgba(255, 255, 255, 0.6)";
            }}
            onMouseOut={(e) => {
              e.target.style.background = "rgba(255, 255, 255, 0.2)";
              e.target.style.transform = "scale(1) rotate(0deg)";
              e.target.style.boxShadow = "0 8px 32px rgba(0, 0, 0, 0.15), 0 1px 0 rgba(255, 255, 255, 0.2) inset";
              e.target.style.borderColor = "rgba(255, 255, 255, 0.3)";
            }}
            title="Settings"
          >
            ⚙️
          </button>

          <div style={profileImageContainerStyle}>
            <img
              src={
                profile.profileImage
                  ? `http://localhost:5000${profile.profileImage}`
                  : getAvatarUrl(profile.name, profile.role)
              }
              alt="Profile"
              style={profileImageStyle}
              onMouseOver={(e) => {
                e.target.style.transform = "scale(1.1) rotate(8deg)";
                e.target.style.boxShadow = "0 20px 60px rgba(0, 0, 0, 0.3), 0 8px 16px rgba(0, 0, 0, 0.1)";
              }}
              onMouseOut={(e) => {
                e.target.style.transform = "scale(1) rotate(0deg)";
                e.target.style.boxShadow = "0 16px 48px rgba(0, 0, 0, 0.25), 0 8px 16px rgba(0, 0, 0, 0.1)";
              }}
            />
            <div style={roleIconStyle}>{getRoleIcon(profile.role)}</div>
          </div>

          {/* Custom File Upload Button */}
          <div style={fileUploadContainerStyle}>
            <input
              type="file"
              accept="image/*"
              id="profileUpload"
              onChange={handleFileChange}
              style={hiddenFileInputStyle}
            />
            <label
              htmlFor="profileUpload"
              style={customFileButtonStyle}
              onMouseOver={(e) => {
                e.target.style.background = "rgba(255, 255, 255, 0.35)";
                e.target.style.borderColor = "rgba(255, 255, 255, 0.6)";
                e.target.style.transform = "translateY(-4px)";
                e.target.style.boxShadow = "0 16px 48px rgba(0, 0, 0, 0.2)";
              }}
              onMouseOut={(e) => {
                e.target.style.background = "rgba(255, 255, 255, 0.25)";
                e.target.style.borderColor = "rgba(255, 255, 255, 0.4)";
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 8px 32px rgba(0, 0, 0, 0.15), 0 1px 0 rgba(255, 255, 255, 0.2) inset";
              }}
            >
              📷 Update Photo
            </label>
          </div>

         {/* <h2 style={titleStyle}>{profile.role.toUpperCase()} Profile</h2> */}
          <p style={titleStyle}>Welcome back</p> 
          <p style={subtitleStyle}>{profile.name || "User"}</p>

          {/*<div style={statsStyle}>
            <div style={statItemStyle}>
              <span style={statNumberStyle}>
                {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
              </span>
              <span style={statLabelStyle}>Account Type</span>
            </div>
          </div>*/}
        </div>

        <div style={contentStyle}>
          <div style={fieldsGridStyle}>
            {commonFields.concat(extraFields).map((field, index) => (
              <div
                key={field.label}
                style={{
                  ...fieldCardStyle,
                  animationDelay: `${index * 0.1}s`,
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translateY(-8px)";
                  e.currentTarget.style.boxShadow = '0 16px 48px rgba(0, 0, 0, 0.12), 0 8px 16px rgba(0, 0, 0, 0.04)';
                  e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.4)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.06), 0 1px 0 rgba(255, 255, 255, 0.8) inset';
                  e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.6)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)';
                }}
              >
                <div style={fieldLabelStyle}>{field.label}</div>
                <div style={fieldValueStyle}>{field.value || "N/A"}</div>

                {/* Decorative corner element */}
                <div
                  style={{
                    position: "absolute",
                    top: "0",
                    right: "0",
                    width: "40px",
                    height: "40px",
                    background: `linear-gradient(135deg, #3b82f6, #1d4ed8)`,
                    clipPath: "polygon(100% 0, 0 0, 100% 100%)",
                    opacity: "0.08",
                  }}
                ></div>
              </div>
            ))}
          </div>
        </div>
      </div>
      </div>
      <SiteFooter />
    </div>
  );
}

export default UserProfile;