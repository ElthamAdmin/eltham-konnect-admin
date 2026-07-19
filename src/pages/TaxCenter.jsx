import { useEffect, useState } from "react";
import api from "../api";
import TaxCenterOverview from "../components/TaxCenterOverview";
import TaxRecordsWorkflowPanel from "../components/TaxRecordsWorkflowPanel";
import TaxDocumentsPanel from "../components/TaxDocumentsPanel";

function TaxCenter() {
  const [dashboard, setDashboard] = useState({});
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({});
  const [payrollSummary, setPayrollSummary] = useState({});
    const [formOpen, setFormOpen] = useState(false);

  const [taxScope, setTaxScope] = useState({
    entityCode: "",
    periodKey: new Date()
      .toISOString()
      .slice(0, 7),
  });

  const [formData, setFormData] = useState({
    taxType: "GCT",
    periodStart: new Date().toISOString().slice(0, 10),
    periodEnd: new Date().toISOString().slice(0, 10),
    taxableAmount: 0,
    taxRate: 15,
    dueDate: "",
    notes: "",
  });

  const ROYAL_BLUE = "#0B3D91";
  const BORDER = "#dbe3ef";
  const MUTED = "#64748b";

    const loadTaxCenter = async (
    selectedScope = taxScope
  ) => {
    try {
      const requestParams = {
        entityCode:
          selectedScope.entityCode || "",
        periodKey:
          selectedScope.periodKey || "",
      };

      const [
        dashboardRes,
        recordsRes,
        payrollRes,
      ] = await Promise.all([
        api.get("/api/tax-center/dashboard", {
          params: requestParams,
        }),

        api.get("/api/tax-center/records", {
          params: requestParams,
        }),

        api.get(
          "/api/tax-center/payroll-summary",
          {
            params: {
              payPeriod:
                selectedScope.periodKey,
              entityCode:
                selectedScope.entityCode,
            },
          }
        ),
      ]);

      setDashboard(
        dashboardRes.data.data || {}
      );

      setRecords(
        recordsRes.data.data || []
      );

      setSummary(
        recordsRes.data.summary || {}
      );

      setPayrollSummary(
        payrollRes.data.data || {}
      );
    } catch (error) {
      console.error(
        "Tax center error:",
        error
      );

      alert(
        error?.response?.data?.message ||
          "Could not load Tax Center."
      );
    }
  };

    useEffect(() => {
    if (
      !taxScope.entityCode ||
      !taxScope.periodKey
    ) {
      return;
    }

    loadTaxCenter(taxScope);
  }, [
    taxScope.entityCode,
    taxScope.periodKey,
  ]);

  const money = (value) => `JMD ${Number(value || 0).toLocaleString()}`;

  const saveTaxRecord = async () => {
    try {
      if (!formData.taxType || !formData.periodStart || !formData.periodEnd) {
        alert("Tax type and period dates are required.");
        return;
      }

      await api.post("/api/tax-center/records", formData);

      alert("Tax record created successfully.");
      setFormOpen(false);
      setFormData({
        taxType: "GCT",
        periodStart: new Date().toISOString().slice(0, 10),
        periodEnd: new Date().toISOString().slice(0, 10),
        taxableAmount: 0,
        taxRate: 15,
        dueDate: "",
        notes: "",
      });

            await loadTaxCenter(taxScope);
    } catch (error) {
      console.error("Tax record save error:", error);
      alert(error?.response?.data?.message || "Could not create tax record.");
    }
  };

  return (
    <div>
      <h1 style={{ margin: 0 }}>Tax Center</h1>
      <p style={{ marginTop: "6px", color: MUTED }}>
        TAJ-ready tax tracking for payroll deductions, GCT, income tax, and company obligations.
      </p>

      <button
        onClick={() => setFormOpen((prev) => !prev)}
        style={{
          backgroundColor: ROYAL_BLUE,
          color: "white",
          border: "none",
          padding: "10px 16px",
          borderRadius: "8px",
          cursor: "pointer",
          fontWeight: "bold",
          margin: "18px 0",
        }}
      >
        {formOpen ? "Close Form" : "+ Add Tax Record"}
      </button>

                  <TaxCenterOverview
        dashboard={dashboard}
        onScopeChange={setTaxScope}
      />

      {formOpen && (
        <div style={panel(BORDER)}>
          <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>New Tax Record</h2>

          <div style={grid}>
            <select
              value={formData.taxType}
              onChange={(e) => setFormData({ ...formData, taxType: e.target.value })}
              style={input(BORDER)}
            >
              <option>GCT</option>
              <option>PAYE</option>
              <option>NIS</option>
              <option>NHT</option>
              <option>Education Tax</option>
              <option>Income Tax</option>
              <option>Company Tax</option>
              <option>Other</option>
            </select>

            <input
              type="date"
              value={formData.periodStart}
              onChange={(e) => setFormData({ ...formData, periodStart: e.target.value })}
              style={input(BORDER)}
            />

            <input
              type="date"
              value={formData.periodEnd}
              onChange={(e) => setFormData({ ...formData, periodEnd: e.target.value })}
              style={input(BORDER)}
            />

            <input
              type="number"
              placeholder="Taxable Amount"
              value={formData.taxableAmount}
              onChange={(e) =>
                setFormData({ ...formData, taxableAmount: Number(e.target.value || 0) })
              }
              style={input(BORDER)}
            />

            <input
              type="number"
              placeholder="Tax Rate %"
              value={formData.taxRate}
              onChange={(e) =>
                setFormData({ ...formData, taxRate: Number(e.target.value || 0) })
              }
              style={input(BORDER)}
            />

            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              style={input(BORDER)}
            />

            <textarea
              placeholder="Notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              style={{ ...input(BORDER), gridColumn: "1 / -1" }}
            />
          </div>

          <button onClick={saveTaxRecord} style={{ ...button("#16a34a"), marginTop: "14px" }}>
            Save Tax Record
          </button>
        </div>
      )}

      <div style={panel(BORDER)}>
        <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>Payroll Tax Summary</h2>

                <div style={summaryGrid}>
          <Mini
            label="Gross Pay"
            value={money(
              payrollSummary.grossPay
            )}
          />

          <Mini
            label="NIS Employee"
            value={money(
              payrollSummary.nisEmployee
            )}
          />

          <Mini
            label="NHT Employee"
            value={money(
              payrollSummary.nhtEmployee
            )}
          />

          <Mini
            label="Education Tax"
            value={money(
              payrollSummary
                .educationTaxEmployee
            )}
          />

          <Mini
            label="PAYE"
            value={money(
              payrollSummary.paye
            )}
          />

          <Mini
            label="Total Employee Deductions"
            value={money(
              payrollSummary
                .totalEmployeeDeductions
            )}
          />

          <Mini
            label="Net Pay"
            value={money(
              payrollSummary.netPay
            )}
          />
        </div>
      </div>

            <TaxDocumentsPanel
        entityCode={taxScope.entityCode}
        periodKey={taxScope.periodKey}
      />

            <TaxRecordsWorkflowPanel
        records={records}
        summary={summary}
        onChanged={loadTaxCenter}
      />
    </div>
  );
}

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
  gap: "12px",
};

const summaryGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
  gap: "12px",
};

function panel(border) {
  return {
    backgroundColor: "white",
    border: `1px solid ${border}`,
    borderRadius: "12px",
    padding: "18px",
    marginBottom: "18px",
  };
}

function input(border) {
  return {
    padding: "10px",
    borderRadius: "8px",
    border: `1px solid ${border}`,
  };
}

function button(color) {
  return {
    backgroundColor: color,
    color: "white",
    border: "none",
    padding: "10px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
  };
}

function Card({ children }) {
  return (
    <div
      style={{
        backgroundColor: "white",
        border: "1px solid #dbe3ef",
        borderRadius: "12px",
        padding: "18px",
      }}
    >
      {children}
    </div>
  );
}

function Mini({ label, value }) {
  return (
    <div
      style={{
        backgroundColor: "#f8fafc",
        border: "1px solid #dbe3ef",
        borderRadius: "10px",
        padding: "14px",
      }}
    >
      <div style={{ color: "#64748b", fontSize: "13px" }}>{label}</div>
      <div style={{ fontWeight: "bold", marginTop: "6px" }}>{value}</div>
    </div>
  );
}

export default TaxCenter;