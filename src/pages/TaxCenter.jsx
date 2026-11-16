import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import api from "../api";

import TaxDocumentsPanel from "../components/TaxDocumentsPanel";
import TaxRecordsWorkflowPanel from "../components/TaxRecordsWorkflowPanel";
import BusinessEntityTransitionPanel from "../components/BusinessEntityTransitionPanel";
import TaxCenterFilingPanel from "../components/TaxCenterFilingPanel";

const today = () => {
  const parts = new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: "America/Jamaica",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }
  ).formatToParts(new Date());

  return ["year", "month", "day"]
    .map(
      (key) =>
        parts.find(
          (part) => part.type === key
        ).value
    )
    .join("-");
};

const money = (value) => {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(Number(value))
  ) {
    return "Not available";
  }

  return `JMD ${Number(value).toLocaleString(
    "en-JM",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}`;
};

const monthDates = (periodKey) => {
  const [year, month] =
    periodKey.split("-").map(Number);

  return {
    periodStart: `${periodKey}-01`,

    periodEnd: new Date(
      Date.UTC(year, month, 0, 12)
    )
      .toISOString()
      .slice(0, 10),
  };
};

const initialForm = (periodKey) => ({
  taxType: "Other",
  ...monthDates(periodKey),
  taxableAmount: "",
  taxRate: "",
  taxDue: "",
  dueDate: "",
  notes: "",
});

