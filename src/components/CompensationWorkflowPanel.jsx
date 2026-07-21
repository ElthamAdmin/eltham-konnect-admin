import { useEffect, useState } from "react";
import api from "../api";

const BLUE = "#0B3D91";
const BORDER = "#dbe3ef";
const MUTED = "#64748b";

const createEmptyForm = () => ({
  compensationType: "Stipend",
  componentCode: "",
  componentName: "",
  amount: "",
  rateUnit: "Monthly",
  payFrequency: "Monthly",
  standardHoursPerDay: 0,
  standardHoursPerWeek: 0,
  effectiveFrom: "",
  effectiveTo: "",
  changeReason: "",
  changeNotes: "",
  supportingDocumentReference: "",
});

function CompensationWorkflowPanel({
  employeeId,
  records = [],
  onChanged,
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingNumber, setEditingNumber] = useState("");
  const [form, setForm] = useState(createEmptyForm());
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const drafts = records.filter(
    (record) => record.status === "Draft"
  );

  useEffect(() => {
    setFormOpen(false);
    setEditingNumber("");
    setForm(createEmptyForm());
    setMessage("");
    setErrorMessage("");
  }, [employeeId]);

  const updateField = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const openNewDraft = () => {
    setEditingNumber("");
    setForm(createEmptyForm());
    setMessage("");
    setErrorMessage("");
    setFormOpen(true);
  };

  const openDraftForEditing = (record) => {
    setEditingNumber(record.compensationNumber);

    setForm({
      compensationType: record.compensationType || "Stipend",
      componentCode:
        record.componentCode === "BASE_PAY"
          ? ""
          : record.componentCode || "",
      componentName:
        record.componentCode === "BASE_PAY"
          ? ""
          : record.componentName || "",
      amount: record.amount || "",
      rateUnit: record.rateUnit || "Monthly",
      payFrequency: record.payFrequency || "Monthly",
      standardHoursPerDay:
        record.standardHoursPerDay || 0,
      standardHoursPerWeek:
        record.standardHoursPerWeek || 0,
      effectiveFrom: record.effectiveFrom || "",
      effectiveTo: record.effectiveTo || "",
      changeReason: record.changeReason || "",
      changeNotes: record.changeNotes || "",
      supportingDocumentReference:
        record.supportingDocumentReference || "",
    });

    setMessage("");
    setErrorMessage("");
    setFormOpen(true);
  };

  const closeForm = () => {
    if (busy) return;

    setFormOpen(false);
    setEditingNumber("");
    setForm(createEmptyForm());
    setErrorMessage("");
  };

  const saveDraft = async () => {
    if (!employeeId) {
      setErrorMessage("Select an employee first.");
      return;
    }

    if (
      !form.compensationType ||
      Number(form.amount || 0) <= 0 ||
      !form.rateUnit ||
      !form.payFrequency ||
      !form.effectiveFrom ||
      !form.changeReason.trim()
    ) {
      setErrorMessage(
        "Type, positive amount, rate unit, frequency, effective date and change reason are required."
      );
      return;
    }

    if (
      form.compensationType === "Allowance" &&
      (!form.componentCode.trim() ||
        !form.componentName.trim())
    ) {
      setErrorMessage(
        "Allowance code and allowance name are required."
      );
      return;
    }

    if (
      form.effectiveTo &&
      form.effectiveTo < form.effectiveFrom
    ) {
      setErrorMessage(
        "Effective-to date cannot be earlier than effective-from date."
      );
      return;
    }

    const body = {
      employeeId,
      compensationType: form.compensationType,
      componentCode: form.componentCode.trim(),
      componentName: form.componentName.trim(),
      amount: Number(form.amount),
      rateUnit: form.rateUnit,
      payFrequency: form.payFrequency,
      standardHoursPerDay: Number(
        form.standardHoursPerDay || 0
      ),
      standardHoursPerWeek: Number(
        form.standardHoursPerWeek || 0
      ),
      effectiveFrom: form.effectiveFrom,
      effectiveTo: form.effectiveTo,
      changeReason: form.changeReason.trim(),
      changeNotes: form.changeNotes.trim(),
      supportingDocumentReference:
        form.supportingDocumentReference.trim(),
    };

    try {
      setBusy(true);
      setMessage("");
      setErrorMessage("");

      const response = editingNumber
        ? await api.patch(
            `/api/hr/compensation/${editingNumber}`,
            body
          )
        : await api.post("/api/hr/compensation", body);

      setMessage(response.data.message);
      setFormOpen(false);
      setEditingNumber("");
      setForm(createEmptyForm());

      await onChanged?.();
    } catch (error) {
      console.error("Compensation draft save failed:", error);

      setErrorMessage(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Could not save the compensation draft."
      );
    } finally {
      setBusy(false);
    }
  };

  const activateDraft = async (record) => {
    const approvalNotes = window.prompt(
      `Enter the approval reason for ${record.compensationNumber}.`
    );

    if (approvalNotes === null) return;

    if (!approvalNotes.trim()) {
      setErrorMessage("An approval reason is required.");
      return;
    }

    const confirmed = window.confirm(
      "Activate this compensation record? If it replaces an active record, the prior record will be closed and preserved as Superseded."
    );

    if (!confirmed) return;

    try {
      setBusy(true);
      setMessage("");
      setErrorMessage("");

      const response = await api.post(
        `/api/hr/compensation/${record.compensationNumber}/activate`,
        {
          approvalNotes: approvalNotes.trim(),
        }
      );

      setMessage(response.data.message);
      await onChanged?.();
    } catch (error) {
      console.error("Compensation activation failed:", error);

      setErrorMessage(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Could not activate the compensation record."
      );
    } finally {
      setBusy(false);
    }
  };

  const cancelDraft = async (record) => {
    const cancellationReason = window.prompt(
      `Enter the cancellation reason for ${record.compensationNumber}.`
    );

    if (cancellationReason === null) return;

    if (!cancellationReason.trim()) {
      setErrorMessage("A cancellation reason is required.");
      return;
    }

    try {
      setBusy(true);
      setMessage("");
      setErrorMessage("");

      const response = await api.post(
        `/api/hr/compensation/${record.compensationNumber}/cancel`,
        {
          cancellationReason:
            cancellationReason.trim(),
        }
      );

      setMessage(response.data.message);
      await onChanged?.();
    } catch (error) {
      console.error("Compensation cancellation failed:", error);

      setErrorMessage(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Could not cancel the compensation draft."
      );
    } finally {
      setBusy(false);
    }
  };

  if (!employeeId) return null;

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <div>
          <h3 style={{ color: BLUE, margin: 0 }}>
            Compensation Workflow
          </h3>

          <div style={{ color: MUTED, marginTop: "5px" }}>
            Create and review drafts. Active records can only be
            changed through later effective-dated replacements.
          </div>
        </div>

        <button
          type="button"
          onClick={formOpen ? closeForm : openNewDraft}
          disabled={busy}
          style={primaryButton}
        >
          {formOpen ? "Close Form" : "+ New Compensation Draft"}
        </button>
      </div>

      {message && (
        <div style={successPanel}>{message}</div>
      )}

      {errorMessage && (
        <div style={errorPanel}>{errorMessage}</div>
      )}

      {formOpen && (
        <div style={formPanel}>
          <h4 style={{ color: BLUE, marginTop: 0 }}>
            {editingNumber
              ? `Edit ${editingNumber}`
              : "New Effective-Dated Draft"}
          </h4>

          <div style={gridStyle}>
            <Field label="Compensation type">
              <select
                name="compensationType"
                value={form.compensationType}
                onChange={updateField}
                style={inputStyle}
              >
                <option value="Salary">Salary</option>
                <option value="Wage">Wage</option>
                <option value="Stipend">Stipend</option>
                <option value="Allowance">Allowance</option>
              </select>
            </Field>

            <Field label="Amount (JMD)">
              <input
                type="number"
                min="0.01"
                step="0.01"
                name="amount"
                value={form.amount}
                onChange={updateField}
                style={inputStyle}
              />
            </Field>

            <Field label="Rate unit">
              <select
                name="rateUnit"
                value={form.rateUnit}
                onChange={updateField}
                style={inputStyle}
              >
                <option>Hourly</option>
                <option>Daily</option>
                <option>Weekly</option>
                <option>Fortnightly</option>
                <option>Semi-Monthly</option>
                <option>Monthly</option>
                <option>Annual</option>
                <option>Fixed Period</option>
              </select>
            </Field>

            <Field label="Pay frequency">
              <select
                name="payFrequency"
                value={form.payFrequency}
                onChange={updateField}
                style={inputStyle}
              >
                <option>Weekly</option>
                <option>Fortnightly</option>
                <option>Semi-Monthly</option>
                <option>Monthly</option>
                <option>Annual</option>
              </select>
            </Field>

            {form.compensationType === "Allowance" && (
              <>
                <Field label="Allowance code">
                  <input
                    name="componentCode"
                    value={form.componentCode}
                    onChange={updateField}
                    placeholder="Example: TRAVEL"
                    style={inputStyle}
                  />
                </Field>

                <Field label="Allowance name">
                  <input
                    name="componentName"
                    value={form.componentName}
                    onChange={updateField}
                    placeholder="Example: Travel Allowance"
                    style={inputStyle}
                  />
                </Field>
              </>
            )}

            <Field label="Effective from">
              <input
                type="date"
                name="effectiveFrom"
                value={form.effectiveFrom}
                onChange={updateField}
                style={inputStyle}
              />
            </Field>

            <Field label="Effective to">
              <input
                type="date"
                name="effectiveTo"
                value={form.effectiveTo}
                onChange={updateField}
                style={inputStyle}
              />
            </Field>

            <Field label="Standard hours per day">
              <input
                type="number"
                min="0"
                step="0.01"
                name="standardHoursPerDay"
                value={form.standardHoursPerDay}
                onChange={updateField}
                style={inputStyle}
              />
            </Field>

            <Field label="Standard hours per week">
              <input
                type="number"
                min="0"
                step="0.01"
                name="standardHoursPerWeek"
                value={form.standardHoursPerWeek}
                onChange={updateField}
                style={inputStyle}
              />
            </Field>

            <Field label="Change reason">
              <input
                name="changeReason"
                value={form.changeReason}
                onChange={updateField}
                placeholder="Required reason"
                style={inputStyle}
              />
            </Field>

            <Field label="Supporting reference">
              <input
                name="supportingDocumentReference"
                value={form.supportingDocumentReference}
                onChange={updateField}
                placeholder="Optional approval or document reference"
                style={inputStyle}
              />
            </Field>
          </div>

          <Field label="Change notes">
            <textarea
              name="changeNotes"
              value={form.changeNotes}
              onChange={updateField}
              rows="3"
              style={{
                ...inputStyle,
                resize: "vertical",
              }}
            />
          </Field>

          <div style={buttonRow}>
            <button
              type="button"
              onClick={saveDraft}
              disabled={busy}
              style={primaryButton}
            >
              {busy
                ? "Saving..."
                : editingNumber
                  ? "Update Draft"
                  : "Create Draft"}
            </button>

            <button
              type="button"
              onClick={closeForm}
              disabled={busy}
              style={secondaryButton}
            >
              Cancel
            </button>
          </div>

          <div style={warningPanel}>
            Saving creates a Draft only. It does not change
            payroll or replace an active rate until separately
            approved and activated.
          </div>
        </div>
      )}

      {drafts.length > 0 && (
        <div style={{ marginTop: "16px" }}>
          <h4 style={{ color: BLUE }}>
            Drafts Awaiting Action
          </h4>

          <div style={{ display: "grid", gap: "10px" }}>
            {drafts.map((record) => (
              <div
                key={record.compensationNumber}
                style={draftCard}
              >
                <div>
                  <strong>{record.compensationNumber}</strong>

                  <div style={{ color: MUTED, marginTop: "4px" }}>
                    {record.componentName} · JMD{" "}
                    {Number(record.amount || 0).toLocaleString()} ·
                    effective {record.effectiveFrom}
                  </div>
                </div>

                <div style={buttonRow}>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      openDraftForEditing(record)
                    }
                    style={secondaryButton}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => activateDraft(record)}
                    style={successButton}
                  >
                    Activate
                  </button>

                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => cancelDraft(record)}
                    style={dangerButton}
                  >
                    Cancel Draft
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label style={labelStyle}>
      {label}
      {children}
    </label>
  );
}

const panelStyle = {
  backgroundColor: "white",
  border: `1px solid ${BORDER}`,
  borderRadius: "14px",
  padding: "18px",
  marginBottom: "18px",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  flexWrap: "wrap",
  gap: "12px",
};

const formPanel = {
  marginTop: "16px",
  padding: "16px",
  border: `1px solid ${BORDER}`,
  borderRadius: "12px",
  backgroundColor: "#f8fafc",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "12px",
};

const labelStyle = {
  display: "grid",
  gap: "6px",
  color: "#334155",
  fontSize: "13px",
  fontWeight: "bold",
  marginBottom: "12px",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px",
  border: `1px solid ${BORDER}`,
  borderRadius: "8px",
  backgroundColor: "white",
};

const buttonRow = {
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "8px",
};

const buttonBase = {
  border: "none",
  borderRadius: "8px",
  padding: "9px 13px",
  cursor: "pointer",
  fontWeight: "bold",
};

const primaryButton = {
  ...buttonBase,
  backgroundColor: BLUE,
  color: "white",
};

const successButton = {
  ...buttonBase,
  backgroundColor: "#16a34a",
  color: "white",
};

const dangerButton = {
  ...buttonBase,
  backgroundColor: "#dc2626",
  color: "white",
};

const secondaryButton = {
  ...buttonBase,
  backgroundColor: "#e2e8f0",
  color: "#334155",
};

const successPanel = {
  marginTop: "14px",
  padding: "11px",
  borderRadius: "8px",
  backgroundColor: "#dcfce7",
  color: "#166534",
};

const errorPanel = {
  marginTop: "14px",
  padding: "11px",
  borderRadius: "8px",
  backgroundColor: "#fee2e2",
  color: "#991b1b",
};

const warningPanel = {
  marginTop: "14px",
  padding: "11px",
  borderRadius: "8px",
  backgroundColor: "#fffbeb",
  border: "1px solid #fde68a",
  color: "#92400e",
  fontSize: "13px",
};

const draftCard = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "12px",
  padding: "13px",
  border: `1px solid ${BORDER}`,
  borderRadius: "10px",
  backgroundColor: "#f8fafc",
};

export default CompensationWorkflowPanel;