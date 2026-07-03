import { useEffect, useState } from "react";
import api from "../api";

function FiscalYears() {
  const [years, setYears] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedValidation, setSelectedValidation] = useState(null);

  const [formData, setFormData] = useState({
    fiscalYear: new Date().getFullYear(),
    startDate: `${new Date().getFullYear()}-01-01`,
    endDate: `${new Date().getFullYear()}-12-31`,
    totalPeriods: 12,
    notes: "",
  });

  const ROYAL_BLUE = "#0B3D91";
  const MUTED = "#64748b";

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

  const validateYear = async (fiscalYear) => {
    try {
      const res = await api.get(`/api/fiscal-years/${fiscalYear}/validate`);
      setSelectedValidation(res.data.data || null);
      alert(res.data.message || "Fiscal year validation completed.");
      await loadYears();
    } catch (error) {
      alert(error?.response?.data?.message || "Could not validate fiscal year.");
    }
  };

  const closeYear = async (fiscalYear) => {
    if (!window.confirm("Close this fiscal year? All accounting periods must already be closed.")) return;

    try {
      await api.put(`/api/fiscal-years/${fiscalYear}/close`);
      alert("Fiscal year closed successfully.");
      setSelectedValidation(null);
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

  const createNextYear = async (fiscalYear) => {
    if (!window.confirm(`Create the next fiscal year after ${fiscalYear}?`)) return;

    try {
      await api.post(`/api/fiscal-years/${fiscalYear}/create-next`);
      alert("Next fiscal year created successfully.");
      await loadYears();
    } catch (error) {
      alert(error?.response?.data?.message || "Could not create next fiscal year.");
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
        <h1 style={{ margin: 0 }}>Fiscal Year-End Close</h1>
        <p style={{ marginTop: "6px", color: MUTED }}>
          Manage fiscal years, validation, close status, next-year creation, and locked corporate accounting years.
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
        <Card title="Fiscal Years" value={years.length} color={ROYAL_BLUE} />
        <Card title="Open Years" value={years.filter((year) => year.status === "Open").length} color="#16a34a" />
        <Card title="Closed Years" value={years.filter((year) => year.status === "Closed").length} color="#7c3aed" />
        <Card title="Locked Years" value={years.filter((year) => year.status === "Locked").length} color="#dc2626" />
      </div>

      <button onClick={() => setFormOpen((prev) => !prev)} style={button(ROYAL_BLUE)}>
        {formOpen ? "Close Form" : "+ Add Fiscal Year"}
      </button>

      {formOpen && (
        <div style={panel}>
          <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>New Fiscal Year</h2>

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

      {selectedValidation && (
        <div style={panel}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
            <div>
              <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>
                Year-End Validation — {selectedValidation?.year?.yearName}
              </h2>

              <p style={{ color: MUTED }}>
                Ready for Year-End Close:{" "}
                <b style={{ color: selectedValidation?.readyForYearEndClose ? "#16a34a" : "#dc2626" }}>
                  {selectedValidation?.readyForYearEndClose ? "Yes" : "No"}
                </b>
              </p>
            </div>

            <button type="button" onClick={() => setSelectedValidation(null)} style={button("#64748b")}>
              Close Validation
            </button>
          </div>

          <div style={grid}>
            <CheckCard
              label="All Periods Closed"
              passed={Number(selectedValidation?.summary?.periodStats?.openPeriods || 0) === 0 &&
                Number(selectedValidation?.summary?.periodStats?.closingPeriods || 0) === 0}
            />

            <CheckCard
              label="Trial Balance Balanced"
              passed={selectedValidation?.summary?.trialBalance?.isBalanced === true}
            />

            <CheckCard
              label="Balance Sheet Balanced"
              passed={selectedValidation?.summary?.balanceSheet?.isBalanced === true}
            />

            <CheckCard
              label="No Unposted Journals"
              passed={Number(selectedValidation?.summary?.journals?.unpostedCount || 0) === 0}
            />

            <CheckCard
              label="Profit & Loss Generated"
              passed={Boolean(selectedValidation?.summary?.profitAndLoss)}
            />
          </div>

          {(selectedValidation?.errors || []).length > 0 && (
            <div style={{ marginTop: "16px", color: "#dc2626", fontWeight: "bold" }}>
              <h3>Validation Errors</h3>
              <ul>
                {selectedValidation.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {(selectedValidation?.warnings || []).length > 0 && (
            <div style={{ marginTop: "16px", color: "#f59e0b", fontWeight: "bold" }}>
              <h3>Validation Warnings</h3>
              <ul>
                {selectedValidation.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div style={panel}>
        <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>Fiscal Years</h2>

        <div style={{ overflowX: "auto" }}>
          <table
            border="1"
            cellPadding="10"
            style={{
              minWidth: "1500px",
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
                <th>Posting</th>
                <th>Validation</th>
                <th>Periods</th>
                <th>Open</th>
                <th>Closed</th>
                <th>Locked</th>
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
                    <td style={{ color: statusColor(year.status), fontWeight: "bold" }}>
                      {year.status}
                    </td>
                    <td style={{ color: year.allowPosting === false ? "#dc2626" : "#16a34a", fontWeight: "bold" }}>
                      {year.allowPosting === false ? "Blocked" : "Allowed"}
                    </td>
                    <td style={{ color: validationColor(year.validationStatus), fontWeight: "bold" }}>
                      {year.validationStatus || "Not Validated"}
                    </td>
                    <td>{year.totalPeriods}</td>
                    <td>{year.openPeriods || 0}</td>
                    <td>{year.closedPeriods || 0}</td>
                    <td>{year.lockedPeriods || 0}</td>
                    <td>{year.isCurrentYear ? "Yes" : "No"}</td>
                    <td>{year.closedBy || "—"}</td>
                    <td>{year.lockedBy || "—"}</td>
                    <td>
                      <button onClick={() => validateYear(year.fiscalYear)} style={smallButton(ROYAL_BLUE)}>
                        Validate
                      </button>

                      <button
                        onClick={() => closeYear(year.fiscalYear)}
                        disabled={year.status === "Closed" || year.status === "Locked"}
                        style={{ ...smallButton("#f59e0b"), marginLeft: "8px" }}
                      >
                        Close
                      </button>

                      <button
                        onClick={() => createNextYear(year.fiscalYear)}
                        style={{ ...smallButton("#16a34a"), marginLeft: "8px" }}
                      >
                        Create Next
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
                  <td colSpan="15" style={{ textAlign: "center", color: MUTED }}>
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

function Card({ title, value, color }) {
  return (
    <div style={panel}>
      <h2 style={{ margin: 0, color }}>{value}</h2>
      <p style={{ marginBottom: 0, fontWeight: "bold" }}>{title}</p>
    </div>
  );
}

function CheckCard({ label, passed }) {
  return (
    <div
      style={{
        border: "1px solid #dbe3ef",
        borderRadius: "10px",
        padding: "12px",
        backgroundColor: passed ? "#f0fdf4" : "#fef2f2",
      }}
    >
      <div style={{ fontWeight: "bold", color: passed ? "#16a34a" : "#dc2626" }}>
        {passed ? "✓ Passed" : "✕ Required"}
      </div>
      <div style={{ marginTop: "6px" }}>{label}</div>
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