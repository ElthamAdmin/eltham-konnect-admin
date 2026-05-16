import { useEffect, useState } from "react";
import api from "../api";

const ALL_MODULES = [
  { key: "dashboard", label: "Dashboard" },
  { key: "pos", label: "POS" },
  { key: "customers", label: "Customers" },
  { key: "manifests", label: "Manifests" },
  { key: "packages", label: "Packages" },
  { key: "invoices", label: "Invoices" },
  { key: "prealerts", label: "PreAlerts" },
  { key: "support", label: "Support" },
  { key: "finance", label: "Finance" },
  { key: "chartAccounts", label: "Chart Accounts" },
  { key: "journalEntries", label: "Journal Entries" },
  { key: "generalLedger", label: "General Ledger" },
  { key: "trialBalance", label: "Trial Balance" },
  { key: "profitLoss", label: "Profit & Loss" },
  { key: "balanceSheet", label: "Balance Sheet" },
  { key: "closePeriod", label: "Close Period" },
  { key: "accountsReceivable", label: "Accounts Receivable" },
  { key: "accountsPayable", label: "Accounts Payable" },
  { key: "banking", label: "Banking" },
  { key: "cashFlow", label: "Cash Flow" },
  { key: "fixedAssets", label: "Fixed Assets" },
  { key: "taxCenter", label: "Tax Center" },
  { key: "budgeting", label: "Budgeting" },
  { key: "exports", label: "Exports" },
  { key: "accountingPeriods", label: "Accounting Periods" },
  { key: "fiscalYears", label: "Fiscal Years" },
  { key: "limitedLiabilitySetup", label: "Limited Liability Setup" },
  { key: "debtManager", label: "Debt Manager" },
  { key: "hr", label: "HR" },
  { key: "noticeBoard", label: "Notice Board" },
  { key: "communication", label: "Communication" },
  { key: "teamHub", label: "Team Hub" },
  { key: "marketing", label: "Marketing" },
  { key: "rewards", label: "Rewards" },
  { key: "analytics", label: "Analytics" },
  { key: "amazon", label: "Amazon" },
  { key: "users", label: "Users" },
  { key: "duty", label: "Duty" },
  { key: "audit", label: "Audit" },
  { key: "integrations", label: "Integrations" },
  { key: "freightPartners", label: "Freight Partners" },
  { key: "unmatched", label: "Unmatched" },
  { key: "settings", label: "Settings" },
  { key: "warehouse", label: "Warehouse" },
  { key: "pointsHistory", label: "Points History" },
  { key: "points", label: "Points" },
  { key: "referrals", label: "Referrals" },
  { key: "hrSelfService", label: "HR Self Service" },
  { key: "leaveSelfService", label: "Leave Self Service" },
  { key: "documentSelfService", label: "Document Self Service" },
  { key: "payslipSelfService", label: "Payslip Self Service" },
];

