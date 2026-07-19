import { useRef, useState } from "react";
import api from "../api";

const DOCUMENT_TYPES = [
  "Return",
  "Payment Receipt",
  "Payment Confirmation",
  "Assessment",
  "Correspondence",
  "Supporting Schedule",
];

const TAX_TYPES = [
  "GCT",
  "PAYE",
  "NIS",
  "NHT",
  "Education Tax",
  "Income Tax",
  "Company Tax",
  "HEART",
  "Pension",
  "Other",
];

const jamaicaToday = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Jamaica",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

function TaxDocumentUploadForm({
  entityCode,
  periodKey,
  onUploaded,
}) {
  const fileInputRef = useRef(null);

  const [formOpen, setFormOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    documentType: "Supporting Schedule",
    taxType: "Income Tax",
    title: "",
    description: "",
    periodKey: periodKey || "",
    documentDate: jamaicaToday(),
    externalReference: "",
    receiptNumber: "",
    confidential: true,
    file: null,
  });

  const updateForm = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setForm({
      documentType: "Supporting Schedule",
      taxType: "Income Tax",
      title: "",
      description: "",
      periodKey: periodKey || "",
      documentDate: jamaicaToday(),
      externalReference: "",
      receiptNumber: "",
      confidential: true,
      file: null,
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const closeForm = () => {
    if (uploading) return;

    resetForm();
    setError("");
    setFormOpen(false);
  };

  const uploadDocument = async (event) => {
    event.preventDefault();

    if (!entityCode) {
      setError(
        "Select a business entity before uploading a tax document."
      );
      return;
    }

    if (!form.file) {
      setError("Select the tax document to upload.");
      return;
    }

    if (!form.documentType) {
      setError("Document classification is required.");
      return;
    }

    if (!form.taxType) {
      setError("Tax type is required.");
      return;
    }

    if (!form.title.trim()) {
      setError("Document title is required.");
      return;
    }

    if (!form.documentDate) {
      setError(
        "A valid document date using YYYY-MM-DD is required."
      );
      return;
    }

    try {
      setUploading(true);
      setError("");

      const payload = new FormData();

      payload.append("document", form.file);
      payload.append("entityCode", entityCode);
      payload.append("documentType", form.documentType);
      payload.append("taxType", form.taxType);
      payload.append("title", form.title.trim());
      payload.append(
        "description",
        form.description.trim()
      );
      payload.append(
        "periodKey",
        String(form.periodKey || "").trim()
      );
      payload.append(
        "documentDate",
        form.documentDate
      );
      payload.append(
        "externalReference",
        form.externalReference.trim()
      );
      payload.append(
        "receiptNumber",
        form.receiptNumber.trim()
      );
      payload.append(
        "confidential",
        String(form.confidential)
      );

      const response = await api.post(
        "/api/tax-center/documents/upload",
        payload
      );

      alert(
        response.data?.message ||
          "Tax document uploaded successfully."
      );

      resetForm();
      setFormOpen(false);

      if (onUploaded) {
        await onUploaded(response.data?.data);
      }
    } catch (requestError) {
      console.error(
        "Tax document upload error:",
        requestError
      );

      setError(
        requestError?.response?.data?.message ||
          "Could not upload the tax document."
      );
    } finally {
      setUploading(false);
    }
  };

  if (!formOpen) {
    return (
      <button
        type="button"
        onClick={() => {
          setForm((previous) => ({
            ...previous,
            periodKey:
              previous.periodKey ||
              periodKey ||
              "",
          }));

          setFormOpen(true);
        }}
        disabled={!entityCode}
        style={uploadButton}
      >
        + Upload Document
      </button>
    );
  }

  return (
    <form
      onSubmit={uploadDocument}
      style={formPanel}
    >
      <div style={formHeader}>
        <div>
          <h3 style={formTitle}>
            Upload Tax Document
          </h3>

          <div style={scopeText}>
            Entity: {entityCode || "Not selected"}
          </div>
        </div>

        <button
          type="button"
          onClick={closeForm}
          disabled={uploading}
          style={closeButton}
        >
          Close
        </button>
      </div>

      {error && (
        <div style={errorStyle}>
          {error}
        </div>
      )}

      <div style={formGrid}>
        <label style={fieldLabel}>
          Document file
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp"
            onChange={(event) =>
              updateForm(
                "file",
                event.target.files?.[0] || null
              )
            }
            disabled={uploading}
            style={inputStyle}
          />
        </label>

        <label style={fieldLabel}>
          Classification
          <select
            value={form.documentType}
            onChange={(event) =>
              updateForm(
                "documentType",
                event.target.value
              )
            }
            disabled={uploading}
            style={inputStyle}
          >
            {DOCUMENT_TYPES.map((documentType) => (
              <option
                key={documentType}
                value={documentType}
              >
                {documentType}
              </option>
            ))}
          </select>
        </label>

        <label style={fieldLabel}>
          Tax type
          <select
            value={form.taxType}
            onChange={(event) =>
              updateForm(
                "taxType",
                event.target.value
              )
            }
            disabled={uploading}
            style={inputStyle}
          >
            {TAX_TYPES.map((taxType) => (
              <option
                key={taxType}
                value={taxType}
              >
                {taxType}
              </option>
            ))}
          </select>
        </label>

        <label style={fieldLabel}>
          Document date
          <input
            type="date"
            value={form.documentDate}
            onChange={(event) =>
              updateForm(
                "documentDate",
                event.target.value
              )
            }
            disabled={uploading}
            style={inputStyle}
          />
        </label>

        <label style={fieldLabel}>
          Filing/reporting period
          <input
            value={form.periodKey}
            onChange={(event) =>
              updateForm(
                "periodKey",
                event.target.value
              )
            }
            placeholder="YYYY or YYYY-MM"
            disabled={uploading}
            style={inputStyle}
          />
        </label>

        <label style={fieldLabel}>
          Title
          <input
            value={form.title}
            onChange={(event) =>
              updateForm(
                "title",
                event.target.value
              )
            }
            placeholder="Required document title"
            disabled={uploading}
            style={inputStyle}
          />
        </label>

        <label style={fieldLabel}>
          External/filing reference
          <input
            value={form.externalReference}
            onChange={(event) =>
              updateForm(
                "externalReference",
                event.target.value
              )
            }
            placeholder="Optional official reference"
            disabled={uploading}
            style={inputStyle}
          />
        </label>

        <label style={fieldLabel}>
          Receipt number
          <input
            value={form.receiptNumber}
            onChange={(event) =>
              updateForm(
                "receiptNumber",
                event.target.value
              )
            }
            placeholder="For receipts or confirmations"
            disabled={uploading}
            style={inputStyle}
          />
        </label>

        <label style={descriptionLabel}>
          Description
          <textarea
            value={form.description}
            onChange={(event) =>
              updateForm(
                "description",
                event.target.value
              )
            }
            placeholder="Describe the document and its compliance purpose"
            disabled={uploading}
            style={{
              ...inputStyle,
              minHeight: "80px",
              resize: "vertical",
            }}
          />
        </label>

        <label style={checkboxLabel}>
          <input
            type="checkbox"
            checked={form.confidential}
            onChange={(event) =>
              updateForm(
                "confidential",
                event.target.checked
              )
            }
            disabled={uploading}
          />

          Confidential tax document
        </label>
      </div>

      <div style={noticeStyle}>
        The document will be stored using authenticated
        Cloudinary access. Upload only genuine tax records
        and supporting evidence.
      </div>

      <button
        type="submit"
        disabled={uploading}
        style={{
          ...submitButton,
          opacity: uploading ? 0.65 : 1,
        }}
      >
        {uploading
          ? "Uploading Securely..."
          : "Upload and Register Document"}
      </button>
    </form>
  );
}

const uploadButton = {
  padding: "8px 12px",
  color: "white",
  backgroundColor: "#16a34a",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "700",
};

const formPanel = {
  marginBottom: "16px",
  padding: "16px",
  backgroundColor: "#f8fbff",
  border: "1px solid #bfdbfe",
  borderRadius: "12px",
};

const formHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "12px",
  marginBottom: "14px",
};

