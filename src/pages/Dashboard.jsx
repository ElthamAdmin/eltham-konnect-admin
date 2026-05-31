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

function Dashboard() {
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
  const parsed = new Date(value);

  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString("en-CA", {
      timeZone: "America/Jamaica",
    });
  }

  return String(value).slice(0, 10);
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

export default Dashboard;