import {
  useEffect,
  useMemo,
  useState,
} from "react";

import api from "../api";

const LEAVE_TYPES = [
  "Vacation",
  "Sick",
  "Maternity",
  "Maternity Extension",
  "Employment Injury",
  "Emergency",
  "Compassionate",
  "Bereavement",
  "Paternity",
  "Family Care",
  "Study",
  "Unpaid",
  "Other Authorized",
];

const EMPTY_FORM = {
  employeeId: "",
  leaveType: "Vacation",
  startDate: "",
  endDate: "",
  reason: "",
  employeeComments: "",
};

const COLORS = {
  blue: "#0B3D91",
  border: "#dbe3ef",
  muted: "#64748b",
  pale: "#f4f7fb",
  green: "#16a34a",
  red: "#dc2626",
  amber: "#d97706",
  purple: "#7c3aed",
  white: "#ffffff",
};

const getStatusColor = (status) => {
  const colors = {
    Draft: COLORS.muted,
    Pending: COLORS.amber,
    Submitted: "#2563eb",
    "Manager Approved":
      COLORS.purple,
    Approved: COLORS.green,
    Rejected: COLORS.red,
    Cancelled: COLORS.muted,
  };

  return colors[status] || COLORS.muted;
};

const formatHours = (minutes) =>
  `${(
    Number(minutes || 0) / 60
  ).toFixed(2)} hrs`;

