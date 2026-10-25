import { useEffect, useState } from "react";
import api from "../api";
import CustomerPolicyManager from "../components/CustomerPolicyManager";

function Settings() {
  const [settings, setSettings] = useState({
    companyName: "",
    companyEmail: "",
    companyPhone: "",
    companyAddress: "",
    defaultCurrency: "JMD",
    branches: [],
    rewards: {
      atWarehousePoints: 100,
      minimumRedeemPoints: 500,
      inactivityExpiryMonths: 4,
      pointsCap: 1500,
    },
    invoice: {
      defaultStatus: "Unpaid",
      defaultPaymentTerms: "Due on Receipt",
    },
    communication: {
      defaultChannel: "Email",
      supportEmail: "",
      notificationsEnabled: true,
    },
    branding: {
      primaryLogoName: "",
      primaryLogoPath: "",
      invoiceLogoName: "",
      invoiceLogoPath: "",
    },
  });

  const [branchInput, setBranchInput] = useState("");
  const [documents, setDocuments] = useState([]);
  const [primaryLogoFile, setPrimaryLogoFile] = useState(null);
  const [invoiceLogoFile, setInvoiceLogoFile] = useState(null);
  const [documentForm, setDocumentForm] = useState({
    title: "",
    category: "Terms and Conditions",
    status: "Active",
  });
  const [documentFile, setDocumentFile] = useState(null);
    const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [busyAction, setBusyAction] = useState("");
  const [openingDocument, setOpeningDocument] = useState("");

  const getLogoUrl = (value = "") => {
    const logoPath = String(value || "").trim();

    if (!logoPath) return "";

    if (/^https:\/\//i.test(logoPath)) return logoPath;

    if (!logoPath.startsWith("/uploads/logos/")) return "";

    const backendOrigin = new URL(
      api.defaults.baseURL,
      window.location.origin
    ).origin;

    return `${backendOrigin}${logoPath}`;
  };

    const showError = (error, fallback) => {
    console.error(fallback, error);
    alert(error?.response?.data?.message || fallback);
  };

  const fetchSettings = async () => {
    try {
      const res = await api.get("/api/settings");
      setSettings(res.data.data);
      setSettingsLoaded(true);
    } catch (error) {
      setSettingsLoaded(false);
      showError(error, "Could not load settings.");
    }
  };

  const fetchDocuments = async () => {
    try {
      const res = await api.get("/api/settings/documents");
      setDocuments(res.data.data || []);
    } catch (error) {
      showError(error, "Could not load internal company documents.");
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchDocuments();
  }, []);

  const handleTopLevelChange = (event) => {
    const { name, value } = event.target;

    setSettings((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleNestedChange = (section, field, value) => {
    setSettings((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [field]: value,
      },
    }));
  };

  const addBranch = () => {
    const branch = branchInput.trim();
    if (!branch) return;

    if ((settings.branches || []).includes(branch)) {
      alert("Branch already added.");
      return;
    }

    setSettings((current) => ({
      ...current,
      branches: [...(current.branches || []), branch],
    }));

    setBranchInput("");
  };

  const removeBranch = (branchName) => {
    setSettings((current) => ({
      ...current,
      branches: (current.branches || []).filter(
        (branch) => branch !== branchName
      ),
    }));
  };

  const saveSettings = async () => {
    if (busyAction || !settingsLoaded) return;

    setBusyAction("save");

    try {
      const payload = {
        companyName: settings.companyName,
        companyEmail: settings.companyEmail,
        companyPhone: settings.companyPhone,
        companyAddress: settings.companyAddress,
        defaultCurrency: settings.defaultCurrency,
        branches: settings.branches,
        rewards: settings.rewards,
        invoice: settings.invoice,
        communication: settings.communication,
      };

      const res = await api.put("/api/settings", payload);

      setSettings(res.data.data);
      alert(res.data.message);
    } catch (error) {
      showError(error, "Could not save settings.");
    } finally {
      setBusyAction("");
    }
  };

  const uploadLogo = async (kind) => {
    if (busyAction || !settingsLoaded) return;

    const file =
      kind === "primary" ? primaryLogoFile : invoiceLogoFile;

    if (!file) {
      alert("Please choose a logo file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Logos must be 5 MB or smaller.");
      return;
    }

    setBusyAction(kind);

    try {
      const body = new FormData();
      body.append("logo", file);

      const route =
        kind === "primary"
          ? "/api/settings/upload-primary-logo"
          : "/api/settings/upload-invoice-logo";

      const res = await api.post(route, body);

      /*
       * Update branding only, preserving unsaved edits
       * to company details and other settings.
       */
      setSettings((current) => ({
        ...current,
        branding: res.data.data.branding,
      }));

      if (kind === "primary") {
        setPrimaryLogoFile(null);
      } else {
        setInvoiceLogoFile(null);
      }

      alert(res.data.message);
    } catch (error) {
      showError(error, "Could not upload the logo.");
    } finally {
      setBusyAction("");
    }
  };

  const uploadPrimaryLogo = () => uploadLogo("primary");
  const uploadInvoiceLogo = () => uploadLogo("invoice");

  const uploadDocument = async () => {
    if (busyAction || !settingsLoaded) return;

    if (
      !documentForm.title.trim() ||
      !documentForm.category ||
      !documentFile
    ) {
      alert("Enter a document title, select a category and choose a PDF.");
      return;
    }

    if (documentFile.size > 10 * 1024 * 1024) {
      alert("PDF documents must be 10 MB or smaller.");
      return;
    }

    setBusyAction("document");

    try {
      const body = new FormData();

      body.append("title", documentForm.title.trim());
      body.append("category", documentForm.category);
      body.append("status", documentForm.status);
      body.append("document", documentFile);

      const res = await api.post(
        "/api/settings/documents/upload",
        body
      );

      setDocumentForm({
        title: "",
        category: "Terms and Conditions",
        status: "Active",
      });

      setDocumentFile(null);
      await fetchDocuments();

      alert(res.data.message);
    } catch (error) {
      showError(error, "Could not upload the internal PDF.");
    } finally {
      setBusyAction("");
    }
  };

  const openDocument = async (documentNumber) => {
    if (openingDocument) return;

    const documentWindow = window.open("about:blank", "_blank");

    if (!documentWindow) {
      alert("Please allow popups to open the PDF.");
      return;
    }

    documentWindow.opener = null;
    documentWindow.document.title = "Opening internal PDF";
    documentWindow.document.body.textContent = "Opening PDF…";

    setOpeningDocument(documentNumber);

    try {
      const res = await api.get(
        `/api/settings/documents/${encodeURIComponent(documentNumber)}/access`
      );

      const url = res.data?.data?.url;

      if (!url || !url.startsWith("https://")) {
        throw new Error("The server did not return a valid document link.");
      }

      if (!documentWindow.closed) {
        documentWindow.location.replace(url);
      }
    } catch (error) {
      documentWindow.close();
      showError(error, "Could not open the internal PDF.");
    } finally {
      setOpeningDocument("");
    }
  };

  const cardStyle = {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "10px",
    border: "1px solid #e5e7eb",
    marginBottom: "24px",
  };

  return (
    <div>
      <h1>Settings</h1>

      <div style={cardStyle}>
        <h2>Company Profile</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "15px",
          }}
        >
          <input
            type="text"
            name="companyName"
            placeholder="Company Name"
            value={settings.companyName || ""}
            onChange={handleTopLevelChange}
            style={{ padding: "10px" }}
          />

          <input
            type="email"
            name="companyEmail"
            placeholder="Company Email"
            value={settings.companyEmail || ""}
            onChange={handleTopLevelChange}
            style={{ padding: "10px" }}
          />

          <input
            type="text"
            name="companyPhone"
            placeholder="Company Phone"
            value={settings.companyPhone || ""}
            onChange={handleTopLevelChange}
            style={{ padding: "10px" }}
          />

          <input
            type="text"
            name="defaultCurrency"
            placeholder="Default Currency"
            value={settings.defaultCurrency || "JMD"}
            onChange={handleTopLevelChange}
            style={{ padding: "10px" }}
          />

          <textarea
            name="companyAddress"
            placeholder="Company Address"
            value={settings.companyAddress || ""}
            onChange={handleTopLevelChange}
            style={{ padding: "10px", minHeight: "90px", gridColumn: "span 2" }}
          />
        </div>
      </div>

      <div style={cardStyle}>
        <h2>Company Branding</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "20px",
          }}
        >
          <div>
            <h3>Primary Logo</h3>
            {settings.branding?.primaryLogoPath ? (
              <img
                src={getLogoUrl(settings.branding.primaryLogoPath)}
                alt="Primary Logo"
                style={{ maxWidth: "180px", maxHeight: "100px", display: "block", marginBottom: "10px" }}
              />
            ) : (
              <p>No primary logo uploaded yet.</p>
            )}

            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setPrimaryLogoFile(e.target.files[0])} />
            <br /><br />
            <button
              onClick={uploadPrimaryLogo}
              disabled={!settingsLoaded || Boolean(busyAction)}
              style={{
                backgroundColor: "#0B3D91",
                color: "white",
                border: "none",
                padding: "10px 16px",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Upload Primary Logo
            </button>
          </div>

          <div>
            <h3>Invoice Logo</h3>
            {settings.branding?.invoiceLogoPath ? (
              <img
                src={getLogoUrl(settings.branding.invoiceLogoPath)}
                alt="Invoice Logo"
                style={{ maxWidth: "180px", maxHeight: "100px", display: "block", marginBottom: "10px" }}
              />
            ) : (
              <p>No invoice logo uploaded yet.</p>
            )}

            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setInvoiceLogoFile(e.target.files[0])} />
            <br /><br />
            <button
              onClick={uploadInvoiceLogo}
              disabled={!settingsLoaded || Boolean(busyAction)}
              style={{
                backgroundColor: "#0B3D91",
                color: "white",
                border: "none",
                padding: "10px 16px",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Upload Invoice Logo
            </button>
          </div>
        </div>
      </div>

      <div style={cardStyle}>
        <h2>Branches</h2>

        <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
          <input
            type="text"
            placeholder="Add branch"
            value={branchInput}
            onChange={(e) => setBranchInput(e.target.value)}
            style={{ padding: "10px", flex: 1 }}
          />
          <button
            onClick={addBranch}
            style={{
              backgroundColor: "#0B3D91",
              color: "white",
              border: "none",
              padding: "10px 16px",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Add Branch
          </button>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {(settings.branches || []).map((branch) => (
            <div
              key={branch}
              style={{
                backgroundColor: "#eef2ff",
                border: "1px solid #c7d2fe",
                borderRadius: "999px",
                padding: "8px 12px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <span>{branch}</span>
              <button
                onClick={() => removeBranch(branch)}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#dc2626",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      <div style={cardStyle}>
        <h2>Rewards Settings</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "15px",
          }}
        >
          <input
            type="number"
            value={settings.rewards?.atWarehousePoints || 0}
            onChange={(e) =>
              handleNestedChange("rewards", "atWarehousePoints", Number(e.target.value))
            }
            placeholder="Points for At Warehouse"
            style={{ padding: "10px" }}
          />

          <input
            type="number"
            value={settings.rewards?.minimumRedeemPoints || 0}
            onChange={(e) =>
              handleNestedChange("rewards", "minimumRedeemPoints", Number(e.target.value))
            }
            placeholder="Minimum Redeem Points"
            style={{ padding: "10px" }}
          />

          <input
            type="number"
            value={settings.rewards?.inactivityExpiryMonths || 0}
            onChange={(e) =>
              handleNestedChange("rewards", "inactivityExpiryMonths", Number(e.target.value))
            }
            placeholder="Expiry Months"
            style={{ padding: "10px" }}
          />

          <input
            type="number"
            value={settings.rewards?.pointsCap || 0}
            onChange={(e) =>
              handleNestedChange("rewards", "pointsCap", Number(e.target.value))
            }
            placeholder="Points Cap"
            style={{ padding: "10px" }}
          />
        </div>
      </div>

      <div style={cardStyle}>
        <h2>Invoice Defaults</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "15px",
          }}
        >
          <select
            value={settings.invoice?.defaultStatus || "Unpaid"}
            onChange={(e) =>
              handleNestedChange("invoice", "defaultStatus", e.target.value)
            }
            style={{ padding: "10px" }}
          >
            <option value="Unpaid">Unpaid</option>
            <option value="Paid">Paid</option>
          </select>

          <input
            type="text"
            value={settings.invoice?.defaultPaymentTerms || ""}
            onChange={(e) =>
              handleNestedChange("invoice", "defaultPaymentTerms", e.target.value)
            }
            placeholder="Default Payment Terms"
            style={{ padding: "10px" }}
          />
        </div>
      </div>

      <div style={cardStyle}>
        <h2>Communication Defaults</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "15px",
          }}
        >
          <select
            value={settings.communication?.defaultChannel || "Email"}
            onChange={(e) =>
              handleNestedChange("communication", "defaultChannel", e.target.value)
            }
            style={{ padding: "10px" }}
          >
            <option value="Email">Email</option>
            <option value="WhatsApp">WhatsApp</option>
            <option value="SMS">SMS</option>
          </select>

          <input
            type="email"
            value={settings.communication?.supportEmail || ""}
            onChange={(e) =>
              handleNestedChange("communication", "supportEmail", e.target.value)
            }
            placeholder="Support Email"
            style={{ padding: "10px" }}
          />

          <select
            value={settings.communication?.notificationsEnabled ? "true" : "false"}
            onChange={(e) =>
              handleNestedChange("communication", "notificationsEnabled", e.target.value === "true")
            }
            style={{ padding: "10px" }}
          >
            <option value="true">Notifications Enabled</option>
            <option value="false">Notifications Disabled</option>
          </select>
        </div>
      </div>

            <CustomerPolicyManager />

      <div style={cardStyle}>
        <h2>Internal Company Documents</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "15px",
            marginBottom: "20px",
          }}
        >
          <input
            type="text"
            placeholder="Document Title"
            value={documentForm.title}
            onChange={(e) =>
              setDocumentForm({ ...documentForm, title: e.target.value })
            }
            style={{ padding: "10px" }}
          />

          <select
            value={documentForm.category}
            onChange={(e) =>
              setDocumentForm({ ...documentForm, category: e.target.value })
            }
            style={{ padding: "10px" }}
          >
            <option value="Terms and Conditions">Terms and Conditions</option>
            <option value="Privacy Policy">Privacy Policy</option>
            <option value="Human Resources">Human Resources</option>
            <option value="Staff Manual">Staff Manual</option>
            <option value="Policy Document">Policy Document</option>
            <option value="General">General</option>
          </select>

          <select
            value={documentForm.status}
            onChange={(e) =>
              setDocumentForm({ ...documentForm, status: e.target.value })
            }
            style={{ padding: "10px" }}
          >
            <option value="Active">Active</option>
            <option value="Archived">Archived</option>
          </select>

          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setDocumentFile(e.target.files[0])}
            style={{ padding: "10px" }}
          />
        </div>

        <button
          onClick={uploadDocument}
          disabled={!settingsLoaded || Boolean(busyAction)}
          style={{
            backgroundColor: "#0B3D91",
            color: "white",
            border: "none",
            padding: "10px 16px",
            borderRadius: "6px",
            cursor: "pointer",
            marginBottom: "20px",
          }}
        >
          Upload PDF Document
        </button>

        <table border="1" cellPadding="10" style={{ width: "100%" }}>
          <thead>
            <tr>
              <th>Document Number</th>
              <th>Title</th>
              <th>Category</th>
              <th>File Name</th>
              <th>Status</th>
              <th>View</th>
            </tr>
          </thead>
          <tbody>
            {documents.length > 0 ? (
              documents.map((doc) => (
                <tr key={doc._id}>
                  <td>{doc.documentNumber}</td>
                  <td>{doc.title}</td>
                  <td>{doc.category}</td>
                  <td>{doc.fileName}</td>
                  <td>{doc.status}</td>
                  <td>
                                        <button
                      type="button"
                      onClick={() => openDocument(doc.documentNumber)}
                      disabled={Boolean(openingDocument)}
                      style={{
                        backgroundColor: "#0B3D91",
                        color: "#ffffff",
                        border: "none",
                        padding: "9px 13px",
                        borderRadius: "6px",
                        cursor: openingDocument ? "wait" : "pointer",
                      }}
                    >
                      {openingDocument === doc.documentNumber
                        ? "Opening…"
                        : "Open PDF"}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6">No company documents uploaded yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <button
        onClick={saveSettings}
        disabled={!settingsLoaded || Boolean(busyAction)}
        style={{
          backgroundColor: "#16a34a",
          color: "white",
          border: "none",
          padding: "12px 18px",
          borderRadius: "6px",
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        Save Settings
      </button>
    </div>
  );
}

export default Settings;