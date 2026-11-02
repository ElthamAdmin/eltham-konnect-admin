import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api from "../api";

function LegacyDashboard() {
  const [customers, setCustomers] = useState([]);
  const [packages, setPackages] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [supportTickets, setSupportTickets] = useState([]);
  const [financeSummary, setFinanceSummary] = useState(null);
  const [dateFilter, setDateFilter] = useState("today");
  const [locationFilter, setLocationFilter] = useState("All Locations");

  const getFinanceFilter = () => {
    if (dateFilter === "today") return "today";
    if (dateFilter === "week") return "thisWeek";
    if (dateFilter === "month") return "thisMonth";
    if (dateFilter === "all") return "allTime";
    return "today";
  };

  const getFinanceBranch = () =>
    locationFilter === "All Locations" ? "" : locationFilter;

  const fetchDashboardData = async () => {
    try {
      const [customersRes, packagesRes, invoicesRes, chartRes, financeSummaryRes, supportTicketsRes] =
        await Promise.all([
          api.get("/api/customers"),
          api.get("/api/packages"),
          api.get("/api/invoices"),
          api.get("/api/finance/monthly-chart"),
          api.get(`/api/finance/summary?filter=${getFinanceFilter()}&branch=${encodeURIComponent(getFinanceBranch())}`),
          api.get("/api/support-tickets"),
        ]);

      setCustomers(customersRes.data.data || []);
      setPackages(packagesRes.data.data || []);
      setInvoices(invoicesRes.data.data || []);
      setChartData(chartRes.data.data || []);
      setFinanceSummary(financeSummaryRes.data.data || null);
      setSupportTickets(supportTicketsRes.data.data || []);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [dateFilter, locationFilter]);

  const money = (value) => `JMD ${Number(value || 0).toLocaleString()}`;

  const paidInvoicesTotal = Number(financeSummary?.totalRevenue || 0);
  const outstandingRevenue = Number(financeSummary?.outstandingRevenue || 0);
  const totalExpenses = Number(financeSummary?.totalExpenses || 0);
  const totalPayroll = Number(financeSummary?.totalPayroll || 0);

  const today = new Date().toLocaleDateString("en-CA", {
  timeZone: "America/Jamaica",
});

const getDateOnly = (value) => {
  if (!value) return "";

  const normalizedValue = String(value).trim();

  /*
   * Preserve date-only database values exactly.
   * Converting YYYY-MM-DD into a JavaScript Date
   * treats it as UTC midnight and shifts it to the
   * previous day in Jamaica.
   */
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalizedValue)) {
    return normalizedValue;
  }

  const parsed = new Date(normalizedValue);

  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString("en-CA", {
      timeZone: "America/Jamaica",
    });
  }

  return normalizedValue.slice(0, 10);
};

const isPaidInvoice = (invoice) =>
  String(invoice.status || "").toLowerCase() === "paid" ||
  Boolean(invoice.paidAt);

const isReadyInvoice = (invoice) =>
  !isPaidInvoice(invoice) &&
  String(invoice.status || "").toLowerCase() === "unpaid";

const paidTrackingNumbers = new Set(
  invoices
    .filter(isPaidInvoice)
    .flatMap((invoice) =>
      (invoice.packages || [])
        .map((pkg) => pkg.trackingNumber)
        .filter(Boolean)
    )
);

const newSignupsToday = customers.filter(
  (customer) =>
    getDateOnly(customer.signUpDate) === today ||
    getDateOnly(customer.createdAt) === today
).length;

const packagesReadyToday = packages.filter((pkg) => {
  const trackingNumber = pkg.trackingNumber;

  return (
    pkg.readyForPickup === true &&
    String(pkg.status || "").toLowerCase() === "ready for pickup" &&
    String(pkg.invoiceStatus || "").toLowerCase() !== "paid" &&
    !paidTrackingNumbers.has(trackingNumber) &&
    getDateOnly(pkg.readyForPickupDate) === today
  );
}).length;

const packagesToday = packages.filter(
  (pkg) =>
    String(pkg.status || "").toLowerCase() !== "deleted" &&
    getDateOnly(pkg.dateReceived || pkg.createdAt) === today
).length;

const newTicketsToday = supportTickets.filter(
  (ticket) => getDateOnly(ticket.createdAt) === today
).length;

const readyInvoicesToday = invoices.filter(
  (invoice) =>
    isReadyInvoice(invoice) &&
    getDateOnly(invoice.createdAt) === today
).length;

  const monthlyChart = chartData.map((item) => ({
    month: item.month,
    Income: Number(item.income || 0),
    Expenses: Number(item.expenses || 0),
  }));

  const incomeBreakdown = [
    { name: "Paid Invoice Revenue", value: paidInvoicesTotal },
    { name: "Outstanding Revenue", value: outstandingRevenue },
  ].filter((item) => item.value > 0);

  const expenseBreakdown = [
    { name: "Operating Expenses", value: totalExpenses },
    { name: "Payroll", value: totalPayroll },
  ].filter((item) => item.value > 0);

  const cardStyle = {
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "24px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 16px 36px rgba(15, 23, 42, 0.08)",
    background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
  };

  const COLORS = ["#16a34a", "#0ea5e9", "#dc2626", "#f97316"];

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0, color: "#0f172a" }}>Dashboard</h1>
          <p style={{ margin: "6px 0 0", color: "#64748b" }}>
            EKOS operational overview and customer activity.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} style={selectStyle}>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="all">All Time</option>
          </select>

          <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} style={selectStyle}>
            <option>All Locations</option>
            <option>Eltham Park</option>
            <option>Browns Town Square</option>
          </select>

          <button onClick={fetchDashboardData} style={primaryButtonStyle}>
            Refresh
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: "20px" }}>
  <DashboardCard title="New Sign Ups Today" value={newSignupsToday} color="#16a34a" link="/customers" linkText="View Customers" />
  <DashboardCard title="Ready Packages Today" value={packagesReadyToday} color="#f97316" link="/packages" linkText="View Packages" />
  <DashboardCard title="Packages Today" value={packagesToday} color="#0ea5e9" link="/packages" linkText="View Packages" />
  <DashboardCard title="New Tickets Today" value={newTicketsToday} color="#dc2626" link="/support-tickets" linkText="View Tickets" />
  <DashboardCard title="Ready Invoices Today" value={readyInvoicesToday} color="#7c3aed" link="/invoices" linkText="View Invoices" />
</div>

      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", marginBottom: "18px" }}>
          <h2 style={{ margin: 0, color: "#0f172a" }}>Income vs Expenses by Month</h2>
        </div>

        <div style={{ width: "100%", height: 360 }}>
          <ResponsiveContainer>
            <BarChart data={monthlyChart}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `${Number(value).toLocaleString()}`} />
              <Tooltip formatter={(value) => money(value)} />
              <Legend />
              <Bar dataKey="Income" fill="#16a34a" radius={[8, 8, 0, 0]} />
              <Bar dataKey="Expenses" fill="#dc2626" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
        <BreakdownCard title="Income Breakdown" data={incomeBreakdown} colors={COLORS} />
        <BreakdownCard title="Expense Breakdown" data={expenseBreakdown} colors={["#dc2626", "#f97316"]} />
      </div>
    </div>
  );
}

function DashboardCard({ title, value, color, link, linkText }) {
  return (
    <div style={{
      backgroundColor: "white",
      borderRadius: "16px",
      padding: "26px",
      border: "1px solid #e2e8f0",
      boxShadow: "0 14px 34px rgba(15, 23, 42, 0.08)",
      background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
    }}>
      <h2 style={{ margin: 0, color, fontSize: "30px" }}>{value}</h2>
      <p style={{ color: "#1e293b", fontSize: "18px", fontWeight: "bold" }}>{title}</p>
      <Link to={link} style={{ color: "#2563eb", fontWeight: "bold" }}>
        {linkText}
      </Link>
    </div>
  );
}

