import { useEffect, useMemo, useState } from "react";
import api from "../api";

const BLUE = "#0B3D91";
const BORDER = "#dbe3ef";
const MUTED = "#64748b";

const formatMoney = (value) =>
  new Intl.NumberFormat("en-JM", {
    style: "currency",
    currency: "JMD",
    minimumFractionDigits: 2,
  }).format(Number(value || 0));

  const formatRate = (value) => {
  const percentage =
    Number(value || 0) * 100;

  return `${percentage
    .toFixed(4)
    .replace(/\.?0+$/, "")}%`;
};

const inputStyle = {
  width: "100%",
  minWidth: 0,
  padding: "9px 10px",
  border: `1px solid ${BORDER}`,
  borderRadius: "8px",
  background: "#fff",
};

const buttonStyle = {
  border: "none",
  borderRadius: "8px",
  padding: "10px 14px",
  background: BLUE,
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
};

const cardStyle = {
  background: "#fff",
  border: `1px solid ${BORDER}`,
  borderRadius: "14px",
  padding: "16px",
};

const tableWrapStyle = { overflowX: "auto" };

const thStyle = {
  padding: "10px",
  textAlign: "left",
  background: "#edf3fc",
  border: `1px solid ${BORDER}`,
  whiteSpace: "nowrap",
};

const tdStyle = {
  padding: "10px",
  border: `1px solid ${BORDER}`,
  verticalAlign: "top",
};

const statusColor = (status) => {
  if (["Eligible", "Compliant", "Paid", "Approved", "Payroll Ready"].includes(status)) {
    return { background: "#dcfce7", color: "#166534" };
  }

  if (["Blocked", "Non-Compliant"].includes(status)) {
    return { background: "#fee2e2", color: "#991b1b" };
  }

  return { background: "#fef3c7", color: "#92400e" };
};

function StatusBadge({ children }) {
  return (
    <span
      style={{
        display: "inline-block",
        borderRadius: "999px",
        padding: "5px 9px",
        fontSize: "12px",
        fontWeight: 700,
        ...statusColor(children),
      }}
    >
      {children || "Not specified"}
    </span>
  );
}

function Metric({ value, label, color = BLUE }) {
  return (
    <div style={cardStyle}>
      <div style={{ color, fontSize: "23px", fontWeight: 800 }}>{value}</div>
      <div style={{ color: MUTED }}>{label}</div>
    </div>
  );
}

