import { useEffect, useMemo, useState } from "react";
import api from "../api";
import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
function Finance() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [invoices, setInvoices] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [payroll, setPayroll] = useState([]);
  const [hrEmployees, setHrEmployees] = useState([]);
  const [summary, setSummary] = useState(null);
  const [reports, setReports] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [monthlyChart, setMonthlyChart] = useState([]);
  const [summaryFilter, setSummaryFilter] = useState("today");
  const [summaryBranch, setSummaryBranch] = useState("");
  const [isEditingAccount, setIsEditingAccount] = useState(false);
  const [editingAccountNumber, setEditingAccountNumber] = useState("");
  const [expenseReceipt, setExpenseReceipt] = useState(null);
  const [payrollAttendanceSummary, setPayrollAttendanceSummary] = useState({
  totalDays: 0,
  totalWorkedMinutes: 0,
  totalLunchMinutes: 0,
  totalWorkedLabel: "0h 0m",
  totalLunchLabel: "0h 0m",
});
const [payrollAttendanceLoading, setPayrollAttendanceLoading] = useState(false);
  const [reportFilters, setReportFilters] = useState({
  from: "",
  to: "",
  
});

const downloadSingleReportPdf = (reportType) => {
  try {
    const doc = new jsPDF("p", "mm", "a4");

    const generatedAt = reports?.reportMeta?.generatedAt
      ? formatDate(reports.reportMeta.generatedAt)
      : formatDate(new Date());

    const fromText = reportFilters?.from || "Beginning";
    const toText = reportFilters?.to || "Today";

    doc.setFontSize(18);
    doc.text("Eltham Konnect", 14, 16);

    doc.setFontSize(13);
    doc.text(reportType, 14, 24);

    doc.setFontSize(10);
    doc.text(`Period: ${fromText} to ${toText}`, 14, 30);
    doc.text(`Generated: ${generatedAt}`, 14, 35);

    if (reportType === "Profit and Loss") {
      autoTable(doc, {
        startY: 42,
        head: [["Profit and Loss", "Amount"]],
        body: [
          ["Revenue", formatCurrency(reports?.profitAndLoss?.revenue)],
          ["Operating Expenses", formatCurrency(reports?.profitAndLoss?.operatingExpenses)],
          ["Payroll Expense", formatCurrency(reports?.profitAndLoss?.payrollExpense)],
          ["Total Expenses", formatCurrency(reports?.profitAndLoss?.totalExpenses)],
          ["Net Profit / Loss", formatCurrency(reports?.profitAndLoss?.netProfit)],
        ],
        styles: { fontSize: 10 },
        headStyles: { fillColor: [11, 61, 145] },
      });
    }

    if (reportType === "Cash Flow") {
      autoTable(doc, {
        startY: 42,
        head: [["Cash Flow", "Amount"]],
        body: [
          ["Collected Revenue", formatCurrency(reports?.cashFlow?.collectedRevenue)],
          ["Operating Expense Payments", formatCurrency(reports?.cashFlow?.operatingExpensePayments)],
          ["Payroll Payments", formatCurrency(reports?.cashFlow?.payrollPayments)],
          ["Total Cash Outflows", formatCurrency(reports?.cashFlow?.totalCashOutflows)],
          ["Net Cash Flow", formatCurrency(reports?.cashFlow?.netCashFlow)],
        ],
        styles: { fontSize: 10 },
        headStyles: { fillColor: [11, 61, 145] },
      });
    }

    if (reportType === "Balance Sheet") {
      autoTable(doc, {
        startY: 42,
        head: [["Balance Sheet", "Amount"]],
        body: [
          ["Cash On Hand", formatCurrency(reports?.balanceSheet?.assets?.cashOnHand)],
          ["Accounts Receivable", formatCurrency(reports?.balanceSheet?.assets?.accountsReceivable)],
          ["Total Assets", formatCurrency(reports?.balanceSheet?.assets?.totalAssets)],
          ["Total Liabilities", formatCurrency(reports?.balanceSheet?.liabilities?.totalLiabilities)],
          ["Owner's Equity", formatCurrency(reports?.balanceSheet?.equity?.ownerEquity)],
        ],
        styles: { fontSize: 10 },
        headStyles: { fillColor: [11, 61, 145] },
      });
    }

    if (reportType === "Statutory Deductions") {
      const statutoryRows =
        reports?.statutoryByEmployee?.length > 0
          ? reports.statutoryByEmployee.map((item) => [
              item.employeeId || "-",
              item.employeeName || "-",
              formatCurrency(item.nisEmployee),
              formatCurrency(item.nhtEmployee),
              formatCurrency(item.educationTax),
              formatCurrency(item.incomeTax),
              formatCurrency(item.pensionEmployee),
              formatCurrency(item.totalDeductions),
            ])
          : [["-", "No statutory deduction data found for this period.", "", "", "", "", "", ""]];

      autoTable(doc, {
        startY: 42,
        head: [[
          "Employee ID",
          "Employee Name",
          "NIS",
          "NHT",
          "Education Tax",
          "Income Tax",
          "Pension",
          "Total Deductions",
        ]],
        body: statutoryRows,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [11, 61, 145] },
      });
    }

    if (reportType === "Expense Category Breakdown") {
      const expenseRows =
        reports?.expenseByCategory?.length > 0
          ? reports.expenseByCategory.map((item) => [
              item.category,
              formatCurrency(item.amount),
            ])
          : [["No expense data found for this period.", ""]];

      autoTable(doc, {
        startY: 42,
        head: [["Expense Category Breakdown", "Amount"]],
        body: expenseRows,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [11, 61, 145] },
      });
    }

    if (reportType === "Monthly Trend") {
      const monthlyRows =
        reports?.monthlyTrend?.length > 0
          ? reports.monthlyTrend.map((item) => [
              item.label || item.month,
              formatCurrency(item.revenue),
              formatCurrency(item.expenses),
              formatCurrency(item.payroll),
              formatCurrency(item.net),
            ])
          : [["No monthly trend data found for this period.", "", "", "", ""]];

      autoTable(doc, {
        startY: 42,
        head: [["Monthly Trend", "Revenue", "Operating Expenses", "Payroll", "Net"]],
        body: monthlyRows,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [11, 61, 145] },
      });
    }

    doc.save(`eltham-konnect-${reportType.toLowerCase().replace(/\s+/g, "-")}-${generatedAt}.pdf`);
  } catch (error) {
    console.error("Error generating PDF:", error);
    alert("Could not download PDF report.");
  }
};

