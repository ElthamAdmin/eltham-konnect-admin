import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);

    try {
      await login(email.trim(), password);
      navigate("/", { replace: true });
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Login failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        backgroundColor: "#eef2f7",
        padding: "20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "520px",
          backgroundColor: "white",
          borderRadius: "12px",
          border: "1px solid #e5e7eb",
          padding: "26px",
        }}
      >
        <h1 style={{ marginTop: 0, marginBottom: "6px", color: "#1f3552" }}>
          Eltham Konnect Admin Login
        </h1>
        <p style={{ marginTop: 0, marginBottom: "18px", color: "#64748b" }}>
          Enter your staff email and password to begin your shift.
        </p>

        <form onSubmit={onSubmit}>
          <label style={{ display: "block", fontWeight: "bold", marginBottom: "8px" }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="staff@elthamkonnect.com"
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              marginBottom: "14px",
            }}
          />

          <label style={{ display: "block", fontWeight: "bold", marginBottom: "8px" }}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              marginBottom: "18px",
            }}
          />

          <button
            type="submit"
            disabled={busy}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "10px",
              border: "none",
              backgroundColor: busy ? "#94a3b8" : "#0B3D91",
              color: "white",
              cursor: busy ? "not-allowed" : "pointer",
              fontWeight: "bold",
              fontSize: "16px",
            }}
          >
            {busy ? "Logging in..." : "Login"}
          </button>
        </form>

        <div style={{ marginTop: "18px", color: "#64748b", fontSize: "13px" }}>
          Admin tip: Create staff users in <strong>System Users</strong> with passwords, then share their login details.
        </div>
      </div>
    </div>
  );
}