import { useEffect, useMemo, useState } from "react";
import api from "../api";

function MarketingInfo() {
  const [campaigns, setCampaigns] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [loadingCustomers, setLoadingCustomers] = useState(true);

  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [campaignSearchTerm, setCampaignSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [formData, setFormData] = useState({
    recipientMode: "all",
    customerEkonId: "",
    selectedCustomerEkonIds: [],
    campaignName: "",
    channel: "WhatsApp",
    audience: "All Customers",
    budget: 0,
    status: "Draft",
    startDate: "",
    endDate: "",
    notes: "",
  });

  const ROYAL_BLUE = "#0B3D91";
  const GOLD = "#D4AF37";
  const WHITE = "#FFFFFF";
  const LIGHT_BG = "#f4f7fb";
  const BORDER = "#dbe3ef";
  const MUTED = "#64748b";

  const fetchCampaigns = async () => {
    try {
      setLoadingCampaigns(true);
      const res = await api.get("/api/marketing");
      setCampaigns(res.data.data || []);
    } catch (error) {
      console.error("Error loading campaigns:", error);
      alert(error?.response?.data?.message || "Could not load campaigns.");
      setCampaigns([]);
    } finally {
      setLoadingCampaigns(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      setLoadingCustomers(true);
      const res = await api.get("/api/customers");
      setCustomers(res.data.data || []);
    } catch (error) {
      console.error("Error loading customers:", error);
      alert(error?.response?.data?.message || "Could not load customers.");
      setCustomers([]);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const fetchPageData = async () => {
    await Promise.all([fetchCampaigns(), fetchCustomers()]);
  };

  useEffect(() => {
    fetchPageData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [campaignSearchTerm, pageSize]);

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) =>
      `${customer.ekonId} ${customer.name} ${customer.email || ""} ${customer.phone || ""}`
        .toLowerCase()
        .includes(customerSearchTerm.toLowerCase())
    );
  }, [customers, customerSearchTerm]);

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((campaign) =>
      `${campaign.campaignNumber || ""} ${campaign.campaignName || ""} ${campaign.channel || ""} ${campaign.audience || ""} ${campaign.status || ""} ${campaign.notes || ""}`
        .toLowerCase()
        .includes(campaignSearchTerm.toLowerCase())
    );
  }, [campaigns, campaignSearchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredCampaigns.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedCampaigns = filteredCampaigns.slice(startIndex, endIndex);

  const summary = useMemo(() => {
    return {
      totalCampaigns: campaigns.length,
      activeCampaigns: campaigns.filter((c) => c.status === "Active").length,
      completedCampaigns: campaigns.filter((c) => c.status === "Completed").length,
      totalBudget: campaigns.reduce(
        (sum, campaign) => sum + Number(campaign.budget || 0),
        0
      ),
    };
  }, [campaigns]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: name === "budget" ? Number(value) : value,
    }));
  };

  const handleRecipientModeChange = (e) => {
    const recipientMode = e.target.value;

    setFormData((prev) => ({
      ...prev,
      recipientMode,
      customerEkonId: "",
      selectedCustomerEkonIds: [],
      audience:
        recipientMode === "single"
          ? "Single Customer"
          : recipientMode === "selected"
          ? "Selected Customers"
          : "All Customers",
    }));
  };

  const handleSelectedCustomerToggle = (ekonId) => {
    setFormData((prev) => {
      const alreadySelected = prev.selectedCustomerEkonIds.includes(ekonId);

      return {
        ...prev,
        selectedCustomerEkonIds: alreadySelected
          ? prev.selectedCustomerEkonIds.filter((id) => id !== ekonId)
          : [...prev.selectedCustomerEkonIds, ekonId],
      };
    });
  };

  const handleSelectAllFiltered = () => {
    const filteredIds = filteredCustomers.map((customer) => customer.ekonId);

    setFormData((prev) => ({
      ...prev,
      selectedCustomerEkonIds: filteredIds,
    }));
  };

  const handleClearSelected = () => {
    setFormData((prev) => ({
      ...prev,
      selectedCustomerEkonIds: [],
    }));
  };

  const resetForm = () => {
    setFormData({
      recipientMode: "all",
      customerEkonId: "",
      selectedCustomerEkonIds: [],
      campaignName: "",
      channel: "WhatsApp",
      audience: "All Customers",
      budget: 0,
      status: "Draft",
      startDate: "",
      endDate: "",
      notes: "",
    });
    setCustomerSearchTerm("");
    setEditingCampaign(null);
    setShowForm(false);
  };

  const handleSubmit = async () => {
    try {
      if (!formData.campaignName || !formData.channel) {
        alert("Please enter campaign name and channel.");
        return;
      }

      if (formData.recipientMode === "single" && !formData.customerEkonId) {
        alert("Please select one customer.");
        return;
      }

      if (
        formData.recipientMode === "selected" &&
        formData.selectedCustomerEkonIds.length === 0
      ) {
        alert("Please select at least one customer.");
        return;
      }

      const payload = {
        campaignName: formData.campaignName,
        channel: formData.channel,
        audience:
          formData.recipientMode === "single"
            ? "Single Customer"
            : formData.recipientMode === "selected"
            ? "Selected Customers"
            : "All Customers",
        recipientMode: formData.recipientMode,
        customerEkonId:
          formData.recipientMode === "single" ? formData.customerEkonId : "",
        customerEkonIds:
          formData.recipientMode === "selected"
            ? formData.selectedCustomerEkonIds
            : [],
        budget: Number(formData.budget || 0),
        status: formData.status,
        startDate: formData.startDate,
        endDate: formData.endDate,
        notes: formData.notes,
      };

      if (editingCampaign) {
        await api.put(`/api/marketing/${editingCampaign.campaignNumber}`, payload);
        alert("Campaign updated successfully.");
      } else {
        await api.post("/api/marketing", payload);
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
      recipientMode:
        campaign.audience === "Single Customer"
          ? "single"
          : campaign.audience === "Selected Customers"
          ? "selected"
          : "all",
      customerEkonId: campaign.customerEkonId || "",
      selectedCustomerEkonIds: campaign.customerEkonIds || [],
      campaignName: campaign.campaignName || "",
      channel: campaign.channel || "WhatsApp",
      audience: campaign.audience || "All Customers",
      budget: Number(campaign.budget || 0),
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

  const metricCardStyle = {
    backgroundColor: WHITE,
    padding: "18px",
    borderRadius: "12px",
    border: `1px solid ${BORDER}`,
    boxShadow: "0 2px 8px rgba(15,23,42,0.04)",
    minHeight: "110px",
  };

  const cardStyle = {
    backgroundColor: WHITE,
    padding: "20px",
    borderRadius: "12px",
    border: `1px solid ${BORDER}`,
    boxShadow: "0 2px 8px rgba(15,23,42,0.04)",
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
          Showing {filteredCampaigns.length === 0 ? 0 : startIndex + 1} to{" "}
          {Math.min(endIndex, filteredCampaigns.length)} of {filteredCampaigns.length}
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
          <h1 style={{ margin: 0, color: "#0f172a" }}>Marketing Info</h1>
          <p style={{ margin: "6px 0 0 0", color: MUTED }}>
            Create promotional campaigns for one customer, selected customers, or all customers.
          </p>
        </div>

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
            backgroundColor: ROYAL_BLUE,
            color: WHITE,
            border: "none",
            padding: "11px 18px",
            borderRadius: "10px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          {showForm ? "Close Form" : "+ New Campaign"}
        </button>
      </div>

      {showForm && (
        <div style={{ ...cardStyle, marginBottom: "20px" }}>
          <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>
            {editingCampaign ? "Edit Campaign" : "Create Marketing Campaign"}
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "15px",
              marginBottom: "15px",
            }}
          >
            <select
              name="recipientMode"
              value={formData.recipientMode}
              onChange={handleRecipientModeChange}
              style={{
                padding: "10px",
                borderRadius: "8px",
                border: `1px solid ${BORDER}`,
              }}
            >
              <option value="single">Single Customer</option>
              <option value="selected">Selected Customers</option>
              <option value="all">All Customers</option>
            </select>

            <select
              name="channel"
              value={formData.channel}
              onChange={handleChange}
              style={{
                padding: "10px",
                borderRadius: "8px",
                border: `1px solid ${BORDER}`,
              }}
            >
              <option value="WhatsApp">WhatsApp</option>
              <option value="Email">Email</option>
              <option value="SMS">SMS</option>
              <option value="Instagram">Instagram</option>
              <option value="Facebook">Facebook</option>
            </select>

            <input
              type="text"
              name="campaignName"
              placeholder="Campaign Name"
              value={formData.campaignName}
              onChange={handleChange}
              style={{
                padding: "10px",
                borderRadius: "8px",
                border: `1px solid ${BORDER}`,
              }}
            />

            <input
              type="number"
              name="budget"
              placeholder="Budget"
              value={formData.budget}
              onChange={handleChange}
              style={{
                padding: "10px",
                borderRadius: "8px",
                border: `1px solid ${BORDER}`,
              }}
            />

            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              style={{
                padding: "10px",
                borderRadius: "8px",
                border: `1px solid ${BORDER}`,
              }}
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
              style={{
                padding: "10px",
                borderRadius: "8px",
                border: `1px solid ${BORDER}`,
              }}
            />

            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              style={{
                padding: "10px",
                borderRadius: "8px",
                border: `1px solid ${BORDER}`,
              }}
            />
          </div>

          {formData.recipientMode === "single" && (
            <div style={{ marginBottom: "15px" }}>
              <select
                name="customerEkonId"
                value={formData.customerEkonId}
                onChange={handleChange}
                disabled={loadingCustomers}
                style={{
                  padding: "10px",
                  width: "100%",
                  borderRadius: "8px",
                  border: `1px solid ${BORDER}`,
                }}
              >
                <option value="">
                  {loadingCustomers ? "Loading customers..." : "Select Customer"}
                </option>
                {customers.map((customer) => (
                  <option key={customer._id} value={customer.ekonId}>
                    {customer.ekonId} - {customer.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {formData.recipientMode === "selected" && (
            <div
              style={{
                border: `1px solid ${BORDER}`,
                borderRadius: "10px",
                padding: "15px",
                marginBottom: "15px",
                backgroundColor: "#f8fafc",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  flexWrap: "wrap",
                  alignItems: "center",
                  marginBottom: "12px",
                }}
              >
                <input
                  type="text"
                  placeholder="Search customers by EKON ID, name, email, or phone"
                  value={customerSearchTerm}
                  onChange={(e) => setCustomerSearchTerm(e.target.value)}
                  style={{
                    padding: "10px",
                    flex: "1",
                    minWidth: "260px",
                    borderRadius: "8px",
                    border: `1px solid ${BORDER}`,
                  }}
                />

                <button
                  onClick={handleSelectAllFiltered}
                  type="button"
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
                  Select All Filtered
                </button>

                <button
                  onClick={handleClearSelected}
                  type="button"
                  style={{
                    backgroundColor: "#64748b",
                    color: WHITE,
                    border: "none",
                    padding: "10px 16px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  Clear Selected
                </button>
              </div>

              <div style={{ marginBottom: "10px", fontWeight: "bold", color: "#334155" }}>
                Selected Customers: {formData.selectedCustomerEkonIds.length}
              </div>

              <div
                style={{
                  maxHeight: "280px",
                  overflowY: "auto",
                  border: `1px solid ${BORDER}`,
                  borderRadius: "10px",
                  backgroundColor: WHITE,
                }}
              >
                {loadingCustomers ? (
                  <div style={{ padding: "12px" }}>Loading customers...</div>
                ) : filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer) => (
                    <label
                      key={customer._id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "12px",
                        borderBottom: "1px solid #f1f5f9",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={formData.selectedCustomerEkonIds.includes(customer.ekonId)}
                        onChange={() => handleSelectedCustomerToggle(customer.ekonId)}
                      />
                      <span>
                        <strong>{customer.ekonId}</strong> - {customer.name}
                      </span>
                    </label>
                  ))
                ) : (
                  <div style={{ padding: "12px" }}>No matching customers found.</div>
                )}
              </div>
            </div>
          )}

          {formData.recipientMode === "all" && (
            <div
              style={{
                marginBottom: "15px",
                padding: "12px",
                backgroundColor: "#eff6ff",
                border: "1px solid #bfdbfe",
                borderRadius: "10px",
                color: ROYAL_BLUE,
                fontWeight: "bold",
              }}
            >
              This promotional campaign is set for all customers in the system.
            </div>
          )}

          <textarea
            name="notes"
            placeholder="Promotional message / campaign notes"
            value={formData.notes}
            onChange={handleChange}
            style={{
              padding: "10px",
              minHeight: "120px",
              width: "100%",
              borderRadius: "8px",
              border: `1px solid ${BORDER}`,
              marginBottom: "16px",
            }}
          />

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              onClick={handleSubmit}
              style={{
                backgroundColor: "#16a34a",
                color: WHITE,
                border: "none",
                padding: "11px 18px",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              {editingCampaign ? "Update Campaign" : "Save Campaign"}
            </button>

            <button
              onClick={resetForm}
              style={{
                backgroundColor: "#64748b",
                color: WHITE,
                border: "none",
                padding: "11px 18px",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "bold",
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
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "20px",
          marginBottom: "24px",
        }}
      >
        <div style={metricCardStyle}>
          <h2 style={{ marginTop: 0, fontSize: "30px", color: ROYAL_BLUE }}>
            {summary.totalCampaigns}
          </h2>
          <p style={{ fontWeight: "bold", color: "#334155", margin: 0 }}>
            Total Campaigns
          </p>
        </div>

        <div style={metricCardStyle}>
          <h2 style={{ marginTop: 0, fontSize: "30px", color: "#16a34a" }}>
            {summary.activeCampaigns}
          </h2>
          <p style={{ fontWeight: "bold", color: "#334155", margin: 0 }}>
            Active Campaigns
          </p>
        </div>

        <div style={metricCardStyle}>
          <h2 style={{ marginTop: 0, fontSize: "30px", color: "#7c3aed" }}>
            {summary.completedCampaigns}
          </h2>
          <p style={{ fontWeight: "bold", color: "#334155", margin: 0 }}>
            Completed Campaigns
          </p>
        </div>

        <div style={metricCardStyle}>
          <h2 style={{ marginTop: 0, fontSize: "24px", color: GOLD, wordBreak: "break-word" }}>
            {formatCurrency(summary.totalBudget)}
          </h2>
          <p style={{ fontWeight: "bold", color: "#334155", margin: 0 }}>
            Total Marketing Budget
          </p>
        </div>
      </div>

      <div style={{ ...cardStyle, marginBottom: "15px" }}>
        <input
          type="text"
          placeholder="Search campaigns by number, name, channel, audience, status, or notes"
          value={campaignSearchTerm}
          onChange={(e) => setCampaignSearchTerm(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "8px",
            border: `1px solid ${BORDER}`,
          }}
        />
      </div>

      {paginationControls}

      <div style={cardStyle}>
        <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>All Marketing Campaigns</h2>

        {loadingCampaigns ? (
          <p>Loading campaigns...</p>
        ) : (
          <div
  style={{
    overflowX: "auto",
    overflowY: "auto",
    maxHeight: "70vh",
    border: `1px solid ${BORDER}`,
    borderRadius: "12px",
    position: "relative",
  }}
>
            <table
              border="1"
              cellPadding="10"
              style={{
                minWidth: "1400px",
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
    zIndex: 20,
  }}
>
                <tr>
                  <th
  style={{
    backgroundColor: "#eef4ff",
    padding: "12px",
    whiteSpace: "nowrap",
  }}
>
  Campaign Number
</th>
                  <th
  style={{
    backgroundColor: "#eef4ff",
    padding: "12px",
    whiteSpace: "nowrap",
  }}
>
  Campaign Name
</th>
                  <th
  style={{
    backgroundColor: "#eef4ff",
    padding: "12px",
    whiteSpace: "nowrap",
  }}
>
  Channel
</th>
                  <th
  style={{
    backgroundColor: "#eef4ff",
    padding: "12px",
    whiteSpace: "nowrap",
  }}
>
Audience</th>
                  <th
  style={{
    backgroundColor: "#eef4ff",
    padding: "12px",
    whiteSpace: "nowrap",
  }}
>
Budget</th>
                  <th
  style={{
    backgroundColor: "#eef4ff",
    padding: "12px",
    whiteSpace: "nowrap",
  }}
>
Status</th>
                  <th
  style={{
    backgroundColor: "#eef4ff",
    padding: "12px",
    whiteSpace: "nowrap",
  }}
>
Start Date</th>
                  <th
  style={{
    backgroundColor: "#eef4ff",
    padding: "12px",
    whiteSpace: "nowrap",
  }}
>
End Date</th>
                  <th
  style={{
    backgroundColor: "#eef4ff",
    padding: "12px",
    whiteSpace: "nowrap",
  }}
>
Notes</th>
                  <th
  style={{
    position: "sticky",
    right: 0,
    backgroundColor: "#eef4ff",
    zIndex: 25,
    minWidth: "140px",
  }}
>
  Actions
</th>
                </tr>
              </thead>

              <tbody>
                {paginatedCampaigns.length > 0 ? (
                  paginatedCampaigns.map((campaign) => (
                    <tr key={campaign._id}>
                      <td
  style={{
    position: "sticky",
    right: 0,
    backgroundColor: WHITE,
    zIndex: 10,
    minWidth: "140px",
  }}
>
                        {campaign.campaignNumber}
                      </td>
                      <td>{campaign.campaignName}</td>
                      <td>{campaign.channel}</td>
                      <td>{campaign.audience}</td>
                      <td>{formatCurrency(campaign.budget)}</td>
                      <td>
                        <span
                          style={{
                            backgroundColor: badgeColor(campaign.status),
                            color: WHITE,
                            padding: "5px 10px",
                            borderRadius: "999px",
                            fontWeight: "bold",
                            fontSize: "12px",
                            display: "inline-block",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {campaign.status}
                        </span>
                      </td>
                      <td>{campaign.startDate ? String(campaign.startDate).slice(0, 10) : ""}</td>
                      <td>{campaign.endDate ? String(campaign.endDate).slice(0, 10) : ""}</td>
                      <td style={{ color: "#475569" }}>{campaign.notes}</td>
                      <td>
                        <button
                          onClick={() => handleEdit(campaign)}
                          style={{
                            backgroundColor: ROYAL_BLUE,
                            color: WHITE,
                            border: "none",
                            padding: "8px 12px",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontWeight: "bold",
                          }}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" style={{ textAlign: "center", color: MUTED }}>
                      No marketing campaigns found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ marginTop: "15px" }}>{paginationControls}</div>
    </div>
  );
}

export default MarketingInfo;