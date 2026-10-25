import { useEffect, useRef, useState } from "react";
import api from "../api";

const getReceivedDate = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Jamaica",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
};

export default function PackageEditForm({
  pkg,
  onCancel,
  onSaved,
}) {
  const panelRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    trackingNumber: pkg.trackingNumber || "",
    weight: String(pkg.weight ?? 0),
    courier: pkg.courier || "",
    warehouseLocation: pkg.warehouseLocation || "",
    dateReceived: getReceivedDate(pkg.dateReceived),
    reason: "",
  });

  useEffect(() => {
    panelRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saving) return;

    setError("");

    const weight = Number(form.weight);

    if (
      form.weight.trim() === "" ||
      !Number.isFinite(weight) ||
      weight < 0
    ) {
      setError("Enter a valid weight of zero or greater.");
      return;
    }

    if (!form.trackingNumber.trim()) {
      setError("Tracking number is required.");
      return;
    }

    if (!form.reason.trim()) {
      setError("Enter the reason for this correction.");
      return;
    }

    setSaving(true);

    let savedPackage;

    try {
      const payload = {
        trackingNumber: form.trackingNumber.trim(),
        weight,
        courier: form.courier.trim(),
        warehouseLocation: form.warehouseLocation.trim(),
        reason: form.reason.trim(),
        editVersion: Number(pkg.editVersion || 0),
      };

      if (form.dateReceived) {
        payload.dateReceived = form.dateReceived;
      }

      const response = await api.put(
        `/api/packages/${encodeURIComponent(pkg._id)}/details`,
        payload
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Package could not be updated."
        );
      }

      savedPackage = response.data.data;

      const warnings = Array.isArray(response.data.warnings)
        ? response.data.warnings
        : [];

      alert(
        [
          response.data.message || "Package updated successfully.",
          ...warnings,
        ].join("\n\n")
      );
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError.message ||
          "Package could not be updated."
      );

      setSaving(false);
      return;
    }

    setSaving(false);
    onSaved(savedPackage);
  };

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box",
    padding: "11px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    backgroundColor: "#ffffff",
    color: "#0f172a",
  };

  const labelStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
    color: "#334155",
    fontWeight: 700,
  };

  const buttonStyle = {
    border: 0,
    borderRadius: "8px",
    padding: "11px 18px",
    fontWeight: 700,
    cursor: saving ? "wait" : "pointer",
  };

  return (
    <section
      ref={panelRef}
      aria-labelledby="package-edit-heading"
      style={{
        backgroundColor: "#ffffff",
        border: "2px solid #0B3D91",
        borderRadius: "12px",
        padding: "20px",
        marginBottom: "20px",
        scrollMarginTop: "20px",
      }}
    >
      <h2
        id="package-edit-heading"
        style={{ marginTop: 0, color: "#0B3D91" }}
      >
        Edit Package
      </h2>

      <p style={{ color: "#475569", overflowWrap: "anywhere" }}>
        <strong>{pkg.customerName}</strong> — {pkg.customerEkonId}
        <br />
        Current tracking number: {pkg.trackingNumber}
      </p>

      <p
        style={{
          backgroundColor: "#fff7ed",
          border: "1px solid #fed7aa",
          borderRadius: "8px",
          padding: "12px",
          color: "#9a3412",
        }}
      >
        Existing invoice charges and payments stay unchanged.
        Weight corrections may require a separate billing review.
      </p>

      <form onSubmit={handleSubmit}>
        <fieldset
          disabled={saving}
          style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "16px",
            }}
          >
            <label style={labelStyle}>
              Tracking number
              <input
                name="trackingNumber"
                value={form.trackingNumber}
                onChange={handleChange}
                maxLength={200}
                required
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Actual weight (lb)
              <input
                type="number"
                name="weight"
                value={form.weight}
                onChange={handleChange}
                min="0"
                step="any"
                required
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Courier
              <input
                name="courier"
                value={form.courier}
                onChange={handleChange}
                maxLength={200}
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Warehouse location
              <input
                name="warehouseLocation"
                value={form.warehouseLocation}
                onChange={handleChange}
                maxLength={300}
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Date received
              <input
                type="date"
                name="dateReceived"
                value={form.dateReceived}
                onChange={handleChange}
                required={Boolean(pkg.dateReceived)}
                style={inputStyle}
              />
            </label>
          </div>

          <label
            style={{
              ...labelStyle,
              marginTop: "16px",
            }}
          >
            Reason for correction
            <textarea
              name="reason"
              value={form.reason}
              onChange={handleChange}
              maxLength={1000}
              rows={3}
              required
              placeholder="Explain what was incorrect and why it is being changed."
              style={{
                ...inputStyle,
                resize: "vertical",
              }}
            />
          </label>

          {error && (
            <p
              role="alert"
              style={{
                backgroundColor: "#fef2f2",
                border: "1px solid #fecaca",
                padding: "12px",
                borderRadius: "8px",
                color: "#b91c1c",
              }}
            >
              {error}
            </p>
          )}

          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
              marginTop: "18px",
            }}
          >
            <button
              type="submit"
              style={{
                ...buttonStyle,
                backgroundColor: "#0B3D91",
                color: "#ffffff",
              }}
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>

            <button
              type="button"
              onClick={onCancel}
              style={{
                ...buttonStyle,
                backgroundColor: "#e2e8f0",
                color: "#334155",
              }}
            >
              Cancel
            </button>
          </div>
        </fieldset>
      </form>
    </section>
  );
}