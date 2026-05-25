import api from "../api";

function FinancialExports() {
  const exportFile = async (path, filename) => {
    try {
      const response = await api.get(path, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: "text/csv;charset=utf-8;",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export download error:", error);
      alert(
        error?.response?.data?.message ||
          "Could not download export. Please try again."
      );
    }
  };

  const reports = [
    {
      title: "Trial Balance",
      description: "Export account balances for accounting verification.",
      path: "/api/financial-exports/trial-balance",
      filename: "trial-balance.csv",
    },
    {
      title: "General Ledger",
      description: "Export all posted debit and credit ledger transactions.",
      path: "/api/financial-exports/general-ledger",
      filename: "general-ledger.csv",
    },
    {
      title: "Profit & Loss",
      description: "Export revenue, expenses, and net profit/loss.",
      path: "/api/financial-exports/profit-loss",
      filename: "profit-loss.csv",
    },
    {
      title: "Balance Sheet",
      description: "Export assets, liabilities, and equity balances.",
      path: "/api/financial-exports/balance-sheet",
      filename: "balance-sheet.csv",
    },
  ];

  return (
    <div>
      <h1 style={{ margin: 0 }}>Financial Statement Exports</h1>
      <p style={{ marginTop: "6px", color: "#64748b" }}>
        Download corporate accounting reports for review, accounting, banking,
        and TAJ preparation.
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
            <h2 style={{ marginTop: 0, color: "#0B3D91" }}>
              {report.title}
            </h2>

            <p style={{ color: "#64748b", minHeight: "48px" }}>
              {report.description}
            </p>

            <button
              onClick={() => exportFile(report.path, report.filename)}
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