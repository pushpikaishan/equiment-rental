import React from "react";
import { useNavigate } from "react-router-dom";

function LandingPage() {
  const navigate = useNavigate();

  const goToProfile = () => {
    navigate("/userAccount/profile");
  };

  return (
    <div style={{ 
      display: "flex", 
      justifyContent: "center", 
      alignItems: "center", 
      height: "100vh",
      flexDirection: "column"
    }}>
      <h1>Welcome to User Landing Page</h1>
      <button 
        onClick={goToProfile} 
        style={{ padding: "10px 20px", fontSize: "18px", cursor: "pointer" }}
      >
        Profile
      </button>
    </div>
  );
}

export default LandingPage;