function BreakdownCard({ title, data, colors }) {
  return (
    <div style={{
      backgroundColor: "white",
      borderRadius: "16px",
      padding: "24px",
      border: "1px solid #e2e8f0",
      boxShadow: "0 10px 24px rgba(15, 23, 42, 0.06)",
      minHeight: "330px",
    }}>
      <h2 style={{ marginTop: 0 }}>{title}</h2>

      {data.length === 0 ? (
        <p style={{ color: "#64748b" }}>No data available yet.</p>
      ) : (
        <div style={{ width: "100%", height: 250 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={65} outerRadius={95}>
                {data.map((entry, index) => (
                  <Cell key={entry.name} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `JMD ${Number(value || 0).toLocaleString()}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

const selectStyle = {
  padding: "11px 14px",
  borderRadius: "10px",
  border: "1px solid #cbd5e1",
  backgroundColor: "white",
  fontWeight: "bold",
};

const primaryButtonStyle = {
  backgroundColor: "#16a34a",
  color: "white",
  border: "none",
  padding: "11px 18px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "bold",
};

const dashboardMoney = (value) =>
  value == null
    ? "—"
    : `J$${Number(value).toLocaleString("en-JM", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

const dashboardNumber = (value) =>
  value == null ? "—" : Number(value).toLocaleString();

const dashboardToday = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Jamaica",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const part = (type) =>
    parts.find((item) => item.type === type)?.value;

  return `${part("year")}-${part("month")}-${part("day")}`;
};

const dashboardShift = (date, days) =>
  new Date(
    new Date(`${date}T12:00:00Z`).getTime() +
      days * 86400000
  ).toISOString().slice(0, 10);

function dashboardRange(preset) {
  const today = dashboardToday();
  const year = Number(today.slice(0, 4));
  const month = Number(today.slice(5, 7));

  if (preset === "today") return { from: today, to: today };

  if (preset === "yesterday") {
    const yesterday = dashboardShift(today, -1);
    return { from: yesterday, to: yesterday };
  }

  if (preset === "last7") {
    return { from: dashboardShift(today, -6), to: today };
  }

  if (preset === "month") {
    return { from: `${today.slice(0, 7)}-01`, to: today };
  }

  if (preset === "lastMonth") {
    const lastDay = dashboardShift(
      `${today.slice(0, 7)}-01`,
      -1
    );
    return { from: `${lastDay.slice(0, 7)}-01`, to: lastDay };
  }

  if (preset === "quarter") {
    const firstMonth = Math.floor((month - 1) / 3) * 3 + 1;

    return {
      from: `${year}-${String(firstMonth).padStart(2, "0")}-01`,
      to: today,
    };
  }

  if (preset === "year") {
    return { from: `${year}-01-01`, to: today };
  }

  return { from: dashboardShift(today, -29), to: today };
}

function OperationalMetric({
  title,
  value,
  previous,
  format = dashboardNumber,
  note,
  compare = true,
}) {
  const difference =
    value != null && previous != null
      ? Number(value) - Number(previous)
      : null;

  const comparison =
    difference == null
      ? null
      : Number(previous) === 0
        ? Number(value) === 0
          ? "No change"
          : "No prior baseline"
        : `${difference > 0 ? "+" : ""}${(
            (difference / Math.abs(Number(previous))) *
            100
          ).toFixed(1)}%`;

  return (
    <article className="ek9-panel ek9-metric">
      <p className="ek9-label">{title}</p>
      <div className="ek9-value">{format(value)}</div>
      {compare && comparison && (
        <span className="ek9-comparison">{comparison}</span>
      )}
      <p className="ek9-note">{note}</p>
    </article>
  );
}

function OperationalPanel({ title, note, children }) {
  return (
    <section className="ek9-panel">
      <h2>{title}</h2>
      {note && <p className="ek9-note">{note}</p>}
      {children}
    </section>
  );
}

function OperationalBars({
  rows = [],
  labelKey = "label",
  valueKey = "amount",
  money = false,
}) {
  const maximum = Math.max(
    1,
    ...rows.map((row) => Number(row[valueKey] || 0))
  );

  if (!rows.length) {
    return <p className="ek9-note">No recorded activity.</p>;
  }

  return (
    <div className="ek9-bars">
      {rows.map((row) => (
        <div key={row[labelKey]}>
          <div className="ek9-bar-label">
            <span>{row[labelKey]}</span>
            <strong>
              {money
                ? dashboardMoney(row[valueKey])
                : dashboardNumber(row[valueKey])}
            </strong>
          </div>
          <div className="ek9-track">
            <div
              style={{
                width: `${
                  (Number(row[valueKey] || 0) / maximum) * 100
                }%`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function Dashboard() {
  const [preset, setPreset] = useState("last30");
  const [range, setRange] = useState(() =>
    dashboardRange("last30")
  );
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [showLegacy, setShowLegacy] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError("");
      setData(null);

      try {
        const response = await api.get(
          "/api/finance/operational-dashboard",
          { params: range }
        );

        if (!response.data.success || !response.data.data) {
          throw new Error("Dashboard response was unavailable.");
        }

        if (active) setData(response.data.data);
      } catch (failure) {
        if (active) {
          setError(
            failure.response?.data?.message ||
              failure.message ||
              "Could not load the dashboard."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [range.from, range.to, refresh]);

  const choosePreset = (value) => {
    setPreset(value);
    if (value !== "custom") setRange(dashboardRange(value));
  };

  const exportReport = () => {
    if (!data) return;

    const escape = (value) => {
      let text = String(value ?? "");

      // Prevent spreadsheet formulas in exported text.
      if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;

      return `"${text.replace(/"/g, '""')}"`;
    };

    const rows = [
      ["EKOS dashboard report"],
      ["Period", data.filters.from, data.filters.to],
      ["Scope", "All stores"],
      ["Measure", "Selected period", "Previous period"],
      ["Packages received", data.current.packagesReceived,
        data.previous.packagesReceived],
      ["Packages collected", data.current.packagesCollected,
        data.previous.packagesCollected],
      ["Money collected JMD", data.current.moneyCollected,
        data.previous.moneyCollected],
      ["Weight received lbs", data.current.weightReceived,
        data.previous.weightReceived],
      ["New customers", data.current.newCustomers,
        data.previous.newCustomers],
      ["Average collection days", data.current.averageDaysToCollect,
        data.previous.averageDaysToCollect],
      [],
            ["Invoiced JMD", data.current.invoiced,
        data.previous.invoiced],
      ["Currently uncollected packages", data.uncollected?.count],
      ["Currently uncollected weight lbs", data.uncollected?.weight],
      [],
      ["Uncollected waiting period", "Packages", "Weight lbs"],
      ...(data.uncollected?.buckets || []).map((row) => [
        row.label, row.count, row.weight,
      ]),
      [],
      ["Top customer", "EKON ID", "Receipts JMD", "Packages received"],
      ...(data.topCustomers?.rows || []).map((row) => [
        row.customerName, row.customerEkonId,
        row.amount, row.packagesReceived,
      ]),
      ["Receipts without customer ID",
        data.topCustomers?.unidentifiedReceipts],
      [],
      ["Invoicing basis", data.invoicing?.basis],
      ["Comparison scope",
        "Invoicing excludes marketplace; collections include recorded invoice payments including marketplace. Not a reconciliation."],
      [],
      ["Current balances", "JMD"],
      ["Invoice receivables", data.receivables?.outstanding],
      ["Vendor payables", data.payables?.outstanding],
      ["Shopping customer charges — do not add to receivables",
        data.shoppingAssistance?.current?.outstandingCustomerCharges],
      [],
      ["Cashier", "Payments", "Cash", "Card", "Bank", "Other", "Total"],
      ...(data.collections?.byCashier || []).map((row) => [
        row.cashierName, row.paymentCount, row.cash,
        row.card, row.bank, row.other, row.total,
      ]),
      [],
      ["Note", data.dataQuality.note],
      ["Collections", "Gross recorded receipts; refunds not deducted; EK Points excluded."],
      ["Receivables", "Marketplace receivables excluded."],
    ];

    const blob = new Blob(
      ["\uFEFF", rows.map((row) => row.map(escape).join(",")).join("\r\n")],
      { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `EKOS-dashboard-${range.from}-${range.to}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const current = data?.current || {};
  const previous = data?.previous || {};
  const shopping = data?.shoppingAssistance;

  return (
    <div className="ek9">
      <style>{`
        .ek9 {
          color:#17345b; display:grid; gap:22px;
          min-width:0; padding:4px;
        }
        .ek9 * { box-sizing:border-box; }
        .ek9 h1 { margin:0; font-size:28px; color:#1644a3; }
        .ek9 h2 { margin:0 0 8px; font-size:16px; color:#1644a3; }
        .ek9 p { line-height:1.5; }
        .ek9-header,.ek9-toolbar,.ek9-bar-label {
          display:flex; justify-content:space-between;
          align-items:center; gap:12px; flex-wrap:wrap;
        }
        .ek9-toolbar { justify-content:flex-start; }
        .ek9 button,.ek9 input,.ek9 select {
          font:inherit; border:1px solid #d6dfed;
          border-radius:9px; background:white; color:#1644a3;
          padding:9px 12px; min-height:40px;
        }
        .ek9 button { cursor:pointer; font-weight:600; }
        .ek9 button:disabled { opacity:.55; cursor:default; }
        .ek9 button[aria-pressed=true],.ek9 .ek9-primary {
          background:#245ce0; border-color:#245ce0; color:white;
        }
        .ek9 button:focus-visible,.ek9 a:focus-visible {
          outline:3px solid #f59a62; outline-offset:3px;
        }
        .ek9-panel {
          background:white; border:1px solid #dfe6f0;
          border-radius:14px; padding:20px; min-width:0;
          box-shadow:0 2px 5px #163b7410;
        }
        .ek9-cards {
          display:grid; grid-template-columns:repeat(4,minmax(0,1fr));
          gap:14px;
        }
        .ek9-columns {
          display:grid; grid-template-columns:repeat(2,minmax(0,1fr));
          gap:20px;
        }
        .ek9-label { margin:0 0 10px; color:#65758c; font-size:13px; }
        .ek9-value {
          font-size:clamp(21px,2vw,29px); font-weight:750;
          color:#1644a3; overflow-wrap:anywhere;
        }
        .ek9-note { color:#687a91; font-size:12px; margin:8px 0; }
        .ek9-comparison {
          display:inline-block; margin-top:8px; font-size:11px;
          background:#eef3ff; color:#2452af;
          padding:3px 7px; border-radius:20px;
        }
        .ek9-notice {
          background:#fff7ef; border-left:4px solid #f4772c;
          border-radius:8px; padding:12px 16px; font-size:13px;
        }
        .ek9-bars { display:grid; gap:20px; margin-top:24px; }
        .ek9-bar-label { font-size:13px; margin-bottom:7px; }
        .ek9-track { height:8px; background:#edf1f8; border-radius:8px; }
        .ek9-track>div {
          height:100%; background:#2c65dc; border-radius:8px;
        }
        .ek9-table-wrap { overflow-x:auto; margin-top:18px; }
        .ek9 table { border-collapse:collapse; width:100%; font-size:12px; }
        .ek9 th,.ek9 td {
          padding:12px 10px; border-bottom:1px solid #e7ecf4;
          text-align:right; white-space:nowrap;
        }
        .ek9 th:first-child,.ek9 td:first-child { text-align:left; }
        .ek9 th { color:#697b91; font-weight:600; }
        .ek9 a { color:#245ce0; font-weight:600; }
        .ek9-links { display:flex; flex-wrap:wrap; gap:16px; }
        .ek9 summary { cursor:pointer; color:#1644a3; font-weight:600; }
        @media(max-width:1050px) {
          .ek9-cards { grid-template-columns:repeat(2,minmax(0,1fr)); }
        }
        @media(max-width:700px) {
          .ek9-columns { grid-template-columns:minmax(0,1fr); }
          .ek9-panel { padding:16px; }
          .ek9 { gap:16px; }
          .ek9-toolbar { gap:7px; }
          .ek9-toolbar button { font-size:12px; padding:8px; }
        }
      `}</style>

      <header className="ek9-header">
        <div>
          <h1>Dashboard</h1>
          <p className="ek9-note">
            {range.from} – {range.to}
            {data && (
              <> · Compared with {data.filters.previousFrom} – {data.filters.previousTo}</>
            )}
          </p>
        </div>
        <div className="ek9-toolbar">
          <button
            disabled={loading}
            onClick={() => setRefresh((value) => value + 1)}
          >
            {loading ? "Loading…" : "Refresh"}
          </button>
          <button
            className="ek9-primary"
            disabled={!data || loading}
            onClick={exportReport}
          >
            Export report
          </button>
        </div>
      </header>

      <div className="ek9-toolbar" aria-label="Reporting period">
        {[
          ["today", "Today"],
          ["yesterday", "Yesterday"],
          ["last7", "Last 7 days"],
          ["last30", "Last 30 days"],
          ["month", "This month"],
          ["lastMonth", "Last month"],
          ["quarter", "This quarter"],
          ["year", "This year"],
          ["custom", "Custom"],
        ].map(([value, label]) => (
          <button
            key={value}
            aria-pressed={preset === value}
            onClick={() => choosePreset(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {preset === "custom" && (
        <div className="ek9-toolbar">
          <label>
            From{" "}
            <input
              type="date"
              value={range.from}
              onChange={(event) =>
                setRange((value) => ({
                  ...value,
                  from: event.target.value,
                }))
              }
            />
          </label>
          <label>
            To{" "}
            <input
              type="date"
              value={range.to}
              onChange={(event) =>
                setRange((value) => ({
                  ...value,
                  to: event.target.value,
                }))
              }
            />
          </label>
          <span className="ek9-note">Maximum 366 days · Jamaica time</span>
        </div>
      )}

      <p className="ek9-note">
        All stores · Balances and current package statuses are shown as
        they stand now. Activity follows the selected period.
      </p>

      {error && <div className="ek9-notice" role="alert">{error}</div>}
      {loading && <p role="status">Loading dashboard figures…</p>}

      {data && (
        <>
          <div className="ek9-notice">
            {data.dataQuality.note}
          </div>

          <div className="ek9-cards">
            <OperationalMetric title="Packages received"
              value={current.packagesReceived}
              previous={previous.packagesReceived}
              note="By recorded received date" />
            <OperationalMetric title="Packages collected"
              value={current.packagesCollected}
              previous={previous.packagesCollected}
              note="By recorded collection date" />
            <OperationalMetric title="Money collected"
              value={current.moneyCollected}
              previous={previous.moneyCollected}
              format={dashboardMoney}
              note="Gross receipts · excludes EK Points" />
            <OperationalMetric title="Invoice receivables"
              value={data.receivables?.outstanding}
              format={dashboardMoney} compare={false}
              note="Current balance · excludes marketplace" />
            <OperationalMetric title="Weight received"
              value={current.weightReceived}
              previous={previous.weightReceived}
              format={(value) => `${dashboardNumber(value)} lbs`}
              note="Recorded package weight" />
            <OperationalMetric title="New customers"
              value={current.newCustomers}
              previous={previous.newCustomers}
              note="By signup date" />
            <OperationalMetric title="Average days to collect"
              value={current.averageDaysToCollect}
              previous={previous.averageDaysToCollect}
              format={(value) =>
                value == null ? "Not available" : `${value} days`}
              note={`${current.collectionTimeSampleSize || 0} packages with usable dates`} />
                          <OperationalMetric
              title="Invoiced"
              value={current.invoiced}
              previous={previous.invoiced}
              format={dashboardMoney}
              note="By creation date · excludes marketplace"
            />
            <OperationalMetric title="Accounts payable"
              value={data.payables?.outstanding}
              format={dashboardMoney} compare={false}
              note="Current recorded vendor balances" />
          </div>

          <div className="ek9-columns">
            <OperationalPanel title="Received vs collected"
              note="Daily package activity in the selected period">
              <div style={{ height: 280, width: "100%", minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.daily}>
                    <CartesianGrid vertical={false} stroke="#e9edf5" />
                    <XAxis dataKey="date" tickFormatter={(date) => date.slice(5)}
                      tick={{ fontSize: 10 }} minTickGap={24} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="received" name="Received" fill="#2861dc" />
                    <Bar dataKey="collected" name="Collected" fill="#f4772c" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </OperationalPanel>

                        <OperationalPanel
              title="Invoiced vs collected"
              note="Invoice face value versus gross receipts · marketplace excluded from invoiced"
            >
              <div style={{ height: 280, width: "100%", minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.daily}>
                    <CartesianGrid
                      vertical={false}
                      stroke="#e9edf5"
                    />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(date) => date.slice(5)}
                      tick={{ fontSize: 10 }}
                      minTickGap={24}
                    />
                    <YAxis
                      tickFormatter={(value) =>
                        `J$${Number(value).toLocaleString()}`
                      }
                      tick={{ fontSize: 10 }}
                      width={75}
                    />
                    <Tooltip
                      formatter={(value) => dashboardMoney(value)}
                    />
                    <Legend />
                    <Bar
                      dataKey="invoiced"
                      name="Invoiced"
                      fill="#2861dc"
                    />
                    <Bar
                      dataKey="moneyCollected"
                      name="Collected"
                      fill="#f4772c"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="ek9-note">
                {data.invoicing?.basis}
                {" "}Collections include recorded invoice payments
                across channels, including marketplace payments;
                refunds are not deducted. These series have different
                scopes and are not a reconciliation.
              </p>
            </OperationalPanel>

            <OperationalPanel title="Where this period’s packages are now"
              note="Current status of packages received during the selected period">
              <OperationalBars
                rows={data.receivedPackageCurrentStatuses}
                labelKey="status" valueKey="count" />
            </OperationalPanel>

            <OperationalPanel title="Collections by store"
              note="Recorded payment branch · unknown branches remain unassigned">
              <OperationalBars rows={data.collections?.byBranch}
                labelKey="branch" valueKey="amount" money />
            </OperationalPanel>
          </div>

                    <div className="ek9-columns">
            <OperationalPanel
              title="Uncollected packages"
              note="Ready for pickup right now · includes paid packages"
            >
              <div className="ek9-bar-label">
                <strong>
                  {dashboardNumber(data.uncollected?.count)} packages
                </strong>
                <span>
                  {dashboardNumber(data.uncollected?.weight)} lbs
                </span>
              </div>

              <OperationalBars
                rows={data.uncollected?.buckets}
                labelKey="label"
                valueKey="count"
              />

              <div className="ek9-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Waiting period</th>
                      <th>Packages</th>
                      <th>Weight</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.uncollected?.buckets || []).map((row) => (
                      <tr key={row.label}>
                        <td>{row.label}</td>
                        <td>{dashboardNumber(row.count)}</td>
                        <td>{dashboardNumber(row.weight)} lbs</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="ek9-note">
                {data.uncollected?.note}
              </p>
            </OperationalPanel>

            <OperationalPanel
              title="Top customers"
              note="By identified receipts, then packages received"
            >
              <div className="ek9-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Receipts</th>
                      <th>Packages</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.topCustomers?.rows || []).map((row) => (
                      <tr key={row.customerEkonId}>
                        <td>
                          <strong>{row.customerName}</strong>
                          <br />
                          {row.customerEkonId}
                        </td>
                        <td>{dashboardMoney(row.amount)}</td>
                        <td>
                          {dashboardNumber(row.packagesReceived)}
                        </td>
                      </tr>
                    ))}

                    {!data.topCustomers?.rows?.length && (
                      <tr>
                        <td colSpan={3}>
                          No identified customer receipts in this period.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <p className="ek9-note">
                {data.topCustomers?.basis}
              </p>
              <p className="ek9-note">
                Receipts without a customer ID:{" "}
                {dashboardMoney(
                  data.topCustomers?.unidentifiedReceipts
                )}
                . These remain included in total collections.
              </p>
            </OperationalPanel>
          </div>

          <OperationalPanel title="Shopping assistance"
            note="Purchase costs and recorded assistance fees are separate measures">
            <div className="ek9-cards">
              <OperationalMetric title="Purchases in this period"
                value={shopping?.period?.purchaseCount}
                compare={false} note="Excludes pending requests" />
              <OperationalMetric title="Goods purchased"
                value={shopping?.period?.goodsCost}
                format={dashboardMoney} compare={false}
                note="JMD purchase cost · not service revenue" />
              <OperationalMetric title="Recorded assistance fees"
                value={shopping?.period?.recordedAssistanceFees}
                format={dashboardMoney} compare={false}
                note="For purchases in this period · not cash received" />
              <OperationalMetric title="Outstanding customer charges"
                value={shopping?.current?.outstandingCustomerCharges}
                format={dashboardMoney} compare={false}
                note="Current shopping balances · overlaps invoice AR" />
            </div>
            <p className="ek9-note">{shopping?.note}</p>
            <OperationalBars rows={shopping?.current?.statusCounts}
              labelKey="status" valueKey="count" />
          </OperationalPanel>

          <div className="ek9-columns">
            {[
              ["Accounts receivable", data.receivables],
              ["Accounts payable", data.payables],
            ].map(([title, summary]) => (
              <OperationalPanel key={title} title={title}
                note={summary?.basis}>
                <div className="ek9-bar-label">
                  <span>Overdue now</span>
                  <strong>{dashboardMoney(summary?.overdue)}</strong>
                </div>
                <div className="ek9-bar-label">
                  <span>Due today through the next 7 days</span>
                  <strong>{dashboardMoney(summary?.dueNextSevenDays)}</strong>
                </div>
                <OperationalBars rows={summary?.aging} money />
                <details style={{ marginTop: 20 }}>
                  <summary>Earliest due balances</summary>
                  <div className="ek9-table-wrap">
                    <table>
                      <thead><tr>
                        <th>Name / reference</th><th>Due</th><th>Balance</th>
                      </tr></thead>
                      <tbody>
                        {(summary?.oldestDue || []).map((row) => (
                          <tr key={row.reference}>
                            <td>{row.name}<br />{row.reference}</td>
                            <td>{row.dueDate}</td>
                            <td>{dashboardMoney(row.balance)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              </OperationalPanel>
            ))}
          </div>

          <OperationalPanel title="Collected by cashier"
            note="Payment counts include separate instalments on the same invoice">
            <div className="ek9-table-wrap">
              <table>
                <thead><tr>
                  <th>Cashier</th><th>Payments</th><th>Cash</th>
                  <th>Card</th><th>Bank</th><th>Other</th><th>Total</th>
                </tr></thead>
                <tbody>
                  {(data.collections?.byCashier || []).map((row) => (
                    <tr key={row.cashierUserId || row.cashierName}>
                      <td>{row.cashierName}</td>
                      <td>{row.paymentCount}</td>
                      <td>{dashboardMoney(row.cash)}</td>
                      <td>{dashboardMoney(row.card)}</td>
                      <td>{dashboardMoney(row.bank)}</td>
                      <td>{dashboardMoney(row.other)}</td>
                      <td><strong>{dashboardMoney(row.total)}</strong></td>
                    </tr>
                  ))}
                  {!data.collections?.byCashier?.length && (
                    <tr><td colSpan={7}>No recorded payments in this period.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </OperationalPanel>

          <details className="ek9-panel">
            <summary>Data coverage</summary>
            <p className="ek9-note">
              Delivered packages without collection dates:{" "}
              {data.dataQuality.deliveredWithoutCollectionDate}
              <br />
              Payments without branch:{" "}
              {data.dataQuality.currentPaymentsWithoutBranch}
              <br />
              Payments without cashier:{" "}
              {data.dataQuality.currentPaymentsWithoutCashier}
              <br />
              Non-JMD payments excluded:{" "}
              {data.dataQuality.excludedNonJmdPaymentCount}
              <br />
              Invalid payment records excluded:{" "}
              {data.dataQuality.invalidPaymentCount}
              <br />
              Marketplace receivables are excluded. Collections are
              gross recorded receipts and do not confirm bank settlement.
            </p>
          </details>
        </>
      )}

      <nav className="ek9-panel ek9-links" aria-label="Dashboard shortcuts">
        <Link to="/customers">Customers</Link>
        <Link to="/packages">Packages</Link>
        <Link to="/invoices">Invoices</Link>
        <Link to="/support-tickets">Support tickets</Link>
      </nav>

      <details className="ek9-panel"
        onToggle={(event) => setShowLegacy(event.currentTarget.open)}>
        <summary>Previous dashboard reports</summary>
        {showLegacy && (
          <div style={{ marginTop: 20 }}>
                        <div className="ek9-legacy">
              <LegacyDashboard />
            </div>
          </div>
        )}
      </details>
    </div>
  );
}

export default Dashboard;