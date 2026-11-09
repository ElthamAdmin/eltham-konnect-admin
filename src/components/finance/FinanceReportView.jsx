import React from "react";
import FinanceTrendChart from "./FinanceTrendChart";

const money = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "Not available";
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? `JMD ${number.toLocaleString("en-JM", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    : "Not available";
};

const deductionFields = [
  ["NIS", "nisEmployee"],
  ["NHT", "nhtEmployee"],
  ["Education Tax", "educationTax"],
  ["Income Tax", "incomeTax"],
  ["Pension", "pensionEmployee"],
];

const exportsList = [
  ["P&L PDF", "Profit and Loss"],
  ["Cash Movements PDF", "Cash Flow"],
  ["Balance Sheet PDF", "Balance Sheet"],
  ["Deductions PDF", "Statutory Deductions"],
  ["Expenses PDF", "Expense Category Breakdown"],
  ["Trend PDF", "Monthly Trend"],
];

export default function FinanceReportView({
  reports,
  filters = {},
  setFilters,
  onApply,
  onClear,
  onExport,
  loading = false,
  error = "",
  cardStyle = {},
}) {
  const applied = reports?.filters || {};
  const meta = reports?.reportMeta || {};
  const profit = reports?.profitAndLoss || {};
  const balance = reports?.balanceSheet;
  const cash = reports?.cashFlow?.totals;
  const totals = reports?.statutoryTotals || {};
  const employees = reports?.statutoryByEmployee || [];
  const issues = meta.issues || [];
  const exceptions = meta.payrollExceptions || [];

  const card = {
    background: "#fff",
    border: "1px solid #d6dfec",
    borderRadius: 12,
    padding: 18,
    ...cardStyle,
    minWidth: 0,
  };

  const control = {
    padding: 10,
    border: "1px solid #cbd5e1",
    borderRadius: 7,
    maxWidth: "100%",
  };

  const updateFilter = (field, value) => {
    setFilters((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  return (
    <div
      style={{
        display: "grid",
        gap: 20,
        minWidth: 0,
      }}
    >
      <section style={card}>
        <h2 style={{ marginTop: 0, color: "#103d8f" }}>
          Financial Reports
        </h2>

        <form
          onSubmit={(event) => {
            event.preventDefault();

            onApply({
              from: filters.from || "",
              to: filters.to || "",
              branch: filters.branch || "",
            });
          }}
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "end",
            gap: 12,
          }}
        >
          <label style={{ display: "grid", gap: 6 }}>
            From
            <input
              type="date"
              value={filters.from || ""}
              onChange={(event) =>
                updateFilter("from", event.target.value)
              }
              style={control}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            To
            <input
              type="date"
              value={filters.to || ""}
              onChange={(event) =>
                updateFilter("to", event.target.value)
              }
              style={control}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            Branch
            <select
              value={filters.branch || ""}
              onChange={(event) =>
                updateFilter("branch", event.target.value)
              }
              style={control}
            >
              <option value="">All Branches</option>
              <option value="Eltham Park Mainstore">
                Eltham Park Mainstore
              </option>
              <option value="Brown's Town Square">
                Brown's Town Square
              </option>
            </select>
          </label>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...control,
              background: "#103d8f",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            {loading ? "Loading…" : "Apply Filters"}
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => onClear()}
            style={control}
          >
            Clear
          </button>
        </form>

        <p
          style={{
            fontSize: 12,
            color: "#475569",
            marginBottom: 0,
          }}
        >
          Apply Filters to update the report. Exports
          use the applied report, including its dates
          and branch.
        </p>
      </section>

      {loading ? (
        <p role="status">Loading financial reports…</p>
      ) : error ? (
        <p role="alert" style={{ color: "#b91c1c" }}>
          {error}
        </p>
      ) : !reports?.filters || !reports?.profitAndLoss ? (
        <p role="status">
          Financial report data is not available.
          Apply Filters to try again.
        </p>
      ) : (
        <>
          <section
            style={{ ...card, background: "#fffbeb" }}
          >
            <strong>
              Recorded figures — reconciliation pending
            </strong>

            <p>
              Applied activity period:{" "}
              {applied.from || "Earliest recorded activity"}
              {" to "}
              {applied.to} ·{" "}
              {applied.branch || "All Branches"} · JMD
            </p>

            <p>{meta.periodBasis}</p>

            <p>
              Business scope: {meta.businessScope}.{" "}
              {meta.reconciliationStatus}.
            </p>

            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              {exportsList.map(([label, type]) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => onExport(type)}
                  style={{
                    ...control,
                    background: "#fff",
                    cursor: "pointer",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>

          <ReportSection title="Review Items" style={card}>
            {issues.length ? (
              <ul style={{ paddingLeft: 20, margin: 0 }}>
                {issues.map((issue) => (
                  <li
                    key={issue.code}
                    style={{ marginBottom: 8 }}
                  >
                    {issue.message}
                  </li>
                ))}
              </ul>
            ) : (
              <p>
                No additional calculation exceptions
                were returned. Source-record
                reconciliation is still required.
              </p>
            )}

            <p style={{ fontSize: 13 }}>
              Trial Balance difference:{" "}
              {money(
                reports.trialBalance?.totals?.difference
              )}
              . Balance Sheet difference:{" "}
              {money(balance?.totals?.difference)}.
              A balanced report does not confirm
              completeness.
            </p>
          </ReportSection>

          <ReportSection title="Profit and Loss" style={card}>
            <ReportTable
              headers={["Description", "Amount"]}
              rows={[
                ["Revenue", money(profit.revenue)],
                ["Cost of Sales", money(profit.costOfSales)],
                ["Gross Profit", money(profit.grossProfit)],
                [
                  "Operating Expenses — includes payroll",
                  money(profit.operatingExpenses),
                ],
                [
                  "Total Expenses — Cost of Sales + Operating Expenses",
                  money(profit.totalExpenses),
                ],
                [
                  "Net Profit / Loss",
                  money(profit.netProfit),
                ],
                [
                  "Payroll Expense — already included above",
                  money(profit.payrollExpense),
                ],
              ]}
            />
          </ReportSection>

          <ReportSection title="Cash Movements" style={card}>
            <p style={{ fontSize: 13 }}>
              Recorded cash/bank movements within the
              applied period. Formal operating, investing
              and financing classifications remain
              under review.
            </p>

            <ReportTable
              headers={["Description", "Amount"]}
              rows={[
                [
                  "Opening Cash & Bank",
                  money(cash?.openingBalance),
                ],
                [
                  "Cash/Bank Inflows",
                  money(cash?.totalInflows),
                ],
                [
                  "Cash/Bank Outflows",
                  money(cash?.totalOutflows),
                ],
                [
                  "Net Cash Movement",
                  money(cash?.netCashFlow),
                ],
                [
                  "Closing Cash & Bank",
                  money(cash?.closingBalance),
                ],
                [
                  "Identified Internal Transfers — excluded from inflows/outflows",
                  money(cash?.internalTransfers),
                ],
              ]}
            />
          </ReportSection>

          <ReportSection
            title={`Balance Sheet — as of ${applied.to}`}
            style={card}
          >
            <ReportTable
              headers={["Description", "Amount"]}
              rows={[
                ["Total Assets", money(balance?.assets?.total)],
                [
                  "Total Liabilities",
                  money(balance?.liabilities?.total),
                ],
                [
                  "Total Equity — includes unclosed ledger earnings",
                  money(balance?.equity?.total),
                ],
                [
                  "Liabilities + Equity",
                  money(balance?.totals?.liabilitiesPlusEquity),
                ],
                [
                  "Difference",
                  money(balance?.totals?.difference),
                ],
              ]}
            />

            <details style={{ marginTop: 14 }}>
              <summary style={{ cursor: "pointer" }}>
                View account balances
              </summary>

              {[
                ["Assets", balance?.assets],
                ["Liabilities", balance?.liabilities],
                ["Equity", balance?.equity],
              ].map(([label, section]) => (
                <div
                  key={label}
                  style={{ marginTop: 14 }}
                >
                  <h4>{label}</h4>

                  <ReportTable
                    headers={["Account", "Name", "Amount"]}
                    rows={(section?.accounts || []).map(
                      (account) => [
                        account.accountCode,
                        account.accountName,
                        money(account.amount),
                      ]
                    )}
                  />
                </div>
              ))}
            </details>
          </ReportSection>

          <ReportSection
            title="Employee Deduction Summary"
            style={card}
          >
            <p style={{ fontSize: 13 }}>
              {meta.payrollBasis}
            </p>

            <p style={{ fontSize: 13 }}>
              {meta.deductionBasis}
            </p>

            <p style={{ fontSize: 13 }}>
              Included payroll records:{" "}
              {meta.includedPayrollCount ?? "Not available"}.
              Verified gross pay:{" "}
              {money(meta.verifiedPaidGross)}.
            </p>

            <ReportTable
              headers={["Deduction", "Amount"]}
              rows={[
                ...deductionFields.map(([label, field]) => [
                  label,
                  money(totals[field]),
                ]),
                [
                  "Total Employee Deductions",
                  money(totals.totalDeductions),
                ],
              ]}
            />

            <h4>Deductions by Employee</h4>

            <ReportTable
              headers={[
                "Employee ID",
                "Employee",
                "Gross Pay",
                "Net Pay",
                ...deductionFields.map(([label]) => label),
                "Total Deductions",
                "Posting Dates",
                "Recorded Payment Dates",
              ]}
              rows={employees.map((employee) => [
                employee.employeeId || "Not recorded",
                employee.employeeName,
                money(employee.grossPay),
                money(employee.netPay),
                ...deductionFields.map(([, field]) =>
                  money(employee[field])
                ),
                money(employee.totalDeductions),
                (employee.postingDates || []).join(", "),
                (employee.actualPaymentDates || []).join(", "),
              ])}
              emptyText="No verified Paid payroll records qualified for the applied filters. Check the review items and payroll exceptions."
            />
          </ReportSection>

          <ReportSection
            title="Payroll Exceptions"
            style={card}
          >
            <p style={{ fontSize: 13 }}>
              Records without a usable journal link or
              posting date are marked Unscoped. They
              cannot safely be assigned to the selected
              period or branch.
            </p>

            <ReportTable
              headers={[
                "Record",
                "Scope",
                "Review Required",
              ]}
              rows={exceptions.map((item) => [
                item.record,
                item.scope,
                item.issue,
              ])}
              emptyText="No payroll exceptions were returned."
            />

            {meta.payrollExceptionsTruncated && (
              <p style={{ color: "#92400e" }}>
                Showing the first 100 of{" "}
                {meta.payrollExceptionCount} exceptions.
              </p>
            )}
          </ReportSection>

          <ReportSection
            title="Expense Account Breakdown"
            style={card}
          >
            <ReportTable
              headers={["Account", "Amount"]}
              rows={(reports.expenseByCategory || []).map(
                (item) => [
                  item.category,
                  money(item.amount),
                ]
              )}
            />
          </ReportSection>

          <section style={card}>
            <FinanceTrendChart
              data={reports.monthlyTrend}
              filters={applied}
            />
          </section>
        </>
      )}
    </div>
  );
}

function ReportSection({ title, style, children }) {
  return (
    <section style={style}>
      <h3
        style={{
          marginTop: 0,
          color: "#103d8f",
        }}
      >
        {title}
      </h3>

      {children}
    </section>
  );
}

function ReportTable({
  headers,
  rows,
  emptyText = "No recorded rows were returned.",
}) {
  const cell = {
    padding: "10px 12px",
    border: "1px solid #d6dfec",
    textAlign: "left",
    verticalAlign: "top",
  };

  return (
    <div
      style={{
        overflowX: "auto",
        maxWidth: "100%",
      }}
    >
      <table
        style={{
          borderCollapse: "collapse",
          width: "100%",
          fontSize: 13,
        }}
      >
        <thead>
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                scope="col"
                style={{
                  ...cell,
                  background: "#eef3fb",
                }}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.length ? (
            rows.map((row, index) => (
              <tr key={index}>
                {row.map((value, column) => (
                  <td key={column} style={cell}>
                    {value ?? "Not available"}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={headers.length} style={cell}>
                {emptyText}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}