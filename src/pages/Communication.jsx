import { useEffect, useMemo, useState } from "react";
import api from "../api";

function Communication() {
  const [logs, setLogs] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    recipientMode: "single",
    customerEkonId: "",
    selectedCustomerEkonIds: [],
    channel: "Email",
    subject: "",
    message: "",
  });

  const fetchLogs = async () => {
    try {
      setLoadingLogs(true);
      const res = await api.get("/api/communication");
      setLogs(res.data.data || []);
    } catch (error) {
      console.error("Error loading communication logs:", error);
      alert(
        error?.response?.data?.message ||
          error?.message ||
          "Could not load communication logs."
      );
      setLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      setLoadingCustomers(true);
      const res = await api.get("/api/customers");
      setCustomers(res.data.data || []);
    } catch (error) {
      console.error("Error loading customers:", error);
      alert(
        error?.response?.data?.message ||
          error?.message ||
          "Could not load customers."
      );
      setCustomers([]);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const fetchPageData = async () => {
    await Promise.all([fetchLogs(), fetchCustomers()]);
  };

  useEffect(() => {
    fetchPageData();
  }, []);

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) =>
      `${customer.ekonId} ${customer.name} ${customer.email || ""} ${customer.phone || ""}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  }, [customers, searchTerm]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRecipientModeChange = (e) => {
    const recipientMode = e.target.value;

    setFormData((prev) => ({
      ...prev,
      recipientMode,
      customerEkonId: "",
      selectedCustomerEkonIds: [],
    }));
  };

  const handleSelectedCustomerToggle = (ekonId) => {
    setFormData((prev) => {
      const alreadySelected = prev.selectedCustomerEkonIds.includes(ekonId);

      return {
        ...prev,
        selectedCustomerEkonIds: alreadySelected
          ? prev.selectedCustomerEkonIds.filter((id) => id !== ekonId)
          : [...prev.selectedCustomerEkonIds, ekonId],
      };
    });
  };

  const handleSelectAllFiltered = () => {
    const filteredIds = filteredCustomers.map((customer) => customer.ekonId);

    setFormData((prev) => ({
      ...prev,
      selectedCustomerEkonIds: filteredIds,
    }));
  };

  const handleClearSelected = () => {
    setFormData((prev) => ({
      ...prev,
      selectedCustomerEkonIds: [],
    }));
  };

  const saveCommunication = async () => {
    try {
      if (!formData.channel || !formData.subject || !formData.message) {
        alert("Please complete channel, subject, and message.");
        return;
      }

      if (
        formData.recipientMode === "single" &&
        !formData.customerEkonId
      ) {
        alert("Please select one customer.");
        return;
      }

      if (
        formData.recipientMode === "selected" &&
        formData.selectedCustomerEkonIds.length === 0
      ) {
        alert("Please select at least one customer.");
        return;
      }

      const payload = {
        recipientMode: formData.recipientMode,
        customerEkonId:
          formData.recipientMode === "single" ? formData.customerEkonId : "",
        customerEkonIds:
          formData.recipientMode === "selected"
            ? formData.selectedCustomerEkonIds
            : [],
        channel: formData.channel,
        subject: formData.subject,
        message: formData.message,
      };

      const res = await api.post("/api/communication", payload);

      alert(res.data.message || "Communication saved successfully.");

      setFormData({
        recipientMode: "single",
        customerEkonId: "",
        selectedCustomerEkonIds: [],
        channel: "Email",
        subject: "",
        message: "",
      });

      setSearchTerm("");
      await fetchLogs();
    } catch (error) {
      console.error("Error saving communication:", error);
      alert(
        error?.response?.data?.message ||
          error?.message ||
          "Could not save communication."
      );
    }
  };

  const getStatusColor = (status) => {
    if (status === "Sent") return "#16a34a";
    if (status === "Pending") return "#f59e0b";
    if (status === "Failed") return "#dc2626";
    return "#475569";
  };

  const formatDate = (value) => {
    if (!value) return "";
    try {
      return String(value).slice(0, 10);
    } catch {
      return value;
    }
  };

  const cardStyle = {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "10px",
    border: "1px solid #e5e7eb",
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
          marginBottom: "20px",
        }}
      >
        <h1 style={{ margin: 0 }}>Communication Center</h1>

        <button
          onClick={fetchPageData}
          style={{
            backgroundColor: "#16a34a",
            color: "white",
            border: "none",
            padding: "10px 16px",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Refresh
        </button>
      </div>

      <div style={{ ...cardStyle, marginBottom: "20px" }}>
        <h2>New Communication</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "15px",
            marginBottom: "15px",
          }}
        >
          <select
            name="recipientMode"
            value={formData.recipientMode}
            onChange={handleRecipientModeChange}
            style={{ padding: "10px" }}
          >
            <option value="single">Single Customer</option>
            <option value="selected">Selected Customers</option>
            <option value="all">All Customers</option>
          </select>

          <select
            name="channel"
            value={formData.channel}
            onChange={handleChange}
            style={{ padding: "10px" }}
          >
            <option value="Email">Email</option>
            <option value="WhatsApp">WhatsApp</option>
            <option value="SMS">SMS</option>
          </select>
        </div>

        {formData.recipientMode === "single" && (
          <div style={{ marginBottom: "15px" }}>
            <select
              name="customerEkonId"
              value={formData.customerEkonId}
              onChange={handleChange}
              style={{ padding: "10px", width: "100%" }}
              disabled={loadingCustomers}
            >
              <option value="">
                {loadingCustomers ? "Loading customers..." : "Select Customer"}
              </option>
              {customers.map((customer) => (
                <option key={customer._id} value={customer.ekonId}>
                  {customer.ekonId} - {customer.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {formData.recipientMode === "selected" && (
          <div
            style={{
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              padding: "15px",
              marginBottom: "15px",
              backgroundColor: "#f8fafc",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              <input
                type="text"
                placeholder="Search customers by EKON ID or name"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: "10px",
                  flex: "1",
                  minWidth: "260px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                }}
              />

              <button
                onClick={handleSelectAllFiltered}
                type="button"
                style={{
                  backgroundColor: "#0B3D91",
                  color: "white",
                  border: "none",
                  padding: "10px 16px",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                Select All Filtered
              </button>

              <button
                onClick={handleClearSelected}
                type="button"
                style={{
                  backgroundColor: "#64748b",
                  color: "white",
                  border: "none",
                  padding: "10px 16px",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                Clear Selected
              </button>
            </div>

            <div style={{ marginBottom: "10px", fontWeight: "bold", color: "#334155" }}>
              Selected Customers: {formData.selectedCustomerEkonIds.length}
            </div>

            <div
              style={{
                maxHeight: "260px",
                overflowY: "auto",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                backgroundColor: "white",
              }}
            >
              {loadingCustomers ? (
                <div style={{ padding: "12px" }}>Loading customers...</div>
              ) : filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer) => (
                  <label
                    key={customer._id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "12px",
                      borderBottom: "1px solid #f1f5f9",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={formData.selectedCustomerEkonIds.includes(customer.ekonId)}
                      onChange={() => handleSelectedCustomerToggle(customer.ekonId)}
                    />
                    <span>
                      {customer.ekonId} - {customer.name}
                    </span>
                  </label>
                ))
              ) : (
                <div style={{ padding: "12px" }}>No matching customers found.</div>
              )}
            </div>
          </div>
        )}

        {formData.recipientMode === "all" && (
          <div
            style={{
              marginBottom: "15px",
              padding: "12px",
              backgroundColor: "#ecfdf5",
              border: "1px solid #bbf7d0",
              borderRadius: "8px",
              color: "#166534",
              fontWeight: "bold",
            }}
          >
            This communication will be sent to all customers currently in the system.
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "15px",
          }}
        >
          <input
            type="text"
            name="subject"
            placeholder="Subject"
            value={formData.subject}
            onChange={handleChange}
            style={{ padding: "10px" }}
          />

          <textarea
            name="message"
            placeholder="Write message"
            value={formData.message}
            onChange={handleChange}
            style={{
              padding: "10px",
              minHeight: "120px",
            }}
          />
        </div>

        <button
          onClick={saveCommunication}
          style={{
            marginTop: "20px",
            backgroundColor: "#0B3D91",
            color: "white",
            border: "none",
            padding: "10px 16px",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Save Communication
        </button>
      </div>

      <div style={cardStyle}>
        <h2>Communication History</h2>

        {loadingLogs ? (
          <p>Loading communication logs...</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table border="1" cellPadding="10" style={{ minWidth: "1200px", width: "100%" }}>
              <thead>
                <tr>
                  <th>Log Number</th>
                  <th>Customer EKON ID</th>
                  <th>Customer Name</th>
                  <th>Channel</th>
                  <th>Subject</th>
                  <th>Message</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>

              <tbody>
                {logs.length > 0 ? (
                  logs.map((log, index) => (
                    <tr key={log._id || index}>
                      <td>{log.logNumber}</td>
                      <td>{log.customerEkonId}</td>
                      <td>{log.customerName}</td>
                      <td>{log.channel}</td>
                      <td>{log.subject}</td>
                      <td>{log.message}</td>
                      <td>
                        <span
                          style={{
                            padding: "4px 10px",
                            borderRadius: "6px",
                            color: "white",
                            backgroundColor: getStatusColor(log.status),
                          }}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td>{formatDate(log.date || log.createdAt)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8">No communication logs found.</td>
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

export default Communication;