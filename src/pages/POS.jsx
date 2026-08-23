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
  const [analytics, setAnalytics] = useState(null);
const [handoverToCashier, setHandoverToCashier] = useState("");
const [handoverCashCount, setHandoverCashCount] = useState("");
const [actionReason, setActionReason] = useState("");
const [actionAmount, setActionAmount] = useState("");
const [accounts, setAccounts] = useState([]);
const [
  discountAmount,
  setDiscountAmount,
] = useState("");

const [
  discountReason,
  setDiscountReason,
] = useState("");

const [
  posBusy,
  setPosBusy,
] = useState(false);

const [
  isMobile,
  setIsMobile,
] = useState(
  () => window.innerWidth <= 900
);

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

  const loadAccounts = async () => {
  try {
    const res = await api.get("/api/financial-accounts");
    setAccounts(res.data.data || []);
  } catch (error) {
    console.error("Error loading financial accounts:", error);
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
    loadAccounts();
  }, []);

  useEffect(() => {
  const updateLayout = () => {
    setIsMobile(
      window.innerWidth <= 900
    );
  };

  window.addEventListener(
    "resize",
    updateLayout
  );

  return () =>
    window.removeEventListener(
      "resize",
      updateLayout
    );
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
      setAmountTendered("");
    } catch (error) {
      setLoadedInvoice(null);
      setInvoiceType("");
      alert(error?.response?.data?.message || "Invoice not found.");
    }
  };

  const loadAnalytics = async () => {
  try {
    const res = await api.get("/api/pos/analytics");
    setAnalytics(res.data.data || null);
  } catch (error) {
    alert(error?.response?.data?.message || "Could not load POS analytics.");
  }
};

const recordShiftHandover = async () => {
  try {
    if (!drawer) {
      alert("Open drawer required for shift handover.");
      return;
    }

    const res = await api.post("/api/pos/shift-handover", {
      toCashierName: handoverToCashier,
      countedCash: Number(handoverCashCount || 0),
      notes,
    });

    setHandoverToCashier("");
    setHandoverCashCount("");
    setNotes("");

    alert(
      `Shift handover saved. Variance: ${money(res.data.data.variance)}`
    );
  } catch (error) {
    alert(error?.response?.data?.message || "Could not record shift handover.");
  }
};

const logPOSAction = async (actionType) => {
  try {
    const res = await api.post("/api/pos/action-log", {
      actionType,
      invoiceNumber: loadedInvoice?.invoiceNumber || "",
      invoiceType,
      reason: actionReason,
      amount: Number(actionAmount || 0),
    });

    setActionReason("");
    setActionAmount("");

    alert(`${res.data.data.actionType} recorded successfully.`);
  } catch (error) {
    alert(error?.response?.data?.message || "Could not record POS action.");
  }
};

const applyDiscount = async () => {
  if (!loadedInvoice) {
    alert(
      "Load an invoice before applying a discount."
    );
    return;
  }

  if (
    loadedInvoice.status ===
      "Paid" ||
    loadedInvoice.status ===
      "Partially Paid"
  ) {
    alert(
      "Discounts must be applied before payment starts."
    );
    return;
  }

  const numericDiscount =
    Number(discountAmount || 0);

  if (numericDiscount <= 0) {
    alert(
      "Enter a discount amount greater than zero."
    );
    return;
  }

  if (
    !String(
      discountReason || ""
    ).trim()
  ) {
    alert(
      "Enter the reason for the discount."
    );
    return;
  }

  try {
    setPosBusy(true);

    const response =
      await api.post(
        "/api/pos/discount",
        {
          invoiceType,

          invoiceNumber:
            loadedInvoice.invoiceNumber,

          discountAmount:
            numericDiscount,

          reason:
            discountReason.trim(),
        }
      );

    setLoadedInvoice(
      response.data.data.invoice
    );

    setDiscountAmount("");
    setDiscountReason("");

    alert(
      response.data.message ||
        "Discount applied successfully."
    );
  } catch (error) {
    alert(
      error?.response?.data
        ?.message ||
        "The discount could not be applied."
    );
  } finally {
    setPosBusy(false);
  }
};

