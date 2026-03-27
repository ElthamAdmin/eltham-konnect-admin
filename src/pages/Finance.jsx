import { useEffect, useMemo, useState } from "react";
import api from "../api";

function Finance() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [invoices, setInvoices] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [payroll, setPayroll] = useState([]);
  const [summary, setSummary] = useState(null);
  const [reports, setReports] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [expenseReceipt, setExpenseReceipt] = useState(null);

  const [expensePagination, setExpensePagination] = useState({
    page: 1,
    limit: 10,
    pages: 1,
    total: 0,
  });

  const [payrollPagination, setPayrollPagination] = useState({
    page: 1,
    limit: 10,
    pages: 1,
    total: 0,
  });

  const [transactionPagination, setTransactionPagination] = useState({
    page: 1,
    limit: 10,
    pages: 1,
    total: 0,
  });

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

  const ROYAL_BLUE = "#0B3D91";
  const GOLD = "#D4AF37";
  const WHITE = "#FFFFFF";
  const LIGHT_BG = "#f4f7fb";
  const BORDER = "#dbe3ef";
  const MUTED = "#64748b";

  const EXPENSE_CATEGORIES = [
    "Rent",
    "Fuel",
    "Customs Clearance",
    "Marketing",
    "Supplies",
    "Maintenance",
    "Utilities",
    "Internet",
    "Phone",
    "Delivery Expense",
    "Staff Refreshment",
    "Office Expense",
    "Bank Charges",
    "Insurance",
    "Other",
  ];

  const fetchStaticFinanceData = async () => {
    try {
      const [
        invoicesRes,
        summaryRes,
        reportsRes,
        accountsRes,
      ] = await Promise.all([
        api.get("/api/invoices"),
        api.get("/api/finance/summary"),
        api.get("/api/finance/reports"),
        api.get("/api/financial-accounts"),
      ]);

      setInvoices(invoicesRes.data.data || []);
      setSummary(summaryRes.data.data || null);
      setReports(reportsRes.data.data || null);
      setAccounts(accountsRes.data.data || []);
    } catch (error) {
      console.error("Error loading finance summary data:", error);
      alert(
        error?.response?.data?.message ||
          error?.message ||
          "Could not load finance data."
      );
    }
  };

  const fetchExpenses = async (page = expensePagination.page, limit = expensePagination.limit) => {
    try {
      const res = await api.get(`/api/finance/expenses?page=${page}&limit=${limit}`);
      setExpenses(res.data.data || []);
      setExpensePagination((prev) => ({
        ...prev,
        ...(res.data.pagination || prev),
      }));
    } catch (error) {
      console.error("Error loading expenses:", error);
      alert(error?.response?.data?.message || "Could not load expenses.");
    }
  };

  const fetchPayroll = async (page = payrollPagination.page, limit = payrollPagination.limit) => {
    try {
      const res = await api.get(`/api/finance/payroll?page=${page}&limit=${limit}`);
      setPayroll(res.data.data || []);
      setPayrollPagination((prev) => ({
        ...prev,
        ...(res.data.pagination || prev),
      }));
    } catch (error) {
      console.error("Error loading payroll:", error);
      alert(error?.response?.data?.message || "Could not load payroll.");
    }
  };

  const fetchTransactions = async (
    page = transactionPagination.page,
    limit = transactionPagination.limit
  ) => {
    try {
      const res = await api.get(`/api/account-transactions?page=${page}&limit=${limit}`);
      setTransactions(res.data.data || []);
      setTransactionPagination((prev) => ({
        ...prev,
        ...(res.data.pagination || prev),
      }));
    } catch (error) {
      console.error("Error loading transactions:", error);
      alert(error?.response?.data?.message || "Could not load transactions.");
    }
  };

  const fetchFinanceData = async () => {
    await Promise.all([
      fetchStaticFinanceData(),
      fetchExpenses(expensePagination.page, expensePagination.limit),
      fetchPayroll(payrollPagination.page, payrollPagination.limit),
      fetchTransactions(transactionPagination.page, transactionPagination.limit),
    ]);
  };

  useEffect(() => {
    fetchFinanceData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    backgroundColor: WHITE,
    borderRadius: "14px",
    padding: "20px",
    border: `1px solid ${BORDER}`,
    boxShadow: "0 4px 14px rgba(15,23,42,0.05)",
  };

  const metricCardStyle = {
    backgroundColor: WHITE,
    borderRadius: "16px",
    padding: "22px",
    border: `1px solid ${BORDER}`,
    boxShadow: "0 6px 18px rgba(15,23,42,0.05)",
    minHeight: "125px",
  };

  const tabButtonStyle = (tabName) => ({
    backgroundColor: activeTab === tabName ? ROYAL_BLUE : WHITE,
    color: activeTab === tabName ? WHITE : "#1f2937",
    border: `1px solid ${activeTab === tabName ? ROYAL_BLUE : "#cbd5e1"}`,
    padding: "11px 18px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
    boxShadow: activeTab === tabName ? "0 6px 16px rgba(11,61,145,0.2)" : "none",
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
          padding: "5px 10px",
          borderRadius: "999px",
          color: "white",
          backgroundColor,
          fontWeight: "bold",
          fontSize: "12px",
          display: "inline-block",
          whiteSpace: "nowrap",
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

      const payload = new FormData();
      payload.append("date", expenseForm.date);
      payload.append("category", expenseForm.category);
      payload.append("description", expenseForm.description);
      payload.append("amount", expenseForm.amount);
      payload.append("status", expenseForm.status);
      payload.append("paidFromAccountNumber", expenseForm.paidFromAccountNumber);

      if (expenseReceipt) {
        payload.append("receipt", expenseReceipt);
      }

      const res = await api.post("/api/finance/expenses", payload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      alert(res.data.message);

      setExpenseForm({
        date: "",
        category: "",
        description: "",
        amount: "",
        status: "Paid",
        paidFromAccountNumber: "",
      });

      setExpenseReceipt(null);

      const fileInput = document.getElementById("expense-receipt-input");
      if (fileInput) fileInput.value = "";

      await fetchStaticFinanceData();
      await fetchExpenses(1, expensePagination.limit);
      setExpensePagination((prev) => ({ ...prev, page: 1 }));
      await fetchTransactions(transactionPagination.page, transactionPagination.limit);
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

      const res = await api.post("/api/finance/payroll", payrollForm);

      alert(res.data.message);

      setPayrollForm({
        employeeName: "",
        role: "",
        payPeriod: "",
        grossPay: "",
        deductions: "",
        status: "Pending",
      });

      await fetchStaticFinanceData();
      await fetchPayroll(1, payrollPagination.limit);
      setPayrollPagination((prev) => ({ ...prev, page: 1 }));
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

      const res = await api.post("/api/financial-accounts", payload);

      alert(res.data.message);

      setAccountForm({
        accountName: "",
        accountType: "Bank",
        bankName: "",
        openingBalance: "",
      });

      await fetchStaticFinanceData();
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

      const res = await api.post("/api/account-transactions", payload);

      alert(res.data.message);

      setTransactionForm({
        accountNumber: "",
        transactionType: "Deposit",
        amount: "",
        reference: "",
        notes: "",
      });

      await fetchStaticFinanceData();
      await fetchTransactions(1, transactionPagination.limit);
      setTransactionPagination((prev) => ({ ...prev, page: 1 }));
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

      const res = await api.post("/api/account-transactions/transfer", payload);

      alert(res.data.message);

      setTransferForm({
        fromAccountNumber: "",
        toAccountNumber: "",
        amount: "",
        reference: "",
        notes: "",
      });

      await fetchStaticFinanceData();
      await fetchTransactions(1, transactionPagination.limit);
      setTransactionPagination((prev) => ({ ...prev, page: 1 }));
    } catch (error) {
      console.error("Error creating transfer:", error);
      alert(error?.response?.data?.message || "Could not complete transfer.");
    }
  };

  const totalAccountBalances = useMemo(
    () => accounts.reduce((sum, account) => sum + Number(account.currentBalance || 0), 0),
    [accounts]
  );

  const renderPagination = ({ page, pages, limit, total }, onPageChange, onLimitChange) => (
    <div
      style={{
        backgroundColor: WHITE,
        border: `1px solid ${BORDER}`,
        borderRadius: "10px",
        padding: "12px 15px",
        marginBottom: "15px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "12px",
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
        <strong style={{ color: "#1e293b" }}>
          Total Records: {total}
        </strong>

        <select
          value={limit}
          onChange={(e) => onLimitChange(Number(e.target.value))}
          style={{
            padding: "8px 10px",
            borderRadius: "8px",
            border: `1px solid ${BORDER}`,
            backgroundColor: WHITE,
          }}
        >
          <option value={10}>10 per page</option>
          <option value={25}>25 per page</option>
          <option value={50}>50 per page</option>
          <option value={100}>100 per page</option>
        </select>
      </div>

      <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
        <button
          onClick={() => onPageChange(Math.max(page - 1, 1))}
          disabled={page <= 1}
          style={{
            backgroundColor: page <= 1 ? "#cbd5e1" : ROYAL_BLUE,
            color: WHITE,
            border: "none",
            padding: "8px 12px",
            borderRadius: "8px",
            cursor: page <= 1 ? "not-allowed" : "pointer",
            fontWeight: "bold",
          }}
        >
          Previous
        </button>

        <span style={{ fontWeight: "bold", color: "#334155" }}>
          Page {page} of {pages || 1}
        </span>

        <button
          onClick={() => onPageChange(Math.min(page + 1, pages || 1))}
          disabled={page >= (pages || 1)}
          style={{
            backgroundColor: page >= (pages || 1) ? "#cbd5e1" : ROYAL_BLUE,
            color: WHITE,
            border: "none",
            padding: "8px 12px",
            borderRadius: "8px",
            cursor: page >= (pages || 1) ? "not-allowed" : "pointer",
            fontWeight: "bold",
          }}
        >
          Next
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ backgroundColor: LIGHT_BG, minHeight: "100vh" }}>
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ margin: 0, color: "#0f172a" }}>Finance Dashboard</h1>
        <p style={{ margin: "6px 0 0 0", color: MUTED }}>
          Manage revenue, expenses, payroll, reports, accounts, and transactions.
        </p>
      </div>

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
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "20px",
              marginBottom: "24px",
            }}
          >
            <div style={metricCardStyle}>
              <div style={{ fontSize: "32px", fontWeight: "bold", color: ROYAL_BLUE, marginBottom: "8px" }}>
                {formatCurrency(summary?.totalRevenue)}
              </div>
              <div style={{ color: "#334155", fontWeight: "bold" }}>Total Revenue</div>
            </div>

            <div style={metricCardStyle}>
              <div style={{ fontSize: "32px", fontWeight: "bold", color: "#16a34a", marginBottom: "8px" }}>
                {summary?.paidInvoices || 0}
              </div>
              <div style={{ color: "#334155", fontWeight: "bold" }}>Paid Invoices</div>
            </div>

            <div style={metricCardStyle}>
              <div style={{ fontSize: "32px", fontWeight: "bold", color: "#dc2626", marginBottom: "8px" }}>
                {summary?.unpaidInvoices || 0}
              </div>
              <div style={{ color: "#334155", fontWeight: "bold" }}>Unpaid Invoices</div>
            </div>

            <div style={metricCardStyle}>
              <div style={{ fontSize: "32px", fontWeight: "bold", color: GOLD, marginBottom: "8px" }}>
                {formatCurrency(summary?.outstandingRevenue)}
              </div>
              <div style={{ color: "#334155", fontWeight: "bold" }}>Outstanding Revenue</div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "20px",
              marginBottom: "30px",
            }}
          >
            <div style={metricCardStyle}>
              <div style={{ fontSize: "32px", fontWeight: "bold", color: "#f97316", marginBottom: "8px" }}>
                {formatCurrency(summary?.totalExpenses)}
              </div>
              <div style={{ color: "#334155", fontWeight: "bold" }}>Total Expenses</div>
            </div>

            <div style={metricCardStyle}>
              <div style={{ fontSize: "32px", fontWeight: "bold", color: "#7c3aed", marginBottom: "8px" }}>
                {formatCurrency(summary?.totalPayroll)}
              </div>
              <div style={{ color: "#334155", fontWeight: "bold" }}>Total Payroll</div>
            </div>

            <div style={metricCardStyle}>
              <div
                style={{
                  fontSize: "32px",
                  fontWeight: "bold",
                  color: Number(summary?.netPosition || 0) >= 0 ? "#16a34a" : "#dc2626",
                  marginBottom: "8px",
                }}
              >
                {formatCurrency(summary?.netPosition)}
              </div>
              <div style={{ color: "#334155", fontWeight: "bold" }}>Net Position</div>
            </div>

            <div style={metricCardStyle}>
              <div style={{ fontSize: "32px", fontWeight: "bold", color: "#0f172a", marginBottom: "8px" }}>
                {formatCurrency(totalAccountBalances)}
              </div>
              <div style={{ color: "#334155", fontWeight: "bold" }}>Total Account Balances</div>
            </div>
          </div>
        </>
      )}

      {activeTab === "expenses" && (
        <>
          <div style={{ ...cardStyle, marginBottom: "24px" }}>
            <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>Add Expense</h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
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

              <select
                name="category"
                value={expenseForm.category}
                onChange={handleExpenseChange}
                style={{ padding: "10px" }}
              >
                <option value="">Select Category</option>
                {EXPENSE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

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

              <input
                id="expense-receipt-input"
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.pdf"
                onChange={(e) => setExpenseReceipt(e.target.files[0] || null)}
                style={{ padding: "10px", gridColumn: "span 2" }}
              />
            </div>

            <button
              onClick={addExpense}
              style={{
                marginTop: "20px",
                backgroundColor: ROYAL_BLUE,
                color: WHITE,
                border: "none",
                padding: "10px 16px",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              Save Expense
            </button>
          </div>

          {renderPagination(
            expensePagination,
            async (page) => {
              setExpensePagination((prev) => ({ ...prev, page }));
              await fetchExpenses(page, expensePagination.limit);
            },
            async (limit) => {
              setExpensePagination((prev) => ({ ...prev, limit, page: 1 }));
              await fetchExpenses(1, limit);
            }
          )}

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>Expense Records</h2>
            <div style={{ overflowX: "auto" }}>
              <table border="1" cellPadding="10" style={{ minWidth: "1100px", width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ backgroundColor: "#eef4ff" }}>
                  <tr>
                    <th>Expense Number</th>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Paid From Account</th>
                    <th>Status</th>
                    <th>Receipt</th>
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
                        <td>
                          {expense.receiptUrl ? (
                            <a
                              href={`${api.defaults.baseURL}${expense.receiptUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: ROYAL_BLUE, fontWeight: "bold" }}
                            >
                              View Receipt
                            </a>
                          ) : (
                            "No File"
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8">No expense records found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === "payroll" && (
        <>
          <div style={{ ...cardStyle, marginBottom: "24px" }}>
            <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>Add Payroll Record</h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
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
                backgroundColor: ROYAL_BLUE,
                color: WHITE,
                border: "none",
                padding: "10px 16px",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              Save Payroll Record
            </button>
          </div>

          {renderPagination(
            payrollPagination,
            async (page) => {
              setPayrollPagination((prev) => ({ ...prev, page }));
              await fetchPayroll(page, payrollPagination.limit);
            },
            async (limit) => {
              setPayrollPagination((prev) => ({ ...prev, limit, page: 1 }));
              await fetchPayroll(1, limit);
            }
          )}

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>Payroll Records</h2>
            <div style={{ overflowX: "auto" }}>
              <table border="1" cellPadding="10" style={{ minWidth: "1000px", width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ backgroundColor: "#eef4ff" }}>
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
          </div>
        </>
      )}

      {activeTab === "reports" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px" }}>
          <div style={cardStyle}>
            <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>Profit and Loss Statement</h2>
            <table border="1" cellPadding="12" style={{ width: "100%", borderCollapse: "collapse" }}>
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
            <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>Cash Flow Statement</h2>
            <table border="1" cellPadding="12" style={{ width: "100%", borderCollapse: "collapse" }}>
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
            <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>Balance Sheet</h2>
            <table border="1" cellPadding="12" style={{ width: "100%", borderCollapse: "collapse" }}>
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
            <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>Create Financial Account</h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
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
                backgroundColor: ROYAL_BLUE,
                color: WHITE,
                border: "none",
                padding: "10px 16px",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              Save Account
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "20px",
              marginBottom: "24px",
            }}
          >
            <div style={metricCardStyle}>
              <div style={{ fontSize: "32px", fontWeight: "bold", color: ROYAL_BLUE, marginBottom: "8px" }}>
                {accounts.length}
              </div>
              <div style={{ color: "#334155", fontWeight: "bold" }}>Total Accounts</div>
            </div>

            <div style={metricCardStyle}>
              <div style={{ fontSize: "32px", fontWeight: "bold", color: "#16a34a", marginBottom: "8px" }}>
                {accounts.filter((a) => a.accountType === "Bank").length}
              </div>
              <div style={{ color: "#334155", fontWeight: "bold" }}>Bank Accounts</div>
            </div>

            <div style={metricCardStyle}>
              <div style={{ fontSize: "32px", fontWeight: "bold", color: GOLD, marginBottom: "8px" }}>
                {accounts.filter((a) => a.accountType === "Cash").length}
              </div>
              <div style={{ color: "#334155", fontWeight: "bold" }}>Cash Accounts</div>
            </div>

            <div style={metricCardStyle}>
              <div style={{ fontSize: "32px", fontWeight: "bold", color: "#dc2626", marginBottom: "8px" }}>
                {accounts.filter((a) => a.accountType === "Credit Card").length}
              </div>
              <div style={{ color: "#334155", fontWeight: "bold" }}>Credit Card Accounts</div>
            </div>
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>Financial Accounts</h2>
            <div style={{ overflowX: "auto" }}>
              <table border="1" cellPadding="10" style={{ minWidth: "1100px", width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ backgroundColor: "#eef4ff" }}>
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
          </div>
        </>
      )}

      {activeTab === "transactions" && (
        <>
          <div style={{ ...cardStyle, marginBottom: "24px" }}>
            <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>Record Account Transaction</h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
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
                backgroundColor: ROYAL_BLUE,
                color: WHITE,
                border: "none",
                padding: "10px 16px",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              Save Transaction
            </button>

            <h2 style={{ color: ROYAL_BLUE }}>Transfer Between Accounts</h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
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
                color: WHITE,
                border: "none",
                padding: "10px 16px",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              Save Transfer
            </button>
          </div>

          {renderPagination(
            transactionPagination,
            async (page) => {
              setTransactionPagination((prev) => ({ ...prev, page }));
              await fetchTransactions(page, transactionPagination.limit);
            },
            async (limit) => {
              setTransactionPagination((prev) => ({ ...prev, limit, page: 1 }));
              await fetchTransactions(1, limit);
            }
          )}

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>Account Transactions</h2>
            <div style={{ overflowX: "auto" }}>
              <table border="1" cellPadding="10" style={{ minWidth: "1200px", width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ backgroundColor: "#eef4ff" }}>
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
          </div>
        </>
      )}
    </div>
  );
}

export default Finance;