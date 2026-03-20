import { useEffect, useState } from "react";
import axios from "axios";

function WarehouseManagement() {
  const [packages, setPackages] = useState([]);

  const fetchPackages = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/packages");
      setPackages(res.data.data || []);
    } catch (error) {
      console.error("Error loading warehouse packages:", error);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const updateStatus = async (trackingNumber, newStatus) => {
    try {
      const res = await axios.put(
        `http://localhost:5000/api/packages/${trackingNumber}/status`,
        { status: newStatus }
      );

      alert(res.data.message);
      await fetchPackages();
    } catch (error) {
      console.error("Error updating warehouse status:", error);
      alert(error?.response?.data?.message || "Could not update package status.");
    }
  };

  const getNextStatus = (currentStatus) => {
    if (currentStatus === "At Warehouse") return "Manifest Assigned";
    if (currentStatus === "Manifest Assigned") return "In Transit";
    if (currentStatus === "In Transit") return "Cleared Customs";
    if (currentStatus === "Cleared Customs") return "Ready for Pickup";
    if (currentStatus === "Ready for Pickup") return "Delivered";
    return null;
  };

  const getStatusColor = (status) => {
    if (status === "At Warehouse") return "#f59e0b";
    if (status === "Manifest Assigned") return "#7c3aed";
    if (status === "In Transit") return "#2563eb";
    if (status === "Cleared Customs") return "#0ea5e9";
    if (status === "Ready for Pickup") return "#16a34a";
    if (status === "Delivered") return "#475569";
    return "#64748b";
  };

  const atWarehouse = packages.filter((pkg) => pkg.status === "At Warehouse").length;
  const manifestAssigned = packages.filter((pkg) => pkg.status === "Manifest Assigned").length;
  const inTransit = packages.filter((pkg) => pkg.status === "In Transit").length;
  const clearedCustoms = packages.filter((pkg) => pkg.status === "Cleared Customs").length;
  const readyForPickup = packages.filter((pkg) => pkg.status === "Ready for Pickup").length;
  const delivered = packages.filter((pkg) => pkg.status === "Delivered").length;

  const cardStyle = {
    backgroundColor: "white",
    borderRadius: "10px",
    padding: "20px",
    border: "1px solid #e5e7eb",
  };

  return (
    <div>
      <h1>Warehouse Management</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "20px",
          marginBottom: "30px",
        }}
      >
        <div style={cardStyle}>
          <h2>{atWarehouse}</h2>
          <p>At Warehouse</p>
        </div>

        <div style={cardStyle}>
          <h2>{manifestAssigned}</h2>
          <p>Manifest Assigned</p>
        </div>

        <div style={cardStyle}>
          <h2>{inTransit}</h2>
          <p>In Transit</p>
        </div>

        <div style={cardStyle}>
          <h2>{clearedCustoms}</h2>
          <p>Cleared Customs</p>
        </div>

        <div style={cardStyle}>
          <h2>{readyForPickup}</h2>
          <p>Ready for Pickup</p>
        </div>

        <div style={cardStyle}>
          <h2>{delivered}</h2>
          <p>Delivered</p>
        </div>
      </div>

      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "10px",
          border: "1px solid #e5e7eb",
        }}
      >
        <h2>Warehouse Package Flow</h2>

        <table border="1" cellPadding="10" style={{ width: "100%" }}>
          <thead>
            <tr>
              <th>Tracking Number</th>
              <th>Customer EKON ID</th>
              <th>Customer Name</th>
              <th>Courier</th>
              <th>Weight</th>
              <th>Status</th>
              <th>Warehouse Location</th>
              <th>Date Received</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {packages.length > 0 ? (
              packages.map((pkg, index) => (
                <tr key={pkg._id || index}>
                  <td>{pkg.trackingNumber}</td>
                  <td>{pkg.customerEkonId}</td>
                  <td>{pkg.customerName}</td>
                  <td>{pkg.courier}</td>
                  <td>{pkg.weight}</td>
                  <td>
                    <span
                      style={{
                        padding: "4px 10px",
                        borderRadius: "6px",
                        color: "white",
                        backgroundColor: getStatusColor(pkg.status),
                      }}
                    >
                      {pkg.status}
                    </span>
                  </td>
                  <td>{pkg.warehouseLocation}</td>
                  <td>
                    {pkg.dateReceived
                      ? new Date(pkg.dateReceived).toISOString().split("T")[0]
                      : ""}
                  </td>
                  <td>
                    {getNextStatus(pkg.status) ? (
                      <button
                        onClick={() =>
                          updateStatus(pkg.trackingNumber, getNextStatus(pkg.status))
                        }
                        style={{
                          backgroundColor: "#0B3D91",
                          color: "white",
                          border: "none",
                          padding: "8px 12px",
                          borderRadius: "6px",
                          cursor: "pointer",
                        }}
                      >
                        Move to {getNextStatus(pkg.status)}
                      </button>
                    ) : (
                      <span style={{ color: "#64748b", fontWeight: "bold" }}>
                        Complete
                      </span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9">No warehouse packages found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default WarehouseManagement;