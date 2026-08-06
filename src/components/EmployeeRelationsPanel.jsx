import { useEffect, useMemo, useState } from "react";
import api from "../api";

const DISCIPLINE_CATEGORIES = [
  "Attendance",
  "Conduct",
  "Performance",
  "Policy Breach",
  "Safety",
  "Property",
  "Confidentiality",
  "Insubordination",
  "Other",
];

const GRIEVANCE_CATEGORIES = [
  "Working Conditions",
  "Pay or Benefits",
  "Leave",
  "Scheduling",
  "Management Conduct",
  "Co-worker Conduct",
  "Discrimination",
  "Harassment",
  "Health and Safety",
  "Policy Application",
  "Other",
];

const PRIORITY_LEVELS = [
  "Low",
  "Normal",
  "High",
  "Urgent",
];

const emptyDisciplineForm = {
  subjectEmployeeId: "",
  title: "",
  summary: "",
  category: "Conduct",
  incidentDate: "",
  reportedDate: "",
  priority: "Normal",
  confidentialityLevel:
    "Restricted HR",
  interimMeasures: "",
  allegationDescription: "",
  policyReference: "",
};

const emptyGrievanceForm = {
  complainantEmployeeId: "",
  title: "",
  summary: "",
  category:
    "Working Conditions",
  incidentDate: "",
  priority: "Normal",
  requestedResolution: "",
  allegationDescription: "",
};

