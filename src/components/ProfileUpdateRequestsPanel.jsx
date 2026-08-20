import {
  useEffect,
  useMemo,
  useState,
} from "react";

import api from "../api";

const BLUE = "#0b429c";
const BORDER = "#d8e1ee";
const MUTED = "#58708f";

const emptyForm = {
  email: "",
  phone: "",
  alternatePhone: "",
  address: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  emergencyContactRelationship: "",
  reason: "",
};

const formatDateTime = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString();
};

const statusStyle = (status) => {
  const styles = {
    Pending: {
      background: "#fff4ce",
      color: "#a16207",
    },

    Approved: {
      background: "#dcfce7",
      color: "#15803d",
    },

    Rejected: {
      background: "#fee2e2",
      color: "#b91c1c",
    },

    Cancelled: {
      background: "#e2e8f0",
      color: "#475569",
    },
  };

  return {
    display: "inline-block",
    padding: "5px 10px",
    borderRadius: "999px",
    fontWeight: "bold",
    fontSize: "12px",
    ...(styles[status] || styles.Cancelled),
  };
};

export default function ProfileUpdateRequestsPanel({
  isAdminHR,
  myEmployee,
  onProfileUpdated,
}) {
  const [requests, setRequests] =
    useState([]);

  const [form, setForm] =
    useState(emptyForm);

  const [reviewNotes, setReviewNotes] =
    useState({});

  const [cancellationReason, setCancellationReason] =
    useState({});

  const [loading, setLoading] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [notice, setNotice] =
    useState("");

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (!isAdminHR && myEmployee) {
      setForm({
        email: myEmployee.email || "",
        phone: myEmployee.phone || "",
        alternatePhone:
          myEmployee.alternatePhone || "",
        address: myEmployee.address || "",
        emergencyContactName:
          myEmployee.emergencyContactName || "",
        emergencyContactPhone:
          myEmployee.emergencyContactPhone || "",
        emergencyContactRelationship:
          myEmployee.emergencyContactRelationship ||
          "",
        reason: "",
      });
    }
  }, [isAdminHR, myEmployee]);

  const pendingRequest = useMemo(
    () =>
      requests.find(
        (request) =>
          request.status === "Pending"
      ) || null,
    [requests]
  );

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError("");

      const endpoint = isAdminHR
        ? "/api/hr/profile-update-requests"
        : "/api/hr/profile-update-requests/me";

      const response = await api.get(endpoint);

      setRequests(
        response.data?.data || []
      );
    } catch (requestError) {
      console.error(
        "Profile-update request load failed:",
        requestError
      );

      setRequests([]);

      setError(
        requestError?.response?.data?.message ||
          "Failed to load profile-update requests."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [isAdminHR]);

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const submitRequest = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setNotice("");

      const requestedChanges = {
        email: form.email,
        phone: form.phone,
        alternatePhone:
          form.alternatePhone,
        address: form.address,
        emergencyContactName:
          form.emergencyContactName,
        emergencyContactPhone:
          form.emergencyContactPhone,
        emergencyContactRelationship:
          form.emergencyContactRelationship,
      };

      const response = await api.post(
        "/api/hr/profile-update-requests",
        {
          requestedChanges,
          reason: form.reason,
        }
      );

      setNotice(
        response.data?.message ||
          "Profile-update request submitted."
      );

      setForm((current) => ({
        ...current,
        reason: "",
      }));

      await loadRequests();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          "Failed to submit the profile-update request."
      );
    } finally {
      setSaving(false);
    }
  };

  const reviewRequest = async (
    requestNumber,
    decision
  ) => {
    const notes =
      reviewNotes[requestNumber] || "";

    try {
      setSaving(true);
      setError("");
      setNotice("");

      const response = await api.post(
        `/api/hr/profile-update-requests/${requestNumber}/review`,
        {
          decision,
          reviewNotes: notes,
        }
      );

      setNotice(
        response.data?.message ||
          `Request ${decision.toLowerCase()}.`
      );

      setReviewNotes((current) => ({
        ...current,
        [requestNumber]: "",
      }));

      await loadRequests();

      if (
        decision === "Approved" &&
        onProfileUpdated
      ) {
        await onProfileUpdated();
      }
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          "Failed to review the request."
      );
    } finally {
      setSaving(false);
    }
  };

  const cancelRequest = async (
    requestNumber
  ) => {
    const reason =
      cancellationReason[requestNumber] ||
      "";

    try {
      setSaving(true);
      setError("");
      setNotice("");

      const response = await api.post(
        `/api/hr/profile-update-requests/${requestNumber}/cancel`,
        {
          cancellationReason: reason,
        }
      );

      setNotice(
        response.data?.message ||
          "Request cancelled."
      );

      setCancellationReason((current) => ({
        ...current,
        [requestNumber]: "",
      }));

      await loadRequests();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          "Failed to cancel the request."
      );
    } finally {
      setSaving(false);
    }
  };

  const cardStyle = {
    background: "#ffffff",
    border: `1px solid ${BORDER}`,
    borderRadius: "14px",
    padding: "20px",
  };

  const inputStyle = {
    width: "100%",
    padding: "10px",
    border: `1px solid ${BORDER}`,
    borderRadius: "8px",
    boxSizing: "border-box",
  };

  const primaryButton = {
    border: "none",
    borderRadius: "8px",
    padding: "10px 16px",
    background: BLUE,
    color: "#ffffff",
    fontWeight: "bold",
    cursor: "pointer",
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
            justifyContent: "space-between",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h2
              style={{
                color: BLUE,
                margin: 0,
              }}
            >
              {isAdminHR
                ? "Controlled Profile-Update Requests"
                : "Request a Profile Update"}
            </h2>

            <div
              style={{
                color: MUTED,
                marginTop: "5px",
              }}
            >
              {isAdminHR
                ? "Review employee-owned contact and emergency-contact change requests."
                : "Requested changes are applied only after HR approval."}
            </div>
          </div>

          <button
            type="button"
            style={primaryButton}
            onClick={loadRequests}
            disabled={loading}
          >
            {loading
              ? "Refreshing..."
              : "Refresh Requests"}
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            ...cardStyle,
            borderColor: "#fecaca",
            background: "#fff1f2",
            color: "#b91c1c",
          }}
        >
          {error}
        </div>
      )}

      {notice && (
        <div
          style={{
            ...cardStyle,
            borderColor: "#bbf7d0",
            background: "#f0fdf4",
            color: "#15803d",
          }}
        >
          {notice}
        </div>
      )}

      {!isAdminHR && myEmployee && (
        <form
          style={cardStyle}
          onSubmit={submitRequest}
        >
          <h3
            style={{
              color: BLUE,
              marginTop: 0,
            }}
          >
            Requested Profile Details
          </h3>

          {pendingRequest && (
            <div
              style={{
                marginBottom: "16px",
                padding: "12px",
                background: "#fff7d6",
                borderRadius: "8px",
                color: "#92400e",
              }}
            >
              {pendingRequest.requestNumber} is
              already awaiting HR review. Only one
              pending request is allowed.
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(230px, 1fr))",
              gap: "14px",
            }}
          >
            <label>
              HR contact email
              <input
                style={inputStyle}
                value={form.email}
                onChange={(event) =>
                  updateField(
                    "email",
                    event.target.value
                  )
                }
              />
            </label>

            <label>
              Phone
              <input
                style={inputStyle}
                value={form.phone}
                onChange={(event) =>
                  updateField(
                    "phone",
                    event.target.value
                  )
                }
              />
            </label>

            <label>
              Alternate phone
              <input
                style={inputStyle}
                value={form.alternatePhone}
                onChange={(event) =>
                  updateField(
                    "alternatePhone",
                    event.target.value
                  )
                }
              />
            </label>

            <label>
              Emergency contact name
              <input
                style={inputStyle}
                value={
                  form.emergencyContactName
                }
                onChange={(event) =>
                  updateField(
                    "emergencyContactName",
                    event.target.value
                  )
                }
              />
            </label>

            <label>
              Emergency contact phone
              <input
                style={inputStyle}
                value={
                  form.emergencyContactPhone
                }
                onChange={(event) =>
                  updateField(
                    "emergencyContactPhone",
                    event.target.value
                  )
                }
              />
            </label>

            <label>
              Emergency contact relationship
              <input
                style={inputStyle}
                value={
                  form.emergencyContactRelationship
                }
                onChange={(event) =>
                  updateField(
                    "emergencyContactRelationship",
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
            Address
            <textarea
              style={{
                ...inputStyle,
                minHeight: "80px",
              }}
              value={form.address}
              onChange={(event) =>
                updateField(
                  "address",
                  event.target.value
                )
              }
            />
          </label>

          <label
            style={{
              display: "block",
              marginTop: "14px",
            }}
          >
            Reason for request
            <textarea
              required
              style={{
                ...inputStyle,
                minHeight: "80px",
              }}
              value={form.reason}
              onChange={(event) =>
                updateField(
                  "reason",
                  event.target.value
                )
              }
            />
          </label>

          <button
            type="submit"
            style={{
              ...primaryButton,
              marginTop: "14px",
            }}
            disabled={
              saving ||
              Boolean(pendingRequest)
            }
          >
            {saving
              ? "Submitting..."
              : "Submit for HR Review"}
          </button>
        </form>
      )}

      <div style={cardStyle}>
        <h3
          style={{
            color: BLUE,
            marginTop: 0,
          }}
        >
          {isAdminHR
            ? "Profile-Update Register"
            : "My Profile-Update Requests"}
        </h3>

        {requests.length === 0 ? (
          <div style={{ color: MUTED }}>
            No profile-update requests were found.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gap: "14px",
            }}
          >
            {requests.map((request) => (
              <div
                key={request.requestNumber}
                style={{
                  border: `1px solid ${BORDER}`,
                  borderRadius: "10px",
                  padding: "14px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    gap: "10px",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <strong>
                      {request.requestNumber}
                    </strong>

                    <div
                      style={{
                        color: MUTED,
                        marginTop: "4px",
                      }}
                    >
                      {request.employeeSnapshot
                        ?.fullName ||
                        request.employeeId}{" "}
                      · {request.employeeId} ·{" "}
                      {formatDateTime(
                        request.requestedAt
                      )}
                    </div>
                  </div>

                  <span
                    style={statusStyle(
                      request.status
                    )}
                  >
                    {request.status}
                  </span>
                </div>

                <div
                  style={{
                    marginTop: "12px",
                  }}
                >
                  <strong>Reason:</strong>{" "}
                  {request.reason}
                </div>

                <div
                  style={{
                    overflowX: "auto",
                    marginTop: "12px",
                  }}
                >
                  <table
                    width="100%"
                    cellPadding="8"
                    style={{
                      borderCollapse: "collapse",
                    }}
                  >
                    <thead
                      style={{
                        background: "#eef4ff",
                      }}
                    >
                      <tr>
                        <th align="left">
                          Field
                        </th>
                        <th align="left">
                          Current
                        </th>
                        <th align="left">
                          Requested
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {(request.changes || []).map(
                        (change) => (
                          <tr
                            key={change.field}
                            style={{
                              borderBottom:
                                `1px solid ${BORDER}`,
                            }}
                          >
                            <td>{change.label}</td>
                            <td>
                              {change.currentValue ||
                                "-"}
                            </td>
                            <td>
                              {change.requestedValue ||
                                "-"}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>

                {request.reviewNotes && (
                  <div
                    style={{
                      marginTop: "12px",
                    }}
                  >
                    <strong>
                      HR review:
                    </strong>{" "}
                    {request.reviewNotes}
                  </div>
                )}

                {isAdminHR &&
                  request.status ===
                    "Pending" && (
                    <div
                      style={{
                        marginTop: "14px",
                      }}
                    >
                      <textarea
                        style={{
                          ...inputStyle,
                          minHeight: "70px",
                        }}
                        placeholder="Required HR review notes"
                        value={
                          reviewNotes[
                            request.requestNumber
                          ] || ""
                        }
                        onChange={(event) =>
                          setReviewNotes(
                            (current) => ({
                              ...current,
                              [request.requestNumber]:
                                event.target
                                  .value,
                            })
                          )
                        }
                      />

                      <div
                        style={{
                          display: "flex",
                          gap: "10px",
                          marginTop: "10px",
                        }}
                      >
                        <button
                          type="button"
                          style={primaryButton}
                          disabled={saving}
                          onClick={() =>
                            reviewRequest(
                              request.requestNumber,
                              "Approved"
                            )
                          }
                        >
                          Approve
                        </button>

                        <button
                          type="button"
                          disabled={saving}
                          onClick={() =>
                            reviewRequest(
                              request.requestNumber,
                              "Rejected"
                            )
                          }
                          style={{
                            ...primaryButton,
                            background: "#b91c1c",
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  )}

                {!isAdminHR &&
                  request.status ===
                    "Pending" && (
                    <div
                      style={{
                        marginTop: "14px",
                      }}
                    >
                      <textarea
                        style={{
                          ...inputStyle,
                          minHeight: "65px",
                        }}
                        placeholder="Required cancellation reason"
                        value={
                          cancellationReason[
                            request.requestNumber
                          ] || ""
                        }
                        onChange={(event) =>
                          setCancellationReason(
                            (current) => ({
                              ...current,
                              [request.requestNumber]:
                                event.target
                                  .value,
                            })
                          )
                        }
                      />

                      <button
                        type="button"
                        disabled={saving}
                        onClick={() =>
                          cancelRequest(
                            request.requestNumber
                          )
                        }
                        style={{
                          ...primaryButton,
                          marginTop: "10px",
                          background: "#b91c1c",
                        }}
                      >
                        Cancel Pending Request
                      </button>
                    </div>
                  )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}