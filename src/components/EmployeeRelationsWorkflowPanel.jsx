import { useMemo, useState } from "react";
import api from "../api";

const DECISION_OUTCOMES = [
  "No Action",
  "Informal Resolution",
  "Verbal Warning",
  "Written Warning",
  "Final Warning",
  "Performance Improvement Plan",
  "Suspension",
  "Termination Recommended",
  "Grievance Upheld",
  "Grievance Partially Upheld",
  "Grievance Not Upheld",
  "Mediation",
  "Other",
];

const APPEAL_OUTCOMES = [
  "Upheld",
  "Partially Upheld",
  "Dismissed",
];

function EmployeeRelationsWorkflowPanel({
  record,
  employees = [],
  isAdminHR = false,
  onChanged,
}) {
  const ROYAL_BLUE = "#0B3D91";
  const BORDER = "#dbe3ef";
  const MUTED = "#64748b";

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [notice, setNotice] =
    useState("");

  const [
    submissionNotes,
    setSubmissionNotes,
  ] = useState("");

  const [
    investigatorEmployeeId,
    setInvestigatorEmployeeId,
  ] = useState("");

  const [
    investigationNotes,
    setInvestigationNotes,
  ] = useState("");

  const [hearingForm, setHearingForm] =
    useState({
      hearingDate: "",
      startTime: "",
      location: "",
      chairperson: "",
      schedulingNotes: "",
      employeeNotified: false,
    });

  const [
    hearingCompletion,
    setHearingCompletion,
  ] = useState({
    hearingNumber: "",
    hearingNotes: "",
    minutesDocumentNumber: "",
  });

  const [decisionForm, setDecisionForm] =
    useState({
      outcome: "No Action",
      summary: "",
      reasons: "",
      actionRequired: "",
      effectiveDate: "",
      reviewDate: "",
      decisionDocumentNumber: "",
      acknowledgementRequired: true,
    });

  const [
    acknowledgementForm,
    setAcknowledgementForm,
  ] = useState({
    receiptConfirmed: false,
    comments: "",
  });

  const [appealForm, setAppealForm] =
    useState({
      grounds: "",
      requestedOutcome: "",
    });

  const [
    appealDecisionForm,
    setAppealDecisionForm,
  ] = useState({
    appealNumber: "",
    outcome: "Upheld",
    decision: "",
    decisionReason: "",
  });

  const [
    withdrawalReason,
    setWithdrawalReason,
  ] = useState("");

  const [
    closureSummary,
    setClosureSummary,
  ] = useState("");

  const inputStyle = {
    width: "100%",
    padding: "10px",
    border: `1px solid ${BORDER}`,
    borderRadius: "8px",
    boxSizing: "border-box",
    backgroundColor: "#ffffff",
  };

  const labelStyle = {
    display: "block",
    fontWeight: "bold",
    marginBottom: "6px",
    color: "#0f172a",
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

  const warningButton = {
    ...primaryButton,
    backgroundColor: "#d97706",
  };

  const dangerButton = {
    ...primaryButton,
    backgroundColor: "#b91c1c",
  };

  const actionCardStyle = {
    border: `1px solid ${BORDER}`,
    borderRadius: "12px",
    padding: "14px",
    backgroundColor: "#ffffff",
  };

  const scheduledHearings =
    useMemo(
      () =>
        (record?.hearings || [])
          .filter(
            (hearing) =>
              hearing.status ===
              "Scheduled"
          ),
      [record]
    );

  const activeAppeal =
    useMemo(
      () =>
        (record?.appeals || [])
          .find((appeal) =>
            [
              "Submitted",
              "Under Review",
              "Hearing Scheduled",
            ].includes(
              appeal.status
            )
          ),
      [record]
    );

  if (!record?.caseNumber) {
    return null;
  }

  const runAction = async ({
    endpoint,
    payload,
    confirmation,
  }) => {
    setError("");
    setNotice("");

    if (
      confirmation &&
      !window.confirm(
        confirmation
      )
    ) {
      return;
    }

    setLoading(true);

    try {
      const response =
        await api.post(
          endpoint,
          payload
        );

      setNotice(
        response.data?.message ||
        "The controlled case was updated successfully."
      );

      if (onChanged) {
        await onChanged(
          record.caseNumber
        );
      }
    } catch (requestError) {
      console.error(
        "Employee-relations workflow action failed:",
        requestError
      );

      setError(
        requestError.response
          ?.data?.message ||
          requestError.message ||
          "The controlled case action failed."
      );
    } finally {
      setLoading(false);
    }
  };

  const submitDisciplineCase =
    async () => {
      if (!submissionNotes.trim()) {
        setError(
          "Discipline case submission notes are required."
        );
        return;
      }

      await runAction({
        endpoint:
          `/api/employee-relations/${record.caseNumber}/submit`,

        payload: {
          submissionNotes:
            submissionNotes.trim(),
        },

        confirmation:
          `Submit ${record.caseNumber} for controlled review?`,
      });
    };

  const startInvestigation =
    async () => {
      const investigator =
        employees.find(
          (employee) =>
            employee.employeeId ===
            investigatorEmployeeId
        );

      if (
        !investigator ||
        !investigator.linkedUserId
      ) {
        setError(
          "Select an investigator with a linked system user."
        );
        return;
      }

      if (
        !investigationNotes.trim()
      ) {
        setError(
          "Investigation-opening notes are required."
        );
        return;
      }

      await runAction({
        endpoint:
          `/api/employee-relations/${record.caseNumber}/investigation`,

        payload: {
          assignedTo:
            investigator.fullName,

          assignedToUserId:
            investigator.linkedUserId,

          investigationNotes:
            investigationNotes.trim(),
        },

        confirmation:
          `Start the investigation for ${record.caseNumber}?`,
      });
    };

  const scheduleHearing =
    async () => {
      if (
        !hearingForm.hearingDate ||
        !hearingForm
          .chairperson
          .trim() ||
        !hearingForm
          .schedulingNotes
          .trim()
      ) {
        setError(
          "Hearing date, chairperson and scheduling notes are required."
        );
        return;
      }

      await runAction({
        endpoint:
          `/api/employee-relations/${record.caseNumber}/hearings`,

        payload: {
          hearingDate:
            hearingForm.hearingDate,

          startTime:
            hearingForm.startTime,

          location:
            hearingForm.location.trim(),

          chairperson:
            hearingForm
              .chairperson
              .trim(),

          schedulingNotes:
            hearingForm
              .schedulingNotes
              .trim(),

          employeeNotified:
            hearingForm
              .employeeNotified,

          attendees: [],
        },

        confirmation:
          `Schedule this hearing for ${record.caseNumber}?`,
      });
    };

  const completeHearing =
    async () => {
      if (
        !hearingCompletion
          .hearingNumber
      ) {
        setError(
          "Select the scheduled hearing to complete."
        );
        return;
      }

      if (
        !hearingCompletion
          .hearingNotes
          .trim()
      ) {
        setError(
          "Completed hearing notes are required."
        );
        return;
      }

      await runAction({
        endpoint:
          `/api/employee-relations/${record.caseNumber}/hearings/${hearingCompletion.hearingNumber}/complete`,

        payload: {
          hearingNotes:
            hearingCompletion
              .hearingNotes
              .trim(),

          minutesDocumentNumber:
            hearingCompletion
              .minutesDocumentNumber
              .trim(),
        },

        confirmation:
          `Complete ${hearingCompletion.hearingNumber} and move the case to Awaiting Decision?`,
      });
    };

  const issueDecision =
    async () => {
      if (
        !decisionForm.outcome ||
        !decisionForm.summary.trim() ||
        !decisionForm.reasons.trim()
      ) {
        setError(
          "Decision outcome, summary and reasons are required."
        );
        return;
      }

      await runAction({
        endpoint:
          `/api/employee-relations/${record.caseNumber}/decision`,

        payload: {
          ...decisionForm,

          summary:
            decisionForm
              .summary
              .trim(),

          reasons:
            decisionForm
              .reasons
              .trim(),

          actionRequired:
            decisionForm
              .actionRequired
              .trim(),

          decisionDocumentNumber:
            decisionForm
              .decisionDocumentNumber
              .trim(),
        },

        confirmation:
          `Issue the controlled decision for ${record.caseNumber}? This creates an official case decision.`,
      });
    };

  const acknowledgeDecision =
    async () => {
      if (
        acknowledgementForm
          .receiptConfirmed !==
        true
      ) {
        setError(
          "You must expressly confirm receipt of the decision."
        );
        return;
      }

      await runAction({
        endpoint:
          `/api/employee-relations/${record.caseNumber}/acknowledge`,

        payload: {
          receiptConfirmed:
            true,

          comments:
            acknowledgementForm
              .comments
              .trim(),
        },

        confirmation:
          "Confirm receipt of this decision? This confirms receipt only and does not indicate agreement or waive appeal rights.",
      });
    };

  const submitAppeal =
    async () => {
      if (!appealForm.grounds.trim()) {
        setError(
          "Appeal grounds are required."
        );
        return;
      }

      await runAction({
        endpoint:
          `/api/employee-relations/${record.caseNumber}/appeals`,

        payload: {
          grounds:
            appealForm
              .grounds
              .trim(),

          requestedOutcome:
            appealForm
              .requestedOutcome
              .trim(),
        },

        confirmation:
          `Submit an appeal for ${record.caseNumber}?`,
      });
    };

  const decideAppeal =
    async () => {
      if (
        !appealDecisionForm
          .appealNumber
      ) {
        setError(
          "Select the appeal to decide."
        );
        return;
      }

      if (
        !appealDecisionForm
          .decision
          .trim() ||
        !appealDecisionForm
          .decisionReason
          .trim()
      ) {
        setError(
          "Appeal decision and decision reason are required."
        );
        return;
      }

      await runAction({
        endpoint:
          `/api/employee-relations/${record.caseNumber}/appeals/${appealDecisionForm.appealNumber}/decision`,

        payload: {
          outcome:
            appealDecisionForm
              .outcome,

          decision:
            appealDecisionForm
              .decision
              .trim(),

          decisionReason:
            appealDecisionForm
              .decisionReason
              .trim(),
        },

        confirmation:
          `Issue the controlled appeal decision for ${appealDecisionForm.appealNumber}?`,
      });
    };

  const withdrawGrievance =
    async () => {
      if (!withdrawalReason.trim()) {
        setError(
          "A grievance withdrawal reason is required."
        );
        return;
      }

      await runAction({
        endpoint:
          `/api/employee-relations/${record.caseNumber}/withdraw`,

        payload: {
          withdrawalReason:
            withdrawalReason.trim(),
        },

        confirmation:
          `Withdraw grievance ${record.caseNumber}? This action is recorded in the case history.`,
      });
    };

  const closeCase = async () => {
    if (!closureSummary.trim()) {
      setError(
        "A controlled case closure summary is required."
      );
      return;
    }

    await runAction({
      endpoint:
        `/api/employee-relations/${record.caseNumber}/close`,

      payload: {
        closureSummary:
          closureSummary.trim(),
      },

      confirmation:
        `Close ${record.caseNumber}? Closing preserves its complete record and audit history.`,
    });
  };

  const renderTextarea = ({
    label,
    value,
    onChange,
    placeholder = "",
  }) => (
    <div>
      <label style={labelStyle}>
        {label}
      </label>

      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          ...inputStyle,
          minHeight: "85px",
        }}
      />
    </div>
  );

  return (
    <div
      style={{
        display: "grid",
        gap: "14px",
        marginTop: "18px",
      }}
    >
      <div>
        <h3
          style={{
            color: ROYAL_BLUE,
            margin: 0,
          }}
        >
          Workflow and Lifecycle Controls
        </h3>

        <div
          style={{
            color: MUTED,
            marginTop: "5px",
          }}
        >
          Available controls are restricted
          by the current case status and your
          permissions.
        </div>
      </div>

      {(error || notice) && (
        <div
          style={{
            padding: "11px 13px",
            borderRadius: "8px",
            border:
              error
                ? "1px solid #fecaca"
                : "1px solid #bbf7d0",
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

      {isAdminHR &&
        record.caseType ===
          "Discipline" &&
        record.status === "Draft" && (
          <div style={actionCardStyle}>
            <h4 style={{ marginTop: 0 }}>
              Submit Discipline Case
            </h4>

            {renderTextarea({
              label:
                "Submission notes",
              value:
                submissionNotes,
              onChange: (event) =>
                setSubmissionNotes(
                  event.target.value
                ),
            })}

            <button
              type="button"
              style={{
                ...primaryButton,
                marginTop: "10px",
              }}
              onClick={
                submitDisciplineCase
              }
              disabled={loading}
            >
              Submit Case
            </button>
          </div>
        )}

      {isAdminHR &&
        [
          "Submitted",
          "Under Review",
        ].includes(
          record.status
        ) && (
          <div style={actionCardStyle}>
            <h4 style={{ marginTop: 0 }}>
              Start Investigation
            </h4>

            <div
              style={{
                display: "grid",
                gap: "10px",
              }}
            >
              <div>
                <label style={labelStyle}>
                  Assigned investigator
                </label>

                <select
                  value={
                    investigatorEmployeeId
                  }
                  onChange={(event) =>
                    setInvestigatorEmployeeId(
                      event.target.value
                    )
                  }
                  style={inputStyle}
                >
                  <option value="">
                    Select investigator
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
                        disabled={
                          !employee.linkedUserId
                        }
                      >
                        {employee.fullName} (
                        {
                          employee.employeeId
                        })
                        {!employee.linkedUserId
                          ? " — No linked user"
                          : ""}
                      </option>
                    )
                  )}
                </select>
              </div>

              {renderTextarea({
                label:
                  "Investigation-opening notes",
                value:
                  investigationNotes,
                onChange: (event) =>
                  setInvestigationNotes(
                    event.target.value
                  ),
              })}

              <button
                type="button"
                style={primaryButton}
                onClick={
                  startInvestigation
                }
                disabled={loading}
              >
                Start Investigation
              </button>
            </div>
          </div>
        )}

      {isAdminHR &&
        [
          "Submitted",
          "Under Review",
          "Investigation",
        ].includes(
          record.status
        ) && (
          <div style={actionCardStyle}>
            <h4 style={{ marginTop: 0 }}>
              Schedule Hearing
            </h4>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "10px",
              }}
            >
              <div>
                <label style={labelStyle}>
                  Hearing date
                </label>

                <input
                  type="date"
                  value={
                    hearingForm
                      .hearingDate
                  }
                  onChange={(event) =>
                    setHearingForm(
                      (previous) => ({
                        ...previous,
                        hearingDate:
                          event.target
                            .value,
                      })
                    )
                  }
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>
                  Start time
                </label>

                <input
                  type="time"
                  value={
                    hearingForm
                      .startTime
                  }
                  onChange={(event) =>
                    setHearingForm(
                      (previous) => ({
                        ...previous,
                        startTime:
                          event.target
                            .value,
                      })
                    )
                  }
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>
                  Location
                </label>

                <input
                  value={
                    hearingForm.location
                  }
                  onChange={(event) =>
                    setHearingForm(
                      (previous) => ({
                        ...previous,
                        location:
                          event.target
                            .value,
                      })
                    )
                  }
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>
                  Chairperson
                </label>

                <input
                  value={
                    hearingForm
                      .chairperson
                  }
                  onChange={(event) =>
                    setHearingForm(
                      (previous) => ({
                        ...previous,
                        chairperson:
                          event.target
                            .value,
                      })
                    )
                  }
                  style={inputStyle}
                />
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gap: "10px",
                marginTop: "10px",
              }}
            >
              {renderTextarea({
                label:
                  "Scheduling notes",
                value:
                  hearingForm
                    .schedulingNotes,
                onChange: (event) =>
                  setHearingForm(
                    (previous) => ({
                      ...previous,
                      schedulingNotes:
                        event.target
                          .value,
                    })
                  ),
              })}

              <label>
                <input
                  type="checkbox"
                  checked={
                    hearingForm
                      .employeeNotified
                  }
                  onChange={(event) =>
                    setHearingForm(
                      (previous) => ({
                        ...previous,
                        employeeNotified:
                          event.target
                            .checked,
                      })
                    )
                  }
                />{" "}
                Employee has been notified
              </label>

              <button
                type="button"
                style={primaryButton}
                onClick={
                  scheduleHearing
                }
                disabled={loading}
              >
                Schedule Hearing
              </button>
            </div>
          </div>
        )}

      {isAdminHR &&
        record.status ===
          "Hearing Scheduled" && (
          <div style={actionCardStyle}>
            <h4 style={{ marginTop: 0 }}>
              Complete Hearing
            </h4>

            <div
              style={{
                display: "grid",
                gap: "10px",
              }}
            >
              <select
                value={
                  hearingCompletion
                    .hearingNumber
                }
                onChange={(event) =>
                  setHearingCompletion(
                    (previous) => ({
                      ...previous,
                      hearingNumber:
                        event.target.value,
                    })
                  )
                }
                style={inputStyle}
              >
                <option value="">
                  Select scheduled hearing
                </option>

                {scheduledHearings.map(
                  (hearing) => (
                    <option
                      key={
                        hearing.hearingNumber
                      }
                      value={
                        hearing.hearingNumber
                      }
                    >
                      {
                        hearing.hearingNumber
                      }{" "}
                      —{" "}
                      {hearing.hearingDate}
                    </option>
                  )
                )}
              </select>

              {renderTextarea({
                label:
                  "Completed hearing notes",
                value:
                  hearingCompletion
                    .hearingNotes,
                onChange: (event) =>
                  setHearingCompletion(
                    (previous) => ({
                      ...previous,
                      hearingNotes:
                        event.target.value,
                    })
                  ),
              })}

              <div>
                <label style={labelStyle}>
                  Minutes document number
                  (optional)
                </label>

                <input
                  value={
                    hearingCompletion
                      .minutesDocumentNumber
                  }
                  onChange={(event) =>
                    setHearingCompletion(
                      (previous) => ({
                        ...previous,
                        minutesDocumentNumber:
                          event.target
                            .value,
                      })
                    )
                  }
                  style={inputStyle}
                />
              </div>

              <button
                type="button"
                style={warningButton}
                onClick={
                  completeHearing
                }
                disabled={loading}
              >
                Complete Hearing
              </button>
            </div>
          </div>
        )}

      {isAdminHR &&
        record.status ===
          "Awaiting Decision" && (
          <div style={actionCardStyle}>
            <h4 style={{ marginTop: 0 }}>
              Issue Controlled Decision
            </h4>

            <div
              style={{
                display: "grid",
                gap: "10px",
              }}
            >
              <select
                value={
                  decisionForm.outcome
                }
                onChange={(event) =>
                  setDecisionForm(
                    (previous) => ({
                      ...previous,
                      outcome:
                        event.target.value,
                    })
                  )
                }
                style={inputStyle}
              >
                {DECISION_OUTCOMES.map(
                  (outcome) => (
                    <option
                      key={outcome}
                      value={outcome}
                    >
                      {outcome}
                    </option>
                  )
                )}
              </select>

              {renderTextarea({
                label:
                  "Decision summary",
                value:
                  decisionForm.summary,
                onChange: (event) =>
                  setDecisionForm(
                    (previous) => ({
                      ...previous,
                      summary:
                        event.target.value,
                    })
                  ),
              })}

              {renderTextarea({
                label: "Decision reasons",
                value:
                  decisionForm.reasons,
                onChange: (event) =>
                  setDecisionForm(
                    (previous) => ({
                      ...previous,
                      reasons:
                        event.target.value,
                    })
                  ),
              })}

              {renderTextarea({
                label:
                  "Action required (optional)",
                value:
                  decisionForm
                    .actionRequired,
                onChange: (event) =>
                  setDecisionForm(
                    (previous) => ({
                      ...previous,
                      actionRequired:
                        event.target.value,
                    })
                  ),
              })}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(190px, 1fr))",
                  gap: "10px",
                }}
              >
                <div>
                  <label style={labelStyle}>
                    Effective date
                  </label>

                  <input
                    type="date"
                    value={
                      decisionForm
                        .effectiveDate
                    }
                    onChange={(event) =>
                      setDecisionForm(
                        (previous) => ({
                          ...previous,
                          effectiveDate:
                            event.target
                              .value,
                        })
                      )
                    }
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>
                    Review date
                  </label>

                  <input
                    type="date"
                    value={
                      decisionForm
                        .reviewDate
                    }
                    onChange={(event) =>
                      setDecisionForm(
                        (previous) => ({
                          ...previous,
                          reviewDate:
                            event.target
                              .value,
                        })
                      )
                    }
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>
                    Decision document
                  </label>

                  <input
                    value={
                      decisionForm
                        .decisionDocumentNumber
                    }
                    onChange={(event) =>
                      setDecisionForm(
                        (previous) => ({
                          ...previous,
                          decisionDocumentNumber:
                            event.target
                              .value,
                        })
                      )
                    }
                    style={inputStyle}
                  />
                </div>
              </div>

              <label>
                <input
                  type="checkbox"
                  checked={
                    decisionForm
                      .acknowledgementRequired
                  }
                  onChange={(event) =>
                    setDecisionForm(
                      (previous) => ({
                        ...previous,
                        acknowledgementRequired:
                          event.target
                            .checked,
                      })
                    )
                  }
                />{" "}
                Employee receipt
                acknowledgement required
              </label>

              <button
                type="button"
                style={warningButton}
                onClick={
                  issueDecision
                }
                disabled={loading}
              >
                Issue Decision
              </button>
            </div>
          </div>
        )}

      {!isAdminHR &&
        record.status ===
          "Awaiting Acknowledgement" && (
          <div style={actionCardStyle}>
            <h4 style={{ marginTop: 0 }}>
              Confirm Decision Receipt
            </h4>

            <div
              style={{
                padding: "10px",
                borderRadius: "8px",
                backgroundColor:
                  "#eff6ff",
                color: "#1e3a8a",
                marginBottom: "10px",
              }}
            >
              Confirmation records receipt
              only. It does not indicate
              agreement and does not waive
              appeal rights.
            </div>

            <label>
              <input
                type="checkbox"
                checked={
                  acknowledgementForm
                    .receiptConfirmed
                }
                onChange={(event) =>
                  setAcknowledgementForm(
                    (previous) => ({
                      ...previous,
                      receiptConfirmed:
                        event.target
                          .checked,
                    })
                  )
                }
              />{" "}
              I confirm that I received the
              decision.
            </label>

            <div style={{ marginTop: "10px" }}>
              {renderTextarea({
                label:
                  "Comments (optional)",
                value:
                  acknowledgementForm
                    .comments,
                onChange: (event) =>
                  setAcknowledgementForm(
                    (previous) => ({
                      ...previous,
                      comments:
                        event.target.value,
                    })
                  ),
              })}
            </div>

            <button
              type="button"
              style={primaryButton}
              onClick={
                acknowledgeDecision
              }
              disabled={loading}
            >
              Confirm Receipt
            </button>
          </div>
        )}

      {!isAdminHR &&
        record.decision?.issued &&
        [
          "Awaiting Acknowledgement",
          "Decision Issued",
        ].includes(
          record.status
        ) &&
        !activeAppeal && (
          <div style={actionCardStyle}>
            <h4 style={{ marginTop: 0 }}>
              Submit Appeal
            </h4>

            {renderTextarea({
              label: "Appeal grounds",
              value:
                appealForm.grounds,
              onChange: (event) =>
                setAppealForm(
                  (previous) => ({
                    ...previous,
                    grounds:
                      event.target.value,
                  })
                ),
            })}

            <div style={{ marginTop: "10px" }}>
              {renderTextarea({
                label:
                  "Requested outcome (optional)",
                value:
                  appealForm
                    .requestedOutcome,
                onChange: (event) =>
                  setAppealForm(
                    (previous) => ({
                      ...previous,
                      requestedOutcome:
                        event.target.value,
                    })
                  ),
              })}
            </div>

            <button
              type="button"
              style={warningButton}
              onClick={submitAppeal}
              disabled={loading}
            >
              Submit Appeal
            </button>
          </div>
        )}

      {isAdminHR &&
        [
          "Appeal Submitted",
          "Appeal Review",
        ].includes(
          record.status
        ) && (
          <div style={actionCardStyle}>
            <h4 style={{ marginTop: 0 }}>
              Decide Appeal
            </h4>

            <div
              style={{
                display: "grid",
                gap: "10px",
              }}
            >
              <select
                value={
                  appealDecisionForm
                    .appealNumber
                }
                onChange={(event) =>
                  setAppealDecisionForm(
                    (previous) => ({
                      ...previous,
                      appealNumber:
                        event.target.value,
                    })
                  )
                }
                style={inputStyle}
              >
                <option value="">
                  Select active appeal
                </option>

                {(record.appeals || [])
                  .filter((appeal) =>
                    [
                      "Submitted",
                      "Under Review",
                      "Hearing Scheduled",
                    ].includes(
                      appeal.status
                    )
                  )
                  .map((appeal) => (
                    <option
                      key={
                        appeal.appealNumber
                      }
                      value={
                        appeal.appealNumber
                      }
                    >
                      {
                        appeal.appealNumber
                      }{" "}
                      — {appeal.status}
                    </option>
                  ))}
              </select>

              <select
                value={
                  appealDecisionForm
                    .outcome
                }
                onChange={(event) =>
                  setAppealDecisionForm(
                    (previous) => ({
                      ...previous,
                      outcome:
                        event.target.value,
                    })
                  )
                }
                style={inputStyle}
              >
                {APPEAL_OUTCOMES.map(
                  (outcome) => (
                    <option
                      key={outcome}
                      value={outcome}
                    >
                      {outcome}
                    </option>
                  )
                )}
              </select>

              {renderTextarea({
                label:
                  "Appeal decision",
                value:
                  appealDecisionForm
                    .decision,
                onChange: (event) =>
                  setAppealDecisionForm(
                    (previous) => ({
                      ...previous,
                      decision:
                        event.target.value,
                    })
                  ),
              })}

              {renderTextarea({
                label:
                  "Decision reason",
                value:
                  appealDecisionForm
                    .decisionReason,
                onChange: (event) =>
                  setAppealDecisionForm(
                    (previous) => ({
                      ...previous,
                      decisionReason:
                        event.target.value,
                    })
                  ),
              })}

              <button
                type="button"
                style={warningButton}
                onClick={decideAppeal}
                disabled={loading}
              >
                Issue Appeal Decision
              </button>
            </div>
          </div>
        )}

      {!isAdminHR &&
        record.caseType ===
          "Grievance" &&
        [
          "Submitted",
          "Under Review",
          "Investigation",
        ].includes(
          record.status
        ) && (
          <div style={actionCardStyle}>
            <h4 style={{ marginTop: 0 }}>
              Withdraw My Grievance
            </h4>

            {renderTextarea({
              label:
                "Withdrawal reason",
              value:
                withdrawalReason,
              onChange: (event) =>
                setWithdrawalReason(
                  event.target.value
                ),
            })}

            <button
              type="button"
              style={dangerButton}
              onClick={
                withdrawGrievance
              }
              disabled={loading}
            >
              Withdraw Grievance
            </button>
          </div>
        )}

      {isAdminHR &&
        record.status ===
          "Decision Issued" && (
          <div style={actionCardStyle}>
            <h4 style={{ marginTop: 0 }}>
              Close Controlled Case
            </h4>

            {renderTextarea({
              label:
                "Closure summary",
              value:
                closureSummary,
              onChange: (event) =>
                setClosureSummary(
                  event.target.value
                ),
            })}

            <div
              style={{
                color: MUTED,
                fontSize: "13px",
                margin: "8px 0",
              }}
            >
              Closure does not automatically
              change employment, payroll,
              attendance, compensation or
              leave records.
            </div>

            <button
              type="button"
              style={dangerButton}
              onClick={closeCase}
              disabled={loading}
            >
              Close Case
            </button>
          </div>
        )}

      {loading && (
        <div style={{ color: MUTED }}>
          Processing controlled case action...
        </div>
      )}
    </div>
  );
}

export default EmployeeRelationsWorkflowPanel;