import { useEffect, useMemo, useState } from "react";
import api from "../api";

const ROYAL_BLUE = "#0B3D91";
const BORDER = "#dbe3ef";
const MUTED = "#64748b";
const WHITE = "#ffffff";

const DOCUMENT_TYPES = [
  "Contract",
  "Job Letter",
  "Warning Letter",
  "ID",
  "TRN",
  "NIS",
  "Payslip",
  "Policy",
  "Handbook",
  "Medical",
  "Qualification",
  "Work Permit",
  "Background Check",
  "Tax",
  "Other",
];

const CONFIDENTIALITY_LEVELS = [
  "Employee Visible",
  "HR Restricted",
  "Highly Restricted",
];

const createUploadForm = () => ({
  documentName: "",
  documentType: "Contract",
  description: "",
  confidentialityLevel: "Employee Visible",
  employeeCanDownload: true,
  issueDate: "",
  effectiveDate: "",
  expiryTrackingRequired: false,
  expiryDate: "",
  acknowledgementRequired: false,
  acknowledgementDueDate: "",
  file: null,
});

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

const successButton = {
  ...buttonStyle,
  background: "#16a34a",
};

const dangerButton = {
  ...buttonStyle,
  background: "#dc2626",
};

const secondaryButton = {
  ...buttonStyle,
  background: "#e8eef8",
  color: ROYAL_BLUE,
};

