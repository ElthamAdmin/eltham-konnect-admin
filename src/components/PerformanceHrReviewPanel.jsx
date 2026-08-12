import { useEffect, useState } from "react";
import api from "../api";

const normalizeString = (value) =>
  String(value || "").trim();

const getErrorMessage = (
  error,
  fallbackMessage
) =>
  error?.response?.data?.message ||
  error?.message ||
  fallbackMessage;

const createInitialForm = (
  review
) => ({
  returnReason: "",
  hrNotes:
    normalizeString(
      review?.hrReview?.notes
    ),
  finalSummary:
    normalizeString(
      review?.finalSummary
    ),
});

function PerformanceHrReviewPanel({
  review,
  onUpdated,
}) {
  const [form, setForm] =
    useState(() =>
      createInitialForm(review)
    );

  const [error, setError] =
    useState("");

  const [notice, setNotice] =
    useState("");

  const [busyAction, setBusyAction] =
    useState("");

  useEffect(() => {
    setForm(
      createInitialForm(review)
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

  /*
   * HR review actions are deliberately
   * available only while the controlled
   * review is at HR Review.
   */
  if (
    reviewStatus !==
    "HR Review"
  ) {
    return null;
  }

  const updateField = (
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

  const notifyParent = (
    updatedReview
  ) => {
    if (
      typeof onUpdated ===
      "function"
    ) {
      onUpdated(
        updatedReview
      );
    }
  };

  const returnToManager =
    async () => {
      setError("");
      setNotice("");

      const returnReason =
        normalizeString(
          form.returnReason
        );

      if (!returnReason) {
        setError(
          "Enter the reason for returning the assessment to the manager."
        );
        return;
      }

      const confirmed =
        window.confirm(
          `Return ${reviewNumber} to the assigned manager for correction?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setBusyAction(
          "return"
        );

        const response =
          await api.post(
            `/api/hr/performance/${encodeURIComponent(
              reviewNumber
            )}/hr-review/return`,
            {
              returnReason,
            }
          );

        const updatedReview =
          response?.data?.data;

        setNotice(
          response?.data?.message ||
            `${reviewNumber} was returned to the manager successfully.`
        );

        notifyParent(
          updatedReview
        );
      } catch (actionError) {
        console.error(
          "Could not return performance review to manager:",
          actionError
        );

        setError(
          getErrorMessage(
            actionError,
            "Could not return the performance review to the manager."
          )
        );
      } finally {
        setBusyAction("");
      }
    };

  const approveHrReview =
    async () => {
      setError("");
      setNotice("");

      const hrNotes =
        normalizeString(
          form.hrNotes
        );

      const finalSummary =
        normalizeString(
          form.finalSummary
        );

      if (!hrNotes) {
        setError(
          "Enter the HR review notes."
        );
        return;
      }

      if (!finalSummary) {
        setError(
          "Enter the final performance-review summary."
        );
        return;
      }

      const confirmed =
        window.confirm(
          `Approve and finalize the HR review for ${reviewNumber}?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setBusyAction(
          "approve"
        );

        const response =
          await api.post(
            `/api/hr/performance/${encodeURIComponent(
              reviewNumber
            )}/hr-review/approve`,
            {
              hrNotes,
              finalSummary,
            }
          );

        const updatedReview =
          response?.data?.data;

        setNotice(
          response?.data?.message ||
            `${reviewNumber} was approved by HR successfully.`
        );

        notifyParent(
          updatedReview
        );
      } catch (actionError) {
        console.error(
          "Could not approve performance review by HR:",
          actionError
        );

        setError(
          getErrorMessage(
            actionError,
            "Could not approve the performance review."
          )
        );
      } finally {
        setBusyAction("");
      }
    };

  const goalScore =
    review?.managerAssessment
      ?.goalScore;

  const competencyScore =
    review?.managerAssessment
      ?.competencyScore;

  const overallScore =
    review?.managerAssessment
      ?.overallScore;

  return (
    <section
      style={{
        marginTop: "18px",
        padding: "16px",
        border:
          "1px solid #d8e1ef",
        borderRadius: "12px",
        background: "#ffffff",
      }}
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
          HR Review and Final Approval
        </h3>

        <p
          style={{
            margin:
              "5px 0 0",
            color: "#5d6b82",
          }}
        >
          Review the manager assessment,
          return it for correction or approve
          the controlled performance result.
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
            background: error
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

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "12px",
          marginBottom: "16px",
        }}
      >
        <article
          style={{
            padding: "12px",
            border:
              "1px solid #d8e1ef",
            borderRadius: "9px",
            background: "#f8faff",
          }}
        >
          <strong>
            Review
          </strong>

          <div>
            {reviewNumber}
          </div>
        </article>

        <article
          style={{
            padding: "12px",
            border:
              "1px solid #d8e1ef",
            borderRadius: "9px",
            background: "#f8faff",
          }}
        >
          <strong>
            Employee
          </strong>

          <div>
            {review?.employeeSnapshot
              ?.fullName ||
              review?.employeeName ||
              review?.employeeId ||
              "—"}
          </div>
        </article>

        <article
          style={{
            padding: "12px",
            border:
              "1px solid #d8e1ef",
            borderRadius: "9px",
            background: "#f8faff",
          }}
        >
          <strong>
            Manager
          </strong>

          <div>
            {review?.managerName ||
              review
                ?.managerSnapshot
                ?.fullName ||
              review
                ?.managerEmployeeId ||
              "—"}
          </div>
        </article>

        <article
          style={{
            padding: "12px",
            border:
              "1px solid #d8e1ef",
            borderRadius: "9px",
            background: "#f8faff",
          }}
        >
          <strong>
            Status
          </strong>

          <div>
            {reviewStatus}
          </div>
        </article>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "12px",
          marginBottom: "16px",
        }}
      >
        <article
          style={{
            padding: "12px",
            border:
              "1px solid #d8e1ef",
            borderRadius: "9px",
          }}
        >
          <strong>
            Goal Score
          </strong>

          <div>
            {goalScore ??
              review?.goalScore ??
              "Not calculated"}
          </div>
        </article>

        <article
          style={{
            padding: "12px",
            border:
              "1px solid #d8e1ef",
            borderRadius: "9px",
          }}
        >
          <strong>
            Competency Score
          </strong>

          <div>
            {competencyScore ??
              review
                ?.competencyScore ??
              "Not calculated"}
          </div>
        </article>

        <article
          style={{
            padding: "12px",
            border:
              "1px solid #d8e1ef",
            borderRadius: "9px",
          }}
        >
          <strong>
            Overall Score
          </strong>

          <div>
            {overallScore ??
              review?.finalScore ??
              "Not calculated"}
          </div>
        </article>

        <article
          style={{
            padding: "12px",
            border:
              "1px solid #d8e1ef",
            borderRadius: "9px",
          }}
        >
          <strong>
            Provisional Rating
          </strong>

          <div>
            {review
              ?.managerAssessment
              ?.overallRating ||
              review?.finalRating ||
              "Not rated"}
          </div>
        </article>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "14px",
        }}
      >
        <article
          style={{
            padding: "14px",
            border:
              "1px solid #d8e1ef",
            borderRadius: "10px",
          }}
        >
          <h4
            style={{
              margin:
                "0 0 10px",
              color: "#073f93",
            }}
          >
            Manager Assessment Evidence
          </h4>

          <p>
            <strong>
              Strengths:
            </strong>{" "}
            {review
              ?.managerAssessment
              ?.strengths ||
              "—"}
          </p>

          <p>
            <strong>
              Areas for improvement:
            </strong>{" "}
            {review
              ?.managerAssessment
              ?.areasForImprovement ||
              "—"}
          </p>

          <p>
            <strong>
              Overall comments:
            </strong>{" "}
            {review
              ?.managerAssessment
              ?.overallComments ||
              "—"}
          </p>

          <p>
            <strong>
              Development actions:
            </strong>{" "}
            {review
              ?.managerAssessment
              ?.developmentActions ||
              review
                ?.developmentActions ||
              "—"}
          </p>
        </article>

        <article
          style={{
            padding: "14px",
            border:
              "1px solid #d8e1ef",
            borderRadius: "10px",
          }}
        >
          <h4
            style={{
              margin:
                "0 0 10px",
              color: "#073f93",
            }}
          >
            HR Approval
          </h4>

          <label
            style={{
              display: "block",
              marginBottom: "6px",
              fontWeight: 700,
            }}
          >
            HR review notes
          </label>

          <textarea
            name="hrNotes"
            value={form.hrNotes}
            onChange={updateField}
            rows={4}
            placeholder="Record HR’s review of the scores, evidence, consistency and policy compliance."
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: "12px",
              border:
                "1px solid #cdd8e8",
              borderRadius: "7px",
              resize: "vertical",
              boxSizing:
                "border-box",
            }}
          />

          <label
            style={{
              display: "block",
              marginBottom: "6px",
              fontWeight: 700,
            }}
          >
            Final summary
          </label>

          <textarea
            name="finalSummary"
            value={
              form.finalSummary
            }
            onChange={updateField}
            rows={4}
            placeholder="Enter the final controlled performance-review summary."
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: "12px",
              border:
                "1px solid #cdd8e8",
              borderRadius: "7px",
              resize: "vertical",
              boxSizing:
                "border-box",
            }}
          />

          <button
            type="button"
            onClick={
              approveHrReview
            }
            disabled={
              Boolean(
                busyAction
              )
            }
            style={{
              padding:
                "10px 16px",
              border: 0,
              borderRadius: "7px",
              background:
                "#0b9f43",
              color: "#ffffff",
              fontWeight: 700,
              cursor: busyAction
                ? "not-allowed"
                : "pointer",
            }}
          >
            {busyAction ===
            "approve"
              ? "Approving..."
              : "Approve HR Review"}
          </button>
        </article>

        <article
          style={{
            padding: "14px",
            border:
              "1px solid #f0b7b7",
            borderRadius: "10px",
            background: "#fff8f8",
          }}
        >
          <h4
            style={{
              margin:
                "0 0 10px",
              color: "#b42318",
            }}
          >
            Return to Manager
          </h4>

          <p
            style={{
              color: "#5d6b82",
            }}
          >
            Use this when the manager must
            correct scores, comments or
            assessment evidence.
          </p>

          <label
            style={{
              display: "block",
              marginBottom: "6px",
              fontWeight: 700,
            }}
          >
            Return reason
          </label>

          <textarea
            name="returnReason"
            value={
              form.returnReason
            }
            onChange={updateField}
            rows={4}
            placeholder="Explain exactly what the manager must correct."
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: "12px",
              border:
                "1px solid #e2b8b8",
              borderRadius: "7px",
              resize: "vertical",
              boxSizing:
                "border-box",
            }}
          />

          <button
            type="button"
            onClick={
              returnToManager
            }
            disabled={
              Boolean(
                busyAction
              )
            }
            style={{
              padding:
                "10px 16px",
              border: 0,
              borderRadius: "7px",
              background:
                "#d97706",
              color: "#ffffff",
              fontWeight: 700,
              cursor: busyAction
                ? "not-allowed"
                : "pointer",
            }}
          >
            {busyAction ===
            "return"
              ? "Returning..."
              : "Return to Manager"}
          </button>
        </article>
      </div>
    </section>
  );
}

export default PerformanceHrReviewPanel;