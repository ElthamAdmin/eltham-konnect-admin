import { useEffect, useState } from "react";
import api from "../api";

const normalizeString = (value) =>
  String(value || "").trim();

const todayYmd = () => {
  const now = new Date();

  const offset =
    now.getTimezoneOffset() *
    60000;

  return new Date(
    now.getTime() - offset
  )
    .toISOString()
    .slice(0, 10);
};

const getErrorMessage = (
  error,
  fallbackMessage
) =>
  error?.response?.data?.message ||
  error?.message ||
  fallbackMessage;

const createInitialPlanForm = (
  review
) => ({
  reason:
    normalizeString(
      review?.improvementPlan
        ?.reason
    ),

  expectedImprovement:
    normalizeString(
      review?.improvementPlan
        ?.expectedImprovement
    ),

  supportProvided:
    normalizeString(
      review?.improvementPlan
        ?.supportProvided
    ),

  startDate:
    normalizeString(
      review?.improvementPlan
        ?.startDate
    ),

  reviewDate:
    normalizeString(
      review?.improvementPlan
        ?.reviewDate
    ),

  activationNotes: "",
});

const createInitialOutcomeForm =
  () => ({
    outcome:
      "Successfully Completed",

    outcomeNotes: "",

    completionDate:
      todayYmd(),
  });

