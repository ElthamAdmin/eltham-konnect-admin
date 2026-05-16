import { useEffect, useMemo, useState } from "react";
import api from "../api";

function TrialBalance() {
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);

  const ROYAL_BLUE = "#0B3D91";
  const BORDER = "#dbe3ef";
  const MUTED = "#64748b";

  const loadTrialBalance = async () => {
    try {
      const res = await api.get("/api/trial-balance");

      setRows(res.data.data || []);
      setSummary(res.data);
    } catch (error) {
      console.error("Trial balance error:", error);
      alert(
        error?.response?.data?.message ||
          "Could not load trial balance."
      );
    }
  };

  useEffect(() => {
    loadTrialBalance();
  }, []);

  const money = (value) =>
    `JMD ${Number(value || 0).toLocaleString()}`;

  const activeRows = useMemo(() => {
    return rows.filter(
      (row) =>
        Number(row.debit || 0) !== 0 ||
        Number(row.credit || 0) !== 0
    );
  }, [rows]);

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ margin: 0 }}>Trial Balance</h1>

        <p style={{ marginTop: "6px", color: MUTED }}>
          Corporate accounting balance verification for EKOS Finance.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          marginBottom: "18px",
        }}
      >
        <Card>
          <h2 style={{ color: "#16a34a", margin: 0 }}>
            {money(summary?.totalDebit)}
          </h2>

          <p style={{ fontWeight: "bold" }}>
            Total Debits
          </p>
        </Card>

        <Card>
          <h2 style={{ color: "#dc2626", margin: 0 }}>
            {money(summary?.totalCredit)}
          </h2>

          <p style={{ fontWeight: "bold" }}>
            Total Credits
          </p>
        </Card>

        <Card>
          <h2
            style={{
              color:
                summary?.balanced
                  ? "#16a34a"
                  : "#dc2626",
              margin: 0,
            }}
          >
            {summary?.balanced
              ? "BALANCED"
              : "OUT OF BALANCE"}
          </h2>

          <p style={{ fontWeight: "bold" }}>
            Accounting Status
          </p>
        </Card>

        <Card>
          <h2 style={{ color: ROYAL_BLUE, margin: 0 }}>
            {money(summary?.difference)}
          </h2>

          <p style={{ fontWeight: "bold" }}>
            Difference
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
          Trial Balance Accounts
        </h2>

        <div
          style={{
            overflowX: "auto",
            border: `1px solid ${BORDER}`,
            borderRadius: "12px",
          }}
        >
          <table
            border="1"
            cellPadding="10"
            style={{
              width: "100%",
              minWidth: "1200px",
              borderCollapse: "collapse",
              borderColor: BORDER,
            }}
          >
            <thead
              style={{
                backgroundColor: "#eef4ff",
              }}
            >
              <tr>
                <th>Code</th>
                <th>Account Name</th>
                <th>Category</th>
                <th>Type</th>
                <th>Normal Balance</th>
                <th>Debit</th>
                <th>Credit</th>
              </tr>
            </thead>

            <tbody>
              {activeRows.length > 0 ? (
                activeRows.map((row) => (
                  <tr key={row.accountCode}>
                    <td style={{ fontWeight: "bold" }}>
                      {row.accountCode}
                    </td>

                    <td>{row.accountName}</td>

                    <td>{row.category}</td>

                    <td>{row.accountType}</td>

                    <td>{row.normalBalance}</td>

                    <td>
                      {Number(row.debit || 0) > 0
                        ? money(row.debit)
                        : "—"}
                    </td>

                    <td>
                      {Number(row.credit || 0) > 0
                        ? money(row.credit)
                        : "—"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="7"
                    style={{
                      textAlign: "center",
                      color: MUTED,
                    }}
                  >
                    No trial balance data available.
                  </td>
                </tr>
              )}
            </tbody>

            <tfoot
              style={{
                backgroundColor: "#f8fafc",
                fontWeight: "bold",
              }}
            >
              <tr>
                <td colSpan="5">TOTALS</td>

                <td>{money(summary?.totalDebit)}</td>

                <td>{money(summary?.totalCredit)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
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

export default TrialBalance;