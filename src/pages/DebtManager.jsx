import { useEffect, useRef, useState } from "react";
import api from "../api";

const blue = "#0B3D91";

const panel = {
  background: "white",
  border: "1px solid #dbe3ef",
  borderRadius: 12,
  padding: 18,
  marginBottom: 18,
};

const grid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit,minmax(210px,1fr))",
  gap: 12,
};

const control = {
  width: "100%",
  padding: 9,
  boxSizing: "border-box",
  border: "1px solid #cbd5e1",
  borderRadius: 6,
};

const button = {
  padding: "9px 12px",
  background: blue,
  color: "white",
  border: 0,
  borderRadius: 6,
  cursor: "pointer",
  margin: "8px 8px 0 0",
};

const cell = {
  padding: 9,
  border: "1px solid #dbe3ef",
  textAlign: "left",
};

const types = [
  "Loan",
  "Credit Card",
  "Vehicle Loan",
  "Equipment Financing",
  "Business Expansion",
  "Other",
];

const editable = [
  "debtName",
  "debtType",
  "lenderName",
  "startingBalance",
  "currentBalance",
  "monthlyPayment",
  "interestRate",
  "dueDay",
  "startDate",
  "targetPayoffDate",
  "notes",
  "status",
  "currency",
  "entityCode",
  "liabilityAccountCode",
  "interestAccountCode",
];

const blankDebt = () =>
  Object.fromEntries(
    editable.map((key) => [
      key,
      key === "debtType"
        ? "Loan"
        : key === "status"
          ? "Active"
          : "",
    ])
  );

const today = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Jamaica",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  return ["year", "month", "day"]
    .map((key) => parts.find((part) => part.type === key).value)
    .join("-");
};

const money = (value, currency = "JMD") =>
  value === null ||
  value === undefined ||
  value === "" ||
  !Number.isFinite(Number(value))
    ? "Not available"
    : `${currency} ${Number(value).toLocaleString(
        undefined,
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }
      )}`;

const labels = {
  debtName: "Debt name",
  lenderName: "Lender",
  startingBalance: "Starting recorded principal",
  currentBalance:
    "Current recorded principal (blank uses starting)",
  monthlyPayment: "Planned monthly payment",
  interestRate: "Annual interest rate % (reference only)",
  dueDay: "Due day (1–31)",
  startDate: "Start date",
  targetPayoffDate: "Target payoff date",
};

