import { useCallback, useEffect, useState } from "react";
import api from "../api";

const BLUE = "#0B3D91";
const BORDER = "#dbe3ef";
const MUTED = "#64748b";

const getJamaicaToday = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Jamaica",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
};

const downloadBlob = (blob, fileName) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const panelStyle = {
  background: "#ffffff",
  border: `1px solid ${BORDER}`,
  borderRadius: "14px",
  padding: "16px",
};

function HRReportingControlsPanel() {
  const today = getJamaicaToday();
  const [from, setFrom] = useState(`${today.slice(0, 4)}-01-01`);
  const [to, setTo] = useState(today);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState("");
  const [error, setError] = useState("");

  const loadAudit = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/api/hr-analytics/reporting-audit", {
        params: { from, to },
      });
      setReport(response.data || null);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          "The H11 reporting audit could not be loaded."
      );
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    loadAudit();
  }, [loadAudit]);

  const exportAuditCsv = async () => {
    try {
      setExporting("audit");
      setError("");
      const response = await api.get("/api/hr-analytics/reporting-audit", {
        params: { from, to, format: "csv" },
        responseType: "blob",
      });
      downloadBlob(response.data, `h11-reporting-audit-${to}.csv`);
      await loadAudit();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          "The H11 audit CSV could not be exported."
      );
    } finally {
      setExporting("");
    }
  };

  const exportReportingSnapshot = async () => {
    try {
      setExporting("snapshot");
      setError("");

      const sources = {
        workforce: "/api/hr-analytics/dashboard",
        attendance: "/api/hr-analytics/attendance",
        leave: "/api/hr-analytics/leave-utilization",
        lifecycle: "/api/hr-analytics/turnover",
        payroll: "/api/hr-analytics/payroll-compliance",
      };

      const entries = await Promise.all(
        Object.entries(sources).map(async ([name, url]) => {
          const response = await api.get(url, { params: { asOfDate: to } });
          return [name, response.data];
        })
      );

      const snapshot = {
        report: "H11 Consolidated HR Reporting Snapshot",
        generatedAt: new Date().toISOString(),
        reportingDate: to,
        data: Object.fromEntries(entries),
      };

      downloadBlob(
        new Blob([JSON.stringify(snapshot, null, 2)], {
          type: "application/json;charset=utf-8",
        }),
        `h11-hr-reporting-snapshot-${to}.json`
      );

      await loadAudit();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          "The consolidated H11 snapshot could not be exported."
      );
    } finally {
      setExporting("");
    }
  };

  const summary = report?.summary || {};
  const events = report?.data || [];

  const summaryCards = [
    ["Audit Events", summary.totalEvents || 0, "#0B3D91"],
    ["Successful", summary.successfulEvents || 0, "#16a34a"],
    ["Failed", summary.failedEvents || 0, "#dc2626"],
    ["Active Users", summary.activeUsers || 0, "#7c3aed"],
    ["Report Endpoints", summary.reportEndpoints || 0, "#0891b2"],
    ["Missing Actors", summary.missingActorEvents || 0, "#b45309"],
  ];

  return (
    <section style={{ display: "grid", gap: "16px" }}>
      <div style={panelStyle}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "14px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h2 style={{ color: BLUE, margin: 0 }}>
              H11 Reporting Controls and Audit
            </h2>
            <p style={{ color: MUTED, margin: "6px 0 0" }}>
              Verify authorized reporting access, failures, filters, exports and user evidence.
            </p>
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button type="button" onClick={exportReportingSnapshot} disabled={Boolean(exporting)} style={buttonStyle}>
              {exporting === "snapshot" ? "Exporting..." : "Export H11 Snapshot"}
            </button>
            <button type="button" onClick={exportAuditCsv} disabled={Boolean(exporting)} style={buttonStyle}>
              {exporting === "audit" ? "Exporting..." : "Export Audit CSV"}
            </button>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "10px",
            marginTop: "16px",
          }}
        >
          <label style={{ fontWeight: 700 }}>
            Audit start date
            <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} style={inputStyle} />
          </label>
          <label style={{ fontWeight: 700 }}>
            Audit end date
            <input type="date" value={to} onChange={(event) => setTo(event.target.value)} style={inputStyle} />
          </label>
          <button type="button" onClick={loadAudit} disabled={loading} style={{ ...buttonStyle, alignSelf: "end" }}>
            {loading ? "Refreshing..." : "Refresh Audit"}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ ...panelStyle, color: "#991b1b", background: "#fef2f2" }}>
          {error}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))",
          gap: "12px",
        }}
      >
        {summaryCards.map(([label, value, color]) => (
          <div key={label} style={panelStyle}>
            <strong style={{ color, fontSize: "22px" }}>{value}</strong>
            <div style={{ color: MUTED, marginTop: "4px" }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={panelStyle}>
        <h3 style={{ color: BLUE, marginTop: 0 }}>Recent H11 Reporting Audit</h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Time", "User", "Report", "Result", "Status", "Duration", "Filters"].map((heading) => (
                  <th key={heading} style={headerCell}>{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {events.length ? (
                events.map((event) => (
                  <tr key={event.auditNumber}>
                    <td style={cell}>{event.createdAt ? new Date(event.createdAt).toLocaleString() : "—"}</td>
                    <td style={cell}>{event.performedByName || "System"}</td>
                    <td style={cell}>{event.targetId || "—"}</td>
                    <td style={cell}>{event.status}</td>
                    <td style={cell}>{event.metadata?.responseStatus || "—"}</td>
                    <td style={cell}>{event.metadata?.durationMs ?? "—"} ms</td>
                    <td style={cell}>{JSON.stringify(event.metadata?.query || {})}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ ...cell, textAlign: "center", color: MUTED }}>
                    {loading ? "Loading reporting audit..." : "No H11 reporting events match this period."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

const buttonStyle = {
  border: 0,
  borderRadius: "8px",
  padding: "10px 14px",
  background: BLUE,
  color: "#ffffff",
  fontWeight: 700,
  cursor: "pointer",
};

const inputStyle = {
  display: "block",
  width: "100%",
  marginTop: "6px",
  padding: "10px 12px",
  border: `1px solid ${BORDER}`,
  borderRadius: "8px",
  boxSizing: "border-box",
};

const headerCell = {
  padding: "10px",
  border: `1px solid ${BORDER}`,
  background: "#eef4ff",
  color: BLUE,
  textAlign: "left",
  whiteSpace: "nowrap",
};

const cell = {
  padding: "10px",
  border: `1px solid ${BORDER}`,
  verticalAlign: "top",
};

export default HRReportingControlsPanel;
