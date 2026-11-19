import { useState } from "react";
import api from "../api";

export default function PayrollEmployerOwnership() {
  const [recordType, setRecordType] = useState("FinancialAccount");
  const [recordNumber, setRecordNumber] = useState("");
  const [entityCode, setEntityCode] = useState("");
  const [evidenceReference, setEvidenceReference] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const isAccount = recordType === "FinancialAccount";
  const recordLabel = isAccount ? "Financial account number" : "Advance number";

  async function verifyOwnership(event) {
    event.preventDefault();
    if (saving) return;

    const number = recordNumber.trim();
    const employer = entityCode.trim();
    const evidence = evidenceReference.trim();

    if (!number || !employer || !evidence) {
      setMessage({ ok: false, text: "Complete all three fields." });
      return;
    }

    const confirmed = window.confirm(
      `Verify that ${isAccount ? "account" : "advance"} ${number} belongs to ` +
      `${employer}?\n\nA verified owner cannot be replaced using this form.`
    );
    if (!confirmed) return;

    setSaving(true);
    setMessage(null);

    try {
      const response = await api.post("/api/payroll/employer-links/verify", {
        recordType,
        recordNumber: number,
        entityCode: employer,
        evidenceReference: evidence,
      });

      const link = response.data?.data;
      if (!response.data?.success || !link) {
        throw new Error("The server did not confirm ownership.");
      }

      setMessage({
        ok: true,
        text: `${link.recordNumber} is verified for ${link.entityCode}.`,
      });

      setRecordNumber("");
      setEvidenceReference("");
    } catch (error) {
      setMessage({
        ok: false,
        text:
          error?.response?.data?.message ||
          error.message ||
          "Ownership could not be verified.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <details
      style={{
        margin: "16px 0",
        padding: "14px 16px",
        border: "1px solid #dbe3ef",
        borderRadius: 10,
        background: "#fff",
      }}
    >
      <summary style={{ cursor: "pointer", color: "#0b3d91", fontWeight: 700 }}>
        Verify payroll account or advance ownership · Admin
      </summary>

      <p>
        Use the employer code from Business Entity Setup and the account or
        advance number shown in EKOS. Verify each record against its supporting
        evidence before using it for payroll.
      </p>

      <form onSubmit={verifyOwnership}>
        <fieldset
          disabled={saving}
          style={{
            border: 0,
            padding: 0,
            display: "grid",
            gap: 10,
            maxWidth: 510,
          }}
        >
          <label>
            Record to verify
            <select
              style={fieldStyle}
              value={recordType}
              onChange={(event) => {
                setRecordType(event.target.value);
                setRecordNumber("");
                setEvidenceReference("");
                setMessage(null);
              }}
            >
              <option value="FinancialAccount">Payroll bank or cash account</option>
              <option value="EmployeeAdvance">Employee advance</option>
            </select>
          </label>

          <label>
            {recordLabel}
            <input
              style={fieldStyle}
              value={recordNumber}
              onChange={(event) => setRecordNumber(event.target.value)}
              required
            />
          </label>

          <label>
            Legal employer code
            <input
              style={fieldStyle}
              value={entityCode}
              onChange={(event) => setEntityCode(event.target.value)}
              required
            />
          </label>

          <label>
            Supporting evidence reference
            <input
              style={fieldStyle}
              value={evidenceReference}
              onChange={(event) => setEvidenceReference(event.target.value)}
              maxLength={250}
              placeholder="Internal account record or advance funding reference"
              required
            />
          </label>

          <small>
            Enter the reference only. Do not enter a TRN, bank credentials or
            confidential document contents.
          </small>

          <button type="submit" style={{ justifySelf: "start", padding: "8px 14px" }}>
            {saving ? "Saving…" : "Verify ownership"}
          </button>
        </fieldset>
      </form>

      {message && (
        <p role={message.ok ? "status" : "alert"}
           style={{ color: message.ok ? "#166534" : "#a32020" }}>
          {message.text}
        </p>
      )}
    </details>
  );
}

const fieldStyle = {
  display: "block",
  width: "100%",
  boxSizing: "border-box",
  marginTop: 4,
  padding: "8px 10px",
  border: "1px solid #bccce0",
  borderRadius: 6,
};