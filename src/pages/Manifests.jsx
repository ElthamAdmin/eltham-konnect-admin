import { useEffect, useMemo, useState } from "react";
import axios from "axios";

const API_BASE = "https://eltham-konnect-backend-c2sf.onrender.com/api";

function Manifests() {
  const [manifests, setManifests] = useState([]);
  const [packages, setPackages] = useState([]);
  const [rateMap, setRateMap] = useState({});
  const [origin, setOrigin] = useState("Florida");
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [expanded, setExpanded] = useState({});

  const isMobile = window.innerWidth <= 768;

  const ROYAL_BLUE = "#0B3D91";
  const GOLD = "#D4AF37";
  const WHITE = "#ffffff";
  const BORDER = "#dbe3ef";
  const MUTED = "#64748b";

  const fetchManifests = async () => {
    const res = await axios.get(`${API_BASE}/manifests`);
    setManifests(res.data.data || []);
  };

  const fetchPackages = async () => {
    const res = await axios.get(`${API_BASE}/packages`);
    setPackages(res.data.data || []);
  };

  const fetchRates = async () => {
    const res = await axios.get(`${API_BASE}/shipping-rates`);
    const mapped = {};
    (res.data.data || []).forEach((rate) => {
      mapped[Number(rate.weight)] = Number(rate.price);
    });
    setRateMap(mapped);
  };

  useEffect(() => {
    fetchManifests();
    fetchPackages();
    fetchRates();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize]);

  const packageMap = useMemo(() => {
    const mapped = {};
    packages.forEach((pkg) => {
      mapped[pkg.trackingNumber] = pkg;
    });
    return mapped;
  }, [packages]);

  const getCharge = (weight) => {
    const billedWeight = Math.ceil(Number(weight || 0));
    return rateMap[billedWeight] || 0;
  };

  const getManifestStats = (manifest) => {
    const manifestPackages = (manifest.packages || [])
      .map((tracking) => packageMap[tracking])
      .filter(Boolean);

    const totalWeight = manifestPackages.reduce(
      (sum, pkg) => sum + Number(pkg.weight || 0),
      0
    );

    const estimatedRevenue = manifestPackages.reduce(
      (sum, pkg) => sum + getCharge(pkg.weight),
      0
    );

    return { totalWeight, estimatedRevenue };
  };

  const filteredManifests = useMemo(() => {
    return manifests.filter((manifest) =>
      `${manifest.manifestNumber} ${manifest.origin} ${manifest.status} ${(manifest.packages || []).join(" ")}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  }, [manifests, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredManifests.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedManifests = filteredManifests.slice(startIndex, endIndex);

  const createManifest = async () => {
    try {
      const res = await axios.post(`${API_BASE}/manifests`, { origin });
      alert(res.data.message || "Manifest created successfully.");
      setOrigin("Florida");
      await fetchManifests();
    } catch (error) {
      alert(error?.response?.data?.message || "Could not create manifest.");
    }
  };

  const editManifest = async (manifest) => {
    const newOrigin = prompt("Enter new manifest origin", manifest.origin);
    if (!newOrigin) return;

    try {
      const res = await axios.put(`${API_BASE}/manifests/${manifest.manifestNumber}`, {
        origin: newOrigin,
      });
      alert(res.data.message || "Manifest updated.");
      await fetchManifests();
    } catch (error) {
      alert(error?.response?.data?.message || "Could not update manifest.");
    }
  };

  const deleteManifest = async (manifestNumber) => {
    if (!window.confirm("Delete this manifest? Packages will be returned to At Warehouse.")) return;

    try {
      const res = await axios.delete(`${API_BASE}/manifests/${manifestNumber}`);
      alert(res.data.message || "Manifest deleted.");
      await fetchManifests();
      await fetchPackages();
    } catch (error) {
      alert(error?.response?.data?.message || "Could not delete manifest.");
    }
  };

  const openAddPackage = async (manifestNumber) => {
    const tracking = prompt("Enter package tracking number");
    if (!tracking) return;

    try {
      const res = await axios.post(`${API_BASE}/manifests/${manifestNumber}/add-package`, {
        trackingNumber: tracking.trim(),
      });
      alert(res.data.message || "Package added.");
      await fetchManifests();
      await fetchPackages();
    } catch (error) {
      alert(error?.response?.data?.message || "Package could not be added.");
    }
  };

  const removePackage = async (manifestNumber) => {
    const tracking = prompt("Enter package tracking number to remove");
    if (!tracking) return;

    try {
      const res = await axios.post(`${API_BASE}/manifests/${manifestNumber}/remove-package`, {
        trackingNumber: tracking.trim(),
      });
      alert(res.data.message || "Package removed.");
      await fetchManifests();
      await fetchPackages();
    } catch (error) {
      alert(error?.response?.data?.message || "Package could not be removed.");
    }
  };

  const departManifest = async (manifestNumber) => {
    try {
      const res = await axios.put(`${API_BASE}/manifests/${manifestNumber}/depart`);
      alert(res.data.message || "Manifest departed.");
      await fetchManifests();
    } catch (error) {
      alert(error?.response?.data?.message || "Could not update manifest.");
    }
  };

  const arriveManifest = async (manifestNumber) => {
    try {
      const res = await axios.put(`${API_BASE}/manifests/${manifestNumber}/arrive`);
      alert(res.data.message || "Manifest arrived.");
      await fetchManifests();
      await fetchPackages();
    } catch (error) {
      alert(error?.response?.data?.message || "Could not update manifest.");
    }
  };

  const formatDate = (value) => {
    if (!value) return "";
    return new Date(value).toLocaleDateString();
  };

  const money = (value) => `JMD ${Number(value || 0).toLocaleString()}`;

  const getStatusColor = (status) => {
    if (status === "Created") return ROYAL_BLUE;
    if (status === "In Transit") return "#f59e0b";
    if (status === "Arrived Jamaica") return "#16a34a";
    return "#64748b";
  };

  const actionButton = (label, onClick, bg, disabled = false) => (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        backgroundColor: disabled ? "#cbd5e1" : bg,
        color: disabled ? "#475569" : WHITE,
        border: "none",
        padding: "8px 10px",
        borderRadius: "8px",
        cursor: disabled ? "not-allowed" : "pointer",
        fontWeight: "bold",
        width: "100%",
      }}
    >
      {label}
    </button>
  );

  const packageChips = (manifest) => {
    const list = manifest.packages || [];
    const isExpanded = expanded[manifest.manifestNumber];
    const visible = isExpanded ? list : list.slice(0, 5);

    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
        {visible.length > 0 ? (
          visible.map((tracking) => (
            <span
              key={tracking}
              style={{
                backgroundColor: "#eef4ff",
                color: ROYAL_BLUE,
                padding: "5px 8px",
                borderRadius: "999px",
                fontSize: "12px",
                fontWeight: "bold",
              }}
            >
              {tracking}
            </span>
          ))
        ) : (
          <span style={{ color: MUTED }}>No packages</span>
        )}

        {list.length > 5 && (
          <button
            onClick={() =>
              setExpanded((prev) => ({
                ...prev,
                [manifest.manifestNumber]: !prev[manifest.manifestNumber],
              }))
            }
            style={{
              border: `1px solid ${ROYAL_BLUE}`,
              backgroundColor: WHITE,
              color: ROYAL_BLUE,
              borderRadius: "999px",
              padding: "5px 8px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "12px",
            }}
          >
            {isExpanded ? "Show Less" : `+${list.length - 5} More`}
          </button>
        )}
      </div>
    );
  };

  const paginationControls = (
    <div
      style={{
        backgroundColor: WHITE,
        border: `1px solid ${BORDER}`,
        borderRadius: "12px",
        padding: "12px",
        marginBottom: "14px",
        display: "flex",
        justifyContent: "space-between",
        gap: "10px",
        flexWrap: "wrap",
        alignItems: "center",
      }}
    >
      <strong>
        Showing {filteredManifests.length === 0 ? 0 : startIndex + 1} to{" "}
        {Math.min(endIndex, filteredManifests.length)} of {filteredManifests.length}
      </strong>

      <select
        value={pageSize}
        onChange={(e) => setPageSize(Number(e.target.value))}
        style={{ padding: "8px", borderRadius: "8px", border: `1px solid ${BORDER}` }}
      >
        <option value={5}>5 per page</option>
        <option value={10}>10 per page</option>
        <option value={25}>25 per page</option>
        <option value={50}>50 per page</option>
      </select>

      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={safeCurrentPage === 1}
          style={smallButton(safeCurrentPage !== 1, ROYAL_BLUE)}
        >
          Previous
        </button>

        <strong>
          {safeCurrentPage} / {totalPages}
        </strong>

        <button
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={safeCurrentPage === totalPages}
          style={smallButton(safeCurrentPage !== totalPages, ROYAL_BLUE)}
        >
          Next
        </button>
      </div>
    </div>
  );

  const renderActions = (manifest) => {
    const isCreated = manifest.status === "Created";
    const isInTransit = manifest.status === "In Transit";

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
        {actionButton("Edit", () => editManifest(manifest), "#334155", !isCreated)}
        {actionButton("Add Package", () => openAddPackage(manifest.manifestNumber), ROYAL_BLUE, !isCreated)}
        {actionButton(
          "Remove Package",
          () => removePackage(manifest.manifestNumber),
          "#7c3aed",
          !isCreated || (manifest.packages || []).length === 0
        )}
        {actionButton("Depart", () => departManifest(manifest.manifestNumber), "#f59e0b", !isCreated)}
        {actionButton("Arrive Jamaica", () => arriveManifest(manifest.manifestNumber), "#16a34a", !isInTransit)}
        {actionButton("Delete", () => deleteManifest(manifest.manifestNumber), "#dc2626", !isCreated)}
      </div>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: "18px" }}>
        <h1 style={{ margin: 0, color: "#0f172a" }}>Manifests</h1>
        <p style={{ color: MUTED, marginTop: "6px" }}>
          Manage shipment manifests, package movement, arrival status, and shipment value.
        </p>
      </div>

      <div style={cardStyle(BORDER, WHITE)}>
        <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>Create Manifest</h2>

        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          <select
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            style={{ padding: "10px", borderRadius: "8px", border: `1px solid ${BORDER}`, minWidth: "220px" }}
          >
            <option value="Florida">Florida</option>
            <option value="Miami Warehouse">Miami Warehouse</option>
            <option value="Fort Lauderdale">Fort Lauderdale</option>
          </select>

          <button
            onClick={createManifest}
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
            Create Manifest
          </button>
        </div>
      </div>

      <div style={{ ...cardStyle(BORDER, WHITE), marginTop: "18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
          <h2 style={{ margin: 0, color: ROYAL_BLUE }}>All Manifests</h2>

          <input
            placeholder="Search manifest, origin, status, or package tracking"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: "10px",
              borderRadius: "8px",
              border: `1px solid ${BORDER}`,
              minWidth: isMobile ? "100%" : "320px",
            }}
          />
        </div>

        <div style={{ marginTop: "14px" }}>{paginationControls}</div>

        {isMobile ? (
          <div style={{ display: "grid", gap: "14px" }}>
            {paginatedManifests.map((manifest) => {
              const stats = getManifestStats(manifest);

              return (
                <div key={manifest._id || manifest.manifestNumber} style={cardStyle(BORDER, WHITE)}>
                  <h3 style={{ marginTop: 0, color: ROYAL_BLUE }}>{manifest.manifestNumber}</h3>
                  <p><strong>Origin:</strong> {manifest.origin}</p>
                  <p><strong>Date:</strong> {formatDate(manifest.createdAt)}</p>
                  <p><strong>Packages:</strong> {manifest.packageCount || 0}</p>
                  <p><strong>Total Weight:</strong> {stats.totalWeight.toFixed(1)} lb</p>
                  <p><strong>Estimated Revenue:</strong> {money(stats.estimatedRevenue)}</p>

                  <span
                    style={{
                      backgroundColor: getStatusColor(manifest.status),
                      color: WHITE,
                      padding: "6px 12px",
                      borderRadius: "999px",
                      fontWeight: "bold",
                      fontSize: "12px",
                    }}
                  >
                    {manifest.status}
                  </span>

                  <div style={{ marginTop: "14px" }}>{packageChips(manifest)}</div>
                  <div style={{ marginTop: "14px" }}>{renderActions(manifest)}</div>
                </div>
              );
            })}
          </div>
        ) : (
          <div
  style={{
    overflowX: "auto",
    overflowY: "auto",
    maxHeight: "70vh",
    border: `1px solid ${BORDER}`,
    borderRadius: "12px",
  }}
>
            <table style={{ width: "100%", minWidth: "1250px", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead
  style={{
    backgroundColor: "#eef4ff",
    position: "sticky",
    top: 0,
    zIndex: 5,
  }}
>
                <tr>
                  <th style={thStyle}>Manifest Number</th>
                  <th style={thStyle}>Origin</th>
                  <th style={thStyle}>Package Count</th>
                  <th style={thStyle}>Total Weight</th>
                  <th style={thStyle}>Est. Revenue</th>
                  <th style={thStyle}>Packages</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Date</th>
                  <th
  style={{
    ...thStyle,
    position: "sticky",
    right: 0,
    backgroundColor: "#eef4ff",
    zIndex: 6,
    minWidth: "160px",
  }}
>
  Actions
</th>
                </tr>
              </thead>

              <tbody>
                {paginatedManifests.length > 0 ? (
                  paginatedManifests.map((manifest) => {
                    const stats = getManifestStats(manifest);

                    return (
                      <tr key={manifest._id || manifest.manifestNumber}>
                        <td style={tdStyle}>{manifest.manifestNumber}</td>
                        <td style={tdStyle}>{manifest.origin}</td>
                        <td style={tdStyle}>{manifest.packageCount ?? 0}</td>
                        <td style={tdStyle}>{stats.totalWeight.toFixed(1)} lb</td>
                        <td style={tdStyle}>{money(stats.estimatedRevenue)}</td>
                        <td style={{ ...tdStyle, maxWidth: "360px" }}>{packageChips(manifest)}</td>
                        <td style={tdStyle}>
                          <span
                            style={{
                              backgroundColor: getStatusColor(manifest.status),
                              color: WHITE,
                              padding: "6px 12px",
                              borderRadius: "999px",
                              fontWeight: "bold",
                              fontSize: "12px",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {manifest.status}
                          </span>
                        </td>
                        <td style={tdStyle}>{formatDate(manifest.createdAt)}</td>
                        <td
  style={{
    ...tdStyle,
    position: "sticky",
    right: 0,
    backgroundColor: WHITE,
    zIndex: 4,
    boxShadow: "-4px 0 8px rgba(15,23,42,0.08)",
    minWidth: "160px",
  }}
>
  {renderActions(manifest)}
</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="9" style={{ ...tdStyle, textAlign: "center", color: MUTED }}>
                      No manifests found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ marginTop: "14px" }}>{paginationControls}</div>
      </div>
    </div>
  );
}

const thStyle = {
  padding: "12px",
  textAlign: "left",
  borderBottom: "1px solid #dbe3ef",
  color: "#334155",
};

const tdStyle = {
  padding: "12px",
  borderBottom: "1px solid #e5e7eb",
  verticalAlign: "top",
};

function cardStyle(border, white) {
  return {
    backgroundColor: white,
    border: `1px solid ${border}`,
    borderRadius: "14px",
    padding: "16px",
    boxShadow: "0 4px 14px rgba(15,23,42,0.04)",
  };
}

function smallButton(enabled, color) {
  return {
    backgroundColor: enabled ? color : "#cbd5e1",
    color: "white",
    border: "none",
    padding: "8px 12px",
    borderRadius: "8px",
    cursor: enabled ? "pointer" : "not-allowed",
    fontWeight: "bold",
  };
}

export default Manifests;