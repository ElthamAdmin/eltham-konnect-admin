import { useEffect, useState } from "react";
import api from "../api";

function BusinessAnalytics() {
  const [analytics, setAnalytics] = useState(null);

  const fetchAnalytics = async () => {
    try {
      const res = await api.get(
        "/api/business-analytics"
      );

      setAnalytics(res.data.data);
    } catch (error) {
      console.error(error);
      alert("Could not load business analytics.");
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const totals = analytics?.totals || {};

  const cardStyle = {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "12px",
    border: "1px solid #dbe3ef",
  };

  const metricCard = (label, value, color) => (
    <div style={cardStyle}>
      <h2
        style={{
          margin: 0,
          color,
          fontSize: "32px",
        }}
      >
        {value}
      </h2>

      <p
        style={{
          marginBottom: 0,
          fontWeight: "bold",
        }}
      >
        {label}
      </p>
    </div>
  );

  return (
    <div>
      <h1>Business Analytics</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        {metricCard(
          "Customers",
          totals.customers || 0,
          "#2563eb"
        )}

        {metricCard(
          "Revenue",
          `JMD ${Number(
            totals.totalRevenue || 0
          ).toLocaleString()}`,
          "#16a34a"
        )}

        {metricCard(
          "Expenses",
          `JMD ${Number(
            totals.totalExpenses || 0
          ).toLocaleString()}`,
          "#dc2626"
        )}

        {metricCard(
          "Estimated Profit",
          `JMD ${Number(
            totals.estimatedProfit || 0
          ).toLocaleString()}`,
          "#7c3aed"
        )}

        {metricCard(
          "Packages",
          totals.packagesReceived || 0,
          "#ea580c"
        )}

        {metricCard(
          "Unpaid Invoices",
          totals.unpaidInvoices || 0,
          "#b91c1c"
        )}

        {metricCard(
          "Resolved Tickets",
          totals.supportResolved || 0,
          "#0891b2"
        )}

        {metricCard(
          "Avg Resolution Time",
          `${totals.avgResolutionMinutes || 0} mins`,
          "#475569"
        )}
      </div>

      <div style={cardStyle}>
        <h2>Package Weight Analytics</h2>

        <table
          border="1"
          cellPadding="10"
          style={{
            width: "100%",
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr>
              <th>Weight</th>
              <th>Total Packages</th>
            </tr>
          </thead>

          <tbody>
            {Object.entries(
              analytics?.packageWeightAnalytics || {}
            ).map(([weight, count]) => (
              <tr key={weight}>
                <td>{weight} lb</td>
                <td>{count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div
        style={{
          ...cardStyle,
          marginTop: "24px",
        }}
      >
        <h2>Staff Productivity</h2>

        <table
          border="1"
          cellPadding="10"
          style={{
            width: "100%",
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr>
              <th>Staff</th>
              <th>Role</th>
              <th>Assigned Tickets</th>
              <th>Resolved</th>
            </tr>
          </thead>

          <tbody>
            {(analytics?.staffProductivity || []).map(
              (staff) => (
                <tr key={staff.fullName}>
                  <td>{staff.fullName}</td>
                  <td>{staff.role}</td>
                  <td>{staff.assignedTickets}</td>
                  <td>{staff.resolvedTickets}</td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default BusinessAnalytics;