import { useEffect, useMemo, useState } from "react";
import api from "../api";

function UnmatchedPackages() {
  const [packages, setPackages] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const ROYAL_BLUE = "#0B3D91";
  const WHITE = "#ffffff";
  const BORDER = "#dbe3ef";
  const MUTED = "#64748b";

  const fetchUnmatchedPackages = async () => {
    try {
      const res = await api.get("/api/unmatched-packages");
      setPackages(res.data.data || []);
    } catch (error) {
      console.error("Error loading unmatched packages:", error);
      alert(error?.response?.data?.message || "Could not load unmatched packages.");
    }
  };

  useEffect(() => {
    fetchUnmatchedPackages();
  }, []);

  const filteredPackages = useMemo(() => {
    return packages.filter((pkg) =>
      `${pkg.unmatchedNumber} ${pkg.trackingNumber} ${pkg.customerEkonId} ${pkg.customerName} ${pkg.courier} ${pkg.integrationSource} ${pkg.issueReason} ${pkg.status}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  }, [packages, searchTerm]);

  const formatDate = (value) => {
    if (!value) return "";
    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  };

  const statusBadge = (status) => {
    const color =
      status === "Pending Review"
        ? "#f59e0b"
        : status === "Resolved"
        ? "#16a34a"
        : "#64748b";

    return (
      <span
        style={{
          backgroundColor: color,
          color: WHITE,
          padding: "5px 10px",
          borderRadius: "999px",
          fontWeight: "bold",
          fontSize: "12px",
          whiteSpace: "nowrap",
        }}
      >
        {status}
      </span>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ margin: 0 }}>Unmatched Packages</h1>
        <p style={{ margin: "6px 0 0", color: MUTED }}>
          Review packages received from freight partners that could not be matched to a customer.
        </p>
      </div>

      <div
        style={{
          backgroundColor: WHITE,
          border: `1px solid ${BORDER}`,
          borderRadius: "12px",
          padding: "16px",
          marginBottom: "16px",
        }}
      >
        <input
          type="text"
          placeholder="Search unmatched packages"
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

      <div
        style={{
          backgroundColor: WHITE,
          border: `1px solid ${BORDER}`,
          borderRadius: "12px",
          padding: "16px",
        }}
      >
        <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>
          Pending Review Queue
        </h2>

        <div
          style={{
            overflowX: "auto",
            overflowY: "auto",
            maxHeight: "70vh",
            border: `1px solid ${BORDER}`,
            borderRadius: "12px",
          }}
        >
          <table
            border="1"
            cellPadding="10"
            style={{
              minWidth: "1600px",
              width: "100%",
              borderCollapse: "collapse",
              borderColor: BORDER,
            }}
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
                <th>Unmatched No.</th>
                <th>Tracking Number</th>
                <th>Customer EKON ID</th>
                <th>Customer Name</th>
                <th>Courier</th>
                <th>Weight</th>
                <th>Warehouse</th>
                <th>Source</th>
                <th>Issue Reason</th>
                <th>Status</th>
                <th>Date Received</th>
              </tr>
            </thead>

            <tbody>
              {filteredPackages.length > 0 ? (
                filteredPackages.map((pkg) => (
                  <tr key={pkg._id}>
                    <td>{pkg.unmatchedNumber}</td>
                    <td>{pkg.trackingNumber}</td>
                    <td>{pkg.customerEkonId || "Missing"}</td>
                    <td>{pkg.customerName || "—"}</td>
                    <td>{pkg.courier || "—"}</td>
                    <td>{pkg.weight || 0}</td>
                    <td>{pkg.warehouseLocation || "—"}</td>
                    <td>{pkg.integrationSource || "—"}</td>
                    <td style={{ color: "#dc2626", fontWeight: "bold" }}>
                      {pkg.issueReason}
                    </td>
                    <td>{statusBadge(pkg.status)}</td>
                    <td>{formatDate(pkg.dateReceived || pkg.createdAt)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="11" style={{ textAlign: "center", color: MUTED }}>
                    No unmatched packages found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default UnmatchedPackages;