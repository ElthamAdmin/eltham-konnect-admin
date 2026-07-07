import { useEffect, useState } from "react";
import api from "../api";

function Budgeting() {
  const [budgets, setBudgets] = useState([]);
  const [summary, setSummary] = useState({});
  const [chartAccounts, setChartAccounts] = useState([]);
  const [formOpen, setFormOpen] = useState(false);

  const [formData, setFormData] = useState({
    budgetName: "",
    budgetYear: new Date().getFullYear(),
    budgetMonth: new Date().getMonth() + 1,
    category: "Revenue",
    branch: "All Branches",
    costCenter: "General",
linkedChartAccountCode: "",
budgetType: "Operating",
frequency: "Monthly",
    plannedAmount: 0,
    notes: "",
  });

    const ROYAL_BLUE = "#0B3D91";
  const BORDER = "#dbe3ef";
  const MUTED = "#64748b";

  const BRANCH_OPTIONS = [
    "All Branches",
    "Eltham Park Mainstore",
    "Brown's Town Square",
  ];

  const COST_CENTER_OPTIONS = [
    "General",
    "Administration",
    "Finance",
    "Operations",
    "Warehouse",
    "Marketing",
    "Customer Service",
    "HR",
    "IT",
    "Eltham Park Mainstore Operations",
    "Brown's Town Square Operations",
  ];

  const loadBudgets = async () => {
    try {
      const res = await api.get("/api/budgets");
      setBudgets(res.data.data || []);
      setSummary(res.data.summary || {});
    } catch (error) {
      console.error("Budgeting error:", error);
      alert(error?.response?.data?.message || "Could not load budgets.");
    }
  };

  useEffect(() => {
    loadBudgets();
      loadChartAccounts();
  }, []);

  const money = (value) => `JMD ${Number(value || 0).toLocaleString()}`;

  const saveBudget = async () => {
    try {
      if (!formData.budgetName || !formData.plannedAmount) {
        alert("Budget name and planned amount are required.");
        return;
      }

      await api.post("/api/budgets", formData);

      alert("Budget created successfully.");
      setFormOpen(false);
      setFormData({
        budgetName: "",
        budgetYear: new Date().getFullYear(),
        budgetMonth: new Date().getMonth() + 1,
        category: "Revenue",
        branch: "All Branches",
        plannedAmount: 0,
        notes: "",
        costCenter: "General",
linkedChartAccountCode: "",
budgetType: "Operating",
frequency: "Monthly",
      });

      await loadBudgets();
    } catch (error) {
      console.error("Budget save error:", error);
      alert(error?.response?.data?.message || "Could not create budget.");
    }
  };

  const loadChartAccounts = async () => {
  try {
    const res = await api.get("/api/chart-of-accounts");
    setChartAccounts(res.data.data || []);
  } catch (error) {
    console.error("Chart accounts load error:", error);
  }
};

  return (
    <div>
      <h1 style={{ margin: 0 }}>Budgeting</h1>
      <p style={{ marginTop: "6px", color: MUTED }}>
        Corporate budget planning, actual performance tracking, and variance analysis.
      </p>

      <button
        onClick={() => setFormOpen((prev) => !prev)}
        style={{
          backgroundColor: ROYAL_BLUE,
          color: "white",
          border: "none",
          padding: "10px 16px",
          borderRadius: "8px",
          cursor: "pointer",
          fontWeight: "bold",
          margin: "18px 0",
        }}
      >
        {formOpen ? "Close Form" : "+ Add Budget"}
      </button>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "14px",
          marginBottom: "18px",
        }}
      >
        <Card>
          <h2 style={{ color: ROYAL_BLUE, margin: 0 }}>{summary.totalBudgets || 0}</h2>
          <p style={{ fontWeight: "bold" }}>Budget Lines</p>
        </Card>

        <Card>
          <h2 style={{ color: "#16a34a", margin: 0 }}>{money(summary.totalPlanned)}</h2>
          <p style={{ fontWeight: "bold" }}>Total Planned</p>
        </Card>

        <Card>
          <h2 style={{ color: "#f59e0b", margin: 0 }}>{money(summary.totalActual)}</h2>
          <p style={{ fontWeight: "bold" }}>Total Actual</p>
        </Card>

        <Card>
          <h2
            style={{
              color: Number(summary.totalVariance || 0) >= 0 ? "#16a34a" : "#dc2626",
              margin: 0,
            }}
          >
            {money(summary.totalVariance)}
          </h2>
          <p style={{ fontWeight: "bold" }}>Total Variance</p>
        </Card>

        <Card>
  <h2 style={{ color: "#dc2626", margin: 0 }}>
    {summary.overBudgetCount || 0}
  </h2>
  <p style={{ fontWeight: "bold" }}>Over Budget</p>
