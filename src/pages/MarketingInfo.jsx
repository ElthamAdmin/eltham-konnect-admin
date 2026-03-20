import { useEffect, useState } from "react";
import axios from "axios";

function MarketingInfo() {
  const [campaigns, setCampaigns] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);

  const [formData, setFormData] = useState({
    campaignName: "",
    channel: "WhatsApp",
    audience: "All Customers",
    budget: 0,
    status: "Draft",
    startDate: "",
    endDate: "",
    notes: "",
  });

  const fetchCampaigns = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/marketing");
      setCampaigns(res.data.data || []);
    } catch (error) {
      console.error("Error loading campaigns:", error);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: name === "budget" ? Number(value) : value,
    });
  };

  const resetForm = () => {
    setFormData({
      campaignName: "",
      channel: "WhatsApp",
      audience: "All Customers",
      budget: 0,
      status: "Draft",
      startDate: "",
      endDate: "",
      notes: "",
    });
    setEditingCampaign(null);
    setShowForm(false);
  };

  const handleSubmit = async () => {
    try {
      if (!formData.campaignName || !formData.channel) {
        alert("Please enter campaign name and channel.");
        return;
      }

      if (editingCampaign) {
        await axios.put(
          `http://localhost:5000/api/marketing/${editingCampaign.campaignNumber}`,
          formData
        );
        alert("Campaign updated successfully.");
      } else {
        await axios.post("http://localhost:5000/api/marketing", formData);
        alert("Campaign created successfully.");
      }

      await fetchCampaigns();
      resetForm();
    } catch (error) {
      console.error("Error saving campaign:", error);
      alert(error?.response?.data?.message || "Could not save campaign.");
    }
  };

  const handleEdit = (campaign) => {
    setEditingCampaign(campaign);
    setFormData({
      campaignName: campaign.campaignName || "",
      channel: campaign.channel || "WhatsApp",
      audience: campaign.audience || "All Customers",
      budget: campaign.budget || 0,
      status: campaign.status || "Draft",
      startDate: campaign.startDate ? String(campaign.startDate).slice(0, 10) : "",
      endDate: campaign.endDate ? String(campaign.endDate).slice(0, 10) : "",
      notes: campaign.notes || "",
    });
    setShowForm(true);
  };

  const formatCurrency = (value) => {
    return `JMD ${Number(value || 0).toLocaleString()}`;
  };

  const badgeColor = (status) => {
    if (status === "Draft") return "#64748b";
    if (status === "Scheduled") return "#0ea5e9";
    if (status === "Active") return "#16a34a";
    if (status === "Completed") return "#7c3aed";
    if (status === "Paused") return "#f59e0b";
    return "#64748b";
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
        <h1>Marketing Info</h1>

        <button
          onClick={() => {
            if (showForm && !editingCampaign) {
              setShowForm(false);
            } else {
              setEditingCampaign(null);
              setShowForm(!showForm);
            }
          }}
          style={{
            backgroundColor: "#0B3D91",
            color: "white",
            border: "none",
            padding: "10px 16px",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          {showForm ? "Close Form" : "+ New Campaign"}
        </button>
      </div>

      {showForm && (
        <div
          style={{
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "10px",
            border: "1px solid #e5e7eb",
            marginBottom: "20px",
          }}
        >
          <h2>{editingCampaign ? "Edit Campaign" : "Create Marketing Campaign"}</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "15px",
            }}
          >
            <input
              type="text"
              name="campaignName"
              placeholder="Campaign Name"
              value={formData.campaignName}
              onChange={handleChange}
              style={{ padding: "10px" }}
            />

            <select
              name="channel"
              value={formData.channel}
              onChange={handleChange}
              style={{ padding: "10px" }}
            >
              <option value="WhatsApp">WhatsApp</option>
              <option value="Email">Email</option>
              <option value="SMS">SMS</option>
              <option value="Instagram">Instagram</option>
              <option value="Facebook">Facebook</option>
            </select>

            <select
              name="audience"
              value={formData.audience}
              onChange={handleChange}
              style={{ padding: "10px" }}
            >
              <option value="All Customers">All Customers</option>
              <option value="New Customers">New Customers</option>
              <option value="Active Customers">Active Customers</option>
              <option value="VIP Customers">VIP Customers</option>
              <option value="Inactive Customers">Inactive Customers</option>
            </select>

            <input
              type="number"
              name="budget"
              placeholder="Budget"
              value={formData.budget}
              onChange={handleChange}
              style={{ padding: "10px" }}
            />

            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              style={{ padding: "10px" }}
            >
              <option value="Draft">Draft</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Active">Active</option>
              <option value="Paused">Paused</option>
              <option value="Completed">Completed</option>
            </select>

            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              style={{ padding: "10px" }}
            />

            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              style={{ padding: "10px" }}
            />

            <textarea
              name="notes"
              placeholder="Campaign notes"
              value={formData.notes}
              onChange={handleChange}
              style={{
                padding: "10px",
                minHeight: "100px",
                gridColumn: "span 2",
              }}
            />
          </div>

          <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
            <button
              onClick={handleSubmit}
              style={{
                backgroundColor: "#16a34a",
                color: "white",
                border: "none",
                padding: "10px 16px",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              {editingCampaign ? "Update Campaign" : "Save Campaign"}
            </button>

            <button
              onClick={resetForm}
              style={{
                backgroundColor: "#64748b",
                color: "white",
                border: "none",
                padding: "10px 16px",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "20px",
          marginBottom: "24px",
        }}
      >
        <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "10px", border: "1px solid #e5e7eb" }}>
          <h2>{campaigns.length}</h2>
          <p>Total Campaigns</p>
        </div>

        <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "10px", border: "1px solid #e5e7eb" }}>
          <h2>{campaigns.filter((c) => c.status === "Active").length}</h2>
          <p>Active Campaigns</p>
        </div>

        <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "10px", border: "1px solid #e5e7eb" }}>
          <h2>{campaigns.filter((c) => c.status === "Completed").length}</h2>
          <p>Completed Campaigns</p>
        </div>

        <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "10px", border: "1px solid #e5e7eb" }}>
          <h2>
            {formatCurrency(
              campaigns.reduce((sum, campaign) => sum + Number(campaign.budget || 0), 0)
            )}
          </h2>
          <p>Total Marketing Budget</p>
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
        <h2>All Marketing Campaigns</h2>

        <div style={{ overflowX: "auto" }}>
          <table border="1" cellPadding="10" style={{ minWidth: "1200px", width: "100%" }}>
            <thead>
              <tr>
                <th>Campaign Number</th>
                <th>Campaign Name</th>
                <th>Channel</th>
                <th>Audience</th>
                <th>Budget</th>
                <th>Status</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {campaigns.length > 0 ? (
                campaigns.map((campaign) => (
                  <tr key={campaign._id}>
                    <td>{campaign.campaignNumber}</td>
                    <td>{campaign.campaignName}</td>
                    <td>{campaign.channel}</td>
                    <td>{campaign.audience}</td>
                    <td>{formatCurrency(campaign.budget)}</td>
                    <td>
                      <span
                        style={{
                          backgroundColor: badgeColor(campaign.status),
                          color: "white",
                          padding: "4px 10px",
                          borderRadius: "6px",
                        }}
                      >
                        {campaign.status}
                      </span>
                    </td>
                    <td>{campaign.startDate ? String(campaign.startDate).slice(0, 10) : ""}</td>
                    <td>{campaign.endDate ? String(campaign.endDate).slice(0, 10) : ""}</td>
                    <td>{campaign.notes}</td>
                    <td>
                      <button
                        onClick={() => handleEdit(campaign)}
                        style={{
                          backgroundColor: "#0B3D91",
                          color: "white",
                          border: "none",
                          padding: "6px 10px",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10">No marketing campaigns found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default MarketingInfo;