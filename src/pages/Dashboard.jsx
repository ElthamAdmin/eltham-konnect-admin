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
      const [customersRes, packagesRes, invoicesRes, chartRes, financeSummaryRes] =
        await Promise.all([
          api.get("/api/customers"),
          api.get("/api/packages"),
          api.get("/api/invoices"),
          api.get("/api/finance/monthly-chart"),
          api.get(
            `/api/finance/summary?filter=${getFinanceFilter()}&branch=${encodeURIComponent(
              getFinanceBranch()
            )}`
          ),
        ]);

      setCustomers(customersRes.data.data || []);
      setPackages(packagesRes.data.data || []);
      setInvoices(invoicesRes.data.data || []);
      setChartData(chartRes.data.data || []);
      setFinanceSummary(financeSummaryRes.data.data || null);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [dateFilter, locationFilter]);

  const money = (value) => `JMD ${Number(value || 0).toLocaleString()}`;

  const outstandingRevenue = Number(financeSummary?.outstandingRevenue || 0);
  const totalExpenses = Number(financeSummary?.totalExpenses || 0);
  const totalPayroll = Number(financeSummary?.totalPayroll || 0);
  const netPosition = Number(financeSummary?.netPosition || 0);
  const paidInvoicesTotal = Number(financeSummary?.totalRevenue || 0);

  const filterLabel =
    dateFilter === "today"
      ? "Today"
      : dateFilter === "week"
      ? "This Week"
      : dateFilter === "month"
      ? "This Month"
      : "All Time";

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
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.06)",
  };

  const COLORS = ["#16a34a", "#0ea5e9", "#dc2626", "#f97316"];

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "16px",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div>
          <h1 style={{ margin: 0, color: "#0f172a" }}>Dashboard</h1>
          <p style={{ margin: "6px 0 0", color: "#64748b" }}>
            EKOS financial and operations overview.
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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px" }}>
        <DashboardCard title={`Outstanding Revenue - ${filterLabel}`} value={money(outstandingRevenue)} color="#dc2626" link="/invoices" linkText="View Invoices" />
        <DashboardCard title={`Expenses + Payroll - ${filterLabel}`} value={money(totalExpenses + totalPayroll)} color="#dc2626" link="/finance" linkText="View Finance" />
        <DashboardCard title={`Net Position - ${filterLabel}`} value={money(netPosition)} color={netPosition >= 0 ? "#16a34a" : "#dc2626"} link="/finance" linkText="View Finance" />
      </div>

      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", marginBottom: "18px" }}>
          <h2 style={{ margin: 0, color: "#0f172a" }}>Income vs Expenses by Month</h2>
          <button style={secondaryButtonStyle}>Export</button>
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
    <div
      style={{
        backgroundColor: "white",
        borderRadius: "16px",
        padding: "26px",
        border: "1px solid #e2e8f0",
        boxShadow: "0 10px 24px rgba(15, 23, 42, 0.06)",
      }}
    >
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
    <div
      style={{
        backgroundColor: "white",
        borderRadius: "16px",
        padding: "24px",
        border: "1px solid #e2e8f0",
        boxShadow: "0 10px 24px rgba(15, 23, 42, 0.06)",
        minHeight: "330px",
      }}
    >
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

const secondaryButtonStyle = {
  backgroundColor: "white",
  color: "#334155",
  border: "1px solid #cbd5e1",
  padding: "10px 16px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "bold",
};

export default Dashboard;