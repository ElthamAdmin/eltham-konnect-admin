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

const getCurrentMonthRange = () => {
  const now = new Date();

  const year = now.getFullYear();
  const month = now.getMonth();

  const startDate = new Date(
    year,
    month,
    1
  )
    .toLocaleDateString("en-CA");

  const endDate = new Date(
    year,
    month + 1,
    0
  )
    .toLocaleDateString("en-CA");

  return {
    startDate,
    endDate,
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

const formatHours = (value) =>
  `${Number(value || 0).toFixed(2)} hrs`;

function HRAttendanceReportingPanel({
  employees = [],
}) {
  const monthRange =
    useMemo(
      () => getCurrentMonthRange(),
      []
    );

  const [filters, setFilters] =
    useState({
      startDate:
        monthRange.startDate,
      endDate:
        monthRange.endDate,
      employeeId: "",
      department: "",
      branch: "",
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

  const fetchAttendanceReport =
    async (
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
            const normalizedValue =
              String(value || "")
                .trim();

            if (normalizedValue) {
              params[key] =
                normalizedValue;
            }
          }
        );

        const response =
          await api.get(
            "/api/hr-analytics/attendance",
            {
              params,
            }
          );

        setReport(
          response.data || null
        );
      } catch (requestError) {
        console.error(
          "Attendance report load failed:",
          requestError
        );

        setReport(null);

        setError(
          requestError?.response
            ?.data?.message ||
            "Failed to load the attendance and lateness report."
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchAttendanceReport();
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
    const clearedFilters = {
      startDate:
        monthRange.startDate,
      endDate:
        monthRange.endDate,
      employeeId: "",
      department: "",
      branch: "",
      status: "",
    };

    setFilters(clearedFilters);
    fetchAttendanceReport(
      clearedFilters
    );
  };

  const summary =
    report?.summary || {};

  const employeeRegister =
    report?.employeeRegister || [];

  const dailyTrend =
    report?.dailyTrend || [];

  const statCards = [
    {
      label: "Employees",
      value:
        summary.totalEmployees || 0,
      color: ROYAL_BLUE,
      background: "#eef4ff",
    },
    {
      label: "Attendance Rate",
      value:
        `${Number(
          summary.attendanceRate || 0
        ).toFixed(2)}%`,
      color: "#16a34a",
      background: "#f0fdf4",
    },
    {
      label: "Payable Time",
      value:
        formatHours(
          summary.payableHours
        ),
      color: "#0891b2",
      background: "#ecfeff",
    },
    {
      label: "Late Time",
      value:
        formatHours(
          summary.lateHours
        ),
      color: "#d97706",
      background: "#fffbeb",
    },
    {
      label: "Absence",
      value:
        formatHours(
          summary.absenceHours
        ),
      color: "#dc2626",
      background: "#fef2f2",
    },
    {
      label: "Overtime",
      value:
        formatHours(
          summary.overtimeHours
        ),
      color: "#7c3aed",
      background: "#f5f3ff",
    },
    {
      label: "Exceptions",
      value:
        summary.exceptionDays || 0,
      color: "#be123c",
      background: "#fff1f2",
    },
    {
      label: "Pending Adjustments",
      value:
        summary.pendingAdjustments ||
        0,
      color: "#b45309",
      background: "#fff7ed",
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
              Attendance and Lateness
              Reporting
            </h2>

            <p
              style={{
                color: MUTED,
                marginBottom: 0,
              }}
            >
              Review scheduled versus
              payable time, lateness,
              absence, overtime,
              exceptions and attendance
              adjustments.
            </p>
          </div>

          <button
            type="button"
            style={primaryButton}
            onClick={() =>
              fetchAttendanceReport()
            }
            disabled={loading}
          >
            {loading
              ? "Refreshing..."
              : "Refresh Attendance"}
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
          Attendance Filters
        </h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px, 1fr))",
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
            value={filters.employeeId}
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
            value={filters.department}
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
              All Period Statuses
            </option>
            <option value="Draft">
              Draft
            </option>
            <option value="Submitted">
              Submitted
            </option>
            <option value="Manager Approved">
              Manager Approved
            </option>
            <option value="Payroll Ready">
              Payroll Ready
            </option>
            <option value="Locked">
              Locked
            </option>
            <option value="Reopened">
              Reopened
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
            flexWrap: "wrap",
            marginTop: "14px",
          }}
        >
          <button
            type="button"
            style={primaryButton}
            onClick={() =>
              fetchAttendanceReport()
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
            background: "#fef2f2",
            border:
              "1px solid #fecaca",
            color: "#991b1b",
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(155px, 1fr))",
          gap: "14px",
        }}
      >
        {statCards.map((card) => (
          <div
            key={card.label}
            style={{
              background:
                card.background,
              border:
                `1px solid ${BORDER}`,
              borderRadius: "12px",
              padding: "16px",
            }}
          >
            <div
              style={{
                color: card.color,
                fontSize: "25px",
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
        ))}
      </div>

      <div style={cardStyle}>
        <h3
          style={{
            color: ROYAL_BLUE,
            marginTop: 0,
          }}
        >
          Employee Attendance Register
        </h3>

        <div
          style={{
            overflowX: "auto",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse:
                "collapse",
              minWidth: "1180px",
            }}
          >
            <thead>
              <tr
                style={{
                  background: "#eef4ff",
                }}
              >
                {[
                  "Employee",
                  "Department",
                  "Branch",
                  "Scheduled",
                  "Payable",
                  "Late",
                  "Absence",
                  "Overtime",
                  "Present",
                  "Absent",
                  "Exceptions",
                  "Rate",
                ].map((heading) => (
                  <th
                    key={heading}
                    style={{
                      padding: "10px",
                      textAlign: "left",
                      border:
                        `1px solid ${BORDER}`,
                    }}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {employeeRegister.length ===
              0 ? (
                <tr>
                  <td
                    colSpan="12"
                    style={{
                      padding: "18px",
                      textAlign: "center",
                      color: MUTED,
                      border:
                        `1px solid ${BORDER}`,
                    }}
                  >
                    No controlled attendance
                    records match the selected
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
                        style={{
                          padding: "10px",
                          border:
                            `1px solid ${BORDER}`,
                        }}
                      >
                        <strong>
                          {employee.fullName}
                        </strong>

                        <div
                          style={{
                            color: MUTED,
                            fontSize: "12px",
                          }}
                        >
                          {
                            employee.employeeId
                          }
                        </div>
                      </td>

                      <td
                        style={{
                          padding: "10px",
                          border:
                            `1px solid ${BORDER}`,
                        }}
                      >
                        {employee.department ||
                          "-"}
                      </td>

                      <td
                        style={{
                          padding: "10px",
                          border:
                            `1px solid ${BORDER}`,
                        }}
                      >
                        {employee.branch || "-"}
                      </td>

                      <td
                        style={{
                          padding: "10px",
                          border:
                            `1px solid ${BORDER}`,
                        }}
                      >
                        {formatHours(
                          employee
                            .scheduledHours
                        )}
                      </td>

                      <td
                        style={{
                          padding: "10px",
                          border:
                            `1px solid ${BORDER}`,
                        }}
                      >
                        {formatHours(
                          employee.payableHours
                        )}
                      </td>

                      <td
                        style={{
                          padding: "10px",
                          border:
                            `1px solid ${BORDER}`,
                          color:
                            employee.lateMinutes >
                            0
                              ? "#d97706"
                              : "inherit",
                        }}
                      >
                        {formatHours(
                          employee.lateHours
                        )}
                      </td>

                      <td
                        style={{
                          padding: "10px",
                          border:
                            `1px solid ${BORDER}`,
                          color:
                            employee
                              .absenceMinutes >
                            0
                              ? "#dc2626"
                              : "inherit",
                        }}
                      >
                        {formatHours(
                          employee.absenceHours
                        )}
                      </td>

                      <td
                        style={{
                          padding: "10px",
                          border:
                            `1px solid ${BORDER}`,
                        }}
                      >
                        {formatHours(
                          employee.overtimeHours
                        )}
                      </td>

                      <td
                        style={{
                          padding: "10px",
                          border:
                            `1px solid ${BORDER}`,
                        }}
                      >
                        {employee.presentDays}
                      </td>

                      <td
                        style={{
                          padding: "10px",
                          border:
                            `1px solid ${BORDER}`,
                        }}
                      >
                        {employee.absentDays}
                      </td>

                      <td
                        style={{
                          padding: "10px",
                          border:
                            `1px solid ${BORDER}`,
                        }}
                      >
                        {employee.exceptionDays}
                      </td>

                      <td
                        style={{
                          padding: "10px",
                          border:
                            `1px solid ${BORDER}`,
                          fontWeight: 700,
                        }}
                      >
                        {Number(
                          employee.attendanceRate ||
                            0
                        ).toFixed(2)}
                        %
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
          Daily Attendance Trend
        </h3>

        <div
          style={{
            overflowX: "auto",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse:
                "collapse",
              minWidth: "900px",
            }}
          >
            <thead>
              <tr
                style={{
                  background: "#eef4ff",
                }}
              >
                {[
                  "Date",
                  "Scheduled",
                  "Payable",
                  "Late",
                  "Absence",
                  "Overtime",
                  "Present",
                  "Absent",
                  "Exceptions",
                ].map((heading) => (
                  <th
                    key={heading}
                    style={{
                      padding: "10px",
                      textAlign: "left",
                      border:
                        `1px solid ${BORDER}`,
                    }}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {dailyTrend.length === 0 ? (
                <tr>
                  <td
                    colSpan="9"
                    style={{
                      padding: "18px",
                      textAlign: "center",
                      color: MUTED,
                      border:
                        `1px solid ${BORDER}`,
                    }}
                  >
                    No daily attendance data
                    was found.
                  </td>
                </tr>
              ) : (
                dailyTrend.map((day) => (
                  <tr key={day.workDate}>
                    <td
                      style={{
                        padding: "10px",
                        border:
                          `1px solid ${BORDER}`,
                      }}
                    >
                      {day.workDate}
                    </td>

                    <td
                      style={{
                        padding: "10px",
                        border:
                          `1px solid ${BORDER}`,
                      }}
                    >
                      {formatHours(
                        day.scheduledHours
                      )}
                    </td>

                    <td
                      style={{
                        padding: "10px",
                        border:
                          `1px solid ${BORDER}`,
                      }}
                    >
                      {formatHours(
                        day.payableHours
                      )}
                    </td>

                    <td
                      style={{
                        padding: "10px",
                        border:
                          `1px solid ${BORDER}`,
                      }}
                    >
                      {formatHours(
                        day.lateHours
                      )}
                    </td>

                    <td
                      style={{
                        padding: "10px",
                        border:
                          `1px solid ${BORDER}`,
                      }}
                    >
                      {formatHours(
                        day.absenceHours
                      )}
                    </td>

                    <td
                      style={{
                        padding: "10px",
                        border:
                          `1px solid ${BORDER}`,
                      }}
                    >
                      {formatHours(
                        day.overtimeHours
                      )}
                    </td>

                    <td
                      style={{
                        padding: "10px",
                        border:
                          `1px solid ${BORDER}`,
                      }}
                    >
                      {day.presentEmployees}
                    </td>

                    <td
                      style={{
                        padding: "10px",
                        border:
                          `1px solid ${BORDER}`,
                      }}
                    >
                      {day.absentEmployees}
                    </td>

                    <td
                      style={{
                        padding: "10px",
                        border:
                          `1px solid ${BORDER}`,
                      }}
                    >
                      {day.exceptionEmployees}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default HRAttendanceReportingPanel;