import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../api";

const BLUE = "#0B3D91";
const BORDER = "#dbe3ef";
const MUTED = "#64748b";
const card = {
  background: "#fff",
  border: `1px solid ${BORDER}`,
  borderRadius: "14px",
  padding: "16px",
};
const field = {
  width: "100%",
  boxSizing: "border-box",
  border: `1px solid ${BORDER}`,
  borderRadius: "8px",
  padding: "9px 10px",
  background: "#fff",
};
const button = {
  border: 0,
  borderRadius: "8px",
  padding: "10px 14px",
  background: BLUE,
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
};

const today = () => new Date().toISOString().slice(0, 10);
const yearAgo = () => {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 1);
  return date.toISOString().slice(0, 10);
};

function Breakdown({ title, rows = [] }) {
  return (
    <div style={card}>
      <h3 style={{ color: BLUE, margin: "0 0 10px" }}>{title}</h3>
      {rows.length === 0 ? (
        <div style={{ color: MUTED }}>No records found.</div>
      ) : (
        rows.map((row) => (
          <div key={row.label} style={{ marginBottom: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
              <span>{row.label}</span>
              <strong>{row.count} ({row.percentage}%)</strong>
            </div>
            <div style={{ height: "6px", background: "#e2e8f0", borderRadius: "999px", marginTop: "4px" }}>
              <div style={{ width: `${Math.min(100, row.percentage)}%`, height: "100%", background: BLUE, borderRadius: "999px" }} />
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default function HRTurnoverReportingPanel({ employees = [] }) {
  const [filters, setFilters] = useState({
    startDate: yearAgo(),
    endDate: today(),
    employeeId: "",
    department: "",
    branch: "",
    caseType: "",
    status: "",
  });
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const departments = useMemo(
    () => [...new Set(employees.map((item) => item.department).filter(Boolean))].sort(),
    [employees]
  );
  const branches = useMemo(
    () => [...new Set(employees.map((item) => item.branch).filter(Boolean))].sort(),
    [employees]
  );

  const loadReport = useCallback(async (nextFilters = filters) => {
    try {
      setLoading(true);
      setError("");
      const params = Object.fromEntries(
        Object.entries(nextFilters).filter(([, value]) => String(value || "").trim())
      );
      const response = await api.get("/api/hr-analytics/turnover", { params });
      setReport(response.data || null);
    } catch (requestError) {
      setReport(null);
      setError(
        requestError?.response?.data?.message ||
          "Failed to load turnover and employee-lifecycle reporting."
      );
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadReport(filters);
    // Initial report only; subsequent requests use Apply Filters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (name, value) =>
    setFilters((current) => ({ ...current, [name]: value }));

  const reset = () => {
    const next = {
      startDate: yearAgo(),
      endDate: today(),
      employeeId: "",
      department: "",
      branch: "",
      caseType: "",
      status: "",
    };
    setFilters(next);
    loadReport(next);
  };

  const summary = report?.summary || {};
  const breakdowns = report?.breakdowns || {};
  const rows = report?.data || [];

  return (
    <div style={{ display: "grid", gap: "18px" }}>
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
          <div>
            <h2 style={{ color: BLUE, margin: 0 }}>Turnover and Employee Lifecycle Reporting</h2>
            <p style={{ color: MUTED, marginBottom: 0 }}>
              Review onboarding, offboarding, turnover, completion time, overdue work and employee-master inconsistencies.
            </p>
          </div>
          <button type="button" style={button} onClick={() => loadReport()} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh Lifecycle Report"}
          </button>
        </div>
      </div>

      <div style={card}>
        <h3 style={{ color: BLUE, marginTop: 0 }}>Lifecycle Filters</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "10px" }}>
          <input type="date" value={filters.startDate} onChange={(event) => update("startDate", event.target.value)} style={field} />
          <input type="date" value={filters.endDate} onChange={(event) => update("endDate", event.target.value)} style={field} />
          <select value={filters.employeeId} onChange={(event) => update("employeeId", event.target.value)} style={field}>
            <option value="">All Employees</option>
            {employees.map((employee) => <option key={employee.employeeId} value={employee.employeeId}>{employee.fullName}</option>)}
          </select>
          <select value={filters.department} onChange={(event) => update("department", event.target.value)} style={field}>
            <option value="">All Departments</option>
            {departments.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
          <select value={filters.branch} onChange={(event) => update("branch", event.target.value)} style={field}>
            <option value="">All Branches</option>
            {branches.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
          <select value={filters.caseType} onChange={(event) => update("caseType", event.target.value)} style={field}>
            <option value="">All Case Types</option>
            <option value="Onboarding">Onboarding</option>
            <option value="Offboarding">Offboarding</option>
          </select>
          <select value={filters.status} onChange={(event) => update("status", event.target.value)} style={field}>
            <option value="">All Statuses</option>
            {["Draft", "Pending Approval", "Approved", "In Progress", "Blocked", "Ready for Completion", "Completed", "Cancelled"].map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
          <button type="button" style={button} onClick={() => loadReport()} disabled={loading}>Apply Filters</button>
          <button type="button" style={{ ...button, background: "#e2e8f0", color: "#334155" }} onClick={reset} disabled={loading}>Clear Filters</button>
        </div>
      </div>

      {error && <div style={{ ...card, borderColor: "#fecaca", background: "#fef2f2", color: "#991b1b" }}>{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))", gap: "12px" }}>
        {[
          [summary.totalCases, "Lifecycle Cases", BLUE],
          [summary.completedOnboardings, "Completed Onboarding", "#059669"],
          [summary.completedOffboardings, "Completed Offboarding", "#7c3aed"],
          [`${summary.turnoverRate || 0}%`, "Turnover Rate", "#dc2626"],
          [summary.overdueCases, "Overdue", "#d97706"],
          [summary.blockedCases, "Blocked", "#be123c"],
          [summary.averageCompletionDays, "Avg. Completion Days", "#0891b2"],
          [summary.masterRecordInconsistencies, "Master Issues", "#dc2626"],
        ].map(([value, label, color]) => (
          <div key={label} style={card}>
            <div style={{ color, fontSize: "24px", fontWeight: 800 }}>{value || 0}</div>
            <div style={{ color: MUTED }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
        <Breakdown title="Lifecycle Status" rows={breakdowns.byStatus} />
        <Breakdown title="Case Type" rows={breakdowns.byCaseType} />
        <Breakdown title="Lifecycle by Department" rows={breakdowns.byDepartment} />
        <Breakdown title="Lifecycle by Branch" rows={breakdowns.byBranch} />
        <Breakdown title="Completed Offboarding Reasons" rows={breakdowns.offboardingReasons} />
      </div>

      {(report?.inconsistencies || []).length > 0 && (
        <div style={{ ...card, borderColor: "#fca5a5" }}>
          <h3 style={{ color: "#b91c1c", marginTop: 0 }}>Employee-Master Reconciliation Required</h3>
          {report.inconsistencies.map((item) => (
            <div key={`${item.lifecycleCaseNumber}-${item.employeeId}`} style={{ marginBottom: "8px" }}>
              <strong>{item.fullName} ({item.employeeId})</strong>: {item.issue} [{item.lifecycleCaseNumber}]
            </div>
          ))}
        </div>
      )}

      <div style={card}>
        <h3 style={{ color: BLUE, marginTop: 0 }}>Employee Lifecycle Register</h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "1150px" }}>
            <thead><tr style={{ background: "#eef4ff" }}>
              {["Case", "Employee", "Department", "Branch", "Type", "Reason", "Planned", "Actual", "Status", "Days", "Control"].map((heading) =>
                <th key={heading} style={{ padding: "10px", textAlign: "left", border: `1px solid ${BORDER}` }}>{heading}</th>
              )}
            </tr></thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan="11" style={{ padding: "18px", textAlign: "center", color: MUTED, border: `1px solid ${BORDER}` }}>No lifecycle cases match the selected filters.</td></tr>
              ) : rows.map((row) => (
                <tr key={row.lifecycleCaseNumber}>
                  {[row.lifecycleCaseNumber, `${row.fullName} · ${row.employeeId}`, row.department || "-", row.branch || "-", row.caseType, row.reason || "-", row.plannedEffectiveDate || "-", row.actualEffectiveDate || "-", row.status, row.completionDays ?? "-", row.overdue ? "Overdue" : "Clear"].map((value, index) =>
                    <td key={index} style={{ padding: "9px", border: `1px solid ${BORDER}`, color: index === 10 && row.overdue ? "#b91c1c" : "inherit" }}>{value}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}