function EmployeeRelationsPanel({
  employees = [],
  isAdminHR = false,
}) {
  const ROYAL_BLUE = "#0B3D91";
  const BORDER = "#dbe3ef";
  const MUTED = "#64748b";
  const LIGHT_BG = "#f8fafc";

  const [records, setRecords] =
    useState([]);

  const [
    selectedCase,
    setSelectedCase,
  ] = useState(null);

  const [
    selectedCaseNumber,
    setSelectedCaseNumber,
  ] = useState("");

  const [loading, setLoading] =
    useState(false);

  const [actionLoading, setActionLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [notice, setNotice] =
    useState("");

  const [showDisciplineForm, setShowDisciplineForm] =
    useState(false);

  const [showGrievanceForm, setShowGrievanceForm] =
    useState(false);

  const [
    disciplineForm,
    setDisciplineForm,
  ] = useState({
    ...emptyDisciplineForm,
  });

  const [
    grievanceForm,
    setGrievanceForm,
  ] = useState({
    ...emptyGrievanceForm,
  });

  const cardStyle = {
    backgroundColor: "#ffffff",
    border: `1px solid ${BORDER}`,
    borderRadius: "14px",
    padding: "18px",
  };

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
    padding: "10px 14px",
    backgroundColor: "#e2e8f0",
    color: "#334155",
    fontWeight: "bold",
    cursor: "pointer",
  };

  const dangerButton = {
    ...secondaryButton,
    backgroundColor: "#fff7ed",
    color: "#c2410c",
    border: "1px solid #fed7aa",
  };

  const formatDate = (value) => {
    if (!value) return "—";

    const date = new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return value;
    }

    return date.toLocaleDateString();
  };

  const getStatusStyle = (
    status
  ) => {
    const colors = {
      Draft: ["#e2e8f0", "#334155"],
      Submitted: ["#dbeafe", "#1d4ed8"],
      "Under Review": ["#fef3c7", "#92400e"],
      Investigation: ["#ffedd5", "#c2410c"],
      "Hearing Scheduled": ["#ede9fe", "#6d28d9"],
      "Awaiting Decision": ["#fef3c7", "#92400e"],
      "Decision Issued": ["#dcfce7", "#166534"],
      "Awaiting Acknowledgement": ["#fef3c7", "#92400e"],
      "Appeal Submitted": ["#fee2e2", "#b91c1c"],
      "Appeal Review": ["#fee2e2", "#b91c1c"],
      Closed: ["#dcfce7", "#166534"],
      Withdrawn: ["#e2e8f0", "#475569"],
      Cancelled: ["#fee2e2", "#b91c1c"],
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

  const summary = useMemo(
    () => ({
      total: records.length,

      discipline:
        records.filter(
          (record) =>
            record.caseType ===
            "Discipline"
        ).length,

      grievance:
        records.filter(
          (record) =>
            record.caseType ===
            "Grievance"
        ).length,

      open:
        records.filter(
          (record) =>
            ![
              "Closed",
              "Withdrawn",
              "Cancelled",
            ].includes(
              record.status
            )
        ).length,
    }),
    [records]
  );

  const loadCases = async () => {
    setLoading(true);
    setError("");

    try {
            const endpoint =
        isAdminHR
          ? "/api/employee-relations"
          : "/api/employee-relations/me";

      const response =
        await api.get(
          endpoint
        );

      const loadedRecords =
        response.data?.data ||
        [];

      setRecords(
        loadedRecords
      );

      if (
        selectedCaseNumber
      ) {
        const refreshed =
          loadedRecords.find(
            (record) =>
              record.caseNumber ===
              selectedCaseNumber
          );

        if (refreshed) {
          setSelectedCase(
            refreshed
          );
        }
      }
    } catch (requestError) {
      console.error(
        "Employee-relations load failed:",
        requestError
      );

      setRecords([]);

      setError(
        requestError.response
          ?.data?.message ||
          "Failed to load controlled employee-relations cases."
      );
    } finally {
      setLoading(false);
    }
  };

  const loadCase = async (
    caseNumber
  ) => {
    if (!caseNumber) {
      return;
    }

    setActionLoading(true);
    setError("");
    setNotice("");

    try {
            const response =
        await api.get(
          `/api/employee-relations/${caseNumber}`
        );

      setSelectedCase(
        response.data?.data ||
        null
      );

      setSelectedCaseNumber(
        caseNumber
      );
    } catch (requestError) {
      console.error(
        "Employee-relations case load failed:",
        requestError
      );

      setError(
        requestError.response
          ?.data?.message ||
          "Failed to load the selected case."
      );
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    loadCases();
  }, [isAdminHR]);

  const handleDisciplineChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setDisciplineForm(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );
  };

  const handleGrievanceChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setGrievanceForm(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );
  };

  const createDisciplineDraft =
    async () => {
      setError("");
      setNotice("");

      if (
        !disciplineForm
          .subjectEmployeeId ||
        !disciplineForm.title.trim() ||
        !disciplineForm.summary.trim() ||
        !disciplineForm.category
      ) {
        setError(
          "Subject employee, title, summary and category are required."
        );
        return;
      }

      setActionLoading(true);

      try {
        const payload = {
          ...disciplineForm,

          allegations:
            disciplineForm
              .allegationDescription
              .trim()
              ? [
                  {
                    description:
                      disciplineForm
                        .allegationDescription
                        .trim(),

                    policyReference:
                      disciplineForm
                        .policyReference
                        .trim(),
                  },
                ]
              : [],
        };

        delete payload
          .allegationDescription;

        delete payload
          .policyReference;

                const response =
          await api.post(
            "/api/employee-relations/discipline",
            payload
          );

        const created =
          response.data?.data;

        setNotice(
          response.data?.message ||
          "Restricted discipline case draft created successfully."
        );

        setDisciplineForm({
          ...emptyDisciplineForm,
        });

        setShowDisciplineForm(
          false
        );

        await loadCases();

        if (
          created?.caseNumber
        ) {
          await loadCase(
            created.caseNumber
          );
        }
      } catch (requestError) {
        console.error(
          "Discipline case creation failed:",
          requestError
        );

        setError(
          requestError.response
            ?.data?.message ||
            "Failed to create the restricted discipline case."
        );
      } finally {
        setActionLoading(
          false
        );
      }
    };

  const submitGrievance =
    async () => {
      setError("");
      setNotice("");

      if (
        !grievanceForm.title.trim() ||
        !grievanceForm.summary.trim() ||
        !grievanceForm.category
      ) {
        setError(
          "Grievance title, summary and category are required."
        );
        return;
      }

      if (
        isAdminHR &&
        !grievanceForm
          .complainantEmployeeId
      ) {
        setError(
          "Select the employee raising the grievance."
        );
        return;
      }

      setActionLoading(true);

      try {
        const payload = {
          ...grievanceForm,

          allegations:
            grievanceForm
              .allegationDescription
              .trim()
              ? [
                  {
                    description:
                      grievanceForm
                        .allegationDescription
                        .trim(),
                  },
                ]
              : [],
        };

        delete payload
          .allegationDescription;

        if (!isAdminHR) {
          delete payload
            .complainantEmployeeId;
        }

                const response =
          await api.post(
            "/api/employee-relations/grievances",
            payload
          );

        const created =
          response.data?.data;

        setNotice(
          response.data?.message ||
          "Restricted grievance submitted successfully."
        );

        setGrievanceForm({
          ...emptyGrievanceForm,
        });

        setShowGrievanceForm(
          false
        );

        await loadCases();

        if (
          created?.caseNumber
        ) {
          await loadCase(
            created.caseNumber
          );
        }
      } catch (requestError) {
        console.error(
          "Grievance submission failed:",
          requestError
        );

        setError(
          requestError.response
            ?.data?.message ||
            "Failed to submit the restricted grievance."
        );
      } finally {
        setActionLoading(
          false
        );
      }
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
              Controlled Employee Relations
            </h2>

            <div
              style={{
                color: MUTED,
                marginTop: "5px",
              }}
            >
              {isAdminHR
                ? "Manage restricted discipline and grievance cases with controlled workflow evidence."
                : "Submit grievances and review cases assigned to your employee profile."}
            </div>
          </div>

          <button
            type="button"
            style={secondaryButton}
            onClick={loadCases}
            disabled={loading}
          >
            {loading
              ? "Refreshing..."
              : "Refresh Cases"}
          </button>
        </div>
      </div>

      {(error || notice) && (
        <div
          style={{
            ...cardStyle,
            padding: "12px 14px",
            backgroundColor:
              error
                ? "#fef2f2"
                : "#f0fdf4",
            borderColor:
              error
                ? "#fecaca"
                : "#bbf7d0",
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
            "repeat(auto-fit, minmax(170px, 1fr))",
          gap: "12px",
        }}
      >
        {[
          [
            "Controlled Cases",
            summary.total,
            ROYAL_BLUE,
          ],
          [
            "Open",
            summary.open,
            "#d97706",
          ],
          [
            "Discipline",
            summary.discipline,
            "#b91c1c",
          ],
          [
            "Grievances",
            summary.grievance,
            "#7c3aed",
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
                  fontSize: "24px",
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

      <div style={cardStyle}>
        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          {isAdminHR && (
            <button
              type="button"
              style={dangerButton}
              onClick={() => {
                setShowDisciplineForm(
                  (current) =>
                    !current
                );

                setShowGrievanceForm(
                  false
                );

                setError("");
                setNotice("");
              }}
            >
              {showDisciplineForm
                ? "Hide Discipline Form"
                : "Create Discipline Draft"}
            </button>
          )}

          <button
            type="button"
            style={primaryButton}
            onClick={() => {
              setShowGrievanceForm(
                (current) =>
                  !current
              );

              setShowDisciplineForm(
                false
              );

              setError("");
              setNotice("");
            }}
          >
            {showGrievanceForm
              ? "Hide Grievance Form"
              : isAdminHR
              ? "Submit Grievance for Employee"
              : "Submit My Grievance"}
          </button>
        </div>
      </div>

      {showDisciplineForm &&
        isAdminHR && (
          <div style={cardStyle}>
            <h3
              style={{
                color: ROYAL_BLUE,
                marginTop: 0,
              }}
            >
              Restricted Discipline Case Draft
            </h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "12px",
              }}
            >
              <div>
                <label style={labelStyle}>
                  Subject employee
                </label>

                <select
                  name="subjectEmployeeId"
                  value={
                    disciplineForm
                      .subjectEmployeeId
                  }
                  onChange={
                    handleDisciplineChange
                  }
                  style={inputStyle}
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
                        })
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label style={labelStyle}>
                  Category
                </label>

                <select
                  name="category"
                  value={
                    disciplineForm.category
                  }
                  onChange={
                    handleDisciplineChange
                  }
                  style={inputStyle}
                >
                  {DISCIPLINE_CATEGORIES.map(
                    (category) => (
                      <option
                        key={category}
                        value={category}
                      >
                        {category}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label style={labelStyle}>
                  Priority
                </label>

                <select
                  name="priority"
                  value={
                    disciplineForm.priority
                  }
                  onChange={
                    handleDisciplineChange
                  }
                  style={inputStyle}
                >
                  {PRIORITY_LEVELS.map(
                    (priority) => (
                      <option
                        key={priority}
                        value={priority}
                      >
                        {priority}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label style={labelStyle}>
                  Incident date
                </label>

                <input
                  type="date"
                  name="incidentDate"
                  value={
                    disciplineForm
                      .incidentDate
                  }
                  onChange={
                    handleDisciplineChange
                  }
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>
                  Reported date
                </label>

                <input
                  type="date"
                  name="reportedDate"
                  value={
                    disciplineForm
                      .reportedDate
                  }
                  onChange={
                    handleDisciplineChange
                  }
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>
                  Confidentiality
                </label>

                <select
                  name="confidentialityLevel"
                  value={
                    disciplineForm
                      .confidentialityLevel
                  }
                  onChange={
                    handleDisciplineChange
                  }
                  style={inputStyle}
                >
                  <option value="Restricted HR">
                    Restricted HR
                  </option>

                  <option value="Case Participants">
                    Case Participants
                  </option>

                  <option value="Highly Restricted">
                    Highly Restricted
                  </option>
                </select>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gap: "12px",
                marginTop: "12px",
              }}
            >
              <div>
                <label style={labelStyle}>
                  Case title
                </label>

                <input
                  name="title"
                  value={
                    disciplineForm.title
                  }
                  onChange={
                    handleDisciplineChange
                  }
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>
                  Case summary
                </label>

                <textarea
                  name="summary"
                  value={
                    disciplineForm.summary
                  }
                  onChange={
                    handleDisciplineChange
                  }
                  style={{
                    ...inputStyle,
                    minHeight: "90px",
                  }}
                />
              </div>

              <div>
                <label style={labelStyle}>
                  Allegation
                </label>

                <textarea
                  name="allegationDescription"
                  value={
                    disciplineForm
                      .allegationDescription
                  }
                  onChange={
                    handleDisciplineChange
                  }
                  style={{
                    ...inputStyle,
                    minHeight: "80px",
                  }}
                />
              </div>

              <div>
                <label style={labelStyle}>
                  Policy reference
                </label>

                <input
                  name="policyReference"
                  value={
                    disciplineForm
                      .policyReference
                  }
                  onChange={
                    handleDisciplineChange
                  }
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>
                  Interim measures
                </label>

                <textarea
                  name="interimMeasures"
                  value={
                    disciplineForm
                      .interimMeasures
                  }
                  onChange={
                    handleDisciplineChange
                  }
                  style={{
                    ...inputStyle,
                    minHeight: "70px",
                  }}
                />
              </div>

              <button
                type="button"
                style={primaryButton}
                onClick={
                  createDisciplineDraft
                }
                disabled={actionLoading}
              >
                {actionLoading
                  ? "Creating..."
                  : "Create Restricted Draft"}
              </button>
            </div>
          </div>
        )}

      {showGrievanceForm && (
        <div style={cardStyle}>
          <h3
            style={{
              color: ROYAL_BLUE,
              marginTop: 0,
            }}
          >
            {isAdminHR
              ? "Submit Grievance for Employee"
              : "Submit My Grievance"}
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "12px",
            }}
          >
            {isAdminHR && (
              <div>
                <label style={labelStyle}>
                  Complainant employee
                </label>

                <select
                  name="complainantEmployeeId"
                  value={
                    grievanceForm
                      .complainantEmployeeId
                  }
                  onChange={
                    handleGrievanceChange
                  }
                  style={inputStyle}
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
                        })
                      </option>
                    )
                  )}
                </select>
              </div>
            )}

            <div>
              <label style={labelStyle}>
                Category
              </label>

              <select
                name="category"
                value={
                  grievanceForm.category
                }
                onChange={
                  handleGrievanceChange
                }
                style={inputStyle}
              >
                {GRIEVANCE_CATEGORIES.map(
                  (category) => (
                    <option
                      key={category}
                      value={category}
                    >
                      {category}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label style={labelStyle}>
                Priority
              </label>

              <select
                name="priority"
                value={
                  grievanceForm.priority
                }
                onChange={
                  handleGrievanceChange
                }
                style={inputStyle}
              >
                {PRIORITY_LEVELS.map(
                  (priority) => (
                    <option
                      key={priority}
                      value={priority}
                    >
                      {priority}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label style={labelStyle}>
                Incident date
              </label>

              <input
                type="date"
                name="incidentDate"
                value={
                  grievanceForm
                    .incidentDate
                }
                onChange={
                  handleGrievanceChange
                }
                style={inputStyle}
              />
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gap: "12px",
              marginTop: "12px",
            }}
          >
            <div>
              <label style={labelStyle}>
                Grievance title
              </label>

              <input
                name="title"
                value={
                  grievanceForm.title
                }
                onChange={
                  handleGrievanceChange
                }
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>
                Summary
              </label>

              <textarea
                name="summary"
                value={
                  grievanceForm.summary
                }
                onChange={
                  handleGrievanceChange
                }
                style={{
                  ...inputStyle,
                  minHeight: "90px",
                }}
              />
            </div>

            <div>
              <label style={labelStyle}>
                Supporting details
              </label>

              <textarea
                name="allegationDescription"
                value={
                  grievanceForm
                    .allegationDescription
                }
                onChange={
                  handleGrievanceChange
                }
                style={{
                  ...inputStyle,
                  minHeight: "80px",
                }}
              />
            </div>

            <div>
              <label style={labelStyle}>
                Requested resolution
              </label>

              <textarea
                name="requestedResolution"
                value={
                  grievanceForm
                    .requestedResolution
                }
                onChange={
                  handleGrievanceChange
                }
                style={{
                  ...inputStyle,
                  minHeight: "70px",
                }}
              />
            </div>

            <button
              type="button"
              style={primaryButton}
              onClick={
                submitGrievance
              }
              disabled={actionLoading}
            >
              {actionLoading
                ? "Submitting..."
                : "Submit Restricted Grievance"}
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
            ? "Controlled Case Register"
            : "My Employee Relations Cases"}
        </h3>

        <div
          style={{
            overflowX: "auto",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse:
                "collapse",
              minWidth: "850px",
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
                  "Case",
                  "Type",
                  "Employee",
                  "Category",
                  "Reported",
                  "Priority",
                  "Status",
                  "Action",
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
              {records.length > 0 ? (
                records.map(
                  (record) => {
                    const employeeName =
                      record.caseType ===
                      "Discipline"
                        ? record
                            .subjectSnapshot
                            ?.fullName ||
                          record
                            .subjectEmployeeId
                        : record
                            .complainantSnapshot
                            ?.fullName ||
                          record
                            .complainantEmployeeId;

                    return (
                      <tr
                        key={
                          record.caseNumber
                        }
                      >
                        <td
                          style={{
                            padding: "10px",
                            border: `1px solid ${BORDER}`,
                          }}
                        >
                          <strong>
                            {
                              record.caseNumber
                            }
                          </strong>

                          <div
                            style={{
                              color: MUTED,
                              fontSize: "12px",
                              marginTop: "3px",
                            }}
                          >
                            {record.title}
                          </div>
                        </td>

                        <td
                          style={{
                            padding: "10px",
                            border: `1px solid ${BORDER}`,
                          }}
                        >
                          {record.caseType}
                        </td>

                        <td
                          style={{
                            padding: "10px",
                            border: `1px solid ${BORDER}`,
                          }}
                        >
                          {employeeName ||
                            "—"}
                        </td>

                        <td
                          style={{
                            padding: "10px",
                            border: `1px solid ${BORDER}`,
                          }}
                        >
                          {record.category}
                        </td>

                        <td
                          style={{
                            padding: "10px",
                            border: `1px solid ${BORDER}`,
                          }}
                        >
                          {formatDate(
                            record.reportedDate
                          )}
                        </td>

                        <td
                          style={{
                            padding: "10px",
                            border: `1px solid ${BORDER}`,
                          }}
                        >
                          {record.priority}
                        </td>

                        <td
                          style={{
                            padding: "10px",
                            border: `1px solid ${BORDER}`,
                          }}
                        >
                          <span
                            style={getStatusStyle(
                              record.status
                            )}
                          >
                            {record.status}
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
                            style={primaryButton}
                            onClick={() =>
                              loadCase(
                                record.caseNumber
                              )
                            }
                            disabled={
                              actionLoading
                            }
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  }
                )
              ) : (
                <tr>
                  <td
                    colSpan="8"
                    style={{
                      padding: "22px",
                      textAlign: "center",
                      color: MUTED,
                      border: `1px solid ${BORDER}`,
                    }}
                  >
                    {loading
                      ? "Loading controlled cases..."
                      : "No controlled employee-relations cases were found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedCase && (
        <div style={cardStyle}>
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "flex-start",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <h3
                style={{
                  color: ROYAL_BLUE,
                  margin: 0,
                }}
              >
                {
                  selectedCase.caseNumber
                }{" "}
                —{" "}
                {selectedCase.title}
              </h3>

              <div
                style={{
                  color: MUTED,
                  marginTop: "5px",
                }}
              >
                {selectedCase.caseType} ·{" "}
                {selectedCase.category}
              </div>
            </div>

            <span
              style={getStatusStyle(
                selectedCase.status
              )}
            >
              {selectedCase.status}
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "12px",
              marginTop: "18px",
              padding: "14px",
              borderRadius: "10px",
              backgroundColor:
                LIGHT_BG,
            }}
          >
            <div>
              <strong>
                Reported
              </strong>

              <div>
                {formatDate(
                  selectedCase
                    .reportedDate
                )}
              </div>
            </div>

            <div>
              <strong>
                Incident
              </strong>

              <div>
                {formatDate(
                  selectedCase
                    .incidentDate
                )}
              </div>
            </div>

            <div>
              <strong>
                Priority
              </strong>

              <div>
                {
                  selectedCase.priority
                }
              </div>
            </div>

            <div>
              <strong>
                Confidentiality
              </strong>

              <div>
                {selectedCase
                  .confidentialityLevel ||
                  "Restricted"}
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: "18px",
            }}
          >
            <strong>
              Summary
            </strong>

            <div
              style={{
                marginTop: "6px",
                whiteSpace:
                  "pre-wrap",
              }}
            >
              {selectedCase.summary}
            </div>
          </div>

          {selectedCase
            .requestedResolution && (
            <div
              style={{
                marginTop: "18px",
              }}
            >
              <strong>
                Requested resolution
              </strong>

              <div
                style={{
                  marginTop: "6px",
                  whiteSpace:
                    "pre-wrap",
                }}
              >
                {
                  selectedCase
                    .requestedResolution
                }
              </div>
            </div>
          )}

          <div
            style={{
              marginTop: "18px",
            }}
          >
            <strong>
              Evidence
            </strong>

            <div
              style={{
                color: MUTED,
                marginTop: "6px",
              }}
            >
              {(selectedCase.evidence ||
                []).length}{" "}
              evidence item(s) currently
              visible to your access level.
            </div>
          </div>

          <div
            style={{
              marginTop: "18px",
              color: MUTED,
              fontSize: "13px",
            }}
          >
            Workflow, evidence and
            decision controls will appear
            here in the next controlled
            frontend stage.
          </div>
        </div>
      )}
    </div>
  );
}

export default EmployeeRelationsPanel;