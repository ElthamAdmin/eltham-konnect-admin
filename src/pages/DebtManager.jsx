import { useEffect, useMemo, useState } from "react";
import api from "../api";

function DebtManager() {
  const [debts, setDebts] = useState([]);
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [editingDebt, setEditingDebt] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    debtName: "",
    debtType: "Loan",
    lenderName: "",
    startingBalance: "",
    currentBalance: "",
    monthlyPayment: "",
    interestRate: "",
    dueDay: "",
    startDate: "",
    targetPayoffDate: "",
    notes: "",
  });

  const ROYAL_BLUE = "#0B3D91";
  const GOLD = "#D4AF37";
  const WHITE = "#ffffff";
  const BORDER = "#dbe3ef";
  const MUTED = "#64748b";

  const fetchDebtData = async () => {
    try {
      const res = await api.get("/api/debt-manager");
      setDebts(res.data?.data?.debts || []);
      setPayments(res.data?.data?.payments || []);
      setSummary(res.data?.data?.summary || {});
    } catch (error) {
      console.error("Error loading debt manager:", error);
      alert(error?.response?.data?.message || "Could not load debt manager.");
    }
  };

  useEffect(() => {
    fetchDebtData();
  }, []);

  const resetForm = () => {
    setFormData({
      debtName: "",
      debtType: "Loan",
      lenderName: "",
      startingBalance: "",
      currentBalance: "",
      monthlyPayment: "",
      interestRate: "",
      dueDay: "",
      startDate: "",
      targetPayoffDate: "",
      notes: "",
    });
    setEditingDebt(null);
    setShowForm(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const saveDebt = async () => {
    try {
      if (!formData.debtName) {
        alert("Debt name is required.");
        return;
      }

      if (editingDebt) {
        await api.put(`/api/debt-manager/${editingDebt.debtNumber}`, formData);
        alert("Debt account updated successfully.");
      } else {
        await api.post("/api/debt-manager", formData);
        alert("Debt account created successfully.");
      }

      resetForm();
      await fetchDebtData();
    } catch (error) {
      console.error("Error saving debt:", error);
      alert(error?.response?.data?.message || "Could not save debt account.");
    }
  };

  const editDebt = (debt) => {
    setEditingDebt(debt);
    setFormData({
      debtName: debt.debtName || "",
      debtType: debt.debtType || "Loan",
      lenderName: debt.lenderName || "",
      startingBalance: debt.startingBalance || "",
      currentBalance: debt.currentBalance || "",
      monthlyPayment: debt.monthlyPayment || "",
      interestRate: debt.interestRate || "",
      dueDay: debt.dueDay || "",
      startDate: debt.startDate || "",
      targetPayoffDate: debt.targetPayoffDate || "",
      notes: debt.notes || "",
      status: debt.status || "Active",
    });
    setShowForm(true);
  };

  const recordPayment = async (debt) => {
    const amountPaid = prompt(`Enter payment amount for ${debt.debtName}:`, "");

    if (!amountPaid) return;

    const paymentDate = prompt("Enter payment date YYYY-MM-DD, or leave blank for today:", "");
    const paidFrom = prompt("Paid from which source/account?", "Business Account");
    const notes = prompt("Payment notes, optional:", "");

    try {
      await api.post(`/api/debt-manager/${debt.debtNumber}/payments`, {
        amountPaid: Number(amountPaid),
        paymentDate,
        paidFrom,
        notes,
      });

      alert("Debt payment recorded successfully.");
      await fetchDebtData();
    } catch (error) {
      console.error("Error recording debt payment:", error);
      alert(error?.response?.data?.message || "Could not record payment.");
    }
  };

  const money = (value) => `JMD ${Number(value || 0).toLocaleString()}`;

  const formatDate = (value) => {
    if (!value) return "—";
    try {
      return String(value).slice(0, 10);
    } catch {
      return value;
    }
  };

  const filteredDebts = useMemo(() => {
    return debts.filter((debt) =>
      `${debt.debtNumber} ${debt.debtName} ${debt.debtType} ${debt.lenderName} ${debt.status}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  }, [debts, searchTerm]);

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) =>
      `${payment.paymentNumber} ${payment.debtNumber} ${payment.debtName} ${payment.amountPaid} ${payment.paymentDate} ${payment.paidFrom}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  }, [payments, searchTerm]);

  const progressWidth = Math.min(100, Math.max(0, Number(summary.payoffProgress || 0)));

  const statusBadge = (status) => {
    const color =
      status === "Paid Off"
        ? "#16a34a"
        : status === "Paused"
        ? "#f59e0b"
        : "#0B3D91";

    return (
      <span
        style={{
          backgroundColor: color,
          color: WHITE,
          padding: "5px 10px",
          borderRadius: "999px",
          fontWeight: "bold",
          fontSize: "12px",
          whiteSpace: "nowrap",
        }}
      >
        {status}
      </span>
    );
  };

  const cardStyle = {
    backgroundColor: WHITE,
    border: `1px solid ${BORDER}`,
    borderRadius: "12px",
    padding: "18px",
    boxShadow: "0 2px 8px rgba(15,23,42,0.04)",
  };

  const buttonStyle = {
    border: "none",
    padding: "8px 12px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
  };

  return (
    <div>
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
          <h1 style={{ margin: 0 }}>Debt Manager</h1>
          <p style={{ margin: "6px 0 0", color: MUTED }}>
            Standalone debt repayment tracker for loans, credit cards, and future business financing.
          </p>
        </div>

        <button
          onClick={() => {
            if (showForm && !editingDebt) {
              setShowForm(false);
            } else {
              setEditingDebt(null);
              setShowForm(!showForm);
            }
          }}
          style={{
            ...buttonStyle,
            backgroundColor: ROYAL_BLUE,
            color: WHITE,
            padding: "10px 16px",
          }}
        >
          {showForm ? "Close Form" : "+ Add Debt"}
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
          gap: "14px",
          marginBottom: "18px",
        }}
      >
        <div style={cardStyle}>
          <h2 style={{ margin: 0, color: ROYAL_BLUE }}>
            {money(summary.totalCurrentDebt)}
          </h2>
          <p style={{ marginBottom: 0, fontWeight: "bold" }}>Current Debt</p>
        </div>

        <div style={cardStyle}>
          <h2 style={{ margin: 0, color: "#dc2626" }}>
            {money(summary.totalStartingDebt)}
          </h2>
          <p style={{ marginBottom: 0, fontWeight: "bold" }}>Starting Debt</p>
        </div>

        <div style={cardStyle}>
          <h2 style={{ margin: 0, color: "#16a34a" }}>
            {money(summary.totalPaid)}
          </h2>
          <p style={{ marginBottom: 0, fontWeight: "bold" }}>Total Paid</p>
        </div>

        <div style={cardStyle}>
          <h2 style={{ margin: 0, color: GOLD }}>
            {money(summary.monthlyRequired)}
          </h2>
          <p style={{ marginBottom: 0, fontWeight: "bold" }}>Monthly Required</p>
        </div>
      </div>

      <div style={{ ...cardStyle, marginBottom: "18px" }}>
        <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>Payoff Progress</h2>

        <div
          style={{
            height: "22px",
            backgroundColor: "#e5e7eb",
            borderRadius: "999px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progressWidth}%`,
              backgroundColor: "#16a34a",
              borderRadius: "999px",
              transition: "width 0.3s ease",
            }}
          />
        </div>

        <p style={{ fontWeight: "bold", marginBottom: 0 }}>
          {progressWidth}% paid down
        </p>
      </div>

      {showForm && (
        <div style={{ ...cardStyle, marginBottom: "20px" }}>
          <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>
            {editingDebt ? "Edit Debt Account" : "New Debt Account"}
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
              gap: "14px",
            }}
          >
            <input name="debtName" placeholder="Debt Name" value={formData.debtName} onChange={handleChange} style={inputStyle(BORDER)} />

            <select name="debtType" value={formData.debtType} onChange={handleChange} style={inputStyle(BORDER)}>
              <option value="Loan">Loan</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Vehicle Loan">Vehicle Loan</option>
              <option value="Equipment Financing">Equipment Financing</option>
              <option value="Business Expansion">Business Expansion</option>
              <option value="Other">Other</option>
            </select>

            <input name="lenderName" placeholder="Lender / Bank Name" value={formData.lenderName} onChange={handleChange} style={inputStyle(BORDER)} />
            <input type="number" name="startingBalance" placeholder="Starting Balance" value={formData.startingBalance} onChange={handleChange} style={inputStyle(BORDER)} />
            <input type="number" name="currentBalance" placeholder="Current Balance, optional" value={formData.currentBalance} onChange={handleChange} style={inputStyle(BORDER)} />
            <input type="number" name="monthlyPayment" placeholder="Monthly Payment" value={formData.monthlyPayment} onChange={handleChange} style={inputStyle(BORDER)} />
            <input type="number" name="interestRate" placeholder="Interest Rate %" value={formData.interestRate} onChange={handleChange} style={inputStyle(BORDER)} />
            <input type="number" name="dueDay" placeholder="Due Day e.g. 15" value={formData.dueDay} onChange={handleChange} style={inputStyle(BORDER)} />
            <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} style={inputStyle(BORDER)} />
            <input type="date" name="targetPayoffDate" value={formData.targetPayoffDate} onChange={handleChange} style={inputStyle(BORDER)} />

            {editingDebt && (
              <select name="status" value={formData.status || "Active"} onChange={handleChange} style={inputStyle(BORDER)}>
                <option value="Active">Active</option>
                <option value="Paid Off">Paid Off</option>
                <option value="Paused">Paused</option>
              </select>
            )}

            <textarea
              name="notes"
              placeholder="Notes"
              value={formData.notes}
              onChange={handleChange}
              style={{
                ...inputStyle(BORDER),
                minHeight: "90px",
                gridColumn: "1 / -1",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "16px", flexWrap: "wrap" }}>
            <button onClick={saveDebt} style={{ ...buttonStyle, backgroundColor: "#16a34a", color: WHITE }}>
              {editingDebt ? "Update Debt" : "Save Debt"}
            </button>

            <button onClick={resetForm} style={{ ...buttonStyle, backgroundColor: "#64748b", color: WHITE }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={{ ...cardStyle, marginBottom: "18px" }}>
        <input
          type="text"
          placeholder="Search debts or payments"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: "100%", ...inputStyle(BORDER) }}
        />
      </div>

      <div style={{ ...cardStyle, marginBottom: "20px" }}>
        <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>Debt Accounts</h2>

        <div
          style={{
            overflowX: "auto",
            overflowY: "auto",
            maxHeight: "70vh",
            border: `1px solid ${BORDER}`,
            borderRadius: "12px",
          }}
        >
          <table
            border="1"
            cellPadding="10"
            style={{
              minWidth: "1500px",
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
                <th>Debt No.</th>
                <th>Name</th>
                <th>Type</th>
                <th>Lender</th>
                <th>Starting Balance</th>
                <th>Current Balance</th>
                <th>Monthly Payment</th>
                <th>Interest</th>
                <th>Due Day</th>
                <th>Target Payoff</th>
                <th>Status</th>
                <th
                  style={{
                    position: "sticky",
                    right: 0,
                    backgroundColor: "#eef4ff",
                    zIndex: 6,
                    minWidth: "180px",
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredDebts.length > 0 ? (
                filteredDebts.map((debt) => (
                  <tr key={debt._id}>
                    <td>{debt.debtNumber}</td>
                    <td>{debt.debtName}</td>
                    <td>{debt.debtType}</td>
                    <td>{debt.lenderName || "—"}</td>
                    <td>{money(debt.startingBalance)}</td>
                    <td>{money(debt.currentBalance)}</td>
                    <td>{money(debt.monthlyPayment)}</td>
                    <td>{Number(debt.interestRate || 0)}%</td>
                    <td>{debt.dueDay || "—"}</td>
                    <td>{formatDate(debt.targetPayoffDate)}</td>
                    <td>{statusBadge(debt.status)}</td>
                    <td
                      style={{
                        position: "sticky",
                        right: 0,
                        backgroundColor: WHITE,
                        zIndex: 4,
                        minWidth: "180px",
                        boxShadow: "-4px 0 8px rgba(15,23,42,0.08)",
                      }}
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <button onClick={() => recordPayment(debt)} style={{ ...buttonStyle, backgroundColor: "#16a34a", color: WHITE }}>
                          Record Payment
                        </button>
                        <button onClick={() => editDebt(debt)} style={{ ...buttonStyle, backgroundColor: ROYAL_BLUE, color: WHITE }}>
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="12" style={{ textAlign: "center", color: MUTED }}>
                    No debt accounts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={cardStyle}>
        <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>Payment History</h2>

        <div
          style={{
            overflowX: "auto",
            overflowY: "auto",
            maxHeight: "55vh",
            border: `1px solid ${BORDER}`,
            borderRadius: "12px",
          }}
        >
          <table
            border="1"
            cellPadding="10"
            style={{
              minWidth: "1000px",
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
                <th>Payment No.</th>
                <th>Debt</th>
                <th>Amount Paid</th>
                <th>Payment Date</th>
                <th>Paid From</th>
                <th>Notes</th>
              </tr>
            </thead>

            <tbody>
              {filteredPayments.length > 0 ? (
                filteredPayments.map((payment) => (
                  <tr key={payment._id}>
                    <td>{payment.paymentNumber}</td>
                    <td>{payment.debtName}</td>
                    <td>{money(payment.amountPaid)}</td>
                    <td>{formatDate(payment.paymentDate)}</td>
                    <td>{payment.paidFrom || "—"}</td>
                    <td>{payment.notes || "—"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", color: MUTED }}>
                    No debt payments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function inputStyle(border) {
  return {
    padding: "10px",
    borderRadius: "8px",
    border: `1px solid ${border}`,
  };
}

export default DebtManager;