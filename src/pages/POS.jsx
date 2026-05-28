import { useEffect, useState } from "react";
import api from "../api";

function POS() {
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [loadedInvoice, setLoadedInvoice] = useState(null);
  const [invoiceType, setInvoiceType] = useState("");
  const [drawer, setDrawer] = useState(null);
  const [drawerHistory, setDrawerHistory] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [openingFloat, setOpeningFloat] = useState("");
  const [closingCashCount, setClosingCashCount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [amountTendered, setAmountTendered] = useState("");
  const [paidIntoAccountName, setPaidIntoAccountName] = useState("");
  const [paidIntoAccountNumber, setPaidIntoAccountNumber] = useState("");
  const [notes, setNotes] = useState("");

  const money = (value) => `JMD ${Number(value || 0).toLocaleString()}`;

  const cardStyle = {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "10px",
    border: "1px solid #e5e7eb",
    marginBottom: "20px",
  };

  const buttonStyle = {
    backgroundColor: "#0B3D91",
    color: "white",
    border: "none",
    padding: "10px 16px",
    borderRadius: "6px",
    cursor: "pointer",
  };

  const inputStyle = {
    padding: "10px",
    minWidth: "240px",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
  };

  const loadDrawer = async () => {
    try {
      const res = await api.get("/api/pos/drawer/open");
      setDrawer(res.data.data || null);
    } catch (error) {
      console.error("Error loading drawer:", error);
    }
  };

  const loadDrawerHistory = async () => {
    try {
      const res = await api.get("/api/pos/drawer/history");
      setDrawerHistory(res.data.data || []);
    } catch (error) {
      console.error("Error loading drawer history:", error);
    }
  };

  const loadTransactions = async () => {
    try {
      const res = await api.get("/api/pos/transactions");
      setTransactions(res.data.data || []);
    } catch (error) {
      console.error("Error loading POS transactions:", error);
    }
  };

  useEffect(() => {
    loadDrawer();
    loadDrawerHistory();
    loadTransactions();
  }, []);

  const openDrawer = async () => {
    try {
      const res = await api.post("/api/pos/drawer/open", {
        openingFloat: Number(openingFloat || 0),
      });

      setDrawer(res.data.data);
      setOpeningFloat("");
      await loadDrawerHistory();
      alert("Cash drawer opened.");
    } catch (error) {
      alert(error?.response?.data?.message || "Could not open cash drawer.");
    }
  };

  const closeDrawer = async () => {
    try {
      const res = await api.put("/api/pos/drawer/close", {
        closingCashCount: Number(closingCashCount || 0),
      });

      setDrawer(null);
      setClosingCashCount("");
      await loadDrawerHistory();

      alert(
        `Drawer closed. Cash variance: ${money(res.data.data.cashVariance)}`
      );
    } catch (error) {
      alert(error?.response?.data?.message || "Could not close cash drawer.");
    }
  };

  const findInvoice = async () => {
    try {
      if (!invoiceNumber.trim()) {
        alert("Enter an invoice number.");
        return;
      }

      const res = await api.get(`/api/pos/invoice/${invoiceNumber.trim()}`);
      setInvoiceType(res.data.data.invoiceType);
      setLoadedInvoice(res.data.data.invoice);
      setAmountTendered(res.data.data.invoice.finalTotal || "");
    } catch (error) {
      setLoadedInvoice(null);
      setInvoiceType("");
      alert(error?.response?.data?.message || "Invoice not found.");
    }
  };

  const cashOutInvoice = async () => {
    try {
      if (!drawer) {
        alert("Open a cash drawer before cashing out.");
        return;
      }

      if (!loadedInvoice) {
        alert("Load an invoice first.");
        return;
      }

      if (loadedInvoice.status === "Paid") {
        alert("This invoice is already paid.");
        return;
      }

      const res = await api.post("/api/pos/cashout", {
        invoiceType,
        invoiceNumber: loadedInvoice.invoiceNumber,
        paymentMethod,
        amountTendered: Number(amountTendered || loadedInvoice.finalTotal || 0),
        paidIntoAccountName,
        paidIntoAccountNumber,
        notes,
      });

      setLoadedInvoice(res.data.data.invoice);
      setDrawer(res.data.data.drawer);
      setPaymentMethod("Cash");
      setAmountTendered("");
      setPaidIntoAccountName("");
      setPaidIntoAccountNumber("");
      setNotes("");

      await loadDrawerHistory();
      await loadTransactions();

      alert("Invoice cashed out successfully.");
    } catch (error) {
      alert(error?.response?.data?.message || "Could not cash out invoice.");
    }
  };

  const invoiceItems =
    invoiceType === "Marketplace"
      ? loadedInvoice?.items || []
      : loadedInvoice?.packages || [];

  return (
    <div>
      <h1>POS Checkout</h1>

      <div style={cardStyle}>
        <h2>Cash Drawer / Register</h2>

        {drawer ? (
          <>
            <p><strong>Drawer:</strong> {drawer.drawerNumber}</p>
            <p><strong>Cashier:</strong> {drawer.openedByName}</p>
            <p><strong>Opening Float:</strong> {money(drawer.openingFloat)}</p>
            <p><strong>Cash Sales:</strong> {money(drawer.totalCashSales)}</p>
            <p><strong>Card Sales:</strong> {money(drawer.totalCardSales)}</p>
            <p><strong>Transfer Sales:</strong> {money(drawer.totalTransferSales)}</p>
            <p><strong>Other Sales:</strong> {money(drawer.totalOtherSales)}</p>
            <p><strong>Total Sales:</strong> {money(drawer.totalSales)}</p>
            <p><strong>Expected Cash:</strong> {money(drawer.expectedCash)}</p>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <input
                type="number"
                placeholder="Closing Cash Count"
                value={closingCashCount}
                onChange={(e) => setClosingCashCount(e.target.value)}
                style={inputStyle}
              />
              <button
                onClick={closeDrawer}
                style={{ ...buttonStyle, backgroundColor: "#dc2626" }}
              >
                Close Drawer
              </button>
            </div>
          </>
        ) : (
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <input
              type="number"
              placeholder="Opening Cash Float"
              value={openingFloat}
              onChange={(e) => setOpeningFloat(e.target.value)}
              style={inputStyle}
            />
            <button
              onClick={openDrawer}
              style={{ ...buttonStyle, backgroundColor: "#16a34a" }}
            >
              Open Drawer
            </button>
          </div>
        )}
      </div>

      <div style={cardStyle}>
        <h2>Cash Out Invoice</h2>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder="Enter Shipping or Marketplace Invoice Number"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            style={inputStyle}
          />
          <button onClick={findInvoice} style={buttonStyle}>
            Find Invoice
          </button>
        </div>
      </div>

      {loadedInvoice && (
        <div style={cardStyle}>
          <h2>{invoiceType} Invoice</h2>

          <p><strong>Invoice Number:</strong> {loadedInvoice.invoiceNumber}</p>
          {invoiceType === "Marketplace" && (
            <p><strong>Order Number:</strong> {loadedInvoice.orderNumber}</p>
          )}
          <p><strong>Customer:</strong> {loadedInvoice.customerName}</p>
          <p><strong>Customer EKON ID:</strong> {loadedInvoice.customerEkonId || loadedInvoice.customerKey || ""}</p>
          <p><strong>Status:</strong> {loadedInvoice.status}</p>
          <p><strong>Subtotal:</strong> {money(loadedInvoice.subtotal)}</p>
          {invoiceType === "Shipping" && (
            <>
              <p><strong>Customs Duty:</strong> {money(loadedInvoice.customsDuty)}</p>
              <p><strong>GCT:</strong> {money(loadedInvoice.gct)}</p>
              <p><strong>Processing Fee:</strong> {money(loadedInvoice.processingFee)}</p>
              <p><strong>Delivery Fee:</strong> {money(loadedInvoice.deliveryFee)}</p>
              <p><strong>Points Redeemed:</strong> {money(loadedInvoice.pointsRedeemed)}</p>
            </>
          )}
          {invoiceType === "Marketplace" && (
            <>
              <p><strong>Delivery Fee:</strong> {money(loadedInvoice.deliveryFee)}</p>
              <p><strong>Discount:</strong> {money(loadedInvoice.discount)}</p>
            </>
          )}
          <h3>Final Total: {money(loadedInvoice.finalTotal)}</h3>

          {invoiceItems.length > 0 && (
            <table border="1" cellPadding="10" style={{ width: "100%", marginTop: "15px" }}>
              <thead>
                <tr>
                  {invoiceType === "Marketplace" ? (
                    <>
                      <th>Item Number</th>
                      <th>Title</th>
                      <th>Qty</th>
                      <th>Line Total</th>
                    </>
                  ) : (
                    <>
                      <th>Tracking Number</th>
                      <th>Weight</th>
                      <th>Rate</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {invoiceItems.map((item, index) => (
                  <tr key={item._id || index}>
                    {invoiceType === "Marketplace" ? (
                      <>
                        <td>{item.itemNumber}</td>
                        <td>{item.title}</td>
                        <td>{item.quantity}</td>
                        <td>{money(item.lineTotal)}</td>
                      </>
                    ) : (
                      <>
                        <td>{item.trackingNumber}</td>
                        <td>{item.chargeableWeight}</td>
                        <td>{money(item.rate)}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div style={{ marginTop: "20px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              style={inputStyle}
              disabled={loadedInvoice.status === "Paid"}
            >
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Other">Other</option>
            </select>

            <input
              type="number"
              placeholder="Amount Tendered"
              value={amountTendered}
              onChange={(e) => setAmountTendered(e.target.value)}
              style={inputStyle}
              disabled={loadedInvoice.status === "Paid"}
            />

            <input
              type="text"
              placeholder="Paid Into Account Name"
              value={paidIntoAccountName}
              onChange={(e) => setPaidIntoAccountName(e.target.value)}
              style={inputStyle}
              disabled={loadedInvoice.status === "Paid"}
            />

            <input
              type="text"
              placeholder="Paid Into Account Number"
              value={paidIntoAccountNumber}
              onChange={(e) => setPaidIntoAccountNumber(e.target.value)}
              style={inputStyle}
              disabled={loadedInvoice.status === "Paid"}
            />

            <input
              type="text"
              placeholder="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={inputStyle}
              disabled={loadedInvoice.status === "Paid"}
            />
          </div>

          {paymentMethod === "Cash" && loadedInvoice.status !== "Paid" && (
            <p style={{ marginTop: "12px", fontWeight: "bold" }}>
              Change Due:{" "}
              {money(
                Math.max(
                  Number(amountTendered || 0) -
                    Number(loadedInvoice.finalTotal || 0),
                  0
                )
              )}
            </p>
          )}

          <button
            onClick={cashOutInvoice}
            disabled={loadedInvoice.status === "Paid"}
            style={{
              ...buttonStyle,
              marginTop: "16px",
              backgroundColor:
                loadedInvoice.status === "Paid" ? "#999" : "#16a34a",
              cursor:
                loadedInvoice.status === "Paid" ? "not-allowed" : "pointer",
            }}
          >
            {loadedInvoice.status === "Paid" ? "Already Paid" : "Cash Out Invoice"}
          </button>
        </div>
      )}

      {transactions.length > 0 && (
        <div style={cardStyle}>
          <h2>Recent POS Transactions</h2>

          <table border="1" cellPadding="10" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th>Transaction</th>
                <th>Type</th>
                <th>Invoice</th>
                <th>Customer</th>
                <th>Method</th>
                <th>Amount</th>
                <th>Cashier</th>
              </tr>
            </thead>
            <tbody>
              {transactions.slice(0, 10).map((item) => (
                <tr key={item._id}>
                  <td>{item.transactionNumber}</td>
                  <td>{item.invoiceType}</td>
                  <td>{item.invoiceNumber}</td>
                  <td>{item.customerName}</td>
                  <td>{item.paymentMethod}</td>
                  <td>{money(item.amountPaid)}</td>
                  <td>{item.cashierName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {drawerHistory.length > 0 && (
        <div style={cardStyle}>
          <h2>Recent Drawer Sessions</h2>

          <table border="1" cellPadding="10" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th>Drawer</th>
                <th>Cashier</th>
                <th>Status</th>
                <th>Total Sales</th>
                <th>Expected Cash</th>
                <th>Closing Cash</th>
                <th>Variance</th>
              </tr>
            </thead>
            <tbody>
              {drawerHistory.slice(0, 5).map((item) => (
                <tr key={item._id}>
                  <td>{item.drawerNumber}</td>
                  <td>{item.openedByName}</td>
                  <td>{item.status}</td>
                  <td>{money(item.totalSales)}</td>
                  <td>{money(item.expectedCash)}</td>
                  <td>{money(item.closingCashCount)}</td>
                  <td>{money(item.cashVariance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default POS;