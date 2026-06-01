import { useEffect, useMemo, useState } from "react";
import api from "../api";

function BankingReconciliation() {
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [reconciliations, setReconciliations] = useState([]);
  const [formOpen, setFormOpen] = useState(false);

  const [formData, setFormData] = useState({
    accountNumber: "",
    statementDate: new Date().toISOString().slice(0, 10),
    bankStatementBalance: 0,
    notes: "",
  });

  const ROYAL_BLUE = "#0B3D91";
  const BORDER = "#dbe3ef";
  const MUTED = "#64748b";

  const loadBanking = async () => {
    try {
      const res = await api.get("/api/banking");
      setAccounts(res.data.accounts || []);
      setTransactions(res.data.transactions || []);
      setReconciliations(res.data.reconciliations || []);
    } catch (error) {
      console.error("Banking error:", error);
      alert(error?.response?.data?.message || "Could not load banking dashboard.");
    }
  };

  useEffect(() => {
    loadBanking();
  }, []);

  const money = (value, currency = "JMD") =>
  `${currency} ${Number(value || 0).toLocaleString()}`;

  const totalCash = useMemo(
  () =>
    accounts.reduce(
      (sum, account) =>
        sum + Number(account.baseCurrencyBalance || 0),
      0
    ),
  [accounts]
);

  const recentTransactions = transactions.slice(0, 25);

  const createReconciliation = async () => {
    try {
      if (!formData.accountNumber) {
        alert("Please select an account.");
        return;
      }

      await api.post("/api/banking/reconciliation", formData);

      alert("Bank reconciliation created successfully.");
      setFormOpen(false);
      setFormData({
        accountNumber: "",
        statementDate: new Date().toISOString().slice(0, 10),
        bankStatementBalance: 0,
        notes: "",
      });
      await loadBanking();
    } catch (error) {
      console.error("Reconciliation error:", error);
      alert(error?.response?.data?.message || "Could not create reconciliation.");
    }
  };

  return (
    <div>
      <h1 style={{ margin: 0 }}>Banking & Reconciliation</h1>
      <p style={{ marginTop: "6px", color: MUTED }}>
        Corporate cash control, bank balances, transactions, and reconciliation.
      </p>

      <button
        onClick={() => setFormOpen((prev) => !prev)}
        style={{
          backgroundColor: ROYAL_BLUE,
          color: "white",
          border: "none",
          padding: "10px 16px",
          borderRadius: "8px",
          cursor: "pointer",
          fontWeight: "bold",
          margin: "18px 0",
        }}
      >
        {formOpen ? "Close Form" : "+ New Reconciliation"}
      </button>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "14px",
          marginBottom: "18px",
        }}
      >
        <Card>
          <h2 style={{ color: ROYAL_BLUE, margin: 0 }}>{money(totalCash)}</h2>
          <p style={{ fontWeight: "bold" }}>Total Cash / Bank Balance</p>
        </Card>

        <Card>
          <h2 style={{ color: "#16a34a", margin: 0 }}>{accounts.length}</h2>
          <p style={{ fontWeight: "bold" }}>Financial Accounts</p>
        </Card>

        <Card>
          <h2 style={{ color: "#f59e0b", margin: 0 }}>{transactions.length}</h2>
          <p style={{ fontWeight: "bold" }}>Cashbook Transactions</p>
        </Card>

        <Card>
          <h2 style={{ color: "#7c3aed", margin: 0 }}>{reconciliations.length}</h2>
          <p style={{ fontWeight: "bold" }}>Reconciliations</p>
        </Card>
      </div>

      {formOpen && (
        <div style={panel(BORDER)}>
          <h2 style={{ color: ROYAL_BLUE, marginTop: 0 }}>New Bank Reconciliation</h2>

          <div style={grid}>
            <select
              value={formData.accountNumber}
              onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
              style={input(BORDER)}
            >
              <option value="">Select Account</option>
              {accounts.map((account) => (
                <option key={account._id} value={account.accountNumber}>
  {account.accountName} ({account.accountNumber}) -{" "}
  {money(account.currentBalance, account.currency)}
</option>
              ))}
            </select>

            <input
              type="date"
              value={formData.statementDate}
              onChange={(e) => setFormData({ ...formData, statementDate: e.target.value })}
              style={input(BORDER)}
            />

            <input
              type="number"
              placeholder="Bank Statement Balance"
              value={formData.bankStatementBalance}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  bankStatementBalance: Number(e.target.value || 0),
                })
              }
              style={input(BORDER)}
            />

            <textarea
              placeholder="Notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              style={{ ...input(BORDER), gridColumn: "1 / -1" }}
            />
          </div>

          <button onClick={createReconciliation} style={{ ...button("#16a34a"), marginTop: "14px" }}>
            Save Reconciliation
          </button>
        </div>
      )}

      <div style={panel(BORDER)}>
        <h2 style={{ color: ROYAL_BLUE, marginTop: 0 }}>Financial Accounts</h2>

        <div style={tableWrap(BORDER)}>
          <table border="1" cellPadding="10" style={table(BORDER, "1100px")}>
            <thead style={thead}>
              <tr>
                <th>Account Number</th>
                <th>Account Name</th>
                <th>Type</th>
                <th>Bank</th>
                <th>Opening Balance</th>
                <th>Current Balance</th>
                <th>Currency</th>
