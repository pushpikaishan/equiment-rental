import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post("http://localhost:5000/auth/login", { email, password });
      const { id, role } = res.data;

      // Navigate based on role
      if (role === "user") navigate(`/user-profile/${id}`);
      else if (role === "admin") navigate(`/user-profile/${id}`);
      else if (role === "staff") navigate(`/user-profile/${id}`);
      else if (role === "supplier") navigate(`/user-profile/${id}`);
      else alert("Unknown role");
    } catch (err) {
      console.error("Login failed:", err);
      alert("Invalid email or password");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required />
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required />
      <button type="submit">Login</button>
    </form>
  );
}

export default Login;