function ControlledDocumentAdminPanel({
  selectedEmployeeId,
  documents = [],
  onChanged,
}) {
  const [expanded, setExpanded] = useState(false);
  const [uploadForm, setUploadForm] = useState(createUploadForm);
  const [selectedDocumentNumber, setSelectedDocumentNumber] =
    useState("");

  const [metadataDescription, setMetadataDescription] = useState("");
  const [metadataReason, setMetadataReason] = useState("");
  const [verificationNotes, setVerificationNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");

  const [busyAction, setBusyAction] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const selectedDocument = useMemo(
    () =>
      documents.find(
        (document) =>
          document.documentNumber === selectedDocumentNumber
      ) || null,
    [documents, selectedDocumentNumber]
  );

  useEffect(() => {
    if (
      selectedDocumentNumber &&
      documents.some(
        (document) =>
          document.documentNumber === selectedDocumentNumber
      )
    ) {
      return;
    }

    const pendingDocument = documents.find(
      (document) => document.status === "Pending Verification"
    );

    setSelectedDocumentNumber(
      pendingDocument?.documentNumber ||
        documents[0]?.documentNumber ||
        ""
    );
  }, [documents, selectedDocumentNumber]);

  useEffect(() => {
    setMetadataDescription(selectedDocument?.description || "");
    setMetadataReason("");
    setVerificationNotes("");
    setRejectionReason("");
    setReviewNotes("");
    setError("");
    setNotice("");
  }, [selectedDocumentNumber, selectedDocument]);

  useEffect(() => {
    setUploadForm(createUploadForm());
    setError("");
    setNotice("");
  }, [selectedEmployeeId]);

  const updateUploadField = (event) => {
    const { name, value, checked, type, files } = event.target;

    setUploadForm((current) => ({
      ...current,
      [name]:
        type === "checkbox"
          ? checked
          : type === "file"
            ? files?.[0] || null
            : value,
    }));
  };

  const notifyChanged = async () => {
    if (typeof onChanged === "function") {
      await onChanged();
    }
  };

  const uploadControlledDocument = async () => {
    if (!selectedEmployeeId) {
      setError("Select an employee before uploading a document.");
      return;
    }

    if (!uploadForm.documentName.trim()) {
      setError("A controlled document name is required.");
      return;
    }

    if (!uploadForm.file) {
      setError("Select the document file to upload.");
      return;
    }

    if (
      uploadForm.expiryTrackingRequired &&
      !uploadForm.expiryDate
    ) {
      setError("An expiry date is required when expiry tracking is enabled.");
      return;
    }

    try {
      setBusyAction("upload");
      setError("");
      setNotice("");

      const formData = new FormData();

      formData.append("file", uploadForm.file);
      formData.append(
        "documentName",
        uploadForm.documentName.trim()
      );
      formData.append("documentType", uploadForm.documentType);
      formData.append(
        "description",
        uploadForm.description.trim()
      );
      formData.append(
        "confidentialityLevel",
        uploadForm.confidentialityLevel
      );
      formData.append(
        "employeeCanDownload",
        String(uploadForm.employeeCanDownload)
      );
      formData.append("issueDate", uploadForm.issueDate);
      formData.append("effectiveDate", uploadForm.effectiveDate);
      formData.append(
        "expiryTrackingRequired",
        String(uploadForm.expiryTrackingRequired)
      );
      formData.append(
        "expiryDate",
        uploadForm.expiryTrackingRequired
          ? uploadForm.expiryDate
          : ""
      );
      formData.append(
        "acknowledgementRequired",
        String(uploadForm.acknowledgementRequired)
      );
      formData.append(
        "acknowledgementDueDate",
        uploadForm.acknowledgementRequired
          ? uploadForm.acknowledgementDueDate
          : ""
      );

      const response = await api.post(
        `/api/documents/controlled/upload/${selectedEmployeeId}`,
        formData
      );

      setNotice(
        response.data?.message ||
          "Controlled employment document uploaded successfully."
      );

      setUploadForm(createUploadForm());

      await notifyChanged();

      if (response.data?.data?.documentNumber) {
        setSelectedDocumentNumber(
          response.data.data.documentNumber
        );
      }
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          "Failed to upload the controlled employment document."
      );
    } finally {
      setBusyAction("");
    }
  };

  const updateMetadata = async () => {
    if (!selectedDocument) {
      setError("Select a controlled document.");
      return;
    }

    if (!metadataReason.trim()) {
      setError("A metadata update reason is required.");
      return;
    }

    try {
      setBusyAction("metadata");
      setError("");
      setNotice("");

      const response = await api.patch(
        `/api/documents/controlled/${selectedDocument.documentNumber}/metadata`,
        {
          description: metadataDescription.trim(),
          updateReason: metadataReason.trim(),
        }
      );

      setNotice(
        response.data?.message ||
          "Document metadata updated successfully."
      );

      setMetadataReason("");
      await notifyChanged();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          "Failed to update controlled document metadata."
      );
    } finally {
      setBusyAction("");
    }
  };

  const verifyDocument = async () => {
    if (!selectedDocument) {
      setError("Select a controlled document.");
      return;
    }

    if (!verificationNotes.trim()) {
      setError("HR verification notes are required.");
      return;
    }

    const confirmed = window.confirm(
      `Verify ${selectedDocument.documentNumber}? Confirm that HR inspected the secure file first.`
    );

    if (!confirmed) return;

    try {
      setBusyAction("verify");
      setError("");
      setNotice("");

      const response = await api.post(
        `/api/documents/controlled/${selectedDocument.documentNumber}/verify`,
        {
          verificationNotes: verificationNotes.trim(),
        }
      );

      setNotice(
        response.data?.message ||
          "Controlled document verified successfully."
      );

      setVerificationNotes("");
      await notifyChanged();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          "Failed to verify the controlled document."
      );
    } finally {
      setBusyAction("");
    }
  };

  const rejectDocument = async () => {
    if (!selectedDocument) {
      setError("Select a controlled document.");
      return;
    }

    if (!rejectionReason.trim()) {
      setError("A document rejection reason is required.");
      return;
    }

    const confirmed = window.confirm(
      `Reject ${selectedDocument.documentNumber}?`
    );

    if (!confirmed) return;

    try {
      setBusyAction("reject");
      setError("");
      setNotice("");

      const response = await api.post(
        `/api/documents/controlled/${selectedDocument.documentNumber}/reject`,
        {
          rejectionReason: rejectionReason.trim(),
          reviewNotes: reviewNotes.trim(),
        }
      );

      setNotice(
        response.data?.message ||
          "Controlled document rejected successfully."
      );

      setRejectionReason("");
      setReviewNotes("");
      await notifyChanged();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          "Failed to reject the controlled document."
      );
    } finally {
      setBusyAction("");
    }
  };

  const pendingVerification =
    selectedDocument?.status === "Pending Verification";

  const metadataEditable = ["Draft", "Pending Verification"].includes(
    selectedDocument?.status
  );

  return (
    <div
      style={{
        background: WHITE,
        border: `1px solid ${BORDER}`,
        borderRadius: "14px",
        padding: "18px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h3 style={{ color: ROYAL_BLUE, margin: 0 }}>
            HR Document Controls
          </h3>

          <div style={{ color: MUTED, marginTop: "4px" }}>
            Upload, correct and review controlled employment documents.
          </div>
        </div>

        <button
          type="button"
          style={secondaryButton}
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? "Hide Controls" : "Open Controls"}
        </button>
      </div>

      {expanded && (
        <div style={{ display: "grid", gap: "18px", marginTop: "18px" }}>
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

          <div
            style={{
              border: `1px solid ${BORDER}`,
              borderRadius: "12px",
              padding: "16px",
            }}
          >
            <h4 style={{ color: ROYAL_BLUE, marginTop: 0 }}>
              Upload New Controlled Document
            </h4>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(210px, 1fr))",
                gap: "12px",
              }}
            >
              <div>
                <label style={labelStyle}>Document name</label>
                <input
                  name="documentName"
                  value={uploadForm.documentName}
                  onChange={updateUploadField}
                  placeholder="e.g. 2026 Employment Contract"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Document type</label>
                <select
                  name="documentType"
                  value={uploadForm.documentType}
                  onChange={updateUploadField}
                  style={inputStyle}
                >
                  {DOCUMENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Confidentiality</label>
                <select
                  name="confidentialityLevel"
                  value={uploadForm.confidentialityLevel}
                  onChange={updateUploadField}
                  style={inputStyle}
                >
                  {CONFIDENTIALITY_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>File</label>
                <input
                  type="file"
                  name="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                  onChange={updateUploadField}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Issue date</label>
                <input
                  type="date"
                  name="issueDate"
                  value={uploadForm.issueDate}
                  onChange={updateUploadField}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Effective date</label>
                <input
                  type="date"
                  name="effectiveDate"
                  value={uploadForm.effectiveDate}
                  onChange={updateUploadField}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Expiry date</label>
                <input
                  type="date"
                  name="expiryDate"
                  value={uploadForm.expiryDate}
                  onChange={updateUploadField}
                  disabled={!uploadForm.expiryTrackingRequired}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Acknowledgement due</label>
                <input
                  type="date"
                  name="acknowledgementDueDate"
                  value={uploadForm.acknowledgementDueDate}
                  onChange={updateUploadField}
                  disabled={!uploadForm.acknowledgementRequired}
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ marginTop: "12px" }}>
              <label style={labelStyle}>Description</label>
              <textarea
                name="description"
                value={uploadForm.description}
                onChange={updateUploadField}
                rows="3"
                style={inputStyle}
              />
            </div>

            <div
              style={{
                display: "flex",
                gap: "18px",
                flexWrap: "wrap",
                marginTop: "12px",
              }}
            >
              <label>
                <input
                  type="checkbox"
                  name="employeeCanDownload"
                  checked={uploadForm.employeeCanDownload}
                  onChange={updateUploadField}
                />{" "}
                Employee can download
              </label>

              <label>
                <input
                  type="checkbox"
                  name="acknowledgementRequired"
                  checked={uploadForm.acknowledgementRequired}
                  onChange={updateUploadField}
                />{" "}
                Employee acknowledgement required
              </label>

              <label>
                <input
                  type="checkbox"
                  name="expiryTrackingRequired"
                  checked={uploadForm.expiryTrackingRequired}
                  onChange={updateUploadField}
                />{" "}
                Track expiry
              </label>
            </div>

            <button
              type="button"
              style={{ ...primaryButton, marginTop: "14px" }}
              onClick={uploadControlledDocument}
              disabled={
                busyAction === "upload" || !selectedEmployeeId
              }
            >
              {busyAction === "upload"
                ? "Uploading..."
                : "Upload Controlled Document"}
            </button>
          </div>

          <div
            style={{
              border: `1px solid ${BORDER}`,
              borderRadius: "12px",
              padding: "16px",
            }}
          >
            <h4 style={{ color: ROYAL_BLUE, marginTop: 0 }}>
              Metadata and HR Review
            </h4>

            <div>
              <label style={labelStyle}>Controlled document</label>
              <select
                value={selectedDocumentNumber}
                onChange={(event) =>
                  setSelectedDocumentNumber(event.target.value)
                }
                style={inputStyle}
              >
                <option value="">Select document</option>

                {documents.map((document) => (
                  <option
                    key={document.documentNumber}
                    value={document.documentNumber}
                  >
                    {document.documentName} — {document.status}
                  </option>
                ))}
              </select>
            </div>

            {selectedDocument && (
              <>
                <div
                  style={{
                    marginTop: "10px",
                    padding: "10px",
                    borderRadius: "8px",
                    background: "#f8fafc",
                    color: MUTED,
                  }}
                >
                  {selectedDocument.documentNumber} · Version{" "}
                  {selectedDocument.currentVersionNumber} ·{" "}
                  {selectedDocument.status}
                </div>

                <div style={{ marginTop: "14px" }}>
                  <label style={labelStyle}>Description</label>
                  <textarea
                    value={metadataDescription}
                    onChange={(event) =>
                      setMetadataDescription(event.target.value)
                    }
                    rows="3"
                    disabled={!metadataEditable}
                    style={inputStyle}
                  />
                </div>

                <div style={{ marginTop: "12px" }}>
                  <label style={labelStyle}>Metadata update reason</label>
                  <textarea
                    value={metadataReason}
                    onChange={(event) =>
                      setMetadataReason(event.target.value)
                    }
                    rows="2"
                    disabled={!metadataEditable}
                    style={inputStyle}
                  />
                </div>

                <button
                  type="button"
                  style={{ ...secondaryButton, marginTop: "12px" }}
                  onClick={updateMetadata}
                  disabled={!metadataEditable || busyAction === "metadata"}
                >
                  {busyAction === "metadata"
                    ? "Updating..."
                    : "Update Metadata"}
                </button>

                {pendingVerification && (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(260px, 1fr))",
                      gap: "14px",
                      marginTop: "18px",
                    }}
                  >
                    <div>
                      <label style={labelStyle}>
                        HR verification notes
                      </label>
                      <textarea
                        value={verificationNotes}
                        onChange={(event) =>
                          setVerificationNotes(event.target.value)
                        }
                        rows="4"
                        style={inputStyle}
                      />

                      <button
                        type="button"
                        style={{ ...successButton, marginTop: "10px" }}
                        onClick={verifyDocument}
                        disabled={busyAction === "verify"}
                      >
                        {busyAction === "verify"
                          ? "Verifying..."
                          : "Verify Document"}
                      </button>
                    </div>

                    <div>
                      <label style={labelStyle}>Rejection reason</label>
                      <textarea
                        value={rejectionReason}
                        onChange={(event) =>
                          setRejectionReason(event.target.value)
                        }
                        rows="2"
                        style={inputStyle}
                      />

                      <label
                        style={{
                          ...labelStyle,
                          marginTop: "8px",
                        }}
                      >
                        Review notes
                      </label>
                      <textarea
                        value={reviewNotes}
                        onChange={(event) =>
                          setReviewNotes(event.target.value)
                        }
                        rows="2"
                        style={inputStyle}
                      />

                      <button
                        type="button"
                        style={{ ...dangerButton, marginTop: "10px" }}
                        onClick={rejectDocument}
                        disabled={busyAction === "reject"}
                      >
                        {busyAction === "reject"
                          ? "Rejecting..."
                          : "Reject Document"}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ControlledDocumentAdminPanel;