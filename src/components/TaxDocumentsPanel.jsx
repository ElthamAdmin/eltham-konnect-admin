import { useEffect, useState } from "react";
import api from "../api";
import TaxDocumentUploadForm from "./TaxDocumentUploadForm";

function TaxDocumentsPanel({
  entityCode,
  periodKey,
}) {
  const [documents, setDocuments] = useState([]);
  const [selectedPeriodOnly, setSelectedPeriodOnly] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [openingDocument, setOpeningDocument] =
    useState("");

  const [error, setError] = useState("");

  const loadDocuments = async () => {
    if (!entityCode) {
      setDocuments([]);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const params = {
        entityCode,
      };

      if (
        selectedPeriodOnly &&
        periodKey
      ) {
        params.periodKey = periodKey;
      }

      const response = await api.get(
        "/api/tax-center/documents",
        {
          params,
        }
      );

      setDocuments(
        response.data.data || []
      );
    } catch (requestError) {
      console.error(
        "Tax document retrieval error:",
        requestError
      );

      setDocuments([]);

      setError(
        requestError?.response?.data?.message ||
          "Could not load tax documents."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [
    entityCode,
    periodKey,
    selectedPeriodOnly,
  ]);

  const openDocument = async (documentNumber) => {
    const newWindow = window.open(
      "about:blank",
      "_blank"
    );

    if (newWindow) {
      newWindow.opener = null;

      newWindow.document.write(
        "<p style='font-family:Arial;padding:20px'>Preparing secure document...</p>"
      );
    }

    try {
      setOpeningDocument(documentNumber);
      setError("");

      const response = await api.get(
        `/api/tax-center/documents/${encodeURIComponent(
          documentNumber
        )}/access`
      );

      const accessUrl =
        response.data?.data?.accessUrl;

      if (!accessUrl) {
        throw new Error(
          "The server did not return a secure document link."
        );
      }

      if (newWindow) {
        newWindow.location.href = accessUrl;
      } else {
        window.location.href = accessUrl;
      }
    } catch (requestError) {
      if (newWindow) {
        newWindow.close();
      }

      console.error(
        "Tax document access error:",
        requestError
      );

      setError(
        requestError?.response?.data?.message ||
          requestError.message ||
          "Could not open the tax document."
      );
    } finally {
      setOpeningDocument("");
    }
  };

  return (
    <section style={panelStyle}>
      <div style={headerStyle}>
        <div>
          <h2 style={titleStyle}>
            Tax Documents
          </h2>

          <p style={subtitleStyle}>
            Returns, receipts, assessments,
            correspondence and supporting
            schedules stored for the selected
            business entity.
          </p>
        </div>

        <div style={controlsStyle}>
          <label style={checkboxLabel}>
            <input
              type="checkbox"
              checked={selectedPeriodOnly}
              onChange={(event) =>
                setSelectedPeriodOnly(
                  event.target.checked
                )
              }
            />

            Selected period only
          </label>

          <button
            type="button"
            onClick={loadDocuments}
            disabled={loading || !entityCode}
            style={refreshButton}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
                </div>
      </div>

      <TaxDocumentUploadForm
        entityCode={entityCode}
        periodKey={periodKey}
        onUploaded={loadDocuments}
      />

      {error && (
        <div style={errorStyle}>
          {error}
        </div>
      )}

      {!entityCode ? (
        <div style={emptyStyle}>
          Select a business entity to view its
          tax documents.
        </div>
      ) : loading ? (
        <div style={emptyStyle}>
          Loading tax documents...
        </div>
      ) : documents.length === 0 ? (
        <div style={emptyStyle}>
          No tax documents were found for{" "}
          {selectedPeriodOnly
            ? `${entityCode}, period ${periodKey}.`
            : `${entityCode}.`}
        </div>
      ) : (
        <div style={tableContainer}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <HeaderCell>
                  Document
                </HeaderCell>

                <HeaderCell>
                  Classification
                </HeaderCell>

                <HeaderCell>
                  Period
                </HeaderCell>

                <HeaderCell>
                  Document Date
                </HeaderCell>

                <HeaderCell>
                  Verification
                </HeaderCell>

                <HeaderCell>
                  Linked Reference
                </HeaderCell>

                <HeaderCell>
                  Access
                </HeaderCell>
              </tr>
            </thead>

            <tbody>
              {documents.map((document) => {
                const linkedReference =
                  document.taxNumber ||
                  document.estimateNumber ||
                  document.filingNumber ||
                  document.transactionNumber ||
                  "Not linked";

                return (
                  <tr key={document.documentNumber}>
                    <BodyCell>
                      <div style={documentTitle}>
                        {document.title}
                      </div>

                      <div style={documentNumber}>
                        {document.documentNumber}
                      </div>

                      <div style={fileName}>
                        {document.fileName}
                      </div>
                    </BodyCell>

                    <BodyCell>
                      <div>
                        {document.documentType}
                      </div>

                      <div style={taxType}>
                        {document.taxType}
                      </div>
                    </BodyCell>

                    <BodyCell>
                      {document.periodKey || "—"}
                    </BodyCell>

                    <BodyCell>
                      {formatDate(
                        document.documentDate
                      )}
                    </BodyCell>

                    <BodyCell>
                      <span
                        style={verificationBadge(
                          document.verificationStatus
                        )}
                      >
                        {document.verificationStatus ||
                          "Unverified"}
                      </span>
                    </BodyCell>

                    <BodyCell>
                      {linkedReference}
                    </BodyCell>

                    <BodyCell>
                      <button
                        type="button"
                        onClick={() =>
                          openDocument(
                            document.documentNumber
                          )
                        }
                        disabled={
                          openingDocument ===
                          document.documentNumber
                        }
                        style={openButton}
                      >
                        {openingDocument ===
                        document.documentNumber
                          ? "Opening..."
                          : "Open Securely"}
                      </button>
                    </BodyCell>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function HeaderCell({ children }) {
  return (
    <th style={headerCellStyle}>
      {children}
    </th>
  );
}

function BodyCell({ children }) {
  return (
    <td style={bodyCellStyle}>
      {children}
    </td>
  );
}

const formatDate = (value) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString(
    "en-JM",
    {
      year: "numeric",
      month: "short",
      day: "2-digit",
    }
  );
};

const verificationBadge = (status) => {
  const verified = status === "Verified";
  const rejected = status === "Rejected";

  return {
    display: "inline-block",
    padding: "5px 9px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: "800",

    backgroundColor: verified
      ? "#dcfce7"
      : rejected
      ? "#fee2e2"
      : "#fef3c7",

    color: verified
      ? "#166534"
      : rejected
      ? "#991b1b"
      : "#92400e",
  };
};

const panelStyle = {
  padding: "18px",
  marginBottom: "18px",
  backgroundColor: "white",
  border: "1px solid #dbe3ef",
  borderRadius: "12px",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "start",
  gap: "14px",
  flexWrap: "wrap",
  marginBottom: "14px",
};

const titleStyle = {
  margin: 0,
  color: "#0B3D91",
};

const subtitleStyle = {
  margin: "6px 0 0",
  color: "#64748b",
  fontSize: "13px",
};

const controlsStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  flexWrap: "wrap",
};

const checkboxLabel = {
  display: "flex",
  alignItems: "center",
  gap: "7px",
  color: "#475569",
  fontSize: "13px",
  fontWeight: "700",
};

const refreshButton = {
  padding: "8px 12px",
  color: "white",
  backgroundColor: "#0B3D91",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "700",
};

const tableContainer = {
  overflowX: "auto",
  border: "1px solid #dbe3ef",
  borderRadius: "10px",
};

const tableStyle = {
  width: "100%",
  minWidth: "1050px",
  borderCollapse: "collapse",
};

const headerCellStyle = {
  padding: "11px",
  textAlign: "left",
  color: "#1e293b",
  backgroundColor: "#eef4ff",
  borderBottom: "1px solid #dbe3ef",
  fontSize: "12px",
};

const bodyCellStyle = {
  padding: "11px",
  color: "#1e293b",
  borderBottom: "1px solid #e2e8f0",
  fontSize: "13px",
  verticalAlign: "top",
};

const documentTitle = {
  fontWeight: "800",
};

const documentNumber = {
  marginTop: "4px",
  color: "#0B3D91",
  fontSize: "11px",
  fontWeight: "700",
};

const fileName = {
  marginTop: "3px",
  color: "#64748b",
  fontSize: "11px",
};

const taxType = {
  marginTop: "4px",
  color: "#64748b",
  fontSize: "11px",
};

const openButton = {
  padding: "7px 10px",
  color: "white",
  backgroundColor: "#16a34a",
  border: "none",
  borderRadius: "7px",
  cursor: "pointer",
  fontWeight: "700",
  whiteSpace: "nowrap",
};

const emptyStyle = {
  padding: "24px",
  textAlign: "center",
  color: "#64748b",
  backgroundColor: "#f8fafc",
  border: "1px dashed #cbd5e1",
  borderRadius: "10px",
};

const errorStyle = {
  marginBottom: "12px",
  padding: "11px 13px",
  color: "#991b1b",
  backgroundColor: "#fee2e2",
  border: "1px solid #fecaca",
  borderRadius: "9px",
  fontSize: "13px",
};

export default TaxDocumentsPanel;