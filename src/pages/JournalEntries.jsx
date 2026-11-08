import { useEffect, useMemo, useRef, useState } from "react";
import api from "../api";
import OpeningBalanceForm from "../components/OpeningBalanceForm";

const jamaicaToday = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Jamaica",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  return ["year", "month", "day"]
    .map((type) => parts.find((part) => part.type === type).value)
    .join("-");
};

function JournalEntries() {
  const [entries, setEntries] = useState([]);
    const [options, setOptions] = useState({
    capabilities: {
      canPrepare: false,
      canAdmin: false,
    },
    entities: [],
    manualAccounts: [],
    openingAccounts: [],
    offsetAccounts: [],
  });

  const [showOpening, setShowOpening] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);

  const actionLock = useRef(false);
  const manualRequestId = useRef(crypto.randomUUID());
  const [accounts, setAccounts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
const [health, setHealth] = useState(null);
const [statusFilter, setStatusFilter] = useState("All");
const [sourceFilter, setSourceFilter] = useState("All");
const [startDate, setStartDate] = useState("");
const [endDate, setEndDate] = useState("");
const [selectedEntry, setSelectedEntry] = useState(null);
const [reverseReason, setReverseReason] = useState("");

  const [formData, setFormData] = useState({
        entryDate: jamaicaToday(),
    entityCode: "",
    branch: "",
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
      const [entriesRes, optionsRes, healthRes] = await Promise.all([
        api.get("/api/journal-entries"),
        api.get("/api/journal-entries/options"),
        api.get("/api/journal-entries/health"),
      ]);

      setEntries(entriesRes.data.data || []);
      setOptions(optionsRes.data.data);
      setAccounts(optionsRes.data.data.manualAccounts || []);
      setHealth(healthRes.data.data || null);
    } catch (error) {
      alert(
        error?.response?.data?.message ||
          "Could not load journal entries."
      );
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

    const runJournalAction = async (action) => {
    if (actionLock.current) return;

    actionLock.current = true;
    setActionBusy(true);

    try {
      await action();
    } catch (error) {
      alert(
        error?.response?.data?.message ||
          error.message ||
          "Could not confirm this action. Refresh before retrying."
      );
    } finally {
      actionLock.current = false;
      setActionBusy(false);
    }
  };

  const openJournalEntry = async (entryNumber) => {
    try {
      const response = await api.get(
        `/api/journal-entries/${encodeURIComponent(entryNumber)}`
      );

      setSelectedEntry(response.data.data || null);
      setReverseReason("");
    } catch (error) {
      alert(
        error?.response?.data?.message ||
          "Could not load journal entry."
      );
    }
  };

  const saveJournalEntry = () =>
    runJournalAction(async () => {
      const response = await api.post(
        "/api/journal-entries/draft",
        {
          ...formData,
          sourceModule: "Manual",
          manualRequestId: manualRequestId.current,
          lines: formData.lines.map((line) => ({
            ...line,
            accountName: getAccountName(line.accountCode),
          })),
        }
      );

      alert(response.data.message);
      manualRequestId.current = crypto.randomUUID();

      setFormData({
        entryDate: jamaicaToday(),
        entityCode: "",
        branch: "",
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
      await openJournalEntry(response.data.data.entryNumber);
    });

  const actOnEntry = (entryNumber, action, label) =>
    runJournalAction(async () => {
      if (!window.confirm(`${label} ${entryNumber}?`)) return;

      const response = await api.post(
        `/api/journal-entries/${encodeURIComponent(entryNumber)}/${action}`
      );

      alert(response.data.message);

      await fetchData();
      await openJournalEntry(entryNumber);
    });

  const submitForApproval = (number) =>
    actOnEntry(number, "submit", "Submit for approval:");

  const approveJournal = (number) =>
    actOnEntry(number, "approve", "Approve:");

  const postApprovedJournal = (number) =>
    actOnEntry(number, "post", "Post this approved journal:");

  const reverseEntry = () =>
    runJournalAction(async () => {
      if (
        !selectedEntry ||
        reverseReason.trim().length < 10
      ) {
        alert(
          "Select a posted manual entry and enter a reversal reason of at least 10 characters."
        );
        return;
      }

      const reversalDate = prompt(
        "Reversal posting date (YYYY-MM-DD):",
        jamaicaToday()
      );

      if (reversalDate === null) return;

      const number = selectedEntry.entryNumber;

      if (
        !window.confirm(
          `Reverse ${number} on ${reversalDate}? A separate reversing journal will be posted.`
        )
      ) {
        return;
      }

      const response = await api.post(
        `/api/journal-entries/${encodeURIComponent(number)}/reverse`,
        {
          reversalReason: reverseReason.trim(),
          reversalDate,
        }
      );

      alert(response.data.message);

      await fetchData();
      await openJournalEntry(number);
    });

  const discardDraft = () =>
    runJournalAction(async () => {
      if (
        !selectedEntry ||
        !window.confirm(
          `Discard unposted draft ${selectedEntry.entryNumber}? Its audit record will be retained.`
        )
      ) {
        return;
      }

      await api.delete(
        `/api/journal-entries/${encodeURIComponent(selectedEntry.entryNumber)}/draft`
      );

      setSelectedEntry(null);
      await fetchData();
    });

  const selectedIsManual = selectedEntry && (
    ["Manual", "Opening Balance"].includes(selectedEntry.entryKind) ||
    (
      !selectedEntry.entryKind &&
      selectedEntry.sourceModule === "Manual"
    )
  );

  const canPrepareSelected =
    options.capabilities.canPrepare &&
    selectedIsManual &&
    (
      selectedEntry.entryKind !== "Opening Balance" ||
      options.capabilities.canAdmin
    );

  const filteredEntries = entries.filter((entry) => {
  const matchesSearch = `${entry.entryNumber} ${entry.entryDate} ${entry.memo} ${entry.reference} ${entry.sourceModule}`
    .toLowerCase()
    .includes(searchTerm.toLowerCase());

  const matchesStatus =
    statusFilter === "All" || entry.status === statusFilter;

  const matchesSource =
    sourceFilter === "All" || entry.sourceModule === sourceFilter;

  const entryDate = new Date(entry.entryDate);
  const matchesStart =
    !startDate || entryDate >= new Date(startDate);

  const matchesEnd =
    !endDate || entryDate <= new Date(endDate);

  return matchesSearch && matchesStatus && matchesSource && matchesStart && matchesEnd;
});

  const money = (value) => `JMD ${Number(value || 0).toLocaleString()}`;

const sourceModules = [
  "All",
  ...Array.from(new Set(entries.map((entry) => entry.sourceModule || "Manual"))),
];

const statusColor = (status) => {
  if (status === "Posted") return "#16a34a";
  if (status === "Draft") return "#f59e0b";
  if (status === "Pending Approval") return "#7c3aed";
  if (status === "Approved") return ROYAL_BLUE;
  if (status === "Reversed") return "#dc2626";
  return MUTED;
};

const statusBadge = (status) => (
  <span
    style={{
      color: statusColor(status),
      fontWeight: "bold",
      whiteSpace: "nowrap",
    }}
  >
    {status === "Posted" && "● "}
    {status === "Draft" && "● "}
    {status === "Pending Approval" && "● "}
    {status === "Approved" && "● "}
    {status === "Reversed" && "● "}
    {status}
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
      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", marginBottom: "20px" }}>
        <div>
          <h1 style={{ margin: 0 }}>Journal Entries</h1>
          <p style={{ margin: "6px 0 0", color: MUTED }}>
            Double-entry accounting records for EKOS corporate finance.
          </p>
        </div>

        <button
                    disabled={actionBusy || !options.capabilities.canPrepare}
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
                    {showForm ? "Close Form" : "+ New Manual Draft"}
        </button>
      </div>

      <div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "14px",
    marginBottom: "18px",
  }}
>
  <div style={cardStyle}>
    <h2 style={{ margin: 0, color: ROYAL_BLUE }}>{health?.totalEntries || entries.length}</h2>
    <p style={{ marginBottom: 0, fontWeight: "bold" }}>Total Entries</p>
  </div>

  <div style={cardStyle}>
    <h2 style={{ margin: 0, color: "#16a34a" }}>{health?.postedCount || 0}</h2>
    <p style={{ marginBottom: 0, fontWeight: "bold" }}>Posted</p>
  </div>

  <div style={cardStyle}>
    <h2 style={{ margin: 0, color: "#f59e0b" }}>{health?.draftCount || 0}</h2>
    <p style={{ marginBottom: 0, fontWeight: "bold" }}>Drafts</p>
  </div>

  <div style={cardStyle}>
    <h2 style={{ margin: 0, color: "#dc2626" }}>{health?.reversedCount || 0}</h2>
    <p style={{ marginBottom: 0, fontWeight: "bold" }}>Reversed</p>
  </div>

  <div style={cardStyle}>
    <h2 style={{ margin: 0, color: health?.isHealthy ? "#16a34a" : "#dc2626" }}>
      {health?.isHealthy ? "Healthy" : "Needs Review"}
    </h2>
    <p style={{ marginBottom: 0, fontWeight: "bold" }}>Journal Health</p>
  </div>

  <div style={cardStyle}>
    <h2 style={{ margin: 0, color: "#dc2626" }}>{health?.unbalancedCount || 0}</h2>
    <p style={{ marginBottom: 0, fontWeight: "bold" }}>Unbalanced</p>
  </div>
</div>

{options.capabilities.canAdmin && (
  <button
    type="button"
    disabled={actionBusy}
    onClick={() => setShowOpening((value) => !value)}
    style={{
      backgroundColor: ROYAL_BLUE,
      color: WHITE,
      border: "none",
      padding: "10px 16px",
      borderRadius: "8px",
      marginBottom: "16px",
      cursor: "pointer",
      fontWeight: "bold",
    }}
  >
    {showOpening ? "Close Opening Form" : "+ Opening Balance Draft"}
  </button>
)}

{showOpening && options.capabilities.canAdmin && (
  <OpeningBalanceForm
    options={options}
    busy={actionBusy}
    runAction={runJournalAction}
    onSaved={async (entry) => {
      setShowOpening(false);
      await fetchData();
      await openJournalEntry(entry.entryNumber);
    }}
  />
)}

{showForm && options.capabilities.canPrepare && (

        <div style={{ ...cardStyle, marginBottom: "20px" }}>
          <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>Prepare Manual Journal Draft</h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: "12px", marginBottom: "16px" }}>
            <input type="date" value={formData.entryDate} onChange={(e) => setFormData({ ...formData, entryDate: e.target.value })} style={inputStyle} />
            <input placeholder="Memo" value={formData.memo} onChange={(e) => setFormData({ ...formData, memo: e.target.value })} style={inputStyle} />
            <input placeholder="Reference" value={formData.reference} onChange={(e) => setFormData({ ...formData, reference: e.target.value })} style={inputStyle} />
                        <select
              value={formData.entityCode}
              onChange={(event) =>
                setFormData({
                  ...formData,
                  entityCode: event.target.value,
                })
              }
              style={inputStyle}
            >
              <option value="">Select active business</option>
              {options.entities.map((entity) => (
                <option
                  key={entity.entityCode}
                  value={entity.entityCode}
                >
                  {entity.legalName} ({entity.entityCode})
                </option>
              ))}
            </select>

            <select
              value={formData.branch}
              onChange={(event) =>
                setFormData({
                  ...formData,
                  branch: event.target.value,
                })
              }
              style={inputStyle}
            >
              <option value="">Unassigned / company-wide</option>
              <option>Eltham Park Mainstore</option>
              <option>Brown's Town Square</option>
            </select>

            <input value="Manual" readOnly style={inputStyle} />
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

                        <button
              onClick={saveJournalEntry}
              disabled={actionBusy}
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
              Save Draft
            </button>
          </div>
        </div>
      )}

      <div style={{ ...cardStyle, marginBottom: "16px" }}>
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
      gap: "12px",
    }}
  >
    <input
      placeholder="Search journal entries"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      style={inputStyle}
    />

    <select
      value={statusFilter}
      onChange={(e) => setStatusFilter(e.target.value)}
      style={inputStyle}
    >
      <option value="All">All Statuses</option>
      <option value="Draft">Draft</option>
      <option value="Pending Approval">Pending Approval</option>
      <option value="Approved">Approved</option>
      <option value="Posted">Posted</option>
      <option value="Reversed">Reversed</option>
    </select>

    <select
      value={sourceFilter}
      onChange={(e) => setSourceFilter(e.target.value)}
      style={inputStyle}
    >
      {sourceModules.map((source) => (
        <option key={source} value={source}>
          {source === "All" ? "All Sources" : source}
        </option>
      ))}
    </select>

    <input
      type="date"
      value={startDate}
      onChange={(e) => setStartDate(e.target.value)}
      style={inputStyle}
    />

    <input
      type="date"
      value={endDate}
      onChange={(e) => setEndDate(e.target.value)}
      style={inputStyle}
    />

    <button
      type="button"
      onClick={() => {
        setSearchTerm("");
        setStatusFilter("All");
        setSourceFilter("All");
        setStartDate("");
        setEndDate("");
      }}
      style={{
        backgroundColor: "#64748b",
        color: WHITE,
        border: "none",
        padding: "10px",
        borderRadius: "8px",
        cursor: "pointer",
        fontWeight: "bold",
      }}
    >
      Clear Filters
    </button>
  </div>
