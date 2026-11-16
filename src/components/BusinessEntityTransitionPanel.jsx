import { useEffect, useState } from "react";
import api from "../api";

const today = () => {
  const parts = new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: "America/Jamaica",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }
  ).formatToParts(new Date());

  return ["year", "month", "day"]
    .map(
      (key) =>
        parts.find(
          (part) => part.type === key
        ).value
    )
    .join("-");
};

const emptyForm = () => ({
  entityCode: "",
  legalName: "",
  tradingName: "",
  effectiveFrom: today(),
  registrationNumber: "",
  registrationDate: "",
  incorporationDate: "",
  trn: "",
  registeredAddress: "",
  businessEmail: "",
  businessPhone: "",
  notes: "",
});

const fields = [
  ["entityCode", "Unique business code", "text"],
  ["legalName", "Registered legal name", "text"],
  ["tradingName", "Trading name", "text"],
  ["effectiveFrom", "Proposed operating date", "date"],
  ["registrationNumber", "Company registration number", "text"],
  ["registrationDate", "Registration completed date", "date"],
  ["incorporationDate", "Incorporation date", "date"],
  ["trn", "Company TRN", "text"],
  ["registeredAddress", "Registered address", "text"],
  ["businessEmail", "Business email", "email"],
  ["businessPhone", "Business phone", "text"],
];

