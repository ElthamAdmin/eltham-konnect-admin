import React from "react";
import FinanceTrendChart from "./FinanceTrendChart";

const numberOrNull = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
};

const money = (value) => {
  const number = numberOrNull(value);

  if (number === null) return "Not available";

  return `JMD ${number.toLocaleString("en-JM", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const percentage = (value) =>
  value === null
    ? "Not available"
    : `${value.toFixed(2)}%`;

const difference = (a, b) =>
  a === null || b === null ? null : a - b;

const margin = (profit, revenue) =>
  profit === null || revenue === null || revenue <= 0
    ? null
    : (profit / revenue) * 100;

const completeMonthPair = (data, filters) => {
  if (!Array.isArray(data) || !filters?.to) return null;

  const complete = data
    .filter((row) => {
      if (
        !/^\d{4}-\d{2}$/.test(String(row.month)) ||
        row.recordedActivity === false
      ) {
        return false;
      }

      const first = `${row.month}-01`;
      const date = new Date(`${first}T00:00:00Z`);

      if (Number.isNaN(date.getTime())) return false;

      date.setUTCMonth(date.getUTCMonth() + 1, 0);

      const last = date.toISOString().slice(0, 10);

      return (
        (!filters.from || filters.from <= first) &&
        filters.to >= last &&
        [
          row.revenue,
          row.expenses,
          row.netProfit,
        ].every((value) => numberOrNull(value) !== null)
      );
    })
    .sort((a, b) => a.month.localeCompare(b.month));

  if (complete.length < 2) return null;

  const previous = complete[complete.length - 2];
  const latest = complete[complete.length - 1];

  const nextMonth = new Date(
    `${previous.month}-01T00:00:00Z`
  );

  nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);

  return nextMonth.toISOString().slice(0, 7) ===
    latest.month
    ? { previous, latest }
    : null;
};

const changePercent = (current, previous) => {
  const a = numberOrNull(current);
  const b = numberOrNull(previous);

  if (a === null || b === null || b <= 0) {
    return "Not comparable";
  }

  const change = ((a - b) / b) * 100;

  return `${change > 0 ? "+" : ""}${change.toFixed(2)}%`;
};

export default function FinanceDashboard({
  summary,
  summaryFilter,
  summaryBranch,
  setSummaryFilter,
  setSummaryBranch,
  fetchFinanceData,
  setActiveTab,
  onOpenReport,
  summaryLoading = false,
  summaryError = "",
  cardStyle = {},
  metricCardStyle = {},
  ROYAL_BLUE = "#103d8f",
  GOLD = "#d4af37",
  BORDER = "#d6dfec",
}) {
  const filters = summary?.filters || {};
  const profit = summary?.profitAndLoss || {};
  const position = summary?.sections?.balanceSheet;
  const treasury = summary?.treasury || {};
  const health = summary?.health || {};
  const issues = summary?.reportMeta?.issues || [];

  const revenue = numberOrNull(profit.revenue);
  const costOfSales = numberOrNull(profit.costOfSales);
  const grossProfit = numberOrNull(profit.grossProfit);

  const operatingExpenses = numberOrNull(
    profit.operatingExpenses
  );

  const netProfit = numberOrNull(profit.netProfit);

  const currentAssets = numberOrNull(
    position?.assets?.current
  );

  const currentLiabilities = numberOrNull(
    position?.liabilities?.current
  );

  const workingCapital = difference(
    currentAssets,
    currentLiabilities
  );

  const currentRatio =
    currentAssets !== null &&
    currentLiabilities !== null &&
    currentLiabilities > 0
      ? currentAssets / currentLiabilities
      : null;

  const accountsPayable =
    position?.liabilities?.accounts?.find(
      (row) => row.accountCode === "2000"
    )?.amount;

  const pair = completeMonthPair(
    summary?.monthlyTrend,
    filters
  );

  const openReports = () => {
    if (onOpenReport) {
      onOpenReport(filters);
    } else {
      setActiveTab("reports");
    }
  };

  const card = {
    background: "#fff",
    border: `1px solid ${BORDER}`,
    borderRadius: 12,
    padding: 18,
    ...cardStyle,
    minWidth: 0,
  };

  const control = {
    padding: 10,
    borderRadius: 8,
    border: `1px solid ${BORDER}`,
    maxWidth: "100%",
  };

  const metrics = [
    ["Revenue", revenue, ROYAL_BLUE, openReports],
    [
      "Cost of Sales",
      costOfSales,
      "#b45309",
      openReports,
    ],
    [
      "Gross Profit",
      grossProfit,
      "#0f766e",
      openReports,
    ],
    [
      "Operating Expenses",
      operatingExpenses,
      "#b91c1c",
      openReports,
    ],
    [
      "Net Profit / Loss",
      netProfit,
      netProfit !== null && netProfit < 0
        ? "#b91c1c"
        : "#0f766e",
      openReports,
    ],
    [
      "Cash & Bank",
      treasury.cashAndBank,
      "#172554",
      () => setActiveTab("accounts"),
    ],
    [
      "Credit Card Outstanding",
      treasury.creditCardOutstanding,
      "#7c3aed",
      () => setActiveTab("accounts"),
    ],
    [
      "Net Treasury Position",
      treasury.netTreasuryPosition,
      "#172554",
      () => setActiveTab("accounts"),
    ],
  ];

  return (
    <>
      <div
        style={{
          ...card,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <strong style={{ color: ROYAL_BLUE }}>
          Dashboard Filter:
        </strong>

        <select
          aria-label="Dashboard period"
          value={summaryFilter}
          onChange={(event) =>
            setSummaryFilter(event.target.value)
          }
          style={control}
        >
          <option value="today">Today</option>
          <option value="thisWeek">This Week</option>
          <option value="thisMonth">This Month</option>
          <option value="thisYear">This Year</option>
          <option value="allTime">All Time</option>
        </select>

        <select
          aria-label="Dashboard branch"
          value={summaryBranch}
          onChange={(event) =>
            setSummaryBranch(event.target.value)
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

        <button
          type="button"
          onClick={() => fetchFinanceData()}
          disabled={summaryLoading}
          style={{
            ...control,
            background: GOLD,
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          {summaryLoading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {summaryLoading ? (
        <p role="status">Loading financial summary…</p>
      ) : summaryError ? (
        <p role="alert" style={{ color: "#b91c1c" }}>
          {summaryError}
        </p>
      ) : !summary?.filters || !summary?.profitAndLoss ? (
        <p role="status">
          The financial summary is not available.
          Refresh to try again.
        </p>
      ) : (
        <>
          <div
            style={{
              ...card,
              marginBottom: 20,
              background: "#fffbeb",
            }}
          >
            <strong>
              Recorded figures — reconciliation pending
            </strong>

            <p style={{ margin: "8px 0" }}>
              Activity:{" "}
              {filters.from || "Earliest recorded activity"}
              {" to "}
              {filters.to} ·{" "}
              {filters.branch || "All Branches"} · JMD
            </p>

            <p
              style={{
                margin: "8px 0",
                fontSize: 13,
              }}
            >
              Financial Position and treasury balances
              are as of {filters.to}. Payroll is included
              in expenses once. The account register
              shows current account settings and balances.
            </p>

            <p
              style={{
                margin: "8px 0 0",
                fontSize: 13,
              }}
            >
              Business scope:{" "}
              {summary.reportMeta?.businessScope ||
                "See report scope"}.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(min(100%, 210px), 1fr))",
              gap: 16,
              marginBottom: 20,
            }}
          >
            {metrics.map(
              ([title, value, color, action]) => (
                <button
                  key={title}
                  type="button"
                  onClick={action}
                  style={{
                    ...card,
                    ...metricCardStyle,
                    textAlign: "left",
                    fontFamily: "inherit",
                    cursor: "pointer",
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      fontSize: 25,
                      fontWeight: "bold",
                      color,
                      overflowWrap: "anywhere",
                    }}
                  >
                    {money(value)}
                  </div>

                  <div
                    style={{
                      marginTop: 8,
                      color: "#334155",
                      fontWeight: "bold",
                    }}
                  >
                    {title}
                  </div>

                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 12,
                      color: "#64748b",
                    }}
                  >
                    {title.includes("Cash") ||
                    title.includes("Credit") ||
                    title.includes("Treasury")
                      ? "Open current account register"
                      : "Open Financial Reports"}
                  </div>
                </button>
              )
            )}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
              gap: 16,
              marginBottom: 20,
            }}
          >
            <Panel title="Financial Position" style={card}>
              <InfoRow
                label="Current Assets"
                value={money(currentAssets)}
              />
              <InfoRow
                label="Current Liabilities"
                value={money(currentLiabilities)}
              />
              <InfoRow
                label="Working Capital"
                value={money(workingCapital)}
              />
              <InfoRow
                label="Current Ratio"
                value={
                  currentRatio === null
                    ? "Not available"
                    : currentRatio.toFixed(2)
                }
              />
              <InfoRow
                label="Accounts Receivable"
                value={money(
                  position?.assets?.accountsReceivable
                )}
              />
              <InfoRow
                label="Accounts Payable"
                value={money(accountsPayable)}
              />

              {(currentAssets === null ||
                currentLiabilities === null) && (
                <p style={{ fontSize: 12 }}>
                  Current/non-current account
                  classifications require review before
                  liquidity ratios can be shown.
                </p>
              )}
            </Panel>

            <Panel
              title="Revenue & Expense Analysis"
              style={card}
            >
              <InfoRow
                label="Revenue"
                value={money(revenue)}
              />
              <InfoRow
                label="Cost of Sales"
                value={money(costOfSales)}
              />
              <InfoRow
                label="Gross Profit"
                value={money(grossProfit)}
              />
              <InfoRow
                label="Gross Margin"
                value={percentage(
                  margin(grossProfit, revenue)
                )}
              />
              <InfoRow
                label="Operating Expenses"
                value={money(operatingExpenses)}
              />
              <InfoRow
                label="Total Expenses"
                value={money(profit.totalExpenses)}
              />
              <InfoRow
                label="Net Profit / Loss"
                value={money(netProfit)}
              />
              <InfoRow
                label="Net Margin"
                value={percentage(
                  margin(netProfit, revenue)
                )}
              />
            </Panel>

            <Panel title="Banking Intelligence" style={card}>
              <InfoRow
                label="Cash & Bank"
                value={money(treasury.cashAndBank)}
              />
              <InfoRow
                label="Credit Card Outstanding"
                value={money(
                  treasury.creditCardOutstanding
                )}
              />
              <InfoRow
                label="Net Treasury Position"
                value={money(treasury.netTreasuryPosition)}
              />
              <InfoRow
                label="Credit Limit"
                value={money(treasury.creditLimit)}
              />
              <InfoRow
                label="Available Credit"
                value={money(treasury.availableCredit)}
              />
              <InfoRow
                label="Credit Utilization"
                value={percentage(
                  numberOrNull(treasury.creditUtilization)
                )}
              />

              <p style={{ fontSize: 12 }}>
                Credit limits are shown only when the
                reporting scope and JMD balances are
                comparable.
              </p>
            </Panel>

            <Panel title="Financial Checks" style={card}>
              <InfoRow
                label="Trial Balance"
                value={
                  health.trialBalanceBalanced === true
                    ? "Debits equal credits"
                    : health.trialBalanceBalanced === false
                      ? "Difference requires review"
                      : "Not available"
                }
              />
              <InfoRow
                label="Trial Balance Difference"
                value={money(
                  health.trialBalanceDifference
                )}
              />
              <InfoRow
                label="Balance Sheet"
                value={
                  health.balanceSheetBalanced === true
                    ? "Equation balances"
                    : health.balanceSheetBalanced === false
                      ? "Difference requires review"
                      : "Not available"
                }
              />
              <InfoRow
                label="Balance Sheet Difference"
                value={money(
                  health.balanceSheetDifference
                )}
              />

              <p style={{ fontSize: 12 }}>
                A balanced report does not establish
                that all business transactions have
                been recorded correctly.
              </p>
            </Panel>
          </div>

          <Panel
            title="Financial Alerts & Review Items"
            style={{ ...card, marginBottom: 20 }}
          >
            {issues.length ? (
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {issues.map((issue) => (
                  <li
                    key={issue.code}
                    style={{
                      marginBottom: 10,
                      color: "#92400e",
                    }}
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
          </Panel>

          <Panel
            title="Executive Trend Analytics"
            style={{ ...card, marginBottom: 20 }}
          >
            <InfoRow
              label="Gross Margin — selected period"
              value={percentage(
                margin(grossProfit, revenue)
              )}
            />
            <InfoRow
              label="Net Margin — selected period"
              value={percentage(margin(netProfit, revenue))}
            />

            {pair ? (
              <>
                <p style={{ fontSize: 13 }}>
                  Complete-month comparison:{" "}
                  {pair.previous.month} → {pair.latest.month}
                </p>

                <InfoRow
                  label="Revenue Change"
                  value={changePercent(
                    pair.latest.revenue,
                    pair.previous.revenue
                  )}
                />
                <InfoRow
                  label="Expense Change"
                  value={changePercent(
                    pair.latest.expenses,
                    pair.previous.expenses
                  )}
                />
                <InfoRow
                  label="Profit Change (JMD)"
                  value={money(
                    Number(pair.latest.netProfit) -
                      Number(pair.previous.netProfit)
                  )}
                />
              </>
            ) : (
              <p style={{ fontSize: 13 }}>
                Two consecutive complete months with
                recorded activity are required for a
                monthly comparison. Partial months are
                not compared with complete months.
              </p>
            )}
          </Panel>

          <div style={card}>
            <FinanceTrendChart
              data={summary.monthlyTrend}
              filters={filters}
            />
          </div>
        </>
      )}
    </>
  );
}

function Panel({ title, style, children }) {
  return (
    <section style={style}>
      <h3
        style={{
          margin: "0 0 14px",
          color: "#103d8f",
        }}
      >
        {title}
      </h3>

      <div style={{ display: "grid", gap: 10 }}>
        {children}
      </div>
    </section>
  );
}

function InfoRow({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "space-between",
        gap: 8,
        borderBottom: "1px solid #e5e7eb",
        paddingBottom: 8,
      }}
    >
      <span style={{ color: "#475569" }}>{label}</span>

      <strong
        style={{
          textAlign: "right",
          overflowWrap: "anywhere",
        }}
      >
        {value}
      </strong>
    </div>
  );
}