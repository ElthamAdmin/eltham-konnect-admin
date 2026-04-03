import { useEffect, useMemo, useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";

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
  const LEAVE_TYPE_OPTIONS = ["Vacation", "Sick", "Unpaid", "Emergency"];

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
    branch: "Eltham Park Mainstore",
    employmentType: "Temporary",
    startDate: "",
    endDate: "",
    employmentStatus: "Active",
    payType: "Monthly Salary",
    payRate: "",
    payrollEnabled: true,
    linkedUserId: "",
    attendanceRequired: true,
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
  const [systemUsers, setSystemUsers] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [myPayslips, setMyPayslips] = useState([]);
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

  const fetchHRData = async () => {
    try {
      setLoading(true);

      if (isAdminHR) {
        const [employeesRes, summaryRes, usersRes, leaveRes] = await Promise.all([
          api.get("/api/hr"),
          api.get("/api/hr/summary"),
          api.get("/api/system-users"),
          api.get("/api/leave-requests"),
        ]);

        const employeesData = employeesRes.data.data || [];

setEmployees(employeesData);
setSummary(summaryRes.data.data || null);
setSystemUsers(usersRes.data.data || []);
setLeaveRequests(leaveRes.data.data || []);
setMyPayslips(payrollRes.data.data || []);
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

        let myProfileRes = { data: { data: null } };
let leaveRes = { data: { data: [] } };
let payrollRes = { data: { data: [] } };

if (responses.length === 3) {
  myProfileRes = responses[0];
  leaveRes = responses[1];
  payrollRes = responses[2];
} else if (responses.length === 2) {
  leaveRes = responses[0];
  payrollRes = responses[1];
} else {
  leaveRes = responses[0];
}

        const myProfile = myProfileRes.data.data || null;

        setEmployees([]);
        setSummary(null);
        setSystemUsers([]);
        setMyEmployee(myProfile);
        setLeaveRequests(leaveRes.data.data || []);
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
    const { name, value, type, checked } = e.target;

    setEmployeeForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : name === "payRate" ||
            name === "leaveBalanceVacation" ||
            name === "leaveBalanceSick" ||
            name === "leaveBalanceUnpaid"
          ? value
          : value,
    }));
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
      dateOfBirth: employee.dateOfBirth || "",
      trn: employee.trn || "",
      nisNumber: employee.nisNumber || "",
      email: employee.email || "",
      phone: employee.phone || "",
      alternatePhone: employee.alternatePhone || "",
      address: employee.address || "",
      emergencyContactName: employee.emergencyContactName || "",
      emergencyContactPhone: employee.emergencyContactPhone || "",
      emergencyContactRelationship: employee.emergencyContactRelationship || "",
      department: employee.department || "Operations",
      jobTitle: employee.jobTitle || "",
      branch: employee.branch || "Eltham Park Mainstore",
      employmentType: employee.employmentType || "Temporary",
      startDate: employee.startDate || "",
      endDate: employee.endDate || "",
      employmentStatus: employee.employmentStatus || "Active",
      payType: employee.payType || "Monthly Salary",
      payRate: employee.payRate ?? "",
      payrollEnabled: Boolean(employee.payrollEnabled),
      linkedUserId: employee.linkedUserId || "",
      attendanceRequired: Boolean(employee.attendanceRequired),
      leaveBalanceVacation: employee.leaveBalanceVacation ?? 0,
      leaveBalanceSick: employee.leaveBalanceSick ?? 0,
      leaveBalanceUnpaid: employee.leaveBalanceUnpaid ?? 0,
      notes: employee.notes || "",
    });

    setEditingEmployeeId(employee.employeeId);
    setIsEditing(true);
    setActiveTab("employeeForm");
  };

  const saveEmployee = async () => {
    try {
      const payload = {
        ...employeeForm,
        payRate: Number(employeeForm.payRate || 0),
        leaveBalanceVacation: Number(employeeForm.leaveBalanceVacation || 0),
        leaveBalanceSick: Number(employeeForm.leaveBalanceSick || 0),
        leaveBalanceUnpaid: Number(employeeForm.leaveBalanceUnpaid || 0),
      };

      if (!payload.fullName || !payload.jobTitle) {
        alert("Full name and job title are required.");
        return;
      }

      const res = isEditing
        ? await api.put(`/api/hr/${editingEmployeeId}`, payload)
        : await api.post("/api/hr", payload);

      alert(res.data.message || (isEditing ? "Employee updated" : "Employee added"));
      resetEmployeeForm();
      await fetchHRData();
      setActiveTab("employees");
    } catch (error) {
      console.error(error);
      alert(
        error?.response?.data?.message ||
          (isEditing ? "Error updating employee" : "Error adding employee")
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
  const renderField = (label, value) => (
    <div>
      <div style={{ color: MUTED, fontSize: "13px", marginBottom: "4px" }}>{label}</div>
      <div style={{ color: "#0f172a", fontWeight: "bold" }}>{value || "-"}</div>
    </div>
  );

  const showEmployeesTab = isAdminHR;
const showEmployeeFormTab = isAdminHR;
const showLeaveRequestsTab = isAdminHR;
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
    style={tabButtonStyle("documents")}
    onClick={() => {
      setActiveTab("documents");
      if (isAdminHR && employees.length > 0 && !documentEmployeeId) {
        setDocumentEmployeeId(employees[0].employeeId);
      }
    }}
  >
    Documents
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
                    <th align="left">Department</th>
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
                      <td>{employee.jobTitle || "-"}</td>
                      <td>{employee.department || "-"}</td>
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
                      <td colSpan="8" style={{ textAlign: "center", padding: "20px", color: MUTED }}>
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

      {activeTab === "employeeForm" && showEmployeeFormTab && (
        <div style={{ display: "grid", gap: "20px" }}>
          <div style={cardStyle}>
            <h2 style={{ color: ROYAL_BLUE, marginTop: 0 }}>
              {isEditing ? "Edit Employee" : "Add Employee"}
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: "14px",
              }}
            >
              <div>
                <label style={labelStyle}>Full Name</label>
                <input
                  name="fullName"
                  value={employeeForm.fullName}
                  onChange={handleEmployeeChange}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>First Name</label>
                <input
                  name="firstName"
                  value={employeeForm.firstName}
                  onChange={handleEmployeeChange}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Last Name</label>
                <input
                  name="lastName"
                  value={employeeForm.lastName}
                  onChange={handleEmployeeChange}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Gender</label>
                <select
                  name="gender"
                  value={employeeForm.gender}
                  onChange={handleEmployeeChange}
                  style={inputStyle}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Date of Birth</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={employeeForm.dateOfBirth}
                  onChange={handleEmployeeChange}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>TRN</label>
                <input
                  name="trn"
                  value={employeeForm.trn}
                  onChange={handleEmployeeChange}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>NIS Number</label>
                <input
                  name="nisNumber"
                  value={employeeForm.nisNumber}
                  onChange={handleEmployeeChange}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Email</label>
                <input
                  name="email"
                  value={employeeForm.email}
                  onChange={handleEmployeeChange}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Phone</label>
                <input
                  name="phone"
                  value={employeeForm.phone}
                  onChange={handleEmployeeChange}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Alternate Phone</label>
                <input
                  name="alternatePhone"
                  value={employeeForm.alternatePhone}
                  onChange={handleEmployeeChange}
                  style={inputStyle}
                />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Address</label>
                <textarea
                  name="address"
                  value={employeeForm.address}
                  onChange={handleEmployeeChange}
                  style={{ ...inputStyle, minHeight: "90px" }}
                />
              </div>

              <div>
                <label style={labelStyle}>Emergency Contact Name</label>
                <input
                  name="emergencyContactName"
                  value={employeeForm.emergencyContactName}
                  onChange={handleEmployeeChange}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Emergency Contact Phone</label>
                <input
                  name="emergencyContactPhone"
                  value={employeeForm.emergencyContactPhone}
                  onChange={handleEmployeeChange}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Emergency Contact Relationship</label>
                <input
                  name="emergencyContactRelationship"
                  value={employeeForm.emergencyContactRelationship}
                  onChange={handleEmployeeChange}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Department</label>
                <select
                  name="department"
                  value={employeeForm.department}
                  onChange={handleEmployeeChange}
                  style={inputStyle}
                >
                  {DEPARTMENT_OPTIONS.map((department) => (
                    <option key={department} value={department}>
                      {department}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Job Title</label>
                <input
                  name="jobTitle"
                  value={employeeForm.jobTitle}
                  onChange={handleEmployeeChange}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Branch</label>
                <select
                  name="branch"
                  value={employeeForm.branch}
                  onChange={handleEmployeeChange}
                  style={inputStyle}
                >
                  {BRANCH_OPTIONS.map((branch) => (
                    <option key={branch} value={branch}>
                      {branch}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Employment Type</label>
                <select
                  name="employmentType"
                  value={employeeForm.employmentType}
                  onChange={handleEmployeeChange}
                  style={inputStyle}
                >
                  {EMPLOYMENT_TYPE_OPTIONS.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Employment Status</label>
                <select
                  name="employmentStatus"
                  value={employeeForm.employmentStatus}
                  onChange={handleEmployeeChange}
                  style={inputStyle}
                >
                  {EMPLOYMENT_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={employeeForm.startDate}
                  onChange={handleEmployeeChange}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={employeeForm.endDate}
                  onChange={handleEmployeeChange}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Pay Type</label>
                <select
                  name="payType"
                  value={employeeForm.payType}
                  onChange={handleEmployeeChange}
                  style={inputStyle}
                >
                  {PAY_TYPE_OPTIONS.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Pay Rate (JMD)</label>
                <input
                  type="number"
                  name="payRate"
                  value={employeeForm.payRate}
                  onChange={handleEmployeeChange}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Vacation Leave Balance</label>
                <input
                  type="number"
                  name="leaveBalanceVacation"
                  value={employeeForm.leaveBalanceVacation}
                  onChange={handleEmployeeChange}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Sick Leave Balance</label>
                <input
                  type="number"
                  name="leaveBalanceSick"
                  value={employeeForm.leaveBalanceSick}
                  onChange={handleEmployeeChange}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Unpaid Leave Balance</label>
                <input
                  type="number"
                  name="leaveBalanceUnpaid"
                  value={employeeForm.leaveBalanceUnpaid}
                  onChange={handleEmployeeChange}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Linked System User</label>
                <select
                  name="linkedUserId"
                  value={employeeForm.linkedUserId}
                  onChange={handleEmployeeChange}
                  style={inputStyle}
                >
                  <option value="">Not Linked</option>
                  {systemUsers.map((systemUser) => (
                    <option key={systemUser.userId} value={systemUser.userId}>
                      {systemUser.fullName} ({systemUser.role}) - {systemUser.userId}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px", paddingTop: "26px" }}>
                <input
                  id="payrollEnabled"
                  type="checkbox"
                  name="payrollEnabled"
                  checked={employeeForm.payrollEnabled}
                  onChange={handleEmployeeChange}
                />
                <label htmlFor="payrollEnabled" style={{ fontWeight: "bold", color: "#334155" }}>
                  Payroll Enabled
                </label>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px", paddingTop: "26px" }}>
                <input
                  id="attendanceRequired"
                  type="checkbox"
                  name="attendanceRequired"
                  checked={employeeForm.attendanceRequired}
                  onChange={handleEmployeeChange}
                />
                <label htmlFor="attendanceRequired" style={{ fontWeight: "bold", color: "#334155" }}>
                  Attendance Required
                </label>
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Notes</label>
                <textarea
                  name="notes"
                  value={employeeForm.notes}
                  onChange={handleEmployeeChange}
                  style={{ ...inputStyle, minHeight: "100px" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "18px", flexWrap: "wrap" }}>
              <button style={primaryButton} onClick={saveEmployee}>
                {isEditing ? "Update Employee" : "Save Employee"}
              </button>

              <button
                style={neutralButton}
                onClick={() => {
                  resetEmployeeForm();
                }}
              >
                Reset Form
              </button>

              {isEditing && (
                <button
                  style={secondaryButton}
                  onClick={() => {
                    resetEmployeeForm();
                    setActiveTab("employees");
                  }}
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "leaveRequests" && showLeaveRequestsTab && (
        <div style={{ display: "grid", gap: "20px" }}>
          <div style={cardStyle}>
            <h2 style={{ color: ROYAL_BLUE, marginTop: 0 }}>Submit Leave Request</h2>

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
                  name="employeeId"
                  value={leaveForm.employeeId}
                  onChange={handleLeaveChange}
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
                <label style={labelStyle}>Leave Type</label>
                <select
                  name="leaveType"
                  value={leaveForm.leaveType}
                  onChange={handleLeaveChange}
                  style={inputStyle}
                >
                  {LEAVE_TYPE_OPTIONS.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={leaveForm.startDate}
                  onChange={handleLeaveChange}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={leaveForm.endDate}
                  onChange={handleLeaveChange}
                  style={inputStyle}
                />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Reason</label>
                <textarea
                  name="reason"
                  value={leaveForm.reason}
                  onChange={handleLeaveChange}
                  style={{ ...inputStyle, minHeight: "90px" }}
                />
              </div>
            </div>

            <div style={{ marginTop: "12px" }}>
              <button style={primaryButton} onClick={submitLeaveRequest}>
                Submit Leave Request
              </button>
            </div>
          </div>

          <div style={cardStyle}>
            <h2 style={{ color: ROYAL_BLUE, marginTop: 0 }}>All Leave Requests</h2>

            <label style={labelStyle}>Admin Comment for Approve / Reject</label>
            <textarea
              placeholder="Enter comment"
              value={leaveAdminComment}
              onChange={(e) => setLeaveAdminComment(e.target.value)}
              style={{ ...inputStyle, minHeight: "80px", marginBottom: "15px" }}
            />

            <div style={{ overflowX: "auto" }}>
              <table width="100%" cellPadding="10" style={{ borderCollapse: "collapse" }}>
                <thead style={{ backgroundColor: "#eef4ff" }}>
                  <tr>
                    <th align="left">Request ID</th>
                    <th align="left">Employee</th>
                    <th align="left">Department</th>
                    <th align="left">Type</th>
                    <th align="left">Dates</th>
                    <th align="left">Days</th>
                    <th align="left">Status</th>
                    <th align="left">Reason</th>
                    <th align="left">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {leaveRequests.map((request) => (
                    <tr key={request.leaveRequestId} style={{ borderBottom: `1px solid ${BORDER}` }}>
                      <td>{request.leaveRequestId}</td>
                      <td>{request.employeeName}</td>
                      <td>{request.department || "-"}</td>
                      <td>{request.leaveType}</td>
                      <td>
                        {request.startDate} to {request.endDate}
                      </td>
                      <td>{request.totalDays}</td>
                      <td>{leaveStatusBadge(request.status)}</td>
                      <td>{request.reason || "-"}</td>
                      <td>
                        {request.status === "Pending" ? (
                          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            <button
                              style={successButton}
                              onClick={() => approveLeaveRequest(request.leaveRequestId)}
                            >
                              Approve
                            </button>
                            <button
                              style={dangerButton}
                              onClick={() => rejectLeaveRequest(request.leaveRequestId)}
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: MUTED }}>No action</span>
                        )}
                      </td>
                    </tr>
                  ))}

                  {leaveRequests.length === 0 && (
                    <tr>
                      <td colSpan="9" style={{ textAlign: "center", padding: "20px", color: MUTED }}>
                        No leave requests found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {activeTab === "documents" && showDocumentsTab && (
  <div style={{ display: "grid", gap: "20px" }}>
    <div style={cardStyle}>
      <h2 style={{ color: ROYAL_BLUE, marginTop: 0 }}>
        {isAdminHR ? "Employee Documents" : "My Documents"}
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "12px",
        }}
      >
        {isAdminHR && (
          <div>
            <label style={labelStyle}>Employee</label>
            <select
              value={documentEmployeeId}
              onChange={(e) => setDocumentEmployeeId(e.target.value)}
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
        )}

        <div>
          <label style={labelStyle}>Document Type</label>
          <select
            name="documentType"
            value={documentForm.documentType}
            onChange={handleDocumentInputChange}
            style={inputStyle}
          >
            {DOCUMENT_TYPE_OPTIONS.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Document Name</label>
          <input
            name="documentName"
            value={documentForm.documentName}
            onChange={handleDocumentInputChange}
            placeholder="e.g. Signed Contract"
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Choose File</label>
          <input
            type="file"
            name="file"
            onChange={handleDocumentInputChange}
            style={inputStyle}
          />
        </div>
      </div>

      <div style={{ marginTop: "14px" }}>
        <button style={primaryButton} onClick={uploadEmployeeDocument}>
          Upload Document
        </button>
      </div>
    </div>

    <div style={cardStyle}>
      <h2 style={{ color: ROYAL_BLUE, marginTop: 0 }}>Document List</h2>

      {documentsLoading ? (
        <div style={{ color: MUTED }}>Loading documents...</div>
      ) : employeeDocuments.length === 0 ? (
        <div style={{ color: MUTED }}>No documents found.</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table width="100%" cellPadding="10" style={{ borderCollapse: "collapse" }}>
            <thead style={{ backgroundColor: "#eef4ff" }}>
              <tr>
                <th align="left">Document Name</th>
                <th align="left">Type</th>
                <th align="left">Uploaded</th>
                <th align="left">File</th>
                {isAdminHR && <th align="left">Action</th>}
              </tr>
            </thead>
            <tbody>
              {employeeDocuments.map((doc, index) => (
                <tr key={`${doc.fileUrl}-${index}`} style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <td>{doc.documentName || "-"}</td>
                  <td>{doc.documentType || "-"}</td>
                  <td>
                    {doc.uploadedAt
                      ? new Date(doc.uploadedAt).toLocaleDateString()
                      : "-"}
                  </td>
                  <td>
                    {doc.fileUrl ? (
                      <a
                        href={`${api.defaults.baseURL}${doc.fileUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: ROYAL_BLUE, fontWeight: "bold" }}
                      >
                        View File
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                  {isAdminHR && (
                    <td>
                      <button
                        style={dangerButton}
                        onClick={() => deleteEmployeeDocument(index)}
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
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
                {renderField("Pay Type", myEmployee.payType)}
                {renderField(
                  "Pay Rate",
                  `JMD ${Number(myEmployee.payRate || 0).toLocaleString()}`
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
              </div>
            )}
          </div>
        </div>
      )}
      {activeTab === "myPayslips" && showMyPayslipsTab && !isAdminHR && (
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
      {activeTab === "myLeave" && showMyLeaveTab && (
        <div style={{ display: "grid", gap: "20px" }}>
          <div style={cardStyle}>
            <h2 style={{ color: ROYAL_BLUE, marginTop: 0 }}>
              {isAdminHR ? "Submit Leave Request" : "Submit My Leave Request"}
            </h2>

            {!isAdminHR && !myEmployee ? (
              <div style={{ color: "#dc2626", fontWeight: "bold" }}>
                Your account is not yet linked to an HR employee record. Please contact admin.
              </div>
            ) : (
              <>
                {!isAdminHR && myEmployee && (
                  <div
                    style={{
                      backgroundColor: "#eef4ff",
                      border: `1px solid ${BORDER}`,
                      borderRadius: "10px",
                      padding: "14px",
                      marginBottom: "12px",
                    }}
                  >
                    <div style={{ color: ROYAL_BLUE, fontWeight: "bold" }}>
                      {myEmployee.fullName}
                    </div>
                    <div style={{ color: MUTED, marginTop: "4px" }}>
                      {myEmployee.jobTitle || "Employee"} • {myEmployee.employeeId}
                    </div>
                    <div style={{ color: MUTED, marginTop: "6px" }}>
                      Vacation: {Number(myEmployee.leaveBalanceVacation || 0)} days | Sick:{" "}
                      {Number(myEmployee.leaveBalanceSick || 0)} days | Unpaid:{" "}
                      {Number(myEmployee.leaveBalanceUnpaid || 0)} days
                    </div>
                  </div>
                )}

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "12px",
                  }}
                >
                  <div>
                    <label style={labelStyle}>Leave Type</label>
                    <select
                      name="leaveType"
                      value={leaveForm.leaveType}
                      onChange={handleLeaveChange}
                      style={inputStyle}
                    >
                      {LEAVE_TYPE_OPTIONS.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={labelStyle}>Start Date</label>
                    <input
                      type="date"
                      name="startDate"
                      value={leaveForm.startDate}
                      onChange={handleLeaveChange}
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>End Date</label>
                    <input
                      type="date"
                      name="endDate"
                      value={leaveForm.endDate}
                      onChange={handleLeaveChange}
                      style={inputStyle}
                    />
                  </div>

                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={labelStyle}>Reason</label>
                    <textarea
                      name="reason"
                      value={leaveForm.reason}
                      onChange={handleLeaveChange}
                      style={{ ...inputStyle, minHeight: "90px" }}
                    />
                  </div>
                </div>

                <div style={{ marginTop: "12px" }}>
                  <button style={primaryButton} onClick={submitLeaveRequest}>
                    {isAdminHR ? "Submit Leave Request" : "Submit My Leave Request"}
                  </button>
                </div>
              </>
            )}
          </div>

          <div style={cardStyle}>
            <h2 style={{ color: ROYAL_BLUE, marginTop: 0 }}>
              {isAdminHR ? "Leave Requests" : "My Leave Requests"}
            </h2>

            <div style={{ overflowX: "auto" }}>
              <table width="100%" cellPadding="10" style={{ borderCollapse: "collapse" }}>
                <thead style={{ backgroundColor: "#eef4ff" }}>
                  <tr>
                    <th align="left">Request ID</th>
                    <th align="left">Type</th>
                    <th align="left">Dates</th>
                    <th align="left">Days</th>
                    <th align="left">Status</th>
                    <th align="left">Reason</th>
                    <th align="left">Admin Comment</th>
                  </tr>
                </thead>

                <tbody>
                  {leaveRequests.map((request) => (
                    <tr key={request.leaveRequestId} style={{ borderBottom: `1px solid ${BORDER}` }}>
                      <td>{request.leaveRequestId}</td>
                      <td>{request.leaveType}</td>
                      <td>
                        {request.startDate} to {request.endDate}
                      </td>
                      <td>{request.totalDays}</td>
                      <td>{leaveStatusBadge(request.status)}</td>
                      <td>{request.reason || "-"}</td>
                      <td>{request.adminComment || "-"}</td>
                    </tr>
                  ))}

                  {leaveRequests.length === 0 && (
                    <tr>
                      <td colSpan="7" style={{ textAlign: "center", padding: "20px", color: MUTED }}>
                        No leave requests found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HR;