function PerformanceReviewCompletionPanel({
  review,
  isAdminHR = false,
  onChanged,
}) {
  const [
    acknowledgementConfirmed,
    setAcknowledgementConfirmed,
  ] = useState(false);

  const [
    acknowledgementComments,
    setAcknowledgementComments,
  ] = useState("");

  const [
    planForm,
    setPlanForm,
  ] = useState(() =>
    createInitialPlanForm(
      review
    )
  );

  const [
    outcomeForm,
    setOutcomeForm,
  ] = useState(
    createInitialOutcomeForm
  );

  const [error, setError] =
    useState("");

  const [notice, setNotice] =
    useState("");

  const [
    busyAction,
    setBusyAction,
  ] = useState("");

  useEffect(() => {
    setAcknowledgementConfirmed(
      false
    );

    setAcknowledgementComments(
      ""
    );

    setPlanForm(
      createInitialPlanForm(
        review
      )
    );

    setOutcomeForm(
      createInitialOutcomeForm()
    );

    setError("");
    setNotice("");
    setBusyAction("");
  }, [
    review?.reviewNumber,
    review?.updatedAt,
  ]);

  if (!review) {
    return null;
  }

  const reviewNumber =
    normalizeString(
      review.reviewNumber
    );

  const reviewStatus =
    normalizeString(
      review.status
    );

  const acknowledgementStatus =
    normalizeString(
      review
        ?.employeeAcknowledgement
        ?.status
    ) || "Pending";

  const improvementPlan =
    review.improvementPlan ||
    {};

  const improvementPlanStatus =
    normalizeString(
      improvementPlan.status
    ) || "Not Required";

  const showAcknowledgement =
    !isAdminHR &&
    reviewStatus ===
      "Awaiting Acknowledgement" &&
    review.acknowledgementRequired ===
      true &&
    ![
      "Acknowledged",
      "Acknowledged with Comments",
    ].includes(
      acknowledgementStatus
    );

  const showPlanActivation =
    isAdminHR &&
    reviewStatus ===
      "Improvement Plan" &&
    improvementPlan.required ===
      true &&
    improvementPlanStatus ===
      "Draft";

  const showPlanCompletion =
    isAdminHR &&
    reviewStatus ===
      "Improvement Plan" &&
    improvementPlan.required ===
      true &&
    improvementPlanStatus ===
      "Active";

  if (
    !showAcknowledgement &&
    !showPlanActivation &&
    !showPlanCompletion
  ) {
    return null;
  }

  const notifyParent = () => {
    if (
      typeof onChanged ===
      "function"
    ) {
      onChanged(
        reviewNumber
      );
    }
  };

  const updatePlanField = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setPlanForm(
      (current) => ({
        ...current,
        [name]: value,
      })
    );
  };

  const updateOutcomeField = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setOutcomeForm(
      (current) => ({
        ...current,
        [name]: value,
      })
    );
  };

  const acknowledgeReview =
    async () => {
      setError("");
      setNotice("");

      if (
        acknowledgementConfirmed !==
        true
      ) {
        setError(
          "Confirm that you have received and reviewed the performance result."
        );

        return;
      }

      const confirmed =
        window.confirm(
          `Acknowledge receipt of performance review ${reviewNumber}?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setBusyAction(
          "acknowledge"
        );

        const response =
          await api.post(
            `/api/hr/performance/${encodeURIComponent(
              reviewNumber
            )}/acknowledge`,
            {
              confirmed: true,

              comments:
                normalizeString(
                  acknowledgementComments
                ),
            }
          );

        setNotice(
          response?.data?.message ||
            `${reviewNumber} acknowledged successfully.`
        );

        notifyParent();
      } catch (actionError) {
        console.error(
          "Performance-review acknowledgement failed:",
          actionError
        );

        setError(
          getErrorMessage(
            actionError,
            "Failed to acknowledge the controlled performance review."
          )
        );
      } finally {
        setBusyAction("");
      }
    };

  const activateImprovementPlan =
    async () => {
      setError("");
      setNotice("");

      const payload = {
        reason:
          normalizeString(
            planForm.reason
          ),

        expectedImprovement:
          normalizeString(
            planForm
              .expectedImprovement
          ),

        supportProvided:
          normalizeString(
            planForm
              .supportProvided
          ),

        startDate:
          normalizeString(
            planForm.startDate
          ),

        reviewDate:
          normalizeString(
            planForm.reviewDate
          ),

        activationNotes:
          normalizeString(
            planForm
              .activationNotes
          ),
      };

      if (
        !payload.reason ||
        !payload.expectedImprovement ||
        !payload.supportProvided ||
        !payload.startDate ||
        !payload.reviewDate
      ) {
        setError(
          "Reason, expected improvement, support provided, start date and review date are required."
        );

        return;
      }

      if (
        payload.reviewDate <
        payload.startDate
      ) {
        setError(
          "The improvement-plan review date cannot be earlier than its start date."
        );

        return;
      }

      const confirmed =
        window.confirm(
          `Activate the controlled improvement plan for ${reviewNumber}?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setBusyAction(
          "activate"
        );

        const response =
          await api.post(
            `/api/hr/performance/${encodeURIComponent(
              reviewNumber
            )}/improvement-plan/activate`,
            payload
          );

        setNotice(
          response?.data?.message ||
            `The improvement plan for ${reviewNumber} was activated successfully.`
        );

        notifyParent();
      } catch (actionError) {
        console.error(
          "Performance improvement-plan activation failed:",
          actionError
        );

        setError(
          getErrorMessage(
            actionError,
            "Failed to activate the controlled performance improvement plan."
          )
        );
      } finally {
        setBusyAction("");
      }
    };

  const completeImprovementPlan =
    async () => {
      setError("");
      setNotice("");

      const payload = {
        outcome:
          normalizeString(
            outcomeForm.outcome
          ),

        outcomeNotes:
          normalizeString(
            outcomeForm
              .outcomeNotes
          ),

        completionDate:
          normalizeString(
            outcomeForm
              .completionDate
          ),
      };

      if (
        !payload.outcomeNotes ||
        !payload.completionDate
      ) {
        setError(
          "Improvement-plan outcome notes and completion date are required."
        );

        return;
      }

      const confirmed =
        window.confirm(
          `Mark the improvement plan for ${reviewNumber} as ${payload.outcome}?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setBusyAction(
          "complete"
        );

        const response =
          await api.post(
            `/api/hr/performance/${encodeURIComponent(
              reviewNumber
            )}/improvement-plan/complete`,
            payload
          );

        setNotice(
          response?.data?.message ||
            `The improvement plan for ${reviewNumber} was completed successfully.`
        );

        notifyParent();
      } catch (actionError) {
        console.error(
          "Performance improvement-plan completion failed:",
          actionError
        );

        setError(
          getErrorMessage(
            actionError,
            "Failed to complete the controlled performance improvement plan."
          )
        );
      } finally {
        setBusyAction("");
      }
    };

  const sectionStyle = {
    marginTop: "18px",
    padding: "16px",
    border:
      "1px solid #d8e1ef",
    borderRadius: "12px",
    backgroundColor:
      "#ffffff",
  };

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box",
    padding: "10px",
    border:
      "1px solid #cdd8e8",
    borderRadius: "7px",
    backgroundColor:
      "#ffffff",
  };

  const textareaStyle = {
    ...inputStyle,
    resize: "vertical",
  };

  const labelStyle = {
    display: "block",
    marginBottom: "6px",
    fontWeight: 700,
    color: "#334155",
  };

  const buttonStyle = (
    backgroundColor
  ) => ({
    padding: "10px 16px",
    border: 0,
    borderRadius: "7px",
    backgroundColor,
    color: "#ffffff",
    fontWeight: 700,
    cursor: busyAction
      ? "not-allowed"
      : "pointer",
  });

  return (
    <section
      style={sectionStyle}
    >
      <div
        style={{
          marginBottom: "14px",
        }}
      >
        <h3
          style={{
            margin: 0,
            color: "#073f93",
          }}
        >
          Performance Completion Controls
        </h3>

        <p
          style={{
            margin:
              "5px 0 0",
            color: "#64748b",
          }}
        >
          Controlled acknowledgement and
          performance-improvement-plan
          lifecycle actions.
        </p>
      </div>

      {(error || notice) && (
        <div
          style={{
            marginBottom: "14px",
            padding: "11px 13px",
            borderRadius: "8px",
            border: error
              ? "1px solid #f3b2b2"
              : "1px solid #a9dfbd",
            backgroundColor: error
              ? "#fff1f1"
              : "#eefbf2",
            color: error
              ? "#b42318"
              : "#16733b",
          }}
        >
          {error || notice}
        </div>
      )}

      {showAcknowledgement && (
        <article
          style={{
            padding: "15px",
            border:
              "1px solid #c7d8ef",
            borderRadius: "10px",
            backgroundColor:
              "#f8faff",
          }}
        >
          <h4
            style={{
              margin:
                "0 0 8px",
              color: "#073f93",
            }}
          >
            Employee Acknowledgement
          </h4>

          <p
            style={{
              color: "#475569",
            }}
          >
            Acknowledgement confirms that
            you received and reviewed the
            performance result.
          </p>

          <p>
            <strong>
              Final score:
            </strong>{" "}
            {review.finalScore ??
              "Not available"}
          </p>

          <p>
            <strong>
              Final rating:
            </strong>{" "}
            {review.finalRating ||
              "Not Rated"}
          </p>

          {review.finalSummary && (
            <div
              style={{
                marginBottom:
                  "14px",
                whiteSpace:
                  "pre-wrap",
              }}
            >
              <strong>
                Final summary:
              </strong>

              <div>
                {review.finalSummary}
              </div>
            </div>
          )}

          <label
            style={labelStyle}
          >
            Comments
          </label>

          <textarea
            value={
              acknowledgementComments
            }
            onChange={(event) =>
              setAcknowledgementComments(
                event.target.value
              )
            }
            rows={4}
            placeholder="Optional acknowledgement comments"
            style={
              textareaStyle
            }
          />

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              margin:
                "13px 0",
              fontWeight: 700,
            }}
          >
            <input
              type="checkbox"
              checked={
                acknowledgementConfirmed
              }
              onChange={(event) =>
                setAcknowledgementConfirmed(
                  event.target
                    .checked
                )
              }
            />

            I confirm that I received and
            reviewed this performance
            result.
          </label>

          <button
            type="button"
            onClick={
              acknowledgeReview
            }
            disabled={
              Boolean(
                busyAction
              )
            }
            style={buttonStyle(
              "#0b3d91"
            )}
          >
            {busyAction ===
            "acknowledge"
              ? "Acknowledging..."
              : "Acknowledge Review"}
          </button>
        </article>
      )}

      {showPlanActivation && (
        <article
          style={{
            padding: "15px",
            border:
              "1px solid #f0c98a",
            borderRadius: "10px",
            backgroundColor:
              "#fffbeb",
          }}
        >
          <h4
            style={{
              margin:
                "0 0 12px",
              color: "#92400e",
            }}
          >
            Activate Performance
            Improvement Plan
          </h4>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "13px",
            }}
          >
            <div>
              <label
                style={labelStyle}
              >
                Reason
              </label>

              <textarea
                name="reason"
                value={
                  planForm.reason
                }
                onChange={
                  updatePlanField
                }
                rows={4}
                style={
                  textareaStyle
                }
              />
            </div>

            <div>
              <label
                style={labelStyle}
              >
                Expected improvement
              </label>

              <textarea
                name="expectedImprovement"
                value={
                  planForm
                    .expectedImprovement
                }
                onChange={
                  updatePlanField
                }
                rows={4}
                style={
                  textareaStyle
                }
              />
            </div>

            <div>
              <label
                style={labelStyle}
              >
                Support provided
              </label>

              <textarea
                name="supportProvided"
                value={
                  planForm
                    .supportProvided
                }
                onChange={
                  updatePlanField
                }
                rows={4}
                style={
                  textareaStyle
                }
              />
            </div>

            <div>
              <label
                style={labelStyle}
              >
                Activation notes
              </label>

              <textarea
                name="activationNotes"
                value={
                  planForm
                    .activationNotes
                }
                onChange={
                  updatePlanField
                }
                rows={4}
                placeholder="Optional controlled workflow notes"
                style={
                  textareaStyle
                }
              />
            </div>

            <div>
              <label
                style={labelStyle}
              >
                Start date
              </label>

              <input
                type="date"
                name="startDate"
                value={
                  planForm.startDate
                }
                onChange={
                  updatePlanField
                }
                style={inputStyle}
              />
            </div>

            <div>
              <label
                style={labelStyle}
              >
                Review date
              </label>

              <input
                type="date"
                name="reviewDate"
                value={
                  planForm.reviewDate
                }
                onChange={
                  updatePlanField
                }
                style={inputStyle}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={
              activateImprovementPlan
            }
            disabled={
              Boolean(
                busyAction
              )
            }
            style={{
              ...buttonStyle(
                "#d97706"
              ),
              marginTop: "14px",
            }}
          >
            {busyAction ===
            "activate"
              ? "Activating..."
              : "Activate Improvement Plan"}
          </button>
        </article>
      )}

      {showPlanCompletion && (
        <article
          style={{
            padding: "15px",
            border:
              "1px solid #c7d8ef",
            borderRadius: "10px",
            backgroundColor:
              "#f8faff",
          }}
        >
          <h4
            style={{
              margin:
                "0 0 12px",
              color: "#073f93",
            }}
          >
            Complete Performance
            Improvement Plan
          </h4>

          <p>
            <strong>
              Plan:
            </strong>{" "}
            {improvementPlan
              .planNumber ||
              `PIP-${reviewNumber}`}
          </p>

          <p>
            <strong>
              Review date:
            </strong>{" "}
            {improvementPlan
              .reviewDate ||
              "Not recorded"}
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "13px",
            }}
          >
            <div>
              <label
                style={labelStyle}
              >
                Outcome
              </label>

              <select
                name="outcome"
                value={
                  outcomeForm.outcome
                }
                onChange={
                  updateOutcomeField
                }
                style={inputStyle}
              >
                <option
                  value="Successfully Completed"
                >
                  Successfully Completed
                </option>

                <option
                  value="Unsuccessfully Completed"
                >
                  Unsuccessfully Completed
                </option>
              </select>
            </div>

            <div>
              <label
                style={labelStyle}
              >
                Completion date
              </label>

              <input
                type="date"
                name="completionDate"
                value={
                  outcomeForm
                    .completionDate
                }
                onChange={
                  updateOutcomeField
                }
                style={inputStyle}
              />
            </div>
          </div>

          <div
            style={{
              marginTop: "13px",
            }}
          >
            <label
              style={labelStyle}
            >
              Outcome notes
            </label>

            <textarea
              name="outcomeNotes"
              value={
                outcomeForm
                  .outcomeNotes
              }
              onChange={
                updateOutcomeField
              }
              rows={5}
              placeholder="Record the evidence supporting the final improvement-plan outcome."
              style={
                textareaStyle
              }
            />
          </div>

          <button
            type="button"
            onClick={
              completeImprovementPlan
            }
            disabled={
              Boolean(
                busyAction
              )
            }
            style={{
              ...buttonStyle(
                outcomeForm.outcome ===
                  "Successfully Completed"
                  ? "#0b9f43"
                  : "#b42318"
              ),
              marginTop: "14px",
            }}
          >
            {busyAction ===
            "complete"
              ? "Completing..."
              : "Complete Improvement Plan"}
          </button>
        </article>
      )}
    </section>
  );
}

export default PerformanceReviewCompletionPanel;