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
  <div
    style={{
      background: "#eef1f5",
      minHeight: "100vh",
      padding: "20px",
    }}
  >
    <h1
      style={{
        fontSize: "42px",
        fontWeight: "bold",
        marginBottom: "20px",
        color: "#0f172a",
      }}
    >
      POS - Cash Register
    </h1>

    <div
      style={{
        display: "grid",
        gridTemplateColumns: "2fr 1fr",
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
              gridTemplateColumns: "1fr 150px 140px",
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
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <table
            border="1"
            cellPadding="14"
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "17px",
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
              {invoiceItems.map((item, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>

                  <td>
                    {invoiceType === "Marketplace"
                      ? item.title
                      : item.trackingNumber}
                  </td>

                  <td>
                    {invoiceType === "Marketplace"
                      ? item.quantity
                      : 1}
                  </td>

                  <td>
                    {money(
                      invoiceType === "Marketplace"
                        ? item.sellingPrice
                        : item.rate
                    )}
                  </td>

                  <td>
                    {money(
                      invoiceType === "Marketplace"
                        ? item.lineTotal
                        : item.rate
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div
            style={{
              height: "300px",
              background: "white",
            }}
          />
        </div>

        {/* BOTTOM BUTTONS */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, 1fr)",
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
              key={btn}
              style={{
                height: "95px",
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
      </div>

      {/* RIGHT SIDE */}
      <div>
        {/* TOTALS */}
        <div
          style={{
            background: "black",
            color: "#39ff14",
            borderRadius: "12px",
            padding: "20px",
            marginBottom: "16px",
          }}
        >
          <div
            style={{
              fontSize: "28px",
              marginBottom: "12px",
            }}
          >
            Sub Total: {money(loadedInvoice?.subtotal || 0)}
          </div>

          <div
            style={{
              fontSize: "28px",
              marginBottom: "12px",
            }}
          >
            Tax: {money(loadedInvoice?.gct || 0)}
          </div>

          <div
            style={{
              fontSize: "54px",
              fontWeight: "bold",
            }}
          >
            {money(loadedInvoice?.finalTotal || 0)}
          </div>
        </div>

        {/* PAY BUTTON */}
        <button
          onClick={cashOutInvoice}
          disabled={!loadedInvoice || loadedInvoice.status === "Paid"}
          style={{
            width: "100%",
            height: "110px",
            background:
              loadedInvoice?.status === "Paid"
                ? "#9ca3af"
                : "linear-gradient(to right, #bbf7d0, #22c55e)",
            border: "none",
            borderRadius: "12px",
            fontSize: "48px",
            fontWeight: "bold",
            cursor: "pointer",
            marginBottom: "18px",
          }}
        >
          PAY
        </button>

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
                height: "95px",
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