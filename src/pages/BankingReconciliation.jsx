import { useEffect, useMemo, useState } from "react";
import api from "../api";

function BankingReconciliation() {
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [reconciliations, setReconciliations] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedAccountNumber, setSelectedAccountNumber] = useState("");
  const [clearedTransactionNumbers, setClearedTransactionNumbers] = useState([]);

  const [formData, setFormData] = useState({
    accountNumber: "",
    statementStartDate: "",
    statementDate: new Date().toISOString().slice(0, 10),
    statementOpeningBalance: 0,
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

  const selectedAccount = useMemo(
    () => accounts.find((account) => account.accountNumber === selectedAccountNumber),
    [accounts, selectedAccountNumber]
  );

  const formAccount = useMemo(
    () => accounts.find((account) => account.accountNumber === formData.accountNumber),
    [accounts, formData.accountNumber]
  );

  const accountTransactions = useMemo(() => {
    if (!selectedAccountNumber) return transactions;
    return transactions.filter((item) => item.accountNumber === selectedAccountNumber);
  }, [transactions, selectedAccountNumber]);

  const reconciliationTransactions = useMemo(() => {
    if (!formData.accountNumber) return [];

    return transactions
      .filter((item) => item.accountNumber === formData.accountNumber)
      .filter((item) => !item.reconciled && !item.lockedByReconciliation)
      .filter((item) => {
        if (!formData.statementDate) return true;
        return new Date(item.transactionDate) <= new Date(formData.statementDate);
      });
  }, [transactions, formData.accountNumber, formData.statementDate]);

  const isDeposit = (transactionType = "") =>
    ["Deposit", "Owner Deposit", "Transfer In", "Invoice Payment", "Interest Income"].includes(transactionType);

  const reconciliationPreview = useMemo(() => {
    const clearedSet = new Set(clearedTransactionNumbers);

    let clearedDeposits = 0;
    let clearedWithdrawals = 0;
    let outstandingDeposits = 0;
    let outstandingWithdrawals = 0;

    reconciliationTransactions.forEach((item) => {
      const amount = Number(item.amount || 0);
      const cleared = clearedSet.has(item.transactionNumber);

      if (cleared && isDeposit(item.transactionType)) clearedDeposits += amount;
      if (cleared && !isDeposit(item.transactionType)) clearedWithdrawals += amount;
      if (!cleared && isDeposit(item.transactionType)) outstandingDeposits += amount;
      if (!cleared && !isDeposit(item.transactionType)) outstandingWithdrawals += amount;
    });

    const adjustedBalance =
      Number(formData.statementOpeningBalance || 0) + clearedDeposits - clearedWithdrawals;

    const difference = Number(formData.bankStatementBalance || 0) - adjustedBalance;

    return {
      clearedDeposits,
      clearedWithdrawals,
      outstandingDeposits,
      outstandingWithdrawals,
      adjustedBalance,
      difference,
    };
  }, [clearedTransactionNumbers, reconciliationTransactions, formData]);

  const totalCash = useMemo(
    () => accounts.reduce((sum, account) => sum + Number(account.baseCurrencyBalance || 0), 0),
    [accounts]
  );

  const recentTransactions = accountTransactions.slice(0, 50);

  const toggleCleared = (transactionNumber) => {
    setClearedTransactionNumbers((prev) =>
      prev.includes(transactionNumber)
        ? prev.filter((item) => item !== transactionNumber)
        : [...prev, transactionNumber]
    );
  };

  const resetForm = () => {
    setFormData({
      accountNumber: "",
      statementStartDate: "",
      statementDate: new Date().toISOString().slice(0, 10),
      statementOpeningBalance: 0,
      bankStatementBalance: 0,
      notes: "",
    });
    setClearedTransactionNumbers([]);
  };

  const createReconciliation = async () => {
    try {
      if (!formData.accountNumber) {
        alert("Please select an account.");
        return;
      }

      if (!formData.statementDate) {
        alert("Statement date is required.");
        return;
      }

      await api.post("/api/banking/reconciliation", {
        ...formData,
        clearedTransactionNumbers,
      });

      alert("Bank reconciliation created successfully.");
      setFormOpen(false);
      resetForm();
      await loadBanking();
    } catch (error) {
      console.error("Reconciliation error:", error);
      alert(error?.response?.data?.message || "Could not create reconciliation.");
    }
  };

  const finalizeReconciliation = async (reconciliationNumber) => {
    try {
      await api.put(`/api/banking/reconciliation/${reconciliationNumber}/finalize`);
      alert("Reconciliation finalized successfully.");
      await loadBanking();
    } catch (error) {
      console.error("Finalize error:", error);
      alert(error?.response?.data?.message || "Could not finalize reconciliation.");
    }
  };

  const reopenReconciliation = async (reconciliationNumber) => {
    try {
      await api.put(`/api/banking/reconciliation/${reconciliationNumber}/reopen`);
      alert("Reconciliation reopened successfully.");
      await loadBanking();
    } catch (error) {
      console.error("Reopen error:", error);
      alert(error?.response?.data?.message || "Could not reopen reconciliation.");
    }
  };

  return (
    <div>
      <h1 style={{ margin: 0 }}>Banking & Reconciliation</h1>
      <p style={{ marginTop: "6px", color: MUTED }}>
        Corporate cash control, bank register, cleared transactions, and reconciliation.
      </p>

      <button onClick={() => setFormOpen((prev) => !prev)} style={{ ...button(ROYAL_BLUE), margin: "18px 0" }}>
        {formOpen ? "Close Reconciliation" : "+ New Reconciliation"}
      </button>

      <div style={summaryGrid}>
        <Card><h2 style={{ color: ROYAL_BLUE, margin: 0 }}>{money(totalCash)}</h2><p style={{ fontWeight: "bold" }}>Total Cash / Bank Balance</p></Card>
        <Card><h2 style={{ color: "#16a34a", margin: 0 }}>{accounts.length}</h2><p style={{ fontWeight: "bold" }}>Financial Accounts</p></Card>
        <Card><h2 style={{ color: "#f59e0b", margin: 0 }}>{transactions.filter((t) => !t.reconciled).length}</h2><p style={{ fontWeight: "bold" }}>Unreconciled Transactions</p></Card>
        <Card><h2 style={{ color: "#7c3aed", margin: 0 }}>{reconciliations.length}</h2><p style={{ fontWeight: "bold" }}>Reconciliations</p></Card>
      </div>

      <div style={panel(BORDER)}>
        <h2 style={{ color: ROYAL_BLUE, marginTop: 0 }}>Bank Account Status</h2>
        <select value={selectedAccountNumber} onChange={(e) => setSelectedAccountNumber(e.target.value)} style={{ ...input(BORDER), width: "100%", marginBottom: "12px" }}>
          <option value="">All Accounts</option>
          {accounts.map((account) => (
            <option key={account._id} value={account.accountNumber}>
              {account.accountName} - {money(account.currentBalance, account.currency)}
            </option>
          ))}
        </select>

        {selectedAccount && (
          <div style={summaryGrid}>
            <Card><strong>Ledger Balance</strong><p>{money(selectedAccount.currentBalance, selectedAccount.currency)}</p></Card>
            <Card><strong>Last Reconciled</strong><p>{selectedAccount.lastReconciledDate || "Never"}</p></Card>
            <Card><strong>Last Balance</strong><p>{money(selectedAccount.lastReconciledBalance)}</p></Card>
            <Card><strong>Status</strong><p>{selectedAccount.reconciliationStatus || "Never Reconciled"}</p></Card>
            <Card><strong>Outstanding Deposits</strong><p>{money(selectedAccount.outstandingDeposits)}</p></Card>
            <Card><strong>Outstanding Withdrawals</strong><p>{money(selectedAccount.outstandingWithdrawals)}</p></Card>
          </div>
        )}
      </div>

      {formOpen && (
        <div style={panel(BORDER)}>
          <h2 style={{ color: ROYAL_BLUE, marginTop: 0 }}>Reconciliation Workspace</h2>

          <div style={grid}>
            <select value={formData.accountNumber} onChange={(e) => {
              setFormData({ ...formData, accountNumber: e.target.value });
              setClearedTransactionNumbers([]);
            }} style={input(BORDER)}>
              <option value="">Select Account</option>
              {accounts.map((account) => (
                <option key={account._id} value={account.accountNumber}>
                  {account.accountName} ({account.accountNumber}) - {money(account.currentBalance, account.currency)}
                </option>
              ))}
            </select>

            <input type="date" value={formData.statementStartDate} onChange={(e) => setFormData({ ...formData, statementStartDate: e.target.value })} style={input(BORDER)} />
            <input type="date" value={formData.statementDate} onChange={(e) => setFormData({ ...formData, statementDate: e.target.value })} style={input(BORDER)} />
            <input type="number" placeholder="Statement Opening Balance" value={formData.statementOpeningBalance} onChange={(e) => setFormData({ ...formData, statementOpeningBalance: Number(e.target.value || 0) })} style={input(BORDER)} />
            <input type="number" placeholder="Statement Ending Balance" value={formData.bankStatementBalance} onChange={(e) => setFormData({ ...formData, bankStatementBalance: Number(e.target.value || 0) })} style={input(BORDER)} />
            <textarea placeholder="Notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} style={{ ...input(BORDER), gridColumn: "1 / -1" }} />
          </div>

          <div style={{ ...summaryGrid, marginTop: "16px" }}>
            <Card><strong>Opening Balance</strong><p>{money(formData.statementOpeningBalance, formAccount?.currency || "JMD")}</p></Card>
            <Card><strong>Cleared Deposits</strong><p>{money(reconciliationPreview.clearedDeposits)}</p></Card>
            <Card><strong>Cleared Withdrawals</strong><p>{money(reconciliationPreview.clearedWithdrawals)}</p></Card>
            <Card><strong>Adjusted Balance</strong><p>{money(reconciliationPreview.adjustedBalance)}</p></Card>
            <Card><strong>Statement Balance</strong><p>{money(formData.bankStatementBalance)}</p></Card>
            <Card><strong>Difference</strong><p style={{ color: reconciliationPreview.difference === 0 ? "#16a34a" : "#dc2626", fontWeight: "bold" }}>{money(reconciliationPreview.difference)}</p></Card>
          </div>

          <h3 style={{ color: ROYAL_BLUE }}>Select Cleared Transactions</h3>
          <div style={tableWrap(BORDER)}>
            <table border="1" cellPadding="10" style={table(BORDER, "1250px")}>
              <thead style={thead}>
                <tr>
                  <th>Cleared</th>
                  <th>Date</th>
                  <th>Transaction No.</th>
                  <th>Type</th>
                  <th>Deposit</th>
                  <th>Withdrawal</th>
                  <th>Reference</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {reconciliationTransactions.length > 0 ? (
                  reconciliationTransactions.map((item) => (
                    <tr key={item._id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={clearedTransactionNumbers.includes(item.transactionNumber)}
                          onChange={() => toggleCleared(item.transactionNumber)}
                        />
                      </td>
                      <td>{String(item.transactionDate || "").slice(0, 10)}</td>
                      <td>{item.transactionNumber}</td>
                      <td>{item.transactionType}</td>
                      <td>{isDeposit(item.transactionType) ? money(item.amount) : "—"}</td>
                      <td>{!isDeposit(item.transactionType) ? money(item.amount) : "—"}</td>
                      <td>{item.reference || "—"}</td>
                      <td>{item.notes || "—"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" style={{ textAlign: "center", color: MUTED }}>No unreconciled transactions found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <button onClick={createReconciliation} style={{ ...button("#16a34a"), marginTop: "14px" }}>
            Save Reconciliation
          </button>
        </div>
      )}

      <div style={panel(BORDER)}>
        <h2 style={{ color: ROYAL_BLUE, marginTop: 0 }}>Financial Accounts</h2>
        <div style={tableWrap(BORDER)}>
          <table border="1" cellPadding="10" style={table(BORDER, "1400px")}>
            <thead style={thead}>
              <tr>
                <th>Account Number</th>
                <th>Account Name</th>
                <th>Type</th>
                <th>Bank</th>
                <th>Current Balance</th>
                <th>Currency</th>
                <th>JMD Equivalent</th>
                <th>Last Reconciled</th>
                <th>Recon Status</th>
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
                    <td style={{ fontWeight: "bold" }}>{money(account.currentBalance, account.currency)}</td>
                    <td>{account.currency || "JMD"}</td>
                    <td>{money(account.baseCurrencyBalance || account.currentBalance, "JMD")}</td>
                    <td>{account.lastReconciledDate || "—"}</td>
                    <td>{account.reconciliationStatus || "Never Reconciled"}</td>
                    <td>{account.status}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="10" style={{ textAlign: "center", color: MUTED }}>No financial accounts found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={panel(BORDER)}>
        <h2 style={{ color: ROYAL_BLUE, marginTop: 0 }}>Bank Register</h2>
        <div style={tableWrap(BORDER)}>
          <table border="1" cellPadding="10" style={table(BORDER, "1450px")}>
            <thead style={thead}>
              <tr>
                <th>Date</th>
                <th>Transaction No.</th>
                <th>Account</th>
                <th>Type</th>
                <th>Deposit</th>
                <th>Withdrawal</th>
                <th>Reference</th>
                <th>Journal Entry</th>
                <th>Cleared</th>
                <th>Reconciled</th>
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
                    <td>{isDeposit(item.transactionType) ? money(item.amount) : "—"}</td>
                    <td>{!isDeposit(item.transactionType) ? money(item.amount) : "—"}</td>
                    <td>{item.reference || "—"}</td>
                    <td>{item.journalEntryNumber || "—"}</td>
                    <td>{item.cleared ? "✓" : "—"}</td>
                    <td>{item.reconciled ? "✓" : "—"}</td>
                    <td>{item.notes || "—"}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="11" style={{ textAlign: "center", color: MUTED }}>No transactions found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={panel(BORDER)}>
        <h2 style={{ color: ROYAL_BLUE, marginTop: 0 }}>Bank Reconciliation History</h2>
        <div style={tableWrap(BORDER)}>
          <table border="1" cellPadding="10" style={table(BORDER, "1550px")}>
            <thead style={thead}>
              <tr>
                <th>Reconciliation No.</th>
                <th>Account</th>
                <th>Statement Date</th>
                <th>Statement Balance</th>
                <th>Adjusted Balance</th>
                <th>Difference</th>
                <th>Cleared Deposits</th>
                <th>Cleared Withdrawals</th>
                <th>Status</th>
                <th>Completed By</th>
                <th>Action</th>
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
                    <td>{money(rec.adjustedBalance)}</td>
                    <td style={{ fontWeight: "bold", color: Number(rec.difference || 0) === 0 ? "#16a34a" : "#dc2626" }}>
                      {money(rec.difference)}
                    </td>
                    <td>{money(rec.clearedDeposits)}</td>
                    <td>{money(rec.clearedWithdrawals)}</td>
                    <td>{rec.status}</td>
                    <td>{rec.completedBy || rec.startedBy || "—"}</td>
                    <td>
                      {rec.status === "Balanced" && !rec.locked && (
                        <button onClick={() => finalizeReconciliation(rec.reconciliationNumber)} style={button("#16a34a")}>
                          Finalize
                        </button>
                      )}
                      {rec.locked && (
                        <button onClick={() => reopenReconciliation(rec.reconciliationNumber)} style={button("#f59e0b")}>
                          Reopen
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="11" style={{ textAlign: "center", color: MUTED }}>No reconciliations found.</td></tr>
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

const summaryGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "14px",
  marginBottom: "18px",
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
    <div style={{ backgroundColor: "white", border: "1px solid #dbe3ef", borderRadius: "12px", padding: "18px" }}>
      {children}
    </div>
  );
}

export default BankingReconciliation;