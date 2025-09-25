// DisplayAllUsers.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

function DisplayAllUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
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

  const exportBarStyle = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginBottom: '16px'
  };

  const toolbarStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    marginBottom: '16px'
  };

  const searchInputStyle = {
    flex: '1 1 320px',
    maxWidth: '480px',
    padding: '12px 14px',
    borderRadius: '10px',
    border: '1px solid #e0e3e8',
    outline: 'none',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    fontSize: '14px'
  };

  const exportButtonStyle = {
    padding: '10px 16px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: 'white'
  };

  const pdfButtonStyle = {
    ...exportButtonStyle,
    background: 'linear-gradient(135deg, #e53935, #b71c1c)'
  };

  const excelButtonStyle = {
    ...exportButtonStyle,
    background: 'linear-gradient(135deg, #2e7d32, #1b5e20)'
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

  // Build a consistent, safe dataset for exporting (exclude sensitive fields like password)
  const normalized = (v) => (v || "").toString().toLowerCase();
  const filteredUsers = users.filter((u) => {
    if (!search) return true;
    const q = search.trim().toLowerCase();
    return (
      normalized(u._id).includes(q) ||
      normalized(u.name).includes(q) ||
      normalized(u.email).includes(q)
    );
  });

  const buildExportRows = () => {
    return filteredUsers.map((u) => ({
      ID: u._id || '',
      Role: u.role || '',
      Name: u.name || '',
      Email: u.email || '',
      NIC: u.nic || '',
      Phone: u.phoneno || '',
      District: u.district || ''
    }));
  };

  const handleDownloadExcel = () => {
    try {
      const rows = buildExportRows();
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');
      const fileName = `users_${new Date().toISOString().slice(0,10)}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } catch (e) {
      console.error('Excel export failed:', e);
      alert('Failed to export Excel file');
    }
  };

  const handleDownloadPDF = () => {
    const loadImageAsDataURL = async (url) => {
      try {
        const res = await fetch(url);
        const blob = await res.blob();
        return await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (err) {
        console.warn('Logo load failed:', err);
        return null;
      }
    };

    (async () => {
      try {
        const doc = new jsPDF({ orientation: 'landscape' });
        const pageWidth = doc.internal.pageSize.getWidth();
        const titleY = 34; // where title text will be placed

        // Header: Logo (left), meta (right)
        const logoUrl = `${process.env.PUBLIC_URL || ''}/favicon.ico`;
        const logoDataUrl = await loadImageAsDataURL(logoUrl);
        if (logoDataUrl) {
          // x, y, width, height
          doc.addImage(logoDataUrl, 'PNG', 14, 8, 22, 22);
        }

        // Right-aligned metadata
        const generatedOn = new Date().toLocaleString();
        const role = (typeof window !== 'undefined' && localStorage.getItem('role')) || 'Unknown';
        const userId = (typeof window !== 'undefined' && localStorage.getItem('userId')) || '';
        const generatedBy = userId ? `${role} (${userId})` : role;

        doc.setFontSize(10);
        doc.text(`Generated on: ${generatedOn}`, pageWidth - 14, 12, { align: 'right' });
        doc.text(`Generated by: ${generatedBy}`, pageWidth - 14, 18, { align: 'right' });

        // Title
        doc.setFontSize(16);
        doc.text('All Customers', 14, titleY);

        // Table
        const headers = [['ID', 'Name', 'Email', 'NIC', 'Phone', 'District']];
        const body = filteredUsers.map((u) => [
          u._id || '',
          u.name || '',
          u.email || '',
          u.nic || '',
          u.phoneno || '',
          u.district || ''
        ]);

        autoTable(doc, {
          head: headers,
          body,
          startY: titleY + 6,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [102, 126, 234] }
        });

        const fileName = `users_${new Date().toISOString().slice(0,10)}.pdf`;
        doc.save(fileName);
      } catch (e) {
        console.error('PDF export failed:', e);
        alert('Failed to export PDF file');
      }
    })();
  };

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
        <div>
          {/* Toolbar: Search */}
          <div style={toolbarStyle}>
            <input
              type="text"
              style={searchInputStyle}
              placeholder="Search by ID, name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div style={exportBarStyle}>
            <button
              style={pdfButtonStyle}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(231, 76, 60, 0.35)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
              onClick={handleDownloadPDF}
              disabled={filteredUsers.length === 0}
            >
              Download PDF
            </button>
            <button
              style={excelButtonStyle}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(46, 125, 50, 0.35)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
              onClick={handleDownloadExcel}
              disabled={filteredUsers.length === 0}
            >
              Download Excel
            </button>
            </div>
          </div>

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
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ ...tdStyle, textAlign: 'center', padding: '24px' }}>
                    No matching results
                  </td>
                </tr>
              ) : (
              filteredUsers.map((user) => (
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
              ))
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default DisplayAllUsers;