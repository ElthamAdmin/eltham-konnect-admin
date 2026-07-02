import { useEffect, useMemo, useState } from "react";
import api from "../api";

function ChartOfAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [health, setHealth] = useState(null);
const [accountTree, setAccountTree] = useState([]);
const [showTree, setShowTree] = useState(true);

  const [formData, setFormData] = useState({
    accountCode: "",
    accountName: "",
    accountCategory: "Asset",
    accountType: "",
    parentAccountCode: "",
    openingBalance: 0,
    normalBalance: "Debit",
    description: "",
  });

  const ROYAL_BLUE = "#0B3D91";
  const GOLD = "#D4AF37";
  const WHITE = "#ffffff";
  const BORDER = "#dbe3ef";
  const MUTED = "#64748b";

  const fetchAccounts = async () => {
  try {
    const accountsRes = await api.get("/api/chart-of-accounts");
    setAccounts(accountsRes.data.data || []);
  } catch (error) {
    console.error("Error loading chart of accounts:", error);
    alert(error?.response?.data?.message || "Could not load chart of accounts.");
  }

  try {
    const healthRes = await api.get("/api/chart-of-accounts/health");
    setHealth(healthRes.data.data || null);
  } catch (error) {
    console.error("Chart health warning:", error);
    setHealth({
      healthStatus: "Needs Review",
      totalAccounts: 0,
      activeAccounts: 0,
      inactiveAccounts: 0,
      systemAccounts: 0,
      healthIssues: 1,
    });
  }

  try {
    const treeRes = await api.get("/api/chart-of-accounts/tree");
    setAccountTree(treeRes.data.data?.categories || []);
  } catch (error) {
    console.error("Account tree warning:", error);
    setAccountTree([]);
  }
};

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const next = {
        ...prev,
        [name]: name === "openingBalance" ? Number(value || 0) : value,
      };

      if (name === "accountCategory") {
        next.normalBalance =
          value === "Asset" || value === "Expense" || value === "Cost of Sales"
            ? "Debit"
            : "Credit";
      }

      return next;
    });
  };

  const resetForm = () => {
    setFormData({
      accountCode: "",
      accountName: "",
      accountCategory: "Asset",
      accountType: "",
      parentAccountCode: "",
      openingBalance: 0,
      normalBalance: "Debit",
      description: "",
    });
    setShowForm(false);
  };

  const saveAccount = async () => {
    try {
      if (!formData.accountCode || !formData.accountName || !formData.accountCategory) {
        alert("Account code, account name, and category are required.");
        return;
      }

      await api.post("/api/chart-of-accounts", formData);

      alert("Account created successfully.");
      resetForm();
      await fetchAccounts();
    } catch (error) {
      console.error("Error creating account:", error);
      alert(error?.response?.data?.message || "Could not create account.");
    }
  };

  const filteredAccounts = useMemo(() => {
    return accounts.filter((account) => {
      const matchesSearch =
        `${account.accountCode} ${account.accountName} ${account.accountCategory} ${account.accountType} ${account.parentAccountCode} ${account.description}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesCategory =
        categoryFilter === "All" || account.accountCategory === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [accounts, searchTerm, categoryFilter]);

  const summary = useMemo(() => {
    const grouped = {
      Asset: 0,
      Liability: 0,
      Equity: 0,
      Revenue: 0,
      "Cost of Sales": 0,
      Expense: 0,
    };

    accounts.forEach((account) => {
      if (grouped[account.accountCategory] !== undefined) {
        grouped[account.accountCategory] += 1;
      }
    });

    return grouped;
  }, [accounts]);

  const money = (value) => `JMD ${Number(value || 0).toLocaleString()}`;

  const categoryColor = (category) => {
    if (category === "Asset") return "#0B3D91";
    if (category === "Liability") return "#dc2626";
    if (category === "Equity") return "#7c3aed";
    if (category === "Revenue") return "#16a34a";
    if (category === "Cost of Sales") return "#f59e0b";
    if (category === "Expense") return "#ea580c";
    return "#64748b";
  };

  const categoryBadge = (category) => (
    <span
      style={{
        backgroundColor: categoryColor(category),
        color: WHITE,
        padding: "5px 10px",
        borderRadius: "999px",
        fontWeight: "bold",
        fontSize: "12px",
        whiteSpace: "nowrap",
      }}
    >
      {category}
    </span>
  );

  const balanceColor = (value) => {
  const amount = Number(value || 0);
  if (amount > 0) return "#16a34a";
  if (amount < 0) return "#dc2626";
  return ROYAL_BLUE;
};

const systemBadge = (isSystemAccount) => (
  <span style={{ color: isSystemAccount ? "#7c3aed" : MUTED, fontWeight: "bold" }}>
    {isSystemAccount ? "SYSTEM" : "Custom"}
  </span>
);

const manualBadge = (allowManualEntries) => (
  <span style={{ color: allowManualEntries === false ? "#dc2626" : "#16a34a", fontWeight: "bold" }}>
    {allowManualEntries === false ? "System Only" : "Manual Allowed"}
  </span>
);

const cardStyle = {
  backgroundColor: WHITE,
  border: `1px solid ${BORDER}`,
  borderRadius: "12px",
  padding: "18px",
  boxShadow: "0 2px 8px rgba(15,23,42,0.04)",
};

  const inputStyle = {
    padding: "10px",
    borderRadius: "8px",
    border: `1px solid ${BORDER}`,
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
          <h1 style={{ margin: 0 }}>Chart of Accounts</h1>
          <p style={{ margin: "6px 0 0", color: MUTED }}>
            Corporate accounting account structure for EKOS Finance.
          </p>
        </div>

        <button
          onClick={() => setShowForm((prev) => !prev)}
          style={{
            backgroundColor: ROYAL_BLUE,
            color: WHITE,
            border: "none",
            padding: "10px 16px",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          {showForm ? "Close Form" : "+ Add Account"}
        </button>
      </div>

      <div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(165px, 1fr))",
    gap: "14px",
    marginBottom: "18px",
  }}
>
  <div style={cardStyle}>
    <h2 style={{ margin: 0, color: health?.healthStatus === "Healthy" ? "#16a34a" : "#dc2626" }}>
      {health?.healthStatus || "—"}
    </h2>
    <p style={{ marginBottom: 0, fontWeight: "bold" }}>Chart Health</p>
  </div>

  <div style={cardStyle}>
    <h2 style={{ margin: 0, color: ROYAL_BLUE }}>{health?.totalAccounts || 0}</h2>
    <p style={{ marginBottom: 0, fontWeight: "bold" }}>Total Accounts</p>
  </div>

  <div style={cardStyle}>
    <h2 style={{ margin: 0, color: "#16a34a" }}>{health?.activeAccounts || 0}</h2>
    <p style={{ marginBottom: 0, fontWeight: "bold" }}>Active</p>
  </div>

  <div style={cardStyle}>
    <h2 style={{ margin: 0, color: "#dc2626" }}>{health?.inactiveAccounts || 0}</h2>
    <p style={{ marginBottom: 0, fontWeight: "bold" }}>Inactive</p>
  </div>

  <div style={cardStyle}>
    <h2 style={{ margin: 0, color: "#7c3aed" }}>{health?.systemAccounts || 0}</h2>
    <p style={{ marginBottom: 0, fontWeight: "bold" }}>System Accounts</p>
  </div>

  <div style={cardStyle}>
    <h2 style={{ margin: 0, color: "#f59e0b" }}>{health?.healthIssues || 0}</h2>
    <p style={{ marginBottom: 0, fontWeight: "bold" }}>Health Issues</p>
  </div>

  {Object.entries(summary).map(([category, count]) => (
    <div key={category} style={cardStyle}>
      <h2 style={{ margin: 0, color: categoryColor(category) }}>{count}</h2>
      <p style={{ marginBottom: 0, fontWeight: "bold" }}>{category}</p>
    </div>
  ))}
</div>

      {showForm && (
  <div style={{ ...cardStyle, marginBottom: "20px" }}>
    <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>New Account</h2>

    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
        gap: "14px",
      }}
    >
      <input
        name="accountCode"
        placeholder="Account Code e.g. 1000"
        value={formData.accountCode}
        onChange={handleChange}
        style={inputStyle}
      />

      <input
        name="accountName"
        placeholder="Account Name e.g. NCB Business Account"
        value={formData.accountName}
        onChange={handleChange}
        style={inputStyle}
      />

      <select
        name="accountCategory"
        value={formData.accountCategory}
        onChange={handleChange}
        style={inputStyle}
      >
        <option value="Asset">Asset</option>
        <option value="Liability">Liability</option>
        <option value="Equity">Equity</option>
        <option value="Revenue">Revenue</option>
        <option value="Cost of Sales">Cost of Sales</option>
        <option value="Expense">Expense</option>
      </select>

      <input
        name="accountType"
        placeholder="Account Type e.g. Bank, Current Liability"
        value={formData.accountType}
        onChange={handleChange}
        style={inputStyle}
      />

      <select
        name="parentAccountCode"
        value={formData.parentAccountCode}
        onChange={handleChange}
        style={inputStyle}
      >
        <option value="">No Parent Account</option>
        {accounts.map((account) => (
          <option key={account._id} value={account.accountCode}>
            {account.accountCode} - {account.accountName}
          </option>
        ))}
      </select>

      <input
        type="number"
        name="openingBalance"
        placeholder="Opening Balance"
        value={formData.openingBalance}
        onChange={handleChange}
        style={inputStyle}
      />

      <select
        name="normalBalance"
        value={formData.normalBalance}
        onChange={handleChange}
        style={inputStyle}
      >
        <option value="Debit">Debit</option>
        <option value="Credit">Credit</option>
      </select>

      <textarea
        name="description"
        placeholder="Description"
        value={formData.description}
        onChange={handleChange}
        style={{
          ...inputStyle,
          minHeight: "90px",
          gridColumn: "1 / -1",
        }}
      />
    </div>

    <div style={{ display: "flex", gap: "10px", marginTop: "16px", flexWrap: "wrap" }}>
      <button
        onClick={saveAccount}
        style={{
          backgroundColor: "#16a34a",
          color: WHITE,
          border: "none",
          padding: "10px 16px",
          borderRadius: "8px",
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        Save Account
      </button>

      <button
        onClick={resetForm}
        style={{
          backgroundColor: "#64748b",
          color: WHITE,
          border: "none",
          padding: "10px 16px",
          borderRadius: "8px",
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        Cancel
      </button>
    </div>
  </div>
)}

<div style={{ ...cardStyle, marginBottom: "16px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
            gap: "12px",
          }}
        >
          <input
            type="text"
            placeholder="Search by code, name, category, type, or description"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={inputStyle}
          />

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={inputStyle}
          >
            <option value="All">All Categories</option>
            <option value="Asset">Asset</option>
            <option value="Liability">Liability</option>
            <option value="Equity">Equity</option>
            <option value="Revenue">Revenue</option>
            <option value="Cost of Sales">Cost of Sales</option>
            <option value="Expense">Expense</option>
          </select>
        </div>
      </div>

      {showTree && (
  <div style={{ ...cardStyle, marginBottom: "16px" }}>
    <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
      <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>Account Tree</h2>

      <button
        type="button"
        onClick={() => setShowTree(false)}
        style={{
          backgroundColor: "#64748b",
          color: WHITE,
          border: "none",
          padding: "8px 12px",
          borderRadius: "8px",
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        Hide Tree
      </button>
    </div>

    <div style={{ display: "grid", gap: "12px" }}>
      {accountTree.length > 0 ? (
        accountTree.map((group) => (
          <div key={group.category} style={{ border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "12px" }}>
            <h3 style={{ marginTop: 0, color: categoryColor(group.category) }}>
              {group.category}
            </h3>

            {(group.accounts || []).length > 0 ? (
              group.accounts.map((account, index) => (
                <AccountTreeNode
  key={account.accountCode}
  account={account}
  money={money}
  border={BORDER}
  muted={MUTED}
  path={`${index + 1}`}
/>
              ))
            ) : (
              <p style={{ color: MUTED }}>No accounts in this category.</p>
            )}
          </div>
        ))
      ) : (
        <p style={{ color: MUTED }}>No account tree available.</p>
      )}
    </div>
  </div>
)}

{!showTree && (
  <button
    type="button"
    onClick={() => setShowTree(true)}
    style={{
      marginBottom: "16px",
      backgroundColor: ROYAL_BLUE,
      color: WHITE,
      border: "none",
      padding: "10px 14px",
      borderRadius: "8px",
      cursor: "pointer",
      fontWeight: "bold",
    }}
  >
    Show Account Tree
  </button>
)}

<div style={cardStyle}>
  <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>Corporate Account List</h2>

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
              minWidth: "1350px",
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
                <th>Code</th>
<th>Account Name</th>
<th>Category</th>
<th>Type</th>
<th>Parent</th>
<th>Opening Balance</th>
<th>Current Balance</th>
<th>Normal Balance</th>
<th>System</th>
<th>Manual Entries</th>
<th>Status</th>
<th>Description</th>
              </tr>
            </thead>

            <tbody>
              {filteredAccounts.length > 0 ? (
                filteredAccounts.map((account) => (
                  <tr key={account._id}>
                    <td style={{ fontWeight: "bold" }}>{account.accountCode}</td>
<td>{account.accountName}</td>
<td>{categoryBadge(account.accountCategory)}</td>
<td>{account.accountType || "—"}</td>
<td>{account.parentAccountCode || "—"}</td>
<td>{money(account.openingBalance)}</td>
<td style={{ fontWeight: "bold", color: balanceColor(account.currentBalance) }}>
  {money(account.currentBalance)}
</td>
<td>{account.normalBalance}</td>
<td>{systemBadge(account.isSystemAccount)}</td>
<td>{manualBadge(account.allowManualEntries)}</td>
<td>{account.status}</td>
<td style={{ maxWidth: "280px", color: MUTED }}>
  {account.description || "—"}
</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="12" style={{ textAlign: "center", color: MUTED }}>
                    No chart of accounts records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginTop: "16px", color: MUTED, fontSize: "13px" }}>
        Suggested numbering: Assets 1000–1999, Liabilities 2000–2999, Equity 3000–3999,
        Revenue 4000–4999, Cost of Sales 5000–5999, Expenses 6000–6999.
      </div>
    </div>
  );
}

function AccountTreeNode({ account, money, border, muted, level = 0, path = "1" }) {
  const amount = Number(account.currentBalance || 0);

  const balanceColor = amount > 0 ? "#16a34a" : amount < 0 ? "#dc2626" : "#0B3D91";

  const usageLabel = Number(account.transactionCount || 0) > 0 ? "Used" : "Unused";

  return (
    <div
      style={{
        marginLeft: `${level * 22}px`,
        borderLeft: level > 0 ? `3px solid ${border}` : "none",
        paddingLeft: level > 0 ? "12px" : "0",
        marginBottom: "8px",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "80px 130px 1.5fr 1fr 1fr 1fr 1fr",
          gap: "10px",
          alignItems: "center",
          backgroundColor: "#f8fafc",
          border: `1px solid ${border}`,
          borderRadius: "8px",
          padding: "9px",
        }}
      >
        <strong>{path}</strong>
        <strong>{account.accountCode}</strong>
        <span>{account.accountName}</span>
        <span style={{ color: muted }}>{account.accountType || "—"}</span>
        <strong style={{ color: balanceColor }}>{money(account.currentBalance)}</strong>
        <span style={{ color: account.transactionCount > 0 ? "#16a34a" : muted, fontWeight: "bold" }}>
          {usageLabel} / {account.transactionCount || 0} txn
        </span>
        <span style={{ color: account.isSystemAccount ? "#7c3aed" : muted, fontWeight: "bold" }}>
          {account.isSystemAccount ? "SYSTEM" : "Custom"}
        </span>
      </div>

      {(account.children || []).map((child, index) => (
        <AccountTreeNode
          key={child.accountCode}
          account={child}
          money={money}
          border={border}
          muted={muted}
          level={level + 1}
          path={`${path}.${index + 1}`}
        />
      ))}
    </div>
  );
}

export default ChartOfAccounts;