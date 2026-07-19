const COLORS = {
  blue: "#0B3D91",
  green: "#166534",
  red: "#991b1b",
  amber: "#92400e",
  slate: "#475569",
  border: "#dbe3ef",
};

const normalizeDate = (value) =>
  String(value || "").slice(0, 10);

const isEntityEffectiveForPeriod = (
  entity,
  periodKey
) => {
  if (!entity || !periodKey) return false;

  const [year, month] = periodKey
    .split("-")
    .map(Number);

  if (!year || !month) return false;

  const periodStart = `${periodKey}-01`;

  const periodEnd = new Date(
    Date.UTC(year, month, 0)
  )
    .toISOString()
    .slice(0, 10);

  const effectiveFrom = normalizeDate(
    entity.effectiveFrom
  );

  const effectiveTo = normalizeDate(
    entity.effectiveTo
  );

  if (
    effectiveFrom &&
    effectiveFrom > periodEnd
  ) {
    return false;
  }

  if (
    effectiveTo &&
    effectiveTo < periodStart
  ) {
    return false;
  }

  return true;
};

function TaxConfigurationReadiness({
  entity,
  periodKey,
}) {
  if (!entity || !periodKey) {
    return (
      <section style={panelStyle}>
        <div style={eyebrow}>
          STATUTORY CONFIGURATION READINESS
        </div>

        <div style={emptyStyle}>
          Select a business entity and reporting
          period to inspect configuration readiness.
        </div>
      </section>
    );
  }

  const reportingYear = Number(
    periodKey.slice(0, 4)
  );

  const entityEffective =
    isEntityEffectiveForPeriod(
      entity,
      periodKey
    );

  const taxTreatment =
    entity.taxTreatment || {};

  const incomeTaxConfigured =
    taxTreatment.taxConfigurationStatus ===
      "Configured" &&
    Boolean(
      String(
        taxTreatment.incomeTaxRuleCode || ""
      ).trim()
    );

  const gctConfigured = Boolean(
    String(
      taxTreatment.gctRegistrationCode || ""
    ).trim()
  );

  const awaitingOfficial2027Configuration =
    reportingYear >= 2027 &&
    (
      entity.lifecycleStatus === "Planned" ||
      !incomeTaxConfigured
    );

  const overallReady =
    entityEffective &&
    incomeTaxConfigured &&
    !awaitingOfficial2027Configuration;

  return (
    <section style={panelStyle}>
      <div style={headerStyle}>
        <div>
          <div style={eyebrow}>
            STATUTORY CONFIGURATION READINESS
          </div>

          <div style={titleStyle}>
            {entity.entityCode} · {periodKey}
          </div>

          <div style={subtitleStyle}>
            Effective-dated configuration status for
            payroll and tax calculations.
          </div>
        </div>

        <span
          style={readinessBadge(
            overallReady
              ? "ready"
              : awaitingOfficial2027Configuration
              ? "waiting"
              : "blocked"
          )}
        >
          {overallReady
            ? "Configured"
            : awaitingOfficial2027Configuration
            ? "Awaiting Official Rules"
            : "Configuration Required"}
        </span>
      </div>

      <div style={readinessGrid}>
        <ReadinessItem
          label="Business Entity Period"
          status={
            entityEffective
              ? "Ready"
              : "Not Effective"
          }
          tone={
            entityEffective
              ? "ready"
              : "blocked"
          }
          detail={
            entityEffective
              ? `${entity.legalName} is effective for ${periodKey}.`
              : `${entity.entityCode} is not effective for ${periodKey}.`
          }
        />

        <ReadinessItem
          label="Income-Tax Treatment"
          status={
            incomeTaxConfigured
              ? "Configured"
              : reportingYear >= 2027
              ? "Awaiting Official Rule"
              : "Not Configured"
          }
          tone={
            incomeTaxConfigured
              ? "ready"
              : reportingYear >= 2027
              ? "waiting"
              : "blocked"
          }
          detail={
            incomeTaxConfigured
              ? `${taxTreatment.incomeTaxType}: ${taxTreatment.incomeTaxRuleCode}`
              : "No effective income-tax rule is assigned."
          }
        />

        <ReadinessItem
          label="GCT Treatment"
          status={
            gctConfigured
              ? taxTreatment.gctRegistrationStatus ||
                "Configured"
              : "Not Configured"
          }
          tone={
            gctConfigured
              ? "ready"
              : "waiting"
          }
          detail={
            gctConfigured
              ? `${taxTreatment.gctRegistrationCode}. ${
                  taxTreatment.gctRegistrationStatus ===
                  "Not Registered"
                    ? "Turnover monitoring only; output and input GCT remain blocked."
                    : "Effective registration profile assigned."
                }`
              : "No effective GCT registration profile is assigned."
          }
        />

        <ReadinessItem
          label="2027 Statutory Figures"
          status={
            reportingYear >= 2027
              ? awaitingOfficial2027Configuration
                ? "Not Announced/Configured"
                : "Effective Rule Assigned"
              : "Not Applicable"
          }
          tone={
            reportingYear >= 2027
              ? awaitingOfficial2027Configuration
                ? "waiting"
                : "ready"
              : "neutral"
          }
          detail={
            reportingYear >= 2027
              ? awaitingOfficial2027Configuration
                ? "Calculations must remain blocked until verified official 2027 rates, thresholds, ceilings and filing rules are activated."
                : "An effective-dated 2027 configuration is assigned."
              : "The selected period uses historically preserved pre-2027 configuration."
          }
        />
      </div>

      {awaitingOfficial2027Configuration && (
        <div style={warningStyle}>
          <strong>2027 safeguard:</strong>{" "}
          no unannounced rate, threshold, annual
          ceiling, tax rate, filing rule, or due-date
          rule will be assumed or hard-coded.
      </div>
      )}

      {!entityEffective && (
        <div style={errorStyle}>
          The selected entity and reporting period
          do not overlap. Choose the entity that was
          legally effective during this period.
        </div>
      )}
    </section>
  );
}

