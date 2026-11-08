import { useEffect, useMemo, useRef, useState } from "react";
import api from "../api";

const today = () => {
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

const newInvoiceForm = () => ({
  vendorCode: "",
  supplierInvoiceNumber: "",
  invoiceDate: today(),
  dueDate: today(),
  currency: "USD",
  exchangeRate: "",
  packageCount: "",
  totalWeight: "",
  trackingText: "",
  manifestNumber: "",
  expenseAccountCode: "6000",
  notes: "",
  charges: [
    { category: "Warehousing", description: "", amount: "" },
    { category: "Freight", description: "", amount: "" },
    { category: "Surcharge", description: "", amount: "" },
  ],
});

const money = (value, currency = "JMD") =>
  `${currency} ${Number(value || 0).toLocaleString("en-JM", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const requestId = () => {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `freight-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const panel = {
  background: "white",
  border: "1px solid #dbe3ef",
  borderRadius: 12,
  padding: 18,
  marginBottom: 18,
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
  gap: 12,
};

const input = {
  width: "100%",
  boxSizing: "border-box",
  padding: 10,
  border: "1px solid #dbe3ef",
  borderRadius: 8,
};

const button = {
  background: "#0B3D91",
  color: "white",
  border: 0,
  borderRadius: 8,
  padding: "10px 14px",
  cursor: "pointer",
  fontWeight: "bold",
};

function Field({ label, children }) {
  return (
    <label style={{ display: "grid", gap: 6, alignContent: "start" }}>
      <span style={{ fontSize: 13, fontWeight: "bold" }}>{label}</span>
      {children}
    </label>
  );
}

async function errorMessage(error) {
  if (error.response?.data instanceof Blob) {
    try {
      return JSON.parse(await error.response.data.text()).message;
    } catch {
      return "Could not open the document.";
    }
  }

  return (
    error.response?.data?.message ||
    error.message ||
    "Could not confirm the operation. Refresh before retrying."
  );
}

export default function FreightInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [currency, setCurrency] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [form, setForm] = useState(newInvoiceForm);
  const [attachment, setAttachment] = useState(null);
  const [selected, setSelected] = useState(null);
  const [payment, setPayment] = useState(null);
  const [proof, setProof] = useState(null);
    const [expenseLink, setExpenseLink] = useState(null);
  const [expensePreview, setExpensePreview] = useState(null);
  const busy = useRef(false);
  const fileRef = useRef(null);

  const load = async () => {
    setLoading(true);

    try {
      const [invoiceRes, vendorRes, accountRes] = await Promise.all([
        api.get("/api/freight-invoices"),
        api.get("/api/accounts-payable/vendors"),
        api.get("/api/financial-accounts"),
      ]);

      setInvoices(invoiceRes.data.data || []);
      setVendors(
        (vendorRes.data.data || []).filter(
          (vendor) =>
            vendor.vendorType === "Freight Forwarder" &&
            vendor.status === "Active"
        )
      );
      setAccounts(
        (accountRes.data.data || []).filter(
          (account) =>
            account.status === "Active" &&
            String(account.currency || "JMD").toUpperCase() === "JMD"
        )
      );
    } catch (error) {
      alert(await errorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, status, currency, pageSize]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return invoices.filter(
      (invoice) =>
        (!status || invoice.status === status) &&
        (!currency || invoice.currency === currency) &&
        [
          invoice.supplierInvoiceNumber,
          invoice.freightInvoiceNumber,
          invoice.vendorName,
          invoice.manifestNumber,
          ...(invoice.trackingNumbers || []),
        ].join(" ").toLowerCase().includes(term)
    );
  }, [invoices, search, status, currency]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pages);
  const rows = filtered.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );

  const summary = useMemo(
    () => ["JMD", "USD"].map((code) => {
      const records = filtered.filter((invoice) => invoice.currency === code);

      return {
        currency: code,
        count: records.length,
        unpaid: records.filter((invoice) => invoice.balanceDue > 0).length,
        billed: records.reduce((sum, invoice) => sum + invoice.total, 0),
        paid: records.reduce((sum, invoice) => sum + invoice.amountPaid, 0),
        outstanding: records.reduce(
          (sum, invoice) => sum + invoice.balanceDue,
          0
        ),
        actualJmdPaid: records.reduce(
          (sum, invoice) =>
            sum + invoice.paymentHistory.reduce(
              (paid, entry) => paid + entry.actualJmdAmount,
              0
            ),
          0
        ),
      };
    }),
    [filtered]
  );

  const updateForm = (name, value) =>
    setForm((previous) => ({ ...previous, [name]: value }));

  const updateCharge = (index, name, value) =>
    setForm((previous) => ({
      ...previous,
      charges: previous.charges.map((line, position) =>
        position === index ? { ...line, [name]: value } : line
      ),
    }));

  const saveInvoice = async () => {
    if (busy.current) return;

    if (attachment?.size > 10 * 1024 * 1024) {
      alert("The invoice attachment must be 10 MB or smaller.");
      return;
    }

    busy.current = true;
    setSaving(true);

    try {
      const trackingNumbers = form.trackingText
        .split(/[\n,]+/)
        .map((value) => value.trim())
        .filter(Boolean);

      const payload = {
        ...form,
        packageCount: Number(form.packageCount),
        totalWeight: Number(form.totalWeight),
        exchangeRate: form.currency === "JMD" ? 1 : Number(form.exchangeRate),
        trackingNumbers,
        charges: form.charges
          .filter((line) => line.amount !== "")
          .map((line) => ({ ...line, amount: Number(line.amount) })),
      };

      delete payload.trackingText;

      const data = new FormData();
      data.append("payload", JSON.stringify(payload));
      if (attachment) data.append("attachment", attachment);

      const response = await api.post("/api/freight-invoices", data);

      setInvoices((previous) => [response.data.data, ...previous]);
      setForm(newInvoiceForm());
      setAttachment(null);
      if (fileRef.current) fileRef.current.value = "";
      setShowCreate(false);
      alert(response.data.message);
    } catch (error) {
      alert(await errorMessage(error));
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };

  const openPayment = (invoice) => {
    setPayment({
      invoice,
      requestId: requestId(),
      paymentDate: today(),
      invoiceCurrencyAmount: invoice.balanceDue,
      actualJmdAmount: "",
      paymentAccountNumber: "",
      paymentMethod: "Bank Transfer",
      paymentReference: "",
      exchangeAdjustmentAccountCode: "",
      notes: "",
    });
    setProof(null);
  };

  const recordPayment = async () => {
    if (busy.current || !payment) return;

    if (proof?.size > 10 * 1024 * 1024) {
      alert("Payment proof must be 10 MB or smaller.");
      return;
    }

    busy.current = true;
    setSaving(true);

    try {
      const { invoice, ...details } = payment;

      const data = new FormData();
      data.append("payload", JSON.stringify(details));
      if (proof) data.append("attachment", proof);

      const response = await api.post(
        `/api/freight-invoices/${encodeURIComponent(
          invoice.freightInvoiceNumber
        )}/payments`,
        data
      );

      const updated = response.data.data;

      setInvoices((previous) =>
        previous.map((item) =>
          item.freightInvoiceNumber === updated.freightInvoiceNumber
            ? updated
            : item
        )
      );

      if (selected?.freightInvoiceNumber === updated.freightInvoiceNumber) {
        setSelected(updated);
      }

      setPayment(null);
      setProof(null);
      alert(response.data.message);
    } catch (error) {
      alert(await errorMessage(error));
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };

    const previewExistingExpense = async () => {
    if (busy.current || !expenseLink) return;

    busy.current = true;
    setSaving(true);
    setExpensePreview(null);

    try {
      const response = await api.post(
        `/api/freight-invoices/${encodeURIComponent(
          expenseLink.invoice.freightInvoiceNumber
        )}/existing-expense/preview`,
        { expenseNumber: expenseLink.expenseNumber.trim() }
      );

      setExpensePreview(response.data.data);
    } catch (error) {
      alert(await errorMessage(error));
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };

  const confirmExistingExpense = async () => {
    if (busy.current || !expenseLink || !expensePreview) return;

    busy.current = true;
    setSaving(true);

    try {
      const response = await api.post(
        `/api/freight-invoices/${encodeURIComponent(
          expenseLink.invoice.freightInvoiceNumber
        )}/existing-expense/link`,
        {
          expenseNumber: expenseLink.expenseNumber.trim(),
          postingDate: expenseLink.postingDate,
          reason: expenseLink.reason,
          fingerprint: expensePreview.fingerprint,
        }
      );

      setExpenseLink(null);
      setExpensePreview(null);
      setSelected(null);

      alert(response.data.message);
      await load();
    } catch (error) {
      setExpensePreview(null);
      alert(await errorMessage(error));
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };


  const openDocument = async (invoice, paymentId) => {
    const preview = window.open("about:blank", "_blank");

    if (!preview) {
      alert("Please allow pop-ups to view the document.");
      return;
    }

    preview.opener = null;
    preview.document.body.textContent = "Opening document…";

    let url;

    try {
      const suffix = paymentId
        ? `payment/${encodeURIComponent(paymentId)}`
        : "invoice";

      const response = await api.get(
        `/api/freight-invoices/${encodeURIComponent(
          invoice.freightInvoiceNumber
        )}/documents/${suffix}`,
        { responseType: "blob" }
      );

      if (preview.closed) return;

      const type = String(
        response.headers?.["content-type"] || response.data.type || ""
      ).split(";")[0].trim().toLowerCase();

      if (
        !["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(type) ||
        !response.data.size
      ) {
        throw new Error("The server did not return a supported document.");
      }

      url = URL.createObjectURL(new Blob([response.data], { type }));
      preview.location.replace(url);

      const cleanup = window.setInterval(() => {
        if (preview.closed) {
          window.clearInterval(cleanup);
          URL.revokeObjectURL(url);
        }
      }, 1000);
    } catch (error) {
      if (!preview.closed) preview.close();
      if (url) URL.revokeObjectURL(url);
      alert(await errorMessage(error));
    }
  };

  return (
    <div>
      <h1>Freight Forwarder Invoices</h1>
      <p>
        Record warehouse invoices and payments already made to your freight
        forwarder. No payment is sent from this screen.
      </p>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
        <button
          style={button}
          disabled={saving}
          onClick={() => setShowCreate((value) => !value)}
        >
          {showCreate ? "Close New Invoice" : "+ Record Freight Invoice"}
        </button>
        <button style={button} disabled={loading || saving} onClick={load}>
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {showCreate && (
        <section style={panel}>
          <h2>New Freight Invoice</h2>
          {!vendors.length && (
            <p>
              First add Kajay Warehousing in Accounts Payable → Add Vendor,
              using vendor type Freight Forwarder.
            </p>
          )}

          <div style={grid}>
            <Field label="Freight forwarder">
              <select
                style={input}
                value={form.vendorCode}
                onChange={(event) => updateForm("vendorCode", event.target.value)}
              >
                <option value="">Select freight forwarder</option>
                {vendors.map((vendor) => (
                  <option key={vendor.vendorCode} value={vendor.vendorCode}>
                    {vendor.vendorName}
                  </option>
                ))}
              </select>
            </Field>

            {[
              ["supplierInvoiceNumber", "Supplier invoice number", "text"],
              ["invoiceDate", "Invoice date", "date"],
              ["dueDate", "Due date", "date"],
              ["packageCount", "Package count", "number"],
              ["totalWeight", "Total weight (lb)", "number"],
              ["manifestNumber", "Manifest number (optional)", "text"],
              ["expenseAccountCode", "Freight expense account code", "text"],
            ].map(([name, label, type]) => (
              <Field key={name} label={label}>
                <input
                  style={input}
                  type={type}
                  step={type === "number" ? "any" : undefined}
                  value={form[name]}
                  onChange={(event) => updateForm(name, event.target.value)}
                />
              </Field>
            ))}

            <Field label="Invoice currency">
              <select
                style={input}
                value={form.currency}
                onChange={(event) => updateForm("currency", event.target.value)}
              >
                <option>USD</option>
                <option>JMD</option>
              </select>
            </Field>

            {form.currency === "USD" && (
              <Field label="Invoice exchange rate: JMD per USD">
                <input
                  style={input}
                  type="number"
                  step="any"
                  value={form.exchangeRate}
                  onChange={(event) => updateForm("exchangeRate", event.target.value)}
                />
              </Field>
            )}
          </div>

          <p>
            Enter charge amounts exactly as shown on the supplier invoice.
            Blank charge amounts are omitted.
          </p>

          {form.charges.map((line, index) => (
            <div key={index} style={{ ...grid, marginBottom: 10 }}>
              <select
                aria-label={`Charge ${index + 1} category`}
                style={input}
                value={line.category}
                onChange={(event) => updateCharge(index, "category", event.target.value)}
              >
                {["Warehousing", "Freight", "Surcharge", "Other"].map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
              <input
                aria-label={`Charge ${index + 1} description`}
                style={input}
                placeholder="Description"
                value={line.description}
                onChange={(event) => updateCharge(index, "description", event.target.value)}
              />
              <input
                aria-label={`Charge ${index + 1} amount`}
                style={input}
                type="number"
                min="0"
                step="0.01"
                placeholder={`Amount (${form.currency})`}
                value={line.amount}
                onChange={(event) => updateCharge(index, "amount", event.target.value)}
              />
              <button
                style={button}
                onClick={() =>
                  setForm((previous) => ({
                    ...previous,
                    charges: previous.charges.filter((_, position) => position !== index),
                  }))
                }
              >
                Remove Line
              </button>
            </div>
          ))}

          <button
            style={button}
            onClick={() =>
              setForm((previous) => ({
                ...previous,
                charges: [
                  ...previous.charges,
                  { category: "Other", description: "", amount: "" },
                ],
              }))
            }
          >
            + Charge Line
          </button>

          <p>
            <strong>
              Invoice total:{" "}
              {money(
                form.charges.reduce((sum, line) => sum + Number(line.amount || 0), 0),
                form.currency
              )}
            </strong>
          </p>

          <div style={grid}>
            <Field label="Tracking numbers — one per line, or comma-separated">
              <textarea
                style={{ ...input, minHeight: 110 }}
                value={form.trackingText}
                onChange={(event) => updateForm("trackingText", event.target.value)}
              />
            </Field>
            <Field label="Notes">
              <textarea
                style={{ ...input, minHeight: 110 }}
                value={form.notes}
                onChange={(event) => updateForm("notes", event.target.value)}
              />
            </Field>
            <Field label="Original supplier invoice (optional, maximum 10 MB)">
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                disabled={saving}
                onChange={(event) => setAttachment(event.target.files?.[0] || null)}
              />
            </Field>
          </div>

          <button
            style={{ ...button, marginTop: 18 }}
            disabled={saving}
            onClick={saveInvoice}
          >
            {saving ? "Saving…" : "Save and Post Invoice"}
          </button>
        </section>
      )}

      <section style={panel}>
        <div style={grid}>
          <input
            style={input}
            placeholder="Search invoice, supplier, manifest or tracking"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select style={input} value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">All statuses</option>
            <option>Unpaid</option>
            <option>Partially Paid</option>
            <option>Paid</option>
          </select>
          <select style={input} value={currency} onChange={(event) => setCurrency(event.target.value)}>
            <option value="">All currencies</option>
            <option>USD</option>
            <option>JMD</option>
          </select>
        </div>
      </section>

      <div style={grid}>
        {summary.map((item) => (
          <section key={item.currency} style={panel}>
            <h2>{item.currency} invoices</h2>
            <p>Invoices: <strong>{item.count}</strong> · Outstanding: <strong>{item.unpaid}</strong></p>
            <p>Total billed: <strong>{money(item.billed, item.currency)}</strong></p>
            <p>Settled: <strong>{money(item.paid, item.currency)}</strong></p>
            <p>Balance due: <strong>{money(item.outstanding, item.currency)}</strong></p>
            <p>Actual payments: <strong>{money(item.actualJmdPaid)}</strong></p>
          </section>
        ))}
      </div>

      <section style={panel}>
        <p>Summary and results reflect the current filters.</p>
        <div style={{ overflowX: "auto" }}>
          <table border="1" cellPadding="10" style={{ width: "100%", minWidth: 1100, borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th>Supplier Invoice</th><th>Forwarder</th><th>Date / Due</th>
                <th>Packages / Weight</th><th>Total</th><th>Settled</th>
                <th>Balance</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((invoice) => (
                <tr key={invoice.freightInvoiceNumber}>
                  <td>{invoice.supplierInvoiceNumber}</td>
                  <td>{invoice.vendorName}</td>
                  <td>{invoice.invoiceDate}<br />Due: {invoice.dueDate}</td>
                  <td>{invoice.packageCount} / {invoice.totalWeight} lb</td>
                  <td>{money(invoice.total, invoice.currency)}</td>
                  <td>{money(invoice.amountPaid, invoice.currency)}</td>
                  <td>{money(invoice.balanceDue, invoice.currency)}</td>
                  <td>
                    {invoice.status}
                    {invoice.balanceDue > 0 && invoice.dueDate < today() && " · Overdue"}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button style={button} onClick={() => setSelected(invoice)}>Details</button>
                      {invoice.invoiceAttachment && (
                        <button style={button} onClick={() => openDocument(invoice)}>View Invoice</button>
                      )}
                                            {invoice.balanceDue > 0 && (
                        <>
                          <button
                            style={button}
                            disabled={saving}
                            onClick={() => openPayment(invoice)}
                          >
                            Record Payment
                          </button>

                          {invoice.status === "Unpaid" &&
                            invoice.paymentHistory.length === 0 && (
                              <button
                                style={button}
                                disabled={saving}
                                onClick={() => {
                                  setExpensePreview(null);
                                  setExpenseLink({
                                    invoice,
                                    expenseNumber: "",
                                    postingDate: today(),
                                    reason: "",
                                  });
                                }}
                              >
                                Link Existing Expense
                              </button>
                            )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr><td colSpan="9">{loading ? "Loading…" : "No freight invoices found."}</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginTop: 16 }}>
          <label>
            Rows:{" "}
            <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
              <option value={10}>10</option><option value={25}>25</option><option value={50}>50</option>
            </select>
          </label>
          <span>{filtered.length} results · Page {safePage} of {pages}</span>
          <button style={button} disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>Previous</button>
          <button style={button} disabled={safePage >= pages} onClick={() => setPage(safePage + 1)}>Next</button>
        </div>
      </section>

      {selected && (
        <section style={panel}>
          <button style={button} onClick={() => setSelected(null)}>Close Details</button>
          <h2>{selected.supplierInvoiceNumber} — {selected.vendorName}</h2>
          <p>
            {selected.status} · Balance: {money(selected.balanceDue, selected.currency)}
            <br />Original accounting value: {money(selected.baseCurrencyAmount)}
            <br />Invoice rate: {selected.exchangeRate} JMD per {selected.currency}
            <br />Linked payable: {selected.payableNumber}
            <br />Invoice journal: {selected.journalEntryNumber}
            <br />Manifest: {selected.manifestNumber || "—"}
          </p>

          <h3>Charge breakdown</h3>
          {selected.charges.map((line, index) => (
            <p key={index}>
              <strong>{line.category}</strong> — {line.description || "—"}:{" "}
              {money(line.amount, selected.currency)}
            </p>
          ))}

          <h3>Tracking numbers</h3>
          <p style={{ overflowWrap: "anywhere" }}>
            {selected.trackingNumbers.join(", ") || "Not supplied"}
          </p>

          <h3>Payment history</h3>
          {!selected.paymentHistory.length && <p>No payments recorded.</p>}
          {selected.paymentHistory.map((entry) => (
            <div key={entry._id} style={panel}>
              <strong>{money(entry.invoiceCurrencyAmount, selected.currency)} settled</strong>
              <p>
                Actual paid: {money(entry.actualJmdAmount)}
                <br />Liability cleared: {money(entry.carryingJmdAmount)}
                <br />Exchange adjustment: {money(entry.exchangeDifference)}
                <br />Date: {entry.paymentDate}
                <br />Account: {entry.paymentAccountName}
                <br />Method: {entry.paymentMethod}
                <br />Reference: {entry.paymentReference}
                <br />Journal: {entry.journalEntryNumber}
                <br />Recorded by: {entry.paidBy}
                                {entry.sourceExpenseNumber && (
                  <>
                    <br />
                    Existing expense: {entry.sourceExpenseNumber}
                    <br />
                    Original payment journal: {entry.originalJournalEntryNumber}
                    <br />
                    Difference retained in original expense; no new payment.
                  </>
                )}
              </p>
              <p>{entry.notes}</p>
              {entry.proof && (
                <button style={button} onClick={() => openDocument(selected, entry._id)}>
                  View Payment Proof
                </button>
              )}
            </div>
          ))}
          <p>{selected.notes}</p>
        </section>
      )}

            {expenseLink && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "#0f172a99",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 16,
          }}
        >
          <section
            style={{
              ...panel,
              width: "min(760px, 96vw)",
              maxHeight: "90vh",
              overflowY: "auto",
              marginBottom: 0,
            }}
          >
            <h2>Link Existing Paid Expense</h2>

            <p>
              Invoice: <strong>
                {expenseLink.invoice.supplierInvoiceNumber}
              </strong>
              <br />
              Use this when payment was already recorded under Finance
              Expenses. The original bank or card charge is retained.
            </p>

            <div style={grid}>
              <Field label="Existing expense number">
                <input
                  style={input}
                  value={expenseLink.expenseNumber}
                  disabled={saving}
                  placeholder="EXP-..."
                  onChange={(event) => {
                    setExpensePreview(null);
                    setExpenseLink({
                      ...expenseLink,
                      expenseNumber: event.target.value,
                    });
                  }}
                />
              </Field>

              <Field label="Correction posting date">
                <input
                  style={input}
                  type="date"
                  value={expenseLink.postingDate}
                  disabled={saving}
                  onChange={(event) =>
                    setExpenseLink({
                      ...expenseLink,
                      postingDate: event.target.value,
                    })
                  }
                />
              </Field>

              <Field label="Reason — confirm why this expense belongs to this invoice">
                <textarea
                  style={input}
                  minLength={10}
                  maxLength={1000}
                  value={expenseLink.reason}
                  disabled={saving}
                  onChange={(event) =>
                    setExpenseLink({
                      ...expenseLink,
                      reason: event.target.value,
                    })
                  }
                />
              </Field>
            </div>

            <p>
              <button
                style={button}
                disabled={saving || !expenseLink.expenseNumber.trim()}
                onClick={previewExistingExpense}
              >
                {saving ? "Checking…" : "Preview Existing Expense"}
              </button>
            </p>

            {expensePreview && (
              <div style={panel}>
                <h3>Review this match</h3>
                <p>
                  Supplier: {expensePreview.vendorName}
                  <br />
                  Invoice: {expensePreview.supplierInvoiceNumber}
                  <br />
                  Invoice total:{" "}
                  {money(
                    expensePreview.invoiceAmount,
                    expensePreview.invoiceCurrency
                  )}
                  <br />
                  Payable to clear:{" "}
                  {money(expensePreview.liabilityJmdAmount)}
                  <br />
                  Existing expense: {expensePreview.expenseNumber}
                  <br />
                  Description: {expensePreview.expenseDescription}
                  <br />
                  Category: {expensePreview.expenseCategory}
                  <br />
                  Original payment: {money(expensePreview.actualJmdAmount)}
                  <br />
                  Account: {expensePreview.paymentAccountName}
                  <br />
                  Payment date: {expensePreview.paymentDate}
                  <br />
                  Original journal:{" "}
                  {expensePreview.originalJournalEntryNumber}
                  <br />
                  Original transaction:{" "}
                  {expensePreview.originalTransactionNumber}
                  <br />
                  Difference: {money(expensePreview.difference)}
                </p>

                <p>
                  Confirm only if this expense paid this supplier invoice
                  in full. The correction clears the payable and offsets
                  the duplicate invoice cost. The original expense amount
                  and bank/card charge remain unchanged.
                </p>

                <p>
                  Any difference remains within the original expense.
                  It is not automatically classified as an exchange fee
                  or posted again.
                </p>
              </div>
            )}

            <div
              style={{
                display: "flex",
                gap: 10,
                justifyContent: "flex-end",
                flexWrap: "wrap",
              }}
            >
              <button
                style={button}
                disabled={saving}
                onClick={() => {
                  setExpenseLink(null);
                  setExpensePreview(null);
                }}
              >
                Cancel
              </button>

              <button
                style={button}
                disabled={
                  saving ||
                  !expensePreview ||
                  expenseLink.reason.trim().length < 10
                }
                onClick={confirmExistingExpense}
              >
                {saving ? "Processing…" : "Confirm Link — No New Payment"}
              </button>
            </div>
          </section>
        </div>
      )}


      {payment && (
        <div style={{
          position: "fixed", inset: 0, background: "#0f172a99",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 9999, padding: 16,
        }}>
          <section style={{
            ...panel, width: "min(760px, 96vw)", maxHeight: "90vh",
            overflowY: "auto", marginBottom: 0,
          }}>
            <h2>Record Payment Already Made</h2>
                        <p>
              If this payment is already entered under Finance Expenses,
              cancel and choose <strong>Link Existing Expense</strong>.
              Recording it here creates an additional accounting payment.
            </p>
            <p>
              {payment.invoice.vendorName} · {payment.invoice.supplierInvoiceNumber}
              <br />Balance: {money(payment.invoice.balanceDue, payment.invoice.currency)}
            </p>

            <div style={grid}>
              <Field label="JMD paying account">
                <select
                  style={input}
                  value={payment.paymentAccountNumber}
                  disabled={saving}
                  onChange={(event) => setPayment({ ...payment, paymentAccountNumber: event.target.value })}
                >
                  <option value="">Select account</option>
                  {accounts.map((account) => (
                    <option key={account.accountNumber} value={account.accountNumber}>
                      {account.accountName} ({account.accountType})
                    </option>
                  ))}
                </select>
              </Field>

              {[
                ["paymentDate", "Payment date", "date"],
                ["invoiceCurrencyAmount", `Amount settled (${payment.invoice.currency})`, "number"],
                ["actualJmdAmount", "Actual JMD paid", "number"],
                ["paymentReference", "Bank / card / receipt reference", "text"],
                ["exchangeAdjustmentAccountCode", "Exchange expense account (optional)", "text"],
              ].map(([name, label, type]) => (
                <Field key={name} label={label}>
                  <input
                    style={input}
                    type={type}
                    step={type === "number" ? "0.01" : undefined}
                    value={payment[name]}
                    disabled={saving}
                    onChange={(event) => setPayment({ ...payment, [name]: event.target.value })}
                  />
                </Field>
              ))}

              <Field label="Payment method">
                <select
                  style={input}
                  value={payment.paymentMethod}
                  disabled={saving}
                  onChange={(event) => setPayment({ ...payment, paymentMethod: event.target.value })}
                >
                  {["Bank Transfer", "Credit Card", "Debit Card", "Cash", "Cheque", "Other"].map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </Field>

              <Field label="Payment proof (optional, maximum 10 MB)">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  disabled={saving}
                  onChange={(event) => setProof(event.target.files?.[0] || null)}
                />
              </Field>

              <Field label="Notes">
                <textarea
                  style={input}
                  value={payment.notes}
                  disabled={saving}
                  onChange={(event) => setPayment({ ...payment, notes: event.target.value })}
                />
              </Field>
            </div>

            <p>
              Any difference between the invoice-rate value and actual JMD
              paid is posted to the selected exchange expense account.
              If blank, the invoice’s freight expense account is used.
            </p>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button style={button} disabled={saving} onClick={() => setPayment(null)}>Cancel</button>
              <button style={button} disabled={saving} onClick={recordPayment}>
                {saving ? "Recording…" : "Record Payment"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}