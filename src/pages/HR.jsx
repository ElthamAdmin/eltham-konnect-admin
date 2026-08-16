import { useEffect, useMemo, useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import CompensationHistoryPanel from "../components/CompensationHistoryPanel";
import AttendancePeriodsPanel from "../components/AttendancePeriodsPanel";
import ControlledDocumentsPanel from "../components/ControlledDocumentsPanel";
import LeaveManagementPanel from "../components/LeaveManagementPanel";
import EmployeeRelationsPanel from "../components/EmployeeRelationsPanel";
import PerformanceReviewsPanel from "../components/PerformanceReviewsPanel";
import EmployeeLifecyclePanel from "../components/EmployeeLifecyclePanel";

function HR() {
  const { user } = useAuth();

  const permissions = user?.permissions || [];
  const isAdminHR = permissions.includes("hr") || user?.role === "Admin";
  const canSelfServiceHR =
    permissions.includes("hrSelfService") ||
    permissions.includes("leaveSelfService") ||
    permissions.includes("documentSelfService") ||
    permissions.includes("payslipSelfService") ||
    isAdminHR;

  const ROYAL_BLUE = "#0B3D91";
  const GOLD = "#D4AF37";
  const WHITE = "#FFFFFF";
  const LIGHT_BG = "#f4f7fb";
  const BORDER = "#dbe3ef";
  const MUTED = "#64748b";

  const BRANCH_OPTIONS = ["Eltham Park Mainstore", "Brown's Town Square"];
  const DEPARTMENT_OPTIONS = [
    "Operations",
    "Customer Service",
    "Accounts",
    "Marketing",
    "Warehouse",
    "Administration",
  ];
  const EMPLOYMENT_TYPE_OPTIONS = [
    "Permanent",
    "Temporary",
    "Part-Time",
    "Contract",
    "Probation",
  ];
  const EMPLOYMENT_STATUS_OPTIONS = ["Active", "Inactive", "On Leave", "Terminated"];
    const PAY_TYPE_OPTIONS = [
    "Monthly Salary",
    "Weekly Wage",
    "Daily Rate",
    "Hourly Rate",
  ];

  const EMPLOYMENT_CLASSIFICATION_OPTIONS = [
    "",
    "Full-Time",
    "Part-Time",
    "Casual",
    "Seasonal",
    "Apprentice",
    "Intern",
    "Other",
  ];

  const CONTRACT_TYPE_OPTIONS = [
    "",
    "Permanent",
    "Fixed-Term",
    "Temporary",
    "Casual",
    "Probationary",
    "Independent Contractor",
    "Other",
  ];

  const COMPENSATION_TYPE_OPTIONS = [
    "",
    "Salary",
    "Wage",
    "Stipend",
    "Allowance",
    "Other",
  ];

  const PAY_FREQUENCY_OPTIONS = [
    "",
    "Weekly",
    "Fortnightly",
    "Semi-Monthly",
    "Monthly",
    "Annual",
  ];

  const WORKDAY_OPTIONS = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const PROBATION_STATUS_OPTIONS = [
    "Not Applicable",
    "Pending",
    "In Progress",
    "Review Due",
    "Completed",
    "Extended",
    "Failed",
  ];

  const PAYROLL_ELIGIBILITY_OPTIONS = [
    "Pending Review",
    "Eligible",
    "On Hold",
    "Not Eligible",
  ];

  const LEAVE_TYPE_OPTIONS = [
    "Vacation",
    "Sick",
    "Unpaid",
    "Emergency",
  ];

  const DOCUMENT_TYPE_OPTIONS = [
  "Contract",
  "Job Letter",
  "Warning Letter",
  "ID",
  "TRN",
  "NIS",
  "Payslip",
  "Policy",
  "Handbook",
  "Other",
];

    const emptyEmployeeForm = {
    fullName: "",
    firstName: "",
    lastName: "",
    gender: "",
    dateOfBirth: "",
    trn: "",
    nisNumber: "",

    email: "",
    phone: "",
    alternatePhone: "",
    address: "",

    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelationship: "",

    department: "Operations",
    jobTitle: "",
    jobLevel: 1,
    isDepartmentHead: false,
    reportsToEmployeeId: "",
    branch: "Eltham Park Mainstore",

    employmentType: "Temporary",
    employmentClassification: "",
    contractType: "",
    employmentStatus: "Active",
    startDate: "",
    endDate: "",

    probation: {
      applicable: false,
      startDate: "",
      endDate: "",
      durationMonths: 0,
      status: "Not Applicable",
      reviewDueDate: "",
      completedDate: "",
      notes: "",
    },

    normalWorkingHours: {
      hoursPerDay: 0,
      hoursPerWeek: 0,
    },

    scheduledWorkdays: [],

    compensationType: "",
    payFrequency: "",

    /*
     * Legacy compensation fields remain available for display
     * until H2 migrates compensation into effective-dated records.
     */
    payType: "Monthly Salary",
    payRate: 0,

    payrollEnabled: true,
    payrollEligibilityStatus:
      "Pending Review",
    payrollEligibilityReason: "",
    payrollEligibilityEffectiveFrom: "",
    payrollEligibilityEffectiveTo: "",

    linkedUserId: "",
    attendanceRequired: true,

    /*
     * Leave balances are display-only during H1.
     * H5 will provide controlled balance adjustments.
     */
    leaveBalanceVacation: 0,
    leaveBalanceSick: 0,
    leaveBalanceUnpaid: 0,

    notes: "",
  };

  const emptyLeaveForm = {
    employeeId: "",
    leaveType: "Vacation",
    startDate: "",
    endDate: "",
    reason: "",
  };

  const emptyDocumentForm = {
  employeeId: "",
  documentType: "Contract",
  documentName: "",
  file: null,
};

  const [activeTab, setActiveTab] = useState(
    isAdminHR ? "employees" : "myProfile"
  );
  const [employees, setEmployees] = useState([]);
  const [summary, setSummary] = useState(null);
  const [organizationChart, setOrganizationChart] = useState([]);
  const [systemUsers, setSystemUsers] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [myPayslips, setMyPayslips] = useState([]);
  const [myDisciplineRecords, setMyDisciplineRecords] = useState([]);
  const [myPerformanceReviews, setMyPerformanceReviews] = useState([]);
  const [myCompensation, setMyCompensation] = useState(null);
  const [analyticsSummary, setAnalyticsSummary] = useState(null);
  const [myEmployee, setMyEmployee] = useState(null);
  const [employeeForm, setEmployeeForm] = useState(emptyEmployeeForm);
  const [leaveForm, setLeaveForm] = useState(emptyLeaveForm);
  const [leaveAdminComment, setLeaveAdminComment] = useState("");
const [searchTerm, setSearchTerm] = useState("");
const [statusFilter, setStatusFilter] = useState("All");
const [departmentFilter, setDepartmentFilter] = useState("All");
const [isEditing, setIsEditing] = useState(false);
const [editingEmployeeId, setEditingEmployeeId] = useState("");
const [loading, setLoading] = useState(false);

const [documentForm, setDocumentForm] = useState(emptyDocumentForm);
const [employeeDocuments, setEmployeeDocuments] = useState([]);
const [documentEmployeeId, setDocumentEmployeeId] = useState("");
const [documentsLoading, setDocumentsLoading] = useState(false);
const [disciplineEmployeeId, setDisciplineEmployeeId] = useState("");
const [disciplineForm, setDisciplineForm] = useState({
  disciplineType: "Written Warning",
  subject: "",
  details: "",
  actionTaken: "",
  incidentDate: "",
  issuedDate: "",
  employeeAcknowledged: false,
});

const [performanceEmployeeId, setPerformanceEmployeeId] = useState("");
const [performanceForm, setPerformanceForm] = useState({
  reviewPeriod: "",
  reviewDate: "",
  rating: "Good",
  strengths: "",
  areasForImprovement: "",
  goals: "",
  managerComments: "",
  employeeComments: "",
  employeeAcknowledged: false,
});

  const cardStyle = {
    backgroundColor: WHITE,
    borderRadius: "14px",
    padding: "20px",
    border: `1px solid ${BORDER}`,
    boxShadow: "0 4px 14px rgba(15,23,42,0.05)",
  };

  const inputStyle = {
    padding: "10px",
    width: "100%",
    border: `1px solid ${BORDER}`,
    borderRadius: "8px",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle = {
    display: "block",
    marginBottom: "6px",
    color: "#334155",
    fontWeight: "bold",
    fontSize: "14px",
  };

    const employeeSectionStyle = {
    border: `1px solid ${BORDER}`,
    borderRadius: "12px",
    padding: "18px",
    backgroundColor: "#f8fafc",
  };

  const employeeSectionHeaderStyle = {
    margin: "0 0 4px",
    color: ROYAL_BLUE,
    fontSize: "18px",
  };

  const employeeSectionDescriptionStyle = {
    margin: "0 0 16px",
    color: MUTED,
    fontSize: "13px",
  };

  const employeeGridStyle = {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(230px, 1fr))",
    gap: "14px",
  };

  const employeeToggleStyle = {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    padding: "12px",
    border: `1px solid ${BORDER}`,
    borderRadius: "10px",
    backgroundColor: WHITE,
  };

  const protectedValueStyle = {
    padding: "12px",
    border: `1px solid ${BORDER}`,
    borderRadius: "10px",
    backgroundColor: "#eef2f7",
  };

  const primaryButton = {
    backgroundColor: ROYAL_BLUE,
    color: WHITE,
    border: "none",
    padding: "10px 14px",
    borderRadius: "8px",
    fontWeight: "bold",
    cursor: "pointer",
  };

  const secondaryButton = {
    backgroundColor: "#64748b",
    color: WHITE,
    border: "none",
    padding: "10px 14px",
    borderRadius: "8px",
    fontWeight: "bold",
    cursor: "pointer",
  };

  const successButton = {
    backgroundColor: "#16a34a",
    color: WHITE,
    border: "none",
    padding: "8px 12px",
    borderRadius: "8px",
    fontWeight: "bold",
    cursor: "pointer",
  };

  const warningButton = {
    backgroundColor: "#f59e0b",
    color: WHITE,
    border: "none",
    padding: "8px 12px",
    borderRadius: "8px",
    fontWeight: "bold",
    cursor: "pointer",
  };

  const dangerButton = {
    backgroundColor: "#dc2626",
    color: WHITE,
    border: "none",
    padding: "8px 12px",
    borderRadius: "8px",
    fontWeight: "bold",
    cursor: "pointer",
  };

  const neutralButton = {
    backgroundColor: "#e2e8f0",
    color: "#334155",
    border: "none",
    padding: "10px 14px",
    borderRadius: "8px",
    fontWeight: "bold",
    cursor: "pointer",
  };

  const tabButtonStyle = (tabKey) => ({
    backgroundColor: activeTab === tabKey ? ROYAL_BLUE : "#e2e8f0",
    color: activeTab === tabKey ? WHITE : "#334155",
    border: "none",
    padding: "10px 14px",
    borderRadius: "10px",
    fontWeight: "bold",
    cursor: "pointer",
  });

  const statCardStyle = (bg) => ({
    backgroundColor: bg,
    borderRadius: "12px",
    padding: "16px",
    border: `1px solid ${BORDER}`,
  });

  const fetchHRAnalytics = async () => {
  try {
    const res = await api.get("/api/hr-analytics/dashboard");
    setAnalyticsSummary(res.data.data || null);
  } catch (error) {
    console.error("Failed to load HR analytics:", error);
    setAnalyticsSummary(null);
  }
};

  const fetchHRData = async () => {
  try {
    setLoading(true);

    if (isAdminHR) {
      const [
  employeesRes,
  summaryRes,
  usersRes,
  leaveRes,
  analyticsRes,
  orgChartRes,
] = await Promise.all([
  api.get("/api/hr"),
  api.get("/api/hr/summary"),
  api.get("/api/system-users"),
  api.get("/api/leave-requests"),
  api.get("/api/hr-analytics/dashboard").catch((error) => {
    if (
      error?.response?.status === 404 ||
      error?.response?.status === 403 ||
      error?.response?.status === 500
    ) {
      console.error("HR analytics load failed:", error);
      return { data: { data: null } };
    }
    throw error;
  }),
  api.get("/api/hr/organization-chart").catch((error) => {
    if (
      error?.response?.status === 404 ||
      error?.response?.status === 403 ||
      error?.response?.status === 500
    ) {
      console.error("Organization chart load failed:", error);
      return { data: { data: [] } };
    }
    throw error;
  }),
]);

      const employeesData = employeesRes.data.data || [];

      setEmployees(employeesData);
setSummary(summaryRes.data.data || null);
setOrganizationChart(orgChartRes.data.data || []);
setSystemUsers(usersRes.data.data || []);
setLeaveRequests(leaveRes.data.data || []);
setAnalyticsSummary(analyticsRes.data.data || null);
setMyPayslips([]);
setMyDisciplineRecords([]);
setMyPerformanceReviews([]);
setMyCompensation(null);
setMyEmployee(null);

      if (!documentEmployeeId && employeesData.length > 0) {
        setDocumentEmployeeId(employeesData[0].employeeId);
      }
    } else {
      const requests = [
  api.get("/api/leave-requests").catch((error) => {
    if (error?.response?.status === 404) {
      return { data: { data: [] } };
    }
    throw error;
  }),
  api.get("/api/finance/payroll/my-records").catch((error) => {
    if (error?.response?.status === 404 || error?.response?.status === 403) {
      return { data: { data: [] } };
    }
    console.error("Payroll self-service load failed:", error);
    return { data: { data: [] } };
  }),
  api.get("/api/hr/me/discipline").catch((error) => {
    if (error?.response?.status === 404 || error?.response?.status === 403) {
      return { data: { data: [] } };
    }
    console.error("Discipline self-service load failed:", error);
    return { data: { data: [] } };
  }),
    api.get("/api/hr/me/performance").catch((error) => {
    if (
      error?.response?.status === 404 ||
      error?.response?.status === 403
    ) {
      return { data: { data: [] } };
    }

    console.error(
      "Performance self-service load failed:",
      error
    );

    return { data: { data: [] } };
  }),

  api.get("/api/hr/me/compensation").catch((error) => {
    if (
      error?.response?.status === 404 ||
      error?.response?.status === 403
    ) {
      return { data: { data: null } };
    }

    console.error(
      "Compensation self-service load failed:",
      error
    );

    return { data: { data: null } };
  }),
];
      if (canSelfServiceHR) {
        requests.unshift(
          api.get("/api/hr/me").catch((error) => {
            if (error?.response?.status === 404) {
              return { data: { data: null } };
            }
            throw error;
          })
        );
      }

      const responses = await Promise.all(requests);

let myProfileRes = {
  data: { data: null },
};

let leaveRes = {
  data: { data: [] },
};

let payrollRes = {
  data: { data: [] },
};

let disciplineRes = {
  data: { data: [] },
};

let performanceRes = {
  data: { data: [] },
};

let compensationRes = {
  data: { data: null },
};

if (responses.length === 6) {
  myProfileRes = responses[0];
  leaveRes = responses[1];
  payrollRes = responses[2];
  disciplineRes = responses[3];
  performanceRes = responses[4];
  compensationRes = responses[5];
} else if (responses.length === 5) {
  leaveRes = responses[0];
  payrollRes = responses[1];
  disciplineRes = responses[2];
  performanceRes = responses[3];
  compensationRes = responses[4];
} else {
  leaveRes = responses[0];
}

      const myProfile = myProfileRes.data.data || null;

      setEmployees([]);
setSummary(null);
setOrganizationChart([]);
setSystemUsers([]);
setAnalyticsSummary(null);
setMyEmployee(myProfile);
setLeaveRequests(leaveRes.data.data || []);
setMyPayslips(payrollRes.data.data || []);
setMyDisciplineRecords(
  disciplineRes.data.data || []
);

setMyPerformanceReviews(
  performanceRes.data.data || []
);

setMyCompensation(
  compensationRes.data.data || null
);
      setLeaveForm((prev) => ({
        ...prev,
        employeeId: myProfile?.employeeId || "",
      }));
    }
  } catch (error) {
    console.error("Failed to load HR data:", error);
    alert(error?.response?.data?.message || "Failed to load HR data");
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchHRData();
  }, []);

  useEffect(() => {
  if (activeTab !== "documents") return;

  const employeeIdToLoad = isAdminHR
    ? documentEmployeeId
    : myEmployee?.employeeId || "";

  if (employeeIdToLoad) {
    fetchEmployeeDocuments(employeeIdToLoad);
  } else {
    setEmployeeDocuments([]);
  }
}, [activeTab, documentEmployeeId, myEmployee, isAdminHR]);

    const handleEmployeeChange = (e) => {
    const {
      name,
      value,
      type,
      checked,
    } = e.target;

    setEmployeeForm((previous) => ({
      ...previous,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  const handleProbationChange = (e) => {
    const {
      name,
      value,
      type,
      checked,
    } = e.target;

    setEmployeeForm((previous) => {
      const probation = {
        ...previous.probation,
        [name]:
          type === "checkbox"
            ? checked
            : name === "durationMonths"
            ? Number(value || 0)
            : value,
      };

      if (
        name === "applicable" &&
        !checked
      ) {
        probation.status =
          "Not Applicable";
        probation.startDate = "";
        probation.endDate = "";
        probation.durationMonths = 0;
        probation.reviewDueDate = "";
        probation.completedDate = "";
      }

      if (
        name === "applicable" &&
        checked &&
        probation.status ===
          "Not Applicable"
      ) {
        probation.status = "Pending";
      }

      return {
        ...previous,
        probation,
      };
    });
  };

  const handleWorkingHoursChange = (e) => {
    const { name, value } = e.target;

    setEmployeeForm((previous) => ({
      ...previous,
      normalWorkingHours: {
        ...previous.normalWorkingHours,
        [name]: Number(value || 0),
      },
    }));
  };

  const toggleScheduledWorkday = (
    workday
  ) => {
    setEmployeeForm((previous) => {
      const selectedWorkdays =
        previous.scheduledWorkdays || [];

      const scheduledWorkdays =
        selectedWorkdays.includes(workday)
          ? selectedWorkdays.filter(
              (day) => day !== workday
            )
          : [
              ...selectedWorkdays,
              workday,
            ];

      return {
        ...previous,
        scheduledWorkdays,
      };
    });
  };

  const handleLeaveChange = (e) => {
    const { name, value } = e.target;
    setLeaveForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleDocumentInputChange = (e) => {
  const { name, value, files } = e.target;

  if (name === "file") {
    setDocumentForm((prev) => ({
      ...prev,
      file: files && files[0] ? files[0] : null,
    }));
    return;
  }

  setDocumentForm((prev) => ({
    ...prev,
    [name]: value,
  }));
};

const handleDisciplineChange = (e) => {
  const { name, value, type, checked } = e.target;

  setDisciplineForm((prev) => ({
    ...prev,
    [name]: type === "checkbox" ? checked : value,
  }));
};

const saveDisciplineRecord = async () => {
  try {
    if (!disciplineEmployeeId) {
      alert("Please select an employee.");
      return;
    }

    if (!disciplineForm.disciplineType || !disciplineForm.subject || !disciplineForm.details) {
      alert("Discipline type, subject, and details are required.");
      return;
    }

    const res = await api.post(`/api/hr/${disciplineEmployeeId}/discipline`, disciplineForm);

    alert(res.data.message || "Discipline record added successfully");

    setDisciplineForm({
      disciplineType: "Written Warning",
      subject: "",
      details: "",
      actionTaken: "",
      incidentDate: "",
      issuedDate: "",
      employeeAcknowledged: false,
    });

    await fetchHRData();
  } catch (error) {
    console.error(error);
    alert(error?.response?.data?.message || "Failed to save discipline record");
  }
};

const handlePerformanceChange = (e) => {
  const { name, value, type, checked } = e.target;

  setPerformanceForm((prev) => ({
    ...prev,
    [name]: type === "checkbox" ? checked : value,
  }));
};

const savePerformanceReview = async () => {
  try {
    if (!performanceEmployeeId) {
      alert("Please select an employee.");
      return;
    }

    if (!performanceForm.reviewPeriod || !performanceForm.reviewDate || !performanceForm.rating) {
      alert("Review period, review date, and rating are required.");
      return;
    }

    const res = await api.post(
      `/api/hr/${performanceEmployeeId}/performance`,
      performanceForm
    );

    alert(res.data.message || "Performance review added successfully");

    setPerformanceForm({
      reviewPeriod: "",
      reviewDate: "",
      rating: "Good",
      strengths: "",
      areasForImprovement: "",
      goals: "",
      managerComments: "",
      employeeComments: "",
      employeeAcknowledged: false,
    });

    await fetchHRData();
  } catch (error) {
    console.error(error);
    alert(error?.response?.data?.message || "Failed to save performance review");
  }
};

  const resetEmployeeForm = () => {
    setEmployeeForm(emptyEmployeeForm);
    setIsEditing(false);
    setEditingEmployeeId("");
  };

    const loadEmployeeForEdit = (employee) => {
    setEmployeeForm({
      fullName: employee.fullName || "",
      firstName: employee.firstName || "",
      lastName: employee.lastName || "",
      gender: employee.gender || "",
      dateOfBirth:
        employee.dateOfBirth || "",
      trn: employee.trn || "",
      nisNumber: employee.nisNumber || "",

      email: employee.email || "",
      phone: employee.phone || "",
      alternatePhone:
        employee.alternatePhone || "",
      address: employee.address || "",

      emergencyContactName:
        employee.emergencyContactName || "",
      emergencyContactPhone:
        employee.emergencyContactPhone || "",
      emergencyContactRelationship:
        employee.emergencyContactRelationship ||
        "",

      department:
        employee.department || "Operations",
      jobTitle: employee.jobTitle || "",
      jobLevel: employee.jobLevel ?? 1,
      isDepartmentHead: Boolean(
        employee.isDepartmentHead
      ),
      reportsToEmployeeId:
        employee.reportsToEmployeeId || "",
      branch:
        employee.branch ||
        "Eltham Park Mainstore",

      employmentType:
        employee.employmentType ||
        "Temporary",
      employmentClassification:
        employee.employmentClassification ||
        "",
      contractType:
        employee.contractType || "",
      employmentStatus:
        employee.employmentStatus || "Active",
      startDate: employee.startDate || "",
      endDate: employee.endDate || "",

      probation: {
        applicable: Boolean(
          employee.probation?.applicable
        ),
        startDate:
          employee.probation?.startDate ||
          "",
        endDate:
          employee.probation?.endDate || "",
        durationMonths:
          employee.probation
            ?.durationMonths ?? 0,
        status:
          employee.probation?.status ||
          "Not Applicable",
        reviewDueDate:
          employee.probation
            ?.reviewDueDate || "",
        completedDate:
          employee.probation
            ?.completedDate || "",
        notes:
          employee.probation?.notes || "",
      },

      normalWorkingHours: {
        hoursPerDay:
          employee.normalWorkingHours
            ?.hoursPerDay ?? 0,
        hoursPerWeek:
          employee.normalWorkingHours
            ?.hoursPerWeek ?? 0,
      },

      scheduledWorkdays: Array.isArray(
        employee.scheduledWorkdays
      )
        ? [...employee.scheduledWorkdays]
        : [],

      compensationType:
        employee.compensationType || "",
      payFrequency:
        employee.payFrequency || "",

      payType:
        employee.payType ||
        "Monthly Salary",
      payRate:
        Number(employee.payRate || 0),

      payrollEnabled: Boolean(
        employee.payrollEnabled
      ),
      payrollEligibilityStatus:
        employee.payrollEligibilityStatus ||
        "Pending Review",
      payrollEligibilityReason:
        employee.payrollEligibilityReason ||
        "",
      payrollEligibilityEffectiveFrom:
        employee
          .payrollEligibilityEffectiveFrom ||
        "",
      payrollEligibilityEffectiveTo:
        employee
          .payrollEligibilityEffectiveTo ||
        "",

      linkedUserId:
        employee.linkedUserId || "",
      attendanceRequired: Boolean(
        employee.attendanceRequired
      ),

      leaveBalanceVacation:
        Number(
          employee.leaveBalanceVacation || 0
        ),
      leaveBalanceSick:
        Number(
          employee.leaveBalanceSick || 0
        ),
      leaveBalanceUnpaid:
        Number(
          employee.leaveBalanceUnpaid || 0
        ),

      notes: employee.notes || "",
    });

    setEditingEmployeeId(
      employee.employeeId
    );
    setIsEditing(true);
    setActiveTab("employeeForm");
  };

    const saveEmployee = async () => {
    try {
      const normalizedTrn = String(
        employeeForm.trn || ""
      ).replace(/\D/g, "");

      if (
        !employeeForm.fullName.trim() ||
        !employeeForm.jobTitle.trim()
      ) {
        alert(
          "Full name and job title are required."
        );
        return;
      }

      if (
        employeeForm.trn &&
        normalizedTrn.length !== 9
      ) {
        alert(
          "The employee TRN must contain exactly nine digits."
        );
        return;
      }

      if (
        employeeForm.startDate &&
        employeeForm.endDate &&
        employeeForm.endDate <
          employeeForm.startDate
      ) {
        alert(
          "Employment end date cannot be earlier than the start date."
        );
        return;
      }

      const hoursPerDay = Number(
        employeeForm.normalWorkingHours
          ?.hoursPerDay || 0
      );

      const hoursPerWeek = Number(
        employeeForm.normalWorkingHours
          ?.hoursPerWeek || 0
      );

      if (
        hoursPerDay > 0 &&
        hoursPerWeek > 0 &&
        hoursPerWeek < hoursPerDay
      ) {
        alert(
          "Normal weekly hours cannot be less than normal daily hours."
        );
        return;
      }

      const scheduledWorkdays =
        Array.from(
          new Set(
            employeeForm.scheduledWorkdays ||
              []
          )
        );

      if (
        employeeForm.probation
          ?.applicable &&
        employeeForm.probation
          ?.status === "Not Applicable"
      ) {
        alert(
          "Select a valid status for the applicable probation period."
        );
        return;
      }

      if (
        employeeForm.probation
          ?.applicable &&
        employeeForm.probation
          ?.startDate &&
        employeeForm.probation?.endDate &&
        employeeForm.probation.endDate <
          employeeForm.probation.startDate
      ) {
        alert(
          "Probation end date cannot be earlier than its start date."
        );
        return;
      }

      if (
        employeeForm
          .payrollEligibilityEffectiveFrom &&
        employeeForm
          .payrollEligibilityEffectiveTo &&
        employeeForm
          .payrollEligibilityEffectiveTo <
          employeeForm
            .payrollEligibilityEffectiveFrom
      ) {
        alert(
          "Payroll eligibility end date cannot be earlier than its effective date."
        );
        return;
      }

      if (
        employeeForm
          .payrollEligibilityStatus ===
          "Eligible" &&
        !employeeForm.payrollEnabled
      ) {
        alert(
          "Payroll must be enabled before the employee can be marked Eligible."
        );
        return;
      }

      const payload = {
        fullName:
          employeeForm.fullName.trim(),
        firstName:
          employeeForm.firstName.trim(),
        lastName:
          employeeForm.lastName.trim(),
        gender: employeeForm.gender,
        dateOfBirth:
          employeeForm.dateOfBirth,
        trn: normalizedTrn,
        nisNumber:
          employeeForm.nisNumber.trim(),

        email:
          employeeForm.email.trim(),
        phone:
          employeeForm.phone.trim(),
        alternatePhone:
          employeeForm.alternatePhone.trim(),
        address:
          employeeForm.address.trim(),

        emergencyContactName:
          employeeForm
            .emergencyContactName.trim(),
        emergencyContactPhone:
          employeeForm
            .emergencyContactPhone.trim(),
        emergencyContactRelationship:
          employeeForm
            .emergencyContactRelationship.trim(),

        department:
          employeeForm.department,
        jobTitle:
          employeeForm.jobTitle.trim(),
        jobLevel: Number(
          employeeForm.jobLevel || 1
        ),
        isDepartmentHead: Boolean(
          employeeForm.isDepartmentHead
        ),
        reportsToEmployeeId:
          employeeForm.reportsToEmployeeId,
        branch: employeeForm.branch,

        employmentType:
          employeeForm.employmentType,
        employmentClassification:
          employeeForm
            .employmentClassification,
        contractType:
          employeeForm.contractType,
        employmentStatus:
          employeeForm.employmentStatus,
        startDate:
          employeeForm.startDate,
        endDate: employeeForm.endDate,

        probation: {
          applicable: Boolean(
            employeeForm.probation
              ?.applicable
          ),
          startDate:
            employeeForm.probation
              ?.startDate || "",
          endDate:
            employeeForm.probation
              ?.endDate || "",
          durationMonths: Number(
            employeeForm.probation
              ?.durationMonths || 0
          ),
          status:
            employeeForm.probation
              ?.status ||
            "Not Applicable",
          reviewDueDate:
            employeeForm.probation
              ?.reviewDueDate || "",
          completedDate:
            employeeForm.probation
              ?.completedDate || "",
          notes: String(
            employeeForm.probation?.notes ||
              ""
          ).trim(),
        },

        normalWorkingHours: {
          hoursPerDay,
          hoursPerWeek,
        },

        scheduledWorkdays,

        compensationType:
          employeeForm.compensationType,
        payFrequency:
          employeeForm.payFrequency,

        payrollEnabled: Boolean(
          employeeForm.payrollEnabled
        ),
        payrollEligibilityStatus:
          employeeForm
            .payrollEligibilityStatus,
        payrollEligibilityReason:
          employeeForm
            .payrollEligibilityReason.trim(),
        payrollEligibilityEffectiveFrom:
          employeeForm
            .payrollEligibilityEffectiveFrom,
        payrollEligibilityEffectiveTo:
          employeeForm
            .payrollEligibilityEffectiveTo,

        linkedUserId:
          employeeForm.linkedUserId,
        attendanceRequired: Boolean(
          employeeForm.attendanceRequired
        ),

        notes:
          employeeForm.notes.trim(),
      };

      /*
       * Existing compensation and leave values are never sent
       * through an ordinary employee update.
       */
      if (!isEditing) {
        payload.payType =
          employeeForm.payType ||
          "Monthly Salary";

        payload.payRate = Number(
          employeeForm.payRate || 0
        );

        payload.leaveBalanceVacation = 0;
        payload.leaveBalanceSick = 0;
        payload.leaveBalanceUnpaid = 0;
      }

      const response = isEditing
        ? await api.put(
            `/api/hr/${editingEmployeeId}`,
            payload
          )
        : await api.post(
            "/api/hr",
            payload
          );

      alert(
        response.data.message ||
          (isEditing
            ? "Employee updated successfully."
            : "Employee added successfully.")
      );

      resetEmployeeForm();
      await fetchHRData();
      setActiveTab("employees");
    } catch (error) {
      console.error(
        "Employee save error:",
        error
      );

      alert(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          (isEditing
            ? "Could not update the employee."
            : "Could not add the employee.")
      );
    }
  };

  const updateEmployeeStatus = async (employeeId, status) => {
    try {
      const res = await api.put(`/api/hr/${employeeId}/status`, {
        employmentStatus: status,
      });

      alert(res.data.message || "Status updated");
      await fetchHRData();
    } catch (error) {
      console.error(error);
      alert(error?.response?.data?.message || "Status update failed");
    }
  };

  const submitLeaveRequest = async () => {
  try {
    if (!leaveForm.leaveType || !leaveForm.startDate || !leaveForm.endDate) {
      alert("Leave type, start date, and end date are required.");
      return;
    }

    if (!isAdminHR && !myEmployee?.employeeId) {
      alert("Your account is not linked to an HR employee record.");
      return;
    }

    if (isAdminHR && !leaveForm.employeeId) {
      alert("Please select an employee.");
      return;
    }

    const payload = isAdminHR
      ? {
          employeeId: leaveForm.employeeId,
          leaveType: leaveForm.leaveType,
          startDate: leaveForm.startDate,
          endDate: leaveForm.endDate,
          reason: leaveForm.reason,
        }
      : {
          leaveType: leaveForm.leaveType,
          startDate: leaveForm.startDate,
          endDate: leaveForm.endDate,
          reason: leaveForm.reason,
        };

    const res = await api.post("/api/leave-requests", payload);

    alert(res.data.message || "Leave request submitted");

    setLeaveForm({
      ...emptyLeaveForm,
      employeeId: isAdminHR ? "" : myEmployee?.employeeId || "",
    });

    await fetchHRData();
  } catch (error) {
    console.error(error);
    alert(error?.response?.data?.message || "Failed to submit leave request");
  }
};

  const approveLeaveRequest = async (leaveRequestId) => {
    try {
      const res = await api.put(`/api/leave-requests/${leaveRequestId}/approve`, {
        adminComment: leaveAdminComment,
      });

      alert(res.data.message || "Leave request approved");
      setLeaveAdminComment("");
      await fetchHRData();
    } catch (error) {
      console.error(error);
      alert(error?.response?.data?.message || "Failed to approve leave request");
    }
  };

  const rejectLeaveRequest = async (leaveRequestId) => {
    try {
      const res = await api.put(`/api/leave-requests/${leaveRequestId}/reject`, {
        adminComment: leaveAdminComment,
      });

      alert(res.data.message || "Leave request rejected");
      setLeaveAdminComment("");
      await fetchHRData();
    } catch (error) {
      console.error(error);
      alert(error?.response?.data?.message || "Failed to reject leave request");
    }
  };

  const fetchEmployeeDocuments = async (employeeIdToLoad) => {
  try {
    if (!employeeIdToLoad) {
      setEmployeeDocuments([]);
      return;
    }

    setDocumentsLoading(true);
    const res = await api.get(`/api/documents/${employeeIdToLoad}`);
    setEmployeeDocuments(res.data.data || []);
  } catch (error) {
    console.error(error);
    alert(error?.response?.data?.message || "Failed to load documents");
    setEmployeeDocuments([]);
  } finally {
    setDocumentsLoading(false);
  }
};

const uploadEmployeeDocument = async () => {
  try {
    const employeeIdToUse = isAdminHR
      ? documentEmployeeId
      : myEmployee?.employeeId || "";

    if (!employeeIdToUse) {
      alert("Please select an employee.");
      return;
    }

    if (!documentForm.file) {
      alert("Please choose a file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("file", documentForm.file);
    formData.append("documentType", documentForm.documentType);
    formData.append("documentName", documentForm.documentName);

    const res = await api.post(`/api/documents/upload/${employeeIdToUse}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    alert(res.data.message || "Document uploaded successfully");

    setDocumentForm({
      employeeId: "",
      documentType: "Contract",
      documentName: "",
      file: null,
    });

    await fetchEmployeeDocuments(employeeIdToUse);
    await fetchHRData();
  } catch (error) {
    console.error(error);
    alert(error?.response?.data?.message || "Failed to upload document");
  }
};

const deleteEmployeeDocument = async (index) => {
  try {
    const employeeIdToUse = isAdminHR
      ? documentEmployeeId
      : myEmployee?.employeeId || "";

    if (!employeeIdToUse) {
      alert("No employee selected.");
      return;
    }

    const res = await api.delete(`/api/documents/${employeeIdToUse}/${index}`);

    alert(res.data.message || "Document deleted successfully");
    await fetchEmployeeDocuments(employeeIdToUse);
    await fetchHRData();
  } catch (error) {
    console.error(error);
    alert(error?.response?.data?.message || "Failed to delete document");
  }
};

  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      const matchesSearch =
        employee.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.department?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "All" || employee.employmentStatus === statusFilter;

      const matchesDepartment =
        departmentFilter === "All" || employee.department === departmentFilter;

      return matchesSearch && matchesStatus && matchesDepartment;
    });
  }, [employees, searchTerm, statusFilter, departmentFilter]);

  const leaveStatusBadge = (status) => {
    const backgroundColor =
      status === "Approved"
        ? "#16a34a"
        : status === "Rejected"
        ? "#dc2626"
        : status === "Pending"
        ? "#f59e0b"
        : "#64748b";

    return (
      <span
        style={{
          backgroundColor,
          color: WHITE,
          padding: "4px 10px",
          borderRadius: "999px",
          fontWeight: "bold",
          fontSize: "12px",
        }}
      >
        {status}
      </span>
    );
  };
  const downloadPayslipPdf = async (payslip) => {
  try {
    const { jsPDF } = await import("jspdf");
    const { autoTable } = await import("jspdf-autotable");

    const doc = new jsPDF("p", "mm", "a4");

    doc.setFontSize(18);
    doc.text("Eltham Konnect", 14, 16);

    doc.setFontSize(12);
    doc.text("Employee Payslip", 14, 24);

    doc.setFontSize(10);
    doc.text(`Payroll Number: ${payslip.payrollNumber || "-"}`, 14, 31);
    doc.text(`Pay Period: ${payslip.payPeriod || "-"}`, 14, 36);

    autoTable(doc, {
      startY: 42,
      head: [["Employee Details", "Value"]],
      body: [
        ["Employee ID", payslip.employeeId || myEmployee?.employeeId || "-"],
        ["Employee Name", payslip.employeeName || myEmployee?.fullName || "-"],
        ["Role", payslip.role || myEmployee?.jobTitle || "-"],
      ],
      styles: { fontSize: 10 },
      headStyles: { fillColor: [11, 61, 145] },
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 8,
      head: [["Earnings & Deductions", "Amount"]],
      body: [
        ["Gross Pay", `JMD ${Number(payslip.grossPay || 0).toLocaleString()}`],
        ["NIS", `JMD ${Number(payslip.nisEmployee || 0).toLocaleString()}`],
        ["NHT", `JMD ${Number(payslip.nhtEmployee || 0).toLocaleString()}`],
        ["Education Tax", `JMD ${Number(payslip.educationTax || 0).toLocaleString()}`],
        ["Income Tax", `JMD ${Number(payslip.incomeTax || 0).toLocaleString()}`],
        ["Pension", `JMD ${Number(payslip.pensionEmployee || 0).toLocaleString()}`],
        [
          "Total Deductions",
          `JMD ${Number(
            payslip.totalDeductions !== undefined
              ? payslip.totalDeductions
              : payslip.deductions || 0
          ).toLocaleString()}`,
        ],
        ["Net Pay", `JMD ${Number(payslip.netPay || 0).toLocaleString()}`],
      ],
      styles: { fontSize: 10 },
      headStyles: { fillColor: [22, 163, 74] },
    });

    const safeName = String(payslip.employeeName || "employee").replace(/\s+/g, "-");
    const safePeriod = String(payslip.payPeriod || "period").replace(/\s+/g, "-");

    doc.save(`payslip-${safeName}-${safePeriod}.pdf`);
  } catch (error) {
    console.error("Error generating payslip PDF:", error);
    alert("Could not download payslip.");
  }
};

const OrgChartNode = ({ node, level, ROYAL_BLUE, BORDER, MUTED }) => {
  return (
    <div
      style={{
        marginLeft: level === 0 ? 0 : "24px",
        borderLeft: level === 0 ? "none" : `3px solid ${BORDER}`,
        paddingLeft: level === 0 ? 0 : "14px",
      }}
    >
      <div
        style={{
          backgroundColor: level === 0 ? "#eef4ff" : "#ffffff",
          border: `1px solid ${BORDER}`,
          borderRadius: "12px",
          padding: "14px",
          marginBottom: "10px",
        }}
      >
        <div style={{ fontWeight: "bold", color: ROYAL_BLUE, fontSize: "16px" }}>
          {node.fullName}
        </div>
        <div style={{ color: "#0f172a", marginTop: "4px", fontWeight: "bold" }}>
          {node.jobTitle || "-"}
        </div>
        <div style={{ color: MUTED, fontSize: "13px", marginTop: "4px" }}>
          {node.employeeId} • Level {node.jobLevel || 1} • {node.department || "-"}
        </div>
        <div style={{ color: MUTED, fontSize: "13px", marginTop: "4px" }}>
          {node.branch || "-"} • {node.employmentStatus || "-"}
        </div>
        {node.isDepartmentHead ? (
          <div style={{ color: "#7c3aed", fontSize: "12px", fontWeight: "bold", marginTop: "6px" }}>
            Department Head
          </div>
        ) : null}
      </div>

      {node.children?.length > 0 &&
        node.children.map((child) => (
          <OrgChartNode
            key={child.employeeId}
            node={child}
            level={level + 1}
            ROYAL_BLUE={ROYAL_BLUE}
            BORDER={BORDER}
            MUTED={MUTED}
          />
        ))}
    </div>
  );
};

  const renderField = (label, value) => (
    <div>
      <div style={{ color: MUTED, fontSize: "13px", marginBottom: "4px" }}>{label}</div>
      <div style={{ color: "#0f172a", fontWeight: "bold" }}>{value || "-"}</div>
    </div>
  );

  const showEmployeesTab = isAdminHR;
const showEmployeeFormTab = isAdminHR;
const showOrgChartTab = isAdminHR;
const showCompensationTab = isAdminHR;
const showAttendanceTab = isAdminHR;
const showLeaveRequestsTab = isAdminHR;

const showEmployeeRelationsTab =
  isAdminHR ||
  permissions.includes(
    "hrSelfService"
  );

const showDisciplineTab =
  isAdminHR ||
  permissions.includes(
    "hrSelfService"
  );

const showPerformanceTab =
  isAdminHR ||
  permissions.includes(
    "hrSelfService"
  );
  const showEmployeeLifecycleTab =
  isAdminHR;
const showAnalyticsTab = isAdminHR;
const showDocumentsTab =
  permissions.includes("documentSelfService") ||
  permissions.includes("hrSelfService") ||
  isAdminHR;
const showMyLeaveTab =
  permissions.includes("leaveSelfService") ||
  permissions.includes("hrSelfService") ||
  isAdminHR;
const showMyPayslipsTab =
  permissions.includes("payslipSelfService") ||
  permissions.includes("hrSelfService") ||
  isAdminHR;
const showMyProfileTab = canSelfServiceHR && !isAdminHR;

  return (
    <div style={{ backgroundColor: LIGHT_BG, minHeight: "100vh", padding: "20px" }}>
      <h1 style={{ color: ROYAL_BLUE, marginTop: 0 }}>
        {isAdminHR ? "HR Module" : "My HR"}
      </h1>

      <div style={{ color: MUTED, marginBottom: "18px" }}>
        {isAdminHR
          ? "Manage employees, leave balances, employment records, and linked system users."
          : "View your HR profile and manage your leave requests."}
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
        {showEmployeesTab && (
          <button style={tabButtonStyle("employees")} onClick={() => setActiveTab("employees")}>
            Employees
          </button>
        )}

        {showOrgChartTab && (
  <button
    style={tabButtonStyle("orgChart")}
    onClick={() => setActiveTab("orgChart")}
  >
    Organization Chart
  </button>
)}

        {showCompensationTab && (
          <button
            style={tabButtonStyle("compensation")}
            onClick={() => setActiveTab("compensation")}
          >
            Compensation
          </button>
        )}

        {showAttendanceTab && (
  <button
    style={tabButtonStyle("attendance")}
    onClick={() => setActiveTab("attendance")}
  >
    Attendance
  </button>
)}

        {showEmployeeFormTab && (
          <button
            style={tabButtonStyle("employeeForm")}
            onClick={() => {
              resetEmployeeForm();
              setActiveTab("employeeForm");
            }}
          >
            {isEditing ? "Edit Employee" : "Add Employee"}
          </button>
        )}

        {showLeaveRequestsTab && (
          <button
            style={tabButtonStyle("leaveRequests")}
            onClick={() => setActiveTab("leaveRequests")}
          >
            Leave Requests
          </button>
        )}

                {showDocumentsTab && (
          <button
            style={tabButtonStyle(
              "documents"
            )}
            onClick={() => {
              setActiveTab(
                "documents"
              );

              if (
                isAdminHR &&
                employees.length > 0 &&
                !documentEmployeeId
              ) {
                setDocumentEmployeeId(
                  employees[0]
                    .employeeId
                );
              }
            }}
          >
            Documents
          </button>
        )}

        {showEmployeeRelationsTab && (
          <button
            style={tabButtonStyle(
              "employeeRelations"
            )}
            onClick={() =>
              setActiveTab(
                "employeeRelations"
              )
            }
          >
            Employee Relations
          </button>
        )}

        {showMyProfileTab && (
          <button style={tabButtonStyle("myProfile")} onClick={() => setActiveTab("myProfile")}>
            My Profile
          </button>
        )}

        {showMyLeaveTab && (
          <button style={tabButtonStyle("myLeave")} onClick={() => setActiveTab("myLeave")}>
            My Leave
          </button>
        )}
      </div>

      {showDisciplineTab && (
  <button
    style={tabButtonStyle("discipline")}
    onClick={() => {
      setActiveTab("discipline");
      if (isAdminHR && employees.length > 0 && !disciplineEmployeeId) {
        setDisciplineEmployeeId(employees[0].employeeId);
      }
    }}
  >
    Discipline
  </button>
)}

{showPerformanceTab && (
  <button
    style={tabButtonStyle(
      "performance"
    )}
    onClick={() =>
      setActiveTab(
        "performance"
      )
    }
  >
    Performance
  </button>
)}

{showEmployeeLifecycleTab && (
  <button
    style={tabButtonStyle(
      "employeeLifecycle"
    )}
    onClick={() =>
      setActiveTab(
        "employeeLifecycle"
      )
    }
  >
    Onboarding & Offboarding
  </button>
)}

{showAnalyticsTab && (
  <button
    style={tabButtonStyle("analytics")}
    onClick={() => {
      setActiveTab("analytics");
      fetchHRAnalytics();
    }}
  >
    HR Analytics
  </button>
)}
      
      {showMyPayslipsTab && !isAdminHR && (
  <button
    style={tabButtonStyle("myPayslips")}
    onClick={() => setActiveTab("myPayslips")}
  >
    My Payslips
  </button>
)}

      {loading && (
        <div style={{ ...cardStyle, marginBottom: "20px", color: MUTED }}>
          Loading HR data...
        </div>
      )}

      {activeTab === "employees" && showEmployeesTab && (
        <div style={{ display: "grid", gap: "20px" }}>
          <div style={cardStyle}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "14px",
                marginBottom: "20px",
              }}
            >
              <div style={statCardStyle("#eef4ff")}>
                <div style={{ fontSize: "28px", fontWeight: "bold", color: ROYAL_BLUE }}>
                  {summary?.totalEmployees || 0}
                </div>
                <div style={{ color: MUTED }}>Total Employees</div>
              </div>

              <div style={statCardStyle("#f0fdf4")}>
                <div style={{ fontSize: "28px", fontWeight: "bold", color: "#16a34a" }}>
                  {summary?.activeEmployees || 0}
                </div>
                <div style={{ color: MUTED }}>Active</div>
              </div>

              <div style={statCardStyle("#fffbeb")}>
                <div style={{ fontSize: "28px", fontWeight: "bold", color: "#f59e0b" }}>
                  {summary?.onLeaveEmployees || 0}
                </div>
                <div style={{ color: MUTED }}>On Leave</div>
              </div>

              <div style={statCardStyle("#fef2f2")}>
                <div style={{ fontSize: "28px", fontWeight: "bold", color: "#dc2626" }}>
                  {summary?.terminatedEmployees || 0}
                </div>
                <div style={{ color: MUTED }}>Terminated</div>
              </div>

              <div style={statCardStyle("#f8fafc")}>
                <div style={{ fontSize: "28px", fontWeight: "bold", color: "#475569" }}>
                  {summary?.payrollEnabledEmployees || 0}
                </div>
                <div style={{ color: MUTED }}>Payroll Enabled</div>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "12px",
                marginBottom: "15px",
              }}
            >
              <input
                placeholder="Search by name, ID, job title, or department"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={inputStyle}
              />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={inputStyle}
              >
                <option value="All">All Statuses</option>
                {EMPLOYMENT_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>

              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                style={inputStyle}
              >
                <option value="All">All Departments</option>
                {DEPARTMENT_OPTIONS.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table width="100%" cellPadding="10" style={{ borderCollapse: "collapse" }}>
                <thead style={{ backgroundColor: "#eef4ff" }}>
                  <tr>
  <th align="left">Employee</th>
  <th align="left">Job</th>
  <th align="left">Level</th>
  <th align="left">Department</th>
  <th align="left">Reports To</th>
  <th align="left">Branch</th>
  <th align="left">Pay</th>
  <th align="left">Linked User</th>
  <th align="left">Status</th>
  <th align="left">Action</th>
</tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((employee) => (
                    <tr key={employee.employeeId} style={{ borderBottom: `1px solid ${BORDER}` }}>
                      <td>
                        <div style={{ fontWeight: "bold", color: "#0f172a" }}>
                          {employee.fullName}
                        </div>
                        <div style={{ color: MUTED, fontSize: "12px" }}>
                          {employee.employeeId}
                        </div>
                      </td>
                      <td>
  <div>{employee.jobTitle || "-"}</div>
  {employee.isDepartmentHead ? (
    <div style={{ color: "#7c3aed", fontSize: "12px", fontWeight: "bold" }}>
      Department Head
    </div>
  ) : null}
</td>
<td>{employee.jobLevel || 1}</td>
<td>{employee.department || "-"}</td>
<td>{employee.reportsToName || "-"}</td>
<td>{employee.branch || "-"}</td>
                      <td>
                        {employee.payType || "-"}
                        <div style={{ color: MUTED, fontSize: "12px" }}>
                          JMD {Number(employee.payRate || 0).toLocaleString()}
                        </div>
                      </td>
                      <td>
                        {employee.linkedUserName ? (
                          <>
                            <div>{employee.linkedUserName}</div>
                            <div style={{ color: MUTED, fontSize: "12px" }}>
                              {employee.linkedUserRole || ""}
                            </div>
                          </>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td>{employee.employmentStatus}</td>
                      <td>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          <button style={primaryButton} onClick={() => loadEmployeeForEdit(employee)}>
                            Edit
                          </button>

                          <button
                            style={successButton}
                            onClick={() => updateEmployeeStatus(employee.employeeId, "Active")}
                          >
                            Active
                          </button>

                          <button
                            style={warningButton}
                            onClick={() => updateEmployeeStatus(employee.employeeId, "On Leave")}
                          >
                            Leave
                          </button>

                          <button
                            style={secondaryButton}
                            onClick={() => updateEmployeeStatus(employee.employeeId, "Inactive")}
                          >
                            Inactive
                          </button>

                          <button
                            style={dangerButton}
                            onClick={() => updateEmployeeStatus(employee.employeeId, "Terminated")}
                          >
                            Terminate
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredEmployees.length === 0 && (
                    <tr>
                      <td colSpan="10" style={{ textAlign: "center", padding: "20px", color: MUTED }}>
                        No employees found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

            {activeTab === "compensation" &&
        showCompensationTab && (
          <CompensationHistoryPanel
            employees={employees}
          />
        )}

        {activeTab === "attendance" &&
  showAttendanceTab && (
    <AttendancePeriodsPanel
      employees={employees}
    />
  )}

      {activeTab === "orgChart" && showOrgChartTab && (
  <div style={{ display: "grid", gap: "20px" }}>
    <div style={cardStyle}>
      <h2 style={{ color: ROYAL_BLUE, marginTop: 0 }}>Organization Chart</h2>
      <div style={{ color: MUTED, marginBottom: "16px" }}>
        This shows the reporting hierarchy for Eltham Konnect.
      </div>

      {organizationChart.length === 0 ? (
        <div style={{ color: MUTED, fontWeight: "bold" }}>
          No organization chart data found.
        </div>
      ) : (
        <div style={{ display: "grid", gap: "12px" }}>
          {organizationChart.map((node) => (
            <OrgChartNode
              key={node.employeeId}
              node={node}
              level={0}
              ROYAL_BLUE={ROYAL_BLUE}
              BORDER={BORDER}
              MUTED={MUTED}
            />
          ))}
        </div>
      )}
    </div>
  </div>
)}

            {activeTab === "employeeForm" &&
        showEmployeeFormTab && (
          <div
            style={{
              display: "grid",
              gap: "20px",
            }}
          >
            <div style={cardStyle}>
              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems: "flex-start",
                  gap: "16px",
                  flexWrap: "wrap",
                  marginBottom: "18px",
                }}
              >
                <div>
                  <h2
                    style={{
                      color: ROYAL_BLUE,
                      margin: 0,
                    }}
                  >
                    {isEditing
                      ? "Edit Employee Master Record"
                      : "Add Employee Master Record"}
                  </h2>

                  <p
                    style={{
                      color: MUTED,
                      margin: "6px 0 0",
                    }}
                  >
                    Maintain identity,
                    employment, scheduling,
                    organizational and payroll
                    eligibility information.
                  </p>
                </div>

                <div
                  style={{
                    padding: "8px 12px",
                    borderRadius: "999px",
                    backgroundColor: isEditing
                      ? "#dbeafe"
                      : "#dcfce7",
                    color: isEditing
                      ? "#1d4ed8"
                      : "#166534",
                    fontWeight: "bold",
                    fontSize: "13px",
                  }}
                >
                  {isEditing
                    ? `Editing ${
                        editingEmployeeId ||
                        "employee"
                      }`
                    : "New employee"}
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gap: "16px",
                }}
              >
                <section
                  style={
                    employeeSectionStyle
                  }
                >
                  <h3
                    style={
                      employeeSectionHeaderStyle
                    }
                  >
                    1. Personal Identity
                  </h3>

                  <p
                    style={
                      employeeSectionDescriptionStyle
                    }
                  >
                    Legal identity and Jamaican
                    statutory identification.
                  </p>

                  <div
                    style={employeeGridStyle}
                  >
                    <div>
                      <label
                        style={labelStyle}
                      >
                        Full Name *
                      </label>
                      <input
                        name="fullName"
                        value={
                          employeeForm.fullName
                        }
                        onChange={
                          handleEmployeeChange
                        }
                        placeholder="Employee's full legal name"
                        style={inputStyle}
                      />
                    </div>

                    <div>
                      <label
                        style={labelStyle}
                      >
                        First Name
                      </label>
                      <input
                        name="firstName"
                        value={
                          employeeForm.firstName
                        }
                        onChange={
                          handleEmployeeChange
                        }
                        style={inputStyle}
                      />
                    </div>

                    <div>
                      <label
                        style={labelStyle}
                      >
                        Last Name
                      </label>
                      <input
                        name="lastName"
                        value={
                          employeeForm.lastName
                        }
                        onChange={
                          handleEmployeeChange
                        }
                        style={inputStyle}
                      />
                    </div>

                    <div>
                      <label
                        style={labelStyle}
                      >
                        Gender
                      </label>
                      <select
                        name="gender"
                        value={
                          employeeForm.gender
                        }
                        onChange={
                          handleEmployeeChange
                        }
                        style={inputStyle}
                      >
                        <option value="">
                          Select gender
                        </option>
                        <option value="Male">
                          Male
                        </option>
                        <option value="Female">
                          Female
                        </option>
                        <option value="Other">
                          Other
                        </option>
                      </select>
                    </div>

                    <div>
                      <label
                        style={labelStyle}
                      >
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={
                          employeeForm.dateOfBirth
                        }
                        onChange={
                          handleEmployeeChange
                        }
                        style={inputStyle}
                      />
                    </div>

                    <div>
                      <label
                        style={labelStyle}
                      >
                        TRN
                      </label>
                      <input
                        name="trn"
                        inputMode="numeric"
                        maxLength={11}
                        value={
                          employeeForm.trn
                        }
                        onChange={
                          handleEmployeeChange
                        }
                        placeholder="Nine-digit TRN"
                        style={inputStyle}
                      />
                      <small
                        style={{ color: MUTED }}
                      >
                        Enter the employee’s
                        nine-digit Jamaican TRN.
                      </small>
                    </div>

                    <div>
                      <label
                        style={labelStyle}
                      >
                        NIS Number
                      </label>
                      <input
                        name="nisNumber"
                        value={
                          employeeForm.nisNumber
                        }
                        onChange={
                          handleEmployeeChange
                        }
                        placeholder="Employee NIS number"
                        style={inputStyle}
                      />
                    </div>
                  </div>
                </section>

                <section
                  style={
                    employeeSectionStyle
                  }
                >
                  <h3
                    style={
                      employeeSectionHeaderStyle
                    }
                  >
                    2. Contact and Emergency
                    Contact
                  </h3>

                  <p
                    style={
                      employeeSectionDescriptionStyle
                    }
                  >
                    Current contact details and
                    the person to contact in an
                    emergency.
                  </p>

                  <div
                    style={employeeGridStyle}
                  >
                    <div>
                      <label
                        style={labelStyle}
                      >
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={
                          employeeForm.email
                        }
                        onChange={
                          handleEmployeeChange
                        }
                        style={inputStyle}
                      />
                    </div>

                    <div>
                      <label
                        style={labelStyle}
                      >
                        Phone
                      </label>
                      <input
                        name="phone"
                        value={
                          employeeForm.phone
                        }
                        onChange={
                          handleEmployeeChange
                        }
                        style={inputStyle}
                      />
                    </div>

                    <div>
                      <label
                        style={labelStyle}
                      >
                        Alternate Phone
                      </label>
                      <input
                        name="alternatePhone"
                        value={
                          employeeForm.alternatePhone
                        }
                        onChange={
                          handleEmployeeChange
                        }
                        style={inputStyle}
                      />
                    </div>

                    <div
                      style={{
                        gridColumn: "1 / -1",
                      }}
                    >
                      <label
                        style={labelStyle}
                      >
                        Address
                      </label>
                      <textarea
                        name="address"
                        value={
                          employeeForm.address
                        }
                        onChange={
                          handleEmployeeChange
                        }
                        style={{
                          ...inputStyle,
                          minHeight: "76px",
                        }}
                      />
                    </div>

                    <div>
                      <label
                        style={labelStyle}
                      >
                        Emergency Contact Name
                      </label>
                      <input
                        name="emergencyContactName"
                        value={
                          employeeForm
                            .emergencyContactName
                        }
                        onChange={
                          handleEmployeeChange
                        }
                        style={inputStyle}
                      />
                    </div>

                    <div>
                      <label
                        style={labelStyle}
                      >
                        Emergency Contact Phone
                      </label>
                      <input
                        name="emergencyContactPhone"
                        value={
                          employeeForm
                            .emergencyContactPhone
                        }
                        onChange={
                          handleEmployeeChange
                        }
                        style={inputStyle}
                      />
                    </div>

                    <div>
                      <label
                        style={labelStyle}
                      >
                        Relationship
                      </label>
                      <input
                        name="emergencyContactRelationship"
                        value={
                          employeeForm
                            .emergencyContactRelationship
                        }
                        onChange={
                          handleEmployeeChange
                        }
                        placeholder="For example: Parent"
                        style={inputStyle}
                      />
                    </div>
                  </div>
                </section>

                <section
                  style={
                    employeeSectionStyle
                  }
                >
                  <h3
                    style={
                      employeeSectionHeaderStyle
                    }
                  >
                    3. Organization and Role
                  </h3>

                  <p
                    style={
                      employeeSectionDescriptionStyle
                    }
                  >
                    Reporting line, department,
                    job level and work location.
                  </p>

                  <div
                    style={employeeGridStyle}
                  >
                    <div>
                      <label
                        style={labelStyle}
                      >
                        Job Title *
                      </label>
                      <input
                        name="jobTitle"
                        value={
                          employeeForm.jobTitle
                        }
                        onChange={
                          handleEmployeeChange
                        }
                        style={inputStyle}
                      />
                    </div>

                    <div>
                      <label
                        style={labelStyle}
                      >
                        Department
                      </label>
                      <select
                        name="department"
                        value={
                          employeeForm.department
                        }
                        onChange={
                          handleEmployeeChange
                        }
                        style={inputStyle}
                      >
                        {DEPARTMENT_OPTIONS.map(
                          (department) => (
                            <option
                              key={department}
                              value={department}
                            >
                              {department}
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    <div>
                      <label
                        style={labelStyle}
                      >
                        Branch
                      </label>
                      <select
                        name="branch"
                        value={
                          employeeForm.branch
                        }
                        onChange={
                          handleEmployeeChange
                        }
                        style={inputStyle}
                      >
                        {BRANCH_OPTIONS.map(
                          (branch) => (
                            <option
                              key={branch}
                              value={branch}
                            >
                              {branch}
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    <div>
                      <label
                        style={labelStyle}
                      >
                        Job Level
                      </label>
                      <select
                        name="jobLevel"
                        value={
                          employeeForm.jobLevel
                        }
                        onChange={
                          handleEmployeeChange
                        }
                        style={inputStyle}
                      >
                        {Array.from(
                          { length: 10 },
                          (_, index) =>
                            index + 1
                        ).map((level) => (
                          <option
                            key={level}
                            value={level}
                          >
                            Level {level}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        style={labelStyle}
                      >
                        Reports To
                      </label>
                      <select
                        name="reportsToEmployeeId"
                        value={
                          employeeForm
                            .reportsToEmployeeId
                        }
                        onChange={
                          handleEmployeeChange
                        }
                        style={inputStyle}
                      >
                        <option value="">
                          No reporting manager
                        </option>
                        {employees
                          .filter(
                            (employee) =>
                              employee.employeeId !==
                              editingEmployeeId
                          )
                          .map((employee) => (
                            <option
                              key={
                                employee.employeeId
                              }
                              value={
                                employee.employeeId
                              }
                            >
                              {employee.fullName} —{" "}
                              {employee.jobTitle}
                            </option>
                          ))}
                      </select>
                    </div>

                    <label
                      style={
                        employeeToggleStyle
                      }
                    >
                      <input
                        type="checkbox"
                        name="isDepartmentHead"
                        checked={
                          employeeForm
                            .isDepartmentHead
                        }
                        onChange={
                          handleEmployeeChange
                        }
                      />
                      <span>
                        <strong>
                          Department Head
                        </strong>
                        <br />
                        <small
                          style={{
                            color: MUTED,
                          }}
                        >
                          Employee leads the
                          selected department.
                        </small>
                      </span>
                    </label>
                  </div>
                </section>

                <section
                  style={
                    employeeSectionStyle
                  }
                >
                  <h3
                    style={
                      employeeSectionHeaderStyle
                    }
                  >
                    4. Employment and Contract
                  </h3>

                  <p
                    style={
                      employeeSectionDescriptionStyle
                    }
                  >
                    Employment classification,
                    contract basis and effective
                    dates.
                  </p>

                  <div
                    style={employeeGridStyle}
                  >
                    <div>
                      <label
                        style={labelStyle}
                      >
                        Legacy Employment Type
                      </label>
                      <select
                        name="employmentType"
                        value={
                          employeeForm
                            .employmentType
                        }
                        onChange={
                          handleEmployeeChange
                        }
                        style={inputStyle}
                      >
                        {EMPLOYMENT_TYPE_OPTIONS.map(
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
                      <label
                        style={labelStyle}
                      >
                        Employment Classification
                      </label>
                      <select
                        name="employmentClassification"
                        value={
                          employeeForm
                            .employmentClassification
                        }
                        onChange={
                          handleEmployeeChange
                        }
                        style={inputStyle}
                      >
                        {EMPLOYMENT_CLASSIFICATION_OPTIONS.map(
                          (classification) => (
                            <option
                              key={
                                classification ||
                                "unselected"
                              }
                              value={
                                classification
                              }
                            >
                              {classification ||
                                "Select classification"}
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    <div>
                      <label
                        style={labelStyle}
                      >
                        Contract Type
                      </label>
                      <select
                        name="contractType"
                        value={
                          employeeForm
                            .contractType
                        }
                        onChange={
                          handleEmployeeChange
                        }
                        style={inputStyle}
                      >
                        {CONTRACT_TYPE_OPTIONS.map(
                          (contractType) => (
                            <option
                              key={
                                contractType ||
                                "unselected"
                              }
                              value={
                                contractType
                              }
                            >
                              {contractType ||
                                "Select contract type"}
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    <div>
                      <label
                        style={labelStyle}
                      >
                        Employment Status
                      </label>
                      <select
                        name="employmentStatus"
                        value={
                          employeeForm
                            .employmentStatus
                        }
                        onChange={
                          handleEmployeeChange
                        }
                        style={inputStyle}
                      >
                        {EMPLOYMENT_STATUS_OPTIONS.map(
                          (status) => (
                            <option
                              key={status}
                              value={status}
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
                        Start Date
                      </label>
                      <input
                        type="date"
                        name="startDate"
                        value={
                          employeeForm.startDate
                        }
                        onChange={
                          handleEmployeeChange
                        }
                        style={inputStyle}
                      />
                    </div>

                    <div>
                      <label
                        style={labelStyle}
                      >
                        End Date
                      </label>
                      <input
                        type="date"
                        name="endDate"
                        value={
                          employeeForm.endDate
                        }
                        onChange={
                          handleEmployeeChange
                        }
                        style={inputStyle}
                      />
                    </div>
                  </div>
                </section>

                <section
                  style={
                    employeeSectionStyle
                  }
                >
                  <h3
                    style={
                      employeeSectionHeaderStyle
                    }
                  >
                    5. Probation
                  </h3>

                  <p
                    style={
                      employeeSectionDescriptionStyle
                    }
                  >
                    Track an applicable probation
                    period and its review status.
                  </p>

                  <label
                    style={{
                      ...employeeToggleStyle,
                      marginBottom: "14px",
                    }}
                  >
                    <input
                      type="checkbox"
                      name="applicable"
                      checked={
                        employeeForm.probation
                          .applicable
                      }
                      onChange={
                        handleProbationChange
                      }
                    />
                    <span>
                      <strong>
                        Probation applies
                      </strong>
                      <br />
                      <small
                        style={{ color: MUTED }}
                      >
                        Enable probation dates and
                        review tracking.
                      </small>
                    </span>
                  </label>

                  {employeeForm.probation
                    .applicable && (
                    <div
                      style={employeeGridStyle}
                    >
                      <div>
                        <label
                          style={labelStyle}
                        >
                          Probation Start
                        </label>
                        <input
                          type="date"
                          name="startDate"
                          value={
                            employeeForm
                              .probation.startDate
                          }
                          onChange={
                            handleProbationChange
                          }
                          style={inputStyle}
                        />
                      </div>

                      <div>
                        <label
                          style={labelStyle}
                        >
                          Probation End
                        </label>
                        <input
                          type="date"
                          name="endDate"
                          value={
                            employeeForm
                              .probation.endDate
                          }
                          onChange={
                            handleProbationChange
                          }
                          style={inputStyle}
                        />
                      </div>

                      <div>
                        <label
                          style={labelStyle}
                        >
                          Duration in Months
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="24"
                          name="durationMonths"
                          value={
                            employeeForm
                              .probation
                              .durationMonths
                          }
                          onChange={
                            handleProbationChange
                          }
                          style={inputStyle}
                        />
                      </div>

                      <div>
                        <label
                          style={labelStyle}
                        >
                          Status
                        </label>
                        <select
                          name="status"
                          value={
                            employeeForm
                              .probation.status
                          }
                          onChange={
                            handleProbationChange
                          }
                          style={inputStyle}
                        >
                          {PROBATION_STATUS_OPTIONS.filter(
                            (status) =>
                              status !==
                              "Not Applicable"
                          ).map((status) => (
                            <option
                              key={status}
                              value={status}
                            >
                              {status}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label
                          style={labelStyle}
                        >
                          Review Due Date
                        </label>
                        <input
                          type="date"
                          name="reviewDueDate"
                          value={
                            employeeForm
                              .probation
                              .reviewDueDate
                          }
                          onChange={
                            handleProbationChange
                          }
                          style={inputStyle}
                        />
                      </div>

                      <div>
                        <label
                          style={labelStyle}
                        >
                          Completed Date
                        </label>
                        <input
                          type="date"
                          name="completedDate"
                          value={
                            employeeForm
                              .probation
                              .completedDate
                          }
                          onChange={
                            handleProbationChange
                          }
                          style={inputStyle}
                        />
                      </div>

                      <div
                        style={{
                          gridColumn: "1 / -1",
                        }}
                      >
                        <label
                          style={labelStyle}
                        >
                          Probation Notes
                        </label>
                        <textarea
                          name="notes"
                          value={
                            employeeForm
                              .probation.notes
                          }
                          onChange={
                            handleProbationChange
                          }
                          style={{
                            ...inputStyle,
                            minHeight: "70px",
                          }}
                        />
                      </div>
                    </div>
                  )}
                </section>

                <section
                  style={
                    employeeSectionStyle
                  }
                >
                  <h3
                    style={
                      employeeSectionHeaderStyle
                    }
                  >
                    6. Work Schedule
                  </h3>

                  <p
                    style={
                      employeeSectionDescriptionStyle
                    }
                  >
                    Normal working hours and
                    scheduled workdays. H3 will
                    compare this schedule with
                    actual attendance.
                  </p>

                  <div
                    style={{
                      ...employeeGridStyle,
                      marginBottom: "14px",
                    }}
                  >
                    <div>
                      <label
                        style={labelStyle}
                      >
                        Normal Hours per Day
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="24"
                        step="0.5"
                        name="hoursPerDay"
                        value={
                          employeeForm
                            .normalWorkingHours
                            .hoursPerDay
                        }
                        onChange={
                          handleWorkingHoursChange
                        }
                        style={inputStyle}
                      />
                    </div>

                    <div>
                      <label
                        style={labelStyle}
                      >
                        Normal Hours per Week
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="168"
                        step="0.5"
                        name="hoursPerWeek"
                        value={
                          employeeForm
                            .normalWorkingHours
                            .hoursPerWeek
                        }
                        onChange={
                          handleWorkingHoursChange
                        }
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <label style={labelStyle}>
                    Scheduled Workdays
                  </label>

                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      flexWrap: "wrap",
                    }}
                  >
                    {WORKDAY_OPTIONS.map(
                      (workday) => {
                        const selected =
                          employeeForm.scheduledWorkdays.includes(
                            workday
                          );

                        return (
                          <button
                            key={workday}
                            type="button"
                            onClick={() =>
                              toggleScheduledWorkday(
                                workday
                              )
                            }
                            style={{
                              border: selected
                                ? `1px solid ${ROYAL_BLUE}`
                                : `1px solid ${BORDER}`,
                              backgroundColor:
                                selected
                                  ? ROYAL_BLUE
                                  : WHITE,
                              color: selected
                                ? WHITE
                                : "#334155",
                              padding:
                                "9px 12px",
                              borderRadius:
                                "999px",
                              cursor: "pointer",
                              fontWeight: "bold",
                            }}
                          >
                            {workday}
                          </button>
                        );
                      }
                    )}
                  </div>

                  <label
                    style={{
                      ...employeeToggleStyle,
                      marginTop: "14px",
                    }}
                  >
                    <input
                      type="checkbox"
                      name="attendanceRequired"
                      checked={
                        employeeForm
                          .attendanceRequired
                      }
                      onChange={
                        handleEmployeeChange
                      }
                    />
                    <span>
                      <strong>
                        Attendance Required
                      </strong>
                      <br />
                      <small
                        style={{ color: MUTED }}
                      >
                        Include the employee in
                        controlled attendance
                        periods.
                      </small>
                    </span>
                  </label>
                </section>

                <section
                  style={
                    employeeSectionStyle
                  }
                >
                  <h3
                    style={
                      employeeSectionHeaderStyle
                    }
                  >
                    7. Compensation
                    Classification
                  </h3>

                  <p
                    style={
                      employeeSectionDescriptionStyle
                    }
                  >
                    Classification only. H2 will
                    manage effective-dated pay
                    rates without overwriting
                    history.
                  </p>

                  <div
                    style={employeeGridStyle}
                  >
                    <div>
                      <label
                        style={labelStyle}
                      >
                        Compensation Type
                      </label>
                      <select
                        name="compensationType"
                        value={
                          employeeForm
                            .compensationType
                        }
                        onChange={
                          handleEmployeeChange
                        }
                        style={inputStyle}
                      >
                        {COMPENSATION_TYPE_OPTIONS.map(
                          (type) => (
                            <option
                              key={
                                type ||
                                "unselected"
                              }
                              value={type}
                            >
                              {type ||
                                "Select compensation type"}
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    <div>
                      <label
                        style={labelStyle}
                      >
                        Pay Frequency
                      </label>
                      <select
                        name="payFrequency"
                        value={
                          employeeForm
                            .payFrequency
                        }
                        onChange={
                          handleEmployeeChange
                        }
                        style={inputStyle}
                      >
                        {PAY_FREQUENCY_OPTIONS.map(
                          (frequency) => (
                            <option
                              key={
                                frequency ||
                                "unselected"
                              }
                              value={frequency}
                            >
                              {frequency ||
                                "Select pay frequency"}
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    {isEditing && (
                      <div
                        style={{
                          ...protectedValueStyle,
                          gridColumn:
                            "1 / -1",
                        }}
                      >
                        <strong>
                          Protected legacy pay
                          snapshot
                        </strong>
                        <div
                          style={{
                            marginTop: "6px",
                            color: MUTED,
                          }}
                        >
                          {employeeForm.payType}:{" "}
                          JMD{" "}
                          {Number(
                            employeeForm.payRate ||
                              0
                          ).toLocaleString()}
                        </div>
                        <small
                          style={{
                            color: "#92400e",
                          }}
                        >
                          This rate cannot be
                          changed here. H2 will
                          provide effective-dated
                          compensation history.
                        </small>
                      </div>
                    )}
                  </div>
                </section>

                <section
                  style={
                    employeeSectionStyle
                  }
                >
                  <h3
                    style={
                      employeeSectionHeaderStyle
                    }
                  >
                    8. Payroll Eligibility and
                    System Access
                  </h3>

                  <p
                    style={
                      employeeSectionDescriptionStyle
                    }
                  >
                    Control whether the employee
                    may enter payroll and whether
                    a system account is linked.
                  </p>

                  <div
                    style={employeeGridStyle}
                  >
                    <label
                      style={
                        employeeToggleStyle
                      }
                    >
                      <input
                        type="checkbox"
                        name="payrollEnabled"
                        checked={
                          employeeForm
                            .payrollEnabled
                        }
                        onChange={
                          handleEmployeeChange
                        }
                      />
                      <span>
                        <strong>
                          Payroll Enabled
                        </strong>
                        <br />
                        <small
                          style={{
                            color: MUTED,
                          }}
                        >
                          Allows payroll
                          processing after all
                          eligibility checks pass.
                        </small>
                      </span>
                    </label>

                    <div>
                      <label
                        style={labelStyle}
                      >
                        Eligibility Status
                      </label>
                      <select
                        name="payrollEligibilityStatus"
                        value={
                          employeeForm
                            .payrollEligibilityStatus
                        }
                        onChange={
                          handleEmployeeChange
                        }
                        style={inputStyle}
                      >
                        {PAYROLL_ELIGIBILITY_OPTIONS.map(
                          (status) => (
                            <option
                              key={status}
                              value={status}
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
                        Eligibility Effective From
                      </label>
                      <input
                        type="date"
                        name="payrollEligibilityEffectiveFrom"
                        value={
                          employeeForm
                            .payrollEligibilityEffectiveFrom
                        }
                        onChange={
                          handleEmployeeChange
                        }
                        style={inputStyle}
                      />
                    </div>

                    <div>
                      <label
                        style={labelStyle}
                      >
                        Eligibility Effective To
                      </label>
                      <input
                        type="date"
                        name="payrollEligibilityEffectiveTo"
                        value={
                          employeeForm
                            .payrollEligibilityEffectiveTo
                        }
                        onChange={
                          handleEmployeeChange
                        }
                        style={inputStyle}
                      />
                    </div>

                    <div
                      style={{
                        gridColumn: "1 / -1",
                      }}
                    >
                      <label
                        style={labelStyle}
                      >
                        Eligibility Reason or
                        Review Notes
                      </label>
                      <textarea
                        name="payrollEligibilityReason"
                        value={
                          employeeForm
                            .payrollEligibilityReason
                        }
                        onChange={
                          handleEmployeeChange
                        }
                        style={{
                          ...inputStyle,
                          minHeight: "70px",
                        }}
                      />
                    </div>

                    <div>
                      <label
                        style={labelStyle}
                      >
                        Linked System User
                      </label>
                      <select
                        name="linkedUserId"
                        value={
                          employeeForm
                            .linkedUserId
                        }
                        onChange={
                          handleEmployeeChange
                        }
                        style={inputStyle}
                      >
                        <option value="">
                          Not linked
                        </option>
                        {systemUsers.map(
                          (systemUser) => (
                            <option
                              key={
                                systemUser.userId
                              }
                              value={
                                systemUser.userId
                              }
                            >
                              {
                                systemUser.fullName
                              }{" "}
                              ({systemUser.role})
                            </option>
                          )
                        )}
                      </select>
                    </div>
                  </div>
                </section>

                {isEditing && (
                  <section
                    style={
                      employeeSectionStyle
                    }
                  >
                    <h3
                      style={
                        employeeSectionHeaderStyle
                      }
                    >
                      Protected Leave Balances
                    </h3>

                    <p
                      style={
                        employeeSectionDescriptionStyle
                      }
                    >
                      These balances cannot be
                      edited from the employee
                      master. H5 will manage
                      controlled adjustments.
                    </p>

                    <div
                      style={employeeGridStyle}
                    >
                      <div
                        style={
                          protectedValueStyle
                        }
                      >
                        <strong>
                          Vacation
                        </strong>
                        <div>
                          {Number(
                            employeeForm
                              .leaveBalanceVacation ||
                              0
                          )}{" "}
                          days
                        </div>
                      </div>

                      <div
                        style={
                          protectedValueStyle
                        }
                      >
                        <strong>Sick</strong>
                        <div>
                          {Number(
                            employeeForm
                              .leaveBalanceSick ||
                              0
                          )}{" "}
                          days
                        </div>
                      </div>

                      <div
                        style={
                          protectedValueStyle
                        }
                      >
                        <strong>Unpaid</strong>
                        <div>
                          {Number(
                            employeeForm
                              .leaveBalanceUnpaid ||
                              0
                          )}{" "}
                          days
                        </div>
                      </div>
                    </div>
                  </section>
                )}

                <section
                  style={
                    employeeSectionStyle
                  }
                >
                  <h3
                    style={
                      employeeSectionHeaderStyle
                    }
                  >
                    Administrative Notes
                  </h3>

                  <textarea
                    name="notes"
                    value={
                      employeeForm.notes
                    }
                    onChange={
                      handleEmployeeChange
                    }
                    placeholder="Internal employee-master notes"
                    style={{
                      ...inputStyle,
                      minHeight: "90px",
                    }}
                  />
                </section>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  marginTop: "18px",
                  flexWrap: "wrap",
                  position: "static",
                  padding: "12px",
                  border: `1px solid ${BORDER}`,
                  borderRadius: "12px",
                  backgroundColor:
                    "rgba(255,255,255,0.96)",
                  boxShadow:
                    "0 8px 24px rgba(15,23,42,0.12)",
                }}
              >
                <button
                  style={primaryButton}
                  onClick={saveEmployee}
                >
                  {isEditing
                    ? "Update Employee Master"
                    : "Save Employee Master"}
                </button>

                <button
                  style={neutralButton}
                  onClick={resetEmployeeForm}
                >
                  Reset Form
                </button>

                {isEditing && (
                  <button
                    style={secondaryButton}
                    onClick={() => {
                      resetEmployeeForm();
                      setActiveTab(
                        "employees"
                      );
                    }}
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

      {activeTab === "leaveRequests" &&
  showLeaveRequestsTab && (
    <LeaveManagementPanel
      employees={employees}
      leaveRequests={leaveRequests}
      isAdminHR={isAdminHR}
      myEmployee={myEmployee}
      refreshData={fetchHRData}
    />
  )}
            {activeTab ===
        "documents" &&
        showDocumentsTab && (
          <ControlledDocumentsPanel
            employees={
              employees
            }
            isAdminHR={
              isAdminHR
            }
          />
        )}

      {activeTab ===
        "employeeRelations" &&
        showEmployeeRelationsTab && (
          <EmployeeRelationsPanel
            employees={
              employees
            }
            isAdminHR={
              isAdminHR
            }
          />
        )}

{activeTab ===
  "performance" &&
  showPerformanceTab && (
    <PerformanceReviewsPanel
      employees={employees}
      isAdminHR={isAdminHR}
      currentUser={user}
    />
  )}

  {activeTab ===
  "employeeLifecycle" &&
  showEmployeeLifecycleTab && (
    <EmployeeLifecyclePanel
      employees={employees}
    />
  )}

{activeTab === "analytics" && showAnalyticsTab && (
  <div style={{ display: "grid", gap: "20px" }}>
    <div style={cardStyle}>
      <h2 style={{ color: ROYAL_BLUE, marginTop: 0 }}>HR Analytics Dashboard</h2>

      {!analyticsSummary ? (
        <div style={{ color: MUTED, fontWeight: "bold" }}>No analytics data found.</div>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "14px",
              marginBottom: "20px",
            }}
          >
            <div style={statCardStyle("#eef4ff")}>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: ROYAL_BLUE }}>
                {analyticsSummary?.workforce?.totalEmployees || 0}
              </div>
              <div style={{ color: MUTED }}>Total Employees</div>
            </div>

            <div style={statCardStyle("#f0fdf4")}>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: "#16a34a" }}>
                {analyticsSummary?.workforce?.activeEmployees || 0}
              </div>
              <div style={{ color: MUTED }}>Active Employees</div>
            </div>

            <div style={statCardStyle("#fffbeb")}>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: "#f59e0b" }}>
                {analyticsSummary?.workforce?.onLeaveEmployees || 0}
              </div>
              <div style={{ color: MUTED }}>On Leave</div>
            </div>

            <div style={statCardStyle("#fef2f2")}>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: "#dc2626" }}>
                {analyticsSummary?.workforce?.terminatedEmployees || 0}
              </div>
              <div style={{ color: MUTED }}>Terminated</div>
            </div>

            <div style={statCardStyle("#f8fafc")}>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: "#475569" }}>
                {analyticsSummary?.workforce?.payrollEnabledEmployees || 0}
              </div>
              <div style={{ color: MUTED }}>Payroll Enabled</div>
            </div>

            <div style={statCardStyle("#eff6ff")}>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: ROYAL_BLUE }}>
                {analyticsSummary?.discipline?.totalDisciplineRecords || 0}
              </div>
              <div style={{ color: MUTED }}>Discipline Records</div>
            </div>

            <div style={statCardStyle("#f5f3ff")}>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: "#7c3aed" }}>
                {analyticsSummary?.performance?.totalPerformanceReviews || 0}
              </div>
              <div style={{ color: MUTED }}>Performance Reviews</div>
            </div>

            <div style={statCardStyle("#fff7ed")}>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: "#ea580c" }}>
                {analyticsSummary?.documents?.totalEmployeeDocuments || 0}
              </div>
              <div style={{ color: MUTED }}>Employee Documents</div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "20px",
            }}
          >
            <div style={cardStyle}>
              <h3 style={{ color: ROYAL_BLUE, marginTop: 0 }}>Leave Insights</h3>
              <div style={{ display: "grid", gap: "8px" }}>
                <div>Total Leave Requests: {analyticsSummary?.leave?.totalLeaveRequests || 0}</div>
                <div>Pending: {analyticsSummary?.leave?.pendingLeaveRequests || 0}</div>
                <div>Approved: {analyticsSummary?.leave?.approvedLeaveRequests || 0}</div>
                <div>Rejected: {analyticsSummary?.leave?.rejectedLeaveRequests || 0}</div>
              </div>
            </div>

            <div style={cardStyle}>
              <h3 style={{ color: ROYAL_BLUE, marginTop: 0 }}>Payroll Insights</h3>
              <div style={{ display: "grid", gap: "8px" }}>
                <div>
                  Total Payroll Records: {analyticsSummary?.payroll?.totalPayrollRecords || 0}
                </div>
                <div>
                  Total Gross Payroll: JMD{" "}
                  {Number(analyticsSummary?.payroll?.totalGrossPayroll || 0).toLocaleString()}
                </div>
                <div>
                  Total Net Payroll: JMD{" "}
                  {Number(analyticsSummary?.payroll?.totalNetPayroll || 0).toLocaleString()}
                </div>
                <div>
                  Average Net Pay: JMD{" "}
                  {Number(analyticsSummary?.payroll?.averageNetPay || 0).toLocaleString()}
                </div>
              </div>
            </div>

            <div style={cardStyle}>
              <h3 style={{ color: ROYAL_BLUE, marginTop: 0 }}>Attendance Insights</h3>
              <div style={{ display: "grid", gap: "8px" }}>
                <div>
                  Total Attendance Records: {analyticsSummary?.attendance?.totalAttendanceRecords || 0}
                </div>
                <div>
                  Total Worked Time: {analyticsSummary?.attendance?.totalWorkedLabel || "0h 0m"}
                </div>
                <div>
                  Total Lunch Time: {analyticsSummary?.attendance?.totalLunchLabel || "0h 0m"}
                </div>
                <div>
                  Average Worked Time: {analyticsSummary?.attendance?.averageWorkedLabel || "0h 0m"}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  </div>
)}

{activeTab === "discipline" && showDisciplineTab && (
  <div style={{ display: "grid", gap: "20px" }}>
    {isAdminHR ? (
      <div style={cardStyle}>
        <h2 style={{ color: ROYAL_BLUE, marginTop: 0 }}>Add Discipline Record</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "12px",
          }}
        >
          <div>
            <label style={labelStyle}>Employee</label>
            <select
              value={disciplineEmployeeId}
              onChange={(e) => setDisciplineEmployeeId(e.target.value)}
              style={inputStyle}
            >
              <option value="">Select Employee</option>
              {employees.map((employee) => (
                <option key={employee.employeeId} value={employee.employeeId}>
                  {employee.fullName} ({employee.employeeId})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Discipline Type</label>
            <select
              name="disciplineType"
              value={disciplineForm.disciplineType}
              onChange={handleDisciplineChange}
              style={inputStyle}
            >
              <option value="Verbal Warning">Verbal Warning</option>
              <option value="Written Warning">Written Warning</option>
              <option value="Incident Report">Incident Report</option>
              <option value="Suspension">Suspension</option>
              <option value="Final Warning">Final Warning</option>
              <option value="Termination Notice">Termination Notice</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>Subject</label>
            <input
              name="subject"
              value={disciplineForm.subject}
              onChange={handleDisciplineChange}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Incident Date</label>
            <input
              type="date"
              name="incidentDate"
              value={disciplineForm.incidentDate}
              onChange={handleDisciplineChange}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Issued Date</label>
            <input
              type="date"
              name="issuedDate"
              value={disciplineForm.issuedDate}
              onChange={handleDisciplineChange}
              style={inputStyle}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", paddingTop: "26px" }}>
            <input
              id="employeeAcknowledged"
              type="checkbox"
              name="employeeAcknowledged"
              checked={disciplineForm.employeeAcknowledged}
              onChange={handleDisciplineChange}
            />
            <label htmlFor="employeeAcknowledged" style={{ fontWeight: "bold", color: "#334155" }}>
              Employee Acknowledged
            </label>
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Details</label>
            <textarea
              name="details"
              value={disciplineForm.details}
              onChange={handleDisciplineChange}
              style={{ ...inputStyle, minHeight: "100px" }}
            />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Action Taken</label>
            <textarea
              name="actionTaken"
              value={disciplineForm.actionTaken}
              onChange={handleDisciplineChange}
              style={{ ...inputStyle, minHeight: "90px" }}
            />
          </div>
        </div>

        <div style={{ marginTop: "16px" }}>
          <button style={primaryButton} onClick={saveDisciplineRecord}>
            Save Discipline Record
          </button>
        </div>
      </div>
    ) : (
      <div style={cardStyle}>
        <h2 style={{ color: ROYAL_BLUE, marginTop: 0 }}>My Discipline Records</h2>

        <div style={{ overflowX: "auto" }}>
          <table width="100%" cellPadding="10" style={{ borderCollapse: "collapse" }}>
            <thead style={{ backgroundColor: "#eef4ff" }}>
              <tr>
                <th align="left">Type</th>
                <th align="left">Subject</th>
                <th align="left">Incident Date</th>
                <th align="left">Issued Date</th>
                <th align="left">Action Taken</th>
                <th align="left">Acknowledged</th>
              </tr>
            </thead>
            <tbody>
              {myDisciplineRecords.length > 0 ? (
                myDisciplineRecords.map((record, index) => (
                  <tr key={record.recordId || index} style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <td>{record.disciplineType || "-"}</td>
                    <td>{record.subject || "-"}</td>
                    <td>{record.incidentDate || "-"}</td>
                    <td>{record.issuedDate || "-"}</td>
                    <td>{record.actionTaken || "-"}</td>
                    <td>{record.employeeAcknowledged ? "Yes" : "No"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "20px", color: MUTED }}>
                    No discipline records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    )}
  </div>
)}

      {activeTab === "myProfile" && showMyProfileTab && (
        <div style={{ display: "grid", gap: "20px" }}>
          <div style={cardStyle}>
            <h2 style={{ color: ROYAL_BLUE, marginTop: 0 }}>My Profile</h2>

            {!myEmployee ? (
              <div style={{ color: "#dc2626", fontWeight: "bold" }}>
                Your account is not yet linked to an HR employee record. Please contact admin.
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "18px",
                }}
              >
                {renderField("Employee ID", myEmployee.employeeId)}
                {renderField("Full Name", myEmployee.fullName)}
                {renderField("Job Title", myEmployee.jobTitle)}
                {renderField("Department", myEmployee.department)}
                {renderField("Branch", myEmployee.branch)}
                {renderField("Employment Type", myEmployee.employmentType)}
                {renderField("Employment Status", myEmployee.employmentStatus)}
                {renderField("Email", myEmployee.email)}
                {renderField("Phone", myEmployee.phone)}
                {renderField("TRN", myEmployee.trn)}
                {renderField("NIS Number", myEmployee.nisNumber)}
                {renderField("Start Date", myEmployee.startDate)}
                                {renderField(
                  "Compensation Type",
                  myCompensation?.baseCompensation
                    ?.compensationType ||
                    "Not currently configured"
                )}

                {renderField(
                  "Current Compensation",
                  myCompensation?.baseCompensation
                    ? `JMD ${Number(
                        myCompensation.baseCompensation.amount || 0
                      ).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`
                    : "No active compensation"
                )}

                {renderField(
                  "Pay Frequency",
                  myCompensation?.baseCompensation
                    ?.payFrequency || "-"
                )}

                {renderField(
                  "Compensation Effective From",
                  myCompensation?.baseCompensation
                    ?.effectiveFrom || "-"
                )}
                {renderField(
                  "Vacation Leave Balance",
                  Number(myEmployee.leaveBalanceVacation || 0)
                )}
                {renderField(
                  "Sick Leave Balance",
                  Number(myEmployee.leaveBalanceSick || 0)
                )}
                {renderField(
                  "Unpaid Leave Balance",
                  Number(myEmployee.leaveBalanceUnpaid || 0)
                )}
                <div style={{ gridColumn: "1 / -1" }}>
                  {renderField("Notes", myEmployee.notes)}
                </div>
                <div style={{ gridColumn: "1 / -1", marginTop: "10px" }}>
  <div style={{ color: MUTED, fontSize: "13px", marginBottom: "8px" }}>
    Discipline Records
  </div>

  {myDisciplineRecords.length > 0 ? (
    <div style={{ overflowX: "auto" }}>
      <table width="100%" cellPadding="10" style={{ borderCollapse: "collapse" }}>
        <thead style={{ backgroundColor: "#eef4ff" }}>
          <tr>
            <th align="left">Type</th>
            <th align="left">Subject</th>
            <th align="left">Incident Date</th>
            <th align="left">Issued Date</th>
            <th align="left">Action Taken</th>
          </tr>
        </thead>
        <tbody>
          {myDisciplineRecords.map((record, index) => (
            <tr key={record.recordId || index} style={{ borderBottom: `1px solid ${BORDER}` }}>
              <td>{record.disciplineType || "-"}</td>
              <td>{record.subject || "-"}</td>
              <td>{record.incidentDate || "-"}</td>
              <td>{record.issuedDate || "-"}</td>
              <td>{record.actionTaken || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <div style={{ color: MUTED, fontWeight: "bold" }}>No discipline records found.</div>
  )}
</div>
              </div>
            )}
          </div>
        </div>
      )}

            {activeTab === "myProfile" &&
        showMyProfileTab && (
          <div
            style={{
              gridColumn: "1 / -1",
              marginTop: "10px",
            }}
          >
            <div
              style={{
                color: MUTED,
                fontSize: "13px",
                marginBottom: "8px",
              }}
            >
              Performance Reviews
  </div>

  {myPerformanceReviews.length > 0 ? (
    <div style={{ overflowX: "auto" }}>
      <table width="100%" cellPadding="10" style={{ borderCollapse: "collapse" }}>
        <thead style={{ backgroundColor: "#eef4ff" }}>
          <tr>
            <th align="left">Review Period</th>
            <th align="left">Review Date</th>
            <th align="left">Rating</th>
            <th align="left">Strengths</th>
            <th align="left">Areas for Improvement</th>
            <th align="left">Goals</th>
          </tr>
        </thead>
        <tbody>
          {myPerformanceReviews.map((review, index) => (
            <tr key={review.reviewId || index} style={{ borderBottom: `1px solid ${BORDER}` }}>
              <td>{review.reviewPeriod || "-"}</td>
              <td>{review.reviewDate || "-"}</td>
              <td>{review.rating || "-"}</td>
              <td>{review.strengths || "-"}</td>
              <td>{review.areasForImprovement || "-"}</td>
              <td>{review.goals || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
                ) : (
                <div
                  style={{
                    color: MUTED,
                    fontWeight: "bold",
                  }}
                >
                  No performance reviews found.
                </div>
              )}
          </div>
        )}

      {activeTab === "myPayslips" &&
        showMyPayslipsTab &&
        !isAdminHR && (
  <div style={{ display: "grid", gap: "20px" }}>
    <div style={cardStyle}>
      <h2 style={{ color: ROYAL_BLUE, marginTop: 0 }}>My Payslips</h2>

      <div style={{ overflowX: "auto" }}>
        <table width="100%" cellPadding="10" style={{ borderCollapse: "collapse" }}>
          <thead style={{ backgroundColor: "#eef4ff" }}>
            <tr>
              <th align="left">Payroll Number</th>
              <th align="left">Pay Period</th>
              <th align="left">Gross Pay</th>
              <th align="left">Total Deductions</th>
              <th align="left">Net Pay</th>
              <th align="left">Status</th>
              <th align="left">Action</th>
            </tr>
          </thead>

          <tbody>
            {myPayslips.length > 0 ? (
              myPayslips.map((item) => (
                <tr key={item._id || item.payrollNumber} style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <td>{item.payrollNumber}</td>
                  <td>{item.payPeriod}</td>
                  <td>JMD {Number(item.grossPay || 0).toLocaleString()}</td>
                  <td>
                    JMD{" "}
                    {Number(
                      item.totalDeductions !== undefined
                        ? item.totalDeductions
                        : item.deductions || 0
                    ).toLocaleString()}
                  </td>
                  <td>JMD {Number(item.netPay || 0).toLocaleString()}</td>
                  <td>{leaveStatusBadge(item.status || "Pending")}</td>
                  <td>
                    <button
                      style={primaryButton}
                      onClick={() => downloadPayslipPdf(item)}
                    >
                      Download PDF
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" style={{ textAlign: "center", padding: "20px", color: MUTED }}>
                  No payslips found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  </div>
)}
      {activeTab === "myLeave" &&
  showMyLeaveTab && (
    <LeaveManagementPanel
      employees={employees}
      leaveRequests={leaveRequests}
      isAdminHR={isAdminHR}
      myEmployee={myEmployee}
      refreshData={fetchHRData}
    />
  )}
    </div>
  );
}

export default HR;