function ReadinessItem({
  label,
  status,
  tone,
  detail,
}) {
  return (
    <div style={itemStyle}>
      <div style={itemHeader}>
        <span style={itemLabel}>
          {label}
        </span>

        <span style={smallBadge(tone)}>
          {status}
        </span>
      </div>

      <div style={itemDetail}>
        {detail}
      </div>
    </div>
  );
}

const readinessBadge = (tone) => ({
  display: "inline-block",
  padding: "8px 12px",
  borderRadius: "999px",
  whiteSpace: "nowrap",
  fontSize: "12px",
  fontWeight: "800",
  backgroundColor:
    tone === "ready"
      ? "#dcfce7"
      : tone === "waiting"
      ? "#fef3c7"
      : "#fee2e2",
  color:
    tone === "ready"
      ? COLORS.green
      : tone === "waiting"
      ? COLORS.amber
      : COLORS.red,
});

const smallBadge = (tone) => ({
  display: "inline-block",
  padding: "4px 8px",
  borderRadius: "999px",
  whiteSpace: "nowrap",
  fontSize: "10px",
  fontWeight: "800",
  backgroundColor:
    tone === "ready"
      ? "#dcfce7"
      : tone === "waiting"
      ? "#fef3c7"
      : tone === "blocked"
      ? "#fee2e2"
      : "#e2e8f0",
  color:
    tone === "ready"
      ? COLORS.green
      : tone === "waiting"
      ? COLORS.amber
      : tone === "blocked"
      ? COLORS.red
      : COLORS.slate,
});

const panelStyle = {
  padding: "16px 18px",
  marginTop: "14px",
  backgroundColor: "white",
  border: `1px solid ${COLORS.border}`,
  borderRadius: "12px",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "14px",
  flexWrap: "wrap",
  marginBottom: "14px",
};

const eyebrow = {
  color: "#64748b",
  fontSize: "11px",
  fontWeight: "800",
  letterSpacing: "0.08em",
};

const titleStyle = {
  marginTop: "5px",
  color: "#0f172a",
  fontSize: "17px",
  fontWeight: "800",
};

const subtitleStyle = {
  marginTop: "4px",
  color: "#64748b",
  fontSize: "12px",
};

const readinessGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(230px, 1fr))",
  gap: "10px",
};

const itemStyle = {
  padding: "12px",
  backgroundColor: "#f8fafc",
  border: `1px solid ${COLORS.border}`,
  borderRadius: "10px",
};

const itemHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "8px",
};

const itemLabel = {
  color: "#334155",
  fontSize: "12px",
  fontWeight: "800",
};

const itemDetail = {
  marginTop: "8px",
  color: "#64748b",
  fontSize: "11px",
  lineHeight: 1.45,
};

const warningStyle = {
  marginTop: "12px",
  padding: "11px 13px",
  color: COLORS.amber,
  backgroundColor: "#fefce8",
  border: "1px solid #fde68a",
  borderRadius: "9px",
  fontSize: "12px",
};

const errorStyle = {
  marginTop: "12px",
  padding: "11px 13px",
  color: COLORS.red,
  backgroundColor: "#fff1f2",
  border: "1px solid #fecdd3",
  borderRadius: "9px",
  fontSize: "12px",
};

const emptyStyle = {
  marginTop: "10px",
  padding: "18px",
  color: "#64748b",
  textAlign: "center",
  backgroundColor: "#f8fafc",
  border: "1px dashed #cbd5e1",
  borderRadius: "9px",
};

export default TaxConfigurationReadiness;