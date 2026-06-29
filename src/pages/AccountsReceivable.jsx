import { useEffect, useMemo, useState } from "react";
import api from "../api";

function AccountsReceivable() {
  const [dashboard, setDashboard] = useState(null);
  const [aging, setAging] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [customerProfile, setCustomerProfile] = useState(null);
  const [collectionNote, setCollectionNote] = useState("");
  const [selectedInvoiceNumber, setSelectedInvoiceNumber] = useState("");
  const [workflowForm, setWorkflowForm] = useState({
  collectionsStatus: "Normal",
  assignedCollector: "",
  nextFollowUpDate: "",
  promiseToPayDate: "",
  promiseToPayAmount: "",
  promiseToPayStatus: "None",
});

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

  const loadCustomerProfile = async (customerEkonId) => {
    try {
      setSelectedCustomerId(customerEkonId);
      const res = await api.get(
        `/api/accounts-receivable/collections/customers/${customerEkonId}`
      );
      setCustomerProfile(res.data.data);
    } catch (error) {
      console.error("Customer collections profile error:", error);
      alert(error?.response?.data?.message || "Could not load customer profile.");
    }
  };

  const addNoteToFirstOpenInvoice = async () => {
    try {
      const firstInvoice = customerProfile?.openInvoices?.[0];

      if (!firstInvoice) {
        alert("No open invoice found for this customer.");
        return;
      }

      if (!collectionNote.trim()) {
        alert("Enter a collection note.");
        return;
      }

      await api.post(
        `/api/accounts-receivable/collections/invoices/${firstInvoice.invoiceNumber}/notes`,
        { note: collectionNote }
      );

      setCollectionNote("");
      await loadCustomerProfile(customerProfile.customer.ekonId);
    } catch (error) {
      console.error("Add collection note error:", error);
      alert(error?.response?.data?.message || "Could not add note.");
    }
  };

  const selectInvoiceForWorkflow = (invoice) => {
  setSelectedInvoiceNumber(invoice.invoiceNumber);
  setWorkflowForm({
    collectionsStatus: invoice.collectionsStatus || "Normal",
    assignedCollector: invoice.assignedCollector || "",
    nextFollowUpDate: invoice.nextFollowUpDate
      ? String(invoice.nextFollowUpDate).slice(0, 10)
      : "",
    promiseToPayDate: invoice.promiseToPayDate
      ? String(invoice.promiseToPayDate).slice(0, 10)
      : "",
    promiseToPayAmount: invoice.promiseToPayAmount || "",
    promiseToPayStatus: invoice.promiseToPayStatus || "None",
  });
};

const updateWorkflow = async () => {
  try {
    if (!selectedInvoiceNumber) {
      alert("Select an invoice first.");
      return;
    }

    await api.put(
      `/api/accounts-receivable/collections/invoices/${selectedInvoiceNumber}/workflow`,
      workflowForm
    );

    await loadCustomerProfile(customerProfile.customer.ekonId);
    alert("Collection workflow updated.");
  } catch (error) {
    console.error("Update workflow error:", error);
    alert(error?.response?.data?.message || "Could not update workflow.");
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
    return Math.max(
      0,
      Math.floor((Date.now() - created.getTime()) / (1000 * 60 * 60 * 24))
    );
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

      {customerProfile && (
        <Section title={`Customer Collections Profile - ${customerProfile.customer.name}`}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "16px" }}>
            <Card><h3>{customerProfile.customer.ekonId}</h3><p><b>EKON ID</b></p></Card>
            <Card><h3>{money(customerProfile.summary.outstandingBalance)}</h3><p><b>Outstanding</b></p></Card>
            <Card><h3>{customerProfile.summary.openInvoiceCount}</h3><p><b>Open Invoices</b></p></Card>
            <Card><h3>{customerProfile.summary.oldestInvoiceDays}</h3><p><b>Oldest Days</b></p></Card>
            <Card><h3>{customerProfile.summary.riskLevel}</h3><p><b>Risk Level</b></p></Card>
            <Card><h3>{customerProfile.summary.collectionStatus}</h3><p><b>Collection Status</b></p></Card>
          </div>

          <p><b>Email:</b> {customerProfile.customer.email || "—"}</p>
          <p><b>Phone:</b> {customerProfile.customer.phone || "—"}</p>
          <p><b>Branch:</b> {customerProfile.customer.branch || "—"}</p>

          <h3>Recommendations</h3>
          <ul>
            {(customerProfile.recommendations || []).map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>

          <h3>Open Invoices</h3>
          <table border="1" cellPadding="9" style={{ width: "100%", borderCollapse: "collapse", borderColor: BORDER }}>
            <thead style={{ backgroundColor: "#eef4ff" }}>
              <tr>
                <th>Invoice</th>
                <th>Date</th>
                <th>Days</th>
                <th>Balance</th>
                <th>Status</th>
                <th>Collection</th>
                <th>Promise</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {(customerProfile.openInvoices || []).map((invoice) => (
                <tr key={invoice.invoiceNumber}>
                  <td>{invoice.invoiceNumber}</td>
                  <td>{String(invoice.invoiceDate || "").slice(0, 10)}</td>
                  <td>{invoice.daysOutstanding}</td>
                  <td>{money(invoice.balanceDue)}</td>
                  <td>{invoice.status}</td>
                  <td>{invoice.collectionsStatus || "Normal"}</td>
                  <td>{invoice.promiseToPayStatus || "None"}</td>
                  <td>
  <button
    type="button"
    onClick={() => selectInvoiceForWorkflow(invoice)}
    style={{
      padding: "6px 10px",
      border: "none",
      borderRadius: "8px",
      backgroundColor: ROYAL_BLUE,
      color: "white",
      fontWeight: "bold",
      cursor: "pointer",
    }}
  >
    Manage
  </button>
</td>
                </tr>
              ))}
            </tbody>
          </table>

          {selectedInvoiceNumber && (
  <>
    <h3>Collection Actions</h3>

    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "12px",
        marginBottom: "12px",
      }}
    >
      <div>
        <label><b>Selected Invoice</b></label>
        <input
          value={selectedInvoiceNumber}
          readOnly
          style={{ width: "100%", padding: "9px", border: `1px solid ${BORDER}`, borderRadius: "8px" }}
        />
      </div>

      <div>
        <label><b>Collection Status</b></label>
        <select
          value={workflowForm.collectionsStatus}
          onChange={(e) =>
            setWorkflowForm({ ...workflowForm, collectionsStatus: e.target.value })
          }
          style={{ width: "100%", padding: "9px", border: `1px solid ${BORDER}`, borderRadius: "8px" }}
        >
          <option>Normal</option>
          <option>Reminder Sent</option>
          <option>Contacted</option>
          <option>No Answer</option>
          <option>Follow Up</option>
          <option>Promise To Pay</option>
          <option>Payment Arrangement</option>
          <option>Overdue</option>
          <option>Final Notice</option>
          <option>Collections</option>
          <option>Legal Review</option>
          <option>Written Off</option>
        </select>
      </div>

      <div>
        <label><b>Assigned Collector</b></label>
        <input
          value={workflowForm.assignedCollector}
          onChange={(e) =>
            setWorkflowForm({ ...workflowForm, assignedCollector: e.target.value })
          }
          style={{ width: "100%", padding: "9px", border: `1px solid ${BORDER}`, borderRadius: "8px" }}
        />
      </div>

      <div>
        <label><b>Next Follow-up</b></label>
        <input
          type="date"
          value={workflowForm.nextFollowUpDate}
          onChange={(e) =>
            setWorkflowForm({ ...workflowForm, nextFollowUpDate: e.target.value })
          }
          style={{ width: "100%", padding: "9px", border: `1px solid ${BORDER}`, borderRadius: "8px" }}
        />
      </div>

      <div>
        <label><b>Promise Date</b></label>
        <input
          type="date"
          value={workflowForm.promiseToPayDate}
          onChange={(e) =>
            setWorkflowForm({ ...workflowForm, promiseToPayDate: e.target.value })
          }
          style={{ width: "100%", padding: "9px", border: `1px solid ${BORDER}`, borderRadius: "8px" }}
        />
      </div>

      <div>
        <label><b>Promise Amount</b></label>
        <input
          type="number"
          value={workflowForm.promiseToPayAmount}
          onChange={(e) =>
            setWorkflowForm({ ...workflowForm, promiseToPayAmount: e.target.value })
          }
          style={{ width: "100%", padding: "9px", border: `1px solid ${BORDER}`, borderRadius: "8px" }}
        />
      </div>

      <div>
        <label><b>Promise Status</b></label>
        <select
          value={workflowForm.promiseToPayStatus}
          onChange={(e) =>
            setWorkflowForm({ ...workflowForm, promiseToPayStatus: e.target.value })
          }
          style={{ width: "100%", padding: "9px", border: `1px solid ${BORDER}`, borderRadius: "8px" }}
        >
          <option>None</option>
          <option>Pending</option>
          <option>Fulfilled</option>
          <option>Broken</option>
        </select>
      </div>
    </div>

    <button
      type="button"
      onClick={updateWorkflow}
      style={{
        padding: "10px 14px",
        border: "none",
        borderRadius: "8px",
        backgroundColor: ROYAL_BLUE,
        color: "white",
        fontWeight: "bold",
        cursor: "pointer",
        marginBottom: "18px",
      }}
    >
      Save Collection Workflow
    </button>
  </>
)}

          <h3>Add Collection Note</h3>
          <textarea
            value={collectionNote}
            onChange={(e) => setCollectionNote(e.target.value)}
            placeholder="Enter collection note for this customer..."
            style={{
              width: "100%",
              minHeight: "80px",
              padding: "10px",
              borderRadius: "8px",
              border: `1px solid ${BORDER}`,
            }}
          />

          <button
            type="button"
            onClick={addNoteToFirstOpenInvoice}
            style={{
              marginTop: "10px",
              padding: "10px 14px",
              border: "none",
              borderRadius: "8px",
              backgroundColor: ROYAL_BLUE,
              color: "white",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Add Note
          </button>

          <h3>Collection Notes</h3>
          {(customerProfile.collectionNotes || []).length > 0 ? (
            <ul>
              {customerProfile.collectionNotes.map((note, index) => (
                <li key={index}>
                  <b>{new Date(note.createdAt).toLocaleString()}:</b> {note.note} — {note.createdBy}
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ color: MUTED }}>No collection notes yet.</p>
          )}

          <h3>Payment History</h3>
          {(customerProfile.paymentHistory || []).length > 0 ? (
            <table border="1" cellPadding="9" style={{ width: "100%", borderCollapse: "collapse", borderColor: BORDER }}>
              <thead style={{ backgroundColor: "#eef4ff" }}>
                <tr>
                  <th>Invoice</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Received By</th>
                </tr>
              </thead>
              <tbody>
                {customerProfile.paymentHistory.map((payment, index) => (
                  <tr key={index}>
                    <td>{payment.invoiceNumber}</td>
                    <td>{String(payment.paymentDate || "").slice(0, 10)}</td>
                    <td>{money(payment.amount)}</td>
                    <td>{payment.paymentMethod}</td>
                    <td>{payment.receivedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: MUTED }}>No payment history found.</p>
          )}
        </Section>
      )}

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
                  <tr key={row.invoiceNumber} style={{ backgroundColor: selectedCustomerId === row.customerEkonId ? "#f0f7ff" : "white" }}>
                    <td style={{ fontWeight: "bold" }}>{row.invoiceNumber}</td>
                    <td>
                      <button
                        type="button"
                        onClick={() => loadCustomerProfile(row.customerEkonId)}
                        style={{
                          background: "none",
                          border: "none",
                          color: ROYAL_BLUE,
                          fontWeight: "bold",
                          cursor: "pointer",
                          textDecoration: "underline",
                        }}
                      >
                        {row.customerName}
                      </button>
                    </td>
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
    return Math.max(
      0,
      Math.floor((Date.now() - created.getTime()) / (1000 * 60 * 60 * 24))
    );
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