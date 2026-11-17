import { useEffect, useState } from "react";
import api from "../api";

function AccountingPeriods() {
  const [periods, setPeriods] = useState([]);
  const [currentPeriod, setCurrentPeriod] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState(null);
  const [busy, setBusy] = useState(false);

  const [formData, setFormData] = useState({
    fiscalYear: new Date().getFullYear(),
    periodMonth: new Date().getMonth() + 1,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    notes: "",
  });

  const ROYAL_BLUE = "#0B3D91";
  const MUTED = "#64748b";

  const loadPeriods = async () => {
    try {
      const [periodsRes, currentRes] = await Promise.all([
        api.get("/api/accounting-periods"),
        api.get("/api/accounting-periods/current"),
      ]);

      setPeriods(periodsRes.data.data || []);
      setCurrentPeriod(currentRes.data.data || null);
    } catch (error) {
      alert(error?.response?.data?.message || "Could not load accounting periods.");
    }
  };

  useEffect(() => {
    loadPeriods();
  }, []);

  const savePeriod = async () => {
  if (busy) return;

  setBusy(true);

  try {
    await api.post("/api/accounting-periods", {
      fiscalYear: formData.fiscalYear,
      periodMonth: formData.periodMonth,
      notes: formData.notes,
    });

    alert("Accounting period created successfully.");
    setFormOpen(false);
    await loadPeriods();
  } catch (error) {
    alert(
      error?.response?.data?.message ||
        "Could not create accounting period."
    );
  } finally {
    setBusy(false);
  }
};

  const validatePeriod = async (periodNumber) => {
    try {
      const res = await api.get(`/api/accounting-periods/${periodNumber}/validate`);
      alert(res.data.message || "Validation completed.");
      await loadPeriods();
    } catch (error) {
      alert(error?.response?.data?.message || "Could not validate accounting period.");
    }
  };

  const loadCloseChecklist = async (periodNumber) => {
  try {
    const res = await api.get(`/api/accounting-periods/${periodNumber}/checklist`);
    setSelectedChecklist(res.data.data || null);
    await loadPeriods();
  } catch (error) {
    alert(error?.response?.data?.message || "Could not load close checklist.");
  }
};

const closePeriod = async (periodNumber) => {
  if (busy) return;

  const confirmed = window.confirm(
    "Close this month for ALL businesses and branches? " +
    "Confirm that you have reviewed missing activity, bank reconciliation, " +
    "and depreciation where applicable. " +
    "The system checks recorded balances but does not verify completeness. " +
    "Closing blocks posting and creates no income-transfer journals."
  );

  if (!confirmed) return;

  setBusy(true);

  try {
    await api.put(
      `/api/accounting-periods/${encodeURIComponent(periodNumber)}/close`,
      {
        notes:
          "Admin confirmed period review and requested monthly posting closure.",
      }
    );

    alert("Accounting period closed. Posting is blocked.");
    setSelectedChecklist(null);
    await loadPeriods();
  } catch (error) {
    alert(
      error?.response?.data?.message ||
        "Could not close accounting period."
    );
  } finally {
    setBusy(false);
  }
};

const lockPeriod = async (periodNumber) => {
  if (busy) return;

  if (
    !window.confirm(
      "Lock this Closed period for all businesses and branches?"
    )
  ) {
    return;
  }

  setBusy(true);

  try {
    await api.put(
      `/api/accounting-periods/${encodeURIComponent(periodNumber)}/lock`,
      {
        notes: "Locked by Admin from Accounting Periods.",
      }
    );

    alert("Accounting period locked.");
    setSelectedChecklist(null);
    await loadPeriods();
  } catch (error) {
    alert(
      error?.response?.data?.message ||
        "Could not lock accounting period."
    );
  } finally {
    setBusy(false);
  }
};

  const reopenPeriod = async (periodNumber) => {
  if (busy) return;

  const reason = window
    .prompt(
      "Why must this period reopen? Posting will be allowed again " +
      "for all businesses and branches."
    )
    ?.trim();

  if (!reason) return;

  setBusy(true);

  try {
    await api.put(
      `/api/accounting-periods/${encodeURIComponent(periodNumber)}/reopen`,
      { reason }
    );

    alert("Accounting period reopened. Recheck it after corrections.");
    setSelectedChecklist(null);
    await loadPeriods();
  } catch (error) {
    alert(
      error?.response?.data?.message ||
        "Could not reopen accounting period."
    );
  } finally {
    setBusy(false);
  }
};

  const statusColor = (status) => {
    if (status === "Open") return "#16a34a";
    if (status === "Closing") return "#f59e0b";
    if (status === "Closed") return "#7c3aed";
    if (status === "Locked") return "#dc2626";
    return MUTED;
  };

  const validationColor = (status) => {
    if (status === "Passed") return "#16a34a";
    if (status === "Failed") return "#dc2626";
    return "#f59e0b";
  };

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ margin: 0 }}>Accounting Periods</h1>
        <p style={{ marginTop: "6px", color: MUTED }}>
  System-wide monthly posting controls for all businesses and branches.
  Monthly closing protects recorded figures without creating income-transfer
  journals. Complete missing records and reconciliation before closing.
  Creating, closing, locking, and reopening require an Admin.
