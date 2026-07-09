function LedgerSearchWorkspace({
  selectedStatementLine,
  searchingLedger,
  ledgerSearchResults,
  money,
  manuallyAssignTransaction,
  tableWrap,
  table,
  thead,
  panel,
  button,
  BORDER,
  ROYAL_BLUE,
}) {
  if (!selectedStatementLine) return null;

  return (
    <div style={panel(BORDER)}>
      <h2 style={{ color: ROYAL_BLUE, marginTop: 0 }}>Ledger Search Results</h2>

      <p>
        Statement Line:{" "}
        <strong>{selectedStatementLine.description || "—"}</strong>
      </p>

      {searchingLedger ? (
        <p>Searching ledger...</p>
      ) : ledgerSearchResults.length === 0 ? (
        <p>No matching ledger transactions found.</p>
      ) : (
        <div style={tableWrap(BORDER)}>
          <table border="1" cellPadding="8" style={table(BORDER, "1100px")}>
            <thead style={thead}>
              <tr>
                <th>Transaction</th>
                <th>Date</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Reference</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {ledgerSearchResults.map((transaction) => (
                <tr key={transaction._id}>
                  <td>{transaction.transactionNumber}</td>
                  <td>{String(transaction.transactionDate).slice(0, 10)}</td>
                  <td>{transaction.transactionType}</td>
                  <td>{money(transaction.amount)}</td>
                  <td>{transaction.reference || "—"}</td>
                  <td>
                    <button
                      onClick={() => manuallyAssignTransaction(transaction)}
                      style={button("#16a34a")}
                    >
                      Assign
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default LedgerSearchWorkspace;