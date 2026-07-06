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

    const accountsReceivable =
    reports?.balanceSheet?.assets?.accounts?.find(
      (account) => account.accountCode === "1100"
    )?.amount || summary?.outstandingRevenue || 0;

  const accountsPayable =
    reports?.balanceSheet?.liabilities?.accounts?.find(
      (account) => account.accountCode === "2000"
    )?.amount || 0;

  const currentAssets = Number(reports?.balanceSheet?.assets?.total || 0);
  const currentLiabilities = Number(
    reports?.balanceSheet?.liabilities?.total || 0
  );

  const workingCapital = currentAssets - currentLiabilities;

  const currentRatio =
    currentLiabilities > 0 ? currentAssets / currentLiabilities : 0;

  const availableCredit = accounts
    .filter((account) => account.accountType === "Credit Card")
    .reduce(
      (sum, account) =>
        sum +
        Number(account.calculatedAvailableCredit ?? account.availableCredit ?? 0),
      0
    );

  const creditLimit = accounts
    .filter((account) => account.accountType === "Credit Card")
    .reduce((sum, account) => sum + Number(account.creditLimit || 0), 0);

  const creditUtilization =
    creditLimit > 0 ? (totalCreditCardBalances / creditLimit) * 100 : 0;

  const bankAccounts = accounts.filter((account) => account.accountType === "Bank");
  const cashAccounts = accounts.filter((account) => account.accountType === "Cash");
  const creditCards = accounts.filter(
    (account) => account.accountType === "Credit Card"
  );

  const totalRevenue =
    reports?.profitAndLoss?.revenue ?? summary?.totalRevenue ?? 0;

  const costOfSales = reports?.profitAndLoss?.costOfSales ?? 0;

  const grossProfit = reports?.profitAndLoss?.grossProfit ?? 0;

  const operatingExpenses =
    reports?.profitAndLoss?.operatingExpenses ?? summary?.totalExpenses ?? 0;

  const netProfit =
    reports?.profitAndLoss?.netProfit ?? summary?.netPosition ?? 0;

  const grossMargin =
    Number(totalRevenue) > 0 ? (Number(grossProfit) / Number(totalRevenue)) * 100 : 0;

  const netMargin =
    Number(totalRevenue) > 0 ? (Number(netProfit) / Number(totalRevenue)) * 100 : 0;


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

            <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "20px",
          marginBottom: "24px",
        }}
      >
        <DashboardPanel title="Financial Position" ROYAL_BLUE={ROYAL_BLUE} cardStyle={cardStyle}>
          <InfoRow label="Current Assets" value={formatCurrency(currentAssets)} />
          <InfoRow label="Current Liabilities" value={formatCurrency(currentLiabilities)} />
          <InfoRow label="Working Capital" value={formatCurrency(workingCapital)} />
          <InfoRow
            label="Current Ratio"
            value={currentRatio > 0 ? currentRatio.toFixed(2) : "—"}
          />
          <InfoRow label="Accounts Receivable" value={formatCurrency(accountsReceivable)} />
          <InfoRow label="Accounts Payable" value={formatCurrency(accountsPayable)} />
        </DashboardPanel>

        <DashboardPanel title="Revenue & Expense Analysis" ROYAL_BLUE={ROYAL_BLUE} cardStyle={cardStyle}>
          <InfoRow label="Revenue" value={formatCurrency(totalRevenue)} />
          <InfoRow label="Cost of Sales" value={formatCurrency(costOfSales)} />
          <InfoRow label="Gross Profit" value={formatCurrency(grossProfit)} />
          <InfoRow
            label="Gross Margin"
            value={`${grossMargin.toFixed(2)}%`}
          />
          <InfoRow label="Operating Expenses" value={formatCurrency(operatingExpenses)} />
          <InfoRow label="Net Profit / Loss" value={formatCurrency(netProfit)} />
          <InfoRow label="Net Margin" value={`${netMargin.toFixed(2)}%`} />
        </DashboardPanel>

        <DashboardPanel title="Banking Intelligence" ROYAL_BLUE={ROYAL_BLUE} cardStyle={cardStyle}>
          <InfoRow label="Bank Accounts" value={bankAccounts.length} />
          <InfoRow label="Cash Accounts" value={cashAccounts.length} />
          <InfoRow label="Credit Cards" value={creditCards.length} />
          <InfoRow label="Available Credit" value={formatCurrency(availableCredit)} />
          <InfoRow
            label="Credit Utilization"
            value={`${creditUtilization.toFixed(2)}%`}
          />
          <InfoRow
            label="Net Cash Position"
            value={formatCurrency(netCashPosition)}
          />
        </DashboardPanel>
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

function DashboardPanel({ title, children, ROYAL_BLUE, cardStyle }) {
  return (
    <div style={cardStyle}>
      <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>{title}</h2>
      <div style={{ display: "grid", gap: "10px" }}>{children}</div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: "12px",
        borderBottom: "1px solid #e5e7eb",
        paddingBottom: "8px",
        fontWeight: "bold",
      }}
    >
      <span style={{ color: "#475569" }}>{label}</span>
      <span>{value}</span>
    </div>
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