import { useEffect, useMemo, useState } from "react";
import api from "../api";

function AccountsPayable() {
  const [vendors, setVendors] = useState([]);
  const [payables, setPayables] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [activeForm, setActiveForm] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVendorCode, setSelectedVendorCode] = useState("");
  const [selectedPayable, setSelectedPayable] = useState(null);

  const [vendorForm, setVendorForm] = useState({
    vendorName: "",
    vendorType: "Freight Forwarder",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    openingBalance: 0,
  });

  const [payableForm, setPayableForm] = useState({
    vendorCode: "",
    billNumber: "",
    payableDate: new Date().toISOString().slice(0, 10),
    dueDate: "",
    description: "",
    expenseAccountCode: "6000",
    amount: 0,
    notes: "",
  });

  const [paymentForm, setPaymentForm] = useState({
    paymentAccountNumber: "",
    paymentDate: new Date().toISOString().slice(0, 10),
    paymentAmount: "",
    paymentMethod: "Bank Transfer",
    paymentReference: "",
    notes: "",
  });

  const ROYAL_BLUE = "#0B3D91";
  const BORDER = "#dbe3ef";
  const MUTED = "#64748b";

  const loadData = async () => {
    try {
      const [vendorRes, payableRes, accountsRes] = await Promise.all([
        api.get("/api/accounts-payable/vendors"),
        api.get("/api/accounts-payable"),
        api.get("/api/financial-accounts"),
      ]);

      setVendors(vendorRes.data.data || []);
      setPayables(payableRes.data.data || []);
      setAccounts(accountsRes.data.data || []);
    } catch (error) {
      console.error("Accounts payable error:", error);
      alert(error?.response?.data?.message || "Could not load accounts payable.");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const money = (value) => `JMD ${Number(value || 0).toLocaleString()}`;

  const getAgeDays = (value) => {
    if (!value) return 0;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 0;
    return Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000));
  };

  const getDueStatus = (payable) => {
    if (payable.status === "Paid") return "Paid";
    if (payable.status === "Partially Paid") return "Partially Paid";
    if (payable.status === "Void") return "Void";

    const due = new Date(payable.dueDate);
    if (Number.isNaN(due.getTime())) return payable.status || "Unpaid";

    return Date.now() > due.getTime() ? "Overdue" : payable.status || "Unpaid";
  };

  const summary = useMemo(() => {
    const openBills = payables.filter((p) => getDueStatus(p) !== "Paid");

    return {
      totalPayable: openBills.reduce((sum, p) => sum + Number(p.balanceDue || 0), 0),
      openBills: openBills.length,
      overdue: openBills
        .filter((p) => getDueStatus(p) === "Overdue")
        .reduce((sum, p) => sum + Number(p.balanceDue || 0), 0),
      vendorBalance: vendors.reduce((sum, v) => sum + Number(v.currentBalance || 0), 0),
    };
  }, [payables, vendors]);

  const selectedVendor = useMemo(
    () => vendors.find((vendor) => vendor.vendorCode === selectedVendorCode),
    [vendors, selectedVendorCode]
  );

  const selectedVendorPayables = useMemo(() => {
    if (!selectedVendorCode) return [];
    return payables.filter((p) => p.vendorCode === selectedVendorCode);
  }, [payables, selectedVendorCode]);

  const filteredPayables = useMemo(() => {
    return payables.filter((p) =>
      `${p.payableNumber} ${p.vendorName} ${p.vendorCode} ${p.billNumber} ${p.description} ${p.status}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  }, [payables, searchTerm]);

  const saveVendor = async () => {
    try {
      if (!vendorForm.vendorName) {
        alert("Vendor name is required.");
        return;
      }

      await api.post("/api/accounts-payable/vendors", vendorForm);
      alert("Vendor created successfully.");

      setVendorForm({
        vendorName: "",
        vendorType: "Freight Forwarder",
        contactPerson: "",
        email: "",
        phone: "",
        address: "",
        openingBalance: 0,
      });

      setActiveForm("");
      await loadData();
    } catch (error) {
      console.error("Vendor save error:", error);
      alert(error?.response?.data?.message || "Could not create vendor.");
    }
  };

  const savePayable = async () => {
    try {
      if (!payableForm.vendorCode || !payableForm.dueDate || !payableForm.amount) {
        alert("Vendor, due date, and amount are required.");
        return;
      }

      await api.post("/api/accounts-payable", payableForm);
      alert("Payable bill created successfully.");

      setPayableForm({
        vendorCode: "",
        billNumber: "",
        payableDate: new Date().toISOString().slice(0, 10),
        dueDate: "",
        description: "",
        expenseAccountCode: "6000",
        amount: 0,
        notes: "",
      });

      setActiveForm("");
      await loadData();
    } catch (error) {
      console.error("Payable save error:", error);
      alert(error?.response?.data?.message || "Could not create payable.");
    }
  };

  const openPaymentModal = (payable, fullPayment = false) => {
    setSelectedPayable(payable);
    setPaymentForm({
      paymentAccountNumber: "",
      paymentDate: new Date().toISOString().slice(0, 10),
      paymentAmount: fullPayment ? Number(payable.balanceDue || 0) : "",
      paymentMethod: "Bank Transfer",
      paymentReference: "",
      notes: "",
    });
  };

  const closePaymentModal = () => {
    setSelectedPayable(null);
    setPaymentForm({
      paymentAccountNumber: "",
      paymentDate: new Date().toISOString().slice(0, 10),
      paymentAmount: "",
      paymentMethod: "Bank Transfer",
      paymentReference: "",
      notes: "",
    });
  };

  const recordPayment = async () => {
    try {
      if (!selectedPayable) return;

      const amountToPay = Number(paymentForm.paymentAmount || 0);

      if (!paymentForm.paymentAccountNumber) {
        alert("Please select the payment account.");
        return;
      }

      if (amountToPay <= 0) {
        alert("Payment amount must be greater than zero.");
        return;
      }

      if (amountToPay > Number(selectedPayable.balanceDue || 0)) {
        alert("Payment amount cannot exceed the balance due.");
        return;
      }

      await api.put(`/api/accounts-payable/${selectedPayable.payableNumber}/payments`, {
        paymentAccountNumber: paymentForm.paymentAccountNumber,
        paymentDate: paymentForm.paymentDate,
        paymentAmount: amountToPay,
        paymentMethod: paymentForm.paymentMethod,
        paymentReference: paymentForm.paymentReference,
        notes: paymentForm.notes,
      });

      alert(
        amountToPay === Number(selectedPayable.balanceDue || 0)
          ? "Payable paid successfully."
          : "Partial payment recorded successfully."
      );

      closePaymentModal();
      await loadData();
    } catch (error) {
      console.error("Payment error:", error);
      alert(error?.response?.data?.message || "Could not record payment.");
    }
  };

  return (
    <div>
      <h1 style={{ margin: 0 }}>Accounts Payable</h1>
      <p style={{ marginTop: "6px", color: MUTED }}>
        Manage vendors, supplier bills, partial payments, payment history, and payable aging.
      </p>

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", margin: "18px 0" }}>
        <button onClick={() => setActiveForm(activeForm === "vendor" ? "" : "vendor")} style={button(ROYAL_BLUE)}>
          + Add Vendor
        </button>
        <button onClick={() => setActiveForm(activeForm === "payable" ? "" : "payable")} style={button("#16a34a")}>
          + Add Bill / Payable
        </button>
      </div>

      <div style={summaryGrid}>
        <Card><h2 style={{ color: ROYAL_BLUE, margin: 0 }}>{money(summary.totalPayable)}</h2><p style={{ fontWeight: "bold" }}>Total Payables</p></Card>
        <Card><h2 style={{ color: "#dc2626", margin: 0 }}>{money(summary.overdue)}</h2><p style={{ fontWeight: "bold" }}>Overdue</p></Card>
        <Card><h2 style={{ color: "#f59e0b", margin: 0 }}>{summary.openBills}</h2><p style={{ fontWeight: "bold" }}>Open Bills</p></Card>
        <Card><h2 style={{ color: "#7c3aed", margin: 0 }}>{money(summary.vendorBalance)}</h2><p style={{ fontWeight: "bold" }}>Vendor Balances</p></Card>
      </div>

      {activeForm === "vendor" && (
        <div style={panel(BORDER)}>
          <h2 style={{ color: ROYAL_BLUE, marginTop: 0 }}>New Vendor</h2>
          <div style={grid}>
            <input placeholder="Vendor Name" value={vendorForm.vendorName} onChange={(e) => setVendorForm({ ...vendorForm, vendorName: e.target.value })} style={input(BORDER)} />
            <select value={vendorForm.vendorType} onChange={(e) => setVendorForm({ ...vendorForm, vendorType: e.target.value })} style={input(BORDER)}>
              <option>Freight Forwarder</option>
              <option>Utility</option>
              <option>Supplier</option>
              <option>Service Provider</option>
              <option>Government</option>
              <option>Other</option>
            </select>
            <input placeholder="Contact Person" value={vendorForm.contactPerson} onChange={(e) => setVendorForm({ ...vendorForm, contactPerson: e.target.value })} style={input(BORDER)} />
            <input placeholder="Email" value={vendorForm.email} onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })} style={input(BORDER)} />
            <input placeholder="Phone" value={vendorForm.phone} onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })} style={input(BORDER)} />
            <input type="number" placeholder="Opening Balance" value={vendorForm.openingBalance} onChange={(e) => setVendorForm({ ...vendorForm, openingBalance: Number(e.target.value || 0) })} style={input(BORDER)} />
            <textarea placeholder="Address" value={vendorForm.address} onChange={(e) => setVendorForm({ ...vendorForm, address: e.target.value })} style={{ ...input(BORDER), gridColumn: "1 / -1" }} />
          </div>
          <button onClick={saveVendor} style={{ ...button("#16a34a"), marginTop: "14px" }}>Save Vendor</button>
        </div>
      )}

      {activeForm === "payable" && (
        <div style={panel(BORDER)}>
          <h2 style={{ color: ROYAL_BLUE, marginTop: 0 }}>New Bill / Payable</h2>
          <div style={grid}>
            <select value={payableForm.vendorCode} onChange={(e) => setPayableForm({ ...payableForm, vendorCode: e.target.value })} style={input(BORDER)}>
              <option value="">Select Vendor</option>
              {vendors.map((vendor) => (
                <option key={vendor._id} value={vendor.vendorCode}>
                  {vendor.vendorName} ({vendor.vendorType})
                </option>
              ))}
            </select>
            <input placeholder="Bill Number" value={payableForm.billNumber} onChange={(e) => setPayableForm({ ...payableForm, billNumber: e.target.value })} style={input(BORDER)} />
            <input type="date" value={payableForm.payableDate} onChange={(e) => setPayableForm({ ...payableForm, payableDate: e.target.value })} style={input(BORDER)} />
            <input type="date" value={payableForm.dueDate} onChange={(e) => setPayableForm({ ...payableForm, dueDate: e.target.value })} style={input(BORDER)} />
            <input type="number" placeholder="Amount" value={payableForm.amount} onChange={(e) => setPayableForm({ ...payableForm, amount: Number(e.target.value || 0) })} style={input(BORDER)} />
            <input placeholder="Expense Account Code e.g. 6000" value={payableForm.expenseAccountCode} onChange={(e) => setPayableForm({ ...payableForm, expenseAccountCode: e.target.value })} style={input(BORDER)} />
            <input placeholder="Description" value={payableForm.description} onChange={(e) => setPayableForm({ ...payableForm, description: e.target.value })} style={input(BORDER)} />
            <textarea placeholder="Notes" value={payableForm.notes} onChange={(e) => setPayableForm({ ...payableForm, notes: e.target.value })} style={{ ...input(BORDER), gridColumn: "1 / -1" }} />
          </div>
          <button onClick={savePayable} style={{ ...button("#16a34a"), marginTop: "14px" }}>Save Payable</button>
        </div>
      )}

      <div style={panel(BORDER)}>
        <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>Vendor Account Status</h2>
        <select value={selectedVendorCode} onChange={(e) => setSelectedVendorCode(e.target.value)} style={{ ...input(BORDER), width: "100%", marginBottom: "12px" }}>
          <option value="">Select Vendor to View Status</option>
          {vendors.map((vendor) => (
            <option key={vendor._id} value={vendor.vendorCode}>
              {vendor.vendorName} - Balance {money(vendor.currentBalance)}
            </option>
          ))}
        </select>

        {selectedVendor && (
          <div style={summaryGrid}>
            <Card><strong>Vendor</strong><p>{selectedVendor.vendorName}</p></Card>
            <Card><strong>Status</strong><p>{selectedVendor.status}</p></Card>
            <Card><strong>Current Balance</strong><p style={{ fontWeight: "bold", color: "#7c3aed" }}>{money(selectedVendor.currentBalance)}</p></Card>
            <Card><strong>Open Bills</strong><p>{selectedVendorPayables.filter((p) => getDueStatus(p) !== "Paid").length}</p></Card>
            <Card><strong>Total Paid</strong><p>{money(selectedVendorPayables.reduce((sum, p) => sum + Number(p.amountPaid || 0), 0))}</p></Card>
            <Card><strong>Contact</strong><p>{selectedVendor.phone || selectedVendor.email || "—"}</p></Card>
          </div>
        )}
      </div>

      <div style={panel(BORDER)}>
        <input
          placeholder="Search payables by vendor, bill number, status, or description"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ ...input(BORDER), width: "100%" }}
        />
      </div>

      <div style={panel(BORDER)}>
        <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>Vendor Payables Ledger</h2>

        <div style={{ overflowX: "auto", overflowY: "auto", maxHeight: "70vh", border: `1px solid ${BORDER}`, borderRadius: "12px" }}>
          <table border="1" cellPadding="10" style={{ minWidth: "1600px", width: "100%", borderCollapse: "collapse", borderColor: BORDER }}>
            <thead style={{ backgroundColor: "#eef4ff", position: "sticky", top: 0 }}>
              <tr>
                <th>Payable No.</th>
                <th>Vendor</th>
                <th>Bill No.</th>
                <th>Payable Date</th>
                <th>Due Date</th>
                <th>Age</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Paid</th>
                <th>Balance Due</th>
                <th>Status</th>
                <th>Payment Account</th>
                <th>Payment History</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredPayables.length > 0 ? (
                filteredPayables.map((p) => (
                  <tr key={p._id}>
                    <td style={{ fontWeight: "bold" }}>{p.payableNumber}</td>
                    <td>{p.vendorName}</td>
                    <td>{p.billNumber || "—"}</td>
                    <td>{p.payableDate}</td>
                    <td>{p.dueDate}</td>
                    <td>{getAgeDays(p.payableDate)} day(s)</td>
                    <td>{p.description || "—"}</td>
                    <td>{money(p.amount)}</td>
                    <td>{money(p.amountPaid)}</td>
                    <td style={{ fontWeight: "bold" }}>{money(p.balanceDue)}</td>
                    <td>{statusBadge(getDueStatus(p))}</td>
                    <td>{p.paymentAccountName || "—"}</td>
                    <td>
                      {Array.isArray(p.paymentHistory) && p.paymentHistory.length > 0 ? (
                        <details>
                          <summary>{p.paymentHistory.length} payment(s)</summary>
                          {p.paymentHistory.map((payment, index) => (
                            <div key={`${payment.paymentReference}-${index}`} style={{ marginTop: "8px", fontSize: "13px" }}>
                              <strong>{money(payment.paymentAmount)}</strong><br />
                              {payment.paymentDate}<br />
                              {payment.paymentMethod}<br />
                              Ref: {payment.paymentReference}<br />
                              JE: {payment.journalEntryNumber || "—"}
                            </div>
                          ))}
                        </details>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      {getDueStatus(p) === "Paid" ? (
                        <span style={{ color: "#16a34a", fontWeight: "bold" }}>Paid</span>
                      ) : (
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                          <button onClick={() => openPaymentModal(p, false)} style={button("#f59e0b")}>
                            Partial
                          </button>
                          <button onClick={() => openPaymentModal(p, true)} style={button("#16a34a")}>
                            Pay Full
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="14" style={{ textAlign: "center", color: MUTED }}>
                    No accounts payable records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedPayable && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>Record Payable Payment</h2>
            <p>
              <strong>{selectedPayable.vendorName}</strong><br />
              Payable: {selectedPayable.payableNumber}<br />
              Original Amount: {money(selectedPayable.amount)}<br />
              Already Paid: {money(selectedPayable.amountPaid)}<br />
              Balance Due: <strong>{money(selectedPayable.balanceDue)}</strong>
            </p>

            <div style={grid}>
              <select value={paymentForm.paymentAccountNumber} onChange={(e) => setPaymentForm({ ...paymentForm, paymentAccountNumber: e.target.value })} style={input(BORDER)}>
                <option value="">Select Payment Account</option>
                {accounts.map((account) => (
                  <option key={account._id} value={account.accountNumber}>
                    {account.accountName} ({account.accountType}) - {money(account.currentBalance)}
                  </option>
                ))}
              </select>

              <input type="date" value={paymentForm.paymentDate} onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })} style={input(BORDER)} />

              <input type="number" placeholder="Payment Amount" value={paymentForm.paymentAmount} onChange={(e) => setPaymentForm({ ...paymentForm, paymentAmount: e.target.value })} style={input(BORDER)} />

              <select value={paymentForm.paymentMethod} onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })} style={input(BORDER)}>
                <option>Bank Transfer</option>
                <option>Cash</option>
                <option>Cheque</option>
                <option>Credit Card</option>
                <option>Debit Card</option>
                <option>Online Payment</option>
                <option>Other</option>
              </select>

              <input placeholder="Payment Reference / Cheque No." value={paymentForm.paymentReference} onChange={(e) => setPaymentForm({ ...paymentForm, paymentReference: e.target.value })} style={input(BORDER)} />

              <textarea placeholder="Payment Notes" value={paymentForm.notes} onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })} style={{ ...input(BORDER), gridColumn: "1 / -1" }} />
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "16px" }}>
              <button onClick={closePaymentModal} style={button("#64748b")}>Cancel</button>
              <button onClick={recordPayment} style={button("#16a34a")}>Record Payment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
  gap: "12px",
};

const summaryGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
  gap: "14px",
  marginBottom: "18px",
};

function panel(border) {
  return {
    backgroundColor: "white",
    border: `1px solid ${border}`,
    borderRadius: "12px",
    padding: "18px",
    marginBottom: "18px",
  };
}

function input(border) {
  return {
    padding: "10px",
    borderRadius: "8px",
    border: `1px solid ${border}`,
  };
}

function button(color) {
  return {
    backgroundColor: color,
    color: "white",
    border: "none",
    padding: "10px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
  };
}

function statusBadge(status) {
  const colors = {
    Paid: "#16a34a",
    "Partially Paid": "#f59e0b",
    Overdue: "#dc2626",
    Unpaid: "#0B3D91",
    Void: "#64748b",
  };

  return (
    <span style={{ color: colors[status] || "#0B3D91", fontWeight: "bold" }}>
      {status}
    </span>
  );
}

const modalOverlay = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(15, 23, 42, 0.55)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
  padding: "20px",
};

const modalBox = {
  backgroundColor: "white",
  borderRadius: "14px",
  padding: "22px",
  width: "min(760px, 96vw)",
  maxHeight: "90vh",
  overflowY: "auto",
};

function Card({ children }) {
  return (
    <div style={{ backgroundColor: "white", border: "1px solid #dbe3ef", borderRadius: "12px", padding: "18px" }}>
      {children}
    </div>
  );
}

export default AccountsPayable;