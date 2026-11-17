import { useState } from "react";
import api from "../api";

const jamaicaToday = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Jamaica",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  return ["year", "month", "day"]
    .map((type) => parts.find((part) => part.type === type).value)
    .join("-");
};

const reports = [
  {
    key: "trial-balance",
    title: "Trial Balance",
    description:
      "Cumulative debit and credit balances through the ending date, with totals and any difference.",
  },
  {
    key: "general-ledger",
    title: "General Ledger",
    description:
      "Selected-period ledger movements with per-account running balances that include earlier recorded activity.",
  },
  {
    key: "profit-loss",
    title: "Profit & Loss",
    description:
      "Selected-period revenue, Cost of Sales, operating expenses, gross profit, and net profit or loss.",
  },
  {
    key: "balance-sheet",
    title: "Balance Sheet",
    description:
      "Cumulative assets, liabilities, and equity through the ending date, including unclosed earnings.",
  },
];

const panel = {
  background: "white",
  border: "1px solid #dbe3ef",
  borderRadius: 12,
  padding: 18,
};

const field = {
  display: "block",
  width: "100%",
  boxSizing: "border-box",
  marginTop: 6,
  padding: 10,
  border: "1px solid #cbd5e1",
  borderRadius: 6,
};

const button = {
  background: "#0B3D91",
  color: "white",
  border: "none",
  padding: "10px 16px",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: "bold",
};

async function downloadError(error) {
  let data = error?.response?.data;

  if (data instanceof Blob) {
    const text = await data.text();

    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  return (
    data?.message ||
    "Could not download export. Please try again."
  );
}

function FinancialExports() {
  const [filters, setFilters] = useState(() => {
    const today = jamaicaToday();

    return {
      entityCode: "",
      from: `${today.slice(0, 7)}-01`,
      to: today,
      branch: "",
    };
  });

  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const changeFilter = (event) => {
    const { name, value } = event.target;

    setFilters((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  const exportFile = async (report) => {
    if (busy) return;

    const entityCode = filters.entityCode.trim().toUpperCase();

    if (!/^[A-Z0-9][A-Z0-9_-]{0,79}$/.test(entityCode)) {
      setError("Enter the business entity code, for example EK-SP-2026.");
      return;
    }

    if (!filters.to) {
      setError("Select an ending date.");
      return;
    }

    if (filters.from && filters.from > filters.to) {
      setError("The starting date must not be after the ending date.");
      return;
    }

    const selected = {
      ...filters,
      entityCode,
    };

    setBusy(report.key);
    setError("");
    setSuccess("");

    let url = "";
    let link;

    try {
      const response = await api.get(
        `/api/financial-exports/${report.key}`,
        {
          params: selected,
          responseType: "blob",
        }
      );

      const blob = new Blob([response.data], {
        type: "text/csv;charset=utf-8",
      });

      url = window.URL.createObjectURL(blob);
      link = document.createElement("a");

      link.href = url;
      link.download = [
        report.key,
        entityCode,
        selected.from || "all",
        "to",
        selected.to,
      ].join("-") + ".csv";

      document.body.appendChild(link);
      link.click();

      setSuccess(
        `${report.title} download requested for ${entityCode}. Review the notices included in the CSV.`
      );
    } catch (downloadFailure) {
      console.error("Export download error:", downloadFailure);
      setError(await downloadError(downloadFailure));
    } finally {
      link?.remove();

      if (url) {
        window.setTimeout(
          () => window.URL.revokeObjectURL(url),
          10000
        );
      }

      setBusy("");
    }
  };

  return (
    <div>
      <h1 style={{ margin: 0, color: "#0B3D91" }}>
        Financial Statement Exports
      </h1>

      <p style={{ color: "#64748b" }}>
        Download JMD reports using the same ledger calculations as
        financial reporting. Downloads do not change financial records.
      </p>

      <section style={panel}>
        <fieldset
          disabled={Boolean(busy)}
          style={{ border: 0, margin: 0, padding: 0 }}
        >
          <legend style={{ fontWeight: "bold", marginBottom: 12 }}>
            Report selection
          </legend>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 16,
            }}
          >
            <label>
              Business entity code
              <input
                name="entityCode"
                value={filters.entityCode}
                onChange={changeFilter}
                placeholder="Example: EK-SP-2026"
                maxLength={80}
                autoComplete="off"
                style={field}
              />
            </label>

            <label>
              Starting date — movements
              <input
                type="date"
                name="from"
                value={filters.from}
                onChange={changeFilter}
                style={field}
              />
            </label>

            <label>
              Ending date / as of
              <input
                type="date"
                name="to"
                value={filters.to}
                onChange={changeFilter}
                style={field}
              />
            </label>

            <label>
              Branch
              <select
                name="branch"
                value={filters.branch}
                onChange={changeFilter}
                style={field}
              >
                <option value="">All Branches</option>
                <option value="Eltham Park Mainstore">
                  Eltham Park Mainstore
                </option>
                <option value="Brown's Town Square">
                  Brown&apos;s Town Square
                </option>
              </select>
            </label>
          </div>
        </fieldset>

        <p style={{ color: "#475569", marginBottom: 0 }}>
          Use the exact business code shown in Tax Center. Starting
          date applies to Profit &amp; Loss and General Ledger movements.
          Trial Balance and Balance Sheet include all recorded activity
          through the ending date. Clear the starting date for all
          recorded movements through that date.
        </p>
      </section>

      <div
        style={{
          ...panel,
          marginTop: 16,
          background: "#fff7ed",
          borderColor: "#fed7aa",
        }}
      >
        <strong>Incomplete records are not savings.</strong>
        <p style={{ marginBottom: 0 }}>
          These files reflect recorded ledger activity. Review the
          included warnings and reconcile missing activity before using
          the figures to assess profitability or staffing affordability.
          A selected business or branch excludes unattributed activity.
          Zero balances do not establish completeness.
        </p>
      </div>

      {error && (
        <p role="alert" style={{ color: "#991b1b" }}>
          {error}
        </p>
      )}

      {success && (
        <p role="status" style={{ color: "#166534" }}>
          {success}
        </p>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 16,
          marginTop: 20,
        }}
      >
        {reports.map((report) => (
          <section key={report.key} style={panel}>
            <h2 style={{ marginTop: 0, color: "#0B3D91" }}>
              {report.title}
            </h2>

            <p style={{ color: "#475569", minHeight: 72 }}>
              {report.description}
            </p>

            <button
              type="button"
              disabled={Boolean(busy)}
              onClick={() => exportFile(report)}
              style={{
                ...button,
                opacity: busy ? 0.65 : 1,
                cursor: busy ? "wait" : "pointer",
              }}
            >
              {busy === report.key
                ? "Preparing CSV..."
                : "Download CSV"}
            </button>
          </section>
        ))}
      </div>
    </div>
  );
}

export default FinancialExports;