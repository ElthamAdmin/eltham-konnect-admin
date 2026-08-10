import { useEffect, useMemo, useState } from "react";
import api from "../api";

const REVIEW_TYPES = [
  "Annual",
  "Probation",
  "Quarterly",
  "Mid-Year",
  "Project",
  "Improvement Plan",
  "Other",
];

const emptyGoal = () => ({
  goalNumber: "",
  title: "",
  description: "",
  successMeasure: "",
  weightPercentage: 0,
  targetDate: "",
  status: "Not Started",
});

const emptyCompetency = () => ({
  competencyCode: "",
  competencyName: "",
  description: "",
  weightPercentage: 0,
});

function PerformanceReviewWorkflowPanel({
  review,
  isAdminHR = false,
  onChanged,
}) {
  const [form, setForm] =
    useState({
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
      goals: [],
      competencies: [],
      updateNotes: "",
      transitionNotes: "",
      submissionNotes: "",
    });

  const [error, setError] =
    useState("");

  const [notice, setNotice] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const ROYAL_BLUE = "#0B3D91";
  const BORDER = "#dbe3ef";
  const MUTED = "#64748b";

  const sectionStyle = {
    border: `1px solid ${BORDER}`,
    borderRadius: "12px",
    padding: "15px",
    backgroundColor: "#ffffff",
  };

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box",
    border: `1px solid ${BORDER}`,
    borderRadius: "8px",
    padding: "9px 10px",
    backgroundColor: "#ffffff",
    color: "#0f172a",
  };

  const labelStyle = {
    display: "block",
    marginBottom: "5px",
    color: "#334155",
    fontWeight: "bold",
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

  const dangerButton = {
    ...primaryButton,
    backgroundColor: "#dc2626",
  };

  useEffect(() => {
    if (!review) return;

    setForm({
      cycleCode:
        review.cycleCode || "",

      cycleName:
        review.cycleName || "",

      reviewType:
        review.reviewType ||
        "Annual",

      periodStartDate:
        review.periodStartDate ||
        "",

      periodEndDate:
        review.periodEndDate ||
        "",

      goalSettingDueDate:
        review.goalSettingDueDate ||
        "",

      selfAssessmentDueDate:
        review.selfAssessmentDueDate ||
        "",

      managerAssessmentDueDate:
        review.managerAssessmentDueDate ||
        "",

      acknowledgementDueDate:
        review.acknowledgementDueDate ||
        "",

      acknowledgementRequired:
        review
          .acknowledgementRequired !==
        false,

      goals:
        Array.isArray(
          review.goals
        )
          ? review.goals.map(
              (goal) => ({
                goalNumber:
                  goal.goalNumber ||
                  "",

                title:
                  goal.title || "",

                description:
                  goal.description ||
                  "",

                successMeasure:
                  goal.successMeasure ||
                  "",

                weightPercentage:
                  Number(
                    goal
                      .weightPercentage ||
                      0
                  ),

                targetDate:
                  goal.targetDate ||
                  "",

                status:
                  goal.status ||
                  "Not Started",
              })
            )
          : [],

      competencies:
        Array.isArray(
          review.competencies
        )
          ? review.competencies.map(
              (competency) => ({
                competencyCode:
                  competency
                    .competencyCode ||
                  "",

                competencyName:
                  competency
                    .competencyName ||
                  "",

                description:
                  competency
                    .description ||
                  "",

                weightPercentage:
                  Number(
                    competency
                      .weightPercentage ||
                      0
                  ),
              })
            )
          : [],

      updateNotes: "",
      transitionNotes: "",
      submissionNotes: "",
    });

    setError("");
    setNotice("");
  }, [review]);

  const totalGoalWeight =
    useMemo(
      () =>
        form.goals.reduce(
          (total, goal) =>
            total +
            Number(
              goal.weightPercentage ||
                0
            ),
          0
        ),
      [form.goals]
    );

  const totalCompetencyWeight =
    useMemo(
      () =>
        form.competencies.reduce(
          (
            total,
            competency
          ) =>
            total +
            Number(
              competency
                .weightPercentage ||
                0
            ),
          0
        ),
      [form.competencies]
    );

  if (!review) {
    return null;
  }

  const handleFieldChange = (
    event
  ) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setForm(
      (current) => ({
        ...current,
        [name]:
          type === "checkbox"
            ? checked
            : value,
      })
    );
  };

  const updateGoal = (
    index,
    fieldName,
    value
  ) => {
    setForm(
      (current) => ({
        ...current,
        goals:
          current.goals.map(
            (goal, goalIndex) =>
              goalIndex === index
                ? {
                    ...goal,
                    [fieldName]:
                      fieldName ===
                      "weightPercentage"
                        ? Number(
                            value ||
                              0
                          )
                        : value,
                  }
                : goal
          ),
      })
    );
  };

  const updateCompetency = (
    index,
    fieldName,
    value
  ) => {
    setForm(
      (current) => ({
        ...current,
        competencies:
          current.competencies.map(
            (
              competency,
              competencyIndex
            ) =>
              competencyIndex ===
              index
                ? {
                    ...competency,
                    [fieldName]:
                      fieldName ===
                      "weightPercentage"
                        ? Number(
                            value ||
                              0
                          )
                        : value,
                  }
                : competency
          ),
      })
    );
  };

  const addGoal = () => {
    setForm(
      (current) => ({
        ...current,
        goals: [
          ...current.goals,
          emptyGoal(),
        ],
      })
    );
  };

  const removeGoal = (
    index
  ) => {
    setForm(
      (current) => ({
        ...current,
        goals:
          current.goals.filter(
            (
              _goal,
              goalIndex
            ) =>
              goalIndex !== index
          ),
      })
    );
  };

  const addCompetency = () => {
    setForm(
      (current) => ({
        ...current,
        competencies: [
          ...current.competencies,
          emptyCompetency(),
        ],
      })
    );
  };

  const removeCompetency = (
    index
  ) => {
    setForm(
      (current) => ({
        ...current,
        competencies:
          current.competencies.filter(
            (
              _competency,
              competencyIndex
            ) =>
              competencyIndex !==
              index
          ),
      })
    );
  };

  const runAction =
    async ({
      method,
      url,
      data,
      successMessage,
    }) => {
      try {
        setSaving(true);
        setError("");
        setNotice("");

        const response =
          await api({
            method,
            url,
            data,
          });

        setNotice(
          response.data.message ||
            successMessage
        );

        if (onChanged) {
          await onChanged(
            review.reviewNumber
          );
        }
      } catch (requestError) {
        console.error(
          "Performance workflow action failed:",
          requestError
        );

        setError(
          requestError
            ?.response
            ?.data
            ?.message ||
            "The controlled performance workflow action failed."
        );
      } finally {
        setSaving(false);
      }
    };

  const validateGoals = (
    requireFullWeight
  ) => {
    if (
      requireFullWeight &&
      form.goals.length === 0
    ) {
      return "Add at least one performance goal before submission.";
    }

    const incompleteGoal =
      form.goals.find(
        (goal) =>
          !String(
            goal.title || ""
          ).trim() ||
          !String(
            goal.description ||
              ""
          ).trim() ||
          !String(
            goal.successMeasure ||
              ""
          ).trim()
      );

    if (incompleteGoal) {
      return "Each performance goal requires a title, description and success measure.";
    }

    if (
      totalGoalWeight > 100
    ) {
      return "Combined performance-goal weight cannot exceed 100 percent.";
    }

    if (
      requireFullWeight &&
      totalGoalWeight !== 100
    ) {
      return "Performance-goal weight must total exactly 100 percent before submission.";
    }

    return "";
  };

  const saveDraft = async () => {
    const validationError =
      validateGoals(false);

    if (validationError) {
      setError(
        validationError
      );
      return;
    }

    await runAction({
      method: "patch",

      url:
        `/api/hr/performance/${review.reviewNumber}/draft`,

      data: {
        cycleCode:
          form.cycleCode,

        cycleName:
          form.cycleName,

        reviewType:
          form.reviewType,

        periodStartDate:
          form.periodStartDate,

        periodEndDate:
          form.periodEndDate,

        goalSettingDueDate:
          form.goalSettingDueDate,

        selfAssessmentDueDate:
          form.selfAssessmentDueDate,

        managerAssessmentDueDate:
          form.managerAssessmentDueDate,

        acknowledgementDueDate:
          form.acknowledgementDueDate,

        acknowledgementRequired:
          form
            .acknowledgementRequired,

        goals:
          form.goals,

        competencies:
          form.competencies,

        updateNotes:
          form.updateNotes,
      },

      successMessage:
        "Performance-review draft updated successfully.",
    });
  };

  const startGoalSetting =
    async () => {
      await runAction({
        method: "post",

        url:
          `/api/hr/performance/${review.reviewNumber}/goal-setting`,

        data: {
          notes:
            form.transitionNotes,
        },

        successMessage:
          "Performance goal setting started successfully.",
      });
    };

  const submitGoals =
    async () => {
      const validationError =
        validateGoals(true);

      if (validationError) {
        setError(
          validationError
        );
        return;
      }

      await runAction({
        method: "post",

        url:
          `/api/hr/performance/${review.reviewNumber}/goals/submit`,

        data: {
          goals:
            form.goals,

          competencies:
            form.competencies,

          submissionNotes:
            form.submissionNotes,
        },

        successMessage:
          "Performance goals submitted successfully.",
      });
    };

  const canEditDraft =
    isAdminHR &&
    review.status ===
      "Draft";

  const canStartGoalSetting =
    isAdminHR &&
    review.status ===
      "Draft";

  const canSubmitGoals =
    isAdminHR &&
    review.status ===
      "Goal Setting";

  if (
    !canEditDraft &&
    !canStartGoalSetting &&
    !canSubmitGoals
  ) {
    return (
      <div
        style={{
          ...sectionStyle,
          backgroundColor:
            "#f8fafc",
        }}
      >
        <strong
          style={{
            color:
              ROYAL_BLUE,
          }}
        >
          Workflow Controls
        </strong>

        <div
          style={{
            marginTop: "6px",
            color: MUTED,
          }}
        >
          No draft or goal-setting
          action is currently available
          for this review.
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gap: "14px",
        marginTop: "18px",
      }}
    >
      {(error || notice) && (
        <div
          style={{
            border: `1px solid ${
              error
                ? "#fecaca"
                : "#bbf7d0"
            }`,
            borderRadius: "9px",
            padding: "11px 13px",
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

      {canEditDraft && (
        <div style={sectionStyle}>
          <h3
            style={{
              color:
                ROYAL_BLUE,
              marginTop: 0,
            }}
          >
            Draft Controls
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "11px",
            }}
          >
            <div>
              <label
                style={labelStyle}
              >
                Cycle code
              </label>

              <input
                name="cycleCode"
                value={
                  form.cycleCode
                }
                onChange={
                  handleFieldChange
                }
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
                  form.cycleName
                }
                onChange={
                  handleFieldChange
                }
                style={inputStyle}
              />
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
                  form.reviewType
                }
                onChange={
                  handleFieldChange
                }
                style={inputStyle}
              >
                {REVIEW_TYPES.map(
                  (reviewType) => (
                    <option
                      key={
                        reviewType
                      }
                      value={
                        reviewType
                      }
                    >
                      {reviewType}
                    </option>
                  )
                )}
              </select>
            </div>

            {[
              [
                "periodStartDate",
                "Period start",
              ],
              [
                "periodEndDate",
                "Period end",
              ],
              [
                "goalSettingDueDate",
                "Goal-setting due",
              ],
              [
                "selfAssessmentDueDate",
                "Self-assessment due",
              ],
              [
                "managerAssessmentDueDate",
                "Manager-assessment due",
              ],
              [
                "acknowledgementDueDate",
                "Acknowledgement due",
              ],
            ].map(
              ([
                fieldName,
                label,
              ]) => (
                <div
                  key={
                    fieldName
                  }
                >
                  <label
                    style={
                      labelStyle
                    }
                  >
                    {label}
                  </label>

                  <input
                    type="date"
                    name={
                      fieldName
                    }
                    value={
                      form[
                        fieldName
                      ]
                    }
                    onChange={
                      handleFieldChange
                    }
                    style={
                      inputStyle
                    }
                  />
                </div>
              )
            )}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginTop: "12px",
            }}
          >
            <input
              id="workflowAcknowledgementRequired"
              type="checkbox"
              name="acknowledgementRequired"
              checked={
                form
                  .acknowledgementRequired
              }
              onChange={
                handleFieldChange
              }
            />

            <label
              htmlFor="workflowAcknowledgementRequired"
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
      )}

      {(canEditDraft ||
        canSubmitGoals) && (
        <div style={sectionStyle}>
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems:
                "center",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <h3
                style={{
                  color:
                    ROYAL_BLUE,
                  margin: 0,
                }}
              >
                Performance Goals
              </h3>

              <div
                style={{
                  color:
                    totalGoalWeight ===
                    100
                      ? "#15803d"
                      : "#b45309",
                  marginTop: "5px",
                }}
              >
                Total weight:{" "}
                {totalGoalWeight}%
              </div>
            </div>

            <button
              type="button"
              style={
                secondaryButton
              }
              onClick={addGoal}
            >
              Add Goal
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gap: "12px",
              marginTop: "14px",
            }}
          >
            {form.goals.map(
              (goal, index) => (
                <div
                  key={
                    goal.goalNumber ||
                    index
                  }
                  style={{
                    border:
                      `1px solid ${BORDER}`,
                    borderRadius:
                      "10px",
                    padding:
                      "12px",
                    backgroundColor:
                      "#f8fafc",
                  }}
                >
                  <div
                    style={{
                      display:
                        "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(170px, 1fr))",
                      gap: "10px",
                    }}
                  >
                    <div>
                      <label
                        style={
                          labelStyle
                        }
                      >
                        Goal number
                      </label>

                      <input
                        value={
                          goal.goalNumber
                        }
                        onChange={(
                          event
                        ) =>
                          updateGoal(
                            index,
                            "goalNumber",
                            event
                              .target
                              .value
                          )
                        }
                        placeholder="Auto-generated if blank"
                        style={
                          inputStyle
                        }
                      />
                    </div>

                    <div>
                      <label
                        style={
                          labelStyle
                        }
                      >
                        Title
                      </label>

                      <input
                        value={
                          goal.title
                        }
                        onChange={(
                          event
                        ) =>
                          updateGoal(
                            index,
                            "title",
                            event
                              .target
                              .value
                          )
                        }
                        style={
                          inputStyle
                        }
                      />
                    </div>

                    <div>
                      <label
                        style={
                          labelStyle
                        }
                      >
                        Weight %
                      </label>

                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={
                          goal.weightPercentage
                        }
                        onChange={(
                          event
                        ) =>
                          updateGoal(
                            index,
                            "weightPercentage",
                            event
                              .target
                              .value
                          )
                        }
                        style={
                          inputStyle
                        }
                      />
                    </div>

                    <div>
                      <label
                        style={
                          labelStyle
                        }
                      >
                        Target date
                      </label>

                      <input
                        type="date"
                        value={
                          goal.targetDate
                        }
                        onChange={(
                          event
                        ) =>
                          updateGoal(
                            index,
                            "targetDate",
                            event
                              .target
                              .value
                          )
                        }
                        style={
                          inputStyle
                        }
                      />
                    </div>

                    <div
                      style={{
                        gridColumn:
                          "1 / -1",
                      }}
                    >
                      <label
                        style={
                          labelStyle
                        }
                      >
                        Description
                      </label>

                      <textarea
                        value={
                          goal.description
                        }
                        onChange={(
                          event
                        ) =>
                          updateGoal(
                            index,
                            "description",
                            event
                              .target
                              .value
                          )
                        }
                        style={{
                          ...inputStyle,
                          minHeight:
                            "70px",
                        }}
                      />
                    </div>

                    <div
                      style={{
                        gridColumn:
                          "1 / -1",
                      }}
                    >
                      <label
                        style={
                          labelStyle
                        }
                      >
                        Success measure
                      </label>

                      <textarea
                        value={
                          goal.successMeasure
                        }
                        onChange={(
                          event
                        ) =>
                          updateGoal(
                            index,
                            "successMeasure",
                            event
                              .target
                              .value
                          )
                        }
                        style={{
                          ...inputStyle,
                          minHeight:
                            "60px",
                        }}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    style={{
                      ...dangerButton,
                      marginTop:
                        "10px",
                    }}
                    onClick={() =>
                      removeGoal(
                        index
                      )
                    }
                  >
                    Remove Goal
                  </button>
                </div>
              )
            )}

            {form.goals.length ===
              0 && (
              <div
                style={{
                  color: MUTED,
                }}
              >
                No controlled goals have
                been added.
              </div>
            )}
          </div>
        </div>
      )}

      {(canEditDraft ||
        canSubmitGoals) && (
        <div style={sectionStyle}>
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems:
                "center",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <h3
                style={{
                  color:
                    ROYAL_BLUE,
                  margin: 0,
                }}
              >
                Competencies
              </h3>

              <div
                style={{
                  color: MUTED,
                  marginTop: "5px",
                }}
              >
                Total weight:{" "}
                {totalCompetencyWeight}%
              </div>
            </div>

            <button
              type="button"
              style={
                secondaryButton
              }
              onClick={
                addCompetency
              }
            >
              Add Competency
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gap: "12px",
              marginTop: "14px",
            }}
          >
            {form.competencies.map(
              (
                competency,
                index
              ) => (
                <div
                  key={
                    competency
                      .competencyCode ||
                    index
                  }
                  style={{
                    border:
                      `1px solid ${BORDER}`,
                    borderRadius:
                      "10px",
                    padding:
                      "12px",
                    backgroundColor:
                      "#f8fafc",
                  }}
                >
                  <div
                    style={{
                      display:
                        "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(180px, 1fr))",
                      gap: "10px",
                    }}
                  >
                    <div>
                      <label
                        style={
                          labelStyle
                        }
                      >
                        Code
                      </label>

                      <input
                        value={
                          competency.competencyCode
                        }
                        onChange={(
                          event
                        ) =>
                          updateCompetency(
                            index,
                            "competencyCode",
                            event
                              .target
                              .value
                          )
                        }
                        placeholder="Auto-generated if blank"
                        style={
                          inputStyle
                        }
                      />
                    </div>

                    <div>
                      <label
                        style={
                          labelStyle
                        }
                      >
                        Competency
                      </label>

                      <input
                        value={
                          competency.competencyName
                        }
                        onChange={(
                          event
                        ) =>
                          updateCompetency(
                            index,
                            "competencyName",
                            event
                              .target
                              .value
                          )
                        }
                        style={
                          inputStyle
                        }
                      />
                    </div>

                    <div>
                      <label
                        style={
                          labelStyle
                        }
                      >
                        Weight %
                      </label>

                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={
                          competency.weightPercentage
                        }
                        onChange={(
                          event
                        ) =>
                          updateCompetency(
                            index,
                            "weightPercentage",
                            event
                              .target
                              .value
                          )
                        }
                        style={
                          inputStyle
                        }
                      />
                    </div>

                    <div
                      style={{
                        gridColumn:
                          "1 / -1",
                      }}
                    >
                      <label
                        style={
                          labelStyle
                        }
                      >
                        Description
                      </label>

                      <textarea
                        value={
                          competency.description
                        }
                        onChange={(
                          event
                        ) =>
                          updateCompetency(
                            index,
                            "description",
                            event
                              .target
                              .value
                          )
                        }
                        style={{
                          ...inputStyle,
                          minHeight:
                            "65px",
                        }}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    style={{
                      ...dangerButton,
                      marginTop:
                        "10px",
                    }}
                    onClick={() =>
                      removeCompetency(
                        index
                      )
                    }
                  >
                    Remove Competency
                  </button>
                </div>
              )
            )}

            {form.competencies
              .length === 0 && (
              <div
                style={{
                  color: MUTED,
                }}
              >
                No controlled competencies
                have been added.
              </div>
            )}
          </div>
        </div>
      )}

      {canEditDraft && (
        <div style={sectionStyle}>
          <label
            style={labelStyle}
          >
            Draft update notes
          </label>

          <textarea
            name="updateNotes"
            value={
              form.updateNotes
            }
            onChange={
              handleFieldChange
            }
            style={{
              ...inputStyle,
              minHeight: "70px",
            }}
          />

          <button
            type="button"
            style={{
              ...primaryButton,
              marginTop: "10px",
            }}
            onClick={saveDraft}
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : "Save Draft Changes"}
          </button>
        </div>
      )}

      {canStartGoalSetting && (
        <div style={sectionStyle}>
          <label
            style={labelStyle}
          >
            Goal-setting transition notes
          </label>

          <textarea
            name="transitionNotes"
            value={
              form.transitionNotes
            }
            onChange={
              handleFieldChange
            }
            style={{
              ...inputStyle,
              minHeight: "70px",
            }}
          />

          <button
            type="button"
            style={{
              ...primaryButton,
              marginTop: "10px",
            }}
            onClick={
              startGoalSetting
            }
            disabled={saving}
          >
            Start Goal Setting
          </button>
        </div>
      )}

      {canSubmitGoals && (
        <div style={sectionStyle}>
          <label
            style={labelStyle}
          >
            Goal submission notes
          </label>

          <textarea
            name="submissionNotes"
            value={
              form.submissionNotes
            }
            onChange={
              handleFieldChange
            }
            style={{
              ...inputStyle,
              minHeight: "70px",
            }}
          />

          <button
            type="button"
            style={{
              ...primaryButton,
              marginTop: "10px",
              backgroundColor:
                "#15803d",
            }}
            onClick={
              submitGoals
            }
            disabled={saving}
          >
            Submit Goals for
            Self-Assessment
          </button>
        </div>
      )}
    </div>
  );
}

export default PerformanceReviewWorkflowPanel;