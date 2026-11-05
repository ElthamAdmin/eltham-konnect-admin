import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api";

function useLoginAppearance() {
  const [branding, setBranding] = useState(null);

  useEffect(() => {
    let stopped = false;
    let timer;
    let controller;
    let generation = 0;

    const refresh = async () => {
      const requestId = ++generation;

      clearTimeout(timer);
      controller?.abort();
      controller = new AbortController();

      let delay = 30000;

      try {
        // Use the public endpoint without sending a stored staff token.
        const url = new URL(
          "/api/settings/login-appearance/public/admin",
          api.defaults.baseURL || window.location.origin
        );

        const response = await fetch(url, {
          cache: "no-store",
          credentials: "omit",
          signal: controller.signal,
        });

        if (!response.ok) throw new Error("Appearance unavailable.");

        const result = await response.json();
        const data = result?.data;

        if (!result?.success || !data) {
          throw new Error("Appearance unavailable.");
        }

        if (stopped || requestId !== generation) return;

        if (data.nextChangeAt && data.serverTime) {
          const remaining =
            Date.parse(data.nextChangeAt) - Date.parse(data.serverTime);

          if (Number.isFinite(remaining) && remaining > 0) {
            delay = Math.min(30000, Math.max(500, remaining + 100));
          }
        }

        const appearance = data.appearance;

        if (!data.active || !appearance?.wallpaperUrl) {
          setBranding(null);
        } else {
          setBranding({
            companyName: data.companyName || "Eltham Konnect",
            ...appearance,
          });
        }
      } catch {
        if (!stopped && requestId === generation) {
          // Appearance failures must never prevent staff from logging in.
          setBranding(null);
        }
      } finally {
        if (!stopped && requestId === generation) {
          timer = window.setTimeout(refresh, delay);
        }
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };

    refresh();
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stopped = true;
      generation += 1;
      clearTimeout(timer);
      controller?.abort();
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return branding;
}

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const appearance = useLoginAppearance();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [failedImage, setFailedImage] = useState("");
  const submitting = useRef(false);

  const onSubmit = async (event) => {
    event.preventDefault();

    if (submitting.current) return;

    if (!email.trim() || !password) {
      setError("Enter your staff email and password.");
      return;
    }

    submitting.current = true;
    setBusy(true);
    setError("");

    try {
      await login(email.trim(), password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || "Login failed. Try again.");
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  };

  const imageUrl = appearance?.wallpaperUrl || "";
  const displayImage = Boolean(imageUrl) && failedImage !== imageUrl;

  const overlay = Math.min(
    0.85,
    Math.max(0, Number(appearance?.overlayOpacity) || 0)
  );

  return (
    <main
      className={`ek-admin-login ${
        appearance ? "ek-admin-login-seasonal" : ""
      }`}
    >
      <style>{`
        .ek-admin-login {
          min-height:100vh;
          background:#f4f7fb;
          color:#0f172a;
          font-family:Arial,sans-serif;
        }
        .ek-admin-login * {
          box-sizing:border-box;
        }
        .ek-admin-login-header {
          padding:20px 28px;
          background:#0b3d91;
          color:#fff;
        }
        .ek-admin-login-header strong {
          display:block;
          font-size:24px;
        }
        .ek-admin-login-header span {
          display:block;
          margin-top:4px;
          font-size:13px;
        }
        .ek-admin-login-layout {
          max-width:1500px;
          margin:auto;
          padding:28px;
          display:grid;
          grid-template-columns:minmax(0,1fr);
          justify-items:center;
          align-items:center;
          gap:28px;
        }
        .ek-admin-login-seasonal .ek-admin-login-layout {
          grid-template-columns:minmax(0,1fr) minmax(300px,380px);
          align-items:start;
        }
        .ek-admin-login-seasonal {
          background:#eaf0f8;
        }
        .ek-admin-login-feature {
          width:100%;
          min-width:0;
        }
        .ek-admin-login-announcement {
          background:#0b3d91;
          color:#fff;
          border-radius:16px;
          padding:22px;
          margin-bottom:18px;
          overflow-wrap:anywhere;
        }
        .ek-admin-login-announcement h1 {
          color:#fff;
          font-size:clamp(24px,3vw,36px);
          margin:0 0 10px;
        }
        .ek-admin-login-announcement p {
          margin:0;
          white-space:pre-wrap;
          font-size:17px;
          line-height:1.7;
        }
        .ek-admin-login-art {
          position:relative;
          isolation:isolate;
          overflow:hidden;
          border-radius:16px;
          background:#10254a;
        }
        .ek-admin-login-art img {
          display:block;
          width:100%;
          height:auto;
          max-height:calc(100vh - 150px);
          object-fit:contain;
        }
        .ek-admin-login-card {
          width:100%;
          max-width:380px;
          background:#fff;
          border:1px solid #dbe3ef;
          border-radius:18px;
          padding:24px;
          box-shadow:0 8px 24px rgba(15,23,42,.08);
        }
        .ek-admin-login-card h2 {
          margin:0 0 8px;
          color:#0f172a;
          font-size:28px;
        }
        .ek-admin-login-description {
          margin:0 0 20px;
          color:#475569;
          font-size:14px;
          line-height:1.6;
        }
        .ek-admin-login-card label {
          display:block;
          margin-bottom:7px;
          font-size:14px;
          font-weight:bold;
        }
        .ek-admin-login-card input {
          display:block;
          width:100%;
          min-width:0;
          min-height:46px;
          padding:12px;
          border:1px solid #cbd5e1;
          border-radius:9px;
          background:#fff;
          color:#0f172a;
          font:inherit;
          font-size:16px;
        }
        .ek-admin-login-field {
          margin-bottom:16px;
        }
        .ek-admin-login-password {
          display:flex;
          gap:8px;
        }
        .ek-admin-login-password input {
          flex:1;
        }
        .ek-admin-login-card button {
          min-height:44px;
          font:inherit;
          font-weight:bold;
          cursor:pointer;
          border-radius:9px;
        }
        .ek-admin-login-show {
          padding:0 10px;
          border:1px solid #cbd5e1;
          background:#f8fafc;
          color:#0f172a;
        }
        .ek-admin-login-submit {
          width:100%;
          padding:12px;
          border:0;
          background:#0b3d91;
          color:#fff;
        }
        .ek-admin-login-card button:disabled {
          opacity:.6;
          cursor:default;
        }
        .ek-admin-login-card input:focus-visible,
        .ek-admin-login-card button:focus-visible {
          outline:3px solid #f15a24;
          outline-offset:2px;
        }
        .ek-admin-login-error {
          padding:12px;
          border-radius:9px;
          background:#fef2f2;
          color:#991b1b;
          line-height:1.5;
        }
        @media(max-width:760px) {
          .ek-admin-login-header {
            padding:16px 18px;
          }
          .ek-admin-login-layout {
            padding:18px 14px 28px;
            gap:20px;
          }
          .ek-admin-login-seasonal .ek-admin-login-layout {
            grid-template-columns:minmax(0,1fr);
          }
          .ek-admin-login-art img {
            max-height:none;
          }
          .ek-admin-login-announcement {
            padding:18px;
          }
          .ek-admin-login-card {
            padding:22px;
          }
        }
      `}</style>

      <header className="ek-admin-login-header">
        <strong>{appearance?.companyName || "Eltham Konnect"}</strong>
        <span>Admin Portal</span>
      </header>

      <div className="ek-admin-login-layout">
        {appearance && (
          <section
            className="ek-admin-login-feature"
            aria-label="Staff announcement"
          >
            {(appearance.heading || appearance.message) && (
              <div className="ek-admin-login-announcement">
                {appearance.heading && <h1>{appearance.heading}</h1>}
                {appearance.message && <p>{appearance.message}</p>}
              </div>
            )}

            {displayImage && (
              <div className="ek-admin-login-art">
                <img
                  src={imageUrl}
                  alt="Eltham Konnect seasonal announcement"
                  style={{
                    objectPosition: appearance.position || "center",
                  }}
                  onError={() => setFailedImage(imageUrl)}
                />

                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    background: `rgba(0,0,0,${overlay})`,
                  }}
                />
              </div>
            )}
          </section>
        )}

        <section
          className="ek-admin-login-card"
          aria-labelledby="admin-login-title"
        >
          <h2 id="admin-login-title">Admin Login</h2>

          <p className="ek-admin-login-description">
            Enter your staff email and password to begin your shift.
          </p>

          <form onSubmit={onSubmit} aria-busy={busy}>
            <div className="ek-admin-login-field">
              <label htmlFor="admin-login-email">Email</label>

              <input
                id="admin-login-email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="staff@elthamkonnect.com"
                required
                readOnly={busy}
              />
            </div>

            <div className="ek-admin-login-field">
              <label htmlFor="admin-login-password">Password</label>

              <div className="ek-admin-login-password">
                <input
                  id="admin-login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Your password"
                  required
                  readOnly={busy}
                />

                <button
                  type="button"
                  className="ek-admin-login-show"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((previous) => !previous)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {error && (
              <p role="alert" className="ek-admin-login-error">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="ek-admin-login-submit"
              disabled={busy}
            >
              {busy ? "Logging in…" : "Login"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}