import { useEffect, useState } from "react";
import api from "../api";

function MarketplaceInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentLinks, setPaymentLinks] = useState({});
  const [chargeInputs, setChargeInputs] = useState({});

  const ROYAL_BLUE = "#0B3D91";
  const GOLD = "#D4AF37";
  const WHITE = "#ffffff";
  const BORDER = "#dbe3ef";
  const MUTED = "#64748b";
  const TEXT = "#0f172a";

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/marketplace-invoices");
      setInvoices(res.data.data || []);

      const links = {};
const charges = {};

(res.data.data || []).forEach((invoice) => {
  links[invoice.invoiceNumber] = invoice.paymentLink || "";
  charges[invoice.invoiceNumber] = {
    deliveryFee: invoice.deliveryFee || 0,
    discount: invoice.discount || 0,
  };
});

setPaymentLinks(links);
setChargeInputs(charges);
    } catch (error) {
      alert(error?.response?.data?.message || "Could not load marketplace invoices.");
    } finally {
      setLoading(false);
    }
  };

  const savePaymentLink = async (invoiceNumber) => {
    try {
      const res = await api.put(`/api/marketplace-invoices/${invoiceNumber}/payment-link`, {
        paymentLink: paymentLinks[invoiceNumber] || "",
      });

      alert(res.data.message || "Payment link saved.");
      await fetchInvoices();
    } catch (error) {
      alert(error?.response?.data?.message || "Could not save payment link.");
    }
  };

  const markPaid = async (invoiceNumber) => {
    try {
      const confirmed = window.confirm("Mark this marketplace invoice as paid?");
      if (!confirmed) return;

      const res = await api.put(`/api/marketplace-invoices/${invoiceNumber}/mark-paid`);

      alert(res.data.message || "Marketplace invoice marked as paid.");
      await fetchInvoices();
    } catch (error) {
      alert(error?.response?.data?.message || "Could not mark invoice paid.");
    }
  };

  const printInvoice = (invoiceNumber) => {
    const section = document.getElementById(`invoice-${invoiceNumber}`);
    if (!section) return;

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>${invoiceNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
            .invoice-card { border: 1px solid #dbe3ef; border-radius: 14px; padding: 20px; }
            .row { display: flex; justify-content: space-between; border-top: 1px solid #dbe3ef; padding: 10px 0; }
          </style>
        </head>
        <body>${section.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const saveCharges = async (invoiceNumber) => {
  try {
    const values = chargeInputs[invoiceNumber] || {};

    const res = await api.put(`/api/marketplace-invoices/${invoiceNumber}/charges`, {
      deliveryFee: Number(values.deliveryFee || 0),
      discount: Number(values.discount || 0),
    });

    alert(res.data.message || "Marketplace invoice charges updated.");
    await fetchInvoices();
  } catch (error) {
    alert(
      error?.response?.data?.message ||
        "Could not update marketplace invoice charges."
    );
  }
};

  useEffect(() => {
    fetchInvoices();
  }, []);

  if (loading) {
    return <div style={{ color: MUTED, fontWeight: "bold" }}>Loading marketplace invoices...</div>;
  }

  return (
    <div>
      <div style={{ backgroundColor: WHITE, border: `1px solid ${BORDER}`, borderRadius: "18px", padding: "22px", marginBottom: "18px" }}>
        <h1 style={{ marginTop: 0, color: TEXT }}>Marketplace Invoices Dashboard</h1>
        <p style={{ color: MUTED, marginBottom: 0 }}>
          Manage separate marketplace invoices, payment links, payment status, and invoice printing.
        </p>
      </div>

      {invoices.length === 0 ? (
        <div style={{ backgroundColor: WHITE, border: `1px solid ${BORDER}`, borderRadius: "16px", padding: "22px", color: MUTED, fontWeight: "bold" }}>
          No marketplace invoices found.
        </div>
      ) : (
        <div style={{ display: "grid", gap: "16px" }}>
          {invoices.map((invoice) => (
            <div key={invoice.invoiceNumber} id={`invoice-${invoice.invoiceNumber}`} style={{ backgroundColor: WHITE, border: `1px solid ${BORDER}`, borderRadius: "18px", padding: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "14px", flexWrap: "wrap", marginBottom: "14px" }}>
                <div>
                  <div style={{ fontWeight: "bold", color: ROYAL_BLUE, fontSize: "18px" }}>{invoice.invoiceNumber}</div>
                  <div style={{ color: TEXT, fontWeight: "bold", marginTop: "4px" }}>{invoice.customerName || "Customer"}</div>
                  <div style={{ color: MUTED, fontSize: "13px" }}>{invoice.customerEkonId || invoice.customerKey}</div>
                  <div style={{ color: MUTED, fontSize: "13px" }}>Order: {invoice.orderNumber}</div>
                  <div style={{ color: MUTED, fontSize: "13px", marginTop: "4px" }}>
                    {invoice.createdAt ? new Date(invoice.createdAt).toLocaleString() : ""}
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ color: MUTED, fontSize: "13px" }}>Invoice Total</div>
                  <div style={{ color: TEXT, fontSize: "24px", fontWeight: "bold" }}>
                    JMD {Number(invoice.finalTotal || 0).toLocaleString()}
                  </div>
                  <div style={{ marginTop: "8px", display: "inline-block", backgroundColor: invoice.status === "Paid" ? "#dcfce7" : "#fff7ed", color: invoice.status === "Paid" ? "#166534" : "#9a3412", padding: "7px 12px", borderRadius: "999px", fontWeight: "bold" }}>
                    {invoice.status}
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gap: "10px", marginTop: "12px" }}>
                {(invoice.items || []).map((item) => (
                  <div key={item.itemNumber} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "12px", borderTop: `1px solid ${BORDER}`, paddingTop: "10px" }}>
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

              <div style={{ borderTop: `1px solid ${BORDER}`, marginTop: "14px", paddingTop: "14px", display: "grid", gap: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Subtotal</span>
                  <strong>JMD {Number(invoice.subtotal || 0).toLocaleString()}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Delivery Fee</span>
                  <strong>JMD {Number(invoice.deliveryFee || 0).toLocaleString()}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Discount</span>
                  <strong>JMD {Number(invoice.discount || 0).toLocaleString()}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "18px" }}>
                  <span>Total</span>
                  <strong>JMD {Number(invoice.finalTotal || 0).toLocaleString()}</strong>
                </div>
                {invoice.status !== "Paid" && (
  <div
    style={{
      marginTop: "14px",
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
      gap: "10px",
      alignItems: "end",
    }}
  >
    <label style={{ display: "grid", gap: "6px", fontWeight: "bold", color: TEXT }}>
      Delivery Fee
      <input
        type="number"
        value={chargeInputs[invoice.invoiceNumber]?.deliveryFee || 0}
        onChange={(e) =>
          setChargeInputs((prev) => ({
            ...prev,
            [invoice.invoiceNumber]: {
              ...(prev[invoice.invoiceNumber] || {}),
              deliveryFee: e.target.value,
            },
          }))
        }
        style={{
          padding: "10px",
          borderRadius: "10px",
          border: `1px solid ${BORDER}`,
        }}
      />
    </label>

    <label style={{ display: "grid", gap: "6px", fontWeight: "bold", color: TEXT }}>
      Discount
      <input
        type="number"
        value={chargeInputs[invoice.invoiceNumber]?.discount || 0}
        onChange={(e) =>
          setChargeInputs((prev) => ({
            ...prev,
            [invoice.invoiceNumber]: {
              ...(prev[invoice.invoiceNumber] || {}),
              discount: e.target.value,
            },
          }))
        }
        style={{
          padding: "10px",
          borderRadius: "10px",
          border: `1px solid ${BORDER}`,
        }}
      />
    </label>

    <button
      onClick={() => saveCharges(invoice.invoiceNumber)}
      style={{
        backgroundColor: GOLD,
        color: "#111827",
        border: "none",
        padding: "11px 14px",
        borderRadius: "10px",
        fontWeight: "bold",
        cursor: "pointer",
      }}
    >
      Save Charges
    </button>
  </div>
)}
              </div>

              <div style={{ marginTop: "16px", display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: "10px", alignItems: "center" }}>
                <input
                  type="text"
                  placeholder="Paste Fygaro marketplace payment link"
                  value={paymentLinks[invoice.invoiceNumber] || ""}
                  onChange={(e) =>
                    setPaymentLinks((prev) => ({
                      ...prev,
                      [invoice.invoiceNumber]: e.target.value,
                    }))
                  }
                  style={{
                    padding: "10px",
                    borderRadius: "10px",
                    border: `1px solid ${BORDER}`,
                  }}
                />

                <button onClick={() => savePaymentLink(invoice.invoiceNumber)} style={{ backgroundColor: ROYAL_BLUE, color: WHITE, border: "none", padding: "10px 12px", borderRadius: "10px", fontWeight: "bold", cursor: "pointer" }}>
                  Save Link
                </button>

                <button onClick={() => markPaid(invoice.invoiceNumber)} disabled={invoice.status === "Paid"} style={{ backgroundColor: invoice.status === "Paid" ? "#94a3b8" : GOLD, color: "#111827", border: "none", padding: "10px 12px", borderRadius: "10px", fontWeight: "bold", cursor: invoice.status === "Paid" ? "not-allowed" : "pointer" }}>
                  Mark Paid
                </button>

                <button onClick={() => printInvoice(invoice.invoiceNumber)} style={{ backgroundColor: "#64748b", color: WHITE, border: "none", padding: "10px 12px", borderRadius: "10px", fontWeight: "bold", cursor: "pointer" }}>
                  Print
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MarketplaceInvoices;