import { useEffect, useMemo, useState } from "react";
import api from "../api";

const BLUE = "#0B3D91";
const BORDER = "#dbe3ef";
const MUTED = "#64748b";

const minutesToHours = (value) =>
  `${(Number(value || 0) / 60).toFixed(2)} hrs`;

const todayYmd = () => new Date().toISOString().slice(0, 10);

const monthRange = (periodKey) => {
  const [year, month] = String(periodKey || "").split("-").map(Number);
  if (!year || !month) return { periodStart: "", periodEnd: "" };
  return {
    periodStart: `${year}-${String(month).padStart(2, "0")}-01`,
    periodEnd: new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10),
  };
};

const statusColour = (status) => ({
  Draft: "#64748b",
  Submitted: "#d97706",
  "Manager Approved": "#2563eb",
  "Payroll Ready": "#16a34a",
  Locked: "#111827",
  Reopened: "#7c3aed",
  Cancelled: "#dc2626",
}[status] || "#64748b");

function AttendancePeriodsPanel({ employees = [] }) {
  const [employeeId, setEmployeeId] = useState(employees[0]?.employeeId || "");
  const [periodKey, setPeriodKey] = useState(new Date().toISOString().slice(0, 7));
  const [periods, setPeriods] = useState([]);
  const [selectedNumber, setSelectedNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAdjustment, setShowAdjustment] = useState(false);
  const [showLockForm, setShowLockForm] = useState(false);
  const [lockForm, setLockForm] = useState({
    payrollNumber: "",
    notes: "",
  });
  const [adjustment, setAdjustment] = useState({
    workDate: "",
    adjustmentType: "Worked Time",
    requestedMinutes: 0,
    reason: "",
  });

  useEffect(() => {
    if (!employeeId && employees.length) setEmployeeId(employees[0].employeeId);
  }, [employees, employeeId]);

  const selectedPeriod = useMemo(
    () => periods.find((item) => item.periodNumber === selectedNumber) || periods[0] || null,
    [periods, selectedNumber]
  );

  const loadPeriods = async () => {
    if (!employeeId || !periodKey) return;
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/api/hr/attendance-periods", {
        params: { employeeId, periodKey },
      });
      const rows = response.data.data || [];
      setPeriods(rows);
      setSelectedNumber((current) =>
        rows.some((item) => item.periodNumber === current)
          ? current
          : rows[0]?.periodNumber || ""
      );
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Could not load attendance periods.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPeriods();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId, periodKey]);

  const runAction = async (request, successMessage) => {
    setActionLoading(true);
    setError("");
    try {
      const response = await request();
      alert(response.data.message || successMessage);
      await loadPeriods();
      return true;
    } catch (requestError) {
      const message = requestError?.response?.data?.message || "Attendance action failed.";
      setError(message);
      alert(message);
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const createDraft = () => {
    const range = monthRange(periodKey);
    return runAction(
      () => api.post("/api/hr/attendance-periods", {
        employeeId,
        periodKey,
        ...range,
        lateGraceMinutes: 5,
        publicHolidays: [],
        notes: `${periodKey} attendance period created as a controlled draft.`,
      }),
      "Attendance draft created."
    );
  };

  const refreshDraft = () => runAction(
    () => api.post(`/api/hr/attendance-periods/${selectedPeriod.periodNumber}/refresh`, {
      lateGraceMinutes: selectedPeriod.scheduleSnapshot?.lateGraceMinutes ?? 5,
      publicHolidays: [],
      notes: "Draft refreshed from current attendance logs, schedule and approved leave.",
    }),
    "Attendance draft refreshed."
  );

  const submitPeriod = () => runAction(
    () => api.post(`/api/hr/attendance-periods/${selectedPeriod.periodNumber}/submit`, {
      notes: "Attendance period submitted for manager review.",
    }),
    "Attendance period submitted."
  );

  const approvePeriod = () => runAction(
    () => api.post(`/api/hr/attendance-periods/${selectedPeriod.periodNumber}/manager-approve`, {
      approvalNotes: "Attendance period reviewed and approved by management.",
    }),
    "Attendance period manager-approved."
  );

  const markPayrollReady = () => runAction(
    () => api.post(`/api/hr/attendance-periods/${selectedPeriod.periodNumber}/payroll-ready`, {
      readinessNotes: "Approved attendance period released for payroll processing.",
    }),
    "Attendance period is payroll ready."
  );

  const reopenPeriod = () => {
    const reason = window.prompt(
      "Enter the controlled reason for reopening this attendance period:"
    );

    if (!reason?.trim()) return;

    runAction(
      () => api.post(`/api/hr/attendance-periods/${selectedPeriod.periodNumber}/reopen`, {
        reason: reason.trim(),
      }),
      "Attendance period reopened."
    );
  };

  const reviewAdjustment = (adjustmentItem, action) => {
    const reviewNotes = window.prompt(
      `Enter review notes to ${action.toLowerCase()} ${adjustmentItem.adjustmentNumber}:`
    );

    if (!reviewNotes?.trim()) return;

    runAction(
      () => api.post(
        `/api/hr/attendance-periods/${selectedPeriod.periodNumber}/adjustments/${adjustmentItem.adjustmentNumber}/review`,
        {
          action,
          reviewNotes: reviewNotes.trim(),
        }
      ),
      `Attendance adjustment ${action === "Approve" ? "approved" : "rejected"}.`
    );
  };

  const lockPeriod = async () => {
    if (!lockForm.payrollNumber.trim() || !lockForm.notes.trim()) {
      alert("Payroll number and locking notes are required.");
      return;
    }

    const saved = await runAction(
      () => api.post(`/api/hr/attendance-periods/${selectedPeriod.periodNumber}/lock`, {
        payrollNumber: lockForm.payrollNumber.trim(),
        notes: lockForm.notes.trim(),
      }),
      "Attendance period locked to payroll."
    );

    if (saved) {
      setShowLockForm(false);
      setLockForm({ payrollNumber: "", notes: "" });
    }
  };

  const requestAdjustment = async () => {
    if (!adjustment.workDate || !adjustment.reason.trim()) {
      alert("Work date and reason are required.");
      return;
    }
    const saved = await runAction(
      () => api.post(`/api/hr/attendance-periods/${selectedPeriod.periodNumber}/adjustments`, {
        workDate: adjustment.workDate,
        adjustmentType: adjustment.adjustmentType,
        minutesAdjustment: Number(adjustment.requestedMinutes || 0),
        reason: adjustment.reason.trim(),
      }),
      "Attendance adjustment requested."
    );
    if (saved) {
      setAdjustment({ workDate: "", adjustmentType: "Worked Time", requestedMinutes: 0, reason: "" });
      setShowAdjustment(false);
    }
  };

  const totals = selectedPeriod?.totals || {};
  const exceptions = (selectedPeriod?.dailyEntries || []).filter(
    (entry) =>
      entry.dayStatus !== "No Record" &&
      (entry.exceptionNotes || ["Absent", "Incomplete"].includes(entry.dayStatus))
  );
  const maySubmit = selectedPeriod?.status === "Draft" && todayYmd() > selectedPeriod.periodEnd;

  return (
    <div style={{ display: "grid", gap: "16px" }}>
      <section style={card}>
        <div style={headerRow}>
          <div>
            <h2 style={title}>Attendance Periods</h2>
            <div style={subtitle}>
              Scheduled versus actual time, exceptions, adjustments, approval and payroll readiness.
            </div>
          </div>
          <span style={checkpoint}>H3 Controlled Attendance</span>
        </div>

        <div style={filterGrid}>
          <label style={label}>
            Employee
            <select value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} style={input}>
              {employees.map((employee) => (
                <option key={employee.employeeId} value={employee.employeeId}>
                  {employee.fullName} ({employee.employeeId})
                </option>
              ))}
            </select>
          </label>
          <label style={label}>
            Attendance month
            <input type="month" value={periodKey} onChange={(event) => setPeriodKey(event.target.value)} style={input} />
          </label>
          <button type="button" onClick={loadPeriods} disabled={loading} style={primaryButton}>
            {loading ? "Loading..." : "Refresh View"}
          </button>
        </div>
      </section>

      {error ? <div style={errorBox}>{error}</div> : null}

      {!loading && periods.length === 0 ? (
        <section style={{ ...card, textAlign: "center" }}>
          <h3 style={{ color: BLUE, marginTop: 0 }}>No attendance period exists for this scope.</h3>
          <p style={{ color: MUTED }}>Create one controlled Draft from the employee schedule and recorded punches.</p>
          <button type="button" onClick={createDraft} disabled={actionLoading} style={primaryButton}>
            + Create Attendance Draft
          </button>
        </section>
      ) : null}

      {selectedPeriod ? (
        <>
          <section style={metricGrid}>
            <Metric label="Scheduled" value={minutesToHours(totals.scheduledMinutes)} colour={BLUE} />
            <Metric label="Actual source time" value={minutesToHours(totals.sourceWorkedMinutes)} colour="#334155" />
            <Metric label="Payable time" value={minutesToHours(totals.payableWorkedMinutes)} colour="#16a34a" />
            <Metric label="Late time" value={minutesToHours(totals.lateMinutes)} colour="#d97706" />
            <Metric label="Absence" value={minutesToHours(totals.absenceMinutes)} colour="#dc2626" />
            <Metric label="Overtime" value={minutesToHours(totals.overtimeMinutes)} colour="#7c3aed" />
            <Metric label="Rest-day work" value={minutesToHours(totals.restDayMinutes)} colour="#0369a1" />
            <Metric label="Exceptions" value={String(exceptions.length)} colour="#dc2626" />
          </section>

          <section style={card}>
            <div style={headerRow}>
              <div>
                <h3 style={{ margin: 0, color: BLUE }}>{selectedPeriod.employeeSnapshot?.fullName}</h3>
                <div style={subtitle}>{selectedPeriod.periodNumber} · {selectedPeriod.periodStart} to {selectedPeriod.periodEnd}</div>
              </div>
              <span style={{ ...statusBadge, backgroundColor: statusColour(selectedPeriod.status) }}>
                {selectedPeriod.status}
              </span>
            </div>

            <div style={workflowBox}>
              <strong>Workflow actions</strong>
              <div style={buttonRow}>
                {selectedPeriod.status === "Draft" ? (
                  <button type="button" onClick={refreshDraft} disabled={actionLoading} style={secondaryButton}>Refresh Draft</button>
                ) : null}
                {selectedPeriod.status === "Draft" ? (
                  <button type="button" onClick={submitPeriod} disabled={actionLoading || !maySubmit} style={actionButton(!maySubmit)}>
                    Submit for Review
                  </button>
                ) : null}
                {selectedPeriod.status === "Submitted" ? (
                  <button type="button" onClick={approvePeriod} disabled={actionLoading} style={primaryButton}>Manager Approve</button>
                ) : null}
                {selectedPeriod.status === "Manager Approved" ? (
                  <button type="button" onClick={markPayrollReady} disabled={actionLoading} style={greenButton}>Mark Payroll Ready</button>
                ) : null}
                {["Submitted", "Manager Approved", "Payroll Ready"].includes(selectedPeriod.status) && !selectedPeriod.payrollNumber ? (
                  <button type="button" onClick={reopenPeriod} disabled={actionLoading} style={orangeButton}>Reopen Period</button>
                ) : null}
                {selectedPeriod.status === "Payroll Ready" ? (
                  <button type="button" onClick={() => setShowLockForm((value) => !value)} disabled={actionLoading} style={darkButton}>
                    {showLockForm ? "Close Lock Form" : "Lock to Payroll"}
                  </button>
                ) : null}
                {["Draft", "Reopened"].includes(selectedPeriod.status) ? (
                  <button type="button" onClick={() => setShowAdjustment((value) => !value)} style={secondaryButton}>
                    {showAdjustment ? "Close Adjustment" : "+ Request Adjustment"}
                  </button>
                ) : null}
              </div>
              {selectedPeriod.status === "Draft" && !maySubmit ? (
                <div style={warningBox}>
                  This period remains open through {selectedPeriod.periodEnd}. Submission is correctly blocked until the period has ended.
                </div>
              ) : null}
            </div>

            {showLockForm && selectedPeriod.status === "Payroll Ready" ? (
              <div style={adjustmentGrid}>
                <label style={label}>
                  Payroll number
                  <input value={lockForm.payrollNumber} onChange={(event) => setLockForm({ ...lockForm, payrollNumber: event.target.value })} placeholder="Required real payroll number" style={input} />
                </label>
                <label style={{ ...label, gridColumn: "1 / -1" }}>
                  Locking notes
                  <textarea value={lockForm.notes} onChange={(event) => setLockForm({ ...lockForm, notes: event.target.value })} placeholder="Explain why this approved period is being locked to payroll" style={{ ...input, minHeight: "70px" }} />
                </label>
                <button type="button" onClick={lockPeriod} disabled={actionLoading} style={darkButton}>Confirm Payroll Lock</button>
              </div>
            ) : null}

            {showAdjustment ? (
              <div style={adjustmentGrid}>
                <label style={label}>Work date<input type="date" min={selectedPeriod.periodStart} max={selectedPeriod.periodEnd} value={adjustment.workDate} onChange={(e) => setAdjustment({ ...adjustment, workDate: e.target.value })} style={input} /></label>
                <label style={label}>Adjustment type<select value={adjustment.adjustmentType} onChange={(e) => setAdjustment({ ...adjustment, adjustmentType: e.target.value })} style={input}>{["Clock In", "Clock Out", "Lunch", "Worked Time", "Late Arrival", "Absence", "Overtime", "Rest-Day Work", "Public-Holiday Work", "Other"].map((type) => <option key={type}>{type}</option>)}</select></label>
                <label style={label}>Requested minutes<input type="number" min="0" value={adjustment.requestedMinutes} onChange={(e) => setAdjustment({ ...adjustment, requestedMinutes: e.target.value })} style={input} /></label>
                <label style={{ ...label, gridColumn: "1 / -1" }}>Reason<textarea value={adjustment.reason} onChange={(e) => setAdjustment({ ...adjustment, reason: e.target.value })} style={{ ...input, minHeight: "70px" }} /></label>
                <button type="button" onClick={requestAdjustment} disabled={actionLoading} style={primaryButton}>Save Pending Adjustment</button>
              </div>
            ) : null}
          </section>

          <section style={card}>
            <h3 style={title}>Daily Attendance Register</h3>
            <div style={tableWrap}>
              <table style={table}>
                <thead><tr>{["Date", "Day", "Status", "Schedule", "Clock In", "Clock Out", "Source", "Payable", "Late", "Absence", "Classification / Exception"].map((heading) => <th key={heading} style={th}>{heading}</th>)}</tr></thead>
                <tbody>
                  {(selectedPeriod.dailyEntries || []).map((entry) => (
                    <tr key={entry.workDate} style={entry.exceptionNotes || ["Absent", "Incomplete"].includes(entry.dayStatus) ? { backgroundColor: "#fff7ed" } : undefined}>
                      <td style={td}>{entry.workDate}</td><td style={td}>{entry.dayName}</td><td style={td}><DayStatus status={entry.dayStatus} /></td>
                      <td style={td}>{entry.scheduledStartTime && entry.scheduledEndTime ? `${entry.scheduledStartTime}–${entry.scheduledEndTime}` : "—"}</td>
                      <td style={td}>{formatTime(entry.clockInTime)}</td><td style={td}>{formatTime(entry.clockOutTime)}</td>
                      <td style={td}>{minutesToHours(entry.sourceWorkedMinutes)}</td><td style={td}><strong>{minutesToHours(entry.payableWorkedMinutes)}</strong></td>
                      <td style={td}>{entry.lateMinutes || 0} min</td><td style={td}>{entry.absenceMinutes || 0} min</td>
                      <td style={{ ...td, minWidth: "260px" }}>{entry.restDay ? "Rest day. " : ""}{entry.publicHoliday ? `${entry.publicHolidayName || "Public holiday"}. ` : ""}{entry.exceptionNotes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {(selectedPeriod.adjustments || []).length ? (
            <section style={card}>
              <h3 style={title}>Adjustment Register</h3>
              {(selectedPeriod.adjustments || []).map((item) => (
                <div key={item.adjustmentNumber} style={adjustmentRow}>
                  <div><strong>{item.workDate} · {item.adjustmentType}</strong><div style={subtitle}>{item.reason}</div></div>
                  <div style={buttonRow}>
                    <span style={{ ...statusBadge, backgroundColor: statusColour(item.status) }}>{item.status}</span>
                    {item.status === "Pending" && ["Draft", "Reopened"].includes(selectedPeriod.status) ? (
                      <>
                        <button type="button" onClick={() => reviewAdjustment(item, "Approve")} disabled={actionLoading} style={greenButton}>Approve</button>
                        <button type="button" onClick={() => reviewAdjustment(item, "Reject")} disabled={actionLoading} style={redButton}>Reject</button>
                      </>
                    ) : null}
                  </div>
                </div>
              ))}
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

const formatTime = (value) => value ? new Date(value).toLocaleTimeString("en-JM", { hour: "2-digit", minute: "2-digit", timeZone: "America/Jamaica" }) : "—";
const Metric = ({ label, value, colour }) => <div style={metric}><div style={{ color: MUTED, fontSize: "13px" }}>{label}</div><div style={{ color: colour, fontSize: "22px", fontWeight: 800, marginTop: "6px" }}>{value}</div></div>;
const DayStatus = ({ status }) => <span style={{ ...dayBadge, backgroundColor: status === "Present" ? "#dcfce7" : status === "Absent" ? "#fee2e2" : status === "No Record" ? "#e2e8f0" : "#fef3c7", color: status === "Absent" ? "#991b1b" : "#334155" }}>{status}</span>;

const card = { background: "white", border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "18px" };
const title = { color: BLUE, margin: 0 };
const subtitle = { color: MUTED, marginTop: "5px", fontSize: "13px" };
const headerRow = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", flexWrap: "wrap" };
const checkpoint = { background: "#eff6ff", color: BLUE, padding: "7px 12px", borderRadius: "999px", fontWeight: 700, fontSize: "12px" };
const filterGrid = { display: "grid", gridTemplateColumns: "minmax(240px, 1.3fr) minmax(180px, .7fr) auto", gap: "12px", alignItems: "end", marginTop: "18px" };
const label = { display: "grid", gap: "6px", fontWeight: 700, color: "#334155", fontSize: "13px" };
const input = { width: "100%", boxSizing: "border-box", border: `1px solid ${BORDER}`, borderRadius: "9px", padding: "10px", background: "white" };
const metricGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px" };
const metric = { ...card, padding: "15px" };
const buttonRow = { display: "flex", flexWrap: "wrap", gap: "9px", marginTop: "10px" };
const baseButton = { border: 0, borderRadius: "8px", padding: "10px 14px", cursor: "pointer", fontWeight: 700 };
const primaryButton = { ...baseButton, background: BLUE, color: "white" };
const greenButton = { ...baseButton, background: "#16a34a", color: "white" };
const orangeButton = { ...baseButton, background: "#d97706", color: "white" };
const redButton = { ...baseButton, background: "#dc2626", color: "white" };
const darkButton = { ...baseButton, background: "#1e293b", color: "white" };
const secondaryButton = { ...baseButton, background: "#e2e8f0", color: "#334155" };
const actionButton = (disabled) => ({ ...baseButton, background: disabled ? "#cbd5e1" : "#7c3aed", color: "white", cursor: disabled ? "not-allowed" : "pointer" });
const workflowBox = { background: "#f8fafc", border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "14px", marginTop: "15px" };
const warningBox = { background: "#fffbeb", color: "#92400e", border: "1px solid #fde68a", borderRadius: "8px", padding: "10px", marginTop: "10px", fontSize: "13px" };
const errorBox = { background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca", borderRadius: "10px", padding: "12px" };
const adjustmentGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "12px", marginTop: "14px", borderTop: `1px solid ${BORDER}`, paddingTop: "14px" };
const tableWrap = { overflowX: "auto", marginTop: "14px" };
const table = { width: "100%", borderCollapse: "collapse", minWidth: "1280px" };
const th = { background: "#eef4ff", color: "#1e293b", textAlign: "left", padding: "10px", border: `1px solid ${BORDER}`, fontSize: "12px" };
const td = { padding: "9px", border: `1px solid ${BORDER}`, fontSize: "12px", verticalAlign: "top" };
const statusBadge = { color: "white", padding: "7px 11px", borderRadius: "999px", fontWeight: 800, fontSize: "12px" };
const dayBadge = { display: "inline-block", borderRadius: "999px", padding: "4px 8px", fontWeight: 700, fontSize: "11px" };
const adjustmentRow = { display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center", borderTop: `1px solid ${BORDER}`, padding: "12px 0" };

export default AttendancePeriodsPanel;