function SystemUsers() {
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    role: "Support",
    branch: "Eltham Park",
    status: "Active",
    password: "",
    permissions: ["dashboard"],
    linkedEmployeeId: "",
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/system-users");
      setUsers(res.data.data || []);
    } catch (error) {
      console.error("Error loading system users:", error);
      alert(error?.response?.data?.message || "Could not load system users.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "role") {
      if (value === "Admin") {
        setFormData((prev) => ({
          ...prev,
          role: value,
          permissions: ALL_MODULES.map((module) => module.key),
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          role: value,
          permissions:
            prev.role === "Admin"
              ? ["dashboard"]
              : prev.permissions.length > 0
              ? prev.permissions
              : ["dashboard"],
        }));
      }
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const togglePermission = (permissionKey) => {
    if (formData.role === "Admin") return;

    const exists = formData.permissions.includes(permissionKey);

    const updatedPermissions = exists
      ? formData.permissions.filter((item) => item !== permissionKey)
      : [...formData.permissions, permissionKey];

    setFormData((prev) => ({
      ...prev,
      permissions: updatedPermissions,
    }));
  };

  const createUser = async () => {
    try {
      if (!formData.fullName || !formData.email || !formData.role || !formData.password) {
        alert("Please complete full name, email, role, and password.");
        return;
      }

      if (formData.role !== "Admin" && formData.permissions.length === 0) {
        alert("Please select at least one module permission for this staff member.");
        return;
      }

      const payload = {
        ...formData,
        permissions:
          formData.role === "Admin"
            ? ALL_MODULES.map((module) => module.key)
            : formData.permissions,
      };

      const res = await api.post("/api/system-users", payload);

      alert(res.data.message);

      setFormData({
        fullName: "",
        email: "",
        phone: "",
        role: "Support",
        branch: "Eltham Park",
        status: "Active",
        password: "",
        permissions: ["dashboard"],
        linkedEmployeeId: "",
      });

      setShowForm(false);
      await fetchUsers();
    } catch (error) {
      console.error("Error creating system user:", error);
      alert(error?.response?.data?.message || "Could not create system user.");
    }
  };

  const updateStatus = async (userId, status) => {
    try {
      const res = await api.put(`/api/system-users/${userId}/status`, { status });
      alert(res.data.message);
      await fetchUsers();
    } catch (error) {
      console.error("Error updating system user status:", error);
      alert(error?.response?.data?.message || "Could not update user status.");
    }
  };

  const updateRole = async (user) => {
    const newRole = prompt(
      "Enter new role (Admin, Manager, Warehouse, Support, Finance, Marketing, FrontDesk):",
      user.role
    );

    if (!newRole) return;

    try {
      const res = await api.put(`/api/system-users/${user.userId}/role`, {
        role: newRole,
      });

      alert(res.data.message);
      await fetchUsers();
    } catch (error) {
      console.error("Error updating system user role:", error);
      alert(error?.response?.data?.message || "Could not update user role.");
    }
  };

  const updatePermissions = async (user) => {
    if (user.role === "Admin") {
      alert("Admin automatically has access to all modules.");
      return;
    }

    const currentPermissions = user.permissions || [];

    const entered = prompt(
      `Enter permissions separated by commas.\n\nAvailable keys:\n${ALL_MODULES.map((item) => item.key).join(", ")}\n\nCurrent:\n${currentPermissions.join(", ")}`,
      currentPermissions.join(", ")
    );

    if (entered === null) return;

    const permissions = entered
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    try {
      const res = await api.put(`/api/system-users/${user.userId}/permissions`, {
        permissions,
      });

      alert(res.data.message);
      await fetchUsers();
    } catch (error) {
      console.error("Error updating permissions:", error);
      alert(error?.response?.data?.message || "Could not update permissions.");
    }
  };

  const resetPassword = async (user) => {
    const newPassword = prompt(`Enter a new password for ${user.fullName}:`, "");

    if (!newPassword) return;

    try {
      const res = await api.put(`/api/system-users/${user.userId}/reset-password`, {
        password: newPassword,
      });

      alert(res.data.message);
    } catch (error) {
      console.error("Error resetting password:", error);
      alert(error?.response?.data?.message || "Could not reset password.");
    }
  };

  const badgeStyle = (value, type = "status") => {
    let backgroundColor = "#64748b";

    if (type === "status") {
      backgroundColor = value === "Active" ? "#16a34a" : "#dc2626";
    }

    if (type === "role") {
      if (value === "Admin") backgroundColor = "#0B3D91";
      else if (value === "Manager") backgroundColor = "#7c3aed";
      else if (value === "Warehouse") backgroundColor = "#f59e0b";
      else if (value === "Support") backgroundColor = "#0891b2";
      else if (value === "Finance") backgroundColor = "#16a34a";
      else if (value === "Marketing") backgroundColor = "#db2777";
      else if (value === "FrontDesk") backgroundColor = "#ea580c";
    }

    return (
      <span
        style={{
          padding: "4px 10px",
          borderRadius: "6px",
          color: "white",
          backgroundColor,
          fontSize: "13px",
        }}
      >
        {value}
      </span>
    );
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h1>System Users</h1>

        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            backgroundColor: "#0B3D91",
            color: "white",
            border: "none",
            padding: "10px 16px",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          {showForm ? "Close Form" : "+ Add User"}
        </button>
      </div>

      {showForm && (
        <div
          style={{
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "10px",
            border: "1px solid #e5e7eb",
            marginBottom: "20px",
          }}
        >
          <h2>Create System User</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "15px",
            }}
          >
            <input
              type="text"
              name="fullName"
              placeholder="Full Name"
              value={formData.fullName}
              onChange={handleChange}
              style={{ padding: "10px" }}
            />

            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              style={{ padding: "10px" }}
            />

            <input
              type="text"
              name="phone"
              placeholder="Phone"
              value={formData.phone}
              onChange={handleChange}
              style={{ padding: "10px" }}
            />

            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              style={{ padding: "10px" }}
            />

            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              style={{ padding: "10px" }}
            >
              <option value="Admin">Admin</option>
              <option value="Manager">Manager</option>
              <option value="Warehouse">Warehouse</option>
              <option value="Support">Support</option>
              <option value="Finance">Finance</option>
              <option value="Marketing">Marketing</option>
              <option value="FrontDesk">FrontDesk</option>
            </select>

            <input
              type="text"
              name="branch"
              placeholder="Branch"
              value={formData.branch}
              onChange={handleChange}
              style={{ padding: "10px" }}
            />

            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              style={{ padding: "10px" }}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>

            <input
              type="text"
              name="linkedEmployeeId"
              placeholder="Linked Employee ID (optional)"
              value={formData.linkedEmployeeId}
              onChange={handleChange}
              style={{ padding: "10px" }}
            />
          </div>

          <div
            style={{
              marginTop: "20px",
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              padding: "16px",
            }}
          >
            <h3 style={{ marginTop: 0 }}>Module Access</h3>

            {formData.role === "Admin" ? (
              <div
                style={{
                  backgroundColor: "#dbeafe",
                  color: "#1e3a8a",
                  padding: "12px",
                  borderRadius: "8px",
                  fontWeight: "bold",
                }}
              >
                Admin automatically has full access to all modules.
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "10px",
                }}
              >
                {ALL_MODULES.map((module) => (
                  <label
                    key={module.key}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      padding: "10px",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={formData.permissions.includes(module.key)}
                      onChange={() => togglePermission(module.key)}
                    />
                    <span>{module.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={createUser}
            style={{
              marginTop: "20px",
              backgroundColor: "#16a34a",
              color: "white",
              border: "none",
              padding: "10px 16px",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Save User
          </button>
        </div>
      )}

      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "10px",
          border: "1px solid #e5e7eb",
        }}
      >
        <h2>All System Users</h2>

        {loading ? (
          <div style={{ color: "#64748b" }}>Loading users...</div>
        ) : (
          <div
  style={{
    overflowX: "auto",
    overflowY: "auto",
    maxHeight: "75vh",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
  }}
>
  <table
    border="1"
    cellPadding="10"
    style={{
      minWidth: "1500px",
      width: "100%",
      borderCollapse: "collapse",
    }}
  >
    <thead style={{ backgroundColor: "#eef4ff", position: "sticky", top: 0, zIndex: 2 }}>
      <tr>
        <th>User ID</th>
        <th>Full Name</th>
        <th>Email</th>
        <th>Phone</th>
        <th>Role</th>
        <th>Branch</th>
        <th>Status</th>
        <th>Permissions</th>
        <th>Linked Employee</th>
        <th
          style={{
            position: "sticky",
            right: 0,
            backgroundColor: "#eef4ff",
            zIndex: 3,
            minWidth: "170px",
          }}
        >
          Actions
        </th>
      </tr>
    </thead>

    <tbody>
      {users.length > 0 ? (
        users.map((user, index) => (
          <tr key={user._id || index}>
            <td>{user.userId}</td>
            <td>{user.fullName}</td>
            <td>{user.email}</td>
            <td>{user.phone}</td>
            <td>{badgeStyle(user.role, "role")}</td>
            <td>{user.branch}</td>
            <td>{badgeStyle(user.status, "status")}</td>
            <td>
              <div style={{ fontSize: "12px", lineHeight: "1.5", maxWidth: "220px" }}>
                {(user.permissions || []).join(", ")}
              </div>
            </td>
            <td>{user.linkedEmployeeId || "-"}</td>
            <td
              style={{
                position: "sticky",
                right: 0,
                backgroundColor: "white",
                zIndex: 1,
                minWidth: "170px",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <button onClick={() => updateRole(user)} style={actionButton("#0B3D91")}>
                  Change Role
                </button>

                <button onClick={() => updatePermissions(user)} style={actionButton("#7c3aed")}>
                  Update Permissions
                </button>

                <button onClick={() => resetPassword(user)} style={actionButton("#ea580c")}>
                  Reset Password
                </button>

                {user.status === "Active" ? (
                  <button onClick={() => updateStatus(user.userId, "Inactive")} style={actionButton("#dc2626")}>
                    Deactivate
                  </button>
                ) : (
                  <button onClick={() => updateStatus(user.userId, "Active")} style={actionButton("#16a34a")}>
                    Activate
                  </button>
                )}
              </div>
            </td>
          </tr>
        ))
      ) : (
        <tr>
          <td colSpan="10">No system users found.</td>
        </tr>
      )}
    </tbody>
  </table>
</div>
        )}
      </div>
    </div>
  );
}

function actionButton(backgroundColor) {
  return {
    backgroundColor,
    color: "white",
    border: "none",
    padding: "6px 10px",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
    whiteSpace: "nowrap",
  };
}

export default SystemUsers;