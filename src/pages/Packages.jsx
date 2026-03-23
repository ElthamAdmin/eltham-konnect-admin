import { useEffect, useMemo, useState } from "react";
import axios from "axios";

function Packages() {
  const [packages, setPackages] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [rateMap, setRateMap] = useState({});
  const [selectedPackages, setSelectedPackages] = useState([]);
  const [bulkStatus, setBulkStatus] = useState("");

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

  const filteredPackages = useMemo(() => {
    return packages.filter((pkg) =>
      `${pkg.trackingNumber} ${pkg.customerName} ${pkg.customerEkonId}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  }, [packages, searchTerm]);

  const getCharge = (w) => {
    const r = Math.ceil(Number(w || 0));
    return rateMap[r] || 0;
  };

  const updateStatus = async (trackingNumber, status) => {
    try {
      await axios.put(`${API}/api/packages/${trackingNumber}/status`, { status });
      fetchPackages();
    } catch (err) {
      alert("Status update failed");
    }
  };

  const formatDate = (v) => (v ? new Date(v).toLocaleDateString() : "");
  const formatDateTime = (v) =>
    v ? new Date(v).toLocaleString() : "";

  return (
    <div>
      <h1>Packages</h1>

      {/* SEARCH */}
      <input
        placeholder="Search..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ padding: 10, marginBottom: 15, width: "100%" }}
      />

      {/* TABLE */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ minWidth: "2000px", width: "100%" }}>
          <thead>
            <tr>
              <th>Tracking</th>
              <th>Customer</th>
              <th>EKON</th>
              <th>Weight</th>
              <th>Charge</th>
              <th>Status</th>

              {/* 🔥 NEW INVOICE SECTION */}
              <th>Invoice Uploaded</th>
              <th>Invoice #</th>
              <th>Notes</th>
              <th>Uploaded At</th>
              <th>File</th>

              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredPackages.map((pkg) => (
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

                {/* 🔥 CUSTOMER INVOICE DATA */}
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
                    onClick={() =>
                      updateStatus(pkg.trackingNumber, "In Transit")
                    }
                  >
                    Move
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Packages;