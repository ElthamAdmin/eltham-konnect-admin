import { useEffect, useState } from "react";
import api from "../api";

function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountByInvoice, setSelectedAccountByInvoice] = useState({});
  const [paymentLinkByInvoice, setPaymentLinkByInvoice] = useState({});

  const fetchInvoices = async () => {
    try {
      const res = await api.get("/api/invoices");
      const invoiceData = res.data.data || [];
      setInvoices(invoiceData);

      const links = {};
      invoiceData.forEach((inv) => {
        links[inv.invoiceNumber] = inv.paymentLink || "";
      });
      setPaymentLinkByInvoice(links);
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
  }, []);

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

  const savePaymentLink = async (invoiceNumber) => {
    try {
      const paymentLink = paymentLinkByInvoice[invoiceNumber] || "";

      const res = await api.put(
        `/api/invoices/${invoiceNumber}/payment-link`,
        { paymentLink }
      );

      alert(res.data.message);
      await fetchInvoices();
    } catch (error) {
      console.error("Error saving payment link:", error);
      alert(error?.response?.data?.message || "Could not save payment link.");
    }
  };

  const markInvoicePaid = async (invoiceNumber) => {
    try {
      const receivingAccountNumber = selectedAccountByInvoice[invoiceNumber];

      if (!receivingAccountNumber) {
        alert("Please select the account that received this payment.");
        return;
      }

      const res = await api.put(
        `/api/invoices/pay/${invoiceNumber}`,
        { receivingAccountNumber }
      );

      alert(res.data.message);
      await fetchInvoices();
    } catch (error) {
      console.error("Error marking invoice paid:", error);
      alert(error?.response?.data?.message || "Could not mark invoice as paid.");
    }
  };

  const formatCurrency = (value) => `JMD ${Number(value || 0).toLocaleString()}`;

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
      status === "Paid" ? "#16a34a" : status === "Unpaid" ? "#dc2626" : "#64748b";

    return (
      <span
        style={{
          padding: "4px 10px",
          borderRadius: "6px",
          color: "white",
          backgroundColor,
        }}
      >
        {status}
      </span>
    );
  };

  return (
    <div>
      <h1>Invoices</h1>

      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "10px",
          border: "1px solid #e5e7eb",
        }}
      >
        <h2>All Invoices</h2>

        <div style={{ overflowX: "auto" }}>
          <table border="1" cellPadding="10" style={{ minWidth: "1900px", width: "100%" }}>
            <thead>
              <tr>
                <th>Invoice Number</th>
                <th>Customer EKON ID</th>
                <th>Customer</th>
                <th>Package Count</th>
                <th>Subtotal</th>
                <th>Points Redeemed</th>
                <th>Final Total</th>
                <th>Status</th>
                <th>Created Date</th>
                <th>Paid Date</th>
                <th>Fygaro Payment Link</th>
                <th>Receive Into Account</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {invoices.length > 0 ? (
                invoices.map((inv) => (
                  <tr key={inv._id}>
                    <td>{inv.invoiceNumber}</td>
                    <td>{inv.customerEkonId}</td>
                    <td>{inv.customerName}</td>
                    <td>{inv.packageCount}</td>
                    <td>{formatCurrency(inv.subtotal)}</td>
                    <td>{inv.pointsRedeemed}</td>
                    <td>{formatCurrency(inv.finalTotal)}</td>
                    <td>{statusBadge(inv.status)}</td>
                    <td>{formatDate(inv.createdAt)}</td>
                    <td>{inv.paidDate ? formatDate(inv.paidDate) : "Not paid yet"}</td>
                    <td>
                      <div style={{ display: "grid", gap: "8px", minWidth: "320px" }}>
                        <input
                          type="text"
                          placeholder="Paste Fygaro payment link"
                          value={paymentLinkByInvoice[inv.invoiceNumber] || ""}
                          onChange={(e) =>
                            handlePaymentLinkChange(inv.invoiceNumber, e.target.value)
                          }
                          disabled={inv.status === "Paid"}
                          style={{ padding: "8px" }}
                        />

                        <button
                          onClick={() => savePaymentLink(inv.invoiceNumber)}
                          disabled={inv.status === "Paid"}
                          style={{
                            backgroundColor: inv.status === "Paid" ? "#999" : "#0B3D91",
                            color: "white",
                            border: "none",
                            padding: "8px 12px",
                            borderRadius: "4px",
                            cursor: inv.status === "Paid" ? "not-allowed" : "pointer",
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
                        style={{ padding: "8px", minWidth: "220px" }}
                      >
                        <option value="">Select Account</option>
                        {accounts.map((account) => (
                          <option key={account._id} value={account.accountNumber}>
                            {account.accountName} ({account.accountType})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button
                        onClick={() => markInvoicePaid(inv.invoiceNumber)}
                        disabled={inv.status === "Paid"}
                        style={{
                          backgroundColor: inv.status === "Paid" ? "#999" : "#16a34a",
                          color: "white",
                          border: "none",
                          padding: "8px 12px",
                          borderRadius: "4px",
                          cursor: inv.status === "Paid" ? "not-allowed" : "pointer",
                        }}
                      >
                        Mark Paid
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="13">No invoices found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Invoices;