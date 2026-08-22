import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../api";

const BLUE = "#0B3D91";
const BORDER = "#dbe3ef";
const MUTED = "#64748b";

const todayYmd = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Jamaica",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
};
const number = (value) => Number(value || 0);
const formatPercent = (value) => `${number(value).toFixed(2)}%`;

const cardStyle = (background = "#ffffff") => ({
  background,
  border: `1px solid ${BORDER}`,
  borderRadius: "14px",
  padding: "16px",
});

const pickData = (response) => response?.data?.data || response?.data || {};

function HRConsolidatedReportingDashboard() {
  const [asOfDate, setAsOfDate] = useState(todayYmd());
  const [reports, setReports] = useState({});
  const [sourceErrors, setSourceErrors] = useState({});
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    setLoading(true);

    const sources = [
      ["workforce", "/api/hr-analytics/dashboard"],
      ["attendance", "/api/hr-analytics/attendance"],
      ["leave", "/api/hr-analytics/leave-utilization"],
      ["turnover", "/api/hr-analytics/turnover"],
      ["payroll", "/api/hr-analytics/payroll-compliance"],
    ];

    const results = await Promise.allSettled(
      sources.map(([, url]) => api.get(url, { params: { asOfDate } }))
    );

    const nextReports = {};
    const nextErrors = {};

    results.forEach((result, index) => {
      const [key] = sources[index];

      if (result.status === "fulfilled") {
        nextReports[key] = pickData(result.value);
      } else {
        nextErrors[key] =
          result.reason?.response?.data?.message ||
          `The ${key} reporting source could not be loaded.`;
      }
    });

    setReports(nextReports);
    setSourceErrors(nextErrors);
    setLoading(false);
  }, [asOfDate]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const summary = useMemo(() => {
    const workforce = reports.workforce?.workforce || reports.workforce?.summary || {};
    const attendance = reports.attendance?.summary || {};
    const leave = reports.leave?.summary || {};
    const turnover = reports.turnover?.summary || {};
    const payroll = reports.payroll?.summary || {};

    const alerts = [
      [number(workforce.employeesWithoutManagers), "employee(s) have no assigned manager"],
      [number(workforce.employeesMissingPhotos), "employee profile photo(s) are missing"],
      [number(attendance.exceptionDays ?? attendance.exceptions), "attendance exception(s) require review"],
      [number(attendance.pendingAdjustments), "attendance adjustment(s) are pending"],
      [number(leave.pendingDocuments), "leave document requirement(s) are pending"],
      [number(turnover.overdueCases), "lifecycle case(s) are overdue"],
      [number(turnover.blockedCases), "lifecycle case(s) are blocked"],
      [number(turnover.masterRecordInconsistencies ?? turnover.masterIssues), "employee-master lifecycle issue(s) exist"],
      [number(payroll.blocked), "employee(s) are blocked from payroll readiness"],
      [number(payroll.missingCompensation), "employee(s) have missing active compensation"],
      [number(payroll.attendanceNotReady), "employee attendance record(s) are not payroll ready"],
      [number(payroll.nonCompliantPayroll), "payroll record(s) are non-compliant"],
    ].filter(([count]) => count > 0);

    return {
      workforce,
      attendance,
      leave,
      turnover,
      payroll,
      alerts,
    };
  }, [reports]);

  const modules = [
    {
      name: "Workforce",
      available: Boolean(reports.workforce),
      primary: `${number(summary.workforce.activeEmployees)} active`,
      secondary: `${number(summary.workforce.totalEmployees)} total employees`,
      issues:
        number(summary.workforce.employeesWithoutManagers) +
        number(summary.workforce.employeesMissingPhotos),
    },
    {
      name: "Attendance",
      available: Boolean(reports.attendance),
      primary: formatPercent(summary.attendance.attendanceRate),
      secondary: `${number(summary.attendance.payableHours).toFixed(2)} payable hrs`,
      issues:
        number(summary.attendance.exceptionDays ?? summary.attendance.exceptions) +
        number(summary.attendance.pendingAdjustments),
    },
    {
      name: "Leave",
      available: Boolean(reports.leave),
      primary: `${number(summary.leave.approvedLeaveDays ?? summary.leave.approvedDays).toFixed(2)} approved days`,
      secondary: `${number(summary.leave.totalLeaveRequests ?? summary.leave.leaveRequests)} requests`,
      issues: number(summary.leave.pendingDocuments),
    },
    {
      name: "Lifecycle",
      available: Boolean(reports.turnover),
      primary: formatPercent(summary.turnover.turnoverRate),
      secondary: `${number(summary.turnover.totalCases)} lifecycle cases`,
      issues:
        number(summary.turnover.overdueCases) +
        number(summary.turnover.blockedCases) +
        number(summary.turnover.masterRecordInconsistencies ?? summary.turnover.masterIssues),
    },
    {
      name: "Payroll",
      available: Boolean(reports.payroll),
      primary: `${number(summary.payroll.payrollReady ?? summary.payroll.eligible)} ready`,
      secondary: `${number(summary.payroll.blocked)} blocked`,
      issues:
        number(summary.payroll.blocked) +
        number(summary.payroll.nonCompliantPayroll),
    },
  ];

  return (
    <section style={{ display: "grid", gap: "16px" }}>
      <div style={cardStyle()}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h2 style={{ color: BLUE, margin: 0 }}>
              Consolidated HR Reporting Dashboard
            </h2>
            <p style={{ color: MUTED, margin: "6px 0 0" }}>
              Executive view of workforce, attendance, leave, lifecycle and payroll controls.
            </p>
          </div>

          <button
            type="button"
            onClick={loadDashboard}
            disabled={loading}
            style={{
              border: 0,
              borderRadius: "8px",
              padding: "11px 16px",
              background: BLUE,
              color: "#ffffff",
              fontWeight: 700,
              cursor: loading ? "wait" : "pointer",
              opacity: loading ? 0.65 : 1,
            }}
          >
            {loading ? "Refreshing..." : "Refresh Dashboard"}
          </button>
        </div>

        <label style={{ display: "block", marginTop: "16px", fontWeight: 700 }}>
          Reporting date
          <input
            type="date"
            value={asOfDate}
            onChange={(event) => setAsOfDate(event.target.value)}
            style={{
              display: "block",
              width: "220px",
              maxWidth: "100%",
              marginTop: "6px",
              padding: "10px 12px",
              border: `1px solid ${BORDER}`,
              borderRadius: "8px",
            }}
          />
        </label>
      </div>

      {Object.keys(sourceErrors).length > 0 && (
        <div style={cardStyle("#fff7ed")}>
          <strong style={{ color: "#9a3412" }}>Reporting source warning</strong>
          {Object.entries(sourceErrors).map(([source, message]) => (
            <div key={source} style={{ color: "#9a3412", marginTop: "6px" }}>
              {source}: {message}
            </div>
          ))}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(185px, 1fr))",
          gap: "12px",
        }}
      >
        {modules.map((module) => {
          const status = !module.available
            ? "Unavailable"
            : module.issues > 0
              ? "Attention"
              : "Healthy";
          const statusColor =
            status === "Healthy" ? "#15803d" : status === "Attention" ? "#b45309" : "#b91c1c";

          return (
            <div key={module.name} style={cardStyle()}>
              <div style={{ color: MUTED }}>{module.name}</div>
              <div style={{ color: BLUE, fontSize: "22px", fontWeight: 800, marginTop: "6px" }}>
                {module.available ? module.primary : "—"}
              </div>
              <div style={{ color: MUTED, marginTop: "4px" }}>{module.secondary}</div>
              <div style={{ color: statusColor, fontWeight: 700, marginTop: "10px" }}>
                {status}{module.available && module.issues > 0 ? ` · ${module.issues}` : ""}
              </div>
            </div>
          );
        })}
      </div>

      <div style={cardStyle(summary.alerts.length ? "#fef2f2" : "#f0fdf4")}>
        <h3 style={{ color: BLUE, margin: 0 }}>Priority HR Controls</h3>

        {loading ? (
          <p style={{ color: MUTED }}>Loading consolidated controls...</p>
        ) : summary.alerts.length === 0 ? (
          <p style={{ color: "#166534", marginBottom: 0 }}>
            No priority exceptions were reported by the available H11 sources.
          </p>
        ) : (
          <ul style={{ marginBottom: 0, paddingLeft: "22px", color: "#991b1b" }}>
            {summary.alerts.map(([count, label]) => (
              <li key={label} style={{ marginTop: "6px" }}>
                <strong>{count}</strong> {label}.
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default HRConsolidatedReportingDashboard;