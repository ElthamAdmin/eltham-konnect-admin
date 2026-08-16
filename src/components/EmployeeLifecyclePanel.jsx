import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import api from "../api";

const CASE_TYPE_OPTIONS = [
  "Onboarding",
  "Offboarding",
];

const INITIAL_FORM = {
  employeeId: "",
  caseType: "Onboarding",
  reason: "",
  plannedEffectiveDate: "",
};

const normalizeArray = (value) =>
  Array.isArray(value) ? value : [];

const getErrorMessage = (
  error,
  fallback
) =>
  error?.response?.data?.message ||
  fallback;

const getStatusColor = (status) => {
  const normalizedStatus =
    String(status || "").toLowerCase();

  if (
    normalizedStatus ===
      "completed" ||
    normalizedStatus ===
      "ready for completion"
  ) {
    return {
      backgroundColor: "#dcfce7",
      color: "#166534",
    };
  }

  if (
    normalizedStatus ===
      "blocked" ||
    normalizedStatus ===
      "cancelled"
  ) {
    return {
      backgroundColor: "#fee2e2",
      color: "#991b1b",
    };
  }

  if (
    normalizedStatus ===
      "approved" ||
    normalizedStatus ===
      "in progress"
  ) {
    return {
      backgroundColor: "#dbeafe",
      color: "#1e40af",
    };
  }

  return {
    backgroundColor: "#fef3c7",
    color: "#92400e",
  };
};

