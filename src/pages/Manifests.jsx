import { useEffect, useState } from "react";
import axios from "axios";

function Manifests() {
  const [manifests, setManifests] = useState([]);
  const [origin, setOrigin] = useState("Florida");

  const fetchManifests = async () => {
    try {
      const res = await axios.get("https://eltham-konnect-backend-c2sf.onrender.com/api/manifests");
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
      const res = await axios.post("https://eltham-konnect-backend-c2sf.onrender.com/api/manifests", {
        origin,
      });

      alert(res.data.message || "Manifest created successfully.");
      setOrigin("Florida");
      await fetchManifests();
    } catch (error) {
      console.error("Error creating manifest:", error);
      alert(error?.response?.data?.message || "Could not create manifest.");
    }
  };

  const departManifest = async (manifestNumber) => {
    try {
      const res = await axios.put(
        `https://eltham-konnect-backend-c2sf.onrender.com/api/manifests/${manifestNumber}/depart`
      );

      alert(res.data.message || "Manifest departed successfully.");
      await fetchManifests();
    } catch (error) {
      console.error("Error departing manifest:", error);
      alert(error?.response?.data?.message || "Could not update manifest.");
    }
  };

  const arriveManifest = async (manifestNumber) => {
    try {
      const res = await axios.put(
        `https://eltham-konnect-backend-c2sf.onrender.com/api/manifests/${manifestNumber}/arrive`
      );

      alert(res.data.message || "Manifest arrived successfully.");
      await fetchManifests();
    } catch (error) {
      console.error("Error arriving manifest:", error);
      alert(error?.response?.data?.message || "Could not update manifest.");
    }
  };

  const openAddPackage = async (manifestNumber) => {
    const tracking = prompt("Enter package tracking number");

    if (!tracking) return;

    try {
      const res = await axios.post(
        `https://eltham-konnect-backend-c2sf.onrender.com/api/manifests/${manifestNumber}/add-package`,
        { trackingNumber: tracking }
      );

      alert(res.data.message || "Package added to manifest.");
      await fetchManifests();
    } catch (error) {
      console.error("Error adding package to manifest:", error);
      alert(error?.response?.data?.message || "Package could not be added.");
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

        <div
          style={{
            display: "flex",
            gap: "12px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
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

        <table border="1" cellPadding="10" style={{ width: "100%" }}>
          <thead>
            <tr>
              <th>Manifest Number</th>
              <th>Origin</th>
              <th>Package Count</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {manifests.length > 0 ? (
              manifests.map((manifest, index) => (
                <tr key={manifest._id || manifest.manifestNumber || index}>
                  <td>{manifest.manifestNumber}</td>
                  <td>{manifest.origin}</td>
                  <td>{manifest.packageCount ?? 0}</td>
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
                      <button
                        onClick={() => openAddPackage(manifest.manifestNumber)}
                        disabled={manifest.status !== "Created"}
                        style={{
                          backgroundColor:
                            manifest.status === "Created" ? "#0B3D91" : "#999",
                          color: "white",
                          border: "none",
                          padding: "6px 10px",
                          borderRadius: "4px",
                          cursor:
                            manifest.status === "Created"
                              ? "pointer"
                              : "not-allowed",
                        }}
                      >
                        Add Package
                      </button>

                      <button
                        onClick={() => departManifest(manifest.manifestNumber)}
                        disabled={manifest.status !== "Created"}
                        style={{
                          backgroundColor:
                            manifest.status === "Created" ? "#f59e0b" : "#999",
                          color: "white",
                          border: "none",
                          padding: "6px 10px",
                          borderRadius: "4px",
                          cursor:
                            manifest.status === "Created"
                              ? "pointer"
                              : "not-allowed",
                        }}
                      >
                        Depart
                      </button>

                      <button
                        onClick={() => arriveManifest(manifest.manifestNumber)}
                        disabled={manifest.status !== "In Transit"}
                        style={{
                          backgroundColor:
                            manifest.status === "In Transit" ? "#16a34a" : "#999",
                          color: "white",
                          border: "none",
                          padding: "6px 10px",
                          borderRadius: "4px",
                          cursor:
                            manifest.status === "In Transit"
                              ? "pointer"
                              : "not-allowed",
                        }}
                      >
                        Arrive Jamaica
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6">No manifests yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Manifests;