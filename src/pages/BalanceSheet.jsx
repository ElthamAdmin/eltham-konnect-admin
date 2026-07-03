import { useEffect, useState } from "react";
import api from "../api";

function BalanceSheet() {
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

      const res = await api.get(`/api/balance-sheet?${params.toString()}`);
      setReport(res.data.data);
    } catch (error) {
      console.error("Balance sheet error:", error);
      alert(error?.response?.data?.message || "Could not load Balance Sheet.");
    }
  };

  useEffect(() => {
    loadReport();
  }, []);

  const money = (value) => `JMD ${Number(value || 0).toLocaleString()}`;

  const filterRows = (rows = []) =>
    showZeroBalances ? rows : rows.filter((row) => Number(row.amount || 0) !== 0);

  return (
    <div>
      <div style={{ marginBottom: "22px" }}>
        <h1 style={{ margin: 0 }}>Eltham Konnect</h1>

        <h2 style={{ margin: "4px 0 0", color: ROYAL_BLUE }}>
          Balance Sheet
        </h2>

        <p style={{ marginTop: "6px", color: MUTED }}>
          As of: <b>{toDate || "Today"}</b>
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
        <Card title="Total Assets" amount={report?.totals?.totalAssets} color={ROYAL_BLUE} />
        <Card title="Total Liabilities" amount={report?.totals?.totalLiabilities} color="#dc2626" />
        <Card title="Total Equity" amount={report?.totals?.totalEquity} color="#7c3aed" />
        <Card
          title="Liabilities + Equity"
          amount={report?.totals?.liabilitiesPlusEquity}
          color="#16a34a"
        />
        <Card
          title="Difference"
          amount={report?.totals?.difference}
          color={Number(report?.totals?.difference || 0) === 0 ? "#16a34a" : "#dc2626"}
        />
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

      <StatementSection
        title="Assets"
        rows={filterRows(report?.assets?.accounts)}
        totalLabel="TOTAL ASSETS"
        total={report?.assets?.total}
        color={ROYAL_BLUE}
      />

      <StatementSection
        title="Liabilities"
        rows={filterRows(report?.liabilities?.accounts)}
        totalLabel="TOTAL LIABILITIES"
        total={report?.liabilities?.total}
        color="#dc2626"
      />

      <StatementSection
        title="Equity"
        rows={filterRows(report?.equity?.accounts)}
        totalLabel="TOTAL EQUITY"
        total={report?.equity?.total}
        color="#7c3aed"
      />

      <div
        style={{
          backgroundColor: "white",
          border: `1px solid ${BORDER}`,
          borderRadius: "12px",
          padding: "18px",
          marginBottom: "20px",
          display: "flex",
          justifyContent: "space-between",
          fontSize: "24px",
          fontWeight: "bold",
          color: report?.totals?.isBalanced ? "#16a34a" : "#dc2626",
        }}
      >
        <span>ACCOUNTING EQUATION</span>
        <span>
          Assets {report?.totals?.isBalanced ? "=" : "≠"} Liabilities + Equity
        </span>
      </div>
    </div>
  );
}

function Card({ title, amount, color }) {
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
        JMD {Number(amount || 0).toLocaleString()}
      </h2>
      <p style={{ marginBottom: 0, fontWeight: "bold" }}>{title}</p>
    </div>
  );
}

function StatementSection({ title, rows = [], totalLabel, total, color }) {
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
            <td colSpan="2">{totalLabel}</td>
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

export default BalanceSheet;