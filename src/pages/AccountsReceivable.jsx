import { useEffect, useMemo, useState } from "react";
import api from "../api";

function AccountsReceivable() {
  const [dashboard, setDashboard] = useState(null);
  const [aging, setAging] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const ROYAL_BLUE = "#0B3D91";
  const BORDER = "#dbe3ef";
  const MUTED = "#64748b";

  const money = (value) => `JMD ${Number(value || 0).toLocaleString()}`;

  const loadReceivables = async () => {
    try {
      const [dashboardRes, agingRes] = await Promise.all([
        api.get("/api/accounts-receivable/collections-dashboard"),
        api.get("/api/accounts-receivable/aging"),
      ]);

      setDashboard(dashboardRes.data.data);
      setAging(agingRes.data.data);
    } catch (error) {
      console.error("Accounts receivable error:", error);
      alert(error?.response?.data?.message || "Could not load receivables.");
    }
  };

  useEffect(() => {
    loadReceivables();
  }, []);

  const rows = aging?.rows || [];

  const filteredRows = useMemo(() => {
    return rows.filter((row) =>
      `${row.invoiceNumber} ${row.customerName} ${row.customerEkonId}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  }, [rows, searchTerm]);

  const getAgeDays = (value) => {
    if (!value) return 0;
    const created = new Date(value);
    if (Number.isNaN(created.getTime())) return 0;
    const diff = Date.now() - created.getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  };

  return (
    <div>
      <h1 style={{ margin: 0 }}>Accounts Receivable</h1>
      <p style={{ marginTop: "6px", color: MUTED }}>
        Collections dashboard, aging, customer balances, and receivable health.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "14px", margin: "18px 0" }}>
        <Card><h2 style={{ color: ROYAL_BLUE, margin: 0 }}>{money(dashboard?.kpis?.totalOutstanding)}</h2><p><b>Total Outstanding</b></p></Card>
        <Card><h2 style={{ color: "#16a34a", margin: 0 }}>{money(dashboard?.kpis?.currentAmount)}</h2><p><b>Current / 1-30</b></p></Card>
        <Card><h2 style={{ color: "#f59e0b", margin: 0 }}>{money(dashboard?.agingBuckets?.["31-60"])}</h2><p><b>31-60 Days</b></p></Card>
        <Card><h2 style={{ color: "#ea580c", margin: 0 }}>{money(dashboard?.agingBuckets?.["61-90"])}</h2><p><b>61-90 Days</b></p></Card>
        <Card><h2 style={{ color: "#dc2626", margin: 0 }}>{money(dashboard?.agingBuckets?.["90+"])}</h2><p><b>90+ Days</b></p></Card>
        <Card><h2 style={{ color: "#7c3aed", margin: 0 }}>{dashboard?.kpis?.overdueCustomers || 0}</h2><p><b>Overdue Customers</b></p></Card>
        <Card><h2 style={{ color: "#0f766e", margin: 0 }}>{dashboard?.kpis?.diagnosticHealthScore?.score || 0}</h2><p><b>AR Health Score</b></p></Card>
        <Card><h2 style={{ color: dashboard?.kpis?.reconciliationDifference === 0 ? "#16a34a" : "#dc2626", margin: 0 }}>{money(dashboard?.kpis?.reconciliationDifference)}</h2><p><b>GL Difference</b></p></Card>
      </div>

      <Section title="Collections Recommendations">
        {(dashboard?.recommendations || []).length > 0 ? (
          <ul>
            {dashboard.recommendations.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        ) : (
          <p style={{ color: MUTED }}>No collection recommendations available.</p>
        )}
      </Section>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "16px", marginBottom: "16px" }}>
        <MiniTable title="Top Debtors" rows={dashboard?.topDebtors || []} money={money} />
        <MiniTable title="Oldest Outstanding Invoices" rows={dashboard?.oldestInvoices || []} money={money} showAge />
      </div>

      <div style={{ backgroundColor: "white", border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
        <input
          type="text"
          placeholder="Search by invoice number, customer, or EKON ID"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: "100%", padding: "10px", borderRadius: "8px", border: `1px solid ${BORDER}` }}
        />
      </div>

      <Section title="Customer Receivable Ledger">
        <div style={{ overflowX: "auto", overflowY: "auto", maxHeight: "70vh", border: `1px solid ${BORDER}`, borderRadius: "12px" }}>
          <table border="1" cellPadding="10" style={{ minWidth: "1250px", width: "100%", borderCollapse: "collapse", borderColor: BORDER }}>
            <thead style={{ backgroundColor: "#eef4ff", position: "sticky", top: 0 }}>
              <tr>
                <th>Invoice No.</th>
                <th>Customer</th>
                <th>EKON ID</th>
                <th>Invoice Date</th>
                <th>Age</th>
                <th>Aging Bucket</th>
                <th>Amount Due</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length > 0 ? (
                filteredRows.map((row) => (
                  <tr key={row.invoiceNumber}>
                    <td style={{ fontWeight: "bold" }}>{row.invoiceNumber}</td>
                    <td>{row.customerName}</td>
                    <td>{row.customerEkonId}</td>
                    <td>{String(row.invoiceDate || "").slice(0, 10)}</td>
                    <td>{getAgeDays(row.invoiceDate)} day(s)</td>
                    <td>{row.bucket}</td>
                    <td style={{ fontWeight: "bold" }}>{money(row.balanceDue)}</td>
                    <td>{row.status}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center", color: MUTED }}>
                    No outstanding receivables found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}

function MiniTable({ title, rows, money, showAge = false }) {
  const BORDER = "#dbe3ef";

  const getAgeDays = (value) => {
    if (!value) return 0;
    const created = new Date(value);
    if (Number.isNaN(created.getTime())) return 0;
    return Math.max(0, Math.floor((Date.now() - created.getTime()) / (1000 * 60 * 60 * 24)));
  };

  return (
    <Section title={title}>
      <table border="1" cellPadding="9" style={{ width: "100%", borderCollapse: "collapse", borderColor: BORDER }}>
        <thead style={{ backgroundColor: "#eef4ff" }}>
          <tr>
            <th>Customer</th>
            <th>Invoice</th>
            <th>Balance</th>
            {showAge && <th>Age</th>}
          </tr>
        </thead>
        <tbody>
          {rows.length > 0 ? rows.map((row) => (
            <tr key={`${title}-${row.invoiceNumber}`}>
              <td>{row.customerName}</td>
              <td>{row.invoiceNumber}</td>
              <td>{money(row.balanceDue)}</td>
              {showAge && <td>{getAgeDays(row.invoiceDate)} day(s)</td>}
            </tr>
          )) : (
            <tr>
              <td colSpan={showAge ? 4 : 3}>No records</td>
            </tr>
          )}
        </tbody>
      </table>
    </Section>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ backgroundColor: "white", border: "1px solid #dbe3ef", borderRadius: "12px", padding: "18px", marginBottom: "16px" }}>
      <h2 style={{ marginTop: 0, color: "#0B3D91" }}>{title}</h2>
      {children}
    </div>
  );
}

function Card({ children }) {
  return (
    <div style={{ backgroundColor: "white", border: "1px solid #dbe3ef", borderRadius: "12px", padding: "18px" }}>
      {children}
    </div>
  );
}

export default AccountsReceivable;