import { useEffect, useState } from "react";
import api from "../api";

function Communication() {
  const [logs, setLogs] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [formData, setFormData] = useState({
    customerEkonId: "",
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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const saveCommunication = async () => {
    try {
      if (
        !formData.customerEkonId ||
        !formData.channel ||
        !formData.subject ||
        !formData.message
      ) {
        alert("Please complete all communication fields.");
        return;
      }

      const res = await api.post("/api/communication", formData);

      alert(res.data.message || "Communication saved successfully.");

      setFormData({
        customerEkonId: "",
        channel: "Email",
        subject: "",
        message: "",
      });

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
          }}
        >
          <select
            name="customerEkonId"
            value={formData.customerEkonId}
            onChange={handleChange}
            style={{ padding: "10px" }}
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

          <input
            type="text"
            name="subject"
            placeholder="Subject"
            value={formData.subject}
            onChange={handleChange}
            style={{ padding: "10px", gridColumn: "span 2" }}
          />

          <textarea
            name="message"
            placeholder="Write message"
            value={formData.message}
            onChange={handleChange}
            style={{
              padding: "10px",
              minHeight: "120px",
              gridColumn: "span 2",
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
            <table border="1" cellPadding="10" style={{ minWidth: "1100px", width: "100%" }}>
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