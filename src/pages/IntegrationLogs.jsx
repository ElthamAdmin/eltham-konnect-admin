import { useEffect, useMemo, useState } from "react";
import api from "../api";

export default function IntegrationLogs() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [source, setSource] = useState("All");
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/api/integration-logs");

      if (!response.data?.success || !Array.isArray(response.data.data)) {
        throw new Error("Could not confirm the integration logs.");
      }

      setLogs(response.data.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Could not load integration logs."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, status, source, pageSize]);

  const sources = useMemo(
    () => ["All", ...new Set(logs.map((log) => log.source).filter(Boolean))],
    [logs]
  );

  const filtered = useMemo(() => {
    const term = search.toLowerCase();

    return logs.filter((log) => {
      const text = [
        log.logNumber,
        log.source,
        log.eventType,
        log.status,
        log.trackingNumber,
        log.customerEkonId,
        log.message,
        log.errorDetails,
      ].filter(Boolean).join(" ").toLowerCase();

      return (
        text.includes(term) &&
        (status === "All" || log.status === status) &&
        (source === "All" || log.source === source)
      );
    });
  }, [logs, search, status, source]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const visible = filtered.slice(start, start + pageSize);

  const dateLabel = (value) => {
    const date = new Date(value);
    return value && Number.isFinite(date.getTime())
      ? date.toLocaleString("en-JM", { timeZone: "America/Jamaica" })
      : "—";
  };

  const pagination = (
    <div className="ek-integration-toolbar">
      <strong>
        Showing {filtered.length ? start + 1 : 0} to{" "}
        {Math.min(start + pageSize, filtered.length)} of {filtered.length}
      </strong>

      <label>
        Rows{" "}
        <select
          value={pageSize}
          onChange={(event) => setPageSize(Number(event.target.value))}
        >
          {[10, 25, 50, 100].map((size) => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>
      </label>

      <div className="ek-integration-toolbar">
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => setPage(currentPage - 1)}
        >
          Previous
        </button>
        <span>Page {currentPage} of {totalPages}</span>
        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={() => setPage(currentPage + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );

  return (
    <section className="ek-integration-archive">
      <style>{`
        .ek-integration-archive {
          color:#0f172a;
        }
        .ek-integration-archive .ek-integration-card {
          padding:16px;
          margin-bottom:16px;
          border:1px solid #dbe3ef;
          border-radius:12px;
          background:#fff;
        }
        .ek-integration-toolbar {
          display:flex;
          align-items:center;
          justify-content:space-between;
          flex-wrap:wrap;
          gap:12px;
          margin:12px 0;
        }
        .ek-integration-archive button,
        .ek-integration-archive input,
        .ek-integration-archive select {
          min-height:44px;
          padding:9px 12px;
          border:1px solid #cbd5e1;
          border-radius:8px;
          font:inherit;
        }
        .ek-integration-archive button {
          background:#0b3d91;
          color:#fff;
          cursor:pointer;
        }
        .ek-integration-archive button:disabled {
          opacity:.5;
          cursor:default;
        }
        .ek-integration-filters {
          display:grid;
          grid-template-columns:2fr 1fr 1fr;
          gap:12px;
        }
        .ek-integration-filters label {
          display:grid;
          gap:6px;
          min-width:0;
        }
        .ek-integration-filters input,
        .ek-integration-filters select {
          width:100%;
          min-width:0;
        }
        .ek-integration-table {
          overflow:auto;
          max-height:70vh;
        }
        .ek-integration-table table {
          min-width:1400px;
          width:100%;
          border-collapse:collapse;
        }
        .ek-integration-table th,
        .ek-integration-table td {
          padding:12px;
          text-align:left;
          vertical-align:top;
          border:1px solid #dbe3ef;
        }
        .ek-integration-table th {
          position:sticky;
          top:0;
          background:#eef4ff;
          z-index:1;
        }
        .ek-integration-table pre {
          margin:0 0 8px;
          white-space:pre-wrap;
          overflow-wrap:anywhere;
          max-width:380px;
          font-size:12px;
        }
        @media(max-width:700px) {
          .ek-integration-filters {
            grid-template-columns:1fr;
          }
        }
      `}</style>

      <div className="ek-integration-toolbar">
        <div>
          <h1 style={{ margin: 0 }}>Integration Logs</h1>
          <p>Historical freight integration activity.</p>
        </div>
        <button type="button" disabled={loading} onClick={fetchLogs}>
          {loading ? "Loading…" : "Refresh Logs"}
        </button>
      </div>

      <div className="ek-integration-card" role="note">
        <strong>Freight API synchronization is discontinued.</strong>
        <p style={{ lineHeight: 1.6, marginBottom: 0 }}>
          KP and LTW are no longer Eltham Konnect freight partners.
          Kajay Warehousing shipments are managed manually until an API
          connection becomes available. Previous logs remain available
          for reference.
        </p>
      </div>

      {error && <p role="alert" style={{ color: "#b91c1c" }}>{error}</p>}

      <div className="ek-integration-card">
        <div className="ek-integration-filters">
          <label>
            Search historical logs
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tracking, customer, source or message"
            />
          </label>

          <label>
            Status
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              {["All", "Success", "Failed", "Duplicate"].map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </label>

          <label>
            Historical source
            <select value={source} onChange={(event) => setSource(event.target.value)}>
              {sources.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="ek-integration-card">
        {pagination}

        <div className="ek-integration-table">
          <table>
            <thead>
              <tr>
                {[
                  "Date/Time — Jamaica",
                  "Log No.",
                  "Source",
                  "Event",
                  "Status",
                  "Tracking",
                  "Customer EKON",
                  "Message",
                  "Error",
                  "Payload",
                ].map((heading) => <th key={heading}>{heading}</th>)}
              </tr>
            </thead>

            <tbody>
              {visible.map((log, index) => {
                const key = log._id || `${start + index}`;
                const payload = JSON.stringify(log.payload || {}, null, 2);
                const isExpanded = Boolean(expanded[key]);

                return (
                  <tr key={key}>
                    <td>{dateLabel(log.createdAt)}</td>
                    <td>{log.logNumber}</td>
                    <td>{log.source}</td>
                    <td>{log.eventType}</td>
                    <td>{log.status}</td>
                    <td>{log.trackingNumber}</td>
                    <td>{log.customerEkonId}</td>
                    <td>{log.message}</td>
                    <td>{log.errorDetails || "—"}</td>
                    <td>
                      <pre>
                        {isExpanded || payload.length <= 160
                          ? payload
                          : `${payload.slice(0, 160)}…`}
                      </pre>
                      {payload.length > 160 && (
                        <button
                          type="button"
                          aria-expanded={isExpanded}
                          onClick={() =>
                            setExpanded((previous) => ({
                              ...previous,
                              [key]: !previous[key],
                            }))
                          }
                        >
                          {isExpanded ? "Show Less" : "View More"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}

              {!visible.length && (
                <tr>
                  <td colSpan={10}>
                    {loading ? "Loading logs…" : "No matching historical logs."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {pagination}
      </div>
    </section>
  );
}