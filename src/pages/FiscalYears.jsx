import { useEffect, useState } from "react";
import api from "../api";

const BLUE = "#0B3D91";

const panel = {
  background: "white",
  border: "1px solid #dbe3ef",
  borderRadius: 12,
  padding: 18,
  marginTop: 18,
};

const input = {
  display: "block",
  boxSizing: "border-box",
  width: "100%",
  padding: 10,
  marginTop: 6,
  border: "1px solid #cbd5e1",
  borderRadius: 6,
};

const button = {
  background: BLUE,
  color: "white",
  border: 0,
  borderRadius: 6,
  padding: "9px 12px",
  cursor: "pointer",
};

const currentYear = () =>
  Number(
    new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      timeZone: "America/Jamaica",
    }).format(new Date())
  );

function FiscalYears() {
  const [years, setYears] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [yearValue, setYearValue] = useState(currentYear);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [validation, setValidation] = useState(null);

  const loadYears = async () => {
    const response = await api.get("/api/fiscal-years");
    setYears(response.data.data || []);
  };

  useEffect(() => {
    loadYears()
      .catch((failure) =>
        setError(
          failure?.response?.data?.message ||
            "Could not load fiscal years."
        )
      )
      .finally(() => setLoading(false));
  }, []);

  const run = async (operation) => {
    if (busy) return;

    setBusy(true);
    setError("");
    setMessage("");

    try {
      await operation();
    } catch (failure) {
      setError(
        failure?.response?.data?.message ||
          "Could not complete this action."
      );
    } finally {
      setBusy(false);
    }
  };

  const createYear = () =>
    run(async () => {
      const response = await api.post("/api/fiscal-years", {
        fiscalYear: yearValue,
        notes,
      });

      setMessage(response.data.message);
      setFormOpen(false);
      setValidation(null);
      await loadYears();
    });

  const checkYear = (year, mode) =>
    run(async () => {
      const response = await api.get(
        `/api/fiscal-years/${year}/validate`,
        { params: { mode } }
      );

      setValidation(response.data.data);
      setMessage(response.data.message);
    });

  const changeYear = (year, action) => {
    const prompts = {
      close:
        `Close annual posting for FY ${year} across ALL businesses and branches? ` +
        "All 12 months must be Closed or Locked. Confirm that missing records, " +
        "reconciliation, and applicable depreciation have been reviewed. " +
        "No opening or income-transfer journals will be created.",
      lock:
        `Lock the Closed FY ${year}? There is no fiscal-year reopening action ` +
        "on this page. Lock only after final review.",
      "create-next":
        `Prepare FY ${year + 1} and any missing monthly periods? ` +
        "Existing periods retain their settings. This does not close the old " +
        "year, repost balances, activate the LLC, or change the calendar year.",
    };

    if (!window.confirm(prompts[action])) return;

    run(async () => {
      const path = `/api/fiscal-years/${year}/${action}`;

      const response =
        action === "create-next"
          ? await api.post(path)
          : await api.put(path);

      setMessage(response.data.message);
      setValidation(null);
      await loadYears();
    });
  };

  return (
    <div>
      <h1 style={{ margin: 0, color: BLUE }}>Fiscal Years</h1>

      <p style={{ color: "#475569" }}>
        Annual posting controls for all businesses and branches.
        Each year covers January 1 to December 31 with 12 monthly periods.
        Changes require an Admin.
      </p>

      <section style={{ ...panel, background: "#fff7ed" }}>
        <strong>Preparing a year does not move money or activate a business.</strong>
        <p style={{ marginBottom: 0 }}>
          Ledger balances continue automatically across years.
          Closing blocks annual posting without reposting opening balances.
          Missing records, bank reconciliation, tax filings, and accountant
          review remain separate checks.
        </p>
      </section>

      {error && (
        <p role="alert" style={{ color: "#991b1b" }}>{error}</p>
      )}

      {message && (
        <p role="status" style={{ color: "#166534" }}>{message}</p>
      )}

      <button
        type="button"
        disabled={busy || loading}
        onClick={() => setFormOpen((open) => !open)}
        style={{ ...button, marginTop: 18 }}
      >
        {formOpen ? "Close Form" : "+ Prepare Fiscal Year"}
      </button>

      {formOpen && (
        <section style={panel}>
          <h2 style={{ marginTop: 0, color: BLUE }}>
            Prepare Fiscal Year
          </h2>

          <fieldset
            disabled={busy}
            style={{ border: 0, padding: 0, margin: 0 }}
          >
            <label>
              Fiscal year
              <input
                type="number"
                min="2000"
                max="2100"
                step="1"
                value={yearValue}
                onChange={(event) => setYearValue(event.target.value)}
                style={{ ...input, maxWidth: 240 }}
              />
            </label>

            <p>
              Dates: {yearValue}-01-01 to {yearValue}-12-31.
              Missing monthly periods will be created.
              Existing monthly periods will be preserved.
            </p>

            <label>
              Notes
              <textarea
                value={notes}
                maxLength={2000}
                onChange={(event) => setNotes(event.target.value)}
                style={input}
              />
            </label>

            <button
              type="button"
              onClick={createYear}
              style={{ ...button, marginTop: 12 }}
            >
              {busy ? "Preparing..." : "Prepare Year and Months"}
            </button>
          </fieldset>
        </section>
      )}

      {validation && (
        <section style={panel}>
          <h2 style={{ marginTop: 0, color: BLUE }}>
            Checks — FY {validation.year.fiscalYear}
          </h2>

          <p>
            Mode:{" "}
            {validation.summary.validationMode === "progress"
              ? "In-year progress"
              : "Annual closing readiness"}
          </p>

          <p>
            Selected checks: <strong>{validation.passed ? "Passed" : "Review required"}</strong>
            {" · "}Ready for annual posting closure:{" "}
            <strong>{validation.readyForYearEndClose ? "Yes" : "No"}</strong>
          </p>

          <p>
            Months found: {validation.summary.periodStats.totalPeriodsFound}/12
            {" · "}Open: {validation.summary.periodStats.openPeriods}
            {" · "}Closing: {validation.summary.periodStats.closingPeriods}
            {" · "}Closed: {validation.summary.periodStats.closedPeriods}
            {" · "}Locked: {validation.summary.periodStats.lockedPeriods}
          </p>

          <h3>Items requiring correction</h3>
          {validation.errors.length ? (
            <ul>
              {validation.errors.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          ) : (
            <p>No errors in the selected check mode.</p>
          )}

          <h3>Review notices</h3>
          <ul>
            {validation.warnings.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() => setValidation(null)}
            style={button}
          >
            Dismiss Checks
          </button>
        </section>
      )}

      <section style={panel}>
        <h2 style={{ marginTop: 0, color: BLUE }}>Annual Controls</h2>

        <p style={{ color: "#475569" }}>
          “Calendar current” follows Jamaica’s date. It does not override
          posting restrictions or activate the LLC. Annual closure does not
          mark all year-end accounting work completed.
        </p>

        <div style={{ overflowX: "auto" }}>
          <table
            cellPadding="10"
            border="1"
            style={{
              width: "100%",
              minWidth: 1100,
              borderCollapse: "collapse",
            }}
          >
            <thead style={{ background: "#eef4ff" }}>
              <tr>
                <th>Year</th>
                <th>Dates</th>
                <th>Status</th>
                <th>Annual posting</th>
                <th>Months found</th>
                <th>Open / Closing</th>
                <th>Closed / Locked</th>
                <th>Calendar current</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {years.map((year) => (
                <tr key={year._id}>
                  <td>{year.fiscalYear}</td>
                  <td>{year.startDate} to {year.endDate}</td>
                  <td>{year.status}</td>
                  <td>
                    {year.status === "Open" && year.allowPosting === true
                      ? "Allowed in Open months"
                      : "Blocked"}
                  </td>
                  <td>{year.totalPeriodsFound}/12</td>
                  <td>{year.openPeriods}</td>
                  <td>{year.closedPeriods} / {year.lockedPeriods}</td>
                  <td>{year.isCurrentYear ? "Yes" : "No"}</td>
                  <td>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button
                        type="button"
                        disabled={busy || loading}
                        onClick={() => checkYear(year.fiscalYear, "progress")}
                        style={button}
                      >
                        Check Progress
                      </button>

                      <button
                        type="button"
                        disabled={busy || loading}
                        onClick={() => checkYear(year.fiscalYear, "yearEndClose")}
                        style={button}
                      >
                        Check Closing Readiness
                      </button>

                      <button
                        type="button"
                        disabled={busy || loading || year.fiscalYear >= 2100}
                        onClick={() => changeYear(year.fiscalYear, "create-next")}
                        style={button}
                      >
                        Prepare Next Year
                      </button>

                      <button
                        type="button"
                        disabled={
                          busy ||
                          loading ||
                          !["Open", "Closing"].includes(year.status)
                        }
                        onClick={() => changeYear(year.fiscalYear, "close")}
                        style={{ ...button, background: "#92400e" }}
                      >
                        Close Annual Posting
                      </button>

                      <button
                        type="button"
                        disabled={busy || loading || year.status !== "Closed"}
                        onClick={() => changeYear(year.fiscalYear, "lock")}
                        style={{ ...button, background: "#991b1b" }}
                      >
                        Lock Closed Year
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!years.length && (
                <tr>
                  <td colSpan={9}>
                    {loading ? "Loading..." : "No fiscal years found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default FiscalYears;