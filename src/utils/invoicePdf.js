import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";

export const buildInvoicePdf = (inv) => {
  const doc = new jsPDF("p", "mm", "a4");
  const blue = [11, 61, 145];
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  let y = 32;

  const money = (value) =>
    `JMD ${Number(value || 0).toLocaleString("en-JM", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const date = (value) =>
    value ? String(value).slice(0, 10) : "-";

  const header = () => {
    doc.setFillColor(...blue);
    doc.rect(0, 0, width, 23, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text("ELTHAM KONNECT", 15, 13);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Your Konnection, Our Priority", 15, 19);

    doc.setDrawColor(241, 90, 36);
    doc.setLineWidth(1);
    doc.line(15, 26, width - 15, 26);
  };

  const table = (head, body, options = {}) => {
    if (y > height - 40) {
      doc.addPage();
      y = 32;
    }

    autoTable(doc, {
      startY: y,
      margin: {
        top: 32,
        bottom: 20,
        left: 15,
        right: 15,
      },
      head: [head],
      body,
      theme: "striped",
      styles: {
        font: "helvetica",
        fontSize: 9,
        cellPadding: 3,
        overflow: "linebreak",
        textColor: [15, 23, 42],
      },
      headStyles: {
        fillColor: blue,
        textColor: 255,
      },
      alternateRowStyles: {
        fillColor: [244, 247, 251],
      },
      rowPageBreak: "avoid",
      showHead: "everyPage",
      willDrawPage: header,
      ...options,
    });

    y = doc.lastAutoTable.finalY + 8;
  };

  const legalName =
    inv.entitySnapshot?.legalName ||
    inv.businessEntitySnapshot?.legalName ||
    "Eltham Konnect";

  table(
    ["INVOICE", "Details"],
    [
      ["Invoice number", inv.invoiceNumber || "-"],
      ["Business", legalName],
      ["Date issued", date(inv.createdAt)],
      ["Customer", inv.customerName || "-"],
      ["EKON ID", inv.customerEkonId || "-"],
      ["Invoice source", inv.invoiceSource || "Packages"],
      ["Status", inv.status || "-"],
      ["Paid date", date(inv.paidDate || inv.paidAt)],
    ],
    {
      columnStyles: {
        0: { cellWidth: 45 },
      },
    }
  );

  if (inv.packages?.length) {
    table(
      ["Package tracking", "Billed weight (lb)", "Freight amount"],
      inv.packages.map((pkg) => [
        pkg.trackingNumber || "-",
        String(pkg.chargeableWeight ?? "-"),
        money(pkg.rate),
      ]),
      {
        columnStyles: {
          0: { cellWidth: 90 },
          2: { halign: "right" },
        },
      }
    );
  }

  if (inv.customerPurchases?.length) {
    table(
      ["Customer purchase", "Merchant", "Tracking"],
      inv.customerPurchases.map((purchase) => [
        purchase.purchaseNumber || "-",
        purchase.merchant || "-",
        purchase.trackingNumber || "-",
      ])
    );
  }

  if (inv.storageFeeLines?.length) {
    table(
      ["Storage tracking", "From", "Through", "Days", "Storage amount"],
      inv.storageFeeLines.map((line) => [
        line.trackingNumber || "-",
        date(line.fromDate),
        date(line.throughDate),
        String(line.chargeableDays ?? "-"),
        money(line.amount),
      ]),
      {
        columnStyles: {
          0: { cellWidth: 65 },
          1: { cellWidth: 27 },
          2: { cellWidth: 27 },
          3: { cellWidth: 15 },
          4: { halign: "right" },
        },
      }
    );
  }

  const charges = [];

  if (Number(inv.customerPurchaseRecoveryAmount || 0) !== 0) {
    charges.push([
      "Customer purchase recovery",
      money(inv.customerPurchaseRecoveryAmount),
    ]);
  }

  charges.push(
    ["Shipping / freight subtotal", money(inv.subtotal)],
    ["Customs duty", money(inv.customsDuty)],
    ["GCT", money(inv.gct)],
    [
      inv.invoiceSource === "Customer Purchases"
        ? "Shopping assistance fee"
        : "Processing fee",
      money(inv.processingFee),
    ],
    ["Delivery fee", money(inv.deliveryFee)],
    ["Other adjustment", money(inv.otherAdjustment)],
    ["Storage fee", money(inv.storageFeeTotal)],
    ["EK points redeemed", `- ${money(inv.pointsRedeemed)}`]
  );

  if (Number(inv.posDiscountAmount || 0) > 0) {
    charges.push([
      "POS discount",
      `- ${money(inv.posDiscountAmount)}`,
    ]);
  }

  charges.push(["FINAL TOTAL", money(inv.finalTotal)]);

  table(["Charges", "Amount"], charges, {
    columnStyles: {
      0: { cellWidth: 120 },
      1: { halign: "right" },
    },
    didParseCell: (data) => {
      if (
        data.section === "body" &&
        data.row.index === charges.length - 1
      ) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = [238, 244, 255];
      }
    },
  });

  const total = Number(inv.finalTotal || 0);
  const paid =
    Number(inv.amountPaid || 0) ||
    (inv.status === "Paid" ? total : 0);

  table(
    ["Payment details", "Value"],
    [
      ["Amount paid", money(paid)],
      ["Balance due", money(Math.max(0, total - paid))],
      ["Payment terms", inv.paymentTerms || "Due on Receipt"],
      [
        "Payment link",
        inv.paymentLink ||
          "Contact Eltham Konnect for payment details.",
      ],
    ],
    {
      columnStyles: {
        0: { cellWidth: 45 },
      },
    }
  );

  const notes = [];

  if (inv.adjustmentNote) {
    notes.push([inv.adjustmentNote]);
  }

  if (inv.storageFeeLines?.length) {
    notes.push([
      "Storage amounts cover only the dates listed above. Later storage days may be invoiced separately.",
    ]);
  }

  notes.push(["Thank you for shipping with Eltham Konnect."]);
  table(["Notes"], notes);

  const pages = doc.getNumberOfPages();

  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Page ${page} of ${pages}`,
      width - 15,
      height - 10,
      { align: "right" }
    );
  }

  return doc;
};