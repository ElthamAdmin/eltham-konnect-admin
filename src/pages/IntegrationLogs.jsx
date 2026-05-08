import { useEffect, useMemo, useState } from "react";
import api from "../api";

function IntegrationLogs() {
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sourceFilter, setSourceFilter] = useState("All");
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedPayloads, setExpandedPayloads] = useState({});

  const ROYAL_BLUE = "#0B3D91";
  const WHITE = "#ffffff";
  const BORDER = "#dbe3ef";
  const MUTED = "#64748b";

  const fetchLogs = async () => {
    try {
      const res = await api.get("/api/integration-logs");
      setLogs(res.data.data || []);
    } catch (error) {
      console.error("Error loading integration logs:", error);
      alert(error?.response?.data?.message || "Could not load integration logs.");
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sourceFilter, pageSize]);

  const uniqueSources = useMemo(() => {
    return ["All", ...new Set(logs.map((log) => log.source).filter(Boolean))];
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        `${log.logNumber || ""} ${log.source || ""} ${log.eventType || ""} ${log.status || ""} ${log.trackingNumber || ""} ${log.customerEkonId || ""} ${log.message || ""} ${log.errorDetails || ""}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "All" || log.status === statusFilter;

      const matchesSource =
        sourceFilter === "All" || log.source === sourceFilter;

      return matchesSearch && matchesStatus && matchesSource;
    });
  }, [logs, searchTerm, statusFilter, sourceFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

  const summary = useMemo(() => {
    return {
      total: logs.length,
      success: logs.filter((log) => log.status === "Success").length,
      failed: logs.filter((log) => log.status === "Failed").length,
      duplicate: logs.filter((log) => log.status === "Duplicate").length,
    };
  }, [logs]);

  const formatDateTime = (value) => {
    if (!value) return "";
    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  };

  const statusBadge = (status) => {
    const color =
      status === "Success"
        ? "#16a34a"
        : status === "Failed"
        ? "#dc2626"
        : status === "Duplicate"
        ? "#f59e0b"
        : "#64748b";

    return (
      <span
        style={{
          backgroundColor: color,
          color: WHITE,
          padding: "5px 10px",
          borderRadius: "999px",
          fontWeight: "bold",
          fontSize: "12px",
          whiteSpace: "nowrap",
        }}
      >
        {status}
      </span>
    );
  };

  const togglePayload = (id) => {
    setExpandedPayloads((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const payloadPreview = (payload, expanded) => {
    const text = JSON.stringify(payload || {}, null, 2);
    if (expanded || text.length <= 160) return text;
    return `${text.slice(0, 160)}...`;
  };

  const cardStyle = {
    backgroundColor: WHITE,
    border: `1px solid ${BORDER}`,
    borderRadius: "12px",
    padding: "16px",
    boxShadow: "0 2px 8px rgba(15,23,42,0.04)",
  };

  const paginationControls = (
    <div
      style={{
        backgroundColor: WHITE,
        border: `1px solid ${BORDER}`,
        borderRadius: "10px",
        padding: "12px 15px",
        marginBottom: "15px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "12px",
        flexWrap: "wrap",
      }}
    >
      <strong>
        Showing {filteredLogs.length === 0 ? 0 : startIndex + 1} to{" "}
        {Math.min(endIndex, filteredLogs.length)} of {filteredLogs.length}
      </strong>

      <select
        value={pageSize}
        onChange={(e) => setPageSize(Number(e.target.value))}
        style={{
          padding: "8px 10px",
          borderRadius: "8px",
          border: `1px solid ${BORDER}`,
        }}
      >
        <option value={10}>10 per page</option>
        <option value={25}>25 per page</option>
        <option value={50}>50 per page</option>
        <option value={100}>100 per page</option>
      </select>

      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={safeCurrentPage === 1}
          style={{
            backgroundColor: safeCurrentPage === 1 ? "#94a3b8" : ROYAL_BLUE,
            color: WHITE,
            border: "none",
            padding: "8px 12px",
            borderRadius: "8px",
            cursor: safeCurrentPage === 1 ? "not-allowed" : "pointer",
            fontWeight: "bold",
          }}
        >
          Previous
        </button>

        <strong>
          Page {safeCurrentPage} of {totalPages}
        </strong>

        <button
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={safeCurrentPage === totalPages}
          style={{
            backgroundColor: safeCurrentPage === totalPages ? "#94a3b8" : ROYAL_BLUE,
            color: WHITE,
            border: "none",
            padding: "8px 12px",
            borderRadius: "8px",
            cursor: safeCurrentPage === totalPages ? "not-allowed" : "pointer",
            fontWeight: "bold",
          }}
        >
          Next
        </button>
      </div>
    </div>
  );

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
          marginBottom: "20px",
        }}
      >
        <div>
          <h1 style={{ margin: 0 }}>Integration Logs</h1>
          <p style={{ margin: "6px 0 0", color: MUTED }}>
            Monitor freight API package imports, failures, duplicates, and payloads.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          style={{
            backgroundColor: "#16a34a",
            color: WHITE,
            border: "none",
            padding: "10px 16px",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Refresh
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "14px",
          marginBottom: "18px",
        }}
      >
        <div style={cardStyle}>
          <h2 style={{ margin: 0, color: ROYAL_BLUE }}>{summary.total}</h2>
          <p style={{ marginBottom: 0, fontWeight: "bold" }}>Total Logs</p>
        </div>

        <div style={cardStyle}>
          <h2 style={{ margin: 0, color: "#16a34a" }}>{summary.success}</h2>
          <p style={{ marginBottom: 0, fontWeight: "bold" }}>Successful</p>
        </div>

        <div style={cardStyle}>
          <h2 style={{ margin: 0, color: "#dc2626" }}>{summary.failed}</h2>
          <p style={{ marginBottom: 0, fontWeight: "bold" }}>Failed</p>
        </div>

        <div style={cardStyle}>
          <h2 style={{ margin: 0, color: "#f59e0b" }}>{summary.duplicate}</h2>
          <p style={{ marginBottom: 0, fontWeight: "bold" }}>Duplicates</p>
        </div>
      </div>

      <div style={{ ...cardStyle, marginBottom: "15px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr",
            gap: "12px",
          }}
        >
          <input
            type="text"
            placeholder="Search logs by tracking, customer, source, message, or error"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: "11px",
              borderRadius: "8px",
              border: `1px solid ${BORDER}`,
            }}
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: "11px",
              borderRadius: "8px",
              border: `1px solid ${BORDER}`,
            }}
          >
            <option value="All">All Statuses</option>
            <option value="Success">Success</option>
            <option value="Failed">Failed</option>
            <option value="Duplicate">Duplicate</option>
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            style={{
              padding: "11px",
              borderRadius: "8px",
              border: `1px solid ${BORDER}`,
            }}
          >
            {uniqueSources.map((source) => (
              <option key={source} value={source}>
                {source}
              </option>
            ))}
          </select>
        </div>
      </div>

      {paginationControls}

      <div style={cardStyle}>
        <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>Freight API Activity</h2>

        <div
          style={{
            overflowX: "auto",
            overflowY: "auto",
            maxHeight: "70vh",
            border: `1px solid ${BORDER}`,
            borderRadius: "12px",
          }}
        >
          <table
            border="1"
            cellPadding="10"
            style={{
              minWidth: "1700px",
              width: "100%",
              borderCollapse: "collapse",
              borderColor: BORDER,
            }}
          >
            <thead
              style={{
                backgroundColor: "#eef4ff",
                position: "sticky",
                top: 0,
                zIndex: 5,
              }}
            >
              <tr>
                <th
                  style={{
                    position: "sticky",
                    left: 0,
                    backgroundColor: "#eef4ff",
                    zIndex: 6,
                    minWidth: "180px",
                  }}
                >
                  Date/Time
                </th>
                <th>Log No.</th>
                <th>Source</th>
                <th>Event</th>
                <th>Status</th>
                <th>Tracking</th>
                <th>Customer EKON</th>
                <th>Message</th>
                <th>Error</th>
                <th>Payload</th>
              </tr>
            </thead>

            <tbody>
              {paginatedLogs.length > 0 ? (
                paginatedLogs.map((log, index) => {
                  const rowKey = log._id || index;
                  const isExpanded = !!expandedPayloads[rowKey];

                  return (
                    <tr key={rowKey}>
                      <td
                        style={{
                          position: "sticky",
                          left: 0,
                          backgroundColor: WHITE,
                          zIndex: 4,
                          minWidth: "180px",
                          boxShadow: "4px 0 8px rgba(15,23,42,0.08)",
                        }}
                      >
                        {formatDateTime(log.createdAt)}
                      </td>

                      <td>{log.logNumber}</td>
                      <td>{log.source}</td>
                      <td>{log.eventType}</td>
                      <td>{statusBadge(log.status)}</td>
                      <td>{log.trackingNumber}</td>
                      <td>{log.customerEkonId}</td>
                      <td>{log.message}</td>
                      <td style={{ color: log.errorDetails ? "#dc2626" : MUTED }}>
                        {log.errorDetails || "—"}
                      </td>
                      <td>
                        <pre
                          style={{
                            margin: 0,
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                            maxWidth: "420px",
                            fontSize: "12px",
                          }}
                        >
                          {payloadPreview(log.payload, isExpanded)}
                        </pre>

                        {JSON.stringify(log.payload || {}).length > 160 && (
                          <button
                            onClick={() => togglePayload(rowKey)}
                            style={{
                              marginTop: "8px",
                              backgroundColor: "#e2e8f0",
                              color: "#0f172a",
                              border: "none",
                              padding: "7px 10px",
                              borderRadius: "8px",
                              cursor: "pointer",
                              fontWeight: "bold",
                            }}
                          >
                            {isExpanded ? "Show Less" : "View More"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="10" style={{ textAlign: "center", color: MUTED }}>
                    No integration logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginTop: "15px" }}>{paginationControls}</div>
    </div>
  );
}

export default IntegrationLogs;