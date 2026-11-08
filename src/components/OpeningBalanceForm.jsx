import { useRef, useState } from "react";
import api from "../api";

const today = () => {
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

const cash = (value) =>
  `JMD ${Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function OpeningBalanceForm({
  options,
  busy,
  runAction,
  onSaved,
}) {
  const [form, setForm] = useState({
    entityCode: "",
    accountCode: "",
    offsetAccountCode: "",
    entryDate: today(),
    nativeBalance: "",
    exchangeRate: "1",
    memo: "",
    reference: "",
    branch: "",
  });

  const [preview, setPreview] = useState(null);
  const requestId = useRef(crypto.randomUUID());

  const selected = options.openingAccounts.find(
    (account) => account.accountCode === form.accountCode
  );

  const change = (key, value) => {
    setPreview(null);

    setForm((previous) => ({
      ...previous,
      [key]: value,
      ...(
        key === "accountCode"
          ? {
              nativeBalance: "",
              exchangeRate:
                options.openingAccounts.find(
                  (account) => account.accountCode === value
                )?.currency === "USD"
                  ? ""
                  : "1",
            }
          : {}
      ),
    }));
  };

  const preparePreview = () =>
    runAction(async () => {
      const response = await api.post(
        "/api/journal-entries/opening-preview",
        form
      );

      setPreview({
        ...response.data.data,
        fingerprint: JSON.stringify(form),
      });
    });

  const save = () =>
    runAction(async () => {
      if (
        !preview ||
        preview.fingerprint !== JSON.stringify(form)
      ) {
        alert("Preview the current values before saving.");
        return;
      }

      const response = await api.post(
        "/api/journal-entries/opening-draft",
        {
          ...form,
          manualRequestId: requestId.current,
        }
      );

      alert(response.data.message);
      await onSaved(response.data.data);
    });

  const style = {
    padding: 10,
    border: "1px solid #dbe3ef",
    borderRadius: 8,
    minWidth: 0,
    width: "100%",
    boxSizing: "border-box",
  };

  return (
    <section
      style={{
        background: "white",
        border: "1px solid #dbe3ef",
        padding: 18,
        borderRadius: 12,
        marginBottom: 20,
      }}
    >
      <h2>Prepare Opening Balance</h2>

      <p>
        Use only an unused zero-balance account. Saving and approval
        do not change balances. Posting is a separate admin action.
      </p>

      <fieldset disabled={busy} style={{ border: 0, padding: 0 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))",
            gap: 12,
          }}
        >
          <label>
            Business
            <select
              style={style}
              value={form.entityCode}
              onChange={(event) =>
                change("entityCode", event.target.value)
              }
            >
              <option value="">Select active business</option>
              {options.entities.map((entity) => (
                <option key={entity.entityCode} value={entity.entityCode}>
                  {entity.legalName} ({entity.entityCode})
                </option>
              ))}
            </select>
          </label>

          <label>
            Account
            <select
              style={style}
              value={form.accountCode}
              onChange={(event) =>
                change("accountCode", event.target.value)
              }
            >
              <option value="">Select account</option>
              {options.openingAccounts.map((account) => (
                <option
                  key={account.accountCode}
                  value={account.accountCode}
                >
                  {account.accountName} ({account.accountCode})
                  {" — "}{account.currency}
                </option>
              ))}
            </select>
          </label>

          <label>
            Effective date
            <input
              style={style}
              type="date"
              value={form.entryDate}
              onChange={(event) =>
                change("entryDate", event.target.value)
              }
            />
          </label>

          <label>
            Opening balance ({selected?.currency || "select account"})
            <input
              style={style}
              type="number"
              step="0.01"
              value={form.nativeBalance}
              onChange={(event) =>
                change("nativeBalance", event.target.value)
              }
            />
          </label>

          <label>
            JMD per 1 {selected?.currency || "currency unit"}
            <input
              style={style}
              type="number"
              step="any"
              min="0"
              readOnly={selected?.currency !== "USD"}
              value={form.exchangeRate}
              onChange={(event) =>
                change("exchangeRate", event.target.value)
              }
            />
          </label>

          <label>
            Reviewed equity offset
            <select
              style={style}
              value={form.offsetAccountCode}
              onChange={(event) =>
                change("offsetAccountCode", event.target.value)
              }
            >
              <option value="">Select offset account</option>
              {options.offsetAccounts
                .filter(
                  (account) => account.accountCode !== form.accountCode
                )
                .map((account) => (
                  <option
                    key={account.accountCode}
                    value={account.accountCode}
                  >
                    {account.accountCode} — {account.accountName}
                  </option>
                ))}
            </select>
          </label>

          <label>
            Branch
            <select
              style={style}
              value={form.branch}
              onChange={(event) =>
                change("branch", event.target.value)
              }
            >
              <option value="">Unassigned / company-wide</option>
              <option>Eltham Park Mainstore</option>
              <option>Brown's Town Square</option>
            </select>
          </label>

          <label>
            Statement/reference
            <input
              style={style}
              value={form.reference}
              onChange={(event) =>
                change("reference", event.target.value)
              }
            />
          </label>
        </div>

        <p>
          Positive means the account’s normal balance: money held
          for bank/cash; money owed for a credit card. A negative
          amount represents the opposite balance.
        </p>

        <label>
          Explanation
          <input
            style={style}
            value={form.memo}
            onChange={(event) =>
              change("memo", event.target.value)
            }
          />
        </label>

        <p>
          <button type="button" onClick={preparePreview}>
            Preview Opening Journal
          </button>
        </p>

        {preview && (
          <div>
            <p>
              <strong>
                JMD equivalent: {cash(preview.openingDetails.baseBalance)}
              </strong>
            </p>

            <div style={{ overflowX: "auto" }}>
              <table
                border="1"
                cellPadding="10"
                style={{ width: "100%", borderCollapse: "collapse" }}
              >
                <thead>
                  <tr>
                    <th>Account</th>
                    <th>Debit JMD</th>
                    <th>Credit JMD</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.lines.map((line, index) => (
                    <tr key={index}>
                      <td>{line.accountCode} — {line.accountName}</td>
                      <td>{cash(line.debit)}</td>
                      <td>{cash(line.credit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p>
              Debits: {cash(preview.totalDebit)}
              {" · "}
              Credits: {cash(preview.totalCredit)}
            </p>

            <button
              type="button"
              onClick={save}
              disabled={busy}
            >
              Save Reviewed Preview as Draft
            </button>
          </div>
        )}
      </fieldset>
    </section>
  );
}