import { useEffect, useState } from "react";
import api from "../api";

function AmazonAssociateLinks() {
  const [items, setItems] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [editingItemNumber, setEditingItemNumber] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    affiliateLink: "",
    productType: "Amazon Affiliate",
    category: "General",
    sourceSupplier: "",
    costPrice: 0,
    sellingPrice: 0,
    quantityInStock: 0,
    lowStockAlertLevel: 2,
    buttonText: "Shop on Amazon",
    sortOrder: 0,
    isActive: true,
  });

  const ROYAL_BLUE = "#0B3D91";
  const WHITE = "#ffffff";
  const LIGHT_BG = "#f4f7fb";
  const BORDER = "#dbe3ef";
  const MUTED = "#64748b";

  const FILE_BASE = "https://eltham-konnect-backend-c2sf.onrender.com";

  const fetchItems = async () => {
    try {
      const res = await api.get("/api/amazon-associate");
      setItems(res.data.data || []);
      const dashboardRes = await api.get("/api/amazon-associate/dashboard");
      setDashboard(dashboardRes.data.data || null);
    } catch (error) {
      console.error("Error loading Amazon associate items:", error);
      alert(error?.response?.data?.message || "Could not load Amazon associate items.");
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

    const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      affiliateLink: "",
      productType: "Amazon Affiliate",
      category: "General",
      sourceSupplier: "",
      costPrice: 0,
      sellingPrice: 0,
      quantityInStock: 0,
      lowStockAlertLevel: 2,
      buttonText: "Shop on Amazon",
      sortOrder: 0,
      isActive: true,
    });
    setImageFile(null);
    setEditingItemNumber("");
    setIsEditing(false);

    const fileInput = document.getElementById("amazon-associate-image");
    if (fileInput) fileInput.value = "";
  };

  const saveItem = async () => {
    try {
            if (!formData.title) {
        alert("Product title is required.");
        return;
      }

      if (formData.productType === "Amazon Affiliate" && !formData.affiliateLink) {
        alert("Affiliate link is required for Amazon affiliate products.");
        return;
      }

      const payload = new FormData();
      payload.append("title", formData.title);
      payload.append("description", formData.description);
      payload.append("affiliateLink", formData.affiliateLink);
      payload.append("productType", formData.productType);
      payload.append("category", formData.category);
      payload.append("sourceSupplier", formData.sourceSupplier);
      payload.append("costPrice", formData.costPrice);
      payload.append("sellingPrice", formData.sellingPrice);
      payload.append("quantityInStock", formData.quantityInStock);
      payload.append("lowStockAlertLevel", formData.lowStockAlertLevel);
      payload.append("buttonText", formData.buttonText);
      payload.append("sortOrder", formData.sortOrder);
      payload.append("isActive", formData.isActive);

      if (imageFile) {
        payload.append("image", imageFile);
      }

      const res = isEditing
        ? await api.put(`/api/amazon-associate/${editingItemNumber}`, payload, {
            headers: { "Content-Type": "multipart/form-data" },
          })
        : await api.post("/api/amazon-associate", payload, {
            headers: { "Content-Type": "multipart/form-data" },
          });

      alert(res.data.message || "Saved successfully.");
      resetForm();
      await fetchItems();
    } catch (error) {
      console.error("Error saving Amazon associate item:", error);
      alert(error?.response?.data?.message || "Could not save item.");
    }
  };

    const loadForEdit = (item) => {
    setFormData({
      title: item.title || "",
      description: item.description || "",
      affiliateLink: item.affiliateLink || "",
      productType: item.productType || "Amazon Affiliate",
      category: item.category || "General",
      sourceSupplier: item.sourceSupplier || "",
      costPrice: item.costPrice || 0,
      sellingPrice: item.sellingPrice || 0,
      quantityInStock: item.quantityInStock || 0,
      lowStockAlertLevel: item.lowStockAlertLevel || 2,
      buttonText: item.buttonText || "Shop on Amazon",
      sortOrder: item.sortOrder ?? 0,
      isActive: Boolean(item.isActive),
    });
    setEditingItemNumber(item.itemNumber);
    setIsEditing(true);
    setImageFile(null);

    const fileInput = document.getElementById("amazon-associate-image");
    if (fileInput) fileInput.value = "";
  };

  const deleteItem = async (itemNumber) => {
    try {
      const confirmed = window.confirm("Delete this Amazon associate item?");
      if (!confirmed) return;

      const res = await api.delete(`/api/amazon-associate/${itemNumber}`);
      alert(res.data.message || "Deleted successfully.");
      await fetchItems();
    } catch (error) {
      console.error("Error deleting item:", error);
      alert(error?.response?.data?.message || "Could not delete item.");
    }
  };

  return (
    <div style={{ backgroundColor: LIGHT_BG, minHeight: "100vh" }}>
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ margin: 0, color: "#0f172a" }}>Storefront & Amazon Associate Dashboard</h1>
        <p style={{ margin: "6px 0 0 0", color: MUTED }}>
          Manage Amazon affiliate links and EK-owned inventory products for the customer storefront.
        </p>
      </div>
      <div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
    gap: "14px",
    marginTop: "18px",
  }}
