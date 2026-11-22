import { useEffect, useRef, useState } from "react";
import api from "../api";

const fieldStyle = {
  width: "100%", boxSizing: "border-box", padding: "9px 10px",
  marginTop: 4, border: "1px solid #bdcbe0", borderRadius: 6
};

function eligibleAccounts(accounts, currency) {
  return accounts.filter(account =>
    account.status === "Active" &&
    ["Bank", "Cash"].includes(account.accountType) &&
    account.linkedChartAccountCode &&
    account.currency === currency && account.baseCurrency === currency
  );
}

export default function RepaymentForm({ number, accounts, close, saved }) {
  const dialog = useRef(null);
  const locked = useRef(false);
  const [purchase, setPurchase] = useState(null);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Cash");
  const [account, setAccount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const storageKey = "ek.repayment.pending." + number;
  const [pending, setPending] = useState(() => {
    const value = sessionStorage.getItem(storageKey);
    return value ? JSON.parse(value) : null;
  });
  const initialPending = useRef(pending);
  const currency = purchase?.baseCurrency || "JMD";
  const choices = eligibleAccounts(accounts, currency);

  useEffect(() => {
    dialog.current.showModal();
    let active = true;
    api.get("/api/customer-purchases/" + encodeURIComponent(number))
      .then(({ data }) => {
        if (!active) return;
        const item = data.data;
        const previous = initialPending.current?.body;
        setPurchase(item);
        setAmount(String(previous?.amountReceived ?? item.outstandingAmount));
        setAccount(previous?.receivingAccountNumber ?? "");
        setMethod(previous?.paymentMethod ?? "Cash");
      })
      .catch(() => {
        if (active) setError("Could not load this purchase. Close and reopen to retry.");
      });
    return () => { active = false; };
  }, [number]);

  const receivingAccount = account ||
    choices.find(item => item.isDefaultCustomerReceiptAccount)?.accountNumber || "";

  async function submit(event) {
    event.preventDefault();
    if (locked.current || !purchase) return;
    locked.current = true;
    setBusy(true);
    setError("");
    let complete = false;

    try {
      const base = "/api/customer-purchases/" + encodeURIComponent(number) + "/repayments";
      const request = pending || {
        url: purchase.invoiceNumber
          ? base + "/invoice/" + encodeURIComponent(purchase.invoiceNumber)
          : base,
        body: {
          amountReceived: Number(amount),
          paymentAmount: Number(amount),
          receivingAccountNumber: receivingAccount,
          paymentMethod: method,
          paymentRequestId: crypto.randomUUID()
        }
      };

      sessionStorage.setItem(storageKey, JSON.stringify(request));
      setPending(request);
      const { data } = await api.post(request.url, request.body);
      sessionStorage.removeItem(storageKey);
      complete = true;
      window.alert("Repayment recorded for " + number + ". Journal " +
        (data.journalEntryNumber || data.data.journalEntryNumber));
    } catch (err) {
      if ([400, 404, 422].includes(err.response?.status)) {
        sessionStorage.removeItem(storageKey);
        setPending(null);
      }
      setError(err.response?.data?.message ||
        "Payment outcome unconfirmed. Retry the same receipt.");
    } finally {
      locked.current = false;
      setBusy(false);
    }
    if (complete) { close(); await saved(); }
  }

  return (
    <dialog ref={dialog} aria-labelledby="repayment-title"
      onCancel={event => { event.preventDefault(); if (!busy) close(); }}
            style={{
        width: "min(460px, 92vw)",
        boxSizing: "border-box",
        padding: 24,
        border: "1px solid #bdcbe0",
        borderRadius: 12,
        color: "#172b47",
        backgroundColor: "#FFFFFF",
        colorScheme: "light",
      }}>
      <h2 id="repayment-title" style={{color:"#0B3D91", marginTop:0}}>
        Record customer repayment
      </h2>
      <form onSubmit={submit} style={{display:"grid", gap:14}}>
        {purchase && <>
          <div><strong>{number} &middot; {purchase.customerName}</strong></div>
          <div>Tracking numbers: {purchase.trackingNumbers?.join(", ") || "Pending"}</div>
          <div>Outstanding: <strong>{currency} {Number(purchase.outstandingAmount)
            .toLocaleString("en-JM", {minimumFractionDigits:2, maximumFractionDigits:2})}</strong></div>

          <label>Amount received ({currency})
            <input type="number" min="0.01" step="0.01" required style={fieldStyle}
              max={pending ? undefined : purchase.outstandingAmount}
              disabled={busy || !!pending} value={amount}
              onChange={event => setAmount(event.target.value)} />
          </label>

          <label>Payment method
            <select style={fieldStyle} value={method} disabled={busy || !!pending}
              onChange={event => setMethod(event.target.value)}>
              {["Cash", "Bank Transfer", "Debit Card", "Credit Card"].map(value =>
                <option key={value}>{value}</option>)}
            </select>
          </label>

          <label>Receiving account
            <select required style={fieldStyle} value={receivingAccount}
              disabled={busy || !!pending} onChange={event => setAccount(event.target.value)}>
              <option value="">Select an account</option>
              {choices.map(item => <option key={item.accountNumber} value={item.accountNumber}>
                {item.accountName} &middot; {item.accountNumber}
              </option>)}
            </select>
          </label>
        </>}
        {error && <div role="alert">{error}</div>}
        <div style={{display:"flex", gap:10}}>
          <button type="submit" disabled={busy || !purchase}
            style={{background:"#0B3D91",color:"white",padding:"10px 16px",
              border:0,borderRadius:6,fontWeight:700}}>
            {busy ? "Recording..." : pending ? "Retry same receipt" : "Record repayment"}
          </button>
          <button type="button" disabled={busy} onClick={close}>Close</button>
        </div>
      </form>
    </dialog>
  );
}