</p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "14px",
          marginBottom: "18px",
        }}
      >
        <Card title="Current Period" value={currentPeriod?.periodName || "—"} color={ROYAL_BLUE} />
        <Card title="Open Periods" value={periods.filter((p) => p.status === "Open").length} color="#16a34a" />
        <Card title="Closed Periods" value={periods.filter((p) => p.status === "Closed").length} color="#7c3aed" />
        <Card title="Locked Periods" value={periods.filter((p) => p.status === "Locked").length} color="#dc2626" />
      </div>

      <button onClick={() => setFormOpen((prev) => !prev)} style={button(ROYAL_BLUE)}>
        {formOpen ? "Close Form" : "+ Add Accounting Period"}
      </button>

      {formOpen && (
  <div style={panel}>
    <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>New Accounting Period</h2>

    <div style={grid}>
      <input
        type="number"
        placeholder="Fiscal Year"
        value={formData.fiscalYear}
        onChange={(e) => setFormData({ ...formData, fiscalYear: Number(e.target.value) })}
        style={input}
      />

      <select
        value={formData.periodMonth}
        onChange={(e) => setFormData({ ...formData, periodMonth: Number(e.target.value) })}
        style={input}
      >
        {Array.from({ length: 12 }, (_, index) => (
          <option key={index + 1} value={index + 1}>
            {index + 1}
          </option>
        ))}
      </select>

      <p style={{ color: MUTED, gridColumn: "1 / -1" }}>
  The period automatically covers the first through last day of the
  selected calendar month.
</p>

      <textarea
        placeholder="Notes"
        value={formData.notes}
        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        style={{ ...input, gridColumn: "1 / -1" }}
      />
    </div>

    <button
  type="button"
  onClick={savePeriod}
  disabled={busy}
  style={{
    ...button("#16a34a"),
    marginTop: "14px",
    opacity: busy ? 0.65 : 1,
  }}
>
  {busy ? "Saving..." : "Save Accounting Period"}
</button>
  </div>
)}

