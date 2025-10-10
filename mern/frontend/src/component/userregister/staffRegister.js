import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function StaffRegister() {
  const [inputs, setInputs] = useState({
    name: "",
    phoneno: "",
    nicNo: "",
    email: "",
    password: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ level: 0, label: 'Too weak' });

  const navigate = useNavigate();

  // NIC validation (match userregister.js)
  const validateNIC = (nic) => {
    const oldNICRegex = /^[0-9]{9}[vVxX]$/;
    const newNICRegex = /^[0-9]{12}$/;
    return oldNICRegex.test(nic) || newNICRegex.test(nic);
  };

  // Password strength checker (same logic as admin)
  const checkPasswordStrength = (password) => {
    let strength = 0;
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password)
    };

    strength = Object.values(checks).filter(Boolean).length;

    let strengthData = { level: 0, label: 'Too weak' };
    if (strength < 3) {
      strengthData = { level: 1, label: 'Weak' };
    } else if (strength < 5) {
      strengthData = { level: 2, label: 'Medium' };
    } else {
      strengthData = { level: 3, label: 'Strong' };
    }

    setPasswordStrength(strengthData);
    return strength >= 3;
  };

  // validation
  const validateForm = () => {
    let newErrors = {};
    let isValid = true;

    if (!inputs.name.trim()) {
      newErrors.name = "Name is required";
      isValid = false;
    }
    if (!inputs.phoneno.trim()) {
      newErrors.phoneno = "Phone number is required";
      isValid = false;
    }
    if (!inputs.nicNo.trim()) {
      newErrors.nicNo = "NIC No is required";
      isValid = false;
    } else if (!validateNIC(inputs.nicNo.trim())) {
      newErrors.nicNo = "Please enter a valid NIC number";
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
    } else if (!checkPasswordStrength(inputs.password)) {
      newErrors.password = "Password must be at least 8 characters and include uppercase, lowercase, and a number";
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
    if (name === 'password') {
      checkPasswordStrength(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // pre-check email existence across all roles
      const chk = await axios.post("http://localhost:5000/auth/check-email", { email: inputs.email });
      if (chk.data?.exists) {
        setErrors((prev) => ({ ...prev, email: `This email is already registered as ${chk.data.role}.` }));
        setIsLoading(false);
        return;
      }
      await axios.post("http://localhost:5000/staff", inputs);
      setIsLoading(false);
      navigate("/adminDashbooard");
    } catch (err) {
      setIsLoading(false);
      const msg = err?.response?.data?.message || err?.response?.data?.msg || "Registration failed";
      setErrors((prev)=> ({ ...prev, email: msg }));
    }
  };

  const containerStyle = {
    margin: 0,
    padding: 0,
    boxSizing: 'border-box',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    background: 'linear-gradient(135deg, #ffffffff 0%, #ffffffff 100%)',
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
    background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
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

  const formGroupStyle = {
    marginBottom: '20px',
    position: 'relative'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '6px',
    color: '#333',
    fontWeight: '500',
    fontSize: '14px'
  };

  const inputWrapperStyle = {
    position: 'relative'
  };

  const inputStyle = (hasError) => ({
    width: '100%',
    padding: '12px 15px 12px 45px',
    border: hasError ? '2px solid #e74c3c' : '2px solid #e1e5e9',
    borderRadius: '8px',
    fontSize: '15px',
    transition: 'all 0.3s ease',
    background: hasError ? '#fef5f5' : '#f8f9fa',
    boxSizing: 'border-box'
  });

  const iconInInputStyle = {
    position: 'absolute',
    left: '15px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#999',
    fontSize: '16px',
    pointerEvents: 'none'
  };

  const passwordToggleStyle = {
    position: 'absolute',
    right: '15px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    color: '#999',
    cursor: 'pointer',
    fontSize: '16px',
    padding: '5px',
    transition: 'color 0.3s ease'
  };

  const passwordStrengthStyle = {
    marginTop: '8px',
    fontSize: '12px'
  };

  const strengthBarStyle = {
    height: '4px',
    background: '#e1e5e9',
    borderRadius: '2px',
    margin: '5px 0',
    overflow: 'hidden'
  };

  const getStrengthFillStyle = () => {
    let width = '0%';
    let background = '#e1e5e9';

    switch (passwordStrength.level) {
      case 1:
        width = '33%';
        background = '#e74c3c';
        break;
      case 2:
        width = '66%';
        background = '#f39c12';
        break;
      case 3:
        width = '100%';
        background = '#27ae60';
        break;
      default:
        width = '0%';
    }

    return {
      height: '100%',
      width: width,
      background: background,
      transition: 'all 0.3s ease',
      borderRadius: '2px'
    };
  };

  const buttonStyle = {
    width: '100%',
    background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
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

  const successStyle = {
    color: '#27ae60',
    fontSize: '12px',
    marginTop: '5px',
    display: 'block'
  };

  return (
    <div style={containerStyle}>
      <div style={registerContainerStyle}>
        <div style={headerStyle}>
          <div style={iconStyle}>👩‍💼</div>
          <h1 style={{ fontSize: '24px', marginBottom: '8px', fontWeight: '600' }}>Create Staff Account</h1>
        </div>

        <div style={formStyle}>
          <div onSubmit={handleSubmit}>
            <div style={formGroupStyle}>
              <label style={labelStyle} htmlFor="name">
                Name <span style={requiredStyle}>*</span>
              </label>
              <div style={inputWrapperStyle}>
                <span style={iconInInputStyle}>👤</span>
                <input
                  style={inputStyle(errors.name)}
                  type="text"
                  name="name"
                  value={inputs.name}
                  onChange={handleChange}
                  placeholder="Enter full name"
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
              </div>
              {errors.name && <div style={errorStyle}>{errors.name}</div>}
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle} htmlFor="phone">
                Phone No <span style={requiredStyle}>*</span>
              </label>
              <div style={inputWrapperStyle}>
                <span style={iconInInputStyle}>📱</span>
                <input
                  style={inputStyle(errors.phoneno)}
                  type="text"
                  name="phoneno"
                  value={inputs.phoneno}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  onFocus={(e) => {
                    e.target.style.borderColor = '#667eea';
                    e.target.style.background = 'white';
                    e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                  }}
                  onBlur={(e) => {
                    if (!errors.phoneno) {
                      e.target.style.borderColor = '#e1e5e9';
                      e.target.style.background = '#f8f9fa';
                      e.target.style.boxShadow = 'none';
                    }
                  }}
                />
              </div>
              {errors.phoneno && <div style={errorStyle}>{errors.phoneno}</div>}
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle} htmlFor="name">
                NIC <span style={requiredStyle}>*</span>
              </label>
              <div style={inputWrapperStyle}>
                <span style={iconInInputStyle}>🆔</span>
                <input
                  style={inputStyle(errors.nicNo)}
                  type="text"
                  name="nicNo"
                  value={inputs.nicNo}
                  onChange={handleChange}
                  placeholder="Enter your NIC (9 digits + V or 12 digits)"
                  onFocus={(e) => {
                    e.target.style.borderColor = '#667eea';
                    e.target.style.background = 'white';
                    e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                  }}
                  onBlur={(e) => {
                    if (!errors.nicNo) {
                      if (validateNIC(inputs.nicNo)) {
                        e.target.style.borderColor = '#27ae60';
                        e.target.style.background = '#f0fff4';
                      } else {
                        e.target.style.borderColor = '#e1e5e9';
                        e.target.style.background = '#f8f9fa';
                      }
                      e.target.style.boxShadow = 'none';
                    }
                  }}
                />
              </div>
              {errors.nicNo && <div style={errorStyle}>{errors.nicNo}</div>}
              {!errors.nicNo && inputs.nicNo && validateNIC(inputs.nicNo) && (
                <div style={successStyle}>NIC format is valid</div>
              )}
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle} htmlFor="email">
                Email <span style={requiredStyle}>*</span>
              </label>
              <div style={inputWrapperStyle}>
                <span style={iconInInputStyle}>📧</span>
                <input
                  style={inputStyle(errors.email)}
                  type="email"
                  name="email"
                  value={inputs.email}
                  onChange={handleChange}
                  placeholder="Enter email"
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
              </div>
              {errors.email && <div style={errorStyle}>{errors.email}</div>}
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle} htmlFor="password">
                Password <span style={requiredStyle}>*</span>
              </label>
              <div style={inputWrapperStyle}>
                <span style={iconInInputStyle}>🔒</span>
                <input
                  style={inputStyle(errors.password)}
                  type={showPassword ? "text" : "password"}
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
                <button
                  type="button"
                  style={passwordToggleStyle}
                  onClick={() => setShowPassword(!showPassword)}
                  onMouseOver={(e) => e.target.style.color = '#667eea'}
                  onMouseOut={(e) => e.target.style.color = '#999'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {inputs.password && (
                <div style={passwordStrengthStyle}>
                  <div style={strengthBarStyle}>
                    <div style={getStrengthFillStyle()}></div>
                  </div>
                  <span>Password strength: <span>{passwordStrength.label}</span></span>
                </div>
              )}
              {errors.password && <div style={errorStyle}>{errors.password}</div>}
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle} htmlFor="confirmPassword">
                Confirm Password <span style={requiredStyle}>*</span>
              </label>
              <div style={inputWrapperStyle}>
                <span style={iconInInputStyle}>🔒</span>
                <input
                  style={inputStyle(errors.confirmPassword)}
                  type={showConfirmPassword ? "text" : "password"}
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
                <button
                  type="button"
                  style={passwordToggleStyle}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  onMouseOver={(e) => e.target.style.color = '#667eea'}
                  onMouseOut={(e) => e.target.style.color = '#999'}
                >
                  {showConfirmPassword ? '🙈' : '👁️'}
                </button>
              </div>
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
              {isLoading ? "Creating Account..." : "Register Staff"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StaffRegister;