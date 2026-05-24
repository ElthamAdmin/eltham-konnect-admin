import { useEffect, useState } from "react";
import api from "../api";

function MarketplaceOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const ROYAL_BLUE = "#0B3D91";
  const WHITE = "#ffffff";
  const BORDER = "#dbe3ef";
  const MUTED = "#64748b";
  const TEXT = "#0f172a";

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/marketplace-orders");
      setOrders(res.data.data || []);
    } catch (error) {
      alert(error?.response?.data?.message || "Could not load marketplace orders.");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderNumber, status) => {
    try {
      const res = await api.put(`/api/marketplace-orders/${orderNumber}/status`, {
        status,
      });

      setOrders((prev) =>
        prev.map((order) =>
          order.orderNumber === orderNumber ? res.data.data : order
        )
      );

      alert("Order status updated.");
    } catch (error) {
      alert(error?.response?.data?.message || "Could not update order status.");
    }
  };

  const generateInvoice = async (orderNumber) => {
  try {
    const confirmed = window.confirm(
      "Generate a separate marketplace invoice for this order?"
    );

    if (!confirmed) return;

    const res = await api.post(`/api/marketplace-invoices/generate/${orderNumber}`, {
      deliveryFee: 0,
      discount: 0,
    });

    alert(res.data.message || "Marketplace invoice generated successfully.");
    await fetchOrders();
  } catch (error) {
    alert(
      error?.response?.data?.message ||
        "Could not generate marketplace invoice."
    );
  }
};

  useEffect(() => {
    fetchOrders();
  }, []);

  if (loading) {
    return <div style={{ color: MUTED, fontWeight: "bold" }}>Loading marketplace orders...</div>;
  }

  return (
    <div>
      <div style={{ backgroundColor: WHITE, border: `1px solid ${BORDER}`, borderRadius: "18px", padding: "22px", marginBottom: "18px" }}>
        <h1 style={{ marginTop: 0, color: TEXT }}>Marketplace Orders Dashboard</h1>
        <p style={{ color: MUTED, marginBottom: 0 }}>
          Review customer marketplace orders, totals, items, and fulfillment status.
        </p>
      </div>

      {orders.length === 0 ? (
        <div style={{ backgroundColor: WHITE, border: `1px solid ${BORDER}`, borderRadius: "16px", padding: "22px", color: MUTED, fontWeight: "bold" }}>
          No marketplace orders found.
        </div>
      ) : (
        <div style={{ display: "grid", gap: "16px" }}>
          {orders.map((order) => (
            <div key={order.orderNumber} style={{ backgroundColor: WHITE, border: `1px solid ${BORDER}`, borderRadius: "18px", padding: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "14px", flexWrap: "wrap", marginBottom: "14px" }}>
                <div>
                  <div style={{ fontWeight: "bold", color: ROYAL_BLUE, fontSize: "18px" }}>{order.orderNumber}</div>
                  <div style={{ color: TEXT, fontWeight: "bold", marginTop: "4px" }}>
                    {order.customerName || "Customer"}
                  </div>
                  <div style={{ color: MUTED, fontSize: "13px" }}>
                    {order.customerEkonId || order.customerKey}
                  </div>
                  <div style={{ color: MUTED, fontSize: "13px", marginTop: "4px" }}>
                    {order.createdAt ? new Date(order.createdAt).toLocaleString() : ""}
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ color: MUTED, fontSize: "13px" }}>Order Total</div>
                  <div style={{ color: TEXT, fontSize: "22px", fontWeight: "bold" }}>
                    JMD {Number(order.subtotal || 0).toLocaleString()}
                  </div>

                  <select
                    value={order.status}
                    onChange={(e) => updateStatus(order.orderNumber, e.target.value)}
                    style={{
                      marginTop: "10px",
                      padding: "9px",
                      borderRadius: "10px",
                      border: `1px solid ${BORDER}`,
                      fontWeight: "bold",
                    }}
                  >
                    <option value="Pending Review">Pending Review</option>
<option value="Approved">Approved</option>
<option value="Awaiting Payment">Awaiting Payment</option>
<option value="Paid">Paid</option>
<option value="Preparing">Preparing</option>
<option value="Ready For Pickup">Ready For Pickup</option>
<option value="Out For Delivery">Out For Delivery</option>
<option value="Completed">Completed</option>
<option value="Cancelled">Cancelled</option>
                  </select>

                  <button
  onClick={() => generateInvoice(order.orderNumber)}
  style={{
    marginTop: "10px",
    backgroundColor: ROYAL_BLUE,
    color: WHITE,
    border: "none",
    padding: "9px 12px",
    borderRadius: "10px",
    fontWeight: "bold",
    cursor: "pointer",
    width: "100%",
  }}
>
  Generate Marketplace Invoice
</button>

                </div>
              </div>

              <div style={{ display: "grid", gap: "10px" }}>
                {(order.items || []).map((item) => (
                  <div key={item.itemNumber} style={{ display: "grid", gridTemplateColumns: "70px 1fr auto", gap: "12px", alignItems: "center", borderTop: `1px solid ${BORDER}`, paddingTop: "10px" }}>
                    <div style={{ width: "70px", height: "70px", borderRadius: "12px", backgroundColor: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.title} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                      ) : (
                        <span style={{ color: MUTED, fontSize: "11px" }}>No Image</span>
                      )}
                    </div>

                    <div>
                      <div style={{ fontWeight: "bold", color: TEXT }}>{item.title}</div>
                      <div style={{ color: MUTED, fontSize: "13px" }}>
                        {item.category || "Marketplace Item"} • Qty: {item.quantity}
                      </div>
                      <div style={{ color: ROYAL_BLUE, fontWeight: "bold", marginTop: "4px" }}>
                        JMD {Number(item.sellingPrice || 0).toLocaleString()} each
                      </div>
                    </div>

                    <div style={{ fontWeight: "bold", color: TEXT }}>
                      JMD {Number(item.lineTotal || 0).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MarketplaceOrders;