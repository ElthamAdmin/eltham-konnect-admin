import {
  useEffect,
  useRef,
  useState,
} from "react";

import api from "../api";

const BLUE = "#0B3D91";
const BORDER = "#dbe3ef";

const panel = {
  backgroundColor: "white",
  border: `1px solid ${BORDER}`,
  borderRadius: 12,
  padding: 18,
  marginBottom: 18,
};

const grid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit,minmax(210px,1fr))",
  gap: 14,
};

const control = {
  display: "block",
  width: "100%",
  padding: 10,
  marginTop: 5,
  boxSizing: "border-box",
  border: `1px solid ${BORDER}`,
  borderRadius: 8,
};

const button = {
  backgroundColor: BLUE,
  color: "white",
  border: "none",
  borderRadius: 8,
  padding: "10px 14px",
  margin: "12px 10px 0 0",
  cursor: "pointer",
  fontWeight: "bold",
};

const cell = {
  border: `1px solid ${BORDER}`,
  padding: 10,
  textAlign: "left",
};

const money = (value) =>
  value === null ||
  value === undefined ||
  value === "" ||
  !Number.isFinite(Number(value))
    ? "Not available"
    : `JMD ${Number(value).toLocaleString(
        undefined,
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }
      )}`;

const jamaicaToday = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Jamaica",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  return ["year", "month", "day"]
    .map(
      (key) =>
        parts.find((part) => part.type === key).value
    )
    .join("-");
};

const initialFilters = () => ({
  to: jamaicaToday(),
  branch: "",
  entityCode: "",
});

