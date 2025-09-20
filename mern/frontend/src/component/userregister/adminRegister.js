import React, { useState } from "react";
import "./register.css";
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

  return (
    <div className="register-container">
      <div className="register-header">
        <div className="icon">👨‍💼</div>
        <h1>Create Admin Account</h1>
      </div>

      <div className="register-form">
        <form onSubmit={handleSubmit}>
          <div className={`form-group ${errors.name ? "error" : ""}`}>
             <label htmlFor="name">
              Name <span className="required">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={inputs.name}
              onChange={handleChange}
              placeholder="Enter your name"
            />
            {errors.name && <div className="error-message">{errors.name}</div>}
          </div>

          <div className={`form-group ${errors.email ? "error" : ""}`}>
             <label htmlFor="email">
              Email <span className="required">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={inputs.email}
              onChange={handleChange}
              placeholder="Enter your email"
            />
            {errors.email && (
              <div className="error-message">{errors.email}</div>
            )}
          </div>

          <div className={`form-group ${errors.password ? "error" : ""}`}>
             <label htmlFor="password">
              Password <span className="required">*</span>
            </label>
            <input
              type="password"
              name="password"
              value={inputs.password}
              onChange={handleChange}
              placeholder="Enter password"
            />
            {errors.password && (
              <div className="error-message">{errors.password}</div>
            )}
          </div>

          <div className={`form-group ${errors.confirmPassword ? "error" : ""}`}>
             <label htmlFor="password">
              Confirm Password <span className="required">*</span>
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
            />
            {errors.confirmPassword && (
              <div className="error-message">{errors.confirmPassword}</div>
            )}
          </div>

          <button type="submit" disabled={isLoading} className="register-btn">
            {isLoading ? "Creating Account..." : "Register Admin"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminRegister;
