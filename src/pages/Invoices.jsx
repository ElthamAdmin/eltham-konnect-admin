import { useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import api from "../api";

function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountByInvoice, setSelectedAccountByInvoice] = useState({});
  const [paymentLinkByInvoice, setPaymentLinkByInvoice] = useState({});
  const [chargeFormByInvoice, setChargeFormByInvoice] = useState({});
  const [selectedChargeInvoice, setSelectedChargeInvoice] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
    const [packages, setPackages] = useState([]);
  const [customerPurchases, setCustomerPurchases] = useState([]);

  const [selectedCustomerEkonId, setSelectedCustomerEkonId] =
    useState("");

  const [selectedPackageIds, setSelectedPackageIds] = useState([]);

  const [
    selectedCustomerPurchaseNumbers,
    setSelectedCustomerPurchaseNumbers,
  ] = useState([]);

  const [pointsToRedeem, setPointsToRedeem] = useState("");
  const [generatingInvoice, setGeneratingInvoice] = useState(false);

  const ROYAL_BLUE = "#0B3D91";
  const GOLD = "#D4AF37";
  const WHITE = "#FFFFFF";
  const LIGHT_BG = "#f4f7fb";
  const BORDER = "#dbe3ef";
  const MUTED = "#64748b";

  const fetchInvoices = async () => {
    try {
      const res = await api.get("/api/invoices");
      const invoiceData = res.data.data || [];
      setInvoices(invoiceData);

      const links = {};
const chargeForms = {};

invoiceData.forEach((inv) => {
  links[inv.invoiceNumber] = inv.paymentLink || "";

  chargeForms[inv.invoiceNumber] = {
  customsDuty: inv.customsDuty || 0,
  gct: inv.gct || 0,
  processingFee: inv.processingFee || 0,
  deliveryFee: inv.deliveryFee || 0,
  deliveryType: inv.deliveryType || "",
  otherAdjustment: inv.otherAdjustment || 0,
  adjustmentNote: inv.adjustmentNote || "",
};
});

setPaymentLinkByInvoice(links);
setChargeFormByInvoice(chargeForms);
    } catch (error) {
      console.error("Error loading invoices:", error);
    }
  };

  const fetchAccounts = async () => {
    try {
      const res = await api.get("/api/financial-accounts");
      setAccounts(res.data.data || []);
    } catch (error) {
      console.error("Error loading financial accounts:", error);
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchAccounts();
    fetchPackages();
    fetchCustomerPurchases();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize]);

    const fetchPackages = async () => {
    try {
      const res = await api.get("/api/packages");
      setPackages(res.data.data || []);
    } catch (error) {
      console.error("Error loading packages:", error);
    }
  };

  const fetchCustomerPurchases = async () => {
    try {
      const res = await api.get(
        "/api/customer-purchases?limit=100"
      );

      setCustomerPurchases(res.data.data || []);
    } catch (error) {
      console.error(
        "Error loading customer purchases:",
        error
      );
    }
  };

  const handleAccountChange = (invoiceNumber, accountNumber) => {
    setSelectedAccountByInvoice((prev) => ({
      ...prev,
      [invoiceNumber]: accountNumber,
    }));
  };

  const handlePaymentLinkChange = (invoiceNumber, value) => {
    setPaymentLinkByInvoice((prev) => ({
      ...prev,
      [invoiceNumber]: value,
    }));
  };

  const handleChargeChange = (invoiceNumber, field, value) => {
  setChargeFormByInvoice((prev) => ({
    ...prev,
    [invoiceNumber]: {
      ...(prev[invoiceNumber] || {}),
      [field]: value,
    },
  }));
};