{selectedChecklist && (
  <div style={panel}>
    <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
      <div>
        <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>
          Close Checklist — {selectedChecklist?.period?.periodName}
        </h2>
        <p style={{ color: MUTED }}>
          Period Status: <b>{selectedChecklist?.period?.status}</b> · Ready to Close:{" "}
          <b style={{ color: selectedChecklist?.readyToClose ? "#16a34a" : "#dc2626" }}>
            {selectedChecklist?.readyToClose ? "Yes" : "No"}
          </b>
        </p>
      </div>

      <button
        type="button"
        onClick={() => setSelectedChecklist(null)}
        style={button("#64748b")}
      >
        Close Checklist
      </button>
    </div>

    <div style={grid}>
      {Object.entries(selectedChecklist?.checklist || {}).map(([key, value]) => {
  const unknown = value === null;
  const passed = value === true;
  const color = unknown ? "#92400e" : passed ? "#166534" : "#991b1b";

  return (
    <div
      key={key}
      style={{
        border: "1px solid #dbe3ef",
        borderRadius: 10,
        padding: 12,
        backgroundColor: unknown
          ? "#fff7ed"
          : passed
            ? "#f0fdf4"
            : "#fef2f2",
      }}
    >
      <div style={{ fontWeight: "bold", color }}>
        {unknown
          ? "Not automatically verified"
          : passed
            ? "Passed"
            : "Requires review"}
      </div>

      <div style={{ marginTop: 6 }}>
        {formatChecklistLabel(key)}
      </div>
    </div>
  );
})}
    </div>

    {(selectedChecklist?.errors || []).length > 0 && (
      <div style={{ marginTop: "16px", color: "#dc2626", fontWeight: "bold" }}>
        <h3>Validation Errors</h3>
        <ul>
          {selectedChecklist.errors.map((error, index) => (
            <li key={index}>{error}</li>
          ))}
        </ul>
      </div>
    )}

    {(selectedChecklist?.warnings || []).length > 0 && (
      <div style={{ marginTop: "16px", color: "#f59e0b", fontWeight: "bold" }}>
        <h3>Validation Warnings</h3>
        <ul>
          {selectedChecklist.warnings.map((warning, index) => (
            <li key={index}>{warning}</li>
          ))}
        </ul>
      </div>
    )}

    <div style={{ marginTop: "18px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
      <button
        type="button"
        onClick={() => closePeriod(selectedChecklist?.period?.periodNumber)}
        disabled={busy || !selectedChecklist?.readyToClose}
        style={{
          ...button(selectedChecklist?.readyToClose ? "#16a34a" : "#94a3b8"),
          cursor: selectedChecklist?.readyToClose ? "pointer" : "not-allowed",
        }}
      >
        Close Period
      </button>
    </div>
  </div>
)}

<div style={panel}>
  <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>Accounting Periods</h2>

        <div style={{ overflowX: "auto" }}>
          <table border="1" cellPadding="10" style={{ minWidth: "1450px", width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ backgroundColor: "#eef4ff" }}>
              <tr>
                <th>Period No.</th>
                <th>Name</th>
                <th>Fiscal Year</th>
                <th>Month</th>
                <th>Start</th>
                <th>End</th>
                <th>Status</th>
                <th>Posting</th>
                <th>Validation</th>
                <th>Closed By</th>
                <th>Locked By</th>
                <th>Reopened By</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {periods.length > 0 ? (
                periods.map((period) => (
                  <tr key={period._id}>
                    <td style={{ fontWeight: "bold" }}>{period.periodNumber}</td>
                    <td>{period.periodName}</td>
                    <td>{period.fiscalYear}</td>
                    <td>{period.periodMonth}</td>
                    <td>{period.startDate}</td>
                    <td>{period.endDate}</td>
                    <td style={{ color: statusColor(period.status), fontWeight: "bold" }}>
                      {period.status}
                    </td>
                    <td style={{ color: period.status === "Open" && period.allowPosting ? "#16a34a" : "#dc2626", fontWeight: "bold" }}>
                      {period.status === "Open" && period.allowPosting ? "Allowed" : "Blocked"}
                    </td>
                    <td style={{ color: validationColor(period.validationStatus), fontWeight: "bold" }}>
                      {period.validationStatus || "Not Validated"}
                    </td>
                    <td>{period.closedBy || "—"}</td>
                    <td>{period.lockedBy || "—"}</td>
                    <td>{period.reopenedBy || "—"}</td>
                    <td>
                      <button onClick={() => loadCloseChecklist(period.periodNumber)} style={smallButton(ROYAL_BLUE)}>
  Checklist
</button>

                      <button
                        onClick={() => closePeriod(period.periodNumber)}
                        disabled={busy || !["Open", "Closing"].includes(period.status)}
                        style={{ ...smallButton("#f59e0b"), marginLeft: "8px" }}
                      >
                        Close
                      </button>

                      <button
                        onClick={() => lockPeriod(period.periodNumber)}
                        disabled={busy || period.status !== "Closed"}
                        style={{ ...smallButton("#dc2626"), marginLeft: "8px" }}
                      >
                        Lock
                      </button>

                      <button
                        onClick={() => reopenPeriod(period.periodNumber)}
                        disabled={busy || period.status === "Open"}
                        style={{ ...smallButton("#16a34a"), marginLeft: "8px" }}
                      >
                        Reopen
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="13" style={{ textAlign: "center", color: MUTED }}>
                    No accounting periods found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Card({ title, value, color }) {
  return (
    <div style={panel}>
      <h2 style={{ margin: 0, color }}>{value}</h2>
      <p style={{ marginBottom: 0, fontWeight: "bold" }}>{title}</p>
    </div>
  );
}

function formatChecklistLabel(key) {
  return String(key)
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (char) => char.toUpperCase());
}

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
  gap: "12px",
};

const panel = {
  backgroundColor: "white",
  border: "1px solid #dbe3ef",
  borderRadius: "12px",
  padding: "18px",
  marginTop: "18px",
};

const input = {
  padding: "10px",
  borderRadius: "8px",
  border: "1px solid #dbe3ef",
};

function button(color) {
  return {
    backgroundColor: color,
    color: "white",
    border: "none",
    padding: "10px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    marginTop: "18px",
  };
}

function smallButton(color) {
  return {
    backgroundColor: color,
    color: "white",
    border: "none",
    padding: "7px 10px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
  };
}

export default AccountingPeriods;