>
  <div style={{ backgroundColor: WHITE, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "16px" }}>
    <h2 style={{ margin: 0, color: ROYAL_BLUE }}>{dashboard?.totalItems || 0}</h2>
    <p style={{ marginBottom: 0, color: MUTED, fontWeight: "bold" }}>Total Storefront Items</p>
  </div>

  <div style={{ backgroundColor: WHITE, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "16px" }}>
    <h2 style={{ margin: 0, color: "#16a34a" }}>JMD {Number(dashboard?.inventoryValue || 0).toLocaleString()}</h2>
    <p style={{ marginBottom: 0, color: MUTED, fontWeight: "bold" }}>Inventory Cost Value</p>
  </div>

  <div style={{ backgroundColor: WHITE, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "16px" }}>
    <h2 style={{ margin: 0, color: "#7c3aed" }}>JMD {Number(dashboard?.potentialProfit || 0).toLocaleString()}</h2>
    <p style={{ marginBottom: 0, color: MUTED, fontWeight: "bold" }}>Potential Profit</p>
  </div>

  <div style={{ backgroundColor: WHITE, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "16px" }}>
    <h2 style={{ margin: 0, color: "#dc2626" }}>{dashboard?.lowStockItems?.length || 0}</h2>
    <p style={{ marginBottom: 0, color: MUTED, fontWeight: "bold" }}>Low Stock Items</p>
  </div>
</div>

      <div
        style={{
          backgroundColor: WHITE,
          padding: "20px",
          borderRadius: "12px",
          marginBottom: "20px",
          border: `1px solid ${BORDER}`,
        }}
      >
        <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>
          {isEditing ? "Edit Associate Item" : "Add Associate Item"}
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "15px",
          }}
        >
          <input
            type="text"
            name="title"
            placeholder="Product Title"
            value={formData.title}
            onChange={handleChange}
            style={{ padding: "10px" }}
          />

          <input
            type="text"
            name="affiliateLink"
            placeholder="Amazon Associate Link"
            value={formData.affiliateLink}
            onChange={handleChange}
            style={{ padding: "10px" }}
          />

          <input
            type="text"
            name="buttonText"
            placeholder="Button Text"
            value={formData.buttonText}
            onChange={handleChange}
            style={{ padding: "10px" }}
          />

                    <select
            name="productType"
            value={formData.productType}
            onChange={handleChange}
            style={{ padding: "10px" }}
          >
            <option value="Amazon Affiliate">Amazon Affiliate</option>
            <option value="EK Inventory">EK Inventory</option>
          </select>

          <input
            type="text"
            name="category"
            placeholder="Category e.g. Hair, Colognes, Candles"
            value={formData.category}
            onChange={handleChange}
            style={{ padding: "10px" }}
          />

          <input
            type="text"
            name="sourceSupplier"
            placeholder="Supplier / Source e.g. Bath & Body Works"
            value={formData.sourceSupplier}
            onChange={handleChange}
            style={{ padding: "10px" }}
          />

          <input
            type="number"
            name="costPrice"
            placeholder="Cost Price"
            value={formData.costPrice}
            onChange={handleChange}
            style={{ padding: "10px" }}
          />

          <input
            type="number"
            name="sellingPrice"
            placeholder="Selling Price"
            value={formData.sellingPrice}
            onChange={handleChange}
            style={{ padding: "10px" }}
          />

          <input
            type="number"
            name="quantityInStock"
            placeholder="Quantity In Stock"
            value={formData.quantityInStock}
            onChange={handleChange}
            style={{ padding: "10px" }}
          />

          <input
            type="number"
            name="lowStockAlertLevel"
            placeholder="Low Stock Alert Level"
            value={formData.lowStockAlertLevel}
            onChange={handleChange}
            style={{ padding: "10px" }}
          />

          <input
            type="number"
            name="sortOrder"
            placeholder="Sort Order"
            value={formData.sortOrder}
            onChange={handleChange}
            style={{ padding: "10px" }}
          />

          <input
            id="amazon-associate-image"
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            onChange={(e) => setImageFile(e.target.files[0] || null)}
            style={{ padding: "10px" }}
          />

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontWeight: "bold",
            }}
          >
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
            />
            Active
          </label>

          <textarea
            name="description"
            placeholder="Short Description"
            value={formData.description}
            onChange={handleChange}
            style={{ padding: "10px", minHeight: "100px", gridColumn: "1 / -1" }}
          />
        </div>

        <div style={{ display: "flex", gap: "10px", marginTop: "18px", flexWrap: "wrap" }}>
          <button
            onClick={saveItem}
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
            {isEditing ? "Update Item" : "Save Item"}
          </button>

          <button
            onClick={resetForm}
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
            Reset
          </button>
        </div>
      </div>

      <div
        style={{
          backgroundColor: WHITE,
          padding: "20px",
          borderRadius: "12px",
          border: `1px solid ${BORDER}`,
        }}
      >
        <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>Associate Items</h2>

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
              minWidth: "1200px",
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
                <th>Image</th>
                <th>Title</th>
                <th>Description</th>
                <th>Type</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Link</th>
                <th>Button Text</th>
                <th>Sort Order</th>
                <th>Status</th>
                <th
  style={{
    position: "sticky",
    right: 0,
    backgroundColor: "#eef4ff",
    zIndex: 6,
    minWidth: "180px",
  }}
>
  Action
</th>
              </tr>
            </thead>

            <tbody>
              {items.length > 0 ? (
                items.map((item) => (
                  <tr key={item.itemNumber}>
                    <td>
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          style={{
                            width: "70px",
                            height: "70px",
                            objectFit: "cover",
                            borderRadius: "8px",
                            border: `1px solid ${BORDER}`,
                          }}
                        />
                      ) : (
                        "No Image"
                      )}
                    </td>
                    <td>{item.title}</td>
                    <td>{item.description || "-"}</td>
                                        <td>{item.productType || "Amazon Affiliate"}</td>
                    <td>{item.category || "General"}</td>
                    <td>
                      {item.productType === "EK Inventory"
                        ? `JMD ${Number(item.sellingPrice || 0).toLocaleString()}`
                        : "—"}
                    </td>
                    <td>
                      {item.productType === "EK Inventory"
                        ? Number(item.quantityInStock || 0)
                        : "—"}
                    </td>
                    <td>
                      {item.affiliateLink ? (
                        <a
                          href={item.affiliateLink}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: ROYAL_BLUE, fontWeight: "bold" }}
                        >
                          View Link
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>{item.buttonText}</td>
                    <td>{item.sortOrder}</td>
                    <td>{item.isActive ? "Active" : "Inactive"}</td>
                    <td
  style={{
    position: "sticky",
    right: 0,
    backgroundColor: WHITE,
    zIndex: 4,
    minWidth: "180px",
    boxShadow: "-4px 0 8px rgba(15,23,42,0.08)",
  }}
>
  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <button
                          onClick={() => loadForEdit(item)}
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

                        <button
                          onClick={() => deleteItem(item.itemNumber)}
                          style={{
                            backgroundColor: "#dc2626",
                            color: WHITE,
                            border: "none",
                            padding: "8px 12px",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontWeight: "bold",
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="12" style={{ textAlign: "center", color: MUTED }}>
                    No Amazon associate items found.
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

export default AmazonAssociateLinks;