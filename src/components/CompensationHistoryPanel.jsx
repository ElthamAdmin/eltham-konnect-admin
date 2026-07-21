import { useEffect, useMemo, useState } from "react";
import api from "../api";
import CompensationWorkflowPanel from "./CompensationWorkflowPanel";

const BLUE = "#0B3D91";
const BORDER = "#dbe3ef";
const MUTED = "#64748b";

function money(value) {
  return `JMD ${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value) {
  if (!value) return "Open-ended";

  const [year, month, day] = String(value).slice(0, 10).split("-");

  if (!year || !month || !day) return value;

  return `${day}/${month}/${year}`;
}

function statusStyle(status) {
  const styles = {
    Active: {
      backgroundColor: "#dcfce7",
      color: "#166534",
    },
    Draft: {
      backgroundColor: "#fef3c7",
      color: "#92400e",
    },
    Superseded: {
      backgroundColor: "#e2e8f0",
      color: "#475569",
    },
    Cancelled: {
      backgroundColor: "#fee2e2",
      color: "#991b1b",
    },
  };

  return {
    display: "inline-block",
    padding: "5px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "bold",
    ...(styles[status] || styles.Draft),
  };
}

function CompensationHistoryPanel({ employees = [] }) {
  const [employeeId, setEmployeeId] = useState("");
  const [status, setStatus] = useState("");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [refreshVersion, setRefreshVersion] = useState(0);

  useEffect(() => {
    if (!employeeId && employees.length > 0) {
      setEmployeeId(employees[0].employeeId);
    }
  }, [employeeId, employees]);

  useEffect(() => {
    if (!employeeId) {
      setRecords([]);
      return;
    }

    const loadRecords = async () => {
      try {
        setLoading(true);
        setLoadError("");

        const response = await api.get("/api/hr/compensation", {
          params: {
            employeeId,
            ...(status ? { status } : {}),
          },
        });

        setRecords(response.data.data || []);
      } catch (error) {
        console.error("Compensation history load failed:", error);

        setLoadError(
          error?.response?.data?.message ||
            "Could not load compensation history."
        );

        setRecords([]);
      } finally {
        setLoading(false);
      }
    };

    loadRecords();
    }, [employeeId, status, refreshVersion]);

  const selectedEmployee = useMemo(
    () =>
      employees.find(
        (employee) => employee.employeeId === employeeId
      ) || null,
    [employeeId, employees]
  );

  const activeRecords = useMemo(
    () => records.filter((record) => record.status === "Active"),
    [records]
  );

  const draftRecords = useMemo(
    () => records.filter((record) => record.status === "Draft"),
    [records]
  );

  const historicalRecords = useMemo(
    () =>
      records.filter((record) =>
        ["Superseded", "Cancelled"].includes(record.status)
      ),
    [records]
  );

  return (
    <div>
      <div
        style={{
          backgroundColor: "white",
          border: `1px solid ${BORDER}`,
          borderRadius: "14px",
          padding: "20px",
          marginBottom: "18px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h2 style={{ color: BLUE, margin: 0 }}>
              Compensation History
            </h2>

            <p style={{ color: MUTED, margin: "6px 0 0" }}>
              Effective-dated salary, wage, stipend and allowance
              records. Historical rates are preserved.
            </p>
          </div>

          <span
            style={{
              backgroundColor: "#eff6ff",
              color: BLUE,
              borderRadius: "999px",
              padding: "7px 12px",
              fontSize: "12px",
              fontWeight: "bold",
            }}
          >
            H2 Controlled History
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "12px",
            marginTop: "18px",
          }}
        >
          <label style={labelStyle}>
            Employee
            <select
              value={employeeId}
              onChange={(event) =>
                setEmployeeId(event.target.value)
              }
              style={inputStyle}
            >
              <option value="">Select employee</option>

              {employees.map((employee) => (
                <option
                  key={employee.employeeId}
                  value={employee.employeeId}
                >
                  {employee.fullName} ({employee.employeeId})
                </option>
              ))}
            </select>
          </label>

          <label style={labelStyle}>
            Record status
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              style={inputStyle}
            >
              <option value="">All statuses</option>
              <option value="Active">Active</option>
              <option value="Draft">Draft</option>
              <option value="Superseded">Superseded</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </label>
        </div>
      </div>

      {selectedEmployee && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(210px, 1fr))",
            gap: "12px",
            marginBottom: "18px",
          }}
        >
          <SummaryCard
            label="Selected Employee"
            value={selectedEmployee.fullName}
            detail={selectedEmployee.employeeId}
            color={BLUE}
          />

          <SummaryCard
            label="Active Components"
            value={activeRecords.length}
            detail="Currently effective records"
            color="#16a34a"
          />

          <SummaryCard
            label="Draft Records"
            value={draftRecords.length}
            detail="Awaiting review or activation"
            color="#d97706"
          />

          <SummaryCard
            label="Historical Records"
            value={historicalRecords.length}
            detail="Superseded or cancelled"
            color="#64748b"
          />
                </div>
      )}

      <CompensationWorkflowPanel
        employeeId={employeeId}
        records={records}
        onChanged={() =>
          setRefreshVersion(
            (currentVersion) => currentVersion + 1
          )
        }
      />

      {loading && (
        <div style={messagePanel}>
          Loading compensation history...
        </div>
      )}

      {!loading && loadError && (
        <div
          style={{
            ...messagePanel,
            backgroundColor: "#fef2f2",
            borderColor: "#fecaca",
            color: "#991b1b",
          }}
        >
          {loadError}
        </div>
      )}

      {!loading &&
        !loadError &&
        employeeId &&
        records.length === 0 && (
          <div style={messagePanel}>
            No compensation-history records were found for{" "}
            {selectedEmployee?.fullName || employeeId}.
          </div>
        )}

      {!loading && records.length > 0 && (
        <div
          style={{
            backgroundColor: "white",
            border: `1px solid ${BORDER}`,
            borderRadius: "14px",
            padding: "18px",
          }}
        >
          <h3 style={{ color: BLUE, marginTop: 0 }}>
            Effective-Dated Records
          </h3>

          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                minWidth: "1050px",
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr>
                  <HeaderCell>Record</HeaderCell>
                  <HeaderCell>Component</HeaderCell>
                  <HeaderCell>Type</HeaderCell>
                  <HeaderCell>Amount</HeaderCell>
                  <HeaderCell>Frequency</HeaderCell>
                  <HeaderCell>Effective Period</HeaderCell>
                  <HeaderCell>Status</HeaderCell>
                  <HeaderCell>Approval</HeaderCell>
                </tr>
              </thead>

              <tbody>
                {records.map((record) => (
                  <tr key={record.compensationNumber}>
                    <Cell>
                      <strong>{record.compensationNumber}</strong>
                      <div style={smallText}>
                        {record.changeReason || "No change reason"}
                      </div>
                    </Cell>

                    <Cell>
                      <strong>{record.componentName}</strong>
                      <div style={smallText}>
                        {record.componentCode}
                      </div>
                    </Cell>

                    <Cell>
                      {record.compensationType}
                      <div style={smallText}>
                        {record.compensationCategory}
                      </div>
                    </Cell>

                    <Cell>
                      <strong>{money(record.amount)}</strong>
                      <div style={smallText}>
                        Per {record.rateUnit}
                      </div>
                    </Cell>

                    <Cell>{record.payFrequency}</Cell>

                    <Cell>
                      {formatDate(record.effectiveFrom)}
                      <div style={smallText}>
                        to {formatDate(record.effectiveTo)}
                      </div>
                    </Cell>

                    <Cell>
                      <span style={statusStyle(record.status)}>
                        {record.status}
                      </span>
                    </Cell>

                    <Cell>
                      {record.approvedBy || "Not approved"}
                      <div style={smallText}>
                        {record.approvedAt
                          ? new Date(
                              record.approvedAt
                            ).toLocaleString()
                          : ""}
                      </div>
                    </Cell>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div
            style={{
              marginTop: "14px",
              padding: "12px",
              backgroundColor: "#f8fafc",
              border: `1px solid ${BORDER}`,
              borderRadius: "10px",
              color: MUTED,
              fontSize: "13px",
            }}
          >
            Legacy employee pay fields are historical snapshots only.
            Active compensation-history records are the controlled
            source for H2.
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, detail, color }) {
  return (
    <div
      style={{
        backgroundColor: "white",
        border: `1px solid ${BORDER}`,
        borderRadius: "12px",
        padding: "16px",
      }}
    >
      <div style={{ color: MUTED, fontSize: "13px" }}>
        {label}
      </div>

      <div
        style={{
          color,
          fontSize: "22px",
          fontWeight: "bold",
          marginTop: "6px",
        }}
      >
        {value}
      </div>

      <div style={{ ...smallText, marginTop: "4px" }}>
        {detail}
      </div>
    </div>
  );
}

function HeaderCell({ children }) {
  return (
    <th
      style={{
        backgroundColor: "#edf3fc",
        border: `1px solid ${BORDER}`,
        padding: "11px",
        textAlign: "left",
        color: "#1e293b",
        fontSize: "13px",
      }}
    >
      {children}
    </th>
  );
}

function Cell({ children }) {
  return (
    <td
      style={{
        border: `1px solid ${BORDER}`,
        padding: "11px",
        verticalAlign: "top",
        fontSize: "13px",
      }}
    >
      {children}
    </td>
  );
}

const labelStyle = {
  display: "grid",
  gap: "6px",
  color: "#334155",
  fontSize: "13px",
  fontWeight: "bold",
};

const inputStyle = {
  width: "100%",
  padding: "10px",
  border: `1px solid ${BORDER}`,
  borderRadius: "8px",
  backgroundColor: "white",
};

const smallText = {
  color: MUTED,
  fontSize: "12px",
  marginTop: "3px",
};

const messagePanel = {
  backgroundColor: "white",
  border: `1px dashed ${BORDER}`,
  borderRadius: "12px",
  padding: "30px",
  textAlign: "center",
  color: MUTED,
};

export default CompensationHistoryPanel;