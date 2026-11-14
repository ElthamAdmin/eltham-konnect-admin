import { useState } from "react";
import api from "../../api";

const money = (value, currency = "JMD") => {
  if (value === null || value === undefined || value === "") {
    return "Not available";
  }

  const amount = Number(value);

  return Number.isFinite(amount)
    ? `${currency} ${amount.toLocaleString("en-JM", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    : "Not available";
};

const prepareActuals = (inputs) =>
  Object.entries(inputs).flatMap(([accountNumber, input]) => {
    const item = {
      accountNumber,
      notes: input.notes || "",
    };

    for (const field of ["actualBalance", "actualBaseBalance"]) {
      const text = String(input[field] ?? "").trim();

      // A blank amount is unknown. An explicitly entered zero is retained.
      if (!text) continue;

      const value = Number(text);
      const cents = Math.round(value * 100);

      if (
        !Number.isFinite(value) ||
        !Number.isSafeInteger(cents) ||
        Math.abs(value * 100 - cents) > 0.000001
      ) {
        throw new Error(
          `Enter a valid amount with no more than two decimal places for ${accountNumber}.`
        );
      }

      item[field] = value;
    }

    return item.actualBalance !== undefined ||
      item.actualBaseBalance !== undefined ||
      item.notes.trim()
      ? [item]
      : [];
  });

const buttonStyle = {
  padding: "10px 14px",
  background: "#0B3D91",
  color: "#fff",
  border: 0,
  borderRadius: 7,
  cursor: "pointer",
};

const inputStyle = {
  padding: 8,
  border: "1px solid #cbd5e1",
  borderRadius: 6,
  boxSizing: "border-box",
  maxWidth: "100%",
};

const cellStyle = {
  padding: 10,
  border: "1px solid #dbe3ef",
  textAlign: "left",
  verticalAlign: "top",
};

export default function FinancialPositionReviewPanel({ cardStyle = {} }) {
  const [date, setDate] = useState("");
  const [inputs, setInputs] = useState({});
  const [review, setReview] = useState(null);
  const [dirty, setDirty] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [batches, setBatches] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");

  const loadReview = async () => {
    if (loading) return;

    setLoading(true);
    setError("");
    setDirty(true);

    try {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw new Error("Select a review date first.");
      }

      const response = await api.post(
        "/api/finance/financial-position/preview",
        {
          effectiveDate: date,
          actualBalances: prepareActuals(inputs),
        }
      );

      const result = response.data;

      if (
        result?.success !== true ||
        !Array.isArray(result.data) ||
        result.reviewMeta?.readOnly !== true ||
        result.reviewMeta?.canPost !== false
      ) {
        throw new Error(
          "The read-only review response is incomplete. Confirm that the updated backend is deployed."
        );
      }

      setReview({
        rows: result.data,
        meta: result.reviewMeta,
      });
      setDirty(false);
    } catch (error) {
      setReview(null);
      setError(
        error?.response?.data?.message ||
          error.message ||
          "Could not load the review."
      );
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    if (historyLoading) return;

    setHistoryLoading(true);
    setHistoryError("");
    setBatches(null);

    try {
      const response = await api.get("/api/finance/adjustment-batches");

      if (
        response.data?.success !== true ||
        !Array.isArray(response.data.data)
      ) {
        throw new Error("Batch history could not be loaded completely.");
      }

      setBatches(response.data.data);
    } catch (error) {
      setHistoryError(
        error?.response?.data?.message ||
          error.message ||
          "Could not load batch history."
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  const updateInput = (accountNumber, field, value) => {
    setInputs((previous) => ({
      ...previous,
      [accountNumber]: {
        ...(previous[accountNumber] || {}),
        [field]: value,
      },
    }));
    setDirty(true);
  };

  const calculated = (value, currency = "JMD") =>
    dirty ? "Refresh review" : money(value, currency);

  const card = {
    background: "#fff",
    border: "1px solid #dbe3ef",
    borderRadius: 12,
    padding: 18,
    ...cardStyle,
    minWidth: 0,
  };

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <section style={card}>
        <h2 style={{ marginTop: 0, color: "#0B3D91" }}>
          Financial Position — Read-Only Review
        </h2>

        <p>
          Compare recorded balances with balances supported by your records.
          Batch creation and posting remain unavailable while the controlled
          approval workflow is being completed.
        </p>

        <p>
          Select a date and load the accounts first. Leave unknown actual
          amounts blank. Enter 0 only when you have verified a zero balance.
        </p>

        <p style={{ fontSize: 13 }}>
          Inputs are not saved. Changing the date clears them, and leaving
          this tab clears the review.
        </p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "end",
            gap: 12,
          }}
        >
          <label style={{ display: "grid", gap: 6 }}>
            Review balances through
            <input
              type="date"
              value={date}
              disabled={loading}
              onChange={(event) => {
                setDate(event.target.value);
                setInputs({});
                setReview(null);
                setDirty(true);
                setError("");
              }}
              style={inputStyle}
            />
          </label>

          <button
            type="button"
            onClick={loadReview}
            disabled={loading || !date}
            style={buttonStyle}
          >
            {loading ? "Loading…" : "Load / Refresh Review"}
          </button>
        </div>

        {error && (
          <p role="alert" style={{ color: "#b91c1c" }}>
            {error}
          </p>
        )}

        {review && (
          <div
            style={{
              marginTop: 14,
              padding: 12,
              background: "#fffbeb",
              borderRadius: 8,
            }}
          >
            <strong>Last calculation: {review.meta.effectiveDate}</strong>
            <p>{review.meta.balanceBasis}</p>
            <p>{review.meta.entityBasis}</p>
            <p>{review.meta.accountBasis}</p>
            <p>
              {dirty
                ? "Inputs changed. Refresh before interpreting differences."
                : `${review.meta.accountsWithIssues} account(s) have review items. A zero difference is not approval or proof of completeness.`}
            </p>
          </div>
        )}
      </section>

      {review && (
        <section style={card}>
          <h3 style={{ marginTop: 0, color: "#0B3D91" }}>
            Account Balance Review
          </h3>

          <p>
            For USD accounts, enter a reviewed JMD equivalent separately.
            This screen does not select an exchange rate or reconstruct
            historical USD balances.
          </p>

          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                minWidth: 1400,
                borderCollapse: "collapse",
                fontSize: 13,
              }}
            >
              <thead>
                <tr>
                  {[
                    "Account / Ledger Link",
                    "Currency",
                    "Recorded Native Balance",
                    "Recorded JMD Ledger",
                    "Actual Native Balance",
                    "Actual JMD Equivalent",
                    "JMD Difference",
                    "Notes / Source Reference",
                  ].map((heading) => (
                    <th
                      key={heading}
                      scope="col"
                      style={{ ...cellStyle, background: "#eef4ff" }}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {review.rows.map((row) => (
                  <AccountRows
                    key={row.accountNumber}
                    row={row}
                    input={inputs[row.accountNumber] || {}}
                    loading={loading}
                    calculated={calculated}
                    updateInput={updateInput}
                  />
                ))}

                {!review.rows.length && (
                  <tr>
                    <td colSpan={8} style={cellStyle}>
                      No financial accounts were returned for review.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section style={card}>
        <h3 style={{ marginTop: 0, color: "#0B3D91" }}>
          Existing Adjustment Batch History
        </h3>

        <p>History is available for inspection only.</p>

        <button
          type="button"
          onClick={loadHistory}
          disabled={historyLoading}
          style={buttonStyle}
        >
          {historyLoading ? "Loading…" : "Load / Refresh Batch History"}
        </button>

        {historyError && (
          <p role="alert" style={{ color: "#b91c1c" }}>
            {historyError}
          </p>
        )}

        {batches && (
          <div style={{ overflowX: "auto", marginTop: 14 }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 13,
              }}
            >
              <thead>
                <tr>
                  {[
                    "Batch",
                    "Effective Date",
                    "Reason",
                    "Status",
                    "Journal",
                    "Created By",
                    "Posted By",
                  ].map((heading) => (
                    <th key={heading} scope="col" style={cellStyle}>
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {batches.map((batch) => (
                  <tr key={batch._id || batch.batchNumber}>
                    {[
                      batch.batchNumber,
                      batch.effectiveDate,
                      batch.adjustmentReason,
                      batch.status,
                      batch.journalEntryNumber || "—",
                      batch.createdBy,
                      batch.postedBy || "—",
                    ].map((value, index) => (
                      <td key={index} style={cellStyle}>
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}

                {!batches.length && (
                  <tr>
                    <td colSpan={7} style={cellStyle}>
                      No adjustment batches were returned.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function AccountRows({
  row,
  input,
  loading,
  calculated,
  updateInput,
}) {
  return (
    <>
      <tr>
        <td style={cellStyle}>
          <strong>{row.accountName}</strong>
          <div>{row.accountNumber}</div>
          <div>{row.accountType} · {row.status}</div>
          <div>Ledger: {row.linkedChartAccountCode || "Not linked"}</div>
        </td>

        <td style={cellStyle}>{row.currency || "Not configured"}</td>

        <td style={cellStyle}>
          {row.currency === "USD"
            ? "Not reconstructed"
            : calculated(row.ledgerBalance, row.currency)}
        </td>

        <td style={cellStyle}>{calculated(row.ledgerBaseBalance)}</td>

        <td style={cellStyle}>
          <input
            type="number"
            step="0.01"
            aria-label={`Actual ${row.currency} balance for ${row.accountName}`}
            value={input.actualBalance ?? ""}
            disabled={loading}
            onChange={(event) =>
              updateInput(
                row.accountNumber,
                "actualBalance",
                event.target.value
              )
            }
            style={{ ...inputStyle, width: 145 }}
          />
        </td>

        <td style={cellStyle}>
          {row.currency === "USD" ? (
            <input
              type="number"
              step="0.01"
              aria-label={`Reviewed JMD equivalent for ${row.accountName}`}
              value={input.actualBaseBalance ?? ""}
              disabled={loading}
              onChange={(event) =>
                updateInput(
                  row.accountNumber,
                  "actualBaseBalance",
                  event.target.value
                )
              }
              style={{ ...inputStyle, width: 145 }}
            />
          ) : (
            calculated(row.actualBaseBalance)
          )}
        </td>

        <td style={{ ...cellStyle, fontWeight: "bold" }}>
          {calculated(row.difference)}
        </td>

        <td style={cellStyle}>
          <input
            type="text"
            aria-label={`Notes for ${row.accountName}`}
            value={input.notes ?? ""}
            disabled={loading}
            onChange={(event) =>
              updateInput(row.accountNumber, "notes", event.target.value)
            }
            style={{ ...inputStyle, width: 240 }}
          />
        </td>
      </tr>

      {row.issues?.length > 0 && (
        <tr>
          <td
            colSpan={8}
            style={{
              ...cellStyle,
              background: "#fffbeb",
              color: "#92400e",
            }}
          >
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {row.issues.map((issue) => (
                <li key={issue.code}>{issue.message}</li>
              ))}
            </ul>
          </td>
        </tr>
      )}
    </>
  );
}