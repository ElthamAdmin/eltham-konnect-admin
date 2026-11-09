import React, { useMemo } from "react";

import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
  Line,
  ReferenceLine,
} from "recharts";

const asNumber = (value) => {
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
  const number = asNumber(value);

  if (number === null) return "Not available";

  return `JMD ${number.toLocaleString("en-JM", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const monthLabel = (value) => {
  if (!/^\d{4}-\d{2}$/.test(String(value))) {
    return String(value || "");
  }

  const date = new Date(`${value}-01T00:00:00Z`);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("en-JM", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  });
};

const axisLabel = (value) => {
  const number = Number(value);
  const magnitude = Math.abs(number);

  if (magnitude >= 1000000) {
    return `${(number / 1000000).toLocaleString("en-JM", {
      maximumFractionDigits: 1,
    })}m`;
  }

  if (magnitude >= 1000) {
    return `${(number / 1000).toLocaleString("en-JM", {
      maximumFractionDigits: 1,
    })}k`;
  }

  return number.toLocaleString("en-JM", {
    maximumFractionDigits: 0,
  });
};

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #cbd5e1",
        borderRadius: 8,
        padding: 12,
        color: "#172554",
        boxShadow: "0 4px 12px #00000014",
      }}
    >
      <strong>{monthLabel(label)}</strong>

      {payload.map((item) => (
        <div
          key={item.dataKey}
          style={{ marginTop: 6 }}
        >
          <span style={{ color: item.color }}>
            {item.name}:{" "}
          </span>

          <strong
            style={{
              color:
                Number(item.value) < 0
                  ? "#b91c1c"
                  : "#172554",
            }}
          >
            {money(item.value)}
          </strong>
        </div>
      ))}

      <div style={{ marginTop: 8, fontSize: 12 }}>
        Within the applied reporting period
      </div>
    </div>
  );
};

export default function FinanceTrendChart({
  data,
  filters = {},
  loading = false,
  error = "",
  title = "Monthly Revenue, Expenses & Profit",
}) {
  const rows = useMemo(() => {
    if (!Array.isArray(data)) return [];

    return data
      .map((item) => {
        const recorded = item.recordedActivity !== false;

        return {
          month: item.month,
          recordedActivity: recorded,
          revenue: recorded
            ? asNumber(item.revenue)
            : null,
          expenses: recorded
            ? asNumber(item.expenses)
            : null,
          netProfit: recorded
            ? asNumber(item.netProfit)
            : null,
        };
      })
      .sort((a, b) =>
        String(a.month).localeCompare(String(b.month))
      );
  }, [data]);

  const hasValues = rows.some((row) =>
    [row.revenue, row.expenses, row.netProfit].some(
      (value) => value !== null
    )
  );

  const hasGaps = rows.some(
    (row) =>
      !row.recordedActivity ||
      [row.revenue, row.expenses, row.netProfit].some(
        (value) => value === null
      )
  );

  const period = `${
    filters.from || "Earliest recorded activity"
  } to ${filters.to || "report ending date"}`;

  return (
    <section
      aria-label={title}
      style={{ minWidth: 0, color: "#172554" }}
    >
      <h3
        style={{
          margin: "0 0 8px",
          color: "#103d8f",
        }}
      >
        {title}
      </h3>

      <p style={{ margin: "0 0 6px", fontSize: 13 }}>
        {period} · {filters.branch || "All Branches"} · JMD
      </p>

      <p
        style={{
          margin: "0 0 16px",
          fontSize: 12,
          color: "#475569",
        }}
      >
        Total Expenses includes Cost of Sales and payroll
        once. Values reflect recorded ledger activity;
        completeness still requires reconciliation.
      </p>

      {loading ? (
        <p role="status">Loading chart…</p>
      ) : error ? (
        <p role="alert" style={{ color: "#b91c1c" }}>
          {error}
        </p>
      ) : !Array.isArray(data) ? (
        <p role="status">Chart data is not available.</p>
      ) : !hasValues ? (
        <p>
          No recorded revenue or expense activity is
          available for the applied filters.
        </p>
      ) : (
        <>
          <div
            style={{
              width: "100%",
              minWidth: 0,
              height: 360,
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={rows}
                margin={{
                  top: 12,
                  right: 12,
                  left: 8,
                  bottom: 12,
                }}
              >
                <CartesianGrid
                  stroke="#e2e8f0"
                  strokeDasharray="3 3"
                  vertical={false}
                />

                <XAxis
                  dataKey="month"
                  tickFormatter={monthLabel}
                  minTickGap={24}
                  tick={{ fontSize: 12 }}
                />

                <YAxis
                  tickFormatter={axisLabel}
                  width={68}
                  tick={{ fontSize: 12 }}
                  domain={[
                    (min) => Math.min(0, min),
                    (max) => Math.max(0, max),
                  ]}
                />

                <Tooltip content={<ChartTooltip />} />

                <Legend
                  wrapperStyle={{
                    fontSize: 12,
                    paddingTop: 12,
                  }}
                />

                <ReferenceLine
                  y={0}
                  stroke="#64748b"
                  strokeWidth={1.5}
                />

                <Bar
                  dataKey="revenue"
                  name="Revenue"
                  fill="#16479b"
                  maxBarSize={38}
                  isAnimationActive={false}
                />

                <Bar
                  dataKey="expenses"
                  name="Total Expenses"
                  fill="#c89b1d"
                  maxBarSize={38}
                  isAnimationActive={false}
                />

                <Line
                  type="linear"
                  dataKey="netProfit"
                  name="Net Profit / Loss"
                  stroke="#0f766e"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  connectNulls={false}
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {hasGaps && (
            <p
              style={{
                fontSize: 12,
                color: "#92400e",
              }}
            >
              Gaps indicate no recorded activity or an
              unavailable value. They do not confirm that
              no business activity occurred.
            </p>
          )}

          <details style={{ marginTop: 12 }}>
            <summary
              style={{ cursor: "pointer", fontSize: 13 }}
            >
              View chart values
            </summary>

            <div
              style={{
                overflowX: "auto",
                marginTop: 10,
              }}
            >
              <table
                style={{
                  borderCollapse: "collapse",
                  width: "100%",
                  fontSize: 13,
                }}
              >
                <caption
                  style={{
                    textAlign: "left",
                    paddingBottom: 8,
                  }}
                >
                  {period} ·{" "}
                  {filters.branch || "All Branches"}
                </caption>

                <thead>
                  <tr>
                    {[
                      "Month",
                      "Revenue",
                      "Total Expenses",
                      "Net Profit / Loss",
                    ].map((heading) => (
                      <th
                        key={heading}
                        scope="col"
                        style={{
                          textAlign: "left",
                          padding: 8,
                          borderBottom:
                            "1px solid #cbd5e1",
                        }}
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {rows.map((row) => (
                    <tr key={row.month}>
                      <th
                        scope="row"
                        style={{
                          textAlign: "left",
                          padding: 8,
                        }}
                      >
                        {monthLabel(row.month)}
                      </th>

                      {[
                        row.revenue,
                        row.expenses,
                        row.netProfit,
                      ].map((value, index) => (
                        <td
                          key={index}
                          style={{
                            padding: 8,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {row.recordedActivity
                            ? money(value)
                            : "No recorded activity"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
    </section>
  );
}