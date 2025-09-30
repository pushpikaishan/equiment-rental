import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      setLoading(true);
      const res = await axios.post("http://localhost:5000/auth/login", {
        email,
        password,
      });

      if (res.data && res.data.tfaRequired) {
        // route to 2FA screen with minimal pending info
        navigate('/two-factor-verify', { state: { pending: { id: res.data.user.id, role: res.data.role, email: res.data.user.email, name: res.data.user.name } } });
        return;
      }

      // Save token , role & userId to localStorage
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);
      localStorage.setItem("userId", res.data.user.id);

      // Navigate based on role
      switch (res.data.role) {
        case "user":
          navigate("/home");
          break;
        case "supplier":
          navigate("/supplier/dashboard");
          break;
        case "admin":
          navigate("/adminDashbooard");
          break;
        case "staff":
          navigate("/driver");
          break;
        default:
          navigate("/");
      }
    } catch (err) {
      alert(err.response?.data?.msg || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const containerStyle = {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    //background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
   background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
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

  const inputGroupStyle = {
    marginBottom: "25px",
  };

  const inputStyle = {
    width: "100%",
    padding: "15px 20px",
    border: "2px solid #e1e5e9",
    borderRadius: "10px",
    fontSize: "16px",
    transition: "all 0.3s ease",
    background: "#f8f9fa",
    boxSizing: "border-box",
  };

  const buttonStyle = {
    width: "100%",
   background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
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
  };

  const linkContainerStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "20px",
    fontSize: "14px",
  };

  const linkStyle = {
    color: "#667eea",
    textDecoration: "none",
    transition: "color 0.3s ease",
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
          @keyframes spinSmallLoader {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>

      <div style={cardStyle}>
        <div style={headerStyle}>
          <div style={iconStyle}>👤</div>
          <h2 style={titleStyle}>Welcome Back</h2>
          <p style={subtitleStyle}>Sign in to your account</p>
        </div>

        <div style={formStyle}>
          <div style={inputGroupStyle}>
            <input
              style={inputStyle}
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={(e) => {
                e.target.style.borderColor = "#667eea";
                e.target.style.background = "white";
                e.target.style.boxShadow = "0 0 0 3px rgba(102, 126, 234, 0.1)";
                e.target.style.transform = "translateY(-2px)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e1e5e9";
                e.target.style.background = "#f8f9fa";
                e.target.style.boxShadow = "none";
                e.target.style.transform = "translateY(0)";
              }}
            />
          </div>

          <div style={inputGroupStyle}>
            <input
              style={inputStyle}
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={(e) => {
                e.target.style.borderColor = "#667eea";
                e.target.style.background = "white";
                e.target.style.boxShadow = "0 0 0 3px rgba(102, 126, 234, 0.1)";
                e.target.style.transform = "translateY(-2px)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e1e5e9";
                e.target.style.background = "#f8f9fa";
                e.target.style.boxShadow = "none";
                e.target.style.transform = "translateY(0)";
              }}
            />
          </div>

          <button
            style={{
              ...buttonStyle,
              opacity: loading ? 0.8 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
            onClick={handleLogin}
            onMouseOver={(e) => {
              if (!loading) {
                e.target.style.transform = "translateY(-3px)";
                e.target.style.boxShadow = "0 15px 35px rgba(102, 126, 234, 0.4)";
              }
            }}
            onMouseOut={(e) => {
              if (!loading) {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "none";
              }
            }}
            onMouseDown={(e) => {
              if (!loading) {
                e.target.style.transform = "translateY(-1px)";
              }
            }}
            onMouseUp={(e) => {
              if (!loading) {
                e.target.style.transform = "translateY(-3px)";
              }
            }}
            disabled={loading}
          >
            {loading ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <span
                  aria-hidden
                  style={{
                    width: 16,
                    height: 16,
                    border: "2px solid rgba(255,255,255,0.6)",
                    borderTopColor: "white",
                    borderRadius: "50%",
                    display: "inline-block",
                    animation: "spinSmallLoader 0.9s linear infinite",
                  }}
                />
                Signing in...
              </span>
            ) : (
              "Login"
            )}
          </button>

          <div style={linkContainerStyle}>
            <a 
              href="/forgot-password" 
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
              Forgot Password?
            </a>
            <a 
              href="/RegCusOrSupButton" 
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
              Create Account
            </a>
          </div>
        
        </div>

        

      </div>
    </div>
  );
}

export default Login;