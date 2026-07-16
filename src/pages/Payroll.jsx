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
    const [registerTotals, setRegisterTotals] =
    useState(null);

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

    const loadPayrollRegister = async () => {
    const res = await api.get(
      "/api/payroll/reports/register?limit=1000"
    );

    const register =
      res.data?.totals || {};

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
      netPay: Number(register.netPay || 0),
      advanceRecovery: Number(
        register.advanceRecovery || 0
      ),
      totalEmployerContributions: Number(
        register.totalEmployerContributions ||
          0
      ),
      totalPayrollCost: Number(
        register.totalPayrollCost || 0
      ),
      governmentLiabilities:
        register.governmentLiabilities || {
          total: 0,
        },
    });
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
          label="Government Liabilities"
          value={formatCurrency(
            registerTotals
              ?.governmentLiabilities
              ?.total || 0
          )}
          color="#7c3aed"
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

      <section style={{ ...cardStyle, marginTop: "22px" }}>
        <div style={recordsHeaderStyle}>
          <div>
            <h2 style={{ ...sectionTitleStyle, marginBottom: "4px" }}>
              Payroll Records
            </h2>
            <span style={{ color: MUTED }}>Total records: {pagination.total}</span>
          </div>
          <select
            value={pagination.limit}
            onChange={(event) => changeLimit(Number(event.target.value))}
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
                {payroll.length ? (
                  payroll.map((item) => (
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
                        {!item.statutoryRuleCode ? (
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
                              item
                                .minimumWageAssessment
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
                                                    {!item.statutoryRuleCode && (
                            <span
                              style={{
                                color: MUTED,
                                fontSize: "12px",
                              }}
                            >
                              Legacy record
                            </span>
                          )}

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
            disabled={pagination.page <= 1 || loading}
            onClick={() => changePage(Math.max(1, pagination.page - 1))}
            style={secondaryButtonStyle}
          >
            Previous
          </button>
          <strong>
            Page {pagination.page} of {Math.max(1, pagination.pages || 1)}
          </strong>
          <button
            type="button"
            disabled={pagination.page >= pagination.pages || loading}
            onClick={() =>
              changePage(Math.min(pagination.pages, pagination.page + 1))
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