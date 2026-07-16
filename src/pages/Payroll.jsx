import { useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import api from "../api";
import { useAuth } from "../context/AuthContext";

const EMPTY_FORM = {
  employeeId: "",
  employeeName: "",
  role: "",
  payPeriod: "",
  grossPay: "",
  status: "Pending",
  compensationType: "Salary",
  statutoryTreatment: "Standard",
  targetNetPay: "",
  exemptionReason: "",
  exemptionLegalBasis: "",
  exemptionSupportingReference: "",
  exemptionSupportingDocumentUrl: "",
  exemptionEffectiveFrom: "",
  exemptionEffectiveTo: "",
  pensionEmployee: "",
  paidFromAccountNumber: "",
};

const EMPTY_ATTENDANCE = {
  totalDays: 0,
  totalWorkedMinutes: 0,
  totalLunchMinutes: 0,
  totalWorkedLabel: "0h 0m",
  totalLunchLabel: "0h 0m",
};

const EMPTY_REGISTER_FILTERS = {
  search: "",
  employeeId: "",
  status: "",
  periodFrom: "",
  periodTo: "",
  compensationType: "",
  statutoryTreatment: "",
  legacy: "",
};

const ROYAL_BLUE = "#0B3D91";
const WHITE = "#FFFFFF";
const BORDER = "#dbe3ef";
const MUTED = "#64748b";

const roundMoney = (value) =>
  Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

const formatCurrency = (value, currency = "JMD") =>
  `${currency} ${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toISOString().slice(0, 10);
};

const getJamaicaToday = () => {
  const parts = new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: "America/Jamaica",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }
  ).formatToParts(new Date());

  const values = {};

  for (const part of parts) {
    if (part.type !== "literal") {
      values[part.type] = part.value;
    }
  }

  return `${values.year}-${values.month}-${values.day}`;
};

const isScheduledPayDateAvailable = (payDate) => {
  const scheduledDate = formatDate(payDate);

  if (!scheduledDate) return false;

  return getJamaicaToday() >= scheduledDate;
};

const getMonthDateRange = (monthValue) => {
  if (!monthValue) return { startDate: "", endDate: "" };

  const [year, month] = String(monthValue).split("-");
  const lastDay = new Date(Number(year), Number(month), 0).getDate();

  return {
    startDate: `${year}-${month}-01`,
    endDate: `${year}-${month}-${String(lastDay).padStart(2, "0")}`,
  };
};

function Payroll() {
  const { user } = useAuth();

  const [payroll, setPayroll] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [attendance, setAttendance] = useState(EMPTY_ATTENDANCE);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [previewLoading, setPreviewLoading] = useState(false);
  const [actionPayrollNumber, setActionPayrollNumber] =
    useState("");
  const [error, setError] = useState("");
    const [registerTotals, setRegisterTotals] = useState(null);

const [registerRecords, setRegisterRecords] = useState([]);

const [registerFilters, setRegisterFilters] = useState(
  EMPTY_REGISTER_FILTERS
);

const [registerLoading, setRegisterLoading] = useState(false);

const [registerPage, setRegisterPage] = useState(1);

const [recognizedLiabilities, setRecognizedLiabilities] =
  useState(0);

const [ytdEmployeeId, setYtdEmployeeId] = useState("");

const [ytdYear, setYtdYear] = useState(
  String(new Date().getFullYear())
);

const [includeApprovedYtd, setIncludeApprovedYtd] =
  useState(true);

const [ytdReport, setYtdReport] = useState(null);

const [ytdLoading, setYtdLoading] = useState(false);

  const canApprovePayroll =
    user?.role === "Admin" ||
    (user?.permissions || []).includes("payrollApprove");

    const emptyPreview = {
        grossPay: 0,
    scheduledPayDate: "",
    payDate: "",
    compensationType: "Salary",
    statutoryTreatment: "Standard",
    applyEmployeeStatutoryDeductions: true,
    applyEmployerStatutoryContributions: true,
    targetNetPay: 0,
    employerSupportAllowance: 0,
    nisEmployee: 0,
    nhtEmployee: 0,
    educationTax: 0,
    incomeTax: 0,
    pensionEmployee: 0,
    totalDeductions: 0,
    netPayBeforeAdvance: 0,
    advanceRecovery: 0,
    netPay: 0,
    nisEmployer: 0,
    nhtEmployer: 0,
    educationTaxEmployer: 0,
    heartEmployer: 0,
    totalEmployerContributions: 0,
    totalPayrollCost: 0,
    statutoryRuleCode: "",
    advanceRecoveries: [],
    minimumWageAssessment: {
      applicable: true,
      hourlyRate: 0,
      workedHours: 0,
      minimumGrossPay: 0,
      assessedGrossPay: 0,
      shortfall: 0,
      compliant: true,
      warning: "",
      ruleCode: "",
    },
  };

  const [preview, setPreview] =
    useState(emptyPreview);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    pages: 1,
    total: 0,
  });

      useEffect(() => {
    const grossPay = Number(form.grossPay || 0);

    if (
      !form.employeeId ||
      !form.payPeriod ||
      grossPay <= 0
    ) {
      setPreview(emptyPreview);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setPreviewLoading(true);
        setError("");

        const res = await api.post(
          "/api/payroll/preview",
          {
            employeeId: form.employeeId,
            grossPay,
            pensionEmployee: Number(
              form.pensionEmployee || 0
            ),
            payPeriod: form.payPeriod,
            payFrequency: "Monthly",
            compensationType:
              form.compensationType,
            statutoryTreatment:
              form.statutoryTreatment,
            targetNetPay: Number(
              form.targetNetPay || 0
            ),
            statutoryExemption: {
              reason:
                form.exemptionReason,
              legalBasis:
                form.exemptionLegalBasis,
              supportingReference:
                form.exemptionSupportingReference,
              supportingDocumentUrl:
                form.exemptionSupportingDocumentUrl,
              effectiveFrom:
                form.exemptionEffectiveFrom || null,
              effectiveTo:
                form.exemptionEffectiveTo || null,
            },
            workedHours: roundMoney(
              Number(
                attendance.totalWorkedMinutes || 0
              ) / 60
            ),
            minimumWageApplicable: true,
            applyEmployeeAdvances: true,
          }
        );

        setPreview(res.data?.data || emptyPreview);
      } catch (previewError) {
        console.error(
          "Could not calculate Payroll preview:",
          previewError
        );

        setError(
          previewError?.response?.data?.message ||
            "Could not calculate Payroll preview."
        );
      } finally {
        setPreviewLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [
    form.employeeId,
    form.grossPay,
    form.pensionEmployee,
    form.payPeriod,
    form.compensationType,
    form.statutoryTreatment,
    form.targetNetPay,
    form.exemptionReason,
    form.exemptionLegalBasis,
    form.exemptionSupportingReference,
    form.exemptionSupportingDocumentUrl,
    form.exemptionEffectiveFrom,
    form.exemptionEffectiveTo,
    attendance.totalWorkedMinutes,
  ]);

    const pageTotals = useMemo(
    () =>
      payroll
        .filter(
          (item) =>
            !["Cancelled", "Reversed"].includes(
              item.status
            )
        )
        .reduce(
          (sum, item) => ({
            grossPay:
              sum.grossPay +
              Number(item.grossPay || 0),
            totalDeductions:
              sum.totalDeductions +
              Number(
                item.totalDeductions ??
                  item.deductions ??
                  0
              ),
            netPay:
              sum.netPay +
              Number(item.netPay || 0),
          }),
          {
            grossPay: 0,
            totalDeductions: 0,
            netPay: 0,
          }
        ),
    [payroll]
  );

  const totals =
    registerTotals || pageTotals;

    const registerPageSize = Number(
  pagination.limit || 10
);

const registerPages = Math.max(
  1,
  Math.ceil(
    registerRecords.length /
      registerPageSize
  )
);

const visibleRegisterRecords = useMemo(() => {
  const firstRecord =
    (registerPage - 1) *
    registerPageSize;

  return registerRecords.slice(
    firstRecord,
    firstRecord + registerPageSize
  );
}, [
  registerRecords,
  registerPage,
  registerPageSize,
]);

  const loadReferenceData = async () => {
    const [employeeRes, accountRes] = await Promise.all([
      api.get("/api/hr"),
      api.get("/api/financial-accounts"),
    ]);

    setEmployees(employeeRes.data?.data || []);
    setAccounts(accountRes.data?.data || []);
  };

  const loadPayroll = async (page = pagination.page, limit = pagination.limit) => {
    const res = await api.get(`/api/payroll?page=${page}&limit=${limit}`);
    setPayroll(res.data?.data || []);
    setPagination((previous) => ({
      ...previous,
      ...(res.data?.pagination || {}),
      page,
      limit,
    }));
  };

    const loadPayrollRegister = async (
  filters = registerFilters
) => {
  try {
    setRegisterLoading(true);

    const params = new URLSearchParams({
      limit: "1000",
    });

    Object.entries(filters || {}).forEach(
      ([key, value]) => {
        const normalizedValue = String(
          value ?? ""
        ).trim();

        if (normalizedValue) {
          params.set(key, normalizedValue);
        }
      }
    );

    const paidParams = new URLSearchParams(
      params
    );

    paidParams.set("status", "Paid");

    const [registerRes, paidRes] =
      await Promise.all([
        api.get(
          `/api/payroll/reports/register?${params.toString()}`
        ),
        api.get(
          `/api/payroll/reports/register?${paidParams.toString()}`
        ),
      ]);

    const register =
      registerRes.data?.totals || {};

    const paidRegister =
      paidRes.data?.totals || {};

    setRegisterRecords(
      registerRes.data?.data || []
    );

    setRegisterPage(1);

    setRecognizedLiabilities(
      Number(
        paidRegister
          ?.governmentLiabilities
          ?.total || 0
      )
    );

    setRegisterTotals({
      recordCount: Number(
        register.recordCount || 0
      ),
      legacyRecordCount: Number(
        register.legacyRecordCount || 0
      ),
      statusCounts:
        register.statusCounts || {},
      grossPay: Number(
        register.grossPay || 0
      ),
      totalDeductions: Number(
        register.totalEmployeeDeductions || 0
      ),
      netPay: Number(
        register.netPay || 0
      ),
      advanceRecovery: Number(
        register.advanceRecovery || 0
      ),
      totalEmployerContributions: Number(
        register.totalEmployerContributions || 0
      ),
      totalPayrollCost: Number(
        register.totalPayrollCost || 0
      ),
      governmentLiabilities:
        register.governmentLiabilities || {
          nis: 0,
          nht: 0,
          educationTax: 0,
          paye: 0,
          heart: 0,
          pension: 0,
          total: 0,
        },
    });
  } finally {
    setRegisterLoading(false);
  }
};



const updateRegisterFilter = (
  field,
  value
) => {
  setRegisterFilters((current) => ({
    ...current,
    [field]: value,
  }));
};

const applyRegisterFilters = async () => {
  try {
    setError("");
    await loadPayrollRegister(registerFilters);
  } catch (filterError) {
    console.error(
      "Could not filter Payroll register:",
      filterError
    );

    setError(
      filterError?.response?.data?.message ||
        "Could not filter Payroll register."
    );
  }
};

const clearRegisterFilters = async () => {
  try {
    setError("");

    setRegisterFilters(
      EMPTY_REGISTER_FILTERS
    );

    await loadPayrollRegister(
      EMPTY_REGISTER_FILTERS
    );
  } catch (filterError) {
    console.error(
      "Could not reset Payroll register:",
      filterError
    );

    setError(
      filterError?.response?.data?.message ||
        "Could not reset Payroll register."
    );
  }
};

const loadEmployeeYtd = async () => {
  if (!ytdEmployeeId) {
    alert(
      "Select an employee before generating the YTD report."
    );
    return;
  }

  try {
    setYtdLoading(true);
    setError("");

    const params = new URLSearchParams({
      year: ytdYear,
      includeApproved: String(
        includeApprovedYtd
      ),
    });

    const res = await api.get(
      `/api/payroll/reports/ytd/${encodeURIComponent(
        ytdEmployeeId
      )}?${params.toString()}`
    );

    setYtdReport(res.data || null);
  } catch (reportError) {
    console.error(
      "Could not generate employee YTD report:",
      reportError
    );

    const message =
      reportError?.response?.data?.message ||
      "Could not generate employee YTD report.";

    setError(message);
    alert(message);
  } finally {
    setYtdLoading(false);
  }
};

const escapeCsvValue = (value) => {
  const normalized = String(
    value ?? ""
  ).replace(/"/g, '""');

  return `"${normalized}"`;
};

const exportPayrollRegisterCsv = () => {
  if (!registerRecords.length) {
    alert(
      "There are no Payroll records to export."
    );
    return;
  }

  const headings = [
    "Payroll Number",
    "Employee ID",
    "Employee",
    "Role",
    "Pay Period",
    "Pay Date",
    "Compensation Type",
    "Statutory Treatment",
    "Gross Pay",
    "NIS Employee",
    "NHT Employee",
    "Education Tax Employee",
    "PAYE",
    "Pension Employee",
    "Total Employee Deductions",
    "Net Before Advance",
    "Advance Recovery",
    "Net Pay",
    "NIS Employer",
    "NHT Employer",
    "Education Tax Employer",
    "HEART Employer",
    "Total Employer Contributions",
    "Total Employment Cost",
    "Payment Account",
    "Status",
    "Compliance",
    "Minimum Wage Shortfall",
  ];

  const rows = registerRecords.map(
    (item) => [
      item.payrollNumber,
      item.employeeId,
      item.employeeName,
      item.role,
      item.payPeriod,
      formatDate(item.payDate),
      item.compensationType || "Legacy",
      item.statutoryTreatment || "Legacy",
      roundMoney(item.grossPay),
      roundMoney(item.nisEmployee),
      roundMoney(item.nhtEmployee),
      roundMoney(item.educationTax),
      roundMoney(item.incomeTax),
      roundMoney(item.pensionEmployee),
      roundMoney(
        item.totalDeductions ??
          item.deductions
      ),
      roundMoney(
        item.netPayBeforeAdvance ??
          item.netPay
      ),
      roundMoney(item.advanceRecovery),
      roundMoney(item.netPay),
      roundMoney(item.nisEmployer),
      roundMoney(item.nhtEmployer),
      roundMoney(
        item.educationTaxEmployer
      ),
      roundMoney(item.heartEmployer),
      roundMoney(
        item.totalEmployerContributions
      ),
      roundMoney(
        item.totalPayrollCost ??
          Number(item.grossPay || 0) +
            Number(
              item.totalEmployerContributions ||
                0
            )
      ),
      item.paidFromAccountName ||
        item.paidFromAccountNumber ||
        "",
      item.status,
      !item.statutoryRuleCode
        ? "Not Assessed"
        : item.minimumWageAssessment
            ?.compliant === false
        ? "Shortfall"
        : "Compliant",
      roundMoney(
        item.minimumWageAssessment
          ?.shortfall
      ),
    ]
  );

  const csv = [
    headings.map(escapeCsvValue).join(","),
    ...rows.map((row) =>
      row.map(escapeCsvValue).join(",")
    ),
  ].join("\r\n");

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `payroll-register-${getJamaicaToday()}.csv`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

  useEffect(() => {
    const loadPage = async () => {
      try {
        setLoading(true);
        setError("");
                await Promise.all([
          loadReferenceData(),
          loadPayroll(1, 10),
          loadPayrollRegister(),
        ]);
      } catch (loadError) {
        console.error("Could not load Payroll:", loadError);
        setError(
          loadError?.response?.data?.message || "Could not load Payroll."
        );
      } finally {
        setLoading(false);
      }
    };

    loadPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const loadAttendance = async () => {
      const employee = employees.find(
        (item) => item.employeeId === form.employeeId
      );

      if (!employee?.linkedUserId || !form.payPeriod) {
        setAttendance(EMPTY_ATTENDANCE);
        return;
      }

      try {
        setAttendanceLoading(true);
        const { startDate, endDate } = getMonthDateRange(form.payPeriod);
        const params = new URLSearchParams({
          filter: "custom",
          userId: employee.linkedUserId,
          startDate,
          endDate,
        });
        const res = await api.get(`/api/auth/attendance-history?${params}`);
        setAttendance(res.data?.data?.summary?.[0] || EMPTY_ATTENDANCE);
      } catch (attendanceError) {
        console.error("Could not load Payroll attendance:", attendanceError);
        setAttendance(EMPTY_ATTENDANCE);
      } finally {
        setAttendanceLoading(false);
      }
    };

    loadAttendance();
  }, [employees, form.employeeId, form.payPeriod]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    if (name === "employeeId") {
      const employee = employees.find((item) => item.employeeId === value);
      setForm((previous) => ({
        ...previous,
        employeeId: value,
        employeeName: employee?.fullName || "",
        role: employee?.jobTitle || "",
        grossPay: employee?.payRate || "",
      }));
      return;
    }

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const savePayroll = async () => {
    if (
      !form.employeeId ||
      !form.employeeName ||
      !form.role ||
      !form.payPeriod ||
      Number(form.grossPay || 0) <= 0 ||
      !form.paidFromAccountNumber
    ) {
      alert(
        "Select an employee, pay period, gross pay, and Payroll payment account."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

                  const payload = {
        employeeId: form.employeeId,
        employeeName: form.employeeName,
        role: form.role,
        payPeriod: form.payPeriod,
        payFrequency: "Monthly",
        grossPay: Number(form.grossPay || 0),
        compensationType:
          form.compensationType,
        statutoryTreatment:
          form.statutoryTreatment,
        targetNetPay: Number(
          form.targetNetPay || 0
        ),
        statutoryExemption: {
          reason: form.exemptionReason,
          legalBasis:
            form.exemptionLegalBasis,
          supportingReference:
            form.exemptionSupportingReference,
          supportingDocumentUrl:
            form.exemptionSupportingDocumentUrl,
          effectiveFrom:
            form.exemptionEffectiveFrom || null,
          effectiveTo:
            form.exemptionEffectiveTo || null,
        },
        workedHours: roundMoney(
          Number(
            attendance.totalWorkedMinutes || 0
          ) / 60
        ),
        applyEmployeeAdvances: true,
        paidFromAccountNumber:
          form.paidFromAccountNumber,
        pensionEmployee: Number(
          form.pensionEmployee || 0
        ),
      };

      const res = await api.post("/api/payroll", payload);
      alert(res.data?.message || "Payroll record saved successfully.");
      setForm(EMPTY_FORM);
      setAttendance(EMPTY_ATTENDANCE);
            await Promise.all([
        loadReferenceData(),
        loadPayroll(1, pagination.limit),
        loadPayrollRegister(),
      ]);
    } catch (saveError) {
      console.error("Could not save Payroll:", saveError);
      const message =
        saveError?.response?.data?.message || "Could not save Payroll.";
      setError(message);
      alert(message);
    } finally {
      setSaving(false);
    }
  };

      const refreshPayrollRecords = async () => {
    await Promise.all([
      loadReferenceData(),
      loadPayroll(
        pagination.page,
        pagination.limit
      ),
      loadPayrollRegister(),
    ]);
  };

  const approvePayrollRecord = async (item) => {
    const confirmed = window.confirm(
      `Approve Payroll ${item.payrollNumber} for ` +
        `${item.employeeName}?\n\n` +
                `Gross Pay: ${formatCurrency(item.grossPay)}\n` +
        `Final Net Pay: ${formatCurrency(item.netPay)}\n` +
        `Scheduled Payment Date: ${formatDate(
          item.payDate
        )}\n\n` +
        `Approval will not withdraw money yet.`
    );

    if (!confirmed) return;

    const approvalNotes =
      window.prompt(
        "Enter approval notes, or leave blank:",
        ""
      ) || "";

    try {
      setActionPayrollNumber(item.payrollNumber);
      setError("");

      const res = await api.post(
        `/api/payroll/${encodeURIComponent(
          item.payrollNumber
        )}/approve`,
        {
          approvalNotes,
        }
      );

      alert(res.data?.message || "Payroll approved.");
      await refreshPayrollRecords();
    } catch (actionError) {
      console.error("Could not approve Payroll:", actionError);

      const message =
        actionError?.response?.data?.message ||
        "Could not approve Payroll.";

      setError(message);
      alert(message);
    } finally {
      setActionPayrollNumber("");
    }
  };

  const payPayrollRecord = async (item) => {
    const confirmed = window.confirm(
      `PAY AND POST ${item.payrollNumber}?\n\n` +
                `Employee: ${item.employeeName}\n` +
        `Scheduled Payment Date: ${formatDate(
          item.payDate
        )}\n` +
        `Bank/Cash Payment: ${formatCurrency(item.netPay)}\n` +
        `Advance Recovery: ${formatCurrency(
          item.advanceRecovery
        )}\n` +
        `Employer Contributions: ${formatCurrency(
          item.totalEmployerContributions
        )}\n\n` +
        `This action will post the General Ledger, reduce the ` +
        `payment account, and recover the employee advance.`
    );

    if (!confirmed) return;

    try {
      setActionPayrollNumber(item.payrollNumber);
      setError("");

      const res = await api.post(
        `/api/payroll/${encodeURIComponent(
          item.payrollNumber
        )}/pay`
      );

      alert(
        `${res.data?.message || "Payroll paid."}\n\n` +
          `Journal: ${
            res.data?.journalEntryNumber || "-"
          }\n` +
          `Transaction: ${
            res.data?.transactionNumber || "-"
          }`
      );

      await refreshPayrollRecords();
    } catch (actionError) {
      console.error("Could not pay Payroll:", actionError);

      const message =
        actionError?.response?.data?.message ||
        "Could not pay Payroll.";

      setError(message);
      alert(message);
    } finally {
      setActionPayrollNumber("");
    }
  };

  const cancelPayrollRecord = async (item) => {
    const reason = window.prompt(
      `Enter the reason for cancelling ${item.payrollNumber}:`,
      ""
    );

    if (reason === null) return;

    if (!reason.trim()) {
      alert("A cancellation reason is required.");
      return;
    }

    const confirmed = window.confirm(
      `Cancel Payroll ${item.payrollNumber}?\n\n` +
        `Employee: ${item.employeeName}\n` +
        `Reason: ${reason.trim()}`
    );

    if (!confirmed) return;

    try {
      setActionPayrollNumber(item.payrollNumber);
      setError("");

      const res = await api.post(
        `/api/payroll/${encodeURIComponent(
          item.payrollNumber
        )}/cancel`,
        {
          reason: reason.trim(),
        }
      );

      alert(res.data?.message || "Payroll cancelled.");
      await refreshPayrollRecords();
    } catch (actionError) {
      console.error("Could not cancel Payroll:", actionError);

      const message =
        actionError?.response?.data?.message ||
        "Could not cancel Payroll.";

      setError(message);
      alert(message);
    } finally {
      setActionPayrollNumber("");
    }
  };


  const generatePayslipPdf = (item) => {
    try {
      const doc = new jsPDF("p", "mm", "a4");
      doc.setFontSize(18);
      doc.text("Eltham Konnect", 14, 16);
      doc.setFontSize(13);
      doc.text("Employee Payslip", 14, 24);
      doc.setFontSize(10);
      doc.text(`Generated: ${formatDate(new Date())}`, 14, 30);
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
        headStyles: { fillColor: [11, 61, 145] },
      });

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 8,
        head: [["Earnings", "Amount"]],
        body: [["Gross Pay", formatCurrency(item.grossPay)]],
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
            formatCurrency(item.totalDeductions ?? item.deductions),
          ],
        ],
        headStyles: { fillColor: [11, 61, 145] },
      });

            autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 8,
        head: [["Net Pay Summary", "Amount"]],
        body: [
          [
            "Net Before Employee Advance",
            formatCurrency(
              item.netPayBeforeAdvance ?? item.netPay
            ),
          ],
          [
            "Employee Advance Recovery",
            formatCurrency(item.advanceRecovery),
          ],
          [
            "Final Take-Home Pay",
            formatCurrency(item.netPay),
          ],
        ],
        headStyles: { fillColor: [22, 163, 74] },
      });

      const employeeName = String(item.employeeName || "employee").replace(
        /\s+/g,
        "-"
      );
      const payPeriod = String(item.payPeriod || "period").replace(/\s+/g, "-");
      doc.save(`payslip-${employeeName}-${payPeriod}.pdf`);
    } catch (pdfError) {
      console.error("Could not generate payslip:", pdfError);
      alert("Could not generate payslip PDF.");
    }
  };

  const changePage = async (page) => {
    try {
      setLoading(true);
      await loadPayroll(page, pagination.limit);
    } catch (pageError) {
      setError(pageError?.response?.data?.message || "Could not load Payroll.");
    } finally {
      setLoading(false);
    }
  };

  const changeLimit = async (limit) => {
    try {
      setLoading(true);
      await loadPayroll(1, limit);
    } catch (limitError) {
      setError(limitError?.response?.data?.message || "Could not load Payroll.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "1500px", margin: "0 auto" }}>
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ margin: 0, color: "#0f172a" }}>Payroll</h1>
        <p style={{ margin: "6px 0 0", color: MUTED }}>
          Manage employee earnings, deductions, payment accounts, and payslips.
        </p>
      </div>

      {error && (
        <div style={errorStyle}>
          <span>{error}</span>
          <button type="button" onClick={() => setError("")} style={closeStyle}>
            ×
          </button>
        </div>
      )}

            <div style={metricGridStyle}>
        <Metric
          label="Active Payroll Records"
          value={
            registerTotals?.recordCount ??
            payroll.filter(
              (item) =>
                ![
                  "Cancelled",
                  "Reversed",
                ].includes(item.status)
            ).length
          }
        />

        <Metric
          label="Pending"
          value={
            registerTotals?.statusCounts
              ?.Pending || 0
          }
          color="#f59e0b"
        />

        <Metric
          label="Approved"
          value={
            registerTotals?.statusCounts
              ?.Approved || 0
          }
        />

        <Metric
          label="Paid"
          value={
            registerTotals?.statusCounts
              ?.Paid || 0
          }
          color="#16a34a"
        />

        <Metric
          label="Gross Payroll"
          value={formatCurrency(
            totals.grossPay
          )}
        />

        <Metric
          label="Employee Deductions"
          value={formatCurrency(
            totals.totalDeductions
          )}
          color="#dc2626"
        />

        <Metric
          label="Net Payroll"
          value={formatCurrency(
            totals.netPay
          )}
          color="#16a34a"
        />

        <Metric
          label="Active Statutory Obligations"
          value={formatCurrency(
            registerTotals
              ?.governmentLiabilities
              ?.total || 0
          )}
          color="#7c3aed"
        />

        <Metric
  label="Recognized Payroll Liabilities"
  value={formatCurrency(
    recognizedLiabilities
  )}
  color="#9333ea"
/>

        <Metric
          label="Advance Recoveries"
          value={formatCurrency(
            registerTotals
              ?.advanceRecovery || 0
          )}
          color="#dc2626"
        />

        <Metric
          label="Total Employment Cost"
          value={formatCurrency(
            registerTotals
              ?.totalPayrollCost || 0
          )}
          color="#7c3aed"
        />
      </div>

      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>Add Payroll Record</h2>

                        <div style={noticeStyle}>
          <div
            style={{
              fontWeight: 700,
              color: "#1e293b",
            }}
          >
            Jamaican Payroll and Statutory Treatment
          </div>

          <div
            style={{
              color: MUTED,
              marginTop: "7px",
              fontSize: "14px",
              lineHeight: 1.5,
            }}
          >
            Select how this payment should be treated. Standard
            payroll calculates employee and employer obligations.
            Employer-assisted pay preserves a requested take-home
            amount. A documented exemption requires an administrator,
            legal basis, and supporting reference.
          </div>

          {preview.statutoryRuleCode && (
            <div
              style={{
                marginTop: "8px",
                color: ROYAL_BLUE,
                fontWeight: 700,
              }}
            >
              Applied statutory rule:{" "}
              {preview.statutoryRuleCode}
            </div>
          )}
        </div>

        <div style={formGridStyle}>
          <Field label="Employee">
            <select
              name="employeeId"
              value={form.employeeId}
              onChange={handleChange}
              style={inputStyle}
            >
              <option value="">Select Employee</option>
              {employees
                .filter(
                  (employee) =>
                    employee.employmentStatus === "Active" &&
                    employee.payrollEnabled !== false
                )
                .map((employee) => (
                  <option key={employee.employeeId} value={employee.employeeId}>
                    {employee.fullName} ({employee.employeeId})
                  </option>
                ))}
            </select>
          </Field>

          <Field label="Role">
            <input value={form.role} readOnly style={readOnlyStyle} />
          </Field>

          <Field label="Employee Name">
            <input value={form.employeeName} readOnly style={readOnlyStyle} />
          </Field>

          <Field label="Pay Period">
            <input
              type="month"
              name="payPeriod"
              value={form.payPeriod}
              onChange={handleChange}
              style={inputStyle}
            />
          </Field>

                    <Field label="Scheduled Payment Date">
            <input
              value={
                preview.scheduledPayDate
                  ? formatDate(
                      preview.scheduledPayDate
                    )
                  : "Select employee, period, and pay"
              }
              readOnly
              style={readOnlyStyle}
            />
          </Field>

                    <Field label="Compensation Type">
            <select
              name="compensationType"
              value={form.compensationType}
              onChange={handleChange}
              style={inputStyle}
            >
              <option value="Salary">Salary</option>
              <option value="Wage">Wage</option>
              <option value="Stipend">Stipend</option>
              <option value="Allowance">Allowance</option>
              <option value="Other">Other</option>
            </select>
          </Field>

          <Field label="Statutory Treatment">
            <select
              name="statutoryTreatment"
              value={form.statutoryTreatment}
              onChange={handleChange}
              style={inputStyle}
            >
              <option value="Standard">
                Standard Statutory Deductions
              </option>
              <option value="Employer-Assisted Net Pay">
                Employer-Assisted Net Pay
              </option>
              <option value="Documented Exemption">
                Documented Exemption
              </option>
            </select>
          </Field>

          <Field
            label={
              form.statutoryTreatment ===
              "Employer-Assisted Net Pay"
                ? "Base Stipend / Pay"
                : "Gross Pay"
            }
          >
            <input
              type="number"
              min="0"
              step="0.01"
              name="grossPay"
              value={form.grossPay}
              onChange={handleChange}
              style={inputStyle}
            />
          </Field>

          {form.statutoryTreatment ===
            "Employer-Assisted Net Pay" && (
            <Field label="Requested Take-Home Before Advance">
              <input
                type="number"
                min="0"
                step="0.01"
                name="targetNetPay"
                value={form.targetNetPay}
                onChange={handleChange}
                placeholder="Example: 15000"
                style={inputStyle}
              />
            </Field>
          )}

          <Field label="Employee Pension">
            <input
              type="number"
              min="0"
              step="0.01"
              name="pensionEmployee"
              value={form.pensionEmployee}
              onChange={handleChange}
              style={inputStyle}
            />
          </Field>

          {form.statutoryTreatment ===
            "Documented Exemption" && (
            <>
              <Field label="Exemption Reason">
                <input
                  type="text"
                  name="exemptionReason"
                  value={form.exemptionReason}
                  onChange={handleChange}
                  placeholder="Explain why the exemption applies"
                  style={inputStyle}
                />
              </Field>

              <Field label="Legal Basis">
                <input
                  type="text"
                  name="exemptionLegalBasis"
                  value={form.exemptionLegalBasis}
                  onChange={handleChange}
                  placeholder="Legislation, ruling, or professional advice"
                  style={inputStyle}
                />
              </Field>

              <Field label="Supporting Reference">
                <input
                  type="text"
                  name="exemptionSupportingReference"
                  value={
                    form.exemptionSupportingReference
                  }
                  onChange={handleChange}
                  placeholder="Letter, ruling, or document reference"
                  style={inputStyle}
                />
              </Field>

              <Field label="Supporting Document URL">
                <input
                  type="url"
                  name="exemptionSupportingDocumentUrl"
                  value={
                    form.exemptionSupportingDocumentUrl
                  }
                  onChange={handleChange}
                  placeholder="Optional document link"
                  style={inputStyle}
                />
              </Field>

              <Field label="Exemption Effective From">
                <input
                  type="date"
                  name="exemptionEffectiveFrom"
                  value={form.exemptionEffectiveFrom}
                  onChange={handleChange}
                  style={inputStyle}
                />
              </Field>

              <Field label="Exemption Effective To">
                <input
                  type="date"
                  name="exemptionEffectiveTo"
                  value={form.exemptionEffectiveTo}
                  onChange={handleChange}
                  style={inputStyle}
                />
              </Field>
            </>
          )}

          <Field label="Payroll Payment Account">
            <select
              name="paidFromAccountNumber"
              value={form.paidFromAccountNumber}
              onChange={handleChange}
              style={inputStyle}
            >
              <option value="">Select Payroll Payment Account</option>
              {accounts
                .filter(
                  (account) =>
                    account.status === "Active" &&
                    ["Bank", "Cash"].includes(account.accountType)
                )
                .map((account) => (
                  <option key={account._id} value={account.accountNumber}>
                    {account.accountName} ({account.accountType}) -{" "}
                    {formatCurrency(
                      account.currentBalance,
                      account.currency || "JMD"
                    )}
                  </option>
                ))}
            </select>
          </Field>

                    <Field label="Initial Status">
            <input
              value="Pending Approval"
              readOnly
              style={readOnlyStyle}
            />
          </Field>

        </div>

        <h3 style={{ color: ROYAL_BLUE, marginBottom: "10px" }}>
          Attendance Summary for Pay Period
        </h3>
        <div style={metricGridStyle}>
          <Metric
            label="Days Worked"
            value={attendanceLoading ? "Loading…" : attendance.totalDays || 0}
          />
          <Metric
            label="Worked Hours"
            value={
              attendanceLoading
                ? "Loading…"
                : attendance.totalWorkedLabel || "0h 0m"
            }
          />
          <Metric
            label="Lunch Hours"
            value={
              attendanceLoading
                ? "Loading…"
                : attendance.totalLunchLabel || "0h 0m"
            }
          />
                </div>

        {preview.minimumWageAssessment?.warning && (
          <div
            style={{
              ...noticeStyle,
              backgroundColor:
                preview.minimumWageAssessment.compliant
                  ? "#f0fdf4"
                  : "#fff7ed",
              borderColor:
                preview.minimumWageAssessment.compliant
                  ? "#86efac"
                  : "#fdba74",
            }}
          >
            <div
              style={{
                fontWeight: 700,
                color:
                  preview.minimumWageAssessment.compliant
                    ? "#166534"
                    : "#c2410c",
              }}
            >
              Minimum-Wage Assessment
            </div>

            <div
              style={{
                marginTop: "7px",
                color: "#334155",
                lineHeight: 1.5,
              }}
            >
              {preview.minimumWageAssessment.warning}
            </div>

            <div
              style={{
                marginTop: "7px",
                color: MUTED,
                fontSize: "13px",
              }}
            >
              Hours assessed:{" "}
              {Number(
                preview.minimumWageAssessment.workedHours ||
                  0
              ).toFixed(2)}
              {" | "}
              Minimum ordinary-time pay:{" "}
              {formatCurrency(
                preview.minimumWageAssessment.minimumGrossPay
              )}
              {" | "}
              Assessed gross pay:{" "}
              {formatCurrency(
                preview.minimumWageAssessment.assessedGrossPay
              )}
            </div>
          </div>
        )}

        <h3 style={{ color: ROYAL_BLUE, marginBottom: "10px" }}>
          Payroll Preview
        </h3>

        {previewLoading ? (
          <div style={noticeStyle}>
            Calculating Payroll and employee advances…
          </div>
        ) : (
          <>
                        <Metric
                label="Statutory Treatment"
                value={
                  preview.statutoryTreatment ||
                  form.statutoryTreatment
                }
              />

              <Metric
                label="Calculated Gross Pay"
                value={formatCurrency(
                  preview.grossPay
                )}
              />

              {form.statutoryTreatment ===
                "Employer-Assisted Net Pay" && (
                <Metric
                  label="Employer Support Allowance"
                  value={formatCurrency(
                    preview.employerSupportAllowance
                  )}
                  color="#7c3aed"
                />
              )}
            <div style={metricGridStyle}>
              <Metric
                label="NIS Employee"
                value={formatCurrency(preview.nisEmployee)}
              />

              <Metric
                label="NHT Employee"
                value={formatCurrency(preview.nhtEmployee)}
              />

              <Metric
                label="Education Tax Employee"
                value={formatCurrency(preview.educationTax)}
              />

              <Metric
                label="PAYE"
                value={formatCurrency(preview.incomeTax)}
              />

              <Metric
                label="Statutory Deductions"
                value={formatCurrency(preview.totalDeductions)}
                color="#dc2626"
              />

              <Metric
                label="Net Before Advance"
                value={formatCurrency(preview.netPayBeforeAdvance)}
              />

              <Metric
                label="Employee Advance Recovery"
                value={formatCurrency(preview.advanceRecovery)}
                color="#dc2626"
              />

              <Metric
                label="Final Take-Home Pay"
                value={formatCurrency(preview.netPay)}
                color="#16a34a"
              />
            </div>

            <h3 style={{ color: ROYAL_BLUE, marginBottom: "10px" }}>
              Employer Contributions
            </h3>

            <div style={metricGridStyle}>
              <Metric
                label="NIS Employer"
                value={formatCurrency(preview.nisEmployer)}
              />

              <Metric
                label="NHT Employer"
                value={formatCurrency(preview.nhtEmployer)}
              />

              <Metric
                label="Education Tax Employer"
                value={formatCurrency(
                  preview.educationTaxEmployer
                )}
              />

              <Metric
                label="HEART Employer"
                value={formatCurrency(preview.heartEmployer)}
              />

              <Metric
                label="Total Employer Contributions"
                value={formatCurrency(
                  preview.totalEmployerContributions
                )}
                color="#7c3aed"
              />

              <Metric
                label="Total Employment Cost"
                value={formatCurrency(preview.totalPayrollCost)}
                color="#7c3aed"
              />
            </div>

            {preview.advanceRecoveries?.length > 0 && (
              <div style={noticeStyle}>
                <strong style={{ color: ROYAL_BLUE }}>
                  Advance Recovery Details
                </strong>

                {preview.advanceRecoveries.map((recovery) => (
                  <div
                    key={recovery.advanceNumber}
                    style={{
                      marginTop: "8px",
                      color: "#334155",
                    }}
                  >
                    {recovery.advanceNumber}:{" "}
                    {formatCurrency(recovery.amount)} —{" "}
                    {recovery.description}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <button
          type="button"
          onClick={savePayroll}
                    disabled={saving || previewLoading}
          style={{
            ...primaryButtonStyle,
                        opacity: saving || previewLoading ? 0.65 : 1,
            cursor:
              saving || previewLoading ? "not-allowed" : "pointer",
          }}
        >
          {saving ? "Saving Payroll…" : "Save Payroll Record"}
        </button>
      </section>

      <BatchPayrollPanel
        employees={employees}
        accounts={accounts}
        onCreated={refreshPayrollRecords}
      />

      <section style={{ ...cardStyle, marginTop: "22px" }}>
        <div
  style={{
    padding: "16px",
    marginBottom: "18px",
    backgroundColor: "#f8fafc",
    border: `1px solid ${BORDER}`,
    borderRadius: "12px",
  }}
>
  <h3
    style={{
      margin: "0 0 6px",
      color: ROYAL_BLUE,
    }}
  >
    Employee Year-to-Date Payroll
  </h3>

  <p
    style={{
      margin: "0 0 14px",
      color: MUTED,
    }}
  >
    Generate an employee payroll summary for
    the selected calendar year.
  </p>

  <div
    style={{
      display: "grid",
      gridTemplateColumns:
        "repeat(auto-fit, minmax(210px, 1fr))",
      gap: "12px",
    }}
  >
    <select
      value={ytdEmployeeId}
      onChange={(event) => {
        setYtdEmployeeId(
          event.target.value
        );
        setYtdReport(null);
      }}
      style={inputStyle}
    >
      <option value="">
        Select Employee
      </option>

      {employees.map((employee) => (
        <option
          key={employee.employeeId}
          value={employee.employeeId}
        >
          {employee.fullName} (
          {employee.employeeId})
        </option>
      ))}
    </select>

    <input
      type="number"
      min="2020"
      max="2100"
      value={ytdYear}
      onChange={(event) => {
        setYtdYear(event.target.value);
        setYtdReport(null);
      }}
      placeholder="Payroll year"
      style={inputStyle}
    />

    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: "9px",
        padding: "10px",
        border: `1px solid ${BORDER}`,
        borderRadius: "8px",
        backgroundColor: WHITE,
      }}
    >
      <input
        type="checkbox"
        checked={includeApprovedYtd}
        onChange={(event) => {
          setIncludeApprovedYtd(
            event.target.checked
          );
          setYtdReport(null);
        }}
      />

      Include approved scheduled payroll
    </label>
  </div>

  <button
    type="button"
    onClick={loadEmployeeYtd}
    disabled={ytdLoading}
    style={{
      ...primaryButtonStyle,
      marginTop: "14px",
      opacity: ytdLoading ? 0.65 : 1,
    }}
  >
    {ytdLoading
      ? "Generating YTD…"
      : "Generate YTD Summary"}
  </button>

  {ytdReport?.totals && (
    <div
      style={{
        ...metricGridStyle,
        marginTop: "16px",
      }}
    >
      <Metric
        label="YTD Records"
        value={
          ytdReport.totals.recordCount || 0
        }
      />

      <Metric
        label="YTD Gross Pay"
        value={formatCurrency(
          ytdReport.totals.grossPay
        )}
      />

      <Metric
        label="YTD Employee Deductions"
        value={formatCurrency(
          ytdReport.totals
            .totalEmployeeDeductions
        )}
        color="#dc2626"
      />

      <Metric
        label="YTD Net Pay"
        value={formatCurrency(
          ytdReport.totals.netPay
        )}
        color="#16a34a"
      />

      <Metric
        label="YTD Advance Recoveries"
        value={formatCurrency(
          ytdReport.totals.advanceRecovery
        )}
        color="#dc2626"
      />

      <Metric
        label="YTD Employer Contributions"
        value={formatCurrency(
          ytdReport.totals
            .totalEmployerContributions
        )}
        color="#7c3aed"
      />

      <Metric
        label="YTD Statutory Obligations"
        value={formatCurrency(
          ytdReport.totals
            .governmentLiabilities?.total
        )}
        color="#7c3aed"
      />

      <Metric
        label="YTD Employment Cost"
        value={formatCurrency(
          ytdReport.totals.totalPayrollCost
        )}
        color="#7c3aed"
      />
    </div>
  )}
</div>
        <div
  style={{
    padding: "16px",
    marginBottom: "18px",
    backgroundColor: "#f8fafc",
    border: `1px solid ${BORDER}`,
    borderRadius: "12px",
  }}
>
  <h3
    style={{
      margin: "0 0 14px",
      color: ROYAL_BLUE,
    }}
  >
    Payroll Register Filters
  </h3>

  <div
    style={{
      display: "grid",
      gridTemplateColumns:
        "repeat(auto-fit, minmax(190px, 1fr))",
      gap: "12px",
    }}
  >
    <input
      type="text"
      placeholder="Search employee or payroll number"
      value={registerFilters.search}
      onChange={(event) =>
        updateRegisterFilter(
          "search",
          event.target.value
        )
      }
      style={inputStyle}
    />

    <select
      value={registerFilters.employeeId}
      onChange={(event) =>
        updateRegisterFilter(
          "employeeId",
          event.target.value
        )
      }
      style={inputStyle}
    >
      <option value="">All Employees</option>

      {employees.map((employee) => (
        <option
          key={employee.employeeId}
          value={employee.employeeId}
        >
          {employee.fullName} (
          {employee.employeeId})
        </option>
      ))}
    </select>

    <select
      value={registerFilters.status}
      onChange={(event) =>
        updateRegisterFilter(
          "status",
          event.target.value
        )
      }
      style={inputStyle}
    >
      <option value="">All Active Statuses</option>
      <option value="Pending">Pending</option>
      <option value="Approved">Approved</option>
      <option value="Paid">Paid</option>
      <option value="Cancelled">Cancelled</option>
      <option value="Reversed">Reversed</option>
    </select>

    <input
      type="month"
      title="Period from"
      value={registerFilters.periodFrom}
      onChange={(event) =>
        updateRegisterFilter(
          "periodFrom",
          event.target.value
        )
      }
      style={inputStyle}
    />

    <input
      type="month"
      title="Period to"
      value={registerFilters.periodTo}
      onChange={(event) =>
        updateRegisterFilter(
          "periodTo",
          event.target.value
        )
      }
      style={inputStyle}
    />

    <select
      value={
        registerFilters.compensationType
      }
      onChange={(event) =>
        updateRegisterFilter(
          "compensationType",
          event.target.value
        )
      }
      style={inputStyle}
    >
      <option value="">
        All Compensation Types
      </option>
      <option value="Salary">Salary</option>
      <option value="Wage">Wage</option>
      <option value="Stipend">Stipend</option>
      <option value="Allowance">
        Allowance
      </option>
      <option value="Other">Other</option>
    </select>

    <select
      value={
        registerFilters.statutoryTreatment
      }
      onChange={(event) =>
        updateRegisterFilter(
          "statutoryTreatment",
          event.target.value
        )
      }
      style={inputStyle}
    >
      <option value="">
        All Statutory Treatments
      </option>
      <option value="Standard">
        Standard
      </option>
      <option value="Employer-Assisted Net Pay">
        Employer-Assisted Net Pay
      </option>
      <option value="Documented Exemption">
        Documented Exemption
      </option>
    </select>

    <select
      value={registerFilters.legacy}
      onChange={(event) =>
        updateRegisterFilter(
          "legacy",
          event.target.value
        )
      }
      style={inputStyle}
    >
      <option value="">Modern and Legacy</option>
      <option value="false">
        Modern Records Only
      </option>
      <option value="true">
        Legacy Records Only
      </option>
    </select>
  </div>

  <div
    style={{
      display: "flex",
      flexWrap: "wrap",
      gap: "10px",
      marginTop: "14px",
    }}
  >
    <button
      type="button"
      onClick={applyRegisterFilters}
      disabled={registerLoading}
      style={{
        ...primaryButtonStyle,
        marginTop: 0,
        opacity: registerLoading
          ? 0.65
          : 1,
      }}
    >
      {registerLoading
        ? "Applying Filters…"
        : "Apply Filters"}
    </button>

    <button
      type="button"
      onClick={clearRegisterFilters}
      disabled={registerLoading}
      style={{
        ...primaryButtonStyle,
        marginTop: 0,
        backgroundColor: "#64748b",
        opacity: registerLoading
          ? 0.65
          : 1,
      }}
    >
      Clear Filters
    </button>

    <button
  type="button"
  onClick={exportPayrollRegisterCsv}
  disabled={
    registerLoading ||
    !registerRecords.length
  }
  style={{
    ...primaryButtonStyle,
    marginTop: 0,
    backgroundColor: "#16a34a",
    opacity:
      registerLoading ||
      !registerRecords.length
        ? 0.65
        : 1,
  }}
>
  Export Register CSV
</button>
  </div>
</div>
        <div style={recordsHeaderStyle}>
          <div>
            <h2 style={{ ...sectionTitleStyle, marginBottom: "4px" }}>
              Payroll Records
            </h2>
            <span style={{ color: MUTED }}>
  Total records:{" "}
  {registerTotals?.recordCount ??
    pagination.total}
</span>
          </div>
          <select
            value={pagination.limit}
            onChange={(event) => {
  const nextLimit = Number(
    event.target.value
  );

  setPagination((current) => ({
    ...current,
    limit: nextLimit,
  }));

  setRegisterPage(1);
}}
            style={{ ...inputStyle, width: "auto" }}
          >
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
        </div>

        {loading ? (
          <p>Loading Payroll…</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead style={{ backgroundColor: "#eef4ff" }}>
                <tr>
                  <th style={cellStyle}>Payroll Number</th>
                  <th style={cellStyle}>Employee ID</th>
                  <th style={cellStyle}>Employee</th>
                  <th style={cellStyle}>Role</th>
                  <th style={cellStyle}>Pay Period</th>
                  <th style={cellStyle}>Pay Date</th>
                  <th style={cellStyle}>Gross Pay</th>
                  <th style={cellStyle}>NIS</th>
                  <th style={cellStyle}>NHT</th>
                  <th style={cellStyle}>Education Tax</th>
                  <th style={cellStyle}>Income Tax</th>
                  <th style={cellStyle}>Pension</th>
                  <th style={cellStyle}>Total Deductions</th>
                  <th style={cellStyle}>Net Pay</th>
                  <th style={cellStyle}>Paid From</th>
                  <th style={cellStyle}>Status</th>
                  <th style={cellStyle}>Compliance</th>
                  <th style={cellStyle}>Action</th>
                </tr>
              </thead>
              <tbody>
                {visibleRegisterRecords.length ? (
  visibleRegisterRecords.map((item) => (
                    <tr key={item._id || item.payrollNumber}>
                      <td style={cellStyle}>{item.payrollNumber}</td>
                      <td style={cellStyle}>{item.employeeId || "-"}</td>
                      <td style={cellStyle}>{item.employeeName}</td>
                      <td style={cellStyle}>{item.role}</td>
                      <td style={cellStyle}>{item.payPeriod}</td>
                      <td style={cellStyle}>
                        {formatDate(item.payDate) || "-"}
                      </td>
                      <td style={cellStyle}>
                        {formatCurrency(item.grossPay)}
                      </td>
                      <td style={cellStyle}>{formatCurrency(item.nisEmployee)}</td>
                      <td style={cellStyle}>{formatCurrency(item.nhtEmployee)}</td>
                      <td style={cellStyle}>
                        {formatCurrency(item.educationTax)}
                      </td>
                      <td style={cellStyle}>{formatCurrency(item.incomeTax)}</td>
                      <td style={cellStyle}>
                        {formatCurrency(item.pensionEmployee)}
                      </td>
                      <td style={cellStyle}>
                        {formatCurrency(
                          item.totalDeductions ?? item.deductions
                        )}
                      </td>
                      <td style={cellStyle}>{formatCurrency(item.netPay)}</td>
                      <td style={cellStyle}>
                        {item.paidFromAccountName ||
                          item.paidFromAccountNumber ||
                          "-"}
                      </td>
                      <td style={cellStyle}>
                        <StatusBadge status={item.status} />
                      </td>
                                            <td style={cellStyle}>
                        {["Cancelled", "Reversed"].includes(
  item.status
) ? (
  <span
    style={{
      color: MUTED,
      fontSize: "12px",
    }}
  >
    Not applicable
  </span>
) : !item.statutoryRuleCode ? (
  <span
    style={{
      color: MUTED,
      fontSize: "12px",
    }}
  >
    Not assessed
  </span>
) : item.minimumWageAssessment
    ?.compliant === false ? (
  <span
    title={
      item.minimumWageAssessment
        ?.warning || ""
    }
    style={{
      color: "#dc2626",
      fontSize: "12px",
      fontWeight: 700,
    }}
  >
    Shortfall{" "}
    {formatCurrency(
      item.minimumWageAssessment
        ?.shortfall
    )}
  </span>
) : (
  <span
    style={{
      color: "#16a34a",
      fontSize: "12px",
      fontWeight: 700,
    }}
  >
    Compliant
  </span>
)}
                      </td>

                      <td style={cellStyle}>
                        <div
                          style={{
                            display: "flex",
                            gap: "7px",
                            flexWrap: "wrap",
                            minWidth: "190px",
                          }}
                        >
                          {item.statutoryRuleCode &&
                            item.status === "Pending" &&
                            canApprovePayroll && (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    approvePayrollRecord(item)
                                  }
                                  disabled={
                                    actionPayrollNumber ===
                                    item.payrollNumber
                                  }
                                  style={actionButtonStyle(
                                    "#0B3D91"
                                  )}
                                >
                                  {actionPayrollNumber ===
                                  item.payrollNumber
                                    ? "Approving…"
                                    : "Approve"}
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    cancelPayrollRecord(item)
                                  }
                                  disabled={
                                    actionPayrollNumber ===
                                    item.payrollNumber
                                  }
                                  style={actionButtonStyle(
                                    "#dc2626"
                                  )}
                                >
                                  Cancel
                                </button>
                              </>
                            )}

                          {item.statutoryRuleCode &&
                            item.status === "Approved" &&
                            canApprovePayroll && (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    payPayrollRecord(item)
                                  }
                                  disabled={
                                    actionPayrollNumber ===
                                      item.payrollNumber ||
                                    !isScheduledPayDateAvailable(
                                      item.payDate
                                    )
                                  }
                                  style={{
                                    ...actionButtonStyle(
                                      "#16a34a"
                                    ),
                                    opacity:
                                      isScheduledPayDateAvailable(
                                        item.payDate
                                      )
                                        ? 1
                                        : 0.65,
                                    cursor:
                                      isScheduledPayDateAvailable(
                                        item.payDate
                                      )
                                        ? "pointer"
                                        : "not-allowed",
                                  }}
                                >
                                  {actionPayrollNumber ===
                                  item.payrollNumber
                                    ? "Posting…"
                                    : isScheduledPayDateAvailable(
                                        item.payDate
                                      )
                                    ? "Pay & Post"
                                    : `Scheduled ${formatDate(
                                        item.payDate
                                      )}`}
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    cancelPayrollRecord(item)
                                  }
                                  disabled={
                                    actionPayrollNumber ===
                                    item.payrollNumber
                                  }
                                  style={actionButtonStyle(
                                    "#dc2626"
                                  )}
                                >
                                  Cancel
                                </button>
                              </>
                            )}

                          {item.status === "Paid" && (
                            <button
                              type="button"
                              onClick={() =>
                                generatePayslipPdf(item)
                              }
                              style={payslipButtonStyle}
                            >
                              Generate Payslip
                            </button>
                          )}

                          {item.status === "Cancelled" && (
                            <span
                              style={{
                                color: "#dc2626",
                                fontSize: "12px",
                                fontWeight: 700,
                              }}
                            >
                              Cancelled
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td style={cellStyle} colSpan="18">
                      No Payroll records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div style={paginationStyle}>
  <button
    type="button"
    disabled={
      registerPage <= 1 ||
      registerLoading
    }
    onClick={() =>
      setRegisterPage((current) =>
        Math.max(1, current - 1)
      )
    }
    style={secondaryButtonStyle}
  >
    Previous
  </button>

  <strong>
    Page {registerPage} of{" "}
    {registerPages}
  </strong>

  <button
    type="button"
    disabled={
      registerPage >= registerPages ||
      registerLoading
    }
    onClick={() =>
      setRegisterPage((current) =>
        Math.min(
          registerPages,
          current + 1
        )
      )
    }
    style={secondaryButtonStyle}
  >
    Next
  </button>
</div>
      </section>
    </div>
  );
}

function BatchPayrollPanel({
  employees,
  accounts,
  onCreated,
}) {
  const [open, setOpen] =
    useState(false);

  const [payPeriod, setPayPeriod] =
    useState("");

  const [
    paidFromAccountNumber,
    setPaidFromAccountNumber,
  ] = useState("");

  const [rows, setRows] =
    useState([]);

  const [
    preparedRecords,
    setPreparedRecords,
  ] = useState([]);

  const [batchPreview, setBatchPreview] =
    useState(null);

  const [previewing, setPreviewing] =
    useState(false);

  const [creating, setCreating] =
    useState(false);

  useEffect(() => {
    setRows((currentRows) =>
      (employees || [])
        .filter(
          (employee) =>
            employee.employmentStatus ===
              "Active" &&
            employee.payrollEnabled !== false
        )
        .map((employee) => {
          const existing =
            currentRows.find(
              (row) =>
                row.employeeId ===
                employee.employeeId
            );

          if (existing) {
            return existing;
          }

          return {
            employeeId:
              employee.employeeId,
            employeeName:
              employee.fullName,
            role:
              employee.jobTitle,
            selected: false,
            grossPay:
              employee.payRate || "",
            compensationType:
              employee.payType ===
              "Weekly Wage"
                ? "Wage"
                : "Salary",
            statutoryTreatment:
              "Standard",
            targetNetPay: "",
            pensionEmployee: "",
            linkedUserId:
              employee.linkedUserId ||
              "",
          };
        })
    );
  }, [employees]);

  const activeAccounts = (
    accounts || []
  ).filter(
    (account) =>
      account.status === "Active" &&
      ["Bank", "Cash"].includes(
        account.accountType
      )
  );

  const selectedRows = rows.filter(
    (row) => row.selected
  );

  const updateRow = (
    employeeId,
    field,
    value
  ) => {
    setRows((currentRows) =>
      currentRows.map((row) =>
        row.employeeId === employeeId
          ? {
              ...row,
              [field]: value,
            }
          : row
      )
    );

    setBatchPreview(null);
    setPreparedRecords([]);
  };

  const toggleAllEmployees = (
    checked
  ) => {
    setRows((currentRows) =>
      currentRows.map((row) => ({
        ...row,
        selected: checked,
      }))
    );

    setBatchPreview(null);
    setPreparedRecords([]);
  };

  const getWorkedHours = async (
    row
  ) => {
    if (
      !row.linkedUserId ||
      !payPeriod
    ) {
      return 0;
    }

    try {
      const {
        startDate,
        endDate,
      } = getMonthDateRange(
        payPeriod
      );

      const params =
        new URLSearchParams({
          filter: "custom",
          userId:
            row.linkedUserId,
          startDate,
          endDate,
        });

      const res = await api.get(
        `/api/auth/attendance-history?${params.toString()}`
      );

      const minutes = Number(
        res.data?.data?.summary?.[0]
          ?.totalWorkedMinutes || 0
      );

      return roundMoney(
        minutes / 60
      );
    } catch (attendanceError) {
      console.error(
        `Could not load attendance for ${row.employeeName}:`,
        attendanceError
      );

      return 0;
    }
  };

  const buildBatchRecords =
    async () => {
      const prepared =
        await Promise.all(
          selectedRows.map(
            async (row) => ({
              employeeId:
                row.employeeId,
              employeeName:
                row.employeeName,
              role:
                row.role,
              grossPay: Number(
                row.grossPay || 0
              ),
              compensationType:
                row.compensationType,
              statutoryTreatment:
                row.statutoryTreatment,
              targetNetPay:
                row.statutoryTreatment ===
                "Employer-Assisted Net Pay"
                  ? Number(
                      row.targetNetPay ||
                        row.grossPay ||
                        0
                    )
                  : 0,
              pensionEmployee:
                Number(
                  row.pensionEmployee ||
                    0
                ),
              workedHours:
                await getWorkedHours(
                  row
                ),
              applyEmployeeAdvances:
                true,
            })
          )
        );

      setPreparedRecords(prepared);

      return prepared;
    };

  const previewBatch = async () => {
    if (!payPeriod) {
      alert(
        "Select the batch pay period."
      );
      return;
    }

    if (!paidFromAccountNumber) {
      alert(
        "Select the Payroll payment account."
      );
      return;
    }

    if (!selectedRows.length) {
      alert(
        "Select at least one employee."
      );
      return;
    }

    const invalidPay = selectedRows.find(
      (row) =>
        Number(row.grossPay || 0) <=
        0
    );

    if (invalidPay) {
      alert(
        `Enter a valid pay amount for ${invalidPay.employeeName}.`
      );
      return;
    }

    try {
      setPreviewing(true);
      setBatchPreview(null);

      const records =
        await buildBatchRecords();

      const res = await api.post(
        "/api/payroll/batch/preview",
        {
          defaults: {
            payPeriod,
            payFrequency:
              "Monthly",
            paidFromAccountNumber,
            minimumWageApplicable:
              true,
            applyEmployeeAdvances:
              true,
          },
          records,
        }
      );

      setBatchPreview(
        res.data
      );
    } catch (previewError) {
      console.error(
        "Could not preview Payroll batch:",
        previewError
      );

      const response =
        previewError?.response?.data;

      if (response?.data) {
        setBatchPreview(response);
      }

      alert(
        response?.message ||
          "Could not preview Payroll batch."
      );
    } finally {
      setPreviewing(false);
    }
  };

  const createBatch = async () => {
    const successfulResults =
      (
        batchPreview?.data || []
      ).filter(
        (result) =>
          result.success === true
      );

    if (
      !successfulResults.length
    ) {
      alert(
        "There are no successful preview records to create."
      );
      return;
    }

    const successfulEmployeeIds =
      new Set(
        successfulResults.map(
          (result) =>
            result.employeeId
        )
      );

    const recordsToCreate =
      preparedRecords.filter(
        (record) =>
          successfulEmployeeIds.has(
            record.employeeId
          )
      );

    const confirmed =
      window.confirm(
        `Create ${recordsToCreate.length} Pending Payroll record(s) for ${payPeriod}?\n\n` +
          `This will not approve, pay, withdraw money, post journals, or finalize advance recoveries.`
      );

    if (!confirmed) return;

    try {
      setCreating(true);

      const res = await api.post(
        "/api/payroll/batch",
        {
          defaults: {
            payPeriod,
            payFrequency:
              "Monthly",
            paidFromAccountNumber,
            applyEmployeeAdvances:
              true,
          },
          records:
            recordsToCreate,
        }
      );

      alert(
        res.data?.message ||
          "Payroll batch created."
      );

      setBatchPreview(null);
      setPreparedRecords([]);

      setRows((currentRows) =>
        currentRows.map((row) => ({
          ...row,
          selected: false,
        }))
      );

      if (onCreated) {
        await onCreated();
      }
    } catch (createError) {
      console.error(
        "Could not create Payroll batch:",
        createError
      );

      const response =
        createError?.response?.data;

      alert(
        response?.message ||
          "Could not create Payroll batch."
      );

      if (response?.data) {
        setBatchPreview(response);
      }
    } finally {
      setCreating(false);
    }
  };

  const successfulPreviewCount =
    (
      batchPreview?.data || []
    ).filter(
      (result) =>
        result.success === true
    ).length;

  return (
    <section
      style={{
        ...cardStyle,
        marginTop: "22px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2
            style={{
              ...sectionTitleStyle,
              marginBottom: "5px",
            }}
          >
            Batch Payroll
          </h2>

          <p
            style={{
              margin: 0,
              color: MUTED,
            }}
          >
            Preview and prepare
            Pending Payroll records
            for multiple employees.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setOpen(
              (current) =>
                !current
            )
          }
          style={secondaryButtonStyle}
        >
          {open
            ? "Close Batch Payroll"
            : "Open Batch Payroll"}
        </button>
      </div>

      {open && (
        <div
          style={{
            marginTop: "18px",
          }}
        >
          <div style={noticeStyle}>
            Batch preview checks
            statutory deductions,
            employer contributions,
            attendance, minimum wage,
            employee advances, and
            existing payroll records.
            Creating a batch only
            creates Pending records.
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(230px, 1fr))",
              gap: "12px",
              marginTop: "16px",
            }}
          >
            <Field label="Batch Pay Period">
              <input
                type="month"
                value={payPeriod}
                onChange={(event) => {
                  setPayPeriod(
                    event.target.value
                  );
                  setBatchPreview(
                    null
                  );
                  setPreparedRecords(
                    []
                  );
                }}
                style={inputStyle}
              />
            </Field>

            <Field label="Payroll Payment Account">
              <select
                value={
                  paidFromAccountNumber
                }
                onChange={(event) => {
                  setPaidFromAccountNumber(
                    event.target.value
                  );
                  setBatchPreview(
                    null
                  );
                  setPreparedRecords(
                    []
                  );
                }}
                style={inputStyle}
              >
                <option value="">
                  Select Payroll
                  Payment Account
                </option>

                {activeAccounts.map(
                  (account) => (
                    <option
                      key={
                        account.accountNumber
                      }
                      value={
                        account.accountNumber
                      }
                    >
                      {account.accountName} (
                      {account.accountType}) -{" "}
                      {formatCurrency(
                        account.currentBalance,
                        account.currency ||
                          "JMD"
                      )}
                    </option>
                  )
                )}
              </select>
            </Field>
          </div>

          <div
            style={{
              overflowX: "auto",
              marginTop: "18px",
            }}
          >
            <table style={tableStyle}>
              <thead
                style={{
                  backgroundColor:
                    "#eef4ff",
                }}
              >
                <tr>
                  <th style={cellStyle}>
                    <input
                      type="checkbox"
                      checked={
                        rows.length > 0 &&
                        rows.every(
                          (row) =>
                            row.selected
                        )
                      }
                      onChange={(
                        event
                      ) =>
                        toggleAllEmployees(
                          event.target
                            .checked
                        )
                      }
                    />
                  </th>

                  <th style={cellStyle}>
                    Employee
                  </th>

                  <th style={cellStyle}>
                    Base Pay
                  </th>

                  <th style={cellStyle}>
                    Compensation
                  </th>

                  <th style={cellStyle}>
                    Statutory Treatment
                  </th>

                  <th style={cellStyle}>
                    Requested Net
                  </th>

                  <th style={cellStyle}>
                    Pension
                  </th>
                </tr>
              </thead>

              <tbody>
                {rows.length ? (
                  rows.map((row) => (
                    <tr
                      key={
                        row.employeeId
                      }
                    >
                      <td
                        style={
                          cellStyle
                        }
                      >
                        <input
                          type="checkbox"
                          checked={
                            row.selected
                          }
                          onChange={(
                            event
                          ) =>
                            updateRow(
                              row.employeeId,
                              "selected",
                              event.target
                                .checked
                            )
                          }
                        />
                      </td>

                      <td
                        style={
                          cellStyle
                        }
                      >
                        <strong>
                          {
                            row.employeeName
                          }
                        </strong>

                        <div
                          style={{
                            color:
                              MUTED,
                            fontSize:
                              "12px",
                          }}
                        >
                          {
                            row.employeeId
                          }{" "}
                          — {row.role}
                        </div>
                      </td>

                      <td
                        style={
                          cellStyle
                        }
                      >
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            row.grossPay
                          }
                          onChange={(
                            event
                          ) =>
                            updateRow(
                              row.employeeId,
                              "grossPay",
                              event.target
                                .value
                            )
                          }
                          style={{
                            ...inputStyle,
                            minWidth:
                              "115px",
                          }}
                        />
                      </td>

                      <td
                        style={
                          cellStyle
                        }
                      >
                        <select
                          value={
                            row.compensationType
                          }
                          onChange={(
                            event
                          ) =>
                            updateRow(
                              row.employeeId,
                              "compensationType",
                              event.target
                                .value
                            )
                          }
                          style={{
                            ...inputStyle,
                            minWidth:
                              "125px",
                          }}
                        >
                          <option value="Salary">
                            Salary
                          </option>
                          <option value="Wage">
                            Wage
                          </option>
                          <option value="Stipend">
                            Stipend
                          </option>
                          <option value="Allowance">
                            Allowance
                          </option>
                          <option value="Other">
                            Other
                          </option>
                        </select>
                      </td>

                      <td
                        style={
                          cellStyle
                        }
                      >
                        <select
                          value={
                            row.statutoryTreatment
                          }
                          onChange={(
                            event
                          ) =>
                            updateRow(
                              row.employeeId,
                              "statutoryTreatment",
                              event.target
                                .value
                            )
                          }
                          style={{
                            ...inputStyle,
                            minWidth:
                              "190px",
                          }}
                        >
                          <option value="Standard">
                            Standard
                          </option>

                          <option value="Employer-Assisted Net Pay">
                            Employer-Assisted
                            Net Pay
                          </option>
                        </select>
                      </td>

                      <td
                        style={
                          cellStyle
                        }
                      >
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          disabled={
                            row.statutoryTreatment !==
                            "Employer-Assisted Net Pay"
                          }
                          value={
                            row.targetNetPay
                          }
                          placeholder={
                            row.grossPay ||
                            "0"
                          }
                          onChange={(
                            event
                          ) =>
                            updateRow(
                              row.employeeId,
                              "targetNetPay",
                              event.target
                                .value
                            )
                          }
                          style={{
                            ...(row.statutoryTreatment ===
                            "Employer-Assisted Net Pay"
                              ? inputStyle
                              : readOnlyStyle),
                            minWidth:
                              "120px",
                          }}
                        />
                      </td>

                      <td
                        style={
                          cellStyle
                        }
                      >
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            row.pensionEmployee
                          }
                          onChange={(
                            event
                          ) =>
                            updateRow(
                              row.employeeId,
                              "pensionEmployee",
                              event.target
                                .value
                            )
                          }
                          style={{
                            ...inputStyle,
                            minWidth:
                              "105px",
                          }}
                        />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      style={cellStyle}
                      colSpan="7"
                    >
                      No active,
                      Payroll-enabled
                      employees found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
              marginTop: "14px",
            }}
          >
            <button
              type="button"
              onClick={previewBatch}
              disabled={
                previewing ||
                creating
              }
              style={{
                ...primaryButtonStyle,
                marginTop: 0,
                opacity:
                  previewing ||
                  creating
                    ? 0.65
                    : 1,
              }}
            >
              {previewing
                ? "Calculating Batch…"
                : `Preview Selected (${selectedRows.length})`}
            </button>

            {successfulPreviewCount >
              0 && (
              <button
                type="button"
                onClick={
                  createBatch
                }
                disabled={
                  creating ||
                  previewing
                }
                style={{
                  ...primaryButtonStyle,
                  marginTop: 0,
                  backgroundColor:
                    "#16a34a",
                  opacity:
                    creating ||
                    previewing
                      ? 0.65
                      : 1,
                }}
              >
                {creating
                  ? "Creating Pending Payroll…"
                  : `Create Successful Records (${successfulPreviewCount})`}
              </button>
            )}
          </div>

          {batchPreview?.summary && (
            <div
              style={{
                ...metricGridStyle,
                marginTop: "18px",
              }}
            >
              <Metric
                label="Requested"
                value={
                  batchPreview
                    .summary
                    .requestedRecords ||
                  0
                }
              />

              <Metric
                label="Successful"
                value={
                  batchPreview
                    .summary
                    .successfulRecords ||
                  0
                }
                color="#16a34a"
              />

              <Metric
                label="Failed"
                value={
                  batchPreview
                    .summary
                    .failedRecords ||
                  0
                }
                color="#dc2626"
              />

              <Metric
                label="Batch Gross"
                value={formatCurrency(
                  batchPreview
                    .summary
                    .totals
                    ?.grossPay
                )}
              />

              <Metric
                label="Batch Net Pay"
                value={formatCurrency(
                  batchPreview
                    .summary
                    .totals
                    ?.netPay
                )}
                color="#16a34a"
              />

              <Metric
                label="Batch Employment Cost"
                value={formatCurrency(
                  batchPreview
                    .summary
                    .totals
                    ?.totalPayrollCost
                )}
                color="#7c3aed"
              />
            </div>
          )}

          {Array.isArray(
            batchPreview?.data
          ) && (
            <div
              style={{
                overflowX: "auto",
                marginTop: "16px",
              }}
            >
              <table style={tableStyle}>
                <thead
                  style={{
                    backgroundColor:
                      "#eef4ff",
                  }}
                >
                  <tr>
                    <th style={cellStyle}>
                      Employee
                    </th>
                    <th style={cellStyle}>
                      Result
                    </th>
                    <th style={cellStyle}>
                      Gross
                    </th>
                    <th style={cellStyle}>
                      Deductions
                    </th>
                    <th style={cellStyle}>
                      Advance
                    </th>
                    <th style={cellStyle}>
                      Net Pay
                    </th>
                    <th style={cellStyle}>
                      Compliance
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {batchPreview.data.map(
                    (result) => {
                      const payroll =
                        result.data ||
                        {};

                      const assessment =
                        payroll.minimumWageAssessment ||
                        {};

                      return (
                        <tr
                          key={`${result.rowNumber}-${result.employeeId}`}
                        >
                          <td
                            style={
                              cellStyle
                            }
                          >
                            <strong>
                              {
                                result.employeeName
                              }
                            </strong>

                            <div
                              style={{
                                color:
                                  MUTED,
                                fontSize:
                                  "12px",
                              }}
                            >
                              {
                                result.employeeId
                              }
                            </div>
                          </td>

                          <td
                            style={
                              cellStyle
                            }
                          >
                            <span
                              style={{
                                color:
                                  result.success
                                    ? "#16a34a"
                                    : "#dc2626",
                                fontWeight:
                                  700,
                              }}
                            >
                              {result.success
                                ? "Ready"
                                : result.message}
                            </span>
                          </td>

                          <td
                            style={
                              cellStyle
                            }
                          >
                            {result.success
                              ? formatCurrency(
                                  payroll.grossPay
                                )
                              : "-"}
                          </td>

                          <td
                            style={
                              cellStyle
                            }
                          >
                            {result.success
                              ? formatCurrency(
                                  payroll.totalDeductions
                                )
                              : "-"}
                          </td>

                          <td
                            style={
                              cellStyle
                            }
                          >
                            {result.success
                              ? formatCurrency(
                                  payroll.advanceRecovery
                                )
                              : "-"}
                          </td>

                          <td
                            style={
                              cellStyle
                            }
                          >
                            {result.success
                              ? formatCurrency(
                                  payroll.netPay
                                )
                              : "-"}
                          </td>

                          <td
                            style={
                              cellStyle
                            }
                          >
                            {result.success
                              ? assessment.assessmentStatus ||
                                "Not Assessed"
                              : "Blocked"}
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: "grid", gap: "6px" }}>
      <span style={{ fontWeight: 700, color: "#334155", fontSize: "14px" }}>
        {label}
      </span>
      {children}
    </label>
  );
}

function ManualDeduction({ label, name, value, disabled, onChange }) {
  return (
    <Field label={label}>
      <input
        type="number"
        min="0"
        step="0.01"
        name={name}
        value={value}
        disabled={disabled}
        onChange={onChange}
        style={disabled ? readOnlyStyle : inputStyle}
      />
    </Field>
  );
}

function Metric({ label, value, color = ROYAL_BLUE }) {
  return (
    <div style={metricStyle}>
      <div style={{ color: MUTED, fontSize: "13px", marginBottom: "7px" }}>
        {label}
      </div>
      <div style={{ color, fontSize: "18px", fontWeight: 800 }}>{value}</div>
    </div>
  );
}

function StatusBadge({ status }) {
  const colours = {
    Pending: "#f59e0b",
    Approved: "#0B3D91",
    Paid: "#16a34a",
    Cancelled: "#dc2626",
    Reversed: "#64748b",
  };

  const color = colours[status] || "#64748b";

  return (
    <span
      style={{
        display: "inline-block",
        backgroundColor: color,
        color: WHITE,
        borderRadius: "999px",
        padding: "4px 10px",
        fontSize: "12px",
        fontWeight: 700,
      }}
    >
      {status || "Pending"}
        </span>
  );
}

const cardStyle = {
  backgroundColor: WHITE,
  border: `1px solid ${BORDER}`,
  borderRadius: "14px",
  padding: "20px",
  boxShadow: "0 4px 14px rgba(15, 23, 42, 0.05)",
};

const metricGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "12px",
  marginBottom: "20px",
};

const metricStyle = {
  backgroundColor: "#f8fbff",
  border: `1px solid ${BORDER}`,
  borderRadius: "12px",
  padding: "14px",
};

const sectionTitleStyle = {
  color: ROYAL_BLUE,
  marginTop: 0,
};

const noticeStyle = {
  marginBottom: "18px",
  padding: "14px",
  borderRadius: "12px",
  border: `1px solid ${BORDER}`,
  backgroundColor: "#f8fbff",
};

const formGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: "15px",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  minHeight: "42px",
  border: `1px solid ${BORDER}`,
  borderRadius: "8px",
  padding: "9px 10px",
  backgroundColor: WHITE,
};

const readOnlyStyle = {
  ...inputStyle,
  backgroundColor: "#f1f5f9",
  color: "#475569",
};

const primaryButtonStyle = {
  marginTop: "20px",
  backgroundColor: ROYAL_BLUE,
  color: WHITE,
  border: "none",
  borderRadius: "8px",
  padding: "11px 17px",
  fontWeight: 700,
};

const secondaryButtonStyle = {
  backgroundColor: ROYAL_BLUE,
  color: WHITE,
  border: "none",
  borderRadius: "8px",
  padding: "8px 13px",
  fontWeight: 700,
  cursor: "pointer",
};

const actionButtonStyle = (backgroundColor) => ({
  backgroundColor,
  color: WHITE,
  border: "none",
  borderRadius: "7px",
  padding: "7px 11px",
  fontWeight: 700,
  cursor: "pointer",
  whiteSpace: "nowrap",
});

const payslipButtonStyle = {
  backgroundColor: "#16a34a",
  color: WHITE,
  border: "none",
  borderRadius: "7px",
  padding: "7px 11px",
  fontWeight: 700,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const recordsHeaderStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "15px",
  flexWrap: "wrap",
  marginBottom: "15px",
};

const tableStyle = {
  width: "100%",
  minWidth: "1750px",
  borderCollapse: "collapse",
};

const cellStyle = {
  border: `1px solid ${BORDER}`,
  padding: "10px",
  textAlign: "left",
  verticalAlign: "middle",
};

const paginationStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "14px",
  marginTop: "16px",
};

const errorStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "10px",
  color: "#991b1b",
  backgroundColor: "#fee2e2",
  border: "1px solid #fecaca",
  borderRadius: "10px",
  padding: "12px 14px",
  marginBottom: "18px",
};

const closeStyle = {
  border: "none",
  background: "transparent",
  color: "#991b1b",
  fontSize: "20px",
  cursor: "pointer",
};

export default Payroll;