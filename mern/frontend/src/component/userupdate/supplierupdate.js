// SupplierUpdate.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

function SupplierUpdate() {
  const [inputs, setInputs] = useState({});
  const { id } = useParams();
  const navigate = useNavigate();

  // Fetch supplier details when component loads
  useEffect(() => {
    const fetchSupplier = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/suppliers/${id}`);
        setInputs(res.data.supplier); // assuming API returns { supplier: {...} }
      } catch (err) {
        console.error("Error fetching supplier:", err);
      }
    };
    fetchSupplier();
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
      if (inputs.companyName) payload.companyName = inputs.companyName;
      if (inputs.name) payload.name = inputs.name;
      if (inputs.email) payload.email = inputs.email;
      if (inputs.phone) payload.phone = inputs.phone;
      if (inputs.district) payload.district = inputs.district;
      if (inputs.password) payload.password = inputs.password;

      await axios.put(`http://localhost:5000/suppliers/${id}`, payload);
    } catch (err) {
      console.error("Error updating supplier:", err);
    }
  };

  // Handle form submit
const handleSubmit = async (e) => {
  e.preventDefault();
  await sendRequest();
  alert("Supplier updated successfully!");

  const role = localStorage.getItem("role");

  if (role === "admin") {
    navigate("/adminDashbooard");
  } else if (role === "supplier") {
    navigate("/userAccount/profile");
  } else {
    navigate("/"); // fallback
  }
};


  // ---------- STYLES ----------
  const containerStyle = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    //background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
  };

  const cardStyle = {
    background: 'white',
    borderRadius: '20px',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    width: '100%',
    maxWidth: '600px',
    animation: 'slideIn 0.5s ease-out'
  };

  const headerStyle = {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '30px',
    textAlign: 'center',
    color: 'white'
  };

  const titleStyle = {
    fontSize: '28px',
    marginBottom: '8px',
    fontWeight: '600',
    margin: '0 0 8px 0'
  };

  const subtitleStyle = {
    opacity: '0.9',
    fontSize: '16px',
    margin: '0'
  };

  const formStyle = {
    padding: '40px 30px'
  };

  const formGroupStyle = {
    marginBottom: '25px'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    color: '#333',
    fontWeight: '600',
    fontSize: '14px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  };

  const inputStyle = {
    width: '100%',
    padding: '15px 20px',
    border: '2px solid #e1e5e9',
    borderRadius: '10px',
    fontSize: '16px',
    transition: 'all 0.3s ease',
    background: '#f8f9fa',
    boxSizing: 'border-box'
  };

  const buttonStyle = {
    width: '100%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    padding: '18px',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={headerStyle}>
          <h1 style={titleStyle}>Update Supplier</h1>
          <p style={subtitleStyle}>Modify supplier details</p>
        </div>

        <form onSubmit={handleSubmit} style={formStyle}>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Company Name</label>
            <input
              style={inputStyle}
              type="text"
              name="companyName"
              value={inputs.companyName || ""}
              onChange={handleChange}
              placeholder="Enter company name"
              required
            />
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>Contact Person</label>
            <input
              style={inputStyle}
              type="text"
              name="name"
              value={inputs.name || ""}
              onChange={handleChange}
              placeholder="Enter name"
              required
            />
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>Email</label>
            <input
              style={inputStyle}
              type="email"
              name="email"
              value={inputs.email || ""}
              onChange={handleChange}
              placeholder="Enter email"
              required
            />
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>Phone</label>
            <input
              style={inputStyle}
              type="text"
              name="phone"
              value={inputs.phone || ""}
              onChange={handleChange}
              placeholder="Enter phone number"
              required
            />
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>District</label>
            <input
              style={inputStyle}
              type="text"
              name="district"
              value={inputs.district || ""}
              onChange={handleChange}
              placeholder="Enter district"
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

          <button
            type="submit"
            style={buttonStyle}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-3px)';
              e.target.style.boxShadow = '0 15px 35px rgba(102, 126, 234, 0.4)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
            onMouseDown={(e) => {
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseUp={(e) => {
              e.target.style.transform = 'translateY(-3px)';
            }}
          >
            Update Supplier
          </button>
        </form>



        {/* Back Button → only visible for admin */}
        {localStorage.getItem("role") === "admin" && (
          <div style={{ textAlign: "center", marginTop: "30px" }}>
            <button
              style={{
                background:
                  "linear-gradient(135deg, #f81515ff 0%, #764ba2 100%)",
                color: "white",
                border: "none",
                padding: "12px 30px",
                borderRadius: "25px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                marginBottom: "20px",
              }}
              onClick={() => navigate("/adminDashbooard")}
            >
              ← Back to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default SupplierUpdate;
