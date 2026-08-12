import { useEffect, useState } from "react";
import api from "../api";

const GOAL_STATUSES = [
  "Not Started",
  "In Progress",
  "Completed",
  "Partially Completed",
  "Deferred",
  "Cancelled",
];

const getUserId = (user) =>
  String(
    user?.userId ||
      user?._id ||
      user?.id ||
      ""
  ).trim();

const getLinkedEmployeeId = (
  user
) =>
  String(
    user?.linkedEmployeeId ||
      user?.employeeId ||
      ""
  ).trim();

function PerformanceManagerAssessmentPanel({
  review,
  currentUser,
  onChanged,
}) {
  const [form, setForm] =
    useState({
      strengths: "",
      areasForImprovement: "",
      overallComments: "",
      developmentActions: "",
      submissionNotes: "",
      returnReason: "",
      goals: [],
      competencies: [],
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

  const sectionStyle = {
    border: `1px solid ${BORDER}`,
    borderRadius: "12px",
    padding: "15px",
    backgroundColor: "#ffffff",
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

  useEffect(() => {
    if (!review) return;

    setForm({
      strengths:
        review.managerAssessment
          ?.strengths ||
        "",

      areasForImprovement:
        review.managerAssessment
          ?.areasForImprovement ||
        "",

      overallComments:
        review.managerAssessment
          ?.overallComments ||
        "",

      developmentActions:
        review.developmentActions ||
        "",

      submissionNotes: "",
      returnReason: "",

      goals:
        Array.isArray(
          review.goals
        )
          ? review.goals.map(
              (goal) => ({
                goalNumber:
                  goal.goalNumber,

                title:
                  goal.title || "",

                description:
                  goal.description ||
                  "",

                successMeasure:
                  goal.successMeasure ||
                  "",

                status:
                  goal.status ||
                  "Not Started",

                employeeScore:
                  goal.employeeScore,

                employeeProgressComments:
                  goal
                    .employeeProgressComments ||
                  "",

                managerScore:
                  goal.managerScore ||
                  "",

                managerProgressComments:
                  goal
                    .managerProgressComments ||
                  "",
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
                    .competencyCode,

                competencyName:
                  competency
                    .competencyName ||
                  "",

                description:
                  competency
                    .description ||
                  "",

                employeeScore:
                  competency
                    .employeeScore,

                employeeComments:
                  competency
                    .employeeComments ||
                  "",

                managerScore:
                  competency
                    .managerScore ||
                  "",

                managerComments:
                  competency
                    .managerComments ||
                  "",
              })
            )
          : [],
    });

    setError("");
    setNotice("");
  }, [review]);

  if (!review) {
    return null;
  }

  const currentUserId =
    getUserId(currentUser);

  const currentEmployeeId =
    getLinkedEmployeeId(
      currentUser
    );

  const assignedManager =
    Boolean(
      (
        currentEmployeeId &&
        currentEmployeeId ===
          String(
            review.managerEmployeeId ||
              ""
          ).trim()
      ) ||
      (
        currentUserId &&
        currentUserId ===
          String(
            review.managerLinkedUserId ||
              ""
          ).trim()
      )
    );

  if (
    !assignedManager ||
    review.status !==
      "Manager Assessment"
  ) {
    return null;
  }

  const handleFieldChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setForm(
      (current) => ({
        ...current,
        [name]: value,
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
                      value,
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
                      value,
                  }
                : competency
          ),
      })
    );
  };

  const runAction =
    async ({
      url,
      data,
      successMessage,
    }) => {
      try {
        setSaving(true);
        setError("");
        setNotice("");

        const response =
          await api.post(
            url,
            data
          );

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
          "Manager assessment action failed:",
          requestError
        );

        setError(
          requestError
            ?.response
            ?.data
            ?.message ||
            "The controlled manager-assessment action failed."
        );
      } finally {
        setSaving(false);
      }
    };

  const returnToEmployee =
    async () => {
      const returnReason =
        form.returnReason.trim();

      if (!returnReason) {
        setError(
          "Enter a reason for returning the self-assessment."
        );
        return;
      }

      await runAction({
        url:
          `/api/hr/performance/${review.reviewNumber}/self-assessment/return`,

        data: {
          returnReason,
        },

        successMessage:
          "Employee self-assessment returned successfully.",
      });
    };

  const submitManagerAssessment =
    async () => {
      if (
        !form.strengths.trim() ||
        !form
          .areasForImprovement
          .trim() ||
        !form
          .overallComments
          .trim()
      ) {
        setError(
          "Manager strengths, areas for improvement and overall comments are required."
        );
        return;
      }

      const incompleteGoal =
        form.goals.find(
          (goal) =>
            !goal.managerScore ||
            !String(
              goal
                .managerProgressComments ||
                ""
            ).trim()
        );

      if (incompleteGoal) {
        setError(
          `Goal ${incompleteGoal.goalNumber} requires a manager score and comments.`
        );
        return;
      }

      const incompleteCompetency =
        form.competencies.find(
          (competency) =>
            !competency
              .managerScore ||
            !String(
              competency
                .managerComments ||
                ""
            ).trim()
        );

      if (
        incompleteCompetency
      ) {
        setError(
          `Competency ${incompleteCompetency.competencyCode} requires a manager score and comments.`
        );
        return;
      }

      await runAction({
        url:
          `/api/hr/performance/${review.reviewNumber}/manager-assessment`,

        data: {
          strengths:
            form.strengths,

          areasForImprovement:
            form
              .areasForImprovement,

          overallComments:
            form
              .overallComments,

          developmentActions:
            form
              .developmentActions,

          submissionNotes:
            form
              .submissionNotes,

          goals:
            form.goals.map(
              (goal) => ({
                goalNumber:
                  goal.goalNumber,

                managerScore:
                  Number(
                    goal.managerScore
                  ),

                managerProgressComments:
                  goal
                    .managerProgressComments,

                status:
                  goal.status,
              })
            ),

          competencies:
            form.competencies.map(
              (
                competency
              ) => ({
                competencyCode:
                  competency
                    .competencyCode,

                managerScore:
                  Number(
                    competency
                      .managerScore
                  ),

                managerComments:
                  competency
                    .managerComments,
              })
            ),
        },

        successMessage:
          "Manager assessment submitted successfully for HR review.",
      });
    };

  return (
    <div
      style={{
        display: "grid",
        gap: "14px",
        marginTop: "18px",
      }}
    >
      <div
        style={{
          ...sectionStyle,
          backgroundColor:
            "#fff7ed",
        }}
      >
        <h3
          style={{
            color: ROYAL_BLUE,
            marginTop: 0,
            marginBottom: "6px",
          }}
        >
          Manager Assessment
        </h3>

        <div
          style={{
            color: MUTED,
          }}
        >
          Review the employee’s submitted assessment, provide independent scores, or return it for correction.
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

      <div style={sectionStyle}>
        <h3
          style={{
            color: ROYAL_BLUE,
            marginTop: 0,
          }}
        >
          Return Self-Assessment
        </h3>

        <label
          style={labelStyle}
        >
          Return reason
        </label>

        <textarea
          name="returnReason"
          value={
            form.returnReason
          }
          onChange={
            handleFieldChange
          }
          style={{
            ...inputStyle,
            minHeight: "70px",
          }}
          placeholder="Explain what the employee must correct or complete"
        />

        <button
          type="button"
          style={{
            ...primaryButton,
            backgroundColor:
              "#d97706",
            marginTop: "10px",
          }}
          onClick={
            returnToEmployee
          }
          disabled={saving}
        >
          Return to Employee
        </button>
      </div>

      <div style={sectionStyle}>
        <h3
          style={{
            color: ROYAL_BLUE,
            marginTop: 0,
          }}
        >
          Goal Assessment
        </h3>

        <div
          style={{
            display: "grid",
            gap: "12px",
          }}
        >
          {form.goals.map(
            (goal, index) => (
              <div
                key={
                  goal.goalNumber
                }
                style={{
                  border:
                    `1px solid ${BORDER}`,
                  borderRadius:
                    "10px",
                  padding: "12px",
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
                  {goal.goalNumber} —{" "}
                  {goal.title}
                </strong>

                <div
                  style={{
                    marginTop: "8px",
                    color: "#334155",
                  }}
                >
                  <strong>
                    Employee score:
                  </strong>{" "}
                  {goal.employeeScore ||
                    "Not submitted"}
                </div>

                <div
                  style={{
                    marginTop: "5px",
                    color: MUTED,
                    whiteSpace:
                      "pre-wrap",
                  }}
                >
                  {
                    goal
                      .employeeProgressComments
                  }
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: "10px",
                    marginTop: "12px",
                  }}
                >
                  <div>
                    <label
                      style={labelStyle}
                    >
                      Final progress status
                    </label>

                    <select
                      value={
                        goal.status
                      }
                      onChange={(
                        event
                      ) =>
                        updateGoal(
                          index,
                          "status",
                          event.target
                            .value
                        )
                      }
                      style={inputStyle}
                    >
                      {GOAL_STATUSES.map(
                        (status) => (
                          <option
                            key={
                              status
                            }
                            value={
                              status
                            }
                          >
                            {status}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div>
                    <label
                      style={labelStyle}
                    >
                      Manager score (1–5)
                    </label>

                    <select
                      value={
                        goal.managerScore
                      }
                      onChange={(
                        event
                      ) =>
                        updateGoal(
                          index,
                          "managerScore",
                          event.target
                            .value
                        )
                      }
                      style={inputStyle}
                    >
                      <option value="">
                        Select score
                      </option>

                      {[1, 2, 3, 4, 5].map(
                        (score) => (
                          <option
                            key={
                              score
                            }
                            value={
                              score
                            }
                          >
                            {score}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div
                    style={{
                      gridColumn:
                        "1 / -1",
                    }}
                  >
                    <label
                      style={labelStyle}
                    >
                      Manager comments
                    </label>

                    <textarea
                      value={
                        goal
                          .managerProgressComments
                      }
                      onChange={(
                        event
                      ) =>
                        updateGoal(
                          index,
                          "managerProgressComments",
                          event.target
                            .value
                        )
                      }
                      style={{
                        ...inputStyle,
                        minHeight:
                          "75px",
                      }}
                    />
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {form.competencies.length >
        0 && (
        <div style={sectionStyle}>
          <h3
            style={{
              color: ROYAL_BLUE,
              marginTop: 0,
            }}
          >
            Competency Assessment
          </h3>

          <div
            style={{
              display: "grid",
              gap: "12px",
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
                      .competencyCode
                  }
                  style={{
                    border:
                      `1px solid ${BORDER}`,
                    borderRadius:
                      "10px",
                    padding: "12px",
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
                    {
                      competency.competencyCode
                    }{" "}
                    —{" "}
                    {
                      competency.competencyName
                    }
                  </strong>

                  <div
                    style={{
                      marginTop: "8px",
                      color: "#334155",
                    }}
                  >
                    <strong>
                      Employee score:
                    </strong>{" "}
                    {competency.employeeScore ||
                      "Not submitted"}
                  </div>

                  <div
                    style={{
                      marginTop: "5px",
                      color: MUTED,
                    }}
                  >
                    {
                      competency.employeeComments
                    }
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "minmax(150px, 210px) 1fr",
                      gap: "10px",
                      marginTop: "12px",
                    }}
                  >
                    <div>
                      <label
                        style={
                          labelStyle
                        }
                      >
                        Manager score (1–5)
                      </label>

                      <select
                        value={
                          competency
                            .managerScore
                        }
                        onChange={(
                          event
                        ) =>
                          updateCompetency(
                            index,
                            "managerScore",
                            event.target
                              .value
                          )
                        }
                        style={
                          inputStyle
                        }
                      >
                        <option value="">
                          Select score
                        </option>

                        {[1, 2, 3, 4, 5].map(
                          (score) => (
                            <option
                              key={
                                score
                              }
                              value={
                                score
                              }
                            >
                              {score}
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    <div>
                      <label
                        style={
                          labelStyle
                        }
                      >
                        Manager comments
                      </label>

                      <textarea
                        value={
                          competency
                            .managerComments
                        }
                        onChange={(
                          event
                        ) =>
                          updateCompetency(
                            index,
                            "managerComments",
                            event.target
                              .value
                          )
                        }
                        style={{
                          ...inputStyle,
                          minHeight:
                            "75px",
                        }}
                      />
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}

      <div style={sectionStyle}>
        <h3
          style={{
            color: ROYAL_BLUE,
            marginTop: 0,
          }}
        >
          Overall Manager Assessment
        </h3>

        <div
          style={{
            display: "grid",
            gap: "11px",
          }}
        >
          <div>
            <label
              style={labelStyle}
            >
              Strengths
            </label>

            <textarea
              name="strengths"
              value={
                form.strengths
              }
              onChange={
                handleFieldChange
              }
              style={{
                ...inputStyle,
                minHeight: "75px",
              }}
            />
          </div>

          <div>
            <label
              style={labelStyle}
            >
              Areas for improvement
            </label>

            <textarea
              name="areasForImprovement"
              value={
                form
                  .areasForImprovement
              }
              onChange={
                handleFieldChange
              }
              style={{
                ...inputStyle,
                minHeight: "75px",
              }}
            />
          </div>

          <div>
            <label
              style={labelStyle}
            >
              Overall comments
            </label>

            <textarea
              name="overallComments"
              value={
                form.overallComments
              }
              onChange={
                handleFieldChange
              }
              style={{
                ...inputStyle,
                minHeight: "75px",
              }}
            />
          </div>

          <div>
            <label
              style={labelStyle}
            >
              Development actions
            </label>

            <textarea
              name="developmentActions"
              value={
                form
                  .developmentActions
              }
              onChange={
                handleFieldChange
              }
              style={{
                ...inputStyle,
                minHeight: "75px",
              }}
            />
          </div>

          <div>
            <label
              style={labelStyle}
            >
              Submission notes
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
                minHeight: "65px",
              }}
            />
          </div>
        </div>

        <button
          type="button"
          style={{
            ...primaryButton,
            marginTop: "12px",
            backgroundColor:
              "#15803d",
          }}
          onClick={
            submitManagerAssessment
          }
          disabled={saving}
        >
          {saving
            ? "Submitting..."
            : "Submit Manager Assessment"}
        </button>
      </div>
    </div>
  );
}

export default PerformanceManagerAssessmentPanel;