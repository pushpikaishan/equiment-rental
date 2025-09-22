// AdminUpdate.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

function AdminUpdate() {
  const [inputs, setInputs] = useState({});
  const { id } = useParams();
  const navigate = useNavigate();

  // Fetch admin details when component loads
  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/admins/${id}`);
        setInputs(res.data.admin); // assuming API returns { admin: {...} }
      } catch (err) {
        console.error("Error fetching admin:", err);
      }
    };
    fetchAdmin();
  }, [id]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputs((prev) => ({ ...prev, [name]: value }));
  };

  // Send update request
  const sendRequest = async () => {
    try {
      const payload = {};
      if (inputs.name) payload.name = inputs.name;
      if (inputs.email) payload.email = inputs.email;
      if (inputs.password) payload.password = inputs.password;

      await axios.put(`http://localhost:5000/admins/${id}`, payload);
    } catch (err) {
      console.error("Error updating admin:", err);
    }
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    await sendRequest();
    alert("Admin updated successfully!");
    navigate("/adminDashbooard"); // redirect after update
  };

  // --- Enhanced Styling ---
  const containerStyle = {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    position: "relative"
  };

  const cardStyle = {
    background: "white",
    borderRadius: "20px",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
    overflow: "hidden",
    width: "100%",
    maxWidth: "600px",
    position: "relative",
    animation: "slideUp 0.6s ease-out"
  };

  const headerStyle = {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    padding: "30px",
    textAlign: "center",
    color: "white",
    position: "relative"
  };

  const iconStyle = {
    width: "60px",
    height: "60px",
    background: "rgba(255, 255, 255, 0.2)",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 15px",
    fontSize: "24px"
  };

  const titleStyle = { 
    fontSize: "28px", 
    fontWeight: "600", 
    margin: "0 0 8px 0",
    textShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
  };

  const subtitleStyle = { 
    opacity: "0.9", 
    fontSize: "16px", 
    margin: "0"
  };

  const formStyle = { 
    padding: "40px 30px",
    position: "relative"
  };

  const formGroupStyle = { 
    marginBottom: "25px",
    position: "relative"
  };

  const labelStyle = {
    display: "block",
    marginBottom: "8px",
    color: "#333",
    fontWeight: "600",
    fontSize: "14px",
    textTransform: "uppercase",
    letterSpacing: "0.8px"
  };

  const inputStyle = {
    width: "100%",
    padding: "15px 20px",
    border: "2px solid #e1e5e9",
    borderRadius: "10px",
    fontSize: "16px",
    background: "#f8f9fa",
    transition: "all 0.3s ease",
    boxSizing: "border-box"
  };

  const buttonStyle = {
    width: "100%",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    border: "none",
    padding: "18px",
    borderRadius: "10px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    textTransform: "uppercase",
    letterSpacing: "1px",
    position: "relative",
    overflow: "hidden"
  };

  const backButtonContainerStyle = {
    textAlign: "center",
    marginTop: "30px",
    paddingBottom: "20px"
  };

  const backButtonStyle = {
    background: "linear-gradient(135deg, #f81515ff 0%, #764ba2 100%)",
    color: "white",
    border: "none",
    padding: "12px 30px",
    borderRadius: "25px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    textTransform: "uppercase",
    letterSpacing: "0.5px"
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
          
          .floating-particles {
            position: absolute;
            width: 100%;
            height: 100%;
            overflow: hidden;
            pointer-events: none;
          }
          
          .particle {
            position: absolute;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 50%;
            animation: float 6s infinite ease-in-out;
          }
          
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(180deg); }
          }
        `}
      </style>

      {/* Floating background particles */}
      <div className="floating-particles">
        <div className="particle" style={{
          width: '10px',
          height: '10px',
          left: '10%',
          top: '10%',
          animationDelay: '0s'
        }}></div>
        <div className="particle" style={{
          width: '15px',
          height: '15px',
          left: '80%',
          top: '20%',
          animationDelay: '2s'
        }}></div>
        <div className="particle" style={{
          width: '8px',
          height: '8px',
          left: '60%',
          top: '70%',
          animationDelay: '4s'
        }}></div>
        <div className="particle" style={{
          width: '12px',
          height: '12px',
          left: '20%',
          top: '80%',
          animationDelay: '1s'
        }}></div>
      </div>

      <div style={cardStyle}>
        <div style={headerStyle}>
          <div style={iconStyle}>👨‍💼</div>
          <h1 style={titleStyle}>Update Admin</h1>
          <p style={subtitleStyle}>Modify admin details</p>
          
          {/* Decorative corner elements */}
          <div style={{
            position: "absolute",
            top: "0",
            right: "0",
            width: "60px",
            height: "60px",
            background: "rgba(255, 255, 255, 0.1)",
            clipPath: "polygon(100% 0, 0 0, 100% 100%)"
          }}></div>
          <div style={{
            position: "absolute",
            bottom: "0",
            left: "0",
            width: "40px",
            height: "40px",
            background: "rgba(255, 255, 255, 0.05)",
            clipPath: "polygon(0 100%, 0 0, 100% 100%)"
          }}></div>
        </div>

        <form onSubmit={handleSubmit} style={formStyle}>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Full Name</label>
            <input
              style={inputStyle}
              type="text"
              name="name"
              value={inputs.name || ""}
              onChange={handleChange}
              placeholder="Enter full name"
              required
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea';
                e.target.style.background = 'white';
                e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e1e5e9';
                e.target.style.background = '#f8f9fa';
                e.target.style.boxShadow = 'none';
                e.target.style.transform = 'translateY(0)';
              }}
            />
            {/* Input decoration line */}
            <div style={{
              position: "absolute",
              bottom: "-5px",
              left: "0",
              height: "2px",
              width: "100%",
              background: "linear-gradient(90deg, transparent, #667eea, transparent)",
              opacity: "0.3"
            }}></div>
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>Email Address</label>
            <input
              style={inputStyle}
              type="email"
              name="email"
              value={inputs.email || ""}
              onChange={handleChange}
              placeholder="Enter email address"
              required
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea';
                e.target.style.background = 'white';
                e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e1e5e9';
                e.target.style.background = '#f8f9fa';
                e.target.style.boxShadow = 'none';
                e.target.style.transform = 'translateY(0)';
              }}
            />
            <div style={{
              position: "absolute",
              bottom: "-5px",
              left: "0",
              height: "2px",
              width: "100%",
              background: "linear-gradient(90deg, transparent, #667eea, transparent)",
              opacity: "0.3"
            }}></div>
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>Password</label>
            <input
              style={inputStyle}
              type="password"
              name="password"
              value={inputs.password || ""}
              onChange={handleChange}
              placeholder="Password (leave blank if unchanged)"
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea';
                e.target.style.background = 'white';
                e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e1e5e9';
                e.target.style.background = '#f8f9fa';
                e.target.style.boxShadow = 'none';
                e.target.style.transform = 'translateY(0)';
              }}
            />
            <div style={{
              position: "absolute",
              bottom: "-5px",
              left: "0",
              height: "2px",
              width: "100%",
              background: "linear-gradient(90deg, transparent, #667eea, transparent)",
              opacity: "0.3"
            }}></div>
          </div>

          <button 
            type="submit" 
            style={buttonStyle}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-3px)';
              e.target.style.boxShadow = '0 15px 35px rgba(102, 126, 234, 0.4)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
            onMouseDown={(e) => {
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseUp={(e) => {
              e.target.style.transform = 'translateY(-3px)';
            }}
          >
            Update Admin Details
          </button>
        </form>

        {/* Back Button → only visible for admin */}
        {localStorage.getItem("role") === "admin" && (
          <div style={backButtonContainerStyle}>
            <button
              style={backButtonStyle}
              onClick={() => navigate("/adminDashbooard")}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 25px rgba(248, 21, 21, 0.3)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              ← Back to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminUpdate;