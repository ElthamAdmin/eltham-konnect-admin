import { useEffect, useMemo, useState } from "react";
import api from "../api";

const COLORS = {
  blue: "#0B3D91",
  green: "#16a34a",
  red: "#dc2626",
  amber: "#d97706",
  purple: "#7c3aed",
  slate: "#475569",
  border: "#dbe3ef",
  muted: "#64748b",
  background: "#f8fafc",
};

const currentPeriodKey = () =>
  new Date().toISOString().slice(0, 7);

const money = (value) =>
  `JMD ${Number(value || 0).toLocaleString(
    "en-JM",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}`;

function TaxCenterOverview({
  dashboard = {},
  onScopeChange,
}) {
  const [entities, setEntities] = useState([]);
  const [entityCode, setEntityCode] = useState("");
  const [periodKey, setPeriodKey] = useState(
    currentPeriodKey()
  );

  const [reconciliation, setReconciliation] =
    useState(null);

  const [loading, setLoading] = useState(true);
  const [reconciliationLoading, setReconciliationLoading] =
    useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    const loadEntities = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(
          "/api/tax-center/entities"
        );

        const entityRecords =
          response.data.data || [];

        setEntities(entityRecords);

        const activeEntity =
          entityRecords.find(
            (entity) =>
              entity.lifecycleStatus === "Active"
          ) || entityRecords[0];

        setEntityCode(
          activeEntity?.entityCode || ""
        );
      } catch (requestError) {
        console.error(
          "Tax Center entities error:",
          requestError
        );

        setError(
          requestError?.response?.data?.message ||
            "Could not load business entities."
        );
      } finally {
        setLoading(false);
      }
    };

    loadEntities();
  }, []);

    useEffect(() => {
    if (
      !entityCode ||
      !periodKey
    ) {
      return;
    }

    onScopeChange?.({
      entityCode,
      periodKey,
    });
  }, [
    entityCode,
    periodKey,
    onScopeChange,
  ]);

  useEffect(() => {
    if (!entityCode || !periodKey) {
      setReconciliation(null);
      return;
    }

    const loadReconciliation = async () => {
      try {
        setReconciliationLoading(true);
        setError("");

        const response = await api.get(
          "/api/tax-center/reconciliation/entity-period",
          {
            params: {
              entityCode,
              periodKey,
            },
          }
        );

        setReconciliation(response.data);
      } catch (requestError) {
        console.error(
          "Tax reconciliation error:",
          requestError
        );

        setReconciliation(null);

        setError(
          requestError?.response?.data?.message ||
            "Could not load Tax-to-GL reconciliation."
        );
      } finally {
        setReconciliationLoading(false);
      }
    };

    loadReconciliation();
  }, [entityCode, periodKey]);

  const activeEntity = useMemo(
    () =>
      entities.find(
        (entity) =>
          entity.entityCode === entityCode
      ),
    [entities, entityCode]
  );

  const reconciliationSummary =
    reconciliation?.summary || {};

  const gctPosition =
    dashboard.gctPosition || {};

  const reconciliationPassed =
    Number(
      reconciliationSummary
        .unreconciledAccountCount || 0
    ) === 0;

  return (
    <section style={{ marginBottom: "20px" }}>
      <div style={filterPanel}>
        <div>
          <div style={eyebrow}>
            TAX COMPLIANCE SCOPE
          </div>

          <div style={filterTitle}>
            {activeEntity?.legalName ||
              "Select Business Entity"}
          </div>

          <div style={filterSubtitle}>
            {activeEntity
              ? `${activeEntity.entityType} · ${activeEntity.entityCode}`
              : "Choose an effective business entity and reporting period."}
          </div>
        </div>

        <div style={filterGrid}>
          <label style={fieldLabel}>
            Business Entity

            <select
              value={entityCode}
              onChange={(event) =>
                setEntityCode(event.target.value)
              }
              disabled={loading}
              style={field}
            >
              <option value="">
                Select Entity
              </option>

              {entities.map((entity) => (
                <option
                  key={entity.entityCode}
                  value={entity.entityCode}
                >
                  {entity.legalName} (
                  {entity.entityCode})
                </option>
              ))}
            </select>
          </label>

          <label style={fieldLabel}>
            Reporting Period

            <input
              type="month"
              value={periodKey}
              onChange={(event) =>
                setPeriodKey(event.target.value)
              }
              style={field}
            />
          </label>
        </div>
      </div>

      {error && (
        <div style={errorPanel}>
          {error}
        </div>
      )}

      <div style={metricGrid}>
        <MetricCard
          label="Current Liabilities"
          value={money(
            dashboard.currentLiabilities
          )}
          color={COLORS.red}
          detail={`${Number(
            dashboard.taxRecordCount || 0
          )} obligation records`}
        />

        <MetricCard
          label="Upcoming Deadlines"
          value={money(
            dashboard.upcomingAmount
          )}
          color={COLORS.amber}
          detail={`${Number(
            dashboard.upcomingDeadlineCount || 0
          )} upcoming obligations`}
        />

        <MetricCard
          label="Overdue Obligations"
          value={money(
            dashboard.overdueAmount
          )}
          color={COLORS.red}
          detail={`${Number(
            dashboard.overdueObligationCount || 0
          )} overdue obligations`}
        />

        <MetricCard
          label="Amounts Paid"
          value={money(dashboard.totalPaid)}
          color={COLORS.green}
          detail="Recorded Tax Center payments"
        />

        <MetricCard
          label="Unfiled Periods"
          value={Number(
            dashboard.unfiledPeriodCount || 0
          ).toLocaleString()}
          color={COLORS.amber}
          detail={`${Number(
            dashboard.missingDeadlineRuleCount || 0
          )} missing deadline rules`}
        />

        <MetricCard
          label="Payroll Liability"
          value={money(
            dashboard.payrollGovernmentLiability
          )}
          color={COLORS.purple}
          detail={money(
            dashboard.payrollDeductions
          ) + " employee deductions"}
        />

        <MetricCard
          label="GCT Position"
          value={
            gctPosition.registrationStatus ||
            "Not Configured"
          }
          color={
            gctPosition.canChargeGct
              ? COLORS.green
              : COLORS.blue
          }
          detail={
            gctPosition.configured
              ? `${money(
                  gctPosition.monitoredTurnover
                )} monitored turnover`
              : "Registration monitoring unavailable"
          }
        />

        <MetricCard
          label="Income-Tax Estimate"
          value={money(
            dashboard.incomeTaxEstimate
              ?.estimatedTaxDue ||
              dashboard.incomeTaxEstimates
                ?.balanceDue ||
              0
          )}
          color={COLORS.blue}
          detail="Effective entity tax treatment"
        />
      </div>

      <div style={reconciliationPanel}>
        <div>
          <div style={eyebrow}>
            TAX-TO-GL RECONCILIATION
          </div>

          <div style={reconciliationTitle}>
            {entityCode || "No entity selected"} ·{" "}
            {periodKey || "No period selected"}
          </div>

          <div style={reconciliationDetail}>
            {reconciliationLoading
              ? "Loading reconciliation..."
              : `${money(
                  reconciliationSummary.taxCenterBalance
                )} Tax Center balance compared with ${money(
                  reconciliationSummary.glBalance
                )} in the General Ledger.`}
          </div>
        </div>

        <div
          style={{
            ...statusBadge,
            backgroundColor:
              reconciliationLoading
                ? "#e2e8f0"
                : reconciliationPassed
                ? "#dcfce7"
                : "#fee2e2",

            color:
              reconciliationLoading
                ? COLORS.slate
                : reconciliationPassed
                ? "#166534"
                : "#991b1b",
          }}
        >
          {reconciliationLoading
            ? "Checking"
            : reconciliationPassed
            ? "Reconciled"
            : `${money(
                reconciliationSummary.absoluteDifference
              )} Difference`}
        </div>
      </div>

      {!reconciliationLoading &&
        Number(
          reconciliationSummary
            .unreconciledAccountCount || 0
        ) > 0 && (
          <div style={warningPanel}>
            <strong>
              GL reconciliation warning:
            </strong>{" "}
            {Number(
              reconciliationSummary
                .unreconciledAccountCount || 0
            )}{" "}
            tax account(s) have a remaining
            difference. Records cannot be marked
            Reconciled until the related journals
            and payments agree.
          </div>
        )}
    </section>
  );
}

function MetricCard({
  label,
  value,
  color,
  detail,
}) {
  return (
    <div style={metricCard}>
      <div style={metricLabel}>{label}</div>

      <div
        style={{
          ...metricValue,
          color,
        }}
      >
        {value}
      </div>

      <div style={metricDetail}>{detail}</div>
    </div>
  );
}

const filterPanel = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "end",
  gap: "18px",
  flexWrap: "wrap",
  padding: "18px",
  marginBottom: "14px",
  backgroundColor: "white",
  border: `1px solid ${COLORS.border}`,
  borderRadius: "14px",
};

const filterGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(2, minmax(200px, 1fr))",
  gap: "12px",
  flex: "1 1 440px",
  maxWidth: "620px",
};

const fieldLabel = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  color: "#334155",
  fontSize: "13px",
  fontWeight: "700",
};

const field = {
  minHeight: "42px",
  padding: "9px 11px",
  border: `1px solid ${COLORS.border}`,
  borderRadius: "9px",
  backgroundColor: "white",
};

const eyebrow = {
  color: COLORS.muted,
  fontSize: "11px",
  fontWeight: "800",
  letterSpacing: "0.08em",
};

const filterTitle = {
  marginTop: "5px",
  color: "#0f172a",
  fontSize: "20px",
  fontWeight: "800",
};

