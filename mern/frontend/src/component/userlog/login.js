import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  // If already logged in, redirect based on role
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (token && role) {
      if (role === "admin") {
        navigate("/adminDashbooard", { replace: true });
      } else if (role === "user") {
        navigate("/home", { replace: true });
      } else {
        navigate("/userAccount/profile", { replace: true });
      }
    }
  }, [navigate]);

  const handleLogin = async () => {
    try {
      const res = await axios.post("http://localhost:5000/auth/login", {
        email,
        password,
      });

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
          navigate("/userAccount/profile");
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
    <div className="page-center">
      <style>{`@keyframes slideIn{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div className="card animate-slide-in" style={{ maxWidth: 420, width: "100%", overflow: "hidden" }}>
        <div className="card-header brand" style={{ textAlign: "center" }}>
          <div style={{ width: 60, height: 60, margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "999px", background: "rgba(255,255,255,.2)", fontSize: 24 }}>👤</div>
          <h2 className="section-title" style={{ color: "#fff", marginBottom: 6 }}>Welcome Back</h2>
          <p className="muted" style={{ color: "#fff", opacity: .9, margin: 0 }}>Sign in to your account</p>
        </div>

        <div className="card-body">
          <div className="form-group" style={{ marginBottom: 20 }}>
            <input className="input" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className="form-group" style={{ marginBottom: 20 }}>
            <input className="input" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          <button className="btn btn-primary" style={{ width: "100%" }} onClick={handleLogin}>
            Login
          </button>

          <div className="actions" style={{ justifyContent: "space-between", marginTop: 16, fontSize: 14 }}>
            <a className="link" href="/forgot-password">Forgot Password?</a>
            <a className="link" href="/RegCusOrSupButton">Create Account</a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;