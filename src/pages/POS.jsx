import { useState } from "react";
import api from "../api";

function POS() {
  const [ekonId, setEkonId] = useState("");
  const [customer, setCustomer] = useState(null);
  const [packages, setPackages] = useState([]);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [invoice, setInvoice] = useState(null);
  const [rateMap, setRateMap] = useState({});
  const [accounts, setAccounts] = useState([]);
  const [receivingAccountNumber, setReceivingAccountNumber] = useState("");
  const [drawer, setDrawer] = useState(null);
  const [drawerHistory, setDrawerHistory] = useState([]);
  const [openingFloat, setOpeningFloat] = useState("");
  const [closingCashCount, setClosingCashCount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");

  const loadRates = async () => {
    try {
      const res = await api.get("/api/shipping-rates");
      const rates = res.data.data || [];
      const mapped = {};

      rates.forEach((rate) => {
        mapped[Number(rate.weight)] = Number(rate.price);
      });

      setRateMap(mapped);
      return mapped;
    } catch (error) {
      console.error("Error loading rates:", error);
      return {};
    }
  };

  const loadAccounts = async () => {
    try {
      const res = await api.get("/api/financial-accounts");
      setAccounts(res.data.data || []);
    } catch (error) {
      console.error("Error loading accounts:", error);
    }
  };

    const loadDrawer = async () => {
    try {
      const res = await api.get("/api/pos/drawer/open");
      setDrawer(res.data.data || null);
    } catch (error) {
      console.error("Error loading POS drawer:", error);
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

  const openDrawer = async () => {
    try {
      if (!openingFloat && Number(openingFloat) !== 0) {
        alert("Enter opening cash float.");
        return;
      }

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
      if (!drawer) {
        alert("No open cash drawer.");
        return;
      }

      if (closingCashCount === "") {
        alert("Enter closing cash count.");
        return;
      }

      const res = await api.put("/api/pos/drawer/close", {
        closingCashCount: Number(closingCashCount || 0),
      });

      setDrawer(null);
      setClosingCashCount("");
      await loadDrawerHistory();

      alert(
        `Drawer closed. Cash variance: JMD ${Number(
          res.data.data.cashVariance || 0
        ).toLocaleString()}`
      );
    } catch (error) {
      alert(error?.response?.data?.message || "Could not close cash drawer.");
    }
  };

  const recordDrawerSale = async (amount) => {
    try {
      await api.post("/api/pos/drawer/sale", {
        paymentMethod,
        amount: Number(amount || 0),
      });

      await loadDrawer();
      await loadDrawerHistory();
    } catch (error) {
      throw error;
    }
  };

  const getChargeByWeight = (weight, activeRateMap = rateMap) => {
    const roundedWeight = Math.ceil(Number(weight || 0));
    return activeRateMap[roundedWeight] || 0;
  };

  const formatDate = (value) => {
    if (!value) return "";
    try {
      return String(value).slice(0, 10);
    } catch {
      return value;
    }
  };

  const loadCustomerPackages = async () => {
    try {
      const [customersRes, packagesRes, invoicesRes] = await Promise.all([
        api.get("/api/customers"),
        api.get("/api/packages"),
        api.get("/api/invoices"),
      ]);

      const freshRateMap = await loadRates();
      await loadAccounts();
      await loadDrawer();
      await loadDrawerHistory();

      const foundCustomer = (customersRes.data.data || []).find(
        (c) => c.ekonId === ekonId
      );

      if (!foundCustomer) {
        alert("Customer not found.");
        setCustomer(null);
        setPackages([]);
        setInvoice(null);
        setReceivingAccountNumber("");
        return;
      }

      const allPackages = packagesRes.data.data || [];
      const allInvoices = invoicesRes.data.data || [];

      const readyPackages = allPackages.filter(
  (pkg) =>
    pkg.customerEkonId === ekonId &&
    pkg.status === "Ready for Pickup" &&
    pkg.readyForPickup === true &&
    pkg.invoiceStatus !== "Paid"
);

      const existingUnpaidInvoice = allInvoices
        .filter(
          (inv) =>
            inv.customerEkonId === ekonId &&
            inv.status === "Unpaid"
        )
        .sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
        )[0] || null;

      setCustomer(foundCustomer);
      setPackages(readyPackages);
      setInvoice(existingUnpaidInvoice);
      setReceivingAccountNumber("");

      if (existingUnpaidInvoice) {
        alert(
          `Existing unpaid invoice loaded. Final total: JMD ${Number(
            existingUnpaidInvoice.finalTotal || 0
          ).toLocaleString()}`
        );
        return;
      }

      if (readyPackages.length === 0) {
        alert("No ready packages found for this customer.");
      } else {
        const totalEstimate = readyPackages.reduce(
          (sum, pkg) => sum + getChargeByWeight(pkg.weight, freshRateMap),
          0
        );

        alert(
          `Ready packages loaded. Estimated total: JMD ${totalEstimate.toLocaleString()}`
        );
      }
    } catch (error) {
      console.error("Error loading POS data:", error);
      alert(
        error?.response?.data?.message || "Could not load customer packages."
      );
    }
  };

  const createPosInvoice = async () => {
    try {
      if (invoice && invoice.status === "Unpaid") {
        alert("This customer already has an unpaid invoice loaded.");
        return;
      }

      if (checkoutPackages.length === 0) {
  alert("No unpaid ready packages available for checkout.");
  return;
}

      const res = await api.post("/api/invoices", {
        customerEkonId: ekonId,
        pointsToRedeem: Number(pointsToRedeem) || 0,
      });

      setInvoice(res.data.data);
      alert("POS invoice generated successfully.");
    } catch (error) {
      console.error("Error creating POS invoice:", error);
      alert(error?.response?.data?.message || "Could not create invoice.");
    }
  };

  const markInvoicePaid = async () => {
    if (!invoice) {
      alert("No invoice available.");
      return;
    }

    if (!receivingAccountNumber) {
      alert("Please select the account that received this payment.");
      return;
    }

    try {
            await recordDrawerSale(invoice.finalTotal);

      const res = await api.put(
        `/api/invoices/pay/${invoice.invoiceNumber}`,
        { receivingAccountNumber }
      );

      setInvoice(null);
setPackages([]);
setReceivingAccountNumber("");
alert("Invoice marked as paid, account updated, and packages cleared from POS.");

await loadCustomerPackages();

    } catch (error) {
      console.error("Error marking invoice paid:", error);
      alert(error?.response?.data?.message || "Could not mark invoice as paid.");
    }
  };

  const checkoutPackages = packages.filter(
  (pkg) =>
    pkg.status === "Ready for Pickup" &&
    pkg.readyForPickup === true &&
    pkg.invoiceStatus !== "Paid"
);

const estimatedTotal = checkoutPackages.reduce(
  (sum, pkg) => sum + getChargeByWeight(pkg.weight),
  0
);

  const cardStyle = {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "10px",
    border: "1px solid #e5e7eb",
    marginBottom: "20px",
  };

  return (
    <div>
      <h1>POS Checkout</h1>

            <div style={cardStyle}>
        <h2>Cash Drawer / Register</h2>

        {drawer ? (
          <>
            <p><strong>Drawer:</strong> {drawer.drawerNumber}</p>
            <p><strong>Cashier:</strong> {drawer.openedByName}</p>
            <p><strong>Opening Float:</strong> JMD {Number(drawer.openingFloat || 0).toLocaleString()}</p>
            <p><strong>Cash Sales:</strong> JMD {Number(drawer.totalCashSales || 0).toLocaleString()}</p>
            <p><strong>Card Sales:</strong> JMD {Number(drawer.totalCardSales || 0).toLocaleString()}</p>
            <p><strong>Transfer Sales:</strong> JMD {Number(drawer.totalTransferSales || 0).toLocaleString()}</p>
            <p><strong>Total Sales:</strong> JMD {Number(drawer.totalSales || 0).toLocaleString()}</p>
            <p><strong>Expected Cash:</strong> JMD {Number(drawer.expectedCash || 0).toLocaleString()}</p>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "12px" }}>
              <input
                type="number"
                placeholder="Closing Cash Count"
                value={closingCashCount}
                onChange={(e) => setClosingCashCount(e.target.value)}
                style={{
                  padding: "10px",
                  minWidth: "220px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                }}
              />

              <button
                onClick={closeDrawer}
                style={{
                  backgroundColor: "#dc2626",
                  color: "white",
                  border: "none",
                  padding: "10px 16px",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
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
              style={{
                padding: "10px",
                minWidth: "220px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
              }}
            />

            <button
              onClick={openDrawer}
              style={{
                backgroundColor: "#16a34a",
                color: "white",
                border: "none",
                padding: "10px 16px",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Open Drawer
            </button>
          </div>
        )}

        {drawerHistory.length > 0 && (
          <div style={{ marginTop: "18px" }}>
            <h3>Recent Drawer Sessions</h3>
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
                    <td>JMD {Number(item.totalSales || 0).toLocaleString()}</td>
                    <td>JMD {Number(item.expectedCash || 0).toLocaleString()}</td>
                    <td>JMD {Number(item.closingCashCount || 0).toLocaleString()}</td>
                    <td
                      style={{
                        color: Number(item.cashVariance || 0) === 0 ? "#16a34a" : "#dc2626",
                        fontWeight: "bold",
                      }}
                    >
                      JMD {Number(item.cashVariance || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={cardStyle}>
        <h2>Find Customer</h2>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder="Enter EKON ID"
            value={ekonId}
            onChange={(e) => setEkonId(e.target.value)}
            style={{
              padding: "10px",
              minWidth: "240px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
            }}
          />

          <button
            onClick={loadCustomerPackages}
            style={{
              backgroundColor: "#0B3D91",
              color: "white",
              border: "none",
              padding: "10px 16px",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Load Customer
          </button>
        </div>
      </div>

      {customer && (
        <div style={cardStyle}>
          <h2>Customer Details</h2>
          <p><strong>EKON ID:</strong> {customer.ekonId}</p>
          <p><strong>Name:</strong> {customer.name}</p>
          <p><strong>Branch:</strong> {customer.branch}</p>
          <p><strong>Points Balance:</strong> {customer.pointsBalance || 0}</p>
          <p><strong>Address:</strong> {customer.address || ""}</p>
        </div>
      )}

      {invoice ? (
        <div style={cardStyle}>
          <h2>Existing / Current Checkout Invoice</h2>

          <p><strong>Invoice Number:</strong> {invoice.invoiceNumber}</p>
          <p><strong>Customer:</strong> {invoice.customerName}</p>
          <p><strong>Package Count:</strong> {invoice.packageCount}</p>
          <p><strong>Subtotal:</strong> JMD {Number(invoice.subtotal || 0).toLocaleString()}</p>
          <p><strong>Points Redeemed:</strong> {Number(invoice.pointsRedeemed || 0).toLocaleString()}</p>
          <p><strong>Final Total:</strong> JMD {Number(invoice.finalTotal || 0).toLocaleString()}</p>
          <p><strong>Status:</strong> {invoice.status}</p>
          <p><strong>Created Date:</strong> {formatDate(invoice.createdAt)}</p>
          <p><strong>Paid Date:</strong> {invoice.paidDate ? formatDate(invoice.paidDate) : "Not paid yet"}</p>

          {(invoice.packages || []).length > 0 && (
            <>
              <h3 style={{ marginTop: "20px" }}>Invoice Packages</h3>
              <table border="1" cellPadding="10" style={{ width: "100%", marginBottom: "20px" }}>
                <thead>
                  <tr>
                    <th>Tracking Number</th>
                    <th>Chargeable Weight</th>
                    <th>Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.packages.map((pkg, index) => (
                    <tr key={pkg.trackingNumber || index}>
                      <td>{pkg.trackingNumber}</td>
                      <td>{pkg.chargeableWeight}</td>
                      <td>JMD {Number(pkg.rate || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          <div style={{ marginTop: "16px", marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>
              Receive Payment Into Account
            </label>
            <select
              value={receivingAccountNumber}
              onChange={(e) => setReceivingAccountNumber(e.target.value)}
              style={{
                padding: "10px",
                minWidth: "260px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
              }}
              disabled={invoice.status === "Paid"}
            >
              <option value="">Select Account</option>
              {accounts.map((account) => (
                <option key={account._id} value={account.accountNumber}>
                  {account.accountName} ({account.accountType})
                </option>
              ))}
            </select>

                        <div style={{ marginTop: "12px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                style={{
                  padding: "10px",
                  minWidth: "260px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                }}
              >
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
          </div>

          <button
            onClick={markInvoicePaid}
            disabled={invoice.status === "Paid"}
            style={{
              marginTop: "10px",
              backgroundColor: invoice.status === "Paid" ? "#999" : "#0B3D91",
              color: "white",
              border: "none",
              padding: "10px 16px",
              borderRadius: "6px",
              cursor: invoice.status === "Paid" ? "not-allowed" : "pointer",
            }}
          >
            Mark Invoice Paid
          </button>
        </div>
      ) : checkoutPackages.length > 0 ? (
        <div style={cardStyle}>
          <h2>Ready Packages</h2>

          <table border="1" cellPadding="10" style={{ width: "100%", marginBottom: "20px" }}>
            <thead>
              <tr>
                <th>Tracking Number</th>
                <th>Courier</th>
                <th>Weight</th>
                <th>Status</th>
                <th>Invoice Status</th>
                <th>Date Received</th>
                <th>Charge</th>
              </tr>
            </thead>
            <tbody>
              {checkoutPackages.map((pkg) => (
                <tr key={pkg._id}>
                  <td>{pkg.trackingNumber}</td>
                  <td>{pkg.courier}</td>
                  <td>{pkg.weight}</td>
                  <td>{pkg.status}</td>
                  <td>{pkg.invoiceStatus}</td>
                  <td>{formatDate(pkg.dateReceived)}</td>
                  <td>JMD {getChargeByWeight(pkg.weight).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div
            style={{
              marginBottom: "20px",
              padding: "14px",
              borderRadius: "8px",
              backgroundColor: "#eff6ff",
              border: "1px solid #bfdbfe",
              fontWeight: "bold",
            }}
          >
            Estimated Checkout Total: JMD {estimatedTotal.toLocaleString()}
          </div>

          <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
            <input
              type="number"
              placeholder="Points to Redeem"
              value={pointsToRedeem}
              onChange={(e) => setPointsToRedeem(e.target.value)}
              style={{
                padding: "10px",
                minWidth: "220px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
              }}
            />

            <button
              onClick={createPosInvoice}
              style={{
                backgroundColor: "#16a34a",
                color: "white",
                border: "none",
                padding: "10px 16px",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Generate Checkout Invoice
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default POS;