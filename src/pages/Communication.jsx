import { useEffect, useMemo, useState } from "react";
import api from "../api";

function Communication() {
  const [logs, setLogs] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [logsPage, setLogsPage] = useState(1);
  const [logsPageSize, setLogsPageSize] = useState(10);
  const [expandedMessages, setExpandedMessages] = useState({});

  const [formData, setFormData] = useState({
    recipientMode: "single",
    customerEkonId: "",
    selectedCustomerEkonIds: [],
    channel: "Email",
    subject: "",
    message: "",
  });

  const ROYAL_BLUE = "#0B3D91";
  const GOLD = "#D4AF37";
  const WHITE = "#FFFFFF";
  const LIGHT_BG = "#f4f7fb";
  const BORDER = "#dbe3ef";
  const MUTED = "#64748b";

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

  const summary = useMemo(() => {
    return {
      totalLogs: logs.length,
      sent: logs.filter((log) => log.status === "Sent").length,
      pending: logs.filter((log) => log.status === "Pending").length,
      failed: logs.filter((log) => log.status === "Failed").length,
    };
  }, [logs]);

  const totalLogsPages = Math.max(1, Math.ceil(logs.length / logsPageSize));

  const paginatedLogs = useMemo(() => {
    const startIndex = (logsPage - 1) * logsPageSize;
    return logs.slice(startIndex, startIndex + logsPageSize);
  }, [logs, logsPage, logsPageSize]);

  useEffect(() => {
    if (logsPage > totalLogsPages) {
      setLogsPage(1);
    }
  }, [logsPage, totalLogsPages]);

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

      if (formData.recipientMode === "single" && !formData.customerEkonId) {
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
      setLogsPage(1);
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

  const getMessagePreview = (message = "", expanded = false) => {
    if (expanded) return message;
    if (message.length <= 160) return message;
    return `${message.slice(0, 160)}...`;
  };

  const toggleExpandedMessage = (logKey) => {
    setExpandedMessages((prev) => ({
      ...prev,
      [logKey]: !prev[logKey],
    }));
  };

  const cardStyle = {
    backgroundColor: WHITE,
    padding: "20px",
    borderRadius: "12px",
    border: `1px solid ${BORDER}`,
    boxShadow: "0 2px 8px rgba(15,23,42,0.04)",
  };

  const metricCardStyle = {
    backgroundColor: WHITE,
    borderRadius: "12px",
    padding: "18px",
    border: `1px solid ${BORDER}`,
    boxShadow: "0 2px 8px rgba(15,23,42,0.04)",
    minHeight: "110px",
  };

  return (
    <div style={{ backgroundColor: LIGHT_BG, minHeight: "100vh" }}>
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
        <div>
          <h1 style={{ margin: 0, color: "#0f172a" }}>Communication Center</h1>
          <p style={{ margin: "6px 0 0 0", color: MUTED }}>
            Send important updates to one customer, selected customers, or all customers.
          </p>
        </div>

        <button
          onClick={fetchPageData}
          style={{
            backgroundColor: "#16a34a",
            color: WHITE,
            border: "none",
            padding: "10px 16px",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Refresh
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          marginBottom: "18px",
        }}
      >
        <div style={metricCardStyle}>
          <div
            style={{
              fontSize: "30px",
              fontWeight: "bold",
              color: ROYAL_BLUE,
              marginBottom: "8px",
            }}
          >
            {summary.totalLogs}
          </div>
          <div style={{ color: "#334155", fontWeight: "bold" }}>
            Total Communications
          </div>
        </div>

        <div style={metricCardStyle}>
          <div
            style={{
              fontSize: "30px",
              fontWeight: "bold",
              color: "#16a34a",
              marginBottom: "8px",
            }}
          >
            {summary.sent}
          </div>
          <div style={{ color: "#334155", fontWeight: "bold" }}>Sent</div>
        </div>

        <div style={metricCardStyle}>
          <div
            style={{
              fontSize: "30px",
              fontWeight: "bold",
              color: GOLD,
              marginBottom: "8px",
            }}
          >
            {summary.pending}
          </div>
          <div style={{ color: "#334155", fontWeight: "bold" }}>Pending</div>
        </div>

        <div style={metricCardStyle}>
          <div
            style={{
              fontSize: "30px",
              fontWeight: "bold",
              color: "#dc2626",
              marginBottom: "8px",
            }}
          >
            {summary.failed}
          </div>
          <div style={{ color: "#334155", fontWeight: "bold" }}>Failed</div>
        </div>
      </div>

      <div style={{ ...cardStyle, marginBottom: "20px" }}>
        <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>New Communication</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "15px",
            marginBottom: "15px",
          }}
        >
          <select
            name="recipientMode"
            value={formData.recipientMode}
            onChange={handleRecipientModeChange}
            style={{
              padding: "10px",
              borderRadius: "8px",
              border: `1px solid ${BORDER}`,
            }}
          >
            <option value="single">Single Customer</option>
            <option value="selected">Selected Customers</option>
            <option value="all">All Customers</option>
          </select>

          <select
            name="channel"
            value={formData.channel}
            onChange={handleChange}
            style={{
              padding: "10px",
              borderRadius: "8px",
              border: `1px solid ${BORDER}`,
            }}
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
              style={{
                padding: "10px",
                width: "100%",
                borderRadius: "8px",
                border: `1px solid ${BORDER}`,
              }}
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
              border: `1px solid ${BORDER}`,
              borderRadius: "10px",
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
                placeholder="Search customers by EKON ID, name, email, or phone"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: "10px",
                  flex: "1",
                  minWidth: "260px",
                  borderRadius: "8px",
                  border: `1px solid ${BORDER}`,
                }}
              />

              <button
                onClick={handleSelectAllFiltered}
                type="button"
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
                Select All Filtered
              </button>

              <button
                onClick={handleClearSelected}
                type="button"
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
                Clear Selected
              </button>
            </div>

            <div
              style={{
                marginBottom: "10px",
                fontWeight: "bold",
                color: "#334155",
              }}
            >
              Selected Customers: {formData.selectedCustomerEkonIds.length}
            </div>

            <div
              style={{
                maxHeight: "280px",
                overflowY: "auto",
                border: `1px solid ${BORDER}`,
                borderRadius: "10px",
                backgroundColor: WHITE,
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
                      checked={formData.selectedCustomerEkonIds.includes(
                        customer.ekonId
                      )}
                      onChange={() =>
                        handleSelectedCustomerToggle(customer.ekonId)
                      }
                    />
                    <span>
                      <strong>{customer.ekonId}</strong> - {customer.name}
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
              backgroundColor: "#eff6ff",
              border: "1px solid #bfdbfe",
              borderRadius: "10px",
              color: ROYAL_BLUE,
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
            style={{
              padding: "10px",
              borderRadius: "8px",
              border: `1px solid ${BORDER}`,
            }}
          />

          <textarea
            name="message"
            placeholder="Write message"
            value={formData.message}
            onChange={handleChange}
            style={{
              padding: "10px",
              minHeight: "130px",
              borderRadius: "8px",
              border: `1px solid ${BORDER}`,
            }}
          />
        </div>

        <button
          onClick={saveCommunication}
          style={{
            marginTop: "20px",
            backgroundColor: ROYAL_BLUE,
            color: WHITE,
            border: "none",
            padding: "11px 18px",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Save Communication
        </button>
      </div>

      <div style={cardStyle}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
            marginBottom: "14px",
          }}
        >
          <h2 style={{ margin: 0, color: ROYAL_BLUE }}>Communication History</h2>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
            <label style={{ color: MUTED, fontWeight: "bold" }}>Rows:</label>
            <select
              value={logsPageSize}
              onChange={(e) => {
                setLogsPageSize(Number(e.target.value));
                setLogsPage(1);
              }}
              style={{
                padding: "8px 10px",
                borderRadius: "8px",
                border: `1px solid ${BORDER}`,
              }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {loadingLogs ? (
          <p>Loading communication logs...</p>
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table
                border="1"
                cellPadding="10"
                style={{
                  minWidth: "1200px",
                  width: "100%",
                  borderCollapse: "collapse",
                  borderColor: BORDER,
                }}
              >
                <thead style={{ backgroundColor: "#eef4ff" }}>
                  <tr>
                    <th style={{ minWidth: "150px" }}>Log Number</th>
                    <th style={{ minWidth: "110px" }}>Customer EKON ID</th>
                    <th style={{ minWidth: "160px" }}>Customer Name</th>
                    <th style={{ minWidth: "90px" }}>Channel</th>
                    <th style={{ minWidth: "140px" }}>Subject</th>
                    <th style={{ minWidth: "320px" }}>Message</th>
                    <th style={{ minWidth: "90px" }}>Status</th>
                    <th style={{ minWidth: "100px" }}>Date</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedLogs.length > 0 ? (
                    paginatedLogs.map((log, index) => {
                      const logKey = log._id || log.logNumber || index;
                      const isExpanded = !!expandedMessages[logKey];

                      return (
                        <tr key={logKey}>
                          <td style={{ fontWeight: "bold", color: "#334155", verticalAlign: "top" }}>
                            {log.logNumber}
                          </td>
                          <td style={{ verticalAlign: "top" }}>{log.customerEkonId}</td>
                          <td style={{ verticalAlign: "top" }}>{log.customerName}</td>
                          <td style={{ verticalAlign: "top" }}>{log.channel}</td>
                          <td style={{ verticalAlign: "top", fontWeight: "600", color: "#1e293b" }}>
                            {log.subject}
                          </td>
                          <td style={{ color: "#475569", verticalAlign: "top", lineHeight: 1.5 }}>
                            <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                              {getMessagePreview(log.message, isExpanded)}
                            </div>

                            {String(log.message || "").length > 160 && (
                              <button
                                onClick={() => toggleExpandedMessage(logKey)}
                                style={{
                                  marginTop: "8px",
                                  backgroundColor: "#e2e8f0",
                                  color: "#0f172a",
                                  border: "none",
                                  padding: "7px 10px",
                                  borderRadius: "8px",
                                  cursor: "pointer",
                                  fontWeight: "bold",
                                }}
                              >
                                {isExpanded ? "Show Less" : "View More"}
                              </button>
                            )}
                          </td>
                          <td style={{ verticalAlign: "top" }}>
                            <span
                              style={{
                                padding: "5px 10px",
                                borderRadius: "999px",
                                color: WHITE,
                                backgroundColor: getStatusColor(log.status),
                                fontWeight: "bold",
                                fontSize: "12px",
                                display: "inline-block",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {log.status}
                            </span>
                          </td>
                          <td style={{ verticalAlign: "top" }}>
                            {formatDate(log.date || log.createdAt)}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="8" style={{ textAlign: "center", color: MUTED }}>
                        No communication logs found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div
              style={{
                marginTop: "16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <div style={{ color: MUTED, fontWeight: "bold" }}>
                Page {logsPage} of {totalLogsPages}
              </div>

              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <button
                  onClick={() => setLogsPage((prev) => Math.max(prev - 1, 1))}
                  disabled={logsPage === 1}
                  style={{
                    backgroundColor: logsPage === 1 ? "#cbd5e1" : ROYAL_BLUE,
                    color: WHITE,
                    border: "none",
                    padding: "9px 14px",
                    borderRadius: "8px",
                    cursor: logsPage === 1 ? "not-allowed" : "pointer",
                    fontWeight: "bold",
                  }}
                >
                  Previous
                </button>

                <button
                  onClick={() =>
                    setLogsPage((prev) => Math.min(prev + 1, totalLogsPages))
                  }
                  disabled={logsPage === totalLogsPages}
                  style={{
                    backgroundColor:
                      logsPage === totalLogsPages ? "#cbd5e1" : ROYAL_BLUE,
                    color: WHITE,
                    border: "none",
                    padding: "9px 14px",
                    borderRadius: "8px",
                    cursor:
                      logsPage === totalLogsPages ? "not-allowed" : "pointer",
                    fontWeight: "bold",
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Communication;