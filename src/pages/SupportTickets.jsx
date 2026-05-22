import { useEffect, useMemo, useState } from "react";
import api from "../api";

function SupportTickets() {
  const [tickets, setTickets] = useState([]);
  const [supportStaff, setSupportStaff] = useState([]);
  const [internalNotes, setInternalNotes] = useState({});
  const [satisfactionScores, setSatisfactionScores] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [replyFiles, setReplyFiles] = useState({});
  const [replyTexts, setReplyTexts] = useState({});
  const [expandedTicket, setExpandedTicket] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const [formData, setFormData] = useState({
    customerEkonId: "",
    customerName: "",
    subject: "",
    message: "",
  });

  const ROYAL_BLUE = "#0B3D91";
  const GOLD = "#D4AF37";
  const WHITE = "#FFFFFF";
  const LIGHT_BG = "#f4f7fb";
  const BORDER = "#dbe3ef";
  const MUTED = "#64748b";

  const fetchTickets = async () => {
    try {
      const res = await api.get("/api/support-tickets");
      setTickets(res.data.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchSupportStaff = async () => {
  try {
    const res = await api.get("/api/support-tickets/staff");
    setSupportStaff(res.data.data || []);
  } catch (error) {
    console.error("Could not load support staff:", error);
  }
};

  useEffect(() => {
    fetchTickets();
    fetchSupportStaff();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, perPage]);

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) =>
      `${ticket.ticketNumber} ${ticket.customerName} ${ticket.customerEkonId} ${ticket.subject} ${ticket.message} ${ticket.status}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  }, [tickets, searchTerm]);

  const paginatedTickets = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredTickets.slice(start, start + perPage);
  }, [filteredTickets, currentPage, perPage]);

  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / perPage));

  const summary = useMemo(() => {
    return {
      total: tickets.length,
      open: tickets.filter((t) => t.status === "Open").length,
      inProgress: tickets.filter((t) => t.status === "In Progress").length,
      resolved: tickets.filter((t) => t.status === "Resolved").length,
            closed: tickets.filter((t) => t.status === "Closed").length,

      avgFirstResponse:
        tickets.length > 0
          ? Math.round(
              tickets.reduce(
                (sum, t) => sum + (t.firstResponseMinutes || 0),
                0
              ) / tickets.length
            )
          : 0,

      avgResolution:
        tickets.length > 0
          ? Math.round(
              tickets.reduce(
                (sum, t) => sum + (t.resolutionMinutes || 0),
                0
              ) / tickets.length
            )
          : 0,

      reopened:
        tickets.reduce(
          (sum, t) => sum + (t.reopenedCount || 0),
          0
        ),
    };
  }, [tickets]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const createTicket = async () => {
    try {
      if (
        !formData.customerEkonId.trim() ||
        !formData.customerName.trim() ||
        !formData.subject.trim() ||
        !formData.message.trim()
      ) {
        alert("Please complete all ticket fields.");
        return;
      }

      const body = new FormData();
      Object.entries(formData).forEach(([k, v]) => body.append(k, v));
      if (selectedFile) body.append("attachmentFile", selectedFile);

      await api.post("/api/support-tickets", body);

      alert("Ticket created successfully");

      setFormData({
        customerEkonId: "",
        customerName: "",
        subject: "",
        message: "",
      });

      setSelectedFile(null);
      setShowForm(false);
      await fetchTickets();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Error creating ticket");
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

      await api.post(`/api/support-tickets/${ticketNumber}/reply`, body);

      setReplyTexts((prev) => ({ ...prev, [ticketNumber]: "" }));
      setReplyFiles((prev) => ({ ...prev, [ticketNumber]: null }));

      await fetchTickets();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Reply failed");
    }
  };

  const updateStatus = async (ticketNumber, status) => {
    try {
      await api.put(`/api/support-tickets/${ticketNumber}/status`, { status });
      await fetchTickets();
    } catch (error) {
      console.error(error);
      alert(error?.response?.data?.message || "Update failed");
    }
  };

  const assignTicket = async (ticketNumber, assignedToUserId) => {
  try {
    await api.put(`/api/support-tickets/${ticketNumber}/assign`, {
      assignedToUserId,
    });
    await fetchTickets();
  } catch (error) {
    alert(error?.response?.data?.message || "Could not assign ticket.");
  }
};

const addInternalNote = async (ticketNumber) => {
  try {
    const note = internalNotes[ticketNumber] || "";

    if (!note.trim()) {
      alert("Please enter an internal note.");
      return;
    }

    await api.post(`/api/support-tickets/${ticketNumber}/internal-note`, {
      note,
    });

    setInternalNotes((prev) => ({ ...prev, [ticketNumber]: "" }));
    await fetchTickets();
  } catch (error) {
    alert(error?.response?.data?.message || "Could not add internal note.");
  }
};

const updateSatisfaction = async (ticketNumber) => {
  try {
    const customerSatisfaction = satisfactionScores[ticketNumber] || 0;

    if (!customerSatisfaction) {
      alert("Please select a satisfaction score.");
      return;
    }

    await api.put(`/api/support-tickets/${ticketNumber}/satisfaction`, {
      customerSatisfaction,
    });

    await fetchTickets();
  } catch (error) {
    alert(error?.response?.data?.message || "Could not update satisfaction score.");
  }
};

const reopenTicket = async (ticketNumber) => {
  try {
    await api.put(`/api/support-tickets/${ticketNumber}/reopen`);
    await fetchTickets();
  } catch (error) {
    alert(error?.response?.data?.message || "Could not reopen ticket.");
  }
};

const getOverdueLabel = (ticket) => {
  if (["Resolved", "Closed"].includes(ticket.status)) return "Completed";

  const created = new Date(ticket.createdAt);
  if (Number.isNaN(created.getTime())) return "Unknown";

  const hoursOpen = (Date.now() - created.getTime()) / 36e5;

  if (ticket.priority === "Critical" && hoursOpen > 2) return "Overdue";
  if (ticket.priority === "High" && hoursOpen > 6) return "Overdue";
  if (ticket.priority === "Medium" && hoursOpen > 24) return "Overdue";
  if (ticket.priority === "Low" && hoursOpen > 48) return "Overdue";

  return "Within SLA";
};

  const formatDate = (v) => {
    if (!v) return "";
    try {
      return new Date(v).toLocaleString();
    } catch {
      return v;
    }
  };

  const statusBadgeStyle = (status) => {
    let backgroundColor = "#64748b";

    if (status === "Open") backgroundColor = "#dc2626";
    if (status === "In Progress") backgroundColor = "#f59e0b";
    if (status === "Resolved") backgroundColor = "#16a34a";
    if (status === "Closed") backgroundColor = "#475569";

    return {
      backgroundColor,
      color: WHITE,
      borderRadius: "999px",
      padding: "5px 10px",
      fontSize: "12px",
      fontWeight: "bold",
      display: "inline-block",
      whiteSpace: "nowrap",
    };
  };

  const senderBadgeStyle = (senderType) => ({
    backgroundColor: senderType === "Admin" ? ROYAL_BLUE : GOLD,
    color: senderType === "Admin" ? WHITE : "black",
    borderRadius: "999px",
    padding: "4px 10px",
    fontSize: "12px",
    fontWeight: "bold",
    display: "inline-block",
    whiteSpace: "nowrap",
  });

  const metricCardStyle = {
    backgroundColor: WHITE,
    borderRadius: "12px",
    padding: "18px",
    border: `1px solid ${BORDER}`,
    boxShadow: "0 2px 8px rgba(15,23,42,0.04)",
    minHeight: "110px",
  };

  const paginationControls = (
    <div
      style={{
        backgroundColor: WHITE,
        border: `1px solid ${BORDER}`,
        borderRadius: "10px",
        padding: "12px 15px",
        marginBottom: "15px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "12px",
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
        <strong style={{ color: "#1e293b" }}>
          Showing {filteredTickets.length === 0 ? 0 : (currentPage - 1) * perPage + 1} to{" "}
          {Math.min(currentPage * perPage, filteredTickets.length)} of {filteredTickets.length}
        </strong>

        <select
          value={perPage}
          onChange={(e) => {
            setPerPage(Number(e.target.value));
            setCurrentPage(1);
          }}
          style={{
            padding: "8px 10px",
            borderRadius: "8px",
            border: `1px solid ${BORDER}`,
            backgroundColor: WHITE,
          }}
        >
          <option value={10}>10 per page</option>
          <option value={25}>25 per page</option>
          <option value={50}>50 per page</option>
          <option value={100}>100 per page</option>
        </select>
      </div>

      <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((p) => p - 1)}
          style={{
            backgroundColor: currentPage === 1 ? "#cbd5e1" : ROYAL_BLUE,
            color: WHITE,
            border: "none",
            padding: "8px 12px",
            borderRadius: "8px",
            cursor: currentPage === 1 ? "not-allowed" : "pointer",
            fontWeight: "bold",
          }}
        >
          Prev
        </button>

        <span style={{ fontWeight: "bold", color: "#334155" }}>
          Page {currentPage} of {totalPages}
        </span>

        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((p) => p + 1)}
          style={{
            backgroundColor: currentPage === totalPages ? "#cbd5e1" : ROYAL_BLUE,
            color: WHITE,
            border: "none",
            padding: "8px 12px",
            borderRadius: "8px",
            cursor: currentPage === totalPages ? "not-allowed" : "pointer",
            fontWeight: "bold",
          }}
        >
          Next
        </button>
      </div>
    </div>
  );

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
          <h1 style={{ margin: 0, color: "#0f172a" }}>Support Tickets</h1>
          <p style={{ margin: "6px 0 0 0", color: MUTED }}>
            Manage ticket conversations, respond to customers, and update ticket progress.
          </p>
        </div>

        <button
          onClick={() => setShowForm((prev) => !prev)}
          style={{
            backgroundColor: ROYAL_BLUE,
            color: WHITE,
            border: "none",
            padding: "11px 18px",
            borderRadius: "10px",
            cursor: "pointer",
            fontWeight: "bold",
            boxShadow: "0 2px 6px rgba(11,61,145,0.18)",
          }}
        >
          {showForm ? "Close Ticket Form" : "+ New Ticket"}
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "16px",
          marginBottom: "18px",
        }}
      >
        <div style={metricCardStyle}>
          <div style={{ fontSize: "30px", fontWeight: "bold", color: ROYAL_BLUE, marginBottom: "8px" }}>
            {summary.total}
          </div>
          <div style={{ color: "#334155", fontWeight: "bold" }}>Total Tickets</div>
        </div>

        <div style={metricCardStyle}>
          <div style={{ fontSize: "30px", fontWeight: "bold", color: "#dc2626", marginBottom: "8px" }}>
            {summary.open}
          </div>
          <div style={{ color: "#334155", fontWeight: "bold" }}>Open</div>
        </div>

        <div style={metricCardStyle}>
          <div style={{ fontSize: "30px", fontWeight: "bold", color: "#f59e0b", marginBottom: "8px" }}>
            {summary.inProgress}
          </div>
          <div style={{ color: "#334155", fontWeight: "bold" }}>In Progress</div>
        </div>

        <div style={metricCardStyle}>
          <div style={{ fontSize: "30px", fontWeight: "bold", color: "#16a34a", marginBottom: "8px" }}>
            {summary.resolved}
          </div>
          <div style={{ color: "#334155", fontWeight: "bold" }}>Resolved</div>
        </div>

        <div style={metricCardStyle}>
          <div style={{ fontSize: "30px", fontWeight: "bold", color: GOLD, marginBottom: "8px" }}>
            {summary.closed}
          </div>
          <div style={{ color: "#334155", fontWeight: "bold" }}>Closed</div>
        </div>

                <div style={metricCardStyle}>
          <div
            style={{
              fontSize: "26px",
              fontWeight: "bold",
              color: "#0891b2",
              marginBottom: "8px",
            }}
          >
            {summary.avgFirstResponse} mins
          </div>
          <div style={{ color: "#334155", fontWeight: "bold" }}>
            Avg First Response
          </div>
        </div>

        <div style={metricCardStyle}>
          <div
            style={{
              fontSize: "26px",
              fontWeight: "bold",
              color: "#7c3aed",
              marginBottom: "8px",
            }}
          >
            {summary.avgResolution} mins
          </div>
          <div style={{ color: "#334155", fontWeight: "bold" }}>
            Avg Resolution
          </div>
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
            {summary.reopened}
          </div>
          <div style={{ color: "#334155", fontWeight: "bold" }}>
            Reopened Tickets
          </div>
        </div>
      </div>

      {showForm && (
        <div
          style={{
            backgroundColor: WHITE,
            padding: "20px",
            borderRadius: "12px",
            marginBottom: "20px",
            border: `1px solid ${BORDER}`,
            boxShadow: "0 2px 8px rgba(15,23,42,0.04)",
          }}
        >
          <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>Create New Support Ticket</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "14px",
            }}
          >
            <input
              name="customerEkonId"
              placeholder="Customer EKON ID"
              value={formData.customerEkonId}
              onChange={handleChange}
              style={{ padding: "10px", borderRadius: "8px", border: `1px solid ${BORDER}` }}
            />

            <input
              name="customerName"
              placeholder="Customer Name"
              value={formData.customerName}
              onChange={handleChange}
              style={{ padding: "10px", borderRadius: "8px", border: `1px solid ${BORDER}` }}
            />

            <input
              name="subject"
              placeholder="Ticket Subject"
              value={formData.subject}
              onChange={handleChange}
              style={{
                padding: "10px",
                borderRadius: "8px",
                border: `1px solid ${BORDER}`,
                gridColumn: "span 2",
              }}
            />

            <textarea
              name="message"
              placeholder="Write the support issue or request"
              value={formData.message}
              onChange={handleChange}
              style={{
                padding: "10px",
                borderRadius: "8px",
                border: `1px solid ${BORDER}`,
                minHeight: "120px",
                gridColumn: "span 2",
              }}
            />

            <input
              type="file"
              onChange={(e) => setSelectedFile(e.target.files[0] || null)}
              style={{
                padding: "10px",
                borderRadius: "8px",
                border: `1px solid ${BORDER}`,
                gridColumn: "span 2",
                backgroundColor: "#f8fafc",
              }}
            />
          </div>

          <button
            onClick={createTicket}
            style={{
              marginTop: "18px",
              backgroundColor: GOLD,
              color: "black",
              border: "none",
              padding: "11px 18px",
              borderRadius: "10px",
              cursor: "pointer",
              fontWeight: "bold",
              boxShadow: "0 2px 6px rgba(212,175,55,0.2)",
            }}
          >
            Save Ticket
          </button>
        </div>
      )}

      <div
        style={{
          backgroundColor: WHITE,
          border: `1px solid ${BORDER}`,
          borderRadius: "12px",
          padding: "16px",
          marginBottom: "16px",
          boxShadow: "0 2px 8px rgba(15,23,42,0.04)",
        }}
      >
        <input
          type="text"
          placeholder="Search by ticket number, customer, EKON ID, subject, message, or status"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "8px",
            border: `1px solid ${BORDER}`,
          }}
        />
      </div>

      {paginationControls}

      <div style={{ display: "grid", gap: "16px" }}>
        {paginatedTickets.length > 0 ? (
          paginatedTickets.map((ticket) => (
            <div
              key={ticket._id}
              style={{
                backgroundColor: WHITE,
                border: `1px solid ${BORDER}`,
                borderRadius: "12px",
                padding: "18px",
                boxShadow: "0 2px 8px rgba(15,23,42,0.04)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "14px",
                  flexWrap: "wrap",
                  marginBottom: "12px",
                }}
              >
                <div>
                  <div style={{ fontWeight: "bold", color: ROYAL_BLUE, marginBottom: "6px" }}>
                    {ticket.ticketNumber}
                  </div>
                  <div style={{ fontSize: "20px", fontWeight: "bold", color: "#0f172a" }}>
                    {ticket.subject}
                  </div>
                  <div style={{ color: MUTED, marginTop: "4px" }}>
                    {ticket.customerName} • {ticket.customerEkonId || "No EKON ID"}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <span style={statusBadgeStyle(ticket.status)}>{ticket.status}</span>
                  <span style={{ color: MUTED, fontSize: "13px" }}>{formatDate(ticket.date || ticket.createdAt)}</span>
                </div>
              </div>

                            <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "10px",
                  marginBottom: "14px",
                }}
              >
                <div
                  style={{
                    backgroundColor: "#eff6ff",
                    padding: "10px",
                    borderRadius: "8px",
                  }}
                >
                  <strong>Priority:</strong><br />
                  {ticket.priority || "Medium"}
                </div>

                <div
                  style={{
                    backgroundColor: "#fefce8",
                    padding: "10px",
                    borderRadius: "8px",
                  }}
                >
                  <strong>Category:</strong><br />
                  {ticket.category || "General"}
                </div>

                <div
                  style={{
                    backgroundColor: "#f0fdf4",
                    padding: "10px",
                    borderRadius: "8px",
                  }}
                >
                  <strong>First Response:</strong><br />
                  {ticket.firstResponseMinutes || 0} mins
                </div>

                <div
                  style={{
                    backgroundColor: "#faf5ff",
                    padding: "10px",
                    borderRadius: "8px",
                  }}
                >
                  <strong>Resolution:</strong><br />
                  {ticket.resolutionMinutes || 0} mins
                </div>

                <div
                  style={{
                    backgroundColor: "#fff1f2",
                    padding: "10px",
                    borderRadius: "8px",
                  }}
                >
                  <strong>Reopened:</strong><br />
                  {ticket.reopenedCount || 0}
                </div>

                <div
  style={{
    backgroundColor: "#ecfeff",
    padding: "10px",
    borderRadius: "8px",
  }}
>
  <strong>Assigned To:</strong><br />
  {ticket.assignedTo || "Unassigned"}
</div>

<div
  style={{
    backgroundColor: getOverdueLabel(ticket) === "Overdue" ? "#fee2e2" : "#dcfce7",
    padding: "10px",
    borderRadius: "8px",
  }}
>
  <strong>SLA Status:</strong><br />
  {getOverdueLabel(ticket)}
</div>

<div
  style={{
    backgroundColor: "#f8fafc",
    padding: "10px",
    borderRadius: "8px",
  }}
>
  <strong>CSAT:</strong><br />
  {ticket.customerSatisfaction ? `${ticket.customerSatisfaction}/5` : "Not Rated"}
</div>
              </div>

              <div
                style={{
                  backgroundColor: "#f8fafc",
                  border: `1px solid ${BORDER}`,
                  borderRadius: "10px",
                  padding: "14px",
                  marginBottom: "14px",
                  color: "#334155",
                  lineHeight: 1.6,
                }}
              >
                {ticket.message}
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  flexWrap: "wrap",
                  marginBottom: "14px",
                }}
              >
                <button
                  onClick={() => updateStatus(ticket.ticketNumber, "Open")}
                  style={{
                    backgroundColor: "#dc2626",
                    color: WHITE,
                    border: "none",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  Open
                </button>

                <button
                  onClick={() => updateStatus(ticket.ticketNumber, "In Progress")}
                  style={{
                    backgroundColor: "#f59e0b",
                    color: "black",
                    border: "none",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  In Progress
                </button>

                <button
                  onClick={() => updateStatus(ticket.ticketNumber, "Resolved")}
                  style={{
                    backgroundColor: "#16a34a",
                    color: WHITE,
                    border: "none",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  Resolved
                </button>

                <button
                  onClick={() => updateStatus(ticket.ticketNumber, "Closed")}
                  style={{
                    backgroundColor: "#475569",
                    color: WHITE,
                    border: "none",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  Closed
                </button>

                <select
  value={ticket.assignedToUserId || ""}
  onChange={(e) => assignTicket(ticket.ticketNumber, e.target.value)}
  style={{
    padding: "9px 12px",
    borderRadius: "8px",
    border: `1px solid ${BORDER}`,
  }}
>
  <option value="">Assign Staff</option>
  {supportStaff.map((staff) => (
    <option
  key={staff.userId}
  value={staff.userId}
  disabled={[
    "Vacation Leave",
    "Sick Leave",
    "Out of Office",
    "Absent",
  ].includes(staff.dutyStatus)}
>
  {staff.fullName} ({staff.role}) - {staff.dutyStatus || "Off Duty"}
</option>

  ))}
</select>

<button
  onClick={() => reopenTicket(ticket.ticketNumber)}
  style={{
    backgroundColor: "#0891b2",
    color: WHITE,
    border: "none",
    padding: "9px 12px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
  }}
>
  Reopen
</button>

                <button
                  onClick={() =>
                    setExpandedTicket(
                      expandedTicket === ticket.ticketNumber ? "" : ticket.ticketNumber
                    )
                  }
                  style={{
                    backgroundColor: ROYAL_BLUE,
                    color: WHITE,
                    border: "none",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "bold",
                    marginLeft: "auto",
                  }}
                >
                  {expandedTicket === ticket.ticketNumber ? "Hide Conversation" : "Open Conversation"}
                </button>
              </div>

              {expandedTicket === ticket.ticketNumber && (
                <div
                  style={{
                    borderTop: `1px solid ${BORDER}`,
                    paddingTop: "16px",
                    display: "grid",
                    gap: "14px",
                  }}
                >
                  <h3 style={{ margin: 0, color: ROYAL_BLUE }}>Conversation Thread</h3>

                  <div
                    style={{
                      border: `1px solid ${BORDER}`,
                      borderRadius: "10px",
                      padding: "14px",
                      backgroundColor: "#fefce8",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "10px",
                        flexWrap: "wrap",
                        marginBottom: "8px",
                      }}
                    >
                      <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                        <span style={senderBadgeStyle("Customer")}>Customer</span>
                        <strong>{ticket.customerName}</strong>
                      </div>
                      <span style={{ color: MUTED, fontSize: "12px" }}>
                        {formatDate(ticket.date || ticket.createdAt)}
                      </span>
                    </div>

                    <div style={{ color: "#334155", lineHeight: 1.6 }}>
                      {ticket.message}
                    </div>
                  </div>

                  <div
  style={{
    backgroundColor: "#f1f5f9",
    border: `1px solid ${BORDER}`,
    borderRadius: "10px",
    padding: "14px",
  }}
>
  <h4 style={{ marginTop: 0 }}>Internal Staff Notes</h4>

  {(ticket.internalNotes || []).map((note) => (
    <div
      key={note._id}
      style={{
        backgroundColor: "white",
        border: `1px solid ${BORDER}`,
        borderRadius: "8px",
        padding: "10px",
        marginBottom: "8px",
      }}
    >
      <strong>{note.addedBy || "Staff"}</strong>
      <div style={{ color: MUTED, fontSize: "12px" }}>
        {formatDate(note.createdAt)}
      </div>
      <div>{note.note}</div>
    </div>
  ))}

  <textarea
    placeholder="Add internal note. Customers cannot see this."
    value={internalNotes[ticket.ticketNumber] || ""}
    onChange={(e) =>
      setInternalNotes((prev) => ({
        ...prev,
        [ticket.ticketNumber]: e.target.value,
      }))
    }
    style={{
      width: "100%",
      padding: "10px",
      minHeight: "80px",
      borderRadius: "8px",
      border: `1px solid ${BORDER}`,
      marginTop: "8px",
    }}
  />

  <button
    onClick={() => addInternalNote(ticket.ticketNumber)}
    style={{
      backgroundColor: "#475569",
      color: WHITE,
      border: "none",
      padding: "9px 12px",
      borderRadius: "8px",
      cursor: "pointer",
      fontWeight: "bold",
      marginTop: "8px",
    }}
  >
    Save Internal Note
  </button>
</div>

<div
  style={{
    backgroundColor: "#fefce8",
    border: `1px solid ${BORDER}`,
    borderRadius: "10px",
    padding: "14px",
  }}
>
  <h4 style={{ marginTop: 0 }}>Customer Satisfaction</h4>

  <select
    value={satisfactionScores[ticket.ticketNumber] || ticket.customerSatisfaction || ""}
    onChange={(e) =>
      setSatisfactionScores((prev) => ({
        ...prev,
        [ticket.ticketNumber]: Number(e.target.value),
      }))
    }
    style={{
      padding: "9px 12px",
      borderRadius: "8px",
      border: `1px solid ${BORDER}`,
      marginRight: "8px",
    }}
  >
    <option value="">Select Rating</option>
    <option value={5}>5 - Excellent</option>
    <option value={4}>4 - Good</option>
    <option value={3}>3 - Fair</option>
    <option value={2}>2 - Poor</option>
    <option value={1}>1 - Very Poor</option>
  </select>

  <button
    onClick={() => updateSatisfaction(ticket.ticketNumber)}
    style={{
      backgroundColor: GOLD,
      color: "black",
      border: "none",
      padding: "9px 12px",
      borderRadius: "8px",
      cursor: "pointer",
      fontWeight: "bold",
    }}
  >
    Save Rating
  </button>
</div>

                  {(ticket.replies || []).map((reply) => (
                    <div
                      key={reply._id}
                      style={{
                        border: `1px solid ${BORDER}`,
                        borderRadius: "10px",
                        padding: "14px",
                        backgroundColor:
                          reply.senderType === "Admin" ? "#eff6ff" : "#fefce8",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "10px",
                          flexWrap: "wrap",
                          marginBottom: "8px",
                        }}
                      >
                        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                          <span style={senderBadgeStyle(reply.senderType || "Admin")}>
                            {reply.senderType || "Admin"}
                          </span>
                          <strong>{reply.senderName}</strong>
                        </div>
                        <span style={{ color: MUTED, fontSize: "12px" }}>
                          {formatDate(reply.createdAt)}
                        </span>
                      </div>

                      <div style={{ color: "#334155", lineHeight: 1.6 }}>
                        {reply.message}
                      </div>
                    </div>
                  ))}

                  <div
                    style={{
                      backgroundColor: "#f8fafc",
                      border: `1px solid ${BORDER}`,
                      borderRadius: "10px",
                      padding: "14px",
                    }}
                  >
                    <h4 style={{ marginTop: 0, color: "#0f172a" }}>Reply to Ticket</h4>

                    <textarea
                      placeholder="Write your reply"
                      value={replyTexts[ticket.ticketNumber] || ""}
                      onChange={(e) =>
                        setReplyTexts((prev) => ({
                          ...prev,
                          [ticket.ticketNumber]: e.target.value,
                        }))
                      }
                      style={{
                        width: "100%",
                        padding: "10px",
                        minHeight: "100px",
                        borderRadius: "8px",
                        border: `1px solid ${BORDER}`,
                        marginBottom: "10px",
                      }}
                    />

                    <input
                      type="file"
                      onChange={(e) =>
                        setReplyFiles((prev) => ({
                          ...prev,
                          [ticket.ticketNumber]: e.target.files[0] || null,
                        }))
                      }
                      style={{
                        marginBottom: "10px",
                        width: "100%",
                        padding: "10px",
                        borderRadius: "8px",
                        border: `1px solid ${BORDER}`,
                        backgroundColor: WHITE,
                      }}
                    />

                    <button
                      onClick={() => submitReply(ticket.ticketNumber)}
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
                      Send Reply
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div
            style={{
              backgroundColor: WHITE,
              border: `1px solid ${BORDER}`,
              borderRadius: "12px",
              padding: "24px",
              textAlign: "center",
              color: MUTED,
            }}
          >
            No support tickets found.
          </div>
        )}
      </div>

      <div style={{ marginTop: "15px" }}>{paginationControls}</div>
    </div>
  );
}

export default SupportTickets;