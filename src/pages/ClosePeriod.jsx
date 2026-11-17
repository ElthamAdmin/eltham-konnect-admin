import { useEffect, useState } from "react";
import api from "../api";

const BLUE = "#0B3D91";

const panel = {
  background: "white",
  padding: 20,
  borderRadius: 12,
  border: "1px solid #dbe3ef",
  marginTop: 18,
};

const input = {
  display: "block",
  width: "100%",
  boxSizing: "border-box",
  padding: 10,
  marginTop: 6,
  border: "1px solid #cbd5e1",
  borderRadius: 6,
};

const button = {
  background: BLUE,
  color: "white",
  border: 0,
  padding: "10px 16px",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: "bold",
};

function ClosePeriod() {
  const [periods, setPeriods] = useState([]);
  const [selected, setSelected] = useState("");
  const [checklist, setChecklist] = useState(null);
  const [reviewed, setReviewed] = useState(false);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const selectedPeriod = periods.find(
    (period) => period.periodNumber === selected
  );

  const loadPeriods = async () => {
    const response = await api.get("/api/accounting-periods");
    setPeriods(response.data.data || []);
  };

  useEffect(() => {
    loadPeriods()
      .catch((failure) => {
        setError(
          failure?.response?.data?.message ||
            "Could not load accounting periods."
        );
      })
      .finally(() => setLoading(false));
  }, []);

  const changeSelection = (event) => {
    setSelected(event.target.value);
    setChecklist(null);
    setReviewed(false);
    setNotes("");
    setError("");
    setMessage("");
  };

  const checkPeriod = async () => {
    if (busy || !selected) return;

    setBusy(true);
    setError("");
    setMessage("");
    setChecklist(null);
    setReviewed(false);

    try {
      const response = await api.get(
        `/api/accounting-periods/${encodeURIComponent(selected)}/checklist`
      );

      setChecklist(response.data.data);
    } catch (failure) {
      setError(
        failure?.response?.data?.message ||
          "Could not check the selected period."
      );
    } finally {
      setBusy(false);
    }
  };

  const closePeriod = async () => {
    if (
      busy ||
      !selectedPeriod ||
      !checklist?.readyToClose ||
      !reviewed
    ) {
      return;
    }

    const confirmed = window.confirm(
      `Close ${selectedPeriod.periodName} for ALL businesses and branches? ` +
      "Posting will be blocked. No retained-earnings transfer or other " +
      "closing journal will be created."
    );

    if (!confirmed) return;

    setBusy(true);
    setError("");
    setMessage("");

    try {
      const response = await api.post("/api/accounting/close-period", {
        fiscalYear: selectedPeriod.fiscalYear,
        periodMonth: selectedPeriod.periodMonth,
        confirmReviewed: true,
        notes,
      });

      setChecklist(null);
      setReviewed(false);
      setNotes("");
      setMessage(response.data.message);

      try {
        await loadPeriods();
      } catch {
        setError(
          "Closing succeeded, but the list could not refresh. Reload the page to see its latest status."
        );
      }
    } catch (failure) {
      setChecklist(null);
      setReviewed(false);

      setError(
        failure?.response?.data?.message ||
          "Could not close the selected period. Refresh its checks before retrying."
      );
    } finally {
      setBusy(false);
    }
  };

  const checks = Object.entries(checklist?.checklist || {});
  const legacyJournals =
    checklist?.summary?.legacyClosingJournals || [];
  const legacyReferences =
    checklist?.summary?.legacyClosingReferences || [];

  const money = (value) =>
    value === undefined || value === null
      ? "Unavailable"
      : `JMD ${Number(value).toLocaleString("en-JM", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;

  return (
    <div>
      <h1 style={{ margin: 0, color: BLUE }}>Close Period</h1>

      <p style={{ color: "#475569" }}>
        Review a completed month and close its posting across all businesses
        and branches. Monthly closing preserves recorded profit and creates
        no closing journal.
      </p>

      <section style={{ ...panel, background: "#fff7ed" }}>
        <strong>Record and review missing activity before closing.</strong>
        <p style={{ marginBottom: 0 }}>
          Balanced reports do not prove complete bookkeeping. Bank
          reconciliation and applicable depreciation require review.
          Keep months with missing transactions Open.
        </p>
      </section>

      {error && (
        <p role="alert" style={{ color: "#991b1b" }}>{error}</p>
      )}

      {message && (
        <p role="status" style={{ color: "#166534" }}>{message}</p>
      )}

      <section style={panel}>
        <label>
          Accounting month
          <select
            value={selected}
            onChange={changeSelection}
            disabled={busy || loading}
            style={input}
          >
            <option value="">
              {loading ? "Loading periods..." : "Select a period"}
            </option>

            {periods.map((period) => (
              <option key={period._id} value={period.periodNumber}>
                {period.periodName} — {period.status}
              </option>
            ))}
          </select>
        </label>

        {!loading && !periods.length && (
          <p>Create the required month in Accounting Periods first.</p>
        )}

        {selectedPeriod && (
          <p>
            {selectedPeriod.startDate} to {selectedPeriod.endDate}
            {" · "}Status: <strong>{selectedPeriod.status}</strong>
            {" · "}Monthly posting:{" "}
            <strong>
              {selectedPeriod.status === "Open" &&
              selectedPeriod.allowPosting === true
                ? "Allowed, subject to fiscal-year controls"
                : "Blocked"}
            </strong>
          </p>
        )}

        <button
          type="button"
          onClick={checkPeriod}
          disabled={busy || loading || !selected}
          style={{ ...button, marginTop: 12 }}
        >
          {busy ? "Working..." : "Review Closing Checks"}
        </button>
      </section>

      {checklist && (
        <section style={panel}>
          <h2 style={{ marginTop: 0, color: BLUE }}>
            Review — {checklist.period.periodName}
          </h2>

          <p>
            Ready for monthly posting closure:{" "}
            <strong>{checklist.readyToClose ? "Yes" : "No"}</strong>
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 12,
            }}
          >
            {checks.map(([name, value]) => {
              const unknown = value === null;
              const passed = value === true;

              return (
                <div
                  key={name}
                  style={{
                    padding: 12,
                    border: "1px solid #dbe3ef",
                    borderRadius: 8,
                    background: unknown
                      ? "#fff7ed"
                      : passed
                        ? "#f0fdf4"
                        : "#fef2f2",
                  }}
                >
                  <strong>
                    {unknown
                      ? "Not automatically verified"
                      : passed
                        ? "Passed"
                        : "Requires review"}
                  </strong>

                  <div style={{ marginTop: 6 }}>
                    {name
                      .replace(/([A-Z])/g, " $1")
                      .replace(/^./, (char) => char.toUpperCase())}
                  </div>
                </div>
              );
            })}
          </div>

          <p>
            Recorded monthly net profit/loss:{" "}
            <strong>{money(checklist.summary?.profitAndLoss?.netProfit)}</strong>
          </p>

          <p>
            Trial Balance difference:{" "}
            {money(checklist.summary?.trialBalance?.difference)}
            {" · "}Balance Sheet difference:{" "}
            {money(checklist.summary?.balanceSheet?.difference)}
          </p>

          {(checklist.errors || []).length > 0 && (
            <div style={{ color: "#991b1b" }}>
              <h3>Items preventing closing</h3>
              <ul>
                {checklist.errors.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          <h3>Review notices</h3>
          <ul>
            {(checklist.warnings || []).map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>

          {(legacyJournals.length > 0 || legacyReferences.length > 0) && (
            <section style={{ ...panel, background: "#fff7ed" }}>
              <h3 style={{ marginTop: 0 }}>Historical closing entries</h3>

              <p>
                Review these references in Journal Entries and the General
                Ledger. This screen does not delete, reverse, or repeat them.
                A Reversed status alone does not establish that the correction
                is complete.
              </p>

              {legacyReferences.length > 0 && (
                <p>Stored references: {legacyReferences.join("; ")}</p>
              )}

              <ul>
                {legacyJournals.map((journal) => (
                  <li key={journal.entryNumber}>
                    {journal.entryNumber} — {journal.entryDate}
                    {" — "}{journal.status}
                    {" — "}{journal.reference || journal.sourceModule}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <fieldset
            disabled={busy || !checklist.readyToClose}
            style={{
              border: "1px solid #dbe3ef",
              borderRadius: 8,
              padding: 14,
              marginTop: 18,
            }}
          >
            <legend>Admin closing confirmation</legend>

            <label>
              <input
                type="checkbox"
                checked={reviewed}
                onChange={(event) => setReviewed(event.target.checked)}
              />
              {" "}I have reviewed missing activity, bank reconciliation,
              and applicable depreciation, and intend to block posting
              for this month across all businesses and branches.
            </label>

            <label style={{ display: "block", marginTop: 12 }}>
              Closing notes
              <textarea
                value={notes}
                maxLength={1800}
                onChange={(event) => setNotes(event.target.value)}
                style={input}
              />
            </label>

            <button
              type="button"
              onClick={closePeriod}
              disabled={busy || !reviewed || !checklist.readyToClose}
              style={{
                ...button,
                marginTop: 12,
                opacity: reviewed && checklist.readyToClose ? 1 : 0.6,
              }}
            >
              {busy ? "Closing..." : "Close Monthly Posting"}
            </button>
          </fieldset>

          <p style={{ color: "#475569" }}>
            Closing checks run again on the server. Reopening and locking
            remain in Accounting Periods. A closed fiscal year must also
            permit reopening before its monthly posting can resume.
          </p>
        </section>
      )}
    </div>
  );
}

export default ClosePeriod;