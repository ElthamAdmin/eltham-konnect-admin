import { useEffect, useRef, useState } from "react";
import api from "../api";
import {
  readPendingPayment,
  savePendingPayment,
  clearPendingPayment,
} from "../utils/pendingPayment";

function POS() {
    const paymentInFlight = useRef(false);

  const [pendingPayment, setPendingPayment] =
    useState(null);

  useEffect(() => {
    try {
      setPendingPayment(readPendingPayment("POS"));
    } catch (error) {
      console.error(error.message);
    }
  }, []);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [loadedInvoice, setLoadedInvoice] = useState(null);
  const [pickupTrackingNumbers, setPickupTrackingNumbers] = useState([]);
  const [handoverTrackingNumbers, setHandoverTrackingNumbers] = useState([]);
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
    width: "100%",
    minWidth: 0,
    maxWidth: "100%",
    backgroundColor: "white",
    padding: isMobile
      ? "16px"
      : "20px",
    borderRadius: "10px",
    border: "1px solid #e5e7eb",
    marginBottom: "20px",
    boxSizing: "border-box",
    overflow: "hidden",
  };

  const buttonStyle = {
    maxWidth: "100%",
    backgroundColor: "#0B3D91",
    color: "white",
    border: "none",
    padding: "10px 16px",
    borderRadius: "6px",
    cursor: "pointer",
    boxSizing: "border-box",
    touchAction: "manipulation",
  };

  const inputStyle = {
    width: "100%",
    minWidth: 0,
    maxWidth: "100%",
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
    boxSizing: "border-box",
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
      setPickupTrackingNumbers(res.data.data.pickupTrackingNumbers || []);
      setHandoverTrackingNumbers([]);
      setAmountTendered("");
    } catch (error) {
      setLoadedInvoice(null);
            setPickupTrackingNumbers([]);
      setHandoverTrackingNumbers([]);
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

const getInvoiceBalance = (
  invoice = loadedInvoice
) => {
  if (!invoice) return 0;

  if (
    [
      "Paid",
      "Cancelled",
      "Written Off",
      "Refunded",
    ].includes(invoice.status)
  ) {
    return 0;
  }

  return Math.max(
    0,
    Math.round(
      (
        Number(invoice.finalTotal || 0) -
        Number(invoice.amountPaid || 0) +
        Number.EPSILON
      ) * 100
    ) / 100
  );
};

const currentInvoiceBalance =
  getInvoiceBalance();

    const cashOutInvoice = async (retrySaved = false) => {
    if (paymentInFlight.current || posBusy) return;

    paymentInFlight.current = true;
    setPosBusy(true);

    let request = null;
    let paymentConfirmed = false;

    try {
      request = readPendingPayment("POS");

      if (request) {
        setPendingPayment(request);

        if (retrySaved !== true) {
          alert(
            "A POS payment is awaiting confirmation. " +
            "Use Retry saved payment before starting another."
          );
          return;
        }

        const saved = request.payload;

        if (
          !window.confirm(
            `Retry the saved payment for ${saved.invoiceNumber}?\n` +
            `Amount tendered: ${money(saved.amountTendered)}\n` +
            `Method: ${saved.paymentMethod}\n` +
            `Account: ${saved.paidIntoAccountNumber}\n\n` +
            "The original payment details will be reused."
          )
        ) {
          return;
        }
      } else {
        if (retrySaved === true) {
          setPendingPayment(null);
          alert("There is no saved POS payment to retry.");
          return;
        }

        if (!drawer) {
          alert("Open a cash drawer before cashing out.");
          return;
        }

        if (!loadedInvoice) {
          alert("Load an invoice first.");
          return;
        }

        if (getInvoiceBalance(loadedInvoice) <= 0) {
          alert("This invoice has no payable balance.");
          return;
        }

        if (!paidIntoAccountNumber) {
          alert(
            "Please select the account that received this payment."
          );
          return;
        }

        const latestResponse = await api.get(
          `/api/pos/invoice/${encodeURIComponent(
            loadedInvoice.invoiceNumber
          )}`
        );

        const latestData = latestResponse.data.data;
        const latestInvoice = latestData.invoice;

        const paymentSnapshot = (invoice) =>
          JSON.stringify([
            invoice.invoiceNumber,
            invoice.status,
            Number(invoice.finalTotal || 0),
            Number(invoice.amountPaid || 0),
            Number(invoice.pointsRedeemed || 0),
            Number(invoice.posDiscountAmount || 0),
          ]);

        if (
          latestData.invoiceType !== invoiceType ||
          paymentSnapshot(latestInvoice) !==
            paymentSnapshot(loadedInvoice)
        ) {
          setInvoiceType(latestData.invoiceType);
          setLoadedInvoice(latestInvoice);
          setAmountTendered("");
                    setPickupTrackingNumbers(latestData.pickupTrackingNumbers || []);
          setHandoverTrackingNumbers([]);

          alert(
            "This invoice changed after it was loaded. " +
            "POS has refreshed it. Review the updated " +
            "amount due before pressing PAY again."
          );

          return;
        }

        const tendered =
          amountTendered === ""
            ? getInvoiceBalance(latestInvoice)
            : Number(amountTendered);

        if (
          !Number.isFinite(tendered) ||
          tendered <= 0
        ) {
          alert("Enter an amount greater than zero.");
          return;
        }

                const selectedForHandover =
          invoiceType === "Shipping" ? handoverTrackingNumbers : [];

        if (selectedForHandover.length) {
          const eligible = latestData.pickupTrackingNumbers || [];

          if (selectedForHandover.some((number) => !eligible.includes(number))) {
            setPickupTrackingNumbers(eligible);
            setHandoverTrackingNumbers([]);
            alert(
              "The packages ready for pickup have changed. " +
              "Review the refreshed list before pressing PAY again."
            );
            return;
          }

          if (Math.round(tendered * 100) < Math.round(getInvoiceBalance(latestInvoice) * 100)) {
            alert(
              "This payment does not clear the balance. " +
              "Uncheck the handover packages to record a partial payment."
            );
            return;
          }
        }

        request = savePendingPayment("POS", {
          invoiceType,
          invoiceNumber: latestInvoice.invoiceNumber,
          paymentMethod,
          amountTendered: tendered,
          paidIntoAccountName,
          paidIntoAccountNumber,
          notes,
                    ...(selectedForHandover.length
            ? { handoverTrackingNumbers: [...selectedForHandover] }
            : {}),
        });

        setPendingPayment(request);
      }

      const response = await api.post(
        "/api/pos/cashout",
        request.payload
      );

      const data = response.data.data;

      if (!response.data.success || !data?.invoice) {
        throw new Error(
          "The payment response could not be confirmed."
        );
      }

      paymentConfirmed = true;

      try {
        clearPendingPayment(
          "POS",
          request.payload.paymentRequestId
        );
        setPendingPayment(null);
      } catch (error) {
        console.error(
          "Could not clear saved payment confirmation:",
          error
        );
        setPendingPayment(request);
      }

      setInvoiceNumber(request.payload.invoiceNumber);
      setInvoiceType(request.payload.invoiceType);
      setLoadedInvoice(data.invoice);
            setHandoverTrackingNumbers([]);
      setPickupTrackingNumbers([]);
      setDrawer(data.drawer);

      setPaymentMethod("Cash");
      setAmountTendered("");
      setPaidIntoAccountName("");
      setPaidIntoAccountNumber("");
      setNotes("");

      await Promise.all([
        loadDrawer(),
        loadDrawerHistory(),
        loadTransactions(),
      ]);

      // A replay contains the original response.
      // Reload the invoice to show its current balance.
      try {
        const fresh = await api.get(
          `/api/pos/invoice/${encodeURIComponent(
            request.payload.invoiceNumber
          )}`
        );

        setInvoiceType(fresh.data.data.invoiceType);
        setLoadedInvoice(fresh.data.data.invoice);
                setPickupTrackingNumbers(fresh.data.data.pickupTrackingNumbers || []);
      } catch (error) {
        console.error(
          "Payment confirmed; invoice refresh failed:",
          error
        );
      }

            const paymentMessage = response.data.paymentRequestReplayed
        ? "This payment was already recorded. No additional payment was created."
        : response.data.message || "Invoice payment recorded successfully.";

      const delivered = data.deliveredTrackingNumbers || [];

      alert(
        paymentMessage +
          (delivered.length
            ? `\n\nPackages marked Delivered:\n${delivered.join("\n")}`
            : "")
      );
    } catch (error) {
      if (paymentConfirmed) {
        alert(
          "Payment was confirmed, but the display could not fully refresh. " +
          "Reload POS before recording another payment."
        );
        return;
      }

      const status = error?.response?.status;
            const handoverRejected =
        status === 409 &&
        error.response?.data?.message ===
          "One or more selected packages are no longer ready for pickup. Refresh the invoice before trying again.";

      if (handoverRejected) {
        setHandoverTrackingNumbers([]);
        setPickupTrackingNumbers([]);
      }
      let retained = Boolean(request);

      if (
        request &&
                ([400, 404, 422].includes(status) || handoverRejected)
      ) {
        try {
          clearPendingPayment(
            "POS",
            request.payload.paymentRequestId
          );
          setPendingPayment(null);
          retained = false;
        } catch {
          setPendingPayment(request);
        }
      }

      const message =
        error?.response?.data?.message ||
        error.message ||
        "Could not confirm the POS payment.";

      alert(
        message +
          (retained
            ? "\nThe original request is saved. Use Retry saved payment; do not enter it as a new payment."
            : "")
      );
    } finally {
      paymentInFlight.current = false;
      setPosBusy(false);
    }
  };

    const confirmPaidPickup = async () => {
    if (
      paymentInFlight.current ||
      posBusy ||
      pendingPayment ||
      invoiceType !== "Shipping" ||
      loadedInvoice?.status !== "Paid" ||
      !loadedInvoice.invoiceNumber ||
      !handoverTrackingNumbers.length
    ) {
      return;
    }

    const pickupInvoiceNumber = loadedInvoice.invoiceNumber;
    const selected = [...handoverTrackingNumbers];

    paymentInFlight.current = true;
    setPosBusy(true);

    try {
      const response = await api.post("/api/pos/pickup", {
        invoiceNumber: pickupInvoiceNumber,
        handoverTrackingNumbers: selected,
      });

      const data = response.data?.data;

      if (
        !response.data?.success ||
        data?.invoiceNumber !== pickupInvoiceNumber ||
        !Array.isArray(data.deliveredTrackingNumbers) ||
        !Array.isArray(data.alreadyDeliveredTrackingNumbers)
      ) {
        throw new Error(
          "Pickup could not be confirmed. Reload the invoice and check the package statuses."
        );
      }

      const delivered = data.deliveredTrackingNumbers;
      const alreadyDelivered = data.alreadyDeliveredTrackingNumbers;
      const completed = new Set([...delivered, ...alreadyDelivered]);

      setHandoverTrackingNumbers([]);
      setPickupTrackingNumbers((current) =>
        current.filter((number) => !completed.has(number))
      );

      alert(
        [
          response.data.message || "Pickup confirmed.",
          delivered.length && `Marked Delivered: ${delivered.join(", ")}`,
          alreadyDelivered.length && `Already Delivered: ${alreadyDelivered.join(", ")}`,
        ].filter(Boolean).join("\n")
      );
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Could not confirm pickup. Reload the invoice and check package statuses before trying again."
      );
    } finally {
      paymentInFlight.current = false;
      setPosBusy(false);
    }
  };

  const invoiceItems =
    invoiceType === "Marketplace"
      ? loadedInvoice?.items || []
      : loadedInvoice?.packages || [];

    return (
    <div
            style={{
        width: "100%",
        minWidth: 0,
        maxWidth: "100%",
        background: "#eef1f5",
        minHeight: "100vh",
        padding: isMobile
          ? "10px 10px 130px"
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

          {pendingPayment && (
        <div
          role="status"
          style={{
            background: "#fff7ed",
            border: "1px solid #f97316",
            borderRadius: "10px",
            padding: "14px",
            marginBottom: "18px",
          }}
        >
          <strong>Payment confirmation pending</strong>

          <p>
            Invoice {pendingPayment.payload.invoiceNumber}
            {" — "}
            {money(pendingPayment.payload.amountTendered)}
            {" tendered. Resolve this saved request before "}
            starting another POS payment.
          </p>

          <button
            type="button"
            disabled={posBusy}
            onClick={() => cashOutInvoice(true)}
            style={buttonStyle}
          >
            {posBusy ? "Checking…" : "Retry saved payment"}
          </button>
        </div>
      )}

        <div
      style={{
        width: "100%",
        minWidth: 0,
        maxWidth: "100%",
        display: "grid",
        gridTemplateColumns:
          isMobile
            ? "minmax(0, 1fr)"
            : "minmax(0, 2fr) minmax(0, 1fr)",
        gap: isMobile
          ? "16px"
          : "20px",
        boxSizing: "border-box",
      }}
    >
            {/* LEFT SIDE */}
      <div
        style={{
          minWidth: 0,
          maxWidth: "100%",
        }}
      >
        {/* SEARCH BAR */}
        <div
                    style={{
            width: "100%",
            minWidth: 0,
            maxWidth: "100%",
            background: "white",
            padding: isMobile
              ? "16px"
              : "18px",
            borderRadius: "12px",
            marginBottom: "18px",
            boxShadow:
              "0 2px 8px rgba(0,0,0,0.08)",
            boxSizing: "border-box",
            overflow: "hidden",
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
              onChange={(event) =>
                setInvoiceNumber(
                  event.target.value
                )
              }
              onKeyDown={(event) => {
                if (
                  event.key === "Enter"
                ) {
                  findInvoice();
                }
              }}
              style={{
                width: "100%",
                minWidth: 0,
                maxWidth: "100%",
                padding: "16px",
                fontSize: isMobile
                  ? "16px"
                  : "18px",
                borderRadius: "10px",
                border:
                  "2px solid #cbd5e1",
                boxSizing:
                  "border-box",
              }}
            />

                       <input
              type="number"
              value="1"
              readOnly
              style={{
                width: "100%",
                minWidth: 0,
                maxWidth: "100%",
                padding: "16px",
                fontSize: "18px",
                borderRadius: "10px",
                border:
                  "2px solid #cbd5e1",
                textAlign: "center",
                background: "#fff7ed",
                fontWeight: "bold",
                boxSizing:
                  "border-box",
              }}
            />

                        <button
              type="button"
              onClick={findInvoice}
              style={{
                width: "100%",
                minWidth: 0,
                maxWidth: "100%",
                minHeight: "54px",
                padding: "12px 16px",
                background: "#0B3D91",
                color: "white",
                border: "none",
                borderRadius: "10px",
                fontSize: "18px",
                fontWeight: "bold",
                cursor: "pointer",
                boxSizing:
                  "border-box",
                touchAction:
                  "manipulation",
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
            width: "100%",
            minWidth: 0,
            maxWidth: "100%",
            display: "grid",
            gridTemplateColumns:
              isMobile
                ? "repeat(2, minmax(0, 1fr))"
                : "repeat(6, minmax(0, 1fr))",
            gap: "12px",
            marginTop: "18px",
            boxSizing: "border-box",
          }}
        >
          {[
            "DELETE",
            "DISCOUNT",
            "-",
            "+",
            "QTY CHANGE",
            "PRICE CHANGE",
          ].map((buttonLabel) => (
            <button
              type="button"
              key={buttonLabel}
              onClick={() =>
                handleQuickAction(
                  buttonLabel
                )
              }
              style={{
                width: "100%",
                minWidth: 0,
                maxWidth: "100%",
                minHeight: isMobile
                  ? "58px"
                  : "80px",
                padding: "8px",
                borderRadius: "10px",
                border: "none",
                background:
                  "linear-gradient(to bottom, #f8fafc, #bfdbfe)",
                fontWeight: "bold",
                fontSize: isMobile
                  ? "15px"
                  : "18px",
                cursor: "pointer",
                boxSizing:
                  "border-box",
                overflowWrap:
                  "anywhere",
                touchAction:
                  "manipulation",
              }}
            >
              {buttonLabel}
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
      <div
        style={{
          minWidth: 0,
          maxWidth: "100%",
        }}
      >
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
              currentInvoiceBalance
            )}
          </div>
        </div>

                                        {invoiceType === "Shipping" &&
                  loadedInvoice &&
                  !["Cancelled", "Refunded", "Written Off", "Reversed"].includes(
                    loadedInvoice.status
                  ) &&
                  pickupTrackingNumbers.length > 0 && (
                    <fieldset
                      disabled={Boolean(posBusy || pendingPayment)}
                      style={{ margin: "12px 0", padding: "12px", minWidth: 0 }}
                    >
                      <legend><strong>Packages being handed over now</strong></legend>
                                            <p style={{ margin: "0 0 8px" }}>
                        {loadedInvoice.status === "Paid"
                          ? "Select the packages you are giving to the customer, then click Confirm Pickup. No payment will be recorded."
                          : "Select only the packages you are giving to the customer. Leave all boxes unchecked for payment only."}
                      </p>

                      {pickupTrackingNumbers.map((trackingNumber) => (
                        <label
                          key={trackingNumber}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            minHeight: 44,
                            overflowWrap: "anywhere",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={handoverTrackingNumbers.includes(trackingNumber)}
                            onChange={(event) => {
                              const checked = event.target.checked;
                              setHandoverTrackingNumbers((current) =>
                                checked
                                  ? [...current, trackingNumber]
                                  : current.filter((number) => number !== trackingNumber)
                              );
                            }}
                          />
                          {trackingNumber}
                        </label>
                      ))}

                                            {loadedInvoice.status === "Paid" && (
                        <button
                          type="button"
                          onClick={confirmPaidPickup}
                          disabled={
                            posBusy ||
                            Boolean(pendingPayment) ||
                            handoverTrackingNumbers.length === 0
                          }
                          style={{
                            width: "100%",
                            minHeight: 44,
                            marginTop: 8,
                            border: 0,
                            borderRadius: 8,
                            background: "#0b3d91",
                            color: "#fff",
                            fontWeight: "bold",
                            opacity: posBusy || pendingPayment || !handoverTrackingNumbers.length
                              ? 0.55
                              : 1,
                          }}
                        >
                          {posBusy ? "Confirming…" : "Confirm Pickup"}
                        </button>
                      )}
                    </fieldset>
                  )}

                {/* PAY BUTTON */}
        <button
          type="button"
          onClick={() => cashOutInvoice()}
          disabled={
            posBusy ||
            Boolean(pendingPayment) ||
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
            width: "100%",
            minWidth: 0,
            maxWidth: "100%",
            background: "white",
            padding: "14px",
            borderRadius: "12px",
            marginBottom: "16px",
            boxShadow:
              "0 2px 8px rgba(0,0,0,0.08)",
            boxSizing: "border-box",
            overflow: "hidden",
          }}
        >
          <label
            style={{
              display: "block",
              fontWeight: "bold",
              marginBottom: "8px",
            }}
          >
            Amount Tendered
          </label>

          <input
            type="number"
            value={amountTendered}
            onChange={(event) =>
              setAmountTendered(
                event.target.value
              )
            }
            disabled={
              !loadedInvoice ||
              loadedInvoice.status ===
                "Paid"
            }
            placeholder="Enter amount received"
            style={{
              width: "100%",
              minWidth: 0,
              maxWidth: "100%",
              padding: "14px",
              borderRadius: "10px",
              border:
                "1px solid #cbd5e1",
              fontSize: isMobile
                ? "18px"
                : "22px",
              fontWeight: "bold",
              marginBottom: "10px",
              boxSizing:
                "border-box",
            }}
          />

          <div
            style={{
              width: "100%",
              minWidth: 0,
              display: "grid",
              gridTemplateColumns:
                "repeat(3, minmax(0, 1fr))",
              gap: "8px",
            }}
          >
            {[
              "1",
              "2",
              "3",
              "4",
              "5",
              "6",
              "7",
              "8",
              "9",
              "0",
              "00",
              "Clear",
            ].map((key) => (
              <button
                type="button"
                key={key}
                onClick={() => {
                  if (
                    key === "Clear"
                  ) {
                    setAmountTendered(
                      ""
                    );
                  } else {
                    setAmountTendered(
                      (previous) =>
                        `${previous || ""}${key}`
                    );
                  }
                }}
                disabled={
                  !loadedInvoice ||
                  loadedInvoice.status ===
                    "Paid"
                }
                style={{
                  width: "100%",
                  minWidth: 0,
                  minHeight: isMobile
                    ? "58px"
                    : "64px",
                  padding: isMobile
                    ? "12px 4px"
                    : "18px",
                  borderRadius: "10px",
                  border: "none",
                  background: "#dbeafe",
                  fontSize: isMobile
                    ? "18px"
                    : "22px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  boxSizing:
                    "border-box",
                  touchAction:
                    "manipulation",
                }}
              >
                {key}
              </button>
            ))}
          </div>

          {loadedInvoice && (
            <div
              style={{
                marginTop: "12px",
                fontWeight: "bold",
                overflowWrap:
                  "anywhere",
              }}
            >
              <div>
                Invoice Balance:{" "}
                {money(
                  currentInvoiceBalance
                )}
              </div>

              <div>
                Tendered:{" "}
                {money(
                  amountTendered
                )}
              </div>

              <div
                style={{
                  color: "#15803d",
                }}
              >
                Change:{" "}
                {money(
                  Math.max(
                    Number(
                      amountTendered ||
                        0
                    ) -
                      currentInvoiceBalance,
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
            width: "100%",
            minWidth: 0,
            maxWidth: "100%",
            background: "white",
            padding: "14px",
            borderRadius: "12px",
            marginBottom: "16px",
            boxShadow:
              "0 2px 8px rgba(0,0,0,0.08)",
            boxSizing: "border-box",
            overflow: "hidden",
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
            value={
              paidIntoAccountNumber
            }
            onChange={(event) => {
              const selectedAccount =
                accounts.find(
                  (account) =>
                    account.accountNumber ===
                    event.target.value
                );

              setPaidIntoAccountNumber(
                selectedAccount
                  ?.accountNumber || ""
              );

              setPaidIntoAccountName(
                selectedAccount
                  ?.accountName || ""
              );
            }}
            disabled={
              !loadedInvoice ||
              loadedInvoice.status ===
                "Paid"
            }
            style={{
              width: "100%",
              minWidth: 0,
              maxWidth: "100%",
              padding: "12px",
              borderRadius: "10px",
              border:
                "1px solid #cbd5e1",
              fontWeight: "bold",
              backgroundColor:
                "white",
              boxSizing:
                "border-box",
            }}
          >
            <option value="">
              Select Receiving Account
            </option>

            {accounts
              .filter(
                (account) =>
                  account.status ===
                  "Active"
              )
              .map((account) => (
                <option
                  key={account._id}
                  value={
                    account.accountNumber
                  }
                >
                  {account.accountName} -{" "}
                  {account.accountType} (
                  {account.accountNumber})
                </option>
              ))}
          </select>

          {paidIntoAccountName && (
            <div
              style={{
                marginTop: "8px",
                color: "#15803d",
                fontWeight: "bold",
                overflowWrap:
                  "anywhere",
                wordBreak:
                  "break-word",
              }}
            >
              Selected:{" "}
              {paidIntoAccountName}
            </div>
          )}
        </div>

                {/* PAYMENT BUTTONS */}
        <div
          style={{
            width: "100%",
            minWidth: 0,
            maxWidth: "100%",
            display: "grid",
            gridTemplateColumns:
              "repeat(2, minmax(0, 1fr))",
            gap: "12px",
            boxSizing: "border-box",
          }}
        >
          {[
            "Cash",
            "Card",
            "Bank Transfer",
            "Other",
          ].map((method) => (
            <button
              type="button"
              key={method}
              onClick={() =>
                setPaymentMethod(
                  method
                )
              }
              style={{
                width: "100%",
                minWidth: 0,
                maxWidth: "100%",
                minHeight: isMobile
                  ? "58px"
                  : "80px",
                padding: "8px",
                border: "none",
                borderRadius: "10px",
                background:
                  paymentMethod ===
                  method
                    ? "#22c55e"
                    : "linear-gradient(to bottom, #dcfce7, #86efac)",
                fontWeight: "bold",
                fontSize: isMobile
                  ? "17px"
                  : "22px",
                cursor: "pointer",
                boxSizing:
                  "border-box",
                overflowWrap:
                  "anywhere",
                touchAction:
                  "manipulation",
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
    onChange={(event) =>
      setHandoverToCashier(
        event.target.value
      )
    }
    style={{
      ...inputStyle,
      marginBottom: "8px",
    }}
  />

    <input
    type="number"
    placeholder="Counted Cash"
    value={handoverCashCount}
    onChange={(event) =>
      setHandoverCashCount(
        event.target.value
      )
    }
    style={{
      ...inputStyle,
      marginBottom: "8px",
    }}
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
    onChange={(event) =>
      setActionReason(
        event.target.value
      )
    }
    style={{
      ...inputStyle,
      marginBottom: "8px",
    }}
  />

    <input
    type="number"
    placeholder="Amount"
    value={actionAmount}
    onChange={(event) =>
      setActionAmount(
        event.target.value
      )
    }
    style={{
      ...inputStyle,
      marginBottom: "8px",
    }}
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