import { useRef, useState } from "react";
import api from "../../api";

const money = (value) =>
  value === null ||
  value === undefined ||
  value === "" ||
  !Number.isFinite(Number(value))
    ? "Not available"
    : `JMD ${Number(value).toLocaleString("en-JM", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

const references = (value = "") => [
  ...new Set(
    value
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean)
  ),
];

const amount = (value) => {
  if (!String(value ?? "").trim()) {
    throw new Error(
      "Enter an actual amount for each selected account. Blank does not mean zero."
    );
  }

  const number = Number(value);
  const cents = Math.round(number * 100);

  if (
    !Number.isFinite(number) ||
    !Number.isSafeInteger(cents) ||
    Math.abs(number * 100 - cents) > 0.000001
  ) {
    throw new Error(
      "Actual amounts must have no more than two decimal places."
    );
  }

  return number;
};

const buttonStyle = {
  background: "#0B3D91",
  color: "#fff",
  padding: "9px 12px",
  border: 0,
  borderRadius: 6,
  cursor: "pointer",
};

const fieldStyle = {
  display: "block",
  width: "100%",
  boxSizing: "border-box",
  padding: 8,
  marginTop: 5,
  border: "1px solid #cbd5e1",
  borderRadius: 6,
};

const cellStyle = {
  padding: 8,
  border: "1px solid #dbe3ef",
  textAlign: "left",
  verticalAlign: "top",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 13,
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 12,
};

export default function FinancialAdjustmentWorkflow({
  cardStyle = {},
}) {
  const [date, setDate] = useState("");
  const [entity, setEntity] = useState("");
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [evidence, setEvidence] = useState("");
  const [options, setOptions] = useState(null);
  const [rows, setRows] = useState([]);
  const [inputs, setInputs] = useState({});

  const [batches, setBatches] = useState([]);
  const [selectedNumber, setSelectedNumber] = useState("");
  const [ownership, setOwnership] = useState({});
  const [approvalNotes, setApprovalNotes] = useState("");
  const [reviewed, setReviewed] = useState(false);
  const [actionReason, setActionReason] = useState("");
  const [postConfirmed, setPostConfirmed] = useState(false);

  const [pending, setPending] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const busy = useRef(false);

  const selected = batches.find(
    (batch) => batch.batchNumber === selectedNumber
  );

  const card = {
    background: "#fff",
    border: "1px solid #dbe3ef",
    borderRadius: 12,
    padding: 18,
    ...cardStyle,
    minWidth: 0,
  };

  const run = async (label, operation) => {
    if (busy.current) return;

    busy.current = true;
    setPending(label);
    setError("");
    setMessage("");

    try {
      await operation();
    } catch (error) {
      setError(
        error?.response?.data?.message ||
          error.message ||
          "The request failed."
      );
    } finally {
      busy.current = false;
      setPending("");
    }
  };

  const clearSelection = () => {
    setSelectedNumber("");
    setOwnership({});
    setApprovalNotes("");
    setReviewed(false);
    setActionReason("");
    setPostConfirmed(false);
  };

  const updateInput = (number, key, value) =>
    setInputs((previous) => ({
      ...previous,
      [number]: {
        ...(previous[number] || {}),
        [key]: value,
      },
    }));

  const updateOwnership = (number, key, value) =>
    setOwnership((previous) => ({
      ...previous,
      [number]: {
        ...(previous[number] || {}),
        [key]: value,
      },
    }));

  const refreshHistory = async () => {
    const response = await api.get(
      "/api/finance/adjustment-batches"
    );

    if (
      response.data?.success !== true ||
      !Array.isArray(response.data.data)
    ) {
      throw new Error("Could not load batch history.");
    }

    setBatches(response.data.data);
    clearSelection();
  };

  const loadAccounts = () =>
    run("Loading accounts", async () => {
      if (!date) {
        throw new Error("Select an adjustment date first.");
      }

      setRows([]);
      setInputs({});
      setOptions(null);

      const [optionResponse, reviewResponse] =
        await Promise.all([
          api.get("/api/finance/financial-position/options"),
          api.post(
            "/api/finance/financial-position/preview",
            {
              effectiveDate: date,
              actualBalances: [],
            }
          ),
        ]);

      const settings = optionResponse.data;
      const review = reviewResponse.data;

      if (
        settings?.success !== true ||
        !Array.isArray(settings.data?.entities) ||
        !Array.isArray(settings.data?.offsetAccounts) ||
        review?.success !== true ||
        !Array.isArray(review.data) ||
        review.reviewMeta?.readOnly !== true
      ) {
        throw new Error(
          "The adjustment workspace response is incomplete."
        );
      }

      setOptions(settings.data);
      setRows(review.data);
      setMessage(
        "Accounts loaded. Select only accounts supported by your evidence. Actual amounts start blank."
      );
    });

  const createDraft = (event) => {
    event.preventDefault();

    run("Creating draft", async () => {
      if (
        !options ||
        !entity ||
        !reason.trim() ||
        !references(evidence).length
      ) {
        throw new Error(
          "Select a business and enter a reason and evidence references."
        );
      }

      const actualBalances = rows
        .filter((row) => inputs[row.accountNumber]?.include)
        .map((row) => {
          const input = inputs[row.accountNumber];

          if (row.currency !== "JMD") {
            throw new Error(
              "This workflow currently prepares JMD adjustments only."
            );
          }

          if (
            !input.offset ||
            !input.explanation?.trim()
          ) {
            throw new Error(
              "Choose an offset and enter an explanation for every selected account."
            );
          }

          return {
            accountNumber: row.accountNumber,
            actualBalance: amount(input.actual),
            offsetChartAccountCode: input.offset,
            adjustmentExplanation: input.explanation.trim(),
            notes: input.explanation.trim(),
          };
        });

      if (!actualBalances.length) {
        throw new Error("Select at least one account.");
      }

      const response = await api.post(
        "/api/finance/adjustment-batches",
        {
          effectiveDate: date,
          businessEntityCode: entity,
          adjustmentReason: reason.trim(),
          description: description.trim(),
          evidenceReferences: references(evidence),
          actualBalances,
        }
      );

      if (response.data?.success !== true) {
        throw new Error(
          "The draft was not confirmed as created."
        );
      }

      setRows([]);
      setInputs({});
      setReason("");
      setDescription("");
      setEvidence("");
      setBatches([]);
      clearSelection();

      setMessage(
        `Draft ${response.data.data.batchNumber} created. No journal was posted.`
      );

      try {
        await refreshHistory();
      } catch {
        setError(
          "The draft was created, but history could not reload. Use Load / Refresh Batches; do not recreate the draft."
        );
      }
    });
  };

  const mutate = (suffix, payload, success) =>
    run(success, async () => {
      const response = await api.post(
        `/api/finance/adjustment-batches/${encodeURIComponent(
          selected.batchNumber
        )}/${suffix}`,
        payload
      );

      if (response.data?.success !== true) {
        throw new Error("The action was not confirmed.");
      }

      setBatches([]);
      clearSelection();
      setMessage(success);

      try {
        await refreshHistory();
      } catch {
        setError(
          "The action succeeded, but history could not reload. Reload batches before taking another action."
        );
      }
    });

  const approve = () => {
    const ownershipReview = selected.lines.map((line) => ({
      accountNumber: line.accountNumber,
      entityCode: selected.businessEntityCode,
      ownershipConfirmed:
        ownership[line.accountNumber]?.confirmed === true,
      evidenceReferences: references(
        ownership[line.accountNumber]?.references || ""
      ),
      notes: ownership[line.accountNumber]?.notes || "",
    }));

    mutate(
      "approve",
      {
        expectedContentHash: selected.contentHash,
        evidenceReviewed: reviewed,
        ownershipReview,
        notes: approvalNotes,
      },
      "Batch approved. No journal was posted."
    );
  };

  return (
    <section style={card}>
      <h2 style={{ marginTop: 0, color: "#0B3D91" }}>
        Controlled Financial Adjustments
      </h2>

      <p>
        Prepare a draft, inspect its calculated differences,
        submit it, then record your approval. Each stage is
        separate.
      </p>

      <p>
        Evidence references identify documents you have
        reviewed; this form does not upload documents.
        Draft inputs are not saved until you create the draft.
      </p>

      {pending && <p role="status">{pending}…</p>}

      {error && (
        <p role="alert" style={{ color: "#b91c1c" }}>
          {error}
        </p>
      )}

      {message && (
        <p role="status" style={{ color: "#166534" }}>
          {message}
        </p>
      )}

      <fieldset
        disabled={Boolean(pending)}
        style={{ border: 0, padding: 0, minWidth: 0 }}
      >
        <form onSubmit={createDraft}>
          <div style={gridStyle}>
            <label>
              Adjustment date
              <input
                type="date"
                value={date}
                style={fieldStyle}
                required
                onChange={(event) => {
                  setDate(event.target.value);
                  setRows([]);
                  setInputs({});
                  setOptions(null);
                  setEntity("");
                }}
              />
            </label>

            <div style={{ alignSelf: "end" }}>
              <button
                type="button"
                style={buttonStyle}
                onClick={loadAccounts}
              >
                Load / Refresh Accounts
              </button>
            </div>
          </div>

          {options && (
            <>
              <div style={{ ...gridStyle, marginTop: 12 }}>
                <label>
                  Business entity
                  <select
                    value={entity}
                    onChange={(event) =>
                      setEntity(event.target.value)
                    }
                    style={fieldStyle}
                    required
                  >
                    <option value="">Select business</option>
                    {options.entities.map((item) => (
                      <option
                        key={item.entityCode}
                        value={item.entityCode}
                      >
                        {item.entityCode} — {item.legalName}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Adjustment reason
                  <input
                    value={reason}
                    onChange={(event) =>
                      setReason(event.target.value)
                    }
                    style={fieldStyle}
                    required
                  />
                </label>

                <label>
                  Description
                  <input
                    value={description}
                    onChange={(event) =>
                      setDescription(event.target.value)
                    }
                    style={fieldStyle}
                  />
                </label>
              </div>

              <label
                style={{ display: "block", marginTop: 12 }}
              >
                Evidence references — one per line
                <textarea
                  value={evidence}
                  onChange={(event) =>
                    setEvidence(event.target.value)
                  }
                  style={fieldStyle}
                  required
                />
              </label>

              <p>
                Actual balances are in JMD. Leave unselected
                accounts untouched. An actual zero must be
                entered explicitly.
              </p>

              <div style={{ overflowX: "auto" }}>
                <table
                  style={{ ...tableStyle, minWidth: 1000 }}
                >
                  <thead>
                    <tr>
                      {[
                        "Include",
                        "Account",
                        "Recorded JMD",
                        "Actual JMD",
                        "Offset ledger account",
                        "Explanation",
                      ].map((title) => (
                        <th key={title} style={cellStyle}>
                          {title}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {rows.map((row) => {
                      const input =
                        inputs[row.accountNumber] || {};

                      const usable =
                        row.currency === "JMD" &&
                        row.baseCurrency === "JMD" &&
                        row.status === "Active" &&
                        row.ledgerBaseBalance !== null;

                      return (
                        <tr key={row.accountNumber}>
                          <td style={cellStyle}>
                            <input
                              type="checkbox"
                              aria-label={`Include ${row.accountName}`}
                              disabled={!usable}
                              checked={input.include === true}
                              onChange={(event) =>
                                updateInput(
                                  row.accountNumber,
                                  "include",
                                  event.target.checked
                                )
                              }
                            />
                          </td>

                          <td style={cellStyle}>
                            {row.accountName}
                            <div>
                              {row.accountNumber} ·{" "}
                              {row.currency}
                            </div>
                            {!usable && (
                              <div>Requires separate review</div>
                            )}
                          </td>

                          <td style={cellStyle}>
                            {money(row.ledgerBaseBalance)}
                          </td>

                          <td style={cellStyle}>
                            <input
                              type="number"
                              step="0.01"
                              aria-label={`Actual balance for ${row.accountName}`}
                              value={input.actual ?? ""}
                              disabled={!input.include}
                              required={input.include === true}
                              onChange={(event) =>
                                updateInput(
                                  row.accountNumber,
                                  "actual",
                                  event.target.value
                                )
                              }
                              style={fieldStyle}
                            />
                          </td>

                          <td style={cellStyle}>
                            <select
                              aria-label={`Offset for ${row.accountName}`}
                              value={input.offset || ""}
                              disabled={!input.include}
                              required={input.include === true}
                              onChange={(event) =>
                                updateInput(
                                  row.accountNumber,
                                  "offset",
                                  event.target.value
                                )
                              }
                              style={fieldStyle}
                            >
                              <option value="">
                                Select offset account
                              </option>
                              {options.offsetAccounts.map(
                                (item) => (
                                  <option
                                    key={item.accountCode}
                                    value={item.accountCode}
                                  >
                                    {item.accountCode} —{" "}
                                    {item.accountName}
                                  </option>
                                )
                              )}
                            </select>
                          </td>

                          <td style={cellStyle}>
                            <input
                              aria-label={`Explanation for ${row.accountName}`}
                              value={input.explanation || ""}
                              disabled={!input.include}
                              required={input.include === true}
                              onChange={(event) =>
                                updateInput(
                                  row.accountNumber,
                                  "explanation",
                                  event.target.value
                                )
                              }
                              style={fieldStyle}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <button
                type="submit"
                style={{ ...buttonStyle, marginTop: 12 }}
              >
                Create Draft — No Posting
              </button>
            </>
          )}
        </form>

        <hr
          style={{
            margin: "24px 0",
            border: 0,
            borderTop: "1px solid #dbe3ef",
          }}
        />

        <h3>Inspect and Review Batches</h3>

        <button
          type="button"
          style={buttonStyle}
          onClick={() =>
            run("Loading batches", refreshHistory)
          }
        >
          Load / Refresh Batches
        </button>

        <label style={{ display: "block", marginTop: 12 }}>
          Select a batch
          <select
            value={selectedNumber}
            style={fieldStyle}
            onChange={(event) => {
              clearSelection();
              setSelectedNumber(event.target.value);
            }}
          >
            <option value="">Select batch</option>
            {batches.map((batch) => (
              <option
                key={batch.batchNumber}
                value={batch.batchNumber}
              >
                {batch.batchNumber} · {batch.effectiveDate} ·{" "}
                {batch.status}
              </option>
            ))}
          </select>
        </label>

        {selected && (
          <>
            <h3>
              {selected.batchNumber} — {selected.status}
            </h3>

            <p>
              Effective date: {selected.effectiveDate} ·
              Business:{" "}
              {selected.businessEntityCode || "Not recorded"}
            </p>

            <p>Reason: {selected.adjustmentReason}</p>
            <p>{selected.description}</p>

            <p>
              Evidence:{" "}
              {(selected.evidenceReferences || []).join("; ") ||
                "Not recorded"}
            </p>

            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    {[
                      "Account",
                      "Recorded JMD",
                      "Actual JMD",
                      "Difference",
                      "Offset",
                      "Explanation / evidence",
                    ].map((title) => (
                      <th key={title} style={cellStyle}>
                        {title}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {(selected.lines || []).map((line) => (
                    <tr key={line.accountNumber}>
                      <td style={cellStyle}>
                        {line.accountName}
                        <div>
                          {line.accountNumber} · {line.currency}
                        </div>
                      </td>
                      <td style={cellStyle}>
                        {money(line.ledgerBaseBalance)}
                      </td>
                      <td style={cellStyle}>
                        {money(line.actualBaseBalance)}
                      </td>
                      <td style={cellStyle}>
                        {money(line.difference)}
                      </td>
                      <td style={cellStyle}>
                        {line.offsetChartAccountCode}{" "}
                        {line.offsetChartAccountName}
                      </td>
                      <td style={cellStyle}>
                        {line.adjustmentExplanation || line.notes}
                        <div>
                          {(line.evidenceReferences || []).join(
                            "; "
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selected.workflowVersion !== 2 ? (
              <p>Historical batch — inspection only.</p>
            ) : (
              <>
                {selected.status === "Draft" && (
                  <div style={{ marginTop: 12 }}>
                    <button
                      type="button"
                      style={buttonStyle}
                      onClick={() =>
                        mutate(
                          "submit",
                          {},
                          "Draft submitted for review."
                        )
                      }
                    >
                      Submit Draft for Review
                    </button>
                  </div>
                )}

                {selected.status === "Submitted" && (
                  <>
                    <h4>Account Ownership Review</h4>

                    {(selected.lines || []).map((line) => (
                      <div
                        key={line.accountNumber}
                        style={{
                          border: "1px solid #dbe3ef",
                          padding: 12,
                          marginBottom: 12,
                        }}
                      >
                        <label>
                          <input
                            type="checkbox"
                            checked={
                              ownership[line.accountNumber]
                                ?.confirmed === true
                            }
                            onChange={(event) =>
                              updateOwnership(
                                line.accountNumber,
                                "confirmed",
                                event.target.checked
                              )
                            }
                          />{" "}
                          I reviewed evidence that{" "}
                          {line.accountName} belongs to{" "}
                          {selected.businessEntityCode}.
                        </label>

                        <label
                          style={{
                            display: "block",
                            marginTop: 8,
                          }}
                        >
                          Ownership evidence references — one
                          per line
                          <textarea
                            style={fieldStyle}
                            value={
                              ownership[line.accountNumber]
                                ?.references || ""
                            }
                            onChange={(event) =>
                              updateOwnership(
                                line.accountNumber,
                                "references",
                                event.target.value
                              )
                            }
                          />
                        </label>

                        <label>
                          Ownership review notes
                          <input
                            style={fieldStyle}
                            value={
                              ownership[line.accountNumber]
                                ?.notes || ""
                            }
                            onChange={(event) =>
                              updateOwnership(
                                line.accountNumber,
                                "notes",
                                event.target.value
                              )
                            }
                          />
                        </label>
                      </div>
                    ))}

                    <label>
                      <input
                        type="checkbox"
                        checked={reviewed}
                        onChange={(event) =>
                          setReviewed(event.target.checked)
                        }
                      />{" "}
                      I reviewed the adjustment evidence,
                      amounts and offset accounts.
                    </label>

                    <label
                      style={{ display: "block", marginTop: 8 }}
                    >
                      Approval notes
                      <textarea
                        style={fieldStyle}
                        value={approvalNotes}
                        onChange={(event) =>
                          setApprovalNotes(event.target.value)
                        }
                      />
                    </label>

                    <button
                      type="button"
                      style={{
                        ...buttonStyle,
                        marginTop: 12,
                      }}
                      disabled={
                        !reviewed || !approvalNotes.trim()
                      }
                      onClick={approve}
                    >
                      Approve — No Posting
                    </button>
                  </>
                )}

                {["Draft", "Submitted"].includes(
                  selected.status
                ) && (
                  <div style={{ marginTop: 16 }}>
                    <label>
                      Reason for cancellation or rejection
                      <input
                        style={fieldStyle}
                        value={actionReason}
                        onChange={(event) =>
                          setActionReason(event.target.value)
                        }
                      />
                    </label>

                    <button
                      type="button"
                      style={{ ...buttonStyle, marginTop: 8 }}
                      disabled={!actionReason.trim()}
                      onClick={() =>
                        mutate(
                          selected.status === "Draft"
                            ? "cancel"
                            : "reject",
                          { reason: actionReason.trim() },
                          selected.status === "Draft"
                            ? "Draft cancelled; history retained."
                            : "Batch rejected."
                        )
                      }
                    >
                      {selected.status === "Draft"
                        ? "Cancel Draft"
                        : "Reject Batch"}
                    </button>
                  </div>
                )}

                {selected.status === "Approved" &&
                  (options?.postingEnabled === true ? (
                    <div style={{ marginTop: 16 }}>
                      <label>
                        <input
                          type="checkbox"
                          checked={postConfirmed}
                          onChange={(event) =>
                            setPostConfirmed(
                              event.target.checked
                            )
                          }
                        />{" "}
                        Post this approved correction to the
                        journal and accounts.
                      </label>

                      <div>
                        <button
                          type="button"
                          disabled={!postConfirmed}
                          style={{
                            ...buttonStyle,
                            marginTop: 8,
                          }}
                          onClick={() =>
                            mutate(
                              "post",
                              {
                                expectedApprovedContentHash:
                                  selected.approvedContentHash,
                              },
                              "Posting request completed. Inspect the refreshed batch."
                            )
                          }
                        >
                          Post Approved Adjustment
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p>
                      Approved. Posting is not enabled in this
                      workspace.
                    </p>
                  ))}
              </>
            )}

            <p>
              Created by: {selected.createdBy} · Approved by:{" "}
              {selected.approvedBy || "—"} · Posted by:{" "}
              {selected.postedBy || "—"}
            </p>

            {selected.approvalNotes && (
              <p>Approval notes: {selected.approvalNotes}</p>
            )}

            {selected.journalEntryNumber && (
              <p>Journal: {selected.journalEntryNumber}</p>
            )}

            {selected.rejectionReason && (
              <p>
                Rejection reason: {selected.rejectionReason}
              </p>
            )}

            {selected.cancellationReason && (
              <p>
                Cancellation reason:{" "}
                {selected.cancellationReason}
              </p>
            )}

            <details>
              <summary>
                Audit history and recorded ownership review
              </summary>

              <ul>
                {(selected.auditEvents || []).map(
                  (item, index) => (
                    <li key={index}>
                      {item.occurredAt} · {item.action} ·{" "}
                      {item.actorName} · {item.reason}
                    </li>
                  )
                )}
              </ul>

              <ul>
                {(selected.ownershipReview || []).map(
                  (item) => (
                    <li key={item.accountNumber}>
                      {item.accountNumber} · {item.entityCode} ·{" "}
                      {(item.evidenceReferences || []).join(
                        "; "
                      )}{" "}
                      · {item.notes}
                    </li>
                  )
                )}
              </ul>
            </details>
          </>
        )}
      </fieldset>
    </section>
  );
}