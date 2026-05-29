import { useEffect, useState } from "react";
import api from "../api";

function BusinessGrowthCenter() {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({});
  const [advisor, setAdvisor] = useState({});
  const [formOpen, setFormOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    category: "To-Do Task",
    priority: "Medium",
    status: "Planned",
    targetYear: new Date().getFullYear(),
    dueDate: "",
    branch: "All Branches",
    estimatedCost: 0,
    expectedBenefit: "",
    notes: "",
  });

  const ROYAL_BLUE = "#0B3D91";
  const GOLD = "#f59e0b";
  const BORDER = "#dbe3ef";
  const MUTED = "#64748b";

  const categories = [
    "5-Year Goal",
    "To-Do Task",
    "Hiring Plan",
    "Compliance",
    "LLC Transition",
    "Giveaway / Promotion",
    "Business Decision",
    "Financial Strategy",
    "Operations",
  ];

  const priorities = ["Low", "Medium", "High", "Critical"];
  const statuses = ["Planned", "In Progress", "Completed", "On Hold", "Cancelled"];

  const loadItems = async () => {
    try {
      const res = await api.get("/api/business-planner");
      setItems(res.data.data || []);
      setSummary(res.data.summary || {});
      setAdvisor(res.data.advisor || {});
    } catch (error) {
      console.error("Business growth center error:", error);
      alert(error?.response?.data?.message || "Could not load Business Growth Center.");
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const money = (value) => `JMD ${Number(value || 0).toLocaleString()}`;

  const resetForm = () => {
    setFormData({
      title: "",
      category: "To-Do Task",
      priority: "Medium",
      status: "Planned",
      targetYear: new Date().getFullYear(),
      dueDate: "",
      branch: "All Branches",
      estimatedCost: 0,
      expectedBenefit: "",
      notes: "",
    });
  };

  const saveItem = async () => {
    try {
      if (!formData.title) {
        alert("Title is required.");
        return;
      }

      await api.post("/api/business-planner", formData);
      alert("Planner item created successfully.");
      setFormOpen(false);
      resetForm();
      await loadItems();
    } catch (error) {
      console.error("Business planner save error:", error);
      alert(error?.response?.data?.message || "Could not save planner item.");
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/api/business-planner/${id}`, { status });
      await loadItems();
    } catch (error) {
      console.error("Status update error:", error);
      alert(error?.response?.data?.message || "Could not update status.");
    }
  };

  const deleteItem = async (id) => {
    const confirmed = window.confirm("Delete this planner item?");
    if (!confirmed) return;

    try {
      await api.delete(`/api/business-planner/${id}`);
      await loadItems();
    } catch (error) {
      console.error("Delete planner item error:", error);
      alert(error?.response?.data?.message || "Could not delete item.");
    }
  };

  const statusColor = (status) => {
    if (status === "Completed") return "#16a34a";
    if (status === "In Progress") return "#2563eb";
    if (status === "On Hold") return "#f59e0b";
    if (status === "Cancelled") return "#dc2626";
    return "#64748b";
  };

  const priorityColor = (priority) => {
    if (priority === "Critical") return "#b91c1c";
    if (priority === "High") return "#dc2626";
    if (priority === "Medium") return "#f59e0b";
    return "#16a34a";
  };

  return (
    <div>
      <h1 style={{ margin: 0 }}>Business Growth Center</h1>
      <p style={{ marginTop: "6px", color: MUTED }}>
        Five-year planning, to-do tracking, compliance roadmap, hiring plans,
        giveaway decisions, and business growth guidance for Eltham Konnect.
      </p>

      <button
        onClick={() => setFormOpen((prev) => !prev)}
        style={{
          backgroundColor: ROYAL_BLUE,
          color: "white",
          border: "none",
          padding: "10px 16px",
          borderRadius: "8px",
          cursor: "pointer",
          fontWeight: "bold",
          margin: "18px 0",
        }}
      >
        {formOpen ? "Close Form" : "+ Add Planner Item"}
      </button>

      <div style={summaryGrid}>
        <Card>
          <h2 style={{ color: ROYAL_BLUE, margin: 0 }}>{summary.total || 0}</h2>
          <p style={{ fontWeight: "bold" }}>Total Planner Items</p>
        </Card>

        <Card>
          <h2 style={{ color: "#16a34a", margin: 0 }}>{summary.completed || 0}</h2>
          <p style={{ fontWeight: "bold" }}>Completed</p>
        </Card>

        <Card>
          <h2 style={{ color: GOLD, margin: 0 }}>{summary.pending || 0}</h2>
          <p style={{ fontWeight: "bold" }}>Pending / Active</p>
        </Card>

        <Card>
          <h2 style={{ color: "#dc2626", margin: 0 }}>{summary.highPriority || 0}</h2>
          <p style={{ fontWeight: "bold" }}>High Priority</p>
        </Card>

        <Card>
          <h2 style={{ color: "#7c3aed", margin: 0 }}>
            {summary.complianceReadiness || 0}%
          </h2>
          <p style={{ fontWeight: "bold" }}>Compliance Readiness</p>
        </Card>

        <Card>
          <h2 style={{ color: "#0891b2", margin: 0 }}>{summary.activeGiveaways || 0}</h2>
          <p style={{ fontWeight: "bold" }}>Active Giveaways</p>
        </Card>
      </div>

      <div style={panel(BORDER)}>
        <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>
          {advisor.title || "EKOS Business Advisor"}
        </h2>
        <p style={{ color: "#334155", lineHeight: 1.6 }}>
          {advisor.message ||
            "Use this module to guide growth, profitability, compliance, hiring, and business decisions."}
        </p>

        <div style={{ ...panel("#fde68a"), backgroundColor: "#fffbeb", marginBottom: 0 }}>
          <strong>Giveaway Rule:</strong> Do not run giveaways using money needed
          for rent, payroll, freight, debt repayment, taxes, customer deliveries,
          or emergency cash reserve.
        </div>
      </div>

      {formOpen && (
        <div style={panel(BORDER)}>
          <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>New Planner Item</h2>

          <div style={grid}>
            <input
              placeholder="Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              style={input(BORDER)}
            />

            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              style={input(BORDER)}
            >
              {categories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>

            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              style={input(BORDER)}
            >
              {priorities.map((priority) => (
                <option key={priority}>{priority}</option>
              ))}
            </select>

            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              style={input(BORDER)}
            >
              {statuses.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Target Year"
              value={formData.targetYear}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  targetYear: Number(e.target.value || new Date().getFullYear()),
                })
              }
              style={input(BORDER)}
            />

            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              style={input(BORDER)}
            />

            <input
              placeholder="Branch"
              value={formData.branch}
              onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
              style={input(BORDER)}
            />

            <input
              type="number"
              placeholder="Estimated Cost"
              value={formData.estimatedCost}
              onChange={(e) =>
                setFormData({ ...formData, estimatedCost: Number(e.target.value || 0) })
              }
              style={input(BORDER)}
            />

            <textarea
              placeholder="Expected Benefit"
              value={formData.expectedBenefit}
              onChange={(e) =>
                setFormData({ ...formData, expectedBenefit: e.target.value })
              }
              style={{ ...input(BORDER), gridColumn: "1 / -1" }}
            />

            <textarea
              placeholder="Notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              style={{ ...input(BORDER), gridColumn: "1 / -1" }}
            />
          </div>

          <button onClick={saveItem} style={{ ...button("#16a34a"), marginTop: "14px" }}>
            Save Planner Item
          </button>
        </div>
      )}

      <div style={panel(BORDER)}>
        <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>Planner & To-Do Tracker</h2>

        <div
          style={{
            overflowX: "auto",
            overflowY: "auto",
            maxHeight: "72vh",
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
            <thead style={{ backgroundColor: "#eef4ff", position: "sticky", top: 0 }}>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Target Year</th>
                <th>Due Date</th>
                <th>Branch</th>
                <th>Estimated Cost</th>
                <th>Expected Benefit</th>
                <th>Advisor Note</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {items.length > 0 ? (
                items.map((item) => (
                  <tr key={item._id}>
                    <td style={{ fontWeight: "bold" }}>{item.title}</td>
                    <td>{item.category}</td>
                    <td>
                      <span style={badge(priorityColor(item.priority))}>
                        {item.priority}
                      </span>
                    </td>
                    <td>
                      <select
                        value={item.status}
                        onChange={(e) => updateStatus(item._id, e.target.value)}
                        style={{
                          ...input(BORDER),
                          color: statusColor(item.status),
                          fontWeight: "bold",
                        }}
                      >
                        {statuses.map((status) => (
                          <option key={status}>{status}</option>
                        ))}
                      </select>
                    </td>
                    <td>{item.targetYear}</td>
                    <td>{item.dueDate ? String(item.dueDate).slice(0, 10) : "—"}</td>
                    <td>{item.branch}</td>
                    <td>{money(item.estimatedCost)}</td>
                    <td>{item.expectedBenefit || "—"}</td>
                    <td>{item.advisorNote || "—"}</td>
                    <td>{item.notes || "—"}</td>
                    <td>
                      <button onClick={() => deleteItem(item._id)} style={button("#dc2626")}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="12" style={{ textAlign: "center", color: MUTED }}>
                    No planner items found. Add your first five-year goal, to-do task,
                    hiring plan, compliance item, or giveaway decision.
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

const summaryGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "14px",
  marginBottom: "18px",
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
  gap: "12px",
};

function panel(border) {
  return {
    backgroundColor: "white",
    border: `1px solid ${border}`,
    borderRadius: "12px",
    padding: "18px",
    marginBottom: "18px",
  };
}

function input(border) {
  return {
    padding: "10px",
    borderRadius: "8px",
    border: `1px solid ${border}`,
  };
}

function button(color) {
  return {
    backgroundColor: color,
    color: "white",
    border: "none",
    padding: "10px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
  };
}

function badge(color) {
  return {
    backgroundColor: color,
    color: "white",
    padding: "6px 10px",
    borderRadius: "999px",
    fontWeight: "bold",
    fontSize: "12px",
    display: "inline-block",
  };
}

function Card({ children }) {
  return (
    <div
      style={{
        backgroundColor: "white",
        border: "1px solid #dbe3ef",
        borderRadius: "12px",
        padding: "18px",
      }}
    >
      {children}
    </div>
  );
}

export default BusinessGrowthCenter;