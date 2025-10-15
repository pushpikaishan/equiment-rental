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
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundImage: "linear-gradient(rgba(15, 23, 42, 0.45), rgba(15, 23, 42, 0.45)), url('/logback.png')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      padding: 20,
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    }}>
      <div style={{
        width: "100%",
        maxWidth: 650,
        display: "flex",
        flexDirection: "column",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderRadius: 24,
        boxShadow: "0 25px 50px rgba(0,0,0,0.15)",
        overflow: "hidden",
        border: "1px solid rgba(255, 255, 255, 0.2)",
        //background: "rgba(255,255,255,0.7)"
      }}>
        <div style={{
          padding: 28,
          //background: "linear-gradient(135deg, rgba(59,130,246,0.9) 0%, rgba(29,78,216,0.9) 100%)",
          color: "#fff",
          borderBottom: "1px solid rgba(255,255,255,0.35)",
          textAlign: "center"
        }}>
          <div style={{
            width: 60,
            height: 60,
            borderRadius: "50%",
            background: "#1d2d47",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 12px",
            border: "1px solid rgba(255,255,255,0.45)"
          }}>
            <img
              src={`${process.env.PUBLIC_URL}/favicon.ico`}
              alt="Eventrix logo"
              style={{ width: 28, height: 28 }}
              onError={(e) => { e.currentTarget.src = `${process.env.PUBLIC_URL}/logo192.png`; }}
            />
          </div>
          <h2 style={{ margin: 0 }}>{step === 1 ? "Forgot Password" : "Enter Code & New Password"}</h2>
        </div>
        <div style={{ padding: 28 }}>
          <div style={{ marginBottom: 16 }}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: "100%", padding: 12, borderRadius: 10, border: "2px solid rgba(226,232,240,0.9)", background: "rgba(248,249,250,0.8)" }}
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
                  style={{ width: "100%", padding: 12, borderRadius: 10, border: "2px solid rgba(226,232,240,0.9)", background: "rgba(248,249,250,0.8)" }}
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <input
                  type="password"
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ width: "100%", padding: 12, borderRadius: 10, border: "2px solid rgba(226,232,240,0.9)", background: "rgba(248,249,250,0.8)" }}
                />
              </div>
            </>
          )}
          <button
            onClick={step === 1 ? requestCode : resetPassword}
            disabled={loading}
            style={{ width: "100%", padding: 14, background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)", color: "#fff", border: 0, borderRadius: 10, fontWeight: 600, boxShadow: "0 10px 25px rgba(59,130,246,0.35)" }}
          >
            {loading ? "Please wait..." : step === 1 ? "Send Code" : "Change Password"}
          </button>
          {step === 2 && (
            <button
              onClick={requestCode}
              disabled={loading}
              style={{ marginTop: 10, width: "100%", padding: 12, background: "rgba(243,244,246,0.85)", color: "#111827", border: 0, borderRadius: 10 }}
            >
              Resend code
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
