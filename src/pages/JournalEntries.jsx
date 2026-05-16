import { useEffect, useMemo, useState } from "react";
import api from "../api";

function JournalEntries() {
  const [entries, setEntries] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    entryDate: new Date().toISOString().slice(0, 10),
    memo: "",
    reference: "",
    sourceModule: "Manual",
    lines: [
      { accountCode: "", debit: 0, credit: 0, description: "" },
      { accountCode: "", debit: 0, credit: 0, description: "" },
    ],
  });

  const ROYAL_BLUE = "#0B3D91";
  const WHITE = "#ffffff";
  const BORDER = "#dbe3ef";
  const MUTED = "#64748b";

  const fetchData = async () => {
    try {
      const [entriesRes, accountsRes] = await Promise.all([
        api.get("/api/journal-entries"),
        api.get("/api/chart-of-accounts"),
      ]);

      setEntries(entriesRes.data.data || []);
      setAccounts(accountsRes.data.data || []);
    } catch (error) {
      console.error("Error loading journal entries:", error);
      alert(error?.response?.data?.message || "Could not load journal entries.");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getAccountName = (accountCode) => {
    const account = accounts.find((item) => item.accountCode === accountCode);
    return account?.accountName || "";
  };

  const updateLine = (index, field, value) => {
    setFormData((prev) => {
      const lines = [...prev.lines];
      lines[index] = {
        ...lines[index],
        [field]:
          field === "debit" || field === "credit"
            ? Number(value || 0)
            : value,
      };
      return { ...prev, lines };
    });
  };

  const addLine = () => {
    setFormData((prev) => ({
      ...prev,
      lines: [...prev.lines, { accountCode: "", debit: 0, credit: 0, description: "" }],
    }));
  };

  const removeLine = (index) => {
    setFormData((prev) => ({
      ...prev,
      lines: prev.lines.filter((_, lineIndex) => lineIndex !== index),
    }));
  };

  const totals = useMemo(() => {
    const totalDebit = formData.lines.reduce((sum, line) => sum + Number(line.debit || 0), 0);
    const totalCredit = formData.lines.reduce((sum, line) => sum + Number(line.credit || 0), 0);

    return {
      totalDebit,
      totalCredit,
      balanced: Number(totalDebit.toFixed(2)) === Number(totalCredit.toFixed(2)),
    };
  }, [formData.lines]);

  const saveJournalEntry = async () => {
    try {
      if (!formData.entryDate || !formData.memo) {
        alert("Entry date and memo are required.");
        return;
      }

      const lines = formData.lines
        .filter((line) => line.accountCode && (Number(line.debit || 0) > 0 || Number(line.credit || 0) > 0))
        .map((line) => ({
          ...line,
          accountName: getAccountName(line.accountCode),
        }));

      if (lines.length < 2) {
        alert("At least two valid journal lines are required.");
        return;
      }

      const debitTotal = lines.reduce((sum, line) => sum + Number(line.debit || 0), 0);
      const creditTotal = lines.reduce((sum, line) => sum + Number(line.credit || 0), 0);

      if (Number(debitTotal.toFixed(2)) !== Number(creditTotal.toFixed(2))) {
        alert("Journal entry is not balanced. Debits must equal credits.");
        return;
      }

      await api.post("/api/journal-entries", {
        ...formData,
        lines,
      });

      alert("Journal entry posted successfully.");

      setFormData({
        entryDate: new Date().toISOString().slice(0, 10),
        memo: "",
        reference: "",
        sourceModule: "Manual",
        lines: [
          { accountCode: "", debit: 0, credit: 0, description: "" },
          { accountCode: "", debit: 0, credit: 0, description: "" },
        ],
      });

      setShowForm(false);
      await fetchData();
    } catch (error) {
      console.error("Error posting journal entry:", error);
      alert(error?.response?.data?.message || "Could not post journal entry.");
    }
  };

  const filteredEntries = entries.filter((entry) =>
    `${entry.entryNumber} ${entry.entryDate} ${entry.memo} ${entry.reference} ${entry.sourceModule}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const money = (value) => `JMD ${Number(value || 0).toLocaleString()}`;

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
      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", marginBottom: "20px" }}>
        <div>
          <h1 style={{ margin: 0 }}>Journal Entries</h1>
          <p style={{ margin: "6px 0 0", color: MUTED }}>
            Double-entry accounting records for EKOS corporate finance.
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
          {showForm ? "Close Form" : "+ New Journal Entry"}
        </button>
      </div>

      {showForm && (
        <div style={{ ...cardStyle, marginBottom: "20px" }}>
          <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>Post Journal Entry</h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: "12px", marginBottom: "16px" }}>
            <input type="date" value={formData.entryDate} onChange={(e) => setFormData({ ...formData, entryDate: e.target.value })} style={inputStyle} />
            <input placeholder="Memo" value={formData.memo} onChange={(e) => setFormData({ ...formData, memo: e.target.value })} style={inputStyle} />
            <input placeholder="Reference" value={formData.reference} onChange={(e) => setFormData({ ...formData, reference: e.target.value })} style={inputStyle} />
            <input placeholder="Source Module" value={formData.sourceModule} onChange={(e) => setFormData({ ...formData, sourceModule: e.target.value })} style={inputStyle} />
          </div>

          <div style={{ overflowX: "auto", border: `1px solid ${BORDER}`, borderRadius: "12px" }}>
            <table style={{ width: "100%", minWidth: "1000px", borderCollapse: "collapse" }} border="1" cellPadding="10">
              <thead style={{ backgroundColor: "#eef4ff" }}>
                <tr>
                  <th>Account</th>
                  <th>Debit</th>
                  <th>Credit</th>
                  <th>Description</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {formData.lines.map((line, index) => (
                  <tr key={index}>
                    <td>
                      <select value={line.accountCode} onChange={(e) => updateLine(index, "accountCode", e.target.value)} style={{ ...inputStyle, width: "100%" }}>
                        <option value="">Select Account</option>
                        {accounts.map((account) => (
                          <option key={account._id} value={account.accountCode}>
                            {account.accountCode} - {account.accountName}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input type="number" value={line.debit} onChange={(e) => updateLine(index, "debit", e.target.value)} style={{ ...inputStyle, width: "100%" }} />
                    </td>
                    <td>
                      <input type="number" value={line.credit} onChange={(e) => updateLine(index, "credit", e.target.value)} style={{ ...inputStyle, width: "100%" }} />
                    </td>
                    <td>
                      <input value={line.description} onChange={(e) => updateLine(index, "description", e.target.value)} style={{ ...inputStyle, width: "100%" }} />
                    </td>
                    <td>
                      <button onClick={() => removeLine(index)} style={{ backgroundColor: "#dc2626", color: WHITE, border: "none", padding: "8px 12px", borderRadius: "8px", cursor: "pointer" }}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: "14px", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
            <button onClick={addLine} style={{ backgroundColor: "#64748b", color: WHITE, border: "none", padding: "10px 16px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
              + Add Line
            </button>

            <strong>Debit: {money(totals.totalDebit)}</strong>
            <strong>Credit: {money(totals.totalCredit)}</strong>

            <span style={{ color: totals.balanced ? "#16a34a" : "#dc2626", fontWeight: "bold" }}>
              {totals.balanced ? "Balanced" : "Not Balanced"}
            </span>

            <button onClick={saveJournalEntry} style={{ backgroundColor: "#16a34a", color: WHITE, border: "none", padding: "10px 16px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
              Post Entry
            </button>
          </div>
        </div>
      )}

      <div style={{ ...cardStyle, marginBottom: "16px" }}>
        <input
          placeholder="Search journal entries"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ ...inputStyle, width: "100%" }}
        />
      </div>

      <div style={cardStyle}>
        <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>General Ledger Entries</h2>

        <div style={{ overflowX: "auto", overflowY: "auto", maxHeight: "70vh", border: `1px solid ${BORDER}`, borderRadius: "12px" }}>
          <table border="1" cellPadding="10" style={{ minWidth: "1300px", width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ backgroundColor: "#eef4ff", position: "sticky", top: 0, zIndex: 5 }}>
              <tr>
                <th>Date</th>
                <th>Entry No.</th>
                <th>Memo</th>
                <th>Reference</th>
                <th>Source</th>
                <th>Total Debit</th>
                <th>Total Credit</th>
                <th>Status</th>
                <th>Lines</th>
              </tr>
            </thead>

            <tbody>
              {filteredEntries.length > 0 ? (
                filteredEntries.map((entry) => (
                  <tr key={entry._id}>
                    <td>{entry.entryDate}</td>
                    <td>{entry.entryNumber}</td>
                    <td>{entry.memo}</td>
                    <td>{entry.reference || "—"}</td>
                    <td>{entry.sourceModule || "—"}</td>
                    <td>{money(entry.totalDebit)}</td>
                    <td>{money(entry.totalCredit)}</td>
                    <td>{entry.status}</td>
                    <td>
                      {(entry.lines || []).map((line, index) => (
                        <div key={index} style={{ marginBottom: "6px" }}>
                          <strong>{line.accountCode}</strong> {line.accountName} —
                          DR {money(line.debit)} / CR {money(line.credit)}
                        </div>
                      ))}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" style={{ textAlign: "center", color: MUTED }}>
                    No journal entries found.
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

export default JournalEntries;