const formTitle = {
  margin: 0,
  color: "#0B3D91",
};

const scopeText = {
  marginTop: "5px",
  color: "#64748b",
  fontSize: "12px",
  fontWeight: "700",
};

const closeButton = {
  padding: "7px 11px",
  color: "#334155",
  backgroundColor: "white",
  border: "1px solid #cbd5e1",
  borderRadius: "7px",
  cursor: "pointer",
  fontWeight: "700",
};

const formGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "12px",
};

const fieldLabel = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  color: "#334155",
  fontSize: "13px",
  fontWeight: "700",
};

const descriptionLabel = {
  ...fieldLabel,
  gridColumn: "1 / -1",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px",
  color: "#1e293b",
  backgroundColor: "white",
  border: "1px solid #cbd5e1",
  borderRadius: "8px",
};

const checkboxLabel = {
  display: "flex",
  alignItems: "center",
  gap: "7px",
  color: "#475569",
  fontSize: "13px",
  fontWeight: "700",
};

const noticeStyle = {
  marginTop: "14px",
  padding: "10px 12px",
  color: "#854d0e",
  backgroundColor: "#fefce8",
  border: "1px solid #fde68a",
  borderRadius: "8px",
  fontSize: "12px",
};

const submitButton = {
  marginTop: "14px",
  padding: "10px 15px",
  color: "white",
  backgroundColor: "#0B3D91",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "800",
};

const errorStyle = {
  marginBottom: "12px",
  padding: "10px 12px",
  color: "#991b1b",
  backgroundColor: "#fee2e2",
  border: "1px solid #fecaca",
  borderRadius: "8px",
  fontSize: "13px",
};

export default TaxDocumentUploadForm;