</Card>

<Card>
  <h2 style={{ color: "#16a34a", margin: 0 }}>
    {summary.underBudgetCount || 0}
  </h2>
  <p style={{ fontWeight: "bold" }}>Under / On Budget</p>
</Card>
      </div>

      {formOpen && (
        <div style={panel(BORDER)}>
          <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>New Budget</h2>

          <div style={grid}>
            <input
              placeholder="Budget Name"
              value={formData.budgetName}
              onChange={(e) => setFormData({ ...formData, budgetName: e.target.value })}
              style={input(BORDER)}
            />

            <input
              type="number"
              placeholder="Budget Year"
              value={formData.budgetYear}
              onChange={(e) => setFormData({ ...formData, budgetYear: Number(e.target.value || new Date().getFullYear()) })}
              style={input(BORDER)}
            />

            <select
              value={formData.budgetMonth}
              onChange={(e) => setFormData({ ...formData, budgetMonth: Number(e.target.value) })}
              style={input(BORDER)}
            >
              {Array.from({ length: 12 }, (_, index) => (
                <option key={index + 1} value={index + 1}>
                  {index + 1}
                </option>
              ))}
            </select>

            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              style={input(BORDER)}
            >
              <option>Revenue</option>
              <option>Payroll</option>
              <option>Rent</option>
              <option>Utilities</option>
              <option>Marketing</option>
              <option>Freight</option>
              <option>Delivery</option>
              <option>Supplies</option>
              <option>Debt Repayment</option>
              <option>Tax Reserve</option>
              <option>Equipment</option>
              <option>Other</option>
            </select>

                        <select
              value={formData.branch}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  branch: e.target.value,
                  costCenter:
                    e.target.value === "Eltham Park Mainstore"
                      ? "Eltham Park Mainstore Operations"
                      : e.target.value === "Brown's Town Square"
                      ? "Brown's Town Square Operations"
                      : formData.costCenter,
                })
              }
              style={input(BORDER)}
            >
              {BRANCH_OPTIONS.map((branch) => (
                <option key={branch} value={branch}>
                  {branch}
                </option>
              ))}
            </select>

                        <select
              value={formData.costCenter}
              onChange={(e) =>
                setFormData({ ...formData, costCenter: e.target.value })
              }
              style={input(BORDER)}
            >
              {COST_CENTER_OPTIONS.map((costCenter) => (
                <option key={costCenter} value={costCenter}>
                  {costCenter}
                </option>
              ))}
            </select>

<select
  value={formData.linkedChartAccountCode}
  onChange={(e) =>
    setFormData({ ...formData, linkedChartAccountCode: e.target.value })
  }
  style={input(BORDER)}
>
  <option value="">No Linked Chart Account</option>
  {chartAccounts
    .filter((account) =>
      ["Revenue", "Cost of Sales", "Expense"].includes(account.accountCategory)
    )
    .map((account) => (
      <option key={account.accountCode} value={account.accountCode}>
        {account.accountCode} - {account.accountName}
      </option>
    ))}
</select>

<select
  value={formData.budgetType}
  onChange={(e) => setFormData({ ...formData, budgetType: e.target.value })}
  style={input(BORDER)}
