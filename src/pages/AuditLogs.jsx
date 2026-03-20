import { useEffect, useMemo, useState } from "react";
import api from "../api";

function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [moduleFilter, setModuleFilter] = useState("All");
  const [actionFilter, setActionFilter] = useState("All");
  const [userFilter, setUserFilter] = useState("All");

  const fetchLogs = async () => {
    try {
      const res = await api.get("/api/audit-logs");
      setLogs(res.data.data || []);
    } catch (error) {
      console.error("Error loading audit logs:", error);
      alert(error?.response?.data?.message || "Could not load audit logs.");
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const uniqueModules = useMemo(() => {
    return ["All", ...new Set(logs.map((log) => log.module).filter(Boolean))];
  }, [logs]);

  const uniqueActions = useMemo(() => {
    return ["All", ...new Set(logs.map((log) => log.action).filter(Boolean))];
  }, [logs]);

  const uniqueUsers = useMemo(() => {
    return ["All", ...new Set(logs.map((log) => log.performedByName).filter(Boolean))];
  }, [logs]);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      `${log.auditNumber} ${log.module} ${log.action} ${log.description} ${log.targetId} ${log.performedByName}`
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
      else if (String(value).includes("PAID")) backgroundColor = "#7c3aed";
      else if (String(value).includes("EXPIRE")) backgroundColor = "#dc2626";
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
            gridTemplateColumns: "2fr 1fr 1fr 1fr",
            gap: "15px",
          }}
        >
          <input
            type="text"
            placeholder="Search by action, module, user, target ID, or description"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: "10px" }}
          />

          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            style={{ padding: "10px" }}
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
        </div>
      </div>

      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "10px",
          border: "1px solid #e5e7eb",
        }}
      >
        <h2 style={{ marginTop: 0 }}>System Activity</h2>

        <div style={{ overflowX: "auto" }}>
          <table border="1" cellPadding="10" style={{ minWidth: "1800px", width: "100%" }}>
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Audit No.</th>
                <th>User</th>
                <th>Role</th>
                <th>Module</th>
                <th>Action</th>
                <th>Description</th>
                <th>Target Type</th>
                <th>Target ID</th>
                <th>IP Address</th>
              </tr>
            </thead>

            <tbody>
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log._id}>
                    <td>{formatDateTime(log.createdAt)}</td>
                    <td>{log.auditNumber}</td>
                    <td>{log.performedByName || "System"}</td>
                    <td>{log.performedByRole || ""}</td>
                    <td>{badgeStyle(log.module, "module")}</td>
                    <td>{badgeStyle(log.action, "action")}</td>
                    <td>{log.description}</td>
                    <td>{log.targetType}</td>
                    <td>{log.targetId}</td>
                    <td>{log.ipAddress}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10">No audit logs found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AuditLogs;