import { useEffect, useState } from "react";
import api from "../api";

function CashFlowStatement() {
  const [statement, setStatement] = useState(null);

  const ROYAL_BLUE = "#0B3D91";
  const BORDER = "#dbe3ef";
  const MUTED = "#64748b";

  const loadStatement = async () => {
    try {
      const res = await api.get("/api/cash-flow/statement");
      setStatement(res.data.data);
    } catch (error) {
      console.error("Cash flow statement error:", error);
      alert(error?.response?.data?.message || "Could not load Cash Flow Statement.");
    }
  };

  useEffect(() => {
    loadStatement();
  }, []);

  const money = (value) => `JMD ${Number(value || 0).toLocaleString()}`;

  return (
    <div>
      <h1 style={{ margin: 0 }}>Cash Flow Statement</h1>
      <p style={{ marginTop: "6px", color: MUTED }}>
        Corporate cash movement report generated from EKOS cashbook transactions.
      </p>

      <button
        onClick={loadStatement}
        style={{
          backgroundColor: ROYAL_BLUE,
          color: "white",
          border: "none",
          padding: "10px 16px",
          borderRadius: "8px",
          cursor: "pointer",
          fontWeight: "bold",
          margin: "18px 0",
        }}
      >
        Refresh Statement
      </button>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "14px",
          marginBottom: "18px",
        }}
      >
        <Card>
          <h2 style={{ color: "#16a34a", margin: 0 }}>
            {money(statement?.operatingActivities?.net)}
          </h2>
          <p style={{ fontWeight: "bold" }}>Net Operating Cash Flow</p>
        </Card>

        <Card>
          <h2 style={{ color: "#7c3aed", margin: 0 }}>
            {money(statement?.investingActivities?.net)}
          </h2>
          <p style={{ fontWeight: "bold" }}>Net Investing Cash Flow</p>
        </Card>

        <Card>
          <h2 style={{ color: "#f59e0b", margin: 0 }}>
            {money(statement?.financingActivities?.net)}
          </h2>
          <p style={{ fontWeight: "bold" }}>Net Financing Cash Flow</p>
        </Card>

        <Card>
          <h2
            style={{
              color: Number(statement?.netCashMovement || 0) >= 0 ? "#16a34a" : "#dc2626",
              margin: 0,
            }}
          >
            {money(statement?.netCashMovement)}
          </h2>
          <p style={{ fontWeight: "bold" }}>Net Cash Movement</p>
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
          Statement of Cash Flows
        </h2>

        <ReportSection
          title="Operating Activities"
          rows={[
            ["Cash received from customers", statement?.operatingActivities?.inflows],
            ["Cash paid for expenses/payroll", -Number(statement?.operatingActivities?.outflows || 0)],
          ]}
          totalLabel="Net Cash from Operating Activities"
          totalAmount={statement?.operatingActivities?.net}
        />

        <ReportSection
          title="Investing Activities"
          rows={[
            ["Cash received from asset sales", statement?.investingActivities?.inflows],
            ["Cash paid for asset purchases", -Number(statement?.investingActivities?.outflows || 0)],
          ]}
          totalLabel="Net Cash from Investing Activities"
          totalAmount={statement?.investingActivities?.net}
        />

        <ReportSection
          title="Financing Activities"
          rows={[
            ["Cash received from loans / financing", statement?.financingActivities?.inflows],
            ["Cash paid for loans / credit cards", -Number(statement?.financingActivities?.outflows || 0)],
          ]}
          totalLabel="Net Cash from Financing Activities"
          totalAmount={statement?.financingActivities?.net}
        />

        <div style={summaryLine(BORDER, ROYAL_BLUE)}>
          <span>Opening Cash Balance</span>
          <span>{money(statement?.openingCashBalance)}</span>
        </div>

        <div style={summaryLine(BORDER, ROYAL_BLUE)}>
          <span>Net Cash Movement</span>
          <span>{money(statement?.netCashMovement)}</span>
        </div>

        <div
          style={{
            ...summaryLine(BORDER, "#16a34a"),
            fontSize: "20px",
          }}
        >
          <span>Closing Cash Balance</span>
          <span>{money(statement?.closingCashBalance)}</span>
        </div>
      </div>
    </div>
  );
}

function ReportSection({ title, rows, totalLabel, totalAmount }) {
  const money = (value) => `JMD ${Number(value || 0).toLocaleString()}`;

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
        <tbody>
          {rows.map(([label, amount]) => (
            <tr key={label}>
              <td>{label}</td>
              <td style={{ textAlign: "right" }}>{money(amount)}</td>
            </tr>
          ))}
        </tbody>

        <tfoot>
          <tr style={{ backgroundColor: "#f8fafc", fontWeight: "bold" }}>
            <td>{totalLabel}</td>
            <td style={{ textAlign: "right" }}>{money(totalAmount)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function summaryLine(border, color) {
  return {
    marginTop: "14px",
    padding: "14px",
    borderRadius: "10px",
    backgroundColor: "#f8fafc",
    border: `1px solid ${border}`,
    display: "flex",
    justifyContent: "space-between",
    fontWeight: "bold",
    color,
  };
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

export default CashFlowStatement;