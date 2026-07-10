import { useEffect, useMemo, useState } from "react";
import api from "../api";

const ROYAL_BLUE = "#0B3D91";
const GOLD = "#D4AF37";
const WHITE = "#FFFFFF";
const LIGHT_BG = "#f4f7fb";
const BORDER = "#dbe3ef";
const MUTED = "#64748b";

const initialForm = {
  customerEkonId: "",
  requestDate: "",
  purchaseDate: "",
  merchant: "",
  website: "",
  orderNumber: "",
  purchaseCurrency: "USD",
  purchaseAmount: "",
  exchangeRate: "",
  paymentAccountNumber: "",
  branch: "Eltham Park Mainstore",
  itemName: "",
  itemDescription: "",
  quantity: 1,
  unitPrice: "",
  size: "",
  colour: "",
  productUrl: "",
  notes: "",
};

const formatMoney = (value, currency = "JMD") =>
  `${currency} ${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value) => {
  if (!value) return "—";
  return String(value).slice(0, 10);
};

const buttonStyle = (backgroundColor, color = WHITE) => ({
  backgroundColor,
  color,
  border: "none",
  padding: "9px 12px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
});

const fieldStyle = {
  width: "100%",
  padding: "11px",
  borderRadius: "8px",
  border: `1px solid ${BORDER}`,
  backgroundColor: WHITE,
  boxSizing: "border-box",
};

function CustomerPurchases() {
  const [purchases, setPurchases] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [packages, setPackages] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [formData, setFormData] = useState(initialForm);

  const [filters, setFilters] = useState({
    search: "",
    status: "",
    recoveryStatus: "",
    customerEkonId: "",
    paymentAccountNumber: "",
    from: "",
    to: "",
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    pages: 1,
    total: 0,
  });

  const calculatedBaseAmount = useMemo(() => {
    const amount = Number(formData.purchaseAmount || 0);
    const rate = Number(formData.exchangeRate || 1);

    if (formData.purchaseCurrency === "JMD") {
      return amount;
    }

    return amount * rate;
  }, [
    formData.purchaseAmount,
    formData.purchaseCurrency,
    formData.exchangeRate,
  ]);

  const loadDashboard = async () => {
    try {
      const response = await api.get("/api/customer-purchases/dashboard");
      setDashboard(response.data.data || null);
    } catch (error) {
      console.error("Customer purchase dashboard error:", error);
    }
  };

  const loadReferenceData = async () => {
    try {
      const [customersResponse, accountsResponse, packagesResponse] =
        await Promise.all([
          api.get("/api/customers"),
          api.get("/api/financial-accounts"),
          api.get("/api/packages"),
        ]);

      setCustomers(customersResponse.data.data || []);
      setAccounts(accountsResponse.data.data || []);
      setPackages(packagesResponse.data.data || []);
    } catch (error) {
      console.error("Customer purchase reference-data error:", error);
    }
  };

  const loadPurchases = async (
    page = pagination.page,
    limit = pagination.limit
  ) => {
    try {
      setLoading(true);

      const params = new URLSearchParams();

      params.append("page", page);
      params.append("limit", limit);

      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params.append(key, value);
        }
      });

      const response = await api.get(
        `/api/customer-purchases?${params.toString()}`
      );

      setPurchases(response.data.data || []);
      setPagination(
        response.data.pagination || {
          page,
          limit,
          pages: 1,
          total: response.data.totalPurchases || 0,
        }
      );
    } catch (error) {
      console.error("Customer purchase load error:", error);
      alert(
        error?.response?.data?.message ||
          "Could not load customer purchases."
      );
    } finally {
      setLoading(false);
    }
  };

  const refreshPage = async () => {
    await Promise.all([
      loadPurchases(pagination.page, pagination.limit),
      loadDashboard(),
    ]);
  };

  useEffect(() => {
    loadReferenceData();
    loadDashboard();
    loadPurchases(1, 25);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (name === "customerEkonId") {
      const customer = customers.find(
        (item) => item.ekonId === value
      );

      if (customer) {
        setFormData((previous) => ({
          ...previous,
          customerEkonId: value,
          branch:
            customer.branch ||
            previous.branch ||
            "Eltham Park Mainstore",
        }));
      }
    }

    if (name === "purchaseCurrency" && value === "JMD") {
      setFormData((previous) => ({
        ...previous,
        purchaseCurrency: value,
        exchangeRate: 1,
      }));
    }
  };

  const resetForm = () => {
    setFormData(initialForm);
    setShowForm(false);
  };

  const createPurchase = async () => {
    try {
      if (
        !formData.customerEkonId ||
        !formData.purchaseDate ||
        !formData.merchant ||
        !formData.purchaseAmount ||
        !formData.paymentAccountNumber
      ) {
        alert(
          "Customer, purchase date, merchant, amount, and payment account are required."
        );
        return;
      }

      if (
        formData.purchaseCurrency !== "JMD" &&
        Number(formData.exchangeRate || 0) <= 0
      ) {
        alert("Enter the exchange rate used for this purchase.");
        return;
      }

      setSaving(true);

      const quantity = Math.max(1, Number(formData.quantity || 1));
      const unitPrice = Number(
        formData.unitPrice || formData.purchaseAmount || 0
      );

      const payload = {
        customerEkonId: formData.customerEkonId,
        requestDate: formData.requestDate,
        purchaseDate: formData.purchaseDate,
        merchant: formData.merchant,
        website: formData.website,
        orderNumber: formData.orderNumber,
        purchaseCurrency: formData.purchaseCurrency,
        purchaseAmount: Number(formData.purchaseAmount || 0),
        exchangeRate:
          formData.purchaseCurrency === "JMD"
            ? 1
            : Number(formData.exchangeRate || 0),
        paymentAccountNumber: formData.paymentAccountNumber,
        branch: formData.branch,
        notes: formData.notes,
        items: formData.itemName
          ? [
              {
                itemName: formData.itemName,
                description: formData.itemDescription,
                quantity,
                unitPrice,
                totalAmount: Number(
                  formData.purchaseAmount || quantity * unitPrice
                ),
                size: formData.size,
                colour: formData.colour,
                productUrl: formData.productUrl,
              },
            ]
          : [],
      };

      const response = await api.post(
        "/api/customer-purchases",
        payload
      );

      alert(
        response.data.message ||
          "Customer purchase created successfully."
      );

      resetForm();

      await Promise.all([
        loadPurchases(1, pagination.limit),
        loadDashboard(),
      ]);

      setPagination((previous) => ({
        ...previous,
        page: 1,
      }));
    } catch (error) {
      console.error("Customer purchase creation error:", error);

      alert(
        error?.response?.data?.message ||
          "Customer purchase could not be created."
      );
    } finally {
      setSaving(false);
    }
  };

  const viewPurchase = async (purchaseNumber) => {
    try {
      const response = await api.get(
        `/api/customer-purchases/${purchaseNumber}`
      );

      setSelectedPurchase(response.data.data || null);
    } catch (error) {
      console.error("Customer purchase detail error:", error);

      alert(
        error?.response?.data?.message ||
          "Could not load purchase details."
      );
    }
  };

  const linkPackage = async (purchase) => {
    const eligiblePackages = packages.filter(
      (pkg) =>
        pkg.customerEkonId === purchase.customerEkonId &&
        pkg.status !== "Deleted"
    );

    if (eligiblePackages.length === 0) {
      alert("No packages were found for this customer.");
      return;
    }

    const packageChoices = eligiblePackages
      .map(
        (pkg, index) =>
          `${index + 1}. ${pkg.trackingNumber} — ${pkg.status}`
      )
      .join("\n");

    const selection = prompt(
      `Select the package number to link:\n\n${packageChoices}`,
      "1"
    );

    if (selection === null) return;

    const selectedPackage =
      eligiblePackages[Number(selection) - 1];

    if (!selectedPackage) {
      alert("Invalid package selection.");
      return;
    }

    try {
      const response = await api.patch(
        `/api/customer-purchases/${purchase.purchaseNumber}/link-package`,
        {
          packageId: selectedPackage._id,
          trackingNumber: selectedPackage.trackingNumber,
        }
      );

      alert(response.data.message || "Package linked successfully.");
      await refreshPage();
    } catch (error) {
      console.error("Package linking error:", error);

      alert(
        error?.response?.data?.message ||
          "Could not link the package."
      );
    }
  };

  const receivePurchase = async (purchase) => {
    const trackingNumber = prompt(
      "Tracking number:",
      purchase.trackingNumber || ""
    );

    if (trackingNumber === null) return;

    const warehouse = prompt(
      "Warehouse or location:",
      purchase.warehouse || "KP"
    );

    if (warehouse === null) return;

    const weight = prompt(
      "Actual package weight:",
      String(purchase.weight || "")
    );

    if (weight === null) return;

    try {
      const response = await api.patch(
        `/api/customer-purchases/${purchase.purchaseNumber}/receive`,
        {
          trackingNumber,
          warehouse,
          weight: Number(weight || 0),
          packageReceivedDate: new Date().toISOString(),
        }
      );

      alert(
        response.data.message ||
          "Purchase arrival recorded successfully."
      );

      await refreshPage();
    } catch (error) {
      console.error("Purchase receipt error:", error);

      alert(
        error?.response?.data?.message ||
          "Could not record purchase arrival."
      );
    }
  };

  const prepareRecovery = async (purchase) => {
    const itemRecoveryAmount = prompt(
      "Recoverable item cost in JMD:",
      String(
        purchase.itemRecoveryAmount ||
          purchase.baseCurrencyAmount ||
          0
      )
    );

    if (itemRecoveryAmount === null) return;

    const shoppingAssistanceFee = prompt(
      "Shopping assistance fee:",
      String(purchase.shoppingAssistanceFee || 0)
    );

    if (shoppingAssistanceFee === null) return;

    const weightCharge = prompt(
      "Weight charge:",
      String(purchase.weightCharge || 0)
    );

    if (weightCharge === null) return;

    const shippingCharge = prompt(
      "Additional shipping charge:",
      String(purchase.shippingCharge || 0)
    );

    if (shippingCharge === null) return;

    const customsDuty = prompt(
      "Customs duty:",
      String(purchase.customsDuty || 0)
    );

    if (customsDuty === null) return;

    const deliveryFee = prompt(
      "Delivery fee:",
      String(purchase.deliveryFee || 0)
    );

    if (deliveryFee === null) return;

    const otherCharges = prompt(
      "Other charges:",
      String(purchase.otherCharges || 0)
    );

    if (otherCharges === null) return;

    try {
      const response = await api.patch(
        `/api/customer-purchases/${purchase.purchaseNumber}/prepare-recovery`,
        {
          itemRecoveryAmount: Number(itemRecoveryAmount || 0),
          shoppingAssistanceFee: Number(
            shoppingAssistanceFee || 0
          ),
          weightCharge: Number(weightCharge || 0),
          shippingCharge: Number(shippingCharge || 0),
          customsDuty: Number(customsDuty || 0),
          deliveryFee: Number(deliveryFee || 0),
          otherCharges: Number(otherCharges || 0),
        }
      );

      alert(
        response.data.message ||
          "Recovery charges prepared successfully."
      );

      await refreshPage();
    } catch (error) {
      console.error("Recovery preparation error:", error);

      alert(
        error?.response?.data?.message ||
          "Could not prepare recovery charges."
      );
    }
  };

  const refundPurchase = async (purchase) => {
    const refundAmount = prompt(
      "Refund amount in JMD:",
      String(
        Number(purchase.baseCurrencyAmount || 0) -
          Number(purchase.refundedAmount || 0)
      )
    );

    if (refundAmount === null) return;

    const notes = prompt(
      "Refund notes:",
      `Refund from ${purchase.merchant}`
    );

    if (notes === null) return;

    const confirmed = window.confirm(
      `Post a refund of ${formatMoney(refundAmount)} for ${purchase.purchaseNumber}?`
    );

    if (!confirmed) return;

    try {
      const response = await api.patch(
        `/api/customer-purchases/${purchase.purchaseNumber}/refund`,
        {
          refundAmount: Number(refundAmount || 0),
          refundDate: new Date().toISOString().slice(0, 10),
          notes,
        }
      );

      alert(response.data.message || "Refund posted successfully.");
      await refreshPage();
    } catch (error) {
      console.error("Purchase refund error:", error);

      alert(
        error?.response?.data?.message ||
          "Could not post the purchase refund."
      );
    }
  };

  const applyFilters = async () => {
    setPagination((previous) => ({
      ...previous,
      page: 1,
    }));

    await loadPurchases(1, pagination.limit);
  };

  const clearFilters = async () => {
    const clearedFilters = {
      search: "",
      status: "",
      recoveryStatus: "",
      customerEkonId: "",
      paymentAccountNumber: "",
      from: "",
      to: "",
    };

    setFilters(clearedFilters);

    try {
      setLoading(true);

      const response = await api.get(
        `/api/customer-purchases?page=1&limit=${pagination.limit}`
      );

      setPurchases(response.data.data || []);
      setPagination(
        response.data.pagination || {
          page: 1,
          limit: pagination.limit,
          pages: 1,
          total: 0,
        }
      );
    } catch (error) {
      console.error("Customer purchase filter reset error:", error);
    } finally {
      setLoading(false);
    }
  };

  const statusBadge = (status) => {
    let backgroundColor = "#64748b";

    if (status === "Purchased") backgroundColor = ROYAL_BLUE;
    if (status === "Pending Purchase") backgroundColor = "#f59e0b";
    if (status === "In Transit") backgroundColor = "#2563eb";
    if (status === "At Warehouse") backgroundColor = "#7c3aed";
    if (status === "Ready to Invoice") backgroundColor = "#ea580c";
    if (status === "Invoiced") backgroundColor = "#0891b2";
    if (status === "Recovered") backgroundColor = "#16a34a";
    if (status === "Refunded") backgroundColor = "#475569";
    if (status === "Cancelled" || status === "Reversed") {
      backgroundColor = "#dc2626";
    }

    return (
      <span
        style={{
          backgroundColor,
          color: WHITE,
          padding: "5px 9px",
          borderRadius: "999px",
          fontWeight: "bold",
          fontSize: "12px",
          display: "inline-block",
          whiteSpace: "nowrap",
        }}
      >
        {status || "—"}
      </span>
    );
  };

  const recoveryBadge = (status) => {
    let backgroundColor = "#64748b";

    if (status === "Not Invoiced") backgroundColor = "#f59e0b";
    if (status === "Invoiced") backgroundColor = "#0891b2";
    if (status === "Partially Paid") backgroundColor = "#ea580c";
    if (status === "Paid") backgroundColor = "#16a34a";
    if (status === "Refunded") backgroundColor = "#475569";
    if (status === "Written Off") backgroundColor = "#dc2626";

    return (
      <span
        style={{
          backgroundColor,
          color: WHITE,
          padding: "5px 9px",
          borderRadius: "999px",
          fontWeight: "bold",
          fontSize: "12px",
          display: "inline-block",
          whiteSpace: "nowrap",
        }}
      >
        {status || "—"}
      </span>
    );
  };

  const metricCard = (label, value, color = ROYAL_BLUE) => (
    <div
      style={{
        backgroundColor: WHITE,
        border: `1px solid ${BORDER}`,
        borderRadius: "12px",
        padding: "18px",
        boxShadow: "0 2px 8px rgba(15,23,42,0.04)",
      }}
    >
      <div
        style={{
          color: MUTED,
          fontWeight: "bold",
          fontSize: "13px",
          marginBottom: "8px",
        }}
      >
        {label}
      </div>

      <div
        style={{
          color,
          fontSize: "27px",
          fontWeight: "bold",
          wordBreak: "break-word",
        }}
      >
        {value}
      </div>
    </div>
  );

  return (
    <div style={{ backgroundColor: LIGHT_BG, minHeight: "100vh" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
          marginBottom: "20px",
        }}
      >
        <div>
          <h1 style={{ margin: 0, color: "#0f172a" }}>
            Customer Purchases
          </h1>

          <p style={{ margin: "6px 0 0", color: MUTED }}>
            Record purchases made on behalf of customers and track package
            arrival, invoicing, recovery, and refunds.
          </p>
        </div>

        <button
          onClick={() => setShowForm((previous) => !previous)}
          style={buttonStyle(ROYAL_BLUE)}
        >
          {showForm ? "Close Form" : "+ New Customer Purchase"}
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(190px, 1fr))",
          gap: "14px",
          marginBottom: "20px",
        }}
      >
        {metricCard(
          "Total Purchases",
          dashboard?.totalPurchases || 0
        )}

        {metricCard(
          "Pending Purchase",
          dashboard?.pendingPurchase || 0,
          "#f59e0b"
        )}

        {metricCard(
          "At Warehouse",
          dashboard?.atWarehouse || 0,
          "#7c3aed"
        )}

        {metricCard(
          "Ready to Invoice",
          dashboard?.readyToInvoice || 0,
          "#ea580c"
        )}

        {metricCard(
          "Recovered",
          dashboard?.recovered || 0,
          "#16a34a"
        )}

        {metricCard(
          "Outstanding Recovery",
          formatMoney(dashboard?.totalOutstanding || 0),
          "#dc2626"
        )}

        {metricCard(
          "Credit Card Exposure",
          formatMoney(dashboard?.totalCreditCardExposure || 0),
          GOLD
        )}
      </div>

      {showForm && (
        <div
          style={{
            backgroundColor: WHITE,
            border: `1px solid ${BORDER}`,
            borderRadius: "12px",
            padding: "20px",
            marginBottom: "20px",
            boxShadow: "0 2px 8px rgba(15,23,42,0.04)",
          }}
        >
          <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>
            New Customer Purchase
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(230px, 1fr))",
              gap: "14px",
            }}
          >
            <select
              name="customerEkonId"
              value={formData.customerEkonId}
              onChange={handleFormChange}
              style={fieldStyle}
            >
              <option value="">Select Customer</option>

              {customers
                .filter((customer) => customer.status !== "Deleted")
                .map((customer) => (
                  <option
                    key={customer.ekonId}
                    value={customer.ekonId}
                  >
                    {customer.name} ({customer.ekonId})
                  </option>
                ))}
            </select>

            <select
              name="branch"
              value={formData.branch}
              onChange={handleFormChange}
              style={fieldStyle}
            >
              <option value="Eltham Park Mainstore">
                Eltham Park Mainstore
              </option>
              <option value="Brown's Town Square">
                Brown&apos;s Town Square
              </option>
            </select>

            <input
              type="date"
              name="requestDate"
              value={formData.requestDate}
              onChange={handleFormChange}
              style={fieldStyle}
              title="Customer request date"
            />

            <input
              type="date"
              name="purchaseDate"
              value={formData.purchaseDate}
              onChange={handleFormChange}
              style={fieldStyle}
              title="Purchase date"
            />

            <input
              name="merchant"
              placeholder="Merchant, for example Crocs.com"
              value={formData.merchant}
              onChange={handleFormChange}
              style={fieldStyle}
            />

            <input
              name="website"
              placeholder="Website"
              value={formData.website}
              onChange={handleFormChange}
              style={fieldStyle}
            />

            <input
              name="orderNumber"
              placeholder="Merchant Order Number"
              value={formData.orderNumber}
              onChange={handleFormChange}
              style={fieldStyle}
            />

            <select
              name="purchaseCurrency"
              value={formData.purchaseCurrency}
              onChange={handleFormChange}
              style={fieldStyle}
            >
              <option value="USD">USD</option>
              <option value="JMD">JMD</option>
              <option value="GBP">GBP</option>
              <option value="CAD">CAD</option>
              <option value="EUR">EUR</option>
            </select>

            <input
              type="number"
              step="0.01"
              name="purchaseAmount"
              placeholder="Purchase Amount"
              value={formData.purchaseAmount}
              onChange={handleFormChange}
              style={fieldStyle}
            />

            <input
              type="number"
              step="0.0001"
              name="exchangeRate"
              placeholder="Exchange Rate to JMD"
              value={formData.exchangeRate}
              onChange={handleFormChange}
              disabled={formData.purchaseCurrency === "JMD"}
              style={{
                ...fieldStyle,
                backgroundColor:
                  formData.purchaseCurrency === "JMD"
                    ? "#f1f5f9"
                    : WHITE,
              }}
            />

            <select
              name="paymentAccountNumber"
              value={formData.paymentAccountNumber}
              onChange={handleFormChange}
              style={fieldStyle}
            >
              <option value="">Select Payment Account</option>

              {accounts
                .filter((account) => account.status === "Active")
                .map((account) => (
                  <option
                    key={account.accountNumber}
                    value={account.accountNumber}
                  >
                    {account.accountName} ({account.accountType})
                  </option>
                ))}
            </select>

            <div
              style={{
                ...fieldStyle,
                backgroundColor: "#eef4ff",
                fontWeight: "bold",
                color: ROYAL_BLUE,
              }}
            >
              JMD Equivalent: {formatMoney(calculatedBaseAmount)}
            </div>

            <input
              name="itemName"
              placeholder="Item Name"
              value={formData.itemName}
              onChange={handleFormChange}
              style={fieldStyle}
            />

            <input
              name="itemDescription"
              placeholder="Item Description"
              value={formData.itemDescription}
              onChange={handleFormChange}
              style={fieldStyle}
            />

            <input
              type="number"
              min="1"
              name="quantity"
              placeholder="Quantity"
              value={formData.quantity}
              onChange={handleFormChange}
              style={fieldStyle}
            />

            <input
              type="number"
              step="0.01"
              name="unitPrice"
              placeholder="Unit Price"
              value={formData.unitPrice}
              onChange={handleFormChange}
              style={fieldStyle}
            />

            <input
              name="size"
              placeholder="Size"
              value={formData.size}
              onChange={handleFormChange}
              style={fieldStyle}
            />

            <input
              name="colour"
              placeholder="Colour"
              value={formData.colour}
              onChange={handleFormChange}
              style={fieldStyle}
            />

            <input
              name="productUrl"
              placeholder="Product URL"
              value={formData.productUrl}
              onChange={handleFormChange}
              style={fieldStyle}
            />

            <textarea
              name="notes"
              placeholder="Purchase notes"
              value={formData.notes}
              onChange={handleFormChange}
              rows={3}
              style={{
                ...fieldStyle,
                gridColumn: "1 / -1",
                resize: "vertical",
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
              marginTop: "18px",
            }}
          >
            <button
              onClick={createPurchase}
              disabled={saving}
              style={{
                ...buttonStyle(GOLD, "#111827"),
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? "Posting Purchase..." : "Save and Post Purchase"}
            </button>

            <button
              onClick={resetForm}
              style={buttonStyle("#64748b")}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div
        style={{
          backgroundColor: WHITE,
          border: `1px solid ${BORDER}`,
          borderRadius: "12px",
          padding: "16px",
          marginBottom: "16px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(190px, 1fr))",
            gap: "12px",
          }}
        >
          <input
            placeholder="Search purchase, customer, merchant, order, tracking or invoice"
            value={filters.search}
            onChange={(event) =>
              setFilters((previous) => ({
                ...previous,
                search: event.target.value,
              }))
            }
            style={fieldStyle}
          />

          <select
            value={filters.status}
            onChange={(event) =>
              setFilters((previous) => ({
                ...previous,
                status: event.target.value,
              }))
            }
            style={fieldStyle}
          >
            <option value="">All Purchase Statuses</option>
            <option value="Pending Purchase">Pending Purchase</option>
            <option value="Purchased">Purchased</option>
            <option value="In Transit">In Transit</option>
            <option value="At Warehouse">At Warehouse</option>
            <option value="Ready to Invoice">Ready to Invoice</option>
            <option value="Invoiced">Invoiced</option>
            <option value="Partially Recovered">
              Partially Recovered
            </option>
            <option value="Recovered">Recovered</option>
            <option value="Refunded">Refunded</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Reversed">Reversed</option>
          </select>

          <select
            value={filters.recoveryStatus}
            onChange={(event) =>
              setFilters((previous) => ({
                ...previous,
                recoveryStatus: event.target.value,
              }))
            }
            style={fieldStyle}
          >
            <option value="">All Recovery Statuses</option>
            <option value="Not Invoiced">Not Invoiced</option>
            <option value="Invoiced">Invoiced</option>
            <option value="Partially Paid">Partially Paid</option>
            <option value="Paid">Paid</option>
            <option value="Refunded">Refunded</option>
            <option value="Written Off">Written Off</option>
          </select>

          <select
            value={filters.customerEkonId}
            onChange={(event) =>
              setFilters((previous) => ({
                ...previous,
                customerEkonId: event.target.value,
              }))
            }
            style={fieldStyle}
          >
            <option value="">All Customers</option>

            {customers.map((customer) => (
              <option
                key={customer.ekonId}
                value={customer.ekonId}
              >
                {customer.name} ({customer.ekonId})
              </option>
            ))}
          </select>

          <select
            value={filters.paymentAccountNumber}
            onChange={(event) =>
              setFilters((previous) => ({
                ...previous,
                paymentAccountNumber: event.target.value,
              }))
            }
            style={fieldStyle}
          >
            <option value="">All Payment Accounts</option>

            {accounts.map((account) => (
              <option
                key={account.accountNumber}
                value={account.accountNumber}
              >
                {account.accountName}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={filters.from}
            onChange={(event) =>
              setFilters((previous) => ({
                ...previous,
                from: event.target.value,
              }))
            }
            style={fieldStyle}
            title="From date"
          />

          <input
            type="date"
            value={filters.to}
            onChange={(event) =>
              setFilters((previous) => ({
                ...previous,
                to: event.target.value,
              }))
            }
            style={fieldStyle}
            title="To date"
          />
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
            marginTop: "12px",
          }}
        >
          <button
            onClick={applyFilters}
            style={buttonStyle(ROYAL_BLUE)}
          >
            Apply Filters
          </button>

          <button
            onClick={clearFilters}
            style={buttonStyle("#64748b")}
          >
            Clear Filters
          </button>
        </div>
      </div>

      <div
        style={{
          backgroundColor: WHITE,
          border: `1px solid ${BORDER}`,
          borderRadius: "10px",
          padding: "12px 15px",
          marginBottom: "15px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <strong>Total Records: {pagination.total || 0}</strong>

          <select
            value={pagination.limit}
            onChange={async (event) => {
              const limit = Number(event.target.value);

              setPagination((previous) => ({
                ...previous,
                limit,
                page: 1,
              }));

              await loadPurchases(1, limit);
            }}
            style={fieldStyle}
          >
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <button
            disabled={pagination.page <= 1}
            onClick={async () => {
              const page = Math.max(1, pagination.page - 1);

              setPagination((previous) => ({
                ...previous,
                page,
              }));

              await loadPurchases(page, pagination.limit);
            }}
            style={{
              ...buttonStyle(
                pagination.page <= 1 ? "#cbd5e1" : ROYAL_BLUE
              ),
              cursor:
                pagination.page <= 1 ? "not-allowed" : "pointer",
            }}
          >
            Previous
          </button>

          <strong>
            Page {pagination.page || 1} of {pagination.pages || 1}
          </strong>

          <button
            disabled={pagination.page >= pagination.pages}
            onClick={async () => {
              const page = Math.min(
                pagination.pages || 1,
                pagination.page + 1
              );

              setPagination((previous) => ({
                ...previous,
                page,
              }));

              await loadPurchases(page, pagination.limit);
            }}
            style={{
              ...buttonStyle(
                pagination.page >= pagination.pages
                  ? "#cbd5e1"
                  : ROYAL_BLUE
              ),
              cursor:
                pagination.page >= pagination.pages
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            Next
          </button>
        </div>
      </div>

      <div
        style={{
          overflowX: "auto",
          overflowY: "auto",
          maxHeight: "72vh",
          backgroundColor: WHITE,
          border: `1px solid ${BORDER}`,
          borderRadius: "12px",
        }}
      >
        <table
          border="1"
          cellPadding="10"
          style={{
            minWidth: "2350px",
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
              <th>Purchase No.</th>
              <th>Purchase Date</th>
              <th>Customer</th>
              <th>Branch</th>
              <th>Merchant</th>
              <th>Order No.</th>
              <th>Purchase Amount</th>
              <th>JMD Amount</th>
              <th>Payment Account</th>
              <th>Tracking</th>
              <th>Weight</th>
              <th>Total Customer Charge</th>
              <th>Outstanding</th>
              <th>Purchase Status</th>
              <th>Recovery Status</th>
              <th>Invoice</th>
              <th>Journal Entry</th>
              <th
                style={{
                  position: "sticky",
                  right: 0,
                  backgroundColor: "#eef4ff",
                  zIndex: 6,
                  minWidth: "175px",
                }}
              >
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="18" style={{ textAlign: "center" }}>
                  Loading customer purchases...
                </td>
              </tr>
            ) : purchases.length > 0 ? (
              purchases.map((purchase) => (
                <tr key={purchase._id || purchase.purchaseNumber}>
                  <td style={{ fontWeight: "bold" }}>
                    {purchase.purchaseNumber}
                  </td>
                  <td>{formatDate(purchase.purchaseDate)}</td>
                  <td>
                    <strong>{purchase.customerName}</strong>
                    <div style={{ color: MUTED, fontSize: "12px" }}>
                      {purchase.customerEkonId}
                    </div>
                  </td>
                  <td>{purchase.branch}</td>
                  <td>{purchase.merchant}</td>
                  <td>{purchase.orderNumber || "—"}</td>
                  <td>
                    {formatMoney(
                      purchase.purchaseAmount,
                      purchase.purchaseCurrency
                    )}
                  </td>
                  <td>{formatMoney(purchase.baseCurrencyAmount)}</td>
                  <td>
                    {purchase.paymentAccountName}
                    <div style={{ color: MUTED, fontSize: "12px" }}>
                      {purchase.paymentAccountType}
                    </div>
                  </td>
                  <td>{purchase.trackingNumber || "—"}</td>
                  <td>
                    {purchase.weight
                      ? `${purchase.weight} lb`
                      : "—"}
                  </td>
                  <td>{formatMoney(purchase.totalCustomerCharge)}</td>
                  <td
                    style={{
                      color:
                        Number(purchase.outstandingAmount || 0) > 0
                          ? "#dc2626"
                          : "#16a34a",
                      fontWeight: "bold",
                    }}
                  >
                    {formatMoney(purchase.outstandingAmount)}
                  </td>
                  <td>{statusBadge(purchase.status)}</td>
                  <td>{recoveryBadge(purchase.recoveryStatus)}</td>
                  <td>{purchase.invoiceNumber || "—"}</td>
                  <td>{purchase.journalEntryNumber || "—"}</td>
                  <td
                    style={{
                      position: "sticky",
                      right: 0,
                      backgroundColor: WHITE,
                      zIndex: 4,
                      boxShadow:
                        "-4px 0 8px rgba(15,23,42,0.08)",
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gap: "7px",
                      }}
                    >
                      <button
                        onClick={() =>
                          viewPurchase(purchase.purchaseNumber)
                        }
                        style={buttonStyle(ROYAL_BLUE)}
                      >
                        View
                      </button>

                      {!purchase.trackingNumber && (
                        <button
                          onClick={() => linkPackage(purchase)}
                          style={buttonStyle("#7c3aed")}
                        >
                          Link Package
                        </button>
                      )}

                      {![
                        "Cancelled",
                        "Refunded",
                        "Reversed",
                        "Recovered",
                      ].includes(purchase.status) && (
                        <button
                          onClick={() => receivePurchase(purchase)}
                          style={buttonStyle("#0891b2")}
                        >
                          Record Arrival
                        </button>
                      )}

                      {!purchase.invoiceNumber &&
                        ![
                          "Cancelled",
                          "Refunded",
                          "Reversed",
                        ].includes(purchase.status) && (
                          <button
                            onClick={() => prepareRecovery(purchase)}
                            style={buttonStyle("#ea580c")}
                          >
                            Prepare Recovery
                          </button>
                        )}

                      {purchase.journalEntryNumber &&
                        ![
                          "Cancelled",
                          "Refunded",
                          "Reversed",
                        ].includes(purchase.status) && (
                          <button
                            onClick={() => refundPurchase(purchase)}
                            style={buttonStyle("#dc2626")}
                          >
                            Refund
                          </button>
                        )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="18"
                  style={{
                    textAlign: "center",
                    padding: "24px",
                    color: MUTED,
                  }}
                >
                  No customer purchases found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedPurchase && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15,23,42,0.72)",
            zIndex: 9999,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "900px",
              maxHeight: "90vh",
              overflowY: "auto",
              backgroundColor: WHITE,
              borderRadius: "16px",
              padding: "24px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "12px",
                alignItems: "center",
                marginBottom: "18px",
              }}
            >
              <div>
                <h2 style={{ margin: 0, color: ROYAL_BLUE }}>
                  {selectedPurchase.purchaseNumber}
                </h2>

                <div style={{ color: MUTED, marginTop: "5px" }}>
                  {selectedPurchase.customerName} —{" "}
                  {selectedPurchase.merchant}
                </div>
              </div>

              <button
                onClick={() => setSelectedPurchase(null)}
                style={buttonStyle("#64748b")}
              >
                Close
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "12px",
              }}
            >
              {[
                ["Customer EKON ID", selectedPurchase.customerEkonId],
                ["Branch", selectedPurchase.branch],
                ["Request Date", formatDate(selectedPurchase.requestDate)],
                ["Purchase Date", formatDate(selectedPurchase.purchaseDate)],
                ["Merchant", selectedPurchase.merchant],
                ["Website", selectedPurchase.website || "—"],
                ["Order Number", selectedPurchase.orderNumber || "—"],
                [
                  "Purchase Amount",
                  formatMoney(
                    selectedPurchase.purchaseAmount,
                    selectedPurchase.purchaseCurrency
                  ),
                ],
                [
                  "Exchange Rate",
                  selectedPurchase.exchangeRate || 1,
                ],
                [
                  "JMD Equivalent",
                  formatMoney(selectedPurchase.baseCurrencyAmount),
                ],
                [
                  "Payment Account",
                  selectedPurchase.paymentAccountName,
                ],
                [
                  "Tracking Number",
                  selectedPurchase.trackingNumber || "—",
                ],
                ["Warehouse", selectedPurchase.warehouse || "—"],
                [
                  "Weight",
                  selectedPurchase.weight
                    ? `${selectedPurchase.weight} lb`
                    : "—",
                ],
                [
                  "Item Recovery",
                  formatMoney(selectedPurchase.itemRecoveryAmount),
                ],
                [
                  "Shopping Fee",
                  formatMoney(
                    selectedPurchase.shoppingAssistanceFee
                  ),
                ],
                [
                  "Weight Charge",
                  formatMoney(selectedPurchase.weightCharge),
                ],
                [
                  "Shipping Charge",
                  formatMoney(selectedPurchase.shippingCharge),
                ],
                [
                  "Customs Duty",
                  formatMoney(selectedPurchase.customsDuty),
                ],
                [
                  "Delivery Fee",
                  formatMoney(selectedPurchase.deliveryFee),
                ],
                [
                  "Other Charges",
                  formatMoney(selectedPurchase.otherCharges),
                ],
                [
                  "Total Customer Charge",
                  formatMoney(selectedPurchase.totalCustomerCharge),
                ],
                [
                  "Outstanding",
                  formatMoney(selectedPurchase.outstandingAmount),
                ],
                [
                  "Journal Entry",
                  selectedPurchase.journalEntryNumber || "—",
                ],
                [
                  "Account Transaction",
                  selectedPurchase.accountTransactionNumber || "—",
                ],
              ].map(([label, value]) => (
                <div
                  key={label}
                  style={{
                    border: `1px solid ${BORDER}`,
                    borderRadius: "10px",
                    padding: "12px",
                    backgroundColor: "#f8fafc",
                  }}
                >
                  <div
                    style={{
                      color: MUTED,
                      fontSize: "12px",
                      fontWeight: "bold",
                      marginBottom: "5px",
                    }}
                  >
                    {label}
                  </div>

                  <div
                    style={{
                      color: "#1e293b",
                      fontWeight: "bold",
                      wordBreak: "break-word",
                    }}
                  >
                    {value}
                  </div>
                </div>
              ))}
            </div>

            {selectedPurchase.items?.length > 0 && (
              <div style={{ marginTop: "20px" }}>
                <h3 style={{ color: ROYAL_BLUE }}>Purchased Items</h3>

                <div style={{ overflowX: "auto" }}>
                  <table
                    border="1"
                    cellPadding="9"
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      borderColor: BORDER,
                    }}
                  >
                    <thead style={{ backgroundColor: "#eef4ff" }}>
                      <tr>
                        <th>Item</th>
                        <th>Description</th>
                        <th>Quantity</th>
                        <th>Unit Price</th>
                        <th>Size</th>
                        <th>Colour</th>
                      </tr>
                    </thead>

                    <tbody>
                      {selectedPurchase.items.map((item) => (
                        <tr key={item._id || item.itemName}>
                          <td>{item.itemName}</td>
                          <td>{item.description || "—"}</td>
                          <td>{item.quantity}</td>
                          <td>
                            {formatMoney(
                              item.unitPrice,
                              selectedPurchase.purchaseCurrency
                            )}
                          </td>
                          <td>{item.size || "—"}</td>
                          <td>{item.colour || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {selectedPurchase.notes && (
              <div
                style={{
                  marginTop: "18px",
                  border: `1px solid ${BORDER}`,
                  borderRadius: "10px",
                  padding: "14px",
                }}
              >
                <strong>Notes</strong>
                <div style={{ marginTop: "7px", whiteSpace: "pre-wrap" }}>
                  {selectedPurchase.notes}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerPurchases;