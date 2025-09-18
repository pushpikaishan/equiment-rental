import React, { useState } from "react";
import "./register.css";
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

  const navigate = useNavigate();

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
      await axios.post("http://localhost:5000/staff", inputs);
      setIsLoading(false);
      navigate("/allstaff");
    } catch (err) {
      setIsLoading(false);
      alert("Registration failed");
    }
  };

  return (
    <div className="register-container">
      <div className="register-header">
        <div className="icon">👩‍💼</div>
        <h1>Create Staff Account</h1>
      </div>

      <div className="register-form">
        <form onSubmit={handleSubmit}>
          <div className={`form-group ${errors.name ? "error" : ""}`}>
            <label htmlFor="name">
              Name <span className="required">*</span>
            </label>
            <div className="input-wrapper">
                <input
              type="text"
              name="name"
              value={inputs.name}
              onChange={handleChange}
              placeholder="Enter full name"
            />
            </div>
            
            {errors.name && <div className="error-message">{errors.name}</div>}
          </div>

          <div className={`form-group ${errors.phoneno ? "error" : ""}`}>
            <label htmlFor="phone">
              Phone No <span className="required">*</span>
            </label>
            <div className="input-wrapper">
                <input
              type="text"
              name="phoneno"
              value={inputs.phoneno}
              onChange={handleChange}
              placeholder="Enter phone number"
            />
            </div>
            {errors.phoneno && (
              <div className="error-message">{errors.phoneno}</div>
            )}
          </div>

          <div className={`form-group ${errors.nicNo ? "error" : ""}`}>
          <label htmlFor="name">
              NIC <span className="required">*</span>
            </label>
            <div className="input-wrapper">
                <input
              type="text"
              name="nicNo"
              value={inputs.nicNo}
              onChange={handleChange}
              placeholder="Enter NIC number"
            />
            </div>
            {errors.nicNo && (
              <div className="error-message">{errors.nicNo}</div>
            )}
          </div>

          <div className={`form-group ${errors.email ? "error" : ""}`}>
            <label htmlFor="email">
              Email <span className="required">*</span>
            </label>
            <div className="input-wrapper">
                 <input
              type="email"
              name="email"
              value={inputs.email}
              onChange={handleChange}
              placeholder="Enter email"
            />
            </div>
            {errors.email && (
              <div className="error-message">{errors.email}</div>
            )}
          </div>

          <div className={`form-group ${errors.password ? "error" : ""}`}>
            <label htmlFor="password">
              Password <span className="required">*</span>
            </label>
            <div className="input-wrapper">
                 <input
              type="password"
              name="password"
              value={inputs.password}
              onChange={handleChange}
              placeholder="Enter password"
            />
            </div>
            {errors.password && (
              <div className="error-message">{errors.password}</div>
            )}
          </div>

          <div className={`form-group ${errors.confirmPassword ? "error" : ""}`}>
            <label htmlFor="confirmPassword">
              Confirm Password <span className="required">*</span>
            </label>
            <div className="input-wrapper">
                <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
            />
            </div>
            {errors.confirmPassword && (
              <div className="error-message">{errors.confirmPassword}</div>
            )}
          </div>

          <button type="submit" disabled={isLoading} className="register-btn">
            {isLoading ? "Creating Account..." : "Register Staff"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default StaffRegister;
