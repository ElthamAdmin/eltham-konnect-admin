import { useEffect, useMemo, useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";

function HR() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState("employees");
  const [employees, setEmployees] = useState([]);
  const [summary, setSummary] = useState(null);
  const [systemUsers, setSystemUsers] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [myEmployee, setMyEmployee] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState("");

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

  const emptyForm = {
    fullName: "",
    jobTitle: "",
    payRate: "",
  };

  const emptyLeaveForm = {
    employeeId: "",
    leaveType: "Vacation",
    startDate: "",
    endDate: "",
    reason: "",
  };

  const [employeeForm, setEmployeeForm] = useState(emptyForm);
  const [leaveForm, setLeaveForm] = useState(emptyLeaveForm);
  const [leaveAdminComment, setLeaveAdminComment] = useState("");

  const cardStyle = {
    backgroundColor: WHITE,
    borderRadius: "14px",
    padding: "20px",
    border: `1px solid ${BORDER}`,
    boxShadow: "0 4px 14px rgba(15,23,42,0.05)",
  };

  const primaryButton = {
    backgroundColor: ROYAL_BLUE,
    color: WHITE,
    border: "none",
    padding: "8px 14px",
    borderRadius: "8px",
    fontWeight: "bold",
    cursor: "pointer",
  };

  const secondaryButton = {
    backgroundColor: "#64748b",
    color: WHITE,
    border: "none",
    padding: "8px 14px",
    borderRadius: "8px",
    fontWeight: "bold",
    cursor: "pointer",
  };

  const successButton = {
    backgroundColor: "#16a34a",
    color: WHITE,
    border: "none",
    padding: "8px 14px",
    borderRadius: "8px",
    fontWeight: "bold",
    cursor: "pointer",
  };

  const warningButton = {
    backgroundColor: "#f59e0b",
    color: WHITE,
    border: "none",
    padding: "8px 14px",
    borderRadius: "8px",
    fontWeight: "bold",
    cursor: "pointer",
  };

  const dangerButton = {
    backgroundColor: "#dc2626",
    color: WHITE,
    border: "none",
    padding: "8px 14px",
    borderRadius: "8px",
    fontWeight: "bold",
    cursor: "pointer",
  };

  const findMyEmployeeRecord = (employeesList) => {
    const linkedEmployeeId = user?.linkedEmployeeId || "";

    if (linkedEmployeeId) {
      return (
        employeesList.find((employee) => employee.employeeId === linkedEmployeeId) ||
        null
      );
    }

    if (user?.userId) {
      return (
        employeesList.find((employee) => employee.linkedUserId === user.userId) ||
        null
      );
    }

    return null;
  };

  const fetchHRData = async () => {
    try {
      const employeeRequest = isAdminHR
        ? api.get("/api/hr")
        : api.get("/api/hr");

      const summaryRequest = isAdminHR
        ? api.get("/api/hr/summary")
        : Promise.resolve({ data: { data: null } });

      const usersRequest = isAdminHR
        ? api.get("/api/system-users")
        : Promise.resolve({ data: { data: [] } });

      const leaveRequest = isAdminHR
        ? api.get("/api/leave-requests")
        : api.get("/api/leave-requests");

      const [employeesRes, summaryRes, usersRes, leaveRes] = await Promise.all([
        employeeRequest,
        summaryRequest,
        usersRequest,
        leaveRequest,
      ]);

      const employeesData = employeesRes.data.data || [];
      const allLeaveRequests = leaveRes.data.data || [];

      const currentEmployee = findMyEmployeeRecord(employeesData);

      setEmployees(employeesData);
      setSummary(summaryRes.data.data || null);
      setSystemUsers(usersRes.data.data || []);
      setMyEmployee(currentEmployee);

      if (isAdminHR) {
        setLeaveRequests(allLeaveRequests);
      } else {
        const myEmployeeId = currentEmployee?.employeeId || "";
        setLeaveRequests(
          allLeaveRequests.filter((request) => request.employeeId === myEmployeeId)
        );

        setActiveTab("myLeave");
        setLeaveForm((prev) => ({
          ...prev,
          employeeId: myEmployeeId,
        }));
      }
    } catch (error) {
      console.error("Failed to load HR data:", error);
      alert(error?.response?.data?.message || "Failed to load HR data");
    }
  };

  useEffect(() => {
    fetchHRData();
  }, []);

  const handleEmployeeChange = (e) => {
    const { name, value } = e.target;
    setEmployeeForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLeaveChange = (e) => {
    const { name, value } = e.target;
    setLeaveForm((prev) => ({ ...prev, [name]: value }));
  };

  const loadEmployeeForEdit = (employee) => {
    setEmployeeForm({
      fullName: employee.fullName || "",
      jobTitle: employee.jobTitle || "",
      payRate: employee.payRate || "",
    });

    setEditingEmployeeId(employee.employeeId);
    setIsEditing(true);
    setActiveTab("addEmployee");
  };

  const cancelEdit = () => {
    setEmployeeForm(emptyForm);
    setIsEditing(false);
    setEditingEmployeeId("");
  };

  const addEmployee = async () => {
    try {
      const res = await api.post("/api/hr", {
        ...employeeForm,
        payRate: Number(employeeForm.payRate || 0),
      });

      alert(res.data.message);
      setEmployeeForm(emptyForm);
      await fetchHRData();
      setActiveTab("employees");
    } catch (error) {
      console.error(error);
      alert(error?.response?.data?.message || "Error adding employee");
    }
  };

  const updateEmployee = async () => {
    try {
      const res = await api.put(`/api/hr/${editingEmployeeId}`, {
        ...employeeForm,
        payRate: Number(employeeForm.payRate || 0),
      });

      alert(res.data.message);
      cancelEdit();
      await fetchHRData();
      setActiveTab("employees");
    } catch (error) {
      console.error(error);
      alert(error?.response?.data?.message || "Error updating employee");
    }
  };

  const updateEmployeeStatus = async (id, status) => {
    try {
      await api.put(`/api/hr/${id}/status`, {
        employmentStatus: status,
      });
      await fetchHRData();
    } catch (error) {
      console.error(error);
      alert(error?.response?.data?.message || "Status update failed");
    }
  };

  const submitLeaveRequest = async () => {
    try {
      const employeeIdToUse = isAdminHR
        ? leaveForm.employeeId
        : myEmployee?.employeeId || "";

      if (
        !employeeIdToUse ||
        !leaveForm.leaveType ||
        !leaveForm.startDate ||
        !leaveForm.endDate
      ) {
        alert("Please complete employee, leave type, start date, and end date.");
        return;
      }

      const payload = {
        ...leaveForm,
        employeeId: employeeIdToUse,
      };

      const res = await api.post("/api/leave-requests", payload);

      alert(res.data.message);
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
      const res = await api.put(
        `/api/leave-requests/${leaveRequestId}/approve`,
        {
          adminComment: leaveAdminComment,
        }
      );

      alert(res.data.message);
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

      alert(res.data.message);
      setLeaveAdminComment("");
      await fetchHRData();
    } catch (error) {
      console.error(error);
      alert(error?.response?.data?.message || "Failed to reject leave request");
    }
  };

  const filteredEmployees = useMemo(() => {
    return employees.filter((e) =>
      e.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [employees, searchTerm]);

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

  const showEmployeesTab = isAdminHR;
  const showAddEmployeeTab = isAdminHR;
  const showLeaveRequestsTab = isAdminHR;
  const showMyLeaveTab =
    permissions.includes("leaveSelfService") ||
    permissions.includes("hrSelfService") ||
    isAdminHR;

  return (
    <div style={{ backgroundColor: LIGHT_BG, minHeight: "100vh", padding: "20px" }}>
      <h1 style={{ color: ROYAL_BLUE, marginTop: 0 }}>
        {isAdminHR ? "HR Module" : "My HR"}
      </h1>

      {!isAdminHR && myEmployee && (
        <div
          style={{
            ...cardStyle,
            marginBottom: "20px",
            backgroundColor: "#eef4ff",
          }}
        >
          <div style={{ fontWeight: "bold", color: ROYAL_BLUE, fontSize: "18px" }}>
            {myEmployee.fullName}
          </div>
          <div style={{ color: MUTED, marginTop: "6px" }}>
            {myEmployee.jobTitle || "Employee"} • {myEmployee.employeeId}
          </div>
          <div style={{ color: MUTED, marginTop: "6px" }}>
            Vacation Leave: {Number(myEmployee.leaveBalanceVacation || 0)} days | Sick
            Leave: {Number(myEmployee.leaveBalanceSick || 0)} days | Unpaid Leave:{" "}
            {Number(myEmployee.leaveBalanceUnpaid || 0)} days
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
        {showEmployeesTab && (
          <button style={primaryButton} onClick={() => setActiveTab("employees")}>
            Employees
          </button>
        )}

        {showAddEmployeeTab && (
          <button style={primaryButton} onClick={() => setActiveTab("addEmployee")}>
            Add Employee
          </button>
        )}

        {showLeaveRequestsTab && (
          <button style={primaryButton} onClick={() => setActiveTab("leaveRequests")}>
            Leave Requests
          </button>
        )}

        {showMyLeaveTab && (
          <button style={primaryButton} onClick={() => setActiveTab("myLeave")}>
            My Leave
          </button>
        )}
      </div>

      {activeTab === "employees" && showEmployeesTab && (
        <div style={cardStyle}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "14px",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                backgroundColor: "#eef4ff",
                borderRadius: "12px",
                padding: "16px",
                border: `1px solid ${BORDER}`,
              }}
            >
              <div style={{ fontSize: "28px", fontWeight: "bold", color: ROYAL_BLUE }}>
                {summary?.totalEmployees || 0}
              </div>
              <div style={{ color: MUTED }}>Total Employees</div>
            </div>

            <div
              style={{
                backgroundColor: "#f0fdf4",
                borderRadius: "12px",
                padding: "16px",
                border: `1px solid ${BORDER}`,
              }}
            >
              <div style={{ fontSize: "28px", fontWeight: "bold", color: "#16a34a" }}>
                {summary?.activeEmployees || 0}
              </div>
              <div style={{ color: MUTED }}>Active</div>
            </div>

            <div
              style={{
                backgroundColor: "#fffbeb",
                borderRadius: "12px",
                padding: "16px",
                border: `1px solid ${BORDER}`,
              }}
            >
              <div style={{ fontSize: "28px", fontWeight: "bold", color: "#f59e0b" }}>
                {summary?.onLeaveEmployees || 0}
              </div>
              <div style={{ color: MUTED }}>On Leave</div>
            </div>

            <div
              style={{
                backgroundColor: "#fef2f2",
                borderRadius: "12px",
                padding: "16px",
                border: `1px solid ${BORDER}`,
              }}
            >
              <div style={{ fontSize: "28px", fontWeight: "bold", color: "#dc2626" }}>
                {summary?.terminatedEmployees || 0}
              </div>
              <div style={{ color: MUTED }}>Terminated</div>
            </div>
          </div>

          <input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: "10px",
              marginBottom: "15px",
              width: "100%",
              border: `1px solid ${BORDER}`,
              borderRadius: "8px",
            }}
          />

          <div style={{ overflowX: "auto" }}>
            <table width="100%" cellPadding="10" style={{ borderCollapse: "collapse" }}>
              <thead style={{ backgroundColor: "#eef4ff" }}>
                <tr>
                  <th align="left">Name</th>
                  <th align="left">Job</th>
                  <th align="left">Pay Rate</th>
                  <th align="left">Status</th>
                  <th align="left">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredEmployees.map((e) => (
                  <tr key={e.employeeId}>
                    <td>{e.fullName}</td>
                    <td>{e.jobTitle}</td>
                    <td>JMD {Number(e.payRate || 0).toLocaleString()}</td>
                    <td>{e.employmentStatus}</td>
                    <td>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <button style={primaryButton} onClick={() => loadEmployeeForEdit(e)}>
                          Edit
                        </button>

                        <button
                          style={successButton}
                          onClick={() => updateEmployeeStatus(e.employeeId, "Active")}
                        >
                          Active
                        </button>

                        <button
                          style={warningButton}
                          onClick={() => updateEmployeeStatus(e.employeeId, "On Leave")}
                        >
                          Leave
                        </button>

                        <button
                          style={secondaryButton}
                          onClick={() => updateEmployeeStatus(e.employeeId, "Inactive")}
                        >
                          Inactive
                        </button>

                        <button
                          style={dangerButton}
                          onClick={() => updateEmployeeStatus(e.employeeId, "Terminated")}
                        >
                          Terminate
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredEmployees.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center", padding: "20px", color: MUTED }}>
                      No employees found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "addEmployee" && showAddEmployeeTab && (
        <div style={cardStyle}>
          <h2 style={{ color: ROYAL_BLUE }}>
            {isEditing ? "Edit Employee" : "Add Employee"}
          </h2>

          <input
            name="fullName"
            placeholder="Full Name"
            value={employeeForm.fullName}
            onChange={handleEmployeeChange}
            style={{
              padding: "10px",
              marginBottom: "10px",
              width: "100%",
              border: `1px solid ${BORDER}`,
              borderRadius: "8px",
            }}
          />

          <input
            name="jobTitle"
            placeholder="Job Title"
            value={employeeForm.jobTitle}
            onChange={handleEmployeeChange}
            style={{
              padding: "10px",
              marginBottom: "10px",
              width: "100%",
              border: `1px solid ${BORDER}`,
              borderRadius: "8px",
            }}
          />

          <input
            name="payRate"
            placeholder="Pay Rate"
            value={employeeForm.payRate}
            onChange={handleEmployeeChange}
            style={{
              padding: "10px",
              marginBottom: "10px",
              width: "100%",
              border: `1px solid ${BORDER}`,
              borderRadius: "8px",
            }}
          />

          <div style={{ display: "flex", gap: "10px" }}>
            <button style={primaryButton} onClick={isEditing ? updateEmployee : addEmployee}>
              {isEditing ? "Update" : "Save"}
            </button>

            {isEditing && (
              <button style={secondaryButton} onClick={cancelEdit}>
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {activeTab === "leaveRequests" && showLeaveRequestsTab && (
        <div style={{ display: "grid", gap: "20px" }}>
          <div style={cardStyle}>
            <h2 style={{ color: ROYAL_BLUE, marginTop: 0 }}>Submit Leave Request</h2>

            <select
              name="employeeId"
              value={leaveForm.employeeId}
              onChange={handleLeaveChange}
              style={{
                padding: "10px",
                marginBottom: "10px",
                width: "100%",
                border: `1px solid ${BORDER}`,
                borderRadius: "8px",
              }}
            >
              <option value="">Select Employee</option>
              {employees.map((employee) => (
                <option key={employee.employeeId} value={employee.employeeId}>
                  {employee.fullName} ({employee.employeeId})
                </option>
              ))}
            </select>

            <select
              name="leaveType"
              value={leaveForm.leaveType}
              onChange={handleLeaveChange}
              style={{
                padding: "10px",
                marginBottom: "10px",
                width: "100%",
                border: `1px solid ${BORDER}`,
                borderRadius: "8px",
              }}
            >
              <option value="Vacation">Vacation</option>
              <option value="Sick">Sick</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Emergency">Emergency</option>
            </select>

            <input
              type="date"
              name="startDate"
              value={leaveForm.startDate}
              onChange={handleLeaveChange}
              style={{
                padding: "10px",
                marginBottom: "10px",
                width: "100%",
                border: `1px solid ${BORDER}`,
                borderRadius: "8px",
              }}
            />

            <input
              type="date"
              name="endDate"
              value={leaveForm.endDate}
              onChange={handleLeaveChange}
              style={{
                padding: "10px",
                marginBottom: "10px",
                width: "100%",
                border: `1px solid ${BORDER}`,
                borderRadius: "8px",
              }}
            />

            <textarea
              name="reason"
              placeholder="Reason"
              value={leaveForm.reason}
              onChange={handleLeaveChange}
              style={{
                padding: "10px",
                marginBottom: "10px",
                width: "100%",
                minHeight: "100px",
                border: `1px solid ${BORDER}`,
                borderRadius: "8px",
              }}
            />

            <button style={primaryButton} onClick={submitLeaveRequest}>
              Submit Leave Request
            </button>
          </div>

          <div style={cardStyle}>
            <h2 style={{ color: ROYAL_BLUE, marginTop: 0 }}>Leave Requests</h2>

            <textarea
              placeholder="Admin comment for approve/reject actions"
              value={leaveAdminComment}
              onChange={(e) => setLeaveAdminComment(e.target.value)}
              style={{
                padding: "10px",
                marginBottom: "15px",
                width: "100%",
                minHeight: "80px",
                border: `1px solid ${BORDER}`,
                borderRadius: "8px",
              }}
            />

            <div style={{ overflowX: "auto" }}>
              <table width="100%" cellPadding="10" style={{ borderCollapse: "collapse" }}>
                <thead style={{ backgroundColor: "#eef4ff" }}>
                  <tr>
                    <th align="left">Request ID</th>
                    <th align="left">Employee</th>
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
                    <tr key={request.leaveRequestId}>
                      <td>{request.leaveRequestId}</td>
                      <td>{request.employeeName}</td>
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
                      <td colSpan="8" style={{ textAlign: "center", padding: "20px", color: MUTED }}>
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

      {activeTab === "myLeave" && showMyLeaveTab && (
        <div style={{ display: "grid", gap: "20px" }}>
          <div style={cardStyle}>
            <h2 style={{ color: ROYAL_BLUE, marginTop: 0 }}>Submit My Leave Request</h2>

            {!myEmployee ? (
              <div style={{ color: "#dc2626", fontWeight: "bold" }}>
                Your account is not yet linked to an HR employee record. Please contact admin.
              </div>
            ) : (
              <>
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
                </div>

                <select
                  name="leaveType"
                  value={leaveForm.leaveType}
                  onChange={handleLeaveChange}
                  style={{
                    padding: "10px",
                    marginBottom: "10px",
                    width: "100%",
                    border: `1px solid ${BORDER}`,
                    borderRadius: "8px",
                  }}
                >
                  <option value="Vacation">Vacation</option>
                  <option value="Sick">Sick</option>
                  <option value="Unpaid">Unpaid</option>
                  <option value="Emergency">Emergency</option>
                </select>

                <input
                  type="date"
                  name="startDate"
                  value={leaveForm.startDate}
                  onChange={handleLeaveChange}
                  style={{
                    padding: "10px",
                    marginBottom: "10px",
                    width: "100%",
                    border: `1px solid ${BORDER}`,
                    borderRadius: "8px",
                  }}
                />

                <input
                  type="date"
                  name="endDate"
                  value={leaveForm.endDate}
                  onChange={handleLeaveChange}
                  style={{
                    padding: "10px",
                    marginBottom: "10px",
                    width: "100%",
                    border: `1px solid ${BORDER}`,
                    borderRadius: "8px",
                  }}
                />

                <textarea
                  name="reason"
                  placeholder="Reason"
                  value={leaveForm.reason}
                  onChange={handleLeaveChange}
                  style={{
                    padding: "10px",
                    marginBottom: "10px",
                    width: "100%",
                    minHeight: "100px",
                    border: `1px solid ${BORDER}`,
                    borderRadius: "8px",
                  }}
                />

                <button style={primaryButton} onClick={submitLeaveRequest}>
                  Submit My Leave Request
                </button>
              </>
            )}
          </div>

          <div style={cardStyle}>
            <h2 style={{ color: ROYAL_BLUE, marginTop: 0 }}>My Leave Requests</h2>

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
                    <tr key={request.leaveRequestId}>
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