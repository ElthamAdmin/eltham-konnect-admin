import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

function Dashboard() {
  const [customers, setCustomers] = useState([]);
  const [packages, setPackages] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [dateFilter, setDateFilter] = useState("today");
  const [locationFilter, setLocationFilter] = useState("All Locations");

  const fetchDashboardData = async () => {
    try {
      const [customersRes, packagesRes, invoicesRes, chartRes] = await Promise.all([
        api.get("/api/customers"),
        api.get("/api/packages"),
        api.get("/api/invoices"),
        api.get("/api/finance/monthly-chart"),
      ]);

      setCustomers(customersRes.data.data || []);
      setPackages(packagesRes.data.data || []);
      setInvoices(invoicesRes.data.data || []);
      setChartData(chartRes.data.data || []);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const parseDate = (value) => {
    if (!value) return null;

    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value;
    }

    if (typeof value === "string") {
      const short = value.slice(0, 10);

      if (/^\d{4}-\d{2}-\d{2}$/.test(short)) {
        return new Date(`${short}T00:00:00`);
      }

      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const startOfToday = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  };

  const endOfToday = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  };

  const startOfWeek = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = day === 0 ? 6 : day - 1;
    const start = new Date(now);
    start.setDate(now.getDate() - diff);
    start.setHours(0, 0, 0, 0);
    return start;
  };

  const startOfMonth = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  };

  const isWithinSelectedRange = (dateValue) => {
    if (dateFilter === "all") return true;

    const date = parseDate(dateValue);
    if (!date) return false;

    const now = new Date();

    if (dateFilter === "today") {
      return date >= startOfToday() && date <= endOfToday();
    }

    if (dateFilter === "week") {
      return date >= startOfWeek() && date <= now;
    }

    if (dateFilter === "month") {
      return date >= startOfMonth() && date <= now;
    }

    return true;
  };

  const matchesLocation = (item) => {
    if (locationFilter === "All Locations") return true;

    return (
      item.branch === locationFilter ||
      item.location === locationFilter ||
      item.pickupBranch === locationFilter ||
      item.warehouseLocation === locationFilter
    );
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter(
      (customer) =>
        matchesLocation(customer) &&
        isWithinSelectedRange(customer.signUpDate || customer.createdAt)
    );
  }, [customers, dateFilter, locationFilter]);

  const filteredPackages = useMemo(() => {
    return packages.filter(
      (pkg) =>
        matchesLocation(pkg) &&
        isWithinSelectedRange(pkg.dateReceived || pkg.createdAt)
    );
  }, [packages, dateFilter, locationFilter]);

  const filteredReadyPackages = useMemo(() => {
    return packages.filter((pkg) => {
      const isReady = pkg.status === "Ready for Pickup" || pkg.readyForPickup === true;

      if (!isReady) return false;
      if (!matchesLocation(pkg)) return false;

      return isWithinSelectedRange(
        pkg.readyForPickupDate ||
          pkg.statusUpdatedAt ||
          pkg.dateReceived ||
          pkg.createdAt
      );
    });
  }, [packages, dateFilter, locationFilter]);

  const filteredPaidInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const isPaid = String(inv.status || "").trim().toLowerCase() === "paid";
      if (!isPaid) return false;
      if (!matchesLocation(inv)) return locationFilter === "All Locations";

      return isWithinSelectedRange(inv.paidAt || inv.paidDate || inv.createdAt);
    });
  }, [invoices, dateFilter, locationFilter]);

  const newSignupsCount = filteredCustomers.length;
  const packagesReadyCount = filteredReadyPackages.length;
  const totalPackagesCount = filteredPackages.length;

  const paidInvoicesTotal = filteredPaidInvoices.reduce(
    (sum, inv) => sum + Number(inv.finalTotal || 0),
    0
  );

  const maxChartValue =
    chartData.length > 0
      ? Math.max(
          ...chartData.flatMap((item) => [
            Number(item.income || 0),
            Number(item.expenses || 0),
          ]),
          1
        )
      : 1;

  const filterLabel =
    dateFilter === "today"
      ? "Today"
      : dateFilter === "week"
      ? "This Week"
      : dateFilter === "month"
      ? "This Month"
      : "All Time";

  const cardStyle = {
    backgroundColor: "white",
    borderRadius: "10px",
    padding: "24px",
    border: "1px solid #e5e7eb",
    minHeight: "160px",
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "15px",
          marginBottom: "25px",
          flexWrap: "wrap",
        }}
      >
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          style={{
            backgroundColor: "#1D9BF0",
            color: "white",
            border: "none",
            padding: "12px 20px",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          <option value="today" style={{ color: "black" }}>Today</option>
          <option value="week" style={{ color: "black" }}>This Week</option>
          <option value="month" style={{ color: "black" }}>This Month</option>
          <option value="all" style={{ color: "black" }}>All Time</option>
        </select>

        <select
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          style={{
            padding: "12px 16px",
            borderRadius: "6px",
            border: "1px solid #d1d5db",
            minWidth: "180px",
          }}
        >
          <option>All Locations</option>
          <option>Eltham Park</option>
          <option>Browns Town Square</option>
        </select>

        <button
          onClick={fetchDashboardData}
          style={{
            backgroundColor: "#16c784",
            color: "white",
            border: "none",
            padding: "12px 20px",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          REFRESH
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "20px",
          marginBottom: "30px",
        }}
      >
        <div style={cardStyle}>
          <h3 style={{ marginTop: 0, fontSize: "28px", color: "#1f3552" }}>
            {newSignupsCount}
          </h3>
          <p style={{ fontSize: "18px", fontWeight: "bold", color: "#334155" }}>
            New Sign Ups - {filterLabel}
          </p>
          <Link to="/customers">View Customers</Link>
        </div>

        <div style={cardStyle}>
          <h3 style={{ marginTop: 0, fontSize: "28px", color: "#1f3552" }}>
            {packagesReadyCount}
          </h3>
          <p style={{ fontSize: "18px", fontWeight: "bold", color: "#334155" }}>
            Packages Ready - {filterLabel}
          </p>
          <Link to="/packages">View Packages</Link>
        </div>

        <div style={cardStyle}>
          <h3 style={{ marginTop: 0, fontSize: "28px", color: "#1f3552" }}>
            {totalPackagesCount}
          </h3>
          <p style={{ fontSize: "18px", fontWeight: "bold", color: "#334155" }}>
            Total Packages - {filterLabel}
          </p>
          <Link to="/packages">View Packages</Link>
        </div>

        <div style={cardStyle}>
          <h3 style={{ marginTop: 0, fontSize: "28px", color: "#1f3552" }}>
            JMD {paidInvoicesTotal.toLocaleString()}
          </h3>
          <p style={{ fontSize: "18px", fontWeight: "bold", color: "#334155" }}>
            Paid Invoices - {filterLabel}
          </p>
          <Link to="/invoices">View Invoices</Link>
        </div>
      </div>

      <div
        style={{
          backgroundColor: "white",
          borderRadius: "10px",
          border: "1px solid #e5e7eb",
          padding: "25px",
          minHeight: "320px",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Income vs Expenses by Month</h2>

        {chartData.length > 0 ? (
          <div
            style={{
              marginTop: "20px",
              height: "230px",
              display: "flex",
              alignItems: "flex-end",
              gap: "24px",
              overflowX: "auto",
              paddingBottom: "10px",
            }}
          >
            {chartData.map((item, index) => {
              const incomeHeight = `${(Number(item.income || 0) / maxChartValue) * 180}px`;
              const expenseHeight = `${(Number(item.expenses || 0) / maxChartValue) * 180}px`;

              return (
                <div
                  key={index}
                  style={{
                    minWidth: "120px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      height: "190px",
                      display: "flex",
                      alignItems: "flex-end",
                      justifyContent: "center",
                      gap: "10px",
                    }}
                  >
                    <div
                      title={`Income: JMD ${Number(item.income || 0).toLocaleString()}`}
                      style={{
                        width: "34px",
                        height: incomeHeight,
                        backgroundColor: "#16a34a",
                        borderRadius: "6px 6px 0 0",
                      }}
                    ></div>

                    <div
                      title={`Expenses: JMD ${Number(item.expenses || 0).toLocaleString()}`}
                      style={{
                        width: "34px",
                        height: expenseHeight,
                        backgroundColor: "#dc2626",
                        borderRadius: "6px 6px 0 0",
                      }}
                    ></div>
                  </div>

                  <div style={{ marginTop: "10px", fontWeight: "bold", color: "#334155" }}>
                    {item.month}
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>Green: Income</div>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>Red: Expenses</div>
                </div>
              );
            })}
          </div>
        ) : (
          <p style={{ color: "#64748b" }}>No monthly finance chart data found yet.</p>
        )}
      </div>
    </div>
  );
}

export default Dashboard;