function EmployeeLifecyclePanel({
  employees = [],
}) {
  const ROYAL_BLUE = "#0B3D91";
  const BORDER = "#dbe3ef";
  const MUTED = "#64748b";
  const WHITE = "#ffffff";

  const [cases, setCases] =
    useState([]);
  const [selectedCase, setSelectedCase] =
    useState(null);
  const [form, setForm] =
    useState(INITIAL_FORM);
  const [showCreateForm, setShowCreateForm] =
    useState(false);
  const [loading, setLoading] =
    useState(false);
  const [saving, setSaving] =
    useState(false);
  const [error, setError] =
    useState("");
  const [notice, setNotice] =
    useState("");

  const cardStyle = {
    backgroundColor: WHITE,
    border: `1px solid ${BORDER}`,
    borderRadius: "14px",
    padding: "18px",
  };

  const fieldStyle = {
    width: "100%",
    boxSizing: "border-box",
    border: `1px solid ${BORDER}`,
    borderRadius: "8px",
    padding: "10px",
    backgroundColor: WHITE,
  };

  const primaryButtonStyle = {
    border: "none",
    borderRadius: "8px",
    backgroundColor: ROYAL_BLUE,
    color: WHITE,
    padding: "10px 14px",
    fontWeight: "bold",
    cursor: "pointer",
  };

  const secondaryButtonStyle = {
    border: "none",
    borderRadius: "8px",
    backgroundColor: "#e8eef7",
    color: ROYAL_BLUE,
    padding: "10px 14px",
    fontWeight: "bold",
    cursor: "pointer",
  };

  const activeCases = useMemo(
    () =>
      cases.filter(
        (item) =>
          ![
            "Completed",
            "Cancelled",
          ].includes(item?.status)
      ),
    [cases]
  );

  const onboardingCount = useMemo(
    () =>
      cases.filter(
        (item) =>
          item?.caseType ===
          "Onboarding"
      ).length,
    [cases]
  );

  const offboardingCount = useMemo(
    () =>
      cases.filter(
        (item) =>
          item?.caseType ===
          "Offboarding"
      ).length,
    [cases]
  );

  const completedCount = useMemo(
    () =>
      cases.filter(
        (item) =>
          item?.status ===
          "Completed"
      ).length,
    [cases]
  );

  const resetMessages = () => {
    setError("");
    setNotice("");
  };

  const loadCases = useCallback(
    async () => {
      setLoading(true);
      setError("");

      try {
        const response =
          await api.get(
            "/api/employee-lifecycle"
          );

        setCases(
          normalizeArray(
            response?.data?.data
          )
        );
      } catch (requestError) {
        setCases([]);
        setError(
          getErrorMessage(
            requestError,
            "Failed to load controlled employee lifecycle cases."
          )
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  const loadCaseDetails = async (
    lifecycleCaseNumber
  ) => {
    if (!lifecycleCaseNumber) return;

    resetMessages();
    setLoading(true);

    try {
      const response =
        await api.get(
          `/api/employee-lifecycle/${lifecycleCaseNumber}`
        );

      setSelectedCase(
        response?.data?.data ||
          null
      );
    } catch (requestError) {
      setSelectedCase(null);
      setError(
        getErrorMessage(
          requestError,
          "Failed to retrieve the controlled employee lifecycle case."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const updateForm = (
    field,
    value
  ) => {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  };

  const createCaseDraft = async (
    event
  ) => {
    event.preventDefault();
    resetMessages();

    if (!form.employeeId) {
      setError(
        "Select the employee for this lifecycle case."
      );
      return;
    }

    if (!form.reason.trim()) {
      setError(
        "Enter the reason for this lifecycle case."
      );
      return;
    }

    if (!form.plannedEffectiveDate) {
      setError(
        "Select the planned effective date."
      );
      return;
    }

    setSaving(true);

    try {
      const response =
        await api.post(
          "/api/employee-lifecycle",
          {
            employeeId:
              form.employeeId,
            caseType:
              form.caseType,
            reason:
              form.reason.trim(),
            plannedEffectiveDate:
              form.plannedEffectiveDate,
          }
        );

      const createdCase =
        response?.data?.data ||
        null;

      setNotice(
        response?.data?.message ||
          "Employee lifecycle draft created successfully."
      );

      setForm(INITIAL_FORM);
      setShowCreateForm(false);

      await loadCases();

      if (
        createdCase
          ?.lifecycleCaseNumber
      ) {
        setSelectedCase(
          createdCase
        );
      }
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "Failed to create the controlled employee lifecycle draft."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        display: "grid",
        gap: "18px",
      }}
    >
      <div style={cardStyle}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent:
              "space-between",
            gap: "12px",
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
              Controlled Onboarding
              and Offboarding
            </h2>

            <div
              style={{
                color: MUTED,
                marginTop: "5px",
              }}
            >
              Manage approvals,
              checklists, system access,
              property custody,
              probation, final payroll
              and lifecycle completion.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              style={
                secondaryButtonStyle
              }
              onClick={loadCases}
              disabled={loading}
            >
              {loading
                ? "Refreshing..."
                : "Refresh Cases"}
            </button>

            <button
              type="button"
              style={
                primaryButtonStyle
              }
              onClick={() => {
                resetMessages();
                setShowCreateForm(
                  (currentValue) =>
                    !currentValue
                );
              }}
            >
              {showCreateForm
                ? "Hide Draft Form"
                : "Create Lifecycle Draft"}
            </button>
          </div>
        </div>
      </div>

      {(error || notice) && (
        <div
          style={{
            ...cardStyle,
            borderColor: error
              ? "#fecaca"
              : "#bbf7d0",
            backgroundColor: error
              ? "#fff1f2"
              : "#f0fdf4",
            color: error
              ? "#b91c1c"
              : "#166534",
          }}
        >
          {error || notice}
        </div>
      )}

      {showCreateForm && (
        <form
          style={cardStyle}
          onSubmit={
            createCaseDraft
          }
        >
          <h3
            style={{
              color: ROYAL_BLUE,
              marginTop: 0,
            }}
          >
            New Controlled Lifecycle
            Draft
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "14px",
            }}
          >
            <label>
              <div
                style={{
                  fontWeight: "bold",
                  marginBottom: "6px",
                }}
              >
                Employee
              </div>

              <select
                style={fieldStyle}
                value={
                  form.employeeId
                }
                onChange={(event) =>
                  updateForm(
                    "employeeId",
                    event.target.value
                  )
                }
              >
                <option value="">
                  Select employee
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
                      {employee.fullName} (
                      {
                        employee.employeeId
                      })
                    </option>
                  )
                )}
              </select>
            </label>

            <label>
              <div
                style={{
                  fontWeight: "bold",
                  marginBottom: "6px",
                }}
              >
                Case type
              </div>

              <select
                style={fieldStyle}
                value={form.caseType}
                onChange={(event) =>
                  updateForm(
                    "caseType",
                    event.target.value
                  )
                }
              >
                {CASE_TYPE_OPTIONS.map(
                  (caseType) => (
                    <option
                      key={caseType}
                      value={caseType}
                    >
                      {caseType}
                    </option>
                  )
                )}
              </select>
            </label>

            <label>
              <div
                style={{
                  fontWeight: "bold",
                  marginBottom: "6px",
                }}
              >
                Planned effective date
              </div>

              <input
                type="date"
                style={fieldStyle}
                value={
                  form.plannedEffectiveDate
                }
                onChange={(event) =>
                  updateForm(
                    "plannedEffectiveDate",
                    event.target.value
                  )
                }
              />
            </label>
          </div>

          <label
            style={{
              display: "block",
              marginTop: "14px",
            }}
          >
            <div
              style={{
                fontWeight: "bold",
                marginBottom: "6px",
              }}
            >
              Reason
            </div>

            <textarea
              style={{
                ...fieldStyle,
                minHeight: "90px",
                resize: "vertical",
              }}
              value={form.reason}
              onChange={(event) =>
                updateForm(
                  "reason",
                  event.target.value
                )
              }
              placeholder="Enter the controlled onboarding or offboarding reason"
            />
          </label>

          <button
            type="submit"
            style={{
              ...primaryButtonStyle,
              marginTop: "14px",
              opacity: saving
                ? 0.7
                : 1,
            }}
            disabled={saving}
          >
            {saving
              ? "Creating Draft..."
              : "Create Draft"}
          </button>
        </form>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(170px, 1fr))",
          gap: "14px",
        }}
      >
        {[
          [
            cases.length,
            "Lifecycle Cases",
            ROYAL_BLUE,
          ],
          [
            activeCases.length,
            "Active",
            "#d97706",
          ],
          [
            onboardingCount,
            "Onboarding",
            "#0f766e",
          ],
          [
            offboardingCount,
            "Offboarding",
            "#7c3aed",
          ],
          [
            completedCount,
            "Completed",
            "#16a34a",
          ],
        ].map(
          ([
            value,
            label,
            color,
          ]) => (
            <div
              key={label}
              style={cardStyle}
            >
              <div
                style={{
                  color,
                  fontSize: "26px",
                  fontWeight: "bold",
                }}
              >
                {value}
              </div>

              <div
                style={{
                  color: MUTED,
                  marginTop: "4px",
                }}
              >
                {label}
              </div>
            </div>
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
          Controlled Lifecycle
          Register
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
              <tr>
                {[
                  "Case",
                  "Employee",
                  "Type",
                  "Planned Date",
                  "Status",
                  "Checklist",
                  "Action",
                ].map((heading) => (
                  <th
                    key={heading}
                    style={{
                      border:
                        `1px solid ${BORDER}`,
                      backgroundColor:
                        "#edf3fc",
                      padding: "10px",
                      textAlign: "left",
                    }}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {cases.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    style={{
                      border:
                        `1px solid ${BORDER}`,
                      padding: "24px",
                      color: MUTED,
                      textAlign:
                        "center",
                    }}
                  >
                    {loading
                      ? "Loading lifecycle cases..."
                      : "No controlled employee lifecycle cases were found."}
                  </td>
                </tr>
              ) : (
                cases.map(
                  (lifecycleCase) => {
                    const checklist =
                      normalizeArray(
                        lifecycleCase
                          ?.checklistItems
                      );

                    const completedItems =
                      checklist.filter(
                        (item) =>
                          [
                            "Completed",
                            "Not Required",
                          ].includes(
                            item?.status
                          )
                      ).length;

                    return (
                      <tr
                        key={
                          lifecycleCase
                            .lifecycleCaseNumber
                        }
                      >
                        <td
                          style={{
                            border:
                              `1px solid ${BORDER}`,
                            padding:
                              "10px",
                            fontWeight:
                              "bold",
                            color:
                              ROYAL_BLUE,
                          }}
                        >
                          {
                            lifecycleCase
                              .lifecycleCaseNumber
                          }
                        </td>

                        <td
                          style={{
                            border:
                              `1px solid ${BORDER}`,
                            padding:
                              "10px",
                          }}
                        >
                          {lifecycleCase
                            ?.employeeSnapshot
                            ?.fullName ||
                            lifecycleCase
                              ?.employeeName ||
                            lifecycleCase
                              ?.employeeId ||
                            "-"}
                        </td>

                        <td
                          style={{
                            border:
                              `1px solid ${BORDER}`,
                            padding:
                              "10px",
                          }}
                        >
                          {
                            lifecycleCase.caseType
                          }
                        </td>

                        <td
                          style={{
                            border:
                              `1px solid ${BORDER}`,
                            padding:
                              "10px",
                          }}
                        >
                          {lifecycleCase
                            .plannedEffectiveDate
                            ? String(
                                lifecycleCase
                                  .plannedEffectiveDate
                              ).slice(
                                0,
                                10
                              )
                            : "-"}
                        </td>

                        <td
                          style={{
                            border:
                              `1px solid ${BORDER}`,
                            padding:
                              "10px",
                          }}
                        >
                          <span
                            style={{
                              ...getStatusColor(
                                lifecycleCase.status
                              ),
                              borderRadius:
                                "999px",
                              display:
                                "inline-block",
                              padding:
                                "5px 9px",
                              fontSize:
                                "12px",
                              fontWeight:
                                "bold",
                            }}
                          >
                            {
                              lifecycleCase.status
                            }
                          </span>
                        </td>

                        <td
                          style={{
                            border:
                              `1px solid ${BORDER}`,
                            padding:
                              "10px",
                          }}
                        >
                          {completedItems}/
                          {checklist.length}
                        </td>

                        <td
                          style={{
                            border:
                              `1px solid ${BORDER}`,
                            padding:
                              "10px",
                          }}
                        >
                          <button
                            type="button"
                            style={
                              secondaryButtonStyle
                            }
                            onClick={() =>
                              loadCaseDetails(
                                lifecycleCase
                                  .lifecycleCaseNumber
                              )
                            }
                          >
                            Open
                          </button>
                        </td>
                      </tr>
                    );
                  }
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedCase && (
        <div style={cardStyle}>
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <h3
                style={{
                  color: ROYAL_BLUE,
                  marginTop: 0,
                  marginBottom:
                    "6px",
                }}
              >
                {
                  selectedCase.lifecycleCaseNumber
                }{" "}
                — Case Details
              </h3>

              <div
                style={{
                  color: MUTED,
                }}
              >
                {selectedCase.caseType} ·{" "}
                {selectedCase.status}
              </div>
            </div>

            <button
              type="button"
              style={
                secondaryButtonStyle
              }
              onClick={() =>
                setSelectedCase(null)
              }
            >
              Close Details
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(210px, 1fr))",
              gap: "14px",
              marginTop: "18px",
            }}
          >
            <div>
              <strong>Employee</strong>
              <div>
                {selectedCase
                  ?.employeeSnapshot
                  ?.fullName ||
                  selectedCase
                    ?.employeeId ||
                  "-"}
              </div>
            </div>

            <div>
              <strong>Case type</strong>
              <div>
                {selectedCase.caseType}
              </div>
            </div>

            <div>
              <strong>Status</strong>
              <div>
                {selectedCase.status}
              </div>
            </div>

            <div>
              <strong>
                Planned effective date
              </strong>
              <div>
                {selectedCase
                  .plannedEffectiveDate
                  ? String(
                      selectedCase
                        .plannedEffectiveDate
                    ).slice(0, 10)
                  : "-"}
              </div>
            </div>

            <div>
              <strong>
                Actual effective date
              </strong>
              <div>
                {selectedCase
                  .actualEffectiveDate
                  ? String(
                      selectedCase
                        .actualEffectiveDate
                    ).slice(0, 10)
                  : "-"}
              </div>
            </div>

            <div>
              <strong>
                Completion summary
              </strong>
              <div>
                {selectedCase
                  .completionSummary ||
                  "-"}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmployeeLifecyclePanel;