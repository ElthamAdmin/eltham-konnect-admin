import { useEffect, useMemo, useState } from "react";
import api from "../api";

function GeneralLedger() {
  const [transactions, setTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const ROYAL_BLUE = "#0B3D91";
  const WHITE = "#ffffff";
  const BORDER = "#dbe3ef";
  const MUTED = "#64748b";

  const fetchLedger = async () => {
    try {
      const res = await api.get("/api/general-ledger");
      setTransactions(res.data.data || []);
    } catch (error) {
      console.error("Error loading general ledger:", error);
      alert(error?.response?.data?.message || "Could not load general ledger.");
    }
  };

  useEffect(() => {
    fetchLedger();
  }, []);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((item) =>
      `${item.ledgerNumber} ${item.entryNumber} ${item.entryDate} ${item.accountCode} ${item.accountName} ${item.accountCategory} ${item.reference} ${item.sourceModule} ${item.memo} ${item.description}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  }, [transactions, searchTerm]);

  const totals = useMemo(() => {
    return filteredTransactions.reduce(
      (sum, item) => ({
        debit: sum.debit + Number(item.debit || 0),
        credit: sum.credit + Number(item.credit || 0),
      }),
      { debit: 0, credit: 0 }
    );
  }, [filteredTransactions]);

  const money = (value) => `JMD ${Number(value || 0).toLocaleString()}`;

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ margin: 0 }}>General Ledger</h1>
        <p style={{ margin: "6px 0 0", color: MUTED }}>
          Corporate accounting ledger showing every posted debit and credit.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "14px",
          marginBottom: "18px",
        }}
      >
        <div style={cardStyle(BORDER, WHITE)}>
          <h2 style={{ margin: 0, color: ROYAL_BLUE }}>{filteredTransactions.length}</h2>
          <p style={{ marginBottom: 0, fontWeight: "bold" }}>Ledger Lines</p>
        </div>

        <div style={cardStyle(BORDER, WHITE)}>
          <h2 style={{ margin: 0, color: "#16a34a" }}>{money(totals.debit)}</h2>
          <p style={{ marginBottom: 0, fontWeight: "bold" }}>Total Debits</p>
        </div>

        <div style={cardStyle(BORDER, WHITE)}>
          <h2 style={{ margin: 0, color: "#dc2626" }}>{money(totals.credit)}</h2>
          <p style={{ marginBottom: 0, fontWeight: "bold" }}>Total Credits</p>
        </div>
      </div>

      <div style={{ ...cardStyle(BORDER, WHITE), marginBottom: "16px" }}>
        <input
          placeholder="Search ledger by account, entry number, reference, memo, or source module"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: "8px",
            border: `1px solid ${BORDER}`,
          }}
        />
      </div>

      <div style={cardStyle(BORDER, WHITE)}>
        <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>Ledger Transactions</h2>

        <div
          style={{
            overflowX: "auto",
            overflowY: "auto",
            maxHeight: "72vh",
            border: `1px solid ${BORDER}`,
            borderRadius: "12px",
          }}
        >
          <table
            border="1"
            cellPadding="10"
            style={{
              minWidth: "1600px",
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
                <th>Date</th>
                <th>Ledger No.</th>
                <th>Journal Entry</th>
                <th>Account Code</th>
                <th>Account Name</th>
                <th>Category</th>
                <th>Debit</th>
                <th>Credit</th>
                <th>Running Balance</th>
                <th>Reference</th>
                <th>Source</th>
                <th>Memo</th>
                <th>Description</th>
              </tr>
            </thead>

            <tbody>
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((item) => (
                  <tr key={item._id}>
                    <td>{item.entryDate}</td>
                    <td>{item.ledgerNumber}</td>
                    <td>{item.entryNumber}</td>
                    <td style={{ fontWeight: "bold" }}>{item.accountCode}</td>
                    <td>{item.accountName}</td>
                    <td>{item.accountCategory}</td>
                    <td>{Number(item.debit || 0) > 0 ? money(item.debit) : "—"}</td>
                    <td>{Number(item.credit || 0) > 0 ? money(item.credit) : "—"}</td>
                    <td style={{ fontWeight: "bold" }}>{money(item.runningBalance)}</td>
                    <td>{item.reference || "—"}</td>
                    <td>{item.sourceModule || "—"}</td>
                    <td>{item.memo || "—"}</td>
                    <td style={{ maxWidth: "280px", color: MUTED }}>
                      {item.description || "—"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="13" style={{ textAlign: "center", color: MUTED }}>
                    No general ledger transactions found.
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

function cardStyle(border, white) {
  return {
    backgroundColor: white,
    border: `1px solid ${border}`,
    borderRadius: "12px",
    padding: "18px",
    boxShadow: "0 2px 8px rgba(15,23,42,0.04)",
  };
}

export default GeneralLedger;