const generatePayslipPdf = (item) => {
  try {
    const doc = new jsPDF("p", "mm", "a4");

    const generatedDate = formatDate(new Date());

    doc.setFontSize(18);
    doc.text("Eltham Konnect", 14, 16);

    doc.setFontSize(13);
    doc.text("Employee Payslip", 14, 24);

    doc.setFontSize(10);
    doc.text(`Generated: ${generatedDate}`, 14, 30);
    doc.text(`Payroll Number: ${item.payrollNumber || "-"}`, 14, 35);

    autoTable(doc, {
      startY: 42,
      head: [["Employee Details", "Value"]],
      body: [
        ["Employee ID", item.employeeId || "-"],
        ["Employee Name", item.employeeName || "-"],
        ["Role", item.role || "-"],
        ["Pay Period", item.payPeriod || "-"],
        ["Status", item.status || "-"],
      ],
      styles: { fontSize: 10 },
      headStyles: { fillColor: [11, 61, 145] },
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 8,
      head: [["Earnings", "Amount"]],
      body: [["Gross Pay", formatCurrency(item.grossPay)]],
      styles: { fontSize: 10 },
      headStyles: { fillColor: [11, 61, 145] },
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 8,
      head: [["Deductions", "Amount"]],
      body: [
        ["NIS", formatCurrency(item.nisEmployee)],
        ["NHT", formatCurrency(item.nhtEmployee)],
        ["Education Tax", formatCurrency(item.educationTax)],
        ["Income Tax", formatCurrency(item.incomeTax)],
        ["Pension", formatCurrency(item.pensionEmployee)],
        [
          "Total Deductions",
          formatCurrency(
            item.totalDeductions !== undefined
              ? item.totalDeductions
              : item.deductions
          ),
        ],
      ],
      styles: { fontSize: 10 },
      headStyles: { fillColor: [11, 61, 145] },
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 8,
      head: [["Net Pay Summary", "Amount"]],
      body: [["Net Pay", formatCurrency(item.netPay)]],
      styles: { fontSize: 11, fontStyle: "bold" },
      headStyles: { fillColor: [22, 163, 74] },
    });

    const safeEmployeeName = String(item.employeeName || "employee").replace(/\s+/g, "-");
const safePayPeriod = String(item.payPeriod || "period").replace(/\s+/g, "-");

doc.save(`payslip-${safeEmployeeName}-${safePayPeriod}.pdf`);
  } catch (error) {
    console.error("Error generating payslip PDF:", error);
    alert("Could not generate payslip PDF.");
  }
};
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
    employeeId: "",
    employeeName: "",
    role: "",
    payPeriod: "",
    grossPay: "",
    deductions: "",
    status: "Pending",
    autoCalculateStatutoryDeductions: true,
    nisEmployee: "",
    nhtEmployee: "",
    educationTax: "",
    incomeTax: "",
    pensionEmployee: "",
    paidFromAccountNumber: "",
  });

  const [accountForm, setAccountForm] = useState({
  accountName: "",
  accountType: "Bank",
  bankName: "",
  openingBalance: "",
  currentBalance: "",
  currency: "JMD",
  exchangeRate: 1,
  status: "Active",
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
    "KP Package Invoice",
"OX Package Invoice",
"KP Pickup Fee",
"OX Pickup Fee",
"LTW Software Subscription",
"KP Software Subscription",
  "LTW Package Invoice",
  "LTW Pickup Fee",
  "Customs / Clearance Expense",
  "Delivery Expense",
  "Fuel",
  "Vehicle Maintenance",
  "Rent",
  "Light Bill",
  "Internet",
  "Phone Credit",
  "Utilities",
  "Wages / Salary",
  "Staff Treat",
  "Office Expense",
  "Packaging Supplies",
  "Printing / Stationery",
  "Bank Charges",
  "Fygaro Fees",
  "Render Subscription",
  "Vercel Subscription",
  "Cloudinary Subscription",
  "Amazon Prime",
  "Software Subscription",
  "Marketing",
  "Maintenance",
  "Cleaning Supplies",
  "Repairs",
  "Miscellaneous",
];

  const roundMoney = (value) =>
    Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

  const JAMAICA_NIS_EMPLOYEE_RATE = 0.025;
  const JAMAICA_NHT_EMPLOYEE_RATE = 0.02;
  const JAMAICA_EDUCATION_TAX_RATE = 0.0225;
  const JAMAICA_INCOME_TAX_RATE = 0.25;
  const JAMAICA_ANNUAL_PIT_THRESHOLD = 2003496;
  const JAMAICA_MONTHLY_PIT_THRESHOLD = JAMAICA_ANNUAL_PIT_THRESHOLD / 12;
  const JAMAICA_NIS_ANNUAL_WAGE_CEILING = 5000000;
  const JAMAICA_NIS_MONTHLY_WAGE_CEILING =
    JAMAICA_NIS_ANNUAL_WAGE_CEILING / 12;

  const calculatePayrollPreview = useMemo(() => {
    const gross = roundMoney(payrollForm.grossPay);
    const pension = roundMoney(payrollForm.pensionEmployee);

    if (!gross || gross <= 0) {
      return {
        nisEmployee: 0,
        nhtEmployee: 0,
        educationTax: 0,
        incomeTax: 0,
        pensionEmployee: 0,
        totalDeductions: 0,
        netPay: 0,
      };
    }

    if (!payrollForm.autoCalculateStatutoryDeductions) {
      const nisEmployee = roundMoney(payrollForm.nisEmployee);
      const nhtEmployee = roundMoney(payrollForm.nhtEmployee);
      const educationTax = roundMoney(payrollForm.educationTax);
      const incomeTax = roundMoney(payrollForm.incomeTax);
      const pensionEmployeeManual = roundMoney(payrollForm.pensionEmployee);

      const totalDeductions = roundMoney(
        nisEmployee +
          nhtEmployee +
          educationTax +
          incomeTax +
          pensionEmployeeManual
      );

      return {
        nisEmployee,
        nhtEmployee,
        educationTax,
        incomeTax,
        pensionEmployee: pensionEmployeeManual,
        totalDeductions,
        netPay: roundMoney(gross - totalDeductions),
      };
    }

    const nisBase = Math.min(gross, JAMAICA_NIS_MONTHLY_WAGE_CEILING);
    const nisEmployee = roundMoney(nisBase * JAMAICA_NIS_EMPLOYEE_RATE);
    const nhtEmployee = roundMoney(gross * JAMAICA_NHT_EMPLOYEE_RATE);
    const educationTax = roundMoney(gross * JAMAICA_EDUCATION_TAX_RATE);

    const taxableIncome = Math.max(0, roundMoney(gross - pension));
    const taxableOverThreshold = Math.max(
      0,
      roundMoney(taxableIncome - JAMAICA_MONTHLY_PIT_THRESHOLD)
    );
    const incomeTax = roundMoney(
      taxableOverThreshold * JAMAICA_INCOME_TAX_RATE
    );

    const totalDeductions = roundMoney(
      nisEmployee + nhtEmployee + educationTax + incomeTax + pension
    );

    return {
      nisEmployee,
      nhtEmployee,
      educationTax,
      incomeTax,
      pensionEmployee: pension,
      totalDeductions,
      netPay: roundMoney(gross - totalDeductions),
    };
  }, [payrollForm]);
const fetchReports = async (from = reportFilters.from, to = reportFilters.to) => {
  try {
    const params = new URLSearchParams();

    if (from) params.append("from", from);
    if (to) params.append("to", to);

    const query = params.toString() ? `?${params.toString()}` : "";
    const res = await api.get(`/api/finance/reports${query}`);

    setReports(res.data.data || null);
  } catch (error) {
    console.error("Error loading reports:", error);
    alert(error?.response?.data?.message || "Could not load financial reports.");
  }
};

const fetchMonthlyChart = async () => {
  try {
    const res = await api.get("/api/finance/monthly-chart");
    setMonthlyChart(res.data.data || []);
  } catch (error) {
    console.error("Error loading monthly chart:", error);
  }
};

const getSummaryQuery = () => {
  const params = new URLSearchParams();

  params.append("filter", summaryFilter);

  if (summaryBranch) {
    params.append("branch", summaryBranch);
  }

  return params.toString();
};

  const fetchStaticFinanceData = async () => {
  try {
    const [invoicesRes, summaryRes, accountsRes, hrEmployeesRes] =
      await Promise.all([
        api.get("/api/invoices"),
        api.get(`/api/finance/summary?${getSummaryQuery()}`),
        api.get("/api/financial-accounts"),
        api.get("/api/hr"),
      ]);

    setInvoices(invoicesRes.data.data || []);
    setSummary(summaryRes.data.data || null);
    setAccounts(accountsRes.data.data || []);
    setHrEmployees(hrEmployeesRes.data.data || []);
  } catch (error) {
    console.error("Error loading finance summary data:", error);
    alert(
      error?.response?.data?.message ||
        error?.message ||
        "Could not load finance data."
    );
  }
};

  const fetchExpenses = async (
    page = expensePagination.page,
    limit = expensePagination.limit
  ) => {
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

  const fetchPayroll = async (
    page = payrollPagination.page,
    limit = payrollPagination.limit
  ) => {
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

  const fetchPayrollAttendanceSummary = async (employeeId, payPeriod) => {
  try {
    if (!employeeId || !payPeriod) {
      setPayrollAttendanceSummary({
        totalDays: 0,
        totalWorkedMinutes: 0,
        totalLunchMinutes: 0,
        totalWorkedLabel: "0h 0m",
        totalLunchLabel: "0h 0m",
      });
      return;
    }

    const selectedEmployee = hrEmployees.find(
      (employee) => employee.employeeId === employeeId
    );

    const linkedUserId = selectedEmployee?.linkedUserId || "";

    if (!linkedUserId) {
      setPayrollAttendanceSummary({
        totalDays: 0,
        totalWorkedMinutes: 0,
        totalLunchMinutes: 0,
        totalWorkedLabel: "0h 0m",
        totalLunchLabel: "0h 0m",
      });
      return;
    }

    const { startDate, endDate } = getMonthDateRange(payPeriod);

    setPayrollAttendanceLoading(true);

    const res = await api.get(
      `/api/auth/attendance-history?filter=custom&userId=${encodeURIComponent(
        linkedUserId
      )}&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(
        endDate
      )}`
    );

    const summaryRows = res.data?.data?.summary || [];

    if (summaryRows.length > 0) {
      setPayrollAttendanceSummary(summaryRows[0]);
    } else {
      setPayrollAttendanceSummary({
        totalDays: 0,
        totalWorkedMinutes: 0,
        totalLunchMinutes: 0,
        totalWorkedLabel: "0h 0m",
        totalLunchLabel: "0h 0m",
      });
    }
  } catch (error) {
    console.error("Error loading payroll attendance summary:", error);
    setPayrollAttendanceSummary({
      totalDays: 0,
      totalWorkedMinutes: 0,
      totalLunchMinutes: 0,
      totalWorkedLabel: "0h 0m",
      totalLunchLabel: "0h 0m",
    });
  } finally {
    setPayrollAttendanceLoading(false);
  }
};

  const fetchTransactions = async (
    page = transactionPagination.page,
    limit = transactionPagination.limit
  ) => {
    try {
      const res = await api.get(
        `/api/account-transactions?page=${page}&limit=${limit}`
      );
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
    fetchReports(),
    fetchMonthlyChart(),
    fetchExpenses(expensePagination.page, expensePagination.limit),
    fetchPayroll(payrollPagination.page, payrollPagination.limit),
    fetchTransactions(transactionPagination.page, transactionPagination.limit),
  ]);
};

  useEffect(() => {
  fetchFinanceData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [summaryFilter, summaryBranch]);

  useEffect(() => {
  if (activeTab !== "payroll") return;

  fetchPayrollAttendanceSummary(payrollForm.employeeId, payrollForm.payPeriod);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [activeTab, payrollForm.employeeId, payrollForm.payPeriod, hrEmployees]);

  const formatCurrency = (value, currency = "JMD") =>
  `${currency} ${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const formatDate = (value) => {
    if (!value) return "";
    try {
      return new Date(value).toISOString().split("T")[0];
    } catch {
      return value;
    }
  };

  const getMonthDateRange = (monthValue) => {
  if (!monthValue) {
    return { startDate: "", endDate: "" };
  }

  const [year, month] = String(monthValue).split("-");
  const startDate = `${year}-${month}-01`;

  const end = new Date(Number(year), Number(month), 0);
  const endDate = `${year}-${month}-${String(end.getDate()).padStart(2, "0")}`;

  return { startDate, endDate };
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

  const miniMetricCardStyle = {
    backgroundColor: "#f8fbff",
    borderRadius: "12px",
    padding: "14px",
    border: `1px solid ${BORDER}`,
  };

  const tabButtonStyle = (tabName) => ({
    backgroundColor: activeTab === tabName ? ROYAL_BLUE : WHITE,
    color: activeTab === tabName ? WHITE : "#1f2937",
    border: `1px solid ${activeTab === tabName ? ROYAL_BLUE : "#cbd5e1"}`,
    padding: "11px 18px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
    boxShadow:
      activeTab === tabName ? "0 6px 16px rgba(11,61,145,0.2)" : "none",
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
      await fetchTransactions(
        transactionPagination.page,
        transactionPagination.limit
      );
    } catch (error) {
      console.error("Error adding expense:", error);
      alert(error?.response?.data?.message || "Could not save expense.");
    }
  };

  const handlePayrollChange = (e) => {
  const { name, value, type, checked } = e.target;

  if (name === "employeeId") {
    const selectedEmployee = hrEmployees.find(
      (employee) => employee.employeeId === value
    );

    setPayrollForm((prev) => ({
      ...prev,
      employeeId: value,
      employeeName: selectedEmployee?.fullName || "",
      role: selectedEmployee?.jobTitle || "",
      grossPay: selectedEmployee?.payRate || "",
    }));
    return;
  }

  setPayrollForm((prev) => ({
    ...prev,
    [name]: type === "checkbox" ? checked : value,
  }));
};

  const addPayroll = async () => {
    try {
      if (
        !payrollForm.employeeName ||
        !payrollForm.role ||
        !payrollForm.payPeriod ||
        !payrollForm.grossPay
      ) {
        alert("Please complete employee name, role, pay period, and gross pay.");
        return;
      }

      const payload = {
  employeeId: payrollForm.employeeId,
  employeeName: payrollForm.employeeName,
  role: payrollForm.role,
  payPeriod: payrollForm.payPeriod,
  grossPay: Number(payrollForm.grossPay || 0),
  status: payrollForm.status,
  autoCalculateStatutoryDeductions:
    payrollForm.autoCalculateStatutoryDeductions,
  paidFromAccountNumber: payrollForm.paidFromAccountNumber,
};

      if (payrollForm.autoCalculateStatutoryDeductions) {
        payload.pensionEmployee = Number(payrollForm.pensionEmployee || 0);
      } else {
        payload.nisEmployee = Number(payrollForm.nisEmployee || 0);
        payload.nhtEmployee = Number(payrollForm.nhtEmployee || 0);
        payload.educationTax = Number(payrollForm.educationTax || 0);
        payload.incomeTax = Number(payrollForm.incomeTax || 0);
        payload.pensionEmployee = Number(payrollForm.pensionEmployee || 0);
      }

      const res = await api.post("/api/finance/payroll", payload);

      alert(res.data.message);

      setPayrollForm({
        employeeId: "",
        employeeName: "",
        role: "",
        payPeriod: "",
        grossPay: "",
        deductions: "",
        status: "Pending",
        autoCalculateStatutoryDeductions: true,
        nisEmployee: "",
        nhtEmployee: "",
        educationTax: "",
        incomeTax: "",
        pensionEmployee: "",
        paidFromAccountNumber: "",
      });

      setPayrollAttendanceSummary({
  totalDays: 0,
  totalWorkedMinutes: 0,
  totalLunchMinutes: 0,
  totalWorkedLabel: "0h 0m",
  totalLunchLabel: "0h 0m",
});

      await fetchStaticFinanceData();
      await fetchPayroll(1, payrollPagination.limit);
      setPayrollPagination((prev) => ({ ...prev, page: 1 }));
      await fetchTransactions(
        transactionPagination.page,
        transactionPagination.limit
      );
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
  currentBalance:
    accountForm.currentBalance !== ""
      ? Number(accountForm.currentBalance || 0)
      : undefined,
};

    const res = isEditingAccount
      ? await api.put(`/api/financial-accounts/${editingAccountNumber}`, payload)
      : await api.post("/api/financial-accounts", payload);

    alert(res.data.message);

    setAccountForm({
  accountName: "",
  accountType: "Bank",
  bankName: "",
  openingBalance: "",
  currentBalance: "",
  currency: "JMD",
  exchangeRate: 1,
  status: "Active",
});

    setEditingAccountNumber("");
    setIsEditingAccount(false);

    await fetchStaticFinanceData();
  } catch (error) {
    console.error("Error saving financial account:", error);
    alert(error?.response?.data?.message || "Could not save account.");
  }
};

  const editAccount = (account) => {
  setAccountForm({
    accountName: account.accountName || "",
    accountType: account.accountType || "Bank",
    bankName: account.bankName || "",
    openingBalance: account.openingBalance ?? "",
    currentBalance: account.currentBalance ?? "",
    currency: account.currency || "JMD",
exchangeRate: account.exchangeRate || 1,
status: account.status || "Active",
  });

  setEditingAccountNumber(account.accountNumber);
  setIsEditingAccount(true);
  setActiveTab("accounts");
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
    () =>
      accounts.reduce(
        (sum, account) => sum + Number(account.currentBalance || 0),
        0
      ),
    [accounts]
  );

  const renderPagination = (
    { page, pages, limit, total },
    onPageChange,
    onLimitChange
  ) => (
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
      <div
        style={{
          display: "flex",
          gap: "10px",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <strong style={{ color: "#1e293b" }}>Total Records: {total}</strong>

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

      <div
        style={{
          display: "flex",
          gap: "8px",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
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
        <button
          style={tabButtonStyle("dashboard")}
          onClick={() => setActiveTab("dashboard")}
        >
          Dashboard
        </button>
        <button
          style={tabButtonStyle("expenses")}
          onClick={() => setActiveTab("expenses")}
        >
          Expenses
        </button>
        <button
          style={tabButtonStyle("payroll")}
          onClick={() => setActiveTab("payroll")}
        >
          Payroll
        </button>
        <button
          style={tabButtonStyle("reports")}
          onClick={() => setActiveTab("reports")}
        >
          Financial Reports
        </button>
        <button
          style={tabButtonStyle("accounts")}
          onClick={() => setActiveTab("accounts")}
        >
          Accounts
        </button>
        <button
          style={tabButtonStyle("transactions")}
          onClick={() => setActiveTab("transactions")}
        >
          Transactions
        </button>
      </div>

      {activeTab === "dashboard" && (
        <>
        <div
  style={{
    ...cardStyle,
    marginBottom: "20px",
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    alignItems: "center",
  }}
>
  <strong style={{ color: ROYAL_BLUE }}>Dashboard Filter:</strong>

  <select
    value={summaryFilter}
    onChange={(e) => setSummaryFilter(e.target.value)}
    style={{
      padding: "10px",
      borderRadius: "8px",
      border: `1px solid ${BORDER}`,
      fontWeight: "bold",
    }}
  >
    <option value="today">Today</option>
    <option value="thisWeek">This Week</option>
    <option value="thisMonth">This Month</option>
    <option value="thisYear">This Year</option>
    <option value="allTime">All Time</option>
  </select>

  <select
    value={summaryBranch}
    onChange={(e) => setSummaryBranch(e.target.value)}
    style={{
      padding: "10px",
      borderRadius: "8px",
      border: `1px solid ${BORDER}`,
      fontWeight: "bold",
      minWidth: "190px",
    }}
  >
    <option value="">All Branches</option>
    <option value="Eltham Park">Eltham Park</option>
    <option value="Browns Town Square">Browns Town Square</option>
  </select>

  <button
    onClick={fetchFinanceData}
    style={{
      backgroundColor: GOLD,
      color: "black",
      border: "none",
      padding: "10px 16px",
      borderRadius: "8px",
      cursor: "pointer",
      fontWeight: "bold",
    }}
  >
    Refresh
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
              <div
                style={{
                  fontSize: "32px",
                  fontWeight: "bold",
                  color: ROYAL_BLUE,
                  marginBottom: "8px",
                }}
              >
                {formatCurrency(summary?.totalRevenue)}
              </div>
              <div style={{ color: "#334155", fontWeight: "bold" }}>
                Total Revenue
              </div>
            </div>

            <div style={metricCardStyle}>
              <div
                style={{
                  fontSize: "32px",
                  fontWeight: "bold",
                  color: "#16a34a",
                  marginBottom: "8px",
                }}
              >
                {summary?.paidInvoices || 0}
              </div>
              <div style={{ color: "#334155", fontWeight: "bold" }}>
                Paid Invoices
              </div>
            </div>

            <div style={metricCardStyle}>
              <div
                style={{
                  fontSize: "32px",
                  fontWeight: "bold",
                  color: "#dc2626",
                  marginBottom: "8px",
                }}
              >
                {summary?.unpaidInvoices || 0}
              </div>
              <div style={{ color: "#334155", fontWeight: "bold" }}>
                Unpaid Invoices
              </div>
            </div>

            <div style={metricCardStyle}>
              <div
                style={{
                  fontSize: "32px",
                  fontWeight: "bold",
                  color: GOLD,
                  marginBottom: "8px",
                }}
              >
                {formatCurrency(summary?.outstandingRevenue)}
              </div>
              <div style={{ color: "#334155", fontWeight: "bold" }}>
                Outstanding Revenue
              </div>
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
              <div
                style={{
                  fontSize: "32px",
                  fontWeight: "bold",
                  color: "#f97316",
                  marginBottom: "8px",
                }}
              >
                {formatCurrency(summary?.totalExpenses)}
              </div>
              <div style={{ color: "#334155", fontWeight: "bold" }}>
                Total Expenses
              </div>
            </div>

            <div style={metricCardStyle}>
              <div
                style={{
                  fontSize: "32px",
                  fontWeight: "bold",
                  color: "#7c3aed",
                  marginBottom: "8px",
                }}
              >
                {formatCurrency(summary?.totalPayroll)}
              </div>
              <div style={{ color: "#334155", fontWeight: "bold" }}>
                Total Payroll
              </div>
            </div>

            <div style={metricCardStyle}>
              <div
                style={{
                  fontSize: "32px",
                  fontWeight: "bold",
                  color:
                    Number(summary?.netPosition || 0) >= 0
                      ? "#16a34a"
                      : "#dc2626",
                  marginBottom: "8px",
                }}
              >
                {formatCurrency(summary?.netPosition)}
              </div>
              <div style={{ color: "#334155", fontWeight: "bold" }}>
                Net Position
              </div>
            </div>

            <div style={metricCardStyle}>
              <div
                style={{
                  fontSize: "32px",
                  fontWeight: "bold",
                  color: "#0f172a",
                  marginBottom: "8px",
                }}
              >
                {formatCurrency(totalAccountBalances)}
              </div>
              <div style={{ color: "#334155", fontWeight: "bold" }}>
                Total Account Balances
              </div>
            </div>
          </div>
          <div style={cardStyle}>
  <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>Monthly Finance Graph</h2>

  <div style={{ width: "100%", height: 380 }}>
    {monthlyChart.length > 0 ? (
      <ResponsiveContainer>
        <BarChart
          data={monthlyChart.map((item) => ({
            ...item,
            monthLabel: item.month,
          }))}
          margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="monthLabel" />
          <YAxis />
          <Tooltip formatter={(value) => formatCurrency(value)} />
          <Legend />
          <Bar dataKey="income" name="Income" fill="#0B3D91" radius={[6, 6, 0, 0]} />
          <Bar dataKey="expenses" name="Expenses" fill="#D4AF37" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    ) : (
      <div
        style={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: MUTED,
          fontWeight: "bold",
        }}
      >
        No monthly chart data found.
      </div>
    )}
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
              <table
                border="1"
                cellPadding="10"
                style={{
                  minWidth: "1100px",
                  width: "100%",
                  borderCollapse: "collapse",
                }}
              >
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
  expense.receiptFileExists ? (
    <a
      href={`${api.defaults.baseURL}${expense.receiptUrl}`}
      target="_blank"
      rel="noopener noreferrer"
      style={{ color: ROYAL_BLUE, fontWeight: "bold" }}
    >
      View Receipt
    </a>
  ) : (
    <span style={{ color: "#dc2626", fontWeight: "bold" }}>Missing Receipt</span>
  )
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
            <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>
              Add Payroll Record
            </h2>

            <div
              style={{
                marginBottom: "18px",
                padding: "14px",
                borderRadius: "12px",
                border: `1px solid ${BORDER}`,
                backgroundColor: "#f8fbff",
              }}
            >
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  fontWeight: "bold",
                  color: "#1e293b",
                }}
              >
                <input
                  type="checkbox"
                  name="autoCalculateStatutoryDeductions"
                  checked={payrollForm.autoCalculateStatutoryDeductions}
                  onChange={handlePayrollChange}
                />
                Auto Calculate Jamaican Statutory Deductions
              </label>

              <div
                style={{
                  marginTop: "8px",
                  color: MUTED,
                  fontSize: "14px",
                  lineHeight: 1.5,
                }}
              >
                When turned on, the system calculates NIS, NHT, Education Tax,
                and Income Tax automatically. Pension can still be entered.
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "15px",
              }}
            >
              <select
  name="employeeId"
  value={payrollForm.employeeId}
  onChange={handlePayrollChange}
  style={{ padding: "10px" }}
>
  <option value="">Select Employee</option>
  {hrEmployees
    .filter((employee) => employee.employmentStatus === "Active")
    .map((employee) => (
      <option key={employee.employeeId} value={employee.employeeId}>
        {employee.fullName} ({employee.employeeId})
      </option>
    ))}
</select>
              <input
  type="text"
  name="role"
  placeholder="Role"
  value={payrollForm.role}
  readOnly
  style={{ padding: "10px", backgroundColor: "#f8fafc" }}
/>

<input
  type="text"
  name="employeeName"
  placeholder="Employee Name"
  value={payrollForm.employeeName}
  readOnly
  style={{ padding: "10px", backgroundColor: "#f8fafc" }}
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
                name="pensionEmployee"
                placeholder="Pension Employee"
                value={payrollForm.pensionEmployee}
                onChange={handlePayrollChange}
                style={{ padding: "10px" }}
              />

              <select
                name="paidFromAccountNumber"
                value={payrollForm.paidFromAccountNumber}
                onChange={handlePayrollChange}
                style={{ padding: "10px" }}
              >
                <option value="">Select Payroll Payment Account</option>
                {accounts
                  .filter((account) => account.status === "Active")
                  .map((account) => (
                    <option key={account._id} value={account.accountNumber}>
                      {account.accountName} ({account.accountType}) - {formatCurrency(
  account.currentBalance,
  account.currency || "JMD"
)}
                    </option>
                  ))}
              </select>

              <select
                name="status"
                value={payrollForm.status}
                onChange={handlePayrollChange}
                style={{ padding: "10px" }}
              >
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
              </select>

              <input
                type="number"
                name="nisEmployee"
                placeholder="NIS Employee"
                value={payrollForm.nisEmployee}
                onChange={handlePayrollChange}
                disabled={payrollForm.autoCalculateStatutoryDeductions}
                style={{
                  padding: "10px",
                  backgroundColor: payrollForm.autoCalculateStatutoryDeductions
                    ? "#f8fafc"
                    : WHITE,
                }}
              />

              <input
                type="number"
                name="nhtEmployee"
                placeholder="NHT Employee"
                value={payrollForm.nhtEmployee}
                onChange={handlePayrollChange}
                disabled={payrollForm.autoCalculateStatutoryDeductions}
                style={{
                  padding: "10px",
                  backgroundColor: payrollForm.autoCalculateStatutoryDeductions
                    ? "#f8fafc"
                    : WHITE,
                }}
              />

              <input
                type="number"
                name="educationTax"
                placeholder="Education Tax"
                value={payrollForm.educationTax}
                onChange={handlePayrollChange}
                disabled={payrollForm.autoCalculateStatutoryDeductions}
                style={{
                  padding: "10px",
                  backgroundColor: payrollForm.autoCalculateStatutoryDeductions
                    ? "#f8fafc"
                    : WHITE,
                }}
              />

              <input
                type="number"
                name="incomeTax"
                placeholder="Income Tax"
                value={payrollForm.incomeTax}
                onChange={handlePayrollChange}
                disabled={payrollForm.autoCalculateStatutoryDeductions}
                style={{
                  padding: "10px",
                  backgroundColor: payrollForm.autoCalculateStatutoryDeductions
                    ? "#f8fafc"
                    : WHITE,
                }}
              />
            </div>

            <div
  style={{
    marginTop: "18px",
    marginBottom: "18px",
    padding: "14px",
    borderRadius: "12px",
    border: `1px solid ${BORDER}`,
    backgroundColor: "#f8fbff",
  }}
>
  <h3 style={{ marginTop: 0, color: ROYAL_BLUE }}>Attendance Summary for Pay Period</h3>

  {payrollAttendanceLoading ? (
    <div style={{ color: MUTED }}>Loading attendance summary...</div>
  ) : (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "12px",
      }}
    >
      <div style={miniMetricCardStyle}>
        <div style={{ color: MUTED, fontSize: "13px", marginBottom: "6px" }}>
          Days Worked
        </div>
        <div style={{ fontWeight: "bold", color: ROYAL_BLUE }}>
          {payrollAttendanceSummary.totalDays || 0}
        </div>
      </div>

      <div style={miniMetricCardStyle}>
        <div style={{ color: MUTED, fontSize: "13px", marginBottom: "6px" }}>
          Worked Hours
        </div>
        <div style={{ fontWeight: "bold", color: ROYAL_BLUE }}>
          {payrollAttendanceSummary.totalWorkedLabel || "0h 0m"}
        </div>
      </div>

      <div style={miniMetricCardStyle}>
        <div style={{ color: MUTED, fontSize: "13px", marginBottom: "6px" }}>
          Lunch Hours
        </div>
        <div style={{ fontWeight: "bold", color: ROYAL_BLUE }}>
          {payrollAttendanceSummary.totalLunchLabel || "0h 0m"}
        </div>
      </div>
    </div>
  )}
</div>

            <div
              style={{
                marginTop: "18px",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "12px",
              }}
            >
              <div style={miniMetricCardStyle}>
                <div style={{ color: MUTED, fontSize: "13px", marginBottom: "6px" }}>
                  NIS
                </div>
                <div style={{ fontWeight: "bold", color: ROYAL_BLUE }}>
                  {formatCurrency(calculatePayrollPreview.nisEmployee)}
                </div>
              </div>

              <div style={miniMetricCardStyle}>
                <div style={{ color: MUTED, fontSize: "13px", marginBottom: "6px" }}>
                  NHT
                </div>
                <div style={{ fontWeight: "bold", color: ROYAL_BLUE }}>
                  {formatCurrency(calculatePayrollPreview.nhtEmployee)}
                </div>
              </div>

              <div style={miniMetricCardStyle}>
                <div style={{ color: MUTED, fontSize: "13px", marginBottom: "6px" }}>
                  Education Tax
                </div>
                <div style={{ fontWeight: "bold", color: ROYAL_BLUE }}>
                  {formatCurrency(calculatePayrollPreview.educationTax)}
                </div>
              </div>

              <div style={miniMetricCardStyle}>
                <div style={{ color: MUTED, fontSize: "13px", marginBottom: "6px" }}>
                  Income Tax
                </div>
                <div style={{ fontWeight: "bold", color: ROYAL_BLUE }}>
                  {formatCurrency(calculatePayrollPreview.incomeTax)}
                </div>
              </div>

              <div style={miniMetricCardStyle}>
                <div style={{ color: MUTED, fontSize: "13px", marginBottom: "6px" }}>
                  Total Deductions
                </div>
                <div style={{ fontWeight: "bold", color: "#dc2626" }}>
                  {formatCurrency(calculatePayrollPreview.totalDeductions)}
                </div>
              </div>

              <div style={miniMetricCardStyle}>
                <div style={{ color: MUTED, fontSize: "13px", marginBottom: "6px" }}>
                  Net Pay
                </div>
                <div style={{ fontWeight: "bold", color: "#16a34a" }}>
                  {formatCurrency(calculatePayrollPreview.netPay)}
                </div>
              </div>
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
            <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>
              Payroll Records
            </h2>
            <div style={{ overflowX: "auto" }}>
              <table
                border="1"
                cellPadding="10"
                style={{
                  minWidth: "1800px",
                  width: "100%",
                  borderCollapse: "collapse",
                }}
              >
                <thead style={{ backgroundColor: "#eef4ff" }}>
                  <tr>
                    <th>Payroll Number</th>
                    <th>Employee ID</th>
                    <th>Employee</th>
                    <th>Role</th>
                    <th>Pay Period</th>
                    <th>Gross Pay</th>
                    <th>NIS</th>
                    <th>NHT</th>
                    <th>Education Tax</th>
                    <th>Income Tax</th>
                    <th>Pension</th>
                    <th>Total Deductions</th>
                    <th>Net Pay</th>
                    <th>Paid From Account</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {payroll.length > 0 ? (
                    payroll.map((item) => (
                      <tr key={item._id || item.id}>
                       <td>{item.payrollNumber}</td>
<td>{item.employeeId || "-"}</td>
<td>{item.employeeName}</td>
<td>{item.role}</td>
<td>{item.payPeriod}</td>
<td>{formatCurrency(item.grossPay)}</td>
<td>{formatCurrency(item.nisEmployee)}</td>
<td>{formatCurrency(item.nhtEmployee)}</td>
<td>{formatCurrency(item.educationTax)}</td>
<td>{formatCurrency(item.incomeTax)}</td>
<td>{formatCurrency(item.pensionEmployee)}</td>
<td>
  {formatCurrency(
    item.totalDeductions !== undefined
      ? item.totalDeductions
      : item.deductions
  )}
</td>
<td>{formatCurrency(item.netPay)}</td>
<td>{item.paidFromAccountName || item.paidFromAccountNumber || "-"}</td>
<td>{statusBadge(item.status)}</td>
<td>
  <button
    onClick={() => generatePayslipPdf(item)}
    style={{
      backgroundColor: "#16a34a",
      color: "white",
      border: "none",
      padding: "6px 10px",
      borderRadius: "6px",
      cursor: "pointer",
      fontWeight: "bold",
      whiteSpace: "nowrap",
    }}
  >
    Generate Payslip
  </button>
</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="16">No payroll records found.</td>
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
    <div
      style={{
        ...cardStyle,
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "16px",
        alignItems: "end",
      }}
    >
      <div>
        <h2 style={{ marginTop: 0, marginBottom: "8px", color: ROYAL_BLUE }}>
          Financial Reports
        </h2>
        <p style={{ margin: 0, color: MUTED }}>
          Review profit, cash flow, balances, expense categories, and monthly
          business trends.
        </p>
      </div>

      <div>
        <label
          style={{
            display: "block",
            fontWeight: "bold",
            marginBottom: "6px",
            color: "#334155",
          }}
        >
          From
        </label>
        <input
          type="date"
          value={reportFilters.from}
          onChange={(e) =>
            setReportFilters((prev) => ({ ...prev, from: e.target.value }))
          }
          style={{ padding: "10px", width: "100%" }}
        />
      </div>

      <div>
        <label
          style={{
            display: "block",
            fontWeight: "bold",
            marginBottom: "6px",
            color: "#334155",
          }}
        >
          To
        </label>
        <input
          type="date"
          value={reportFilters.to}
          onChange={(e) =>
            setReportFilters((prev) => ({ ...prev, to: e.target.value }))
          }
          style={{ padding: "10px", width: "100%" }}
        />
      </div>

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <button
          onClick={fetchReports}
          style={{
            backgroundColor: ROYAL_BLUE,
            color: WHITE,
            border: "none",
            padding: "10px 16px",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Apply Filters
        </button>

        <button
          onClick={() => {
            setReportFilters({ from: "", to: "" });
            setTimeout(() => fetchReports("", ""), 0);
          }}
          style={{
            backgroundColor: WHITE,
            color: ROYAL_BLUE,
            border: `1px solid ${ROYAL_BLUE}`,
            padding: "10px 16px",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Clear
        </button>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
  <button
    onClick={() => downloadSingleReportPdf("Profit and Loss")}
    style={{
      backgroundColor: "#16a34a",
      color: WHITE,
      border: "none",
      padding: "10px 16px",
      borderRadius: "8px",
      cursor: "pointer",
      fontWeight: "bold",
    }}
  >
    P&L PDF
  </button>

  <button
    onClick={() => downloadSingleReportPdf("Cash Flow")}
    style={{
      backgroundColor: "#0f766e",
      color: WHITE,
      border: "none",
      padding: "10px 16px",
      borderRadius: "8px",
      cursor: "pointer",
      fontWeight: "bold",
    }}
  >
    Cash Flow PDF
  </button>

  <button
    onClick={() => downloadSingleReportPdf("Balance Sheet")}
    style={{
      backgroundColor: "#7c3aed",
      color: WHITE,
      border: "none",
      padding: "10px 16px",
      borderRadius: "8px",
      cursor: "pointer",
      fontWeight: "bold",
    }}
  >
    Balance Sheet PDF
  </button>

  <button
    onClick={() => downloadSingleReportPdf("Statutory Deductions")}
    style={{
      backgroundColor: "#b45309",
      color: WHITE,
      border: "none",
      padding: "10px 16px",
      borderRadius: "8px",
      cursor: "pointer",
      fontWeight: "bold",
    }}
  >
    Statutory PDF
  </button>

  <button
    onClick={() => downloadSingleReportPdf("Expense Category Breakdown")}
    style={{
      backgroundColor: "#2563eb",
      color: WHITE,
      border: "none",
      padding: "10px 16px",
      borderRadius: "8px",
      cursor: "pointer",
      fontWeight: "bold",
    }}
  >
    Expense PDF
  </button>

  <button
    onClick={() => downloadSingleReportPdf("Monthly Trend")}
    style={{
      backgroundColor: "#dc2626",
      color: WHITE,
      border: "none",
      padding: "10px 16px",
      borderRadius: "8px",
      cursor: "pointer",
      fontWeight: "bold",
    }}
  >
    Trend PDF
  </button>
</div>

      </div>
    </div>

    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "18px",
      }}
    >
      <div style={metricCardStyle}>
  <div
    style={{
      fontSize: "13px",
      color: MUTED,
      marginBottom: "6px",
      fontWeight: "bold",
    }}
  >
    NIS Total
  </div>
  <div
    style={{
      fontSize: "30px",
      fontWeight: "bold",
      color: ROYAL_BLUE,
    }}
  >
    {formatCurrency(reports?.statutoryTotals?.nisEmployee)}
  </div>
</div>

<div style={metricCardStyle}>
  <div
    style={{
      fontSize: "13px",
      color: MUTED,
      marginBottom: "6px",
      fontWeight: "bold",
    }}
  >
    NHT Total
  </div>
  <div
    style={{
      fontSize: "30px",
      fontWeight: "bold",
      color: ROYAL_BLUE,
    }}
  >
    {formatCurrency(reports?.statutoryTotals?.nhtEmployee)}
  </div>
</div>

<div style={metricCardStyle}>
  <div
    style={{
      fontSize: "13px",
      color: MUTED,
      marginBottom: "6px",
      fontWeight: "bold",
    }}
  >
    Education Tax Total
  </div>
  <div
    style={{
      fontSize: "30px",
      fontWeight: "bold",
      color: ROYAL_BLUE,
    }}
  >
    {formatCurrency(reports?.statutoryTotals?.educationTax)}
  </div>
</div>

<div style={metricCardStyle}>
  <div
    style={{
      fontSize: "13px",
      color: MUTED,
      marginBottom: "6px",
      fontWeight: "bold",
    }}
  >
    Income Tax Total
  </div>
  <div
    style={{
      fontSize: "30px",
      fontWeight: "bold",
      color: ROYAL_BLUE,
    }}
  >
    {formatCurrency(reports?.statutoryTotals?.incomeTax)}
  </div>
</div>
      <div style={metricCardStyle}>
        <div
          style={{
            fontSize: "13px",
            color: MUTED,
            marginBottom: "6px",
            fontWeight: "bold",
          }}
        >
          Revenue
        </div>
        <div
          style={{
            fontSize: "30px",
            fontWeight: "bold",
            color: ROYAL_BLUE,
          }}
        >
          {formatCurrency(reports?.profitAndLoss?.revenue)}
        </div>
      </div>

      <div style={metricCardStyle}>
        <div
          style={{
            fontSize: "13px",
            color: MUTED,
            marginBottom: "6px",
            fontWeight: "bold",
          }}
        >
          Total Expenses
        </div>
        <div
          style={{
            fontSize: "30px",
            fontWeight: "bold",
            color: "#dc2626",
          }}
        >
          {formatCurrency(reports?.profitAndLoss?.totalExpenses)}
        </div>
      </div>

      <div style={metricCardStyle}>
        <div
          style={{
            fontSize: "13px",
            color: MUTED,
            marginBottom: "6px",
            fontWeight: "bold",
          }}
        >
          Net Profit / Loss
        </div>
        <div
          style={{
            fontSize: "30px",
            fontWeight: "bold",
            color:
              Number(reports?.profitAndLoss?.netProfit || 0) >= 0
                ? "#16a34a"
                : "#dc2626",
          }}
        >
          {formatCurrency(reports?.profitAndLoss?.netProfit)}
        </div>
      </div>

      <div style={metricCardStyle}>
        <div
          style={{
            fontSize: "13px",
            color: MUTED,
            marginBottom: "6px",
            fontWeight: "bold",
          }}
        >
          Accounts Receivable
        </div>
        <div
          style={{
            fontSize: "30px",
            fontWeight: "bold",
            color: GOLD,
          }}
        >
          {formatCurrency(reports?.balanceSheet?.assets?.accountsReceivable)}
        </div>
      </div>

      <div style={metricCardStyle}>
        <div
          style={{
            fontSize: "13px",
            color: MUTED,
            marginBottom: "6px",
            fontWeight: "bold",
          }}
        >
          Cash On Hand
        </div>
        <div
          style={{
            fontSize: "30px",
            fontWeight: "bold",
            color: "#0f172a",
          }}
        >
          {formatCurrency(reports?.balanceSheet?.assets?.cashOnHand)}
        </div>
      </div>

      <div style={metricCardStyle}>
        <div
          style={{
            fontSize: "13px",
            color: MUTED,
            marginBottom: "6px",
            fontWeight: "bold",
          }}
        >
          Paid Invoices
        </div>
        <div
          style={{
            fontSize: "30px",
            fontWeight: "bold",
            color: "#16a34a",
          }}
        >
          {reports?.invoiceStats?.paidCount || 0}
        </div>
      </div>

      <div style={metricCardStyle}>
        <div
          style={{
            fontSize: "13px",
            color: MUTED,
            marginBottom: "6px",
            fontWeight: "bold",
          }}
        >
          Unpaid Invoices
        </div>
        <div
          style={{
            fontSize: "30px",
            fontWeight: "bold",
            color: "#dc2626",
          }}
        >
          {reports?.invoiceStats?.unpaidCount || 0}
        </div>
      </div>

      <div style={metricCardStyle}>
        <div
          style={{
            fontSize: "13px",
            color: MUTED,
            marginBottom: "6px",
            fontWeight: "bold",
          }}
        >
          Report Generated
        </div>
        <div
          style={{
            fontSize: "16px",
            fontWeight: "bold",
            color: ROYAL_BLUE,
            lineHeight: 1.5,
          }}
        >
          {reports?.reportMeta?.generatedAt
            ? formatDate(reports.reportMeta.generatedAt)
            : "-"}
        </div>
      </div>
    </div>

    <div style={cardStyle}>
      <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>
        Profit and Loss Statement
      </h2>
      <table
        border="1"
        cellPadding="12"
        style={{ width: "100%", borderCollapse: "collapse" }}
      >
        <tbody>
          <tr>
            <td>
              <strong>Revenue</strong>
            </td>
            <td>{formatCurrency(reports?.profitAndLoss?.revenue)}</td>
          </tr>
          <tr>
            <td>
              <strong>Operating Expenses</strong>
            </td>
            <td>
              {formatCurrency(reports?.profitAndLoss?.operatingExpenses)}
            </td>
          </tr>
          <tr>
            <td>
              <strong>Payroll Expense</strong>
            </td>
            <td>{formatCurrency(reports?.profitAndLoss?.payrollExpense)}</td>
          </tr>
          <tr>
            <td>
              <strong>Total Expenses</strong>
            </td>
            <td>{formatCurrency(reports?.profitAndLoss?.totalExpenses)}</td>
          </tr>
          <tr>
            <td>
              <strong>Net Profit / Loss</strong>
            </td>
            <td>{formatCurrency(reports?.profitAndLoss?.netProfit)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div style={cardStyle}>
      <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>Cash Flow Statement</h2>
      <table
        border="1"
        cellPadding="12"
        style={{ width: "100%", borderCollapse: "collapse" }}
      >
        <tbody>
          <tr>
            <td>
              <strong>Collected Revenue</strong>
            </td>
            <td>{formatCurrency(reports?.cashFlow?.collectedRevenue)}</td>
          </tr>
          <tr>
            <td>
              <strong>Operating Expense Payments</strong>
            </td>
            <td>
              {formatCurrency(reports?.cashFlow?.operatingExpensePayments)}
            </td>
          </tr>
          <tr>
            <td>
              <strong>Payroll Payments</strong>
            </td>
            <td>{formatCurrency(reports?.cashFlow?.payrollPayments)}</td>
          </tr>
          <tr>
            <td>
              <strong>Total Cash Outflows</strong>
            </td>
            <td>{formatCurrency(reports?.cashFlow?.totalCashOutflows)}</td>
          </tr>
          <tr>
            <td>
              <strong>Net Cash Flow</strong>
            </td>
            <td>{formatCurrency(reports?.cashFlow?.netCashFlow)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div style={cardStyle}>
      <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>Balance Sheet</h2>
      <table
        border="1"
        cellPadding="12"
        style={{ width: "100%", borderCollapse: "collapse" }}
      >
        <tbody>
          <tr>
            <td>
              <strong>Cash On Hand</strong>
            </td>
            <td>{formatCurrency(reports?.balanceSheet?.assets?.cashOnHand)}</td>
          </tr>
          <tr>
            <td>
              <strong>Accounts Receivable</strong>
            </td>
            <td>
              {formatCurrency(
                reports?.balanceSheet?.assets?.accountsReceivable
              )}
            </td>
          </tr>
          <tr>
            <td>
              <strong>Total Assets</strong>
            </td>
            <td>{formatCurrency(reports?.balanceSheet?.assets?.totalAssets)}</td>
          </tr>
          <tr>
            <td>
              <strong>Total Liabilities</strong>
            </td>
            <td>
              {formatCurrency(
                reports?.balanceSheet?.liabilities?.totalLiabilities
              )}
            </td>
          </tr>
          <tr>
            <td>
              <strong>Owner's Equity</strong>
            </td>
            <td>{formatCurrency(reports?.balanceSheet?.equity?.ownerEquity)}</td>
          </tr>
        </tbody>
      </table>
    </div>

<div style={cardStyle}>
  <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>
    Statutory Deductions Summary
  </h2>
  <table
    border="1"
    cellPadding="12"
    style={{ width: "100%", borderCollapse: "collapse" }}
  >
    <tbody>
      <tr>
        <td><strong>NIS</strong></td>
        <td>{formatCurrency(reports?.statutoryTotals?.nisEmployee)}</td>
      </tr>
      <tr>
        <td><strong>NHT</strong></td>
        <td>{formatCurrency(reports?.statutoryTotals?.nhtEmployee)}</td>
      </tr>
      <tr>
        <td><strong>Education Tax</strong></td>
        <td>{formatCurrency(reports?.statutoryTotals?.educationTax)}</td>
      </tr>
      <tr>
        <td><strong>Income Tax</strong></td>
        <td>{formatCurrency(reports?.statutoryTotals?.incomeTax)}</td>
      </tr>
      <tr>
        <td><strong>Pension</strong></td>
        <td>{formatCurrency(reports?.statutoryTotals?.pensionEmployee)}</td>
      </tr>
      <tr>
        <td><strong>Total Deductions</strong></td>
        <td>{formatCurrency(reports?.statutoryTotals?.totalDeductions)}</td>
      </tr>
    </tbody>
  </table>
</div>

<div style={cardStyle}>
  <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>
    Statutory Deductions by Employee
  </h2>
  <div style={{ overflowX: "auto" }}>
    <table
      border="1"
      cellPadding="12"
      style={{ width: "100%", borderCollapse: "collapse", minWidth: "1100px" }}
    >
      <thead style={{ backgroundColor: "#eef4ff" }}>
        <tr>
          <th>Employee ID</th>
          <th>Employee Name</th>
          <th>Role</th>
          <th>Gross Pay</th>
          <th>NIS</th>
          <th>NHT</th>
          <th>Education Tax</th>
          <th>Income Tax</th>
          <th>Pension</th>
          <th>Total Deductions</th>
          <th>Net Pay</th>
        </tr>
      </thead>
      <tbody>
        {reports?.statutoryByEmployee?.length > 0 ? (
          reports.statutoryByEmployee.map((item, index) => (
            <tr key={`${item.employeeId}-${index}`}>
              <td>{item.employeeId || "-"}</td>
              <td>{item.employeeName || "-"}</td>
              <td>{item.role || "-"}</td>
              <td>{formatCurrency(item.grossPay)}</td>
              <td>{formatCurrency(item.nisEmployee)}</td>
              <td>{formatCurrency(item.nhtEmployee)}</td>
              <td>{formatCurrency(item.educationTax)}</td>
              <td>{formatCurrency(item.incomeTax)}</td>
              <td>{formatCurrency(item.pensionEmployee)}</td>
              <td>{formatCurrency(item.totalDeductions)}</td>
              <td>{formatCurrency(item.netPay)}</td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="11">No statutory deduction data found for this period.</td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
</div>

    <div style={cardStyle}>
      <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>
        Expense Category Breakdown
      </h2>
      <div style={{ overflowX: "auto" }}>
        <table
          border="1"
          cellPadding="12"
          style={{ width: "100%", borderCollapse: "collapse" }}
        >
          <thead style={{ backgroundColor: "#eef4ff" }}>
            <tr>
              <th>Category</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {reports?.expenseByCategory?.length > 0 ? (
              reports.expenseByCategory.map((item, index) => (
                <tr key={`${item.category}-${index}`}>
                  <td>{item.category}</td>
                  <td>{formatCurrency(item.amount)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="2">No expense data found for this period.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>

    <div style={cardStyle}>
  <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>Monthly Trend Chart</h2>

  <div style={{ width: "100%", height: 380 }}>
    {reports?.monthlyTrend?.length > 0 ? (
      <ResponsiveContainer>
        <BarChart
          data={reports.monthlyTrend.map((item) => ({
            ...item,
            monthLabel: item.label || item.month,
          }))}
          margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="monthLabel" />
          <YAxis />
          <Tooltip
            formatter={(value) => formatCurrency(value)}
          />
          <Legend />
          <Bar dataKey="revenue" name="Revenue" fill="#0B3D91" radius={[6, 6, 0, 0]} />
          <Bar dataKey="expenses" name="Operating Expenses" fill="#D4AF37" radius={[6, 6, 0, 0]} />
          <Bar dataKey="payroll" name="Payroll" fill="#dc2626" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    ) : (
      <div
        style={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: MUTED,
          fontWeight: "bold",
        }}
      >
        No monthly trend data found for this period.
      </div>
    )}
  </div>
</div>

    <div style={cardStyle}>
      <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>Monthly Trend</h2>
      <div style={{ overflowX: "auto" }}>
        <table
          border="1"
          cellPadding="12"
          style={{ width: "100%", borderCollapse: "collapse", minWidth: "900px" }}
        >
          <thead style={{ backgroundColor: "#eef4ff" }}>
            <tr>
              <th>Month</th>
              <th>Revenue</th>
              <th>Operating Expenses</th>
              <th>Payroll</th>
              <th>Net</th>
            </tr>
          </thead>
          
          <tbody>
            {reports?.monthlyTrend?.length > 0 ? (
              reports.monthlyTrend.map((item, index) => (
                <tr key={`${item.month}-${index}`}>
                  <td>{item.label || item.month}</td>
                  <td>{formatCurrency(item.revenue)}</td>
                  <td>{formatCurrency(item.expenses)}</td>
                  <td>{formatCurrency(item.payroll)}</td>
                  <td
                    style={{
                      fontWeight: "bold",
                      color: Number(item.net || 0) >= 0 ? "#16a34a" : "#dc2626",
                    }}
                  >
                    {formatCurrency(item.net)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5">No monthly trend data found for this period.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  </div>
)}
      {activeTab === "accounts" && (
        <>
          <div style={{ ...cardStyle, marginBottom: "24px" }}>
            <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>
              Create Financial Account
            </h2>
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
              <input
  type="number"
  name="currentBalance"
  placeholder="Current Balance"
  value={accountForm.currentBalance}
  onChange={handleAccountChange}
  style={{ padding: "10px" }}
/>

<select
  name="currency"
  value={accountForm.currency}
  onChange={handleAccountChange}
  style={{ padding: "10px" }}
>
  <option value="JMD">JMD</option>
  <option value="USD">USD</option>
</select>

{accountForm.currency !== "JMD" && (
  <input
    type="number"
    step="0.01"
    name="exchangeRate"
    placeholder="Exchange Rate"
    value={accountForm.exchangeRate}
    onChange={handleAccountChange}
    style={{ padding: "10px" }}
  />
)}
            </div>

            <select
  name="status"
  value={accountForm.status}
  onChange={handleAccountChange}
  style={{ padding: "10px" }}
>
  <option value="Active">Active</option>
  <option value="Inactive">Inactive</option>
</select>

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
              {isEditingAccount ? "Update Account" : "Save Account"}
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
              <div
                style={{
                  fontSize: "32px",
                  fontWeight: "bold",
                  color: ROYAL_BLUE,
                  marginBottom: "8px",
                }}
              >
                {accounts.length}
              </div>
              <div style={{ color: "#334155", fontWeight: "bold" }}>
                Total Accounts
              </div>
            </div>

            <div style={metricCardStyle}>
              <div
                style={{
                  fontSize: "32px",
                  fontWeight: "bold",
                  color: "#16a34a",
                  marginBottom: "8px",
                }}
              >
                {accounts.filter((a) => a.accountType === "Bank").length}
              </div>
              <div style={{ color: "#334155", fontWeight: "bold" }}>
                Bank Accounts
              </div>
            </div>

            <div style={metricCardStyle}>
              <div
                style={{
                  fontSize: "32px",
                  fontWeight: "bold",
                  color: GOLD,
                  marginBottom: "8px",
                }}
              >
                {accounts.filter((a) => a.accountType === "Cash").length}
              </div>
              <div style={{ color: "#334155", fontWeight: "bold" }}>
                Cash Accounts
              </div>
            </div>

            <div style={metricCardStyle}>
              <div
                style={{
                  fontSize: "32px",
                  fontWeight: "bold",
                  color: "#dc2626",
                  marginBottom: "8px",
                }}
              >
                {accounts.filter((a) => a.accountType === "Credit Card").length}
              </div>
              <div style={{ color: "#334155", fontWeight: "bold" }}>
                Credit Card Accounts
              </div>
            </div>
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>
              Financial Accounts
            </h2>
            <div style={{ overflowX: "auto" }}>
              <table
                border="1"
                cellPadding="10"
                style={{
                  minWidth: "1100px",
                  width: "100%",
                  borderCollapse: "collapse",
                }}
              >
                <thead style={{ backgroundColor: "#eef4ff" }}>
                  <tr>
                    <th>Account Number</th>
                    <th>Account Name</th>
                    <th>Type</th>
                    <th>Bank Name</th>
                    <th>Opening Balance</th>
                    <th>Current Balance</th>
                    <th>JMD Equivalent</th>
                    <th>Currency</th>
                    <th>Status</th>
                    <th>Action</th>
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
                        <td>{account.currency || "JMD"}{" "}
{Number(account.currentBalance || 0).toLocaleString()}</td>
<td>
  JMD{" "}
  {Number(
    account.baseCurrencyBalance || account.currentBalance || 0
  ).toLocaleString()}
</td>
                        <td>{account.currency}</td>
                        <td>{statusBadge(account.status)}</td>
<td>
  <button
    onClick={() => editAccount(account)}
    style={{
      backgroundColor: ROYAL_BLUE,
      color: WHITE,
      border: "none",
      padding: "8px 12px",
      borderRadius: "8px",
      cursor: "pointer",
      fontWeight: "bold",
    }}
  >
    Edit
  </button>
</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9">No financial accounts found.</td>
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
            <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>
              Record Account Transaction
            </h2>

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
            <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>
              Account Transactions
            </h2>
            <div style={{ overflowX: "auto" }}>
              <table
                border="1"
                cellPadding="10"
                style={{
                  minWidth: "1200px",
                  width: "100%",
                  borderCollapse: "collapse",
                }}
              >
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