import { useEffect, useState } from "react";
import axios from "axios";

function Communication() {
  const [logs, setLogs] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [formData, setFormData] = useState({
    customerEkonId: "",
    channel: "Email",
    subject: "",
    message: "",
  });

  const fetchLogs = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/communication");
      setLogs(res.data.data || []);
    } catch (error) {
      console.error("Error loading communication logs:", error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/customers");
      setCustomers(res.data.data || []);
    } catch (error) {
      console.error("Error loading customers:", error);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchCustomers();
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

      const res = await axios.post(
        "http://localhost:5000/api/communication",
        formData
      );

      alert(res.data.message);

      setFormData({
        customerEkonId: "",
        channel: "Email",
        subject: "",
        message: "",
      });

      await fetchLogs();
    } catch (error) {
      console.error("Error saving communication:", error);
      alert(error?.response?.data?.message || "Could not save communication.");
    }
  };

  const getStatusColor = (status) => {
    if (status === "Sent") return "#16a34a";
    if (status === "Pending") return "#f59e0b";
    if (status === "Failed") return "#dc2626";
    return "#475569";
  };

  return (
    <div>
      <h1>Communication Center</h1>

      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "10px",
          border: "1px solid #e5e7eb",
          marginBottom: "20px",
        }}
      >
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
          >
            <option value="">Select Customer</option>
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

      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "10px",
          border: "1px solid #e5e7eb",
        }}
      >
        <h2>Communication History</h2>

        <table border="1" cellPadding="10" style={{ width: "100%" }}>
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
                  <td>{log.date}</td>
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
    </div>
  );
}

export default Communication;