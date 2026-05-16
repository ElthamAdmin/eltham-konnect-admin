import { useEffect, useMemo, useState } from "react";
import api from "../api";

function AccountsReceivable() {
  const [invoices, setInvoices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const ROYAL_BLUE = "#0B3D91";
  const BORDER = "#dbe3ef";
  const MUTED = "#64748b";

  const loadReceivables = async () => {
    try {
      const res = await api.get("/api/invoices");
      setInvoices(res.data.data || []);
    } catch (error) {
      console.error("Accounts receivable error:", error);
      alert(error?.response?.data?.message || "Could not load receivables.");
    }
  };

  useEffect(() => {
    loadReceivables();
  }, []);

  const unpaidInvoices = useMemo(() => {
    return invoices.filter(
      (invoice) => String(invoice.status || "").toLowerCase() === "unpaid"
    );
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    return unpaidInvoices.filter((invoice) =>
      `${invoice.invoiceNumber} ${invoice.customerName} ${invoice.customerEkonId}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  }, [unpaidInvoices, searchTerm]);

  const totalReceivable = filteredInvoices.reduce(
    (sum, invoice) => sum + Number(invoice.finalTotal || 0),
    0
  );

  const money = (value) => `JMD ${Number(value || 0).toLocaleString()}`;

  const getAgeDays = (value) => {
    if (!value) return 0;
    const created = new Date(value);
    if (Number.isNaN(created.getTime())) return 0;
    const diff = Date.now() - created.getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  };

  const getAgingBucket = (days) => {
    if (days <= 30) return "Current / 1-30 Days";
    if (days <= 60) return "31-60 Days";
    if (days <= 90) return "61-90 Days";
    return "90+ Days";
  };

  const agingSummary = useMemo(() => {
    const summary = {
      current: 0,
      days31to60: 0,
      days61to90: 0,
      over90: 0,
    };

    filteredInvoices.forEach((invoice) => {
      const days = getAgeDays(invoice.createdAt);

      if (days <= 30) summary.current += Number(invoice.finalTotal || 0);
      else if (days <= 60) summary.days31to60 += Number(invoice.finalTotal || 0);
      else if (days <= 90) summary.days61to90 += Number(invoice.finalTotal || 0);
      else summary.over90 += Number(invoice.finalTotal || 0);
    });

    return summary;
  }, [filteredInvoices]);

  return (
    <div>
      <h1 style={{ margin: 0 }}>Accounts Receivable</h1>
      <p style={{ marginTop: "6px", color: MUTED }}>
        Track customer outstanding invoice balances and receivable aging.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: "14px",
          margin: "18px 0",
        }}
      >
        <Card>
          <h2 style={{ color: ROYAL_BLUE, margin: 0 }}>{money(totalReceivable)}</h2>
          <p style={{ fontWeight: "bold" }}>Total Receivables</p>
        </Card>

        <Card>
          <h2 style={{ color: "#16a34a", margin: 0 }}>
            {money(agingSummary.current)}
          </h2>
          <p style={{ fontWeight: "bold" }}>Current / 1-30 Days</p>
        </Card>

        <Card>
          <h2 style={{ color: "#f59e0b", margin: 0 }}>
            {money(agingSummary.days31to60)}
          </h2>
          <p style={{ fontWeight: "bold" }}>31-60 Days</p>
        </Card>

        <Card>
          <h2 style={{ color: "#ea580c", margin: 0 }}>
            {money(agingSummary.days61to90)}
          </h2>
          <p style={{ fontWeight: "bold" }}>61-90 Days</p>
        </Card>

        <Card>
          <h2 style={{ color: "#dc2626", margin: 0 }}>
            {money(agingSummary.over90)}
          </h2>
          <p style={{ fontWeight: "bold" }}>90+ Days</p>
        </Card>
      </div>

      <div
        style={{
          backgroundColor: "white",
          border: `1px solid ${BORDER}`,
          borderRadius: "12px",
          padding: "16px",
          marginBottom: "16px",
        }}
      >
        <input
          type="text"
          placeholder="Search by invoice number, customer, or EKON ID"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: "8px",
            border: `1px solid ${BORDER}`,
          }}
        />
      </div>

      <div
        style={{
          backgroundColor: "white",
          border: `1px solid ${BORDER}`,
          borderRadius: "12px",
          padding: "18px",
        }}
      >
        <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>
          Customer Receivable Ledger
        </h2>

        <div
          style={{
            overflowX: "auto",
            overflowY: "auto",
            maxHeight: "70vh",
            border: `1px solid ${BORDER}`,
            borderRadius: "12px",
          }}
        >
          <table
            border="1"
            cellPadding="10"
            style={{
              minWidth: "1250px",
              width: "100%",
              borderCollapse: "collapse",
              borderColor: BORDER,
            }}
          >
            <thead style={{ backgroundColor: "#eef4ff", position: "sticky", top: 0 }}>
              <tr>
                <th>Invoice No.</th>
                <th>Customer</th>
                <th>EKON ID</th>
                <th>Package Count</th>
                <th>Invoice Date</th>
                <th>Age</th>
                <th>Aging Bucket</th>
                <th>Amount Due</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((invoice) => {
                  const ageDays = getAgeDays(invoice.createdAt);

                  return (
                    <tr key={invoice._id}>
                      <td style={{ fontWeight: "bold" }}>{invoice.invoiceNumber}</td>
                      <td>{invoice.customerName}</td>
                      <td>{invoice.customerEkonId}</td>
                      <td>{invoice.packageCount || 0}</td>
                      <td>{String(invoice.createdAt || "").slice(0, 10)}</td>
                      <td>{ageDays} day(s)</td>
                      <td>{getAgingBucket(ageDays)}</td>
                      <td style={{ fontWeight: "bold" }}>
                        {money(invoice.finalTotal)}
                      </td>
                      <td>
                        <span
                          style={{
                            backgroundColor: "#dc2626",
                            color: "white",
                            padding: "5px 10px",
                            borderRadius: "999px",
                            fontWeight: "bold",
                            fontSize: "12px",
                          }}
                        >
                          Unpaid
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="9" style={{ textAlign: "center", color: MUTED }}>
                    No outstanding receivables found.
                  </td>
                </tr>
              )}
            </tbody>

            <tfoot style={{ backgroundColor: "#f8fafc", fontWeight: "bold" }}>
              <tr>
                <td colSpan="7">TOTAL RECEIVABLES</td>
                <td>{money(totalReceivable)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

function Card({ children }) {
  return (
    <div
      style={{
        backgroundColor: "white",
        border: "1px solid #dbe3ef",
        borderRadius: "12px",
        padding: "18px",
      }}
    >
      {children}
    </div>
  );
}

export default AccountsReceivable;