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
const [weightAnalysis, setWeightAnalysis] = useState(null);
const [weightFilter, setWeightFilter] = useState("today");
const [weightStartDate, setWeightStartDate] = useState("");
const [weightEndDate, setWeightEndDate] = useState("");

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
  const ROYAL_BLUE = "#0B3D91";
  const GOLD = "#D4AF37";
  const WHITE = "#FFFFFF";
  const LIGHT_BG = "#f4f7fb";
  const BORDER = "#dbe3ef";
  const MUTED = "#64748b";

  const fetchPackages = async () => {
    try {
      const res = await axios.get(`${API}/api/packages`);
      setPackages(res.data.data || []);
    } catch (error) {
      console.error("Error loading packages:", error);
    }
  };

  const fetchWeightAnalysis = async (
  filter = weightFilter,
  startDate = weightStartDate,
  endDate = weightEndDate
) => {
  try {
    const params = new URLSearchParams();
    params.append("filter", filter);

    if (filter === "custom") {
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
    }

    const query = params.toString() ? `?${params.toString()}` : "";
    const res = await axios.get(`${API}/api/packages/weight-analysis${query}`);
    setWeightAnalysis(res.data.data || null);
  } catch (error) {
    console.error("Error loading package weight analysis:", error);
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
    fetchWeightAnalysis();
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

  const applyWeightAnalysisFilter = async () => {
  if (weightFilter === "custom" && (!weightStartDate || !weightEndDate)) {
    alert("Please select both custom start date and end date.");
    return;
  }

  await fetchWeightAnalysis(weightFilter, weightStartDate, weightEndDate);
};

const clearWeightAnalysisFilter = async () => {
  setWeightFilter("today");
  setWeightStartDate("");
  setWeightEndDate("");
  await fetchWeightAnalysis("today", "", "");
};

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
        await fetchWeightAnalysis();
      }
    } catch (error) {
      console.error("Error saving package:", error);
      alert(error?.response?.data?.message || "Package could not be saved");
    }
  };

  const updateStatus = async (trackingNumber, status) => {
    try {
      await axios.put(`${API}/api/packages/${trackingNumber}/status`, { status });
      await fetchPackages();
      await fetchWeightAnalysis();
    } catch (err) {
      console.error(err);
      alert("Status update failed");
    }
  };

  const updateBulkStatus = async () => {
    try {
      if (!bulkStatus) {
        alert("Please select a bulk status.");
        return;
      }

      if (selectedPackages.length === 0) {
        alert("Please select at least one package.");
        return;
      }

      for (const trackingNumber of selectedPackages) {
        await axios.put(`${API}/api/packages/${trackingNumber}/status`, {
          status: bulkStatus,
        });
      }

      alert("Selected package statuses updated successfully.");
      setSelectedPackages([]);
      setBulkStatus("");
      await fetchPackages();
      await fetchWeightAnalysis();
    } catch (error) {
      console.error("Bulk status update failed:", error);
      alert(error?.response?.data?.message || "Bulk status update failed");
    }
  };

  const togglePackageSelection = (trackingNumber) => {
    setSelectedPackages((prev) =>
      prev.includes(trackingNumber)
        ? prev.filter((item) => item !== trackingNumber)
        : [...prev, trackingNumber]
    );
  };

  const toggleSelectAllVisible = () => {
    const currentPageTracking = paginatedPackages.map((pkg) => pkg.trackingNumber);
    const allVisibleSelected = currentPageTracking.every((tracking) =>
      selectedPackages.includes(tracking)
    );

    if (allVisibleSelected) {
      setSelectedPackages((prev) =>
        prev.filter((tracking) => !currentPageTracking.includes(tracking))
      );
    } else {
      setSelectedPackages((prev) => [
        ...new Set([...prev, ...currentPageTracking]),
      ]);
    }
  };

  const getNextStatus = (currentStatus) => {
    if (currentStatus === "At Warehouse") return "In Transit";
    if (currentStatus === "Manifest Assigned") return "In Transit";
    if (currentStatus === "In Transit") return "Cleared Customs";
    if (currentStatus === "Cleared Customs") return "Ready for Pickup";
    if (currentStatus === "In Transit to Branch") return "Ready for Pickup";
    if (currentStatus === "Ready for Pickup") return "Delivered";
    return null;
  };

  const generateInvoice = async (customerEkonId) => {
    try {
      const readyPackages = packages.filter(
        (pkg) =>
          pkg.customerEkonId === customerEkonId &&
          (pkg.status === "Ready for Pickup" || pkg.readyForPickup === true) &&
          pkg.invoiceStatus !== "Invoiced"
      );

      if (readyPackages.length === 0) {
        alert("No ready packages for this customer.");
        return;
      }

      const pointsInput = prompt(
        `Generate ONE invoice for ${readyPackages.length} ready package(s).\n\nEnter points to redeem for this invoice (or 0):`,
        "0"
      );

      if (pointsInput === null) return;

      const res = await axios.post(`${API}/api/invoices/generate-multiple`, {
        customerEkonId,
        packageIds: readyPackages.map((pkg) => pkg._id),
        pointsToRedeem: Number(pointsInput) || 0,
      });

      alert(res.data.message || "Invoice generated successfully");
      await fetchPackages();
    } catch (error) {
      console.error("Error generating invoice:", error);
      alert(error?.response?.data?.message || "Invoice generation failed");
    }
  };

  const formatDateTime = (v) => (v ? new Date(v).toLocaleString() : "");
  const formatDate = (v) => (v ? String(v).slice(0, 10) : "");

  const getStatusBadgeStyle = (status) => {
    let bg = ROYAL_BLUE;

    if (status === "In Transit") bg = "#2563eb";
    if (status === "Cleared Customs") bg = "#7c3aed";
    if (status === "Ready for Pickup") bg = "#16a34a";
    if (status === "Delivered") bg = "#475569";
    if (status === "Manifest Assigned") bg = "#9333ea";
    if (status === "In Transit to Branch") bg = "#0f766e";

    return {
      background: bg,
      color: WHITE,
      padding: "5px 10px",
      borderRadius: "999px",
      fontWeight: "bold",
      fontSize: "12px",
      display: "inline-block",
      whiteSpace: "nowrap",
    };
  };

  const actionButtonStyle = {
    border: "none",
    padding: "9px 12px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    width: "100%",
    boxShadow: "0 1px 2px rgba(15,23,42,0.08)",
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
          Showing {filteredPackages.length === 0 ? 0 : startIndex + 1} to{" "}
          {Math.min(endIndex, filteredPackages.length)} of {filteredPackages.length}
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
          marginBottom: "20px",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1 style={{ margin: 0, color: "#0f172a" }}>Packages</h1>
          <p style={{ margin: "6px 0 0 0", color: MUTED }}>
            Manage package status, invoice uploads, and bulk workflow updates.
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
          {showForm ? "Close Form" : "+ Add Package"}
        </button>
      </div>

      <div
  style={{
    backgroundColor: WHITE,
    border: `1px solid ${BORDER}`,
    borderRadius: "12px",
    padding: "16px",
    marginBottom: "20px",
    boxShadow: "0 2px 8px rgba(15,23,42,0.04)",
  }}
>
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "12px",
      flexWrap: "wrap",
      marginBottom: "14px",
    }}
  >
    <div>
      <h2 style={{ margin: 0, color: ROYAL_BLUE }}>Weight Analysis</h2>
      <div style={{ marginTop: "6px", color: MUTED }}>
        See which package weights come in most often for a selected time period.
      </div>
    </div>
  </div>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
      gap: "12px",
      marginBottom: "16px",
      alignItems: "end",
    }}
  >
    <div>
      <label style={{ display: "block", marginBottom: "6px", fontWeight: "bold", color: "#334155" }}>
        Period
      </label>
      <select
        value={weightFilter}
        onChange={(e) => setWeightFilter(e.target.value)}
        style={{
          padding: "10px",
          width: "100%",
          borderRadius: "8px",
          border: `1px solid ${BORDER}`,
          backgroundColor: WHITE,
        }}
      >
        <option value="today">Today</option>
        <option value="thisWeek">This Week</option>
        <option value="thisMonth">This Month</option>
        <option value="thisYear">This Year</option>
        <option value="custom">Custom Range</option>
      </select>
    </div>

    {weightFilter === "custom" && (
      <>
        <div>
          <label style={{ display: "block", marginBottom: "6px", fontWeight: "bold", color: "#334155" }}>
            Start Date
          </label>
          <input
            type="date"
            value={weightStartDate}
            onChange={(e) => setWeightStartDate(e.target.value)}
            style={{
              padding: "10px",
              width: "100%",
              borderRadius: "8px",
              border: `1px solid ${BORDER}`,
            }}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "6px", fontWeight: "bold", color: "#334155" }}>
            End Date
          </label>
          <input
            type="date"
            value={weightEndDate}
            onChange={(e) => setWeightEndDate(e.target.value)}
            style={{
              padding: "10px",
              width: "100%",
              borderRadius: "8px",
              border: `1px solid ${BORDER}`,
            }}
          />
        </div>
      </>
    )}

    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
      <button
        onClick={applyWeightAnalysisFilter}
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
        Apply
      </button>

      <button
        onClick={clearWeightAnalysisFilter}
        style={{
          backgroundColor: WHITE,
          color: ROYAL_BLUE,
          border: `1px solid ${ROYAL_BLUE}`,
          padding: "10px 16px",
          borderRadius: "8px",
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        Reset
      </button>
    </div>
  </div>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
      gap: "14px",
      marginBottom: "16px",
    }}
  >
    <div
      style={{
        backgroundColor: "#eef4ff",
        border: `1px solid ${BORDER}`,
        borderRadius: "10px",
        padding: "14px",
      }}
    >
      <div style={{ color: MUTED, fontSize: "13px", marginBottom: "6px" }}>Total Packages</div>
      <div style={{ fontSize: "28px", fontWeight: "bold", color: ROYAL_BLUE }}>
        {weightAnalysis?.totalPackages || 0}
      </div>
    </div>

    <div
      style={{
        backgroundColor: "#fffbeb",
        border: `1px solid ${BORDER}`,
        borderRadius: "10px",
        padding: "14px",
      }}
    >
      <div style={{ color: MUTED, fontSize: "13px", marginBottom: "6px" }}>Most Common Weight</div>
      <div style={{ fontSize: "28px", fontWeight: "bold", color: GOLD }}>
        {weightAnalysis?.mostCommonWeight?.billedWeight
          ? `${weightAnalysis.mostCommonWeight.billedWeight} lb`
          : "-"}
      </div>
    </div>

    <div
      style={{
        backgroundColor: "#f0fdf4",
        border: `1px solid ${BORDER}`,
        borderRadius: "10px",
        padding: "14px",
      }}
    >
      <div style={{ color: MUTED, fontSize: "13px", marginBottom: "6px" }}>Most Common Count</div>
      <div style={{ fontSize: "28px", fontWeight: "bold", color: "#16a34a" }}>
        {weightAnalysis?.mostCommonWeight?.packageCount || 0}
      </div>
    </div>
  </div>

  <div style={{ overflowX: "auto" }}>
    <table
      border="1"
      cellPadding="10"
      style={{
        minWidth: "700px",
        width: "100%",
        borderCollapse: "collapse",
        borderColor: BORDER,
      }}
    >
      <thead style={{ backgroundColor: "#eef4ff" }}>
        <tr>
          <th>Billed Weight</th>
          <th>Package Count</th>
          <th>Total Actual Weight</th>
          <th>% of Packages</th>
        </tr>
      </thead>
      <tbody>
        {weightAnalysis?.groupedWeights?.length > 0 ? (
          weightAnalysis.groupedWeights.map((item) => (
            <tr key={item.billedWeight}>
              <td>{item.billedWeight} lb</td>
              <td>{item.packageCount}</td>
              <td>{item.totalActualWeight}</td>
              <td>{item.percentageOfPackages}%</td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="4" style={{ textAlign: "center", padding: "20px", color: MUTED }}>
              No weight analysis data found for this period.
            </td>
          </tr>
        )}
      </tbody>
    </table>
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
          <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>New Package</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "15px",
            }}
          >
            <input
              type="text"
              name="trackingNumber"
              placeholder="Tracking Number"
              value={formData.trackingNumber}
              onChange={handleChange}
              style={{ padding: "10px", borderRadius: "8px", border: `1px solid ${BORDER}` }}
            />

            <input
              type="text"
              name="customerEkonId"
              placeholder="Customer EKON ID"
              value={formData.customerEkonId}
              onChange={handleChange}
              style={{ padding: "10px", borderRadius: "8px", border: `1px solid ${BORDER}` }}
            />

            <input
              type="text"
              name="customerName"
              placeholder="Customer Name"
              value={formData.customerName}
              onChange={handleChange}
              style={{ padding: "10px", borderRadius: "8px", border: `1px solid ${BORDER}` }}
            />

            <input
              type="text"
              name="courier"
              placeholder="Courier"
              value={formData.courier}
              onChange={handleChange}
              style={{ padding: "10px", borderRadius: "8px", border: `1px solid ${BORDER}` }}
            />

            <input
              type="number"
              step="0.1"
              name="weight"
              placeholder="Weight"
              value={formData.weight}
              onChange={handleChange}
              style={{ padding: "10px", borderRadius: "8px", border: `1px solid ${BORDER}` }}
            />

            <input
              type="text"
              name="warehouseLocation"
              placeholder="Warehouse Location"
              value={formData.warehouseLocation}
              onChange={handleChange}
              style={{ padding: "10px", borderRadius: "8px", border: `1px solid ${BORDER}` }}
            />

            <input
              type="date"
              name="dateReceived"
              value={formData.dateReceived}
              onChange={handleChange}
              style={{ padding: "10px", borderRadius: "8px", border: `1px solid ${BORDER}` }}
            />

            <div
              style={{
                padding: "10px",
                border: `1px solid ${BORDER}`,
                borderRadius: "8px",
                backgroundColor: "#f8fafc",
                display: "flex",
                alignItems: "center",
                fontWeight: "bold",
                color: "#1e293b",
              }}
            >
              Estimated Charge: JMD {getCharge(formData.weight).toLocaleString()}
            </div>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                backgroundColor: "#f8fafc",
                border: `1px solid ${BORDER}`,
                borderRadius: "8px",
                padding: "10px",
                fontWeight: "bold",
                color: "#334155",
              }}
            >
              <input
                type="checkbox"
                name="readyForPickup"
                checked={formData.readyForPickup}
                onChange={handleChange}
              />
              Ready for Pickup
            </label>
          </div>

          <button
            onClick={savePackage}
            style={{
              marginTop: "20px",
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
            Save Package
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
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(260px, 2fr) minmax(220px, 1fr) auto",
            gap: "12px",
            alignItems: "center",
          }}
        >
          <input
            placeholder="Search by tracking, customer, EKON ID, status, or invoice info"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: "10px",
              width: "100%",
              borderRadius: "8px",
              border: `1px solid ${BORDER}`,
            }}
          />

          <select
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value)}
            style={{
              padding: "10px",
              borderRadius: "8px",
              border: `1px solid ${BORDER}`,
              backgroundColor: WHITE,
            }}
          >
            <option value="">Bulk Status Update</option>
            <option value="At Warehouse">At Warehouse</option>
            <option value="In Transit">In Transit</option>
            <option value="Cleared Customs">Cleared Customs</option>
            <option value="Ready for Pickup">Ready for Pickup</option>
            <option value="Delivered">Delivered</option>
          </select>

          <button
            onClick={updateBulkStatus}
            style={{
              backgroundColor: ROYAL_BLUE,
              color: WHITE,
              border: "none",
              padding: "10px 16px",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "bold",
              whiteSpace: "nowrap",
            }}
          >
            Update Selected
          </button>
        </div>

        <div style={{ marginTop: "10px", color: MUTED, fontSize: "14px" }}>
          {selectedPackages.length} package(s) selected on this screen.
        </div>
      </div>

      {paginationControls}

      <div
        style={{
          overflowX: "auto",
          backgroundColor: WHITE,
          border: `1px solid ${BORDER}`,
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(15,23,42,0.04)",
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
          <thead style={{ backgroundColor: "#eef4ff" }}>
            <tr>
              <th style={{ width: "48px" }}>
                <input
                  type="checkbox"
                  checked={
                    paginatedPackages.length > 0 &&
                    paginatedPackages.every((pkg) =>
                      selectedPackages.includes(pkg.trackingNumber)
                    )
                  }
                  onChange={toggleSelectAllVisible}
                />
              </th>
              <th>Tracking</th>
              <th>Customer</th>
              <th>EKON</th>
              <th style={{ width: "90px" }}>Weight</th>
              <th style={{ width: "110px" }}>Charge</th>
              <th style={{ width: "150px" }}>Status</th>
              <th style={{ width: "100px" }}>Invoice Uploaded</th>
              <th style={{ width: "120px" }}>Invoice #</th>
              <th style={{ minWidth: "160px" }}>Notes</th>
              <th style={{ width: "170px" }}>Uploaded At</th>
              <th style={{ width: "80px" }}>File</th>
              <th style={{ width: "220px" }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginatedPackages.length > 0 ? (
              paginatedPackages.map((pkg) => {
                const nextStatus = getNextStatus(pkg.status);

                return (
                  <tr key={pkg._id} style={{ backgroundColor: selectedPackages.includes(pkg.trackingNumber) ? "#f8fbff" : WHITE }}>
                    <td style={{ textAlign: "center" }}>
                      <input
                        type="checkbox"
                        checked={selectedPackages.includes(pkg.trackingNumber)}
                        onChange={() => togglePackageSelection(pkg.trackingNumber)}
                      />
                    </td>
                    <td style={{ wordBreak: "break-word", maxWidth: "220px" }}>{pkg.trackingNumber}</td>
                    <td>{pkg.customerName}</td>
                    <td>{pkg.customerEkonId}</td>
                    <td>{pkg.weight}</td>
                    <td>JMD {getCharge(pkg.weight)}</td>

                    <td>
                      <span style={getStatusBadgeStyle(pkg.status)}>{pkg.status}</span>
                    </td>

                    <td>
                      {pkg.customerInvoiceUploaded ? (
                        <span style={{ color: "#15803d", fontWeight: "bold" }}>YES</span>
                      ) : (
                        <span style={{ color: "#94a3b8" }}>NO</span>
                      )}
                    </td>

                    <td>{pkg.customerInvoiceNumber || "-"}</td>
                    <td style={{ color: "#475569" }}>{pkg.customerInvoiceNotes || "-"}</td>
                    <td>{formatDateTime(pkg.customerInvoiceUploadedAt) || "-"}</td>

                    <td>
                      {pkg.customerInvoiceFilePath ? (
                        <a
                          href={`${API}${pkg.customerInvoiceFilePath}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: ROYAL_BLUE, fontWeight: "bold", textDecoration: "none" }}
                        >
                          View
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>

                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {nextStatus ? (
                          <button
                            onClick={() => updateStatus(pkg.trackingNumber, nextStatus)}
                            style={{
                              ...actionButtonStyle,
                              backgroundColor: GOLD,
                              color: "black",
                            }}
                          >
                            {`Move to ${nextStatus}`}
                          </button>
                        ) : (
                          <button
                            disabled
                            style={{
                              ...actionButtonStyle,
                              backgroundColor: "#cbd5e1",
                              color: "#475569",
                              cursor: "not-allowed",
                            }}
                          >
                            Complete
                          </button>
                        )}

                        <button
                          onClick={() => generateInvoice(pkg.customerEkonId)}
                          style={{
                            ...actionButtonStyle,
                            backgroundColor: ROYAL_BLUE,
                            color: WHITE,
                          }}
                        >
                          Generate Invoice
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="13" style={{ textAlign: "center", padding: "20px", color: MUTED }}>
                  No packages found.
                </td>
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