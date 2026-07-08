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

  const money = (value) => `JMD ${Number(value || 0).toLocaleString()}`;

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

  const loadChartAccounts = async () => {
    try {
      const res = await api.get("/api/chart-of-accounts");
      setChartAccounts(res.data.data || []);
    } catch (error) {
      console.error("Chart accounts load error:", error);
    }
  };

  useEffect(() => {
    loadBudgets();
    loadChartAccounts();
  }, []);

  const getBudgetHealth = (budget) => {
    const variance = Number(budget.variance || 0);
    const variancePercent = Math.abs(Number(budget.variancePercent || 0));

    if (budget.category === "Revenue" && variance > 0) {
      return { label: "Exceeding Target", color: "#16a34a" };
    }

    if (variance < 0 && variancePercent >= 15) {
      return { label: "Over Budget", color: "#dc2626" };
    }

    if (variance < 0 && variancePercent >= 5) {
      return { label: "Monitor", color: "#f59e0b" };
    }

    return { label: "On Target", color: "#16a34a" };
  };

  const getUtilizationPercent = (planned = 0, actual = 0) => {
    const plannedValue = Number(planned || 0);
    const actualValue = Number(actual || 0);

    if (plannedValue <= 0) return 0;

    return (actualValue / plannedValue) * 100;
  };

  const getBudgetIntelligence = (budget) => {
    const utilization = getUtilizationPercent(
      budget.plannedAmount,
      budget.actualAmount
    );

    if (utilization >= 100) {
      return { label: "Over Budget", color: "#dc2626" };
    }

    if (utilization >= 90) {
      return { label: "At Risk", color: "#f97316" };
    }

    if (utilization >= 80) {
      return { label: "Watch", color: "#f59e0b" };
    }

    if (utilization >= 50) {
      return { label: "Healthy", color: "#16a34a" };
    }

    return { label: "Excellent", color: "#0B3D91" };
  };

  const branchPerformance = Object.values(
    budgets.reduce((map, budget) => {
      const key = budget.branch || "All Branches";

      if (!map[key]) {
        map[key] = {
          name: key,
          planned: 0,
          actual: 0,
          variance: 0,
        };
      }

      map[key].planned += Number(budget.plannedAmount || 0);
      map[key].actual += Number(budget.actualAmount || 0);
      map[key].variance += Number(budget.variance || 0);

      return map;
    }, {})
  );

  const costCenterPerformance = Object.values(
    budgets.reduce((map, budget) => {
      const key = budget.costCenter || "General";

      if (!map[key]) {
        map[key] = {
          name: key,
          planned: 0,
          actual: 0,
          variance: 0,
        };
      }

      map[key].planned += Number(budget.plannedAmount || 0);
      map[key].actual += Number(budget.actualAmount || 0);
      map[key].variance += Number(budget.variance || 0);

      return map;
    }, {})
  );

  const budgetAlerts = budgets
    .filter((budget) => Number(budget.variance || 0) < 0)
    .slice(0, 5);

  const budgetUtilization =
    Number(summary.totalPlanned || 0) > 0
      ? (Number(summary.totalActual || 0) /
          Number(summary.totalPlanned || 0)) *
        100
      : 0;

  const highestSpendingBranch = [...branchPerformance].sort(
    (a, b) => Number(b.actual || 0) - Number(a.actual || 0)
  )[0];

  const highestSpendingCostCenter = [...costCenterPerformance].sort(
    (a, b) => Number(b.actual || 0) - Number(a.actual || 0)
  )[0];

  const largestOverspend = [...budgets]
    .filter((budget) => Number(budget.variance || 0) < 0)
    .sort((a, b) => Number(a.variance || 0) - Number(b.variance || 0))[0];

  const largestSavings = [...budgets]
    .filter((budget) => Number(budget.variance || 0) >= 0)
    .sort((a, b) => Number(b.variance || 0) - Number(a.variance || 0))[0];

  const budgetHealthLabel =
    budgetUtilization > 110
      ? "Critical"
      : budgetUtilization > 100
      ? "Over Budget"
      : budgetUtilization >= 85
      ? "Healthy"
      : "Under Utilized";

  const budgetHealthColor =
    budgetUtilization > 110
      ? "#dc2626"
      : budgetUtilization > 100
      ? "#f97316"
      : budgetUtilization >= 85
      ? "#16a34a"
      : ROYAL_BLUE;

  const budgetTrendRows = Object.values(
    budgets.reduce((map, budget) => {
      const key = `${budget.budgetYear}-${String(
        budget.budgetMonth
      ).padStart(2, "0")}`;

      if (!map[key]) {
        map[key] = {
          period: key,
          planned: 0,
          actual: 0,
          variance: 0,
        };
      }

      map[key].planned += Number(budget.plannedAmount || 0);
      map[key].actual += Number(budget.actualAmount || 0);
      map[key].variance += Number(budget.variance || 0);

      return map;
    }, {})
  ).sort((a, b) => a.period.localeCompare(b.period));

  const daysInCurrentMonth = new Date(
    Number(formData.budgetYear || new Date().getFullYear()),
    Number(formData.budgetMonth || new Date().getMonth() + 1),
    0
  ).getDate();

  const todayDay = new Date().getDate();

  const enrichedBudgets = budgets.map((budget) => {
    const utilization = getUtilizationPercent(
      budget.plannedAmount,
      budget.actualAmount
    );

    const projectedSpend =
      todayDay > 0
        ? (Number(budget.actualAmount || 0) / todayDay) * daysInCurrentMonth
        : 0;

    return {
      ...budget,
      utilization,
      projectedSpend,
      remainingBudget:
        Number(budget.plannedAmount || 0) - Number(budget.actualAmount || 0),
      intelligence: getBudgetIntelligence(budget),
    };
  });

  const intelligenceAlerts = enrichedBudgets
    .filter(
      (budget) =>
        budget.utilization >= 80 ||
        Number(budget.actualAmount || 0) === 0 ||
        Number(budget.remainingBudget || 0) < 0
    )
    .slice(0, 8);

  const highestUtilizationBudget = [...enrichedBudgets].sort(
    (a, b) => Number(b.utilization || 0) - Number(a.utilization || 0)
  )[0];

  const highestProjectedSpendBudget = [...enrichedBudgets].sort(
    (a, b) => Number(b.projectedSpend || 0) - Number(a.projectedSpend || 0)
  )[0];

  const totalProjectedSpend = enrichedBudgets.reduce(
    (sum, budget) => sum + Number(budget.projectedSpend || 0),
    0
  );

  const totalRemainingBudget = enrichedBudgets.reduce(
    (sum, budget) => sum + Number(budget.remainingBudget || 0),
    0
  );

  const executiveSummary =
    budgets.length === 0
      ? "No budget records have been created yet. Add budget lines to begin tracking planned versus actual performance."
      : `${budgetHealthLabel} budget performance. Utilization is ${budgetUtilization.toFixed(
          2
        )}%. ${
          highestSpendingBranch?.name
            ? `${highestSpendingBranch.name} is the highest spending branch. `
            : ""
        }${
          highestSpendingCostCenter?.name
            ? `${highestSpendingCostCenter.name} is the highest spending cost center. `
            : ""
        }${
          highestUtilizationBudget?.budgetName
            ? `${highestUtilizationBudget.budgetName} has the highest utilization at ${Number(
                highestUtilizationBudget.utilization || 0
              ).toFixed(2)}%. `
            : ""
        }${
          largestOverspend?.budgetName
            ? `${largestOverspend.budgetName} requires attention due to overspending.`
            : "No major budget overspending detected."
        }`;

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
        costCenter: "General",
        linkedChartAccountCode: "",
        budgetType: "Operating",
        frequency: "Monthly",
        plannedAmount: 0,
        notes: "",
      });

      await loadBudgets();
    } catch (error) {
      console.error("Budget save error:", error);
      alert(error?.response?.data?.message || "Could not create budget.");
    }
  };

  return (
    <div>
      <h1 style={{ margin: 0 }}>Budgeting</h1>
      <p style={{ marginTop: "6px", color: MUTED }}>
        Corporate budget planning, actual performance tracking, and variance
        analysis.
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

      <div style={summaryGrid}>
        <Card>
          <h2 style={{ color: ROYAL_BLUE, margin: 0 }}>
            {summary.totalBudgets || 0}
          </h2>
          <p style={{ fontWeight: "bold" }}>Budget Lines</p>
        </Card>

        <Card>
          <h2 style={{ color: "#16a34a", margin: 0 }}>
            {money(summary.totalPlanned)}
          </h2>
          <p style={{ fontWeight: "bold" }}>Total Planned</p>
        </Card>

        <Card>
          <h2 style={{ color: "#f59e0b", margin: 0 }}>
            {money(summary.totalActual)}
          </h2>
          <p style={{ fontWeight: "bold" }}>Total Actual</p>
        </Card>

        <Card>
          <h2
            style={{
              color:
                Number(summary.totalVariance || 0) >= 0
                  ? "#16a34a"
                  : "#dc2626",
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

        <Card>
          <h2 style={{ color: "#f59e0b", margin: 0 }}>
            {summary.needsAttentionCount || 0}
          </h2>
          <p style={{ fontWeight: "bold" }}>Needs Attention</p>
        </Card>

        <Card>
          <h2 style={{ color: "#16a34a", margin: 0 }}>
            {summary.budgetHealthScore || 100}%
          </h2>
          <p style={{ fontWeight: "bold" }}>Budget Health</p>
        </Card>
      </div>

      <div style={panel(BORDER)}>
        <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>Budget Alerts</h2>

        {budgetAlerts.length > 0 ? (
          <div style={{ display: "grid", gap: "10px" }}>
            {budgetAlerts.map((budget) => (
              <div
                key={budget._id}
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid #fed7aa",
                  backgroundColor: "#fff7ed",
                  color: "#9a3412",
                  fontWeight: "bold",
                }}
              >
                ⚠ {budget.budgetName} is over budget by{" "}
                {money(Math.abs(Number(budget.variance || 0)))}.
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: MUTED, fontWeight: "bold" }}>
            No budget alerts at this time.
          </div>
        )}
      </div>

      <div style={panel(BORDER)}>
        <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>
          Executive Budget Dashboard
        </h2>

        <div style={summaryGrid}>
          <InsightCard
            title="Budget Utilization"
            value={`${budgetUtilization.toFixed(2)}%`}
            detail={budgetHealthLabel}
            color={budgetHealthColor}
          />

          <InsightCard
            title="Highest Spending Branch"
            value={highestSpendingBranch?.name || "—"}
            detail={
              highestSpendingBranch
                ? money(highestSpendingBranch.actual)
                : "No data"
            }
            color={ROYAL_BLUE}
          />

          <InsightCard
            title="Highest Cost Center"
            value={highestSpendingCostCenter?.name || "—"}
            detail={
              highestSpendingCostCenter
                ? money(highestSpendingCostCenter.actual)
                : "No data"
            }
            color={ROYAL_BLUE}
          />

          <InsightCard
            title="Largest Overspend"
            value={largestOverspend?.budgetName || "—"}
            detail={
              largestOverspend
                ? money(Math.abs(Number(largestOverspend.variance || 0)))
                : "No overspend"
            }
            color="#dc2626"
          />

          <InsightCard
            title="Largest Savings"
            value={largestSavings?.budgetName || "—"}
            detail={largestSavings ? money(largestSavings.variance) : "No savings"}
            color="#16a34a"
          />

          <InsightCard
            title="Budget Health"
            value={`${summary.budgetHealthScore || 100}%`}
            detail={budgetHealthLabel}
            color={budgetHealthColor}
          />
        </div>

        <div
          style={{
            marginTop: "16px",
            padding: "14px",
            borderRadius: "12px",
            backgroundColor: "#f8fbff",
            border: `1px solid ${BORDER}`,
            fontWeight: "bold",
            color: "#334155",
          }}
        >
          {executiveSummary}
        </div>
      </div>

      {formOpen && (
        <div style={panel(BORDER)}>
          <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>
            Budget Entry Wizard
          </h2>

          <p style={{ color: MUTED, fontWeight: "bold", marginTop: "-6px" }}>
            Create a monthly budget line by branch, cost center, and Chart of
            Accounts posting category.
          </p>

          <div style={wizardGrid}>
            <WizardField label="Budget Name">
              <input
                placeholder="Example: July Utilities Budget"
                value={formData.budgetName}
                onChange={(e) =>
                  setFormData({ ...formData, budgetName: e.target.value })
                }
                style={input(BORDER)}
              />
            </WizardField>

            <WizardField label="Budget Year">
              <input
                type="number"
                placeholder="Budget Year"
                value={formData.budgetYear}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    budgetYear: Number(
                      e.target.value || new Date().getFullYear()
                    ),
                  })
                }
                style={input(BORDER)}
              />
            </WizardField>

            <WizardField label="Budget Month">
              <select
                value={formData.budgetMonth}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    budgetMonth: Number(e.target.value),
                  })
                }
                style={input(BORDER)}
              >
                {Array.from({ length: 12 }, (_, index) => (
                  <option key={index + 1} value={index + 1}>
                    {new Date(2026, index, 1).toLocaleString("default", {
                      month: "long",
                    })}
                  </option>
                ))}
              </select>
            </WizardField>

            <WizardField label="Budget Category">
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    category: e.target.value,
                    budgetType:
                      e.target.value === "Revenue"
                        ? "Revenue"
                        : formData.budgetType,
                  })
                }
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
            </WizardField>

            <WizardField label="Branch">
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
            </WizardField>

            <WizardField label="Cost Center">
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
            </WizardField>

            <WizardField label="Linked Chart Account">
              <select
                value={formData.linkedChartAccountCode}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    linkedChartAccountCode: e.target.value,
                  })
                }
                style={input(BORDER)}
              >
                <option value="">No Linked Chart Account</option>
                {chartAccounts
                  .filter((account) =>
                    ["Revenue", "Cost of Sales", "Expense"].includes(
                      account.accountCategory
                    )
                  )
                  .map((account) => (
                    <option
                      key={account.accountCode}
                      value={account.accountCode}
                    >
                      {account.accountCode} - {account.accountName}
                    </option>
                  ))}
              </select>
            </WizardField>

            <WizardField label="Budget Type">
              <select
                value={formData.budgetType}
                onChange={(e) =>
                  setFormData({ ...formData, budgetType: e.target.value })
                }
                style={input(BORDER)}
              >
                <option value="Operating">Operating</option>
                <option value="Capital">Capital</option>
                <option value="Cash Flow">Cash Flow</option>
                <option value="Revenue">Revenue</option>
              </select>
            </WizardField>

            <WizardField label="Frequency">
              <select
                value={formData.frequency}
                onChange={(e) =>
                  setFormData({ ...formData, frequency: e.target.value })
                }
                style={input(BORDER)}
              >
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Yearly">Yearly</option>
              </select>
            </WizardField>

            <WizardField label="Planned Amount">
              <input
                type="number"
                placeholder="Planned Amount"
                value={formData.plannedAmount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    plannedAmount: Number(e.target.value || 0),
                  })
                }
                style={input(BORDER)}
              />
            </WizardField>

            <WizardField label="Notes" fullWidth>
              <textarea
                placeholder="Budget assumptions, limits, or management notes..."
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                style={{
                  ...input(BORDER),
                  minHeight: "80px",
                  resize: "vertical",
                }}
              />
            </WizardField>
          </div>

          <div
            style={{
              marginTop: "16px",
              padding: "14px",
              borderRadius: "12px",
              backgroundColor: "#f8fbff",
              border: `1px solid ${BORDER}`,
              fontWeight: "bold",
              color: "#334155",
            }}
          >
            This budget will track{" "}
            <span style={{ color: ROYAL_BLUE }}>{formData.category}</span> for{" "}
            <span style={{ color: ROYAL_BLUE }}>{formData.branch}</span> under{" "}
            <span style={{ color: ROYAL_BLUE }}>{formData.costCenter}</span>.
            {formData.linkedChartAccountCode
              ? ` Actuals will be matched to Chart Account ${formData.linkedChartAccountCode}.`
              : " Actuals will be matched using the budget category."}
          </div>

          <button
            onClick={saveBudget}
            style={{ ...button("#16a34a"), marginTop: "14px" }}
          >
            Save Budget
          </button>
        </div>
      )}

      <div style={panel(BORDER)}>
        <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>
          Executive Budget Intelligence
        </h2>

        <div style={summaryGrid}>
          <InsightCard
            title="Projected Month-End Spend"
            value={money(totalProjectedSpend)}
            detail="Based on current spending pace"
            color={ROYAL_BLUE}
          />

          <InsightCard
            title="Remaining Budget"
            value={money(totalRemainingBudget)}
            detail="Budget still available"
            color={Number(totalRemainingBudget || 0) >= 0 ? "#16a34a" : "#dc2626"}
          />

          <InsightCard
            title="Highest Utilization"
            value={highestUtilizationBudget?.budgetName || "—"}
            detail={
              highestUtilizationBudget
                ? `${Number(highestUtilizationBudget.utilization || 0).toFixed(
                    2
                  )}% used`
                : "No data"
            }
            color="#f97316"
          />

          <InsightCard
            title="Highest Forecast"
            value={highestProjectedSpendBudget?.budgetName || "—"}
            detail={
              highestProjectedSpendBudget
                ? money(highestProjectedSpendBudget.projectedSpend)
                : "No data"
            }
            color="#7c3aed"
          />
        </div>

        {intelligenceAlerts.length > 0 ? (
          <div style={{ display: "grid", gap: "10px", marginTop: "16px" }}>
            {intelligenceAlerts.map((budget) => (
              <div
                key={budget._id}
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  border: `1px solid ${
                    budget.utilization >= 100 ? "#fecaca" : "#bfdbfe"
                  }`,
                  backgroundColor:
                    budget.utilization >= 100 ? "#fef2f2" : "#eff6ff",
                  color: budget.utilization >= 100 ? "#991b1b" : "#1e3a8a",
                  fontWeight: "bold",
                }}
              >
                {budget.utilization >= 100
                  ? "⚠ "
                  : Number(budget.actualAmount || 0) === 0
                  ? "ℹ "
                  : "🔎 "}
                {budget.budgetName}: {Number(budget.utilization || 0).toFixed(2)}
                % used. Projected month-end spend is{" "}
                {money(budget.projectedSpend)}.
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: MUTED, fontWeight: "bold", marginTop: "16px" }}>
            No executive budget intelligence alerts at this time.
          </div>
        )}
      </div>

      <div style={panel(BORDER)}>
        <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>
          Monthly Budget Trend
        </h2>

        <MiniPerformanceTable
          rows={budgetTrendRows.map((row) => ({
            name: row.period,
            planned: row.planned,
            actual: row.actual,
            variance: row.variance,
          }))}
          money={money}
          emptyText="No monthly budget trend found."
        />
      </div>

      <div style={panel(BORDER)}>
        <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>
          Branch Budget Performance
        </h2>

        <MiniPerformanceTable
          rows={branchPerformance}
          money={money}
          emptyText="No branch budget performance found."
        />
      </div>

      <div style={panel(BORDER)}>
        <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>
          Cost Center Performance
        </h2>

        <MiniPerformanceTable
          rows={costCenterPerformance}
          money={money}
          emptyText="No cost center performance found."
        />
      </div>

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
              minWidth: "1500px",
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
                <th>Budget Health</th>
                <th>Utilization</th>
                <th>Projected Spend</th>
                <th>Remaining</th>
                <th>Status</th>
                <th>Notes</th>
              </tr>
            </thead>

            <tbody>
              {budgets.length > 0 ? (
                enrichedBudgets.map((budget) => (
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
                        ? `${budget.linkedChartAccountCode} - ${
                            budget.linkedChartAccountName || ""
                          }`
                        : "—"}
                    </td>
                    <td>{budget.budgetType || "Operating"}</td>
                    <td>{budget.frequency || "Monthly"}</td>
                    <td>{money(budget.plannedAmount)}</td>
                    <td>{money(budget.actualAmount)}</td>
                    <td
                      style={{
                        fontWeight: "bold",
                        color:
                          Number(budget.variance || 0) >= 0
                            ? "#16a34a"
                            : "#dc2626",
                      }}
                    >
                      {money(budget.variance)}
                    </td>
                    <td>{Number(budget.variancePercent || 0).toFixed(2)}%</td>
                    <td>
                      <StatusBadge health={budget.intelligence} />
                    </td>
                    <td>{Number(budget.utilization || 0).toFixed(2)}%</td>
                    <td>{money(budget.projectedSpend)}</td>
                    <td>{money(budget.remainingBudget)}</td>
                    <td>{budget.status}</td>
                    <td>{budget.notes || "—"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="19" style={{ textAlign: "center", color: MUTED }}>
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

const summaryGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "14px",
  marginBottom: "18px",
};

const wizardGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: "14px",
  marginTop: "14px",
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

function WizardField({ label, children, fullWidth = false }) {
  return (
    <label
      style={{
        display: "grid",
        gap: "6px",
        fontWeight: "bold",
        color: "#334155",
        gridColumn: fullWidth ? "1 / -1" : "auto",
      }}
    >
      <span>{label}</span>
      {children}
    </label>
  );
}

function InsightCard({ title, value, detail, color }) {
  return (
    <div
      style={{
        backgroundColor: "white",
        border: "1px solid #dbe3ef",
        borderRadius: "12px",
        padding: "16px",
      }}
    >
      <div style={{ color: "#64748b", fontWeight: "bold", marginBottom: "8px" }}>
        {title}
      </div>

      <div
        style={{
          color,
          fontSize: "22px",
          fontWeight: "bold",
          marginBottom: "6px",
        }}
      >
        {value}
      </div>

      <div style={{ color: "#334155", fontWeight: "bold", fontSize: "13px" }}>
        {detail}
      </div>
    </div>
  );
}

function MiniPerformanceTable({ rows, money, emptyText }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table
        border="1"
        cellPadding="10"
        style={{
          width: "100%",
          borderCollapse: "collapse",
          borderColor: "#dbe3ef",
        }}
      >
        <thead style={{ backgroundColor: "#eef4ff" }}>
          <tr>
            <th>Name</th>
            <th>Planned</th>
            <th>Actual</th>
            <th>Variance</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {rows.length > 0 ? (
            rows.map((row) => (
              <tr key={row.name}>
                <td style={{ fontWeight: "bold" }}>{row.name}</td>
                <td>{money(row.planned)}</td>
                <td>{money(row.actual)}</td>
                <td
                  style={{
                    fontWeight: "bold",
                    color:
                      Number(row.variance || 0) >= 0 ? "#16a34a" : "#dc2626",
                  }}
                >
                  {money(row.variance)}
                </td>
                <td>
                  {Number(row.variance || 0) >= 0
                    ? "On / Under Budget"
                    : "Over Budget"}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" style={{ textAlign: "center", color: "#64748b" }}>
                {emptyText}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ health }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "5px 10px",
        borderRadius: "999px",
        backgroundColor: health.color,
        color: "white",
        fontWeight: "bold",
        fontSize: "12px",
        whiteSpace: "nowrap",
      }}
    >
      {health.label}
    </span>
  );
}

function Card({ children }) {
  return (
    <div
      style={{
        backgroundColor: "white",
        border: "1px solid #dbe3ef",
        borderRadius: "12px",
        padding: "18px",
      }}
    >
      {children}
    </div>
  );
}

export default Budgeting;