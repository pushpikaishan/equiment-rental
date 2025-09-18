import React, { useEffect, useState } from "react";
import axios from "axios";

function UserProfile() {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await axios.get("http://localhost:5000/auth/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(res.data);
      } catch (err) {
        console.error("Error fetching profile:", err.response?.data || err.message);
      }
    };

    fetchProfile();
  }, []);

  // Settings button click handler
  const handleSettingsClick = () => {
    alert("Settings clicked!"); // Replace with your navigation logic
    // Example: navigate('/settings') or show settings modal
  };

  // Generate avatar based on user's name and role
  const getAvatarUrl = (name, role) => {
    const initials = name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : '?';
    const colors = {
      user: '4f46e5',
      staff: '059669', 
      supplier: 'dc2626',
      admin: '7c3aed'
    };
    const bgColor = colors[role] || '6b7280';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${bgColor}&color=fff&size=200&font-size=0.6&rounded=true&bold=true`;
  };

  // Get role-specific gradient colors
  const getRoleColors = (role) => {
    const roleColors = {
      user: { primary: '#4f46e5', secondary: '#7c3aed', light: '#e0e7ff' },
      staff: { primary: '#059669', secondary: '#0d9488', light: '#d1fae5' },
      supplier: { primary: '#dc2626', secondary: '#ea580c', light: '#fee2e2' },
      admin: { primary: '#7c3aed', secondary: '#c026d3', light: '#f3e8ff' }
    };
    return roleColors[role] || roleColors.user;
  };

  const containerStyle = {
    minHeight: '100vh',
    padding: '20px',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
  };

  const cardStyle = {
    maxWidth: '800px',
    margin: '0 auto',
    background: 'white',
    borderRadius: '24px',
    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)',
    overflow: 'hidden',
    animation: 'slideUp 0.6s ease-out',
    position: 'relative'
  };

  const loadingStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '50vh',
    color: 'white',
    fontSize: '20px',
    fontWeight: '500'
  };

  if (!profile) {
    return (
      <div style={containerStyle}>
        <div style={loadingStyle}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderTop: '4px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginRight: '15px'
          }}></div>
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
    background: `linear-gradient(135deg, ${roleColors.primary}, ${roleColors.secondary})`,
    padding: '40px 30px',
    textAlign: 'center',
    color: 'white',
    position: 'relative'
  };

  // Settings button styles
  const settingsButtonStyle = {
    position: 'absolute',
    top: '20px',
    right: '20px',
    width: '45px',
    height: '45px',
    background: 'rgba(255, 255, 255, 0.15)',
    border: 'none',
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    color: 'white',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
  };

  const profileImageContainerStyle = {
    position: 'relative',
    display: 'inline-block',
    marginBottom: '20px'
  };

  const profileImageStyle = {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    border: '6px solid rgba(255, 255, 255, 0.9)',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
    transition: 'transform 0.3s ease'
  };

  const roleIconStyle = {
    position: 'absolute',
    bottom: '5px',
    right: '5px',
    width: '35px',
    height: '35px',
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
  };

  const titleStyle = {
    fontSize: '32px',
    fontWeight: '700',
    marginBottom: '8px',
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    margin: '0 0 8px 0'
  };

  const subtitleStyle = {
    fontSize: '18px',
    opacity: '0.9',
    fontWeight: '400',
    textTransform: 'capitalize',
    margin: '0'
  };

  const contentStyle = {
    padding: '40px 30px'
  };

  const fieldsGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
    marginTop: '30px'
  };

  const fieldCardStyle = {
    background: roleColors.light,
    padding: '20px',
    borderRadius: '16px',
    border: `2px solid ${roleColors.primary}20`,
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden'
  };

  const fieldLabelStyle = {
    fontSize: '14px',
    fontWeight: '700',
    color: roleColors.primary,
    marginBottom: '8px',
    textTransform: 'uppercase',
    letterSpacing: '0.8px'
  };

  const fieldValueStyle = {
    fontSize: '18px',
    fontWeight: '600',
    color: '#2d3748',
    wordBreak: 'break-word'
  };

  const getRoleIcon = (role) => {
    const icons = {
      user: '👤',
      staff: '👨‍💼',
      supplier: '🏢',
      admin: '👑'
    };
    return icons[role] || '👤';
  };

  const statsStyle = {
    display: 'flex',
    justifyContent: 'center',
    gap: '30px',
    marginTop: '30px',
    flexWrap: 'wrap'
  };

  const statItemStyle = {
    textAlign: 'center',
    padding: '15px 20px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    minWidth: '100px'
  };

  const statNumberStyle = {
    fontSize: '24px',
    fontWeight: '700',
    display: 'block',
    marginBottom: '5px'
  };

  const statLabelStyle = {
    fontSize: '12px',
    opacity: '0.8',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  };

  return (
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
              e.target.style.background = 'rgba(255, 255, 255, 0.25)';
              e.target.style.transform = 'scale(1.1)';
              e.target.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.15)';
            }}
            onMouseOut={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.15)';
              e.target.style.transform = 'scale(1)';
              e.target.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)';
            }}
            title="Settings"
          >
            ⚙️
          </button>

          <div style={profileImageContainerStyle}>
            <img
              src={getAvatarUrl(profile.name, profile.role)}
              alt="Profile"
              style={profileImageStyle}
              onMouseOver={(e) => {
                e.target.style.transform = 'scale(1.1) rotate(5deg)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'scale(1) rotate(0deg)';
              }}
            />
            <div style={roleIconStyle}>
              {getRoleIcon(profile.role)}
            </div>
          </div>
          
          <h2 style={titleStyle}>
            {profile.role.toUpperCase()} Profile
          </h2>
          <p style={subtitleStyle}>
            Welcome back, {profile.name || 'User'}
          </p>

          <div style={statsStyle}>
            <div style={statItemStyle}>
              <span style={statNumberStyle}>
                {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
              </span>
              <span style={statLabelStyle}>Account Type</span>
            </div>
          </div>
        </div>

        <div style={contentStyle}>
          <div style={fieldsGridStyle}>
            {commonFields.concat(extraFields).map((field, index) => (
              <div
                key={field.label}
                style={{
                  ...fieldCardStyle,
                  animationDelay: `${index * 0.1}s`
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = `0 10px 30px ${roleColors.primary}30`;
                  e.currentTarget.style.borderColor = `${roleColors.primary}60`;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = `${roleColors.primary}20`;
                }}
              >
                <div style={fieldLabelStyle}>
                  {field.label}
                </div>
                <div style={fieldValueStyle}>
                  {field.value || "N/A"}
                </div>
                
                {/* Decorative corner element */}
                <div style={{
                  position: 'absolute',
                  top: '0',
                  right: '0',
                  width: '30px',
                  height: '30px',
                  background: `linear-gradient(135deg, ${roleColors.primary}, ${roleColors.secondary})`,
                  clipPath: 'polygon(100% 0, 0 0, 100% 100%)',
                  opacity: '0.1'
                }}></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserProfile;