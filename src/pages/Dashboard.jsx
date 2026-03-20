import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

function Dashboard() {
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [totalPackages, setTotalPackages] = useState(0);
  const [readyPackages, setReadyPackages] = useState(0);
  const [paidInvoicesTotal, setPaidInvoicesTotal] = useState(0);
  const [chartData, setChartData] = useState([]);

  const fetchDashboardData = async () => {
    try {
      const [customersRes, packagesRes, invoicesRes, chartRes] = await Promise.all([
        axios.get("http://localhost:5000/api/customers"),
        axios.get("http://localhost:5000/api/packages"),
        axios.get("http://localhost:5000/api/invoices"),
        axios.get("http://localhost:5000/api/finance/monthly-chart"),
      ]);

      const packages = packagesRes.data.data || [];
      const invoices = invoicesRes.data.data || [];
      const monthlyChart = chartRes.data.data || [];

      setTotalCustomers(customersRes.data.totalCustomers || 0);
      setTotalPackages(packages.length);
      setReadyPackages(
        packages.filter((pkg) => pkg.status === "Ready for Pickup").length
      );

      const paidTotal = invoices
        .filter((inv) => inv.status === "Paid")
        .reduce((sum, inv) => sum + Number(inv.finalTotal || 0), 0);

      setPaidInvoicesTotal(paidTotal);
      setChartData(monthlyChart);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const cardStyle = {
    backgroundColor: "white",
    borderRadius: "10px",
    padding: "24px",
    border: "1px solid #e5e7eb",
    minHeight: "160px",
  };

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

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "15px",
          marginBottom: "25px",
        }}
      >
        <button
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
          FILTER DATE
        </button>

        <select
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
            {totalCustomers}
          </h3>
          <p style={{ fontSize: "18px", fontWeight: "bold", color: "#334155" }}>
            New Sign Ups - Today
          </p>
          <Link to="/customers">View Customers</Link>
        </div>

        <div style={cardStyle}>
          <h3 style={{ marginTop: 0, fontSize: "28px", color: "#1f3552" }}>
            {readyPackages}
          </h3>
          <p style={{ fontSize: "18px", fontWeight: "bold", color: "#334155" }}>
            Packages Ready - Today
          </p>
          <Link to="/packages">View Packages</Link>
        </div>

        <div style={cardStyle}>
          <h3 style={{ marginTop: 0, fontSize: "28px", color: "#1f3552" }}>
            {totalPackages}
          </h3>
          <p style={{ fontSize: "18px", fontWeight: "bold", color: "#334155" }}>
            Total Packages
          </p>
          <Link to="/packages">View Packages</Link>
        </div>

        <div style={cardStyle}>
          <h3 style={{ marginTop: 0, fontSize: "28px", color: "#1f3552" }}>
            JMD {paidInvoicesTotal.toLocaleString()}
          </h3>
          <p style={{ fontSize: "18px", fontWeight: "bold", color: "#334155" }}>
            Total Paid Invoices - Today
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