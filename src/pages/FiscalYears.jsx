import { useEffect, useState } from "react";
import api from "../api";

function FiscalYears() {
  const [years, setYears] = useState([]);
  const [formOpen, setFormOpen] = useState(false);

  const [formData, setFormData] = useState({
    fiscalYear: new Date().getFullYear(),
    startDate: `${new Date().getFullYear()}-01-01`,
    endDate: `${new Date().getFullYear()}-12-31`,
    totalPeriods: 12,
    notes: "",
  });

  const loadYears = async () => {
    try {
      const res = await api.get("/api/fiscal-years");
      setYears(res.data.data || []);
    } catch (error) {
      alert(error?.response?.data?.message || "Could not load fiscal years.");
    }
  };

  useEffect(() => {
    loadYears();
  }, []);

  const saveYear = async () => {
    try {
      await api.post("/api/fiscal-years", formData);
      alert("Fiscal year created successfully.");
      setFormOpen(false);
      await loadYears();
    } catch (error) {
      alert(error?.response?.data?.message || "Could not create fiscal year.");
    }
  };

  const closeYear = async (fiscalYear) => {
    if (!window.confirm("Close this fiscal year? All periods should already be closed.")) return;

    try {
      await api.put(`/api/fiscal-years/${fiscalYear}/close`);
      alert("Fiscal year closed successfully.");
      await loadYears();
    } catch (error) {
      alert(error?.response?.data?.message || "Could not close fiscal year.");
    }
  };

  const lockYear = async (fiscalYear) => {
    if (!window.confirm("Lock this fiscal year? Locked years should not be changed.")) return;

    try {
      await api.put(`/api/fiscal-years/${fiscalYear}/lock`);
      alert("Fiscal year locked successfully.");
      await loadYears();
    } catch (error) {
      alert(error?.response?.data?.message || "Could not lock fiscal year.");
    }
  };

  return (
    <div>
      <h1 style={{ margin: 0 }}>Fiscal Year Management</h1>
      <p style={{ marginTop: "6px", color: "#64748b" }}>
        Manage fiscal years, year-end controls, close status, and locked corporate accounting years.
      </p>

      <button
        onClick={() => setFormOpen((prev) => !prev)}
        style={button("#0B3D91")}
      >
        {formOpen ? "Close Form" : "+ Add Fiscal Year"}
      </button>

      {formOpen && (
        <div style={panel}>
          <h2 style={{ marginTop: 0, color: "#0B3D91" }}>New Fiscal Year</h2>

          <div style={grid}>
            <input
              type="number"
              placeholder="Fiscal Year"
              value={formData.fiscalYear}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  fiscalYear: Number(e.target.value),
                })
              }
              style={input}
            />

            <input
              type="date"
              value={formData.startDate}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  startDate: e.target.value,
                })
              }
              style={input}
            />

            <input
              type="date"
              value={formData.endDate}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  endDate: e.target.value,
                })
              }
              style={input}
            />

            <input
              type="number"
              placeholder="Total Periods"
              value={formData.totalPeriods}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  totalPeriods: Number(e.target.value || 12),
                })
              }
              style={input}
            />

            <textarea
              placeholder="Notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  notes: e.target.value,
                })
              }
              style={{ ...input, gridColumn: "1 / -1" }}
            />
          </div>

          <button onClick={saveYear} style={{ ...button("#16a34a"), marginTop: "14px" }}>
            Save Fiscal Year
          </button>
        </div>
      )}

      <div style={panel}>
        <h2 style={{ marginTop: 0, color: "#0B3D91" }}>Fiscal Years</h2>

        <div style={{ overflowX: "auto" }}>
          <table
            border="1"
            cellPadding="10"
            style={{
              minWidth: "1150px",
              width: "100%",
              borderCollapse: "collapse",
            }}
          >
            <thead style={{ backgroundColor: "#eef4ff" }}>
              <tr>
                <th>Fiscal Year</th>
                <th>Name</th>
                <th>Start</th>
                <th>End</th>
                <th>Status</th>
                <th>Periods</th>
                <th>Closed Periods</th>
                <th>Current</th>
                <th>Closed By</th>
                <th>Locked By</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {years.length > 0 ? (
                years.map((year) => (
                  <tr key={year._id}>
                    <td style={{ fontWeight: "bold" }}>{year.fiscalYear}</td>
                    <td>{year.yearName}</td>
                    <td>{year.startDate}</td>
                    <td>{year.endDate}</td>
                    <td>{year.status}</td>
                    <td>{year.totalPeriods}</td>
                    <td>{year.closedPeriods || 0}</td>
                    <td>{year.isCurrentYear ? "Yes" : "No"}</td>
                    <td>{year.closedBy || "—"}</td>
                    <td>{year.lockedBy || "—"}</td>
                    <td>
                      <button
                        onClick={() => closeYear(year.fiscalYear)}
                        disabled={year.status === "Closed" || year.status === "Locked"}
                        style={smallButton("#f59e0b")}
                      >
                        Close
                      </button>

                      <button
                        onClick={() => lockYear(year.fiscalYear)}
                        disabled={year.status === "Locked"}
                        style={{ ...smallButton("#dc2626"), marginLeft: "8px" }}
                      >
                        Lock
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="11" style={{ textAlign: "center", color: "#64748b" }}>
                    No fiscal years found.
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

export default FiscalYears;