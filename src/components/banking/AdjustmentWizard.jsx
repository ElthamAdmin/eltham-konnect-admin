import { useState } from "react";
import api from "../../api";

function AdjustmentWizard({
  selectedImportedStatement,
  selectedStatementLine,
  onCompleted,
  button,
  BORDER,
  ROYAL_BLUE,
}) {
  const [adjustmentType, setAdjustmentType] = useState("Bank Fee");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  if (!selectedStatementLine) return null;

  const createAdjustment = async () => {
    try {
      setSaving(true);

      await api.post("/api/banking/reconciliation/import/adjustment", {
        importNumber: selectedImportedStatement.importNumber,
        lineId: selectedStatementLine._id,
        adjustmentType,
        description,
        amount: selectedStatementLine.amount,
        transactionDate: selectedStatementLine.transactionDate,
      });

      alert("Adjustment created successfully.");

      onCompleted();
    } catch (err) {
      console.error(err);

      alert(
        err?.response?.data?.message ||
          "Unable to create adjustment."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        border: `1px solid ${BORDER}`,
        borderRadius: 10,
        padding: 20,
        marginTop: 20,
        background: "#fffdf7",
      }}
    >
      <h2 style={{ color: ROYAL_BLUE }}>
        Reconciliation Adjustment Wizard
      </h2>

      <p>
        Create an accounting adjustment without leaving Bank
        Reconciliation.
      </p>

      <select
        value={adjustmentType}
        onChange={(e) => setAdjustmentType(e.target.value)}
      >
        <option>Bank Fee</option>
        <option>Interest Earned</option>
        <option>Interest Charged</option>
        <option>Misc Adjustment</option>
      </select>

      <textarea
        rows={4}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Adjustment description..."
        style={{
          width: "100%",
          marginTop: 10,
        }}
      />

      <button
        disabled={saving}
        onClick={createAdjustment}
        style={{
          ...button("#16a34a"),
          marginTop: 12,
        }}
      >
        {saving ? "Creating..." : "Create Adjustment"}
      </button>
    </div>
  );
}

export default AdjustmentWizard;