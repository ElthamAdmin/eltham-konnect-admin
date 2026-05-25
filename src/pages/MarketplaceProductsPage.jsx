import { useEffect, useState } from "react";
import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "/api";

export default function MarketplaceProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    itemNumber: "",
    title: "",
    description: "",
    category: "",
    imageUrl: "",
    costPrice: "",
    sellingPrice: "",
    quantityInStock: "",
    reorderLevel: 2,
  });

  const loadProducts = async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        `${API_BASE}/marketplace-products`
      );

      setProducts(response.data.data || []);
    } catch (error) {
      console.error("Load marketplace products error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const createProduct = async (e) => {
    e.preventDefault();

    try {
      await axios.post(
        `${API_BASE}/marketplace-products`,
        formData
      );

      alert("Marketplace product created");

      setFormData({
        itemNumber: "",
        title: "",
        description: "",
        category: "",
        imageUrl: "",
        costPrice: "",
        sellingPrice: "",
        quantityInStock: "",
        reorderLevel: 2,
      });

      loadProducts();
    } catch (error) {
      console.error("Create product error:", error);

      alert(
        error?.response?.data?.message ||
          "Could not create product"
      );
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Marketplace Inventory Management</h2>

      <form
        onSubmit={createProduct}
        style={{
          display: "grid",
          gap: "10px",
          marginBottom: "30px",
        }}
      >
        <input
          type="text"
          name="itemNumber"
          placeholder="Item Number"
          value={formData.itemNumber}
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="title"
          placeholder="Product Title"
          value={formData.title}
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="category"
          placeholder="Category"
          value={formData.category}
          onChange={handleChange}
        />

        <textarea
          name="description"
          placeholder="Description"
          value={formData.description}
          onChange={handleChange}
        />

        <input
          type="text"
          name="imageUrl"
          placeholder="Image URL"
          value={formData.imageUrl}
          onChange={handleChange}
        />

        <input
          type="number"
          step="0.01"
          name="costPrice"
          placeholder="Cost Price"
          value={formData.costPrice}
          onChange={handleChange}
        />

        <input
          type="number"
          step="0.01"
          name="sellingPrice"
          placeholder="Selling Price"
          value={formData.sellingPrice}
          onChange={handleChange}
          required
        />

        <input
          type="number"
          name="quantityInStock"
          placeholder="Quantity In Stock"
          value={formData.quantityInStock}
          onChange={handleChange}
        />

        <input
          type="number"
          name="reorderLevel"
          placeholder="Reorder Level"
          value={formData.reorderLevel}
          onChange={handleChange}
        />

        <button type="submit">
          Create Marketplace Product
        </button>
      </form>

      <h3>Inventory Products</h3>

      {loading ? (
        <p>Loading products...</p>
      ) : (
        <table
          border="1"
          cellPadding="10"
          style={{
            width: "100%",
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr>
              <th>Item #</th>
              <th>Title</th>
              <th>Category</th>
              <th>Cost</th>
              <th>Selling</th>
              <th>Stock</th>
              <th>Reorder</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {products.map((product) => (
              <tr key={product._id}>
                <td>{product.itemNumber}</td>
                <td>{product.title}</td>
                <td>{product.category}</td>
                <td>{product.costPrice}</td>
                <td>{product.sellingPrice}</td>
                <td>{product.quantityInStock}</td>
                <td>{product.reorderLevel}</td>
                <td>{product.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}