</div>

{selectedEntry && (
  <div style={{ ...cardStyle, marginBottom: "16px" }}>
    <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
      <div>
        <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>
          Journal Detail — {selectedEntry.entryNumber}
        </h2>
        <p style={{ color: MUTED, marginTop: 0 }}>
          {selectedEntry.locked ? "🔒 Locked posted journal" : "Open journal"} · {selectedEntry.sourceModule || "Manual"}
        </p>
      </div>

      <button
        type="button"
        onClick={() => setSelectedEntry(null)}
        style={{
          backgroundColor: "#64748b",
          color: WHITE,
          border: "none",
          padding: "9px 12px",
          borderRadius: "8px",
          cursor: "pointer",
          fontWeight: "bold",
          height: "fit-content",
        }}
      >
        Close Detail
      </button>
    </div>

    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "12px",
        marginBottom: "14px",
      }}
    >
      <div><strong>Date:</strong> {selectedEntry.entryDate}</div>
      <div><strong>Status:</strong> {statusBadge(selectedEntry.status)}</div>
      <div><strong>Reference:</strong> {selectedEntry.reference || "—"}</div>
      <div><strong>Created By:</strong> {selectedEntry.createdBy || "—"}</div>
      <div><strong>Posted By:</strong> {selectedEntry.postedBy || "—"}</div>
      <div><strong>Posted At:</strong> {selectedEntry.postedAt ? new Date(selectedEntry.postedAt).toLocaleString() : "—"}</div>
      <div><strong>Total Debit:</strong> {money(selectedEntry.totalDebit)}</div>
      <div><strong>Total Credit:</strong> {money(selectedEntry.totalCredit)}</div>
    </div>

        <p>
      <strong>Business:</strong>{" "}
      {selectedEntry.entitySnapshot?.legalName ||
        selectedEntry.entityCode ||
        "Not attributed — needs review"}
    </p>

    <p>
      <strong>Branch:</strong>{" "}
      {selectedEntry.branch || "Unassigned / company-wide"}
    </p>

    <p>
      <strong>Approved By:</strong>{" "}
      {selectedEntry.approvedBy || "—"}
    </p>

    {selectedEntry.openingDetails && (
      <p>
        <strong>Opening:</strong>{" "}
        {selectedEntry.openingDetails.currency}{" "}
        {selectedEntry.openingDetails.nativeBalance}
        {" × "}
        {selectedEntry.openingDetails.exchangeRate}
        {" = "}
        {money(selectedEntry.openingDetails.baseBalance)}
      </p>
    )}

    <p>
      <strong>Memo:</strong> {selectedEntry.memo || "—"}
    </p>

    <div style={{ overflowX: "auto", border: `1px solid ${BORDER}`, borderRadius: "12px", marginTop: "12px" }}>
      <table border="1" cellPadding="10" style={{ minWidth: "900px", width: "100%", borderCollapse: "collapse" }}>
        <thead style={{ backgroundColor: "#eef4ff" }}>
          <tr>
            <th>Account Code</th>
            <th>Account Name</th>
            <th>Debit</th>
            <th>Credit</th>
            <th>Description</th>
          </tr>
        </thead>

        <tbody>
          {(selectedEntry.lines || []).map((line, index) => (
            <tr key={index}>
              <td style={{ fontWeight: "bold" }}>{line.accountCode}</td>
              <td>{line.accountName}</td>
              <td>{Number(line.debit || 0) > 0 ? money(line.debit) : "—"}</td>
              <td>{Number(line.credit || 0) > 0 ? money(line.credit) : "—"}</td>
              <td>{line.description || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <div
  style={{
    marginTop: "20px",
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    alignItems: "center",
  }}
>
    {options.capabilities.canAdmin &&
    selectedIsManual &&
    selectedEntry.status === "Draft" && (
      <button
        type="button"
        disabled={actionBusy}
        onClick={discardDraft}
        style={{
          backgroundColor: "#64748b",
          color: WHITE,
          border: "none",
          padding: "10px 18px",
          borderRadius: "8px",
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        Discard Unposted Draft
      </button>
    )}

  {canPrepareSelected && selectedEntry.status === "Draft" && (
    <button
      disabled={actionBusy}
      onClick={() => submitForApproval(selectedEntry.entryNumber)}
      style={{
        backgroundColor: "#7c3aed",
        color: WHITE,
        border: "none",
        padding: "10px 18px",
        borderRadius: "8px",
        cursor: "pointer",
        fontWeight: "bold",
      }}
    >
      Submit For Approval
    </button>
  )}

  {options.capabilities.canAdmin &&
    selectedIsManual &&
    selectedEntry.status === "Pending Approval" && (
      <button
        disabled={actionBusy}
        onClick={() => approveJournal(selectedEntry.entryNumber)}
        style={{
          backgroundColor: "#2563eb",
          color: WHITE,
          border: "none",
          padding: "10px 18px",
          borderRadius: "8px",
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        Approve Journal
      </button>
    )}

  {options.capabilities.canAdmin &&
    selectedIsManual &&
    selectedEntry.status === "Approved" && (
      <button
        disabled={actionBusy}
        onClick={() =>
          postApprovedJournal(selectedEntry.entryNumber)
        }
        style={{
          backgroundColor: "#16a34a",
          color: WHITE,
          border: "none",
          padding: "10px 18px",
          borderRadius: "8px",
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        Post Journal
      </button>
    )}

  {options.capabilities.canAdmin &&
    selectedIsManual &&
    selectedEntry.status === "Posted" && (
      <>
        <input
          placeholder="Reversal reason — at least 10 characters"
          value={reverseReason}
          onChange={(event) => setReverseReason(event.target.value)}
          disabled={actionBusy}
          style={{
            flex: 1,
            minWidth: "250px",
            ...inputStyle,
          }}
        />

        <button
          onClick={reverseEntry}
          disabled={actionBusy}
          style={{
            backgroundColor: "#dc2626",
            color: WHITE,
            border: "none",
            padding: "10px 18px",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Reverse Manual Journal
        </button>
      </>
    )}

  {selectedEntry.status === "Reversed" && (
    <div
      style={{
        color: "#dc2626",
        fontWeight: "bold",
      }}
    >
      Reversed by {selectedEntry.reversedBy || "—"} on{" "}
      {selectedEntry.reversedAt
        ? new Date(selectedEntry.reversedAt).toLocaleString()
        : "—"}

      <br />

      Reversal Entry:
      {" "}
      {selectedEntry.reversalEntryNumber || "—"}
    </div>
  )}
</div>

    {selectedEntry.status === "Reversed" && (
      <p style={{ color: "#dc2626", fontWeight: "bold" }}>
        Reversed by {selectedEntry.reversedBy || "—"} on{" "}
        {selectedEntry.reversedAt ? new Date(selectedEntry.reversedAt).toLocaleString() : "—"}.
        Reversal Entry: {selectedEntry.reversalEntryNumber || "—"}.
      </p>
    )}
  </div>
)}

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
<th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredEntries.length > 0 ? (
                filteredEntries.map((entry) => (
                  <tr key={entry._id}>
                    <td>{entry.entryDate}</td>
                    <td>
  <button
    type="button"
    onClick={() => openJournalEntry(entry.entryNumber)}
    style={{
      background: "none",
      border: "none",
      color: ROYAL_BLUE,
      fontWeight: "bold",
      cursor: "pointer",
      textDecoration: "underline",
      padding: 0,
    }}
  >
    {entry.entryNumber}
  </button>
</td>
                    <td>{entry.memo}</td>
                    <td>{entry.reference || "—"}</td>
                    <td>{entry.sourceModule || "—"}</td>
                    <td>{money(entry.totalDebit)}</td>
                    <td>{money(entry.totalCredit)}</td>
                    <td>{statusBadge(entry.status)}</td>
                    <td>
  {(entry.lines || []).slice(0, 2).map((line, index) => (
    <div key={index} style={{ marginBottom: "6px" }}>
      <strong>{line.accountCode}</strong> {line.accountName} —
      DR {money(line.debit)} / CR {money(line.credit)}
    </div>
  ))}
  {(entry.lines || []).length > 2 && (
    <span style={{ color: MUTED }}>
      + {(entry.lines || []).length - 2} more line(s)
    </span>
  )}
</td>
<td>
  <button
    type="button"
    onClick={() => openJournalEntry(entry.entryNumber)}
    style={{
      backgroundColor: ROYAL_BLUE,
      color: WHITE,
      border: "none",
      padding: "7px 10px",
      borderRadius: "8px",
      cursor: "pointer",
      fontWeight: "bold",
    }}
  >
    View
  </button>
</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" style={{ textAlign: "center", color: MUTED }}>
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