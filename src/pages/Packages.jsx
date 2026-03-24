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
      `${pkg.trackingNumber} ${pkg.customerName} ${pkg.customerEkonId} ${pkg.customerInvoiceNumber || ""} ${pkg.customerInvoiceNotes || ""} ${pkg.status} ${pkg.courier || ""} ${pkg.warehouseLocation || ""}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  }, [packages, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredPackages.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedPackages = filteredPackages.slice(startIndex, endIndex);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const getCharge = (w) => {
    const r = Math.ceil(Number(w || 0));
    return rateMap[r] || 0;
  };

  const savePackage = async () => {
    try {
      const payload = {
        ...formData,
        weight: Number(formData.weight || 0),
      };

      const res = await axios.post(`${API}/api/packages`, payload);

      if (res.data.success) {
        alert("Package saved successfully");
        setShowForm(false);
        setFormData({
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
        await fetchPackages();
      }
    } catch (error) {
      console.error("Error saving package:", error);
      alert(error?.response?.data?.message || "Package could not be saved");
    }
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

  // ✅ ONLY ADDITION
  const generateInvoice = async (customerEkonId) => {
    try {
      const readyPackages = packages.filter(
        (pkg) =>
          pkg.customerEkonId === customerEkonId &&
          (pkg.status === "Ready for Pickup" || pkg.readyForPickup === true) &&
          pkg.invoiceStatus !== "Invoiced"
      );

      if (readyPackages.length === 0) {
        alert("No ready packages for this customer");
        return;
      }

      const res = await axios.post(`${API}/api/invoices/generate-multiple`, {
        customerEkonId,
        packageIds: readyPackages.map((p) => p._id),
        pointsToRedeem: 0,
      });

      alert(res.data.message || "Invoice generated");
      fetchPackages();
    } catch (error) {
      console.error(error);
      alert("Failed to generate invoice");
    }
  };

  const formatDateTime = (v) => (v ? new Date(v).toLocaleString() : "");

  const paginationControls = (
    <div style={{ backgroundColor: "white", border: "1px solid #ddd", borderRadius: "8px", padding: "12px 15px", marginBottom: "15px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
      <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
        <strong>
          Showing {filteredPackages.length === 0 ? 0 : startIndex + 1} to {Math.min(endIndex, filteredPackages.length)} of {filteredPackages.length}
        </strong>

        <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid #ccc" }}>
          <option value={10}>10 per page</option>
          <option value={25}>25 per page</option>
          <option value={50}>50 per page</option>
          <option value={100}>100 per page</option>
        </select>
      </div>

      <div style={{ display: "flex", gap: "8px" }}>
        <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}>Previous</button>
        <span>Page {safeCurrentPage} of {totalPages}</span>
        <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}>Next</button>
      </div>
    </div>
  );

  return (
    <div>
      <h1>Packages</h1>

      {paginationControls}

      <table border="1" cellPadding="10" style={{ width: "100%" }}>
        <thead>
          <tr>
            <th>Tracking</th>
            <th>Customer</th>
            <th>EKON</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {paginatedPackages.map((pkg) => (
            <tr key={pkg._id}>
              <td>{pkg.trackingNumber}</td>
              <td>{pkg.customerName}</td>
              <td>{pkg.customerEkonId}</td>
              <td>{pkg.status}</td>

              <td>
                <button onClick={() => updateStatus(pkg.trackingNumber, "In Transit")}>
                  Move
                </button>

                {/* ✅ ONLY ADDITION */}
                <button onClick={() => generateInvoice(pkg.customerEkonId)}>
                  Generate Invoice
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {paginationControls}
    </div>
  );
}

export default Packages;