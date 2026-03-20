import { useEffect, useState } from "react";
import axios from "axios";

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

  const fetchSettings = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/settings");
      setSettings(res.data.data);
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  };

  const fetchDocuments = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/settings/documents");
      setDocuments(res.data.data || []);
    } catch (error) {
      console.error("Error loading company documents:", error);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchDocuments();
  }, []);

  const handleTopLevelChange = (e) => {
    setSettings({
      ...settings,
      [e.target.name]: e.target.value,
    });
  };

  const handleNestedChange = (section, field, value) => {
    setSettings({
      ...settings,
      [section]: {
        ...settings[section],
        [field]: value,
      },
    });
  };

  const addBranch = () => {
    if (!branchInput.trim()) return;

    if (settings.branches.includes(branchInput.trim())) {
      alert("Branch already added.");
      return;
    }

    setSettings({
      ...settings,
      branches: [...settings.branches, branchInput.trim()],
    });

    setBranchInput("");
  };

  const removeBranch = (branchName) => {
    setSettings({
      ...settings,
      branches: settings.branches.filter((branch) => branch !== branchName),
    });
  };

  const saveSettings = async () => {
    try {
      const res = await axios.put("http://localhost:5000/api/settings", settings);
      alert(res.data.message);
      setSettings(res.data.data);
    } catch (error) {
      console.error("Error saving settings:", error);
      alert(error?.response?.data?.message || "Could not save settings.");
    }
  };

  const uploadPrimaryLogo = async () => {
    try {
      if (!primaryLogoFile) {
        alert("Please choose a primary logo file.");
        return;
      }

      const formData = new FormData();
      formData.append("logo", primaryLogoFile);

      const res = await axios.post(
        "http://localhost:5000/api/settings/upload-primary-logo",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      alert(res.data.message);
      setPrimaryLogoFile(null);
      fetchSettings();
    } catch (error) {
      console.error("Error uploading primary logo:", error);
      alert(error?.response?.data?.message || "Could not upload primary logo.");
    }
  };

  const uploadInvoiceLogo = async () => {
    try {
      if (!invoiceLogoFile) {
        alert("Please choose an invoice logo file.");
        return;
      }

      const formData = new FormData();
      formData.append("logo", invoiceLogoFile);

      const res = await axios.post(
        "http://localhost:5000/api/settings/upload-invoice-logo",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      alert(res.data.message);
      setInvoiceLogoFile(null);
      fetchSettings();
    } catch (error) {
      console.error("Error uploading invoice logo:", error);
      alert(error?.response?.data?.message || "Could not upload invoice logo.");
    }
  };

  const uploadDocument = async () => {
    try {
      if (!documentForm.title || !documentForm.category || !documentFile) {
        alert("Please complete document title, category, and choose a PDF file.");
        return;
      }

      const formData = new FormData();
      formData.append("title", documentForm.title);
      formData.append("category", documentForm.category);
      formData.append("status", documentForm.status);
      formData.append("document", documentFile);

      const res = await axios.post(
        "http://localhost:5000/api/settings/documents/upload",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      alert(res.data.message);

      setDocumentForm({
        title: "",
        category: "Terms and Conditions",
        status: "Active",
      });
      setDocumentFile(null);

      fetchDocuments();
    } catch (error) {
      console.error("Error uploading company document:", error);
      alert(error?.response?.data?.message || "Could not upload document.");
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
                src={`http://localhost:5000${settings.branding.primaryLogoPath}`}
                alt="Primary Logo"
                style={{ maxWidth: "180px", maxHeight: "100px", display: "block", marginBottom: "10px" }}
              />
            ) : (
              <p>No primary logo uploaded yet.</p>
            )}

            <input type="file" accept="image/*" onChange={(e) => setPrimaryLogoFile(e.target.files[0])} />
            <br /><br />
            <button
              onClick={uploadPrimaryLogo}
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
                src={`http://localhost:5000${settings.branding.invoiceLogoPath}`}
                alt="Invoice Logo"
                style={{ maxWidth: "180px", maxHeight: "100px", display: "block", marginBottom: "10px" }}
              />
            ) : (
              <p>No invoice logo uploaded yet.</p>
            )}

            <input type="file" accept="image/*" onChange={(e) => setInvoiceLogoFile(e.target.files[0])} />
            <br /><br />
            <button
              onClick={uploadInvoiceLogo}
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
                    <a
                      href={`http://localhost:5000${doc.filePath}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open PDF
                    </a>
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