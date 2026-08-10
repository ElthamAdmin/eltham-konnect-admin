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

function PerformanceSelfAssessmentPanel({
  review,
  isAdminHR = false,
  onChanged,
}) {
  const [form, setForm] =
    useState({
      strengths: "",
      areasForImprovement: "",
      overallComments: "",
      submissionNotes: "",
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
        review.selfAssessment
          ?.strengths ||
        "",

      areasForImprovement:
        review.selfAssessment
          ?.areasForImprovement ||
        "",

      overallComments:
        review.selfAssessment
          ?.overallComments ||
        "",

      submissionNotes: "",

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

                employeeScore:
                  goal.employeeScore ||
                  "",

                employeeProgressComments:
                  goal
                    .employeeProgressComments ||
                  "",

                evidenceReferences:
                  Array.isArray(
                    goal
                      .evidenceReferences
                  )
                    ? goal
                        .evidenceReferences
                        .join(", ")
                    : "",
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

                weightPercentage:
                  Number(
                    competency
                      .weightPercentage ||
                      0
                  ),

                employeeScore:
                  competency
                    .employeeScore ||
                  "",

                employeeComments:
                  competency
                    .employeeComments ||
                  "",
              })
            )
          : [],
    });

    setError("");
    setNotice("");
  }, [review]);

  if (
    !review ||
    isAdminHR ||
    review.status !==
      "Self Assessment"
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

  const submitSelfAssessment =
    async () => {
      try {
        setError("");
        setNotice("");

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
            "Strengths, areas for improvement and overall comments are required."
          );
          return;
        }

        const incompleteGoal =
          form.goals.find(
            (goal) =>
              !goal.employeeScore ||
              !String(
                goal
                  .employeeProgressComments ||
                  ""
              ).trim()
          );

        if (incompleteGoal) {
          setError(
            `Goal ${incompleteGoal.goalNumber} requires a score and progress comments.`
          );
          return;
        }

        const incompleteCompetency =
          form.competencies.find(
            (competency) =>
              !competency
                .employeeScore ||
              !String(
                competency
                  .employeeComments ||
                  ""
              ).trim()
          );

        if (
          incompleteCompetency
        ) {
          setError(
            `Competency ${incompleteCompetency.competencyCode} requires a score and comments.`
          );
          return;
        }

        setSaving(true);

        const response =
          await api.post(
            `/api/hr/performance/${review.reviewNumber}/self-assessment`,
            {
              strengths:
                form.strengths,

              areasForImprovement:
                form
                  .areasForImprovement,

              overallComments:
                form
                  .overallComments,

              submissionNotes:
                form
                  .submissionNotes,

              goals:
                form.goals.map(
                  (goal) => ({
                    goalNumber:
                      goal.goalNumber,

                    employeeScore:
                      Number(
                        goal.employeeScore
                      ),

                    employeeProgressComments:
                      goal
                        .employeeProgressComments,

                    status:
                      goal.status,

                    evidenceReferences:
                      String(
                        goal
                          .evidenceReferences ||
                          ""
                      )
                        .split(",")
                        .map(
                          (
                            reference
                          ) =>
                            reference.trim()
                        )
                        .filter(
                          Boolean
                        ),
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

                    employeeScore:
                      Number(
                        competency
                          .employeeScore
                      ),

                    employeeComments:
                      competency
                        .employeeComments,
                  })
                ),
            }
          );

        setNotice(
          response.data.message ||
            "Performance self-assessment submitted successfully."
        );

        if (onChanged) {
          await onChanged(
            review.reviewNumber
          );
        }
      } catch (requestError) {
        console.error(
          "Submit performance self-assessment failed:",
          requestError
        );

        setError(
          requestError
            ?.response
            ?.data
            ?.message ||
            "Failed to submit the controlled performance self-assessment."
        );
      } finally {
        setSaving(false);
      }
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
            "#eef4ff",
        }}
      >
        <h3
          style={{
            color: ROYAL_BLUE,
            marginTop: 0,
            marginBottom: "6px",
          }}
        >
          Employee Self-Assessment
        </h3>

        <div
          style={{
            color: MUTED,
          }}
        >
          Score every assigned goal and competency, then provide your assessment comments.
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
                    color: MUTED,
                    marginTop: "5px",
                  }}
                >
                  {goal.description}
                </div>

                <div
                  style={{
                    marginTop: "7px",
                    color: "#334155",
                  }}
                >
                  <strong>
                    Success measure:
                  </strong>{" "}
                  {goal.successMeasure}
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
                      Progress status
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
                      My score (1–5)
                    </label>

                    <select
                      value={
                        goal.employeeScore
                      }
                      onChange={(
                        event
                      ) =>
                        updateGoal(
                          index,
                          "employeeScore",
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
                      Progress comments
                    </label>

                    <textarea
                      value={
                        goal
                          .employeeProgressComments
                      }
                      onChange={(
                        event
                      ) =>
                        updateGoal(
                          index,
                          "employeeProgressComments",
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

                  <div
                    style={{
                      gridColumn:
                        "1 / -1",
                    }}
                  >
                    <label
                      style={labelStyle}
                    >
                      Evidence references
                    </label>

                    <input
                      value={
                        goal
                          .evidenceReferences
                      }
                      onChange={(
                        event
                      ) =>
                        updateGoal(
                          index,
                          "evidenceReferences",
                          event.target
                            .value
                        )
                      }
                      placeholder="Separate multiple references with commas"
                      style={inputStyle}
                    />
                  </div>
                </div>
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
              No performance goals were assigned.
            </div>
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
                      color: MUTED,
                      marginTop: "5px",
                    }}
                  >
                    {
                      competency.description
                    }
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "minmax(140px, 200px) 1fr",
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
                        My score (1–5)
                      </label>

                      <select
                        value={
                          competency
                            .employeeScore
                        }
                        onChange={(
                          event
                        ) =>
                          updateCompetency(
                            index,
                            "employeeScore",
                            event
                              .target
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
                        Comments
                      </label>

                      <textarea
                        value={
                          competency
                            .employeeComments
                        }
                        onChange={(
                          event
                        ) =>
                          updateCompetency(
                            index,
                            "employeeComments",
                            event
                              .target
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
          Overall Assessment
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
                minHeight: "80px",
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
                minHeight: "80px",
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
                minHeight: "80px",
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
            submitSelfAssessment
          }
          disabled={saving}
        >
          {saving
            ? "Submitting..."
            : "Submit Self-Assessment"}
        </button>
      </div>
    </div>
  );
}

export default PerformanceSelfAssessmentPanel;