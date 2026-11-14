import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import api from "../api";
import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";

import FinanceDashboard from "../components/finance/FinanceDashboard";
import FinanceReportView from "../components/finance/FinanceReportView";
import ExpenseCategoryManager from "../components/finance/ExpenseCategoryManager";
function Finance() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [invoices, setInvoices] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [canManageExpenseCategories, setCanManageExpenseCategories] =
  useState(false);

const [expenseCategoriesLoading, setExpenseCategoriesLoading] =
  useState(false);

const [expenseCategoryError, setExpenseCategoryError] =
  useState("");

const [expenseCategoryIssues, setExpenseCategoryIssues] =
  useState([]);

const expenseCategoryRequestId = useRef(0);
  const [payroll, setPayroll] = useState([]);
  const [hrEmployees, setHrEmployees] = useState([]);
  const [summary, setSummary] = useState(null);
  const [reports, setReports] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
const [summaryError, setSummaryError] = useState("");

const [reportLoading, setReportLoading] = useState(false);
const [reportError, setReportError] = useState("");

const [financeReferenceErrors, setFinanceReferenceErrors] =
  useState([]);

const summaryRequestId = useRef(0);
const reportRequestId = useRef(0);
const referenceRequestId = useRef(0);

const reportQueryRef = useRef({
  from: "",
  to: "",
  branch: "",
});
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [adjustmentPreview, setAdjustmentPreview] = useState([]);
  const [adjustmentBatches, setAdjustmentBatches] = useState([]);
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
  branch: "",
});

