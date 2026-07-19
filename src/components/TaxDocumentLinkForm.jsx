import { useState } from "react";
import api from "../api";

const LINK_TYPES = [
  {
    value: "taxNumber",
    label: "Tax obligation",
    placeholder: "TAX-PAY-...",
  },
  {
    value: "estimateNumber",
    label: "Income-tax estimate",
    placeholder: "ITX-...",
  },
  {
    value: "filingNumber",
    label: "GCT filing",
    placeholder: "GCT-...",
  },
  {
    value: "transactionNumber",
    label: "Tax payment transaction",
    placeholder: "TRN-...",
  },
];

const getExistingReference = (document) =>
  document.taxNumber ||
  document.estimateNumber ||
  document.filingNumber ||
  document.transactionNumber ||
  "";

function TaxDocumentLinkForm({
  document,
  onLinked,
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [linkType, setLinkType] =
    useState("taxNumber");
  const [targetReference, setTargetReference] =
    useState("");
  const [relatedTaxNumber, setRelatedTaxNumber] =
    useState("");
  const [notes, setNotes] = useState("");
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState("");

  const existingReference =
    getExistingReference(document);

  const selectedLinkType =
    LINK_TYPES.find(
      (option) => option.value === linkType
    ) || LINK_TYPES[0];

  const closeForm = () => {
    if (linking) return;

    setFormOpen(false);
    setTargetReference("");
    setRelatedTaxNumber("");
    setNotes("");
    setError("");
  };

  const linkDocument = async (event) => {
    event.preventDefault();

    const normalizedReference =
      targetReference.trim();

    if (!normalizedReference) {
      setError(
        `${selectedLinkType.label} reference is required.`
      );
      return;
    }

    if (
      linkType === "transactionNumber" &&
      !relatedTaxNumber.trim()
    ) {
      setError(
        "The related Tax Record number is required when linking a payment transaction."
      );
      return;
    }

    const confirmed = window.confirm(
      `Link ${document.documentNumber} to ` +
        `${selectedLinkType.label} ${normalizedReference}?`
    );

    if (!confirmed) return;

    try {
      setLinking(true);
      setError("");

      const payload = {
        [linkType]: normalizedReference,
        notes: notes.trim(),
      };

      if (linkType === "transactionNumber") {
        payload.taxNumber =
          relatedTaxNumber.trim();
      }

      const response = await api.post(
        `/api/tax-center/documents/${encodeURIComponent(
          document.documentNumber
        )}/link`,
        payload
      );

      alert(
        response.data?.message ||
          "Tax document linked successfully."
      );

      closeForm();

      if (onLinked) {
        await onLinked(response.data?.data);
      }
    } catch (requestError) {
      console.error(
        "Tax document linkage error:",
        requestError
      );

      setError(
        requestError?.response?.data?.message ||
          "Could not link the tax document."
      );
    } finally {
      setLinking(false);
    }
  };

  if (existingReference) {
    return (
      <div>
        <div style={linkedReferenceStyle}>
          {existingReference}
        </div>

        <div style={linkedStatusStyle}>
          Linked
        </div>
      </div>
    );
  }

  if (!formOpen) {
    return (
      <button
        type="button"
        onClick={() => setFormOpen(true)}
        style={linkButton}
      >
        Link Document
      </button>
    );
  }

  return (
    <form
      onSubmit={linkDocument}
      style={formStyle}
    >
      <label style={fieldLabel}>
        Link to
        <select
          value={linkType}
          onChange={(event) => {
            setLinkType(event.target.value);
            setTargetReference("");
            setRelatedTaxNumber("");
            setError("");
          }}
          disabled={linking}
          style={inputStyle}
        >
          {LINK_TYPES.map((option) => (
            <option
              key={option.value}
              value={option.value}
            >
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label style={fieldLabel}>
        {selectedLinkType.label} reference
        <input
          value={targetReference}
          onChange={(event) =>
            setTargetReference(event.target.value)
          }
          placeholder={selectedLinkType.placeholder}
          disabled={linking}
          style={inputStyle}
        />
      </label>

      {linkType === "transactionNumber" && (
        <label style={fieldLabel}>
          Related Tax Record number
          <input
            value={relatedTaxNumber}
            onChange={(event) =>
              setRelatedTaxNumber(event.target.value)
            }
            placeholder="TAX-PAY-..."
            disabled={linking}
            style={inputStyle}
          />
        </label>
      )}

      <label style={fieldLabel}>
        Linkage notes
        <textarea
          value={notes}
          onChange={(event) =>
            setNotes(event.target.value)
          }
          placeholder="Reason or supporting context"
          disabled={linking}
          style={{
            ...inputStyle,
            minHeight: "58px",
            resize: "vertical",
          }}
        />
      </label>

      {error && (
        <div style={errorStyle}>
          {error}
        </div>
      )}

      <div style={buttonRow}>
        <button
          type="submit"
          disabled={linking}
          style={confirmButton}
        >
          {linking
            ? "Linking..."
            : "Confirm Link"}
        </button>

        <button
          type="button"
          onClick={closeForm}
          disabled={linking}
          style={cancelButton}
        >
          Cancel
        </button>
      </div>

      <div style={warningStyle}>
        The server will reject entity, period, tax-type,
        or payment-reference mismatches.
      </div>
    </form>
  );
}

const linkedReferenceStyle = {
  color: "#0B3D91",
  fontWeight: "800",
  overflowWrap: "anywhere",
};

const linkedStatusStyle = {
  marginTop: "4px",
  color: "#166534",
  fontSize: "11px",
  fontWeight: "800",
};

const linkButton = {
  padding: "7px 10px",
  color: "white",
  backgroundColor: "#7c3aed",
  border: "none",
  borderRadius: "7px",
  cursor: "pointer",
  fontWeight: "700",
  whiteSpace: "nowrap",
};

const formStyle = {
  minWidth: "240px",
  padding: "10px",
  backgroundColor: "#f8fbff",
  border: "1px solid #bfdbfe",
  borderRadius: "9px",
};

const fieldLabel = {
  display: "flex",
  flexDirection: "column",
  gap: "5px",
  marginBottom: "9px",
  color: "#334155",
  fontSize: "11px",
  fontWeight: "700",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "8px",
  color: "#1e293b",
  backgroundColor: "white",
  border: "1px solid #cbd5e1",
  borderRadius: "7px",
  fontSize: "12px",
};

const buttonRow = {
  display: "flex",
  gap: "7px",
  flexWrap: "wrap",
};

const confirmButton = {
  padding: "7px 10px",
  color: "white",
  backgroundColor: "#7c3aed",
  border: "none",
  borderRadius: "7px",
  cursor: "pointer",
  fontWeight: "700",
};

const cancelButton = {
  padding: "7px 10px",
  color: "#334155",
  backgroundColor: "white",
  border: "1px solid #cbd5e1",
  borderRadius: "7px",
  cursor: "pointer",
  fontWeight: "700",
};

const warningStyle = {
  marginTop: "9px",
  color: "#854d0e",
  fontSize: "10px",
};

const errorStyle = {
  marginBottom: "9px",
  padding: "8px",
  color: "#991b1b",
  backgroundColor: "#fee2e2",
  border: "1px solid #fecaca",
  borderRadius: "7px",
  fontSize: "11px",
};

export default TaxDocumentLinkForm;