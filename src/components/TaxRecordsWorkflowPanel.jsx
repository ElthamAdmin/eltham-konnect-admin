import { useEffect, useRef, useState } from "react";
import api from "../api";

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

const money = (value) =>
  value === null ||
  value === undefined ||
  !Number.isFinite(Number(value))
    ? "Not available"
    : `JMD ${Number(value).toLocaleString(
        "en-JM",
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }
      )}`;

function TaxRecordsWorkflowPanel({
  entityCode,
  periodKey,
  records = [],
  summary = {},
  onChanged,
}) {
  const [accounts, setAccounts] = useState([]);
  const [accountError, setAccountError] =
    useState("");

  const [action, setAction] = useState(null);
  const [form, setForm] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const pending = useRef(false);

  useEffect(() => {
    if (action?.kind !== "Payment") {
      return;
    }

    let active = true;

    setAccounts([]);
    setAccountError("");

    api
      .get("/api/financial-accounts")
      .then((response) => {
        if (!active) {
          return;
        }

        const rows = Array.isArray(
          response.data.data
        )
          ? response.data.data
          : [];

        const eligible = rows.filter(
          (account) =>
            account.status === "Active" &&
            ["Bank", "Cash"].includes(
              account.accountType
            ) &&
            account.currency === "JMD" &&
            account.baseCurrency === "JMD" &&
            account.linkedChartAccountCode &&
            rows.filter(
              (other) =>
                other.linkedChartAccountCode ===
                account.linkedChartAccountCode
            ).length === 1
        );

        setAccounts(eligible);
      })
      .catch((requestError) => {
        if (active) {
          setAccountError(
            requestError.response?.data?.message ||
              "Could not load payment accounts."
          );
        }
      });

    return () => {
      active = false;
    };
  }, [action]);

  const startAction = (record, kind) => {
    setAction({ record, kind });
    setError("");
    setMessage("");

    setForm(
      kind === "Payment"
        ? {
            amount:
              String(record.balanceDue),
            paymentDate: today(),
            paymentAccountNumber: "",
            paymentMethod: "",
            paymentReference: "",
            notes: "",
          }
        : {
            filingReference: "",
            filingMethod: "",
            filedDate: today(),
            notes: "",
          }
    );
  };

  const change = (field, value) =>
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

  const complete = async (work) => {
    if (pending.current) {
      return;
    }

    pending.current = true;
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const response = await work();

      const result = response.data.data;

      const paymentDetails =
        result?.transactionNumber
          ? ` Transaction: ${result.transactionNumber}. Journal: ${result.journalEntryNumber}.`
          : "";

      setMessage(
        (
          response.data.message ||
          "Action completed successfully."
        ) + paymentDetails
      );

      setAction(null);

      try {
        await onChanged?.();
      } catch {
        setMessage(
          "The action succeeded. Refresh Tax Center to reload the records." +
            paymentDetails
        );
      }
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "The operation could not be confirmed. Refresh and check the record before retrying."
      );
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };

  const submitAction = async (event) => {
    event.preventDefault();

    if (!action || pending.current) {
      return;
    }

    const { record, kind } = action;

    if (kind === "Payment") {
      const amount = Number(form.amount);

      if (
        !Number.isFinite(amount) ||
        amount <= 0 ||
        amount >
          Number(record.balanceDue)
      ) {
        setError(
          "Enter a positive amount no greater than the outstanding balance."
        );
        return;
      }

      if (
        !form.paymentAccountNumber ||
        !form.paymentReference.trim()
      ) {
        setError(
          "Select a payment account and enter the actual payment reference."
        );
        return;
      }

      await complete(() =>
        api.post(
          `/api/tax-center/records/${encodeURIComponent(
            record.taxNumber
          )}/pay`,

          {
            amount,
            paymentDate:
              form.paymentDate,
            paymentAccountNumber:
              form.paymentAccountNumber,
            paymentMethod:
              form.paymentMethod.trim(),
            paymentReference:
              form.paymentReference.trim(),
            notes:
              form.notes.trim(),
          }
        )
      );

      return;
    }

    const payload = {
      action: kind,
      taxNumbers: [record.taxNumber],
      notes: form.notes.trim(),
    };

    if (kind === "Submit") {
      payload.filingReference =
        form.filingReference.trim();

      payload.filingMethod =
        form.filingMethod;

      payload.filedDate =
        form.filedDate;
    }

    await complete(() =>
      api.post(
        "/api/tax-center/records/workflow",
        payload
      )
    );
  };

  const applyDeadlines = () =>
    complete(() =>
      api.post(
        "/api/tax-center/deadlines/apply",
        {
          entityCode,
          periodKey,
        }
      )
    );

  return (
    <section style={panel}>
      <h2 style={{ marginTop: 0 }}>
        Tax obligations and payments
      </h2>

      <p>
        {summary.basis ||
          "Review obligations before approval and submission. Recorded payments require matching accounting evidence."}
      </p>

      <div style={grid}>
        {[
          ["Reviewed tax due", summary.totalTaxDue],
          ["Recorded payments", summary.totalPaid],
          ["Outstanding balance", summary.totalBalance],
        ].map(([label, value]) => (
          <div key={label}>
            {label}
            <strong style={amountStyle}>
              {money(value)}
            </strong>
          </div>
        ))}
      </div>

      <button
        type="button"
        disabled={
          busy ||
          !entityCode ||
          !periodKey ||
          !records.length
        }
        onClick={applyDeadlines}
      >
        Apply verified deadline rules
      </button>

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

      <div
        style={{
          overflowX: "auto",
          marginTop: 16,
        }}
      >
        <table>
          <thead>
            <tr>
              <th>Obligation / period</th>
              <th>Tax / source</th>
              <th>Status / deadline</th>
              <th>Due / paid / balance</th>
              <th>Actions and evidence</th>
            </tr>
          </thead>

          <tbody>
            {records.map((record) => {
              const sourceFiling = [
                "GCT Return",
                "Income Tax Estimate",
              ].includes(
                record.sourceType
              );

              const nextAction = {
                Calculated: "Review",
                Reviewed: "Approve",
                Approved: "Submit",
              }[record.status];

              const canPay =
                [
                  "Submitted",
                  "Partially Paid",
                  "Overdue",
                ].includes(record.status) &&
                Boolean(
                  record.filingReference &&
                    record.submittedAt
                ) &&
                Number(
                  record.balanceDue
                ) > 0;

              const canReconcile =
                record.status === "Paid" ||
                (
                  record.status ===
                    "Submitted" &&
                  Number(
                    record.balanceDue
                  ) === 0
                );

              return (
                <tr key={record.taxNumber}>
                  <td>
                    <strong>
                      {record.taxNumber}
                    </strong>
                    <br />
                    {record.entityCode ||
                      "Business attribution required"}
                    <br />
                    {record.periodKey}
                  </td>

                  <td>
                    {record.taxType}
                    <br />
                    {record.sourceType}
                    <br />
                    {record.sourceReference || ""}
                  </td>

                  <td>
                    {record.status}
                    <br />
                    Due:{" "}
                    {record.dueDate ||
                      "Not configured"}
                  </td>

                  <td>
                    Due: {money(record.taxDue)}
                    <br />
                    Paid:{" "}
                    {money(record.amountPaid)}
                    <br />
                    <strong>
                      Balance:{" "}
                      {money(record.balanceDue)}
                    </strong>
                  </td>

                  <td>
                    <div style={row}>
                      {nextAction &&
                        !(
                          nextAction ===
                            "Submit" &&
                          sourceFiling
                        ) && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              startAction(
                                record,
                                nextAction
                              )
                            }
                          >
                            {nextAction}
                          </button>
                        )}

                      {canPay && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            startAction(
                              record,
                              "Payment"
                            )
                          }
                        >
                          Record payment
                        </button>
                      )}

                      {canReconcile && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            startAction(
                              record,
                              "Reconcile"
                            )
                          }
                        >
                          Reconcile
                        </button>
                      )}
                    </div>

                    {sourceFiling &&
                      record.status ===
                        "Approved" && (
                        <p>
                          Submit through its
                          source filing.
                        </p>
                      )}

                    <details>
                      <summary>
                        Filing and payment evidence
                      </summary>

                      <p>
                        Filing reference:{" "}
                        {record.filingReference ||
                          "Not recorded"}
                      </p>

                      <p>
                        Source journal:{" "}
                        {record.journalEntryNumber ||
                          "Not recorded"}
                      </p>

                      {(
                        record.remittances || []
                      ).map((payment) => (
                        <div
                          key={
                            payment.remittanceNumber ||
                            `${payment.paymentReference}-${payment.journalEntryNumber}`
                          }
                          style={evidenceStyle}
                        >
                          <strong>
                            {payment.remittanceNumber}
                          </strong>
                          <div>
                            {payment.paymentDate}
                            {" — "}
                            {money(payment.amount)}
                          </div>

                          <div>
                            Reference:{" "}
                            {payment.paymentReference}
                          </div>

                          <div>
                            Account:{" "}
                            {payment.paymentAccountName}
                          </div>

                          <div>
                            Journal:{" "}
                            {payment.journalEntryNumber}
                          </div>
                        </div>
                      ))}

                      {!record.remittances
                        ?.length && (
                        <p>
                          No recorded remittances.
                        </p>
                      )}
                    </details>
                  </td>
                </tr>
              );
            })}

            {!records.length && (
              <tr>
                <td colSpan={5}>
                  No tax obligations for this
                  business and reporting month.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {action && (
        <form
          onSubmit={submitAction}
          style={formPanel}
        >
          <h3>
            {action.kind}:{" "}
            {action.record.taxNumber}
          </h3>

          <fieldset disabled={busy}>
            {action.kind === "Payment" && (
              <>
                <p>
                  Record a payment already made
                  using its actual confirmation
                  reference. If a request has an
                  uncertain outcome, check the
                  obligation before retrying;
                  keep the same payment reference.
                </p>

                {accountError && (
                  <p
                    role="alert"
                    style={errorStyle}
                  >
                    {accountError}
                  </p>
                )}

                <div style={grid}>
                  <label>
                    Payment amount
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      max={
                        action.record.balanceDue
                      }
                      required
                      value={form.amount}
                      onChange={(event) =>
                        change(
                          "amount",
                          event.target.value
                        )
                      }
                    />
                  </label>

                  <label>
                    Actual payment date
                    <input
                      type="date"
                      required
                      max={today()}
                      value={form.paymentDate}
                      onChange={(event) =>
                        change(
                          "paymentDate",
                          event.target.value
                        )
                      }
                    />
                  </label>

                  <label>
                    JMD Bank / Cash account
                    <select
                      required
                      value={
                        form.paymentAccountNumber
                      }
                      onChange={(event) =>
                        change(
                          "paymentAccountNumber",
                          event.target.value
                        )
                      }
                    >
                      <option value="">
                        Select account
                      </option>

                      {accounts.map(
                        (account) => (
                          <option
                            key={
                              account.accountNumber
                            }
                            value={
                              account.accountNumber
                            }
                          >
                            {account.accountName}
                            {" — "}
                            {money(
                              account.currentBalance
                            )}
                          </option>
                        )
                      )}
                    </select>
                  </label>

                  <label>
                    Payment method
                    <input
                      required
                      placeholder="For example: bank transfer"
                      value={
                        form.paymentMethod
                      }
                      onChange={(event) =>
                        change(
                          "paymentMethod",
                          event.target.value
                        )
                      }
                    />
                  </label>

                  <label>
                    Actual confirmation reference
                    <input
                      required
                      autoComplete="off"
                      value={
                        form.paymentReference
                      }
                      onChange={(event) =>
                        change(
                          "paymentReference",
                          event.target.value
                        )
                      }
                    />
                  </label>
                </div>

                <p>
                  Only eligible JMD Bank or Cash
                  accounts are listed. The server
                  also checks account links,
                  recorded funds, and tax-to-ledger
                  evidence before saving.
                </p>
              </>
            )}

            {action.kind === "Submit" && (
              <div style={grid}>
                <label>
                  Official filing reference
                  <input
                    required
                    value={
                      form.filingReference
                    }
                    onChange={(event) =>
                      change(
                        "filingReference",
                        event.target.value
                      )
                    }
                  />
                </label>

                <label>
                  Filing method
                  <select
                    required
                    value={form.filingMethod}
                    onChange={(event) =>
                      change(
                        "filingMethod",
                        event.target.value
                      )
                    }
                  >
                    <option value="">
                      Select method
                    </option>

                    {[
                      "TAJ Online",
                      "Manual Submission",
                      "Tax Agent",
                      "Other",
                    ].map((method) => (
                      <option key={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Actual filed date
                  <input
                    type="date"
                    required
                    max={today()}
                    value={form.filedDate}
                    onChange={(event) =>
                      change(
                        "filedDate",
                        event.target.value
                      )
                    }
                  />
                </label>
              </div>
            )}

            {action.kind === "Reconcile" && (
              <p>
                The obligation must have a zero
                outstanding balance and matching
                filing, remittance, and ledger
                evidence. This does not perform
                bank reconciliation.
              </p>
            )}

            <label>
              Review / action notes
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

            <div style={row}>
              <button type="submit">
                {busy
                  ? "Saving…"
                  : action.kind === "Payment"
                    ? "Save recorded payment"
                    : `Confirm ${action.kind}`}
              </button>

              <button
                type="button"
                onClick={() =>
                  setAction(null)
                }
              >
                Cancel
              </button>
            </div>
          </fieldset>
        </form>
      )}
    </section>
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
  gap: 12,
  marginBottom: 14,
};

const row = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  margin: "12px 0",
};

const formPanel = {
  marginTop: 18,
  padding: 16,
  border: "1px solid #bfdbfe",
  borderRadius: 10,
  background: "#f8fafc",
};

const evidenceStyle = {
  margin: "10px 0",
  padding: 10,
  border: "1px solid #dbe3ef",
  borderRadius: 8,
};

const amountStyle = {
  display: "block",
  marginTop: 5,
  fontSize: 20,
  color: "#0b3d91",
};

const errorStyle = {
  padding: 12,
  color: "#991b1b",
  background: "#fef2f2",
  borderRadius: 8,
};

const successStyle = {
  padding: 12,
  color: "#166534",
  background: "#f0fdf4",
  borderRadius: 8,
};

export default TaxRecordsWorkflowPanel;