import { useEffect, useMemo, useState } from "react";
import api from "../api";

const createInitialForm = () => {
  const start = new Date();
  start.setSeconds(0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  const toLocalInput = (value) => {
    const date = new Date(value);
    const offset = date.getTimezoneOffset() * 60000;

    return new Date(date.getTime() - offset)
      .toISOString()
      .slice(0, 16);
  };

  return {
    message: "",
    type: "Information",
    linkUrl: "",
    linkLabel: "",
    startAt: toLocalInput(start),
    endAt: toLocalInput(end),
    isActive: true,
  };
};

const toLocalInput = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offset = date.getTimezoneOffset() * 60000;

  return new Date(date.getTime() - offset)
    .toISOString()
    .slice(0, 16);
};

const formatDateTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString();
};

function PortalBannerManager() {
  const [banners, setBanners] = useState([]);
  const [formData, setFormData] = useState(createInitialForm);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const BLUE = "#0B3D91";
  const ORANGE = "#F15A24";
  const WHITE = "#FFFFFF";
  const BORDER = "#D9E2EF";
  const MUTED = "#64748B";

  const fetchBanners = async () => {
    try {
      setLoading(true);

      const res = await api.get("/api/portal-banners");

      setBanners(
        Array.isArray(res.data?.data)
          ? res.data.data
          : []
      );
    } catch (error) {
      console.error("Portal banner loading error:", error);

      alert(
        error?.response?.data?.message ||
          "Could not load portal banners."
      );

      setBanners([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const summary = useMemo(
    () => ({
      total: banners.length,
      live: banners.filter(
        (banner) => banner.scheduleStatus === "Live"
      ).length,
      scheduled: banners.filter(
        (banner) => banner.scheduleStatus === "Scheduled"
      ).length,
      inactive: banners.filter((banner) =>
        ["Inactive", "Expired"].includes(
          banner.scheduleStatus
        )
      ).length,
    }),
    [banners]
  );

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const resetForm = () => {
    setEditingId("");
    setFormData(createInitialForm());
  };

  const editBanner = (banner) => {
    setEditingId(banner._id);

    setFormData({
      message: banner.message || "",
      type: banner.type || "Information",
      linkUrl: banner.linkUrl || "",
      linkLabel: banner.linkLabel || "",
      startAt: toLocalInput(banner.startAt),
      endAt: toLocalInput(banner.endAt),
      isActive: Boolean(banner.isActive),
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const saveBanner = async () => {
    try {
      if (!formData.message.trim()) {
        alert("Please enter the banner message.");
        return;
      }

      if (!formData.startAt || !formData.endAt) {
        alert("Please select the banner start and end times.");
        return;
      }

      const startAt = new Date(formData.startAt);
      const endAt = new Date(formData.endAt);

      if (
        Number.isNaN(startAt.getTime()) ||
        Number.isNaN(endAt.getTime())
      ) {
        alert("Please enter valid banner dates.");
        return;
      }

      if (endAt <= startAt) {
        alert("The banner end time must be after its start time.");
        return;
      }

      setSaving(true);

      const payload = {
        message: formData.message.trim(),
        type: formData.type,
        linkUrl: formData.linkUrl.trim(),
        linkLabel: formData.linkLabel.trim(),
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        isActive: formData.isActive,
      };

      const res = editingId
        ? await api.put(
            `/api/portal-banners/${editingId}`,
            payload
          )
        : await api.post(
            "/api/portal-banners",
            payload
          );

      alert(
        res.data?.message ||
          "Portal banner saved successfully."
      );

      resetForm();
      await fetchBanners();
    } catch (error) {
      console.error("Portal banner save error:", error);

      alert(
        error?.response?.data?.message ||
          "Could not save the portal banner."
      );
    } finally {
      setSaving(false);
    }
  };

  const archiveBanner = async (banner) => {
    const confirmed = window.confirm(
      `Archive this portal banner?\n\n${banner.message}`
    );

    if (!confirmed) return;

    try {
      const res = await api.delete(
        `/api/portal-banners/${banner._id}`
      );

      alert(
        res.data?.message ||
          "Portal banner archived successfully."
      );

      if (editingId === banner._id) {
        resetForm();
      }

      await fetchBanners();
    } catch (error) {
      console.error("Portal banner archive error:", error);

      alert(
        error?.response?.data?.message ||
          "Could not archive the portal banner."
      );
    }
  };

  const statusStyle = (status) => {
    const colors = {
      Live: "#16A34A",
      Scheduled: BLUE,
      Inactive: MUTED,
      Expired: "#C2410C",
    };

    return {
      display: "inline-flex",
      alignItems: "center",
      minHeight: "28px",
      padding: "4px 10px",
      borderRadius: "999px",
      backgroundColor: colors[status] || MUTED,
      color: WHITE,
      fontSize: "12px",
      fontWeight: "800",
    };
  };

  return (
    <section
      style={{
        backgroundColor: WHITE,
        border: `1px solid ${BORDER}`,
        borderRadius: "16px",
        padding: "20px",
        marginBottom: "20px",
        boxShadow: "0 4px 14px rgba(15, 23, 42, 0.05)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "16px",
          flexWrap: "wrap",
          marginBottom: "18px",
        }}
      >
        <div>
          <h2
            style={{
              margin: "0 0 6px",
              color: BLUE,
            }}
          >
            Customer Portal Banner
          </h2>

          <p
            style={{
              margin: 0,
              color: MUTED,
              lineHeight: 1.6,
            }}
          >
            Schedule short updates to run across the top of
            the customer Dashboard.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchBanners}
          disabled={loading}
          style={{
            minHeight: "44px",
            padding: "10px 16px",
            border: "none",
            borderRadius: "10px",
            backgroundColor: BLUE,
            color: WHITE,
            fontWeight: "800",
            cursor: loading ? "wait" : "pointer",
          }}
        >
          {loading ? "Loading..." : "Refresh Banners"}
        </button>
      </div>

      <div className="portal-banner-summary">
        <div>
          <strong>{summary.total}</strong>
          <span>Total</span>
        </div>

        <div>
          <strong style={{ color: "#16A34A" }}>
            {summary.live}
          </strong>
          <span>Live</span>
        </div>

        <div>
          <strong style={{ color: BLUE }}>
            {summary.scheduled}
          </strong>
          <span>Scheduled</span>
        </div>

        <div>
          <strong style={{ color: ORANGE }}>
            {summary.inactive}
          </strong>
          <span>Inactive/Expired</span>
        </div>
      </div>

      <div className="portal-banner-form">
        <label className="portal-banner-field portal-banner-message">
          <span>Banner message</span>

          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            maxLength={240}
            placeholder="Enter a short customer update"
          />

          <small>
            {formData.message.length}/240 characters
          </small>
        </label>

        <label className="portal-banner-field">
          <span>Banner type</span>

          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
          >
            <option value="Information">Information</option>
            <option value="Important">Important</option>
            <option value="Urgent">Urgent</option>
          </select>
        </label>

        <label className="portal-banner-field">
          <span>Start date and time</span>

          <input
            type="datetime-local"
            name="startAt"
            value={formData.startAt}
            onChange={handleChange}
          />
        </label>

        <label className="portal-banner-field">
          <span>End date and time</span>

          <input
            type="datetime-local"
            name="endAt"
            value={formData.endAt}
            onChange={handleChange}
          />
        </label>

        <label className="portal-banner-field">
          <span>Optional link</span>

          <input
            type="text"
            name="linkUrl"
            value={formData.linkUrl}
            onChange={handleChange}
            placeholder="https://... or /my-packages"
          />
        </label>

        <label className="portal-banner-field">
          <span>Optional button label</span>

          <input
            type="text"
            name="linkLabel"
            value={formData.linkLabel}
            onChange={handleChange}
            maxLength={40}
            placeholder="View Details"
          />
        </label>

        <label className="portal-banner-active">
          <input
            type="checkbox"
            name="isActive"
            checked={formData.isActive}
            onChange={handleChange}
          />

          <span>Banner is active</span>
        </label>
      </div>

      <div
        style={{
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
          marginTop: "16px",
          marginBottom: "22px",
        }}
      >
        <button
          type="button"
          onClick={saveBanner}
          disabled={saving}
          style={{
            minHeight: "44px",
            padding: "10px 18px",
            border: "none",
            borderRadius: "10px",
            backgroundColor: saving ? "#94A3B8" : ORANGE,
            color: WHITE,
            fontWeight: "800",
            cursor: saving ? "wait" : "pointer",
          }}
        >
          {saving
            ? "Saving..."
            : editingId
            ? "Update Banner"
            : "Schedule Banner"}
        </button>

        {editingId && (
          <button
            type="button"
            onClick={resetForm}
            style={{
              minHeight: "44px",
              padding: "10px 18px",
              border: `1px solid ${BORDER}`,
              borderRadius: "10px",
              backgroundColor: WHITE,
              color: BLUE,
              fontWeight: "800",
              cursor: "pointer",
            }}
          >
            Cancel Editing
          </button>
        )}
      </div>

      <div>
        <h3
          style={{
            margin: "0 0 12px",
            color: "#0F172A",
          }}
        >
          Scheduled Banner History
        </h3>

        {loading ? (
          <p style={{ color: MUTED }}>Loading banners...</p>
        ) : banners.length === 0 ? (
          <div className="portal-banner-empty">
            No portal banners have been scheduled yet.
          </div>
        ) : (
          <div className="portal-banner-list">
            {banners.map((banner) => (
              <article
                key={banner._id}
                className="portal-banner-record"
              >
                <div className="portal-banner-record-main">
                  <div className="portal-banner-record-meta">
                    <span style={statusStyle(banner.scheduleStatus)}>
                      {banner.scheduleStatus}
                    </span>

                    <span>{banner.type}</span>

                    <span>
                      {banner.isActive ? "Active" : "Disabled"}
                    </span>
                  </div>

                  <strong>{banner.message}</strong>

                  <div className="portal-banner-schedule">
                    <span>
                      Starts: {formatDateTime(banner.startAt)}
                    </span>

                    <span>
                      Ends: {formatDateTime(banner.endAt)}
                    </span>
                  </div>
                </div>

                <div className="portal-banner-actions">
                  <button
                    type="button"
                    onClick={() => editBanner(banner)}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="archive"
                    onClick={() => archiveBanner(banner)}
                  >
                    Archive
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .portal-banner-summary {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 18px;
        }

        .portal-banner-summary > div {
          display: grid;
          gap: 4px;
          padding: 14px;
          border: 1px solid ${BORDER};
          border-radius: 12px;
          background: #f8fafc;
        }

        .portal-banner-summary strong {
          color: ${BLUE};
          font-size: 24px;
        }

        .portal-banner-summary span {
          color: #475569;
          font-size: 13px;
          font-weight: 700;
        }

        .portal-banner-form {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .portal-banner-field {
          display: grid;
          gap: 7px;
          color: #334155;
          font-size: 13px;
          font-weight: 800;
        }

        .portal-banner-field input,
        .portal-banner-field select,
        .portal-banner-field textarea {
          width: 100%;
          min-height: 44px;
          padding: 11px 12px;
          border: 1px solid ${BORDER};
          border-radius: 10px;
          background: ${WHITE};
          color: #0f172a;
          font: inherit;
        }

        .portal-banner-field textarea {
          min-height: 96px;
          resize: vertical;
        }

        .portal-banner-message {
          grid-column: 1 / -1;
        }

        .portal-banner-field small {
          color: ${MUTED};
          font-weight: 600;
          text-align: right;
        }

        .portal-banner-active {
          display: flex;
          align-items: center;
          gap: 10px;
          min-height: 44px;
          color: #334155;
          font-weight: 800;
        }

        .portal-banner-active input {
          width: 20px;
          height: 20px;
        }

        .portal-banner-list {
          display: grid;
          gap: 10px;
        }

        .portal-banner-record {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          padding: 15px;
          border: 1px solid ${BORDER};
          border-radius: 12px;
          background: #f8fafc;
        }

        .portal-banner-record-main {
          display: grid;
          gap: 9px;
          min-width: 0;
        }

        .portal-banner-record-meta,
        .portal-banner-schedule,
        .portal-banner-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          align-items: center;
        }

        .portal-banner-record-meta {
          color: ${MUTED};
          font-size: 12px;
          font-weight: 700;
        }

        .portal-banner-schedule {
          color: ${MUTED};
          font-size: 12px;
        }

        .portal-banner-actions button {
          min-height: 40px;
          padding: 8px 13px;
          border: none;
          border-radius: 9px;
          background: ${BLUE};
          color: ${WHITE};
          font-weight: 800;
          cursor: pointer;
        }

        .portal-banner-actions .archive {
          background: #b91c1c;
        }

        .portal-banner-empty {
          padding: 16px;
          border: 1px dashed ${BORDER};
          border-radius: 12px;
          color: ${MUTED};
          text-align: center;
        }

        @media (max-width: 760px) {
          .portal-banner-summary,
          .portal-banner-form {
            grid-template-columns: 1fr;
          }

          .portal-banner-message {
            grid-column: auto;
          }

          .portal-banner-record {
            align-items: flex-start;
            flex-direction: column;
          }

          .portal-banner-actions {
            width: 100%;
          }

          .portal-banner-actions button {
            flex: 1;
          }
        }
      `}</style>
    </section>
  );
}

export default PortalBannerManager;