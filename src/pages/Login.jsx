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
        backgroundColor: "#f4f7fb",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          backgroundColor: "#0B3D91",
          color: "white",
          padding: "22px 24px",
          display: "flex",
          alignItems: "center",
          gap: "14px",
        }}
      >
        <div style={{ fontSize: "34px" }}>☰</div>

        <div>
          <div style={{ fontSize: "24px", fontWeight: "900" }}>
            Eltham Konnect
          </div>
          <div style={{ fontSize: "14px", opacity: 0.9 }}>
            Admin Portal
          </div>
        </div>
      </div>

      <div style={{ padding: "28px 18px" }}>
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "22px",
            padding: "26px",
            border: "1px solid #dbe3ef",
            boxShadow: "0 8px 24px rgba(15,23,42,0.08)",
            maxWidth: "520px",
            margin: "0 auto",
          }}
        >
          <h1
            style={{
              marginTop: 0,
              marginBottom: "8px",
              color: "#0f172a",
              fontSize: "34px",
              lineHeight: 1.1,
            }}
          >
            Admin Login
          </h1>

          <p style={{ marginTop: 0, marginBottom: "24px", color: "#64748b" }}>
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
                boxSizing: "border-box",
                padding: "15px",
                borderRadius: "14px",
                border: "1px solid #cbd5e1",
                marginBottom: "18px",
                fontSize: "16px",
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
                boxSizing: "border-box",
                padding: "15px",
                borderRadius: "14px",
                border: "1px solid #cbd5e1",
                marginBottom: "20px",
                fontSize: "16px",
              }}
            />

            <button
              type="submit"
              disabled={busy}
              style={{
                width: "100%",
                padding: "15px",
                borderRadius: "14px",
                border: "none",
                backgroundColor: busy ? "#94a3b8" : "#0B3D91",
                color: "white",
                cursor: busy ? "not-allowed" : "pointer",
                fontWeight: "900",
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
    </div>
  );
}