function DebtManager() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(null);
  const [editing, setEditing] = useState(null);
  const [repayment, setRepayment] = useState(null);
  const [search, setSearch] = useState("");

  const lock = useRef(false);
  const creationId = useRef("");

  const load = async () => {
    setLoading(true);

    try {
      const response = await api.get("/api/debt-manager");
      setData(response.data.data);
    } catch (failure) {
      setData(null);

      setError(
        failure?.response?.data?.message ||
          "Could not load Debt Manager."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const mutate = async (operation) => {
    if (lock.current) return;

    lock.current = true;
    setBusy(true);
    setError("");
    setNotice("");

    try {
      await operation();
    } catch (failure) {
      setError(
        failure?.response?.data?.message ||
          "Completion could not be confirmed. Refresh and inspect history before retrying with the same reference."
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };

  const openDebt = (debt = null) => {
    setRepayment(null);
    setEditing(debt);
    creationId.current = crypto.randomUUID();

    setForm(
      debt
        ? Object.fromEntries(
            editable.map((key) => [
              key,
              debt[key] ?? "",
            ])
          )
        : blankDebt()
    );
  };

  const saveDebt = (event) => {
    event.preventDefault();

    mutate(async () => {
      const payload = {
        ...form,
        ...(
          !editing
            ? { requestId: creationId.current }
            : {}
        ),
      };

      if (editing) {
        await api.put(
          `/api/debt-manager/${encodeURIComponent(
            editing.debtNumber
          )}`,
          payload
        );
      } else {
        await api.post("/api/debt-manager", payload);
      }

      setForm(null);
      setEditing(null);

      setNotice(
        "Debt details saved. No opening accounting journal was created."
      );

      await load();
    });
  };

  const openPayment = (debt, mode) => {
    setForm(null);

    setRepayment({
      debtNumber: debt.debtNumber,
      debtName: debt.debtName,
      mode,
      principalAmount: "",
      interestAmount: "0",
      paymentDate: today(),
      accountNumber: "",
      paymentReference: "",
      journalEntryNumber: "",
      notes: "",
      confirmNewPosting: false,
      confirmNotAlreadyTracked: false,
    });
  };

  const savePayment = (event) => {
    event.preventDefault();

    mutate(async () => {
      const response = await api.post(
        `/api/debt-manager/${encodeURIComponent(
          repayment.debtNumber
        )}/payments`,
        repayment
      );

      setNotice(
        `${response.data.message} Journal: ` +
          response.data.data.payment.journalEntryNumber
      );

      setRepayment(null);
      await load();
    });
  };

  const updateForm = (event) =>
    setForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));

  const updatePayment = (event) =>
    setRepayment((previous) => ({
      ...previous,
      [event.target.name]:
        event.target.type === "checkbox"
          ? event.target.checked
          : event.target.value,
    }));

  const matches = (record) =>
    [
      record.debtNumber,
      record.debtName,
      record.lenderName,
      record.paymentReference,
      record.journalEntryNumber,
    ]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase());

  const debts = data?.debts || [];
  const payments = data?.payments || [];

  const lockedBalances =
    editing &&
    payments.some(
      (payment) =>
        payment.debtNumber === editing.debtNumber
    );

  const lockedMapping =
    editing &&
    payments.some(
      (payment) =>
        payment.debtNumber === editing.debtNumber &&
        payment.journalEntryNumber
    );

  return (
    <div>
      <h1>Debt Manager</h1>

      <p>
        Plan business repayments and record or link their
        accounting entries. Only principal reduces the
        tracked debt balance.
      </p>

      <div
        style={{
          ...panel,
          background: "#fffbeb",
        }}
      >
        Creating a debt registers its reviewed balance;
        it does not record a loan receipt or create an
        opening liability journal. Historical payments
        are retained as recorded. Confirm old balances
        and currency before using either repayment
        action. Interest rates and due days are planning
        information; interest and arrears are not
        calculated automatically.
      </div>

      {error && (
        <div
          role="alert"
          style={{ ...panel, color: "#b91c1c" }}
        >
          {error}
        </div>
      )}

      {notice && (
        <div role="status" style={panel}>
          {notice}
        </div>
      )}

      <button
        disabled={busy || loading}
        style={button}
        onClick={() => openDebt()}
      >
        Add Debt
      </button>

      <button
        disabled={busy || loading}
        style={button}
        onClick={() => {
          setError("");
          load();
        }}
      >
        Refresh
      </button>

      {loading && (
        <p role="status">Loading debt records…</p>
      )}

      {data && (
        <>
          <div style={{ ...grid, marginTop: 18 }}>
            {[
              [
                "Recorded current principal",
                data.summary.totalCurrentDebt,
              ],
              [
                "Recorded starting principal",
                data.summary.totalStartingDebt,
              ],
              [
                "Accounting-linked payments",
                data.summary.totalPaid,
              ],
              [
                "Planned monthly payments",
                data.summary.monthlyRequired,
              ],
            ].map(([label, value]) => (
              <div style={panel} key={label}>
                <strong>{label}</strong>
                <h2 style={{ color: blue }}>
                  {money(value)}
                </h2>
              </div>
            ))}
          </div>

          {!!data.summary.unconfirmedDebtCount && (
            <p>
              {data.summary.unconfirmedDebtCount} debt(s)
              have unconfirmed currency. Combined debt
              totals are unavailable until reviewed.
            </p>
          )}

          {!!data.summary.legacyPaymentCount && (
            <p>
              {data.summary.legacyPaymentCount} historical
              payment(s) have no recorded journal link.
              They are excluded from accounting-linked
              payment totals. Do not link them again if
              already included in the tracker balance.
            </p>
          )}

          {form && (
            <form style={panel} onSubmit={saveDebt}>
              <h2>
                {editing ? "Edit Debt" : "Add Debt"}
              </h2>

              <div style={grid}>
                {Object.entries(labels).map(
                  ([key, label]) => (
                    <label key={key}>
                      {label}

                      <input
                        style={control}
                        name={key}
                        value={form[key]}
                        onChange={updateForm}
                        required={
                          key === "debtName" ||
                          key === "startingBalance"
                        }
                        readOnly={
                          lockedBalances &&
                          [
                            "startingBalance",
                            "currentBalance",
                          ].includes(key)
                        }
                        type={
                          key.endsWith("Date")
                            ? "date"
                            : [
                                "startingBalance",
                                "currentBalance",
                                "monthlyPayment",
                                "interestRate",
                                "dueDay",
                              ].includes(key)
                              ? "number"
                              : "text"
                        }
                        min={
                          [
                            "startingBalance",
                            "currentBalance",
                            "monthlyPayment",
                            "interestRate",
                          ].includes(key)
                            ? "0"
                            : key === "dueDay"
                              ? "1"
                              : undefined
                        }
                        max={
                          key === "dueDay"
                            ? "31"
                            : undefined
                        }
                        step={
                          key === "dueDay"
                            ? "1"
                            : "any"
                        }
                      />
                    </label>
                  )
                )}

                <label>
                  Debt type

                  <select
                    style={control}
                    name="debtType"
                    value={form.debtType}
                    onChange={updateForm}
                  >
                    {types.map((type) => (
                      <option key={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Confirmed debt currency

                  <select
                    required
                    disabled={lockedMapping}
                    style={control}
                    name="currency"
                    value={form.currency}
                    onChange={updateForm}
                  >
                    <option value="">
                      Confirm currency
                    </option>
                    <option value="JMD">JMD</option>
                  </select>
                </label>

                <label>
                  Business responsible

                  <select
                    required
                    disabled={lockedMapping}
                    style={control}
                    name="entityCode"
                    value={form.entityCode}
                    onChange={updateForm}
                  >
                    <option value="">
                      Select business
                    </option>

                    {data.entities.map((entity) => (
                      <option
                        key={entity.entityCode}
                        value={entity.entityCode}
                      >
                        {entity.entityCode} —{" "}
                        {entity.legalName}
                      </option>
                    ))}
                  </select>
                </label>

                {[
                  "liabilityAccountCode",
                  "interestAccountCode",
                ].map((key) => (
                  <label key={key}>
                    {key === "liabilityAccountCode"
                      ? "Liability ledger account"
                      : "Interest expense account (needed when interest is paid)"}

                    <select
                      required={
                        key === "liabilityAccountCode"
                      }
                      disabled={lockedMapping}
                      style={control}
                      name={key}
                      value={form[key]}
                      onChange={updateForm}
                    >
                      <option value="">
                        Select account
                      </option>

                      {data.chartAccounts
                        .filter((account) =>
                          key === "liabilityAccountCode"
                            ? account.accountCategory ===
                                "Liability" &&
                              account.normalBalance ===
                                "Credit"
                            : account.accountCategory ===
                                "Expense" &&
                              account.normalBalance ===
                                "Debit"
                        )
                        .map((account) => (
                          <option
                            key={account.accountCode}
                            value={account.accountCode}
                          >
                            {account.accountCode} —{" "}
                            {account.accountName}
                          </option>
                        ))}
                    </select>
                  </label>
                ))}

                <label>
                  Status

                  <select
                    style={control}
                    name="status"
                    value={form.status}
                    onChange={updateForm}
                  >
                    {[
                      "Active",
                      "Paused",
                      "Paid Off",
                    ].map((status) => (
                      <option key={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Notes

                  <textarea
                    style={control}
                    name="notes"
                    value={form.notes}
                    onChange={updateForm}
                  />
                </label>
              </div>

              <p>
                Review the recorded principal against
                the lender and liability ledger.
                Balances are locked after any
                repayment; accounting mappings are
                locked after an accounting-linked
                repayment.
              </p>

              <button style={button} disabled={busy}>
                Save Debt
              </button>

              <button
                style={button}
                type="button"
                disabled={busy}
                onClick={() => setForm(null)}
              >
                Cancel
              </button>
            </form>
          )}

          {repayment && (
            <form style={panel} onSubmit={savePayment}>
              <h2>
                {repayment.mode === "New"
                  ? "Record New Repayment"
                  : "Link Posted Repayment"}
                {" — "}
                {repayment.debtName}
              </h2>

              <p>
                {repayment.mode === "New"
                  ? "Use only after the real payment was made and only if it has not been posted elsewhere. This creates the journal and cashbook withdrawal."
                  : "This verifies the existing journal and ledger. It creates no new withdrawal or journal."}
              </p>

              <p>
                For linking, the journal reference
                must be exactly{" "}
                <strong>
                  {repayment.debtNumber}
                </strong>
                , with the same business and payment
                date.
              </p>

              <div style={grid}>
                {[
                  [
                    "principalAmount",
                    "Principal paid",
                    "number",
                  ],
                  [
                    "interestAmount",
                    "Interest paid",
                    "number",
                  ],
                  [
                    "paymentDate",
                    "Payment date",
                    "date",
                  ],
                  [
                    "paymentReference",
                    "Unique bank/cash payment reference",
                    "text",
                  ],
                ].map(([name, label, type]) => (
                  <label key={name}>
                    {label}

                    <input
                      style={control}
                      required
                      name={name}
                      type={type}
                      min={
                        type === "number"
                          ? "0"
                          : undefined
                      }
                      step={
                        type === "number"
                          ? "0.01"
                          : undefined
                      }
                      value={repayment[name]}
                      onChange={updatePayment}
                    />
                  </label>
                ))}

                <label>
                  Paying JMD bank/cash account

                  <select
                    required
                    style={control}
                    name="accountNumber"
                    value={repayment.accountNumber}
                    onChange={updatePayment}
                  >
                    <option value="">
                      Select paying account
                    </option>

                    {data.financialAccounts
                      .filter(
                        (account) =>
                          account.currency === "JMD" &&
                          account.linkedChartAccountCode
                      )
                      .map((account) => (
                        <option
                          key={account.accountNumber}
                          value={account.accountNumber}
                        >
                          {account.accountName} —{" "}
                          {account.accountNumber}
                        </option>
                      ))}
                  </select>
                </label>

                {repayment.mode === "Link" && (
                  <label>
                    Posted journal number

                    <input
                      required
                      style={control}
                      name="journalEntryNumber"
                      value={
                        repayment.journalEntryNumber
                      }
                      onChange={updatePayment}
                    />
                  </label>
                )}

                <label>
                  Notes

                  <textarea
                    style={control}
                    name="notes"
                    value={repayment.notes}
                    onChange={updatePayment}
                  />
                </label>
              </div>

              <p>
                Total repayment:{" "}
                <strong>
                  {money(
                    Number(
                      repayment.principalAmount || 0
                    ) +
                      Number(
                        repayment.interestAmount || 0
                      )
                  )}
                </strong>
              </p>

              <p>
                <label>
                  <input
                    required
                    type="checkbox"
                    name="confirmNotAlreadyTracked"
                    checked={
                      repayment.confirmNotAlreadyTracked
                    }
                    onChange={updatePayment}
                  />{" "}
                  I reviewed the current principal and
                  history. This payment has not
                  already reduced this tracker balance.
                </label>
              </p>

              {repayment.mode === "New" && (
                <p>
                  <label>
                    <input
                      required
                      type="checkbox"
                      name="confirmNewPosting"
                      checked={
                        repayment.confirmNewPosting
                      }
                      onChange={updatePayment}
                    />{" "}
                    This payment has not already been
                    posted in accounting.
                  </label>
                </p>
              )}

              <button style={button} disabled={busy}>
                {busy
                  ? "Processing…"
                  : repayment.mode === "New"
                    ? "Post Repayment & Update Debt"
                    : "Verify Journal & Link Repayment"}
              </button>

              <button
                type="button"
                style={button}
                disabled={busy}
                onClick={() => setRepayment(null)}
              >
                Cancel
              </button>

              <p>
                If completion is uncertain, refresh
                and inspect history. Retrying unchanged
                details with the same reference will
                not create another repayment.
              </p>
            </form>
          )}

          <input
            style={{
              ...control,
              marginBottom: 18,
            }}
            placeholder="Search debt, lender, reference or journal"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />

          <Table
            title="Debt accounts"
            headings={[
              "Debt",
              "Business / currency",
              "Recorded principal",
              "Monthly plan / due day",
              "Status",
              "Actions",
            ]}
            rows={debts.filter(matches).map((debt) => [
              <span>
                {debt.debtName}
                <br />
                {debt.debtNumber}
                <br />
                {debt.lenderName}
              </span>,

              `${debt.entityCode || "Not recorded"} / ${
                debt.currency || "Not confirmed"
              }`,

              money(
                debt.currentBalance,
                debt.currency ||
                  "Currency unconfirmed:"
              ),

              `${money(
                debt.monthlyPayment,
                debt.currency ||
                  "Currency unconfirmed:"
              )} / ${debt.dueDay || "—"}`,

              debt.status,

              <>
                <button
                  disabled={busy || loading}
                  style={button}
                  onClick={() => openDebt(debt)}
                >
                  Edit
                </button>

                {debt.status === "Active" &&
                  debt.currency === "JMD" && (
                    <>
                      <button
                        disabled={busy || loading}
                        style={button}
                        onClick={() =>
                          openPayment(debt, "New")
                        }
                      >
                        Record New Repayment
                      </button>

                      <button
                        disabled={busy || loading}
                        style={button}
                        onClick={() =>
                          openPayment(debt, "Link")
                        }
                      >
                        Link Posted Repayment
                      </button>
                    </>
                  )}
              </>,
            ])}
          />

          <Table
            title="Repayment history"
            headings={[
              "Debt / date",
              "Total",
              "Principal",
              "Interest",
              "Workflow / journal",
              "Payment reference / source",
            ]}
            rows={payments
              .filter(matches)
              .map((payment) => [
                `${payment.debtName} / ${
                  payment.paymentDate
                }`,

                money(
                  payment.amountPaid,
                  payment.currency ||
                    "Currency unrecorded:"
                ),

                money(
                  payment.principalAmount,
                  payment.currency ||
                    "Currency unrecorded:"
                ),

                money(
                  payment.interestAmount,
                  payment.currency ||
                    "Currency unrecorded:"
                ),

                `${
                  payment.mode ||
                  "Historical tracker record"
                } / ${
                  payment.journalEntryNumber ||
                  "No journal link recorded"
                }`,

                `${
                  payment.paymentReference || "—"
                } / ${payment.paidFrom || "—"}`,
              ])}
          />
        </>
      )}
    </div>
  );
}

function Table({ title, headings, rows }) {
  return (
    <div style={panel}>
      <h2 style={{ color: blue }}>{title}</h2>

      <div
        style={{
          overflowX: "auto",
          maxHeight: 500,
        }}
      >
        <table
          style={{
            borderCollapse: "collapse",
            width: "100%",
            minWidth: 900,
          }}
        >
          <thead>
            <tr>
              {headings.map((heading) => (
                <th key={heading} style={cell}>
                  {heading}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.length ? (
              rows.map((row, index) => (
                <tr key={index}>
                  {row.map((value, column) => (
                    <td key={column} style={cell}>
                      {value}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  style={cell}
                  colSpan={headings.length}
                >
                  No records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DebtManager;