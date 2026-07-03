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

  const printableRows = (rows = []) => filterRows(rows);

  const printBalanceSheet = () => {
    const printWindow = window.open("", "_blank", "width=900,height=700");

    if (!printWindow) {
      alert("Popup blocked. Please allow popups to print this report.");
      return;
    }

    const assets = printableRows(report?.assets?.accounts);
    const liabilities = printableRows(report?.liabilities?.accounts);
    const equity = printableRows(report?.equity?.accounts);

    const rowHtml = (rows) =>
      rows
        .map(
          (row) => `
            <tr>
              <td>${row.accountCode}</td>
              <td>${row.accountName}</td>
              <td class="amount">${money(row.amount)}</td>
            </tr>
          `
        )
        .join("");

    const sectionHtml = (title, rows, totalLabel, total) => `
      <h2>${title}</h2>
      <table>
        <tbody>
          ${
            rows.length > 0
              ? rowHtml(rows)
              : `<tr><td colspan="3" class="muted">No accounts to display.</td></tr>`
          }
          <tr class="total-row">
            <td colspan="2">${totalLabel}</td>
            <td class="amount">${money(total)}</td>
          </tr>
        </tbody>
      </table>
    `;

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>Eltham Konnect Balance Sheet</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 36px;
              color: #0f172a;
            }

            .header {
              text-align: center;
              border-bottom: 2px solid #0B3D91;
              padding-bottom: 16px;
              margin-bottom: 24px;
            }

            h1 {
              margin: 0;
              font-size: 28px;
              color: #0B3D91;
            }

            h2 {
              margin: 24px 0 8px;
              color: #0B3D91;
              font-size: 18px;
            }

            .subtitle {
              margin-top: 8px;
              color: #475569;
              font-size: 13px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 18px;
            }

            td {
              padding: 8px 6px;
              border-bottom: 1px solid #e5e7eb;
              font-size: 13px;
            }

            .amount {
              text-align: right;
              font-weight: bold;
            }

            .total-row td {
              background: #eef4ff;
              font-weight: bold;
              border-top: 2px solid #0B3D91;
            }

            .equation {
              margin-top: 28px;
              padding: 14px;
              border: 2px solid ${
                report?.totals?.isBalanced ? "#16a34a" : "#dc2626"
              };
              color: ${report?.totals?.isBalanced ? "#16a34a" : "#dc2626"};
              font-weight: bold;
              display: flex;
              justify-content: space-between;
            }

            .footer {
              margin-top: 32px;
              border-top: 1px solid #cbd5e1;
              padding-top: 10px;
              color: #64748b;
              font-size: 12px;
              text-align: center;
            }

            .muted {
              color: #64748b;
              text-align: center;
            }

            @media print {
              button {
                display: none;
              }
            }
          </style>
        </head>

        <body>
          <div class="header">
            <h1>ELTHAM KONNECT</h1>
            <h2>Balance Sheet</h2>
            <div class="subtitle">
              As of ${toDate || "Today"} · Generated ${new Date().toLocaleString()}
            </div>
            <div class="subtitle">
              Source of Truth: General Ledger
            </div>
          </div>

          ${sectionHtml("Assets", assets, "TOTAL ASSETS", report?.assets?.total)}

          ${sectionHtml("Liabilities", liabilities, "TOTAL LIABILITIES", report?.liabilities?.total)}

          ${sectionHtml("Equity", equity, "TOTAL EQUITY", report?.equity?.total)}

          <div class="equation">
            <span>ACCOUNTING EQUATION</span>
            <span>Assets ${
              report?.totals?.isBalanced ? "=" : "≠"
            } Liabilities + Equity</span>
          </div>

          <table>
            <tbody>
              <tr>
                <td>Total Assets</td>
                <td class="amount">${money(report?.totals?.totalAssets)}</td>
              </tr>
              <tr>
                <td>Total Liabilities + Equity</td>
                <td class="amount">${money(report?.totals?.liabilitiesPlusEquity)}</td>
              </tr>
              <tr>
                <td>Difference</td>
                <td class="amount">${money(report?.totals?.difference)}</td>
              </tr>
            </tbody>
          </table>

          <div class="footer">
            Generated by EKOS Corporate Finance
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

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
        <Card title="Liabilities + Equity" amount={report?.totals?.liabilitiesPlusEquity} color="#16a34a" />
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

          <button type="button" onClick={printBalanceSheet} style={buttonStyle("#64748b")}>
            Print / PDF
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
          padding: "20px",
          marginBottom: "20px",
          display: "flex",
          justifyContent: "space-between",
          gap: "14px",
          flexWrap: "wrap",
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
                <td style={{ width: "160px", fontWeight: "bold" }}>{row.accountCode}</td>
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