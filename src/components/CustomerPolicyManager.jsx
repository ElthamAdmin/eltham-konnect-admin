import { useCallback, useEffect, useRef, useState } from "react";
import api from "../api";

const emptyForm = {
  policyType: "terms",
  title: "",
  version: "",
  effectiveDate: "",
};

export default function CustomerPolicyManager() {
  const [policies, setPolicies] = useState([]);
  const [form, setForm] = useState({ ...emptyForm });
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const fileInput = useRef(null);

  const loadPolicies = useCallback(async () => {
    setLoading(true);

    try {
      const response = await api.get("/api/customer-policies/staff");
      setPolicies(response.data.data || []);
      return true;
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          "Customer policies could not be loaded."
      );
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPolicies();
  }, [loadPolicies]);

  const changeField = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const uploadDraft = async (event) => {
    event.preventDefault();

    if (busy) return;

    setError("");
    setNotice("");

    if (!file) {
      setError("Choose a PDF document.");
      return;
    }

    if (
      !file.name.toLowerCase().endsWith(".pdf") ||
      file.size === 0 ||
      file.size > 10 * 1024 * 1024
    ) {
      setError("Choose a non-empty PDF no larger than 10 MB.");
      return;
    }

    setBusy("upload");

    try {
      const body = new FormData();

      body.append("policyType", form.policyType);
      body.append("title", form.title.trim());
      body.append("version", form.version.trim());
      body.append("effectiveDate", form.effectiveDate);
      body.append("document", file);

      const response = await api.post(
        "/api/customer-policies/staff/upload",
        body
      );

      setForm({ ...emptyForm });
      setFile(null);

      if (fileInput.current) {
        fileInput.current.value = "";
      }

      setNotice(response.data.message);
      await loadPolicies();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          "Upload could not be confirmed. Refresh the list before retrying."
      );
    } finally {
      setBusy("");
    }
  };

  const openPolicy = async (policy, download = false) => {
    if (busy) return;

    setError("");

    const fileWindow = window.open("about:blank", "_blank");

    if (!fileWindow) {
      setError("Allow popups for this site to open the PDF.");
      return;
    }

    fileWindow.opener = null;
    fileWindow.document.title = "Opening policy";
    fileWindow.document.body.textContent = "Opening policy PDF…";

    setBusy(`open-${policy.policyNumber}`);

    try {
      const response = await api.get(
        `/api/customer-policies/staff/${encodeURIComponent(
          policy.policyNumber
        )}/access`,
        {
          params: download ? { download: "1" } : {},
        }
      );

      const url = response.data?.data?.url;

      if (typeof url !== "string" || !url.startsWith("https://")) {
        throw new Error("The server did not return a valid PDF link.");
      }

      if (!fileWindow.closed) {
        fileWindow.location.replace(url);
      }
    } catch (requestError) {
      fileWindow.close();

      setError(
        requestError?.response?.data?.message ||
          requestError.message ||
          "The policy PDF could not be opened."
      );
    } finally {
      setBusy("");
    }
  };

  const publish = async (policy) => {
    if (busy) return;

    const confirmed = window.confirm(
      `Publish "${policy.title}"?\n\n` +
        `Version: ${policy.version}\n` +
        `Effective date: ${policy.effectiveDate}\n\n` +
        "Confirm that you have previewed the PDF, approved its contents, " +
        "and removed all review-draft wording.\n\n" +
        "Publishing makes it available for customers to view immediately, " +
        "even if its effective date is in the future."
    );

    if (!confirmed) return;

    setBusy(`publish-${policy.policyNumber}`);
    setError("");
    setNotice("");

    try {
      const response = await api.post(
        `/api/customer-policies/staff/${encodeURIComponent(
          policy.policyNumber
        )}/publish`,
        {
          confirmPublication: true,
        }
      );

      setNotice(response.data.message);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          "Publication could not be confirmed. Check the refreshed list."
      );
    } finally {
      await loadPolicies();
      setBusy("");
    }
  };

  const withdraw = async (policy) => {
    if (busy) return;

    const reason = window.prompt(
      `Withdraw "${policy.title}" version ${policy.version}?\n\n` +
        "It will no longer be available through customer viewing links. " +
        "The staff record and PDF will be retained.\n\n" +
        "Enter the reason:"
    );

    if (reason === null) return;

    if (!reason.trim() || reason.trim().length > 1000) {
      setError("Enter a withdrawal reason of up to 1,000 characters.");
      return;
    }

    setBusy(`withdraw-${policy.policyNumber}`);
    setError("");
    setNotice("");

    try {
      const response = await api.post(
        `/api/customer-policies/staff/${encodeURIComponent(
          policy.policyNumber
        )}/withdraw`,
        {
          reason: reason.trim(),
        }
      );

      setNotice(response.data.message);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          "Withdrawal could not be confirmed. Check the refreshed list."
      );
    } finally {
      await loadPolicies();
      setBusy("");
    }
  };

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box",
    padding: "10px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    backgroundColor: "#ffffff",
  };

  const labelStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
    fontWeight: 700,
    color: "#334155",
  };

  const buttonStyle = {
    border: 0,
    borderRadius: "7px",
    padding: "10px 14px",
    backgroundColor: "#0B3D91",
    color: "#ffffff",
    fontWeight: 700,
    cursor: busy || loading ? "wait" : "pointer",
  };

  const disabled = Boolean(busy) || loading;

  return (
    <section
      aria-labelledby="customer-policies-heading"
      style={{
        backgroundColor: "#ffffff",
        padding: "20px",
        borderRadius: "10px",
        border: "1px solid #e5e7eb",
        marginBottom: "24px",
      }}
    >
      <h2 id="customer-policies-heading">
        Customer Portal Policies
      </h2>

      <p style={{ color: "#475569", lineHeight: 1.6 }}>
        Manage the Terms and Conditions and Privacy Policy customers
        can read and download. Uploads are private drafts until you
        explicitly publish them. Internal Company Documents remain
        separate.
      </p>

      <p style={{ color: "#9a3412", lineHeight: 1.6 }}>
        Review PDFs before publishing. A published future policy is
        visible immediately and labelled with its effective date.
        Mandatory acceptance of a new version will be added in Stage 6.
      </p>

      {error && (
        <p role="alert" style={{ color: "#b91c1c" }}>
          {error}
        </p>
      )}

      {notice && (
        <p role="status" style={{ color: "#15803d" }}>
          {notice}
        </p>
      )}

      <form onSubmit={uploadDraft}>
        <fieldset
          disabled={disabled}
          style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "15px",
            }}
          >
            <label style={labelStyle}>
              Policy type
              <select
                name="policyType"
                value={form.policyType}
                onChange={changeField}
                style={inputStyle}
              >
                <option value="terms">Terms and Conditions</option>
                <option value="privacy">Privacy Policy</option>
              </select>
            </label>

            <label style={labelStyle}>
              Document title
              <input
                name="title"
                value={form.title}
                onChange={changeField}
                placeholder="Customer Terms and Conditions"
                maxLength={300}
                required
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Version
              <input
                name="version"
                value={form.version}
                onChange={changeField}
                placeholder="2027.1"
                pattern="[a-zA-Z0-9][a-zA-Z0-9._-]{0,79}"
                maxLength={80}
                required
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Effective date
              <input
                type="date"
                name="effectiveDate"
                value={form.effectiveDate}
                onChange={changeField}
                required
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              PDF document
              <input
                ref={fileInput}
                type="file"
                accept=".pdf,application/pdf"
                onChange={(event) =>
                  setFile(event.target.files?.[0] || null)
                }
                required
                style={inputStyle}
              />
            </label>
          </div>

          <button
            type="submit"
            style={{ ...buttonStyle, marginTop: "18px" }}
          >
            {busy === "upload" ? "Uploading…" : "Upload Draft"}
          </button>
        </fieldset>
      </form>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          marginTop: "26px",
          marginBottom: "14px",
        }}
      >
        <h3 style={{ margin: 0 }}>Policy Versions</h3>

        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            setError("");
            loadPolicies();
          }}
          style={buttonStyle}
        >
          {loading ? "Loading…" : "Refresh List"}
        </button>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table
          border="1"
          cellPadding="10"
          style={{
            width: "100%",
            minWidth: "900px",
            borderCollapse: "collapse",
            borderColor: "#dbe3ef",
          }}
        >
          <thead style={{ backgroundColor: "#eef4ff" }}>
            <tr>
              <th>Policy</th>
              <th>Version</th>
              <th>Effective Date</th>
              <th>Status</th>
              <th>Uploaded By</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {policies.map((policy) => (
              <tr key={policy.policyNumber}>
                <td>
                  <strong>{policy.title}</strong>
                  <div style={{ marginTop: "5px", color: "#64748b" }}>
                    {policy.policyType === "terms"
                      ? "Terms and Conditions"
                      : "Privacy Policy"}
                  </div>
                  <div
                    style={{
                      marginTop: "5px",
                      fontSize: "12px",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {policy.fileName}
                  </div>
                </td>

                <td>{policy.version}</td>
                <td>{policy.effectiveDate}</td>

                <td>
                  <strong>{policy.status}</strong>
                  {policy.withdrawalReason && (
                    <div style={{ marginTop: "5px" }}>
                      {policy.withdrawalReason}
                    </div>
                  )}
                </td>

                <td>{policy.uploadedByName || "—"}</td>

                <td>
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => openPolicy(policy)}
                      style={buttonStyle}
                    >
                      Preview
                    </button>

                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => openPolicy(policy, true)}
                      style={buttonStyle}
                    >
                      Download
                    </button>

                    {policy.status === "Draft" && (
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => publish(policy)}
                        style={{
                          ...buttonStyle,
                          backgroundColor: "#15803d",
                        }}
                      >
                        Publish
                      </button>
                    )}

                    {policy.status === "Published" && (
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => withdraw(policy)}
                        style={{
                          ...buttonStyle,
                          backgroundColor: "#b91c1c",
                        }}
                      >
                        Withdraw
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}

            {policies.length === 0 && (
              <tr>
                <td colSpan={6}>
                  {loading
                    ? "Loading policy versions…"
                    : error
                    ? "The policy list is unavailable. Use Refresh List to retry."
                    : "No customer policies uploaded yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}