const downloadSingleReportPdf = (reportType) => {
  if (
    !reports?.filters ||
    reportLoading ||
    reportError
  ) {
    alert(
      "Load the financial report successfully before exporting."
    );
    return;
  }

  try {
    const landscape =
      reportType === "Statutory Deductions";

    const doc = new jsPDF(
      landscape ? "l" : "p",
      "mm",
      "a4"
    );

    const width = doc.internal.pageSize.getWidth();

    const title =
      reportType === "Cash Flow"
        ? "Cash Movements"
        : reportType;

    const applied = reports.filters;
    const meta = reports.reportMeta || {};
    const profit = reports.profitAndLoss;
    const cash = reports.cashFlow?.totals;
    const balance = reports.balanceSheet;

    const deductionFields = [
      "nisEmployee",
      "nhtEmployee",
      "educationTax",
      "incomeTax",
      "pensionEmployee",
    ];

    let head;
    let body;

    switch (reportType) {
      case "Profit and Loss":
        head = ["Description", "Amount"];
        body = [
          ["Revenue", formatCurrency(profit.revenue)],
          [
            "Cost of Sales",
            formatCurrency(profit.costOfSales),
          ],
          [
            "Gross Profit",
            formatCurrency(profit.grossProfit),
          ],
          [
            "Operating Expenses (includes payroll)",
            formatCurrency(profit.operatingExpenses),
          ],
          [
            "Total Expenses (Cost of Sales + Operating Expenses)",
            formatCurrency(profit.totalExpenses),
          ],
          [
            "Net Profit / Loss",
            formatCurrency(profit.netProfit),
          ],
          [
            "Payroll Expense (already included above)",
            formatCurrency(profit.payrollExpense),
          ],
        ];
        break;

      case "Cash Flow":
        head = ["Cash Movements", "Amount"];
        body = [
          [
            "Opening Cash & Bank",
            formatCurrency(cash?.openingBalance),
          ],
          [
            "Cash/Bank Inflows",
            formatCurrency(cash?.totalInflows),
          ],
          [
            "Cash/Bank Outflows",
            formatCurrency(cash?.totalOutflows),
          ],
          [
            "Net Cash Movement",
            formatCurrency(cash?.netCashFlow),
          ],
          [
            "Closing Cash & Bank",
            formatCurrency(cash?.closingBalance),
          ],
          [
            "Identified Internal Transfers (excluded above)",
            formatCurrency(cash?.internalTransfers),
          ],
        ];
        break;

      case "Balance Sheet":
        head = ["Balance Sheet", "Amount"];
        body = [
          [
            "Total Assets",
            formatCurrency(balance?.assets?.total),
          ],
          [
            "Total Liabilities",
            formatCurrency(balance?.liabilities?.total),
          ],
          [
            "Total Equity (includes unclosed ledger earnings)",
            formatCurrency(balance?.equity?.total),
          ],
          [
            "Liabilities + Equity",
            formatCurrency(
              balance?.totals?.liabilitiesPlusEquity
            ),
          ],
          [
            "Difference",
            formatCurrency(balance?.totals?.difference),
          ],
        ];
        break;

      case "Statutory Deductions":
        head = [
          "Employee ID",
          "Employee",
          "Gross Pay",
          "Net Pay",
          "NIS",
          "NHT",
          "Education Tax",
          "Income Tax",
          "Pension",
          "Total Deductions",
          "Posting Dates",
          "Recorded Payment Dates",
        ];

        body = (
          reports.statutoryByEmployee || []
        ).map((item) => [
          item.employeeId || "Not recorded",
          item.employeeName,
          formatCurrency(item.grossPay),
          formatCurrency(item.netPay),
          ...deductionFields.map((field) =>
            formatCurrency(item[field])
          ),
          formatCurrency(item.totalDeductions),
          (item.postingDates || []).join(", "),
          (item.actualPaymentDates || []).join(", "),
        ]);
        break;

      case "Expense Category Breakdown":
        head = ["Expense Account", "Amount"];

        body = (reports.expenseByCategory || []).map(
          (item) => [
            item.category,
            formatCurrency(item.amount),
          ]
        );
        break;

      case "Monthly Trend":
        head = [
          "Month",
          "Revenue",
          "Total Expenses (includes payroll)",
          "Payroll (included)",
          "Net Profit / Loss",
        ];

        body = (reports.monthlyTrend || []).map(
          (item) => [
            item.month,
            ...[
              item.revenue,
              item.expenses,
              item.payroll,
              item.netProfit,
            ].map((value) =>
              item.recordedActivity === false
                ? "No recorded activity"
                : formatCurrency(value)
            ),
          ]
        );
        break;

      default:
        throw new Error(
          "Select a supported report export."
        );
    }

    if (!body.length) {
      body = [
        [
          "No qualifying recorded rows.",
          ...head.slice(1).map(() => ""),
        ],
      ];
    }

    doc.setFontSize(17);
    doc.text("Eltham Konnect", 14, 16);

    doc.setFontSize(12);
    doc.text(title, 14, 24);

    doc.setFontSize(9);

    let y = 32;

    const note = (text) => {
      const lines = doc.splitTextToSize(
        String(text),
        width - 28
      );

      doc.text(lines, 14, y);
      y += lines.length * 4 + 2;
    };

    note(
      `Applied period: ${
        applied.from || "Earliest recorded activity"
      } to ${applied.to}. Branch: ${
        applied.branch || "All Branches"
      }. Currency: JMD.`
    );

    note(
      meta.periodBasis ||
        "Recorded General Ledger activity."
    );

    note(
      `Business scope: ${
        meta.businessScope || "See report scope"
      }.`
    );

    note(
      "Provisional: recorded figures; source-record reconciliation is pending."
    );

    note(
      `Generated: ${meta.generatedAt || "Not recorded"}`
    );

    if (reportType === "Cash Flow") {
      note(
        "Operating, investing and financing classifications remain under review."
      );
    }

    if (reportType === "Statutory Deductions") {
      note(
        meta.payrollBasis ||
          "See payroll reporting basis."
      );

      note(
        meta.deductionBasis ||
          "Employee deduction components only."
      );
    }

    const tableOptions = {
      margin: { bottom: 18 },
      styles: {
        fontSize: landscape ? 7 : 9,
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: [11, 61, 145],
      },
      didDrawPage: () => {
        doc.setFontSize(8);

        doc.text(
          "Recorded figures - reconciliation pending. Amounts in JMD.",
          14,
          doc.internal.pageSize.getHeight() - 8
        );
      },
    };

    autoTable(doc, {
      ...tableOptions,
      startY: y + 2,
      head: [head],
      body,
    });

    const reviewRows = (meta.issues || []).map(
      (issue) => [issue.code, issue.message]
    );

    if (reviewRows.length) {
      autoTable(doc, {
        ...tableOptions,
        startY: doc.lastAutoTable.finalY + 10,
        head: [["Review Item", "Details"]],
        body: reviewRows,
      });
    }

    if (reportType === "Statutory Deductions") {
      autoTable(doc, {
        ...tableOptions,
        startY: doc.lastAutoTable.finalY + 10,
        head: [
          ["Employee Deduction Component", "Total"],
        ],
        body: [
          ...deductionFields.map((field) => [
            field,
            formatCurrency(
              reports.statutoryTotals?.[field]
            ),
          ]),
          [
            "Total Employee Deductions",
            formatCurrency(
              reports.statutoryTotals?.totalDeductions
            ),
          ],
        ],
      });

      const exceptions =
        meta.payrollExceptions || [];

      if (exceptions.length) {
        autoTable(doc, {
          ...tableOptions,
          startY: doc.lastAutoTable.finalY + 10,
          head: [
            ["Payroll Exception", "Scope", "Details"],
          ],
          body: exceptions.map((item) => [
            item.record,
            item.scope,
            item.issue,
          ]),
        });
      }

      if (meta.payrollExceptionsTruncated) {
        autoTable(doc, {
          ...tableOptions,
          startY: doc.lastAutoTable.finalY + 10,
          head: [["Exception Coverage"]],
          body: [
            [
              `Showing the first 100 of ${meta.payrollExceptionCount} exceptions.`,
            ],
          ],
        });
      }
    }

    const filename = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-");

    doc.save(
      `eltham-konnect-${filename}-${applied.to}.pdf`
    );
  } catch (error) {
    console.error("Error generating PDF:", error);

    alert(
      error.message ||
        "Could not download PDF report."
    );
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
    accountPurpose: "Operating",
    financialInstitution: "",
    branchName: "",
    accountNickname: "",
    isDefaultDepositAccount: false,
    isDefaultExpenseAccount: false,
    isDefaultPayrollAccount: false,
    isDefaultCustomerReceiptAccount: false,
    isBusinessSavings: false,
    creditLimit: "",
    availableCredit: "",
    statementDate: "",
    paymentDueDate: "",
    minimumPayment: "",
    interestRate: "",
    lastStatementBalance: "",
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

  const [adjustmentForm, setAdjustmentForm] = useState({
    effectiveDate: "2026-07-05",
    adjustmentReason: "Financial position correction after June 2026 close",
    description:
      "Align EKOS financial account balances with actual July 5, 2026 financial position.",
  });

  const [actualBalances, setActualBalances] = useState({});

  const ROYAL_BLUE = "#0B3D91";
  const GOLD = "#D4AF37";
  const WHITE = "#FFFFFF";
  const LIGHT_BG = "#f4f7fb";
  const BORDER = "#dbe3ef";
  const MUTED = "#64748b";

      const getExpenseCategoryPreview = (category = "") =>
  expenseCategories.find(
    (item) => item.category === category
  ) || {
    classification: "Not available",
    group: "Not available",
    accountCode: "—",
    accountName: "Select an available category",
    isCOGS: false,
  };

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

const fetchReports = async (
  options = reportQueryRef.current
) => {
  const requested = {
    from: options.from || "",
    to: options.to || "",
    branch: options.branch || "",
  };

  reportQueryRef.current = requested;

  const requestId = ++reportRequestId.current;

  setReportLoading(true);
  setReportError("");
  setReports(null);

  try {
    const params = new URLSearchParams();

    Object.entries(requested).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });

    const query = params.toString();

    const res = await api.get(
      `/api/finance/reports${query ? `?${query}` : ""}`
    );

    if (
      res.data?.success !== true ||
      !res.data?.data?.filters ||
      !res.data?.data?.profitAndLoss
    ) {
      throw new Error(
        "The financial report response is incomplete."
      );
    }

    if (requestId === reportRequestId.current) {
      setReports(res.data.data);
    }
  } catch (error) {
    if (requestId !== reportRequestId.current) return;

    console.error("Error loading reports:", error);

    setReportError(
      error?.response?.data?.message ||
        error.message ||
        "Could not load financial reports."
    );
  } finally {
    if (requestId === reportRequestId.current) {
      setReportLoading(false);
    }
  }
};

const clearReports = () => {
  const cleared = {
    from: "",
    to: "",
    branch: "",
  };

  setReportFilters(cleared);

  return fetchReports(cleared);
};

const openDashboardReport = (scope) => {
  const selected = {
    from: scope.from || "",
    to: scope.to || "",
    branch: scope.branch || "",
  };

  setReportFilters(selected);
  setActiveTab("reports");

  return fetchReports(selected);
};

const fetchExpenseCategories = async () => {
  const requestId = ++expenseCategoryRequestId.current;

  setExpenseCategoriesLoading(true);
  setExpenseCategoryError("");

  try {
    const res = await api.get(
      "/api/finance/expense-categories"
    );

    if (requestId !== expenseCategoryRequestId.current) {
      return null;
    }

    if (
      res.data?.success !== true ||
      !Array.isArray(res.data.data)
    ) {
      throw new Error(
        "Expense categories could not be loaded completely."
      );
    }

    const available = res.data.data.filter(
      (item) => item.availableForExpenses === true
    );

    setCanManageExpenseCategories(
      res.data.canManageCategories === true
    );

    setExpenseCategories(available);

    setExpenseCategoryIssues(
      res.data.data.filter(
        (item) => item.mappingValid === false
      )
    );

    setExpenseForm((previous) =>
      previous.category &&
      !available.some(
        (item) => item.category === previous.category
      )
        ? { ...previous, category: "" }
        : previous
    );

    return available;
  } catch (error) {
    if (requestId !== expenseCategoryRequestId.current) {
      return null;
    }

    console.error("Error loading expense categories:", error);

    setExpenseCategories([]);
    setExpenseCategoryIssues([]);

    setExpenseForm((previous) => ({
      ...previous,
      category: "",
    }));

    if (error?.response?.status === 403) {
      setCanManageExpenseCategories(false);
    }

    setExpenseCategoryError(
      error?.response?.data?.message ||
        error.message ||
        "Could not load your expense categories."
    );

    return null;
  } finally {
    if (requestId === expenseCategoryRequestId.current) {
      setExpenseCategoriesLoading(false);
    }
  }
};

const handleExpenseCategorySaved = async (
  createdCategory
) => {
  const available = await fetchExpenseCategories();

  if (!available) return false;

  if (createdCategory) {
    const selected = available.find(
      (item) => item._id === createdCategory._id
    );

    if (!selected) return false;

    setExpenseForm((previous) => ({
      ...previous,
      category: selected.category,
    }));
  }

  return true;
};

const getSummaryQuery = () => {
  const params = new URLSearchParams();

  params.append("filter", summaryFilter);

  if (summaryBranch) {
    params.append("branch", summaryBranch);
  }

  return params.toString();
};

  const fetchSummary = async () => {
  const requestId = ++summaryRequestId.current;

  setSummaryLoading(true);
  setSummaryError("");
  setSummary(null);

  try {
    const res = await api.get(
      `/api/finance/summary?${getSummaryQuery()}`
    );

    if (
      res.data?.success !== true ||
      !res.data?.data?.filters ||
      !res.data?.data?.profitAndLoss
    ) {
      throw new Error(
        "The financial summary response is incomplete."
      );
    }

    if (requestId === summaryRequestId.current) {
      setSummary(res.data.data);
    }
  } catch (error) {
    if (requestId !== summaryRequestId.current) return;

    console.error(
      "Error loading finance summary:",
      error
    );

    setSummaryError(
      error?.response?.data?.message ||
        error.message ||
        "Could not load finance summary."
    );
  } finally {
    if (requestId === summaryRequestId.current) {
      setSummaryLoading(false);
    }
  }
};

const fetchReferenceFinanceData = async () => {
  const requestId = ++referenceRequestId.current;

  const sources = [
    ["Invoices", "/api/invoices", setInvoices],
    [
      "Financial accounts",
      "/api/financial-accounts",
      setAccounts,
    ],
    ["HR employees", "/api/hr", setHrEmployees],
  ];

  const results = await Promise.allSettled(
    sources.map(([, url]) => api.get(url))
  );

  if (requestId !== referenceRequestId.current) return;

  const unavailable = [];

  results.forEach((result, index) => {
    const [label, , save] = sources[index];

    if (
      result.status === "fulfilled" &&
      Array.isArray(result.value.data?.data)
    ) {
      save(result.value.data.data);
    } else {
      save([]);
      unavailable.push(label);

      console.error(
        `Could not load ${label}:`,
        result.status === "rejected"
          ? result.reason
          : "Unexpected response."
      );
    }
  });

  setFinanceReferenceErrors(unavailable);
};

