// DisplayAllUsers.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function DisplayAllUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Fetch users
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get("http://localhost:5000/users");
      
      // Make sure users is always an array
      if (Array.isArray(res.data)) {
        setUsers(res.data);
      } else if (Array.isArray(res.data.users)) {
        setUsers(res.data.users);
      } else {
        setUsers([]);
        console.error("Unexpected API response:", res.data);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await axios.delete(`http://localhost:5000/users/${id}`);
        alert("User deleted successfully");
        fetchUsers();
      } catch (err) {
        console.error("Error deleting user:", err);
      }
    }
  };

  const handleUpdate = (id) => {
    navigate(`/update-user/${id}`);
  };

  const containerStyle = {
    minHeight: '100vh',
    padding: '30px',
    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
  };

  const headerStyle = {
    textAlign: 'center',
    marginBottom: '40px',
    color: '#333'
  };

  const titleStyle = {
    fontSize: '36px',
    marginBottom: '10px',
    color: '#667eea',
    fontWeight: '700',
    margin: '0 0 10px 0'
  };

  const subtitleStyle = {
    fontSize: '18px',
    color: '#666',
    margin: '0'
  };

  const loadingStyle = {
    textAlign: 'center',
    padding: '60px 20px',
    background: 'white',
    borderRadius: '15px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
    margin: '0 auto',
    maxWidth: '400px',
    fontSize: '18px',
    color: '#666'
  };

  const errorStyle = {
    ...loadingStyle,
    color: '#e74c3c',
    borderLeft: '5px solid #e74c3c'
  };

  const tableWrapperStyle = {
    background: 'white',
    borderRadius: '20px',
    boxShadow: '0 15px 35px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    margin: '0 auto'
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px'
  };

  const theadStyle = {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white'
  };

  const thStyle = {
    padding: '20px 15px',
    textAlign: 'left',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    fontSize: '12px'
  };

  const trStyle = {
    borderBottom: '1px solid #f1f3f4',
    transition: 'all 0.3s ease'
  };

  const tdStyle = {
    padding: '18px 15px',
    color: '#555',
    fontWeight: '500'
  };

  const firstTdStyle = {
    ...tdStyle,
    fontFamily: "'Courier New', monospace",
    fontSize: '12px',
    color: '#999'
  };

  const actionButtonsStyle = {
    display: 'flex',
    gap: '10px'
  };

  const updateButtonStyle = {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    background: 'linear-gradient(135deg, #4CAF50, #45a049)',
    color: 'white'
  };

  const deleteButtonStyle = {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    background: 'linear-gradient(135deg, #f44336, #d32f2f)',
    color: 'white'
  };

  if (loading) return <div style={loadingStyle}>Loading users...</div>;
  if (error) return <div style={errorStyle}>{error}</div>;

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2 style={titleStyle}>User Management</h2>
        <p style={subtitleStyle}>Manage all registered users</p>
      </div>

      {users.length === 0 ? (
        <div style={loadingStyle}>
          <p>No users found</p>
        </div>
      ) : (
        <div style={tableWrapperStyle}>
          <table style={tableStyle}>
            <thead style={theadStyle}>
              <tr>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Role</th>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>NIC</th>
                <th style={thStyle}>Phone</th>
                <th style={thStyle}>District</th>
                <th style={thStyle}>Password</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr 
                  key={user._id} 
                  style={trStyle}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(90deg, #f8f9ff 0%, #f0f2ff 100%)';
                    e.currentTarget.style.transform = 'scale(1.01)';
                    e.currentTarget.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.08)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <td style={firstTdStyle}>{user._id}</td>
                  <td style={tdStyle}>{user.role}</td>
                  <td style={tdStyle}>{user.name}</td>
                  <td style={tdStyle}>{user.email}</td>
                  <td style={tdStyle}>{user.nic}</td>
                  <td style={tdStyle}>{user.phoneno}</td>
                  <td style={tdStyle}>{user.district}</td>
                  <td style={tdStyle}>{user.password}</td>
                  <td style={tdStyle}>
                    <div style={actionButtonsStyle}>
                      <button 
                        onClick={() => handleUpdate(user._id)}
                        style={updateButtonStyle}
                        onMouseOver={(e) => {
                          e.target.style.background = 'linear-gradient(135deg, #45a049, #3d8b40)';
                          e.target.style.transform = 'translateY(-2px)';
                          e.target.style.boxShadow = '0 5px 15px rgba(76, 175, 80, 0.4)';
                        }}
                        onMouseOut={(e) => {
                          e.target.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = 'none';
                        }}
                      >
                        Update
                      </button>
                      <button
                        onClick={() => handleDelete(user._id)}
                        style={deleteButtonStyle}
                        onMouseOver={(e) => {
                          e.target.style.background = 'linear-gradient(135deg, #d32f2f, #b71c1c)';
                          e.target.style.transform = 'translateY(-2px)';
                          e.target.style.boxShadow = '0 5px 15px rgba(244, 67, 54, 0.4)';
                        }}
                        onMouseOut={(e) => {
                          e.target.style.background = 'linear-gradient(135deg, #f44336, #d32f2f)';
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = 'none';
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default DisplayAllUsers;