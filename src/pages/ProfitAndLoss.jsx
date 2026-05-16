import { useEffect, useState } from "react";
import api from "../api";

function ProfitAndLoss() {
  const [report, setReport] = useState(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const ROYAL_BLUE = "#0B3D91";
  const BORDER = "#dbe3ef";
  const MUTED = "#64748b";

  const loadReport = async () => {
    try {
      const res = await api.get("/api/accounting/profit-loss", {
        params: { from, to },
      });

      setReport(res.data.data);
    } catch (error) {
      console.error("Profit and loss error:", error);
      alert(error?.response?.data?.message || "Could not load Profit & Loss report.");
    }
  };

  useEffect(() => {
    loadReport();
  }, []);

  const money = (value) => `JMD ${Number(value || 0).toLocaleString()}`;

  const rows = (items = []) =>
    items.length > 0 ? (
      items.map((item) => (
        <tr key={item.account}>
          <td>{item.account}</td>
          <td style={{ textAlign: "right" }}>{money(item.amount)}</td>
        </tr>
      ))
    ) : (
      <tr>
        <td style={{ color: MUTED }}>No records</td>
        <td style={{ textAlign: "right" }}>—</td>
      </tr>
    );

  return (
    <div>
      <h1 style={{ margin: 0 }}>Profit & Loss Statement</h1>
      <p style={{ marginTop: "6px", color: MUTED }}>
        Corporate income statement generated from the General Ledger.
      </p>

      <div
        style={{
          backgroundColor: "white",
          border: `1px solid ${BORDER}`,
          borderRadius: "12px",
          padding: "16px",
          margin: "18px 0",
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <strong>Date Filter:</strong>

        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          style={inputStyle(BORDER)}
        />

        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          style={inputStyle(BORDER)}
        />

        <button
          onClick={loadReport}
          style={{
            backgroundColor: ROYAL_BLUE,
            color: "white",
            border: "none",
            padding: "10px 16px",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Refresh
        </button>
      </div>

      <div
        style={{
          backgroundColor: "white",
          border: `1px solid ${BORDER}`,
          borderRadius: "12px",
          padding: "18px",
        }}
      >
        <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>
          {report?.reportTitle || "Profit and Loss Statement"}
        </h2>

        <p style={{ color: MUTED }}>
          Generated: {report?.generatedAt ? new Date(report.generatedAt).toLocaleString() : "—"}
        </p>

        <ReportTable title="Revenue" rowsContent={rows(report?.revenue)} totalLabel="Total Revenue" totalAmount={report?.totals?.totalRevenue} />

        <ReportTable title="Cost of Sales" rowsContent={rows(report?.costOfSales)} totalLabel="Total Cost of Sales" totalAmount={report?.totals?.totalCostOfSales} />

        <div style={totalLine("#0B3D91")}>
          <span>Gross Profit</span>
          <span>{money(report?.totals?.grossProfit)}</span>
        </div>

        <ReportTable title="Operating Expenses" rowsContent={rows(report?.expenses)} totalLabel="Total Expenses" totalAmount={report?.totals?.totalExpenses} />

        <div
          style={{
            ...totalLine(report?.totals?.netProfit >= 0 ? "#16a34a" : "#dc2626"),
            fontSize: "20px",
          }}
        >
          <span>Net Profit / Loss</span>
          <span>{money(report?.totals?.netProfit)}</span>
        </div>
      </div>
    </div>
  );
}

function ReportTable({ title, rowsContent, totalLabel, totalAmount }) {
  return (
    <div style={{ marginTop: "22px" }}>
      <h3>{title}</h3>

      <table
        border="1"
        cellPadding="10"
        style={{
          width: "100%",
          borderCollapse: "collapse",
          borderColor: "#dbe3ef",
        }}
      >
        <tbody>{rowsContent}</tbody>

        <tfoot>
          <tr style={{ backgroundColor: "#f8fafc", fontWeight: "bold" }}>
            <td>{totalLabel}</td>
            <td style={{ textAlign: "right" }}>
              JMD {Number(totalAmount || 0).toLocaleString()}
            </td>
          </tr>
        </tfoot>
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

function totalLine(color) {
  return {
    marginTop: "18px",
    padding: "14px",
    borderRadius: "10px",
    backgroundColor: "#f8fafc",
    border: "1px solid #dbe3ef",
    display: "flex",
    justifyContent: "space-between",
    fontWeight: "bold",
    color,
  };
}

export default ProfitAndLoss;