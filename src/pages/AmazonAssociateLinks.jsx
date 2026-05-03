import { useEffect, useState } from "react";
import api from "../api";

function AmazonAssociateLinks() {
  const [items, setItems] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [editingItemNumber, setEditingItemNumber] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    affiliateLink: "",
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
      if (!formData.title || !formData.affiliateLink) {
        alert("Title and affiliate link are required.");
        return;
      }

      const payload = new FormData();
      payload.append("title", formData.title);
      payload.append("description", formData.description);
      payload.append("affiliateLink", formData.affiliateLink);
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
        <h1 style={{ margin: 0, color: "#0f172a" }}>Amazon Associate Links</h1>
        <p style={{ margin: "6px 0 0 0", color: MUTED }}>
          Upload product images and attach your Amazon associate links for customers.
        </p>
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

        <div style={{ overflowX: "auto" }}>
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
            <thead style={{ backgroundColor: "#eef4ff" }}>
              <tr>
                <th>Image</th>
                <th>Title</th>
                <th>Description</th>
                <th>Link</th>
                <th>Button Text</th>
                <th>Sort Order</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {items.length > 0 ? (
                items.map((item) => (
                  <tr key={item.itemNumber}>
                    <td>
                      {item.imageUrl ? (
                        <img
                          src={`${FILE_BASE}${item.imageUrl}`}
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
                    <td>
                      <a
                        href={item.affiliateLink}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: ROYAL_BLUE, fontWeight: "bold" }}
                      >
                        View Link
                      </a>
                    </td>
                    <td>{item.buttonText}</td>
                    <td>{item.sortOrder}</td>
                    <td>{item.isActive ? "Active" : "Inactive"}</td>
                    <td>
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
                  <td colSpan="8" style={{ textAlign: "center", color: MUTED }}>
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