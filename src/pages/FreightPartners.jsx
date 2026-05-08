import { useEffect, useState } from "react";
import api from "../api";

function FreightPartners() {
  const [partners, setPartners] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);

  const [formData, setFormData] = useState({
    partnerName: "",
    contactPerson: "",
    contactEmail: "",
    contactPhone: "",
    status: "Active",
    notes: "",
  });

  const ROYAL_BLUE = "#0B3D91";
  const WHITE = "#ffffff";
  const BORDER = "#dbe3ef";
  const MUTED = "#64748b";

  const fetchPartners = async () => {
    try {
      const res = await api.get("/api/freight-partners");
      setPartners(res.data.data || []);
    } catch (error) {
      console.error("Error loading freight partners:", error);
      alert(error?.response?.data?.message || "Could not load freight partners.");
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const resetForm = () => {
    setFormData({
      partnerName: "",
      contactPerson: "",
      contactEmail: "",
      contactPhone: "",
      status: "Active",
      notes: "",
    });
    setEditingPartner(null);
    setShowForm(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const savePartner = async () => {
    try {
      if (!formData.partnerName) {
        alert("Partner name is required.");
        return;
      }

      if (editingPartner) {
        await api.put(`/api/freight-partners/${editingPartner.partnerNumber}`, formData);
        alert("Freight partner updated successfully.");
      } else {
        await api.post("/api/freight-partners", formData);
        alert("Freight partner created successfully.");
      }

      await fetchPartners();
      resetForm();
    } catch (error) {
      console.error("Error saving freight partner:", error);
      alert(error?.response?.data?.message || "Could not save freight partner.");
    }
  };

  const editPartner = (partner) => {
    setEditingPartner(partner);
    setFormData({
      partnerName: partner.partnerName || "",
      contactPerson: partner.contactPerson || "",
      contactEmail: partner.contactEmail || "",
      contactPhone: partner.contactPhone || "",
      status: partner.status || "Active",
      notes: partner.notes || "",
    });
    setShowForm(true);
  };

  const rotateApiKey = async (partner) => {
    const confirmed = window.confirm(
      `Rotate API key for ${partner.partnerName}? The old key will stop working.`
    );

    if (!confirmed) return;

    try {
      await api.put(`/api/freight-partners/${partner.partnerNumber}/rotate-key`);
      alert("API key rotated successfully.");
      await fetchPartners();
    } catch (error) {
      console.error("Error rotating API key:", error);
      alert(error?.response?.data?.message || "Could not rotate API key.");
    }
  };

  const copyApiKey = async (apiKey) => {
    try {
      await navigator.clipboard.writeText(apiKey);
      alert("API key copied.");
    } catch {
      alert("Could not copy API key. Please copy it manually.");
    }
  };

  const statusBadge = (status) => {
    const color = status === "Active" ? "#16a34a" : "#dc2626";

    return (
      <span
        style={{
          backgroundColor: color,
          color: WHITE,
          padding: "5px 10px",
          borderRadius: "999px",
          fontWeight: "bold",
          fontSize: "12px",
          whiteSpace: "nowrap",
        }}
      >
        {status}
      </span>
    );
  };

  const formatDateTime = (value) => {
    if (!value) return "—";
    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  };

  const cardStyle = {
    backgroundColor: WHITE,
    border: `1px solid ${BORDER}`,
    borderRadius: "12px",
    padding: "18px",
    boxShadow: "0 2px 8px rgba(15,23,42,0.04)",
  };

  const buttonStyle = {
    border: "none",
    padding: "8px 12px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
          marginBottom: "20px",
        }}
      >
        <div>
          <h1 style={{ margin: 0 }}>Freight Partners</h1>
          <p style={{ margin: "6px 0 0", color: MUTED }}>
            Manage freight companies, API keys, and integration access.
          </p>
        </div>

        <button
          onClick={() => {
            if (showForm && !editingPartner) {
              setShowForm(false);
            } else {
              setEditingPartner(null);
              setShowForm(!showForm);
            }
          }}
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
          {showForm ? "Close Form" : "+ Add Partner"}
        </button>
      </div>

      {showForm && (
        <div style={{ ...cardStyle, marginBottom: "20px" }}>
          <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>
            {editingPartner ? "Edit Freight Partner" : "New Freight Partner"}
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "14px",
            }}
          >
            <input
              name="partnerName"
              placeholder="Partner Company Name"
              value={formData.partnerName}
              onChange={handleChange}
              style={{ padding: "10px", borderRadius: "8px", border: `1px solid ${BORDER}` }}
            />

            <input
              name="contactPerson"
              placeholder="IT / Contact Person"
              value={formData.contactPerson}
              onChange={handleChange}
              style={{ padding: "10px", borderRadius: "8px", border: `1px solid ${BORDER}` }}
            />

            <input
              name="contactEmail"
              placeholder="Contact Email"
              value={formData.contactEmail}
              onChange={handleChange}
              style={{ padding: "10px", borderRadius: "8px", border: `1px solid ${BORDER}` }}
            />

            <input
              name="contactPhone"
              placeholder="Contact Phone"
              value={formData.contactPhone}
              onChange={handleChange}
              style={{ padding: "10px", borderRadius: "8px", border: `1px solid ${BORDER}` }}
            />

            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              style={{ padding: "10px", borderRadius: "8px", border: `1px solid ${BORDER}` }}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>

            <textarea
              name="notes"
              placeholder="Integration notes"
              value={formData.notes}
              onChange={handleChange}
              style={{
                padding: "10px",
                borderRadius: "8px",
                border: `1px solid ${BORDER}`,
                minHeight: "90px",
                gridColumn: "1 / -1",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "16px", flexWrap: "wrap" }}>
            <button
              onClick={savePartner}
              style={{
                ...buttonStyle,
                backgroundColor: "#16a34a",
                color: WHITE,
              }}
            >
              {editingPartner ? "Update Partner" : "Save Partner"}
            </button>

            <button
              onClick={resetForm}
              style={{
                ...buttonStyle,
                backgroundColor: "#64748b",
                color: WHITE,
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={cardStyle}>
        <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>Freight Partner Access</h2>

        <div
          style={{
            overflowX: "auto",
            overflowY: "auto",
            maxHeight: "70vh",
            border: `1px solid ${BORDER}`,
            borderRadius: "12px",
          }}
        >
          <table
            border="1"
            cellPadding="10"
            style={{
              minWidth: "1500px",
              width: "100%",
              borderCollapse: "collapse",
              borderColor: BORDER,
            }}
          >
            <thead
              style={{
                backgroundColor: "#eef4ff",
                position: "sticky",
                top: 0,
                zIndex: 5,
              }}
            >
              <tr>
                <th>Partner No.</th>
                <th>Partner Name</th>
                <th>Status</th>
                <th>Contact Person</th>
                <th>Email</th>
                <th>Phone</th>
                <th>API Key</th>
                <th>Last Sync</th>
                <th>Notes</th>
                <th
                  style={{
                    position: "sticky",
                    right: 0,
                    backgroundColor: "#eef4ff",
                    zIndex: 6,
                    minWidth: "190px",
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {partners.length > 0 ? (
                partners.map((partner) => (
                  <tr key={partner._id}>
                    <td>{partner.partnerNumber}</td>
                    <td>{partner.partnerName}</td>
                    <td>{statusBadge(partner.status)}</td>
                    <td>{partner.contactPerson || "—"}</td>
                    <td>{partner.contactEmail || "—"}</td>
                    <td>{partner.contactPhone || "—"}</td>
                    <td>
                      <code
                        style={{
                          display: "block",
                          maxWidth: "280px",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {partner.apiKey}
                      </code>
                    </td>
                    <td>{formatDateTime(partner.lastSyncAt)}</td>
                    <td style={{ maxWidth: "260px", color: MUTED }}>
                      {partner.notes || "—"}
                    </td>
                    <td
                      style={{
                        position: "sticky",
                        right: 0,
                        backgroundColor: WHITE,
                        zIndex: 4,
                        minWidth: "190px",
                        boxShadow: "-4px 0 8px rgba(15,23,42,0.08)",
                      }}
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <button
                          onClick={() => editPartner(partner)}
                          style={{
                            ...buttonStyle,
                            backgroundColor: ROYAL_BLUE,
                            color: WHITE,
                          }}
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => copyApiKey(partner.apiKey)}
                          style={{
                            ...buttonStyle,
                            backgroundColor: "#334155",
                            color: WHITE,
                          }}
                        >
                          Copy API Key
                        </button>

                        <button
                          onClick={() => rotateApiKey(partner)}
                          style={{
                            ...buttonStyle,
                            backgroundColor: "#f59e0b",
                            color: "black",
                          }}
                        >
                          Rotate Key
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" style={{ textAlign: "center", color: MUTED }}>
                    No freight partners found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default FreightPartners;