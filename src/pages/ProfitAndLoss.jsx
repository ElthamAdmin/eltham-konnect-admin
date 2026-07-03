import { useEffect, useState } from "react";
import api from "../api";

function ProfitLoss() {
  const [report, setReport] = useState(null);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const loadReport = async () => {
    try {
      const params = new URLSearchParams();

      if (fromDate) params.append("from", fromDate);
      if (toDate) params.append("to", toDate);

      const res = await api.get(
        `/api/profit-and-loss?${params.toString()}`
      );

      setReport(res.data.data);
    } catch (error) {
      console.error(error);
      alert(
        error?.response?.data?.message ||
          "Could not load Profit & Loss."
      );
    }
  };

  useEffect(() => {
    loadReport();
  }, []);

  const money = (v) =>
    `JMD ${Number(v || 0).toLocaleString()}`;

  const Card = ({ title, amount, color }) => (
    <div
      style={{
        background: "white",
        border: "1px solid #dbe3ef",
        borderRadius: 12,
        padding: 20,
      }}
    >
      <h2
        style={{
          color,
          margin: 0,
        }}
      >
        {money(amount)}
      </h2>

      <p
        style={{
          marginTop: 8,
          fontWeight: "bold",
        }}
      >
        {title}
      </p>
    </div>
  );

  return (
    <div>

      <h1>Eltham Konnect</h1>

      <h2
        style={{
          color: "#0B3D91",
          marginTop: 0,
        }}
      >
        Profit & Loss Statement
      </h2>

      <p>
        Source of Truth:
        <b> General Ledger</b>
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(220px,1fr))",
          gap: 15,
          marginBottom: 20,
        }}
      >
        <Card
          title="Revenue"
          amount={report?.revenue?.total}
          color="#16a34a"
        />

        <Card
          title="Gross Profit"
          amount={report?.grossProfit}
          color="#0B3D91"
        />

        <Card
          title="Operating Expenses"
          amount={report?.operatingExpenses?.total}
          color="#ea580c"
        />

        <Card
          title="Net Profit"
          amount={report?.netProfit}
          color={
            Number(report?.netProfit || 0) >= 0
              ? "#16a34a"
              : "#dc2626"
          }
        />
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 20,
        }}
      >
        <input
          type="date"
          value={fromDate}
          onChange={(e) =>
            setFromDate(e.target.value)
          }
        />

        <input
          type="date"
          value={toDate}
          onChange={(e) =>
            setToDate(e.target.value)
          }
        />

        <button onClick={loadReport}>
          Apply
        </button>
      </div>

      <Section
        title="Revenue"
        rows={report?.revenue?.accounts}
        total={report?.revenue?.total}
      />

      <Section
        title="Cost of Sales"
        rows={report?.costOfSales?.accounts}
        total={report?.costOfSales?.total}
      />

      <Section
        title="Operating Expenses"
        rows={report?.operatingExpenses?.accounts}
        total={report?.operatingExpenses?.total}
      />

      <SummaryRow
        label="Gross Profit"
        value={report?.grossProfit}
      />

      <SummaryRow
        label="Net Profit"
        value={report?.netProfit}
      />
    </div>
  );
}

function Section({
  title,
  rows = [],
  total,
}) {
  const money = (v) =>
    `JMD ${Number(v || 0).toLocaleString()}`;

  return (
    <div
      style={{
        background: "white",
        marginBottom: 20,
        padding: 20,
        borderRadius: 12,
        border: "1px solid #dbe3ef",
      }}
    >
      <h3
        style={{
          color: "#0B3D91",
        }}
      >
        {title}
      </h3>

      <table
        width="100%"
        cellPadding="8"
      >
        <tbody>
          {rows.map((row) => (
            <tr key={row.accountCode}>
              <td>{row.accountCode}</td>

              <td>{row.accountName}</td>

              <td
                style={{
                  textAlign: "right",
                  fontWeight: "bold",
                }}
              >
                {money(row.amount)}
              </td>
            </tr>
          ))}

          <tr
            style={{
              fontWeight: "bold",
              borderTop: "2px solid #ccc",
            }}
          >
            <td colSpan="2">
              TOTAL
            </td>

            <td
              style={{
                textAlign: "right",
              }}
            >
              {money(total)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function SummaryRow({
  label,
  value,
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        fontWeight: "bold",
        fontSize: 22,
        marginBottom: 10,
      }}
    >
      <span>{label}</span>

      <span>
        JMD {Number(value || 0).toLocaleString()}
      </span>
    </div>
  );
}

export default ProfitLoss;