const saveInvoiceCharges = async (invoiceNumber) => {
  try {
    const chargeForm = chargeFormByInvoice[invoiceNumber] || {};

    const payload = {
  customsDuty: Number(chargeForm.customsDuty || 0),
  gct: Number(chargeForm.gct || 0),
  processingFee: Number(chargeForm.processingFee || 0),
  deliveryFee: Number(chargeForm.deliveryFee || 0),
  deliveryType: chargeForm.deliveryType || "",
  otherAdjustment: Number(chargeForm.otherAdjustment || 0),
  adjustmentNote: chargeForm.adjustmentNote || "",
};

    const res = await api.put(`/api/invoices/${invoiceNumber}/charges`, payload);

    alert(res.data.message || "Invoice charges updated.");
    await fetchInvoices();
  } catch (error) {
    console.error("Error updating invoice charges:", error);
    alert(error?.response?.data?.message || "Could not update invoice charges.");
  }
};

  const savePaymentLink = async (invoiceNumber) => {
    try {
      const paymentLink = paymentLinkByInvoice[invoiceNumber] || "";

      const res = await api.put(`/api/invoices/${invoiceNumber}/payment-link`, {
        paymentLink,
      });

      alert(res.data.message);
      await fetchInvoices();
    } catch (error) {
      console.error("Error saving payment link:", error);
      alert(error?.response?.data?.message || "Could not save payment link.");
    }
  };

  const applyPointsToInvoice = async (invoiceNumber) => {
  const pointsInput = prompt(
    `Enter EK points amount to apply to invoice ${invoiceNumber}:`,
    "500"
  );

  if (pointsInput === null) return;

  const pointsToRedeem = Number(pointsInput || 0);

  if (!pointsToRedeem || pointsToRedeem <= 0) {
    alert("Please enter a valid points amount.");
    return;
  }

  try {
    const res = await api.put(`/api/invoices/${invoiceNumber}/apply-points`, {
      pointsToRedeem,
    });

    alert(res.data.message || "EK points applied.");
    await fetchInvoices();
  } catch (error) {
    console.error("Error applying EK points:", error);
    alert(error?.response?.data?.message || "Could not apply EK points.");
  }
};

  const markInvoicePaid = async (invoiceNumber) => {
    try {
      const receivingAccountNumber = selectedAccountByInvoice[invoiceNumber];

      if (!receivingAccountNumber) {
        alert("Please select the account that received this payment.");
        return;
      }

      const res = await api.put(`/api/invoices/pay/${invoiceNumber}`, {
        receivingAccountNumber,
      });

            alert(res.data.message);

      await Promise.all([
        fetchInvoices(),
        fetchPackages(),
        fetchCustomerPurchases(),
      ]);
    } catch (error) {
      console.error("Error marking invoice paid:", error);
      alert(error?.response?.data?.message || "Could not mark invoice as paid.");
    }
  };

    const readyUninvoicedPackages = useMemo(() => {
    return packages.filter(
      (pkg) =>
        pkg.readyForPickup === true &&
        pkg.invoiceStatus !== "Issued" &&
        pkg.invoiceStatus !== "Paid"
    );
  }, [packages]);

  const readyCustomerPurchases = useMemo(() => {
    return customerPurchases.filter(
      (purchase) =>
        purchase.status === "Ready to Invoice" &&
        purchase.recoveryStatus === "Not Invoiced" &&
        !purchase.invoiceNumber
    );
  }, [customerPurchases]);

  const customerOptions = useMemo(() => {
    const map = {};

    readyUninvoicedPackages.forEach((pkg) => {
      map[pkg.customerEkonId] = pkg.customerName;
    });

    readyCustomerPurchases.forEach((purchase) => {
      map[purchase.customerEkonId] =
        purchase.customerName;
    });

    return Object.entries(map).map(
      ([ekonId, name]) => ({
        ekonId,
        name,
      })
    );
  }, [
    readyUninvoicedPackages,
    readyCustomerPurchases,
  ]);

  const customerReadyPackages = useMemo(() => {
    if (!selectedCustomerEkonId) return [];

    return readyUninvoicedPackages.filter(
      (pkg) =>
        pkg.customerEkonId ===
        selectedCustomerEkonId
    );
  }, [
    readyUninvoicedPackages,
    selectedCustomerEkonId,
  ]);

  const customerReadyPurchases = useMemo(() => {
    if (!selectedCustomerEkonId) return [];

    return readyCustomerPurchases.filter(
      (purchase) =>
        purchase.customerEkonId ===
        selectedCustomerEkonId
    );
  }, [
    readyCustomerPurchases,
    selectedCustomerEkonId,
  ]);

  const selectedCustomerPurchases = useMemo(() => {
    return customerReadyPurchases.filter(
      (purchase) =>
        selectedCustomerPurchaseNumbers.includes(
          purchase.purchaseNumber
        )
    );
  }, [
    customerReadyPurchases,
    selectedCustomerPurchaseNumbers,
  ]);

  const selectedPurchaseSummary = useMemo(() => {
    return selectedCustomerPurchases.reduce(
      (summary, purchase) => {
        summary.itemRecovery += Number(
          purchase.itemRecoveryAmount || 0
        );

        summary.shoppingFee += Number(
          purchase.shoppingAssistanceFee || 0
        );

        summary.weightCharge += Number(
          purchase.weightCharge || 0
        );

        summary.shippingCharge += Number(
          purchase.shippingCharge || 0
        );

        summary.customsDuty += Number(
          purchase.customsDuty || 0
        );

        summary.deliveryFee += Number(
          purchase.deliveryFee || 0
        );

        summary.otherCharges += Number(
          purchase.otherCharges || 0
        );

        summary.total += Number(
          purchase.totalCustomerCharge || 0
        );

        return summary;
      },
      {
        itemRecovery: 0,
        shoppingFee: 0,
        weightCharge: 0,
        shippingCharge: 0,
        customsDuty: 0,
        deliveryFee: 0,
        otherCharges: 0,
        total: 0,
      }
    );
  }, [selectedCustomerPurchases]);

const togglePackageSelection = (packageId) => {
  setSelectedPackageIds((prev) =>
    prev.includes(packageId)
      ? prev.filter((id) => id !== packageId)
      : [...prev, packageId]
  );
};

const toggleCustomerPurchaseSelection = (
  purchaseNumber
) => {
  setSelectedCustomerPurchaseNumbers((prev) =>
    prev.includes(purchaseNumber)
      ? prev.filter(
          (number) => number !== purchaseNumber
        )
      : [...prev, purchaseNumber]
  );
};

