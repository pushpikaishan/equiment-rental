import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function SupplierRegister() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    level: 0,
    label: "Too weak",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessages, setSuccessMessages] = useState({});

  const togglePassword = (field) => {
    if (field === "password") {
      setShowPassword(!showPassword);
    } else if (field === "confirmPassword") {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  // Password strength checker
  const checkPasswordStrength = (password) => {
    let strength = 0;
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    };

    strength = Object.values(checks).filter(Boolean).length;

    let strengthData = { level: 0, label: "Too weak" };

    if (strength < 3) {
      strengthData = { level: 1, label: "Weak" };
    } else if (strength < 5) {
      strengthData = { level: 2, label: "Medium" };
    } else {
      strengthData = { level: 3, label: "Strong" };
    }

    setPasswordStrength(strengthData);
    return strength >= 3;
  };

  // Email validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Phone validation for Sri Lankan numbers
  const validatePhone = (phone) => {
    const phoneRegex = /^(\+94|0)?[1-9][0-9]{8}$/;
    return !phone || phoneRegex.test(phone.replace(/\s/g, ""));
  };

  // Real-time validation function
  const validateField = (name, value) => {
    let error = "";
    let success = "";

    switch (name) {
      case "companyName":
        if (!value.trim()) {
          error = "Company name is required";
        }
        break;
      case "name":
        if (!value.trim()) {
          error = "Name is required";
        }
        break;
      case "email":
        if (!value.trim()) {
          error = "Email is required";
        } else if (!validateEmail(value)) {
          error = "Please enter a valid email address";
        } else {
          success = "Email format is valid";
        }
        break;
      case "phone":
        if (value && !validatePhone(value)) {
          error = "Please enter a valid phone number";
        }
        break;
      case "district":
        if (!value) {
          error = "Please select your district";
        }
        break;
      case "password":
        if (!value) {
          error = "Password is required";
        } else if (!checkPasswordStrength(value)) {
          error =
            "Password must be at least 8 characters with uppercase, lowercase, and number";
        }
        break;
      default:
        break;
    }

    setErrors((prev) => ({ ...prev, [name]: error }));
    setSuccessMessages((prev) => ({ ...prev, [name]: success }));
  };

  // Form validation
  const validateForm = () => {
    const formData = {
      companyName: inputs.companyName.trim(),
      name: inputs.name.trim(),
      email: inputs.email.trim(),
      phone: inputs.phone.trim(),
      district: inputs.district,
      password: inputs.password,
      confirmPassword: confirmPassword,
    };

    let isValid = true;
    const newErrors = {};

    // Validate required fields
    if (!formData.companyName) {
      newErrors.companyName = "Company name is required";
      isValid = false;
    }

    if (!formData.email) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
      isValid = false;
    }

    if (formData.phone && !validatePhone(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
      isValid = false;
    }

    if (!formData.district) {
      newErrors.district = "Please select your district";
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
      isValid = false;
    } else if (!checkPasswordStrength(formData.password)) {
      newErrors.password =
        "Password must be at least 8 characters with uppercase, lowercase, and number";
      isValid = false;
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Original state management..................................
  const navigate = useNavigate();

  const [inputs, setInputs] = useState({
    companyName: "",
    name: "",
    email: "",
    phone: "",
    district: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputs((prevState) => ({
      ...prevState,
      [name]: value,
    }));

    // Real-time validation
    validateField(name, value);
  };

  // Handle confirm password separately
  const handleConfirmPasswordChange = (e) => {
    const value = e.target.value;
    setConfirmPassword(value);

    if (value && inputs.password !== value) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: "Passwords do not match",
      }));
    } else {
      setErrors((prev) => ({ ...prev, confirmPassword: "" }));
    }
  };

  // Submit button
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    console.log(inputs);
    setIsLoading(true);

    // pre-check email existence across all roles
    axios.post("http://localhost:5000/auth/check-email", { email: inputs.email })
      .then(res => {
        if (res.data?.exists) {
          setErrors(prev => ({ ...prev, email: `This email is already registered as ${res.data.role}.` }));
          setIsLoading(false);
          throw new Error('email-exists');
        }
        return sendRequest();
      })
      .then(() => {
        setIsLoading(false);
        navigate("/userlog"); // navigate to profile page
      })
      .catch((error) => {
        setIsLoading(false);
        if (String(error?.message) === 'email-exists') return;
        console.error("Registration error:", error);
        setErrors(prev => ({ ...prev, email: error?.response?.data?.message || error?.response?.data?.msg || 'Registration failed' }));
      });
  };

  const sendRequest = async () => {
    await axios
      .post("http://localhost:5000/suppliers", {
        companyName: String(inputs.companyName),
        name: String(inputs.name),
        email: String(inputs.email),
        phone: Number(inputs.phone),
        district: String(inputs.district),
        password: String(inputs.password),
      })
      .then((res) => res.data);
  };

  // Get form group classes for styling
  const getFormGroupClass = (fieldName) => {
    let classes = "form-group";
    if (errors[fieldName]) {
      classes += " error";
    } else if (successMessages[fieldName]) {
      classes += " success";
    }
    return classes;
  };

  // Get password strength class
  const getPasswordStrengthClass = () => {
    switch (passwordStrength.level) {
      case 1:
        return "password-strength strength-weak";
      case 2:
        return "password-strength strength-medium";
      case 3:
        return "password-strength strength-strong";
      default:
        return "password-strength";
    }
  };

  // CSS Styles
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

  const formGroupStyle = (hasError, hasSuccess) => ({
    marginBottom: '20px',
    position: 'relative',
    ...(hasError && {
      '& input, & select': {
        borderColor: '#e74c3c',
        background: '#fef5f5'
      }
    }),
    ...(hasSuccess && {
      '& input': {
        borderColor: '#27ae60',
        background: '#f0fff4'
      }
    })
  });

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

  const inputStyle = (hasError, hasSuccess) => ({
    width: '100%',
    padding: '12px 15px 12px 45px',
    border: hasError ? '2px solid #e74c3c' : hasSuccess ? '2px solid #27ae60' : '2px solid #e1e5e9',
    borderRadius: '8px',
    fontSize: '15px',
    transition: 'all 0.3s ease',
    background: hasError ? '#fef5f5' : hasSuccess ? '#f0fff4' : '#f8f9fa',
    boxSizing: 'border-box'
  });

  const selectStyle = (hasError) => ({
    width: '100%',
    padding: '12px 15px 12px 45px',
    border: hasError ? '2px solid #e74c3c' : '2px solid #e1e5e9',
    borderRadius: '8px',
    fontSize: '15px',
    transition: 'all 0.3s ease',
    background: hasError ? '#fef5f5' : '#f8f9fa',
    cursor: 'pointer',
    appearance: 'none',
    backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e\")",
    backgroundPosition: 'right 12px center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: '16px',
    paddingRight: '40px',
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

  const termsWrapperStyle = {
    margin: '25px 0'
  };

  const checkboxWrapperStyle = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px'
  };

  const checkboxStyle = {
    marginTop: '3px',
    accentColor: '#667eea'
  };

  const checkboxLabelStyle = {
    fontSize: '14px',
    lineHeight: '1.4',
    color: '#666'
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

  const loadingButtonStyle = {
    ...buttonStyle,
    pointerEvents: 'none',
    opacity: '0.8'
  };

  const spinnerStyle = {
    width: '20px',
    height: '20px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '50%',
    borderTopColor: 'white',
    animation: 'spin 1s ease-in-out infinite',
    marginRight: '10px'
  };

  const errorMessageStyle = {
    color: '#e74c3c',
    fontSize: '12px',
    marginTop: '5px',
    display: 'block'
  };

  const successMessageStyle = {
    color: '#27ae60',
    fontSize: '12px',
    marginTop: '5px',
    display: 'block'
  };

  const loginLinkStyle = {
    textAlign: 'center',
    marginTop: '25px',
    color: '#666',
    fontSize: '14px'
  };

  const requiredStyle = {
    color: '#e74c3c',
    marginLeft: '2px'
  };

  const linkStyle = {
    color: '#667eea',
    textDecoration: 'none'
  };

  return (
    <div style={containerStyle}>
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>

      <div style={registerContainerStyle}>
        <div style={headerStyle}>
          <div style={iconStyle}>👤</div>
          <h1 style={{ fontSize: '24px', marginBottom: '8px', fontWeight: '600', margin: '0 0 8px 0' }}>Create Supplier Account</h1>
          <p style={{ opacity: '0.9', fontSize: '14px', margin: '0' }}>Join us and start your journey</p>
        </div>

        <div style={formStyle}>
          <form id="registerForm" onSubmit={handleSubmit}>
            <div style={formGroupStyle(errors.companyName, successMessages.companyName)}>
              <label style={labelStyle} htmlFor="name">
                Company Name <span style={requiredStyle}>*</span>
              </label>
              <div style={inputWrapperStyle}>
                <span style={iconInInputStyle}>👤</span>
                <input
                  style={inputStyle(errors.companyName, successMessages.companyName)}
                  type="text"
                  id="companyName"
                  name="companyName"
                  onChange={handleChange}
                  value={inputs.companyName}
                  placeholder="Enter your company name"
                  required
                  onFocus={(e) => {
                    e.target.style.borderColor = '#667eea';
                    e.target.style.background = 'white';
                    e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                  }}
                  onBlur={(e) => {
                    if (!errors.companyName) {
                      e.target.style.borderColor = successMessages.companyName ? '#27ae60' : '#e1e5e9';
                      e.target.style.background = successMessages.companyName ? '#f0fff4' : '#f8f9fa';
                      e.target.style.boxShadow = 'none';
                    }
                  }}
                />
              </div>
              {errors.companyName && <div style={errorMessageStyle}>{errors.companyName}</div>}
            </div>

            <div style={formGroupStyle(errors.name, successMessages.name)}>
              <label style={labelStyle} htmlFor="name">
                Name <span style={requiredStyle}>*</span>
              </label>
              <div style={inputWrapperStyle}>
                <span style={iconInInputStyle}>👤</span>
                <input
                  style={inputStyle(errors.name, successMessages.name)}
                  type="text"
                  id="name"
                  name="name"
                  onChange={handleChange}
                  value={inputs.name}
                  placeholder="Enter your full name"
                  required
                  onFocus={(e) => {
                    e.target.style.borderColor = '#667eea';
                    e.target.style.background = 'white';
                    e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                  }}
                  onBlur={(e) => {
                    if (!errors.name) {
                      e.target.style.borderColor = successMessages.name ? '#27ae60' : '#e1e5e9';
                      e.target.style.background = successMessages.name ? '#f0fff4' : '#f8f9fa';
                      e.target.style.boxShadow = 'none';
                    }
                  }}
                />
              </div>
              {errors.name && <div style={errorMessageStyle}>{errors.name}</div>}
            </div>

            <div style={formGroupStyle(errors.email, successMessages.email)}>
              <label style={labelStyle} htmlFor="email">
                Email Address <span style={requiredStyle}>*</span>
              </label>
              <div style={inputWrapperStyle}>
                <span style={iconInInputStyle}>📧</span>
                <input
                  style={inputStyle(errors.email, successMessages.email)}
                  type="email"
                  id="email"
                  name="email"
                  onChange={handleChange}
                  value={inputs.email}
                  placeholder="Enter your email"
                  required
                  onFocus={(e) => {
                    e.target.style.borderColor = '#667eea';
                    e.target.style.background = 'white';
                    e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                  }}
                  onBlur={(e) => {
                    if (!errors.email) {
                      e.target.style.borderColor = successMessages.email ? '#27ae60' : '#e1e5e9';
                      e.target.style.background = successMessages.email ? '#f0fff4' : '#f8f9fa';
                      e.target.style.boxShadow = 'none';
                    }
                  }}
                />
              </div>
              {errors.email && <div style={errorMessageStyle}>{errors.email}</div>}
              {successMessages.email && <div style={successMessageStyle}>{successMessages.email}</div>}
            </div>

            <div style={formGroupStyle(errors.phone, successMessages.phone)}>
              <label style={labelStyle} htmlFor="phoneno">Phone Number</label>
              <div style={inputWrapperStyle}>
                <span style={iconInInputStyle}>📱</span>
                <input
                  style={inputStyle(errors.phone, successMessages.phone)}
                  type="tel"
                  id="phone"
                  name="phone"
                  onChange={handleChange}
                  value={inputs.phone}
                  placeholder="+94 71 234 5678"
                  onFocus={(e) => {
                    e.target.style.borderColor = '#667eea';
                    e.target.style.background = 'white';
                    e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                  }}
                  onBlur={(e) => {
                    if (!errors.phone) {
                      e.target.style.borderColor = '#e1e5e9';
                      e.target.style.background = '#f8f9fa';
                      e.target.style.boxShadow = 'none';
                    }
                  }}
                />
              </div>
              {errors.phone && <div style={errorMessageStyle}>{errors.phone}</div>}
            </div>

            <div style={formGroupStyle(errors.district, successMessages.district)}>
              <label style={labelStyle} htmlFor="district">
                District <span style={requiredStyle}>*</span>
              </label>
              <div style={inputWrapperStyle}>
                <span style={iconInInputStyle}>📍</span>
                <select
                  style={selectStyle(errors.district)}
                  id="district"
                  name="district"
                  onChange={handleChange}
                  value={inputs.district}
                  required
                  onFocus={(e) => {
                    e.target.style.borderColor = '#667eea';
                    e.target.style.background = 'white';
                    e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                  }}
                  onBlur={(e) => {
                    if (!errors.district) {
                      e.target.style.borderColor = '#e1e5e9';
                      e.target.style.background = '#f8f9fa';
                      e.target.style.boxShadow = 'none';
                    }
                  }}
                >
                  <option value="">Select your district</option>
                  <option value="Ampara">Ampara</option>
                  <option value="Anuradhapura">Anuradhapura</option>
                  <option value="Badulla">Badulla</option>
                  <option value="Batticaloa">Batticaloa</option>
                  <option value="Colombo">Colombo</option>
                  <option value="Gampaha">Gampaha</option>
                  <option value="Galle">Galle</option>
                  <option value="Hambantota">Hambantota</option>
                  <option value="Jaffna">Jaffna</option>
                  <option value="Kalutara">Kalutara</option>
                  <option value="Kandy">Kandy</option>
                  <option value="Kegalle">Kegalle</option>
                  <option value="Kilinochchi">Kilinochchi</option>
                  <option value="Kurunegala">Kurunegala</option>
                  <option value="Matale">Matale</option>
                  <option value="Matara">Matara</option>
                  <option value="Mannar">Mannar</option>
                  <option value="Monaragala">Monaragala</option>
                  <option value="Mullaitivu">Mullaitivu</option>
                  <option value="Muwara-eliya">Nuwara Eliya</option>
                  <option value="Polonnaruwa">Polonnaruwa</option>
                  <option value="Puttalam">Puttalam</option>
                  <option value="Ratnapura">Ratnapura</option>
                  <option value="Trincomalee">Trincomalee</option>
                  <option value="Vavuniya">Vavuniya</option>
                </select>
              </div>
              {errors.district && <div style={errorMessageStyle}>{errors.district}</div>}
            </div>

            <div style={formGroupStyle(errors.password, successMessages.password)}>
              <label style={labelStyle} htmlFor="password">
                Password <span style={requiredStyle}>*</span>
              </label>
              <div style={inputWrapperStyle}>
                <span style={iconInInputStyle}>🔒</span>
                <input
                  style={inputStyle(errors.password, successMessages.password)}
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  onChange={handleChange}
                  value={inputs.password}
                  placeholder="Create password"
                  required
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
                  onClick={() => togglePassword("password")}
                  onMouseOver={(e) => e.target.style.color = '#667eea'}
                  onMouseOut={(e) => e.target.style.color = '#999'}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
              <div style={passwordStrengthStyle}>
                <div style={strengthBarStyle}>
                  <div style={getStrengthFillStyle()}></div>
                </div>
                <span>
                  Password strength: <span>{passwordStrength.label}</span>
                </span>
              </div>
              {errors.password && <div style={errorMessageStyle}>{errors.password}</div>}
            </div>

            <div style={formGroupStyle(errors.confirmPassword, successMessages.confirmPassword)}>
              <label style={labelStyle} htmlFor="confirmPassword">
                Confirm Password <span style={requiredStyle}>*</span>
              </label>
              <div style={inputWrapperStyle}>
                <span style={iconInInputStyle}>🔒</span>
                <input
                  style={inputStyle(errors.confirmPassword, successMessages.confirmPassword)}
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  placeholder="Confirm password"
                  required
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
                  onClick={() => togglePassword("confirmPassword")}
                  onMouseOver={(e) => e.target.style.color = '#667eea'}
                  onMouseOut={(e) => e.target.style.color = '#999'}
                >
                  {showConfirmPassword ? "🙈" : "👁️"}
                </button>
              </div>
              {errors.confirmPassword && <div style={errorMessageStyle}>{errors.confirmPassword}</div>}
            </div>

            <div style={termsWrapperStyle}>
              <div style={checkboxWrapperStyle}>
                <input style={checkboxStyle} type="checkbox" id="terms" name="terms" required />
                <label style={checkboxLabelStyle} htmlFor="terms">
                  I agree to the{" "}
                  <a style={linkStyle} href="#" target="_blank">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a style={linkStyle} href="#" target="_blank">
                    Privacy Policy
                  </a>{" "}
                  <span style={requiredStyle}>*</span>
                </label>
              </div>
              {errors.terms && <div style={{ ...errorMessageStyle, marginTop: 5 }}>{errors.terms}</div>}
            </div>

            <button
              type="submit"
              style={isLoading ? loadingButtonStyle : buttonStyle}
              disabled={isLoading}
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
              {isLoading && <span style={spinnerStyle}></span>}
              <span>
                {isLoading ? "Creating Account..." : "Create Account"}
              </span>
            </button>
          </form>

          <div style={loginLinkStyle}>
            Already have an account? <a style={{...linkStyle, fontWeight: '600'}} href="/userlog">Sign in here</a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SupplierRegister;