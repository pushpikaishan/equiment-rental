// DisplayAllSuppliers.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

function DisplayAllSuppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  // Fetch suppliers
  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const res = await axios.get("http://localhost:5000/suppliers");

      if (Array.isArray(res.data)) {
        setSuppliers(res.data);
      } else if (Array.isArray(res.data.suppliers)) {
        setSuppliers(res.data.suppliers);
      } else {
        setSuppliers([]);
        console.error("Unexpected API response:", res.data);
      }
    } catch (err) {
      console.error("Error fetching suppliers:", err);
      setError("Failed to fetch suppliers");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this supplier?")) {
      try {
        await axios.delete(`http://localhost:5000/suppliers/${id}`);
        alert("Supplier deleted successfully");
        fetchSuppliers();
      } catch (err) {
        console.error("Error deleting supplier:", err);
      }
    }
  };

  const handleUpdate = (id) => {
    navigate(`/update-supplier/${id}`);
  };

  // ✅ Styles (copied from DisplayAllUsers for consistency)
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
    background: 'linear-gradient(135deg, #f59e0b, #f3ab2fff)'
  };

  const excelButtonStyle = {
    ...exportButtonStyle,
    background: 'linear-gradient(135deg, #5dae61ff, #2e7d32)'
  };

  const titleStyle = {
    fontSize: '36px',
    marginBottom: '10px',
    color: '#3b82f6',
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

  const toolbarStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    marginBottom: '16px',
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

  const theadStyle = {
    background: 'linear-gradient(135deg, #3b82f6 0%, #764ba2 100%)',
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
    background: 'linear-gradient(135deg, #16a34a, #16a34a)',
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

  // Filtering helpers
  const normalized = (v) => (v || "").toString().toLowerCase();
  const filteredSuppliers = suppliers.filter((s) => {
    if (!search) return true;
    const q = search.trim().toLowerCase();
    return (
      normalized(s._id).includes(q) ||
      normalized(s.name).includes(q) ||
      normalized(s.email).includes(q)
    );
  });

  // Build safe export rows (omit password)
  const buildExportRows = () => {
    return filteredSuppliers.map((s) => ({
      ID: s._id || '',
      Role: s.role || '',
      Company: s.companyName || '',
      Name: s.name || '',
      Email: s.email || '',
      Phone: s.phone || '',
      District: s.district || ''
    }));
  };

  const handleDownloadExcel = () => {
    try {
      const rows = buildExportRows();
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Suppliers');
      const fileName = `suppliers_${new Date().toISOString().slice(0,10)}.xlsx`;
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
        const titleY = 34;

        // Header: Logo (left), meta (right)
        const logoUrl = `${process.env.PUBLIC_URL || ''}/favicon.ico`;
        const logoDataUrl = await loadImageAsDataURL(logoUrl);
        if (logoDataUrl) {
          doc.addImage(logoDataUrl, 'PNG', 14, 8, 22, 22);
        }

        const generatedOn = new Date().toLocaleString();
        const role = (typeof window !== 'undefined' && localStorage.getItem('role')) || 'Unknown';
        const userId = (typeof window !== 'undefined' && localStorage.getItem('userId')) || '';
        const generatedBy = userId ? `${role} (${userId})` : role;

        doc.setFontSize(10);
        doc.text(`Generated on: ${generatedOn}`, pageWidth - 14, 12, { align: 'right' });
        doc.text(`Generated by: ${generatedBy}`, pageWidth - 14, 18, { align: 'right' });

        // Title
        doc.setFontSize(16);
        doc.text('All Suppliers', 14, titleY);

        // Table
        const headers = [['ID', 'Role', 'Company', 'Name', 'Email', 'Phone', 'District']];
        const body = filteredSuppliers.map((s) => [
          s._id || '',
          s.role || '',
          s.companyName || '',
          s.name || '',
          s.email || '',
          s.phone || '',
          s.district || ''
        ]);

        autoTable(doc, {
          head: headers,
          body,
          startY: titleY + 6,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [102, 126, 234] }
        });

        const fileName = `suppliers_${new Date().toISOString().slice(0,10)}.pdf`;
        doc.save(fileName);
      } catch (e) {
        console.error('PDF export failed:', e);
        alert('Failed to export PDF file');
      }
    })();
  };

  // ✅ Render
  if (loading) return <div style={loadingStyle}>Loading suppliers...</div>;
  if (error) return <div style={errorStyle}>{error}</div>;

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2 style={titleStyle}>Supplier Management</h2>
        <p style={subtitleStyle}>Manage all registered suppliers</p>
      </div>

      {suppliers.length === 0 ? (
        <div style={loadingStyle}>
          <p>No suppliers found</p>
        </div>
      ) : (
        <div>
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
              disabled={filteredSuppliers.length === 0}
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
              disabled={filteredSuppliers.length === 0}
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
                <th style={thStyle}>Company</th>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Phone</th>
                <th style={thStyle}>District</th>
                <th style={thStyle}>Password</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ ...tdStyle, textAlign: 'center', padding: '24px' }}>
                    No matching results
                  </td>
                </tr>
              ) : (
              filteredSuppliers.map((supplier) => (
                <tr
                  key={supplier._id}
                  style={trStyle}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background =
                      "linear-gradient(90deg, #f8f9ff 0%, #f0f2ff 100%)";
                    e.currentTarget.style.transform = "scale(1.01)";
                    e.currentTarget.style.boxShadow =
                      "0 5px 15px rgba(0, 0, 0, 0.08)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <td style={firstTdStyle}>{supplier._id}</td>
                  <td style={tdStyle}>{supplier.role}</td>
                  <td style={tdStyle}>{supplier.companyName}</td>
                  <td style={tdStyle}>{supplier.name}</td>
                  <td style={tdStyle}>{supplier.email}</td>
                  <td style={tdStyle}>{supplier.phone}</td>
                  <td style={tdStyle}>{supplier.district}</td>
                  <td style={tdStyle}>{supplier.password}</td>
                  <td style={tdStyle}>
                    <div style={actionButtonsStyle}>
                      <button
                        onClick={() => handleUpdate(supplier._id)}
                        style={updateButtonStyle}
                      >
                        Update
                      </button>
                      <button
                        onClick={() => handleDelete(supplier._id)}
                        style={deleteButtonStyle}
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

export default DisplayAllSuppliers;
