import { useEffect, useState } from "react";
import api from "../api";

function BalanceSheet() {
  const [report, setReport] = useState(null);

  const ROYAL_BLUE = "#0B3D91";
  const BORDER = "#dbe3ef";
  const MUTED = "#64748b";

  const loadReport = async () => {
    try {
      const res = await api.get("/api/accounting/balance-sheet");
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

  const rows = (items = []) =>
    items.length > 0 ? (
      items.map((item) => (
        <tr key={item.accountCode}>
          <td>{item.accountCode} - {item.accountName}</td>
          <td>{item.accountType || "—"}</td>
          <td style={{ textAlign: "right" }}>{money(item.balance)}</td>
        </tr>
      ))
    ) : (
      <tr>
        <td style={{ color: MUTED }}>No records</td>
        <td>—</td>
        <td style={{ textAlign: "right" }}>—</td>
      </tr>
    );

  return (
    <div>
      <h1 style={{ margin: 0 }}>Balance Sheet</h1>
      <p style={{ marginTop: "6px", color: MUTED }}>
        Corporate financial position report generated from Chart of Accounts balances.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "14px",
          margin: "18px 0",
        }}
      >
        <Card>
          <h2 style={{ color: ROYAL_BLUE, margin: 0 }}>
            {money(report?.totals?.totalAssets)}
          </h2>
          <p style={{ fontWeight: "bold" }}>Total Assets</p>
        </Card>

        <Card>
          <h2 style={{ color: "#dc2626", margin: 0 }}>
            {money(report?.totals?.totalLiabilities)}
          </h2>
          <p style={{ fontWeight: "bold" }}>Total Liabilities</p>
        </Card>

        <Card>
          <h2 style={{ color: "#7c3aed", margin: 0 }}>
            {money(report?.totals?.totalEquity)}
          </h2>
          <p style={{ fontWeight: "bold" }}>Total Equity</p>
        </Card>

        <Card>
          <h2
            style={{
              color: report?.totals?.isBalanced ? "#16a34a" : "#dc2626",
              margin: 0,
            }}
          >
            {report?.totals?.isBalanced ? "BALANCED" : "OUT OF BALANCE"}
          </h2>
          <p style={{ fontWeight: "bold" }}>
            Difference: {money(report?.totals?.accountingDifference)}
          </p>
        </Card>
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
          {report?.reportTitle || "Balance Sheet"}
        </h2>

        <p style={{ color: MUTED }}>
          Generated: {report?.generatedAt ? new Date(report.generatedAt).toLocaleString() : "—"}
        </p>

        <ReportTable
          title="Assets"
          rowsContent={rows(report?.assets)}
          totalLabel="Total Assets"
          totalAmount={report?.totals?.totalAssets}
        />

        <ReportTable
          title="Liabilities"
          rowsContent={rows(report?.liabilities)}
          totalLabel="Total Liabilities"
          totalAmount={report?.totals?.totalLiabilities}
        />

        <ReportTable
          title="Equity"
          rowsContent={rows(report?.equity)}
          totalLabel="Total Equity"
          totalAmount={report?.totals?.totalEquity}
        />

        <div
          style={{
            marginTop: "18px",
            padding: "14px",
            borderRadius: "10px",
            backgroundColor: "#f8fafc",
            border: `1px solid ${BORDER}`,
            display: "flex",
            justifyContent: "space-between",
            fontWeight: "bold",
            color: report?.totals?.isBalanced ? "#16a34a" : "#dc2626",
            fontSize: "18px",
          }}
        >
          <span>Accounting Equation Check</span>
          <span>
            Assets - Liabilities - Equity = {money(report?.totals?.accountingDifference)}
          </span>
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
        <thead style={{ backgroundColor: "#eef4ff" }}>
          <tr>
            <th>Account</th>
            <th>Type</th>
            <th style={{ textAlign: "right" }}>Balance</th>
          </tr>
        </thead>

        <tbody>{rowsContent}</tbody>

        <tfoot>
          <tr style={{ backgroundColor: "#f8fafc", fontWeight: "bold" }}>
            <td colSpan="2">{totalLabel}</td>
            <td style={{ textAlign: "right" }}>
              JMD {Number(totalAmount || 0).toLocaleString()}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function Card({ children }) {
  return (
    <div
      style={{
        backgroundColor: "white",
        border: "1px solid #dbe3ef",
        borderRadius: "12px",
        padding: "18px",
      }}
    >
      {children}
    </div>
  );
}

export default BalanceSheet;