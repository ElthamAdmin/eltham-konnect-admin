import { Link } from "react-router-dom";

function Home() {
  return (
    <div style={{ fontFamily: "Arial, sans-serif" }}>
      {/* HERO */}
      <div
        style={{
          background: "#0B3D91",
          color: "white",
          padding: "60px 20px",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: "42px", marginBottom: "10px" }}>
          Eltham Konnect Logistics
        </h1>

        <p style={{ fontSize: "18px", maxWidth: "600px", margin: "0 auto" }}>
          Fast, reliable, and affordable shipping from the USA to Jamaica.
          Your Konnection, Our Priority.
        </p>

        <div style={{ marginTop: "20px" }}>
          <Link to="/login">
            <button
              style={{
                background: "#D4AF37",
                border: "none",
                padding: "12px 20px",
                fontWeight: "bold",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              Login to Your Account
            </button>
          </Link>
        </div>
      </div>

      {/* ABOUT */}
      <div style={{ padding: "40px 20px", textAlign: "center" }}>
        <h2>Why Choose Eltham Konnect?</h2>

        <p style={{ maxWidth: "700px", margin: "10px auto", color: "#475569" }}>
          We provide dependable freight forwarding services, helping Jamaicans
          shop internationally and receive their packages safely and quickly.
        </p>
      </div>

      {/* FEATURES */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "20px",
          padding: "20px",
        }}
      >
        {[
          "Fast Delivery",
          "Secure Handling",
          "Affordable Rates",
          "Real-Time Tracking",
        ].map((item) => (
          <div
            key={item}
            style={{
              background: "#f4f7fb",
              padding: "20px",
              borderRadius: "12px",
            }}
          >
            <h3>{item}</h3>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Home;