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

  const emptyForm = {
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
  };

  const [employeeForm, setEmployeeForm] = useState(emptyForm);

  const ROYAL_BLUE = "#0B3D91";
  const WHITE = "#FFFFFF";
  const BORDER = "#dbe3ef";

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
      alert("Failed to load HR data");
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
      ...emptyForm,
      ...employee,
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
      const payload = {
        ...employeeForm,
        payRate: Number(employeeForm.payRate || 0),
      };

      const res = await api.post("/api/hr", payload);
      alert(res.data.message);

      setEmployeeForm(emptyForm);
      await fetchHRData();
      setActiveTab("employees");
    } catch {
      alert("Error adding employee");
    }
  };

  const updateEmployee = async () => {
    try {
      const payload = {
        ...employeeForm,
        payRate: Number(employeeForm.payRate || 0),
      };

      const res = await api.put(`/api/hr/${editingEmployeeId}`, payload);
      alert(res.data.message);

      cancelEdit();
      await fetchHRData();
      setActiveTab("employees");
    } catch {
      alert("Error updating employee");
    }
  };

  const updateEmployeeStatus = async (employeeId, status) => {
    try {
      await api.put(`/api/hr/${employeeId}/status`, {
        employmentStatus: status,
      });
      fetchHRData();
    } catch {
      alert("Status update failed");
    }
  };

  const filteredEmployees = useMemo(() => {
    return employees.filter((e) =>
      e.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [employees, searchTerm]);

  return (
    <div>
      <h1>HR Module</h1>

      <button onClick={() => setActiveTab("employees")}>Employees</button>
      <button onClick={() => setActiveTab("addEmployee")}>
        Add Employee
      </button>

      {activeTab === "employees" && (
        <div>
          <input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <table border="1" cellPadding="10">
            <thead>
              <tr>
                <th>Name</th>
                <th>Job</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredEmployees.map((e) => (
                <tr key={e.employeeId}>
                  <td>{e.fullName}</td>
                  <td>{e.jobTitle}</td>
                  <td>{e.employmentStatus}</td>
                  <td>
                    <button onClick={() => loadEmployeeForEdit(e)}>
                      Edit
                    </button>

                    <button
                      onClick={() =>
                        updateEmployeeStatus(e.employeeId, "Active")
                      }
                    >
                      Active
                    </button>

                    <button
                      onClick={() =>
                        updateEmployeeStatus(e.employeeId, "Inactive")
                      }
                    >
                      Inactive
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "addEmployee" && (
        <div>
          <h2>{isEditing ? "Edit Employee" : "Add Employee"}</h2>

          <input
            name="fullName"
            placeholder="Full Name"
            value={employeeForm.fullName}
            onChange={handleEmployeeChange}
          />

          <input
            name="jobTitle"
            placeholder="Job Title"
            value={employeeForm.jobTitle}
            onChange={handleEmployeeChange}
          />

          <input
            name="payRate"
            placeholder="Pay Rate"
            value={employeeForm.payRate}
            onChange={handleEmployeeChange}
          />

          <br />

          <button onClick={isEditing ? updateEmployee : addEmployee}>
            {isEditing ? "Update" : "Save"}
          </button>

          {isEditing && <button onClick={cancelEdit}>Cancel</button>}
        </div>
      )}
    </div>
  );
}

export default HR;