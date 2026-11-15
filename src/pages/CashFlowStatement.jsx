import { useEffect, useRef, useState } from "react";
import api from "../api";

const BLUE = "#0B3D91";
const BORDER = "#dbe3ef";
const MUTED = "#64748b";

const panel = {
  backgroundColor: "white",
  border: `1px solid ${BORDER}`,
  borderRadius: "12px",
  padding: "18px",
  marginBottom: "18px",
};

const button = {
  backgroundColor: BLUE,
  color: "white",
  border: "none",
  padding: "10px 16px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
};

const money = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    !Number.isFinite(Number(value))
  ) {
    return "Not available";
  }

  return `JMD ${Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const jamaicaToday = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Jamaica",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  return ["year", "month", "day"]
    .map((type) => parts.find((part) => part.type === type).value)
    .join("-");
};

const initialDates = () => {
  const today = jamaicaToday();

  return {
    from: `${today.slice(0, 7)}-01`,
    to: today,
  };
};

function CashFlowStatement() {
  const [dates, setDates] = useState(initialDates);
  const [statement, setStatement] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const requestId = useRef(0);

  const loadStatement = async (selectedDates) => {
    const id = ++requestId.current;

    setError("");
    setStatement(null);

    if (
      !selectedDates.to ||
      (
        selectedDates.from &&
        selectedDates.from > selectedDates.to
      )
    ) {
      setLoading(false);
      setError("Select an ending date on or after the starting date.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.get("/api/cash-flow/statement", {
        params: selectedDates,
      });

      if (id !== requestId.current) return;

      const data = response.data?.data;

      if (!data?.totals || !data?.filters) {
        throw new Error("The report response is incomplete.");
      }

      setStatement(data);
    } catch (failure) {
      if (id !== requestId.current) return;

      setError(
        failure?.response?.data?.message ||
          failure.message ||
          "Could not load cash movements."
      );
    } finally {
      if (id === requestId.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadStatement(initialDates());

    return () => {
      requestId.current += 1;
    };
  }, []);

  const changeDate = (event) => {
    requestId.current += 1;

    setDates((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));

    setStatement(null);
    setError("");
    setLoading(false);
  };

  const totals = statement?.totals;
  const issues = statement?.diagnostics?.issues || [];

  return (
    <div>
      <h1 style={{ margin: 0 }}>Cash Flow — Ledger Movements</h1>

      <p style={{ color: MUTED }}>
        Review recorded cash/bank receipts, payments, and balances in JMD.
        Internal transfers are shown separately.
      </p>

      <div style={panel}>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            loadStatement(dates);
          }}
          style={{
            display: "flex",
            gap: "14px",
            alignItems: "end",
            flexWrap: "wrap",
          }}
        >
          <label>
            From — blank for all recorded history
            <input
              type="date"
              name="from"
              value={dates.from}
              onChange={changeDate}
              style={{ display: "block", padding: "9px", marginTop: "6px" }}
            />
          </label>

          <label>
            Through
            <input
              required
              type="date"
              name="to"
              value={dates.to}
              onChange={changeDate}
              style={{ display: "block", padding: "9px", marginTop: "6px" }}
            />
          </label>

          <button type="submit" disabled={loading} style={button}>
            {loading ? "Loading…" : "Load / Refresh Report"}
          </button>
        </form>
      </div>

      {error && (
        <div role="alert" style={{ ...panel, color: "#b91c1c" }}>
          {error}
        </div>
      )}

      {loading && <p role="status">Loading recorded cash movements…</p>}

      {!statement && !loading && !error && (
        <p>Select the reporting dates and load the report.</p>
      )}

      {statement && (
        <>
          <div style={{ ...panel, backgroundColor: "#fffbeb" }}>
            <strong>
              {statement.filters.from || "All recorded history"}
              {" through "}
              {statement.filters.to}
            </strong>

            <p>{statement.diagnostics?.basis}</p>
            <p>{statement.diagnostics?.accountScope}</p>

            <p>
              Opening and closing amounts are recorded ledger balances,
              not independently verified available bank balances.
            </p>

            <p>
              Operating, investing, and financing classifications have
              not been verified. Bank reconciliation remains outstanding.
            </p>

            {statement.diagnostics?.outOfBalance && (
              <p style={{ color: "#b91c1c", fontWeight: "bold" }}>
                The underlying trial balance does not balance.
                Review the accounting records before relying on this report.
              </p>
            )}

            {issues.length > 0 && (
              <details>
                <summary>Recorded-data review items ({issues.length})</summary>
                <ul>
                  {issues.map((issue) => (
                    <li key={issue.code}>
                      {issue.message}
                      {issue.count > 1 ? ` (${issue.count})` : ""}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
              gap: "14px",
            }}
          >
            {[
              ["Cash receipts", totals.totalInflows],
              ["Cash payments", totals.totalOutflows],
              ["Net recorded movement", totals.netCashFlow],
              ["Internal transfers — excluded above", totals.internalTransfers],
            ].map(([label, value]) => (
              <div key={label} style={panel}>
                <strong>{label}</strong>
                <h2 style={{ color: BLUE }}>{money(value)}</h2>
              </div>
            ))}
          </div>

          <div style={panel}>
            <h2 style={{ marginTop: 0, color: BLUE }}>
              Recorded cash/bank balances
            </h2>

            <p>Opening ledger balance: <strong>{money(totals.openingBalance)}</strong></p>
            <p>Net recorded movement: <strong>{money(totals.netCashFlow)}</strong></p>
            <p>Closing ledger balance: <strong>{money(totals.closingBalance)}</strong></p>

            {(statement.cashAccounts || []).length === 0 ? (
              <p>No cash/bank ledger accounts were identified.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={cell}>Account</th>
                      <th style={cell}>Closing ledger balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statement.cashAccounts.map((account) => (
                      <tr key={account.accountCode}>
                        <td style={cell}>
                          {account.accountCode} — {account.accountName}
                        </td>
                        <td style={cell}>{money(account.currentBalance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <MovementTable
            title="Recorded cash receipts"
            rows={statement.inflows || []}
          />

          <MovementTable
            title="Recorded cash payments"
            rows={statement.outflows || []}
          />
        </>
      )}
    </div>
  );
}

const cell = {
  border: `1px solid ${BORDER}`,
  padding: "10px",
  textAlign: "left",
};

function MovementTable({ title, rows }) {
  return (
    <div style={panel}>
      <h2 style={{ marginTop: 0, color: BLUE }}>{title}</h2>

      {!rows.length ? (
        <p>No movements recorded in this section for the selected period.</p>
      ) : (
        <div style={{ overflowX: "auto", maxHeight: "450px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Date", "Journal", "Account", "Reference", "Amount"].map(
                  (heading) => <th key={heading} style={cell}>{heading}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={`${row.ledgerNumber || row.entryNumber}-${index}`}>
                  <td style={cell}>{row.day || row.entryDate || "—"}</td>
                  <td style={cell}>{row.entryNumber || "—"}</td>
                  <td style={cell}>
                    {row.accountCode} — {row.accountName}
                  </td>
                  <td style={cell}>{row.reference || "—"}</td>
                  <td style={cell}>{money(row.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default CashFlowStatement;