import { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = "https://eltham-konnect-backend-c2sf.onrender.com/api";

function Manifests() {
  const [manifests, setManifests] = useState([]);
  const [origin, setOrigin] = useState("Florida");

  const fetchManifests = async () => {
    try {
      const res = await axios.get(`${API_BASE}/manifests`);
      setManifests(res.data.data || []);
    } catch (error) {
      console.error("Error loading manifests:", error);
    }
  };

  useEffect(() => {
    fetchManifests();
  }, []);

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
    const confirmed = window.confirm(
      "Are you sure you want to delete this manifest? Packages will be returned to At Warehouse."
    );
    if (!confirmed) return;

    try {
      const res = await axios.delete(`${API_BASE}/manifests/${manifestNumber}`);
      alert(res.data.message || "Manifest deleted.");
      await fetchManifests();
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
      alert(res.data.message || "Package added to manifest.");
      await fetchManifests();
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
      alert(res.data.message || "Package removed from manifest.");
      await fetchManifests();
    } catch (error) {
      alert(error?.response?.data?.message || "Package could not be removed.");
    }
  };

  const departManifest = async (manifestNumber) => {
    try {
      const res = await axios.put(`${API_BASE}/manifests/${manifestNumber}/depart`);
      alert(res.data.message || "Manifest departed successfully.");
      await fetchManifests();
    } catch (error) {
      alert(error?.response?.data?.message || "Could not update manifest.");
    }
  };

  const arriveManifest = async (manifestNumber) => {
    try {
      const res = await axios.put(`${API_BASE}/manifests/${manifestNumber}/arrive`);
      alert(res.data.message || "Manifest arrived successfully.");
      await fetchManifests();
    } catch (error) {
      alert(error?.response?.data?.message || "Could not update manifest.");
    }
  };

  const formatDate = (value) => {
    if (!value) return "";
    try {
      return new Date(value).toISOString().split("T")[0];
    } catch {
      return value;
    }
  };

  const getStatusColor = (status) => {
    if (status === "Created") return "#0B3D91";
    if (status === "In Transit") return "#f59e0b";
    if (status === "Arrived Jamaica") return "#16a34a";
    return "#64748b";
  };

  const actionButton = (label, onClick, bg, disabled = false) => (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        backgroundColor: disabled ? "#999" : bg,
        color: "white",
        border: "none",
        padding: "6px 10px",
        borderRadius: "4px",
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {label}
    </button>
  );

  return (
    <div>
      <h1>Manifests</h1>

      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "10px",
          border: "1px solid #e5e7eb",
          marginBottom: "20px",
        }}
      >
        <h2>Create Manifest</h2>

        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          <select
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            style={{
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              minWidth: "220px",
            }}
          >
            <option value="Florida">Florida</option>
            <option value="Miami Warehouse">Miami Warehouse</option>
            <option value="Fort Lauderdale">Fort Lauderdale</option>
          </select>

          <button
            onClick={createManifest}
            style={{
              backgroundColor: "#0B3D91",
              color: "white",
              border: "none",
              padding: "10px 16px",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Create Manifest
          </button>
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
        <h2>All Manifests</h2>

        <div style={{ overflowX: "auto" }}>
          <table border="1" cellPadding="10" style={{ width: "100%", minWidth: "1050px" }}>
            <thead>
              <tr>
                <th>Manifest Number</th>
                <th>Origin</th>
                <th>Package Count</th>
                <th>Packages</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {manifests.length > 0 ? (
                manifests.map((manifest, index) => {
                  const isCreated = manifest.status === "Created";
                  const isInTransit = manifest.status === "In Transit";

                  return (
                    <tr key={manifest._id || manifest.manifestNumber || index}>
                      <td>{manifest.manifestNumber}</td>
                      <td>{manifest.origin}</td>
                      <td>{manifest.packageCount ?? 0}</td>
                      <td style={{ maxWidth: "240px", wordBreak: "break-word" }}>
                        {(manifest.packages || []).length > 0
                          ? manifest.packages.join(", ")
                          : "No packages"}
                      </td>
                      <td>
                        <span
                          style={{
                            padding: "4px 10px",
                            borderRadius: "6px",
                            color: "white",
                            backgroundColor: getStatusColor(manifest.status),
                          }}
                        >
                          {manifest.status}
                        </span>
                      </td>
                      <td>{formatDate(manifest.createdAt)}</td>
                      <td>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          {actionButton("Edit", () => editManifest(manifest), "#334155", !isCreated)}
                          {actionButton(
                            "Add Package",
                            () => openAddPackage(manifest.manifestNumber),
                            "#0B3D91",
                            !isCreated
                          )}
                          {actionButton(
                            "Remove Package",
                            () => removePackage(manifest.manifestNumber),
                            "#7c3aed",
                            !isCreated || (manifest.packages || []).length === 0
                          )}
                          {actionButton(
                            "Depart",
                            () => departManifest(manifest.manifestNumber),
                            "#f59e0b",
                            !isCreated
                          )}
                          {actionButton(
                            "Arrive Jamaica",
                            () => arriveManifest(manifest.manifestNumber),
                            "#16a34a",
                            !isInTransit
                          )}
                          {actionButton(
                            "Delete",
                            () => deleteManifest(manifest.manifestNumber),
                            "#dc2626",
                            !isCreated
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7">No manifests yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Manifests;