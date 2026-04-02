import { useEffect, useMemo, useState } from "react";
import api from "../api";

function HR() {
  const [activeTab, setActiveTab] = useState("employees");
  const [employees, setEmployees] = useState([]);
  const [summary, setSummary] = useState(null);
  const [systemUsers, setSystemUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState("");
  const [employeeForm, setEmployeeForm] = useState({
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
    leaveBalanceVacation: "",
    leaveBalanceSick: "",
    leaveBalanceUnpaid: "",
    notes: "",
  });

  const ROYAL_BLUE = "#0B3D91";
  const GOLD = "#D4AF37";
  const WHITE = "#FFFFFF";
  const LIGHT_BG = "#f4f7fb";
  const BORDER = "#dbe3ef";
  const MUTED = "#64748b";

  const DEPARTMENTS = [
    "Operations",
    "Customer Service",
    "Accounts",
    "Marketing",
    "Warehouse",
    "Administration",
  ];

  const EMPLOYMENT_TYPES = [
    "Permanent",
    "Temporary",
    "Part-Time",
    "Contract",
    "Probation",
  ];

  const PAY_TYPES = [
    "Monthly Salary",
    "Weekly Wage",
    "Daily Rate",
    "Hourly Rate",
  ];

  const BRANCHES = ["Eltham Park Mainstore", "Brown's Town Square"];

  const fetchHRData = async () => {
    try {
      const [employeesRes, summaryRes, usersRes] = await Promise.all([
        api.get("/api/hr"),
        api.get("/api/hr/summary"),
        api.get("/api/system-users"),
      ]);

      setEmployees(employeesRes.data.data || []);
      setSummary(summaryRes.data.data || null);
      setSystemUsers(usersRes.data.data || []);
    } catch (error) {
      console.error("Error loading HR data:", error);
      alert(error?.response?.data?.message || "Could not load HR data.");
    }
  };

  useEffect(() => {
    fetchHRData();
  }, []);

  const handleEmployeeChange = (e) => {
  const { name, value, type, checked } = e.target;

  setEmployeeForm((prev) => ({
    ...prev,
    [name]: type === "checkbox" ? checked : value,
  }));
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
    payRate: employee.payRate || "",
    payrollEnabled: employee.payrollEnabled === false ? false : true,
    linkedUserId: employee.linkedUserId || "",
    attendanceRequired: employee.attendanceRequired === false ? false : true,
    leaveBalanceVacation: employee.leaveBalanceVacation || "",
    leaveBalanceSick: employee.leaveBalanceSick || "",
    leaveBalanceUnpaid: employee.leaveBalanceUnpaid || "",
    notes: employee.notes || "",
  });

  setEditingEmployeeId(employee.employeeId);
  setIsEditing(true);
  setActiveTab("addEmployee");
};
    setEmployeeForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const addEmployee = async () => {
    try {
      if (!employeeForm.fullName || !employeeForm.jobTitle) {
        alert("Please complete full name and job title.");
        return;
      }

      const updateEmployee = async () => {
  try {
    if (!editingEmployeeId) {
      alert("No employee selected for update.");
      return;
    }
const cancelEdit = () => {
  setEmployeeForm({
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
    leaveBalanceVacation: "",
    leaveBalanceSick: "",
    leaveBalanceUnpaid: "",
    notes: "",
  });

  setIsEditing(false);
  setEditingEmployeeId("");
};
    if (!employeeForm.fullName || !employeeForm.jobTitle) {
      alert("Please complete full name and job title.");
      return;
    }

    const payload = {
      ...employeeForm,
      payRate: Number(employeeForm.payRate || 0),
      leaveBalanceVacation: Number(employeeForm.leaveBalanceVacation || 0),
      leaveBalanceSick: Number(employeeForm.leaveBalanceSick || 0),
      leaveBalanceUnpaid: Number(employeeForm.leaveBalanceUnpaid || 0),
    };

    const res = await api.put(`/api/hr/${editingEmployeeId}`, payload);

    alert(res.data.message);

    setEmployeeForm({
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
      leaveBalanceVacation: "",
      leaveBalanceSick: "",
      leaveBalanceUnpaid: "",
      notes: "",
    });

    setIsEditing(false);
    setEditingEmployeeId("");
    await fetchHRData();
    setActiveTab("employees");
  } catch (error) {
    console.error("Error updating employee:", error);
    alert(error?.response?.data?.message || "Could not update employee.");
  }
};

      const payload = {
        ...employeeForm,
        payRate: Number(employeeForm.payRate || 0),
        leaveBalanceVacation: Number(employeeForm.leaveBalanceVacation || 0),
        leaveBalanceSick: Number(employeeForm.leaveBalanceSick || 0),
        leaveBalanceUnpaid: Number(employeeForm.leaveBalanceUnpaid || 0),
      };

      const res = await api.post("/api/hr", payload);

      alert(res.data.message);

      setEmployeeForm({
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
        leaveBalanceVacation: "",
        leaveBalanceSick: "",
        leaveBalanceUnpaid: "",
        notes: "",
      });

      await fetchHRData();
      setActiveTab("employees");
    } catch (error) {
      console.error("Error adding employee:", error);
      alert(error?.response?.data?.message || "Could not create employee.");
    }
  };

  const updateEmployeeStatus = async (employeeId, employmentStatus) => {
    try {
      const res = await api.put(`/api/hr/${employeeId}/status`, {
        employmentStatus,
      });

      alert(res.data.message);
      await fetchHRData();
    } catch (error) {
      console.error("Error updating employee status:", error);
      alert(
        error?.response?.data?.message || "Could not update employee status."
      );
    }
  };

  const filteredEmployees = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) return employees;

    return employees.filter((employee) => {
      return (
        String(employee.employeeId || "").toLowerCase().includes(term) ||
        String(employee.fullName || "").toLowerCase().includes(term) ||
        String(employee.jobTitle || "").toLowerCase().includes(term) ||
        String(employee.department || "").toLowerCase().includes(term) ||
        String(employee.branch || "").toLowerCase().includes(term) ||
        String(employee.email || "").toLowerCase().includes(term)
      );
    });
  }, [employees, searchTerm]);

  const formatCurrency = (value) =>
    `JMD ${Number(value || 0).toLocaleString()}`;

  const statusBadge = (status) => {
    const backgroundColor =
      status === "Active"
        ? "#16a34a"
        : status === "Inactive"
        ? "#64748b"
        : status === "On Leave"
        ? "#f59e0b"
        : status === "Terminated"
        ? "#dc2626"
        : "#64748b";

    return (
      <span
        style={{
          padding: "5px 10px",
          borderRadius: "999px",
          color: "white",
          backgroundColor,
          fontWeight: "bold",
          fontSize: "12px",
          display: "inline-block",
          whiteSpace: "nowrap",
        }}
      >
        {status}
      </span>
    );
  };

  const cardStyle = {
    backgroundColor: WHITE,
    borderRadius: "14px",
    padding: "20px",
    border: `1px solid ${BORDER}`,
    boxShadow: "0 4px 14px rgba(15,23,42,0.05)",
  };

  const metricCardStyle = {
    backgroundColor: WHITE,
    borderRadius: "16px",
    padding: "22px",
    border: `1px solid ${BORDER}`,
    boxShadow: "0 6px 18px rgba(15,23,42,0.05)",
    minHeight: "125px",
  };

  const tabButtonStyle = (tabName) => ({
    backgroundColor: activeTab === tabName ? ROYAL_BLUE : WHITE,
    color: activeTab === tabName ? WHITE : "#1f2937",
    border: `1px solid ${activeTab === tabName ? ROYAL_BLUE : "#cbd5e1"}`,
    padding: "11px 18px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
    boxShadow:
      activeTab === tabName ? "0 6px 16px rgba(11,61,145,0.2)" : "none",
  });

  return (
    <div style={{ backgroundColor: LIGHT_BG, minHeight: "100vh" }}>
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ margin: 0, color: "#0f172a" }}>HR Module</h1>
        <p style={{ margin: "6px 0 0 0", color: MUTED }}>
          Manage employee records, HR summary, and staff linkage to system users.
        </p>
      </div>

      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "24px",
          flexWrap: "wrap",
        }}
      >
        <button
          style={tabButtonStyle("employees")}
          onClick={() => setActiveTab("employees")}
        >
          Employees
        </button>
        <button
          style={tabButtonStyle("addEmployee")}
          onClick={() => setActiveTab("addEmployee")}
        >
          Add Employee
        </button>
        <button
          style={tabButtonStyle("overview")}
          onClick={() => setActiveTab("overview")}
        >
          HR Overview
        </button>
      </div>

      {(activeTab === "employees" || activeTab === "overview") && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "20px",
            marginBottom: "24px",
          }}
        >
          <div style={metricCardStyle}>
            <div
              style={{
                fontSize: "32px",
                fontWeight: "bold",
                color: ROYAL_BLUE,
                marginBottom: "8px",
              }}
            >
              {summary?.totalEmployees || 0}
            </div>
            <div style={{ color: "#334155", fontWeight: "bold" }}>
              Total Employees
            </div>
          </div>

          <div style={metricCardStyle}>
            <div
              style={{
                fontSize: "32px",
                fontWeight: "bold",
                color: "#16a34a",
                marginBottom: "8px",
              }}
            >
              {summary?.activeEmployees || 0}
            </div>
            <div style={{ color: "#334155", fontWeight: "bold" }}>
              Active Employees
            </div>
          </div>

          <div style={metricCardStyle}>
            <div
              style={{
                fontSize: "32px",
                fontWeight: "bold",
                color: "#f59e0b",
                marginBottom: "8px",
              }}
            >
              {summary?.onLeaveEmployees || 0}
            </div>
            <div style={{ color: "#334155", fontWeight: "bold" }}>
              On Leave
            </div>
          </div>

          <div style={metricCardStyle}>
            <div
              style={{
                fontSize: "32px",
                fontWeight: "bold",
                color: "#64748b",
                marginBottom: "8px",
              }}
            >
              {summary?.inactiveEmployees || 0}
            </div>
            <div style={{ color: "#334155", fontWeight: "bold" }}>
              Inactive Employees
            </div>
          </div>

          <div style={metricCardStyle}>
            <div
              style={{
                fontSize: "32px",
                fontWeight: "bold",
                color: "#dc2626",
                marginBottom: "8px",
              }}
            >
              {summary?.terminatedEmployees || 0}
            </div>
            <div style={{ color: "#334155", fontWeight: "bold" }}>
              Terminated Employees
            </div>
          </div>

          <div style={metricCardStyle}>
            <div
              style={{
                fontSize: "32px",
                fontWeight: "bold",
                color: GOLD,
                marginBottom: "8px",
              }}
            >
              {summary?.payrollEnabledEmployees || 0}
            </div>
            <div style={{ color: "#334155", fontWeight: "bold" }}>
              Payroll Enabled
            </div>
          </div>
        </div>
      )}

      {activeTab === "employees" && (
        <>
          <div style={{ ...cardStyle, marginBottom: "24px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "16px",
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <div>
                <h2 style={{ margin: 0, color: ROYAL_BLUE }}>Employees</h2>
                <p style={{ margin: "6px 0 0 0", color: MUTED }}>
                  Search and manage your current staff records.
                </p>
              </div>

              <input
                type="text"
                placeholder="Search by employee ID, name, title, branch..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: "10px 12px",
                  minWidth: "320px",
                  border: `1px solid ${BORDER}`,
                  borderRadius: "8px",
                }}
              />
            </div>
          </div>

          <div style={cardStyle}>
            <div style={{ overflowX: "auto" }}>
              <table
                border="1"
                cellPadding="10"
                style={{
                  minWidth: "1700px",
                  width: "100%",
                  borderCollapse: "collapse",
                }}
              >
                <thead style={{ backgroundColor: "#eef4ff" }}>
                  <tr>
                    <th>Employee ID</th>
                    <th>Full Name</th>
                    <th>Job Title</th>
                    <th>Department</th>
                    <th>Branch</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Employment Type</th>
                    <th>Pay Type</th>
                    <th>Pay Rate</th>
                    <th>System User</th>
                    <th>Status</th>
                    <th>Quick Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.length > 0 ? (
                    filteredEmployees.map((employee) => (
                      <tr key={employee._id || employee.employeeId}>
                        <td>{employee.employeeId}</td>
                        <td>{employee.fullName}</td>
                        <td>{employee.jobTitle}</td>
                        <td>{employee.department}</td>
                        <td>{employee.branch}</td>
                        <td>{employee.email || "-"}</td>
                        <td>{employee.phone || "-"}</td>
                        <td>{employee.employmentType}</td>
                        <td>{employee.payType}</td>
                        <td>{formatCurrency(employee.payRate)}</td>
                        <td>{employee.linkedUserId || "-"}</td>
                        <td>{statusBadge(employee.employmentStatus)}</td>
                        <td>
                          <div
                            style={{
                              display: "flex",
                              gap: "8px",
                              flexWrap: "wrap",
                            }}
                          >
                            <button
  onClick={() =>
    updateEmployeeStatus(employee.employeeId, "Active")
  }
  style={{
    backgroundColor: "#16a34a",
    color: WHITE,
    border: "none",
    padding: "6px 10px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
  }}
>
  Active
</button>

<button
  onClick={() =>
    updateEmployeeStatus(employee.employeeId, "On Leave")
  }
  style={{
    backgroundColor: "#f59e0b",
    color: WHITE,
    border: "none",
    padding: "6px 10px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
  }}
>
  Leave
</button>

<button
  onClick={() =>
    updateEmployeeStatus(employee.employeeId, "Inactive")
  }
  style={{
    backgroundColor: "#64748b",
    color: WHITE,
    border: "none",
    padding: "6px 10px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
  }}
>
  Inactive
</button>

<button
  onClick={() =>
    updateEmployeeStatus(employee.employeeId, "Terminated")
  }
  style={{
    backgroundColor: "#dc2626",
    color: WHITE,
    border: "none",
    padding: "6px 10px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
  }}
>
  Terminate
</button>

<button
  onClick={() => loadEmployeeForEdit(employee)}
  style={{
    backgroundColor: ROYAL_BLUE,
    color: WHITE,
    border: "none",
    padding: "6px 10px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
  }}
>
  Edit
</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="13">No employees found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === "addEmployee" && (
        <div style={cardStyle}>
         <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>
  {isEditing ? "Edit Employee" : "Add Employee"}
</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "15px",
            }}
          >
            <input
              type="text"
              name="fullName"
              placeholder="Full Name"
              value={employeeForm.fullName}
              onChange={handleEmployeeChange}
              style={{ padding: "10px" }}
            />
            <input
              type="text"
              name="jobTitle"
              placeholder="Job Title"
              value={employeeForm.jobTitle}
              onChange={handleEmployeeChange}
              style={{ padding: "10px" }}
            />

            <input
              type="text"
              name="firstName"
              placeholder="First Name"
              value={employeeForm.firstName}
              onChange={handleEmployeeChange}
              style={{ padding: "10px" }}
            />
            <input
              type="text"
              name="lastName"
              placeholder="Last Name"
              value={employeeForm.lastName}
              onChange={handleEmployeeChange}
              style={{ padding: "10px" }}
            />

            <select
              name="gender"
              value={employeeForm.gender}
              onChange={handleEmployeeChange}
              style={{ padding: "10px" }}
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>

            <input
              type="date"
              name="dateOfBirth"
              value={employeeForm.dateOfBirth}
              onChange={handleEmployeeChange}
              style={{ padding: "10px" }}
            />

            <input
              type="text"
              name="trn"
              placeholder="TRN"
              value={employeeForm.trn}
              onChange={handleEmployeeChange}
              style={{ padding: "10px" }}
            />
            <input
              type="text"
              name="nisNumber"
              placeholder="NIS Number"
              value={employeeForm.nisNumber}
              onChange={handleEmployeeChange}
              style={{ padding: "10px" }}
            />

            <input
              type="email"
              name="email"
              placeholder="Email"
              value={employeeForm.email}
              onChange={handleEmployeeChange}
              style={{ padding: "10px" }}
            />
            <input
              type="text"
              name="phone"
              placeholder="Phone"
              value={employeeForm.phone}
              onChange={handleEmployeeChange}
              style={{ padding: "10px" }}
            />

            <input
              type="text"
              name="alternatePhone"
              placeholder="Alternate Phone"
              value={employeeForm.alternatePhone}
              onChange={handleEmployeeChange}
              style={{ padding: "10px" }}
            />
            <input
              type="text"
              name="address"
              placeholder="Address"
              value={employeeForm.address}
              onChange={handleEmployeeChange}
              style={{ padding: "10px" }}
            />

            <input
              type="text"
              name="emergencyContactName"
              placeholder="Emergency Contact Name"
              value={employeeForm.emergencyContactName}
              onChange={handleEmployeeChange}
              style={{ padding: "10px" }}
            />
            <input
              type="text"
              name="emergencyContactPhone"
              placeholder="Emergency Contact Phone"
              value={employeeForm.emergencyContactPhone}
              onChange={handleEmployeeChange}
              style={{ padding: "10px" }}
            />

            <input
              type="text"
              name="emergencyContactRelationship"
              placeholder="Emergency Contact Relationship"
              value={employeeForm.emergencyContactRelationship}
              onChange={handleEmployeeChange}
              style={{ padding: "10px" }}
            />

            <select
              name="department"
              value={employeeForm.department}
              onChange={handleEmployeeChange}
              style={{ padding: "10px" }}
            >
              {DEPARTMENTS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <select
              name="branch"
              value={employeeForm.branch}
              onChange={handleEmployeeChange}
              style={{ padding: "10px" }}
            >
              {BRANCHES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <select
              name="employmentType"
              value={employeeForm.employmentType}
              onChange={handleEmployeeChange}
              style={{ padding: "10px" }}
            >
              {EMPLOYMENT_TYPES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <select
              name="employmentStatus"
              value={employeeForm.employmentStatus}
              onChange={handleEmployeeChange}
              style={{ padding: "10px" }}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="On Leave">On Leave</option>
              <option value="Terminated">Terminated</option>
            </select>

            <input
              type="date"
              name="startDate"
              value={employeeForm.startDate}
              onChange={handleEmployeeChange}
              style={{ padding: "10px" }}
            />
            <input
              type="date"
              name="endDate"
              value={employeeForm.endDate}
              onChange={handleEmployeeChange}
              style={{ padding: "10px" }}
            />

            <select
              name="payType"
              value={employeeForm.payType}
              onChange={handleEmployeeChange}
              style={{ padding: "10px" }}
            >
              {PAY_TYPES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <input
              type="number"
              name="payRate"
              placeholder="Pay Rate"
              value={employeeForm.payRate}
              onChange={handleEmployeeChange}
              style={{ padding: "10px" }}
            />

            <select
              name="linkedUserId"
              value={employeeForm.linkedUserId}
              onChange={handleEmployeeChange}
              style={{ padding: "10px" }}
            >
              <option value="">Select Linked System User</option>
              {systemUsers.map((user) => (
                <option key={user._id || user.userId} value={user.userId}>
                  {user.fullName} ({user.role})
                </option>
              ))}
            </select>

            <input
              type="number"
              name="leaveBalanceVacation"
              placeholder="Vacation Leave Balance"
              value={employeeForm.leaveBalanceVacation}
              onChange={handleEmployeeChange}
              style={{ padding: "10px" }}
            />

            <input
              type="number"
              name="leaveBalanceSick"
              placeholder="Sick Leave Balance"
              value={employeeForm.leaveBalanceSick}
              onChange={handleEmployeeChange}
              style={{ padding: "10px" }}
            />
            <input
              type="number"
              name="leaveBalanceUnpaid"
              placeholder="Unpaid Leave Balance"
              value={employeeForm.leaveBalanceUnpaid}
              onChange={handleEmployeeChange}
              style={{ padding: "10px" }}
            />

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px",
                border: `1px solid ${BORDER}`,
                borderRadius: "8px",
                backgroundColor: "#f8fbff",
              }}
            >
              <input
                type="checkbox"
                name="payrollEnabled"
                checked={employeeForm.payrollEnabled}
                onChange={handleEmployeeChange}
              />
              Payroll Enabled
            </label>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px",
                border: `1px solid ${BORDER}`,
                borderRadius: "8px",
                backgroundColor: "#f8fbff",
              }}
            >
              <input
                type="checkbox"
                name="attendanceRequired"
                checked={employeeForm.attendanceRequired}
                onChange={handleEmployeeChange}
              />
              Attendance Required
            </label>

            <textarea
              name="notes"
              placeholder="Notes"
              value={employeeForm.notes}
              onChange={handleEmployeeChange}
              style={{
                padding: "10px",
                minHeight: "100px",
                gridColumn: "span 2",
              }}
            />
          </div>

          <div style={{ marginTop: "20px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
  <button
    onClick={isEditing ? updateEmployee : addEmployee}
    style={{
      backgroundColor: ROYAL_BLUE,
      color: WHITE,
      border: "none",
      padding: "10px 16px",
      borderRadius: "8px",
      cursor: "pointer",
      fontWeight: "bold",
    }}
  >
    {isEditing ? "Update Employee" : "Save Employee"}
  </button>

  {isEditing && (
    <button
      onClick={cancelEdit}
      style={{
        backgroundColor: "#64748b",
        color: WHITE,
        border: "none",
        padding: "10px 16px",
        borderRadius: "8px",
        cursor: "pointer",
        fontWeight: "bold",
      }}
    >
      Cancel Edit
    </button>
  )}
</div>
        </div>
      )}

      {activeTab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px" }}>
          <div style={cardStyle}>
            <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>
              HR Module Overview
            </h2>
            <p style={{ color: MUTED, lineHeight: 1.7 }}>
              This HR module is now connected to your admin system structure.
              Employee records can be linked to system users and prepared for
              payroll, attendance, and leave management.
            </p>
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>
              Current HR Coverage
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "16px",
              }}
            >
              <div
                style={{
                  backgroundColor: "#f8fafc",
                  border: `1px solid ${BORDER}`,
                  borderRadius: "10px",
                  padding: "16px",
                }}
              >
                <strong style={{ color: ROYAL_BLUE }}>Employee Records</strong>
                <p style={{ margin: "8px 0 0 0", color: MUTED }}>
                  Add and manage staff master records.
                </p>
              </div>

              <div
                style={{
                  backgroundColor: "#f8fafc",
                  border: `1px solid ${BORDER}`,
                  borderRadius: "10px",
                  padding: "16px",
                }}
              >
                <strong style={{ color: ROYAL_BLUE }}>System User Link</strong>
                <p style={{ margin: "8px 0 0 0", color: MUTED }}>
                  Connect employees to admin login accounts.
                </p>
              </div>

              <div
                style={{
                  backgroundColor: "#f8fafc",
                  border: `1px solid ${BORDER}`,
                  borderRadius: "10px",
                  padding: "16px",
                }}
              >
                <strong style={{ color: ROYAL_BLUE }}>Payroll Ready</strong>
                <p style={{ margin: "8px 0 0 0", color: MUTED }}>
                  Store pay type, pay rate, and payroll-enabled status.
                </p>
              </div>

              <div
                style={{
                  backgroundColor: "#f8fafc",
                  border: `1px solid ${BORDER}`,
                  borderRadius: "10px",
                  padding: "16px",
                }}
              >
                <strong style={{ color: ROYAL_BLUE }}>Leave Balances</strong>
                <p style={{ margin: "8px 0 0 0", color: MUTED }}>
                  Start managing leave balances for each employee.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );


export default HR;