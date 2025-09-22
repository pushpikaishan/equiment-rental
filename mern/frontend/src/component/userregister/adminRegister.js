import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function AdminRegister() {
  const [inputs, setInputs] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  // simple validation
  const validateForm = () => {
    let newErrors = {};
    let isValid = true;

    if (!inputs.name.trim()) {
      newErrors.name = "Name is required";
      isValid = false;
    }
    if (!inputs.email.trim()) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inputs.email)) {
      newErrors.email = "Invalid email format";
      isValid = false;
    }
    if (!inputs.password) {
      newErrors.password = "Password is required";
      isValid = false;
    }
    if (inputs.password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputs((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await axios.post("http://localhost:5000/admins", inputs);
      setIsLoading(false);
      navigate("/DisAllAdmins");
    } catch (err) {
      setIsLoading(false);
      alert("Registration failed");
    }
  };

  const containerStyle = {
    margin: 0,
    padding: 0,
    boxSizing: 'border-box',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    background: 'linear-gradient(135deg, #14a06f 0%, #764ba2 100%)',
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px'
  };

  const registerContainerStyle = {
    background: 'white',
    borderRadius: '20px',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    width: '100%',
    maxWidth: '500px',
    position: 'relative'
  };

  const headerStyle = {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '30px',
    textAlign: 'center',
    color: 'white'
  };

  const iconStyle = {
    width: '60px',
    height: '60px',
    background: 'rgba(255, 255, 255, 0.2)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 15px',
    fontSize: '24px'
  };

  const formStyle = {
    padding: '35px 30px'
  };

  const formGroupStyle = (hasError) => ({
    marginBottom: '20px',
    position: 'relative'
  });

  const labelStyle = {
    display: 'block',
    marginBottom: '6px',
    color: '#333',
    fontWeight: '500',
    fontSize: '14px'
  };

  const inputStyle = (hasError) => ({
    width: '100%',
    padding: '12px 15px',
    border: hasError ? '2px solid #e74c3c' : '2px solid #e1e5e9',
    borderRadius: '8px',
    fontSize: '15px',
    transition: 'all 0.3s ease',
    background: hasError ? '#fef5f5' : '#f8f9fa',
    boxSizing: 'border-box'
  });

  const buttonStyle = {
    width: '100%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    padding: '15px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden'
  };

  const errorStyle = {
    color: '#e74c3c',
    fontSize: '12px',
    marginTop: '5px',
    display: 'block'
  };

  const requiredStyle = {
    color: '#e74c3c',
    marginLeft: '2px'
  };

  return (
    <div style={containerStyle}>
      <div style={registerContainerStyle}>
        <div style={headerStyle}>
          <div style={iconStyle}>👨‍💼</div>
          <h1 style={{ fontSize: '24px', marginBottom: '8px', fontWeight: '600' }}>Create Admin Account</h1>
        </div>

        <div style={formStyle}>
          <div onSubmit={handleSubmit}>
            <div style={formGroupStyle(errors.name)}>
              <label style={labelStyle} htmlFor="name">
                Name <span style={requiredStyle}>*</span>
              </label>
              <input
                style={inputStyle(errors.name)}
                type="text"
                name="name"
                value={inputs.name}
                onChange={handleChange}
                placeholder="Enter your name"
                onFocus={(e) => {
                  e.target.style.borderColor = '#667eea';
                  e.target.style.background = 'white';
                  e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                }}
                onBlur={(e) => {
                  if (!errors.name) {
                    e.target.style.borderColor = '#e1e5e9';
                    e.target.style.background = '#f8f9fa';
                    e.target.style.boxShadow = 'none';
                  }
                }}
              />
              {errors.name && <div style={errorStyle}>{errors.name}</div>}
            </div>

            <div style={formGroupStyle(errors.email)}>
              <label style={labelStyle} htmlFor="email">
                Email <span style={requiredStyle}>*</span>
              </label>
              <input
                style={inputStyle(errors.email)}
                type="email"
                name="email"
                value={inputs.email}
                onChange={handleChange}
                placeholder="Enter your email"
                onFocus={(e) => {
                  e.target.style.borderColor = '#667eea';
                  e.target.style.background = 'white';
                  e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                }}
                onBlur={(e) => {
                  if (!errors.email) {
                    e.target.style.borderColor = '#e1e5e9';
                    e.target.style.background = '#f8f9fa';
                    e.target.style.boxShadow = 'none';
                  }
                }}
              />
              {errors.email && <div style={errorStyle}>{errors.email}</div>}
            </div>

            <div style={formGroupStyle(errors.password)}>
              <label style={labelStyle} htmlFor="password">
                Password <span style={requiredStyle}>*</span>
              </label>
              <input
                style={inputStyle(errors.password)}
                type="password"
                name="password"
                value={inputs.password}
                onChange={handleChange}
                placeholder="Enter password"
                onFocus={(e) => {
                  e.target.style.borderColor = '#667eea';
                  e.target.style.background = 'white';
                  e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                }}
                onBlur={(e) => {
                  if (!errors.password) {
                    e.target.style.borderColor = '#e1e5e9';
                    e.target.style.background = '#f8f9fa';
                    e.target.style.boxShadow = 'none';
                  }
                }}
              />
              {errors.password && <div style={errorStyle}>{errors.password}</div>}
            </div>

            <div style={formGroupStyle(errors.confirmPassword)}>
              <label style={labelStyle} htmlFor="password">
                Confirm Password <span style={requiredStyle}>*</span>
              </label>
              <input
                style={inputStyle(errors.confirmPassword)}
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                onFocus={(e) => {
                  e.target.style.borderColor = '#667eea';
                  e.target.style.background = 'white';
                  e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                }}
                onBlur={(e) => {
                  if (!errors.confirmPassword) {
                    e.target.style.borderColor = '#e1e5e9';
                    e.target.style.background = '#f8f9fa';
                    e.target.style.boxShadow = 'none';
                  }
                }}
              />
              {errors.confirmPassword && <div style={errorStyle}>{errors.confirmPassword}</div>}
            </div>

            <button 
              type="submit" 
              disabled={isLoading} 
              style={{
                ...buttonStyle,
                pointerEvents: isLoading ? 'none' : 'auto',
                opacity: isLoading ? '0.8' : '1'
              }}
              onClick={handleSubmit}
              onMouseOver={(e) => {
                if (!isLoading) {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 10px 25px rgba(102, 126, 234, 0.3)';
                }
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              {isLoading ? "Creating Account..." : "Register Admin"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminRegister;