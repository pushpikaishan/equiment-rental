import React, { useEffect, useState } from "react";
import axios from "axios";

function UserProfile() {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await axios.get("http://localhost:5000/auth/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(res.data);
      } catch (err) {
        console.error("Error fetching profile:", err.response?.data || err.message);
      }
    };

    fetchProfile();
  }, []);

  if (!profile) return <p>Loading...</p>;

  // Dynamic fields based on role
  const commonFields = [
    { label: "Name", value: profile.name },
    { label: "Email", value: profile.email },
    { label: "Role", value: profile.role },
  ];

  // Optional fields for different roles
  let extraFields = [];

  switch (profile.role) {
    case "user":
      extraFields = [
        { label: "NIC", value: profile.nic },
        { label: "Phone", value: profile.phoneno },
        { label: "District", value: profile.district },
      ];
      break;
    case "staff":
      extraFields = [
        { label: "Phone", value: profile.phoneno },
        { label: "NIC", value: profile.nicNo },
      ];
      break;
    case "supplier":
      extraFields = [
        { label: "Company Name", value: profile.companyName },
        { label: "Phone", value: profile.phone },
        { label: "District", value: profile.district },
      ];
      break;
    case "admin":
      extraFields = []; // Admin only has name, email, role
      break;
    default:
      extraFields = [];
  }

  return (
    <div>
      <h2>{profile.role.toUpperCase()} Profile</h2>
      {commonFields.concat(extraFields).map((field) => (
        <p key={field.label}>
          <strong>{field.label}:</strong> {field.value || "N/A"}
        </p>
      ))}
    </div>
  );
}

export default UserProfile;
