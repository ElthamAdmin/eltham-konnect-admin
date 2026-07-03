import { useEffect, useState } from "react";
import api from "../api";

import { useEffect, useMemo, useState } from "react";
import api from "../api";

function ProfitLoss() {
  const [report, setReport] = useState(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showZeroBalances, setShowZeroBalances] = useState(false);

  const ROYAL_BLUE = "#0B3D91";
  const BORDER = "#dbe3ef";
  const MUTED = "#64748b";

  const loadReport = async () => {
    try {
      const params = new URLSearchParams();

      if (fromDate) params.append("from", fromDate);
      if (toDate) params.append("to", toDate);

      const res = await api.get(`/api/profit-and-loss?${params.toString()}`);
      setReport(res.data.data);
    } catch (error) {
      console.error(error);
      alert(error?.response?.data?.message || "Could not load Profit & Loss.");
    }
  };

  useEffect(() => {
    loadReport();
  }, []);

  const money = (value) => `JMD ${Number(value || 0).toLocaleString()}`;

  const marginPercent = useMemo(() => {
    const revenue = Number(report?.revenue?.total || 0);
    const netProfit = Number(report?.netProfit || 0);
    if (!revenue) return "0%";
    return `${((netProfit / revenue) * 100).toFixed(2)}%`;
  }, [report]);

  const filterRows = (rows = []) =>
    showZeroBalances ? rows : rows.filter((row) => Number(row.amount || 0) !== 0);

  return (
    <div>
      <div style={{ marginBottom: "22px" }}>
        <h1 style={{ margin: 0 }}>Eltham Konnect</h1>

        <h2 style={{ margin: "4px 0 0", color: ROYAL_BLUE }}>
          Profit & Loss Statement
        </h2>

        <p style={{ marginTop: "6px", color: MUTED }}>
          For period: <b>{fromDate || "Beginning"}</b> to <b>{toDate || "Today"}</b>
          {" "}· Generated: <b>{new Date().toLocaleString()}</b>
        </p>

        <p style={{ marginTop: "6px", color: MUTED }}>
          Source of Truth: <b>General Ledger</b>
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          marginBottom: "18px",
        }}
      >
        <Card title="Revenue" amount={report?.revenue?.total} color="#16a34a" />
        <Card title="Gross Profit" amount={report?.grossProfit} color={ROYAL_BLUE} />
        <Card title="Operating Expenses" amount={report?.operatingExpenses?.total} color="#ea580c" />
        <Card
          title="Net Profit"
          amount={report?.netProfit}
          color={Number(report?.netProfit || 0) >= 0 ? "#16a34a" : "#dc2626"}
        />
        <Card title="Net Margin" amount={marginPercent} color={ROYAL_BLUE} isPercent />
      </div>

      <div
        style={{
          backgroundColor: "white",
          border: `1px solid ${BORDER}`,
          borderRadius: "12px",
          padding: "18px",
          marginBottom: "18px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "12px",
          }}
        >
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={inputStyle(BORDER)} />
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} style={inputStyle(BORDER)} />

          <button type="button" onClick={loadReport} style={buttonStyle("#16a34a")}>
            Apply
          </button>

          <button
            type="button"
            onClick={() => setShowZeroBalances((prev) => !prev)}
            style={buttonStyle(showZeroBalances ? "#64748b" : ROYAL_BLUE)}
          >
            {showZeroBalances ? "Hide Zero Balances" : "Show Zero Balances"}
          </button>

          <button type="button" onClick={() => window.print()} style={buttonStyle("#64748b")}>
            Print
          </button>
        </div>
      </div>

      <Section title="Revenue" rows={filterRows(report?.revenue?.accounts)} total={report?.revenue?.total} color="#16a34a" />

      <Section title="Cost of Sales" rows={filterRows(report?.costOfSales?.accounts)} total={report?.costOfSales?.total} color="#f59e0b" />

      <div style={summaryStyle(ROYAL_BLUE)}>
        <span>GROSS PROFIT</span>
        <span>{money(report?.grossProfit)}</span>
      </div>

      <Section title="Operating Expenses" rows={filterRows(report?.operatingExpenses?.accounts)} total={report?.operatingExpenses?.total} color="#ea580c" />

      <div style={summaryStyle(Number(report?.netProfit || 0) >= 0 ? "#16a34a" : "#dc2626")}>
        <span>NET PROFIT</span>
        <span>{money(report?.netProfit)}</span>
      </div>
    </div>
  );
}

function Card({ title, amount, color, isPercent = false }) {
  return (
    <div
      style={{
        backgroundColor: "white",
        border: "1px solid #dbe3ef",
        borderRadius: "12px",
        padding: "18px",
      }}
    >
      <h2 style={{ margin: 0, color }}>
        {isPercent ? amount : `JMD ${Number(amount || 0).toLocaleString()}`}
      </h2>
      <p style={{ marginBottom: 0, fontWeight: "bold" }}>{title}</p>
    </div>
  );
}

function Section({ title, rows = [], total, color }) {
  const money = (value) => `JMD ${Number(value || 0).toLocaleString()}`;

  return (
    <div
      style={{
        backgroundColor: "white",
        border: "1px solid #dbe3ef",
        borderRadius: "12px",
        padding: "18px",
        marginBottom: "20px",
      }}
    >
      <h2 style={{ marginTop: 0, color }}>{title}</h2>

      <table width="100%" cellPadding="10" style={{ borderCollapse: "collapse" }}>
        <tbody>
          {rows.length > 0 ? (
            rows.map((row) => (
              <tr key={row.accountCode} style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ width: "140px", fontWeight: "bold" }}>{row.accountCode}</td>
                <td>{row.accountName}</td>
                <td style={{ textAlign: "right", fontWeight: "bold" }}>{money(row.amount)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="3" style={{ color: "#64748b", textAlign: "center" }}>
                No accounts to display.
              </td>
            </tr>
          )}

          <tr style={{ backgroundColor: "#eef4ff", fontWeight: "bold" }}>
            <td colSpan="2">TOTAL {title.toUpperCase()}</td>
            <td style={{ textAlign: "right" }}>{money(total)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function inputStyle(border) {
  return {
    padding: "10px",
    borderRadius: "8px",
    border: `1px solid ${border}`,
  };
}

function buttonStyle(backgroundColor) {
  return {
    backgroundColor,
    color: "white",
    border: "none",
    padding: "10px",
    borderRadius: "8px",
    fontWeight: "bold",
    cursor: "pointer",
  };
}

function summaryStyle(color) {
  return {
    backgroundColor: "white",
    border: "1px solid #dbe3ef",
    borderRadius: "12px",
    padding: "18px",
    marginBottom: "20px",
    display: "flex",
    justifyContent: "space-between",
    fontSize: "24px",
    fontWeight: "bold",
    color,
  };
}

export default ProfitLoss;