>
  <option value="Operating">Operating</option>
  <option value="Capital">Capital</option>
  <option value="Cash Flow">Cash Flow</option>
  <option value="Revenue">Revenue</option>
</select>

<select
  value={formData.frequency}
  onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
  style={input(BORDER)}
>
  <option value="Monthly">Monthly</option>
  <option value="Quarterly">Quarterly</option>
  <option value="Yearly">Yearly</option>
</select>

            <input
              type="number"
              placeholder="Planned Amount"
              value={formData.plannedAmount}
              onChange={(e) => setFormData({ ...formData, plannedAmount: Number(e.target.value || 0) })}
              style={input(BORDER)}
            />

            <textarea
              placeholder="Notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              style={{ ...input(BORDER), gridColumn: "1 / -1" }}
            />
          </div>

          <button onClick={saveBudget} style={{ ...button("#16a34a"), marginTop: "14px" }}>
            Save Budget
          </button>
        </div>
      )}

      <div style={panel(BORDER)}>
        <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>Budget Performance</h2>

        <div
          style={{
            overflowX: "auto",
            overflowY: "auto",
            maxHeight: "72vh",
            border: `1px solid ${BORDER}`,
            borderRadius: "12px",
          }}
        >
          <table
            border="1"
            cellPadding="10"
            style={{
              minWidth: "1300px",
              width: "100%",
              borderCollapse: "collapse",
              borderColor: BORDER,
            }}
          >
            <thead style={{ backgroundColor: "#eef4ff", position: "sticky", top: 0 }}>
              <tr>
                <th>Budget No.</th>
                <th>Name</th>
                <th>Period</th>
                <th>Category</th>
                <th>Branch</th>
                <th>Cost Center</th>
<th>Chart Account</th>
<th>Budget Type</th>
<th>Frequency</th>
                <th>Planned</th>
                <th>Actual</th>
                <th>Variance</th>
                <th>Variance %</th>
                <th>Status</th>
                <th>Notes</th>
              </tr>
            </thead>

            <tbody>
              {budgets.length > 0 ? (
                budgets.map((budget) => (
                  <tr key={budget._id}>
                    <td style={{ fontWeight: "bold" }}>{budget.budgetNumber}</td>
                    <td>{budget.budgetName}</td>
                    <td>
                      {budget.budgetYear}-{String(budget.budgetMonth).padStart(2, "0")}
                    </td>
                    <td>{budget.category}</td>
                    <td>{budget.branch}</td>
<td>{budget.costCenter || "General"}</td>
<td>
  {budget.linkedChartAccountCode
    ? `${budget.linkedChartAccountCode} - ${budget.linkedChartAccountName || ""}`
    : "—"}
</td>
<td>{budget.budgetType || "Operating"}</td>
<td>{budget.frequency || "Monthly"}</td>
<td>{money(budget.plannedAmount)}</td>
                    <td>{money(budget.actualAmount)}</td>
                    <td
                      style={{
                        fontWeight: "bold",
                        color: Number(budget.variance || 0) >= 0 ? "#16a34a" : "#dc2626",
                      }}
                    >
                      {money(budget.variance)}
                    </td>
                    <td>{Number(budget.variancePercent || 0).toFixed(2)}%</td>
                    <td>{budget.status}</td>
                    <td>{budget.notes || "—"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="15" style={{ textAlign: "center", color: MUTED }}>
                    No budgets found.
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

function panel(border) {
  return {
    backgroundColor: "white",
    border: `1px solid ${border}`,
    borderRadius: "12px",
    padding: "18px",
    marginBottom: "18px",
  };
}

function input(border) {
  return {
    padding: "10px",
    borderRadius: "8px",
    border: `1px solid ${border}`,
  };
}

function button(color) {
  return {
    backgroundColor: color,
    color: "white",
    border: "none",
    padding: "10px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
  };
}

function Card({ children }) {
  return (
    <div style={{ backgroundColor: "white", border: "1px solid #dbe3ef", borderRadius: "12px", padding: "18px" }}>
      {children}
    </div>
  );
}

export default Budgeting;