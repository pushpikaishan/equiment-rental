// AdminUpdate.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

function AdminUpdate() {
  const [inputs, setInputs] = useState({});
  const { id } = useParams();
  const navigate = useNavigate();

  // Fetch admin details when component loads
  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/admins/${id}`);
        setInputs(res.data.admin); // assuming API returns { admin: {...} }
      } catch (err) {
        console.error("Error fetching admin:", err);
      }
    };
    fetchAdmin();
  }, [id]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputs((prev) => ({ ...prev, [name]: value }));
  };

  // Send update request
  const sendRequest = async () => {
    try {
      const payload = {};
      if (inputs.name) payload.name = inputs.name;
      if (inputs.email) payload.email = inputs.email;
      if (inputs.password) payload.password = inputs.password;

      await axios.put(`http://localhost:5000/admins/${id}`, payload);
    } catch (err) {
      console.error("Error updating admin:", err);
    }
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    await sendRequest();
    alert("Admin updated successfully!");
    navigate("/DisAllAdmins"); // redirect after update
  };

  // --- Styling ---
  const containerStyle = {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  };

  const cardStyle = {
    background: "white",
    borderRadius: "20px",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
    overflow: "hidden",
    width: "100%",
    maxWidth: "600px",
  };

  const headerStyle = {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    padding: "30px",
    textAlign: "center",
    color: "white",
  };

  const titleStyle = { fontSize: "28px", fontWeight: "600", margin: 0 };
  const subtitleStyle = { opacity: "0.9", fontSize: "16px", margin: "8px 0 0" };

  const formStyle = { padding: "40px 30px" };
  const formGroupStyle = { marginBottom: "25px" };

  const labelStyle = {
    display: "block",
    marginBottom: "8px",
    color: "#333",
    fontWeight: "600",
    fontSize: "14px",
    textTransform: "uppercase",
  };

  const inputStyle = {
    width: "100%",
    padding: "15px 20px",
    border: "2px solid #e1e5e9",
    borderRadius: "10px",
    fontSize: "16px",
    background: "#f8f9fa",
  };

  const buttonStyle = {
    width: "100%",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    border: "none",
    padding: "18px",
    borderRadius: "10px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    textTransform: "uppercase",
    letterSpacing: "1px",
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={headerStyle}>
          <h1 style={titleStyle}>Update Admin</h1>
          <p style={subtitleStyle}>Modify admin details</p>
        </div>

        <form onSubmit={handleSubmit} style={formStyle}>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Full Name</label>
            <input
              style={inputStyle}
              type="text"
              name="name"
              value={inputs.name || ""}
              onChange={handleChange}
              placeholder="Enter full name"
              required
            />
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>Email Address</label>
            <input
              style={inputStyle}
              type="email"
              name="email"
              value={inputs.email || ""}
              onChange={handleChange}
              placeholder="Enter email address"
              required
            />
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>Password</label>
            <input
              style={inputStyle}
              type="password"
              name="password"
              value={inputs.password || ""}
              onChange={handleChange}
              placeholder="Password (leave blank if unchanged)"
            />
          </div>

          <button type="submit" style={buttonStyle}>
            Update Admin Details
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminUpdate;
