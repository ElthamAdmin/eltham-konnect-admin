import { useEffect, useState } from "react";
import api from "../api";

function SupportTickets() {
  const [tickets, setTickets] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [replyFiles, setReplyFiles] = useState({});
  const [replyTexts, setReplyTexts] = useState({});
  const [expandedTicket, setExpandedTicket] = useState("");
  const [formData, setFormData] = useState({
    customerEkonId: "",
    customerName: "",
    subject: "",
    message: "",
  });

  const fetchTickets = async () => {
    try {
      const res = await api.get("/api/support-tickets");
      setTickets(res.data.data || []);
    } catch (error) {
      console.error("Error loading support tickets:", error);
      alert(error?.response?.data?.message || "Could not load support tickets.");
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const createTicket = async () => {
    try {
      if (
        !formData.customerEkonId ||
        !formData.customerName ||
        !formData.subject ||
        !formData.message
      ) {
        alert("Please fill in all support ticket fields.");
        return;
      }

      const body = new FormData();
      body.append("customerEkonId", formData.customerEkonId);
      body.append("customerName", formData.customerName);
      body.append("subject", formData.subject);
      body.append("message", formData.message);

      if (selectedFile) {
        body.append("attachmentFile", selectedFile);
      }

      const res = await api.post("/api/support-tickets", body, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      alert(res.data.message);
      setShowForm(false);
      setSelectedFile(null);
      setFormData({
        customerEkonId: "",
        customerName: "",
        subject: "",
        message: "",
      });

      const fileInput = document.getElementById("admin-support-attachment");
      if (fileInput) fileInput.value = "";

      await fetchTickets();
    } catch (error) {
      console.error("Error creating support ticket:", error);
      alert(error?.response?.data?.message || "Could not create support ticket.");
    }
  };

  const submitReply = async (ticketNumber) => {
    try {
      const message = replyTexts[ticketNumber] || "";

      if (!message.trim()) {
        alert("Please enter a reply message.");
        return;
      }

      const body = new FormData();
      body.append("message", message);

      if (replyFiles[ticketNumber]) {
        body.append("attachmentFile", replyFiles[ticketNumber]);
      }

      const res = await api.post(`/api/support-tickets/${ticketNumber}/reply`, body, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      alert(res.data.message);

      setReplyTexts((prev) => ({
        ...prev,
        [ticketNumber]: "",
      }));

      setReplyFiles((prev) => ({
        ...prev,
        [ticketNumber]: null,
      }));

      const fileInput = document.getElementById(`reply-file-${ticketNumber}`);
      if (fileInput) fileInput.value = "";

      await fetchTickets();
    } catch (error) {
      console.error("Error replying to support ticket:", error);
      alert(error?.response?.data?.message || "Could not send reply.");
    }
  };

  const updateStatus = async (ticketNumber, status) => {
    try {
      const res = await api.put(`/api/support-tickets/${ticketNumber}/status`, {
        status,
      });

      alert(res.data.message);
      await fetchTickets();
    } catch (error) {
      console.error("Error updating support ticket:", error);
      alert(
        error?.response?.data?.message ||
          error?.message ||
          "Could not update support ticket."
      );
    }
  };

  const getStatusColor = (status) => {
    if (status === "Open") return "#dc2626";
    if (status === "In Progress") return "#f59e0b";
    if (status === "Resolved") return "#16a34a";
    if (status === "Closed") return "#475569";
    return "#64748b";
  };

  const formatDate = (value) => {
    if (!value) return "";
    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  };

  const senderBadge = (senderType) => {
    const backgroundColor = senderType === "Admin" ? "#0B3D91" : "#16a34a";

    return (
      <span
        style={{
          backgroundColor,
          color: "white",
          padding: "4px 10px",
          borderRadius: "999px",
          fontSize: "12px",
          fontWeight: "bold",
        }}
      >
        {senderType}
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
        <h1>Support Tickets</h1>

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
          {showForm ? "Close Form" : "+ New Ticket"}
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
          <h2>Create Support Ticket</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "15px",
            }}
          >
            <input
              type="text"
              name="customerEkonId"
              placeholder="Customer EKON ID"
              value={formData.customerEkonId}
              onChange={handleChange}
              style={{ padding: "10px" }}
            />

            <input
              type="text"
              name="customerName"
              placeholder="Customer Name"
              value={formData.customerName}
              onChange={handleChange}
              style={{ padding: "10px" }}
            />

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
              placeholder="Message"
              value={formData.message}
              onChange={handleChange}
              style={{ padding: "10px", minHeight: "100px", gridColumn: "span 2" }}
            />

            <input
              id="admin-support-attachment"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={(e) => setSelectedFile(e.target.files[0] || null)}
              style={{ padding: "10px", gridColumn: "span 2" }}
            />
          </div>

          <button
            onClick={createTicket}
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
            Save Ticket
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
        <h2>All Support Tickets</h2>

        <table border="1" cellPadding="10" style={{ width: "100%" }}>
          <thead>
            <tr>
              <th>Ticket Number</th>
              <th>Customer EKON ID</th>
              <th>Customer Name</th>
              <th>Subject</th>
              <th>Message</th>
              <th>Status</th>
              <th>Date</th>
              <th>Attachment</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {tickets.length > 0 ? (
              tickets.map((ticket, index) => (
                <>
                  <tr key={ticket._id || index}>
                    <td>{ticket.ticketNumber}</td>
                    <td>{ticket.customerEkonId}</td>
                    <td>{ticket.customerName}</td>
                    <td>{ticket.subject}</td>
                    <td>{ticket.message}</td>
                    <td>
                      <span
                        style={{
                          padding: "4px 10px",
                          borderRadius: "6px",
                          color: "white",
                          backgroundColor: getStatusColor(ticket.status),
                        }}
                      >
                        {ticket.status}
                      </span>
                    </td>
                    <td>{ticket.date}</td>
                    <td>
                      {ticket.attachmentFilePath ? (
                        <a
                          href={`https://eltham-konnect-backend-c2sf.onrender.com${ticket.attachmentFilePath}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View Attachment
                        </a>
                      ) : (
                        "No attachment"
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "8px" }}>
                        <button
                          onClick={() => updateStatus(ticket.ticketNumber, "In Progress")}
                          style={{
                            backgroundColor: "#f59e0b",
                            color: "white",
                            border: "none",
                            padding: "6px 10px",
                            borderRadius: "4px",
                            cursor: "pointer",
                          }}
                        >
                          In Progress
                        </button>

                        <button
                          onClick={() => updateStatus(ticket.ticketNumber, "Resolved")}
                          style={{
                            backgroundColor: "#16a34a",
                            color: "white",
                            border: "none",
                            padding: "6px 10px",
                            borderRadius: "4px",
                            cursor: "pointer",
                          }}
                        >
                          Resolve
                        </button>

                        <button
                          onClick={() => updateStatus(ticket.ticketNumber, "Closed")}
                          style={{
                            backgroundColor: "#475569",
                            color: "white",
                            border: "none",
                            padding: "6px 10px",
                            borderRadius: "4px",
                            cursor: "pointer",
                          }}
                        >
                          Close
                        </button>

                        <button
                          onClick={() =>
                            setExpandedTicket((prev) =>
                              prev === ticket.ticketNumber ? "" : ticket.ticketNumber
                            )
                          }
                          style={{
                            backgroundColor: "#0B3D91",
                            color: "white",
                            border: "none",
                            padding: "6px 10px",
                            borderRadius: "4px",
                            cursor: "pointer",
                          }}
                        >
                          {expandedTicket === ticket.ticketNumber ? "Hide Thread" : "Open Thread"}
                        </button>
                      </div>
                    </td>
                  </tr>

                  {expandedTicket === ticket.ticketNumber && (
                    <tr key={`${ticket.ticketNumber}-thread`}>
                      <td colSpan="9" style={{ backgroundColor: "#f8fafc" }}>
                        <div
                          style={{
                            padding: "12px",
                            border: "1px solid #e5e7eb",
                            borderRadius: "8px",
                            backgroundColor: "white",
                          }}
                        >
                          <h3 style={{ marginTop: 0 }}>Ticket Conversation</h3>

                          <div style={{ display: "grid", gap: "12px", marginBottom: "16px" }}>
                            <div
                              style={{
                                border: "1px solid #e5e7eb",
                                borderRadius: "8px",
                                padding: "12px",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  marginBottom: "8px",
                                  gap: "10px",
                                  flexWrap: "wrap",
                                }}
                              >
                                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                                  {senderBadge("Customer")}
                                  <strong>{ticket.customerName}</strong>
                                </div>
                                <span style={{ color: "#64748b", fontSize: "12px" }}>
                                  {ticket.date}
                                </span>
                              </div>

                              <div style={{ marginBottom: "8px" }}>{ticket.message}</div>

                              {ticket.attachmentFilePath ? (
                                <a
                                  href={`https://eltham-konnect-backend-c2sf.onrender.com${ticket.attachmentFilePath}`}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  View Attachment
                                </a>
                              ) : null}
                            </div>

                            {(ticket.replies || []).map((reply) => (
                              <div
                                key={reply._id}
                                style={{
                                  border: "1px solid #e5e7eb",
                                  borderRadius: "8px",
                                  padding: "12px",
                                  backgroundColor:
                                    reply.senderType === "Admin" ? "#eff6ff" : "#f0fdf4",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    marginBottom: "8px",
                                    gap: "10px",
                                    flexWrap: "wrap",
                                  }}
                                >
                                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                                    {senderBadge(reply.senderType)}
                                    <strong>{reply.senderName}</strong>
                                  </div>
                                  <span style={{ color: "#64748b", fontSize: "12px" }}>
                                    {formatDate(reply.createdAt)}
                                  </span>
                                </div>

                                <div style={{ marginBottom: "8px" }}>{reply.message}</div>

                                {reply.attachmentFilePath ? (
                                  <a
                                    href={`https://eltham-konnect-backend-c2sf.onrender.com${reply.attachmentFilePath}`}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    View Attachment
                                  </a>
                                ) : null}
                              </div>
                            ))}
                          </div>

                          <div style={{ display: "grid", gap: "10px" }}>
                            <textarea
                              placeholder="Write a reply to this ticket"
                              value={replyTexts[ticket.ticketNumber] || ""}
                              onChange={(e) =>
                                setReplyTexts((prev) => ({
                                  ...prev,
                                  [ticket.ticketNumber]: e.target.value,
                                }))
                              }
                              style={{ padding: "10px", minHeight: "90px" }}
                            />

                            <input
                              id={`reply-file-${ticket.ticketNumber}`}
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png,.webp"
                              onChange={(e) =>
                                setReplyFiles((prev) => ({
                                  ...prev,
                                  [ticket.ticketNumber]: e.target.files[0] || null,
                                }))
                              }
                              style={{ padding: "10px" }}
                            />

                            <button
                              onClick={() => submitReply(ticket.ticketNumber)}
                              style={{
                                backgroundColor: "#0B3D91",
                                color: "white",
                                border: "none",
                                padding: "10px 16px",
                                borderRadius: "6px",
                                cursor: "pointer",
                                width: "fit-content",
                              }}
                            >
                              Send Reply
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))
            ) : (
              <tr>
                <td colSpan="9">No support tickets found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default SupportTickets;