function BusinessEntityTransitionPanel({
  entities = [],
  onChanged,
}) {
  const [open, setOpen] = useState(false);
  const [selectedCode, setSelectedCode] =
    useState("");

  const [form, setForm] =
    useState(emptyForm);

  const [incomeTaxRuleCode, setIncomeTaxRuleCode] =
    useState("");

  const [gctProfileCode, setGctProfileCode] =
    useState("");

  const [predecessorCode, setPredecessorCode] =
    useState("");

  const [preview, setPreview] = useState(null);
  const [confirmation, setConfirmation] =
    useState("");

  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const companies = entities.filter(
    (entity) =>
      entity.entityType ===
      "Limited Liability Company"
  );

  const selected = companies.find(
    (entity) =>
      entity.entityCode === selectedCode
  );

  const creating = !selectedCode;

  const editable =
    creating ||
    [
      "Planned",
      "Registration In Progress",
      "Registered",
    ].includes(selected?.lifecycleStatus);

  const registered =
    selected?.lifecycleStatus === "Registered";

  useEffect(() => {
    const next = emptyForm();

    if (selected) {
      for (const key of Object.keys(next)) {
        next[key] = selected[key] || "";
      }
    }

    setForm(next);

    setIncomeTaxRuleCode(
      selected?.taxTreatment
        ?.incomeTaxRuleCode || ""
    );

    setGctProfileCode(
      selected?.taxTreatment
        ?.gctRegistrationCode || ""
    );

    setPredecessorCode(
      selected?.predecessorEntityCode || ""
    );

    setPreview(null);
    setConfirmation("");
    setReason("");
    setError("");
    setMessage("");
  }, [selected]);

  const invalidatePreview = () => {
    setPreview(null);
    setConfirmation("");
  };

  const changeField = (field, value) => {
    invalidatePreview();

    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const perform = async (
    work,
    refreshAfter = true
  ) => {
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const result = await work();

      setMessage(
        result?.message ||
          "Action completed successfully."
      );

      if (refreshAfter) {
        invalidatePreview();

        try {
          await onChanged?.();
        } catch {
          setMessage(
            "The action succeeded, but refreshing the page data failed. Refresh Tax Center before continuing."
          );
        }
      }
    } catch (requestError) {
      invalidatePreview();

      setError(
        requestError.response?.data?.message ||
          "Could not complete the business setup action."
      );
    } finally {
      setBusy(false);
    }
  };

  const endpoint = (suffix = "") =>
    `/api/tax-center/entities/${encodeURIComponent(
      selectedCode
    )}${suffix}`;

  const saveSetup = async (event) => {
    event.preventDefault();

    await perform(async () => {
      let response;

      if (creating) {
        response = await api.post(
          "/api/tax-center/entities",
          {
            ...form,
            entityCode:
              form.entityCode.trim().toUpperCase(),

            entityType:
              "Limited Liability Company",
          }
        );
      } else {
        const payload = registered
          ? {
              effectiveFrom:
                form.effectiveFrom,

              notes: form.notes,
            }
          : Object.fromEntries(
              Object.entries(form).filter(
                ([key]) =>
                  key !== "entityCode"
              )
            );

        response = await api.patch(
          endpoint(),
          payload
        );
      }

      return response.data;
    });
  };

  const recordRegistration = () =>
    perform(async () => {
      const response = await api.post(
        endpoint("/register"),
        {}
      );

      return response.data;
    });

  const assignIncomeTax = () =>
    perform(async () => {
      const response = await api.post(
        endpoint("/income-tax-rule"),
        {
          ruleCode:
            incomeTaxRuleCode.trim(),

          effectiveDate:
            form.effectiveFrom,
        }
      );

      return response.data;
    });

  const assignGctProfile = () =>
    perform(async () => {
      const response = await api.post(
        endpoint("/gct-profile"),
        {
          registrationCode:
            gctProfileCode.trim(),
        }
      );

      return response.data;
    });

  const previewActivation = () =>
    perform(async () => {
      const response = await api.post(
        endpoint("/activation-preview"),
        {
          predecessorEntityCode:
            predecessorCode,

          effectiveDate:
            form.effectiveFrom,
        }
      );

      setPreview(response.data.data);
      setConfirmation("");

      return response.data;
    }, false);

  const activate = () =>
    perform(async () => {
      const response = await api.post(
        endpoint("/activate"),
        {
          predecessorEntityCode:
            preview.predecessorEntityCode,

          effectiveDate:
            preview.effectiveDate,

          previewHash:
            preview.previewHash,

          confirmation,
          reason: reason.trim(),
        }
      );

      return response.data;
    });

  const expectedConfirmation = preview
    ? `ACTIVATE ${preview.entityCode} ${preview.effectiveDate}`
    : "";

  return (
    <section style={panel}>
      <button
        type="button"
        disabled={busy}
        onClick={() =>
          setOpen((previous) => !previous)
        }
      >
        {open
          ? "Close business setup"
          : "Business registration / LLC transition"}
      </button>

      {open && (
        <div style={{ marginTop: 18 }}>
          <h2>
            LLC registration and operating transition
          </h2>

          <p>
            Administrator actions. Create the LLC
            setup, record completed registration,
            then activate operations on the selected
            date after accounting and tax setup are
            ready.
          </p>

          <p>
            Registration does not switch the
            operating business. Activation keeps
            historical transactions with their
            original business and does not transfer
            balances or Cloudinary documents.
          </p>

          {error && (
            <p role="alert" style={errorStyle}>
              {error}
            </p>
          )}

          {message && (
            <p role="status" style={messageStyle}>
              {message}
            </p>
          )}

          <fieldset disabled={busy}>
            <label>
              LLC setup
              <select
                value={selectedCode}
                onChange={(event) => {
                  invalidatePreview();
                  setSelectedCode(
                    event.target.value
                  );
                }}
              >
                <option value="">
                  Create a new Planned LLC
                </option>

                {companies.map((entity) => (
                  <option
                    key={entity.entityCode}
                    value={entity.entityCode}
                  >
                    {entity.legalName} —{" "}
                    {entity.entityCode} (
                    {entity.lifecycleStatus})
                  </option>
                ))}
              </select>
            </label>

            {selected && (
              <p>
                Current status:{" "}
                <strong>
                  {selected.lifecycleStatus}
                </strong>
              </p>
            )}

            <form onSubmit={saveSetup}>
              <div style={grid}>
                {fields.map(
                  ([field, label, type]) => {
                    const locked =
                      !editable ||
                      (
                        !creating &&
                        field === "entityCode"
                      ) ||
                      (
                        registered &&
                        field !== "effectiveFrom"
                      );

                    return (
                      <label key={field}>
                        {label}
                        <input
                          type={type}
                          value={form[field]}
                          disabled={locked}
                          required={[
                            "entityCode",
                            "legalName",
                            "effectiveFrom",
                          ].includes(field)}
                          onChange={(event) =>
                            changeField(
                              field,
                              event.target.value
                            )
                          }
                        />
                      </label>
                    );
                  }
                )}
              </div>

              <label>
                Setup notes
                <textarea
                  value={form.notes}
                  disabled={!editable}
                  onChange={(event) =>
                    changeField(
                      "notes",
                      event.target.value
                    )
                  }
                />
              </label>

              {editable && (
                <button
                  type="submit"
                  style={{ marginTop: 12 }}
                >
                  {creating
                    ? "Create Planned LLC"
                    : "Save setup"}
                </button>
              )}
            </form>

            {selected &&
              [
                "Planned",
                "Registration In Progress",
              ].includes(
                selected.lifecycleStatus
              ) && (
                <div style={subPanel}>
                  <h3>
                    Record completed registration
                  </h3>

                  <p>
                    Save the company registration
                    number, TRN, registration date,
                    and incorporation date above
                    before recording registration.
                  </p>

                  <button
                    type="button"
                    onClick={recordRegistration}
                  >
                    Record registration completed
                  </button>
                </div>
              )}

            {selected && editable && (
              <div style={subPanel}>
                <h3>Assign tax configuration</h3>

                <p>
                  Use existing reviewed rule and
                  profile codes. A GCT monitoring
                  profile can represent a company
                  that is not registered for GCT.
                </p>

                <div style={grid}>
                  <label>
                    Company income-tax rule code
                    <input
                      value={incomeTaxRuleCode}
                      onChange={(event) => {
                        invalidatePreview();

                        setIncomeTaxRuleCode(
                          event.target.value
                        );
                      }}
                    />
                  </label>

                  <label>
                    LLC GCT profile code
                    <input
                      value={gctProfileCode}
                      onChange={(event) => {
                        invalidatePreview();

                        setGctProfileCode(
                          event.target.value
                        );
                      }}
                    />
                  </label>
                </div>

                <div style={buttonRow}>
                  <button
                    type="button"
                    disabled={
                      !incomeTaxRuleCode.trim()
                    }
                    onClick={assignIncomeTax}
                  >
                    Assign income-tax rule
                  </button>

                  <button
                    type="button"
                    disabled={
                      !gctProfileCode.trim()
                    }
                    onClick={assignGctProfile}
                  >
                    Assign GCT profile
                  </button>
                </div>
              </div>
            )}

            {selected && (
              <div style={subPanel}>
                <h3>Accounting readiness</h3>

                <ul>
                  <li>
                    Chart of Accounts:{" "}
                    {selected.accountingConfiguration
                      ?.coaInitialized
                      ? "Initialized"
                      : "Setup required"}
                  </li>

                  <li>
                    Financial reporting:{" "}
                    {selected.accountingConfiguration
                      ?.reportingInitialized
                      ? "Initialized"
                      : "Setup required"}
                  </li>

                  <li>
                    Income-tax rule:{" "}
                    {selected.taxTreatment
                      ?.incomeTaxRuleCode ||
                      "Not assigned"}
                  </li>

                  <li>
                    GCT profile:{" "}
                    {selected.taxTreatment
                      ?.gctRegistrationCode ||
                      "Not assigned"}
                  </li>
                </ul>

                <p>
                  Accounting readiness is confirmed
                  by the backend. This form cannot
                  mark accounting setup complete.
                </p>
              </div>
            )}

            {registered && (
              <div style={subPanel}>
                <h3>Preview the operating switch</h3>

                <label>
                  Predecessor sole proprietorship
                  <select
                    value={predecessorCode}
                    onChange={(event) => {
                      invalidatePreview();

                      setPredecessorCode(
                        event.target.value
                      );
                    }}
                  >
                    <option value="">
                      Select predecessor
                    </option>

                    {entities
                      .filter(
                        (entity) =>
                          entity.entityType ===
                            "Sole Proprietorship" &&
                          entity.lifecycleStatus ===
                            "Active"
                      )
                      .map((entity) => (
                        <option
                          key={entity.entityCode}
                          value={entity.entityCode}
                        >
                          {entity.legalName} —{" "}
                          {entity.entityCode}
                        </option>
                      ))}
                  </select>
                </label>

                <p>
                  Save the proposed operating date
                  before previewing. Activation is
                  available on that date in Jamaica;
                  it is not scheduled automatically.
                </p>

                <button
                  type="button"
                  disabled={!predecessorCode}
                  onClick={previewActivation}
                >
                  Preview activation
                </button>

                {preview && (
                  <div style={previewStyle}>
                    <p>
                      <strong>
                        {preview.legalName}
                      </strong>{" "}
                      will operate from{" "}
                      <strong>
                        {preview.effectiveDate}
                      </strong>
                      .
                    </p>

                    <p>
                      Predecessor:{" "}
                      {preview.predecessorEntityCode}
                      . Its operating period ends{" "}
                      {preview.predecessorEnd}.
                    </p>

                    <p>{preview.notice}</p>

                    <label>
                      Transition reason
                      <textarea
                        value={reason}
                        onChange={(event) =>
                          setReason(
                            event.target.value
                          )
                        }
                      />
                    </label>

                    <label
                      style={{ marginTop: 12 }}
                    >
                      Type: {expectedConfirmation}
                      <input
                        value={confirmation}
                        autoComplete="off"
                        onChange={(event) =>
                          setConfirmation(
                            event.target.value
                          )
                        }
                      />
                    </label>

                    <button
                      type="button"
                      style={{ marginTop: 12 }}
                      disabled={
                        confirmation !==
                          expectedConfirmation ||
                        !reason.trim()
                      }
                      onClick={activate}
                    >
                      Activate reviewed LLC transition
                    </button>
                  </div>
                )}
              </div>
            )}
          </fieldset>
        </div>
      )}
    </section>
  );
}

const panel = {
  background: "white",
  border: "1px solid #dbe3ef",
  borderRadius: 12,
  padding: 18,
  marginBottom: 16,
};

const subPanel = {
  marginTop: 20,
  paddingTop: 12,
  borderTop: "1px solid #dbe3ef",
};

const grid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 12,
  margin: "14px 0",
};

const buttonRow = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
};

const errorStyle = {
  padding: 12,
  borderRadius: 8,
  background: "#fef2f2",
  color: "#991b1b",
};

const messageStyle = {
  padding: 12,
  borderRadius: 8,
  background: "#f0fdf4",
  color: "#166534",
};

const previewStyle = {
  marginTop: 16,
  padding: 16,
  border: "1px solid #bfdbfe",
  borderRadius: 10,
  background: "#eff6ff",
};

export default BusinessEntityTransitionPanel;