import { useEffect, useMemo, useState } from "react";
import axios from "axios";

function Packages() {
  const [packages, setPackages] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [rateMap, setRateMap] = useState({});
  const [selectedPackages, setSelectedPackages] = useState([]);
  const [bulkStatus, setBulkStatus] = useState("");
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  const [formData, setFormData] = useState({
    trackingNumber: "",
    customerEkonId: "",
    customerName: "",
    courier: "",
    weight: "",
    status: "At Warehouse",
    warehouseLocation: "",
    invoiceStatus: "Pending",
    readyForPickup: false,
    dateReceived: "",
  });

  const API = "https://eltham-konnect-backend-c2sf.onrender.com";

  const fetchPackages = async () => {
    try {
      const res = await axios.get(`${API}/api/packages`);
      setPackages(res.data.data || []);
    } catch (error) {
      console.error("Error loading packages:", error);
    }
  };

  const fetchRates = async () => {
    try {
      const res = await axios.get(`${API}/api/shipping-rates`);
      const mapped = {};
      (res.data.data || []).forEach((rate) => {
        mapped[Number(rate.weight)] = Number(rate.price);
      });
      setRateMap(mapped);
    } catch (error) {
      console.error("Error loading rates:", error);
    }
  };

  useEffect(() => {
    fetchPackages();
    fetchRates();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize]);

  const filteredPackages = useMemo(() => {
    return packages.filter((pkg) =>
      `${pkg.trackingNumber} ${pkg.customerName} ${pkg.customerEkonId} ${pkg.customerInvoiceNumber || ""} ${pkg.customerInvoiceNotes || ""} ${pkg.status}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  }, [packages, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredPackages.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedPackages = filteredPackages.slice(startIndex, endIndex);

  const getCharge = (w) => {
    const r = Math.ceil(Number(w || 0));
    return rateMap[r] || 0;
  };

  const updateStatus = async (trackingNumber, status) => {
    try {
      await axios.put(`${API}/api/packages/${trackingNumber}/status`, { status });
      fetchPackages();
    } catch (err) {
      console.error(err);
      alert("Status update failed");
    }
  };

  const formatDateTime = (v) => (v ? new Date(v).toLocaleString() : "");

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
          Showing {filteredPackages.length === 0 ? 0 : startIndex + 1} to{" "}
          {Math.min(endIndex, filteredPackages.length)} of {filteredPackages.length}
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
      <h1>Packages</h1>

      <input
        placeholder="Search by tracking, customer, EKON ID, status, or invoice info"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{
          padding: "10px",
          marginBottom: "15px",
          width: "100%",
          borderRadius: "6px",
          border: "1px solid #ccc",
        }}
      />

      {paginationControls}

      <div style={{ overflowX: "auto" }}>
        <table
          border="1"
          cellPadding="10"
          style={{ minWidth: "2000px", width: "100%", borderCollapse: "collapse" }}
        >
          <thead>
            <tr>
              <th>Tracking</th>
              <th>Customer</th>
              <th>EKON</th>
              <th>Weight</th>
              <th>Charge</th>
              <th>Status</th>
              <th>Invoice Uploaded</th>
              <th>Invoice #</th>
              <th>Notes</th>
              <th>Uploaded At</th>
              <th>File</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginatedPackages.length > 0 ? (
              paginatedPackages.map((pkg) => (
                <tr key={pkg._id}>
                  <td>{pkg.trackingNumber}</td>
                  <td>{pkg.customerName}</td>
                  <td>{pkg.customerEkonId}</td>
                  <td>{pkg.weight}</td>
                  <td>JMD {getCharge(pkg.weight)}</td>

                  <td>
                    <span
                      style={{
                        background: "#0B3D91",
                        color: "white",
                        padding: "4px 8px",
                        borderRadius: "6px",
                      }}
                    >
                      {pkg.status}
                    </span>
                  </td>

                  <td>
                    {pkg.customerInvoiceUploaded ? (
                      <span style={{ color: "green", fontWeight: "bold" }}>
                        YES
                      </span>
                    ) : (
                      <span style={{ color: "#999" }}>NO</span>
                    )}
                  </td>

                  <td>{pkg.customerInvoiceNumber || "-"}</td>
                  <td>{pkg.customerInvoiceNotes || "-"}</td>
                  <td>{formatDateTime(pkg.customerInvoiceUploadedAt)}</td>

                  <td>
                    {pkg.customerInvoiceFilePath ? (
                      <a
                        href={`${API}${pkg.customerInvoiceFilePath}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: "#0B3D91", fontWeight: "bold" }}
                      >
                        View
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>

                  <td>
                    <button
                      onClick={() => updateStatus(pkg.trackingNumber, "In Transit")}
                      style={{
                        backgroundColor: "#D4AF37",
                        color: "black",
                        border: "none",
                        padding: "6px 10px",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      Move
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="12">No packages found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: "15px" }}>{paginationControls}</div>
    </div>
  );
}

export default Packages;