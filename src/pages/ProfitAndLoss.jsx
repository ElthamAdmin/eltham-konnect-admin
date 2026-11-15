import { useEffect, useRef, useState } from "react";
import api from "../api";

const BLUE = "#0B3D91";
const BORDER = "#dbe3ef";

const panel = {
  background: "white",
  border: `1px solid ${BORDER}`,
  borderRadius: 12,
  padding: 18,
  marginBottom: 18,
};

const grid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit,minmax(200px,1fr))",
  gap: 14,
};

const input = {
  display: "block",
  width: "100%",
  padding: 9,
  marginTop: 5,
  boxSizing: "border-box",
};

const cell = {
  padding: 10,
  border: `1px solid ${BORDER}`,
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

const initialFilters = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Jamaica",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const today = ["year", "month", "day"]
    .map(
      (key) =>
        parts.find((part) => part.type === key).value
    )
    .join("-");

  return {
    from: `${today.slice(0, 7)}-01`,
    to: today,
    branch: "",
    entityCode: "",
  };
};

function ProfitLoss() {
  const [report, setReport] = useState(null);
  const [filters, setFilters] =
    useState(initialFilters);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const requestId = useRef(0);

  const loadReport = async (selected) => {
    const id = ++requestId.current;

    setReport(null);
    setError("");

    if (
      !selected.to ||
      (
        selected.from &&
        selected.from > selected.to
      )
    ) {
      setLoading(false);

      setError(
        "Select an ending date on or after the starting date."
      );

      return;
    }

    setLoading(true);

    try {
      const response = await api.get(
        "/api/profit-and-loss",
        { params: selected }
      );

      if (id !== requestId.current) return;

      const data = response.data?.data;

      if (
        !data?.filters ||
        ![
          data.revenue,
          data.costOfSales,
          data.operatingExpenses,
        ].every(
          (section) =>
            Array.isArray(section?.accounts)
        )
      ) {
        throw new Error(
          "The report response is incomplete."
        );
      }

      setReport(data);
    } catch (failure) {
      if (id === requestId.current) {
        setError(
          failure?.response?.data?.message ||
            failure.message ||
            "Could not load Profit & Loss."
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

  const diagnostics = report?.diagnostics || {};
  const issues = diagnostics.issues || [];
  const unclassified =
    diagnostics.unclassifiedAccounts || [];

  return (
    <div>
      <h1 style={{ color: BLUE }}>
        Profit &amp; Loss
      </h1>

      <p>
        Review recorded revenue, cost of sales,
        expenses and profit/loss in JMD.
        Source: General Ledger.
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
            From — blank for all recorded history
            <input
              style={input}
              type="date"
              name="from"
              value={filters.from}
              onChange={changeFilter}
            />
          </label>

          <label>
            Through
            <input
              required
              style={input}
              type="date"
              name="to"
              value={filters.to}
              onChange={changeFilter}
            />
          </label>

          <label>
            Branch
            <select
              style={input}
              name="branch"
              value={filters.branch}
              onChange={changeFilter}
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
              style={input}
              name="entityCode"
              maxLength={120}
              placeholder="Blank includes all recorded identities"
              value={filters.entityCode}
              onChange={changeFilter}
            />
          </label>
        </div>

        <button
          disabled={loading}
          style={{
            background: BLUE,
            color: "white",
            padding: "10px 16px",
            border: 0,
            borderRadius: 8,
            marginTop: 14,
          }}
        >
          {loading
            ? "Loading…"
            : "Load / Refresh Report"}
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
          Loading ledger report…
        </p>
      )}

      {!report && !loading && !error && (
        <p>
          Load the selected filters to view the report.
        </p>
      )}

      {report && (
        <>
          <div
            style={{
              ...panel,
              background: "#fffbeb",
            }}
          >
            <strong>
              {report.filters.from ||
                "All recorded history"}
              {" through "}
              {report.filters.to}
            </strong>

            <p>
              Branch:{" "}
              {report.filters.branch ||
                "All branches"}.
              {" "}Business:{" "}
              {report.filters.entityCode ||
                "All recorded identities, including unassigned records"}.
            </p>

            <p>{diagnostics.basis}</p>
            <p>{diagnostics.expenseScope}</p>
            <p>{diagnostics.classificationBasis}</p>

            <p>
              A branch or business filter excludes
              records without matching attribution.
              No business identity is assigned or
              changed by this report.
            </p>

            <p>
              Review items may concern earlier ledger
              records through the ending date.
              A balanced trial balance does not
              establish completeness.
            </p>

            {diagnostics.trialBalanceIsBalanced ===
              false && (
              <p
                style={{
                  color: "#b91c1c",
                  fontWeight: "bold",
                }}
              >
                The trial balance through the ending
                date is out of balance by{" "}
                {money(
                  diagnostics.trialBalanceDifference
                )}.
                {" "}Review the source records before
                relying on these figures.
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
                reviewed ledger. Closed-period profit
                presentation requires a closing-entry
                review.
              </p>
            )}

            {unclassified.length > 0 && (
              <p
                style={{
                  color: "#b91c1c",
                  fontWeight: "bold",
                }}
              >
                Selected-period activity exists in{" "}
                {unclassified.length} unclassified
                account(s). It is excluded from the
                profit totals below.
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

          <div style={grid}>
            {[
              [
                "Recorded revenue",
                report.revenue.total,
              ],
              [
                "Cost of sales",
                report.costOfSales.total,
              ],
              [
                "Gross profit / loss",
                report.grossProfit,
              ],
              [
                "All classified expenses",
                report.operatingExpenses.total,
              ],
              [
                "Recorded net profit / loss",
                report.netProfit,
              ],
            ].map(([label, value]) => (
              <div style={panel} key={label}>
                <strong>{label}</strong>

                <h2
                  style={{
                    color:
                      Number(value) < 0
                        ? "#b91c1c"
                        : BLUE,
                  }}
                >
                  {money(value)}
                </h2>
              </div>
            ))}
          </div>

          <Section
            title="Revenue"
            rows={report.revenue.accounts}
            total={report.revenue.total}
          />

          <Section
            title="Cost of Sales"
            rows={report.costOfSales.accounts}
            total={report.costOfSales.total}
          />

          <Summary
            label="Gross profit / loss"
            value={report.grossProfit}
          />

          <Section
            title="Expenses — all ledger Expense accounts"
            rows={report.operatingExpenses.accounts}
            total={report.operatingExpenses.total}
          />

          <Summary
            label="Recorded net profit / loss"
            value={report.netProfit}
          />

          {unclassified.length > 0 && (
            <div style={panel}>
              <h2>
                Unclassified activity — excluded
                from profit totals
              </h2>

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
                        "Period debits",
                        "Period credits",
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
                          {money(row.debit)}
                        </td>

                        <td style={cell}>
                          {money(row.credit)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Section({ title, rows, total }) {
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
            borderCollapse: "collapse",
            minWidth: 500,
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
                Recorded amount
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
                  No accounts were classified in
                  this section.
                </td>
              </tr>
            )}
          </tbody>

          <tfoot>
            <tr>
              <th style={cell} colSpan={2}>
                Total
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

function Summary({ label, value }) {
  return (
    <div
      style={{
        ...panel,
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        flexWrap: "wrap",
        fontWeight: "bold",
        fontSize: 20,
      }}
    >
      <span>{label}</span>
      <span>{money(value)}</span>
    </div>
  );
}

export default ProfitLoss;