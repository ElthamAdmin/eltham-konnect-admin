import { useEffect, useMemo, useState } from "react";
import axios from "axios";

function PointsHistory() {
  const [history, setHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get(
          "https://eltham-konnect-backend-c2sf.onrender.com/api/customers/points-history"
        );
        setHistory(res.data.data || []);
      } catch (error) {
        console.error("Error loading points history:", error);
      }
    };

    fetchHistory();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize]);

  const filteredHistory = useMemo(() => {
    return history.filter((item) =>
      `${item.customerEkonId} ${item.customerName} ${item.action} ${item.points} ${item.date}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  }, [history, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedHistory = filteredHistory.slice(startIndex, endIndex);

  const paginationControls = (
    <div
      style={{
        backgroundColor: "white",
        border: "1px solid #ddd",
        borderRadius: "8px",
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
        <strong>
          Showing {filteredHistory.length === 0 ? 0 : startIndex + 1} to{" "}
          {Math.min(endIndex, filteredHistory.length)} of {filteredHistory.length}
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

      <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
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
      <h1>Points History</h1>

      <input
        type="text"
        placeholder="Search by EKON ID, customer name, action, points, or date"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{
          width: "100%",
          padding: "12px",
          marginBottom: "15px",
          borderRadius: "6px",
          border: "1px solid #ccc",
        }}
      />

      {paginationControls}

      <div
  style={{
    overflowX: "auto",
    overflowY: "auto",
    maxHeight: "70vh",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
  }}
>
        <table
          border="1"
          cellPadding="10"
          style={{ width: "100%", minWidth: "1000px", borderCollapse: "collapse" }}
        >
          <thead
  style={{
    backgroundColor: "#eef4ff",
    position: "sticky",
    top: 0,
    zIndex: 5,
  }}
>
            <tr>
              <th
  style={{
    position: "sticky",
    left: 0,
    backgroundColor: "#eef4ff",
    zIndex: 6,
    minWidth: "160px",
  }}
>
  Customer EKON ID
</th>
              <th>Customer Name</th>
              <th>Action</th>
              <th>Points</th>
              <th>Date</th>
            </tr>
          </thead>

          <tbody>
            {paginatedHistory.length > 0 ? (
              paginatedHistory.map((item, index) => (
                <tr key={item._id || index}>
                  <td
  style={{
    position: "sticky",
    left: 0,
    backgroundColor: "white",
    zIndex: 4,
    minWidth: "160px",
    boxShadow: "4px 0 8px rgba(15,23,42,0.08)",
  }}
>
  {item.customerEkonId}
</td>
                  <td>{item.customerName}</td>
                  <td>{item.action}</td>
                  <td>{item.points}</td>
                  <td>{item.date}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5">No points history found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: "15px" }}>{paginationControls}</div>
    </div>
  );
}

export default PointsHistory;