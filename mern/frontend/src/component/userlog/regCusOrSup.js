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
    padding: "20px",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  };

  const cardStyle = {
    background: "white",
    borderRadius: "20px",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
    overflow: "hidden",
    width: "100%",
    maxWidth: "400px",
    animation: "slideIn 0.5s ease-out",
  };

  const headerStyle = {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    padding: "30px",
    textAlign: "center",
    color: "white",
  };

  const iconStyle = {
    width: "60px",
    height: "60px",
    background: "rgba(255, 255, 255, 0.2)",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 20px",
    fontSize: "24px",
  };

  const titleStyle = {
    fontSize: "28px",
    marginBottom: "8px",
    fontWeight: "600",
    margin: "0",
  };

  const subtitleStyle = {
    opacity: "0.9",
    fontSize: "16px",
    margin: "0",
  };

  const formStyle = {
    padding: "40px 30px",
  };

  const toggleContainerStyle = {
    display: "flex",
    background: "#f8f9fa",
    borderRadius: "10px",
    padding: "4px",
    marginBottom: "30px",
  };

  const toggleButtonStyle = (active) => ({
    flex: 1,
    padding: "15px 20px",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    background: active ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" : "transparent",
    color: active ? "white" : "#666",
    textTransform: "uppercase",
    letterSpacing: "0.5px"
  });

  const descriptionStyle = {
    textAlign: "center",
    color: "#666",
    fontSize: "14px",
    marginBottom: "30px",
    lineHeight: "1.5",
  };

  const buttonStyle = {
    width: "100%",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    border: "none",
    padding: "15px",
    borderRadius: "10px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    textTransform: "uppercase",
    letterSpacing: "1px",
    marginBottom: "20px",
  };

  const linkStyle = {
    color: "#667eea",
    textDecoration: "none",
    fontSize: "14px",
    textAlign: "center",
    display: "block",
    cursor: "pointer",
  };

  return (
    <div style={containerStyle}>
      <style>
        {`
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
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
              e.target.style.transform = "translateY(-3px)";
              e.target.style.boxShadow = "0 15px 35px rgba(102, 126, 234, 0.4)";
            }}
            onMouseOut={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "none";
            }}
          >
            Continue as {userType === "customer" ? "Customer" : "Supplier"}
          </button>

          <a 
            href="/userlog" 
            style={linkStyle}
            onMouseOver={(e) => {
              e.target.style.color = "#764ba2";
              e.target.style.textDecoration = "underline";
            }}
            onMouseOut={(e) => {
              e.target.style.color = "#667eea";
              e.target.style.textDecoration = "none";
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