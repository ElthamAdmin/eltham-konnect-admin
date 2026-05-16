import { useEffect, useState } from "react";
import api from "../api";

function CorporateProfile() {
  const [profile, setProfile] = useState(null);

  const loadProfile = async () => {
    try {
      const res = await api.get("/api/corporate-profile");
      setProfile(res.data.data);
    } catch (error) {
      alert(error?.response?.data?.message || "Could not load corporate profile.");
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const updateField = (field, value) => {
    setProfile({ ...profile, [field]: value });
  };

  const saveProfile = async () => {
    try {
      await api.put("/api/corporate-profile", profile);
      alert("Corporate profile updated successfully.");
      await loadProfile();
    } catch (error) {
      alert(error?.response?.data?.message || "Could not save corporate profile.");
    }
  };

  if (!profile) return <p>Loading corporate profile...</p>;

  return (
    <div>
      <h1 style={{ margin: 0 }}>Limited Liability Transition</h1>
      <p style={{ marginTop: "6px", color: "#64748b" }}>
        Prepare EKOS for company registration, corporate governance, shareholder records, and 2027 limited liability operations.
      </p>

      <div style={panel}>
        <h2 style={{ color: "#0B3D91", marginTop: 0 }}>Company Profile</h2>

        <div style={grid}>
          <input style={input} placeholder="Company Name" value={profile.companyName || ""} onChange={(e) => updateField("companyName", e.target.value)} />
          <input style={input} placeholder="Trading Name" value={profile.tradingName || ""} onChange={(e) => updateField("tradingName", e.target.value)} />

          <select style={input} value={profile.businessType || "Sole Proprietorship"} onChange={(e) => updateField("businessType", e.target.value)}>
            <option>Sole Proprietorship</option>
            <option>Limited Liability Company</option>
            <option>Partnership</option>
          </select>

          <select style={input} value={profile.transitionStatus || "Not Started"} onChange={(e) => updateField("transitionStatus", e.target.value)}>
            <option>Not Started</option>
            <option>Planning</option>
            <option>Registration In Progress</option>
            <option>Registered</option>
            <option>Operational</option>
          </select>

          <input style={input} placeholder="Registration Number" value={profile.registrationNumber || ""} onChange={(e) => updateField("registrationNumber", e.target.value)} />
          <input style={input} placeholder="TRN" value={profile.trn || ""} onChange={(e) => updateField("trn", e.target.value)} />
          <input style={input} type="date" value={profile.incorporationDate || ""} onChange={(e) => updateField("incorporationDate", e.target.value)} />
          <input style={input} placeholder="Company Secretary" value={profile.companySecretary || ""} onChange={(e) => updateField("companySecretary", e.target.value)} />
          <input style={input} placeholder="Auditor" value={profile.auditor || ""} onChange={(e) => updateField("auditor", e.target.value)} />
          <input style={input} placeholder="Business Email" value={profile.businessEmail || ""} onChange={(e) => updateField("businessEmail", e.target.value)} />
          <input style={input} placeholder="Business Phone" value={profile.businessPhone || ""} onChange={(e) => updateField("businessPhone", e.target.value)} />
          <input style={input} placeholder="Authorized Share Capital" type="number" value={profile.authorizedShareCapital || 0} onChange={(e) => updateField("authorizedShareCapital", Number(e.target.value || 0))} />
          <input style={input} placeholder="Issued Shares" type="number" value={profile.issuedShares || 0} onChange={(e) => updateField("issuedShares", Number(e.target.value || 0))} />

          <textarea style={{ ...input, gridColumn: "1 / -1" }} placeholder="Registered Address" value={profile.registeredAddress || ""} onChange={(e) => updateField("registeredAddress", e.target.value)} />
          <textarea style={{ ...input, gridColumn: "1 / -1" }} placeholder="Legal Notes" value={profile.legalNotes || ""} onChange={(e) => updateField("legalNotes", e.target.value)} />
        </div>

        <button onClick={saveProfile} style={button("#16a34a")}>
          Save Corporate Profile
        </button>
      </div>
    </div>
  );
}

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
  gap: "12px",
};

const panel = {
  backgroundColor: "white",
  border: "1px solid #dbe3ef",
  borderRadius: "12px",
  padding: "18px",
  marginTop: "18px",
};

const input = {
  padding: "10px",
  borderRadius: "8px",
  border: "1px solid #dbe3ef",
};

function button(color) {
  return {
    backgroundColor: color,
    color: "white",
    border: "none",
    padding: "10px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    marginTop: "14px",
  };
}

export default CorporateProfile;