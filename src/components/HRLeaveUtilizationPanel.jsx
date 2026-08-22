import {
  useEffect,
  useMemo,
  useState,
} from "react";

import api from "../api";

const ROYAL_BLUE = "#0B3D91";
const BORDER = "#dbe3ef";
const MUTED = "#64748b";
const WHITE = "#ffffff";

const formatYmd = (date) => {
  const year =
    date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getCurrentYearRange = () => {
  const now = new Date();

  return {
    startDate: `${now.getFullYear()}-01-01`,
    endDate: formatYmd(now),
  };
};

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  border: `1px solid ${BORDER}`,
  borderRadius: "8px",
  background: WHITE,
  boxSizing: "border-box",
};

const primaryButton = {
  border: "none",
  borderRadius: "8px",
  padding: "10px 14px",
  background: ROYAL_BLUE,
  color: WHITE,
  fontWeight: 700,
  cursor: "pointer",
};

const neutralButton = {
  ...primaryButton,
  background: "#e2e8f0",
  color: "#334155",
};

const cardStyle = {
  background: WHITE,
  border: `1px solid ${BORDER}`,
  borderRadius: "14px",
  padding: "18px",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: "900px",
};

const headerCellStyle = {
  padding: "10px",
  textAlign: "left",
  background: "#edf3fc",
  border: `1px solid ${BORDER}`,
  color: "#0f172a",
  whiteSpace: "nowrap",
};

const cellStyle = {
  padding: "10px",
  border: `1px solid ${BORDER}`,
  color: "#1e293b",
  verticalAlign: "top",
};

const formatNumber = (
  value,
  decimals = 2
) =>
  Number(value || 0).toFixed(
    decimals
  );

const formatHours = (value) =>
  `${formatNumber(value)} hrs`;

const formatUnits = (value) =>
  formatNumber(value, 2);

const balanceLabel = (
  balances = {}
) =>
  [
    `V: ${formatUnits(
      balances.Vacation
    )}`,
    `S: ${formatUnits(
      balances.Sick
    )}`,
    `E: ${formatUnits(
      balances.Emergency
    )}`,
    `O: ${formatUnits(
      balances.Other
    )}`,
  ].join(" · ");

function HRLeaveUtilizationPanel({
  employees = [],
}) {
  const yearRange = useMemo(
    () => getCurrentYearRange(),
    []
  );

  const [filters, setFilters] =
    useState({
      startDate:
        yearRange.startDate,
      endDate:
        yearRange.endDate,
      employeeId: "",
      department: "",
      branch: "",
      leaveType: "",
      status: "",
    });

  const [report, setReport] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const departmentOptions =
    useMemo(
      () =>
        [
          ...new Set(
            employees
              .map(
                (employee) =>
                  employee.department
              )
              .filter(Boolean)
          ),
        ].sort(),
      [employees]
    );

  const branchOptions =
    useMemo(
      () =>
        [
          ...new Set(
            employees
              .map(
                (employee) =>
                  employee.branch
              )
              .filter(Boolean)
          ),
        ].sort(),
      [employees]
    );

  const fetchReport = async (
    filterOverrides = filters
  ) => {
    try {
      setLoading(true);
      setError("");

      const params = {};

      Object.entries(
        filterOverrides || {}
      ).forEach(
        ([key, value]) => {
          const normalized =
            String(value || "")
              .trim();

          if (normalized) {
            params[key] =
              normalized;
          }
        }
      );

      const response =
        await api.get(
          "/api/hr-analytics/leave-utilization",
          {
            params,
          }
        );

      setReport(
        response.data || null
      );
    } catch (requestError) {
      console.error(
        "Leave utilization report load failed:",
        requestError
      );

      setReport(null);

      setError(
        requestError?.response
          ?.data?.message ||
          "Failed to load the leave utilization report."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const updateFilter = (
    field,
    value
  ) => {
    setFilters((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const resetFilters = () => {
    const resetValues = {
      startDate:
        yearRange.startDate,
      endDate:
        yearRange.endDate,
      employeeId: "",
      department: "",
      branch: "",
      leaveType: "",
      status: "",
    };

    setFilters(resetValues);
    fetchReport(resetValues);
  };

  const summary =
    report?.summary || {};

  const leaveTypes =
    report?.leaveTypeBreakdown ||
    [];

  const statuses =
    report?.statusBreakdown ||
    [];

  const employeeRegister =
    report?.employeeRegister ||
    [];

  const dailyTrend =
    report?.dailyTrend || [];

  const policies =
    report?.activePolicies || [];

  const statCards = [
    {
      label: "Employees",
      value:
        summary.totalEmployees ||
        0,
      color: ROYAL_BLUE,
      background: "#eef4ff",
    },
    {
      label: "Leave Requests",
      value:
        summary.totalRequests || 0,
      color: "#0891b2",
      background: "#ecfeff",
    },
    {
      label: "Approved Days",
      value: formatUnits(
        summary.approvedLeaveDays
      ),
      color: "#16a34a",
      background: "#f0fdf4",
    },
    {
      label: "Paid Leave",
      value: formatHours(
        summary.payableLeaveHours
      ),
      color: "#0f766e",
      background: "#f0fdfa",
    },
    {
      label: "Unpaid Leave",
      value: formatHours(
        summary.unpaidLeaveHours
      ),
      color: "#dc2626",
      background: "#fef2f2",
    },
    {
      label: "Balance Used",
      value: formatUnits(
        summary.balanceUnitsUsed
      ),
      color: "#7c3aed",
      background: "#f5f3ff",
    },
    {
      label: "Utilization Rate",
      value: `${formatNumber(
        summary.utilizationRate
      )}%`,
      color: "#d97706",
      background: "#fffbeb",
    },
    {
      label: "Pending Documents",
      value:
        summary.documentsPending ||
        0,
      color: "#be123c",
      background: "#fff1f2",
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gap: "20px",
      }}
    >
      <div style={cardStyle}>
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "flex-start",
            gap: "14px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h2
              style={{
                color: ROYAL_BLUE,
                margin: 0,
              }}
            >
              Leave Utilization and
              Balance Reporting
            </h2>

            <p
              style={{
                color: MUTED,
                marginBottom: 0,
              }}
            >
              Review controlled leave
              usage, paid and unpaid
              time, employee balances,
              supporting documents and
              payroll effects.
            </p>
          </div>

          <button
            type="button"
            style={primaryButton}
            onClick={() =>
              fetchReport()
            }
            disabled={loading}
          >
            {loading
              ? "Refreshing..."
              : "Refresh Leave Report"}
          </button>
        </div>
      </div>

      <div style={cardStyle}>
        <h3
          style={{
            color: ROYAL_BLUE,
            marginTop: 0,
          }}
        >
          Leave Filters
        </h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(170px, 1fr))",
            gap: "12px",
          }}
        >
          <input
            type="date"
            value={filters.startDate}
            onChange={(event) =>
              updateFilter(
                "startDate",
                event.target.value
              )
            }
            style={inputStyle}
          />

          <input
            type="date"
            value={filters.endDate}
            onChange={(event) =>
              updateFilter(
                "endDate",
                event.target.value
              )
            }
            style={inputStyle}
          />

          <select
            value={
              filters.employeeId
            }
            onChange={(event) =>
              updateFilter(
                "employeeId",
                event.target.value
              )
            }
            style={inputStyle}
          >
            <option value="">
              All Employees
            </option>

            {employees.map(
              (employee) => (
                <option
                  key={
                    employee.employeeId
                  }
                  value={
                    employee.employeeId
                  }
                >
                  {employee.fullName} —{" "}
                  {employee.employeeId}
                </option>
              )
            )}
          </select>

          <select
            value={
              filters.department
            }
            onChange={(event) =>
              updateFilter(
                "department",
                event.target.value
              )
            }
            style={inputStyle}
          >
            <option value="">
              All Departments
            </option>

            {departmentOptions.map(
              (department) => (
                <option
                  key={department}
                  value={department}
                >
                  {department}
                </option>
              )
            )}
          </select>

          <select
            value={filters.branch}
            onChange={(event) =>
              updateFilter(
                "branch",
                event.target.value
              )
            }
            style={inputStyle}
          >
            <option value="">
              All Branches
            </option>

            {branchOptions.map(
              (branch) => (
                <option
                  key={branch}
                  value={branch}
                >
                  {branch}
                </option>
              )
            )}
          </select>

          <select
            value={
              filters.leaveType
            }
            onChange={(event) =>
              updateFilter(
                "leaveType",
                event.target.value
              )
            }
            style={inputStyle}
          >
            <option value="">
              All Leave Types
            </option>
            <option value="Vacation">
              Vacation
            </option>
            <option value="Sick">
              Sick
            </option>
            <option value="Emergency">
              Emergency
            </option>
            <option value="Maternity">
              Maternity
            </option>
            <option value="Paternity">
              Paternity
            </option>
            <option value="Bereavement">
              Bereavement
            </option>
            <option value="Unpaid">
              Unpaid
            </option>
            <option value="Other">
              Other
            </option>
          </select>

          <select
            value={filters.status}
            onChange={(event) =>
              updateFilter(
                "status",
                event.target.value
              )
            }
            style={inputStyle}
          >
            <option value="">
              All Request Statuses
            </option>
            <option value="Draft">
              Draft
            </option>
            <option value="Pending">
              Pending
            </option>
            <option value="Submitted">
              Submitted
            </option>
            <option value="Manager Approved">
              Manager Approved
            </option>
            <option value="Approved">
              Approved
            </option>
            <option value="Completed">
              Completed
            </option>
            <option value="Rejected">
              Rejected
            </option>
            <option value="Cancelled">
              Cancelled
            </option>
          </select>
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            marginTop: "12px",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            style={primaryButton}
            onClick={() =>
              fetchReport()
            }
            disabled={loading}
          >
            Apply Filters
          </button>

          <button
            type="button"
            style={neutralButton}
            onClick={resetFilters}
            disabled={loading}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: "14px",
            borderRadius: "10px",
            border:
              "1px solid #fecaca",
            background: "#fef2f2",
            color: "#991b1b",
          }}
        >
          {error}
        </div>
      )}

      {!error && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(145px, 1fr))",
              gap: "12px",
            }}
          >
            {statCards.map(
              (card) => (
                <div
                  key={card.label}
                  style={{
                    ...cardStyle,
                    background:
                      card.background,
                  }}
                >
                  <div
                    style={{
                      color: card.color,
                      fontSize: "24px",
                      fontWeight: 800,
                    }}
                  >
                    {card.value}
                  </div>

                  <div
                    style={{
                      color: MUTED,
                      marginTop: "4px",
                    }}
                  >
                    {card.label}
                  </div>
                </div>
              )
            )}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "16px",
            }}
          >
            <div style={cardStyle}>
              <h3
                style={{
                  color: ROYAL_BLUE,
                  marginTop: 0,
                }}
              >
                Leave Types
              </h3>

              {leaveTypes.length ===
              0 ? (
                <div
                  style={{
                    color: MUTED,
                  }}
                >
                  No leave utilization
                  was found.
                </div>
              ) : (
                leaveTypes.map(
                  (item) => (
                    <div
                      key={
                        item.leaveType
                      }
                      style={{
                        padding:
                          "10px 0",
                        borderBottom:
                          `1px solid ${BORDER}`,
                      }}
                    >
                      <strong>
                        {item.leaveType}
                      </strong>

                      <div
                        style={{
                          color: MUTED,
                          marginTop: "4px",
                          fontSize:
                            "13px",
                        }}
                      >
                        {
                          item.approvedLeaveDays
                        }{" "}
                        approved days ·{" "}
                        {
                          item.approvedRequests
                        }{" "}
                        approved ·{" "}
                        {
                          item.pendingRequests
                        }{" "}
                        pending
                      </div>

                      <div
                        style={{
                          color: MUTED,
                          fontSize:
                            "13px",
                        }}
                      >
                        Paid{" "}
                        {formatHours(
                          item.payableLeaveHours
                        )}{" "}
                        · Unpaid{" "}
                        {formatHours(
                          item.unpaidLeaveHours
                        )}
                      </div>
                    </div>
                  )
                )
              )}
            </div>

            <div style={cardStyle}>
              <h3
                style={{
                  color: ROYAL_BLUE,
                  marginTop: 0,
                }}
              >
                Request Status
              </h3>

              {statuses.length === 0 ? (
                <div
                  style={{
                    color: MUTED,
                  }}
                >
                  No leave requests were
                  found.
                </div>
              ) : (
                statuses.map(
                  (item) => (
                    <div
                      key={item.status}
                      style={{
                        marginBottom:
                          "12px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent:
                            "space-between",
                          gap: "10px",
                        }}
                      >
                        <span>
                          {item.status}
                        </span>

                        <strong>
                          {item.count} (
                          {formatNumber(
                            item.percentage
                          )}
                          %)
                        </strong>
                      </div>

                      <div
                        style={{
                          height: "6px",
                          borderRadius:
                            "999px",
                          background:
                            "#e2e8f0",
                          marginTop:
                            "5px",
                          overflow:
                            "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${Math.min(
                              100,
                              Number(
                                item.percentage ||
                                  0
                              )
                            )}%`,
                            height:
                              "100%",
                            background:
                              ROYAL_BLUE,
                          }}
                        />
                      </div>
                    </div>
                  )
                )
              )}
            </div>
          </div>

          <div style={cardStyle}>
            <h3
              style={{
                color: ROYAL_BLUE,
                marginTop: 0,
              }}
            >
              Employee Leave Register
            </h3>

            <div
              style={{
                overflowX: "auto",
              }}
            >
              <table
                style={tableStyle}
              >
                <thead>
                  <tr>
                    <th
                      style={
                        headerCellStyle
                      }
                    >
                      Employee
                    </th>
                    <th
                      style={
                        headerCellStyle
                      }
                    >
                      Department
                    </th>
                    <th
                      style={
                        headerCellStyle
                      }
                    >
                      Branch
                    </th>
                    <th
                      style={
                        headerCellStyle
                      }
                    >
                      Requests
                    </th>
                    <th
                      style={
                        headerCellStyle
                      }
                    >
                      Approved Days
                    </th>
                    <th
                      style={
                        headerCellStyle
                      }
                    >
                      Paid
                    </th>
                    <th
                      style={
                        headerCellStyle
                      }
                    >
                      Unpaid
                    </th>
                    <th
                      style={
                        headerCellStyle
                      }
                    >
                      Balance Used
                    </th>
                    <th
                      style={
                        headerCellStyle
                      }
                    >
                      Current Balances
                    </th>
                    <th
                      style={
                        headerCellStyle
                      }
                    >
                      Controls
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {employeeRegister.length ===
                  0 ? (
                    <tr>
                      <td
                        colSpan="10"
                        style={{
                          ...cellStyle,
                          color: MUTED,
                          textAlign:
                            "center",
                        }}
                      >
                        No employees
                        matched the report
                        filters.
                      </td>
                    </tr>
                  ) : (
                    employeeRegister.map(
                      (employee) => (
                        <tr
                          key={
                            employee.employeeId
                          }
                        >
                          <td
                            style={
                              cellStyle
                            }
                          >
                            <strong>
                              {
                                employee.fullName
                              }
                            </strong>

                            <div
                              style={{
                                color:
                                  MUTED,
                                fontSize:
                                  "12px",
                              }}
                            >
                              {
                                employee.employeeId
                              }
                            </div>
                          </td>

                          <td
                            style={
                              cellStyle
                            }
                          >
                            {employee.department ||
                              "—"}
                          </td>

                          <td
                            style={
                              cellStyle
                            }
                          >
                            {employee.branch ||
                              "—"}
                          </td>

                          <td
                            style={
                              cellStyle
                            }
                          >
                            {
                              employee.totalRequests
                            }
                            <div
                              style={{
                                color:
                                  MUTED,
                                fontSize:
                                  "12px",
                              }}
                            >
                              {
                                employee.pendingRequests
                              }{" "}
                              pending
                            </div>
                          </td>

                          <td
                            style={
                              cellStyle
                            }
                          >
                            {formatUnits(
                              employee.approvedLeaveDays
                            )}
                          </td>

                          <td
                            style={
                              cellStyle
                            }
                          >
                            {formatHours(
                              employee.payableLeaveHours
                            )}
                          </td>

                          <td
                            style={
                              cellStyle
                            }
                          >
                            {formatHours(
                              employee.unpaidLeaveHours
                            )}
                          </td>

                          <td
                            style={
                              cellStyle
                            }
                          >
                            {formatUnits(
                              employee.balanceUnitsUsed
                            )}
                          </td>

                          <td
                            style={{
                              ...cellStyle,
                              minWidth:
                                "260px",
                            }}
                          >
                            {balanceLabel(
                              employee.currentBalances
                            )}
                          </td>

                          <td
                            style={
                              cellStyle
                            }
                          >
                            <div>
                              Documents:{" "}
                              {
                                employee.documentsPending
                              }
                            </div>
                            <div>
                              Payroll:{" "}
                              {
                                employee.payrollEffectsPending
                              }
                            </div>
                          </td>
                        </tr>
                      )
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div style={cardStyle}>
            <h3
              style={{
                color: ROYAL_BLUE,
                marginTop: 0,
              }}
            >
              Approved Leave Trend
            </h3>

            <div
              style={{
                overflowX: "auto",
              }}
            >
              <table
                style={{
                  ...tableStyle,
                  minWidth: "650px",
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={
                        headerCellStyle
                      }
                    >
                      Date
                    </th>
                    <th
                      style={
                        headerCellStyle
                      }
                    >
                      Employees
                    </th>
                    <th
                      style={
                        headerCellStyle
                      }
                    >
                      Leave Days
                    </th>
                    <th
                      style={
                        headerCellStyle
                      }
                    >
                      Paid Hours
                    </th>
                    <th
                      style={
                        headerCellStyle
                      }
                    >
                      Unpaid Hours
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {dailyTrend.length ===
                  0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        style={{
                          ...cellStyle,
                          color: MUTED,
                          textAlign:
                            "center",
                        }}
                      >
                        No approved leave
                        occurred during
                        this period.
                      </td>
                    </tr>
                  ) : (
                    dailyTrend.map(
                      (day) => (
                        <tr
                          key={
                            day.workDate
                          }
                        >
                          <td
                            style={
                              cellStyle
                            }
                          >
                            {
                              day.workDate
                            }
                          </td>
                          <td
                            style={
                              cellStyle
                            }
                          >
                            {
                              day.employeesOnLeave
                            }
                          </td>
                          <td
                            style={
                              cellStyle
                            }
                          >
                            {
                              day.leaveDays
                            }
                          </td>
                          <td
                            style={
                              cellStyle
                            }
                          >
                            {formatHours(
                              day.payableLeaveHours
                            )}
                          </td>
                          <td
                            style={
                              cellStyle
                            }
                          >
                            {formatHours(
                              day.unpaidLeaveHours
                            )}
                          </td>
                        </tr>
                      )
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div style={cardStyle}>
            <h3
              style={{
                color: ROYAL_BLUE,
                marginTop: 0,
              }}
            >
              Effective Leave Policies
            </h3>

            <div
              style={{
                overflowX: "auto",
              }}
            >
              <table
                style={{
                  ...tableStyle,
                  minWidth: "750px",
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={
                        headerCellStyle
                      }
                    >
                      Policy
                    </th>
                    <th
                      style={
                        headerCellStyle
                      }
                    >
                      Leave Type
                    </th>
                    <th
                      style={
                        headerCellStyle
                      }
                    >
                      Classification
                    </th>
                    <th
                      style={
                        headerCellStyle
                      }
                    >
                      Pay Treatment
                    </th>
                    <th
                      style={
                        headerCellStyle
                      }
                    >
                      Balance
                    </th>
                    <th
                      style={
                        headerCellStyle
                      }
                    >
                      Effective Period
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {policies.length ===
                  0 ? (
                    <tr>
                      <td
                        colSpan="6"
                        style={{
                          ...cellStyle,
                          color: MUTED,
                          textAlign:
                            "center",
                        }}
                      >
                        No active leave
                        policies apply to
                        this report period.
                      </td>
                    </tr>
                  ) : (
                    policies.map(
                      (policy) => (
                        <tr
                          key={
                            policy.policyCode
                          }
                        >
                          <td
                            style={
                              cellStyle
                            }
                          >
                            <strong>
                              {
                                policy.policyName
                              }
                            </strong>
                            <div
                              style={{
                                color:
                                  MUTED,
                                fontSize:
                                  "12px",
                              }}
                            >
                              {
                                policy.policyCode
                              }
                            </div>
                          </td>
                          <td
                            style={
                              cellStyle
                            }
                          >
                            {
                              policy.leaveType
                            }
                          </td>
                          <td
                            style={
                              cellStyle
                            }
                          >
                            {
                              policy.legalClassification
                            }
                          </td>
                          <td
                            style={
                              cellStyle
                            }
                          >
                            {
                              policy.payTreatment
                            }
                          </td>
                          <td
                            style={
                              cellStyle
                            }
                          >
                            {policy.balanceTracked
                              ? policy.balanceType ||
                                "Tracked"
                              : "Not tracked"}
                          </td>
                          <td
                            style={
                              cellStyle
                            }
                          >
                            {
                              policy.effectiveFrom
                            }{" "}
                            to{" "}
                            {policy.effectiveTo ||
                              "Open"}
                          </td>
                        </tr>
                      )
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {summary.legacyEstimatedRequests >
            0 && (
            <div
              style={{
                padding: "14px",
                borderRadius:
                  "10px",
                border:
                  "1px solid #fde68a",
                background:
                  "#fffbeb",
                color: "#92400e",
              }}
            >
              {
                summary.legacyEstimatedRequests
              }{" "}
              legacy request(s) did not
              contain a controlled daily
              breakdown. Their period
              totals were proportionally
              estimated for reporting.
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default HRLeaveUtilizationPanel;