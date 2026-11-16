import { useEffect, useState } from "react";
import api from "../api";

const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Jamaica",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .formatToParts(new Date())
    .filter((part) =>
      ["year", "month", "day"].includes(part.type)
    )
    .reduce((result, part) => {
      result[part.type] = part.value;
      return result;
    }, {});

const dateToday = () => {
  const parts = today();
  return `${parts.year}-${parts.month}-${parts.day}`;
};

const money = (value) =>
  value === null ||
  value === undefined ||
  !Number.isFinite(Number(value))
    ? "Not available"
    : `JMD ${Number(value).toLocaleString("en-JM", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

const financialFields = [
  ["grossRevenue", "Gross revenue"],
  ["costOfSales", "Cost of sales"],
  ["operatingExpenses", "Operating expenses"],
  ["otherIncome", "Other income"],
  ["nonDeductibleExpenses", "Non-deductible expenses"],
  ["exemptIncome", "Exempt income"],
  ["capitalAllowances", "Capital allowances"],
  ["lossCarryForwardApplied", "Loss carry-forward"],
  ["otherAddBacks", "Other add-backs"],
  ["otherDeductions", "Other deductions"],
  ["taxCredits", "Tax credits"],
  ["priorPayments", "Prior payments"],
  ["manualTaxAmount", "Manual assessment amount, if required"],
];

function TaxCenterFilingPanel({
  entityCode,
  periodKey,
  onChanged,
}) {
  const [kind, setKind] = useState("gct");
  const [filings, setFilings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [revision, setRevision] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submission, setSubmission] = useState(null);

  const [filingForm, setFilingForm] = useState({
    filingReference: "",
    filedDate: dateToday(),
    filingMethod: "",
    notes: "",
  });

  useEffect(() => {
    let active = true;

    setFilings([]);
    setSubmission(null);
    setError("");
    setMessage("");

    if (!entityCode || !periodKey) {
      return;
    }

    setLoading(true);

    const url =
      kind === "gct"
        ? "/api/tax-center/gct/filing-periods"
        : "/api/tax-center/income-tax/estimates";

    api
      .get(url, {
        params: { entityCode, periodKey },
      })
      .then((response) => {
        if (active) {
          setFilings(response.data.data || []);
        }
      })
      .catch((requestError) => {
        if (active) {
          setError(
            requestError.response?.data?.message ||
              "Could not load filings."
          );
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [entityCode, periodKey, kind, revision]);

  const perform = async (work) => {
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const response = await work();

      setMessage(
        response?.data?.message ||
          "Action completed successfully."
      );

      setSubmission(null);
      setRevision((value) => value + 1);

      try {
        await onChanged?.();
      } catch {
        setMessage(
          "The action succeeded. Refresh Tax Center to reload its results."
        );
      }
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Could not complete the filing action."
      );
    } finally {
      setBusy(false);
    }
  };

  const workflowUrl = (filing) => {
    const reference =
      filing.filingNumber || filing.estimateNumber;

    return kind === "gct"
      ? `/api/tax-center/gct/filing-periods/${encodeURIComponent(reference)}/workflow`
      : `/api/tax-center/income-tax/estimates/${encodeURIComponent(reference)}/workflow`;
  };

  const transition = (filing, action) =>
    perform(() =>
      api.post(workflowUrl(filing), { action })
    );

  const startSubmission = (filing) => {
    setSubmission(filing);

    setFilingForm({
      filingReference: "",
      filedDate: dateToday(),
      filingMethod: "",
      notes: "",
    });

    setError("");
    setMessage("");
  };

  const submitFiling = async (event) => {
    event.preventDefault();

    await perform(() =>
      api.post(workflowUrl(submission), {
        action: "Submit",
        ...filingForm,
        filingReference:
          filingForm.filingReference.trim(),
      })
    );
  };

  const filingMethods =
    kind === "gct"
      ? [
          "TAJ Online",
          "Manual Submission",
          "Tax Agent",
          "Other",
        ]
      : [
          "Online",
          "Manual",
          "Tax Authority Assessment",
          "Other",
        ];

  return (
    <section style={panel}>
      <h2 style={{ marginTop: 0 }}>
        Filing controls
      </h2>

      <p>
        These actions record filings completed outside
        EKOS. They do not send returns to TAJ.
      </p>

      <IncomeTaxForm
        entityCode={entityCode}
        periodKey={periodKey}
        onSaved={async () => {
          setRevision((value) => value + 1);
          await onChanged?.();
        }}
      />

      <GctSourceReview
        entityCode={entityCode}
        onSaved={async () => {
          setRevision((value) => value + 1);
          await onChanged?.();
        }}
      />

      <div style={row}>
        <label style={{ minWidth: 220 }}>
          Filing register
          <select
            value={kind}
            disabled={busy}
            onChange={(event) =>
              setKind(event.target.value)
            }
          >
            <option value="gct">
              GCT filing periods
            </option>
            <option value="income">
              Income-tax estimates
            </option>
          </select>
        </label>

        <button
          type="button"
          disabled={busy || loading}
          onClick={() =>
            setRevision((value) => value + 1)
          }
        >
          Refresh filings
        </button>

        {kind === "gct" && (
          <button
            type="button"
            disabled={busy || loading}
            onClick={() =>
              perform(() =>
                api.post(
                  "/api/tax-center/gct/filing-periods/calculate",
                  { entityCode, periodKey }
                )
              )
            }
          >
            Calculate selected GCT month
          </button>
        )}
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

      {loading ? (
        <p role="status">Loading filings…</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Reference / period</th>
                <th>Status</th>
                <th>Tax position</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filings.map((filing) => {
                const reference =
                  filing.filingNumber ||
                  filing.estimateNumber;

                const nextAction = {
                  Calculated: "Review",
                  Reviewed: "Approve",
                  Approved: "Submit",
                }[filing.status];

                const canReconcile =
                  filing.status === "Paid" ||
                  (
                    kind === "income" &&
                    filing.status === "Submitted" &&
                    Number(filing.balanceDue) === 0 &&
                    filing.taxRecordId
                  );

                return (
                  <tr key={reference}>
                    <td>
                      <strong>{reference}</strong>
                      <br />
                      {filing.periodKey}
                      <br />
                      {filing.taxNumber || ""}
                    </td>

                    <td>
                      {filing.status}
                      <br />
                      {filing.calculationMode}
                    </td>

                    <td>
                      {kind === "gct"
                        ? money(filing.netGct)
                        : money(
                            filing.estimatedTaxDue
                          )}

                      {filing.netPosition && (
                        <div>
                          {filing.netPosition}
                        </div>
                      )}
                    </td>

                    <td>
                      {nextAction && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            nextAction === "Submit"
                              ? startSubmission(
                                  filing
                                )
                              : transition(
                                  filing,
                                  nextAction
                                )
                          }
                        >
                          {nextAction}
                        </button>
                      )}

                      {canReconcile && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            transition(
                              filing,
                              "Reconcile"
                            )
                          }
                        >
                          Reconcile filing
                        </button>
                      )}

                      <details
                        style={{ marginTop: 8 }}
                      >
                        <summary>
                          Filing details
                        </summary>

                        <p>
                          Official reference:{" "}
                          {filing.filingReference ||
                            "Not recorded"}
                        </p>

                        <p>
                          Filed date:{" "}
                          {filing.filedDate
                            ? String(
                                filing.filedDate
                              ).slice(0, 10)
                            : "Not recorded"}
                        </p>

                        <p>
                          {filing.complianceBlockReason ||
                            filing.notes}
                        </p>
                      </details>
                    </td>
                  </tr>
                );
              })}

              {!filings.length && !error && (
                <tr>
                  <td colSpan={4}>
                    No filings for this selection.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {submission && (
        <form
          onSubmit={submitFiling}
          style={subPanel}
        >
          <h3>
            Record completed filing:{" "}
            {submission.filingNumber ||
              submission.estimateNumber}
          </h3>

          <fieldset disabled={busy}>
            <div style={grid}>
              <label>
                Official filing reference
                <input
                  required
                  value={
                    filingForm.filingReference
                  }
                  onChange={(event) =>
                    setFilingForm({
                      ...filingForm,
                      filingReference:
                        event.target.value,
                    })
                  }
                />
              </label>

              <label>
                Actual filed date
                <input
                  type="date"
                  required
                  max={dateToday()}
                  value={filingForm.filedDate}
                  onChange={(event) =>
                    setFilingForm({
                      ...filingForm,
                      filedDate:
                        event.target.value,
                    })
                  }
                />
              </label>

              <label>
                Filing method
                <select
                  required
                  value={filingForm.filingMethod}
                  onChange={(event) =>
                    setFilingForm({
                      ...filingForm,
                      filingMethod:
                        event.target.value,
                    })
                  }
                >
                  <option value="">
                    Select method
                  </option>

                  {filingMethods.map((method) => (
                    <option key={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label>
              Submission notes
              <textarea
                value={filingForm.notes}
                onChange={(event) =>
                  setFilingForm({
                    ...filingForm,
                    notes: event.target.value,
                  })
                }
              />
            </label>

            <div style={row}>
              <button type="submit">
                Save completed filing
              </button>

              <button
                type="button"
                onClick={() =>
                  setSubmission(null)
                }
              >
                Cancel
              </button>
            </div>
          </fieldset>
        </form>
      )}

      <p style={{ color: "#64748b" }}>
        Pay obligations through the tax-record
        payment action. Reconcile the linked tax
        obligation before reconciling its filing.
        Zero and refundable GCT returns remain
        submitted pending their separate settlement
        handling.
      </p>
    </section>
  );
}

function IncomeTaxForm({
  entityCode,
  periodKey,
  onSaved,
}) {
  const year = periodKey.slice(0, 4);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    periodStart: `${year}-01-01`,
    periodEnd: `${year}-12-31`,
    adjustmentNotes: "",
    notes: "",
  });

  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const change = (field, value) => {
    setPreview(null);
    setMessage("");

    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const payload = () => {
    const result = {
      entityCode,
      periodStart: form.periodStart,
      periodEnd: form.periodEnd,
      adjustmentNotes:
        form.adjustmentNotes,
      notes: form.notes,
    };

    for (const [field] of financialFields) {
      if (
        field === "manualTaxAmount" &&
        (
          form[field] === undefined ||
          form[field] === ""
        )
      ) {
        continue;
      }

      result[field] =
        form[field] === undefined ||
        form[field] === ""
          ? 0
          : form[field];
    }

    return result;
  };

  const calculate = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setPreview(null);

    try {
      const response = await api.post(
        "/api/tax-center/income-tax/estimates/preview",
        payload()
      );

      setPreview(response.data.data);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Could not calculate the estimate."
      );
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    setBusy(true);
    setError("");

    try {
      const response = await api.post(
        "/api/tax-center/income-tax/estimates",
        payload()
      );

      setMessage(response.data.message);
      setPreview(null);

      try {
        await onSaved?.();
      } catch {
        setMessage(
          "Estimate saved. Refresh the filing register."
        );
      }
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Could not save the estimate."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={subPanel}>
      <button
        type="button"
        disabled={busy}
        onClick={() =>
          setOpen((value) => !value)
        }
      >
        {open
          ? "Close income-tax form"
          : "Create income-tax estimate"}
      </button>

      {open && (
        <form onSubmit={calculate}>
          <p>
            Enter the reviewed financial summary
            for this business only. Adjust the
            dates for its actual fiscal period.
            The assigned rule determines the
            calculation and reporting frequency.
          </p>

          <fieldset disabled={busy}>
            <div style={grid}>
              {[
                ["periodStart", "Period start"],
                ["periodEnd", "Period end"],
              ].map(([field, label]) => (
                <label key={field}>
                  {label}
                  <input
                    type="date"
                    required
                    value={form[field]}
                    onChange={(event) =>
                      change(
                        field,
                        event.target.value
                      )
                    }
                  />
                </label>
              ))}

              {financialFields.map(
                ([field, label]) => (
                  <label key={field}>
                    {label}
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form[field] ?? ""}
                      onChange={(event) =>
                        change(
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
              Adjustment evidence / notes
              <textarea
                value={form.adjustmentNotes}
                onChange={(event) =>
                  change(
                    "adjustmentNotes",
                    event.target.value
                  )
                }
              />
            </label>

            <label style={{ marginTop: 10 }}>
              Estimate notes
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
              Credits, prior payments, and loss
              history require supporting review.
              Estimates with credits or prior
              payments cannot be posted through
              the standard submission action.
            </p>

            <button type="submit">
              {busy
                ? "Calculating…"
                : "Preview estimate"}
            </button>

            {preview && (
              <div style={previewStyle}>
                <p>
                  Rule:{" "}
                  <strong>
                    {preview.incomeTaxRuleCode}
                  </strong>
                </p>

                <p>
                  Reporting period:{" "}
                  {preview.periodKey}
                </p>

                <p>
                  Accounting profit:{" "}
                  {money(
                    preview.financialSummary
                      ?.accountingProfit
                  )}
                </p>

                <p>
                  Gross income tax:{" "}
                  {money(
                    preview.grossIncomeTax
                  )}
                </p>

                <p>
                  Estimated tax due:{" "}
                  <strong>
                    {money(
                      preview.estimatedTaxDue
                    )}
                  </strong>
                </p>

                <p>{preview.notice}</p>

                <button
                  type="button"
                  onClick={save}
                >
                  Save estimate for review
                </button>
              </div>
            )}
          </fieldset>

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
        </form>
      )}
    </div>
  );
}

function GctSourceReview({
  entityCode,
  onSaved,
}) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState("invoice");
  const [reference, setReference] = useState("");
  const [values, setValues] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const invoiceFields = [
    ["customerPurchaseRecovery", "Customer purchase recovery", "number"],
    ["exemptTurnover", "Exempt turnover", "number"],
    ["zeroRatedTurnover", "Zero-rated turnover", "number"],
    ["outsideScopeAmount", "Outside-scope amount", "number"],
    ["classificationNotes", "Classification notes", "text"],
  ];

  const expenseFields = [
    ["supplierName", "Supplier name", "text"],
    ["supplierTrn", "Supplier TRN", "text"],
    ["supplierGctRegistrationNumber", "Supplier GCT registration", "text"],
    ["supplierInvoiceNumber", "Supplier invoice number", "text"],
    ["amountExcludingGct", "Amount excluding GCT", "number"],
    ["inputGctPaid", "Input GCT paid", "number"],
    ["supportingDocumentNumber", "Preserved Tax Document number", "text"],
  ];

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const payload = { entityCode };

      const selectedFields =
        kind === "invoice"
          ? invoiceFields
          : expenseFields;

      for (const [field, , type] of selectedFields) {
        if (
          field === "amountExcludingGct" &&
          !values[field]
        ) {
          continue;
        }

        payload[field] =
          type === "number"
            ? values[field] || 0
            : values[field] || "";
      }

      if (kind === "expense") {
        payload.supportingDocumentVerified =
          values.supportingDocumentVerified === true;
      }

      const url =
        kind === "invoice"
          ? `/api/tax-center/gct/invoices/${encodeURIComponent(reference.trim())}/classification`
          : `/api/tax-center/gct/expenses/${encodeURIComponent(reference.trim())}/input-tax`;

      const response = await api.patch(
        url,
        payload
      );

      setMessage(response.data.message);

      try {
        await onSaved?.();
      } catch {
        setMessage(
          "Source review saved. Refresh Tax Center."
        );
      }
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Could not save source review."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={subPanel}>
      <button
        type="button"
        disabled={busy}
        onClick={() =>
          setOpen((value) => !value)
        }
      >
        {open
          ? "Close GCT source review"
          : "Review GCT source evidence"}
      </button>

      {open && (
        <form onSubmit={submit}>
          <p>
            Enter the exact source reference.
            The server checks that it belongs
            to the selected business.
          </p>

          <fieldset disabled={busy}>
            <div style={grid}>
              <label>
                Source type
                <select
                  value={kind}
                  onChange={(event) => {
                    setKind(event.target.value);
                    setReference("");
                    setValues({});
                    setError("");
                    setMessage("");
                  }}
                >
                  <option value="invoice">
                    Customer invoice
                  </option>
                  <option value="expense">
                    Expense
                  </option>
                </select>
              </label>

              <label>
                Exact source reference
                <input
                  required
                  value={reference}
                  onChange={(event) =>
                    setReference(
                      event.target.value
                    )
                  }
                />
              </label>

              {(kind === "invoice"
                ? invoiceFields
                : expenseFields
              ).map(([field, label, type]) => (
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
                    value={values[field] ?? ""}
                    onChange={(event) =>
                      setValues({
                        ...values,
                        [field]:
                          event.target.value,
                      })
                    }
                  />
                </label>
              ))}
            </div>

            {kind === "expense" && (
              <>
                <label
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <input
                    type="checkbox"
                    style={{ width: "auto" }}
                    checked={
                      values.supportingDocumentVerified ===
                      true
                    }
                    onChange={(event) =>
                      setValues({
                        ...values,
                        supportingDocumentVerified:
                          event.target.checked,
                      })
                    }
                  />
                  Supplier evidence reviewed
                </label>

                <p>
                  Verification requires a verified
                  Cloudinary supplier tax invoice.
                  Its External reference must match
                  the supplier invoice number.
                </p>
              </>
            )}

            <button type="submit">
              {busy
                ? "Saving…"
                : "Save source review"}
            </button>
          </fieldset>

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
        </form>
      )}
    </div>
  );
}

const panel = {
  background: "white",
  border: "1px solid #dbe3ef",
  borderRadius: 12,
  padding: 18,
  marginBottom: 16,
};

const subPanel = {
  borderTop: "1px solid #dbe3ef",
  paddingTop: 14,
  marginTop: 16,
  marginBottom: 18,
};

const grid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 12,
  margin: "14px 0",
};

const row = {
  display: "flex",
  alignItems: "end",
  gap: 10,
  flexWrap: "wrap",
  margin: "14px 0",
};

const errorStyle = {
  padding: 12,
  background: "#fef2f2",
  color: "#991b1b",
  borderRadius: 8,
};

const successStyle = {
  padding: 12,
  background: "#f0fdf4",
  color: "#166534",
  borderRadius: 8,
};

const previewStyle = {
  padding: 16,
  marginTop: 14,
  background: "#eff6ff",
  border: "1px solid #bfdbfe",
  borderRadius: 10,
};

export default TaxCenterFilingPanel;