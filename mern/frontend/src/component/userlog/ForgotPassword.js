import React, { useState } from "react";
import axios from "axios";

export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const API = "http://localhost:5000/auth";

  const requestCode = async () => {
    if (!email) return alert("Enter your email");
    setLoading(true);
    try {
      // First, check if the email exists in any collection
      const res = await axios.post(`${API}/check-email`, { email });
      if (!res.data?.exists) {
        alert("No account found for this email.");
        return;
      }
      await axios.post(`${API}/forgot-password`, { email });
      alert("Code sent to your email");
      setStep(2);
    } catch (e) {
      alert(e.response?.data?.msg || "Failed to send code");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!code || !newPassword) return alert("Enter code and new password");
    setLoading(true);
    try {
      await axios.post(`${API}/reset-password`, { email, code, newPassword });
      alert("Password updated. You can login now.");
      window.location.href = "/userlog";
    } catch (e) {
      alert(e.response?.data?.msg || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20, fontFamily: "Segoe UI, Tahoma, Geneva, Verdana, sans-serif"
    }}>
      <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 20px 40px rgba(0,0,0,0.1)", width: "100%", maxWidth: 420 }}>
        <div style={{ padding: 28, background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "#fff" }}>
          <h2 style={{ margin: 0 }}>{step === 1 ? "Forgot Password" : "Enter Code & New Password"}</h2>
        </div>
        <div style={{ padding: 28 }}>
          <div style={{ marginBottom: 16 }}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
              disabled={step === 2}
            />
          </div>
          {step === 2 && (
            <>
              <div style={{ marginBottom: 12 }}>
                <input
                  placeholder="6-digit code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <input
                  type="password"
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
                />
              </div>
            </>
          )}
          <button
            onClick={step === 1 ? requestCode : resetPassword}
            disabled={loading}
            style={{ width: "100%", padding: 12, background: "#667eea", color: "#fff", border: 0, borderRadius: 8, fontWeight: 600 }}
          >
            {loading ? "Please wait..." : step === 1 ? "Send Code" : "Change Password"}
          </button>
          {step === 2 && (
            <button
              onClick={requestCode}
              disabled={loading}
              style={{ marginTop: 8, width: "100%", padding: 10, background: "#f3f4f6", color: "#111827", border: 0, borderRadius: 8 }}
            >
              Resend code
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
