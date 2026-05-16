import { useState } from "react";
import api from "../api";

function ClosePeriod() {
  const [closing, setClosing] = useState(false);

  const closePeriod = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to close this accounting period? This will move current net profit/loss into Retained Earnings."
    );

    if (!confirmed) return;

    try {
      setClosing(true);

      const res = await api.post("/api/accounting/close-period");

      alert(
        `${res.data.message}\n\nNet Income Closed: JMD ${Number(
          res.data.netIncome || 0
        ).toLocaleString()}`
      );
    } catch (error) {
      console.error("Close period error:", error);
      alert(error?.response?.data?.message || "Could not close accounting period.");
    } finally {
      setClosing(false);
    }
  };

  return (
    <div>
      <h1>Close Accounting Period</h1>

      <div
        style={{
          backgroundColor: "white",
          padding: "22px",
          borderRadius: "12px",
          border: "1px solid #dbe3ef",
          maxWidth: "760px",
        }}
      >
        <h2 style={{ color: "#0B3D91", marginTop: 0 }}>
          Retained Earnings Closing
        </h2>

        <p>
          This process closes temporary Profit & Loss accounts and transfers net
          profit or loss into Retained Earnings.
        </p>

        <p style={{ color: "#dc2626", fontWeight: "bold" }}>
          Only run this at month-end or year-end after reviewing your reports.
        </p>

        <button
          onClick={closePeriod}
          disabled={closing}
          style={{
            backgroundColor: closing ? "#94a3b8" : "#0B3D91",
            color: "white",
            border: "none",
            padding: "12px 18px",
            borderRadius: "8px",
            cursor: closing ? "not-allowed" : "pointer",
            fontWeight: "bold",
          }}
        >
          {closing ? "Closing Period..." : "Close Accounting Period"}
        </button>
      </div>
    </div>
  );
}

export default ClosePeriod;