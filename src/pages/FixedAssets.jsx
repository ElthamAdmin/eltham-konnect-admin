import { useEffect, useState } from "react";
import api from "../api";

function FixedAssets() {
  const [assets, setAssets] = useState([]);
  const [summary, setSummary] = useState({});
  const [formOpen, setFormOpen] = useState(false);

  const [formData, setFormData] = useState({
    assetName: "",
    assetCategory: "Warehouse Equipment",
    purchaseDate: new Date().toISOString().slice(0, 10),
    purchaseCost: 0,
    salvageValue: 0,
    usefulLifeYears: 5,
    notes: "",
  });

  const ROYAL_BLUE = "#0B3D91";
  const BORDER = "#dbe3ef";
  const MUTED = "#64748b";

  const loadAssets = async () => {
    try {
      const res = await api.get("/api/fixed-assets");
      setAssets(res.data.data || []);
      setSummary(res.data.summary || {});
    } catch (error) {
      console.error("Fixed assets error:", error);
      alert(error?.response?.data?.message || "Could not load fixed assets.");
    }
  };

  useEffect(() => {
    loadAssets();
  }, []);

  const money = (value) => `JMD ${Number(value || 0).toLocaleString()}`;

  const saveAsset = async () => {
    try {
      if (!formData.assetName || !formData.purchaseCost || !formData.usefulLifeYears) {
        alert("Asset name, purchase cost, and useful life are required.");
        return;
      }

      await api.post("/api/fixed-assets", formData);

      alert("Fixed asset created successfully.");
      setFormOpen(false);
      setFormData({
        assetName: "",
        assetCategory: "Warehouse Equipment",
        purchaseDate: new Date().toISOString().slice(0, 10),
        purchaseCost: 0,
        salvageValue: 0,
        usefulLifeYears: 5,
        notes: "",
      });
      await loadAssets();
    } catch (error) {
      console.error("Save asset error:", error);
      alert(error?.response?.data?.message || "Could not create fixed asset.");
    }
  };

  const runDepreciation = async () => {
    const confirmed = window.confirm(
      "Run monthly depreciation for all active assets? Only do this once per accounting month."
    );

    if (!confirmed) return;

    try {
      const res = await api.post("/api/fixed-assets/run-depreciation");
      alert(`${res.data.message}\nAssets processed: ${res.data.depreciatedAssets}`);
      await loadAssets();
    } catch (error) {
      console.error("Depreciation error:", error);
      alert(error?.response?.data?.message || "Could not run depreciation.");
    }
  };

  return (
    <div>
      <h1 style={{ margin: 0 }}>Fixed Assets & Depreciation</h1>
      <p style={{ marginTop: "6px", color: MUTED }}>
        Manage company assets, net book values, and monthly depreciation.
      </p>

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", margin: "18px 0" }}>
        <button onClick={() => setFormOpen((prev) => !prev)} style={button(ROYAL_BLUE)}>
          {formOpen ? "Close Form" : "+ Add Fixed Asset"}
        </button>

        <button onClick={runDepreciation} style={button("#16a34a")}>
          Run Monthly Depreciation
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px", marginBottom: "18px" }}>
        <Card><h2 style={{ color: ROYAL_BLUE, margin: 0 }}>{summary.totalAssets || 0}</h2><p style={{ fontWeight: "bold" }}>Total Assets</p></Card>
        <Card><h2 style={{ color: "#16a34a", margin: 0 }}>{money(summary.totalAssetCost)}</h2><p style={{ fontWeight: "bold" }}>Asset Cost</p></Card>
        <Card><h2 style={{ color: "#dc2626", margin: 0 }}>{money(summary.totalAccumulatedDepreciation)}</h2><p style={{ fontWeight: "bold" }}>Accumulated Depreciation</p></Card>
        <Card><h2 style={{ color: "#7c3aed", margin: 0 }}>{money(summary.totalNetBookValue)}</h2><p style={{ fontWeight: "bold" }}>Net Book Value</p></Card>
      </div>

      {formOpen && (
        <div style={panel(BORDER)}>
          <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>New Fixed Asset</h2>

          <div style={grid}>
            <input
              placeholder="Asset Name"
              value={formData.assetName}
              onChange={(e) => setFormData({ ...formData, assetName: e.target.value })}
              style={input(BORDER)}
            />

            <select
              value={formData.assetCategory}
              onChange={(e) => setFormData({ ...formData, assetCategory: e.target.value })}
              style={input(BORDER)}
            >
              <option>Vehicle</option>
              <option>Computer Equipment</option>
              <option>Furniture</option>
              <option>Office Equipment</option>
              <option>Warehouse Equipment</option>
              <option>Building</option>
              <option>Leasehold Improvement</option>
              <option>Other</option>
            </select>

            <input
              type="date"
              value={formData.purchaseDate}
              onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
              style={input(BORDER)}
            />

            <input
              type="number"
              placeholder="Purchase Cost"
              value={formData.purchaseCost}
              onChange={(e) => setFormData({ ...formData, purchaseCost: Number(e.target.value || 0) })}
              style={input(BORDER)}
            />

            <input
              type="number"
              placeholder="Salvage Value"
              value={formData.salvageValue}
              onChange={(e) => setFormData({ ...formData, salvageValue: Number(e.target.value || 0) })}
              style={input(BORDER)}
            />

            <input
              type="number"
              placeholder="Useful Life Years"
              value={formData.usefulLifeYears}
              onChange={(e) => setFormData({ ...formData, usefulLifeYears: Number(e.target.value || 1) })}
              style={input(BORDER)}
            />

            <textarea
              placeholder="Notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              style={{ ...input(BORDER), gridColumn: "1 / -1" }}
            />
          </div>

          <button onClick={saveAsset} style={{ ...button("#16a34a"), marginTop: "14px" }}>
            Save Fixed Asset
          </button>
        </div>
      )}

      <div style={panel(BORDER)}>
        <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>Asset Register</h2>

        <div style={{ overflowX: "auto", overflowY: "auto", maxHeight: "72vh", border: `1px solid ${BORDER}`, borderRadius: "12px" }}>
          <table border="1" cellPadding="10" style={{ minWidth: "1450px", width: "100%", borderCollapse: "collapse", borderColor: BORDER }}>
            <thead style={{ backgroundColor: "#eef4ff", position: "sticky", top: 0 }}>
              <tr>
                <th>Asset No.</th>
                <th>Name</th>
                <th>Category</th>
                <th>Purchase Date</th>
                <th>Cost</th>
                <th>Salvage</th>
                <th>Useful Life</th>
                <th>Annual Dep.</th>
                <th>Monthly Dep.</th>
                <th>Accumulated Dep.</th>
                <th>Net Book Value</th>
                <th>Status</th>
                <th>Notes</th>
              </tr>
            </thead>

            <tbody>
              {assets.length > 0 ? (
                assets.map((asset) => (
                  <tr key={asset._id}>
                    <td style={{ fontWeight: "bold" }}>{asset.assetNumber}</td>
                    <td>{asset.assetName}</td>
                    <td>{asset.assetCategory}</td>
                    <td>{asset.purchaseDate}</td>
                    <td>{money(asset.purchaseCost)}</td>
                    <td>{money(asset.salvageValue)}</td>
                    <td>{asset.usefulLifeYears} year(s)</td>
                    <td>{money(asset.annualDepreciation)}</td>
                    <td>{money(asset.monthlyDepreciation)}</td>
                    <td>{money(asset.accumulatedDepreciation)}</td>
                    <td style={{ fontWeight: "bold" }}>{money(asset.netBookValue)}</td>
                    <td>{asset.status}</td>
                    <td>{asset.notes || "—"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="13" style={{ textAlign: "center", color: MUTED }}>
                    No fixed assets found.
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

function Card({ children }) {
  return (
    <div style={{ backgroundColor: "white", border: "1px solid #dbe3ef", borderRadius: "12px", padding: "18px" }}>
      {children}
    </div>
  );
}

export default FixedAssets;