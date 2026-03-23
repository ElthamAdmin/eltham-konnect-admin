import { useEffect, useState, useMemo } from "react";
import api from "../api";

function SupportTickets() {
  const [tickets, setTickets] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [replyFiles, setReplyFiles] = useState({});
  const [replyTexts, setReplyTexts] = useState({});
  const [expandedTicket, setExpandedTicket] = useState("");

  // 🔥 PAGINATION
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

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
      console.error(error);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  // 🔥 PAGINATION LOGIC
  const paginatedTickets = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return tickets.slice(start, start + perPage);
  }, [tickets, currentPage, perPage]);

  const totalPages = Math.ceil(tickets.length / perPage);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const createTicket = async () => {
    try {
      const body = new FormData();
      Object.entries(formData).forEach(([k, v]) => body.append(k, v));
      if (selectedFile) body.append("attachmentFile", selectedFile);

      await api.post("/api/support-tickets", body);
      alert("Ticket created");

      setFormData({
        customerEkonId: "",
        customerName: "",
        subject: "",
        message: "",
      });

      setSelectedFile(null);
      setShowForm(false);
      fetchTickets();
    } catch (err) {
      alert("Error creating ticket");
    }
  };

  const submitReply = async (ticketNumber) => {
    try {
      const body = new FormData();
      body.append("message", replyTexts[ticketNumber] || "");

      if (replyFiles[ticketNumber]) {
        body.append("attachmentFile", replyFiles[ticketNumber]);
      }

      await api.post(`/api/support-tickets/${ticketNumber}/reply`, body);

      setReplyTexts((prev) => ({ ...prev, [ticketNumber]: "" }));
      setReplyFiles((prev) => ({ ...prev, [ticketNumber]: null }));

      fetchTickets();
    } catch (err) {
      alert("Reply failed");
    }
  };

  const updateStatus = async (ticketNumber, status) => {
    try {
      await api.put(`/api/support-tickets/${ticketNumber}/status`, { status });
      fetchTickets();
    } catch {
      alert("Update failed");
    }
  };

  const formatDate = (v) => (v ? new Date(v).toLocaleString() : "");

  return (
    <div>
      <h1>Support Tickets</h1>

      {/* CREATE */}
      <button onClick={() => setShowForm(!showForm)}>
        {showForm ? "Close" : "+ New Ticket"}
      </button>

      {showForm && (
        <div style={{ margin: "20px 0" }}>
          <input name="customerEkonId" placeholder="EKON ID" onChange={handleChange} />
          <input name="customerName" placeholder="Name" onChange={handleChange} />
          <input name="subject" placeholder="Subject" onChange={handleChange} />
          <textarea name="message" placeholder="Message" onChange={handleChange} />
          <input type="file" onChange={(e) => setSelectedFile(e.target.files[0])} />

          <button onClick={createTicket}>Save</button>
        </div>
      )}

      {/* 🔥 PAGINATION CONTROLS */}
      <div style={{ marginBottom: "10px" }}>
        <select
          value={perPage}
          onChange={(e) => {
            setPerPage(Number(e.target.value));
            setCurrentPage(1);
          }}
        >
          <option value={10}>10 per page</option>
          <option value={25}>25 per page</option>
          <option value={50}>50 per page</option>
          <option value={100}>100 per page</option>
        </select>
      </div>

      {/* TABLE */}
      <table border="1" cellPadding="10" style={{ width: "100%" }}>
        <thead>
          <tr>
            <th>Ticket</th>
            <th>Customer</th>
            <th>Subject</th>
            <th>Status</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {paginatedTickets.map((t) => (
            <>
              <tr key={t._id}>
                <td>{t.ticketNumber}</td>
                <td>{t.customerName}</td>
                <td>{t.subject}</td>
                <td>{t.status}</td>
                <td>{formatDate(t.date)}</td>

                <td>
                  <button onClick={() => updateStatus(t.ticketNumber, "Resolved")}>
                    Resolve
                  </button>

                  <button
                    onClick={() =>
                      setExpandedTicket(
                        expandedTicket === t.ticketNumber ? "" : t.ticketNumber
                      )
                    }
                  >
                    Thread
                  </button>
                </td>
              </tr>

              {expandedTicket === t.ticketNumber && (
                <tr>
                  <td colSpan="6">
                    <div>
                      <strong>Message:</strong> {t.message}

                      {(t.replies || []).map((r) => (
                        <div key={r._id}>
                          <b>{r.senderName}:</b> {r.message}
                        </div>
                      ))}

                      <textarea
                        placeholder="Reply"
                        value={replyTexts[t.ticketNumber] || ""}
                        onChange={(e) =>
                          setReplyTexts((p) => ({
                            ...p,
                            [t.ticketNumber]: e.target.value,
                          }))
                        }
                      />

                      <input
                        type="file"
                        onChange={(e) =>
                          setReplyFiles((p) => ({
                            ...p,
                            [t.ticketNumber]: e.target.files[0],
                          }))
                        }
                      />

                      <button onClick={() => submitReply(t.ticketNumber)}>
                        Send Reply
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>

      {/* 🔥 PAGE NAV */}
      <div style={{ marginTop: "15px" }}>
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((p) => p - 1)}
        >
          Prev
        </button>

        <span style={{ margin: "0 10px" }}>
          Page {currentPage} of {totalPages || 1}
        </span>

        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((p) => p + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default SupportTickets;