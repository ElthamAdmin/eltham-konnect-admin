import { useEffect, useRef, useState } from "react";
import api from "../api";

const categories = [
  "Revenue", "Payroll", "Rent", "Utilities",
  "Marketing", "Freight", "Delivery", "Supplies",
  "Debt Repayment", "Tax Reserve", "Equipment", "Other",
];

const branches = [
  "All Branches",
  "Eltham Park Mainstore",
  "Brown's Town Square",
];

const currentMonth = () => {
  const parts = new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: "America/Jamaica",
      year: "numeric",
      month: "2-digit",
    }
  ).formatToParts(new Date());

  return (
    parts.find((part) => part.type === "year").value +
    "-" +
    parts.find((part) => part.type === "month").value
  );
};

const money = (value) =>
  value === null || value === undefined
    ? "Not available"
    : `JMD ${Number(value).toLocaleString(
        "en-JM",
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }
      )}`;

function Budgeting() {
  const [entities, setEntities] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [entityCode, setEntityCode] = useState("");
  const [month, setMonth] = useState(currentMonth());
  const [frequency, setFrequency] = useState("Monthly");
  const [unassigned, setUnassigned] = useState(false);
  const [report, setReport] = useState(null);
  const [form, setForm] = useState(null);
  const [editing, setEditing] = useState("");
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const pending = useRef(false);

  useEffect(() => {
    let active = true;

    Promise.all([
      api.get("/api/tax-center/entities"),
      api.get("/api/chart-of-accounts"),
    ])
      .then(([entityResponse, accountResponse]) => {
        if (!active) return;

        const rows = entityResponse.data.data || [];
        setEntities(rows);
        setAccounts(accountResponse.data.data || []);

        const eligible = rows.filter(
          (entity) =>
            entity.lifecycleStatus === "Active" &&
            !entity.effectiveTo
        );

        if (eligible.length === 1) {
          setEntityCode(eligible[0].entityCode);
        }
      })
      .catch((requestError) => {
        if (active) {
          setError(
            requestError.response?.data?.message ||
              "Could not load business and account options."
          );
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    setReport(null);
    setError("");

    if (
      (!entityCode && !unassigned) ||
      !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)
    ) {
      setLoading(false);
      return;
    }

    setLoading(true);

    api.get("/api/budgets", {
      params: {
        entityCode,
        unassigned,
        budgetYear: Number(month.slice(0, 4)),
        budgetMonth: Number(month.slice(5, 7)),
        frequency,
      },
    })
      .then((response) => {
        if (active) setReport(response.data);
      })
      .catch((requestError) => {
        if (active) {
          setError(
            requestError.response?.data?.message ||
              "Could not load budgets."
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [
    entityCode,
    month,
    frequency,
    unassigned,
    revision,
  ]);

  useEffect(() => {
    setForm(null);
    setEditing("");
    setMessage("");
  }, [entityCode, month, frequency, unassigned]);

  const openForm = (budget = null) => {
    setError("");
    setMessage("");
    setEditing(budget?.budgetNumber || "");

    setForm({
      budgetName: budget?.budgetName || "",

      startMonth: budget
        ? `${budget.budgetYear}-${String(
            budget.budgetMonth
          ).padStart(2, "0")}`
        : month,

      frequency: budget?.frequency || frequency,
      category: budget?.category || "Payroll",
      branch: budget?.branch || "All Branches",
      costCenter: "General",
      budgetType: budget?.budgetType || "Operating",
      linkedChartAccountCode:
        budget?.linkedChartAccountCode || "",
      plannedAmount: budget?.plannedAmount ?? "",
      notes: budget?.notes || "",
    });
  };

  const change = (field, value) =>
    setForm((previous) => ({
      ...previous,
      [field]: value,

      ...(field === "budgetType"
        ? {
            linkedChartAccountCode: "",
            ...(value === "Revenue"
              ? { category: "Revenue" }
              : previous.category === "Revenue"
                ? { category: "Other" }
                : {}),
          }
        : {}),
    }));

  const save = async (event) => {
    event.preventDefault();

    if (pending.current) return;

    if (!entityCode) {
      setError(
        "Select the business that owns this budget."
      );
      return;
    }

    pending.current = true;
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const payload = {
        ...form,
        entityCode,
        currency: "JMD",
        budgetYear: Number(
          form.startMonth.slice(0, 4)
        ),
        budgetMonth: Number(
          form.startMonth.slice(5, 7)
        ),
      };

      delete payload.startMonth;

      const response = editing
        ? await api.patch(
            `/api/budgets/${encodeURIComponent(editing)}`,
            payload
          )
        : await api.post(
            "/api/budgets",
            payload
          );

      setMessage(response.data.message);
      setForm(null);
      setEditing("");
      setRevision((value) => value + 1);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Could not save the budget plan."
      );
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };

  const rows = report?.data || [];

  const revenue = rows.filter(
    (budget) => budget.budgetType === "Revenue"
  );

  const operating = rows.filter(
    (budget) => budget.budgetType === "Operating"
  );

  const planning = rows.filter(
    (budget) =>
      !["Revenue", "Operating"].includes(
        budget.budgetType
      )
  );

  const accountOptions = accounts.filter(
    (account) =>
      account.status === "Active" &&
      (
        form?.budgetType === "Revenue"
          ? account.accountCategory === "Revenue"
          : ["Expense", "Cost of Sales"].includes(
              account.accountCategory
            )
      )
  );

  const renderRows = (items, title) => (
    <section style={panel}>
      <h2>{title}</h2>

      <div style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Plan / scope</th>
              <th>Account</th>
              <th>Planned</th>
              <th>Recorded actual</th>
              <th>Variance</th>
              <th>Comparison / findings</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {items.map((budget) => (
              <tr key={budget.budgetNumber}>
                <td>
                  <strong>
                    {budget.budgetName}
                  </strong>
                  <div>{budget.budgetNumber}</div>
                  <div>
                    {budget.entityCode ||
                      "Business unassigned"}
                  </div>
                  <div>
                    {budget.periodStart} to{" "}
                    {budget.periodEnd}
                  </div>
                  <div>{budget.branch}</div>
                  <div>
                    {budget.category} /{" "}
                    {budget.budgetType}
                  </div>
                </td>

                <td>
                  {budget.linkedChartAccountCode
                    ? `${budget.linkedChartAccountCode} — ${budget.linkedChartAccountName || ""}`
                    : "Not mapped"}
                </td>

                <td>
                  {budget.currency === "JMD"
                    ? money(budget.plannedAmount)
                    : `${Number(budget.plannedAmount).toLocaleString()} — currency unconfirmed`}
                </td>

                <td>
                  {money(budget.actualAmount)}
                </td>

                <td>
                  {money(budget.variance)}
                  <div>
                    {budget.variancePercent === null
                      ? "Percentage not available"
                      : `${budget.variancePercent}%`}
                  </div>
                </td>

                <td>
                  <strong>
                    {budget.comparisonStatus}
                  </strong>

                  <p>
                    {budget.comparisonNote}
                  </p>

                  {budget.overlapWarning && (
                    <p style={{ color: "#92400e" }}>
                      Another displayed budget
                      overlaps this account and
                      period. Do not add their
                      actuals together.
                    </p>
                  )}

                  <div>
                    Ledger rows:{" "}
                    {budget.ledgerRowCount}
                  </div>

                  {budget.notes && (
                    <p>{budget.notes}</p>
                  )}
                </td>

                <td>
                  {budget.status === "Active" ? (
                    <button
                      type="button"
                      disabled={busy || !entityCode}
                      onClick={() =>
                        openForm(budget)
                      }
                    >
                      {budget.entityCode
                        ? "Edit plan"
                        : "Review and assign"}
                    </button>
                  ) : (
                    "Closed"
                  )}
                </td>
              </tr>
            ))}

            {!items.length && (
              <tr>
                <td colSpan={7}>
                  No plans in this group.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );

  return (
    <main className="ek-budgeting">
      <style>{`
        .ek-budgeting h1,
        .ek-budgeting h2 { color:#0b3d91; }
        .ek-budgeting label {
          display:flex; flex-direction:column;
          gap:6px; font-size:13px; font-weight:600;
        }
        .ek-budgeting input,
        .ek-budgeting select,
        .ek-budgeting textarea {
          padding:10px; border:1px solid #cbd5e1;
          border-radius:8px; box-sizing:border-box;
          width:100%; background:white; color:#1e293b;
        }
        .ek-budgeting button {
          padding:9px 13px; background:#0b3d91;
          color:white; border:0; border-radius:8px;
          cursor:pointer; font-weight:700;
        }
        .ek-budgeting button:disabled {
          opacity:.5; cursor:default;
        }
        .ek-budgeting table {
          width:100%; border-collapse:collapse;
          min-width:1100px;
        }
        .ek-budgeting th,
        .ek-budgeting td {
          border:1px solid #dbe3ef;
          padding:10px; text-align:left;
          vertical-align:top;
        }
        .ek-budgeting th { background:#eef4ff; }
        .ek-budgeting fieldset {
          border:0; padding:0; margin:0; min-width:0;
        }
      `}</style>

      <h1>Budgeting</h1>

      <p>
        Plan income and costs, then compare with
        recorded JMD ledger activity. A budget
        does not create an expense, salary, or
        payment.
      </p>

      <section style={panel}>
        <div style={grid}>
          <label>
            Business
            <select
              value={entityCode}
              disabled={busy}
              onChange={(event) =>
                setEntityCode(event.target.value)
              }
            >
              <option value="">
                Select business
              </option>

              {entities.map((entity) => (
                <option
                  key={entity.entityCode}
                  value={entity.entityCode}
                >
                  {entity.legalName} —{" "}
                  {entity.entityCode}
                </option>
              ))}
            </select>
          </label>

          <label>
            Starting month
            <input
              type="month"
              value={month}
              disabled={busy}
              onChange={(event) =>
                setMonth(event.target.value)
              }
            />
          </label>

          <label>
            Planning period
            <select
              value={frequency}
              disabled={busy}
              onChange={(event) =>
                setFrequency(event.target.value)
              }
            >
              <option value="Monthly">
                One month
              </option>
              <option value="Quarterly">
                Three months from starting month
              </option>
              <option value="Yearly">
                Twelve months from starting month
              </option>
            </select>
          </label>
        </div>

        <label style={checkStyle}>
          <input
            type="checkbox"
            style={{ width: "auto" }}
            checked={unassigned}
            disabled={busy}
            onChange={(event) =>
              setUnassigned(event.target.checked)
            }
          />
          Review older budgets without a business
        </label>

        <div style={row}>
          <button
            type="button"
            disabled={busy || loading}
            onClick={() =>
              setRevision((value) => value + 1)
            }
          >
            Refresh
          </button>

          <button
            type="button"
            disabled={
              busy ||
              !entityCode ||
              unassigned
            }
            onClick={() => openForm()}
          >
            + Add budget plan
          </button>
        </div>

        <p>
          General covers the account across cost
          centers. A specific branch comparison is
          unavailable when ledger rows lack branch
          attribution.
        </p>
      </section>

      <div style={{ ...panel, background: "#fff7ed" }}>
        <strong>
          Incomplete records are not savings.
        </strong>
        <p>
          {report?.notice ||
            "Record and reconcile missing business activity before using budget variances to assess staffing affordability."}
        </p>
      </div>

      {error && (
        <p role="alert" style={errorStyle}>
          {error}
        </p>
      )}

      {message && (
        <p role="status" style={successStyle}>
          {message}
        </p>
      )}

      {form && (
        <form onSubmit={save} style={panel}>
          <h2>
            {editing ? "Edit budget plan" : "New budget plan"}
          </h2>

          <p>
            Saving assigns this plan to{" "}
            <strong>{entityCode}</strong>.
            It does not change ledger records.
            Older budget currency is confirmed as
            JMD only when you save this review.
          </p>

          <fieldset disabled={busy}>
            <div style={grid}>
              <label>
                Budget name
                <input
                  required
                  value={form.budgetName}
                  onChange={(event) =>
                    change(
                      "budgetName",
                      event.target.value
                    )
                  }
                />
              </label>

              <label>
                Starting month
                <input
                  type="month"
                  required
                  value={form.startMonth}
                  onChange={(event) =>
                    change(
                      "startMonth",
                      event.target.value
                    )
                  }
                />
              </label>

              <label>
                Frequency
                <select
                  value={form.frequency}
                  onChange={(event) =>
                    change(
                      "frequency",
                      event.target.value
                    )
                  }
                >
                  <option>Monthly</option>
                  <option>Quarterly</option>
                  <option>Yearly</option>
                </select>
              </label>

              <label>
                Budget type
                <select
                  value={form.budgetType}
                  onChange={(event) =>
                    change(
                      "budgetType",
                      event.target.value
                    )
                  }
                >
                  <option>Operating</option>
                  <option>Revenue</option>
                  <option>Capital</option>
                  <option>Cash Flow</option>
                </select>
              </label>

              <label>
                Management category
                <select
                  value={form.category}
                  onChange={(event) =>
                    change(
                      "category",
                      event.target.value
                    )
                  }
                >
                  {categories.map((category) => (
                    <option key={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Branch
                <select
                  value={form.branch}
                  onChange={(event) =>
                    change(
                      "branch",
                      event.target.value
                    )
                  }
                >
                  {branches.map((branch) => (
                    <option key={branch}>
                      {branch}
                    </option>
                  ))}
                </select>
              </label>

              {["Operating", "Revenue"].includes(
                form.budgetType
              ) && (
                <label>
                  Specific ledger account
                  <select
                    required
                    value={
                      form.linkedChartAccountCode
                    }
                    onChange={(event) =>
                      change(
                        "linkedChartAccountCode",
                        event.target.value
                      )
                    }
                  >
                    <option value="">
                      Select account
                    </option>

                    {accountOptions.map((account) => (
                      <option
                        key={account.accountCode}
                        value={account.accountCode}
                      >
                        {account.accountCode} —{" "}
                        {account.accountName}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <label>
                Planned amount — JMD
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={form.plannedAmount}
                  onChange={(event) =>
                    change(
                      "plannedAmount",
                      event.target.value
                    )
                  }
                />
              </label>
            </div>

            <label>
              Assumptions / notes
              <textarea
                value={form.notes}
                onChange={(event) =>
                  change(
                    "notes",
                    event.target.value
                  )
                }
              />
            </label>

            <p>
              Operating variance = plan minus
              recorded expense. Revenue variance =
              recorded revenue minus plan. These
              amounts are not cash balances.
            </p>

            <div style={row}>
              <button type="submit">
                {busy ? "Saving…" : "Save plan"}
              </button>

              <button
                type="button"
                onClick={() => setForm(null)}
              >
                Cancel
              </button>
            </div>
          </fieldset>
        </form>
      )}

      {loading ? (
        <p role="status">Loading budget comparisons…</p>
      ) : report ? (
        <>
          <p>
            Plans: {report.summary.totalBudgets}
            {" · "}
            Recorded comparisons:{" "}
            {report.summary.comparedCount}
            {" · "}
            No ledger activity:{" "}
            {report.summary.noActivityCount}
            {" · "}
            Unavailable:{" "}
            {report.summary.unavailableCount}
          </p>

          {renderRows(revenue, "Revenue targets")}
          {renderRows(operating, "Operating costs")}
          {renderRows(
            planning,
            "Capital and cash-flow plans"
          )}
        </>
      ) : (
        <p>Select a business and planning period.</p>
      )}
    </main>
  );
}

const panel = {
  background: "white",
  border: "1px solid #dbe3ef",
  borderRadius: 12,
  padding: 18,
  marginBottom: 16,
};

const grid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 14,
  marginBottom: 14,
};

const row = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  marginTop: 14,
};

const checkStyle = {
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  gap: 8,
};

const errorStyle = {
  ...panel,
  color: "#991b1b",
  background: "#fef2f2",
};

const successStyle = {
  ...panel,
  color: "#166534",
  background: "#f0fdf4",
};

export default Budgeting;