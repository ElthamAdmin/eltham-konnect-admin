import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import api from "../../api";

const emptyForm = () => ({
  category: "",
  group: "",
  accountCode: "",
  description: "",
});

const messageFor = (error) =>
  error?.response?.data?.message ||
  error.message ||
  "Could not complete the category request.";

const fieldStyle = {
  padding: 10,
  border: "1px solid #cbd5e1",
  borderRadius: 7,
  width: "100%",
  boxSizing: "border-box",
};

const buttonStyle = {
  padding: "9px 12px",
  border: "1px solid #cbd5e1",
  borderRadius: 7,
  background: "#fff",
  cursor: "pointer",
};

export default function ExpenseCategoryManager({ onSaved }) {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [auditWarning, setAuditWarning] = useState("");

  const requestId = useRef(0);
  const busy = useRef(false);

  const load = useCallback(async () => {
    const current = ++requestId.current;

    setLoading(true);
    setError("");

    try {
      const [list, choices] = await Promise.all([
        api.get(
          "/api/finance/expense-categories?includeInactive=true"
        ),
        api.get(
          "/api/finance/expense-categories/posting-accounts"
        ),
      ]);

      if (current !== requestId.current) return false;

      if (
        list.data?.success !== true ||
        list.data.canManageCategories !== true ||
        !Array.isArray(list.data.data) ||
        choices.data?.success !== true ||
        !Array.isArray(choices.data.data)
      ) {
        throw new Error(
          "Category settings could not be loaded completely."
        );
      }

      setCategories(list.data.data);
      setAccounts(choices.data.data);

      return true;
    } catch (error) {
      if (current === requestId.current) {
        setCategories([]);
        setAccounts([]);
        setError(messageFor(error));
      }

      return false;
    } finally {
      if (current === requestId.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (open) load();

    return () => {
      requestId.current += 1;
    };
  }, [open, load]);

  const resetForm = () => {
    setEditing(null);
    setForm(emptyForm());
  };

  const startEdit = (category) => {
    setEditing(category);

    setForm({
      category: category.category,
      group: category.group,
      accountCode: category.accountCode,
      description: category.description || "",
    });

    setError("");
    setNotice("");
    setAuditWarning("");
  };

  const changeField = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const saveCategory = async (event) => {
    event.preventDefault();

    if (busy.current || loading) return;

    busy.current = true;
    setSaving(true);
    setError("");
    setNotice("");
    setAuditWarning("");

    let committed = false;
    const wasEditing = Boolean(editing);

    try {
      const payload = {
        category: form.category.trim(),
        group: form.group.trim(),
        accountCode: form.accountCode,
        description: form.description.trim(),
      };

      if (
        !payload.category ||
        !payload.group ||
        !payload.accountCode
      ) {
        throw new Error(
          "Enter a category name, group and ledger account."
        );
      }

      const response = editing
        ? await api.put(
            `/api/finance/expense-categories/${editing._id}`,
            {
              ...payload,
              version: editing.version,
            }
          )
        : await api.post(
            "/api/finance/expense-categories",
            payload
          );

      if (
        response.data?.success !== true ||
        !response.data.data?._id
      ) {
        throw new Error(
          "The category save response is incomplete. Reload categories before retrying."
        );
      }

      committed = true;
      resetForm();

      setNotice(
        wasEditing
          ? "Category settings saved. Existing expenses retain their recorded details."
          : "Category created. It will be selected in the expense form after the category list refreshes."
      );

      setAuditWarning(response.data.auditWarning || "");

      await load();

      const refreshed = await onSaved(
        wasEditing ? null : response.data.data
      );

      if (refreshed === false) {
        setError(
          "Category saved, but the expense category list could not refresh. Refresh before recording an expense."
        );
      }
    } catch (error) {
      setError(
        committed
          ? `Category saved, but refresh failed: ${messageFor(error)}`
          : messageFor(error)
      );
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };

  const changeStatus = async (category) => {
    if (busy.current || loading) return;

    busy.current = true;
    setSaving(true);
    setError("");
    setNotice("");
    setAuditWarning("");

    let committed = false;

    try {
      const status =
        category.status === "Active"
          ? "Inactive"
          : "Active";

      const response = await api.put(
        `/api/finance/expense-categories/${category._id}`,
        {
          status,
          version: category.version,
        }
      );

      if (response.data?.success !== true) {
        throw new Error(
          "Category status could not be confirmed. Reload categories before retrying."
        );
      }

      committed = true;

      if (editing?._id === category._id) {
        resetForm();
      }

      setNotice(
        `${category.category} is now ${status.toLowerCase()}. Existing expenses are unchanged.`
      );

      setAuditWarning(response.data.auditWarning || "");

      await load();

      const refreshed = await onSaved(null);

      if (refreshed === false) {
        setError(
          "Status saved, but the expense category list could not refresh."
        );
      }
    } catch (error) {
      setError(
        committed
          ? `Status saved, but refresh failed: ${messageFor(error)}`
          : messageFor(error)
      );
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };

  const selectedAccount = accounts.find(
    (account) => account.accountCode === form.accountCode
  );

  const disabled = loading || saving;

  return (
    <section
      style={{
        border: "1px solid #dbe3ef",
        borderRadius: 10,
        padding: 14,
        marginBottom: 18,
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        disabled={saving}
        aria-expanded={open}
        style={buttonStyle}
      >
        {open
          ? "Hide category manager"
          : "Create / Manage My Expense Categories"}
      </button>

      {open && (
        <div style={{ marginTop: 16 }}>
          <h3 style={{ color: "#0b3d91", marginTop: 0 }}>
            {editing
              ? "Edit Category"
              : "Create Your Expense Category"}
          </h3>

          <p style={{ fontSize: 13 }}>
            Use your own category names and groups.
            The ledger account determines the accounting
            destination. No preset categories are added.
          </p>

          {error && (
            <p role="alert" style={{ color: "#b91c1c" }}>
              {error}
            </p>
          )}

          {notice && (
            <p role="status" style={{ color: "#166534" }}>
              {notice}
            </p>
          )}

          {auditWarning && (
            <p role="alert" style={{ color: "#92400e" }}>
              {auditWarning}
            </p>
          )}

          {loading && (
            <p role="status">Loading category settings…</p>
          )}

          <button
            type="button"
            onClick={() => load()}
            disabled={disabled}
            style={buttonStyle}
          >
            Reload Category Settings
          </button>

          <form
            onSubmit={saveCategory}
            style={{ marginTop: 14 }}
          >
            <fieldset
              disabled={disabled}
              style={{
                border: 0,
                padding: 0,
                margin: 0,
                minWidth: 0,
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(min(100%, 240px), 1fr))",
                  gap: 12,
                }}
              >
                <label>
                  Category name
                  <input
                    name="category"
                    value={form.category}
                    onChange={changeField}
                    required
                    maxLength={120}
                    style={fieldStyle}
                  />
                </label>

                <label>
                  Your expense group
                  <input
                    name="group"
                    value={form.group}
                    onChange={changeField}
                    required
                    maxLength={100}
                    style={fieldStyle}
                  />
                </label>

                <label>
                  Post spending to ledger account
                  <select
                    name="accountCode"
                    value={form.accountCode}
                    onChange={changeField}
                    required
                    style={fieldStyle}
                  >
                    <option value="">
                      Select accounting destination
                    </option>

                    {form.accountCode && !selectedAccount && (
                      <option
                        value={form.accountCode}
                        disabled
                      >
                        Current mapping unavailable — choose an account
                      </option>
                    )}

                    {accounts.map((account) => (
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
                  Description / purpose
                  <input
                    name="description"
                    value={form.description}
                    onChange={changeField}
                    maxLength={500}
                    style={fieldStyle}
                  />
                </label>
              </div>

              <p style={{ fontSize: 13 }}>
                Classification:{" "}
                {selectedAccount?.classification ||
                  "Select a ledger account"}
              </p>

              {!accounts.length && !loading && (
                <p>
                  No eligible ledger accounts were loaded.
                  Reload settings or review the Chart of Accounts.
                </p>
              )}

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 10,
                }}
              >
                <button
                  type="submit"
                  disabled={!accounts.length}
                  style={{
                    ...buttonStyle,
                    background: "#0b3d91",
                    color: "#fff",
                  }}
                >
                  {saving
                    ? "Saving…"
                    : editing
                      ? "Save Category"
                      : "Create & Use Category"}
                </button>

                {editing && (
                  <button
                    type="button"
                    onClick={resetForm}
                    style={buttonStyle}
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </fieldset>
          </form>

          <h3
            style={{
              color: "#0b3d91",
              marginTop: 24,
            }}
          >
            Your Saved Categories
          </h3>

          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 13,
              }}
            >
              <thead>
                <tr>
                  {[
                    "Category",
                    "Group",
                    "Ledger Account",
                    "Classification",
                    "Status",
                    "Mapping Review",
                    "Actions",
                  ].map((heading) => (
                    <th
                      key={heading}
                      scope="col"
                      style={{
                        padding: 9,
                        textAlign: "left",
                        borderBottom: "1px solid #cbd5e1",
                      }}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {categories.map((category) => (
                  <tr key={category._id}>
                    {[
                      category.category,
                      category.group,
                      `${category.accountCode} — ${category.accountName}`,
                      category.classification,
                      category.status,
                      category.mappingIssue || "Valid",
                    ].map((value, index) => (
                      <td
                        key={index}
                        style={{
                          padding: 9,
                          borderBottom: "1px solid #e2e8f0",
                          verticalAlign: "top",
                        }}
                      >
                        {value}
                      </td>
                    ))}

                    <td
                      style={{
                        padding: 9,
                        borderBottom: "1px solid #e2e8f0",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 6,
                        }}
                      >
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => startEdit(category)}
                          style={buttonStyle}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          disabled={
                            disabled ||
                            (category.status === "Inactive" &&
                              !category.mappingValid)
                          }
                          onClick={() => changeStatus(category)}
                          style={buttonStyle}
                        >
                          {category.status === "Active"
                            ? "Deactivate"
                            : "Reactivate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {!categories.length && !loading && !error && (
                  <tr>
                    <td colSpan={7} style={{ padding: 12 }}>
                      No categories created yet.
                      Create your first category above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}