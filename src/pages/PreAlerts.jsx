import { useEffect, useMemo, useState } from "react";
import api from "../api";

function PreAlerts() {
  const [preAlerts, setPreAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const ROYAL_BLUE = "#0B3D91";
  const GOLD = "#D4AF37";
  const WHITE = "#FFFFFF";
  const LIGHT_BG = "#f4f7fb";
  const BORDER = "#dbe3ef";
  const MUTED = "#64748b";

  const fetchPreAlerts = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/pre-alerts");
      setPreAlerts(res.data.data || []);
    } catch (error) {
      console.error("Error loading pre-alerts:", error);
      alert(error?.response?.data?.message || "Could not load pre-alerts.");
      setPreAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreAlerts();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize]);

  const filteredPreAlerts = useMemo(() => {
    return preAlerts.filter((item) =>
      `${item.preAlertNumber} ${item.customerName} ${item.customerEkonId} ${item.trackingNumber} ${item.courier || ""} ${item.storeName || ""} ${item.itemDescription || ""} ${item.status || ""} ${item.notes || ""}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  }, [preAlerts, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredPreAlerts.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedPreAlerts = filteredPreAlerts.slice(startIndex, endIndex);

  const summary = useMemo(() => {
    return {
      total: preAlerts.length,
      submitted: preAlerts.filter((item) => item.status === "Submitted").length,
      withInvoice: preAlerts.filter((item) => item.invoiceFilePath).length,
      withoutInvoice: preAlerts.filter((item) => !item.invoiceFilePath).length,
    };
  }, [preAlerts]);

  const formatDate = (value) => {
    if (!value) return "";
    try {
      return new Date(value).toLocaleDateString();
    } catch {
      return String(value).slice(0, 10);
    }
  };

  const statusBadge = (status) => {
    let backgroundColor = "#64748b";

    if (status === "Submitted") backgroundColor = ROYAL_BLUE;
    if (status === "Matched") backgroundColor = "#16a34a";
    if (status === "Pending") backgroundColor = GOLD;

    return (
      <span
        style={{
          backgroundColor,
          color: status === "Pending" ? "black" : "white",
          padding: "5px 10px",
          borderRadius: "999px",
          fontWeight: "bold",
          fontSize: "12px",
          whiteSpace: "nowrap",
          display: "inline-block",
        }}
      >
        {status || "Submitted"}
      </span>
    );
  };

  const metricCardStyle = {
    backgroundColor: WHITE,
    borderRadius: "12px",
    padding: "18px",
    border: `1px solid ${BORDER}`,
    boxShadow: "0 2px 8px rgba(15,23,42,0.04)",
    minHeight: "110px",
  };

  const cardStyle = {
    backgroundColor: WHITE,
    padding: "20px",
    borderRadius: "12px",
    border: `1px solid ${BORDER}`,
    boxShadow: "0 2px 8px rgba(15,23,42,0.04)",
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
          Showing {filteredPreAlerts.length === 0 ? 0 : startIndex + 1} to{" "}
          {Math.min(endIndex, filteredPreAlerts.length)} of {filteredPreAlerts.length}
        </strong>

        <select
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
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
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={safeCurrentPage === 1}
          style={{
            backgroundColor: safeCurrentPage === 1 ? "#cbd5e1" : ROYAL_BLUE,
            color: WHITE,
            border: "none",
            padding: "8px 12px",
            borderRadius: "8px",
            cursor: safeCurrentPage === 1 ? "not-allowed" : "pointer",
            fontWeight: "bold",
          }}
        >
          Previous
        </button>

        <span style={{ fontWeight: "bold", color: "#334155" }}>
          Page {safeCurrentPage} of {totalPages}
        </span>

        <button
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={safeCurrentPage === totalPages}
          style={{
            backgroundColor: safeCurrentPage === totalPages ? "#cbd5e1" : ROYAL_BLUE,
            color: WHITE,
            border: "none",
            padding: "8px 12px",
            borderRadius: "8px",
            cursor: safeCurrentPage === totalPages ? "not-allowed" : "pointer",
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
          <h1 style={{ margin: 0, color: "#0f172a" }}>PreAlerts</h1>
          <p style={{ margin: "6px 0 0 0", color: MUTED }}>
            View customer-submitted prealerts and uploaded invoices.
          </p>
        </div>

        <button
          onClick={fetchPreAlerts}
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
          <div style={{ fontSize: "30px", fontWeight: "bold", color: ROYAL_BLUE, marginBottom: "8px" }}>
            {summary.total}
          </div>
          <div style={{ color: "#334155", fontWeight: "bold" }}>Total PreAlerts</div>
        </div>

        <div style={metricCardStyle}>
          <div style={{ fontSize: "30px", fontWeight: "bold", color: GOLD, marginBottom: "8px" }}>
            {summary.submitted}
          </div>
          <div style={{ color: "#334155", fontWeight: "bold" }}>Submitted</div>
        </div>

        <div style={metricCardStyle}>
          <div style={{ fontSize: "30px", fontWeight: "bold", color: "#16a34a", marginBottom: "8px" }}>
            {summary.withInvoice}
          </div>
          <div style={{ color: "#334155", fontWeight: "bold" }}>With Invoice</div>
        </div>

        <div style={metricCardStyle}>
          <div style={{ fontSize: "30px", fontWeight: "bold", color: "#64748b", marginBottom: "8px" }}>
            {summary.withoutInvoice}
          </div>
          <div style={{ color: "#334155", fontWeight: "bold" }}>Without Invoice</div>
        </div>
      </div>

      <div style={{ ...cardStyle, marginBottom: "15px" }}>
        <input
          type="text"
          placeholder="Search by prealert number, customer, EKON ID, tracking number, store, courier, item, notes, or status"
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

      <div style={cardStyle}>
        <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>All PreAlerts</h2>

        {loading ? (
          <p>Loading prealerts...</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              border="1"
              cellPadding="10"
              style={{
                minWidth: "1500px",
                width: "100%",
                borderCollapse: "collapse",
                borderColor: BORDER,
              }}
            >
              <thead style={{ backgroundColor: "#eef4ff" }}>
                <tr>
                  <th>PreAlert #</th>
                  <th>Customer</th>
                  <th>EKON ID</th>
                  <th>Tracking Number</th>
                  <th>Courier</th>
                  <th>Store</th>
                  <th>Item Description</th>
                  <th>Estimated Weight</th>
                  <th>Invoice File</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Notes</th>
                </tr>
              </thead>

              <tbody>
                {paginatedPreAlerts.length > 0 ? (
                  paginatedPreAlerts.map((item) => (
                    <tr key={item._id}>
                      <td style={{ fontWeight: "bold", color: "#334155" }}>
                        {item.preAlertNumber}
                      </td>
                      <td>{item.customerName}</td>
                      <td>{item.customerEkonId}</td>
                      <td>{item.trackingNumber}</td>
                      <td>{item.courier || "-"}</td>
                      <td>{item.storeName || "-"}</td>
                      <td>{item.itemDescription || "-"}</td>
                      <td>{Number(item.estimatedWeight || 0)}</td>
                      <td>
                        {item.invoiceFilePath ? (
                          <a
                            href={`https://eltham-konnect-backend-c2sf.onrender.com${item.invoiceFilePath}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              color: ROYAL_BLUE,
                              fontWeight: "bold",
                              textDecoration: "none",
                            }}
                          >
                            View Invoice
                          </a>
                        ) : (
                          <span style={{ color: MUTED }}>No file</span>
                        )}
                      </td>
                      <td>{statusBadge(item.status)}</td>
                      <td>{formatDate(item.date || item.createdAt)}</td>
                      <td style={{ color: "#475569" }}>{item.notes || "-"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="12" style={{ textAlign: "center", color: MUTED }}>
                      No prealerts found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ marginTop: "15px" }}>{paginationControls}</div>
    </div>
  );
}

export default PreAlerts;