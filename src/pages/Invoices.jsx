import { useEffect, useMemo, useState } from "react";
import api from "../api";

function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountByInvoice, setSelectedAccountByInvoice] = useState({});
  const [paymentLinkByInvoice, setPaymentLinkByInvoice] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize]);

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

  const paginationControls = (
    <div
      style={{
        backgroundColor: "white",
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "12px 15px",
        marginBottom: "15px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "12px",
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
        <strong>
          Showing {filteredInvoices.length === 0 ? 0 : startIndex + 1} to{" "}
          {Math.min(endIndex, filteredInvoices.length)} of {filteredInvoices.length}
        </strong>

        <select
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
          style={{
            padding: "8px 10px",
            borderRadius: "6px",
            border: "1px solid #ccc",
          }}
        >
          <option value={10}>10 per page</option>
          <option value={25}>25 per page</option>
          <option value={50}>50 per page</option>
          <option value={100}>100 per page</option>
        </select>
      </div>

      <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={safeCurrentPage === 1}
          style={{
            backgroundColor: safeCurrentPage === 1 ? "#94a3b8" : "#0B3D91",
            color: "white",
            border: "none",
            padding: "8px 12px",
            borderRadius: "6px",
            cursor: safeCurrentPage === 1 ? "not-allowed" : "pointer",
          }}
        >
          Previous
        </button>

        <span style={{ fontWeight: "bold" }}>
          Page {safeCurrentPage} of {totalPages}
        </span>

        <button
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={safeCurrentPage === totalPages}
          style={{
            backgroundColor: safeCurrentPage === totalPages ? "#94a3b8" : "#0B3D91",
            color: "white",
            border: "none",
            padding: "8px 12px",
            borderRadius: "6px",
            cursor: safeCurrentPage === totalPages ? "not-allowed" : "pointer",
          }}
        >
          Next
        </button>
      </div>
    </div>
  );

  return (
    <div>
      <h1>Invoices</h1>

      <input
        type="text"
        placeholder="Search by invoice number, customer, EKON ID, status, or payment link"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{
          width: "100%",
          padding: "12px",
          marginBottom: "15px",
          borderRadius: "6px",
          border: "1px solid #ccc",
        }}
      />

      {paginationControls}

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
              {paginatedInvoices.length > 0 ? (
                paginatedInvoices.map((inv) => (
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

      <div style={{ marginTop: "15px" }}>{paginationControls}</div>
    </div>
  );
}

export default Invoices;