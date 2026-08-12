import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../api";
import PerformanceReviewWorkflowPanel from "./PerformanceReviewWorkflowPanel";
import PerformanceSelfAssessmentPanel from "./PerformanceSelfAssessmentPanel";
import PerformanceManagerAssessmentPanel from "./PerformanceManagerAssessmentPanel";
import PerformanceHrReviewPanel from "./PerformanceHrReviewPanel";

const REVIEW_TYPES = [
  "Annual",
  "Probation",
  "Quarterly",
  "Mid-Year",
  "Project",
  "Improvement Plan",
  "Other",
];

const todayYmd = () => {
  const now = new Date();
  const offset =
    now.getTimezoneOffset() * 60000;

  return new Date(
    now.getTime() - offset
  )
    .toISOString()
    .slice(0, 10);
};

const emptyDraftForm = {
  employeeId: "",
  cycleCode: "",
  cycleName: "",
  reviewType: "Annual",
  periodStartDate: "",
  periodEndDate: "",
  goalSettingDueDate: "",
  selfAssessmentDueDate: "",
  managerAssessmentDueDate: "",
  acknowledgementDueDate: "",
  acknowledgementRequired: true,
};

function PerformanceReviewsPanel({
  employees = [],
  isAdminHR = false,
  currentUser = null,
}) {
  const [reviews, setReviews] =
    useState([]);

  const [monitor, setMonitor] =
    useState(null);

  const [draftForm, setDraftForm] =
    useState(emptyDraftForm);

  const [selectedReviewNumber, setSelectedReviewNumber] =
    useState("");

  const [selectedReview, setSelectedReview] =
    useState(null);

  const [showDraftForm, setShowDraftForm] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [notice, setNotice] =
    useState("");

  const ROYAL_BLUE = "#0B3D91";
  const BORDER = "#dbe3ef";
  const MUTED = "#64748b";

  const cardStyle = {
    backgroundColor: "#ffffff",
    border: `1px solid ${BORDER}`,
    borderRadius: "14px",
    padding: "18px",
  };

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box",
    border: `1px solid ${BORDER}`,
    borderRadius: "8px",
    padding: "10px 12px",
    backgroundColor: "#ffffff",
    color: "#0f172a",
  };

  const labelStyle = {
    display: "block",
    color: "#334155",
    fontWeight: "bold",
    marginBottom: "6px",
  };

  const primaryButton = {
    border: "none",
    borderRadius: "8px",
    padding: "10px 14px",
    backgroundColor: ROYAL_BLUE,
    color: "#ffffff",
    fontWeight: "bold",
    cursor: "pointer",
  };

  const secondaryButton = {
    ...primaryButton,
    backgroundColor: "#e2e8f0",
    color: "#334155",
  };

  const loadPerformanceData =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        if (isAdminHR) {
          const [
            reviewsResponse,
            monitorResponse,
          ] =
            await Promise.all([
              api.get(
                "/api/hr/performance"
              ),

              api.get(
                "/api/hr/performance/monitor",
                {
                  params: {
                    asOfDate:
                      todayYmd(),
                  },
                }
              ),
            ]);

          setReviews(
            reviewsResponse
              .data
              .data || []
          );

          setMonitor(
            monitorResponse.data ||
              null
          );
        } else {
          const response =
            await api.get(
              "/api/hr/performance/me"
            );

          setReviews(
            response.data.data ||
              []
          );

          setMonitor(null);
        }
      } catch (requestError) {
        console.error(
          "Performance review load failed:",
          requestError
        );

        setReviews([]);
        setMonitor(null);

        setError(
          requestError
            ?.response
            ?.data
            ?.message ||
            "Failed to load controlled performance reviews."
        );
      } finally {
        setLoading(false);
      }
    }, [isAdminHR]);

  useEffect(() => {
    loadPerformanceData();
  }, [loadPerformanceData]);

  useEffect(() => {
    if (
      !draftForm.employeeId &&
      employees.length > 0
    ) {
      setDraftForm(
        (current) => ({
          ...current,
          employeeId:
            employees[0]
              .employeeId,
        })
      );
    }
  }, [
    employees,
    draftForm.employeeId,
  ]);

  const selectedEmployee =
    useMemo(
      () =>
        employees.find(
          (employee) =>
            employee.employeeId ===
            draftForm.employeeId
        ) || null,
      [
        employees,
        draftForm.employeeId,
      ]
    );

  const summary =
    monitor?.summary || {
      totalReviews:
        reviews.length,
      openReviews:
        reviews.filter(
          (review) =>
            ![
              "Completed",
              "Cancelled",
            ].includes(
              review.status
            )
        ).length,
      completedReviews:
        reviews.filter(
          (review) =>
            review.status ===
            "Completed"
        ).length,
      overdueReviews: 0,
      awaitingAcknowledgement:
        reviews.filter(
          (review) =>
            review.status ===
            "Awaiting Acknowledgement"
        ).length,
      activeImprovementPlans:
        reviews.filter(
          (review) =>
            review
              .improvementPlan
              ?.status ===
            "Active"
        ).length,
    };

  const handleDraftChange = (
    event
  ) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setDraftForm(
      (current) => ({
        ...current,
        [name]:
          type === "checkbox"
            ? checked
            : value,
      })
    );
  };

  const resetDraftForm = () => {
    setDraftForm({
      ...emptyDraftForm,
      employeeId:
        employees[0]
          ?.employeeId ||
        "",
    });

    setError("");
    setNotice("");
  };

  const createDraft =
    async () => {
      try {
        setError("");
        setNotice("");

        const requiredFields = [
          "employeeId",
          "cycleCode",
          "cycleName",
          "reviewType",
          "periodStartDate",
          "periodEndDate",
        ];

        const missingField =
          requiredFields.find(
            (fieldName) =>
              !String(
                draftForm[
                  fieldName
                ] || ""
              ).trim()
          );

        if (missingField) {
          setError(
            "Employee, cycle code, cycle name, review type and performance-period dates are required."
          );
          return;
        }

        if (
          draftForm.periodEndDate <
          draftForm.periodStartDate
        ) {
          setError(
            "Performance period end date cannot be earlier than its start date."
          );
          return;
        }

        setSaving(true);

        const response =
          await api.post(
            "/api/hr/performance",
            {
              ...draftForm,
              cycleCode:
                draftForm
                  .cycleCode
                  .trim()
                  .toUpperCase(),
            }
          );

        setNotice(
          response.data.message ||
            "Controlled performance review draft created successfully."
        );

        resetDraftForm();
        setShowDraftForm(false);

        await loadPerformanceData();
      } catch (requestError) {
        console.error(
          "Create performance review draft failed:",
          requestError
        );

        setError(
          requestError
            ?.response
            ?.data
            ?.message ||
            "Failed to create the controlled performance review draft."
        );
      } finally {
        setSaving(false);
      }
    };

  const openReview =
    async (reviewNumber) => {
      try {
        setError("");
        setNotice("");
        setSelectedReviewNumber(
          reviewNumber
        );
        setSelectedReview(null);

        const response =
          await api.get(
            `/api/hr/performance/${reviewNumber}`
          );

        setSelectedReview(
          response.data.data ||
            null
        );
      } catch (requestError) {
        console.error(
          "Get performance review failed:",
          requestError
        );

        setError(
          requestError
            ?.response
            ?.data
            ?.message ||
            "Failed to load the controlled performance review."
        );
      }
    };

      const refreshSelectedReview =
    async (reviewNumber) => {
      await loadPerformanceData();
      await openReview(
        reviewNumber
      );
    };

  const badgeStyle = (
    status
  ) => {
    const palette = {
      Draft: [
        "#e2e8f0",
        "#334155",
      ],

      "Goal Setting": [
        "#dbeafe",
        "#1d4ed8",
      ],

      "Self Assessment": [
        "#ede9fe",
        "#6d28d9",
      ],

      "Manager Assessment": [
        "#fef3c7",
        "#92400e",
      ],

      "HR Review": [
        "#ffedd5",
        "#c2410c",
      ],

      "Awaiting Acknowledgement": [
        "#fef9c3",
        "#854d0e",
      ],

      Completed: [
        "#dcfce7",
        "#15803d",
      ],

      "Improvement Plan": [
        "#fee2e2",
        "#b91c1c",
      ],

      Cancelled: [
        "#e2e8f0",
        "#475569",
      ],
    };

    const [
      backgroundColor,
      color,
    ] =
      palette[status] || [
        "#e2e8f0",
        "#334155",
      ];

    return {
      display:
        "inline-block",
      padding: "5px 9px",
      borderRadius: "999px",
      backgroundColor,
      color,
      fontSize: "12px",
      fontWeight: "bold",
    };
  };

  const formatScore = (
    value
  ) => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return "Not Rated";
    }

    return Number(value).toFixed(
      2
    );
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
            justifyContent:
              "space-between",
            alignItems: "center",
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
              Controlled Performance
              Reviews
            </h2>

            <div
              style={{
                color: MUTED,
                marginTop: "5px",
              }}
            >
              {isAdminHR
                ? "Manage review cycles, assessments, HR approval, acknowledgements and improvement plans."
                : "Review performance records assigned to your linked employee profile."}
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
                secondaryButton
              }
              onClick={
                loadPerformanceData
              }
              disabled={loading}
            >
              {loading
                ? "Refreshing..."
                : "Refresh Reviews"}
            </button>

            {isAdminHR && (
              <button
                type="button"
                style={
                  primaryButton
                }
                onClick={() => {
                  setShowDraftForm(
                    (current) =>
                      !current
                  );
                  setError("");
                  setNotice("");
                }}
              >
                {showDraftForm
                  ? "Hide Draft Form"
                  : "Create Review Draft"}
              </button>
            )}
          </div>
        </div>
      </div>

      {(error || notice) && (
        <div
          style={{
            border: `1px solid ${
              error
                ? "#fecaca"
                : "#bbf7d0"
            }`,
            borderRadius: "10px",
            padding: "12px 14px",
            backgroundColor:
              error
                ? "#fef2f2"
                : "#f0fdf4",
            color:
              error
                ? "#b91c1c"
                : "#166534",
          }}
        >
          {error || notice}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "12px",
        }}
      >
        {[
          [
            "Controlled Reviews",
            summary.totalReviews ||
              0,
            ROYAL_BLUE,
          ],
          [
            "Open",
            summary.openReviews ||
              0,
            "#d97706",
          ],
          [
            "Completed",
            summary.completedReviews ||
              0,
            "#16a34a",
          ],
          [
            "Overdue",
            summary.overdueReviews ||
              0,
            "#dc2626",
          ],
          [
            "Acknowledgement Due",
            summary
              .awaitingAcknowledgement ||
              0,
            "#7c3aed",
          ],
          [
            "Active Plans",
            summary
              .activeImprovementPlans ||
              0,
            "#c2410c",
          ],
        ].map(
          ([
            label,
            value,
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
                  marginTop: "5px",
                }}
              >
                {label}
              </div>
            </div>
          )
        )}
      </div>

      {isAdminHR &&
        showDraftForm && (
          <div style={cardStyle}>
            <h3
              style={{
                color: ROYAL_BLUE,
                marginTop: 0,
              }}
            >
              Create Controlled
              Performance Review Draft
            </h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(210px, 1fr))",
                gap: "12px",
              }}
            >
              <div>
                <label
                  style={labelStyle}
                >
                  Employee
                </label>

                <select
                  name="employeeId"
                  value={
                    draftForm
                      .employeeId
                  }
                  onChange={
                    handleDraftChange
                  }
                  style={inputStyle}
                >
                  <option value="">
                    Select Employee
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
                        {employee.employeeId})
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label
                  style={labelStyle}
                >
                  Review type
                </label>

                <select
                  name="reviewType"
                  value={
                    draftForm
                      .reviewType
                  }
                  onChange={
                    handleDraftChange
                  }
                  style={inputStyle}
                >
                  {REVIEW_TYPES.map(
                    (reviewType) => (
                      <option
                        key={reviewType}
                        value={reviewType}
                      >
                        {reviewType}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label
                  style={labelStyle}
                >
                  Cycle code
                </label>

                <input
                  name="cycleCode"
                  value={
                    draftForm
                      .cycleCode
                  }
                  onChange={
                    handleDraftChange
                  }
                  placeholder="e.g. 2026-ANNUAL"
                  style={inputStyle}
                />
              </div>

              <div>
                <label
                  style={labelStyle}
                >
                  Cycle name
                </label>

                <input
                  name="cycleName"
                  value={
                    draftForm
                      .cycleName
                  }
                  onChange={
                    handleDraftChange
                  }
                  placeholder="e.g. 2026 Annual Review"
                  style={inputStyle}
                />
              </div>

              <div>
                <label
                  style={labelStyle}
                >
                  Period start
                </label>

                <input
                  type="date"
                  name="periodStartDate"
                  value={
                    draftForm
                      .periodStartDate
                  }
                  onChange={
                    handleDraftChange
                  }
                  style={inputStyle}
                />
              </div>

              <div>
                <label
                  style={labelStyle}
                >
                  Period end
                </label>

                <input
                  type="date"
                  name="periodEndDate"
                  value={
                    draftForm
                      .periodEndDate
                  }
                  onChange={
                    handleDraftChange
                  }
                  style={inputStyle}
                />
              </div>

              <div>
                <label
                  style={labelStyle}
                >
                  Goal-setting due
                </label>

                <input
                  type="date"
                  name="goalSettingDueDate"
                  value={
                    draftForm
                      .goalSettingDueDate
                  }
                  onChange={
                    handleDraftChange
                  }
                  style={inputStyle}
                />
              </div>

              <div>
                <label
                  style={labelStyle}
                >
                  Self-assessment due
                </label>

                <input
                  type="date"
                  name="selfAssessmentDueDate"
                  value={
                    draftForm
                      .selfAssessmentDueDate
                  }
                  onChange={
                    handleDraftChange
                  }
                  style={inputStyle}
                />
              </div>

              <div>
                <label
                  style={labelStyle}
                >
                  Manager-assessment due
                </label>

                <input
                  type="date"
                  name="managerAssessmentDueDate"
                  value={
                    draftForm
                      .managerAssessmentDueDate
                  }
                  onChange={
                    handleDraftChange
                  }
                  style={inputStyle}
                />
              </div>

              <div>
                <label
                  style={labelStyle}
                >
                  Acknowledgement due
                </label>

                <input
                  type="date"
                  name="acknowledgementDueDate"
                  value={
                    draftForm
                      .acknowledgementDueDate
                  }
                  onChange={
                    handleDraftChange
                  }
                  style={inputStyle}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "9px",
                  paddingTop: "28px",
                }}
              >
                <input
                  id="performanceAcknowledgementRequired"
                  type="checkbox"
                  name="acknowledgementRequired"
                  checked={
                    draftForm
                      .acknowledgementRequired
                  }
                  onChange={
                    handleDraftChange
                  }
                />

                <label
                  htmlFor="performanceAcknowledgementRequired"
                  style={{
                    color: "#334155",
                    fontWeight: "bold",
                  }}
                >
                  Employee acknowledgement
                  required
                </label>
              </div>
            </div>

            {selectedEmployee && (
              <div
                style={{
                  marginTop: "12px",
                  padding: "10px 12px",
                  backgroundColor:
                    "#f8fafc",
                  borderRadius: "8px",
                  color: "#475569",
                }}
              >
                {selectedEmployee.fullName} ·{" "}
                {selectedEmployee.jobTitle ||
                  "No job title"}{" "}
                ·{" "}
                {selectedEmployee.department ||
                  "No department"}
              </div>
            )}

            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
                marginTop: "16px",
              }}
            >
              <button
                type="button"
                style={primaryButton}
                onClick={createDraft}
                disabled={saving}
              >
                {saving
                  ? "Creating..."
                  : "Create Draft"}
              </button>

              <button
                type="button"
                style={
                  secondaryButton
                }
                onClick={
                  resetDraftForm
                }
                disabled={saving}
              >
                Reset
              </button>
            </div>
          </div>
        )}

      <div style={cardStyle}>
        <h3
          style={{
            color: ROYAL_BLUE,
            marginTop: 0,
          }}
        >
          {isAdminHR
            ? "Controlled Performance Register"
            : "My Performance Reviews"}
        </h3>

        <div
          style={{
            overflowX: "auto",
          }}
        >
          <table
            width="100%"
            cellPadding="10"
            style={{
              borderCollapse:
                "collapse",
              minWidth: "980px",
            }}
          >
            <thead
              style={{
                backgroundColor:
                  "#eef4ff",
              }}
            >
              <tr>
                <th align="left">
                  Review
                </th>
                <th align="left">
                  Employee
                </th>
                <th align="left">
                  Cycle
                </th>
                <th align="left">
                  Period
                </th>
                <th align="left">
                  Manager
                </th>
                <th align="left">
                  Score
                </th>
                <th align="left">
                  Status
                </th>
                <th align="left">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {reviews.length > 0 ? (
                reviews.map(
                  (review) => (
                    <tr
                      key={
                        review.reviewNumber
                      }
                      style={{
                        borderBottom:
                          `1px solid ${BORDER}`,
                      }}
                    >
                      <td>
                        <strong>
                          {review.reviewNumber}
                        </strong>

                        <div
                          style={{
                            color: MUTED,
                            fontSize: "12px",
                          }}
                        >
                          {review.reviewType}
                        </div>
                      </td>

                      <td>
                        {review
                          .employeeSnapshot
                          ?.fullName ||
                          review.employeeName ||
                          review.employeeId}

                        <div
                          style={{
                            color: MUTED,
                            fontSize: "12px",
                          }}
                        >
                          {review.employeeId}
                        </div>
                      </td>

                      <td>
                        {review.cycleName}

                        <div
                          style={{
                            color: MUTED,
                            fontSize: "12px",
                          }}
                        >
                          {review.cycleCode}
                        </div>
                      </td>

                      <td>
                        {review.periodStartDate}
                        <br />
                        to{" "}
                        {review.periodEndDate}
                      </td>

                      <td>
                        {review.managerName ||
                          "Not assigned"}
                      </td>

                      <td>
                        {formatScore(
                          review.finalScore
                        )}

                        <div
                          style={{
                            color: MUTED,
                            fontSize: "12px",
                          }}
                        >
                          {review.finalRating ||
                            "Not Rated"}
                        </div>
                      </td>

                      <td>
                        <span
                          style={badgeStyle(
                            review.status
                          )}
                        >
                          {review.status}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          style={
                            secondaryButton
                          }
                          onClick={() =>
                            openReview(
                              review.reviewNumber
                            )
                          }
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  )
                )
              ) : (
                <tr>
                  <td
                    colSpan="8"
                    style={{
                      textAlign:
                        "center",
                      padding: "24px",
                      color: MUTED,
                    }}
                  >
                    {loading
                      ? "Loading controlled performance reviews..."
                      : "No controlled performance reviews were found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedReviewNumber &&
        selectedReview && (
          <div style={cardStyle}>
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "flex-start",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <div>
                <h3
                  style={{
                    color:
                      ROYAL_BLUE,
                    marginTop: 0,
                    marginBottom:
                      "5px",
                  }}
                >
                  {
                    selectedReview
                      .reviewNumber
                  }{" "}
                  — Control Evidence
                </h3>

                <div
                  style={{
                    color: MUTED,
                  }}
                >
                  {
                    selectedReview
                      .cycleName
                  }{" "}
                  ·{" "}
                  {
                    selectedReview
                      .reviewType
                  }
                </div>
              </div>

              <span
                style={badgeStyle(
                  selectedReview.status
                )}
              >
                {selectedReview.status}
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(210px, 1fr))",
                gap: "16px",
                marginTop: "18px",
              }}
            >
              <div>
                <strong>Employee</strong>
                <div>
                  {selectedReview
                    .employeeSnapshot
                    ?.fullName ||
                    selectedReview
                      .employeeId}
                </div>
              </div>

              <div>
                <strong>Manager</strong>
                <div>
                  {selectedReview
                    .managerName ||
                    "Not assigned"}
                </div>
              </div>

              <div>
                <strong>Final result</strong>
                <div>
                  {formatScore(
                    selectedReview
                      .finalScore
                  )}{" "}
                  ·{" "}
                  {selectedReview
                    .finalRating ||
                    "Not Rated"}
                </div>
              </div>

              <div>
                <strong>
                  Acknowledgement
                </strong>
                <div>
                  {selectedReview
                    .employeeAcknowledgement
                    ?.status ||
                    "Pending"}
                </div>
              </div>

              <div>
                <strong>
                  Improvement plan
                </strong>
                <div>
                  {selectedReview
                    .improvementPlan
                    ?.status ||
                    "Not Required"}
                </div>
              </div>

              <div>
                <strong>HR review</strong>
                <div>
                  {selectedReview
                    .hrReview
                    ?.status ||
                    "Pending"}
                </div>
              </div>
            </div>

            {selectedReview
              .finalSummary && (
              <div
                style={{
                  marginTop:
                    "18px",
                }}
              >
                <strong>
                  Final summary
                </strong>

                <div
                  style={{
                    marginTop:
                      "5px",
                    color: "#334155",
                    whiteSpace:
                      "pre-wrap",
                  }}
                >
                  {
                    selectedReview
                      .finalSummary
                  }
                </div>
              </div>
            )}

                        <PerformanceReviewWorkflowPanel
              review={selectedReview}
              isAdminHR={isAdminHR}
              onChanged={
                refreshSelectedReview
              }
            />
                        <PerformanceSelfAssessmentPanel
              review={selectedReview}
              isAdminHR={isAdminHR}
              onChanged={
                refreshSelectedReview
              }
            />
                        <PerformanceManagerAssessmentPanel
              review={selectedReview}
              currentUser={
                currentUser
              }
              onChanged={
                refreshSelectedReview
              }
            />
                        <PerformanceHrReviewPanel
              review={selectedReview}
              isAdminHR={isAdminHR}
              onChanged={
                refreshSelectedReview
              }
            />
          </div>
        )}
    </div>
  );
}

export default PerformanceReviewsPanel;