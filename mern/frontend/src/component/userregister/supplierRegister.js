import React, { useState, useEffect } from "react";
import "./register.css"; // keep your CSS separate
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
      case "phoneno":
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

    sendRequest()
      .then(() => {
        setIsLoading(false);
        navigate("/allusers"); // navigate to profile page
      })
      .catch((error) => {
        setIsLoading(false);
        console.error("Registration error:", error);
        alert("Registration failed. Please try again.");
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

  return (
    <div className="register-container">
      <div className="register-header">
        <div className="icon">👤</div>
        <h1>Create Supplier Account</h1>
        <p>Join us and start your journey</p>
      </div>

      <div className="register-form">
        <form id="registerForm" onSubmit={handleSubmit}>
          <div className={getFormGroupClass("companyName")}>
            <label htmlFor="name">
              Company Name <span className="required">*</span>
            </label>
            <div className="input-wrapper">
              <span className="icon">👤</span>
              <input
                type="text"
                id="companyName"
                name="companyName"
                onChange={handleChange}
                value={inputs.companyName}
                placeholder="Enter your company name"
                required
              />
            </div>
            {errors.companyName && (
              <div className="error-message">{errors.companyName}</div>
            )}
          </div>

          <div className={getFormGroupClass("name")}>
            <label htmlFor="name">
              Name <span className="required">*</span>
            </label>
            <div className="input-wrapper">
              <span className="icon">👤</span>
              <input
                type="text"
                id="name"
                name="name"
                onChange={handleChange}
                value={inputs.name}
                placeholder="Enter your full name"
                required
              />
            </div>
            {errors.name && <div className="error-message">{errors.name}</div>}
          </div>

          <div className={getFormGroupClass("email")}>
            <label htmlFor="email">
              Email Address <span className="required">*</span>
            </label>
            <div className="input-wrapper">
              <span className="icon">📧</span>
              <input
                type="email"
                id="email"
                name="email"
                onChange={handleChange}
                value={inputs.email}
                placeholder="Enter your email"
                required
              />
            </div>
            {errors.email && (
              <div className="error-message">{errors.email}</div>
            )}
            {successMessages.email && (
              <div className="success-message">{successMessages.email}</div>
            )}
          </div>

          <div className={getFormGroupClass("phoneno")}>
            <label htmlFor="phoneno">Phone Number</label>
            <div className="input-wrapper">
              <span className="icon">📱</span>
              <input
                type="tel"
                id="phone"
                name="phone"
                onChange={handleChange}
                value={inputs.phone}
                placeholder="+94 71 234 5678"
              />
            </div>
            {errors.phone && (
              <div className="error-message">{errors.phone}</div>
            )}
          </div>

          <div className={getFormGroupClass("district")}>
            <label htmlFor="district">
              District <span className="required">*</span>
            </label>
            <div className="input-wrapper">
              <span className="icon">📍</span>
              <select
                id="district"
                name="district"
                onChange={handleChange}
                value={inputs.district}
                required
              >
                <option value="">Select your district</option>
                <option value="galle">Galle</option>
                <option value="matara">Matara</option>
                <option value="hambantota">Hambantota</option>
              </select>
            </div>
            {errors.district && (
              <div className="error-message">{errors.district}</div>
            )}
          </div>

          <div className={getFormGroupClass("password")}>
            <label htmlFor="password">
              Password <span className="required">*</span>
            </label>
            <div className="input-wrapper">
              <span className="icon">🔒</span>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                onChange={handleChange}
                value={inputs.password}
                placeholder="Create password"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => togglePassword("password")}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
            <div className={getPasswordStrengthClass()}>
              <div className="strength-bar">
                <div className="strength-fill"></div>
              </div>
              <span className="strength-text">
                Password strength:{" "}
                <span id="strengthLabel">{passwordStrength.label}</span>
              </span>
            </div>
            {errors.password && (
              <div className="error-message">{errors.password}</div>
            )}
          </div>

          <div className={getFormGroupClass("confirmPassword")}>
            <label htmlFor="confirmPassword">
              Confirm Password <span className="required">*</span>
            </label>
            <div className="input-wrapper">
              <span className="icon">🔒</span>
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                placeholder="Confirm password"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => togglePassword("confirmPassword")}
              >
                {showConfirmPassword ? "🙈" : "👁️"}
              </button>
            </div>
            {errors.confirmPassword && (
              <div className="error-message">{errors.confirmPassword}</div>
            )}
          </div>

          <div className="terms-wrapper">
            <div className="checkbox-wrapper">
              <input type="checkbox" id="terms" name="terms" required />
              <label htmlFor="terms">
                I agree to the{" "}
                <a href="#" target="_blank">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" target="_blank">
                  Privacy Policy
                </a>{" "}
                <span className="required">*</span>
              </label>
            </div>
            {errors.terms && (
              <div className="error-message" style={{ marginTop: 5 }}>
                {errors.terms}
              </div>
            )}
          </div>

          <button
            type="submit"
            className={`register-btn ${isLoading ? "loading" : ""}`}
            disabled={isLoading}
          >
            {isLoading && (
              <span
                className="spinner"
                style={{ display: "inline-block" }}
              ></span>
            )}
            <span className="btn-text">
              {isLoading ? "Creating Account..." : "Create Account"}
            </span>
          </button>
        </form>

        <div className="login-link">
          Already have an account? <a href="#">Sign in here</a>
        </div>
      </div>
    </div>
  );
}

export default SupplierRegister;