function BalanceSheet() {
  const [report, setReport] = useState(null);
  const [filters, setFilters] =
    useState(initialFilters);

  const [showZeroBalances, setShowZeroBalances] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loadedAt, setLoadedAt] = useState("");

  const requestId = useRef(0);
  const printRef = useRef(null);

  const loadReport = async (selected) => {
    const id = ++requestId.current;

    setReport(null);
    setError("");

    if (!selected.to) {
      setLoading(false);
      setError("Select an as-of date.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.get(
        "/api/balance-sheet",
        { params: selected }
      );

      if (id !== requestId.current) return;

      const data = response.data?.data;

      if (
        !data?.filters ||
        !data?.totals ||
        ![
          data.assets,
          data.liabilities,
          data.equity,
        ].every(
          (section) =>
            Array.isArray(section?.accounts)
        )
      ) {
        throw new Error(
          "The Balance Sheet response is incomplete."
        );
      }

      setReport(data);

      setLoadedAt(
        new Intl.DateTimeFormat("en-JM", {
          timeZone: "America/Jamaica",
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date())
      );
    } catch (failure) {
      if (id === requestId.current) {
        setError(
          failure?.response?.data?.message ||
            failure.message ||
            "Could not load Balance Sheet."
        );
      }
    } finally {
      if (id === requestId.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadReport(initialFilters());

    return () => {
      requestId.current += 1;
    };
  }, []);

  const changeFilter = (event) => {
    requestId.current += 1;

    setFilters((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));

    setReport(null);
    setError("");
    setLoading(false);
  };

  const filterRows = (rows = []) =>
    showZeroBalances
      ? rows
      : rows.filter(
          (row) =>
            row.amount === null ||
            row.amount === undefined ||
            !Number.isFinite(Number(row.amount)) ||
            Number(row.amount) !== 0
        );

  const printBalanceSheet = () => {
    if (!report || loading || !printRef.current) {
      return;
    }

    const printWindow = window.open(
      "",
      "_blank",
      "width=1000,height=750"
    );

    if (!printWindow) {
      setError(
        "Popup blocked. Allow popups to print this report."
      );
      return;
    }

    printWindow.opener = null;

    printWindow.document.open();

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Balance Sheet</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              color: #0f172a;
              padding: 24px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              min-width: 0 !important;
            }

            tr {
              break-inside: avoid;
            }

            div {
              max-height: none !important;
              overflow: visible !important;
            }

            .bs-cards {
              display: none !important;
            }

            @media print {
              body {
                padding: 0;
                font-size: 11px;
              }
            }
          </style>
        </head>
        <body></body>
      </html>
    `);

    printWindow.document.close();

    printWindow.document.title =
      `Balance Sheet — ${report.filters.to}`;

    const copy = printRef.current.cloneNode(true);

    copy.querySelectorAll("details").forEach(
      (details) => {
        details.open = true;
      }
    );

    printWindow.document.body.appendChild(copy);

    printWindow.focus();

    window.setTimeout(() => {
      if (!printWindow.closed) {
        printWindow.print();
      }
    }, 150);
  };

  const diagnostics = report?.diagnostics || {};

  const issues = diagnostics.issues || [];

  const unclassified =
    diagnostics.unclassifiedAccounts || [];

  return (
    <div>
      <h1 style={{ color: BLUE }}>
        Balance Sheet
      </h1>

      <p>
        Review cumulative recorded assets,
        liabilities and equity in JMD as of one date.
      </p>

      <form
        style={panel}
        onSubmit={(event) => {
          event.preventDefault();
          loadReport(filters);
        }}
      >
        <div style={grid}>
          <label>
            As of
            <input
              required
              type="date"
              name="to"
              value={filters.to}
              onChange={changeFilter}
              style={control}
            />
          </label>

          <label>
            Branch
            <select
              name="branch"
              value={filters.branch}
              onChange={changeFilter}
              style={control}
            >
              <option value="">All branches</option>
              <option>Eltham Park Mainstore</option>
              <option>
                Brown&apos;s Town Square
              </option>
            </select>
          </label>

          <label>
            Business entity code — optional
            <input
              name="entityCode"
              value={filters.entityCode}
              onChange={changeFilter}
              maxLength={120}
              placeholder="Blank includes all recorded identities"
              style={control}
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={button}
        >
          {loading
            ? "Loading…"
            : "Load / Refresh Report"}
        </button>

        <button
          type="button"
          disabled={!report || loading}
          onClick={() =>
            setShowZeroBalances(
              (previous) => !previous
            )
          }
          style={button}
        >
          {showZeroBalances
            ? "Hide Zero Balances"
            : "Show Zero Balances"}
        </button>

        <button
          type="button"
          disabled={!report || loading}
          onClick={printBalanceSheet}
          style={button}
        >
          Print / PDF
        </button>
      </form>

      {error && (
        <div
          role="alert"
          style={{
            ...panel,
            color: "#b91c1c",
          }}
        >
          {error}
        </div>
      )}

      {loading && (
        <p role="status">
          Loading recorded balances…
        </p>
      )}

      {!report && !loading && !error && (
        <p>
          Load the selected filters to view the report.
        </p>
      )}

      {report && (
        <div ref={printRef}>
          <h2 style={{ color: BLUE }}>
            Balance Sheet — as of{" "}
            {report.filters.to}
          </h2>

          <p>
            Source: General Ledger.
            {" "}Loaded: {loadedAt} Jamaica time.
          </p>

          <p>
            Branch:{" "}
            {report.filters.branch ||
              "All branches"}.
            {" "}Business:{" "}
            {report.filters.entityCode ||
              "All recorded identities, including unassigned records"}.
          </p>

          <p>
            Zero-balance rows are{" "}
            {showZeroBalances
              ? "displayed"
              : "hidden"}.
            {" "}Section totals include all classified
            accounts.
          </p>

          <div
            style={{
              ...panel,
              backgroundColor: "#fffbeb",
            }}
          >
            <p>{diagnostics.basis}</p>

            <p>
              {diagnostics.classificationBasis}
            </p>

            <p>{diagnostics.earningsBasis}</p>

            <p>
              A branch or business filter excludes
              records without matching attribution.
              A balanced equation does not establish
              completeness or bank reconciliation.
            </p>

            {diagnostics.trialBalanceIsBalanced ===
              false && (
              <p
                style={{
                  color: "#b91c1c",
                  fontWeight: "bold",
                }}
              >
                The underlying trial balance is out
                of balance by{" "}
                {money(
                  diagnostics.trialBalanceDifference
                )}.
              </p>
            )}

            {diagnostics.closingReviewRequired && (
              <p
                style={{
                  color: "#b91c1c",
                  fontWeight: "bold",
                }}
              >
                Closing activity exists in the
                reviewed ledger. Earnings and
                closing-entry presentation still
                require review.
              </p>
            )}

            {unclassified.length > 0 && (
              <p
                style={{
                  color: "#b91c1c",
                  fontWeight: "bold",
                }}
              >
                {unclassified.length} account(s)
                have unclassified recorded balances.
                They are shown separately and
                excluded from the equation.
              </p>
            )}

            {!!issues.length && (
              <details>
                <summary>
                  Reporting data-review items (
                  {issues.length})
                </summary>

                <ul>
                  {issues.map((issue) => (
                    <li key={issue.code}>
                      {issue.message}
                      {issue.count > 1
                        ? ` (${issue.count})`
                        : ""}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>

          <div
            className="bs-cards"
            style={grid}
          >
            {[
              [
                "Total Assets",
                report.totals.totalAssets,
              ],
              [
                "Total Liabilities",
                report.totals.totalLiabilities,
              ],
              [
                "Total Equity",
                report.totals.totalEquity,
              ],
              [
                "Liabilities + Equity",
                report.totals.liabilitiesPlusEquity,
              ],
              [
                "Difference",
                report.totals.difference,
              ],
              [
                "Current Assets",
                report.assets.current,
              ],
              [
                "Current Liabilities",
                report.liabilities.current,
              ],
            ].map(([title, value]) => (
              <div style={panel} key={title}>
                <strong>{title}</strong>

                <h2 style={{ color: BLUE }}>
                  {money(value)}
                </h2>
              </div>
            ))}
          </div>

          <StatementSection
            title="Assets"
            rows={filterRows(
              report.assets.accounts
            )}
            total={report.assets.total}
          />

          <StatementSection
            title="Liabilities"
            rows={filterRows(
              report.liabilities.accounts
            )}
            total={report.liabilities.total}
          />

          <StatementSection
            title="Equity"
            rows={filterRows(
              report.equity.accounts
            )}
            total={report.equity.total}
          />

          <div style={panel}>
            <h3>Equity presentation</h3>

            <p>
              Recorded equity accounts:{" "}
              <strong>
                {money(
                  report.equity.ownerEquityOnly
                )}
              </strong>
            </p>

            <p>
              Accumulated unclosed earnings:{" "}
              <strong>
                {money(
                  report.equity.unclosedEarnings
                )}
              </strong>
            </p>

            <p>
              Total equity:{" "}
              <strong>
                {money(report.equity.total)}
              </strong>
            </p>
          </div>

          <div
            style={{
              ...panel,
              borderColor:
                report.totals.isBalanced === false
                  ? "#b91c1c"
                  : BORDER,
            }}
          >
            <h3>
              {report.totals.isBalanced === true
                ? "Recorded accounting equation balances"
                : report.totals.isBalanced === false
                  ? "Recorded accounting equation does not balance"
                  : "Balance check unavailable"}
            </h3>

            <p>
              Assets:{" "}
              <strong>
                {money(report.totals.totalAssets)}
              </strong>
            </p>

            <p>
              Liabilities + Equity:{" "}
              <strong>
                {money(
                  report.totals.liabilitiesPlusEquity
                )}
              </strong>
            </p>

            <p>
              Difference:{" "}
              <strong>
                {money(report.totals.difference)}
              </strong>
            </p>
          </div>

          {unclassified.length > 0 && (
            <div style={panel}>
              <h3>
                Unclassified balances — excluded
                from the equation
              </h3>

              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                  }}
                >
                  <thead>
                    <tr>
                      {[
                        "Account",
                        "Classification",
                        "Debit balance",
                        "Credit balance",
                      ].map((heading) => (
                        <th
                          key={heading}
                          style={cell}
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {unclassified.map((row) => (
                      <tr key={row.accountCode}>
                        <td style={cell}>
                          {row.accountCode} —{" "}
                          {row.accountName}
                        </td>

                        <td style={cell}>
                          {row.accountCategory}
                        </td>

                        <td style={cell}>
                          {money(row.debitBalance)}
                        </td>

                        <td style={cell}>
                          {money(row.creditBalance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatementSection({
  title,
  rows,
  total,
}) {
  return (
    <div style={panel}>
      <h2 style={{ color: BLUE }}>{title}</h2>

      <div
        style={{
          overflowX: "auto",
          maxHeight: 450,
        }}
      >
        <table
          style={{
            width: "100%",
            minWidth: 500,
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr>
              <th style={cell}>Code</th>
              <th style={cell}>Account</th>

              <th
                style={{
                  ...cell,
                  textAlign: "right",
                }}
              >
                Recorded balance
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.length ? (
              rows.map((row) => (
                <tr key={row.accountCode}>
                  <td style={cell}>
                    {row.accountCode}
                  </td>

                  <td style={cell}>
                    {row.accountName}
                  </td>

                  <td
                    style={{
                      ...cell,
                      textAlign: "right",
                    }}
                  >
                    {money(row.amount)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td style={cell} colSpan={3}>
                  No accounts to display with the
                  current zero-balance setting.
                </td>
              </tr>
            )}
          </tbody>

          <tfoot>
            <tr>
              <th style={cell} colSpan={2}>
                Total {title}
              </th>

              <th
                style={{
                  ...cell,
                  textAlign: "right",
                }}
              >
                {money(total)}
              </th>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

export default BalanceSheet;