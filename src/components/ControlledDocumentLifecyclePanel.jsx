import { useMemo, useState } from "react";
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

const labelStyle = {
  display: "block",
  fontWeight: 700,
  marginBottom: "6px",
};

const buttonStyle = {
  border: "none",
  borderRadius: "8px",
  padding: "10px 14px",
  color: WHITE,
  fontWeight: 700,
  cursor: "pointer",
};

const primaryButton = {
  ...buttonStyle,
  background: ROYAL_BLUE,
};

const warningButton = {
  ...buttonStyle,
  background: "#d97706",
};

const dangerButton = {
  ...buttonStyle,
  background: "#dc2626",
};

const disabledStatuses = [
  "Archived",
  "Superseded",
  "Cancelled",
];

function ControlledDocumentLifecyclePanel({
  selectedDocument,
  documents = [],
  onChanged,
}) {
  const [replacementFile, setReplacementFile] = useState(null);
  const [changeReason, setChangeReason] = useState("");

  const [
    replacementDocumentNumber,
    setReplacementDocumentNumber,
  ] = useState("");
  const [supersedeReason, setSupersedeReason] = useState("");

  const [archiveReason, setArchiveReason] = useState("");
  const [reminderNotes, setReminderNotes] = useState("");
  const [expirationNotes, setExpirationNotes] = useState("");

  const [busyAction, setBusyAction] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const lifecycleLocked = disabledStatuses.includes(
    selectedDocument?.status
  );

  const replacementOptions = useMemo(
    () =>
      documents.filter(
        (document) =>
          document.documentNumber !==
            selectedDocument?.documentNumber &&
          !["Archived", "Superseded", "Cancelled"].includes(
            document.status
          )
      ),
    [documents, selectedDocument]
  );

  const clearMessages = () => {
    setError("");
    setNotice("");
  };

  const notifyChanged = async () => {
    if (typeof onChanged === "function") {
      await onChanged();
    }
  };

  const uploadReplacementVersion = async () => {
    if (!selectedDocument) {
      setError("Select a controlled document.");
      return;
    }

    if (lifecycleLocked) {
      setError(
        `${selectedDocument.status} documents cannot receive replacement versions.`
      );
      return;
    }

    if (!replacementFile) {
      setError("A replacement document file is required.");
      return;
    }

    if (!changeReason.trim()) {
      setError("A document version change reason is required.");
      return;
    }

    const confirmed = window.confirm(
      `Upload a new version of ${selectedDocument.documentNumber}? The existing version will remain in the controlled history.`
    );

    if (!confirmed) return;

    try {
      setBusyAction("version");
      clearMessages();

      const formData = new FormData();
      formData.append("file", replacementFile);
      formData.append("changeReason", changeReason.trim());

      const response = await api.post(
        `/api/documents/controlled/${selectedDocument.documentNumber}/versions`,
        formData
      );

      setNotice(
        response.data?.message ||
          "A new controlled document version was uploaded successfully."
      );

      setReplacementFile(null);
      setChangeReason("");

      const fileInput = document.getElementById(
        "controlled-document-replacement-file"
      );

      if (fileInput) {
        fileInput.value = "";
      }

      await notifyChanged();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          "Failed to upload the replacement document version."
      );
    } finally {
      setBusyAction("");
    }
  };

  const archiveDocument = async () => {
    if (!selectedDocument) {
      setError("Select a controlled document.");
      return;
    }

    if (!archiveReason.trim()) {
      setError("A document archive reason is required.");
      return;
    }

    const confirmed = window.confirm(
      `Archive ${selectedDocument.documentNumber}? The document will remain in its controlled history.`
    );

    if (!confirmed) return;

    try {
      setBusyAction("archive");
      clearMessages();

      const response = await api.post(
        `/api/documents/controlled/${selectedDocument.documentNumber}/archive`,
        {
          archiveReason: archiveReason.trim(),
        }
      );

      setNotice(
        response.data?.message ||
          "Controlled document archived successfully."
      );

      setArchiveReason("");
      await notifyChanged();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          "Failed to archive the controlled document."
      );
    } finally {
      setBusyAction("");
    }
  };

  const supersedeDocument = async () => {
    if (!selectedDocument) {
      setError("Select a controlled document.");
      return;
    }

    if (!replacementDocumentNumber) {
      setError("Select the replacement controlled document.");
      return;
    }

    if (
      replacementDocumentNumber ===
      selectedDocument.documentNumber
    ) {
      setError("A document cannot supersede itself.");
      return;
    }

    if (!supersedeReason.trim()) {
      setError("A document supersede reason is required.");
      return;
    }

    const confirmed = window.confirm(
      `Supersede ${selectedDocument.documentNumber} with ${replacementDocumentNumber}?`
    );

    if (!confirmed) return;

    try {
      setBusyAction("supersede");
      clearMessages();

      const response = await api.post(
        `/api/documents/controlled/${selectedDocument.documentNumber}/supersede`,
        {
          replacementDocumentNumber,
          supersedeReason: supersedeReason.trim(),
        }
      );

      setNotice(
        response.data?.message ||
          "Controlled document superseded successfully."
      );

      setReplacementDocumentNumber("");
      setSupersedeReason("");
      await notifyChanged();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          "Failed to supersede the controlled document."
      );
    } finally {
      setBusyAction("");
    }
  };

  const recordExpiryReminder = async () => {
    if (!selectedDocument) {
      setError("Select a controlled document.");
      return;
    }

    if (!selectedDocument.expiryTrackingRequired) {
      setError(
        `${selectedDocument.documentNumber} does not have active expiry tracking.`
      );
      return;
    }

    if (!reminderNotes.trim()) {
      setError("Expiry-reminder notes are required.");
      return;
    }

    const confirmed = window.confirm(
      `Record an expiry reminder for ${selectedDocument.documentNumber}?`
    );

    if (!confirmed) return;

    try {
      setBusyAction("reminder");
      clearMessages();

      const response = await api.post(
        `/api/documents/controlled/${selectedDocument.documentNumber}/expiry-reminder`,
        {
          reminderNotes: reminderNotes.trim(),
        }
      );

      setNotice(
        response.data?.message ||
          "Document expiry reminder recorded successfully."
      );

      setReminderNotes("");
      await notifyChanged();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          "Failed to record the document expiry reminder."
      );
    } finally {
      setBusyAction("");
    }
  };

  const markDocumentExpired = async () => {
    if (!selectedDocument) {
      setError("Select a controlled document.");
      return;
    }

    if (!selectedDocument.expiryTrackingRequired) {
      setError(
        `${selectedDocument.documentNumber} does not have active expiry tracking.`
      );
      return;
    }

    if (!expirationNotes.trim()) {
      setError("Document expiration notes are required.");
      return;
    }

    const confirmed = window.confirm(
      `Mark ${selectedDocument.documentNumber} as expired?`
    );

    if (!confirmed) return;

    try {
      setBusyAction("expire");
      clearMessages();

      const response = await api.post(
        `/api/documents/controlled/${selectedDocument.documentNumber}/expire`,
        {
          expirationNotes: expirationNotes.trim(),
        }
      );

      setNotice(
        response.data?.message ||
          "Controlled document marked expired successfully."
      );

      setExpirationNotes("");
      await notifyChanged();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          "Failed to mark the controlled document as expired."
      );
    } finally {
      setBusyAction("");
    }
  };

  if (!selectedDocument) {
    return (
      <div
        style={{
          border: `1px solid ${BORDER}`,
          borderRadius: "12px",
          padding: "16px",
          color: MUTED,
        }}
      >
        Select a controlled document above to access its lifecycle controls.
      </div>
    );
  }

  return (
    <div
      style={{
        border: `1px solid ${BORDER}`,
        borderRadius: "12px",
        padding: "16px",
      }}
    >
      <h4 style={{ color: ROYAL_BLUE, marginTop: 0 }}>
        Version and Lifecycle Controls
      </h4>

      <div
        style={{
          padding: "10px",
          borderRadius: "8px",
          background: "#f8fafc",
          color: MUTED,
          marginBottom: "14px",
        }}
      >
        {selectedDocument.documentName} ·{" "}
        {selectedDocument.documentNumber} · Version{" "}
        {selectedDocument.currentVersionNumber || 1} ·{" "}
        {selectedDocument.status}
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
            marginBottom: "14px",
          }}
        >
          {error || notice}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "14px",
        }}
      >
        <div
          style={{
            padding: "14px",
            border: `1px solid ${BORDER}`,
            borderRadius: "10px",
          }}
        >
          <h5 style={{ color: ROYAL_BLUE, marginTop: 0 }}>
            Upload Replacement Version
          </h5>

          <label style={labelStyle}>Replacement file</label>
          <input
            id="controlled-document-replacement-file"
            type="file"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
            onChange={(event) =>
              setReplacementFile(event.target.files?.[0] || null)
            }
            disabled={lifecycleLocked}
            style={inputStyle}
          />

          <label style={{ ...labelStyle, marginTop: "10px" }}>
            Change reason
          </label>
          <textarea
            value={changeReason}
            onChange={(event) =>
              setChangeReason(event.target.value)
            }
            rows="3"
            disabled={lifecycleLocked}
            style={inputStyle}
          />

          <button
            type="button"
            style={{ ...primaryButton, marginTop: "10px" }}
            onClick={uploadReplacementVersion}
            disabled={lifecycleLocked || busyAction === "version"}
          >
            {busyAction === "version"
              ? "Uploading Version..."
              : "Upload New Version"}
          </button>
        </div>

        <div
          style={{
            padding: "14px",
            border: `1px solid ${BORDER}`,
            borderRadius: "10px",
          }}
        >
          <h5 style={{ color: ROYAL_BLUE, marginTop: 0 }}>
            Supersede Document
          </h5>

          <label style={labelStyle}>Replacement document</label>
          <select
            value={replacementDocumentNumber}
            onChange={(event) =>
              setReplacementDocumentNumber(event.target.value)
            }
            disabled={lifecycleLocked}
            style={inputStyle}
          >
            <option value="">Select replacement document</option>

            {replacementOptions.map((document) => (
              <option
                key={document.documentNumber}
                value={document.documentNumber}
              >
                {document.documentName} — {document.documentNumber}
              </option>
            ))}
          </select>

          <label style={{ ...labelStyle, marginTop: "10px" }}>
            Supersede reason
          </label>
          <textarea
            value={supersedeReason}
            onChange={(event) =>
              setSupersedeReason(event.target.value)
            }
            rows="3"
            disabled={lifecycleLocked}
            style={inputStyle}
          />

          <button
            type="button"
            style={{ ...warningButton, marginTop: "10px" }}
            onClick={supersedeDocument}
            disabled={
              lifecycleLocked ||
              busyAction === "supersede" ||
              replacementOptions.length === 0
            }
          >
            {busyAction === "supersede"
              ? "Superseding..."
              : "Supersede Document"}
          </button>

          {replacementOptions.length === 0 && (
            <div
              style={{
                color: MUTED,
                fontSize: "12px",
                marginTop: "8px",
              }}
            >
              No eligible replacement document is currently available.
            </div>
          )}
        </div>

        <div
          style={{
            padding: "14px",
            border: `1px solid ${BORDER}`,
            borderRadius: "10px",
          }}
        >
          <h5 style={{ color: ROYAL_BLUE, marginTop: 0 }}>
            Expiry Controls
          </h5>

          {selectedDocument.expiryTrackingRequired ? (
            <>
              <div style={{ color: MUTED, marginBottom: "10px" }}>
                Expiry date: {selectedDocument.expiryDate || "Not set"}
              </div>

              <label style={labelStyle}>Reminder notes</label>
              <textarea
                value={reminderNotes}
                onChange={(event) =>
                  setReminderNotes(event.target.value)
                }
                rows="2"
                disabled={lifecycleLocked}
                style={inputStyle}
              />

              <button
                type="button"
                style={{ ...primaryButton, marginTop: "10px" }}
                onClick={recordExpiryReminder}
                disabled={
                  lifecycleLocked || busyAction === "reminder"
                }
              >
                {busyAction === "reminder"
                  ? "Recording..."
                  : "Record Expiry Reminder"}
              </button>

              <label style={{ ...labelStyle, marginTop: "14px" }}>
                Expiration notes
              </label>
              <textarea
                value={expirationNotes}
                onChange={(event) =>
                  setExpirationNotes(event.target.value)
                }
                rows="2"
                disabled={
                  lifecycleLocked ||
                  selectedDocument.status === "Expired"
                }
                style={inputStyle}
              />

              <button
                type="button"
                style={{ ...dangerButton, marginTop: "10px" }}
                onClick={markDocumentExpired}
                disabled={
                  lifecycleLocked ||
                  selectedDocument.status === "Expired" ||
                  busyAction === "expire"
                }
              >
                {busyAction === "expire"
                  ? "Marking Expired..."
                  : "Mark Document Expired"}
              </button>
            </>
          ) : (
            <div style={{ color: MUTED }}>
              Expiry tracking is not enabled for this document.
            </div>
          )}
        </div>

        <div
          style={{
            padding: "14px",
            border: "1px solid #fecaca",
            borderRadius: "10px",
            background: "#fff7f7",
          }}
        >
          <h5 style={{ color: "#991b1b", marginTop: 0 }}>
            Archive Document
          </h5>

          <div style={{ color: MUTED, marginBottom: "10px" }}>
            Archiving preserves the document, versions and audit history.
          </div>

          <label style={labelStyle}>Archive reason</label>
          <textarea
            value={archiveReason}
            onChange={(event) =>
              setArchiveReason(event.target.value)
            }
            rows="3"
            disabled={lifecycleLocked}
            style={inputStyle}
          />

          <button
            type="button"
            style={{ ...dangerButton, marginTop: "10px" }}
            onClick={archiveDocument}
            disabled={lifecycleLocked || busyAction === "archive"}
          >
            {busyAction === "archive"
              ? "Archiving..."
              : "Archive Document"}
          </button>
        </div>
      </div>

      {lifecycleLocked && (
        <div
          style={{
            color: MUTED,
            marginTop: "12px",
            fontSize: "13px",
          }}
        >
          Lifecycle-changing actions are unavailable because this document is{" "}
          {selectedDocument.status}.
        </div>
      )}
    </div>
  );
}

export default ControlledDocumentLifecyclePanel;