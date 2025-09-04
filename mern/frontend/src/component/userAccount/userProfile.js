import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

function UserProfile() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`http://localhost:5000/getall/${id}`)
      .then(res => {
        setUser(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <h2 style={{
        textAlign: 'center',
        color: '#666',
        fontSize: '24px',
        marginTop: '50px'
      }}>
        Loading...
      </h2>
    );
  }

  if (!user) {
    return (
      <h2 style={{
        textAlign: 'center',
        color: '#d32f2f',
        fontSize: '24px',
        marginTop: '50px'
      }}>
        User not found
      </h2>
    );
  }

  return (
    <div style={{
      maxWidth: '600px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f9f9f9',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    }}>
      <h1 style={{
        color: '#333',
        textAlign: 'center',
        marginBottom: '30px',
        fontSize: '28px',
        borderBottom: '2px solid #764ba2',
        paddingBottom: '10px'
      }}>
        {user.role} Profile
      </h1>

      <div style={{ marginBottom: '20px' }}>
        {user.companyName && (
          <p style={{
            marginBottom: '15px',
            fontSize: '16px',
            lineHeight: '1.5'
          }}>
            <strong style={{ color: '#555', minWidth: '100px', display: 'inline-block' }}>
              Company:
            </strong> 
            {user.companyName}
          </p>
        )}

        <p style={{
          marginBottom: '15px',
          fontSize: '16px',
          lineHeight: '1.5'
        }}>
          <strong style={{ color: '#555', minWidth: '100px', display: 'inline-block' }}>
            Name:
          </strong> 
          {user.name}
        </p>

        <p style={{
          marginBottom: '15px',
          fontSize: '16px',
          lineHeight: '1.5'
        }}>
          <strong style={{ color: '#555', minWidth: '100px', display: 'inline-block' }}>
            Email:
          </strong> 
          {user.email}
        </p>

        {user.nic && (
          <p style={{
            marginBottom: '15px',
            fontSize: '16px',
            lineHeight: '1.5'
          }}>
            <strong style={{ color: '#555', minWidth: '100px', display: 'inline-block' }}>
              NIC:
            </strong> 
            {user.nic}
          </p>
        )}

        {user.phoneno && (
          <p style={{
            marginBottom: '15px',
            fontSize: '16px',
            lineHeight: '1.5'
          }}>
            <strong style={{ color: '#555', minWidth: '100px', display: 'inline-block' }}>
              Phone:
            </strong> 
            {user.phoneno}
          </p>
        )}

        {user.district && (
          <p style={{
            marginBottom: '15px',
            fontSize: '16px',
            lineHeight: '1.5'
          }}>
            <strong style={{ color: '#555', minWidth: '100px', display: 'inline-block' }}>
              Address:
            </strong> 
            {user.district}
          </p>
        )}
      </div>

        <button style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: '#ffffff',
          padding: '14px 32px',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: '600',
          cursor: 'pointer',
          display: 'block',
          margin: '0 auto',
          transition: 'all 0.3s ease',
          boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
          minWidth: '160px'
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'translateY(-2px)';
          e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
        }}
        >
          Edit Profile
        </button>
      </div>
  );
}

export default UserProfile;