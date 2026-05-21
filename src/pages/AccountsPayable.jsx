import { useEffect, useMemo, useState } from "react";
import api from "../api";

function AccountsPayable() {
  const [vendors, setVendors] = useState([]);
  const [payables, setPayables] = useState([]);
  const [activeForm, setActiveForm] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [accounts, setAccounts] = useState([]);
  const [paymentAccountNumber, setPaymentAccountNumber] = useState("");

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
    amount: 0,
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

    const due = new Date(payable.dueDate);
    if (Number.isNaN(due.getTime())) return payable.status || "Unpaid";

    return Date.now() > due.getTime() ? "Overdue" : payable.status || "Unpaid";
  };

  const summary = useMemo(() => {
    const unpaid = payables.filter((p) => getDueStatus(p) !== "Paid");

    return {
      totalPayable: unpaid.reduce((sum, p) => sum + Number(p.balanceDue || 0), 0),
      unpaidCount: unpaid.length,
      overdue: unpaid
        .filter((p) => getDueStatus(p) === "Overdue")
        .reduce((sum, p) => sum + Number(p.balanceDue || 0), 0),
      vendorBalance: vendors.reduce((sum, v) => sum + Number(v.currentBalance || 0), 0),
    };
  }, [payables, vendors]);

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

    const markPayablePaid = async (payableNumber) => {
    try {
      if (!paymentAccountNumber) {
        alert("Please select the account used to pay this bill.");
        return;
      }

      await api.put(`/api/accounts-payable/${payableNumber}/mark-paid`, {
        paymentAccountNumber,
        paymentDate: new Date().toISOString().slice(0, 10),
      });

      alert("Payable marked as paid successfully.");
      setPaymentAccountNumber("");
      await loadData();
    } catch (error) {
      console.error("Mark paid error:", error);
      alert(error?.response?.data?.message || "Could not mark payable as paid.");
    }
  };

  return (
    <div>
      <h1 style={{ margin: 0 }}>Accounts Payable</h1>
      <p style={{ marginTop: "6px", color: MUTED }}>
        Manage vendors, supplier bills, freight partner liabilities, and payable aging.
      </p>

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", margin: "18px 0" }}>
        <button onClick={() => setActiveForm(activeForm === "vendor" ? "" : "vendor")} style={button(ROYAL_BLUE)}>
          + Add Vendor
        </button>
        <button onClick={() => setActiveForm(activeForm === "payable" ? "" : "payable")} style={button("#16a34a")}>
          + Add Bill / Payable
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "14px", marginBottom: "18px" }}>
        <Card><h2 style={{ color: ROYAL_BLUE, margin: 0 }}>{money(summary.totalPayable)}</h2><p style={{ fontWeight: "bold" }}>Total Payables</p></Card>
        <Card><h2 style={{ color: "#dc2626", margin: 0 }}>{money(summary.overdue)}</h2><p style={{ fontWeight: "bold" }}>Overdue</p></Card>
        <Card><h2 style={{ color: "#f59e0b", margin: 0 }}>{summary.unpaidCount}</h2><p style={{ fontWeight: "bold" }}>Open Bills</p></Card>
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
            <input placeholder="Description" value={payableForm.description} onChange={(e) => setPayableForm({ ...payableForm, description: e.target.value })} style={input(BORDER)} />
            <textarea placeholder="Notes" value={payableForm.notes} onChange={(e) => setPayableForm({ ...payableForm, notes: e.target.value })} style={{ ...input(BORDER), gridColumn: "1 / -1" }} />
          </div>
          <button onClick={savePayable} style={{ ...button("#16a34a"), marginTop: "14px" }}>Save Payable</button>
        </div>
      )}

            <div style={panel(BORDER)}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px" }}>
          <input
            placeholder="Search payables by vendor, bill number, status, or description"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ ...input(BORDER), width: "100%" }}
          />

          <select
            value={paymentAccountNumber}
            onChange={(e) => setPaymentAccountNumber(e.target.value)}
            style={{ ...input(BORDER), width: "100%" }}
          >
            <option value="">Select Payment Account</option>
            {accounts.map((account) => (
              <option key={account._id} value={account.accountNumber}>
                {account.accountName} ({account.accountType}) - JMD{" "}
                {Number(account.balance || 0).toLocaleString()}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={panel(BORDER)}>
        <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>Vendor Payables Ledger</h2>

        <div style={{ overflowX: "auto", overflowY: "auto", maxHeight: "70vh", border: `1px solid ${BORDER}`, borderRadius: "12px" }}>
          <table border="1" cellPadding="10" style={{ minWidth: "1350px", width: "100%", borderCollapse: "collapse", borderColor: BORDER }}>
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
                                        <td>{getDueStatus(p)}</td>
                    <td>{p.paymentAccountName || "—"}</td>
                    <td>
                      {getDueStatus(p) === "Paid" ? (
                        <span style={{ color: "#16a34a", fontWeight: "bold" }}>
                          Paid
                        </span>
                      ) : (
                        <button
                          onClick={() => markPayablePaid(p.payableNumber)}
                          style={button("#16a34a")}
                        >
                          Mark Paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="13" style={{ textAlign: "center", color: MUTED }}>
                    No accounts payable records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
  gap: "12px",
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

function Card({ children }) {
  return (
    <div style={{ backgroundColor: "white", border: "1px solid #dbe3ef", borderRadius: "12px", padding: "18px" }}>
      {children}
    </div>
  );
}

export default AccountsPayable;