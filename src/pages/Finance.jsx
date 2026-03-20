import { useEffect, useMemo, useState } from "react";
import axios from "axios";

function Finance() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [invoices, setInvoices] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [payroll, setPayroll] = useState([]);
  const [summary, setSummary] = useState(null);
  const [reports, setReports] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const [expenseForm, setExpenseForm] = useState({
    date: "",
    category: "",
    description: "",
    amount: "",
    status: "Paid",
    paidFromAccountNumber: "",
  });

  const [payrollForm, setPayrollForm] = useState({
    employeeName: "",
    role: "",
    payPeriod: "",
    grossPay: "",
    deductions: "",
    status: "Pending",
  });

  const [accountForm, setAccountForm] = useState({
    accountName: "",
    accountType: "Bank",
    bankName: "",
    openingBalance: "",
  });

  const [transactionForm, setTransactionForm] = useState({
    accountNumber: "",
    transactionType: "Deposit",
    amount: "",
    reference: "",
    notes: "",
  });

  const [transferForm, setTransferForm] = useState({
    fromAccountNumber: "",
    toAccountNumber: "",
    amount: "",
    reference: "",
    notes: "",
  });

  const fetchFinanceData = async () => {
    try {
      const [
        invoicesRes,
        expensesRes,
        payrollRes,
        summaryRes,
        reportsRes,
        accountsRes,
        transactionsRes,
      ] = await Promise.all([
        axios.get("http://localhost:5000/api/invoices"),
        axios.get("http://localhost:5000/api/finance/expenses"),
        axios.get("http://localhost:5000/api/finance/payroll"),
        axios.get("http://localhost:5000/api/finance/summary"),
        axios.get("http://localhost:5000/api/finance/reports"),
        axios.get("http://localhost:5000/api/financial-accounts"),
        axios.get("http://localhost:5000/api/account-transactions"),
      ]);

      setInvoices(invoicesRes.data.data || []);
      setExpenses(expensesRes.data.data || []);
      setPayroll(payrollRes.data.data || []);
      setSummary(summaryRes.data.data || null);
      setReports(reportsRes.data.data || null);
      setAccounts(accountsRes.data.data || []);
      setTransactions(transactionsRes.data.data || []);
    } catch (error) {
      console.error("Error loading finance data:", error);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const formatCurrency = (value) => `JMD ${Number(value || 0).toLocaleString()}`;

  const formatDate = (value) => {
    if (!value) return "";
    try {
      return new Date(value).toISOString().split("T")[0];
    } catch {
      return value;
    }
  };

  const cardStyle = {
    backgroundColor: "white",
    borderRadius: "10px",
    padding: "20px",
    border: "1px solid #e5e7eb",
  };

  const tabButtonStyle = (tabName) => ({
    backgroundColor: activeTab === tabName ? "#0B3D91" : "white",
    color: activeTab === tabName ? "white" : "#1f2937",
    border: "1px solid #cbd5e1",
    padding: "10px 16px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
  });

  const statusBadge = (status) => {
    const backgroundColor =
      status === "Paid"
        ? "#16a34a"
        : status === "Unpaid"
        ? "#dc2626"
        : status === "Pending"
        ? "#f59e0b"
        : status === "Active"
        ? "#16a34a"
        : status === "Inactive"
        ? "#64748b"
        : "#64748b";

    return (
      <span
        style={{
          padding: "4px 10px",
          borderRadius: "6px",
          color: "white",
          backgroundColor,
        }}
      >
        {status}
      </span>
    );
  };

  const handleExpenseChange = (e) => {
    setExpenseForm({
      ...expenseForm,
      [e.target.name]: e.target.value,
    });
  };

  const addExpense = async () => {
    try {
      if (
        !expenseForm.date ||
        !expenseForm.category ||
        !expenseForm.description ||
        !expenseForm.amount
      ) {
        alert("Please complete all expense fields.");
        return;
      }

      const res = await axios.post(
        "http://localhost:5000/api/finance/expenses",
        expenseForm
      );

      alert(res.data.message);

      setExpenseForm({
        date: "",
        category: "",
        description: "",
        amount: "",
        status: "Paid",
        paidFromAccountNumber: "",
      });

      await fetchFinanceData();
    } catch (error) {
      console.error("Error adding expense:", error);
      alert(error?.response?.data?.message || "Could not save expense.");
    }
  };

  const handlePayrollChange = (e) => {
    setPayrollForm({
      ...payrollForm,
      [e.target.name]: e.target.value,
    });
  };

  const addPayroll = async () => {
    try {
      if (
        !payrollForm.employeeName ||
        !payrollForm.role ||
        !payrollForm.payPeriod ||
        !payrollForm.grossPay
      ) {
        alert("Please complete all payroll fields.");
        return;
      }

      const res = await axios.post(
        "http://localhost:5000/api/finance/payroll",
        payrollForm
      );

      alert(res.data.message);

      setPayrollForm({
        employeeName: "",
        role: "",
        payPeriod: "",
        grossPay: "",
        deductions: "",
        status: "Pending",
      });

      await fetchFinanceData();
    } catch (error) {
      console.error("Error adding payroll:", error);
      alert(error?.response?.data?.message || "Could not save payroll.");
    }
  };

  const handleAccountChange = (e) => {
    setAccountForm({
      ...accountForm,
      [e.target.name]: e.target.value,
    });
  };

  const addAccount = async () => {
    try {
      if (!accountForm.accountName || !accountForm.accountType) {
        alert("Please complete account name and account type.");
        return;
      }

      const payload = {
        ...accountForm,
        openingBalance: Number(accountForm.openingBalance || 0),
      };

      const res = await axios.post(
        "http://localhost:5000/api/financial-accounts",
        payload
      );

      alert(res.data.message);

      setAccountForm({
        accountName: "",
        accountType: "Bank",
        bankName: "",
        openingBalance: "",
      });

      await fetchFinanceData();
    } catch (error) {
      console.error("Error creating financial account:", error);
      alert(error?.response?.data?.message || "Could not create account.");
    }
  };

  const handleTransactionChange = (e) => {
    setTransactionForm({
      ...transactionForm,
      [e.target.name]: e.target.value,
    });
  };

  const addTransaction = async () => {
    try {
      if (
        !transactionForm.accountNumber ||
        !transactionForm.transactionType ||
        !transactionForm.amount
      ) {
        alert("Please complete account, transaction type, and amount.");
        return;
      }

      const payload = {
        ...transactionForm,
        amount: Number(transactionForm.amount || 0),
      };

      const res = await axios.post(
        "http://localhost:5000/api/account-transactions",
        payload
      );

      alert(res.data.message);

      setTransactionForm({
        accountNumber: "",
        transactionType: "Deposit",
        amount: "",
        reference: "",
        notes: "",
      });

      await fetchFinanceData();
    } catch (error) {
      console.error("Error creating account transaction:", error);
      alert(error?.response?.data?.message || "Could not save transaction.");
    }
  };

  const handleTransferChange = (e) => {
    setTransferForm({
      ...transferForm,
      [e.target.name]: e.target.value,
    });
  };

  const addTransfer = async () => {
    try {
      if (
        !transferForm.fromAccountNumber ||
        !transferForm.toAccountNumber ||
        !transferForm.amount
      ) {
        alert("Please complete source account, destination account, and amount.");
        return;
      }

      const payload = {
        ...transferForm,
        amount: Number(transferForm.amount || 0),
      };

      const res = await axios.post(
        "http://localhost:5000/api/account-transactions/transfer",
        payload
      );

      alert(res.data.message);

      setTransferForm({
        fromAccountNumber: "",
        toAccountNumber: "",
        amount: "",
        reference: "",
        notes: "",
      });

      await fetchFinanceData();
    } catch (error) {
      console.error("Error creating transfer:", error);
      alert(error?.response?.data?.message || "Could not complete transfer.");
    }
  };

  const totalAccountBalances = useMemo(
    () => accounts.reduce((sum, account) => sum + Number(account.currentBalance || 0), 0),
    [accounts]
  );

  return (
    <div>
      <h1>Finance Dashboard</h1>

      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "24px",
          flexWrap: "wrap",
        }}
      >
        <button style={tabButtonStyle("dashboard")} onClick={() => setActiveTab("dashboard")}>
          Dashboard
        </button>
        <button style={tabButtonStyle("expenses")} onClick={() => setActiveTab("expenses")}>
          Expenses
        </button>
        <button style={tabButtonStyle("payroll")} onClick={() => setActiveTab("payroll")}>
          Payroll
        </button>
        <button style={tabButtonStyle("reports")} onClick={() => setActiveTab("reports")}>
          Financial Reports
        </button>
        <button style={tabButtonStyle("accounts")} onClick={() => setActiveTab("accounts")}>
          Accounts
        </button>
        <button style={tabButtonStyle("transactions")} onClick={() => setActiveTab("transactions")}>
          Transactions
        </button>
      </div>

      {activeTab === "dashboard" && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "20px",
              marginBottom: "30px",
            }}
          >
            <div style={cardStyle}>
              <h2>{formatCurrency(summary?.totalRevenue)}</h2>
              <p>Total Revenue</p>
            </div>
            <div style={cardStyle}>
              <h2>{summary?.paidInvoices || 0}</h2>
              <p>Paid Invoices</p>
            </div>
            <div style={cardStyle}>
              <h2>{summary?.unpaidInvoices || 0}</h2>
              <p>Unpaid Invoices</p>
            </div>
            <div style={cardStyle}>
              <h2>{formatCurrency(summary?.outstandingRevenue)}</h2>
              <p>Outstanding Revenue</p>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "20px",
              marginBottom: "30px",
            }}
          >
            <div style={cardStyle}>
              <h2>{formatCurrency(summary?.totalExpenses)}</h2>
              <p>Total Expenses</p>
            </div>
            <div style={cardStyle}>
              <h2>{formatCurrency(summary?.totalPayroll)}</h2>
              <p>Total Payroll</p>
            </div>
            <div style={cardStyle}>
              <h2>{formatCurrency(summary?.netPosition)}</h2>
              <p>Net Position</p>
            </div>
            <div style={cardStyle}>
              <h2>{formatCurrency(totalAccountBalances)}</h2>
              <p>Total Account Balances</p>
            </div>
          </div>
        </>
      )}

      {activeTab === "expenses" && (
        <>
          <div style={{ ...cardStyle, marginBottom: "24px" }}>
            <h2>Add Expense</h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "15px",
              }}
            >
              <input
                type="date"
                name="date"
                value={expenseForm.date}
                onChange={handleExpenseChange}
                style={{ padding: "10px" }}
              />
              <input
                type="text"
                name="category"
                placeholder="Category"
                value={expenseForm.category}
                onChange={handleExpenseChange}
                style={{ padding: "10px" }}
              />
              <input
                type="text"
                name="description"
                placeholder="Description"
                value={expenseForm.description}
                onChange={handleExpenseChange}
                style={{ padding: "10px" }}
              />
              <input
                type="number"
                name="amount"
                placeholder="Amount"
                value={expenseForm.amount}
                onChange={handleExpenseChange}
                style={{ padding: "10px" }}
              />
              <select
                name="paidFromAccountNumber"
                value={expenseForm.paidFromAccountNumber}
                onChange={handleExpenseChange}
                style={{ padding: "10px" }}
              >
                <option value="">Select Paid From Account</option>
                {accounts.map((account) => (
                  <option key={account._id} value={account.accountNumber}>
                    {account.accountName} ({account.accountType})
                  </option>
                ))}
              </select>
              <select
                name="status"
                value={expenseForm.status}
                onChange={handleExpenseChange}
                style={{ padding: "10px" }}
              >
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
            <button
              onClick={addExpense}
              style={{
                marginTop: "20px",
                backgroundColor: "#0B3D91",
                color: "white",
                border: "none",
                padding: "10px 16px",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Save Expense
            </button>
          </div>

          <div style={cardStyle}>
            <h2>Expense Records</h2>
            <table border="1" cellPadding="10" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>Expense Number</th>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Paid From Account</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {expenses.length > 0 ? (
                  expenses.map((expense) => (
                    <tr key={expense._id || expense.id}>
                      <td>{expense.expenseNumber}</td>
                      <td>{expense.date}</td>
                      <td>{expense.category}</td>
                      <td>{expense.description}</td>
                      <td>{formatCurrency(expense.amount)}</td>
                      <td>{expense.paidFromAccountName || ""}</td>
                      <td>{statusBadge(expense.status)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7">No expense records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === "payroll" && (
        <>
          <div style={{ ...cardStyle, marginBottom: "24px" }}>
            <h2>Add Payroll Record</h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "15px",
              }}
            >
              <input
                type="text"
                name="employeeName"
                placeholder="Employee Name"
                value={payrollForm.employeeName}
                onChange={handlePayrollChange}
                style={{ padding: "10px" }}
              />
              <input
                type="text"
                name="role"
                placeholder="Role"
                value={payrollForm.role}
                onChange={handlePayrollChange}
                style={{ padding: "10px" }}
              />
              <input
                type="month"
                name="payPeriod"
                value={payrollForm.payPeriod}
                onChange={handlePayrollChange}
                style={{ padding: "10px" }}
              />
              <input
                type="number"
                name="grossPay"
                placeholder="Gross Pay"
                value={payrollForm.grossPay}
                onChange={handlePayrollChange}
                style={{ padding: "10px" }}
              />
              <input
                type="number"
                name="deductions"
                placeholder="Deductions"
                value={payrollForm.deductions}
                onChange={handlePayrollChange}
                style={{ padding: "10px" }}
              />
              <select
                name="status"
                value={payrollForm.status}
                onChange={handlePayrollChange}
                style={{ padding: "10px" }}
              >
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
              </select>
            </div>
            <button
              onClick={addPayroll}
              style={{
                marginTop: "20px",
                backgroundColor: "#0B3D91",
                color: "white",
                border: "none",
                padding: "10px 16px",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Save Payroll Record
            </button>
          </div>

          <div style={cardStyle}>
            <h2>Payroll Records</h2>
            <table border="1" cellPadding="10" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>Payroll Number</th>
                  <th>Employee</th>
                  <th>Role</th>
                  <th>Pay Period</th>
                  <th>Gross Pay</th>
                  <th>Deductions</th>
                  <th>Net Pay</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {payroll.length > 0 ? (
                  payroll.map((item) => (
                    <tr key={item._id || item.id}>
                      <td>{item.payrollNumber}</td>
                      <td>{item.employeeName}</td>
                      <td>{item.role}</td>
                      <td>{item.payPeriod}</td>
                      <td>{formatCurrency(item.grossPay)}</td>
                      <td>{formatCurrency(item.deductions)}</td>
                      <td>{formatCurrency(item.netPay)}</td>
                      <td>{statusBadge(item.status)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8">No payroll records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === "reports" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px" }}>
          <div style={cardStyle}>
            <h2>Profit and Loss Statement</h2>
            <table border="1" cellPadding="12" style={{ width: "100%" }}>
              <tbody>
                <tr>
                  <td><strong>Revenue</strong></td>
                  <td>{formatCurrency(reports?.profitAndLoss?.revenue)}</td>
                </tr>
                <tr>
                  <td><strong>Operating Expenses</strong></td>
                  <td>{formatCurrency(reports?.profitAndLoss?.operatingExpenses)}</td>
                </tr>
                <tr>
                  <td><strong>Payroll Expense</strong></td>
                  <td>{formatCurrency(reports?.profitAndLoss?.payrollExpense)}</td>
                </tr>
                <tr>
                  <td><strong>Total Expenses</strong></td>
                  <td>{formatCurrency(reports?.profitAndLoss?.totalExpenses)}</td>
                </tr>
                <tr>
                  <td><strong>Net Profit / Loss</strong></td>
                  <td>{formatCurrency(reports?.profitAndLoss?.netProfit)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={cardStyle}>
            <h2>Cash Flow Statement</h2>
            <table border="1" cellPadding="12" style={{ width: "100%" }}>
              <tbody>
                <tr>
                  <td><strong>Cash Inflows</strong></td>
                  <td>{formatCurrency(reports?.cashFlow?.cashInflows)}</td>
                </tr>
                <tr>
                  <td><strong>Cash Outflows</strong></td>
                  <td>{formatCurrency(reports?.cashFlow?.cashOutflows)}</td>
                </tr>
                <tr>
                  <td><strong>Net Cash Flow</strong></td>
                  <td>{formatCurrency(reports?.cashFlow?.netCashFlow)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={cardStyle}>
            <h2>Balance Sheet</h2>
            <table border="1" cellPadding="12" style={{ width: "100%" }}>
              <tbody>
                <tr>
                  <td><strong>Cash</strong></td>
                  <td>{formatCurrency(reports?.balanceSheet?.assets?.cash)}</td>
                </tr>
                <tr>
                  <td><strong>Accounts Receivable</strong></td>
                  <td>{formatCurrency(reports?.balanceSheet?.assets?.accountsReceivable)}</td>
                </tr>
                <tr>
                  <td><strong>Total Assets</strong></td>
                  <td>{formatCurrency(reports?.balanceSheet?.assets?.totalAssets)}</td>
                </tr>
                <tr>
                  <td><strong>Total Liabilities</strong></td>
                  <td>{formatCurrency(reports?.balanceSheet?.liabilities?.totalLiabilities)}</td>
                </tr>
                <tr>
                  <td><strong>Owner's Equity</strong></td>
                  <td>{formatCurrency(reports?.balanceSheet?.equity?.ownerEquity)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "accounts" && (
        <>
          <div style={{ ...cardStyle, marginBottom: "24px" }}>
            <h2>Create Financial Account</h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "15px",
              }}
            >
              <input
                type="text"
                name="accountName"
                placeholder="Account Name"
                value={accountForm.accountName}
                onChange={handleAccountChange}
                style={{ padding: "10px" }}
              />
              <select
                name="accountType"
                value={accountForm.accountType}
                onChange={handleAccountChange}
                style={{ padding: "10px" }}
              >
                <option value="Bank">Bank</option>
                <option value="Cash">Cash</option>
                <option value="Credit Card">Credit Card</option>
              </select>
              <input
                type="text"
                name="bankName"
                placeholder="Bank Name (optional)"
                value={accountForm.bankName}
                onChange={handleAccountChange}
                style={{ padding: "10px" }}
              />
              <input
                type="number"
                name="openingBalance"
                placeholder="Opening Balance"
                value={accountForm.openingBalance}
                onChange={handleAccountChange}
                style={{ padding: "10px" }}
              />
            </div>
            <button
              onClick={addAccount}
              style={{
                marginTop: "20px",
                backgroundColor: "#0B3D91",
                color: "white",
                border: "none",
                padding: "10px 16px",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Save Account
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "20px",
              marginBottom: "24px",
            }}
          >
            <div style={cardStyle}>
              <h2>{accounts.length}</h2>
              <p>Total Accounts</p>
            </div>
            <div style={cardStyle}>
              <h2>{accounts.filter((a) => a.accountType === "Bank").length}</h2>
              <p>Bank Accounts</p>
            </div>
            <div style={cardStyle}>
              <h2>{accounts.filter((a) => a.accountType === "Cash").length}</h2>
              <p>Cash Accounts</p>
            </div>
            <div style={cardStyle}>
              <h2>{accounts.filter((a) => a.accountType === "Credit Card").length}</h2>
              <p>Credit Card Accounts</p>
            </div>
          </div>

          <div style={cardStyle}>
            <h2>Financial Accounts</h2>
            <table border="1" cellPadding="10" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>Account Number</th>
                  <th>Account Name</th>
                  <th>Type</th>
                  <th>Bank Name</th>
                  <th>Opening Balance</th>
                  <th>Current Balance</th>
                  <th>Currency</th>
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
                      <td>{account.bankName}</td>
                      <td>{formatCurrency(account.openingBalance)}</td>
                      <td>{formatCurrency(account.currentBalance)}</td>
                      <td>{account.currency}</td>
                      <td>{statusBadge(account.status)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8">No financial accounts found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === "transactions" && (
        <>
          <div style={{ ...cardStyle, marginBottom: "24px" }}>
            <h2>Record Account Transaction</h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "15px",
                marginBottom: "20px",
              }}
            >
              <select
                name="accountNumber"
                value={transactionForm.accountNumber}
                onChange={handleTransactionChange}
                style={{ padding: "10px" }}
              >
                <option value="">Select Account</option>
                {accounts.map((account) => (
                  <option key={account._id} value={account.accountNumber}>
                    {account.accountName} ({account.accountType})
                  </option>
                ))}
              </select>

              <select
                name="transactionType"
                value={transactionForm.transactionType}
                onChange={handleTransactionChange}
                style={{ padding: "10px" }}
              >
                <option value="Deposit">Deposit</option>
                <option value="Withdrawal">Withdrawal</option>
                <option value="Transfer In">Transfer In</option>
                <option value="Transfer Out">Transfer Out</option>
                <option value="Invoice Payment">Invoice Payment</option>
                <option value="Expense Payment">Expense Payment</option>
                <option value="Credit Card Payment">Credit Card Payment</option>
              </select>

              <input
                type="number"
                name="amount"
                placeholder="Amount"
                value={transactionForm.amount}
                onChange={handleTransactionChange}
                style={{ padding: "10px" }}
              />

              <input
                type="text"
                name="reference"
                placeholder="Reference"
                value={transactionForm.reference}
                onChange={handleTransactionChange}
                style={{ padding: "10px" }}
              />

              <textarea
                name="notes"
                placeholder="Notes"
                value={transactionForm.notes}
                onChange={handleTransactionChange}
                style={{
                  padding: "10px",
                  minHeight: "90px",
                  gridColumn: "span 2",
                }}
              />
            </div>

            <button
              onClick={addTransaction}
              style={{
                marginBottom: "30px",
                backgroundColor: "#0B3D91",
                color: "white",
                border: "none",
                padding: "10px 16px",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Save Transaction
            </button>

            <h2>Transfer Between Accounts</h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "15px",
                marginTop: "15px",
              }}
            >
              <select
                name="fromAccountNumber"
                value={transferForm.fromAccountNumber}
                onChange={handleTransferChange}
                style={{ padding: "10px" }}
              >
                <option value="">Select Source Account</option>
                {accounts.map((account) => (
                  <option key={account._id} value={account.accountNumber}>
                    {account.accountName} ({account.accountType})
                  </option>
                ))}
              </select>

              <select
                name="toAccountNumber"
                value={transferForm.toAccountNumber}
                onChange={handleTransferChange}
                style={{ padding: "10px" }}
              >
                <option value="">Select Destination Account</option>
                {accounts.map((account) => (
                  <option key={account._id} value={account.accountNumber}>
                    {account.accountName} ({account.accountType})
                  </option>
                ))}
              </select>

              <input
                type="number"
                name="amount"
                placeholder="Transfer Amount"
                value={transferForm.amount}
                onChange={handleTransferChange}
                style={{ padding: "10px" }}
              />

              <input
                type="text"
                name="reference"
                placeholder="Reference"
                value={transferForm.reference}
                onChange={handleTransferChange}
                style={{ padding: "10px" }}
              />

              <textarea
                name="notes"
                placeholder="Transfer Notes"
                value={transferForm.notes}
                onChange={handleTransferChange}
                style={{
                  padding: "10px",
                  minHeight: "90px",
                  gridColumn: "span 2",
                }}
              />
            </div>

            <button
              onClick={addTransfer}
              style={{
                marginTop: "20px",
                backgroundColor: "#16a34a",
                color: "white",
                border: "none",
                padding: "10px 16px",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Save Transfer
            </button>
          </div>

          <div style={cardStyle}>
            <h2>Account Transactions</h2>

            <table border="1" cellPadding="10" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>Transaction Number</th>
                  <th>Account Number</th>
                  <th>Account Name</th>
                  <th>Transaction Type</th>
                  <th>Amount</th>
                  <th>Reference</th>
                  <th>Notes</th>
                  <th>Transaction Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length > 0 ? (
                  transactions.map((transaction) => (
                    <tr key={transaction._id}>
                      <td>{transaction.transactionNumber}</td>
                      <td>{transaction.accountNumber}</td>
                      <td>{transaction.accountName}</td>
                      <td>{transaction.transactionType}</td>
                      <td>{formatCurrency(transaction.amount)}</td>
                      <td>{transaction.reference}</td>
                      <td>{transaction.notes}</td>
                      <td>{formatDate(transaction.transactionDate)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8">No account transactions found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default Finance;