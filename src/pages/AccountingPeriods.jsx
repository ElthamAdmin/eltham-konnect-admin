import { useEffect, useState } from "react";
import api from "../api";

function AccountingPeriods() {
  const [periods, setPeriods] = useState([]);
  const [formOpen, setFormOpen] = useState(false);

  const [formData, setFormData] = useState({
    fiscalYear: new Date().getFullYear(),
    periodMonth: new Date().getMonth() + 1,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    notes: "",
  });

  const loadPeriods = async () => {
    try {
      const res = await api.get("/api/accounting-periods");
      setPeriods(res.data.data || []);
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

  const closePeriod = async (periodNumber) => {
    if (!window.confirm("Close this accounting period?")) return;
    await api.put(`/api/accounting-periods/${periodNumber}/close`);
    await loadPeriods();
  };

  const lockPeriod = async (periodNumber) => {
    if (!window.confirm("Lock this accounting period? This should only be done after final review.")) return;
    await api.put(`/api/accounting-periods/${periodNumber}/lock`);
    await loadPeriods();
  };

  return (
    <div>
      <h1 style={{ margin: 0 }}>Multi-period Accounting</h1>
      <p style={{ marginTop: "6px", color: "#64748b" }}>
        Manage open, closed, and locked accounting months for corporate reporting control.
      </p>

      <button
        onClick={() => setFormOpen((prev) => !prev)}
        style={button("#0B3D91")}
      >
        {formOpen ? "Close Form" : "+ Add Accounting Period"}
      </button>

      {formOpen && (
        <div style={panel}>
          <h2 style={{ marginTop: 0, color: "#0B3D91" }}>New Accounting Period</h2>

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

      <div style={panel}>
        <h2 style={{ marginTop: 0, color: "#0B3D91" }}>Accounting Periods</h2>

        <div style={{ overflowX: "auto" }}>
          <table border="1" cellPadding="10" style={{ minWidth: "1100px", width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ backgroundColor: "#eef4ff" }}>
              <tr>
                <th>Period No.</th>
                <th>Name</th>
                <th>Fiscal Year</th>
                <th>Month</th>
                <th>Start</th>
                <th>End</th>
                <th>Status</th>
                <th>Closed By</th>
                <th>Locked By</th>
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
                    <td>{period.status}</td>
                    <td>{period.closedBy || "—"}</td>
                    <td>{period.lockedBy || "—"}</td>
                    <td>
                      <button
                        onClick={() => closePeriod(period.periodNumber)}
                        disabled={period.status === "Closed" || period.status === "Locked"}
                        style={smallButton("#f59e0b")}
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
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" style={{ textAlign: "center", color: "#64748b" }}>
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