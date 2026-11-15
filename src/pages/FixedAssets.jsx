import {
  useEffect,
  useRef,
  useState,
} from "react";

import api from "../api";

const BLUE = "#0B3D91";
const policy = "SL_PRORATA_V1";

const categories = [
  "Vehicle",
  "Computer Equipment",
  "Furniture",
  "Office Equipment",
  "Warehouse Equipment",
  "Building",
  "Leasehold Improvement",
  "Other",
];

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

const input = {
  display: "block",
  width: "100%",
  padding: 9,
  boxSizing: "border-box",
  marginTop: 5,
};

const button = {
  background: BLUE,
  color: "white",
  border: 0,
  padding: "10px 14px",
  borderRadius: 8,
  cursor: "pointer",
  margin: "10px 10px 0 0",
};

const cell = {
  padding: 9,
  border: "1px solid #dbe3ef",
  textAlign: "left",
};

const money = (value, currency = "JMD") =>
  value === undefined ||
  value === null ||
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

const today = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Jamaica",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  return ["year", "month", "day"]
    .map(
      (key) =>
        parts.find((part) => part.type === key).value
    )
    .join("-");
};

const lastMonth = () => {
  const date = new Date(
    `${today().slice(0, 7)}-01T00:00:00Z`
  );

  date.setUTCMonth(date.getUTCMonth() - 1);

  return date.toISOString().slice(0, 7);
};

const initialForm = () => ({
  assetName: "",
  assetCategory: "Warehouse Equipment",
  purchaseDate: today(),
  inServiceDate: today(),
  purchaseCost: "",
  salvageValue: "0",
  usefulLifeYears: "5",
  currency: "",
  entityCode: "",
  assetAccountCode: "",
  depreciationExpenseAccountCode: "",
  accumulatedDepreciationAccountCode: "",
  acquisitionJournalEntryNumber: "",
  notes: "",
  confirmAcquisitionReviewed: false,
});