<th>JMD Equivalent</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {accounts.length > 0 ? (
                accounts.map((account) => (
                  <tr key={account._id}>
                    <td>{account.accountNumber}</td>
                    <td>{account.accountName}</td>
                    <td>{account.accountType}</td>
                    <td>{account.bankName || "—"}</td>
                    <td>
  {money(account.openingBalance, account.currency)}
</td>

<td style={{ fontWeight: "bold" }}>
  {money(account.currentBalance, account.currency)}
</td>
<td>{account.currency || "JMD"}</td>

<td>
  {money(
    account.baseCurrencyBalance || account.currentBalance,
    "JMD"
  )}
</td>

                    <td>{account.status}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", color: MUTED }}>
                    No financial accounts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={panel(BORDER)}>
        <h2 style={{ color: ROYAL_BLUE, marginTop: 0 }}>Recent Cashbook Transactions</h2>

        <div style={tableWrap(BORDER)}>
          <table border="1" cellPadding="10" style={table(BORDER, "1250px")}>
            <thead style={thead}>
              <tr>
                <th>Date</th>
                <th>Transaction No.</th>
                <th>Account</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Reference</th>
                <th>Notes</th>
              </tr>
            </thead>

            <tbody>
              {recentTransactions.length > 0 ? (
                recentTransactions.map((item) => (
                  <tr key={item._id}>
                    <td>{String(item.transactionDate || "").slice(0, 10)}</td>
                    <td>{item.transactionNumber}</td>
                    <td>{item.accountName}</td>
                    <td>{item.transactionType}</td>
                    <td style={{ fontWeight: "bold" }}>{money(item.amount)}</td>
                    <td>{item.reference || "—"}</td>
                    <td>{item.notes || "—"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", color: MUTED }}>
                    No transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={panel(BORDER)}>
        <h2 style={{ color: ROYAL_BLUE, marginTop: 0 }}>Bank Reconciliations</h2>

        <div style={tableWrap(BORDER)}>
          <table border="1" cellPadding="10" style={table(BORDER, "1300px")}>
            <thead style={thead}>
              <tr>
                <th>Reconciliation No.</th>
                <th>Account</th>
                <th>Statement Date</th>
                <th>Bank Balance</th>
                <th>System Balance</th>
                <th>Difference</th>
                <th>Status</th>
                <th>Completed By</th>
              </tr>
            </thead>

            <tbody>
              {reconciliations.length > 0 ? (
                reconciliations.map((rec) => (
                  <tr key={rec._id}>
                    <td>{rec.reconciliationNumber}</td>
                    <td>{rec.accountName}</td>
                    <td>{rec.statementDate}</td>
                    <td>{money(rec.bankStatementBalance)}</td>
                    <td>{money(rec.systemBalance)}</td>
                    <td style={{ fontWeight: "bold" }}>{money(rec.difference)}</td>
                    <td>{rec.status}</td>
                    <td>{rec.completedBy || "—"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center", color: MUTED }}>
                    No reconciliations found.
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

const thead = {
  backgroundColor: "#eef4ff",
  position: "sticky",
  top: 0,
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

function tableWrap(border) {
  return {
    overflowX: "auto",
    overflowY: "auto",
    maxHeight: "55vh",
    border: `1px solid ${border}`,
    borderRadius: "12px",
  };
}

function table(border, minWidth) {
  return {
    minWidth,
    width: "100%",
    borderCollapse: "collapse",
    borderColor: border,
  };
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

export default BankingReconciliation;