import { useEffect, useMemo, useState } from "react";
import api from "../api";

const ROYAL_BLUE = "#0B3D91";
const BORDER = "#dbe3ef";
const MUTED = "#64748b";
const WHITE = "#ffffff";

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

function ControlledDocumentAcknowledgementPanel({
  documents = [],
  onChanged,
}) {
  const [selectedDocumentNumber, setSelectedDocumentNumber] =
    useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [comments, setComments] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const acknowledgementDueDocuments = useMemo(
    () =>
      documents.filter(
        (document) =>
          document.acknowledgementRequired &&
          document.acknowledgement?.status !== "Acknowledged" &&
          ![
            "Archived",
            "Superseded",
            "Cancelled",
            "Rejected",
          ].includes(document.status)
      ),
    [documents]
  );

  const selectedDocument = useMemo(
    () =>
      acknowledgementDueDocuments.find(
        (document) =>
          document.documentNumber === selectedDocumentNumber
      ) || null,
    [acknowledgementDueDocuments, selectedDocumentNumber]
  );

  useEffect(() => {
    const selectionStillExists =
      acknowledgementDueDocuments.some(
        (document) =>
          document.documentNumber === selectedDocumentNumber
      );

    if (!selectionStillExists) {
      setSelectedDocumentNumber(
        acknowledgementDueDocuments[0]?.documentNumber || ""
      );
    }
  }, [
    acknowledgementDueDocuments,
    selectedDocumentNumber,
  ]);

  useEffect(() => {
    setConfirmed(false);
    setComments("");
    setError("");
    setNotice("");
  }, [selectedDocumentNumber]);

  const acknowledgeDocument = async () => {
    if (!selectedDocument) {
      setError(
        "Select a controlled document requiring acknowledgement."
      );
      return;
    }

    if (!confirmed) {
      setError(
        "Confirm that you reviewed the document before acknowledging it."
      );
      return;
    }

    const accepted = window.confirm(
      `Acknowledge ${selectedDocument.documentName}? This action will be recorded against your linked employee account.`
    );

    if (!accepted) return;

    try {
      setBusy(true);
      setError("");
      setNotice("");

      const response = await api.post(
        `/api/documents/controlled/${selectedDocument.documentNumber}/acknowledge`,
        {
          confirmed: true,
          comments: comments.trim(),
        }
      );

      setNotice(
        response.data?.message ||
          "Employment document acknowledged successfully."
      );

      setConfirmed(false);
      setComments("");

      if (typeof onChanged === "function") {
        await onChanged();
      }
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          "Failed to acknowledge the controlled employment document."
      );
    } finally {
      setBusy(false);
    }
  };

  if (acknowledgementDueDocuments.length === 0) {
    return (
      <div
        style={{
          background: WHITE,
          border: `1px solid ${BORDER}`,
          borderRadius: "14px",
          padding: "18px",
        }}
      >
        <h3 style={{ color: ROYAL_BLUE, marginTop: 0 }}>
          Document Acknowledgements
        </h3>

        <div style={{ color: MUTED }}>
          You have no controlled employment documents awaiting
          acknowledgement.
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: WHITE,
        border: `1px solid ${BORDER}`,
        borderRadius: "14px",
        padding: "18px",
      }}
    >
      <h3 style={{ color: ROYAL_BLUE, marginTop: 0 }}>
        Document Acknowledgements
      </h3>

      <p style={{ color: MUTED, marginTop: 0 }}>
        Securely review each assigned document before recording your
        acknowledgement.
      </p>

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
            marginBottom: "14px",
          }}
        >
          {error || notice}
        </div>
      )}

      <div>
        <label
          style={{
            display: "block",
            fontWeight: 700,
            marginBottom: "6px",
          }}
        >
          Document requiring acknowledgement
        </label>

        <select
          value={selectedDocumentNumber}
          onChange={(event) =>
            setSelectedDocumentNumber(event.target.value)
          }
          style={inputStyle}
        >
          {acknowledgementDueDocuments.map((document) => (
            <option
              key={document.documentNumber}
              value={document.documentNumber}
            >
              {document.documentName} — {document.documentNumber}
            </option>
          ))}
        </select>
      </div>

      {selectedDocument && (
        <div
          style={{
            marginTop: "14px",
            padding: "14px",
            borderRadius: "10px",
            background: "#f8fafc",
            border: `1px solid ${BORDER}`,
          }}
        >
          <strong>{selectedDocument.documentName}</strong>

          <div
            style={{
              color: MUTED,
              fontSize: "13px",
              marginTop: "4px",
            }}
          >
            {selectedDocument.documentNumber}
          </div>

          <div style={{ color: MUTED, marginTop: "8px" }}>
            {selectedDocument.description || "No description provided."}
          </div>

          <div
            style={{
              color: MUTED,
              fontSize: "13px",
              marginTop: "8px",
            }}
          >
            Status: {selectedDocument.status}
            {selectedDocument.acknowledgementDueDate
              ? ` · Due: ${selectedDocument.acknowledgementDueDate}`
              : ""}
          </div>
        </div>
      )}

      <div style={{ marginTop: "14px" }}>
        <label
          style={{
            display: "block",
            fontWeight: 700,
            marginBottom: "6px",
          }}
        >
          Comments
        </label>

        <textarea
          value={comments}
          onChange={(event) => setComments(event.target.value)}
          rows="3"
          placeholder="Optional comments about your acknowledgement"
          style={inputStyle}
        />
      </div>

      <label
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "8px",
          marginTop: "14px",
        }}
      >
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(event) => setConfirmed(event.target.checked)}
        />

        <span>
          I confirm that I reviewed this document and understand that
          my acknowledgement will be recorded against my linked
          employee account.
        </span>
      </label>

      <button
        type="button"
        style={{
          ...buttonStyle,
          marginTop: "14px",
          opacity: busy ? 0.65 : 1,
        }}
        onClick={acknowledgeDocument}
        disabled={busy || !selectedDocument}
      >
        {busy ? "Recording..." : "Acknowledge Document"}
      </button>
    </div>
  );
}

export default ControlledDocumentAcknowledgementPanel;