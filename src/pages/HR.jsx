import { useEffect, useMemo, useState } from "react";
import api from "../api";

function HR() {
  const [activeTab, setActiveTab] = useState("employees");
  const [employees, setEmployees] = useState([]);
  const [systemUsers, setSystemUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState("");

  const ROYAL_BLUE = "#0B3D91";
  const GOLD = "#D4AF37";
  const WHITE = "#FFFFFF";
  const LIGHT_BG = "#f4f7fb";
  const BORDER = "#dbe3ef";
  const MUTED = "#64748b";

  const emptyForm = {
    fullName: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    trn: "",
    nisNumber: "",
    department: "Operations",
    jobTitle: "",
    branch: "Eltham Park Mainstore",
    employmentType: "Temporary",
    startDate: "",
    employmentStatus: "Active",
    payType: "Monthly Salary",
    payRate: "",
    linkedUserId: "",
    leaveBalanceVacation: "",
    leaveBalanceSick: "",
    leaveBalanceUnpaid: "",
    notes: "",
  };

  const [employeeForm, setEmployeeForm] = useState(emptyForm);

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
    padding: "10px 16px",
    borderRadius: "8px",
    fontWeight: "bold",
    cursor: "pointer",
  };

  const inputStyle = {
    padding: "10px",
    borderRadius: "8px",
    border: `1px solid ${BORDER}`,
    width: "100%",
  };

  const fetchData = async () => {
    try {
      const [empRes, userRes] = await Promise.all([
        api.get("/api/hr"),
        api.get("/api/system-users"),
      ]);

      setEmployees(empRes.data.data || []);
      setSystemUsers(userRes.data.data || []);
    } catch {
      alert("Failed to load data");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEmployeeForm((prev) => ({ ...prev, [name]: value }));
  };

  const loadEmployeeForEdit = (e) => {
    setEmployeeForm({
      ...emptyForm,
      ...e,
    });
    setEditingEmployeeId(e.employeeId);
    setIsEditing(true);
    setActiveTab("add");
  };

  const saveEmployee = async () => {
    try {
      if (!employeeForm.fullName || !employeeForm.jobTitle) {
        alert("Full name and job title required");
        return;
      }

      if (isEditing) {
        await api.put(`/api/hr/${editingEmployeeId}`, employeeForm);
        alert("Employee updated");
      } else {
        await api.post("/api/hr", employeeForm);
        alert("Employee added");
      }

      setEmployeeForm(emptyForm);
      setIsEditing(false);
      fetchData();
      setActiveTab("employees");
    } catch (err) {
      alert(err?.response?.data?.message || "Error");
    }
  };

  const filteredEmployees = useMemo(() => {
    return employees.filter((e) =>
      e.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [employees, searchTerm]);

  return (
    <div style={{ padding: "20px", backgroundColor: LIGHT_BG }}>
      <h1 style={{ color: ROYAL_BLUE }}>HR Module</h1>

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <button style={primaryButton} onClick={() => setActiveTab("employees")}>
          Employees
        </button>
        <button style={primaryButton} onClick={() => setActiveTab("add")}>
          Add Employee
        </button>
      </div>

      {activeTab === "employees" && (
        <div style={cardStyle}>
          <input
            placeholder="Search..."
            style={inputStyle}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <table width="100%" style={{ marginTop: "20px" }}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Job</th>
                <th>Pay</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((e) => (
                <tr key={e.employeeId}>
                  <td>{e.fullName}</td>
                  <td>{e.jobTitle}</td>
                  <td>JMD {e.payRate}</td>
                  <td>
                    <button onClick={() => loadEmployeeForEdit(e)}>
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "add" && (
        <div style={cardStyle}>
          <h2>{isEditing ? "Edit Employee" : "Add Employee"}</h2>

          <h3>Personal Info</h3>
          <input name="fullName" placeholder="Full Name" style={inputStyle} value={employeeForm.fullName} onChange={handleChange} />
          <input name="email" placeholder="Email" style={inputStyle} value={employeeForm.email} onChange={handleChange} />
          <input name="phone" placeholder="Phone" style={inputStyle} value={employeeForm.phone} onChange={handleChange} />
          <input name="address" placeholder="Address" style={inputStyle} value={employeeForm.address} onChange={handleChange} />
          <input name="trn" placeholder="TRN" style={inputStyle} value={employeeForm.trn} onChange={handleChange} />
          <input name="nisNumber" placeholder="NIS Number" style={inputStyle} value={employeeForm.nisNumber} onChange={handleChange} />

          <h3>Employment</h3>
          <input name="jobTitle" placeholder="Job Title" style={inputStyle} value={employeeForm.jobTitle} onChange={handleChange} />
          <input name="department" placeholder="Department" style={inputStyle} value={employeeForm.department} onChange={handleChange} />
          <input name="branch" placeholder="Branch" style={inputStyle} value={employeeForm.branch} onChange={handleChange} />

          <h3>Payroll</h3>
          <input name="payRate" placeholder="Pay Rate" style={inputStyle} value={employeeForm.payRate} onChange={handleChange} />

          <h3>System Link</h3>
          <select name="linkedUserId" style={inputStyle} value={employeeForm.linkedUserId} onChange={handleChange}>
            <option value="">Select System User</option>
            {systemUsers.map((u) => (
              <option key={u.userId} value={u.userId}>
                {u.fullName} ({u.userId})
              </option>
            ))}
          </select>

          <h3>Leave Balances</h3>
          <input name="leaveBalanceVacation" placeholder="Vacation Days" style={inputStyle} value={employeeForm.leaveBalanceVacation} onChange={handleChange} />
          <input name="leaveBalanceSick" placeholder="Sick Days" style={inputStyle} value={employeeForm.leaveBalanceSick} onChange={handleChange} />

          <h3>Notes</h3>
          <textarea name="notes" style={inputStyle} value={employeeForm.notes} onChange={handleChange} />

          <br /><br />

          <button style={primaryButton} onClick={saveEmployee}>
            {isEditing ? "Update Employee" : "Save Employee"}
          </button>
        </div>
      )}
    </div>
  );
}

export default HR;