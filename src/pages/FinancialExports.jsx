function FinancialExports() {
 const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "https://eltham-konnect-backend-c2sf.onrender.com";

  const exportFile = (path) => {
    window.open(`${API_BASE}${path}`, "_blank");
  };

  const reports = [
    {
      title: "Trial Balance",
      description: "Export account balances for accounting verification.",
      path: "/api/financial-exports/trial-balance",
    },
    {
      title: "General Ledger",
      description: "Export all posted debit and credit ledger transactions.",
      path: "/api/financial-exports/general-ledger",
    },
    {
      title: "Profit & Loss",
      description: "Export revenue, expenses, and net profit/loss.",
      path: "/api/financial-exports/profit-loss",
    },
  ];

  return (
    <div>
      <h1 style={{ margin: 0 }}>Financial Statement Exports</h1>
      <p style={{ marginTop: "6px", color: "#64748b" }}>
        Download corporate accounting reports for review, accounting, banking, and TAJ preparation.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "16px",
          marginTop: "20px",
        }}
      >
        {reports.map((report) => (
          <div
            key={report.title}
            style={{
              backgroundColor: "white",
              border: "1px solid #dbe3ef",
              borderRadius: "12px",
              padding: "18px",
            }}
          >
            <h2 style={{ marginTop: 0, color: "#0B3D91" }}>{report.title}</h2>

            <p style={{ color: "#64748b", minHeight: "48px" }}>
              {report.description}
            </p>

            <button
              onClick={() => exportFile(report.path)}
              style={{
                backgroundColor: "#0B3D91",
                color: "white",
                border: "none",
                padding: "10px 16px",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              Download CSV
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FinancialExports;