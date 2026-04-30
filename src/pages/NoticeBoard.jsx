import { useEffect, useState } from "react";
import api from "../api";

function NoticeBoard() {
  const [notices, setNotices] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [formData, setFormData] = useState({
  title: "",
  message: "",
  category: "General Update",
  priority: "Normal",
  dueDate: "",
  noticeType: "Notice",
  signatureName: "Ramona Reid",
  signatureTitle: "Operations Manager",
  stampText: "ELTHAM KONNECT OFFICIAL",
});

  const API = "https://eltham-konnect-backend-c2sf.onrender.com";
  const ROYAL_BLUE = "#0B3D91";
  const GOLD = "#D4AF37";
  const WHITE = "#ffffff";
  const BORDER = "#dbe3ef";
  const MUTED = "#64748b";

  const fetchNotices = async () => {
    try {
      const res = await api.get("/api/notices");
      setNotices(res.data.data || []);
    } catch (error) {
      console.error("Error loading notices:", error);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const createNotice = async () => {
    try {
      if (!formData.title || !formData.message) {
        alert("Title and message are required.");
        return;
      }

      const payload = new FormData();
      payload.append("title", formData.title);
      payload.append("message", formData.message);
      payload.append("category", formData.category);
      payload.append("priority", formData.priority);
      payload.append("dueDate", formData.dueDate);
      payload.append("noticeType", formData.noticeType);
      payload.append("signatureName", formData.signatureName);
      payload.append("signatureTitle", formData.signatureTitle);
      payload.append("stampText", formData.stampText);

      if (selectedImage) {
        payload.append("noticeImage", selectedImage);
      }

      await api.post("/api/notices", payload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setFormData({
  title: "",
  message: "",
  category: "General Update",
  priority: "Normal",
  dueDate: "",
  noticeType: "Notice",
  signatureName: "Ramona Reid",
  signatureTitle: "Operations Manager",
  stampText: "ELTHAM KONNECT OFFICIAL",
});

      setSelectedImage(null);

      await fetchNotices();
      alert("Notice posted successfully.");
    } catch (error) {
      alert(error?.response?.data?.message || "Notice could not be posted.");
    }
  };

  const removeNotice = async (id) => {
    if (!window.confirm("Remove this notice?")) return;

    try {
      await api.delete(`/api/notices/${id}`);
      await fetchNotices();
    } catch (error) {
      alert(error?.response?.data?.message || "Notice could not be removed.");
    }
  };

  const badgeStyle = (priority) => ({
    backgroundColor:
      priority === "Urgent"
        ? "#dc2626"
        : priority === "High"
        ? "#f97316"
        : priority === "Low"
        ? "#64748b"
        : ROYAL_BLUE,
    color: WHITE,
    padding: "5px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "bold",
  });

  return (
    <div>
      <h1 style={{ marginTop: 0, color: "#0f172a" }}>Notice Board</h1>
      <p style={{ color: MUTED }}>
        Post urgent messages, daily tasks, meeting notices, internal updates, and image announcements.
      </p>

      <div
        style={{
          backgroundColor: WHITE,
          border: `1px solid ${BORDER}`,
          borderRadius: "12px",
          padding: "18px",
          marginBottom: "20px",
        }}
      >
        <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>Post New Notice</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "12px",
          }}
        >
          <input
            name="title"
            placeholder="Notice Title"
            value={formData.title}
            onChange={handleChange}
            style={{ padding: "10px", borderRadius: "8px", border: `1px solid ${BORDER}` }}
          />

          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            style={{ padding: "10px", borderRadius: "8px", border: `1px solid ${BORDER}` }}
          >
            <option>Urgent</option>
            <option>Daily Task</option>
            <option>Meeting</option>
            <option>Announcement</option>
            <option>General Update</option>
          </select>

          <select
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            style={{ padding: "10px", borderRadius: "8px", border: `1px solid ${BORDER}` }}
          >
            <option>Low</option>
            <option>Normal</option>
            <option>High</option>
            <option>Urgent</option>
          </select>

          <select
  name="noticeType"
  value={formData.noticeType}
  onChange={handleChange}
  style={{ padding: "10px", borderRadius: "8px", border: `1px solid ${BORDER}` }}
>
  <option>Notice</option>
  <option>Memorandum</option>
</select>

<input
  name="signatureName"
  placeholder="Signature Name"
  value={formData.signatureName}
  onChange={handleChange}
  style={{ padding: "10px", borderRadius: "8px", border: `1px solid ${BORDER}` }}
/>

<input
  name="signatureTitle"
  placeholder="Signature Title"
  value={formData.signatureTitle}
  onChange={handleChange}
  style={{ padding: "10px", borderRadius: "8px", border: `1px solid ${BORDER}` }}
/>

<input
  name="stampText"
  placeholder="Stamp Text"
  value={formData.stampText}
  onChange={handleChange}
  style={{ padding: "10px", borderRadius: "8px", border: `1px solid ${BORDER}` }}
/>

          <input
            type="date"
            name="dueDate"
            value={formData.dueDate}
            onChange={handleChange}
            style={{ padding: "10px", borderRadius: "8px", border: `1px solid ${BORDER}` }}
          />

          <input
            type="file"
            accept="image/*"
            onChange={(e) => setSelectedImage(e.target.files?.[0] || null)}
            style={{ padding: "10px", borderRadius: "8px", border: `1px solid ${BORDER}` }}
          />
        </div>

        <textarea
          name="message"
          placeholder="Write notice details here..."
          value={formData.message}
          onChange={handleChange}
          rows="4"
          style={{
            width: "100%",
            marginTop: "12px",
            padding: "10px",
            borderRadius: "8px",
            border: `1px solid ${BORDER}`,
            boxSizing: "border-box",
          }}
        />

        {selectedImage ? (
          <p style={{ color: MUTED, fontWeight: "bold" }}>
            Selected image: {selectedImage.name}
          </p>
        ) : null}

        <button
          onClick={createNotice}
          style={{
            marginTop: "12px",
            backgroundColor: GOLD,
            color: "black",
            border: "none",
            padding: "10px 16px",
            borderRadius: "8px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Post Notice
        </button>
      </div>

      <div style={{ display: "grid", gap: "14px" }}>
        {notices.length > 0 ? (
          notices.map((notice) => (
            <div
              key={notice._id}
              style={{
                backgroundColor: WHITE,
                border: `1px solid ${BORDER}`,
                borderRadius: "12px",
                padding: "16px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                <div>
                  <div style={{ marginBottom: "8px" }}>
  <div
    style={{
      display: "inline-block",
      backgroundColor: notice.noticeType === "Memorandum" ? GOLD : ROYAL_BLUE,
      color: notice.noticeType === "Memorandum" ? "black" : WHITE,
      padding: "5px 10px",
      borderRadius: "999px",
      fontSize: "12px",
      fontWeight: "bold",
      marginBottom: "8px",
    }}
  >
    {notice.noticeType || "Notice"}
  </div>

  <h2 style={{ margin: 0, color: ROYAL_BLUE }}>{notice.title}</h2>
</div>
                  <p style={{ color: MUTED, margin: "6px 0" }}>
                    {notice.category} • Posted by {notice.postedByName || "System User"}
                  </p>
                </div>

                <span style={badgeStyle(notice.priority)}>{notice.priority}</span>
              </div>

              <p style={{ lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{notice.message}</p>

<div
  style={{
    marginTop: "18px",
    paddingTop: "14px",
    borderTop: `1px solid ${BORDER}`,
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    flexWrap: "wrap",
  }}
>
  <div>
    <div style={{ fontWeight: "bold", color: ROYAL_BLUE }}>
      {notice.signatureName || notice.postedByName || "Eltham Konnect"}
    </div>
    <div style={{ color: MUTED }}>
      {notice.signatureTitle || notice.postedByRole || ""}
    </div>
  </div>

  <div
    style={{
      border: `2px solid ${ROYAL_BLUE}`,
      color: ROYAL_BLUE,
      borderRadius: "50%",
      width: "110px",
      height: "70px",
      display: "grid",
      placeItems: "center",
      textAlign: "center",
      fontSize: "11px",
      fontWeight: "900",
      transform: "rotate(-8deg)",
    }}
  >
    {notice.stampText || "ELTHAM KONNECT"}
  </div>
</div>

              {notice.imageFilePath ? (
                <img
                  src={`${API}${notice.imageFilePath}`}
                  alt={notice.title}
                  style={{
                    width: "100%",
                    maxWidth: "520px",
                    borderRadius: "12px",
                    border: `1px solid ${BORDER}`,
                    marginTop: "10px",
                    marginBottom: "10px",
                  }}
                />
              ) : null}

              {notice.dueDate ? (
                <p style={{ color: "#dc2626", fontWeight: "bold" }}>
                  Due: {String(notice.dueDate).slice(0, 10)}
                </p>
              ) : null}

              <button
                onClick={() => removeNotice(notice._id)}
                style={{
                  backgroundColor: "#dc2626",
                  color: WHITE,
                  border: "none",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                Remove
              </button>
            </div>
          ))
        ) : (
          <div
            style={{
              backgroundColor: WHITE,
              border: `1px solid ${BORDER}`,
              borderRadius: "12px",
              padding: "20px",
              color: MUTED,
            }}
          >
            No active notices posted.
          </div>
        )}
      </div>
    </div>
  );
}

export default NoticeBoard;