import { useEffect, useMemo, useState } from "react";
import api from "../api";

function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [moduleFilter, setModuleFilter] = useState("All");
  const [actionFilter, setActionFilter] = useState("All");
  const [userFilter, setUserFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [financeOnly, setFinanceOnly] = useState(false);
  const [fiscalYearFilter, setFiscalYearFilter] = useState("");
  const [accountingPeriodFilter, setAccountingPeriodFilter] = useState("");
  const [journalEntryFilter, setJournalEntryFilter] = useState("");
  const [financeReferenceFilter, setFinanceReferenceFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState(null);

    const fetchLogs = async () => {
    try {
      const params = {};

      if (searchTerm) params.search = searchTerm;
      if (moduleFilter !== "All") params.module = moduleFilter;
      if (actionFilter !== "All") params.action = actionFilter;
      if (userFilter !== "All") params.user = userFilter;
      if (statusFilter !== "All") params.status = statusFilter;
      if (financeOnly) params.module = "Finance";
      if (fiscalYearFilter) params.fiscalYear = fiscalYearFilter;
      if (accountingPeriodFilter) params.accountingPeriod = accountingPeriodFilter;
      if (journalEntryFilter) params.journalEntryNumber = journalEntryFilter;
      if (financeReferenceFilter) params.search = financeReferenceFilter;
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;

      const res = await api.get("/api/audit-logs", { params });
      setLogs(res.data.data || []);
    } catch (error) {
      console.error("Error loading audit logs:", error);
      alert(error?.response?.data?.message || "Could not load audit logs.");
    }
  };

    useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

    useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    moduleFilter,
    actionFilter,
    userFilter,
    statusFilter,
    financeOnly,
    fiscalYearFilter,
    accountingPeriodFilter,
    journalEntryFilter,
    financeReferenceFilter,
    fromDate,
    toDate,
    pageSize,
  ]);

  const uniqueModules = useMemo(() => {
    return ["All", ...new Set(logs.map((log) => log.module).filter(Boolean))];
  }, [logs]);

  const uniqueActions = useMemo(() => {
    return ["All", ...new Set(logs.map((log) => log.action).filter(Boolean))];
  }, [logs]);

    const uniqueUsers = useMemo(() => {
    return ["All", ...new Set(logs.map((log) => log.performedByName).filter(Boolean))];
  }, [logs]);

  const uniqueStatuses = useMemo(() => {
    return ["All", ...new Set(logs.map((log) => log.status || "Success").filter(Boolean))];
  }, [logs]);

    const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        `${log.auditNumber} ${log.module} ${log.action} ${log.description} ${log.targetId} ${log.performedByName} ${log.journalEntryNumber} ${log.financeReference} ${log.accountingPeriod} ${log.fiscalYear} ${log.accountNumber} ${log.accountName}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesModule =
        moduleFilter === "All" || log.module === moduleFilter;

      const matchesAction =
        actionFilter === "All" || log.action === actionFilter;

      const matchesUser =
        userFilter === "All" || log.performedByName === userFilter;

      return matchesSearch && matchesModule && matchesAction && matchesUser;
    });
  }, [logs, searchTerm, moduleFilter, actionFilter, userFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

  const formatDateTime = (value) => {
    if (!value) return "";
    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  };

  const badgeStyle = (value, type = "module") => {
    let backgroundColor = "#64748b";

    if (type === "module") {
      if (value === "Customers") backgroundColor = "#0B3D91";
      else if (value === "Packages") backgroundColor = "#f59e0b";
      else if (value === "Invoices") backgroundColor = "#16a34a";
      else if (value === "Finance") backgroundColor = "#7c3aed";
      else if (value === "Points History") backgroundColor = "#db2777";
    }

        if (type === "action") {
      if (String(value).includes("CREATE")) backgroundColor = "#16a34a";
      else if (String(value).includes("UPDATE")) backgroundColor = "#0ea5e9";
      else if (String(value).includes("POSTED")) backgroundColor = "#7c3aed";
      else if (String(value).includes("APPROVED")) backgroundColor = "#0B3D91";
      else if (String(value).includes("REVERSED")) backgroundColor = "#dc2626";
      else if (String(value).includes("PAID")) backgroundColor = "#7c3aed";
      else if (String(value).includes("EXPIRE")) backgroundColor = "#dc2626";
    }

    if (type === "status") {
      if (value === "Success") backgroundColor = "#16a34a";
      else if (value === "Failed") backgroundColor = "#dc2626";
      else backgroundColor = "#64748b";
    }

    return (
      <span
        style={{
          padding: "4px 10px",
          borderRadius: "6px",
          color: "white",
          backgroundColor,
          fontSize: "12px",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </span>
    );
  };

  const paginationControls = (
    <div
      style={{
        backgroundColor: "white",
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "12px 15px",
        marginBottom: "15px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "12px",
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
        <strong>
          Showing {filteredLogs.length === 0 ? 0 : startIndex + 1} to{" "}
          {Math.min(endIndex, filteredLogs.length)} of {filteredLogs.length}
        </strong>

        <select
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
          style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid #ccc" }}
        >
          <option value={10}>10 per page</option>
          <option value={25}>25 per page</option>
          <option value={50}>50 per page</option>
          <option value={100}>100 per page</option>
        </select>
      </div>

      <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={safeCurrentPage === 1}
          style={{
            backgroundColor: safeCurrentPage === 1 ? "#94a3b8" : "#0B3D91",
            color: "white",
            border: "none",
            padding: "8px 12px",
            borderRadius: "6px",
            cursor: safeCurrentPage === 1 ? "not-allowed" : "pointer",
          }}
        >
          Previous
        </button>

        <span style={{ fontWeight: "bold" }}>
          Page {safeCurrentPage} of {totalPages}
        </span>

        <button
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={safeCurrentPage === totalPages}
          style={{
            backgroundColor: safeCurrentPage === totalPages ? "#94a3b8" : "#0B3D91",
            color: "white",
            border: "none",
            padding: "8px 12px",
            borderRadius: "6px",
            cursor: safeCurrentPage === totalPages ? "not-allowed" : "pointer",
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
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <h1 style={{ margin: 0 }}>Activity Logs / Audit Logs</h1>

        <button
          onClick={fetchLogs}
          style={{
            backgroundColor: "#16a34a",
            color: "white",
            border: "none",
            padding: "10px 16px",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Refresh Logs
        </button>
      </div>

      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "10px",
          border: "1px solid #e5e7eb",
          marginBottom: "20px",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Filters</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "15px",
          }}
        >
                    <input
            type="text"
            placeholder="Search by action, module, user, target ID, journal, finance ref, or description"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: "10px" }}
          />

          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            style={{ padding: "10px" }}
            disabled={financeOnly}
          >
            {uniqueModules.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            style={{ padding: "10px" }}
          >
            {uniqueActions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            style={{ padding: "10px" }}
          >
            {uniqueUsers.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: "10px" }}
          >
            {uniqueStatuses.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Fiscal Year"
            value={fiscalYearFilter}
            onChange={(e) => setFiscalYearFilter(e.target.value)}
            style={{ padding: "10px" }}
          />

          <input
            type="text"
            placeholder="Accounting Period e.g. PER-2026-07"
            value={accountingPeriodFilter}
            onChange={(e) => setAccountingPeriodFilter(e.target.value)}
            style={{ padding: "10px" }}
          />

          <input
            type="text"
            placeholder="Journal Entry Number"
            value={journalEntryFilter}
            onChange={(e) => setJournalEntryFilter(e.target.value)}
            style={{ padding: "10px" }}
          />

          <input
            type="text"
            placeholder="Finance Reference"
            value={financeReferenceFilter}
            onChange={(e) => setFinanceReferenceFilter(e.target.value)}
            style={{ padding: "10px" }}
          />

          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            style={{ padding: "10px" }}
          />

          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            style={{ padding: "10px" }}
          />

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontWeight: "bold",
            }}
          >
            <input
              type="checkbox"
              checked={financeOnly}
              onChange={(e) => {
                setFinanceOnly(e.target.checked);
                if (e.target.checked) setModuleFilter("Finance");
              }}
            />
            Finance Only
          </label>

          <button
            onClick={fetchLogs}
            style={{
              backgroundColor: "#0B3D91",
              color: "white",
              border: "none",
              padding: "10px 16px",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Apply Filters
          </button>

          <button
            onClick={() => {
              setSearchTerm("");
              setModuleFilter("All");
              setActionFilter("All");
              setUserFilter("All");
              setStatusFilter("All");
              setFinanceOnly(false);
              setFiscalYearFilter("");
              setAccountingPeriodFilter("");
              setJournalEntryFilter("");
              setFinanceReferenceFilter("");
              setFromDate("");
              setToDate("");
              setTimeout(fetchLogs, 0);
            }}
            style={{
              backgroundColor: "#64748b",
              color: "white",
              border: "none",
              padding: "10px 16px",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {paginationControls}

      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "10px",
          border: "1px solid #e5e7eb",
        }}
      >
        <h2 style={{ marginTop: 0 }}>System Activity</h2>

        <div
  style={{
    overflowX: "auto",
    overflowY: "auto",
    maxHeight: "70vh",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
  }}
>
          <table
  border="1"
  cellPadding="10"
  style={{
    minWidth: "2600px",
    width: "100%",
    borderCollapse: "collapse",
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
  Date & Time
</th>
                <th>Audit No.</th>
                <th>User</th>
                <th>Role</th>
                <th>Module</th>
                <th>Action</th>
                <th>Description</th>
                <th>Target Type</th>
                <th>Target ID</th>
                                <th>Status</th>
                <th>Fiscal Year</th>
                <th>Accounting Period</th>
                <th>Journal Entry</th>
                <th>Finance Ref</th>
                <th>Account</th>
                <th>Browser</th>
                <th>Device</th>
                <th>IP Address</th>
              </tr>
            </thead>

            <tbody>
              {paginatedLogs.length > 0 ? (
                paginatedLogs.map((log) => (
                                    <tr
                    key={log._id}
                    onClick={() => setSelectedLog(log)}
                    style={{ cursor: "pointer" }}
                  >
                    <td
  style={{
    position: "sticky",
    left: 0,
    backgroundColor: "white",
    zIndex: 4,
    minWidth: "180px",
    boxShadow: "4px 0 8px rgba(15,23,42,0.08)",
  }}
>
  {formatDateTime(log.createdAt)}
</td>
                    <td>{log.auditNumber}</td>
                    <td>{log.performedByName || "System"}</td>
                    <td>{log.performedByRole || ""}</td>
                    <td>{badgeStyle(log.module, "module")}</td>
                    <td>{badgeStyle(log.action, "action")}</td>
                    <td>{log.description}</td>
                    <td>{log.targetType}</td>
                    <td>{log.targetId}</td>
                                        <td>{badgeStyle(log.status || "Success", "status")}</td>
                    <td>{log.fiscalYear || "—"}</td>
                    <td>{log.accountingPeriod || "—"}</td>
                    <td>{log.journalEntryNumber || "—"}</td>
                    <td>{log.financeReference || "—"}</td>
                    <td>
                      {log.accountNumber || log.accountName
                        ? `${log.accountNumber || ""} ${log.accountName || ""}`.trim()
                        : "—"}
                    </td>
                    <td>{log.browser || "—"}</td>
                    <td>{log.device || "—"}</td>
                    <td>{log.ipAddress}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="18">No audit logs found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

            <div style={{ marginTop: "15px" }}>{paginationControls}</div>

      {selectedLog && (
        <AuditDetailsDrawer
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
          formatDateTime={formatDateTime}
          badgeStyle={badgeStyle}
        />
      )}
    </div>
  );
}

function AuditDetailsDrawer({ log, onClose, formatDateTime, badgeStyle }) {
  const jsonBlock = (title, value) => (
    <div style={{ marginTop: "16px" }}>
      <h3>{title}</h3>
      <pre
        style={{
          backgroundColor: "#0f172a",
          color: "#e5e7eb",
          padding: "14px",
          borderRadius: "8px",
          overflowX: "auto",
          maxHeight: "260px",
        }}
      >
        {JSON.stringify(value || {}, null, 2)}
      </pre>
    </div>
  );

  const field = (label, value) => (
    <div>
      <div style={{ color: "#64748b", fontSize: "12px", fontWeight: "bold" }}>
        {label}
      </div>
      <div style={{ marginTop: "4px", wordBreak: "break-word" }}>
        {value || "—"}
      </div>
    </div>
  );

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.45)",
        zIndex: 9999,
        display: "flex",
        justifyContent: "flex-end",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "min(760px, 95vw)",
          height: "100vh",
          backgroundColor: "white",
          padding: "22px",
          overflowY: "auto",
          boxShadow: "-8px 0 24px rgba(15,23,42,0.25)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "12px",
            alignItems: "center",
            marginBottom: "18px",
          }}
        >
          <div>
            <h2 style={{ margin: 0 }}>Audit Details</h2>
            <p style={{ margin: "6px 0 0", color: "#64748b" }}>
              {log.auditNumber}
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              backgroundColor: "#dc2626",
              color: "white",
              border: "none",
              padding: "9px 13px",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Close
          </button>
        </div>

        <Section title="Audit Information">
          {field("Date & Time", formatDateTime(log.createdAt))}
          {field("User", log.performedByName)}
          {field("Role", log.performedByRole)}
          {field("Module", log.module)}
          {field("Action", log.action)}
          <div>
            <div style={{ color: "#64748b", fontSize: "12px", fontWeight: "bold" }}>
              Status
            </div>
            <div style={{ marginTop: "4px" }}>
              {badgeStyle(log.status || "Success", "status")}
            </div>
          </div>
          {field("Description", log.description)}
          {field("Target Type", log.targetType)}
          {field("Target ID", log.targetId)}
        </Section>

        <Section title="Finance Information">
          {field("Fiscal Year", log.fiscalYear)}
          {field("Accounting Period", log.accountingPeriod)}
          {field("Journal Entry Number", log.journalEntryNumber)}
          {field("Ledger Number", log.ledgerNumber)}
          {field("Finance Reference", log.financeReference)}
          {field("Account Number", log.accountNumber)}
          {field("Account Name", log.accountName)}
          {field("Reconciliation Number", log.reconciliationNumber)}
        </Section>

        <Section title="Technical Information">
          {field("IP Address", log.ipAddress)}
          {field("Browser", log.browser)}
          {field("Device", log.device)}
          {field("Request Method", log.requestMethod)}
          {field("Request URL", log.requestUrl)}
        </Section>

        {jsonBlock("Before Values", log.beforeValues)}
        {jsonBlock("After Values", log.afterValues)}
        {jsonBlock("Metadata", log.metadata)}
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: "10px",
        padding: "16px",
        marginTop: "16px",
      }}
    >
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "14px",
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default AuditLogs;