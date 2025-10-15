import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
    backgroundImage:
      "linear-gradient(rgba(15, 23, 42, 0.45), rgba(15, 23, 42, 0.45)), url('/logback.png')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    padding: "20px",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    position: 'relative',
  };

  const mainCardStyle = {
    display: "flex",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    borderRadius: "24px",
    boxShadow: "0 25px 50px rgba(0, 0, 0, 0.15)",
    overflow: "hidden",
    width: "100%",
    maxWidth: "1100px",
    minHeight: "600px",
    animation: "slideIn 0.5s ease-out",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    position: 'relative',
    zIndex: 2,
  };

  const leftPanelStyle = {
    flex: "1",
    padding: "60px 50px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  };

  const leftContentStyle = {
    position: "relative",
    zIndex: 1,
    color: "white",
  };

  const leftTitleStyle = {
    fontSize: "42px",
    fontWeight: "700",
    marginBottom: "20px",
    lineHeight: "1.2",
  };

  const leftDescriptionStyle = {
    fontSize: "18px",
    lineHeight: "1.8",
    opacity: "0.95",
    maxWidth: "450px",
  };

  const rightPanelStyle = {
    flex: "1",
    padding: "60px 50px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    //background: "white",
  };

  const headerStyle = {
    textAlign: "center",
    marginBottom: "40px",
  };

  const iconStyle = {
    width: "75px",
    height: "75px",
    background: "linear-gradient(135deg, #1d2d47 0%, #1d2d47 100%)",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 20px",
    fontSize: "24px",
    color: "white",
    border: "1.5px solid white",
    animation: "float 3s ease-in-out infinite",
  };

  const titleStyle = {
    fontSize: "28px",
    marginBottom: "8px",
    fontWeight: "600",
    margin: "0",
    color: "white",
  };

  const subtitleStyle = {
    color: "white",
    fontSize: "16px",
    margin: "0",
  };

  const formStyle = {
    width: "100%",
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
    color: "#3b82f6",
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
          @keyframes float {
            0%, 100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-10px);
            }
          }
          @media (max-width: 768px) {
            .main-card {
              flex-direction: column !important;
              max-width: 500px !important;
            }
            .left-panel {
              padding: 40px 30px !important;
              min-height: 300px !important;
            }
            .right-panel {
              padding: 40px 30px !important;
            }
          }
        `}
      </style>

      {/* Background video layer */}
      <video
        aria-hidden
        autoPlay
        muted
        loop
        playsInline
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, pointerEvents: 'none' }}
      >
        <source src="/backvi2.mp4" type="video/mp4" />
      </video>
      {/* Gradient overlay above video to keep text readable */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'linear-gradient(rgba(15, 23, 42, 0.45), rgba(15, 23, 42, 0.45))', zIndex: 1, pointerEvents: 'none' }} />

      <div style={mainCardStyle} className="main-card">
        {/* Left Panel - Description */}
        <div style={leftPanelStyle} className="left-panel">
          <div style={leftContentStyle}>
            <h1 style={leftTitleStyle}>
              Your Event,<br />Our Equipment
            </h1>
            <p style={leftDescriptionStyle}>
              Rent everything you need for your next event — from sound systems to lighting, stages, tents, and more. Easy booking, reliable service, and top-quality equipment for every occasion.
            </p>
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div style={rightPanelStyle} className="right-panel">
       
          <div style={headerStyle}>
            <div style={iconStyle} role="img" aria-label="App logo">
              <img
                src={`${process.env.PUBLIC_URL}/favicon.ico`}
                alt="Eventrix logo"
                style={{ width: 36, height: 36 }}
                onError={(e) => {
                  e.currentTarget.src = `${process.env.PUBLIC_URL}/logo192.png`;
                }}
              />
            </div>
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

            <div style={{ ...inputGroupStyle }}>
              <div style={{ position: "relative" }}>
                <input
                  style={{ ...inputStyle, paddingRight: 44 }}
                  type={showPassword ? "text" : "password"}
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
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((s) => !s)}
                  style={{
                    position: "absolute",
                    right: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: 6,
                    color: "#6b7280",
                    fontSize: 18,
                    lineHeight: 1,
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.color = "#374151";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.color = "#6b7280";
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.color = "#374151";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.color = "#6b7280";
                  }}
                >
                  <span style={{ display: 'inline-block', filter: 'hue-rotate(200deg) saturate(2)' }}>
                  {showPassword ? "🙈" : "🙉"}</span>
                </button>
              </div>
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
              onFocus={(e) => {
                if (!loading) {
                  e.target.style.transform = "translateY(-3px)";
                  e.target.style.boxShadow = "0 15px 35px rgba(102, 126, 234, 0.4)";
                }
              }}
              onBlur={(e) => {
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
                onFocus={(e) => {
                  e.target.style.color = "#764ba2";
                  e.target.style.textDecoration = "underline";
                }}
                onBlur={(e) => {
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
                onFocus={(e) => {
                  e.target.style.color = "#764ba2";
                  e.target.style.textDecoration = "underline";
                }}
                onBlur={(e) => {
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
    </div>
  );
}

export default Login;