function SplitMatchWorkspace({
  splitMatchMode,
  selectedStatementLine,
  selectedSplitTransactions,
  splitSelectedTotal,
  splitDifference,
  saveSplitMatch,
  cancelSplitMatch,
  money,
  summaryGrid,
  Card,
  panel,
  button,
  BORDER,
  ROYAL_BLUE,
}) {
  if (!splitMatchMode || !selectedStatementLine) return null;

  return (
    <div style={panel(BORDER)}>
      <h2 style={{ color: ROYAL_BLUE, marginTop: 0 }}>
        Split Match Summary
      </h2>

      <div style={summaryGrid}>
        <Card>
          <strong>Statement Amount</strong>
          <p>{money(selectedStatementLine.amount || 0)}</p>
        </Card>

        <Card>
          <strong>Selected Ledger Total</strong>
          <p>{money(splitSelectedTotal)}</p>
        </Card>

        <Card>
          <strong>Difference</strong>
          <p
            style={{
              color: Number(splitDifference || 0) === 0 ? "#16a34a" : "#dc2626",
              fontWeight: "bold",
            }}
          >
            {money(splitDifference)}
          </p>
        </Card>

        <Card>
          <strong>Selected Transactions</strong>
          <p>{selectedSplitTransactions.length}</p>
        </Card>
      </div>

      <button
        onClick={saveSplitMatch}
        style={{ ...button("#16a34a"), marginRight: "8px" }}
      >
        Save Split Match
      </button>

      <button onClick={cancelSplitMatch} style={button("#64748b")}>
        Cancel Split
      </button>
    </div>
  );
}

export default SplitMatchWorkspace;