function TaxCenter() {
  const [entities, setEntities] = useState([]);
  const [entityCode, setEntityCode] = useState("");

  const [periodKey, setPeriodKey] = useState(
    today().slice(0, 7)
  );

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [revision, setRevision] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(
    initialForm(today().slice(0, 7))
  );

  const requestSequence = useRef(0);

  const scopeKey =
    `${entityCode}|${periodKey}`;

  const selectedEntity = entities.find(
    (entity) =>
      entity.entityCode === entityCode
  );

  const refresh = useCallback(async () => {
    setRevision((value) => value + 1);
  }, []);

  const loadEntities = useCallback(async () => {
    const response = await api.get(
      "/api/tax-center/entities"
    );

    const rows = response.data.data || [];
    setEntities(rows);

    const currentDate = today();

    const operatingEntities = rows.filter(
      (entity) =>
        entity.lifecycleStatus === "Active" &&
        entity.effectiveFrom <= currentDate &&
        (
          !entity.effectiveTo ||
          entity.effectiveTo >= currentDate
        )
    );

    setEntityCode((previous) => {
      if (
        rows.some(
          (entity) =>
            entity.entityCode === previous
        )
      ) {
        return previous;
      }

      return operatingEntities.length === 1
        ? operatingEntities[0].entityCode
        : "";
    });
  }, []);

  useEffect(() => {
    loadEntities().catch((requestError) => {
      setError(
        requestError.response?.data?.message ||
          "Could not load business entities."
      );
    });
  }, [loadEntities]);

  useEffect(() => {
    setFormOpen(false);
    setForm(initialForm(periodKey));
    setNotice("");
  }, [scopeKey]);

  useEffect(() => {
    let active = true;

    const requestId =
      ++requestSequence.current;

    setResult((previous) =>
  previous?.scopeKey === scopeKey
    ? previous
    : null
);
    setError("");

    if (
      !entityCode ||
      !/^\d{4}-(0[1-9]|1[0-2])$/.test(
        periodKey
      )
    ) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const params = {
      entityCode,
      periodKey,
    };

    const load = async () => {
      try {
        const [
          dashboardResponse,
          recordsResponse,
          payrollResponse,
          comparisonResult,
        ] = await Promise.all([
          api.get(
            "/api/tax-center/dashboard",
            { params }
          ),

          api.get(
            "/api/tax-center/records",
            { params }
          ),

          api.get(
            "/api/tax-center/payroll-summary",
            {
              params: {
                entityCode,
                payPeriod: periodKey,
              },
            }
          ),

          api.get(
            "/api/tax-center/reconciliation/entity-period",
            { params }
          )
            .then((response) => ({
              data: response.data,
              error: "",
            }))
            .catch((requestError) => ({
              data: null,

              error:
                requestError.response?.data
                  ?.message ||
                "Tax-to-GL comparison is unavailable.",
            })),
        ]);

        if (
          !active ||
          requestId !==
            requestSequence.current
        ) {
          return;
        }

        setResult({
          scopeKey,

          dashboard:
            dashboardResponse.data.data || {},

          records:
            recordsResponse.data.data || [],

          summary:
            recordsResponse.data.summary || {},

          payroll:
            payrollResponse.data.data || {},

          comparison:
            comparisonResult,
        });
      } catch (requestError) {
        if (
          active &&
          requestId ===
            requestSequence.current
        ) {
          setError(
            requestError.response?.data?.message ||
              "Could not load the selected Tax Center records."
          );
        }
      } finally {
        if (
          active &&
          requestId ===
            requestSequence.current
        ) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [entityCode, periodKey, revision, scopeKey]);

  const loaded =
    result?.scopeKey === scopeKey
      ? result
      : null;

  const dashboard =
    loaded?.dashboard || {};

  const payroll =
    loaded?.payroll || {};

  const comparison =
    loaded?.comparison;

  const performAction = async (work) => {
    setBusy(true);
    setError("");
    setNotice("");

    try {
      const message = await work();

      if (message) {
        setNotice(message);
      }

      await refresh();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Could not complete the operation."
      );
    } finally {
      setBusy(false);
    }
  };

  const saveTaxRecord = async (event) => {
    event.preventDefault();

    await performAction(async () => {
      const payload = {
        ...form,
        entityCode,
        periodKey,
        filingFrequency: "Monthly",
        taxableAmount:
          form.taxableAmount === ""
            ? 0
            : form.taxableAmount,
        taxRate:
          form.taxRate === ""
            ? 0
            : form.taxRate,
      };

      if (form.taxDue === "") {
        delete payload.taxDue;
      }

      const response = await api.post(
        "/api/tax-center/records",
        payload
      );

      setFormOpen(false);
      setForm(initialForm(periodKey));

      return response.data.message;
    });
  };

  const generatePayrollObligations = () =>
    performAction(async () => {
      const response = await api.post(
        "/api/tax-center/payroll-liabilities/generate",
        {
          entityCode,
          payPeriod: periodKey,
        }
      );

      return response.data.message;
    });

  const setField = (field, value) =>
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

  return (
    <main className="ek-tax-center">
      <style>{`
        .ek-tax-center {
          color: #1e293b;
        }

        .ek-tax-center h1,
        .ek-tax-center h2 {
          color: #0b3d91;
        }

        .ek-tax-center label {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 13px;
          font-weight: 600;
        }

        .ek-tax-center input,
        .ek-tax-center select,
        .ek-tax-center textarea {
          box-sizing: border-box;
          width: 100%;
          padding: 10px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          background: white;
          color: #1e293b;
        }

        .ek-tax-center button {
          padding: 9px 14px;
          border: 0;
          border-radius: 8px;
          background: #0b3d91;
          color: white;
          font-weight: 700;
          cursor: pointer;
        }

        .ek-tax-center button:disabled {
          opacity: 0.5;
          cursor: default;
        }

        .ek-tax-center fieldset {
          margin: 0;
          padding: 0;
          border: 0;
          min-width: 0;
        }

        .ek-tax-center table {
          width: 100%;
          border-collapse: collapse;
        }

        .ek-tax-center th,
        .ek-tax-center td {
          padding: 10px;
          border: 1px solid #dbe3ef;
          text-align: left;
          vertical-align: top;
        }

        .ek-tax-center th {
          background: #eef4ff;
        }
      `}</style>

      <h1 style={{ marginBottom: 6 }}>
        Tax Center
      </h1>

      <p style={{ color: "#64748b" }}>
        Manage tax obligations, filing evidence,
        and recorded payments by business.
        Documents remain preserved in Cloudinary.
      </p>

      <section style={panel}>
        <div style={grid}>
          <label>
            Business entity
            <select
              value={entityCode}
              disabled={busy}
              onChange={(event) =>
                setEntityCode(event.target.value)
              }
            >
              <option value="">
                Select a business
              </option>

              {entities.map((entity) => (
                <option
                  key={entity.entityCode}
                  value={entity.entityCode}
                >
                  {entity.legalName} —{" "}
                  {entity.entityCode} (
                  {entity.lifecycleStatus})
                </option>
              ))}
            </select>
          </label>

          <label>
            Reporting month
            <input
              type="month"
              value={periodKey}
              disabled={busy}
              onChange={(event) =>
                setPeriodKey(event.target.value)
              }
            />
          </label>
        </div>

        <button
          type="button"
          onClick={refresh}
          disabled={
            loading ||
            busy ||
            !entityCode
          }
        >
          Refresh Tax Center
        </button>

        <p style={{ marginBottom: 0 }}>
          {selectedEntity
            ? `${selectedEntity.entityType}. Operating period: ${selectedEntity.effectiveFrom} to ${selectedEntity.effectiveTo || "open-ended"}.`
            : "Select a business to load its records."}
        </p>

        <p style={{ color: "#64748b" }}>
          Selecting a business changes the report
          view. It does not activate the LLC.
        </p>
      </section>

      <BusinessEntityTransitionPanel
  entities={entities}
  onChanged={async () => {
    await loadEntities();
    await refresh();
  }}
/>

      {error && (
        <div role="alert" style={errorPanel}>
          {error}
        </div>
      )}

      {notice && (
        <div role="status" style={successPanel}>
          {notice}
        </div>
      )}

      {loading && (
        <p role="status">
          Loading selected business and period…
        </p>
      )}

      {loaded && (
        <>
          <div style={grid}>
            {[
              [
                "Reviewed tax balance",
                dashboard.currentLiabilities,
              ],
              [
                "Recorded tax payments",
                dashboard.totalPaid,
              ],
              [
                "Overdue obligations",
                dashboard.overdueAmount,
              ],
              [
                "Due in the next 30 days",
                dashboard.upcomingAmount,
              ],
            ].map(([label, value]) => (
              <section key={label} style={panel}>
                <div>{label}</div>
                <strong style={amountStyle}>
                  {money(value)}
                </strong>
              </section>
            ))}
          </div>

          <p style={{ color: "#64748b" }}>
            {dashboard.notice}
          </p>

          <section style={panel}>
            <h2 style={{ marginTop: 0 }}>
              Tax-to-General-Ledger comparison
            </h2>

            {comparison?.error ? (
              <p role="alert">
                {comparison.error}
              </p>
            ) : (
              <>
                <p>
                  {comparison?.data?.notice}
                </p>

                <div style={grid}>
                  <div>
                    Tax-record balance
                    <strong style={amountStyle}>
                      {money(
                        comparison?.data?.summary
                          ?.taxCenterBalance
                      )}
                    </strong>
                  </div>

                  <div>
                    General Ledger balance
                    <strong style={amountStyle}>
                      {money(
                        comparison?.data?.summary
                          ?.glBalance
                      )}
                    </strong>
                  </div>
                </div>

                <div style={{ overflowX: "auto" }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Tax</th>
                        <th>Status</th>
                        <th>Difference</th>
                        <th>Review findings</th>
                      </tr>
                    </thead>

                    <tbody>
                      {(
                        comparison?.data?.data || []
                      ).map((row) => (
                        <tr
                          key={`${row.taxType}-${row.accountCode}`}
                        >
                          <td>{row.taxType}</td>
                          <td>{row.status}</td>
                          <td>
                            {money(
                              row.reconciliationDifference
                            )}
                          </td>
                          <td>
                            {row.issues?.length
                              ? row.issues.join(" ")
                              : "No recorded issues."}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>

          <section style={panel}>
            <h2 style={{ marginTop: 0 }}>
              Payroll tax summary
            </h2>

            <p>{payroll.notice}</p>

            <div style={grid}>
              {[
                ["Gross pay", "grossPay"],
                ["PAYE", "paye"],
                [
                  "Employee deductions",
                  "totalEmployeeDeductions",
                ],
                [
                  "Government liability",
                  "totalGovernmentLiability",
                ],
                [
                  "Employee pension",
                  "pensionEmployee",
                ],
                ["Net pay", "netPay"],
              ].map(([label, field]) => (
                <div key={field}>
                  {label}
                  <strong style={amountStyle}>
                    {payroll.scopeVerified
                      ? money(payroll[field])
                      : "Not available"}
                  </strong>
                </div>
              ))}
            </div>

            {payroll.unattributedPayrollNumbers
              ?.length > 0 && (
              <p style={{ color: "#92400e" }}>
                Payroll requiring employer review:{" "}
                {payroll.unattributedPayrollNumbers.join(
                  ", "
                )}
              </p>
            )}

            <button
              type="button"
              disabled={
                busy ||
                !payroll.scopeVerified ||
                !payroll.payrollRecordCount
              }
              onClick={
                generatePayrollObligations
              }
            >
              Generate obligations from posted payroll
            </button>
          </section>

          <section style={panel}>
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                setFormOpen((previous) => !previous)
              }
            >
              {formOpen
                ? "Close obligation form"
                : "+ Add monthly tax obligation"}
            </button>

            {formOpen && (
              <form
                onSubmit={saveTaxRecord}
                style={{ marginTop: 16 }}
              >
                <p>
                  Business:{" "}
                  <strong>
                    {selectedEntity?.legalName}
                  </strong>
                  . Enter a reviewed source amount
                  or a verified rate. Saving creates
                  a calculated obligation for review.
                </p>

                <fieldset disabled={busy}>
                  <div style={grid}>
                    <label>
                      Tax type
                      <select
                        value={form.taxType}
                        onChange={(event) =>
                          setField(
                            "taxType",
                            event.target.value
                          )
                        }
                      >
                        {[
                          "GCT",
                          "PAYE",
                          "NIS",
                          "NHT",
                          "Education Tax",
                          "HEART",
                          "Pension",
                          "Income Tax",
                          "Company Tax",
                          "Other",
                        ].map((type) => (
                          <option key={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </label>

                    {[
                      [
                        "periodStart",
                        "Period start",
                        "date",
                      ],
                      [
                        "periodEnd",
                        "Period end",
                        "date",
                      ],
                      [
                        "taxableAmount",
                        "Taxable amount",
                        "number",
                      ],
                      [
                        "taxRate",
                        "Verified rate (%)",
                        "number",
                      ],
                      [
                        "taxDue",
                        "Reviewed tax due (optional)",
                        "number",
                      ],
                      [
                        "dueDate",
                        "Verified due date (optional)",
                        "date",
                      ],
                    ].map(
                      ([field, label, type]) => (
                        <label key={field}>
                          {label}
                          <input
                            type={type}
                            min={
                              type === "number"
                                ? 0
                                : undefined
                            }
                            step={
                              type === "number"
                                ? "0.01"
                                : undefined
                            }
                            required={[
                              "periodStart",
                              "periodEnd",
                            ].includes(field)}
                            value={form[field]}
                            onChange={(event) =>
                              setField(
                                field,
                                event.target.value
                              )
                            }
                          />
                        </label>
                      )
                    )}
                  </div>

                  <label>
                    Source / notes
                    <textarea
                      value={form.notes}
                      onChange={(event) =>
                        setField(
                          "notes",
                          event.target.value
                        )
                      }
                    />
                  </label>

                  <button
                    type="submit"
                    style={{ marginTop: 12 }}
                  >
                    {busy
                      ? "Saving…"
                      : "Create for review"}
                  </button>
                </fieldset>
              </form>
            )}
          </section>

          <TaxCenterFilingPanel
  key={`filings:${scopeKey}`}
  entityCode={entityCode}
  periodKey={periodKey}
  onChanged={refresh}
/>

          <TaxRecordsWorkflowPanel
  key={`records:${scopeKey}`}
  entityCode={entityCode}
  periodKey={periodKey}
  records={loaded.records}
  summary={loaded.summary}
  onChanged={refresh}
/>

          <TaxDocumentsPanel
            key={`documents:${scopeKey}`}
            entityCode={entityCode}
            periodKey={periodKey}
          />
        </>
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
    "repeat(auto-fit, minmax(210px, 1fr))",
  gap: 14,
  marginBottom: 14,
};

const amountStyle = {
  display: "block",
  marginTop: 6,
  color: "#0b3d91",
  fontSize: 20,
};

const errorPanel = {
  ...panel,
  background: "#fef2f2",
  color: "#991b1b",
  borderColor: "#fecaca",
};

const successPanel = {
  ...panel,
  background: "#f0fdf4",
  color: "#166534",
  borderColor: "#bbf7d0",
};

export default TaxCenter;