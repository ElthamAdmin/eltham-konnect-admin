import { useEffect, useState } from "react";
import axios from "axios";

function Packages() {
  const [packages, setPackages] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [rateMap, setRateMap] = useState({});

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

  const fetchPackages = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/packages");
      setPackages(res.data.data || []);
    } catch (error) {
      console.error("Error loading packages:", error);
    }
  };

  const fetchRates = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/shipping-rates");
      const rates = res.data.data || [];
      const mapped = {};

      rates.forEach((rate) => {
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

  const filteredPackages = packages.filter((pkg) =>
    `${pkg.trackingNumber} ${pkg.customerEkonId} ${pkg.customerName}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const getChargeByWeight = (weight) => {
    const roundedWeight = Math.ceil(Number(weight || 0));
    return rateMap[roundedWeight] || 0;
  };

  const savePackage = async () => {
    try {
      const res = await axios.post(
        "http://localhost:5000/api/packages",
        formData
      );

      if (res.data.success) {
        setPackages([res.data.data, ...packages]);
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

        alert("Package saved successfully");
      }
    } catch (error) {
      console.error(error);
      alert(error?.response?.data?.message || "Package could not be saved");
    }
  };

  const generateInvoice = async (customerEkonId) => {
    const pointsInput = prompt(
      "Enter points to redeem for this invoice (or 0):",
      "0"
    );

    if (pointsInput === null) return;

    try {
      const res = await axios.post("http://localhost:5000/api/invoices", {
        customerEkonId,
        pointsToRedeem: Number(pointsInput) || 0,
      });

      alert(res.data.message);
      await fetchPackages();
    } catch (error) {
      console.error("Error generating invoice:", error);
      alert(
        error?.response?.data?.message || "Invoice could not be generated."
      );
    }
  };

  const updateStatus = async (trackingNumber, newStatus) => {
    try {
      const res = await axios.put(
        `http://localhost:5000/api/packages/${trackingNumber}/status`,
        { status: newStatus }
      );

      alert(res.data.message);
      await fetchPackages();
    } catch (error) {
      console.error("Error updating package status:", error);
      alert(error?.response?.data?.message || "Could not update package status.");
    }
  };

  const getNextStatus = (currentStatus) => {
    if (currentStatus === "At Warehouse") return "In Transit";
    if (currentStatus === "In Transit") return "Cleared Customs";
    if (currentStatus === "Cleared Customs") return "Ready for Pickup";
    if (currentStatus === "Ready for Pickup") return "Delivered";
    return null;
  };

  const getStatusColor = (status) => {
    if (status === "Ready for Pickup") return "green";
    if (status === "At Warehouse") return "orange";
    if (status === "Delivered") return "#475569";
    if (status === "In Transit") return "#0ea5e9";
    if (status === "Cleared Customs") return "#7c3aed";
    return "gray";
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h1>Packages</h1>

        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            backgroundColor: "#0B3D91",
            color: "white",
            border: "none",
            padding: "10px 16px",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          {showForm ? "Close Form" : "+ Add Package"}
        </button>
      </div>

      {showForm && (
        <div
          style={{
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "8px",
            marginBottom: "20px",
            border: "1px solid #ddd",
          }}
        >
          <h2>New Package</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "15px",
            }}
          >
            <input
              type="text"
              name="trackingNumber"
              placeholder="Tracking Number"
              value={formData.trackingNumber}
              onChange={handleChange}
              style={{ padding: "10px" }}
            />

            <input
              type="text"
              name="customerEkonId"
              placeholder="Customer EKON ID"
              value={formData.customerEkonId}
              onChange={handleChange}
              style={{ padding: "10px" }}
            />

            <input
              type="text"
              name="customerName"
              placeholder="Customer Name"
              value={formData.customerName}
              onChange={handleChange}
              style={{ padding: "10px" }}
            />

            <input
              type="text"
              name="courier"
              placeholder="Courier"
              value={formData.courier}
              onChange={handleChange}
              style={{ padding: "10px" }}
            />

            <input
              type="number"
              step="0.1"
              name="weight"
              placeholder="Weight"
              value={formData.weight}
              onChange={handleChange}
              style={{ padding: "10px" }}
            />

            <input
              type="text"
              name="warehouseLocation"
              placeholder="Warehouse Location"
              value={formData.warehouseLocation}
              onChange={handleChange}
              style={{ padding: "10px" }}
            />

            <input
              type="date"
              name="dateReceived"
              value={formData.dateReceived}
              onChange={handleChange}
              style={{ padding: "10px" }}
            />

            <div
              style={{
                padding: "10px",
                border: "1px solid #ccc",
                borderRadius: "6px",
                backgroundColor: "#f8fafc",
                display: "flex",
                alignItems: "center",
                fontWeight: "bold",
              }}
            >
              Estimated Charge: JMD {getChargeByWeight(formData.weight).toLocaleString()}
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: "10px" }}>
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
              backgroundColor: "#D4AF37",
              color: "black",
              border: "none",
              padding: "10px 16px",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Save Package
          </button>
        </div>
      )}

      <input
        type="text"
        placeholder="Search by tracking number, EKON ID, or customer"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{
          width: "100%",
          padding: "10px",
          marginBottom: "15px",
          borderRadius: "6px",
          border: "1px solid #ccc",
        }}
      />

      <div style={{ overflowX: "auto" }}>
        <table border="1" cellPadding="10" style={{ minWidth: "1500px", width: "100%" }}>
          <thead>
            <tr>
              <th>Tracking Number</th>
              <th>Customer EKON ID</th>
              <th>Customer Name</th>
              <th>Courier</th>
              <th>Weight</th>
              <th>Estimated Charge</th>
              <th>Status</th>
              <th>Warehouse Location</th>
              <th>Invoice Status</th>
              <th>Ready for Pickup</th>
              <th>Date Received</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredPackages.map((pkg, index) => (
              <tr key={pkg._id || index}>
                <td>{pkg.trackingNumber}</td>
                <td>{pkg.customerEkonId}</td>
                <td>{pkg.customerName}</td>
                <td>{pkg.courier}</td>
                <td>{pkg.weight}</td>
                <td>JMD {getChargeByWeight(pkg.weight).toLocaleString()}</td>
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
                <td>{pkg.invoiceStatus}</td>
                <td>{pkg.readyForPickup ? "Yes" : "No"}</td>
                <td>{pkg.dateReceived}</td>
                <td>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {getNextStatus(pkg.status) && (
                      <button
                        onClick={() =>
                          updateStatus(pkg.trackingNumber, getNextStatus(pkg.status))
                        }
                        style={{
                          backgroundColor: "#D4AF37",
                          color: "black",
                          border: "none",
                          padding: "6px 10px",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        Move to {getNextStatus(pkg.status)}
                      </button>
                    )}

                    <button
                      onClick={() => generateInvoice(pkg.customerEkonId)}
                      disabled={!pkg.readyForPickup || pkg.invoiceStatus !== "Pending"}
                      style={{
                        backgroundColor:
                          pkg.readyForPickup && pkg.invoiceStatus === "Pending"
                            ? "#0B3D91"
                            : "#999",
                        color: "white",
                        border: "none",
                        padding: "6px 10px",
                        borderRadius: "4px",
                        cursor:
                          pkg.readyForPickup && pkg.invoiceStatus === "Pending"
                            ? "pointer"
                            : "not-allowed",
                      }}
                    >
                      Generate Invoice
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filteredPackages.length === 0 && (
              <tr>
                <td colSpan="12">No packages found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Packages;