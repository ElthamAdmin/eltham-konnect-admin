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
    } catch {
      alert("Failed to load HR data");
    }
  };

  useEffect(() => {
    fetchHRData();
  }, []);

  const handleEmployeeChange = (e) => {
    const { name, value } = e.target;
    setEmployeeForm((prev) => ({ ...prev, [name]: value }));
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
      fetchHRData();
      setActiveTab("employees");
    } catch {
      alert("Error adding employee");
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
      fetchHRData();
      setActiveTab("employees");
    } catch {
      alert("Error updating employee");
    }
  };

  const updateEmployeeStatus = async (id, status) => {
    await api.put(`/api/hr/${id}/status`, {
      employmentStatus: status,
    });
    fetchHRData();
  };

  const filteredEmployees = useMemo(() => {
    return employees.filter((e) =>
      e.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [employees, searchTerm]);

  return (
    <div style={{ backgroundColor: LIGHT_BG, minHeight: "100vh", padding: "20px" }}>
      <h1 style={{ color: ROYAL_BLUE }}>HR Module</h1>

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <button style={primaryButton} onClick={() => setActiveTab("employees")}>
          Employees
        </button>
        <button style={primaryButton} onClick={() => setActiveTab("addEmployee")}>
          Add Employee
        </button>
      </div>

      {activeTab === "employees" && (
        <div style={cardStyle}>
          <input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: "10px", marginBottom: "15px", width: "100%" }}
          />

          <table width="100%" cellPadding="10" style={{ borderCollapse: "collapse" }}>
            <thead style={{ backgroundColor: "#eef4ff" }}>
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
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button style={primaryButton} onClick={() => loadEmployeeForEdit(e)}>
                        Edit
                      </button>

                      <button
                        style={primaryButton}
                        onClick={() => updateEmployeeStatus(e.employeeId, "Active")}
                      >
                        Active
                      </button>

                      <button
                        style={secondaryButton}
                        onClick={() => updateEmployeeStatus(e.employeeId, "Inactive")}
                      >
                        Inactive
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "addEmployee" && (
        <div style={cardStyle}>
          <h2 style={{ color: ROYAL_BLUE }}>
            {isEditing ? "Edit Employee" : "Add Employee"}
          </h2>

          <input
            name="fullName"
            placeholder="Full Name"
            value={employeeForm.fullName}
            onChange={handleEmployeeChange}
            style={{ padding: "10px", marginBottom: "10px", width: "100%" }}
          />

          <input
            name="jobTitle"
            placeholder="Job Title"
            value={employeeForm.jobTitle}
            onChange={handleEmployeeChange}
            style={{ padding: "10px", marginBottom: "10px", width: "100%" }}
          />

          <input
            name="payRate"
            placeholder="Pay Rate"
            value={employeeForm.payRate}
            onChange={handleEmployeeChange}
            style={{ padding: "10px", marginBottom: "10px", width: "100%" }}
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
    </div>
  );
}

export default HR;