const filterSubtitle = {
  marginTop: "4px",
  color: COLORS.muted,
  fontSize: "13px",
};

const metricGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(205px, 1fr))",
  gap: "12px",
  marginBottom: "14px",
};

const metricCard = {
  minHeight: "112px",
  padding: "16px",
  backgroundColor: "white",
  border: `1px solid ${COLORS.border}`,
  borderRadius: "12px",
};

const metricLabel = {
  color: COLORS.muted,
  fontSize: "13px",
  fontWeight: "700",
};

const metricValue = {
  marginTop: "9px",
  fontSize: "21px",
  fontWeight: "850",
};

const metricDetail = {
  marginTop: "8px",
  color: COLORS.muted,
  fontSize: "12px",
  lineHeight: 1.4,
};

const reconciliationPanel = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
  flexWrap: "wrap",
  padding: "16px 18px",
  backgroundColor: "white",
  border: `1px solid ${COLORS.border}`,
  borderRadius: "12px",
};

const reconciliationTitle = {
  marginTop: "5px",
  color: "#0f172a",
  fontSize: "17px",
  fontWeight: "800",
};

const reconciliationDetail = {
  marginTop: "5px",
  color: COLORS.muted,
  fontSize: "13px",
};

const statusBadge = {
  padding: "8px 12px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: "800",
};

const warningPanel = {
  marginTop: "10px",
  padding: "12px 14px",
  color: "#991b1b",
  backgroundColor: "#fff1f2",
  border: "1px solid #fecdd3",
  borderRadius: "10px",
  fontSize: "13px",
};

const errorPanel = {
  marginBottom: "12px",
  padding: "12px 14px",
  color: "#991b1b",
  backgroundColor: "#fee2e2",
  border: "1px solid #fecaca",
  borderRadius: "10px",
};

export default TaxCenterOverview;