const generateSelectedInvoice = async () => {
  if (!selectedCustomerEkonId) {
    alert("Please select a customer.");
    return;
  }

  if (
    selectedPackageIds.length === 0 &&
    selectedCustomerPurchaseNumbers.length === 0
  ) {
    alert(
      "Select at least one ready package or customer purchase."
    );
    return;
  }

  try {
    setGeneratingInvoice(true);

    let response;

    if (
      selectedCustomerPurchaseNumbers.length > 0
    ) {
      response = await api.post(
        "/api/invoices/generate-customer-purchases",
        {
          customerEkonId:
            selectedCustomerEkonId,
          customerPurchaseNumbers:
            selectedCustomerPurchaseNumbers,
        }
      );
    } else {
      response = await api.post(
        "/api/invoices/generate-multiple",
        {
          customerEkonId:
            selectedCustomerEkonId,
          packageIds: selectedPackageIds,
          pointsToRedeem: Number(
            pointsToRedeem || 0
          ),
        }
      );
    }

    alert(
      response.data.message ||
        "Invoice generated successfully."
    );

    setSelectedCustomerEkonId("");
    setSelectedPackageIds([]);
    setSelectedCustomerPurchaseNumbers([]);
    setPointsToRedeem("");

    await Promise.all([
      fetchInvoices(),
      fetchPackages(),
      fetchCustomerPurchases(),
    ]);
  } catch (error) {
    console.error(
      "Error generating selected invoice:",
      error
    );

    alert(
      error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Could not generate invoice."
    );
  } finally {
    setGeneratingInvoice(false);
  }
};

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) =>
      `${inv.invoiceNumber} ${inv.customerEkonId} ${inv.customerName} ${inv.status} ${inv.paymentLink || ""}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  }, [invoices, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedInvoices = filteredInvoices.slice(startIndex, endIndex);

  const summary = useMemo(() => {
    const paid = invoices.filter((inv) => inv.status === "Paid");
    const unpaid = invoices.filter((inv) => inv.status === "Unpaid");

    return {
      totalInvoices: invoices.length,
      unpaidInvoices: unpaid.length,
      paidInvoices: paid.length,
      outstandingTotal: unpaid.reduce(
        (sum, inv) => sum + Number(inv.finalTotal || 0),
        0
      ),
    };
  }, [invoices]);

  const formatCurrency = (value) =>
    `JMD ${Number(value || 0).toLocaleString()}`;

  const formatDate = (value) => {
    if (!value) return "";
    try {
      return new Date(value).toISOString().split("T")[0];
    } catch {
      return value;
    }
  };

  const statusBadge = (status) => {
    const backgroundColor =
      status === "Paid" ? "#16a34a" : status === "Unpaid" ? "#dc2626" : MUTED;

    return (
      <span
        style={{
          padding: "5px 10px",
          borderRadius: "999px",
          color: "white",
          backgroundColor,
          fontWeight: "bold",
          fontSize: "12px",
          whiteSpace: "nowrap",
          display: "inline-block",
        }}
      >
        {status}
      </span>
    );
  };

  const downloadInvoicePdf = (inv) => {
    try {
      const doc = new jsPDF("p", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();

      let y = 18;

      const addLine = (text, x = 15, size = 11, color = [15, 23, 42], style = "normal") => {
        doc.setFont("helvetica", style);
        doc.setFontSize(size);
        doc.setTextColor(...color);
        doc.text(String(text), x, y);
        y += 7;
      };

      const addWrappedText = (
        label,
        value,
        x = 15,
        maxWidth = 180,
        size = 10,
        color = [51, 65, 85]
      ) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(size);
        doc.setTextColor(...color);
        doc.text(`${label}`, x, y);

        y += 5;

        doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(String(value || ""), maxWidth);
        doc.text(lines, x, y);
        y += lines.length * 5 + 2;
      };

      doc.setFillColor(11, 61, 145);
      doc.rect(0, 0, pageWidth, 20, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(255, 255, 255);
      doc.text("ELTHAM KONNECT", 15, 13);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text("Your Konnection, Our Priority", pageWidth - 15, 13, {
        align: "right",
      });

      y = 30;

      doc.setDrawColor(212, 175, 55);
      doc.setLineWidth(0.8);
      doc.line(15, y, pageWidth - 15, y);
      y += 10;

      addLine("INVOICE", 15, 18, [11, 61, 145], "bold");

      doc.setDrawColor(219, 227, 239);
      doc.setLineWidth(0.3);
      doc.line(15, y - 2, pageWidth - 15, y - 2);

      addLine(`Invoice Number: ${inv.invoiceNumber || ""}`, 15, 11, [15, 23, 42], "bold");
      addLine(`Date Issued: ${formatDate(inv.createdAt) || ""}`, 15, 11, [51, 65, 85]);
      addLine(`Customer Name: ${inv.customerName || ""}`, 15, 11, [51, 65, 85]);
      addLine(`Customer EKON ID: ${inv.customerEkonId || ""}`, 15, 11, [51, 65, 85]);

      y += 3;
      addLine("PACKAGE SUMMARY", 15, 13, [11, 61, 145], "bold");
      addLine(`Total Packages: ${Number(inv.packageCount || 0).toLocaleString()}`, 15, 11, [51, 65, 85]);
      addLine(`Invoice Status: ${inv.status || ""}`, 15, 11, [51, 65, 85]);
      addLine(
        `Paid Date: ${inv.paidDate ? formatDate(inv.paidDate) : "Not paid yet"}`,
        15,
        11,
        [51, 65, 85]
      );

      y += 3;
      addLine("CHARGES", 15, 13, [11, 61, 145], "bold");

      const leftX = 15;
      const rightX = 140;
      const rowHeight = 9;

            const chargeRows = [
        [
          "Customer Purchase Recovery",
          formatCurrency(
            inv.customerPurchaseRecoveryAmount
          ),
        ],
        [
          "Shopping Assistance Fee",
          formatCurrency(
            inv.shoppingAssistanceFee
          ),
        ],
        [
          "Weight Charge",
          formatCurrency(
            inv.customerPurchaseWeightCharge
          ),
        ],
        [
          "Additional Shipping Charge",
          formatCurrency(
            inv.customerPurchaseShippingCharge
          ),
        ],
        [
          "Shipping / Freight Subtotal",
          formatCurrency(inv.subtotal),
        ],
        [
          "Customs Duty",
          formatCurrency(inv.customsDuty),
        ],
        ["GCT", formatCurrency(inv.gct)],
        [
          "Processing Fee",
          formatCurrency(inv.processingFee),
        ],
        [
          "Delivery Fee",
          formatCurrency(inv.deliveryFee),
        ],
        [
          "Other Adjustment",
          formatCurrency(inv.otherAdjustment),
        ],
        [
          "EK Points Redeemed",
          `- ${formatCurrency(inv.pointsRedeemed)}`,
        ],
        ["Final Total", formatCurrency(inv.finalTotal)],
      ];

      chargeRows.forEach((row, index) => {
        if (index === chargeRows.length - 1) {
          doc.setFillColor(238, 244, 255);
          doc.rect(leftX, y - 5.5, 180, rowHeight, "F");
        }

        doc.setFont("helvetica", index === chargeRows.length - 1 ? "bold" : "normal");
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.text(row[0], leftX, y);
        doc.text(row[1], rightX, y);
        y += rowHeight;
      });

      y += 2;
      addLine("PAYMENT DETAILS", 15, 13, [11, 61, 145], "bold");
      addLine(`Payment Status: ${inv.status || ""}`, 15, 11, [51, 65, 85]);

      const paymentLink = paymentLinkByInvoice[inv.invoiceNumber] || inv.paymentLink || "No payment link added";
      addWrappedText("Fygaro Payment Link:", paymentLink, 15, 180, 10, [51, 65, 85]);

      y += 2;
      addLine("NOTES", 15, 13, [11, 61, 145], "bold");

      const notes = [
        "Charges are calculated per package and then summed for the invoice.",
        "Ready packages are the packages included in invoice billing.",
        "EK points are redeemable starting at 500 points.",
        "All payments should be completed before final package release.",
      ];

      notes.forEach((note) => {
        const wrapped = doc.splitTextToSize(`• ${note}`, 180);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(51, 65, 85);
        doc.text(wrapped, 15, y);
        y += wrapped.length * 5 + 1;
      });

      y += 4;
      doc.setDrawColor(212, 175, 55);
      doc.line(15, y, pageWidth - 15, y);
      y += 8;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(11, 61, 145);
      doc.text("Thank you for shipping with Eltham Konnect", pageWidth / 2, y, {
        align: "center",
      });

      doc.save(`${inv.invoiceNumber || "invoice"}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Could not generate PDF for this invoice.");
    }
  };

  const metricCardStyle = {
    backgroundColor: WHITE,
    borderRadius: "12px",
    padding: "18px",
    border: `1px solid ${BORDER}`,
    boxShadow: "0 2px 8px rgba(15,23,42,0.04)",
    minHeight: "115px",
  };

  const actionButtonStyle = {
    color: WHITE,
    border: "none",
    padding: "10px 14px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    minWidth: "130px",
  };

  const paginationControls = (
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
        <strong style={{ color: "#1e293b" }}>
          Showing {filteredInvoices.length === 0 ? 0 : startIndex + 1} to{" "}
          {Math.min(endIndex, filteredInvoices.length)} of{" "}
          {filteredInvoices.length}
        </strong>

        <select
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
          style={{
            padding: "8px 10px",
            borderRadius: "8px",
            border: `1px solid ${BORDER}`,
            backgroundColor: WHITE,
          }}
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
          gap: "8px",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={safeCurrentPage === 1}
          style={{
            backgroundColor: safeCurrentPage === 1 ? "#cbd5e1" : ROYAL_BLUE,
            color: WHITE,
            border: "none",
            padding: "8px 12px",
            borderRadius: "8px",
            cursor: safeCurrentPage === 1 ? "not-allowed" : "pointer",
            fontWeight: "bold",
          }}
        >
          Previous
        </button>

        <span style={{ fontWeight: "bold", color: "#334155" }}>
          Page {safeCurrentPage} of {totalPages}
        </span>

        <button
          onClick={() =>
            setCurrentPage((prev) => Math.min(prev + 1, totalPages))
          }
          disabled={safeCurrentPage === totalPages}
          style={{
            backgroundColor:
              safeCurrentPage === totalPages ? "#cbd5e1" : ROYAL_BLUE,
            color: WHITE,
            border: "none",
            padding: "8px 12px",
            borderRadius: "8px",
            cursor:
              safeCurrentPage === totalPages ? "not-allowed" : "pointer",
            fontWeight: "bold",
          }}
        >
          Next
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ backgroundColor: LIGHT_BG, minHeight: "100vh" }}>
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ margin: 0, color: "#0f172a" }}>Invoices</h1>
        <p style={{ margin: "6px 0 0 0", color: MUTED }}>
          Manage invoice balances, payment links, payment posting, and PDF downloads.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          marginBottom: "18px",
        }}
      >
        <div style={metricCardStyle}>
          <div
            style={{
              fontSize: "30px",
              fontWeight: "bold",
              color: ROYAL_BLUE,
              marginBottom: "8px",
            }}
          >
            {summary.totalInvoices}
          </div>
          <div style={{ color: "#334155", fontWeight: "bold" }}>
            Total Invoices
          </div>
        </div>

        <div style={metricCardStyle}>
          <div
            style={{
              fontSize: "30px",
              fontWeight: "bold",
              color: "#dc2626",
              marginBottom: "8px",
            }}
          >
            {summary.unpaidInvoices}
          </div>
          <div style={{ color: "#334155", fontWeight: "bold" }}>
            Unpaid Invoices
          </div>
        </div>

        <div style={metricCardStyle}>
          <div
            style={{
              fontSize: "30px",
              fontWeight: "bold",
              color: "#16a34a",
              marginBottom: "8px",
            }}
          >
            {summary.paidInvoices}
          </div>
          <div style={{ color: "#334155", fontWeight: "bold" }}>
            Paid Invoices
          </div>
        </div>

        <div style={metricCardStyle}>
          <div
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              color: GOLD,
              marginBottom: "8px",
              wordBreak: "break-word",
            }}
          >
            {formatCurrency(summary.outstandingTotal)}
          </div>
          <div style={{ color: "#334155", fontWeight: "bold" }}>
            Outstanding Total
          </div>
        </div>
      </div>

      <div
  style={{
    backgroundColor: WHITE,
    border: `1px solid ${BORDER}`,
    borderRadius: "12px",
    padding: "16px",
    marginBottom: "16px",
    boxShadow: "0 2px 8px rgba(15,23,42,0.04)",
  }}
