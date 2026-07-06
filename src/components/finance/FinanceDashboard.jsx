import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

function FinanceDashboard({
  summary,
  reports,
  accounts,
  monthlyChart,
  summaryFilter,
  summaryBranch,
  setSummaryFilter,
  setSummaryBranch,
  fetchFinanceData,
  formatCurrency,
  cardStyle,
  metricCardStyle,
  ROYAL_BLUE,
  GOLD,
  WHITE,
  BORDER,
  MUTED,
}) {
  const totalCashAndBankBalances = accounts
    .filter(
      (account) =>
        account.accountType === "Bank" || account.accountType === "Cash"
    )
    .reduce(
      (sum, account) =>
        sum + Number(account.baseCurrencyBalance || account.currentBalance || 0),
      0
    );

  const totalCreditCardBalances = accounts
    .filter((account) => account.accountType === "Credit Card")
    .reduce(
      (sum, account) =>
        sum + Number(account.baseCurrencyBalance || account.currentBalance || 0),
      0
    );

  const netCashPosition = totalCashAndBankBalances - totalCreditCardBalances;

  const totalRevenue =
    reports?.profitAndLoss?.revenue ?? summary?.totalRevenue ?? 0;

  const costOfSales = reports?.profitAndLoss?.costOfSales ?? 0;

  const grossProfit = reports?.profitAndLoss?.grossProfit ?? 0;

  const operatingExpenses =
    reports?.profitAndLoss?.operatingExpenses ?? summary?.totalExpenses ?? 0;

  const netProfit =
    reports?.profitAndLoss?.netProfit ?? summary?.netPosition ?? 0;

  return (
    <>
      <div
        style={{
          ...cardStyle,
          marginBottom: "20px",
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <strong style={{ color: ROYAL_BLUE }}>Dashboard Filter:</strong>

        <select
          value={summaryFilter}
          onChange={(e) => setSummaryFilter(e.target.value)}
          style={{
            padding: "10px",
            borderRadius: "8px",
            border: `1px solid ${BORDER}`,
            fontWeight: "bold",
          }}
        >
          <option value="today">Today</option>
          <option value="thisWeek">This Week</option>
          <option value="thisMonth">This Month</option>
          <option value="thisYear">This Year</option>
          <option value="allTime">All Time</option>
        </select>

        <select
          value={summaryBranch}
          onChange={(e) => setSummaryBranch(e.target.value)}
          style={{
            padding: "10px",
            borderRadius: "8px",
            border: `1px solid ${BORDER}`,
            fontWeight: "bold",
            minWidth: "190px",
          }}
        >
          <option value="">All Branches</option>
          <option value="Eltham Park">Eltham Park</option>
          <option value="Browns Town Square">Browns Town Square</option>
          <option value="Brown's Town Square">Brown's Town Square</option>
        </select>

        <button
          onClick={fetchFinanceData}
          style={{
            backgroundColor: GOLD,
            color: "black",
            border: "none",
            padding: "10px 16px",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Refresh
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "20px",
          marginBottom: "24px",
        }}
      >
        <MetricCard title="Revenue" value={formatCurrency(totalRevenue)} color={ROYAL_BLUE} metricCardStyle={metricCardStyle} />
        <MetricCard title="Cost of Sales" value={formatCurrency(costOfSales)} color="#f97316" metricCardStyle={metricCardStyle} />
        <MetricCard title="Gross Profit" value={formatCurrency(grossProfit)} color="#16a34a" metricCardStyle={metricCardStyle} />
        <MetricCard title="Operating Expenses" value={formatCurrency(operatingExpenses)} color="#dc2626" metricCardStyle={metricCardStyle} />
        <MetricCard title="Net Profit / Loss" value={formatCurrency(netProfit)} color={Number(netProfit) >= 0 ? "#16a34a" : "#dc2626"} metricCardStyle={metricCardStyle} />
        <MetricCard title="Cash & Bank" value={formatCurrency(totalCashAndBankBalances)} color="#0f172a" metricCardStyle={metricCardStyle} />
        <MetricCard title="Credit Card Outstanding" value={formatCurrency(totalCreditCardBalances)} color="#7c3aed" metricCardStyle={metricCardStyle} />
        <MetricCard title="Net Cash Position" value={formatCurrency(netCashPosition)} color={Number(netCashPosition) >= 0 ? "#16a34a" : "#dc2626"} metricCardStyle={metricCardStyle} />
      </div>

      <div style={cardStyle}>
        <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>Monthly Finance Graph</h2>

        <div style={{ width: "100%", height: 380 }}>
          {monthlyChart.length > 0 ? (
            <ResponsiveContainer>
              <BarChart
                data={monthlyChart.map((item) => ({
                  ...item,
                  monthLabel: item.month,
                }))}
                margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="monthLabel" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="income" name="Income" fill="#0B3D91" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="#D4AF37" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div
              style={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: MUTED,
                fontWeight: "bold",
              }}
            >
              No monthly chart data found.
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function MetricCard({ title, value, color, metricCardStyle }) {
  return (
    <div style={metricCardStyle}>
      <div
        style={{
          fontSize: "30px",
          fontWeight: "bold",
          color,
          marginBottom: "8px",
        }}
      >
        {value}
      </div>
      <div style={{ color: "#334155", fontWeight: "bold" }}>{title}</div>
    </div>
  );
}

export default FinanceDashboard;