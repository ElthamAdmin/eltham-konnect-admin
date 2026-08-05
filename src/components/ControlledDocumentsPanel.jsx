import { useEffect, useMemo, useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import ControlledDocumentAdminPanel from "./ControlledDocumentAdminPanel";

const ROYAL_BLUE = "#0B3D91";
const BORDER = "#dbe3ef";
const MUTED = "#64748b";
const WHITE = "#ffffff";

const cardStyle = {
  background: WHITE,
  border: `1px solid ${BORDER}`,
  borderRadius: "14px",
  padding: "18px",
};

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  border: `1px solid ${BORDER}`,
  borderRadius: "8px",
  background: WHITE,
  boxSizing: "border-box",
};

const buttonStyle = {
  border: "none",
  borderRadius: "8px",
  padding: "10px 14px",
  background: ROYAL_BLUE,
  color: WHITE,
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryButtonStyle = {
  ...buttonStyle,
  background: "#e8eef8",
  color: ROYAL_BLUE,
};

const getStatusColors = (status) => {
  const normalized = String(status || "").toLowerCase();

  if (normalized === "verified") {
    return {
      background: "#dcfce7",
      color: "#166534",
    };
  }

  if (
    normalized === "pending verification" ||
    normalized === "draft"
  ) {
    return {
      background: "#fef3c7",
      color: "#92400e",
    };
  }

  if (
    normalized === "rejected" ||
    normalized === "expired" ||
    normalized === "cancelled"
  ) {
    return {
      background: "#fee2e2",
      color: "#991b1b",
    };
  }

  if (
    normalized === "archived" ||
    normalized === "superseded"
  ) {
    return {
      background: "#e2e8f0",
      color: "#475569",
    };
  }

  return {
    background: "#dbeafe",
    color: "#1d4ed8",
  };
};

const StatusBadge = ({ status }) => {
  const colors = getStatusColors(status);

  return (
    <span
      style={{
        display: "inline-block",
        padding: "5px 9px",
        borderRadius: "999px",
        fontSize: "12px",
        fontWeight: 700,
        ...colors,
      }}
    >
      {status || "Unknown"}
    </span>
  );
};

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("en-JM", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatBytes = (value) => {
  const bytes = Number(value || 0);

  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getActiveVersion = (document) =>
  (document?.versions || []).find(
    (version) => version.active
  ) ||
  (document?.versions || []).find(
    (version) =>
      Number(version.versionNumber) ===
      Number(document?.currentVersionNumber)
  ) ||
  null;

function ControlledDocumentsPanel({ employees = [], isAdminHR = false }) {
  const { user } = useAuth();

  const selfEmployeeId =
    user?.linkedEmployeeId ||
    user?.employeeId ||
    "";

  const [selectedEmployeeId, setSelectedEmployeeId] = useState(
    isAdminHR ? "" : selfEmployeeId
  );

  const [documents, setDocuments] = useState([]);
  const [expiryData, setExpiryData] = useState({
    asOfDate: "",
    summary: {
      totalTracked: 0,
      expired: 0,
      expiresToday: 0,
      remindersDue: 0,
      current: 0,
    },
    records: [],
  });

  const [loading, setLoading] = useState(false);
  const [downloadingNumber, setDownloadingNumber] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (
      isAdminHR &&
      !selectedEmployeeId &&
      employees.length > 0
    ) {
      setSelectedEmployeeId(employees[0].employeeId);
    }
  }, [employees, isAdminHR, selectedEmployeeId]);

  useEffect(() => {
    if (!isAdminHR && selfEmployeeId) {
      setSelectedEmployeeId(selfEmployeeId);
    }
  }, [isAdminHR, selfEmployeeId]);

  const selectedEmployee = useMemo(
    () =>
      employees.find(
        (employee) =>
          employee.employeeId === selectedEmployeeId
      ) || null,
    [employees, selectedEmployeeId]
  );

  const summary = useMemo(() => {
    const verified = documents.filter(
      (document) => document.status === "Verified"
    ).length;

    const pending = documents.filter(
      (document) =>
        document.status === "Pending Verification"
    ).length;

    const acknowledgementPending = documents.filter(
      (document) =>
        document.acknowledgementRequired &&
        document.acknowledgement?.status !== "Acknowledged"
    ).length;

    return {
      total: documents.length,
      verified,
      pending,
      acknowledgementPending,
    };
  }, [documents]);

  const fetchDocuments = async () => {
    if (!selectedEmployeeId) {
      setDocuments([]);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        `/api/documents/controlled/employee/${selectedEmployeeId}`
      );

      setDocuments(
        Array.isArray(response.data?.data)
          ? response.data.data
          : []
      );
    } catch (requestError) {
      setDocuments([]);
      setError(
        requestError?.response?.data?.message ||
          "Failed to retrieve controlled employment documents."
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchExpiryMonitor = async () => {
    if (!isAdminHR) return;

    try {
      const response = await api.get(
        "/api/documents/controlled/expiry-monitor"
      );

      setExpiryData({
        asOfDate: response.data?.asOfDate || "",
        summary:
          response.data?.summary ||
          expiryData.summary,
        records: Array.isArray(response.data?.data)
          ? response.data.data
          : [],
      });
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          "Failed to retrieve the document-expiry monitor."
      );
    }
  };

  const refreshView = async () => {
    setNotice("");

    await Promise.all([
      fetchDocuments(),
      fetchExpiryMonitor(),
    ]);
  };

  useEffect(() => {
    refreshView();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEmployeeId]);

  const downloadDocument = async (documentNumber) => {
    const downloadWindow = window.open("", "_blank");

    try {
      setDownloadingNumber(documentNumber);
      setError("");
      setNotice("");

      const response = await api.post(
        `/api/documents/controlled/${documentNumber}/download`
      );

      const downloadUrl =
        response.data?.data?.downloadUrl ||
        response.data?.data?.signedUrl ||
        response.data?.data?.url ||
        response.data?.downloadUrl ||
        response.data?.signedUrl ||
        response.data?.url ||
        "";

      if (!downloadUrl) {
        throw new Error(
          "The server did not return a secure download URL."
        );
      }

      if (downloadWindow) {
        downloadWindow.location.href = downloadUrl;
      } else {
        window.location.href = downloadUrl;
      }

      setNotice(
        "A secure five-minute document download was authorized."
      );

      await fetchDocuments();
    } catch (requestError) {
      if (downloadWindow) {
        downloadWindow.close();
      }

      setError(
        requestError?.response?.data?.message ||
          requestError.message ||
          "Failed to authorize the secure document download."
      );
    } finally {
      setDownloadingNumber("");
    }
  };

  const statCards = [
    {
      label: "Controlled Documents",
      value: summary.total,
      color: ROYAL_BLUE,
    },
    {
      label: "Verified",
      value: summary.verified,
      color: "#16a34a",
    },
    {
      label: "Pending Verification",
      value: summary.pending,
      color: "#d97706",
    },
    {
      label: "Acknowledgement Due",
      value: summary.acknowledgementPending,
      color: "#7c3aed",
    },
  ];

  return (
    <div style={{ display: "grid", gap: "18px" }}>
      <div style={cardStyle}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h2 style={{ color: ROYAL_BLUE, margin: 0 }}>
              Controlled Employment Documents
            </h2>

            <p style={{ color: MUTED, margin: "5px 0 0" }}>
              Authenticated Cloudinary storage, verification,
              acknowledgement, versions, access evidence and expiry controls.
            </p>
          </div>

          <span
            style={{
              padding: "6px 10px",
              borderRadius: "999px",
              background: "#eef4ff",
              color: ROYAL_BLUE,
              fontSize: "12px",
              fontWeight: 700,
            }}
          >
            H6 Controlled Documents
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "12px",
            marginTop: "16px",
          }}
        >
          {isAdminHR ? (
            <div>
              <label
                style={{
                  display: "block",
                  fontWeight: 700,
                  marginBottom: "6px",
                }}
              >
                Employee
              </label>

              <select
                value={selectedEmployeeId}
                onChange={(event) =>
                  setSelectedEmployeeId(event.target.value)
                }
                style={inputStyle}
              >
                <option value="">Select employee</option>

                {employees.map((employee) => (
                  <option
                    key={employee.employeeId}
                    value={employee.employeeId}
                  >
                    {employee.fullName} ({employee.employeeId})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <div style={{ fontWeight: 700 }}>Employee profile</div>
              <div style={{ color: MUTED, marginTop: "8px" }}>
                {selectedEmployeeId ||
                  "No linked employee profile was found."}
              </div>
            </div>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
            }}
          >
            <button
              type="button"
              style={secondaryButtonStyle}
              onClick={refreshView}
              disabled={loading || !selectedEmployeeId}
            >
              {loading ? "Refreshing..." : "Refresh Documents"}
            </button>
          </div>
        </div>
      </div>

            {(error || notice) && (
        <div
          style={{
            padding: "12px 14px",
            borderRadius: "10px",
            border: `1px solid ${
              error ? "#fecaca" : "#bbf7d0"
            }`,
            background: error ? "#fef2f2" : "#f0fdf4",
            color: error ? "#991b1b" : "#166534",
          }}
        >
          {error || notice}
        </div>
      )}

      {isAdminHR && (
        <ControlledDocumentAdminPanel
          selectedEmployeeId={selectedEmployeeId}
          documents={documents}
          onChanged={refreshView}
        />
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(170px, 1fr))",
          gap: "12px",
        }}
      >
        {statCards.map((card) => (
          <div key={card.label} style={cardStyle}>
            <div
              style={{
                color: card.color,
                fontSize: "26px",
                fontWeight: 800,
              }}
            >
              {card.value}
            </div>

            <div style={{ color: MUTED, marginTop: "4px" }}>
              {card.label}
            </div>
          </div>
        ))}
      </div>

      <div style={cardStyle}>
        <h3 style={{ color: ROYAL_BLUE, marginTop: 0 }}>
          {selectedEmployee?.fullName
            ? `${selectedEmployee.fullName} — Document Register`
            : "Document Register"}
        </h3>

        {!selectedEmployeeId ? (
          <div style={{ color: MUTED }}>
            Select an employee to view controlled documents.
          </div>
        ) : loading ? (
          <div style={{ color: MUTED }}>
            Loading controlled documents...
          </div>
        ) : documents.length === 0 ? (
          <div style={{ color: MUTED }}>
            No controlled documents were found for this employee.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              width="100%"
              cellPadding="10"
              style={{
                borderCollapse: "collapse",
                minWidth: "1050px",
              }}
            >
              <thead style={{ background: "#eef4ff" }}>
                <tr>
                  <th align="left">Document</th>
                  <th align="left">Type</th>
                  <th align="left">Status</th>
                  <th align="left">Version</th>
                  <th align="left">Acknowledgement</th>
                  <th align="left">Verification</th>
                  <th align="left">Expiry</th>
                  <th align="left">Access</th>
                </tr>
              </thead>

              <tbody>
                {documents.map((document) => {
                  const activeVersion = getActiveVersion(document);

                  return (
                    <tr
                      key={document.documentNumber}
                      style={{
                        borderBottom: `1px solid ${BORDER}`,
                        verticalAlign: "top",
                      }}
                    >
                      <td>
                        <strong>{document.documentName}</strong>
                        <div
                          style={{
                            color: MUTED,
                            fontSize: "12px",
                            marginTop: "3px",
                          }}
                        >
                          {document.documentNumber}
                        </div>
                        <div
                          style={{
                            color: MUTED,
                            fontSize: "12px",
                            marginTop: "3px",
                          }}
                        >
                          {document.description || "No description"}
                        </div>
                      </td>

                      <td>
                        {document.documentType || "—"}
                        <div style={{ color: MUTED, fontSize: "12px" }}>
                          {document.confidentialityLevel || "—"}
                        </div>
                      </td>

                      <td>
                        <StatusBadge status={document.status} />
                      </td>

                      <td>
                        <strong>
                          v{document.currentVersionNumber || 1}
                        </strong>
                        <div style={{ color: MUTED, fontSize: "12px" }}>
                          {activeVersion?.file?.originalFileName || "—"}
                        </div>
                        <div style={{ color: MUTED, fontSize: "12px" }}>
                          {formatBytes(activeVersion?.file?.sizeBytes)}
                        </div>
                      </td>

                      <td>
                        <StatusBadge
                          status={
                            document.acknowledgementRequired
                              ? document.acknowledgement?.status || "Pending"
                              : "Not Required"
                          }
                        />
                        <div style={{ color: MUTED, fontSize: "12px" }}>
                          {formatDate(
                            document.acknowledgement?.acknowledgedAt
                          )}
                        </div>
                      </td>

                      <td>
                        <StatusBadge
                          status={
                            document.verification?.status || "Pending"
                          }
                        />
                        <div style={{ color: MUTED, fontSize: "12px" }}>
                          {document.verification?.verifiedBy || "—"}
                        </div>
                      </td>

                      <td>
                        {document.expiryTrackingRequired ? (
                          <>
                            <strong>
                              {formatDate(document.expiryDate)}
                            </strong>
                            <div style={{ color: MUTED, fontSize: "12px" }}>
                              Tracking enabled
                            </div>
                          </>
                        ) : (
                          <span style={{ color: MUTED }}>
                            Not tracked
                          </span>
                        )}
                      </td>

                      <td>
                        {document.employeeCanDownload || isAdminHR ? (
                          <button
                            type="button"
                            style={buttonStyle}
                            disabled={
                              downloadingNumber ===
                              document.documentNumber
                            }
                            onClick={() =>
                              downloadDocument(document.documentNumber)
                            }
                          >
                            {downloadingNumber === document.documentNumber
                              ? "Authorizing..."
                              : "Secure Download"}
                          </button>
                        ) : (
                          <span style={{ color: MUTED }}>
                            Restricted
                          </span>
                        )}

                        <div
                          style={{
                            color: MUTED,
                            fontSize: "12px",
                            marginTop: "6px",
                          }}
                        >
                          Accesses: {Number(document.accessCount || 0)}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isAdminHR && (
        <div style={cardStyle}>
          <h3 style={{ color: ROYAL_BLUE, marginTop: 0 }}>
            Expiry and Reminder Monitor
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(150px, 1fr))",
              gap: "10px",
              marginBottom: "14px",
            }}
          >
            {[
              ["Tracked", expiryData.summary.totalTracked],
              ["Expired", expiryData.summary.expired],
              ["Expires Today", expiryData.summary.expiresToday],
              ["Reminders Due", expiryData.summary.remindersDue],
              ["Current", expiryData.summary.current],
            ].map(([label, value]) => (
              <div
                key={label}
                style={{
                  padding: "12px",
                  border: `1px solid ${BORDER}`,
                  borderRadius: "10px",
                }}
              >
                <strong style={{ color: ROYAL_BLUE, fontSize: "20px" }}>
                  {Number(value || 0)}
                </strong>
                <div style={{ color: MUTED }}>{label}</div>
              </div>
            ))}
          </div>

          <div style={{ color: MUTED }}>
            As of {expiryData.asOfDate || "—"}. Documents without expiry
            tracking are intentionally excluded.
          </div>
        </div>
      )}
    </div>
  );
}

export default ControlledDocumentsPanel;