>
  <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>
    Generate Invoice From Selected Packages
  </h2>

  <p style={{ color: MUTED }}>
    Select only the packages the customer wants to pay for today.
  </p>

  <div style={{ display: "grid", gap: "12px" }}>
    <select
      value={selectedCustomerEkonId}
            onChange={(e) => {
        setSelectedCustomerEkonId(e.target.value);
        setSelectedPackageIds([]);
        setSelectedCustomerPurchaseNumbers([]);
      }}
      style={{
        padding: "12px",
        borderRadius: "8px",
        border: `1px solid ${BORDER}`,
      }}
    >
      <option value="">Select Customer With Ready Packages</option>
      {customerOptions.map((customer) => (
        <option key={customer.ekonId} value={customer.ekonId}>
          {customer.name} ({customer.ekonId})
        </option>
      ))}
    </select>

        {selectedCustomerEkonId && (
      <>
        <div
          style={{
            border: `1px solid ${BORDER}`,
            borderRadius: "10px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              backgroundColor: "#eef4ff",
              padding: "12px",
              color: ROYAL_BLUE,
              fontWeight: "bold",
            }}
          >
            Ready Packages
          </div>

          {customerReadyPackages.length > 0 ? (
            customerReadyPackages.map((pkg) => (
              <label
                key={pkg._id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "40px 1fr",
                  gap: "10px",
                  padding: "12px",
                  borderBottom: `1px solid ${BORDER}`,
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedPackageIds.includes(
                    pkg._id
                  )}
                  onChange={() =>
                    togglePackageSelection(pkg._id)
                  }
                  disabled={
                    selectedCustomerPurchaseNumbers.length >
                    0
                  }
                />

                <div>
                  <strong>{pkg.trackingNumber}</strong>

                  <div
                    style={{
                      color: MUTED,
                      fontSize: "14px",
                    }}
                  >
                    Weight: {pkg.weight || 0} lb |
                    Status: {pkg.status} | Invoice:{" "}
                    {pkg.invoiceStatus || "Pending"}
                  </div>

                  {pkg.customerPurchaseNumber && (
                    <div
                      style={{
                        color: "#7c3aed",
                        fontSize: "13px",
                        fontWeight: "bold",
                        marginTop: "4px",
                      }}
                    >
                      Linked Purchase:{" "}
                      {pkg.customerPurchaseNumber}
                    </div>
                  )}
                </div>
              </label>
            ))
          ) : (
            <div
              style={{
                padding: "14px",
                color: MUTED,
              }}
            >
              No ready uninvoiced packages found for
              this customer.
            </div>
          )}
        </div>

        <div
          style={{
            border: `1px solid ${BORDER}`,
            borderRadius: "10px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              backgroundColor: "#fff7ed",
              padding: "12px",
              color: "#c2410c",
              fontWeight: "bold",
            }}
          >
            Ready Customer Purchases
          </div>

          {customerReadyPurchases.length > 0 ? (
            customerReadyPurchases.map(
              (purchase) => (
                <label
                  key={purchase.purchaseNumber}
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "40px 1fr",
                    gap: "10px",
                    padding: "12px",
                    borderBottom: `1px solid ${BORDER}`,
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedCustomerPurchaseNumbers.includes(
                      purchase.purchaseNumber
                    )}
                    onChange={() =>
                      toggleCustomerPurchaseSelection(
                        purchase.purchaseNumber
                      )
                    }
                    disabled={
                      selectedPackageIds.length > 0
                    }
                  />

                  <div>
                    <strong>
                      {purchase.purchaseNumber}
                    </strong>

                    <div
                      style={{
                        marginTop: "4px",
                        color: "#334155",
                      }}
                    >
                      {purchase.merchant}
                      {purchase.orderNumber
                        ? ` — ${purchase.orderNumber}`
                        : ""}
                    </div>

                    <div
                      style={{
                        marginTop: "4px",
                        color: MUTED,
                        fontSize: "14px",
                      }}
                    >
                      Tracking:{" "}
                      {purchase.trackingNumber || "—"} |
                      Weight:{" "}
                      {purchase.weight || 0} lb
                    </div>

                    <div
                      style={{
                        marginTop: "5px",
                        color: "#c2410c",
                        fontWeight: "bold",
                      }}
                    >
                      Recovery Total:{" "}
                      {formatCurrency(
                        purchase.totalCustomerCharge
                      )}
                    </div>
                  </div>
                </label>
              )
            )
          ) : (
            <div
              style={{
                padding: "14px",
                color: MUTED,
              }}
            >
              No Customer Purchases are currently
              ready to invoice for this customer.
            </div>
          )}
        </div>

        {selectedCustomerPurchases.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "10px",
              padding: "14px",
              borderRadius: "10px",
              border: `1px solid ${BORDER}`,
              backgroundColor: "#f8fafc",
            }}
          >
            {[
              [
                "Item Recovery",
                selectedPurchaseSummary.itemRecovery,
              ],
              [
                "Shopping Fee",
                selectedPurchaseSummary.shoppingFee,
              ],
              [
                "Weight Charge",
                selectedPurchaseSummary.weightCharge,
              ],
              [
                "Shipping Charge",
                selectedPurchaseSummary.shippingCharge,
              ],
              [
                "Customs",
                selectedPurchaseSummary.customsDuty,
              ],
              [
                "Delivery",
                selectedPurchaseSummary.deliveryFee,
              ],
              [
                "Other Charges",
                selectedPurchaseSummary.otherCharges,
              ],
              [
                "Invoice Total",
                selectedPurchaseSummary.total,
              ],
            ].map(([label, amount]) => (
              <div
                key={label}
                style={{
                  border: `1px solid ${BORDER}`,
                  borderRadius: "8px",
                  padding: "10px",
                  backgroundColor: WHITE,
                }}
              >
                <div
                  style={{
                    color: MUTED,
                    fontSize: "12px",
                    marginBottom: "5px",
                  }}
                >
                  {label}
                </div>

                <strong
                  style={{
                    color:
                      label === "Invoice Total"
                        ? "#c2410c"
                        : ROYAL_BLUE,
                  }}
                >
                  {formatCurrency(amount)}
                </strong>
              </div>
            ))}
          </div>
        )}
      </>
    )}

    <input
      type="number"
      placeholder="Optional EK points to redeem"
      value={pointsToRedeem}
      onChange={(e) => setPointsToRedeem(e.target.value)}
      style={{
        padding: "12px",
        borderRadius: "8px",
        border: `1px solid ${BORDER}`,
      }}
    />

        <button
      onClick={generateSelectedInvoice}
      disabled={generatingInvoice}
      style={{
        backgroundColor: generatingInvoice
          ? "#94a3b8"
          : ROYAL_BLUE,
        color: WHITE,
        border: "none",
        padding: "12px 16px",
        borderRadius: "8px",
        cursor: generatingInvoice
          ? "not-allowed"
          : "pointer",
        fontWeight: "bold",
      }}
    >
      {generatingInvoice
        ? "Generating Invoice..."
        : selectedCustomerPurchaseNumbers.length > 0
        ? "Generate Customer Purchase Recovery Invoice"
        : "Generate Invoice for Selected Packages"}
    </button>
  </div>
</div>

      <div
        style={{
          backgroundColor: WHITE,
          border: `1px solid ${BORDER}`,
          borderRadius: "12px",
          padding: "16px",
          marginBottom: "16px",
          boxShadow: "0 2px 8px rgba(15,23,42,0.04)",
        }}
      >
        <input
          type="text"
          placeholder="Search by invoice number, customer, EKON ID, status, or payment link"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "8px",
            border: `1px solid ${BORDER}`,
          }}
        />
      </div>

      {paginationControls}

      <div
        style={{
          backgroundColor: WHITE,
          padding: "20px",
          borderRadius: "12px",
          border: `1px solid ${BORDER}`,
          boxShadow: "0 2px 8px rgba(15,23,42,0.04)",
        }}
      >
        <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>All Invoices</h2>

        <div
  style={{
    overflowX: "auto",
    overflowY: "auto",
    maxHeight: "70vh",
    border: `1px solid ${BORDER}`,
    borderRadius: "10px",
  }}
>
          <table
            border="1"
            cellPadding="10"
            style={{
              minWidth: "2100px",
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
                <th>Invoice Number</th>
                <th>Customer EKON ID</th>
                <th>Customer</th>
                <th>Package Count</th>
                <th>Invoice Source</th>
                <th>Purchase Count</th>
                <th>Item Recovery</th>
                <th>Shopping Fee</th>
                <th>Subtotal</th>
                <th>Customs Duty</th>
                <th>GCT</th>
                <th>Processing Fee</th>
                <th>Delivery Fee</th>
                <th>Delivery Type</th>
                <th>Other Adjustment</th>
                <th>Points Redeemed</th>
                <th>Final Total</th>
                <th>Status</th>
                <th>Created Date</th>
                <th>Paid Date</th>
                <th>Fygaro Payment Link</th>
                <th>Receive Into Account</th>
                <th
  style={{
    position: "sticky",
    right: 0,
    backgroundColor: "#eef4ff",
    zIndex: 6,
    minWidth: "170px",
  }}
>
  Actions
</th>
              </tr>
            </thead>

            <tbody>
              {paginatedInvoices.length > 0 ? (
                paginatedInvoices.map((inv) => (
                  <tr key={inv._id}>
                    <td style={{ fontWeight: "bold", color: "#334155" }}>
                      {inv.invoiceNumber}
                    </td>
                    <td>{inv.customerEkonId}</td>
                    <td>{inv.customerName}</td>
                                        <td>{inv.packageCount}</td>

                    <td>
                      {inv.invoiceSource || "Packages"}
                    </td>

                    <td>
                      {inv.customerPurchaseCount || 0}
                    </td>

                    <td>
                      {formatCurrency(
                        inv.customerPurchaseRecoveryAmount
                      )}
                    </td>

                    <td>
                      {formatCurrency(
                        inv.shoppingAssistanceFee
                      )}
                    </td>

                    <td>{formatCurrency(inv.subtotal)}</td>
                    <td>{formatCurrency(inv.customsDuty)}</td>
                    <td>{formatCurrency(inv.gct)}</td>
                    <td>{formatCurrency(inv.processingFee)}</td>
                    <td>{formatCurrency(inv.deliveryFee)}</td>
                    <td>{inv.deliveryType || "—"}</td>
                    <td>{formatCurrency(inv.otherAdjustment)}</td>
                    <td>{formatCurrency(inv.pointsRedeemed)}</td>
                    <td style={{ fontWeight: "bold" }}>
                     {formatCurrency(inv.finalTotal)}
                    </td>
                    <td>{statusBadge(inv.status)}</td>
                    <td>{formatDate(inv.createdAt)}</td>
                    <td>
                      {inv.paidDate ? formatDate(inv.paidDate) : "Not paid yet"}
                    </td>

                    <td>
                      <div
                        style={{
                          display: "grid",
                          gap: "8px",
                          minWidth: "320px",
                        }}
                      >
                        <input
                          type="text"
                          placeholder="Paste Fygaro payment link"
                          value={paymentLinkByInvoice[inv.invoiceNumber] || ""}
                          onChange={(e) =>
                            handlePaymentLinkChange(
                              inv.invoiceNumber,
                              e.target.value
                            )
                          }
                          disabled={inv.status === "Paid"}
                          style={{
                            padding: "10px",
                            borderRadius: "8px",
                            border: `1px solid ${BORDER}`,
                            backgroundColor:
                              inv.status === "Paid" ? "#f8fafc" : WHITE,
                          }}
                        />

                        <button
                          onClick={() => savePaymentLink(inv.invoiceNumber)}
                          disabled={inv.status === "Paid"}
                          style={{
                            backgroundColor:
                              inv.status === "Paid" ? "#94a3b8" : ROYAL_BLUE,
                            color: WHITE,
                            border: "none",
                            padding: "9px 12px",
                            borderRadius: "8px",
                            cursor:
                              inv.status === "Paid"
                                ? "not-allowed"
                                : "pointer",
                            fontWeight: "bold",
                          }}
                        >
                          Save Link
                        </button>
                      </div>
                    </td>

                    <td>
                      <select
                        value={selectedAccountByInvoice[inv.invoiceNumber] || ""}
                        onChange={(e) =>
                          handleAccountChange(inv.invoiceNumber, e.target.value)
                        }
                        disabled={inv.status === "Paid"}
                        style={{
                          padding: "10px",
                          minWidth: "240px",
                          borderRadius: "8px",
                          border: `1px solid ${BORDER}`,
                          backgroundColor:
                            inv.status === "Paid" ? "#f8fafc" : WHITE,
                        }}
                      >
                        <option value="">Select Account</option>
                        {accounts.map((account) => (
                          <option
                            key={account._id}
                            value={account.accountNumber}
                          >
                            {account.accountName} ({account.accountType})
                          </option>
                        ))}
                      </select>
                    </td>

                    <td>
                      <div
                        style={{
    position: "sticky",
    right: 0,
    backgroundColor: WHITE,
    zIndex: 4,
    boxShadow: "-4px 0 8px rgba(15,23,42,0.08)",
  }}
>
                        <button
  onClick={() => setSelectedChargeInvoice(inv)}
  disabled={inv.status === "Paid"}
  style={{
    ...actionButtonStyle,
    backgroundColor: inv.status === "Paid" ? "#94a3b8" : "#7c3aed",
    cursor: inv.status === "Paid" ? "not-allowed" : "pointer",
  }}
>
  Edit Charges
</button>

                      <button
  onClick={() => applyPointsToInvoice(inv.invoiceNumber)}
  disabled={inv.status === "Paid"}
  style={{
    ...actionButtonStyle,
    backgroundColor: inv.status === "Paid" ? "#94a3b8" : ROYAL_BLUE,
    cursor: inv.status === "Paid" ? "not-allowed" : "pointer",
  }}
>
  Apply EK Points
</button>
                        <button
                          onClick={() => markInvoicePaid(inv.invoiceNumber)}
                          disabled={inv.status === "Paid"}
                          style={{
                            ...actionButtonStyle,
                            backgroundColor:
                              inv.status === "Paid" ? "#94a3b8" : "#16a34a",
                            cursor:
                              inv.status === "Paid"
                                ? "not-allowed"
                                : "pointer",
                          }}
                        >
                          Mark Paid
                        </button>

                        <button
                          onClick={() => downloadInvoicePdf(inv)}
                          style={{
                            ...actionButtonStyle,
                            backgroundColor: GOLD,
                            color: "#1e293b",
                          }}
                        >
                          Download PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="17"
                    style={{
                      textAlign: "center",
                      padding: "20px",
                      color: MUTED,
                    }}
                  >
                    No invoices found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

            <div style={{ marginTop: "15px" }}>{paginationControls}</div>

      {selectedChargeInvoice && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      backgroundColor: "rgba(15,23,42,0.7)",
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
        maxWidth: "520px",
        backgroundColor: WHITE,
        borderRadius: "18px",
        padding: "24px",
        border: `1px solid ${BORDER}`,
        boxShadow: "0 25px 60px rgba(0,0,0,0.25)",
      }}
    >
      <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>
        Invoice Charge Adjustments
      </h2>

      <p style={{ color: MUTED, marginTop: 0 }}>
        {selectedChargeInvoice.invoiceNumber}
      </p>

      <div style={{ display: "grid", gap: "10px", marginTop: "18px" }}>
        <label style={{ fontWeight: "bold", color: "#334155" }}>
          Customs Duty
        </label>
        <input
          type="number"
          value={chargeFormByInvoice[selectedChargeInvoice.invoiceNumber]?.customsDuty ?? 0}
          onChange={(e) =>
            handleChargeChange(selectedChargeInvoice.invoiceNumber, "customsDuty", e.target.value)
          }
          style={{ padding: "12px", borderRadius: "10px", border: `1px solid ${BORDER}` }}
        />

        <label style={{ fontWeight: "bold", color: "#334155" }}>
          GCT
        </label>
        <input
          type="number"
          value={chargeFormByInvoice[selectedChargeInvoice.invoiceNumber]?.gct ?? 0}
          onChange={(e) =>
            handleChargeChange(selectedChargeInvoice.invoiceNumber, "gct", e.target.value)
          }
          style={{ padding: "12px", borderRadius: "10px", border: `1px solid ${BORDER}` }}
        />

        <label style={{ fontWeight: "bold", color: "#334155" }}>
          Processing Fee
        </label>
        <input
          type="number"
          value={chargeFormByInvoice[selectedChargeInvoice.invoiceNumber]?.processingFee ?? 0}
          onChange={(e) =>
            handleChargeChange(selectedChargeInvoice.invoiceNumber, "processingFee", e.target.value)
          }
          style={{ padding: "12px", borderRadius: "10px", border: `1px solid ${BORDER}` }}
        />

        <label style={{ fontWeight: "bold", color: "#334155" }}>
  Delivery Fee
</label>
<input
  type="number"
  value={chargeFormByInvoice[selectedChargeInvoice.invoiceNumber]?.deliveryFee ?? 0}
  onChange={(e) =>
    handleChargeChange(selectedChargeInvoice.invoiceNumber, "deliveryFee", e.target.value)
  }
  style={{ padding: "12px", borderRadius: "10px", border: `1px solid ${BORDER}` }}
/>

<label style={{ fontWeight: "bold", color: "#334155" }}>
  Delivery Type
</label>
<select
  value={chargeFormByInvoice[selectedChargeInvoice.invoiceNumber]?.deliveryType ?? ""}
  onChange={(e) =>
    handleChargeChange(selectedChargeInvoice.invoiceNumber, "deliveryType", e.target.value)
  }
  style={{ padding: "12px", borderRadius: "10px", border: `1px solid ${BORDER}` }}
>
  <option value="">Select delivery type</option>
  <option value="Pickup">Pickup</option>
  <option value="Local Delivery">Local Delivery</option>
  <option value="Out of Town Delivery">Out of Town Delivery</option>
  <option value="Driver Delivery">Driver Delivery</option>
</select>

        <label style={{ fontWeight: "bold", color: "#334155" }}>
          Other Adjustment
        </label>
        <input
          type="number"
          value={chargeFormByInvoice[selectedChargeInvoice.invoiceNumber]?.otherAdjustment ?? 0}
          onChange={(e) =>
            handleChargeChange(selectedChargeInvoice.invoiceNumber, "otherAdjustment", e.target.value)
          }
          style={{ padding: "12px", borderRadius: "10px", border: `1px solid ${BORDER}` }}
        />

        <label style={{ fontWeight: "bold", color: "#334155" }}>
          Adjustment Note
        </label>
        <textarea
          rows="4"
          value={chargeFormByInvoice[selectedChargeInvoice.invoiceNumber]?.adjustmentNote ?? ""}
          onChange={(e) =>
            handleChargeChange(selectedChargeInvoice.invoiceNumber, "adjustmentNote", e.target.value)
          }
          style={{
            padding: "12px",
            borderRadius: "10px",
            border: `1px solid ${BORDER}`,
            resize: "vertical",
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "10px",
          marginTop: "22px",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={() => setSelectedChargeInvoice(null)}
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
          Close
        </button>

        <button
          onClick={async () => {
            await saveInvoiceCharges(selectedChargeInvoice.invoiceNumber);
            setSelectedChargeInvoice(null);
          }}
          style={{
            backgroundColor: "#7c3aed",
            color: WHITE,
            border: "none",
            padding: "10px 16px",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Save Charges
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}

export default Invoices;