function FixedAssets() {
  const [data, setData] = useState(null);
  const [form, setForm] = useState(null);
  const [period, setPeriod] = useState(lastMonth);
  const [selected, setSelected] = useState([]);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const lock = useRef(false);

  const load = async () => {
    const response = await api.get(
      "/api/fixed-assets"
    );

    setData(response.data);
  };

  const action = async (fn) => {
    if (lock.current) return;

    lock.current = true;
    setBusy(true);
    setError("");
    setNotice("");

    try {
      await fn();
    } catch (failure) {
      setError(
        failure?.response?.data?.message ||
          "Completion could not be confirmed. Refresh and review history before retrying the same period."
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };

  useEffect(() => {
    action(load);
  }, []);

  const update = (event) =>
    setForm((old) => ({
      ...old,
      [event.target.name]:
        event.target.type === "checkbox"
          ? event.target.checked
          : event.target.value,
    }));

  const save = (event) => {
    event.preventDefault();

    action(async () => {
      const response = await api.post(
        "/api/fixed-assets",
        form
      );

      setForm(null);
      setNotice(response.data.message);
      setPreview(null);

      await load();
    });
  };

  const inspect = () =>
    action(async () => {
      setPreview(null);

      const response = await api.post(
        "/api/fixed-assets/run-depreciation",
        {
          preview: true,
          period,
          assetNumbers: selected,
        }
      );

      setPreview(response.data);
      setNotice(response.data.message);
    });

  const post = () => {
    if (
      !preview ||
      !window.confirm(
        `Post the reviewed ${preview.period} depreciation? No bank/cash withdrawal will be created.`
      )
    ) {
      return;
    }

    action(async () => {
      const response = await api.post(
        "/api/fixed-assets/run-depreciation",
        {
          period: preview.period,
          assetNumbers: selected,
          snapshotHash: preview.snapshotHash,
        }
      );

      setNotice(response.data.message);
      setPreview(null);

      await load();
    });
  };

  const select = (number) => {
    setSelected((old) =>
      old.includes(number)
        ? old.filter((value) => value !== number)
        : [...old, number]
    );

    setPreview(null);
  };

  const accounts = data?.chartAccounts || [];
  const assets = data?.data || [];

  return (
    <div>
      <h1>Fixed Assets &amp; Depreciation</h1>

      <p>
        Register reviewed acquisitions and post
        period-based depreciation to accounting.
      </p>

      <div
        style={{
          ...panel,
          background: "#fffbeb",
        }}
      >
        Straight-line depreciation starts when the
        asset is ready for use. The first month is
        prorated by calendar days including the ready
        date; later months use cumulative rounding,
        with the final charge limited to salvage value.
        Only completed months can be posted, in
        sequence. Registration links an existing
        acquisition journal and creates no second
        purchase or withdrawal. Historical assets
        require a reviewed baseline; this update does
        not backfill their depreciation. Disposed
        assets remain historical records; this screen
        does not post disposals.
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

      {busy && (
        <p role="status">Processing…</p>
      )}

      <button
        disabled={busy || !data}
        style={button}
        onClick={() =>
          setForm(form ? null : initialForm())
        }
      >
        {form
          ? "Close Form"
          : "Register Acquired Asset"}
      </button>

      <button
        disabled={busy}
        style={button}
        onClick={() =>
          action(async () => {
            setPreview(null);
            await load();
          })
        }
      >
        Refresh Register
      </button>

      {data && (
        <>
          <div style={{ ...grid, marginTop: 18 }}>
            {[
              [
                "Assets in register",
                data.summary.totalAssets,
                false,
              ],
              [
                "Held-asset cost",
                data.summary.totalAssetCost,
                true,
              ],
              [
                "Held accumulated depreciation",
                data.summary.totalAccumulatedDepreciation,
                true,
              ],
              [
                "Held carrying value",
                data.summary.totalNetBookValue,
                true,
              ],
            ].map(([label, value, currency]) => (
              <div style={panel} key={label}>
                <strong>{label}</strong>

                <h2 style={{ color: BLUE }}>
                  {currency ? money(value) : value}
                </h2>
              </div>
            ))}
          </div>

          {!!data.summary.historicalReviewCount && (
            <p>
              {data.summary.historicalReviewCount}{" "}
              historical asset(s) require review.
              Combined monetary totals are unavailable
              when held assets have unconfirmed
              currency.
            </p>
          )}

          {form && (
            <form style={panel} onSubmit={save}>
              <h2>
                Register an acquisition already
                posted in accounting
              </h2>

              <div style={grid}>
                {[
                  [
                    "assetName",
                    "Asset name",
                    "text",
                  ],
                  [
                    "purchaseDate",
                    "Acquisition posting date",
                    "date",
                  ],
                  [
                    "inServiceDate",
                    "Ready-for-use date",
                    "date",
                  ],
                  [
                    "purchaseCost",
                    "Purchase cost — JMD",
                    "number",
                  ],
                  [
                    "salvageValue",
                    "Estimated salvage value — JMD",
                    "number",
                  ],
                  [
                    "usefulLifeYears",
                    "Useful life in years (whole months)",
                    "number",
                  ],
                  [
                    "acquisitionJournalEntryNumber",
                    "Posted acquisition journal number",
                    "text",
                  ],
                ].map(([name, label, type]) => (
                  <label key={name}>
                    {label}
                    <input
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
                          ? "any"
                          : undefined
                      }
                      style={input}
                      value={form[name]}
                      onChange={update}
                    />
                  </label>
                ))}

                <label>
                  Category
                  <select
                    name="assetCategory"
                    style={input}
                    value={form.assetCategory}
                    onChange={update}
                  >
                    {categories.map((category) => (
                      <option key={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Confirmed currency
                  <select
                    required
                    name="currency"
                    style={input}
                    value={form.currency}
                    onChange={update}
                  >
                    <option value="">
                      Confirm currency
                    </option>
                    <option>JMD</option>
                  </select>
                </label>

                <label>
                  Owning business
                  <select
                    required
                    name="entityCode"
                    style={input}
                    value={form.entityCode}
                    onChange={update}
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
                  [
                    "assetAccountCode",
                    "Fixed/non-current asset account",
                    "Asset",
                    "Debit",
                  ],
                  [
                    "accumulatedDepreciationAccountCode",
                    "Accumulated depreciation — contra-asset",
                    "Asset",
                    "Credit",
                  ],
                  [
                    "depreciationExpenseAccountCode",
                    "Depreciation expense account",
                    "Expense",
                    "Debit",
                  ],
                ].map(
                  ([name, label, category, normal]) => (
                    <label key={name}>
                      {label}

                      <select
                        required
                        name={name}
                        style={input}
                        value={form[name]}
                        onChange={update}
                      >
                        <option value="">
                          Select account
                        </option>

                        {accounts
                          .filter(
                            (account) =>
                              account.accountCategory ===
                                category &&
                              account.normalBalance ===
                                normal &&
                              (
                                name !==
                                  "assetAccountCode" ||
                                [
                                  "fixedasset",
                                  "noncurrentasset",
                                  "longtermasset",
                                ].includes(
                                  String(
                                    account.accountType ||
                                      ""
                                  )
                                    .toLowerCase()
                                    .replace(/[-\s]/g, "")
                                )
                              )
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
                  )
                )}

                <label>
                  Notes
                  <textarea
                    name="notes"
                    style={input}
                    value={form.notes}
                    onChange={update}
                  />
                </label>
              </div>

              <p>
                The acquisition journal must contain
                this asset&apos;s full cost, with the
                same date, business and asset account.
                Mixed acquisitions need separate review.
              </p>

              <p>
                <label>
                  <input
                    required
                    type="checkbox"
                    name="confirmAcquisitionReviewed"
                    checked={
                      form.confirmAcquisitionReviewed
                    }
                    onChange={update}
                  />{" "}
                  I reviewed the acquisition and
                  register. This asset is not already
                  registered, and the supporting
                  accounting entry is correct.
                </label>
              </p>

              <button
                disabled={busy}
                style={button}
              >
                Register Asset — No New Purchase Posting
              </button>
            </form>
          )}

          <div style={panel}>
            <h2>Preview and post depreciation</h2>

            <label>
              Completed calendar month
              <input
                type="month"
                value={period}
                disabled={busy}
                style={input}
                onChange={(event) => {
                  setPeriod(event.target.value);
                  setPreview(null);
                }}
              />
            </label>

            <p>
              Select eligible assets in the register
              below. Each asset must be processed from
              its first ready-for-use month onward
              without skipping months.
            </p>

            <button
              disabled={busy || !selected.length}
              style={button}
              onClick={inspect}
            >
              Preview Selected Assets
            </button>

            {preview && (
              <>
                <Table
                  title={`Preview — ${preview.period}`}
                  headings={[
                    "Asset",
                    "Charge",
                    "Accumulated after period",
                    "Carrying value after period",
                    "State",
                  ]}
                  rows={preview.rows.map((row) => [
                    row.assetName,
                    money(row.amount),
                    money(row.after),
                    money(row.net),

                    row.alreadyPosted
                      ? `Already recorded — ${
                          row.journalEntryNumber ||
                          "zero charge"
                        }`
                      : row.amount === 0
                        ? "Zero charge — rounding history only"
                        : "Ready to post",
                  ])}
                />

                <button
                  disabled={
                    busy ||
                    !data.permissions.canPostDepreciation
                  }
                  style={button}
                  onClick={post}
                >
                  Post Reviewed Depreciation
                </button>

                {!data.permissions.canPostDepreciation && (
                  <p>
                    Finance users can preview; only an
                    Admin can post.
                  </p>
                )}
              </>
            )}
          </div>

          <Table
            title="Asset register"
            headings={[
              "Include",
              "Asset / business",
              "Dates",
              "Cost / salvage",
              "Useful life / normal monthly estimate",
              "Accumulated / carrying value",
              "Status / review",
              "Acquisition journal",
            ]}
            rows={assets.map((asset) => [
              <input
                type="checkbox"
                disabled={
                  busy ||
                  asset.policyVersion !== policy ||
                  asset.status === "Disposed"
                }
                checked={selected.includes(
                  asset.assetNumber
                )}
                onChange={() =>
                  select(asset.assetNumber)
                }
                aria-label={`Include ${asset.assetName}`}
              />,

              <span>
                {asset.assetName}
                <br />
                {asset.assetNumber}
                <br />
                {asset.entityCode ||
                  "Business unrecorded"}
              </span>,

              `${asset.purchaseDate} / ready ${
                asset.inServiceDate || "unrecorded"
              }`,

              `${money(
                asset.purchaseCost,
                asset.currency ||
                  "Currency unconfirmed:"
              )} / ${money(
                asset.salvageValue,
                asset.currency ||
                  "Currency unconfirmed:"
              )}`,

              `${asset.usefulLifeYears} years / ${money(
                asset.monthlyDepreciation,
                asset.currency ||
                  "Currency unconfirmed:"
              )}`,

              `${money(
                asset.accumulatedDepreciation,
                asset.currency ||
                  "Currency unconfirmed:"
              )} / ${money(
                asset.netBookValue,
                asset.currency ||
                  "Currency unconfirmed:"
              )}`,

              `${asset.status} / ${
                asset.policyVersion === policy
                  ? "Controlled schedule"
                  : "Historical baseline review required"
              }`,

              asset.acquisitionJournalEntryNumber ||
                "Not recorded",
            ])}
          />

          <Table
            title="Controlled depreciation history"
            headings={[
              "Asset",
              "Period",
              "Charge",
              "Journal",
              "Posted by",
            ]}
            rows={assets.flatMap((asset) =>
              (
                asset.depreciationHistory || []
              ).map((record) => [
                asset.assetName,
                record.period,
                money(record.amount),

                record.journalEntryNumber ||
                  "Zero charge — no journal",

                record.postedBy,
              ])
            )}
          />

          <div style={panel}>
            <h2>
              Mapped register / ledger comparison
            </h2>

            <p>
              Comparison covers controlled held assets
              and recorded ledger balances through
              today, by business and mapped account.
              Other assets, unassigned ledger entries
              and historical records may cause
              differences. Zero difference is not
              proof of completeness. No balances are
              corrected automatically.
            </p>

            <Table
              headings={[
                "Business / account",
                "Type",
                "Controlled register",
                "Recorded ledger",
                "Register less ledger",
              ]}
              rows={(
                data.comparisons || []
              ).map((row) => [
                `${row.entityCode} / ${row.accountCode}`,
                row.kind,
                money(row.register),
                money(row.ledger),
                money(row.difference),
              ])}
            />
          </div>
        </>
      )}
    </div>
  );
}

function Table({ title, headings, rows }) {
  return (
    <div style={panel}>
      {title && (
        <h2 style={{ color: BLUE }}>{title}</h2>
      )}

      <div
        style={{
          overflowX: "auto",
          maxHeight: 500,
        }}
      >
        <table
          style={{
            width: "100%",
            minWidth: 850,
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr>
              {headings.map((heading) => (
                <th
                  key={heading}
                  style={cell}
                >
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
                    <td
                      key={column}
                      style={cell}
                    >
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
                  No records to display.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default FixedAssets;