function LeaveManagementPanel({
  employees = [],
  leaveRequests = [],
  isAdminHR = false,
  myEmployee = null,
  refreshData,
}) {
  const [form, setForm] =
    useState(EMPTY_FORM);

  const [preview, setPreview] =
    useState(null);

  const [selectedId, setSelectedId] =
    useState("");

  const [actionNotes, setActionNotes] =
    useState("");

  const [policies, setPolicies] =
    useState([]);

  const [ledger, setLedger] =
    useState(null);

  const [busy, setBusy] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (
      !isAdminHR &&
      myEmployee?.employeeId
    ) {
      setForm((current) => ({
        ...current,
        employeeId:
          myEmployee.employeeId,
      }));
    }
  }, [isAdminHR, myEmployee]);

  useEffect(() => {
    if (!isAdminHR) {
      return;
    }

    api
      .get(
        "/api/leave-requests/policies"
      )
      .then((response) => {
        setPolicies(
          response.data.data || []
        );
      })
      .catch((loadError) => {
        console.error(
          "Leave policies load failed:",
          loadError
        );
      });
  }, [isAdminHR]);

  const selectedRequest =
    useMemo(
      () =>
        leaveRequests.find(
          (request) =>
            request.leaveRequestId ===
            selectedId
        ) || null,
      [leaveRequests, selectedId]
    );

  const activePolicies = useMemo(
    () =>
      policies.filter(
        (policy) =>
          policy.status === "Active"
      ),
    [policies]
  );

  const clearFeedback = () => {
    setMessage("");
    setError("");
  };

  const runRequestAction =
    async ({
      actionKey,
      request,
      path,
      body,
      successMessage,
    }) => {
      clearFeedback();

      setBusy(
        `${actionKey}:${request.leaveRequestId}`
      );

      try {
        const response =
          await api.post(
            `/api/leave-requests/${encodeURIComponent(
              request.leaveRequestId
            )}/${path}`,
            body
          );

        setMessage(
          response.data.message ||
            successMessage
        );

        setActionNotes("");

        if (refreshData) {
          await refreshData();
        }
      } catch (actionError) {
        setError(
          actionError?.response?.data
            ?.message ||
            `Could not ${actionKey} the leave request.`
        );
      } finally {
        setBusy("");
      }
    };

  const previewRequest = async () => {
    clearFeedback();
    setPreview(null);
    setBusy("preview");

    try {
      const payload = {
        leaveType: form.leaveType,
        startDate: form.startDate,
        endDate: form.endDate,
      };

      if (isAdminHR) {
        payload.employeeId =
          form.employeeId;
      }

      const response =
        await api.post(
          "/api/leave-requests/preview",
          payload
        );

      setPreview(
        response.data.data || null
      );

      setMessage(
        response.data.message ||
          "Preview generated successfully."
      );
    } catch (previewError) {
      setError(
        previewError?.response?.data
          ?.message ||
          "Could not preview the leave request."
      );
    } finally {
      setBusy("");
    }
  };

  const createDraft = async () => {
    clearFeedback();
    setBusy("create");

    try {
      const payload = {
        leaveType: form.leaveType,
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason,
        employeeComments:
          form.employeeComments,
      };

      if (isAdminHR) {
        payload.employeeId =
          form.employeeId;
      }

      const response =
        await api.post(
          "/api/leave-requests",
          payload
        );

      setMessage(
        response.data.message ||
          "Leave draft created."
      );

      setPreview(null);

      setForm({
        ...EMPTY_FORM,
        employeeId: isAdminHR
          ? ""
          : myEmployee?.employeeId ||
            "",
      });

      if (refreshData) {
        await refreshData();
      }
    } catch (createError) {
      setError(
        createError?.response?.data
          ?.message ||
          "Could not create the leave draft."
      );
    } finally {
      setBusy("");
    }
  };

  const loadLedger =
    async (employeeId) => {
      if (
        !isAdminHR ||
        !employeeId
      ) {
        return;
      }

      clearFeedback();

      setBusy(
        `ledger:${employeeId}`
      );

      try {
        const response =
          await api.get(
            `/api/leave-requests/balances/${encodeURIComponent(
              employeeId
            )}`
          );

        setLedger(
          response.data.data || null
        );
      } catch (ledgerError) {
        setError(
          ledgerError?.response?.data
            ?.message ||
            "Could not retrieve leave balances."
        );
      } finally {
        setBusy("");
      }
    };

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box",
    padding: "10px 12px",
    border:
      `1px solid ${COLORS.border}`,
    borderRadius: "8px",
    backgroundColor: COLORS.white,
  };

  const cardStyle = {
    backgroundColor: COLORS.white,
    border:
      `1px solid ${COLORS.border}`,
    borderRadius: "14px",
    padding: "18px",
  };

  const buttonStyle = (
    backgroundColor =
      COLORS.blue
  ) => ({
    border: 0,
    borderRadius: "8px",
    backgroundColor,
    color: COLORS.white,
    padding: "9px 13px",
    cursor: "pointer",
    fontWeight: 700,
  });

  const labelStyle = {
    display: "block",
    color: "#334155",
    fontWeight: 700,
    marginBottom: "6px",
  };

  const renderActions = (
    request
  ) => {
    const working =
      busy.endsWith(
        `:${request.leaveRequestId}`
      );

    const cancelAllowed =
      [
        "Draft",
        "Pending",
        "Submitted",
      ].includes(request.status) ||
      (
        isAdminHR &&
        [
          "Manager Approved",
          "Approved",
        ].includes(
          request.status
        )
      );

    return (
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "7px",
        }}
      >
        {request.status ===
          "Draft" && (
          <button
            disabled={working}
            style={buttonStyle(
              "#2563eb"
            )}
            onClick={() =>
              runRequestAction({
                actionKey:
                  "submit",
                request,
                path: "submit",
                body: {
                  submissionNotes:
                    actionNotes,
                },
                successMessage:
                  "Leave request submitted.",
              })
            }
          >
            Submit
          </button>
        )}

        {isAdminHR &&
          request.status ===
            "Pending" && (
            <button
              disabled={working}
              style={buttonStyle(
                "#2563eb"
              )}
              onClick={() =>
                runRequestAction({
                  actionKey:
                    "upgrade",
                  request,
                  path:
                    "upgrade-legacy",
                  body: {
                    upgradeNotes:
                      actionNotes,
                  },
                  successMessage:
                    "Legacy request upgraded.",
                })
              }
            >
              Upgrade Legacy
            </button>
          )}

        {isAdminHR &&
          request.status ===
            "Submitted" && (
            <button
              disabled={working}
              style={buttonStyle(
                COLORS.purple
              )}
              onClick={() =>
                runRequestAction({
                  actionKey:
                    "manager approve",
                  request,
                  path:
                    "manager-approve",
                  body: {
                    reviewNotes:
                      actionNotes,
                  },
                  successMessage:
                    "Manager approval completed.",
                })
              }
            >
              Manager Approve
            </button>
          )}

        {isAdminHR &&
          request.status ===
            "Manager Approved" && (
            <button
              disabled={working}
              style={buttonStyle(
                COLORS.green
              )}
              onClick={() =>
                runRequestAction({
                  actionKey:
                    "HR approve",
                  request,
                  path:
                    "hr-approve",
                  body: {
                    approvalNotes:
                      actionNotes,
                  },
                  successMessage:
                    "HR approval completed.",
                })
              }
            >
              HR Approve
            </button>
          )}

        {isAdminHR &&
          [
            "Submitted",
            "Manager Approved",
          ].includes(
            request.status
          ) && (
            <button
              disabled={working}
              style={buttonStyle(
                COLORS.red
              )}
              onClick={() => {
                if (
                  !actionNotes.trim()
                ) {
                  setError(
                    "Enter a rejection reason in Action notes."
                  );

                  return;
                }

                runRequestAction({
                  actionKey: "reject",
                  request,
                  path: "reject",
                  body: {
                    rejectionReason:
                      actionNotes,
                  },
                  successMessage:
                    "Leave request rejected.",
                });
              }}
            >
              Reject
            </button>
          )}

        {cancelAllowed && (
          <button
            disabled={working}
            style={buttonStyle(
              COLORS.muted
            )}
            onClick={() => {
              if (
                !actionNotes.trim()
              ) {
                setError(
                  "Enter a cancellation reason in Action notes."
                );

                return;
              }

              const confirmed =
                window.confirm(
                  `Cancel ${request.leaveRequestId}?`
                );

              if (!confirmed) {
                return;
              }

              runRequestAction({
                actionKey: "cancel",
                request,
                path: "cancel",
                body: {
                  cancellationReason:
                    actionNotes,
                },
                successMessage:
                  "Leave request cancelled.",
              });
            }}
          >
            Cancel
          </button>
        )}
      </div>
    );
  };

  return (
    <div
      style={{
        display: "grid",
        gap: "18px",
      }}
    >
      {(message || error) && (
        <div
          style={{
            padding: "12px 14px",
            borderRadius: "9px",
            border:
              `1px solid ${
                error
                  ? "#fecaca"
                  : "#bbf7d0"
              }`,
            color: error
              ? "#991b1b"
              : "#166534",
            backgroundColor: error
              ? "#fef2f2"
              : "#f0fdf4",
          }}
        >
          {error || message}
        </div>
      )}

      <div style={cardStyle}>
        <h2
          style={{
            margin: 0,
            color: COLORS.blue,
          }}
        >
          Controlled Leave Request
        </h2>

        <p
          style={{
            color: COLORS.muted,
          }}
        >
          Preview the policy,
          schedule, pay and balance
          treatment before creating a
          Draft.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(210px, 1fr))",
            gap: "12px",
          }}
        >
          {isAdminHR && (
            <div>
              <label
                style={labelStyle}
              >
                Employee
              </label>

              <select
                style={inputStyle}
                value={
                  form.employeeId
                }
                onChange={(event) => {
                  setForm({
                    ...form,
                    employeeId:
                      event.target.value,
                  });

                  setPreview(null);
                }}
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
                      }
                      )
                    </option>
                  )
                )}
              </select>
            </div>
          )}

          <div>
            <label style={labelStyle}>
              Leave type
            </label>

            <select
              style={inputStyle}
              value={form.leaveType}
              onChange={(event) => {
                setForm({
                  ...form,
                  leaveType:
                    event.target.value,
                });

                setPreview(null);
              }}
            >
              {LEAVE_TYPES.map(
                (leaveType) => (
                  <option
                    key={leaveType}
                    value={leaveType}
                  >
                    {leaveType}
                  </option>
                )
              )}
            </select>
          </div>

          <div>
            <label style={labelStyle}>
              Start date
            </label>

            <input
              type="date"
              style={inputStyle}
              value={form.startDate}
              onChange={(event) => {
                setForm({
                  ...form,
                  startDate:
                    event.target.value,
                });

                setPreview(null);
              }}
            />
          </div>

          <div>
            <label style={labelStyle}>
              End date
            </label>

            <input
              type="date"
              style={inputStyle}
              value={form.endDate}
              onChange={(event) => {
                setForm({
                  ...form,
                  endDate:
                    event.target.value,
                });

                setPreview(null);
              }}
            />
          </div>

          <div
            style={{
              gridColumn: "1 / -1",
            }}
          >
            <label style={labelStyle}>
              Reason
            </label>

            <textarea
              style={{
                ...inputStyle,
                minHeight: "70px",
              }}
              value={form.reason}
              onChange={(event) =>
                setForm({
                  ...form,
                  reason:
                    event.target.value,
                })
              }
            />
          </div>

          <div
            style={{
              gridColumn: "1 / -1",
            }}
          >
            <label style={labelStyle}>
              Employee comments
            </label>

            <textarea
              style={{
                ...inputStyle,
                minHeight: "60px",
              }}
              value={
                form.employeeComments
              }
              onChange={(event) =>
                setForm({
                  ...form,
                  employeeComments:
                    event.target.value,
                })
              }
            />
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "9px",
            marginTop: "12px",
          }}
        >
          <button
            style={buttonStyle(
              "#2563eb"
            )}
            disabled={
              busy === "preview"
            }
            onClick={previewRequest}
          >
            Preview Treatment
          </button>

          <button
            style={buttonStyle(
              COLORS.green
            )}
            disabled={
              !preview ||
              busy === "create"
            }
            onClick={createDraft}
          >
            Create Draft
          </button>
        </div>
      </div>

      {preview && (
        <div style={cardStyle}>
          <h3
            style={{
              marginTop: 0,
              color: COLORS.blue,
            }}
          >
            Policy and Pay Preview
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "10px",
            }}
          >
            <div>
              <strong>Policy</strong>
              <br />
              {
                preview.policy
                  ?.policyName
              }
              <br />
              <small>
                {
                  preview.policy
                    ?.policyCode
                }
              </small>
            </div>

            <div>
              <strong>
                Treatment
              </strong>
              <br />
              {
                preview.treatment
                  ?.payTreatment
              }
              <br />
              <small>
                {
                  preview.treatment
                    ?.payrollEffect
                }
              </small>
            </div>

            <div>
              <strong>
                Scheduled
              </strong>
              <br />
              {formatHours(
                preview.treatment
                  ?.totalScheduledMinutes
              )}
            </div>

            <div>
              <strong>
                Payable leave
              </strong>
              <br />
              {formatHours(
                preview.treatment
                  ?.payableLeaveMinutes
              )}
            </div>

            <div>
              <strong>
                Unpaid leave
              </strong>
              <br />
              {formatHours(
                preview.treatment
                  ?.unpaidLeaveMinutes
              )}
            </div>

            <div>
              <strong>
                Balance effect
              </strong>
              <br />
              {
                preview.treatment
                  ?.balanceEffect
              }{" "}
              {preview.treatment
                ?.balanceUnits || 0}{" "}
              {
                preview.treatment
                  ?.balanceType
              }
            </div>

            <div>
              <strong>
                Documents
              </strong>
              <br />
              {
                preview.treatment
                  ?.documentStatus
              }
            </div>
          </div>
        </div>
      )}

      <div style={cardStyle}>
        <h2
          style={{
            color: COLORS.blue,
            marginTop: 0,
          }}
        >
          {isAdminHR
            ? "Controlled Leave Register"
            : "My Leave Requests"}
        </h2>

        <label style={labelStyle}>
          Action notes / reason
        </label>

        <textarea
          style={{
            ...inputStyle,
            minHeight: "65px",
            marginBottom: "12px",
          }}
          value={actionNotes}
          onChange={(event) =>
            setActionNotes(
              event.target.value
            )
          }
          placeholder="Notes used for submission, approval, rejection or cancellation"
        />

        <div
          style={{
            overflowX: "auto",
          }}
        >
          <table
            width="100%"
            cellPadding="9"
            style={{
              borderCollapse:
                "collapse",
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
                  Request
                </th>
                <th align="left">
                  Employee
                </th>
                <th align="left">
                  Leave
                </th>
                <th align="left">
                  Dates
                </th>
                <th align="left">
                  Pay
                </th>
                <th align="left">
                  Balance
                </th>
                <th align="left">
                  Status
                </th>
                <th align="left">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {leaveRequests.map(
                (request) => (
                  <tr
                    key={
                      request.leaveRequestId
                    }
                    style={{
                      borderBottom:
                        `1px solid ${COLORS.border}`,
                      backgroundColor:
                        selectedId ===
                        request.leaveRequestId
                          ? "#f8fbff"
                          : COLORS.white,
                    }}
                  >
                    <td>
                      <button
                        style={{
                          border: 0,
                          backgroundColor:
                            "transparent",
                          color:
                            COLORS.blue,
                          cursor:
                            "pointer",
                          fontWeight: 800,
                        }}
                        onClick={() => {
                          setSelectedId(
                            request.leaveRequestId
                          );

                          if (isAdminHR) {
                            loadLedger(
                              request.employeeId
                            );
                          }
                        }}
                      >
                        {
                          request.leaveRequestId
                        }
                      </button>
                    </td>

                    <td>
                      {
                        request.employeeName
                      }
                    </td>

                    <td>
                      {
                        request.leaveType
                      }
                      <br />
                      <small>
                        {request.policyCode ||
                          "Legacy"}
                      </small>
                    </td>

                    <td>
                      {
                        request.startDate
                      }
                      <br />
                      to{" "}
                      {request.endDate}
                      <br />
                      <small>
                        {
                          request.totalDays
                        }{" "}
                        day(s)
                      </small>
                    </td>

                    <td>
                      {request.payTreatment ||
                        "Not resolved"}
                      <br />
                      <small>
                        {formatHours(
                          request.payableLeaveMinutes
                        )}{" "}
                        payable
                      </small>
                    </td>

                    <td>
                      {request.balanceApplied
                        ? "Applied"
                        : request.balanceEffect ||
                          "—"}
                      <br />
                      <small>
                        {request.balanceUnits ||
                          0}{" "}
                        {request.balanceType ||
                          ""}
                      </small>
                    </td>

                    <td>
                      <span
                        style={{
                          color:
                            COLORS.white,
                          backgroundColor:
                            getStatusColor(
                              request.status
                            ),
                          borderRadius:
                            "999px",
                          padding:
                            "4px 9px",
                          fontWeight: 800,
                          fontSize:
                            "12px",
                        }}
                      >
                        {
                          request.status
                        }
                      </span>
                    </td>

                    <td>
                      {renderActions(
                        request
                      )}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>

          {leaveRequests.length ===
            0 && (
            <div
              style={{
                textAlign: "center",
                color:
                  COLORS.muted,
                padding: "20px",
              }}
            >
              No leave requests
              found.
            </div>
          )}
        </div>
      </div>

      {selectedRequest && (
        <div style={cardStyle}>
          <h3
            style={{
              color: COLORS.blue,
              marginTop: 0,
            }}
          >
            {
              selectedRequest.leaveRequestId
            }{" "}
            — Control Evidence
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
              <strong>Policy</strong>
              <br />
              {selectedRequest.policyName ||
                "Legacy request"}
              <br />
              <small>
                {selectedRequest.legalClassification ||
                  "—"}
              </small>
            </div>

            <div>
              <strong>
                Manager decision
              </strong>
              <br />
              {selectedRequest
                .managerDecision
                ?.status || "Pending"}
              <br />
              <small>
                {selectedRequest
                  .managerDecision
                  ?.notes ||
                  "No notes"}
              </small>
            </div>

            <div>
              <strong>
                HR decision
              </strong>
              <br />
              {selectedRequest
                .hrDecision?.status ||
                "Pending"}
              <br />
              <small>
                {selectedRequest
                  .hrDecision?.notes ||
                  "No notes"}
              </small>
            </div>

            <div>
              <strong>
                Documents
              </strong>
              <br />
              {selectedRequest.documentStatus ||
                "Not Required"}
              <br />
              <small>
                Medical certificate:{" "}
                {selectedRequest.medicalCertificateReceived
                  ? "Received"
                  : selectedRequest.medicalCertificateRequired
                  ? "Required"
                  : "Not required"}
              </small>
            </div>

            <div>
              <strong>
                Attendance
              </strong>
              <br />
              {selectedRequest
                .attendanceProcessing
                ?.status || "Pending"}
              <br />
              <small>
                {selectedRequest
                  .attendancePeriodsUpdated
                  ?.map(
                    (item) =>
                      item.periodNumber
                  )
                  .join(", ") ||
                  "No linked period"}
              </small>
            </div>

            <div>
              <strong>Payroll</strong>
              <br />
              {selectedRequest
                .payrollProcessing
                ?.status || "Pending"}
              <br />
              <small>
                {selectedRequest.payrollNumber ||
                  "No linked payroll"}
              </small>
            </div>

            <div>
              <strong>
                Balance transaction
              </strong>
              <br />
              {selectedRequest.balanceTransactionNumber ||
                "Not applied"}
              <br />
              <small>
                Reversal:{" "}
                {selectedRequest.balanceReversalTransactionNumber ||
                  "None"}
              </small>
            </div>

            <div>
              <strong>
                NIS coordination
              </strong>
              <br />
              {selectedRequest
                .nisCoordination
                ?.status ||
                "Not Required"}
              <br />
              <small>
                {selectedRequest
                  .nisCoordination
                  ?.claimReference ||
                  "No claim reference"}
              </small>
            </div>
          </div>
        </div>
      )}

      {isAdminHR && ledger && (
        <div style={cardStyle}>
          <h3
            style={{
              color: COLORS.blue,
              marginTop: 0,
            }}
          >
            Leave Balance Ledger —{" "}
            {ledger.employeeId}
          </h3>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
              marginBottom: "12px",
            }}
          >
            {Object.entries(
              ledger.balances || {}
            ).map(
              ([
                balanceType,
                amount,
              ]) => (
                <div
                  key={balanceType}
                  style={{
                    backgroundColor:
                      COLORS.pale,
                    borderRadius:
                      "9px",
                    padding:
                      "9px 13px",
                  }}
                >
                  <strong>
                    {balanceType}
                  </strong>
                  : {amount} days
                </div>
              )
            )}
          </div>

          <div
            style={{
              overflowX: "auto",
            }}
          >
            <table
              width="100%"
              cellPadding="8"
              style={{
                borderCollapse:
                  "collapse",
              }}
            >
              <thead>
                <tr>
                  <th align="left">
                    Date
                  </th>
                  <th align="left">
                    Type
                  </th>
                  <th align="left">
                    Transaction
                  </th>
                  <th align="right">
                    Units
                  </th>
                  <th align="right">
                    Balance
                  </th>
                  <th align="left">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {(
                  ledger.transactions ||
                  []
                ).map(
                  (transaction) => (
                    <tr
                      key={
                        transaction.transactionNumber
                      }
                      style={{
                        borderTop:
                          `1px solid ${COLORS.border}`,
                      }}
                    >
                      <td>
                        {
                          transaction.effectiveDate
                        }
                      </td>
                      <td>
                        {
                          transaction.balanceType
                        }
                      </td>
                      <td>
                        {
                          transaction.transactionType
                        }
                        <br />
                        <small>
                          {
                            transaction.transactionNumber
                          }
                        </small>
                      </td>
                      <td align="right">
                        {
                          transaction.units
                        }
                      </td>
                      <td align="right">
                        {
                          transaction.balanceAfter
                        }
                      </td>
                      <td>
                        {
                          transaction.status
                        }
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isAdminHR && (
        <details style={cardStyle}>
          <summary
            style={{
              color: COLORS.blue,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Active Leave Policies (
            {activePolicies.length})
          </summary>

          <div
            style={{
              display: "grid",
              gap: "9px",
              marginTop: "12px",
            }}
          >
            {activePolicies.map(
              (policy) => (
                <div
                  key={
                    policy.policyCode
                  }
                  style={{
                    borderTop:
                      `1px solid ${COLORS.border}`,
                    paddingTop:
                      "9px",
                  }}
                >
                  <strong>
                    {
                      policy.policyName
                    }
                  </strong>{" "}
                  — {policy.leaveType}
                  <br />
                  <small>
                    {
                      policy.policyCode
                    }{" "}
                    ·{" "}
                    {
                      policy.payTreatment
                    }{" "}
                    ·{" "}
                    {
                      policy.payrollEffect
                    }{" "}
                    · Effective{" "}
                    {
                      policy.effectiveFrom
                    }
                  </small>
                </div>
              )
            )}
          </div>
        </details>
      )}
    </div>
  );
}

export default LeaveManagementPanel;