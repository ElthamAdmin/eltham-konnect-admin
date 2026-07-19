import { useEffect, useMemo, useState } from "react";
import api from "../api";

const BORDER = "#dbe3ef";
const ROYAL_BLUE = "#0B3D91";
const MUTED = "#64748b";

const jamaicaToday = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Jamaica",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

const money = (value) =>
  `JMD ${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const getAvailableAction = (record) => {
  if (record.status === "Calculated") return "Review";
  if (record.status === "Reviewed") return "Approve";
  if (record.status === "Approved") return "Submit";

  if (
    ["Submitted", "Partially Paid", "Overdue"].includes(record.status) &&
    Number(record.balanceDue || 0) > 0
  ) {
    return "Pay";
  }

  if (
    record.status === "Paid" ||
    (record.status === "Submitted" &&
      Number(record.balanceDue || 0) === 0)
  ) {
    return "Reconcile";
  }

  return "";
};

const actionColor = (action) => {
  if (action === "Review") return "#2563eb";
  if (action === "Approve") return "#16a34a";
  if (action === "Submit") return "#7c3aed";
  if (action === "Pay") return "#d97706";
  if (action === "Reconcile") return "#0f766e";
  return "#64748b";
};

function TaxRecordsWorkflowPanel({
  records = [],
  summary = {},
  onChanged,
}) {
  const [accounts, setAccounts] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [selectedAction, setSelectedAction] = useState("");
  const [processing, setProcessing] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  const [workflowForm, setWorkflowForm] = useState({
    notes: "",
    filingReference: "",
    filingMethod: "TAJ Online",
    filedDate: jamaicaToday(),
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    paymentAccountNumber: "",
    paymentDate: jamaicaToday(),
    paymentMethod: "Online Transfer",
    paymentReference: "",
    receiptUrl: "",
    notes: "",
  });

  const activePaymentAccounts = useMemo(
    () =>
      accounts.filter(
        (account) =>
          account.status === "Active" &&
          String(account.linkedChartAccountCode || "").trim()
      ),
    [accounts]
  );

  useEffect(() => {
    const loadAccounts = async () => {
      try {
        setLoadingAccounts(true);

        const response = await api.get("/api/financial-accounts");
        setAccounts(response.data?.data || []);
      } catch (error) {
        console.error("Financial account loading error:", error);
        setAccounts([]);
      } finally {
        setLoadingAccounts(false);
      }
    };

    loadAccounts();
  }, []);

  const closeActionPanel = () => {
    setSelectedRecord(null);
    setSelectedAction("");

    setWorkflowForm({
      notes: "",
      filingReference: "",
      filingMethod: "TAJ Online",
      filedDate: jamaicaToday(),
    });

    setPaymentForm({
      amount: "",
      paymentAccountNumber: "",
      paymentDate: jamaicaToday(),
      paymentMethod: "Online Transfer",
      paymentReference: "",
      receiptUrl: "",
      notes: "",
    });
  };

  const openActionPanel = (record) => {
    const action = getAvailableAction(record);

    if (!action) return;

    setSelectedRecord(record);
    setSelectedAction(action);

    setWorkflowForm({
      notes: "",
      filingReference: record.filingReference || "",
      filingMethod: record.filingMethod || "TAJ Online",
      filedDate: record.filedDate || jamaicaToday(),
    });

    setPaymentForm({
      amount: Number(record.balanceDue || 0).toFixed(2),
      paymentAccountNumber: "",
      paymentDate: jamaicaToday(),
      paymentMethod: "Online Transfer",
      paymentReference: "",
      receiptUrl: "",
      notes: "",
    });
  };

  const runWorkflowAction = async () => {
    if (!selectedRecord || !selectedAction) return;

    if (
      selectedAction === "Submit" &&
      !workflowForm.filingReference.trim()
    ) {
      alert("A real filing or submission reference is required.");
      return;
    }

    const confirmationMessages = {
      Review: `Mark ${selectedRecord.taxNumber} as Reviewed?`,
      Approve: `Approve ${selectedRecord.taxNumber}?`,
      Submit:
        `Mark ${selectedRecord.taxNumber} as Submitted using filing reference ` +
        `${workflowForm.filingReference}?`,
      Reconcile:
        `Reconcile ${selectedRecord.taxNumber}? This will only succeed if ` +
        "the Tax Center and General Ledger balances agree.",
    };

    if (!window.confirm(confirmationMessages[selectedAction])) {
      return;
    }

    try {
      setProcessing(true);

      const payload = {
        action: selectedAction,
        taxNumbers: [selectedRecord.taxNumber],
        notes: workflowForm.notes.trim(),
      };

      if (selectedAction === "Submit") {
        payload.filingReference =
          workflowForm.filingReference.trim();
        payload.filingMethod =
          workflowForm.filingMethod.trim() || "TAJ Online";
        payload.filedDate = workflowForm.filedDate;
      }

      const response = await api.post(
        "/api/tax-center/records/workflow",
        payload
      );

      alert(
        response.data?.message ||
          `${selectedAction} completed successfully.`
      );

      closeActionPanel();

      if (onChanged) {
        await onChanged();
      }
    } catch (error) {
      console.error("Tax workflow action error:", error);

      alert(
        error?.response?.data?.message ||
          `Could not complete ${selectedAction}.`
      );
    } finally {
      setProcessing(false);
    }
  };

  const recordPayment = async () => {
    if (!selectedRecord) return;

    const amount = Number(paymentForm.amount || 0);

    if (amount <= 0) {
      alert("Payment amount must be greater than zero.");
      return;
    }

    if (amount > Number(selectedRecord.balanceDue || 0)) {
      alert("Payment cannot exceed the outstanding balance.");
      return;
    }

    if (!paymentForm.paymentAccountNumber) {
      alert("Select the real financial account used for payment.");
      return;
    }

    if (!paymentForm.paymentReference.trim()) {
      alert("A real payment confirmation or reference is required.");
      return;
    }

    const selectedAccount = activePaymentAccounts.find(
      (account) =>
        account.accountNumber ===
        paymentForm.paymentAccountNumber
    );

    const confirmed = window.confirm(
      `Record a tax payment of ${money(amount)} from ` +
        `${selectedAccount?.accountName || "the selected account"} ` +
        `for ${selectedRecord.taxNumber}?`
    );

    if (!confirmed) return;

    try {
      setProcessing(true);

      const response = await api.post(
        `/api/tax-center/records/${encodeURIComponent(
          selectedRecord.taxNumber
        )}/pay`,
        {
          amount,
          paymentAccountNumber:
            paymentForm.paymentAccountNumber,
          paymentDate: paymentForm.paymentDate,
          paymentMethod: paymentForm.paymentMethod.trim(),
          paymentReference:
            paymentForm.paymentReference.trim(),
          receiptUrl: paymentForm.receiptUrl.trim(),
          notes: paymentForm.notes.trim(),
        }
      );

      alert(
        response.data?.message ||
          "Tax payment recorded successfully."
      );

      closeActionPanel();

      if (onChanged) {
        await onChanged();
      }
    } catch (error) {
      console.error("Tax payment error:", error);

      alert(
        error?.response?.data?.message ||
          "Could not record the tax payment."
      );
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div style={panel}>
      <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>
        Tax Records
      </h2>

      {selectedRecord && (
        <div style={actionPanel}>
          <div style={actionHeader}>
            <div>
              <strong>
                {selectedAction}: {selectedRecord.taxNumber}
              </strong>

              <div style={helpText}>
                {selectedRecord.taxType} ·{" "}
                {selectedRecord.periodKey ||
                  `${selectedRecord.periodStart} to ${selectedRecord.periodEnd}`}
                {" · "}
                Balance {money(selectedRecord.balanceDue)}
              </div>
            </div>

            <button
              type="button"
              onClick={closeActionPanel}
              disabled={processing}
              style={secondaryButton}
            >
              Close
            </button>
          </div>

          {selectedAction === "Pay" ? (
            <div style={formGrid}>
              <label style={fieldLabel}>
                Payment amount
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  max={selectedRecord.balanceDue}
                  value={paymentForm.amount}
                  onChange={(event) =>
                    setPaymentForm({
                      ...paymentForm,
                      amount: event.target.value,
                    })
                  }
                  style={input}
                />
              </label>

              <label style={fieldLabel}>
                Payment account
                <select
                  value={paymentForm.paymentAccountNumber}
                  onChange={(event) =>
                    setPaymentForm({
                      ...paymentForm,
                      paymentAccountNumber:
                        event.target.value,
                    })
                  }
                  style={input}
                >
                  <option value="">
                    {loadingAccounts
                      ? "Loading accounts..."
                      : "Select payment account"}
                  </option>

                  {activePaymentAccounts.map((account) => (
                    <option
                      key={account.accountNumber}
                      value={account.accountNumber}
                    >
                      {account.accountName} (
                      {account.accountNumber}) —{" "}
                      {money(account.currentBalance)}
                    </option>
                  ))}
                </select>
              </label>

              <label style={fieldLabel}>
                Payment date
                <input
                  type="date"
                  value={paymentForm.paymentDate}
                  onChange={(event) =>
                    setPaymentForm({
                      ...paymentForm,
                      paymentDate: event.target.value,
                    })
                  }
                  style={input}
                />
              </label>

              <label style={fieldLabel}>
                Payment method
                <select
                  value={paymentForm.paymentMethod}
                  onChange={(event) =>
                    setPaymentForm({
                      ...paymentForm,
                      paymentMethod: event.target.value,
                    })
                  }
                  style={input}
                >
                  <option>Online Transfer</option>
                  <option>Bank Transfer</option>
                  <option>Debit Card</option>
                  <option>Credit Card</option>
                  <option>Cheque</option>
                  <option>Cash</option>
                  <option>Other</option>
                </select>
              </label>

              <label style={fieldLabel}>
                Payment confirmation/reference
                <input
                  value={paymentForm.paymentReference}
                  onChange={(event) =>
                    setPaymentForm({
                      ...paymentForm,
                      paymentReference:
                        event.target.value,
                    })
                  }
                  placeholder="Required real reference"
                  style={input}
                />
              </label>

              <label style={fieldLabel}>
                Receipt URL
                <input
                  value={paymentForm.receiptUrl}
                  onChange={(event) =>
                    setPaymentForm({
                      ...paymentForm,
                      receiptUrl: event.target.value,
                    })
                  }
                  placeholder="Optional receipt link"
                  style={input}
                />
              </label>

              <label
                style={{
                  ...fieldLabel,
                  gridColumn: "1 / -1",
                }}
              >
                Payment notes
                <textarea
                  value={paymentForm.notes}
                  onChange={(event) =>
                    setPaymentForm({
                      ...paymentForm,
                      notes: event.target.value,
                    })
                  }
                  style={{ ...input, minHeight: "70px" }}
                />
              </label>

              <button
                type="button"
                onClick={recordPayment}
                disabled={processing}
                style={primaryButton("#d97706")}
              >
                {processing
                  ? "Recording Payment..."
                  : `Record ${money(paymentForm.amount)} Payment`}
              </button>
            </div>
          ) : (
            <div style={formGrid}>
              {selectedAction === "Submit" && (
                <>
                  <label style={fieldLabel}>
                    Filing/submission reference
                    <input
                      value={workflowForm.filingReference}
                      onChange={(event) =>
                        setWorkflowForm({
                          ...workflowForm,
                          filingReference:
                            event.target.value,
                        })
                      }
                      placeholder="Required real reference"
                      style={input}
                    />
                  </label>

                  <label style={fieldLabel}>
                    Filing method
                    <select
                      value={workflowForm.filingMethod}
                      onChange={(event) =>
                        setWorkflowForm({
                          ...workflowForm,
                          filingMethod: event.target.value,
                        })
                      }
                      style={input}
                    >
                      <option>TAJ Online</option>
                      <option>In Person</option>
                      <option>Email</option>
                      <option>Other</option>
                    </select>
                  </label>

                  <label style={fieldLabel}>
                    Filed/submitted date
                    <input
                      type="date"
                      value={workflowForm.filedDate}
                      onChange={(event) =>
                        setWorkflowForm({
                          ...workflowForm,
                          filedDate: event.target.value,
                        })
                      }
                      style={input}
                    />
                  </label>
                </>
              )}

              <label
                style={{
                  ...fieldLabel,
                  gridColumn: "1 / -1",
                }}
              >
                Notes
                <textarea
                  value={workflowForm.notes}
                  onChange={(event) =>
                    setWorkflowForm({
                      ...workflowForm,
                      notes: event.target.value,
                    })
                  }
                  style={{ ...input, minHeight: "70px" }}
                />
              </label>

              <button
                type="button"
                onClick={runWorkflowAction}
                disabled={processing}
                style={primaryButton(
                  actionColor(selectedAction)
                )}
              >
                {processing
                  ? `Processing ${selectedAction}...`
                  : `Confirm ${selectedAction}`}
              </button>
            </div>
          )}
        </div>
      )}

      <div style={tableContainer}>
        <table style={table}>
          <thead style={tableHead}>
            <tr>
              <th style={cell}>Tax No.</th>
              <th style={cell}>Type</th>
              <th style={cell}>Period</th>
              <th style={cell}>Tax Due</th>
              <th style={cell}>Paid</th>
              <th style={cell}>Balance</th>
              <th style={cell}>Due Date</th>
              <th style={cell}>Status</th>
              <th style={cell}>Action</th>
            </tr>
          </thead>

          <tbody>
            {records.length > 0 ? (
              records.map((record) => {
                const availableAction =
                  getAvailableAction(record);

                return (
                  <tr key={record._id || record.taxNumber}>
                    <td style={{ ...cell, fontWeight: "bold" }}>
                      {record.taxNumber}
                    </td>
                    <td style={cell}>{record.taxType}</td>
                    <td style={cell}>
                      {record.periodKey ||
                        `${record.periodStart} to ${record.periodEnd}`}
                    </td>
                    <td style={cell}>{money(record.taxDue)}</td>
                    <td style={cell}>
                      {money(record.amountPaid)}
                    </td>
                    <td style={{ ...cell, fontWeight: "bold" }}>
                      {money(record.balanceDue)}
                    </td>
                    <td style={cell}>
                      {record.dueDate || "—"}
                    </td>
                    <td style={cell}>
                      <span style={statusBadge}>
                        {record.status}
                      </span>
                    </td>
                    <td style={cell}>
                      {availableAction ? (
                        <button
                          type="button"
                          onClick={() =>
                            openActionPanel(record)
                          }
                          style={primaryButton(
                            actionColor(availableAction)
                          )}
                        >
                          {availableAction}
                        </button>
                      ) : (
                        <span style={{ color: MUTED }}>
                          No action
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan="9"
                  style={{
                    ...cell,
                    textAlign: "center",
                    color: MUTED,
                  }}
                >
                  No tax records found for the selected scope.
                </td>
              </tr>
            )}
          </tbody>

          <tfoot style={tableFoot}>
            <tr>
              <td colSpan="3" style={cell}>
                TOTALS
              </td>
              <td style={cell}>
                {money(summary.totalTaxDue)}
              </td>
              <td style={cell}>
                {money(summary.totalPaid)}
              </td>
              <td style={cell}>
                {money(summary.totalBalance)}
              </td>
              <td colSpan="3" style={cell} />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

const panel = {
  backgroundColor: "white",
  border: `1px solid ${BORDER}`,
  borderRadius: "12px",
  padding: "18px",
  marginBottom: "18px",
};

const actionPanel = {
  border: "1px solid #bfdbfe",
  backgroundColor: "#f8fbff",
  borderRadius: "12px",
  padding: "16px",
  marginBottom: "16px",
};

const actionHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "12px",
  marginBottom: "14px",
};

const helpText = {
  color: MUTED,
  fontSize: "13px",
  marginTop: "5px",
};

const formGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "12px",
};

const fieldLabel = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  fontSize: "13px",
  fontWeight: "600",
  color: "#334155",
};

const input = {
  width: "100%",
  boxSizing: "border-box",
  border: `1px solid ${BORDER}`,
  borderRadius: "8px",
  padding: "10px",
  backgroundColor: "white",
};

const tableContainer = {
  overflowX: "auto",
  overflowY: "auto",
  maxHeight: "70vh",
  border: `1px solid ${BORDER}`,
  borderRadius: "12px",
};

const table = {
  minWidth: "1250px",
  width: "100%",
  borderCollapse: "collapse",
};

const tableHead = {
  backgroundColor: "#eef4ff",
  position: "sticky",
  top: 0,
  zIndex: 1,
};

const tableFoot = {
  backgroundColor: "#f8fafc",
  fontWeight: "bold",
};

const cell = {
  border: `1px solid ${BORDER}`,
  padding: "10px",
  textAlign: "left",
  verticalAlign: "top",
};

const statusBadge = {
  display: "inline-block",
  padding: "5px 9px",
  borderRadius: "999px",
  backgroundColor: "#e2e8f0",
  fontSize: "12px",
  fontWeight: "700",
  whiteSpace: "nowrap",
};

const secondaryButton = {
  border: `1px solid ${BORDER}`,
  backgroundColor: "white",
  color: "#334155",
  borderRadius: "8px",
  padding: "8px 12px",
  cursor: "pointer",
  fontWeight: "700",
};

const primaryButton = (color) => ({
  border: "none",
  backgroundColor: color,
  color: "white",
  borderRadius: "8px",
  padding: "9px 13px",
  cursor: "pointer",
  fontWeight: "700",
  whiteSpace: "nowrap",
});

export default TaxRecordsWorkflowPanel;