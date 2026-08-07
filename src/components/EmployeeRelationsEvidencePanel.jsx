import { useRef, useState } from "react";
import api from "../api";

const EVIDENCE_TYPES = [
  "Document",
  "Statement",
  "Email",
  "Image",
  "Attendance Record",
  "Payroll Record",
  "Policy",
  "Other",
];

const TERMINAL_CASE_STATUSES = [
  "Closed",
  "Withdrawn",
  "Cancelled",
];

function EmployeeRelationsEvidencePanel({
  record,
  isAdminHR = false,
  onChanged,
}) {
  const fileInputRef =
    useRef(null);

  const ROYAL_BLUE = "#0B3D91";
  const BORDER = "#dbe3ef";
  const MUTED = "#64748b";

  const [uploadForm, setUploadForm] =
    useState({
      evidenceType: "Document",
      title: "",
      description: "",
      confidential: false,
      file: null,
    });

  const [reviewForm, setReviewForm] =
    useState({
      evidenceNumber: "",
      decision: "Accepted",
      reviewNotes: "",
    });

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [notice, setNotice] =
    useState("");

  if (!record?.caseNumber) {
    return null;
  }

  const evidenceItems =
    record.evidence || [];

  const canUpload =
    !TERMINAL_CASE_STATUSES
      .includes(record.status) &&
    (
      isAdminHR ||
      record.status !== "Draft"
    );

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

  const secondaryButton = {
    border: `1px solid ${BORDER}`,
    borderRadius: "8px",
    padding: "9px 12px",
    backgroundColor: "#e2e8f0",
    color: "#334155",
    fontWeight: "bold",
    cursor: "pointer",
  };

  const refreshCase =
    async () => {
      if (onChanged) {
        await onChanged(
          record.caseNumber
        );
      }
    };

  const uploadEvidence =
    async () => {
      setError("");
      setNotice("");

      if (!uploadForm.file) {
        setError(
          "Select the evidence file to upload."
        );
        return;
      }

      if (!uploadForm.title.trim()) {
        setError(
          "An evidence title is required."
        );
        return;
      }

      if (!canUpload) {
        setError(
          `Evidence cannot be uploaded while this case is ${record.status}.`
        );
        return;
      }

      const formData =
        new FormData();

      formData.append(
        "file",
        uploadForm.file
      );

      formData.append(
        "evidenceType",
        uploadForm.evidenceType
      );

      formData.append(
        "title",
        uploadForm.title.trim()
      );

      formData.append(
        "description",
        uploadForm.description.trim()
      );

      if (isAdminHR) {
        formData.append(
          "confidential",
          String(
            uploadForm.confidential
          )
        );
      }

      setLoading(true);

      try {
        const response =
          await api.post(
            `/api/employee-relations/${record.caseNumber}/evidence`,
            formData,
            {
              headers: {
                "Content-Type":
                  "multipart/form-data",
              },
            }
          );

        setNotice(
          response.data?.message ||
          "Controlled evidence uploaded successfully."
        );

        setUploadForm({
          evidenceType:
            "Document",
          title: "",
          description: "",
          confidential: false,
          file: null,
        });

        if (
          fileInputRef.current
        ) {
          fileInputRef.current.value =
            "";
        }

        await refreshCase();
      } catch (requestError) {
        console.error(
          "Employee-relations evidence upload failed:",
          requestError
        );

        setError(
          requestError.response
            ?.data?.message ||
            requestError.message ||
            "Failed to upload the controlled evidence."
        );
      } finally {
        setLoading(false);
      }
    };

  const downloadEvidence =
    async (evidenceNumber) => {
      setError("");
      setNotice("");
      setLoading(true);

      try {
        const response =
          await api.get(
            `/api/employee-relations/${record.caseNumber}/evidence/${evidenceNumber}/download`
          );

        const downloadUrl =
          response.data?.data
            ?.downloadUrl;

        if (!downloadUrl) {
          throw new Error(
            "The server did not return a secure evidence download URL."
          );
        }

        const link =
          document.createElement(
            "a"
          );

        link.href =
          downloadUrl;

        link.target =
          "_blank";

        link.rel =
          "noopener noreferrer";

        document.body.appendChild(
          link
        );

        link.click();

        document.body.removeChild(
          link
        );

        setNotice(
          "A five-minute secure evidence download was authorized."
        );
      } catch (requestError) {
        console.error(
          "Employee-relations evidence download failed:",
          requestError
        );

        setError(
          requestError.response
            ?.data?.message ||
            requestError.message ||
            "Failed to authorize the secure evidence download."
        );
      } finally {
        setLoading(false);
      }
    };

  const reviewEvidence =
    async () => {
      setError("");
      setNotice("");

      if (
        !reviewForm.evidenceNumber
      ) {
        setError(
          "Select submitted evidence to review."
        );
        return;
      }

      if (
        reviewForm.decision ===
          "Rejected" &&
        !reviewForm
          .reviewNotes
          .trim()
      ) {
        setError(
          "Evidence rejection requires review notes."
        );
        return;
      }

      setLoading(true);

      try {
        const response =
          await api.post(
            `/api/employee-relations/${record.caseNumber}/evidence/${reviewForm.evidenceNumber}/review`,
            {
              decision:
                reviewForm.decision,

              reviewNotes:
                reviewForm
                  .reviewNotes
                  .trim(),
            }
          );

        setNotice(
          response.data?.message ||
          "Controlled evidence reviewed successfully."
        );

        setReviewForm({
          evidenceNumber: "",
          decision: "Accepted",
          reviewNotes: "",
        });

        await refreshCase();
      } catch (requestError) {
        console.error(
          "Employee-relations evidence review failed:",
          requestError
        );

        setError(
          requestError.response
            ?.data?.message ||
            requestError.message ||
            "Failed to review the controlled evidence."
        );
      } finally {
        setLoading(false);
      }
    };

  const getEvidenceStatusStyle = (
    status
  ) => {
    const colors = {
      Submitted: [
        "#fef3c7",
        "#92400e",
      ],

      Accepted: [
        "#dcfce7",
        "#166534",
      ],

      Rejected: [
        "#fee2e2",
        "#b91c1c",
      ],

      Withdrawn: [
        "#e2e8f0",
        "#475569",
      ],
    };

    const [
      backgroundColor,
      color,
    ] =
      colors[status] || [
        "#e2e8f0",
        "#334155",
      ];

    return {
      display: "inline-block",
      padding: "5px 9px",
      borderRadius: "999px",
      backgroundColor,
      color,
      fontSize: "12px",
      fontWeight: "bold",
    };
  };

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
          Controlled Case Evidence
        </h3>

        <div
          style={{
            color: MUTED,
            marginTop: "5px",
          }}
        >
          Authenticated Cloudinary storage,
          restricted access, review status
          and audited secure downloads.
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

      {canUpload && (
        <div
          style={{
            border: `1px solid ${BORDER}`,
            borderRadius: "12px",
            padding: "14px",
            backgroundColor: "#ffffff",
          }}
        >
          <h4 style={{ marginTop: 0 }}>
            Submit Evidence
          </h4>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(210px, 1fr))",
              gap: "10px",
            }}
          >
            <div>
              <label style={labelStyle}>
                Evidence type
              </label>

              <select
                value={
                  uploadForm
                    .evidenceType
                }
                onChange={(event) =>
                  setUploadForm(
                    (previous) => ({
                      ...previous,
                      evidenceType:
                        event.target.value,
                    })
                  )
                }
                style={inputStyle}
              >
                {EVIDENCE_TYPES.map(
                  (type) => (
                    <option
                      key={type}
                      value={type}
                    >
                      {type}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label style={labelStyle}>
                Evidence title
              </label>

              <input
                value={
                  uploadForm.title
                }
                onChange={(event) =>
                  setUploadForm(
                    (previous) => ({
                      ...previous,
                      title:
                        event.target.value,
                    })
                  )
                }
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>
                Evidence file
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.txt,.csv,.eml,.doc,.docx,.xls,.xlsx"
                onChange={(event) =>
                  setUploadForm(
                    (previous) => ({
                      ...previous,
                      file:
                        event.target
                          .files?.[0] ||
                        null,
                    })
                  )
                }
                style={inputStyle}
              />
            </div>
          </div>

          <div
            style={{
              marginTop: "10px",
            }}
          >
            <label style={labelStyle}>
              Description
            </label>

            <textarea
              value={
                uploadForm.description
              }
              onChange={(event) =>
                setUploadForm(
                  (previous) => ({
                    ...previous,
                    description:
                      event.target.value,
                  })
                )
              }
              style={{
                ...inputStyle,
                minHeight: "75px",
              }}
            />
          </div>

          {isAdminHR && (
            <label
              style={{
                display: "block",
                marginTop: "10px",
              }}
            >
              <input
                type="checkbox"
                checked={
                  uploadForm
                    .confidential
                }
                onChange={(event) =>
                  setUploadForm(
                    (previous) => ({
                      ...previous,
                      confidential:
                        event.target
                          .checked,
                    })
                  )
                }
              />{" "}
              Restrict this evidence to
              authorized HR personnel
          </label>
          )}

          <button
            type="button"
            style={{
              ...primaryButton,
              marginTop: "12px",
            }}
            onClick={uploadEvidence}
            disabled={loading}
          >
            Upload Controlled Evidence
          </button>
        </div>
      )}

      <div
        style={{
          border: `1px solid ${BORDER}`,
          borderRadius: "12px",
          overflowX: "auto",
          backgroundColor: "#ffffff",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse:
              "collapse",
            minWidth: "780px",
          }}
        >
          <thead>
            <tr
              style={{
                backgroundColor:
                  "#eaf0fb",
              }}
            >
              {[
                "Evidence",
                "Type",
                "Submitted",
                "Confidentiality",
                "Status",
                "Access",
              ].map((heading) => (
                <th
                  key={heading}
                  style={{
                    padding: "10px",
                    textAlign: "left",
                    border: `1px solid ${BORDER}`,
                  }}
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {evidenceItems.length >
            0 ? (
              evidenceItems.map(
                (evidence) => (
                  <tr
                    key={
                      evidence.evidenceNumber
                    }
                  >
                    <td
                      style={{
                        padding: "10px",
                        border: `1px solid ${BORDER}`,
                      }}
                    >
                      <strong>
                        {evidence.title}
                      </strong>

                      <div
                        style={{
                          color: MUTED,
                          fontSize: "12px",
                          marginTop: "3px",
                        }}
                      >
                        {
                          evidence.evidenceNumber
                        }
                      </div>

                      {evidence.description && (
                        <div
                          style={{
                            marginTop: "5px",
                          }}
                        >
                          {
                            evidence.description
                          }
                        </div>
                      )}
                    </td>

                    <td
                      style={{
                        padding: "10px",
                        border: `1px solid ${BORDER}`,
                      }}
                    >
                      {
                        evidence.evidenceType
                      }
                    </td>

                    <td
                      style={{
                        padding: "10px",
                        border: `1px solid ${BORDER}`,
                      }}
                    >
                      {evidence.submittedBy ||
                        "—"}

                      <div
                        style={{
                          color: MUTED,
                          fontSize: "12px",
                        }}
                      >
                        {evidence.submittedAt
                          ? new Date(
                              evidence.submittedAt
                            ).toLocaleString()
                          : "—"}
                      </div>
                    </td>

                    <td
                      style={{
                        padding: "10px",
                        border: `1px solid ${BORDER}`,
                      }}
                    >
                      {evidence.confidential
                        ? "Restricted HR"
                        : "Case Participants"}
                    </td>

                    <td
                      style={{
                        padding: "10px",
                        border: `1px solid ${BORDER}`,
                      }}
                    >
                      <span
                        style={getEvidenceStatusStyle(
                          evidence.status
                        )}
                      >
                        {evidence.status}
                      </span>
                    </td>

                    <td
                      style={{
                        padding: "10px",
                        border: `1px solid ${BORDER}`,
                      }}
                    >
                      <button
                        type="button"
                        style={
                          secondaryButton
                        }
                        onClick={() =>
                          downloadEvidence(
                            evidence.evidenceNumber
                          )
                        }
                        disabled={
                          loading ||
                          evidence.status ===
                            "Withdrawn"
                        }
                      >
                        Secure Download
                      </button>
                    </td>
                  </tr>
                )
              )
            ) : (
              <tr>
                <td
                  colSpan="6"
                  style={{
                    padding: "20px",
                    textAlign: "center",
                    color: MUTED,
                    border: `1px solid ${BORDER}`,
                  }}
                >
                  No evidence is visible for
                  this case.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isAdminHR &&
        evidenceItems.some(
          (evidence) =>
            evidence.status ===
            "Submitted"
        ) && (
          <div
            style={{
              border: `1px solid ${BORDER}`,
              borderRadius: "12px",
              padding: "14px",
              backgroundColor: "#ffffff",
            }}
          >
            <h4 style={{ marginTop: 0 }}>
              HR Evidence Review
            </h4>

            <div
              style={{
                display: "grid",
                gap: "10px",
              }}
            >
              <select
                value={
                  reviewForm
                    .evidenceNumber
                }
                onChange={(event) =>
                  setReviewForm(
                    (previous) => ({
                      ...previous,
                      evidenceNumber:
                        event.target.value,
                    })
                  )
                }
                style={inputStyle}
              >
                <option value="">
                  Select submitted evidence
                </option>

                {evidenceItems
                  .filter(
                    (evidence) =>
                      evidence.status ===
                      "Submitted"
                  )
                  .map((evidence) => (
                    <option
                      key={
                        evidence.evidenceNumber
                      }
                      value={
                        evidence.evidenceNumber
                      }
                    >
                      {
                        evidence.evidenceNumber
                      }{" "}
                      — {evidence.title}
                    </option>
                  ))}
              </select>

              <select
                value={
                  reviewForm.decision
                }
                onChange={(event) =>
                  setReviewForm(
                    (previous) => ({
                      ...previous,
                      decision:
                        event.target.value,
                    })
                  )
                }
                style={inputStyle}
              >
                <option value="Accepted">
                  Accept
                </option>

                <option value="Rejected">
                  Reject
                </option>
              </select>

              <div>
                <label style={labelStyle}>
                  Review notes
                </label>

                <textarea
                  value={
                    reviewForm
                      .reviewNotes
                  }
                  onChange={(event) =>
                    setReviewForm(
                      (previous) => ({
                        ...previous,
                        reviewNotes:
                          event.target
                            .value,
                      })
                    )
                  }
                  style={{
                    ...inputStyle,
                    minHeight: "80px",
                  }}
                />
              </div>

              <button
                type="button"
                style={primaryButton}
                onClick={reviewEvidence}
                disabled={loading}
              >
                Record Evidence Review
              </button>
            </div>
          </div>
        )}

      {loading && (
        <div style={{ color: MUTED }}>
          Processing controlled evidence...
        </div>
      )}
    </div>
  );
}

export default EmployeeRelationsEvidencePanel;