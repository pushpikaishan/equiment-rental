import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Register() {
  const [userType, setUserType] = useState("customer");
  const navigate = useNavigate();

  const handleProceed = () => {
    if (userType === "customer") {
      navigate("/userRegister");
    } else {
      navigate("/SupplierRegister");
    }
  };

  const containerStyle = {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "32px",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f1f5f9 100%)',
  };

  const cardStyle = {
    background: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(12px)",
    borderRadius: "24px",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1), 0 8px 32px rgba(0, 0, 0, 0.1)",
    overflow: "hidden",
    width: "100%",
    maxWidth: "420px",
    animation: "slideIn 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
  };

  const headerStyle = {
   background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
    padding: "40px 32px",
    textAlign: "center",
    color: "white",
    position: "relative",
    overflow: "hidden",
  };

  const iconStyle = {
    width: "72px",
    height: "72px",
    background: "rgba(255, 255, 255, 0.15)",
    backdropFilter: "blur(8px)",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 24px",
    fontSize: "28px",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    animation: "float 3s ease-in-out infinite",
  };

  const titleStyle = {
    fontSize: "32px",
    marginBottom: "8px",
    fontWeight: "700",
    margin: "0",
    letterSpacing: "-0.5px",
  };

  const subtitleStyle = {
    opacity: "0.95",
    fontSize: "16px",
    margin: "0",
    fontWeight: "400",
    letterSpacing: "0.25px",
  };

  const formStyle = {
    padding: "48px 32px 40px",
  };

  const toggleContainerStyle = {
    display: "flex",
    background: "rgba(248, 250, 252, 0.8)",
    backdropFilter: "blur(8px)",
    borderRadius: "16px",
    padding: "6px",
    marginBottom: "32px",
    border: "1px solid rgba(226, 232, 240, 0.5)",
    boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.05)",
  };

  const toggleButtonStyle = (active) => ({
    flex: 1,
    padding: "16px 24px",
    border: "none",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    background: active 
      ? "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)" 
      : "transparent",
    color: active ? "white" : "#64748b",
    textTransform: "none",
    letterSpacing: "0.25px",
    boxShadow: active 
      ? "0 8px 24px rgba(59, 130, 246, 0.3), 0 4px 12px rgba(59, 130, 246, 0.2)" 
      : "none",
    transform: active ? "translateY(-2px)" : "translateY(0)",
  });

  const descriptionStyle = {
    textAlign: "center",
    color: "#64748b",
    fontSize: "15px",
    marginBottom: "32px",
    lineHeight: "1.6",
    fontWeight: "400",
    letterSpacing: "0.15px",
  };

  const buttonStyle = {
    width: "100%",
    background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
    color: "white",
    border: "none",
    padding: "18px 24px",
    borderRadius: "16px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    textTransform: "none",
    letterSpacing: "0.25px",
    marginBottom: "24px",
    boxShadow: "0 8px 24px rgba(59, 130, 246, 0.3), 0 4px 12px rgba(59, 130, 246, 0.2)",
  };

  const linkStyle = {
    color: "#3b82f6",
    textDecoration: "none",
    fontSize: "15px",
    textAlign: "center",
    display: "block",
    cursor: "pointer",
    fontWeight: "500",
    letterSpacing: "0.15px",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  };

  return (
    <div style={containerStyle}>
      <style>
        {`
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(40px) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          @keyframes float {
            0%, 100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-10px);
            }
          }
        `}
      </style>

      <div style={cardStyle}>
        <div style={headerStyle}>
          <div style={iconStyle}>📝</div>
          <h2 style={titleStyle}>Join Our Platform</h2>
          <p style={subtitleStyle}>Choose your account type</p>
        </div>

        <div style={formStyle}>
          {/* User Type Toggle */}
          <div style={toggleContainerStyle}>
            <button 
              style={toggleButtonStyle(userType === "customer")}
              onClick={() => setUserType("customer")}
            >
              Customer
            </button>
            <button 
              style={toggleButtonStyle(userType === "supplier")}
              onClick={() => setUserType("supplier")}
            >
              Supplier
            </button>
          </div>

          {/* Description */}
          <div style={descriptionStyle}>
            {userType === "customer" 
              ? "Register as a customer to browse and purchase products from our suppliers."
              : "Register as a supplier to sell your products and manage your business on our platform."
            }
          </div>

          <button
            style={buttonStyle}
            onClick={handleProceed}
            onMouseOver={(e) => {
              e.target.style.transform = "translateY(-4px) scale(1.02)";
              e.target.style.boxShadow = "0 16px 48px rgba(59, 130, 246, 0.4), 0 8px 24px rgba(59, 130, 246, 0.3)";
            }}
            onMouseOut={(e) => {
              e.target.style.transform = "translateY(0) scale(1)";
              e.target.style.boxShadow = "0 8px 24px rgba(59, 130, 246, 0.3), 0 4px 12px rgba(59, 130, 246, 0.2)";
            }}
          >
            Continue as {userType === "customer" ? "Customer" : "Supplier"}
          </button>

          <a 
            href="/userlog" 
            style={linkStyle}
            onMouseOver={(e) => {
              e.target.style.color = "#1d4ed8";
              e.target.style.textDecoration = "underline";
              e.target.style.transform = "translateY(-1px)";
            }}
            onMouseOut={(e) => {
              e.target.style.color = "#3b82f6";
              e.target.style.textDecoration = "none";
              e.target.style.transform = "translateY(0)";
            }}
          >
            Already have an account? Sign in
          </a>
        </div>
      </div>
    </div>
  );
}

export default Register;