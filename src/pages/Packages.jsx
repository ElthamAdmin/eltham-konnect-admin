import { useEffect, useMemo, useState } from "react";
import axios from "axios";

function Packages() {
  const [packages, setPackages] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [rateMap, setRateMap] = useState({});
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

  const generateInvoice = async (customerEkonId) => {
    try {
      const customerPackages = packages.filter(
        (pkg) =>
          pkg.customerEkonId === customerEkonId &&
          (pkg.status === "Ready for Pickup" || pkg.readyForPickup === true) &&
          pkg.invoiceStatus !== "Invoiced"
      );

      if (customerPackages.length === 0) {
        alert("No READY packages available for invoicing.");
        return;
      }

      if (
        !window.confirm(
          `Generate ONE invoice for ${customerPackages.length} ready package(s)?`
        )
      )
        return;

      const res = await axios.post(`${API}/api/invoices/generate-multiple`, {
        customerEkonId,
        packageIds: customerPackages.map((p) => p._id),
      });

      alert(res.data.message || "Invoice generated successfully");
      fetchPackages();
    } catch (error) {
      console.error(error);
      alert(error?.response?.data?.message || "Invoice generation failed");
    }
  };

  const filteredPackages = useMemo(() => {
    return packages.filter((pkg) =>
      `${pkg.trackingNumber} ${pkg.customerName} ${pkg.customerEkonId}`
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
    } catch {
      alert("Status update failed");
    }
  };

  const formatDateTime = (v) => (v ? new Date(v).toLocaleString() : "");

  return (
    <div>
      <h1>Packages</h1>

      <input
        placeholder="Search..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ padding: "10px", width: "100%", marginBottom: "15px" }}
      />

      <div style={{ overflowX: "auto" }}>
        <table border="1" cellPadding="10" style={{ width: "100%" }}>
          <thead>
            <tr>
              <th>Tracking</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Date Received</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginatedPackages.map((pkg) => (
              <tr key={pkg._id}>
                <td>{pkg.trackingNumber}</td>
                <td>{pkg.customerName}</td>
                <td>{pkg.status}</td>
                <td>{formatDateTime(pkg.dateReceived)}</td>

                <td>
                  <button
                    onClick={() =>
                      updateStatus(pkg.trackingNumber, "In Transit")
                    }
                    style={{
                      backgroundColor: "#D4AF37",
                      border: "none",
                      padding: "6px 10px",
                      marginBottom: "5px",
                      display: "block",
                    }}
                  >
                    Move to In Transit
                  </button>

                  <button
                    onClick={() => generateInvoice(pkg.customerEkonId)}
                    style={{
                      backgroundColor: "#6b7280",
                      color: "white",
                      border: "none",
                      padding: "6px 10px",
                      display: "block",
                    }}
                  >
                    Generate Invoice
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: "15px" }}>
        <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}>
          Prev
        </button>
        <span style={{ margin: "0 10px" }}>
          Page {safeCurrentPage} of {totalPages}
        </span>
        <button
          onClick={() =>
            setCurrentPage((p) => Math.min(p + 1, totalPages))
          }
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default Packages;