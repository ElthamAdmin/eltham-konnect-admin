import { useEffect, useMemo, useState } from "react";
import api from "../api";

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    branch: "",
    address: "",
    pointsBalance: 0,
    signUpDate: "",
    lastActivityDate: "",
    status: "Active",
  });

  const fetchCustomers = async () => {
    try {
      const res = await api.get("/api/customers");
      setCustomers(res.data.data || []);
    } catch (error) {
      console.error("Error loading customers:", error);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: name === "pointsBalance" ? Number(value) : value,
    });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      branch: "",
      address: "",
      pointsBalance: 0,
      signUpDate: "",
      lastActivityDate: "",
      status: "Active",
    });
    setEditingCustomer(null);
    setShowForm(false);
  };

  const handleSubmit = async () => {
    try {
      if (!formData.name || !formData.email || !formData.phone || !formData.branch) {
        alert("Please fill in name, email, phone, and branch.");
        return;
      }

      if (editingCustomer) {
        await api.put(`/api/customers/${editingCustomer.ekonId}`, formData);
        alert("Customer updated successfully.");
      } else {
        await api.post("/api/customers", formData);
        alert("Customer saved successfully.");
      }

      await fetchCustomers();
      resetForm();
    } catch (error) {
      console.error("Error saving customer:", error);
      alert(error?.response?.data?.message || "Customer was not saved.");
    }
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name || "",
      email: customer.email || "",
      phone: customer.phone || "",
      branch: customer.branch || "",
      address: customer.address || "",
      pointsBalance: customer.pointsBalance || 0,
      signUpDate: customer.signUpDate || "",
      lastActivityDate: customer.lastActivityDate || "",
      status: customer.status || "Active",
    });
    setShowForm(true);
  };

  const handleResetPassword = async (customer) => {
    const newPassword = prompt(
      `Enter a new password for ${customer.name} (${customer.ekonId}):`,
      ""
    );

    if (!newPassword) return;

    try {
      const res = await api.put(
        `/api/customers/${customer.ekonId}/reset-password`,
        { password: newPassword }
      );

      alert(res.data.message);
    } catch (error) {
      console.error("Error resetting customer password:", error);
      alert(error?.response?.data?.message || "Could not reset customer password.");
    }
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) =>
      `${customer.name} ${customer.ekonId} ${customer.email} ${customer.phone} ${customer.branch}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  }, [customers, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex);

  const formatDate = (value) => {
    if (!value) return "";
    try {
      return String(value).slice(0, 10);
    } catch {
      return value;
    }
  };

  const paginationControls = (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "15px",
        gap: "12px",
        flexWrap: "wrap",
        backgroundColor: "white",
        padding: "12px 14px",
        borderRadius: "8px",
        border: "1px solid #ddd",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
        <strong>
          Showing {filteredCustomers.length === 0 ? 0 : startIndex + 1} to{" "}
          {Math.min(endIndex, filteredCustomers.length)} of {filteredCustomers.length}
        </strong>

        <select
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
          style={{
            padding: "8px 10px",
            borderRadius: "6px",
            border: "1px solid #ccc",
          }}
        >
          <option value={10}>10 per page</option>
          <option value={25}>25 per page</option>
          <option value={50}>50 per page</option>
          <option value={100}>100 per page</option>
        </select>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={safeCurrentPage === 1}
          style={{
            backgroundColor: safeCurrentPage === 1 ? "#94a3b8" : "#0B3D91",
            color: "white",
            border: "none",
            padding: "8px 12px",
            borderRadius: "6px",
            cursor: safeCurrentPage === 1 ? "not-allowed" : "pointer",
          }}
        >
          Previous
        </button>

        <span style={{ fontWeight: "bold" }}>
          Page {safeCurrentPage} of {totalPages}
        </span>

        <button
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={safeCurrentPage === totalPages}
          style={{
            backgroundColor: safeCurrentPage === totalPages ? "#94a3b8" : "#0B3D91",
            color: "white",
            border: "none",
            padding: "8px 12px",
            borderRadius: "6px",
            cursor: safeCurrentPage === totalPages ? "not-allowed" : "pointer",
          }}
        >
          Next
        </button>
      </div>
    </div>
  );

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <h1>Customers</h1>

        <button
          onClick={() => {
            if (showForm && !editingCustomer) {
              setShowForm(false);
            } else {
              setEditingCustomer(null);
              setShowForm(!showForm);
            }
          }}
          style={{
            backgroundColor: "#0B3D91",
            color: "white",
            border: "none",
            padding: "10px 16px",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          {showForm ? "Close Form" : "+ Add Customer"}
        </button>
      </div>

      {showForm && (
        <div
          style={{
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "8px",
            marginBottom: "20px",
            border: "1px solid #ddd",
          }}
        >
          <h2>{editingCustomer ? "Edit Customer" : "New Customer"}</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "15px",
            }}
          >
            <input
              type="text"
              name="name"
              placeholder="Customer Name"
              value={formData.name}
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
              type="text"
              name="branch"
              placeholder="Branch"
              value={formData.branch}
              onChange={handleChange}
              style={{ padding: "10px" }}
            />

            <input
              type="text"
              name="address"
              placeholder="Address"
              value={formData.address}
              onChange={handleChange}
              style={{ padding: "10px" }}
            />

            <input
              type="number"
              name="pointsBalance"
              placeholder="Points Balance"
              value={formData.pointsBalance}
              onChange={handleChange}
              style={{ padding: "10px" }}
            />

            <input
              type="date"
              name="signUpDate"
              value={formData.signUpDate ? formData.signUpDate.slice(0, 10) : ""}
              onChange={handleChange}
              style={{ padding: "10px" }}
            />

            <input
              type="date"
              name="lastActivityDate"
              value={formData.lastActivityDate ? formData.lastActivityDate.slice(0, 10) : ""}
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
          </div>

          <div style={{ marginTop: "20px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              onClick={handleSubmit}
              style={{
                backgroundColor: "#D4AF37",
                color: "black",
                border: "none",
                padding: "10px 16px",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              {editingCustomer ? "Update Customer" : "Save Customer"}
            </button>

            <button
              onClick={resetForm}
              style={{
                backgroundColor: "#64748b",
                color: "white",
                border: "none",
                padding: "10px 16px",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <input
        type="text"
        placeholder="Search customers by name, EKON ID, or email"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{
          width: "100%",
          padding: "12px",
          marginBottom: "20px",
          borderRadius: "6px",
          border: "1px solid #ccc",
        }}
      />

      {paginationControls}

      <div style={{ overflowX: "auto" }}>
        <table border="1" cellPadding="10" style={{ minWidth: "1500px", width: "100%" }}>
          <thead>
            <tr>
              <th>EKON ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Branch</th>
              <th>Address</th>
              <th>Points</th>
              <th>Sign Up Date</th>
              <th>Last Activity</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginatedCustomers.length > 0 ? (
              paginatedCustomers.map((customer, index) => (
                <tr key={customer._id || index}>
                  <td>{customer.ekonId}</td>
                  <td>{customer.name}</td>
                  <td>{customer.email}</td>
                  <td>{customer.phone}</td>
                  <td>{customer.branch}</td>
                  <td>{customer.address || ""}</td>
                  <td>{customer.pointsBalance || 0}</td>
                  <td>{formatDate(customer.signUpDate)}</td>
                  <td>{formatDate(customer.lastActivityDate)}</td>
                  <td>{customer.status}</td>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <button
                        onClick={() => handleEdit(customer)}
                        style={{
                          backgroundColor: "#0B3D91",
                          color: "white",
                          border: "none",
                          padding: "6px 10px",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleResetPassword(customer)}
                        style={{
                          backgroundColor: "#ea580c",
                          color: "white",
                          border: "none",
                          padding: "6px 10px",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        Reset Password
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="11">No customers found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: "15px" }}>{paginationControls}</div>
    </div>
  );
}

export default Customers;