const handleQuickAction = (
  action
) => {
  if (action === "DISCOUNT") {
    document
      .getElementById(
        "pos-discount-panel"
      )
      ?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

    return;
  }

  alert(
    `${action} is unavailable for posted invoices. Use the controlled manager action where applicable.`
  );
};

const printReceipt = () => {
  if (!loadedInvoice) {
    alert("Load an invoice first.");
    return;
  }

  window.print();
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

      if (!paidIntoAccountNumber) {
  alert("Please select the account that received this payment.");
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
    <div
      style={{
        background: "#eef1f5",
        minHeight: "100vh",
        padding:
          isMobile
            ? "10px"
            : "20px",
        boxSizing: "border-box",
        overflowX: "hidden",
      }}
    >
        <h1
      style={{
        fontSize:
          isMobile
            ? "28px"
            : "42px",
        lineHeight: 1.15,
        fontWeight: "bold",
        marginTop: 0,
        marginBottom:
          isMobile
            ? "14px"
            : "20px",
        color: "#0f172a",
      }}
    >
      POS - Cash Register
    </h1>

    <div
      style={{
        display: "grid",
        gridTemplateColumns:
  isMobile ? "1fr" : "2fr 1fr",
        gap: "20px",
      }}
    >
      {/* LEFT SIDE */}
      <div>
        {/* SEARCH BAR */}
        <div
          style={{
            background: "white",
            padding: "18px",
            borderRadius: "12px",
            marginBottom: "18px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
  isMobile
    ? "1fr"
    : "1fr 150px 140px",
              gap: "12px",
            }}
          >
            <input
              type="text"
              placeholder="Scan Barcode / Enter Invoice Number"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              onKeyDown={(e) => {
  if (e.key === "Enter") {
    findInvoice();
  }
}}
              style={{
                padding: "16px",
                fontSize: "18px",
                borderRadius: "10px",
                border: "2px solid #cbd5e1",
              }}
            />

            <input
              type="number"
              value="1"
              readOnly
              style={{
                padding: "16px",
                fontSize: "18px",
                borderRadius: "10px",
                border: "2px solid #cbd5e1",
                textAlign: "center",
                background: "#fff7ed",
                fontWeight: "bold",
              }}
            />

            <button
              onClick={findInvoice}
              style={{
                background: "#0B3D91",
                color: "white",
                border: "none",
                borderRadius: "10px",
                fontSize: "18px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              FIND
            </button>
          </div>
        </div>

                {/* INVOICE ITEMS */}
        <div
          style={{
            background: "white",
            borderRadius: "12px",
            overflow: "hidden",
            boxShadow:
              "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <div
            style={{
              width: "100%",
              overflowX: "auto",
              WebkitOverflowScrolling:
                "touch",
            }}
          >
            <table
              border="1"
              cellPadding="14"
              style={{
                width: "100%",
                minWidth: "620px",
                borderCollapse:
                  "collapse",
                fontSize:
                  isMobile
                    ? "14px"
                    : "17px",
              }}
            >
              <thead
                style={{
                  background: "#f8fafc",
                }}
              >
                <tr>
                  <th>#</th>
                  <th>Item Info</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>

              <tbody>
                {invoiceItems.length ===
                0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      style={{
                        padding: "28px",
                        textAlign: "center",
                        color: "#64748b",
                      }}
                    >
                      Load an invoice to
                      view its items.
                    </td>
                  </tr>
                ) : (
                  invoiceItems.map(
                    (item, index) => (
                      <tr key={index}>
                        <td>
                          {index + 1}
                        </td>

                        <td>
                          {invoiceType ===
                          "Marketplace"
                            ? item.title
                            : item.trackingNumber}
                        </td>

                        <td>
                          {invoiceType ===
                          "Marketplace"
                            ? item.quantity
                            : 1}
                        </td>

                        <td>
                          {money(
                            invoiceType ===
                              "Marketplace"
                              ? item.sellingPrice
                              : item.rate
                          )}
                        </td>

                        <td>
                          {money(
                            invoiceType ===
                              "Marketplace"
                              ? item.lineTotal
                              : item.rate
                          )}
                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* BOTTOM BUTTONS */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
  isMobile
    ? "repeat(2, 1fr)"
    : "repeat(6, 1fr)",
            gap: "12px",
            marginTop: "18px",
          }}
        >
          {[
            "DELETE",
            "DISCOUNT",
            "-",
            "+",
            "QTY CHANGE",
            "PRICE CHANGE",
          ].map((btn) => (
                        <button
              type="button"
              key={btn}
              onClick={() =>
                handleQuickAction(btn)
              }
              style={{
                height:
  isMobile ? "58px" : "80px",
                borderRadius: "10px",
                border: "none",
                background:
                  "linear-gradient(to bottom, #f8fafc, #bfdbfe)",
                fontWeight: "bold",
                fontSize: "18px",
                cursor: "pointer",
              }}
            >
              {btn}
            </button>
          ))}
        </div>
        <div
  id="pos-discount-panel"
  style={{
    ...cardStyle,
    marginTop: "18px",
    marginBottom: 0,
  }}
>
  <h2
    style={{
      color: "#0B3D91",
      marginTop: 0,
    }}
  >
    Apply Customer Discount
  </h2>

  <div
    style={{
      color: "#64748b",
      marginBottom: "12px",
    }}
  >
    Discounts require the
    POS Discount permission and
    must be applied before payment.
  </div>

  <div
    style={{
      display: "grid",
      gridTemplateColumns:
        isMobile
          ? "1fr"
          : "minmax(160px, 0.6fr) 1fr",
      gap: "10px",
    }}
  >
    <input
      type="number"
      min="0"
      step="0.01"
      value={discountAmount}
      onChange={(event) =>
        setDiscountAmount(
          event.target.value
        )
      }
      placeholder="Discount amount"
      disabled={
        !loadedInvoice ||
        posBusy
      }
      style={{
        ...inputStyle,
        minWidth: 0,
        width: "100%",
        boxSizing: "border-box",
      }}
    />

    <input
      type="text"
      value={discountReason}
      onChange={(event) =>
        setDiscountReason(
          event.target.value
        )
      }
      placeholder="Reason for discount"
      disabled={
        !loadedInvoice ||
        posBusy
      }
      style={{
        ...inputStyle,
        minWidth: 0,
        width: "100%",
        boxSizing: "border-box",
      }}
    />
  </div>

  <button
    type="button"
    onClick={applyDiscount}
    disabled={
      !loadedInvoice ||
      posBusy
    }
    style={{
      ...buttonStyle,
      width: isMobile
        ? "100%"
        : "auto",
      marginTop: "12px",
      opacity:
        !loadedInvoice ||
        posBusy
          ? 0.6
          : 1,
    }}
  >
    {posBusy
      ? "Applying..."
      : "Apply Discount"}
  </button>
</div>
      </div>

      {/* RIGHT SIDE */}
      <div>
                {/* TOTALS */}
        <div
          style={{
            background: "#020617",
            color: "#39ff14",
            borderRadius: "12px",
            padding:
              isMobile
                ? "14px"
                : "20px",
            marginBottom: "16px",
          }}
        >
          <div
            style={{
              fontSize:
                isMobile
                  ? "18px"
                  : "24px",
              marginBottom: "10px",
            }}
          >
            Sub Total:{" "}
            {money(
              loadedInvoice?.subtotal ||
                0
            )}
          </div>

          <div
            style={{
              fontSize:
                isMobile
                  ? "18px"
                  : "24px",
              marginBottom: "10px",
            }}
          >
            Tax:{" "}
            {money(
              loadedInvoice?.gct || 0
            )}
          </div>

          {Number(
            loadedInvoice
              ?.pointsRedeemed || 0
          ) > 0 && (
            <div
              style={{
                fontSize:
                  isMobile
                    ? "18px"
                    : "22px",
                marginBottom: "10px",
                color: "#facc15",
              }}
            >
              EK Points Redeemed: -
              {money(
                loadedInvoice
                  .pointsRedeemed
              )}
            </div>
          )}

          {Number(
            loadedInvoice
              ?.posDiscountAmount ||
              0
          ) > 0 && (
            <div
              style={{
                fontSize:
                  isMobile
                    ? "18px"
                    : "22px",
                marginBottom: "10px",
                color: "#facc15",
              }}
            >
              POS Discount: -
              {money(
                loadedInvoice
                  .posDiscountAmount
              )}
            </div>
          )}

          <div
            style={{
              borderTop:
                "1px solid #334155",
              paddingTop: "12px",
              fontSize:
                isMobile
                  ? "30px"
                  : "46px",
              lineHeight: 1.15,
              fontWeight: "bold",
              overflowWrap: "anywhere",
            }}
          >
            Amount Due:{" "}
            {money(
              loadedInvoice
                ?.balanceDue ??
                loadedInvoice
                  ?.finalTotal ??
                0
            )}
          </div>
        </div>

                {/* PAY BUTTON */}
        <button
          type="button"
          onClick={cashOutInvoice}
          disabled={
            posBusy ||
            !loadedInvoice ||
            loadedInvoice.status ===
              "Paid"
          }
          style={{
            width: "100%",
            minHeight:
              isMobile
                ? "72px"
                : "96px",
            background:
              !loadedInvoice ||
              loadedInvoice.status ===
                "Paid"
                ? "#9ca3af"
                : "linear-gradient(to right, #bbf7d0, #22c55e)",
            color: "#052e16",
            border: "none",
            borderRadius: "12px",
            fontSize:
              isMobile
                ? "30px"
                : "42px",
            fontWeight: "bold",
            cursor:
              !loadedInvoice ||
              loadedInvoice.status ===
                "Paid"
                ? "not-allowed"
                : "pointer",
            opacity:
              posBusy ? 0.65 : 1,
            marginBottom: "18px",
            touchAction: "manipulation",
          }}
        >
          {loadedInvoice?.status ===
          "Paid"
            ? "PAID"
            : "PAY"}
        </button>

{/* AMOUNT TENDERED / NUMBER PAD */}
<div
  style={{
    background: "white",
    padding: "14px",
    borderRadius: "12px",
    marginBottom: "16px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  }}
>
  <label style={{ display: "block", fontWeight: "bold", marginBottom: "8px" }}>
    Amount Tendered
  </label>

  <input
    type="number"
    value={amountTendered}
    onChange={(e) => setAmountTendered(e.target.value)}
    disabled={!loadedInvoice || loadedInvoice.status === "Paid"}
    placeholder="Enter amount received"
    style={{
      width: "100%",
      padding: "14px",
      borderRadius: "10px",
      border: "1px solid #cbd5e1",
      fontSize: "22px",
      fontWeight: "bold",
      marginBottom: "10px",
    }}
  />

  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
    {["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "00", "Clear"].map((key) => (
      <button
        key={key}
        onClick={() => {
          if (key === "Clear") {
            setAmountTendered("");
          } else {
            setAmountTendered((prev) => `${prev || ""}${key}`);
          }
        }}
        disabled={!loadedInvoice || loadedInvoice.status === "Paid"}
        style={{
          padding: "18px",
          borderRadius: "10px",
          border: "none",
          background: "#dbeafe",
          fontSize: "22px",
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        {key}
      </button>
    ))}
  </div>

  {loadedInvoice && (
    <div style={{ marginTop: "12px", fontWeight: "bold" }}>
      <div>Invoice Balance: {money(loadedInvoice.balanceDue || loadedInvoice.finalTotal)}</div>
      <div>Tendered: {money(amountTendered)}</div>
      <div style={{ color: "#15803d" }}>
        Change:{" "}
        {money(
          Math.max(
            Number(amountTendered || 0) -
              Number(loadedInvoice.balanceDue || loadedInvoice.finalTotal || 0),
            0
          )
        )}
      </div>
    </div>
  )}
</div>

        {/* RECEIVE PAYMENT ACCOUNT */}
<div
  style={{
    background: "white",
    padding: "14px",
    borderRadius: "12px",
    marginBottom: "16px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  }}
>
  <label
    style={{
      display: "block",
      fontWeight: "bold",
      marginBottom: "8px",
      color: "#0f172a",
    }}
  >
    Receive Payment Into Account
  </label>

  <select
    value={paidIntoAccountNumber}
    onChange={(e) => {
      const selected = accounts.find(
        (account) => account.accountNumber === e.target.value
      );

      setPaidIntoAccountNumber(selected?.accountNumber || "");
      setPaidIntoAccountName(selected?.accountName || "");
    }}
    disabled={!loadedInvoice || loadedInvoice.status === "Paid"}
    style={{
      width: "100%",
      padding: "12px",
      borderRadius: "10px",
      border: "1px solid #cbd5e1",
      fontWeight: "bold",
      backgroundColor: "white",
    }}
  >
    <option value="">Select Receiving Account</option>
    {accounts
      .filter((account) => account.status === "Active")
      .map((account) => (
        <option key={account._id} value={account.accountNumber}>
          {account.accountName} - {account.accountType} ({account.accountNumber})
        </option>
      ))}
  </select>

  {paidIntoAccountName && (
    <div
      style={{
        marginTop: "8px",
        color: "#15803d",
        fontWeight: "bold",
      }}
    >
      Selected: {paidIntoAccountName}
    </div>
  )}
</div>

        {/* PAYMENT BUTTONS */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
          }}
        >
          {["Cash", "Card", "Bank Transfer", "Other"].map((method) => (
            <button
              key={method}
              onClick={() => setPaymentMethod(method)}
              style={{
                height:
  isMobile ? "58px" : "80px",
                border: "none",
                borderRadius: "10px",
                background:
                  paymentMethod === method
                    ? "#22c55e"
                    : "linear-gradient(to bottom, #dcfce7, #86efac)",
                fontWeight: "bold",
                fontSize: "22px",
                cursor: "pointer",
              }}
            >
              {method}
            </button>
          ))}
        </div>

        {/* CUSTOMER INFO */}
        {loadedInvoice && (
          <div
            style={{
              background: "white",
              padding: "18px",
              borderRadius: "12px",
              marginTop: "20px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}
          >
            <h2>Customer Info</h2>

            <p>
              <strong>Name:</strong>{" "}
              {loadedInvoice.customerName}
            </p>

            <p>
              <strong>Invoice:</strong>{" "}
              {loadedInvoice.invoiceNumber}
            </p>

            <p>
              <strong>Type:</strong> {invoiceType}
            </p>

            <p>
              <strong>Status:</strong>{" "}
              {loadedInvoice.status}
            </p>

            <p>
              <strong>Cashier:</strong>{" "}
              {drawer?.openedByName || "N/A"}
            </p>
          </div>
        )}

        {/* ADVANCED POS CONTROLS */}
<div
  style={{
    background: "white",
    padding: "18px",
    borderRadius: "12px",
    marginTop: "20px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  }}
>
  <h2>POS Controls</h2>

  <button onClick={printReceipt} style={buttonStyle}>
    Print Receipt
  </button>

  <button
    onClick={loadAnalytics}
    style={{ ...buttonStyle, marginLeft: "8px", background: "#7c3aed" }}
  >
    Load Analytics
  </button>

  {analytics && (
    <div style={{ marginTop: "12px" }}>
      <p><strong>Branch:</strong> {analytics.branch}</p>
      <p><strong>Total Sales:</strong> {money(analytics.totalSales)}</p>
      <p><strong>Transactions:</strong> {analytics.transactionCount}</p>
      <p><strong>Drawers:</strong> {analytics.drawerCount}</p>
    </div>
  )}

  <hr style={{ margin: "16px 0" }} />

  <h3>Shift Handover</h3>

  <input
    type="text"
    placeholder="Next Cashier Name"
    value={handoverToCashier}
    onChange={(e) => setHandoverToCashier(e.target.value)}
    style={{ ...inputStyle, width: "100%", marginBottom: "8px" }}
  />

  <input
    type="number"
    placeholder="Counted Cash"
    value={handoverCashCount}
    onChange={(e) => setHandoverCashCount(e.target.value)}
    style={{ ...inputStyle, width: "100%", marginBottom: "8px" }}
  />

  <button
    onClick={recordShiftHandover}
    style={{ ...buttonStyle, background: "#f59e0b" }}
  >
    Save Handover
  </button>

  <hr style={{ margin: "16px 0" }} />

  <h3>Manager Actions</h3>

  <input
    type="text"
    placeholder="Reason"
    value={actionReason}
    onChange={(e) => setActionReason(e.target.value)}
    style={{ ...inputStyle, width: "100%", marginBottom: "8px" }}
  />

  <input
    type="number"
    placeholder="Amount"
    value={actionAmount}
    onChange={(e) => setActionAmount(e.target.value)}
    style={{ ...inputStyle, width: "100%", marginBottom: "8px" }}
  />

  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
    <button onClick={() => logPOSAction("Manager Override")} style={buttonStyle}>
      Override
    </button>

        <button
      type="button"
      onClick={() =>
        handleQuickAction(
          "DISCOUNT"
        )
      }
      disabled={!loadedInvoice}
      style={{
        ...buttonStyle,
        opacity:
          loadedInvoice
            ? 1
            : 0.6,
        cursor:
          loadedInvoice
            ? "pointer"
            : "not-allowed",
      }}
    >
      Discount
    </button>

    <button
      onClick={() => logPOSAction("Void")}
      style={{ ...buttonStyle, background: "#dc2626" }}
    >
      Void
    </button>

    <button
      onClick={() => logPOSAction("Refund")}
      style={{ ...buttonStyle, background: "#ea580c" }}
    >
      Refund
    </button>
  </div>
</div>

      {/* DRAWER INFO */}
<div
  style={{
    background: "white",
    padding: "18px",
    borderRadius: "12px",
    marginTop: "20px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  }}
>
  <h2>Drawer Session</h2>

  {drawer ? (
    <>
      <p>
        <strong>Drawer:</strong> {drawer.drawerNumber}
      </p>

      <p>
        <strong>Cashier:</strong> {drawer.openedByName}
      </p>

      <p>
  <strong>Branch:</strong> {drawer.branch || "Eltham Park"}
</p>

      <p>
        <strong>Opening Float:</strong>{" "}
        {money(drawer.openingFloat)}
      </p>

      <p>
        <strong>Total Sales:</strong>{" "}
        {money(drawer.totalSales)}
      </p>

      <p>
        <strong>Expected Cash:</strong>{" "}
        {money(drawer.expectedCash)}
      </p>

            <div
        style={{
          display: "flex",
          flexDirection:
            isMobile
              ? "column"
              : "row",
          gap: "10px",
          marginTop: "12px",
        }}
      >
        <input
          type="number"
          placeholder="Closing Cash"
          value={closingCashCount}
          onChange={(e) =>
            setClosingCashCount(e.target.value)
          }
          style={{
            flex: 1,
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid #cbd5e1",
          }}
        />

        <button
          onClick={closeDrawer}
          style={{
            background: "#dc2626",
            color: "white",
            border: "none",
            padding: "12px 16px",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          CLOSE
        </button>
      </div>
    </>
  ) : (
    <>
      <input
        type="number"
        placeholder="Opening Float"
        value={openingFloat}
        onChange={(e) =>
          setOpeningFloat(e.target.value)
        }
        style={{
          width: "100%",
          padding: "12px",
          borderRadius: "8px",
          border: "1px solid #cbd5e1",
          marginBottom: "12px",
        }}
      />

      <button
        onClick={openDrawer}
        style={{
          width: "100%",
          background: "#16a34a",
          color: "white",
          border: "none",
          padding: "14px",
          borderRadius: "8px",
          cursor: "pointer",
          fontWeight: "bold",
          fontSize: "18px",
        }}
      >
        OPEN DRAWER
      </button>
    </>
  )}
        </div>
      </div>
    </div>
  </div>
);
}

export default POS;