function HRPayrollComplianceReportingPanel({ employees = [] }) {
  const today = new Date().toISOString().slice(0, 10);
  const [filters, setFilters] = useState({
    asOfDate: today,
    payPeriod: today.slice(0, 7),
    employeeId: "",
    department: "",
    branch: "",
    employmentStatus: "",
    eligibilityStatus: "",
    payrollStatus: "",
    readinessStatus: "",
    complianceStatus: "",
  });
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadReport = async (nextFilters = appliedFilters) => {
    try {
      setLoading(true);
      setError("");

      const params = Object.fromEntries(
        Object.entries(nextFilters).filter(([, value]) => String(value || "").trim())
      );

      const response = await api.get("/api/hr-analytics/payroll-compliance", {
        params,
      });

      setReport(response.data);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          "Failed to load payroll eligibility and compliance reporting."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport(appliedFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedFilters]);

  const options = useMemo(() => {
    const reportEmployees = report?.filters?.employees || [];

    return {
      employees: reportEmployees.length
        ? reportEmployees
        : employees.map((employee) => ({
            employeeId: employee.employeeId,
            fullName: employee.fullName,
          })),
      departments:
        report?.filters?.departments ||
        [...new Set(employees.map((employee) => employee.department).filter(Boolean))].sort(),
      branches:
        report?.filters?.branches ||
        [...new Set(employees.map((employee) => employee.branch).filter(Boolean))].sort(),
    };
  }, [employees, report]);

  const updateFilter = (field, value) => {
    setFilters((current) => ({ ...current, [field]: value }));
  };

  const applyFilters = () => setAppliedFilters({ ...filters });

  const clearFilters = () => {
    const cleared = {
      asOfDate: today,
      payPeriod: today.slice(0, 7),
      employeeId: "",
      department: "",
      branch: "",
      employmentStatus: "",
      eligibilityStatus: "",
      payrollStatus: "",
      readinessStatus: "",
      complianceStatus: "",
    };

    setFilters(cleared);
    setAppliedFilters(cleared);
  };

  const summary = report?.summary || {};
  const employeeRegister = report?.employeeRegister || [];
  const payrollRecords = report?.payrollComplianceRecords || [];
  const statutoryRules = report?.effectiveRules?.statutory || [];
  const wageRules = report?.effectiveRules?.minimumWage || [];

  return (
    <div style={{ display: "grid", gap: "16px", marginTop: "16px" }}>
      <section style={cardStyle}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h2 style={{ color: BLUE, margin: 0 }}>
              Payroll Eligibility and Compliance Reporting
            </h2>
            <p style={{ color: MUTED, marginBottom: 0 }}>
              Review employee eligibility, compensation, payroll-ready attendance,
              statutory-rule evidence and minimum-wage compliance.
            </p>
          </div>

          <button type="button" style={buttonStyle} onClick={() => loadReport()}>
            {loading ? "Refreshing..." : "Refresh Payroll Report"}
          </button>
        </div>
      </section>

      {error && (
        <div
          style={{
            padding: "12px 14px",
            borderRadius: "10px",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#991b1b",
          }}
        >
          {error}
        </div>
      )}

      <section style={cardStyle}>
        <h3 style={{ color: BLUE, marginTop: 0 }}>Payroll Compliance Filters</h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(165px, 1fr))",
            gap: "10px",
          }}
        >
          <input
            type="month"
            value={filters.payPeriod}
            onChange={(event) => updateFilter("payPeriod", event.target.value)}
            style={inputStyle}
            title="Pay period"
          />
          <input
            type="date"
            value={filters.asOfDate}
            onChange={(event) => updateFilter("asOfDate", event.target.value)}
            style={inputStyle}
            title="As-of date"
          />
          <select
            value={filters.employeeId}
            onChange={(event) => updateFilter("employeeId", event.target.value)}
            style={inputStyle}
          >
            <option value="">All Employees</option>
            {options.employees.map((employee) => (
              <option key={employee.employeeId} value={employee.employeeId}>
                {employee.fullName} — {employee.employeeId}
              </option>
            ))}
          </select>
          <select
            value={filters.department}
            onChange={(event) => updateFilter("department", event.target.value)}
            style={inputStyle}
          >
            <option value="">All Departments</option>
            {options.departments.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
          <select
            value={filters.branch}
            onChange={(event) => updateFilter("branch", event.target.value)}
            style={inputStyle}
          >
            <option value="">All Branches</option>
            {options.branches.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
          <select
            value={filters.eligibilityStatus}
            onChange={(event) => updateFilter("eligibilityStatus", event.target.value)}
            style={inputStyle}
          >
            <option value="">All Master Eligibility</option>
            <option>Pending Review</option>
            <option>Eligible</option>
            <option>On Hold</option>
            <option>Not Eligible</option>
          </select>
          <select
            value={filters.readinessStatus}
            onChange={(event) => updateFilter("readinessStatus", event.target.value)}
            style={inputStyle}
          >
            <option value="">All Readiness Results</option>
            <option>Eligible</option>
            <option>Blocked</option>
          </select>
          <select
            value={filters.complianceStatus}
            onChange={(event) => updateFilter("complianceStatus", event.target.value)}
            style={inputStyle}
          >
            <option value="">All Compliance Results</option>
            <option>Compliant</option>
            <option>Non-Compliant</option>
            <option>Review Required</option>
            <option>Not Assessed</option>
            <option>Not Applicable</option>
          </select>
          <select
            value={filters.payrollStatus}
            onChange={(event) => updateFilter("payrollStatus", event.target.value)}
            style={inputStyle}
          >
            <option value="">All Payroll Statuses</option>
            <option>Draft</option>
            <option>Pending</option>
            <option>Approved</option>
            <option>Paid</option>
            <option>Reversed</option>
            <option>Cancelled</option>
          </select>
        </div>

        <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
          <button type="button" style={buttonStyle} onClick={applyFilters}>
            Apply Filters
          </button>
          <button
            type="button"
            style={{ ...buttonStyle, background: "#e2e8f0", color: "#1e293b" }}
            onClick={clearFilters}
          >
            Clear Filters
          </button>
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(135px, 1fr))",
          gap: "10px",
        }}
      >
        <Metric value={summary.employees || 0} label="Employees" />
        <Metric value={summary.eligible || 0} label="Payroll Ready" color="#16a34a" />
        <Metric value={summary.blocked || 0} label="Blocked" color="#dc2626" />
        <Metric value={summary.missingCompensation || 0} label="Missing Base Pay" color="#d97706" />
        <Metric value={summary.attendanceNotReady || 0} label="Attendance Not Ready" color="#7c3aed" />
        <Metric value={summary.payrollRecords || 0} label="Payroll Records" color="#0891b2" />
        <Metric value={summary.compliantPayroll || 0} label="Compliant" color="#16a34a" />
        <Metric value={summary.nonCompliantPayroll || 0} label="Non-Compliant" color="#dc2626" />
        <Metric
          value={formatMoney(summary.minimumWageShortfall)}
          label="Wage Shortfall"
          color="#be123c"
        />
      </section>

      <section style={cardStyle}>
        <h3 style={{ color: BLUE, marginTop: 0 }}>Employee Payroll-Readiness Register</h3>
        <div style={tableWrapStyle}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={thStyle}>Employee</th>
                <th style={thStyle}>Master Eligibility</th>
                <th style={thStyle}>Active Compensation</th>
                <th style={thStyle}>Attendance</th>
                <th style={thStyle}>Readiness</th>
                <th style={thStyle}>Blockers</th>
                <th style={thStyle}>Latest Payroll</th>
              </tr>
            </thead>
            <tbody>
              {employeeRegister.length === 0 ? (
                <tr><td style={tdStyle} colSpan="7">No employees match the selected filters.</td></tr>
              ) : (
                employeeRegister.map((row) => (
                  <tr key={row.employeeId}>
                    <td style={tdStyle}>
                      <strong>{row.fullName}</strong><br />
                      <small>{row.employeeId} · {row.department} · {row.branch}</small>
                    </td>
                    <td style={tdStyle}>
                      <StatusBadge>{row.payrollEligibilityStatus}</StatusBadge>
                      <div style={{ marginTop: "6px" }}>
                        Payroll {row.payrollEnabled ? "enabled" : "disabled"}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      {row.activeCompensation ? (
                        <>
                          <strong>{formatMoney(row.activeCompensation.amount)}</strong><br />
                          {row.activeCompensation.compensationType} · {row.activeCompensation.payFrequency}<br />
                          <small>{row.activeCompensation.compensationNumber}</small>
                        </>
                      ) : "Missing"}
                    </td>
                    <td style={tdStyle}>
                      <StatusBadge>{row.attendance?.status || "Not Found"}</StatusBadge>
                      {row.attendance && (
                        <div style={{ marginTop: "6px" }}>
                          {row.attendance.periodNumber}<br />
                          {(row.attendance.payableMinutes / 60).toFixed(2)} payable hrs
                        </div>
                      )}
                    </td>
                    <td style={tdStyle}><StatusBadge>{row.eligibilityStatus}</StatusBadge></td>
                    <td style={tdStyle}>
                      {row.blockers.length
                        ? row.blockers.map((blocker) => <div key={blocker}>• {blocker}</div>)
                        : "No blockers"}
                    </td>
                    <td style={tdStyle}>
                      {row.latestPayroll ? (
                        <>
                          <strong>{row.latestPayroll.payrollNumber}</strong><br />
                          <StatusBadge>{row.latestPayroll.status}</StatusBadge><br />
                          <span style={{ display: "inline-block", marginTop: "6px" }}>
                            <StatusBadge>{row.latestPayroll.complianceStatus}</StatusBadge>
                          </span>
                        </>
                      ) : "No payroll for period"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section style={cardStyle}>
        <h3 style={{ color: BLUE, marginTop: 0 }}>Payroll Compliance Register</h3>
        <div style={tableWrapStyle}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={thStyle}>Payroll</th>
                <th style={thStyle}>Employee</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Gross</th>
                <th style={thStyle}>Net</th>
                <th style={thStyle}>Statutory Rule</th>
                <th style={thStyle}>Minimum Wage</th>
                <th style={thStyle}>Leave/Attendance</th>
              </tr>
            </thead>
            <tbody>
              {payrollRecords.length === 0 ? (
                <tr><td style={tdStyle} colSpan="8">No payroll records match the selected period and filters.</td></tr>
              ) : (
                payrollRecords.map((row) => (
                  <tr key={row.payrollNumber}>
                    <td style={tdStyle}><strong>{row.payrollNumber}</strong><br /><small>{row.payPeriod}</small></td>
                    <td style={tdStyle}>{row.employeeName}<br /><small>{row.employeeId}</small></td>
                    <td style={tdStyle}><StatusBadge>{row.status}</StatusBadge></td>
                    <td style={tdStyle}>{formatMoney(row.grossPay)}</td>
                    <td style={tdStyle}>{formatMoney(row.netPay)}</td>
                    <td style={tdStyle}>{row.statutoryRuleCode || "Legacy / missing"}<br /><small>{row.statutoryTreatment}</small></td>
                    <td style={tdStyle}>
                      <StatusBadge>{row.complianceStatus}</StatusBadge><br />
                      <small>
                        Shortfall: {formatMoney(row.minimumWageAssessment?.shortfall)}
                      </small>
                    </td>
                    <td style={tdStyle}>
                      {row.leavePayrollAssessment?.assessmentStatus || "Not assessed"}<br />
                      <small>{row.minimumWageAssessment?.attendancePeriodNumber || "No attendance period"}</small>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section style={cardStyle}>
        <h3 style={{ color: BLUE, marginTop: 0 }}>Effective Jamaican Payroll Rules</h3>
        <div style={tableWrapStyle}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={thStyle}>Rule</th>
                <th style={thStyle}>Category</th>
                <th style={thStyle}>Effective Period</th>
                <th style={thStyle}>Key Rates</th>
                <th style={thStyle}>Source</th>
              </tr>
            </thead>
            <tbody>
              {statutoryRules.map((rule) => (
                <tr key={rule.ruleCode}>
                  <td style={tdStyle}><strong>{rule.name}</strong><br /><small>{rule.ruleCode}</small></td>
                  <td style={tdStyle}>Statutory deductions</td>
                  <td style={tdStyle}>{String(rule.effectiveFrom).slice(0, 10)} to {rule.effectiveTo ? String(rule.effectiveTo).slice(0, 10) : "Open"}</td>
                  <td style={tdStyle}>
  NIS {formatRate(rule.employeeRates?.nis)} ·{" "}
  NHT {formatRate(rule.employeeRates?.nht)} ·{" "}
  Ed Tax {formatRate(
    rule.employeeRates?.educationTax
  )}
</td>
                  <td style={tdStyle}>{rule.sourceNotes || "Controlled rule"}</td>
                </tr>
              ))}
              {wageRules.map((rule) => (
                <tr key={rule.ruleCode}>
                  <td style={tdStyle}><strong>{rule.name}</strong><br /><small>{rule.ruleCode}</small></td>
                  <td style={tdStyle}>{rule.workerCategory} minimum wage</td>
                  <td style={tdStyle}>{String(rule.effectiveFrom).slice(0, 10)} to {rule.effectiveTo ? String(rule.effectiveTo).slice(0, 10) : "Open"}</td>
                  <td style={tdStyle}>{formatMoney(rule.hourlyRate)}/hr · {formatMoney(rule.weeklyRate)}/week</td>
                  <td style={tdStyle}>{rule.sourceName}<br /><small>{rule.sourceReference}</small></td>
                </tr>
              ))}
              {statutoryRules.length === 0 && wageRules.length === 0 && (
                <tr><td style={tdStyle} colSpan="5">No effective rules were found for the selected date.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default HRPayrollComplianceReportingPanel;