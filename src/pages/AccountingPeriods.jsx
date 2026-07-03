import { useEffect, useState } from "react";
import api from "../api";

function AccountingPeriods() {
  const [periods, setPeriods] = useState([]);
  const [currentPeriod, setCurrentPeriod] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState(null);

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
    try {
      await api.post("/api/accounting-periods", formData);
      alert("Accounting period created successfully.");
      setFormOpen(false);
      await loadPeriods();
    } catch (error) {
      alert(error?.response?.data?.message || "Could not create accounting period.");
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
  if (!window.confirm("Close this accounting period after checklist review?")) return;

  try {
    await api.put(`/api/accounting-periods/${periodNumber}/close`, {
      notes: "Closed from EKOS close checklist workflow",
    });
    alert("Accounting period closed successfully.");
    setSelectedChecklist(null);
    await loadPeriods();
  } catch (error) {
    alert(error?.response?.data?.message || "Could not close accounting period.");
  }
};

const lockPeriod = async (periodNumber) => {
    if (!window.confirm("Lock this accounting period? Posting will no longer be allowed.")) return;

    try {
      await api.put(`/api/accounting-periods/${periodNumber}/lock`, {
        notes: "Locked from EKOS Accounting Periods screen",
      });
      alert("Accounting period locked successfully.");
      await loadPeriods();
    } catch (error) {
      alert(error?.response?.data?.message || "Could not lock accounting period.");
    }
  };

  const reopenPeriod = async (periodNumber) => {
    const reason = window.prompt("Enter reason for reopening this period:");

    if (!reason) return;

    try {
      await api.put(`/api/accounting-periods/${periodNumber}/reopen`, {
        reason,
      });
      alert("Accounting period reopened successfully.");
      await loadPeriods();
    } catch (error) {
      alert(error?.response?.data?.message || "Could not reopen accounting period.");
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
        <h1 style={{ margin: 0 }}>Fiscal Year & Period Closing</h1>
        <p style={{ marginTop: "6px", color: MUTED }}>
          Manage accounting periods, validation, closing, locking, and reopening controls.
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

      <input
        type="date"
        value={formData.startDate}
        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
        style={input}
      />

      <input
        type="date"
        value={formData.endDate}
        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
        style={input}
      />

      <textarea
        placeholder="Notes"
        value={formData.notes}
        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        style={{ ...input, gridColumn: "1 / -1" }}
      />
    </div>

    <button onClick={savePeriod} style={{ ...button("#16a34a"), marginTop: "14px" }}>
      Save Accounting Period
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
      {Object.entries(selectedChecklist?.checklist || {}).map(([key, value]) => (
        <div
          key={key}
          style={{
            border: "1px solid #dbe3ef",
            borderRadius: "10px",
            padding: "12px",
            backgroundColor: value ? "#f0fdf4" : "#fef2f2",
          }}
        >
          <div style={{ fontWeight: "bold", color: value ? "#16a34a" : "#dc2626" }}>
            {value ? "✓ Passed" : "✕ Required"}
          </div>
          <div style={{ marginTop: "6px" }}>
            {formatChecklistLabel(key)}
          </div>
        </div>
      ))}
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
        disabled={!selectedChecklist?.readyToClose}
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
                    <td style={{ color: period.allowPosting ? "#16a34a" : "#dc2626", fontWeight: "bold" }}>
                      {period.allowPosting ? "Allowed" : "Blocked"}
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
                        disabled={period.status === "Closed" || period.status === "Locked"}
                        style={{ ...smallButton("#f59e0b"), marginLeft: "8px" }}
                      >
                        Close
                      </button>

                      <button
                        onClick={() => lockPeriod(period.periodNumber)}
                        disabled={period.status === "Locked"}
                        style={{ ...smallButton("#dc2626"), marginLeft: "8px" }}
                      >
                        Lock
                      </button>

                      <button
                        onClick={() => reopenPeriod(period.periodNumber)}
                        disabled={period.status === "Open"}
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