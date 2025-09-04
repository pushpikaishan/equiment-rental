import React, { useState } from "react";
import"./userlog.css";

function UserLog() {
  const [showPassword, setShowPassword] = useState(false);

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-container">
      <div className="login-header">
        <div className="icon">👤</div>
        <h1>Welcome Back</h1>
        <p>Sign in to your account</p>
      </div>

      <div className="login-form">
        <form id="loginForm">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-wrapper">
              <span className="icon">📧</span>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Enter your email"
                required
              />
            </div>
            <div className="error-message">
              Please enter a valid email address
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <span className="icon">🔒</span>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={togglePassword}
              >
                👁️
              </button>
            </div>
            <div className="error-message">
              Password must be at least 6 characters long
            </div>
          </div>

          <div className="form-options">
            <div className="checkbox-wrapper">
              <input type="checkbox" id="remember" name="remember" />
              <label htmlFor="remember">Remember me</label>
            </div>
            <a href="#" className="forgot-password">
              Forgot password?
            </a>
          </div>

          <button type="submit" className="login-btn">
            <span className="spinner"></span>
            <span className="btn-text">Sign In</span>
          </button>
        </form>
      </div>
    </div>
  );
}

export default UserLog;
