import { useEffect, useMemo, useRef, useState } from "react";
import api from "../api";
import { Link } from "react-router-dom";

const todayInJamaica = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Jamaica",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  return ["year", "month", "day"]
    .map((type) => parts.find((part) => part.type === type)?.value)
    .join("-");
};

const newRequestId = () =>
  globalThis.crypto?.randomUUID
    ? globalThis.crypto.randomUUID()
    : `ap-${Date.now()}-${Math.random().toString(36).slice(2)}`;


function AccountsPayable() {
  const [vendors, setVendors] = useState([]);
  const [payables, setPayables] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [activeForm, setActiveForm] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVendorCode, setSelectedVendorCode] = useState("");
  const [selectedPayable, setSelectedPayable] = useState(null);
    const actionInFlight = useRef(false);
  const creationRequest = useRef(null);
  const paymentRequest = useRef("");
  const [saving, setSaving] = useState(false);

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
    payableDate: todayInJamaica(),
    dueDate: "",
    description: "",
    expenseAccountCode: "6000",
    amount: 0,
    notes: "",
  });

  const [paymentForm, setPaymentForm] = useState({
    paymentAccountNumber: "",
    paymentDate: todayInJamaica(),
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
    if (["Paid", "Void", "Draft"].includes(payable.status)) {
      return payable.status;
    }

    if (
      Number(payable.balanceDue || 0) > 0 &&
      payable.dueDate &&
      payable.dueDate < todayInJamaica()
    ) {
      return "Overdue";
    }

    return payable.status || "Unpaid";
  };


  const summary = useMemo(() => {
        const openBills = payables.filter(
      (p) =>
        !["Paid", "Void", "Draft"].includes(p.status) &&
        Number(p.balanceDue || 0) > 0
    );

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

    const supplierStatement = useMemo(() => {
    if (!selectedVendor) return { rows: [], closingBalance: 0 };

    const rows = [];

    for (const payable of selectedVendorPayables) {
      if (["Draft", "Void"].includes(payable.status)) continue;

      rows.push({
        date: payable.payableDate,
        reference: payable.billNumber || payable.payableNumber,
        description: payable.description || "Supplier bill",
        charge: Number(payable.amount || 0),
        payment: 0,
        order: 0,
      });

      const history = Array.isArray(payable.paymentHistory)
        ? payable.paymentHistory
        : [];

      let itemizedPaid = 0;

      for (const entry of history) {
        const amount = Number(entry.paymentAmount || 0);
        itemizedPaid += amount;

        rows.push({
          date: entry.paymentDate,
          reference: entry.paymentReference || payable.payableNumber,
          description: `Payment against ${payable.billNumber || payable.payableNumber}`,
          charge: 0,
          payment: amount,
          order: 1,
        });
      }

      const unitemized = Math.round(
        (Number(payable.amountPaid || 0) - itemizedPaid) * 100
      ) / 100;

      if (unitemized !== 0) {
        rows.push({
          date: "",
          reference: payable.payableNumber,
          description:
            "Existing payment balance without matching itemized history — review separately",
          charge: 0,
          payment: unitemized,
          order: 2,
        });
      }
    }

    rows.sort(
      (a, b) =>
        (a.date || "9999").localeCompare(b.date || "9999") ||
        a.order - b.order ||
        a.reference.localeCompare(b.reference)
    );

    let balance = Number(selectedVendor.openingBalance || 0);

    const statementRows = rows.map((row) => {
      balance = Math.round(
        (balance + row.charge - row.payment) * 100
      ) / 100;

      return { ...row, balance };
    });

    return {
      rows: statementRows,
      closingBalance: balance,
    };
  }, [selectedVendor, selectedVendorPayables]);


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
    if (actionInFlight.current) return;

    const details = {
      ...payableForm,
      billNumber: payableForm.billNumber.trim(),
      amount: Number(payableForm.amount),
    };

    if (
      !details.vendorCode ||
      !details.billNumber ||
      !details.payableDate ||
      !details.dueDate ||
      !Number.isFinite(details.amount) ||
      details.amount <= 0
    ) {
      alert("Vendor, supplier bill number, dates and a positive amount are required.");
      return;
    }

    const fingerprint = JSON.stringify(details);

    if (creationRequest.current?.fingerprint !== fingerprint) {
      creationRequest.current = {
        fingerprint,
        id: newRequestId(),
      };
    }

    actionInFlight.current = true;
    setSaving(true);

    try {
      const response = await api.post("/api/accounts-payable", {
        ...details,
        requestId: creationRequest.current.id,
      });

      creationRequest.current = null;

      setPayableForm({
        vendorCode: "",
        billNumber: "",
        payableDate: todayInJamaica(),
        dueDate: "",
        description: "",
        expenseAccountCode: "6000",
        amount: 0,
        notes: "",
      });

      setActiveForm("");
      alert(response.data.message);
      await loadData();
    } catch (error) {
      alert(
        error?.response?.data?.message ||
          "Could not confirm bill creation. Refresh records before retrying."
      );
    } finally {
      actionInFlight.current = false;
      setSaving(false);
    }
  };


  const openPaymentModal = (payable, fullPayment = false) => {
        if (actionInFlight.current) return;
    paymentRequest.current = newRequestId();
    setSelectedPayable(payable);
    setPaymentForm({
      paymentAccountNumber: "",
      paymentDate: todayInJamaica(),
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
      paymentDate: todayInJamaica(),
      paymentAmount: "",
      paymentMethod: "Bank Transfer",
      paymentReference: "",
      notes: "",
    });
  };

    const recordPayment = async () => {
    if (actionInFlight.current || !selectedPayable) return;

    const amountToPay = Number(paymentForm.paymentAmount);

    if (
      !paymentForm.paymentAccountNumber ||
      !paymentForm.paymentDate ||
      !paymentForm.paymentReference.trim() ||
      !Number.isFinite(amountToPay) ||
      amountToPay <= 0
    ) {
      alert("Payment account, date, reference and a positive amount are required.");
      return;
    }

    if (amountToPay > Number(selectedPayable.balanceDue || 0)) {
      alert("Payment amount cannot exceed the balance due.");
      return;
    }

    actionInFlight.current = true;
    setSaving(true);

    try {
      const response = await api.put(
        `/api/accounts-payable/${encodeURIComponent(
          selectedPayable.payableNumber
        )}/payments`,
        {
          ...paymentForm,
          paymentAmount: amountToPay,
          paymentReference: paymentForm.paymentReference.trim(),
          requestId: paymentRequest.current,
        }
      );

      closePaymentModal();
      alert(response.data.message);
      await loadData();
    } catch (error) {
      alert(
        error?.response?.data?.message ||
          "Could not confirm payment. Refresh records before retrying."
      );
    } finally {
      actionInFlight.current = false;
      setSaving(false);
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
                        <input
              aria-label="Opening balance"
              value="Opening balance: JMD 0.00"
              readOnly
              style={input(BORDER)}
            />
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
                            {vendors
                .filter(
                  (vendor) =>
                    vendor.status === "Active" &&
                    vendor.vendorType !== "Freight Forwarder"
                )
                .map((vendor) => (
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
                    <button
            onClick={savePayable}
            disabled={saving}
            style={{ ...button("#16a34a"), marginTop: "14px" }}
          >
            {saving ? "Saving…" : "Save Payable"}
          </button>
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
            <Card><strong>Open Bills</strong><p>{selectedVendorPayables.filter(
  (p) =>
    !["Paid", "Void", "Draft"].includes(p.status) &&
    Number(p.balanceDue || 0) > 0
).length}</p></Card>
            <Card><strong>Total Paid</strong><p>{money(selectedVendorPayables.reduce((sum, p) => sum + Number(p.amountPaid || 0), 0))}</p></Card>
            <Card><strong>Contact</strong><p>{selectedVendor.phone || selectedVendor.email || "—"}</p></Card>
          </div>
        )}
      </div>

            {selectedVendor && (
        <div style={panel(BORDER)}>
          <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>
            Supplier Statement — {selectedVendor.vendorName}
          </h2>

          <p>
            JMD accounting values. Opening balance:{" "}
            <strong>{money(selectedVendor.openingBalance)}</strong>.
            Draft and Void bills are excluded.
          </p>

          <div style={{ overflowX: "auto" }}>
            <table
              border="1"
              cellPadding="10"
              style={{
                minWidth: "850px",
                width: "100%",
                borderCollapse: "collapse",
                borderColor: BORDER,
              }}
            >
              <thead style={{ backgroundColor: "#eef4ff" }}>
                <tr>
                  <th>Date</th>
                  <th>Reference</th>
                  <th>Description</th>
                  <th>Charges</th>
                  <th>Payments Applied</th>
                  <th>Balance</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>—</td>
                  <td>Opening balance</td>
                  <td>Existing vendor opening balance</td>
                  <td>—</td>
                  <td>—</td>
                  <td>{money(selectedVendor.openingBalance)}</td>
                </tr>

                {supplierStatement.rows.map((row, index) => (
                  <tr key={`${row.reference}-${index}`}>
                    <td>{row.date || "Date unavailable"}</td>
                    <td>{row.reference}</td>
                    <td>{row.description}</td>
                    <td>{row.charge ? money(row.charge) : "—"}</td>
                    <td>{row.payment ? money(row.payment) : "—"}</td>
                    <td>{money(row.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p>
            Statement closing balance:{" "}
            <strong>{money(supplierStatement.closingBalance)}</strong>
            <br />
            Saved vendor balance:{" "}
            <strong>{money(selectedVendor.currentBalance)}</strong>
          </p>

          {Math.abs(
            supplierStatement.closingBalance -
            Number(selectedVendor.currentBalance || 0)
          ) > 0.009 && (
            <p style={{ color: "#b45309" }}>
              These balances differ. The statement displays existing
              records; it does not repair or rewrite historical balances.
            </p>
          )}

          <p style={{ color: MUTED }}>
            Freight bills show their JMD payable amounts here. Their
            original-currency totals and actual payment costs remain
            available in Freight Forwarder Invoices.
          </p>
        </div>
      )}


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
                                            {p.freightInvoiceNumber ? (
                        <Link
                          to="/freight-invoices"
                          style={{ color: ROYAL_BLUE, fontWeight: "bold" }}
                        >
                          Open Freight Invoices
                        </Link>
                                            ) : ["Paid", "Void", "Draft"].includes(p.status) ? (
                                                <span style={{ fontWeight: "bold" }}>{p.status}</span>
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
                                {accounts
                  .filter(
                    (account) =>
                      account.status === "Active" &&
                      String(account.currency || "JMD").toUpperCase() === "JMD"
                  )
                  .map((account) => (
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
                            <button
                onClick={closePaymentModal}
                disabled={saving}
                style={button("#64748b")}
              >
                Cancel
              </button>
              <button
                onClick={recordPayment}
                disabled={saving}
                style={button("#16a34a")}
              >
                {saving ? "Recording…" : "Record Payment"}
              </button>
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