const fetchStaticFinanceData = async () => {
  await Promise.all([
    fetchSummary(),
    fetchReferenceFinanceData(),
  ]);
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

    const fetchAdjustmentBatches = async () => {
    try {
      const res = await api.get("/api/finance/adjustment-batches");
      setAdjustmentBatches(res.data.data || []);
    } catch (error) {
      console.error("Error loading adjustment batches:", error);
    }
  };

  const previewFinancialPosition = async () => {
    try {
      const payload = {
        actualBalances: Object.entries(actualBalances).map(
          ([accountNumber, value]) => ({
            accountNumber,
            actualBalance: Number(value.actualBalance || 0),
            notes: value.notes || "",
          })
        ),
      };

      const res = await api.post("/api/finance/financial-position/preview", payload);
      setAdjustmentPreview(res.data.data || []);
    } catch (error) {
      console.error("Error previewing financial position:", error);
      alert(error?.response?.data?.message || "Could not preview financial position.");
    }
  };

  const seedJulyActualBalances = () => {
    setActualBalances({
      "ACC-1773524447392": {
        actualBalance: 395077.96,
        notes:
          "Credit card outstanding balance based on JMD 500,000 limit less JMD 104,922.04 available credit.",
      },
      "ACC-1773524133358": {
        actualBalance: 25050,
        notes: "Actual cash count for Cash in Hand - Eltham Park.",
      },
      "ACC-1773521929700": {
        actualBalance: 16748.02,
        notes: "Actual JMD business bank balance as of July 5, 2026.",
      },
      "ACC-1773522044240": {
        actualBalance: 2.75,
        notes: "Actual USD savings balance as of July 5, 2026.",
      },
      "ACC-1773524225902": {
        actualBalance: 9100,
        notes: "Actual Brown's Town Dropbox cash balance as of July 5, 2026.",
      },
      "ACC-1773524316923": {
        actualBalance: 4200,
        notes: "Actual Brown's Town Float balance as of July 5, 2026.",
      },
    });
  };

  const createAdjustmentBatch = async () => {
    try {
      if (!adjustmentForm.effectiveDate || !adjustmentForm.adjustmentReason) {
        alert("Effective date and adjustment reason are required.");
        return;
      }

      const payload = {
        ...adjustmentForm,
        actualBalances: Object.entries(actualBalances).map(
          ([accountNumber, value]) => ({
            accountNumber,
            actualBalance: Number(value.actualBalance || 0),
            notes: value.notes || "",
          })
        ),
      };

      const res = await api.post("/api/finance/adjustment-batches", payload);

      alert(res.data.message);
      await fetchAdjustmentBatches();
      await previewFinancialPosition();
    } catch (error) {
      console.error("Error creating adjustment batch:", error);
      alert(error?.response?.data?.message || "Could not create adjustment batch.");
    }
  };

  const postAdjustmentBatch = async (batchNumber) => {
    if (
      !window.confirm(
        `Post adjustment batch ${batchNumber}? This will create a journal entry and update financial account balances.`
      )
    ) {
      return;
    }

    try {
      const res = await api.post(`/api/finance/adjustment-batches/${batchNumber}/post`);
      alert(res.data.message);

      await fetchStaticFinanceData();
      await fetchTransactions(1, transactionPagination.limit);
      await fetchAdjustmentBatches();
      await previewFinancialPosition();
    } catch (error) {
      console.error("Error posting adjustment batch:", error);
      alert(error?.response?.data?.message || "Could not post adjustment batch.");
    }
  };

    const deleteDraftAdjustmentBatch = async (batchNumber) => {
    if (
      !window.confirm(
        `Delete draft adjustment batch ${batchNumber}? This cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const res = await api.delete(`/api/finance/adjustment-batches/${batchNumber}`);
      alert(res.data.message);

      await fetchAdjustmentBatches();
      await previewFinancialPosition();
    } catch (error) {
      console.error("Error deleting draft adjustment batch:", error);
      alert(error?.response?.data?.message || "Could not delete draft adjustment batch.");
    }
  };

    const fetchFinanceData = async () => {
  await Promise.all([
    fetchStaticFinanceData(),
    fetchExpenseCategories(),
    fetchReports(reportQueryRef.current),
    fetchExpenses(
      expensePagination.page,
      expensePagination.limit
    ),
    fetchPayroll(
      payrollPagination.page,
      payrollPagination.limit
    ),
    fetchTransactions(
      transactionPagination.page,
      transactionPagination.limit
    ),
    fetchAdjustmentBatches(),
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

  const formatCurrency = (value, currency = "JMD") => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "Not available";
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "Not available";
  }

  return `${currency} ${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

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
    <p style={{ color: MUTED, marginTop: 0 }}>
  Record business expenses already paid, including payments
  made by credit card. Record unpaid supplier bills through
  Accounts Payable.
</p>
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

      if (
  expenseCategoriesLoading ||
  expenseCategoryError
) {
  alert(
    "Load your expense categories successfully before saving."
  );
  return;
}

const selectedCategory = expenseCategories.find(
  (item) =>
    item.category === expenseForm.category &&
    item.availableForExpenses === true
);

if (!selectedCategory) {
  alert("Select one of your available saved categories.");
  return;
}

      const payload = new FormData();
      payload.append("date", expenseForm.date);
      payload.append("category", expenseForm.category);
      payload.append("description", expenseForm.description);
      payload.append("amount", expenseForm.amount);
      payload.append("status", "Paid");
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
  const { name, value, type, checked } = e.target;

  setAccountForm((prev) => ({
    ...prev,
    [name]: type === "checkbox" ? checked : value,
  }));
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
      exchangeRate: Number(accountForm.exchangeRate || 1),
      creditLimit: Number(accountForm.creditLimit || 0),
      availableCredit: Number(accountForm.availableCredit || 0),
      statementDate: Number(accountForm.statementDate || 0),
      paymentDueDate: Number(accountForm.paymentDueDate || 0),
      minimumPayment: Number(accountForm.minimumPayment || 0),
      interestRate: Number(accountForm.interestRate || 0),
      lastStatementBalance: Number(accountForm.lastStatementBalance || 0),
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
      accountPurpose: "Operating",
      financialInstitution: "",
      branchName: "",
      accountNickname: "",
      isDefaultDepositAccount: false,
      isDefaultExpenseAccount: false,
      isDefaultPayrollAccount: false,
      isDefaultCustomerReceiptAccount: false,
      isBusinessSavings: false,
      creditLimit: "",
      availableCredit: "",
      statementDate: "",
      paymentDueDate: "",
      minimumPayment: "",
      interestRate: "",
      lastStatementBalance: "",
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
      accountPurpose: account.accountPurpose || "Operating",
      financialInstitution: account.financialInstitution || account.bankName || "",
      branchName: account.branchName || "",
      accountNickname: account.accountNickname || "",
      isDefaultDepositAccount: account.isDefaultDepositAccount || false,
      isDefaultExpenseAccount: account.isDefaultExpenseAccount || false,
      isDefaultPayrollAccount: account.isDefaultPayrollAccount || false,
      isDefaultCustomerReceiptAccount:
        account.isDefaultCustomerReceiptAccount || false,
      isBusinessSavings: account.isBusinessSavings || false,
      creditLimit: account.creditLimit ?? "",
      availableCredit: account.availableCredit ?? "",
      statementDate: account.statementDate ?? "",
      paymentDueDate: account.paymentDueDate ?? "",
      minimumPayment: account.minimumPayment ?? "",
      interestRate: account.interestRate ?? "",
      lastStatementBalance: account.lastStatementBalance ?? "",
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

  const totalCashAndBankBalances = useMemo(
  () =>
    accounts
      .filter(
        (account) =>
          account.accountType === "Bank" ||
          account.accountType === "Cash"
      )
      .reduce(
        (sum, account) =>
          sum +
          Number(
            account.baseCurrencyBalance ||
            account.currentBalance ||
            0
          ),
        0
      ),
  [accounts]
);

const totalCreditCardBalances = useMemo(
  () =>
    accounts
      .filter((account) => account.accountType === "Credit Card")
      .reduce(
        (sum, account) =>
          sum +
          Number(
            account.baseCurrencyBalance ||
            account.currentBalance ||
            0
          ),
        0
      ),
  [accounts]
);

const netCashPosition =
  totalCashAndBankBalances - totalCreditCardBalances;

  const getDayCountdown = (dayOfMonth) => {
  const day = Number(dayOfMonth || 0);
  if (!day) return "—";

  const today = new Date();
  const target = new Date(today.getFullYear(), today.getMonth(), day);

  if (target < today) {
    target.setMonth(target.getMonth() + 1);
  }

  const diffDays = Math.ceil((target - today) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Due Today";
  if (diffDays === 1) return "1 day";
  return `${diffDays} days`;
};

const treasuryHealthBadge = (health) => {
  const backgroundColor =
    health === "Near Limit"
      ? "#dc2626"
      : health === "High Utilization"
      ? "#f97316"
      : health === "Needs Reconciliation"
      ? "#f59e0b"
      : health === "Inactive"
      ? "#64748b"
      : "#16a34a";

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
      {health || "Healthy"}
    </span>
  );
};

const utilizationBar = (percent) => {
  if (
    percent === null ||
    percent === undefined ||
    percent === "" ||
    !Number.isFinite(Number(percent))
  ) {
    return <span>Not available</span>;
  }

  const actualPercent = Number(percent);
  const value = Math.min(Math.max(actualPercent, 0), 100);

  return (
    <div>
      <div
        style={{
          height: "10px",
          backgroundColor: "#e5e7eb",
          borderRadius: "999px",
          overflow: "hidden",
          margin: "8px 0",
        }}
      >
        <div
          style={{
            width: `${value}%`,
            height: "100%",
            backgroundColor:
              value >= 90 ? "#dc2626" : value >= 75 ? "#f97316" : "#16a34a",
          }}
        />
      </div>
      <strong>{actualPercent.toFixed(2)}% used</strong>
    </div>
  );
};

const defaultAccountBadges = (account) => {
  const badges = [];

  if (account.isDefaultDepositAccount) badges.push("Default Deposit");
  if (account.isDefaultExpenseAccount) badges.push("Default Expense");
  if (account.isDefaultPayrollAccount) badges.push("Default Payroll");
  if (account.isDefaultCustomerReceiptAccount) badges.push("Default Receipt");
  if (account.isBusinessSavings) badges.push("Business Savings");

  if (badges.length === 0) return "—";

  return (
    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
      {badges.map((badge) => (
        <span
          key={badge}
          style={{
            backgroundColor: "#eef4ff",
            color: ROYAL_BLUE,
            border: `1px solid ${BORDER}`,
            borderRadius: "999px",
            padding: "4px 8px",
            fontSize: "12px",
            fontWeight: "bold",
          }}
        >
          {badge}
        </span>
      ))}
    </div>
  );
};

const creditCardAccounts = accounts.filter(
  (account) => account.accountType === "Credit Card"
);

const savingsAccounts = accounts.filter(
  (account) => account.isBusinessSavings || account.accountPurpose === "Savings"
);

const totalAvailableCredit = creditCardAccounts.reduce(
  (sum, account) =>
    sum +
    Number(account.calculatedAvailableCredit ?? account.availableCredit ?? 0),
  0
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
          Manage revenue, expenses, reports, accounts, and transactions.
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

        <button
          style={tabButtonStyle("positionAdjustments")}
          onClick={() => setActiveTab("positionAdjustments")}
        >
          Position Adjustments
        </button>
      </div>

            {financeReferenceErrors.length > 0 && (
  <p role="alert" style={{ color: "#b91c1c" }}>
    Supporting lists could not be loaded:{" "}
    {financeReferenceErrors.join(", ")}.
    Their records may not be displayed.
    Refresh or check your access.
  </p>
)}

{activeTab === "dashboard" && (
  <FinanceDashboard
    summary={summary}
    summaryFilter={summaryFilter}
    summaryBranch={summaryBranch}
    setSummaryFilter={(value) => {
      summaryRequestId.current += 1;
      setSummary(null);
      setSummaryError("");
      setSummaryLoading(true);
      setSummaryFilter(value);
    }}
    setSummaryBranch={(value) => {
      summaryRequestId.current += 1;
      setSummary(null);
      setSummaryError("");
      setSummaryLoading(true);
      setSummaryBranch(value);
    }}
    fetchFinanceData={fetchFinanceData}
    setActiveTab={setActiveTab}
    onOpenReport={openDashboardReport}
    summaryLoading={summaryLoading}
    summaryError={summaryError}
    cardStyle={cardStyle}
    metricCardStyle={metricCardStyle}
    ROYAL_BLUE={ROYAL_BLUE}
    GOLD={GOLD}
    BORDER={BORDER}
  />
)}

      {activeTab === "expenses" && (
        <>
          <div style={{ ...cardStyle, marginBottom: "24px" }}>
            <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>Add Expense</h2>
            {canManageExpenseCategories && (
  <ExpenseCategoryManager
    onSaved={handleExpenseCategorySaved}
  />
)}

{expenseCategoriesLoading && (
  <p role="status">Loading your expense categories…</p>
)}

{expenseCategoryError && (
  <div role="alert" style={{ color: "#b91c1c" }}>
    <p>{expenseCategoryError}</p>
    <button
      type="button"
      onClick={() => fetchExpenseCategories()}
    >
      Retry Category Loading
    </button>
  </div>
)}

{expenseCategoryIssues.length > 0 && (
  <div style={{ color: "#92400e", marginBottom: 12 }}>
    <strong>Categories requiring mapping review:</strong>
    <ul>
      {expenseCategoryIssues.map((item) => (
        <li key={item._id}>
          {item.category}: {item.mappingIssue}
        </li>
      ))}
    </ul>
  </div>
)}

{!expenseCategoriesLoading &&
  !expenseCategoryError &&
  expenseCategories.length === 0 && (
    <p>
      {canManageExpenseCategories
        ? "No usable categories are available. Create your own category above or correct its ledger mapping."
        : "No usable categories are available. Ask Admin to create or review them."}
    </p>
  )}
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
  disabled={
    expenseCategoriesLoading ||
    expenseCategories.length === 0
  }
  style={{ padding: "10px" }}
>
  <option value="">
    {expenseCategoriesLoading
      ? "Loading Your Categories…"
      : "Select Your Expense Category"}
  </option>

  {expenseCategories.map((item) => (
    <option key={item._id} value={item.category}>
      {item.category}
    </option>
  ))}
</select>

                            {expenseForm.category && (
                <div
                  style={{
                    gridColumn: "span 2",
                    padding: "12px",
                    borderRadius: "10px",
                    border: `1px solid ${BORDER}`,
                    backgroundColor:
                      getExpenseCategoryPreview(expenseForm.category)
                        .classification === "Cost of Goods Sold"
                        ? "#fff7ed"
                        : "#f8fbff",
                    fontWeight: "bold",
                  }}
                >
                                    Classification:{" "}
                  {getExpenseCategoryPreview(expenseForm.category).classification}
                  {" | "}
                  Group: {getExpenseCategoryPreview(expenseForm.category).group}
                  {" | "}
                  Posting To:{" "}
                  {getExpenseCategoryPreview(expenseForm.category).accountCode} —{" "}
                  {getExpenseCategoryPreview(expenseForm.category).accountName}
                </div>
              )}

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

              <input
  type="text"
  value="Paid"
  readOnly
  aria-label="Payment status"
  style={{
    padding: "10px",
    backgroundColor: "#f1f5f9",
    color: "#334155",
  }}
/>

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
              disabled={
  expenseCategoriesLoading ||
  Boolean(expenseCategoryError) ||
  expenseCategories.length === 0
}
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
                    <th>Classification</th>
                    <th>Group</th>
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
                        <td>
                          {expense.expenseClassification ||
                            getExpenseCategoryPreview(expense.category)
                              .classification}
                        </td>
                        <td>
                          {expense.expenseGroup ||
                            getExpenseCategoryPreview(expense.category).group}
                        </td>
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
                      <td colSpan="10">No expense records found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === "reports" && (
  <FinanceReportView
    reports={reports}
    filters={reportFilters}
    setFilters={setReportFilters}
    onApply={fetchReports}
    onClear={clearReports}
    onExport={downloadSingleReportPdf}
    loading={reportLoading}
    error={reportError}
    cardStyle={cardStyle}
  />
)}
            {activeTab === "accounts" && (
        <>
          <div style={{ ...cardStyle, marginBottom: "24px" }}>
            <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>
              {isEditingAccount ? "Edit Financial Account" : "Create Financial Account"}
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
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

              <input
                type="text"
                name="accountNickname"
                placeholder="Nickname"
                value={accountForm.accountNickname}
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

              <select
                name="accountPurpose"
                value={accountForm.accountPurpose}
                onChange={handleAccountChange}
                style={{ padding: "10px" }}
              >
                <option value="Operating">Operating</option>
                <option value="Savings">Savings</option>
                <option value="Payroll">Payroll</option>
                <option value="Tax">Tax</option>
                <option value="Petty Cash">Petty Cash</option>
                <option value="Float">Float</option>
                <option value="Dropbox">Dropbox</option>
                <option value="Investment">Investment</option>
                <option value="Reserve">Reserve</option>
                <option value="Credit Card">Credit Card</option>
              </select>

              <input
                type="text"
                name="financialInstitution"
                placeholder="Financial Institution"
                value={accountForm.financialInstitution}
                onChange={handleAccountChange}
                style={{ padding: "10px" }}
              />

              <input
                type="text"
                name="bankName"
                placeholder="Bank Name / Issuer"
                value={accountForm.bankName}
                onChange={handleAccountChange}
                style={{ padding: "10px" }}
              />

              <select
                name="branchName"
                value={accountForm.branchName}
                onChange={handleAccountChange}
                style={{ padding: "10px" }}
              >
                <option value="">No Branch / Company-wide</option>
                <option value="Eltham Park">Eltham Park</option>
                <option value="Brown's Town Square">Brown's Town Square</option>
                <option value="Browns Town Square">Browns Town Square</option>
              </select>

              <input
                type="number"
                name="openingBalance"
                placeholder="Opening Balance"
                value={accountForm.openingBalance}
                onChange={handleAccountChange}
                disabled={isEditingAccount}
                style={{
                  padding: "10px",
                  backgroundColor: isEditingAccount ? "#f8fafc" : WHITE,
                }}
              />

              <input
                type="number"
                name="currentBalance"
                placeholder="Current Balance"
                value={accountForm.currentBalance}
                onChange={handleAccountChange}
                disabled
                style={{ padding: "10px", backgroundColor: "#f8fafc" }}
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

              <select
                name="status"
                value={accountForm.status}
                onChange={handleAccountChange}
                style={{ padding: "10px" }}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            {accountForm.accountType === "Credit Card" && (
              <div
                style={{
                  marginTop: "18px",
                  padding: "14px",
                  borderRadius: "12px",
                  border: `1px solid ${BORDER}`,
                  backgroundColor: "#f8fbff",
                }}
              >
                <h3 style={{ marginTop: 0, color: ROYAL_BLUE }}>
                  Credit Card Details
                </h3>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "14px",
                  }}
                >
                  <input
                    type="number"
                    name="creditLimit"
                    placeholder="Credit Limit"
                    value={accountForm.creditLimit}
                    onChange={handleAccountChange}
                    style={{ padding: "10px" }}
                  />

                  <input
                    type="number"
                    name="availableCredit"
                    placeholder="Available Credit"
                    value={accountForm.availableCredit}
                    onChange={handleAccountChange}
                    style={{ padding: "10px" }}
                  />

                  <input
                    type="number"
                    name="statementDate"
                    placeholder="Statement Day e.g. 26"
                    value={accountForm.statementDate}
                    onChange={handleAccountChange}
                    style={{ padding: "10px" }}
                  />

                  <input
                    type="number"
                    name="paymentDueDate"
                    placeholder="Payment Due Day e.g. 20"
                    value={accountForm.paymentDueDate}
                    onChange={handleAccountChange}
                    style={{ padding: "10px" }}
                  />

                  <input
                    type="number"
                    name="minimumPayment"
                    placeholder="Minimum Payment"
                    value={accountForm.minimumPayment}
                    onChange={handleAccountChange}
                    style={{ padding: "10px" }}
                  />

                  <input
                    type="number"
                    name="interestRate"
                    placeholder="Interest Rate %"
                    value={accountForm.interestRate}
                    onChange={handleAccountChange}
                    style={{ padding: "10px" }}
                  />

                  <input
                    type="number"
                    name="lastStatementBalance"
                    placeholder="Last Statement Balance"
                    value={accountForm.lastStatementBalance}
                    onChange={handleAccountChange}
                    style={{ padding: "10px" }}
                  />
                </div>
              </div>
            )}

            <div
              style={{
                marginTop: "18px",
                padding: "14px",
                borderRadius: "12px",
                border: `1px solid ${BORDER}`,
                backgroundColor: "#fffdf2",
              }}
            >
              <h3 style={{ marginTop: 0, color: ROYAL_BLUE }}>
                Account Defaults
              </h3>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "12px",
                }}
              >
                {[
                  ["isDefaultDepositAccount", "Default Deposit Account"],
                  ["isDefaultExpenseAccount", "Default Expense Account"],
                  ["isDefaultPayrollAccount", "Default Payroll Account"],
                  [
                    "isDefaultCustomerReceiptAccount",
                    "Default Customer Receipt Account",
                  ],
                  ["isBusinessSavings", "Business Savings Account"],
                ].map(([name, label]) => (
                  <label
                    key={name}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontWeight: "bold",
                    }}
                  >
                    <input
                      type="checkbox"
                      name={name}
                      checked={Boolean(accountForm[name])}
                      onChange={handleAccountChange}
                    />
                    {label}
                  </label>
                ))}
              </div>
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
              <div style={{ fontSize: "30px", fontWeight: "bold", color: ROYAL_BLUE }}>
                {accounts.length}
              </div>
              <div style={{ color: "#334155", fontWeight: "bold" }}>
                Total Accounts
              </div>
            </div>

            <div style={metricCardStyle}>
              <div style={{ fontSize: "30px", fontWeight: "bold", color: "#16a34a" }}>
                {formatCurrency(totalCashAndBankBalances)}
              </div>
              <div style={{ color: "#334155", fontWeight: "bold" }}>
                Cash / Bank Position
              </div>
            </div>

            <div style={metricCardStyle}>
              <div style={{ fontSize: "30px", fontWeight: "bold", color: "#dc2626" }}>
                {formatCurrency(totalCreditCardBalances)}
              </div>
              <div style={{ color: "#334155", fontWeight: "bold" }}>
                Credit Card Outstanding
              </div>
            </div>

            <div style={metricCardStyle}>
              <div style={{ fontSize: "30px", fontWeight: "bold", color: GOLD }}>
                {formatCurrency(totalAvailableCredit)}
              </div>
              <div style={{ color: "#334155", fontWeight: "bold" }}>
                Available Credit
              </div>
            </div>
          </div>

          {creditCardAccounts.length > 0 && (
            <div style={{ ...cardStyle, marginBottom: "24px" }}>
              <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>
                Credit Card Intelligence
              </h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                  gap: "16px",
                }}
              >
                {creditCardAccounts.map((account) => (
                  <div
                    key={account._id}
                    style={{
                      border: `1px solid ${BORDER}`,
                      borderRadius: "14px",
                      padding: "16px",
                      backgroundColor: "#f8fbff",
                    }}
                  >
                    <h3 style={{ marginTop: 0, color: ROYAL_BLUE }}>
                      {account.accountName}
                    </h3>

                    <div style={{ color: MUTED, marginBottom: "10px" }}>
                      {account.financialInstitution || account.bankName || "Credit Card"}
                    </div>

                                        <div style={{ display: "grid", gap: "10px" }}>
                      {utilizationBar(account.creditUtilization)}

                      <strong>
                        Outstanding: {formatCurrency(account.outstandingBalance)}
                      </strong>

                      <strong>
                        Available:{" "}
                        {formatCurrency(
                          account.calculatedAvailableCredit ??
                            account.availableCredit
                        )}
                      </strong>

                      <strong>
                        Credit Limit: {formatCurrency(account.creditLimit)}
                      </strong>

                      <strong>
                        Payment Due:{" "}
                        {account.paymentDueDate
                          ? `${account.paymentDueDate}th (${getDayCountdown(
                              account.paymentDueDate
                            )})`
                          : "—"}
                      </strong>

                      <strong>
                        Statement Closes:{" "}
                        {account.statementDate
                          ? `${account.statementDate}th (${getDayCountdown(
                              account.statementDate
                            )})`
                          : "—"}
                      </strong>

                      <div>{treasuryHealthBadge(account.accountHealth)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {savingsAccounts.length > 0 && (
            <div style={{ ...cardStyle, marginBottom: "24px" }}>
              <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>
                Savings Accounts
              </h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: "16px",
                }}
              >
                {savingsAccounts.map((account) => (
                  <div
                    key={account._id}
                    style={{
                      border: `1px solid ${BORDER}`,
                      borderRadius: "14px",
                      padding: "16px",
                      backgroundColor: "#fffdf2",
                    }}
                  >
                    <h3 style={{ marginTop: 0, color: ROYAL_BLUE }}>
                      {account.accountName}
                    </h3>
                    <div style={{ color: MUTED, marginBottom: "8px" }}>
                      {account.currency || "JMD"} Savings
                    </div>
                    <strong>
                      Native Balance:{" "}
                      {account.currency || "JMD"}{" "}
                      {Number(account.currentBalance || 0).toLocaleString(
                        undefined,
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }
                      )}
                    </strong>
                    <br />
                    <strong>
                      JMD Equivalent: {formatCurrency(account.baseCurrencyBalance)}
                    </strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>
              Financial Accounts
            </h2>

            <div style={{ overflowX: "auto" }}>
              <table
                border="1"
                cellPadding="10"
                style={{
                  minWidth: "2100px",
                  width: "100%",
                  borderCollapse: "collapse",
                }}
              >
                <thead style={{ backgroundColor: "#eef4ff" }}>
                  <tr>
                    <th>Account Number</th>
                    <th>Account</th>
                    <th>Purpose</th>
                    <th>Type</th>
                    <th>Institution</th>
                    <th>Branch</th>
                    <th>Native Balance</th>
                    <th>JMD Equivalent</th>
                    <th>Credit Limit</th>
                    <th>Available Credit</th>
                    <th>Utilization</th>
                    <th>Statement</th>
                    <th>Due</th>
                    <th>Recon</th>
                    <th>Health</th>
                    <th>Defaults</th>
                    <th>Status</th>
                    <th>Last Adjustment</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {accounts.length > 0 ? (
                    accounts.map((account) => (
                      <tr key={account._id}>
                        <td>{account.accountNumber}</td>
                        <td>
                          <strong>{account.accountName}</strong>
                          <br />
                          <span style={{ color: MUTED }}>
                            {account.accountNickname || "—"}
                          </span>
                        </td>
                        <td>{account.accountPurpose || "Operating"}</td>
                        <td>{account.accountType}</td>
                        <td>
                          {account.financialInstitution || account.bankName || "—"}
                        </td>
                        <td>{account.branchName || "—"}</td>
                        <td>
                          {account.currency || "JMD"}{" "}
                          {Number(account.currentBalance || 0).toLocaleString(
                            undefined,
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}
                        </td>
                        <td>{formatCurrency(account.baseCurrencyBalance)}</td>
                        <td>
                          {account.accountType === "Credit Card"
                            ? formatCurrency(account.creditLimit)
                            : "—"}
                        </td>
                        <td>
                          {account.accountType === "Credit Card"
                            ? formatCurrency(
                                account.calculatedAvailableCredit ??
                                  account.availableCredit
                              )
                            : "—"}
                        </td>
                        <td>
                          {account.accountType === "Credit Card"
                            ? `${Number(account.creditUtilization || 0).toFixed(2)}%`
                            : "—"}
                        </td>
                        <td>
                          {account.statementDate
                            ? `${account.statementDate}th`
                            : "—"}
                        </td>
                        <td>
                          {account.paymentDueDate
                            ? `${account.paymentDueDate}th`
                            : "—"}
                        </td>
                        <td>{account.reconciliationStatus || "Never Reconciled"}</td>
                        <td>{account.accountHealth || "Healthy"}</td>
                        <td>{defaultAccountBadges(account)}</td>
                        <td>{statusBadge(account.status)}</td>
                        <td>{account.lastAdjustmentBatch || "—"}</td>
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
                      <td colSpan="19">No financial accounts found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

            {activeTab === "positionAdjustments" && (
        <>
          <div style={{ ...cardStyle, marginBottom: "24px" }}>
            <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>
              Financial Position Adjustment Wizard
            </h2>
            <p style={{ color: MUTED }}>
              Use this wizard to align EKOS balances with actual cash, bank, and credit card balances without reopening closed periods.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "14px",
                marginBottom: "18px",
              }}
            >
              <input
                type="date"
                value={adjustmentForm.effectiveDate}
                onChange={(e) =>
                  setAdjustmentForm((prev) => ({
                    ...prev,
                    effectiveDate: e.target.value,
                  }))
                }
                style={{ padding: "10px" }}
              />

              <input
                type="text"
                placeholder="Adjustment Reason"
                value={adjustmentForm.adjustmentReason}
                onChange={(e) =>
                  setAdjustmentForm((prev) => ({
                    ...prev,
                    adjustmentReason: e.target.value,
                  }))
                }
                style={{ padding: "10px" }}
              />

              <input
                type="text"
                placeholder="Description"
                value={adjustmentForm.description}
                onChange={(e) =>
                  setAdjustmentForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                style={{ padding: "10px" }}
              />
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button
                onClick={seedJulyActualBalances}
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
                Load July 5 Actual Balances
              </button>

              <button
                onClick={previewFinancialPosition}
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
                Preview Differences
              </button>

              <button
                onClick={createAdjustmentBatch}
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
                Create Adjustment Batch
              </button>
            </div>
          </div>

          <div style={{ ...cardStyle, marginBottom: "24px" }}>
            <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>
              Account Balance Review
            </h2>

            <div style={{ overflowX: "auto" }}>
              <table
                border="1"
                cellPadding="10"
                style={{
                  minWidth: "1500px",
                  width: "100%",
                  borderCollapse: "collapse",
                }}
              >
                <thead style={{ backgroundColor: "#eef4ff" }}>
                  <tr>
                    <th>Account Number</th>
                    <th>Account</th>
                    <th>Type</th>
                    <th>Currency</th>
                    <th>Ledger Balance</th>
                    <th>Actual Balance</th>
                    <th>JMD Ledger</th>
                    <th>JMD Actual</th>
                    <th>Difference</th>
                    <th>Notes</th>
                  </tr>
                </thead>

                <tbody>
                  {(adjustmentPreview.length > 0 ? adjustmentPreview : accounts).map(
                    (account) => {
                      const accountNumber = account.accountNumber;
                      const actualValue =
                        actualBalances[accountNumber]?.actualBalance ??
                        account.actualBalance ??
                        account.currentBalance ??
                        "";

                      const difference =
                        account.difference !== undefined
                          ? Number(account.difference || 0)
                          : 0;

                      return (
                        <tr key={accountNumber}>
                          <td>{accountNumber}</td>
                          <td>{account.accountName}</td>
                          <td>{account.accountType}</td>
                          <td>{account.currency || "JMD"}</td>
                          <td>
                            {account.currency || "JMD"}{" "}
                            {Number(
                              account.ledgerBalance ??
                                account.currentBalance ??
                                0
                            ).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td>
                            <input
                              type="number"
                              step="0.01"
                              value={actualValue}
                              onChange={(e) =>
                                setActualBalances((prev) => ({
                                  ...prev,
                                  [accountNumber]: {
                                    ...(prev[accountNumber] || {}),
                                    actualBalance: e.target.value,
                                  },
                                }))
                              }
                              style={{ padding: "8px", width: "140px" }}
                            />
                          </td>
                          <td>{formatCurrency(account.ledgerBaseBalance)}</td>
                          <td>{formatCurrency(account.actualBaseBalance)}</td>
                          <td
                            style={{
                              fontWeight: "bold",
                              color:
                                Number(difference || 0) === 0
                                  ? MUTED
                                  : Number(difference || 0) > 0
                                  ? "#16a34a"
                                  : "#dc2626",
                            }}
                          >
                            {formatCurrency(difference)}
                          </td>
                          <td>
                            <input
                              type="text"
                              value={
                                actualBalances[accountNumber]?.notes ||
                                account.notes ||
                                ""
                              }
                              onChange={(e) =>
                                setActualBalances((prev) => ({
                                  ...prev,
                                  [accountNumber]: {
                                    ...(prev[accountNumber] || {}),
                                    notes: e.target.value,
                                  },
                                }))
                              }
                              style={{ padding: "8px", minWidth: "260px" }}
                            />
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>
              Adjustment Batches
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
                    <th>Batch Number</th>
                    <th>Effective Date</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Journal Entry</th>
                    <th>Lines</th>
                    <th>Created By</th>
                    <th>Posted By</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {adjustmentBatches.length > 0 ? (
                    adjustmentBatches.map((batch) => (
                      <tr key={batch._id}>
                        <td>{batch.batchNumber}</td>
                        <td>{batch.effectiveDate}</td>
                        <td>{batch.adjustmentReason}</td>
                        <td>{statusBadge(batch.status)}</td>
                        <td>{batch.journalEntryNumber || "—"}</td>
                        <td>{batch.lines?.length || 0}</td>
                        <td>{batch.createdBy}</td>
                        <td>{batch.postedBy || "—"}</td>
                        <td>
                                                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            <button
                              disabled={batch.status !== "Draft"}
                              onClick={() => postAdjustmentBatch(batch.batchNumber)}
                              style={{
                                backgroundColor:
                                  batch.status === "Draft" ? "#16a34a" : "#94a3b8",
                                color: WHITE,
                                border: "none",
                                padding: "8px 12px",
                                borderRadius: "8px",
                                cursor:
                                  batch.status === "Draft"
                                    ? "pointer"
                                    : "not-allowed",
                                fontWeight: "bold",
                              }}
                            >
                              Post
                            </button>

                                                        {batch.status === "Draft" && (
                              <button
                                onClick={() =>
                                  deleteDraftAdjustmentBatch(batch.batchNumber)
                                }
                                style={{
                                  backgroundColor: "#dc2626",
                                  color: WHITE,
                                  border: "none",
                                  padding: "8px 12px",
                                  borderRadius: "8px",
                                  cursor: "pointer",
                                  fontWeight: "bold",
                                }}
                              >
                                Delete Draft
                              </button>
                            )}

                            {batch.status === "Posted" && (
                              <span style={{ color: MUTED, fontWeight: "bold" }}>
                                Posted / Locked
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9">No adjustment batches found.</td>
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