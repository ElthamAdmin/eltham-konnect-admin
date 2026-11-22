import { useEffect, useState } from "react";
import api from "../api";

export default function SeasonalBrandingManager({ campaigns, onScheduled }) {
  const [eventName, setEventName] = useState("");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [imageError, setImageError] = useState("");
  const [startsOn, setStartsOn] = useState("");
  const [endsOn, setEndsOn] = useState("");
  const [uploadedIcon, setUploadedIcon] = useState(null);
const [saving, setSaving] = useState(false);
const [message, setMessage] = useState("");

  useEffect(() => {
    setPreviewUrl("");
    setImageError("");

    if (!file) return;

    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      if (image.naturalWidth !== image.naturalHeight) {
        setImageError("Choose square artwork so the icon keeps its proportions.");
      } else if (image.naturalWidth < 512) {
        setImageError("Choose artwork at least 512 × 512 pixels.");
      } else {
        setPreviewUrl(url);
      }
    };

    image.onerror = () => {
      setImageError("This image could not be opened. Try a PNG, JPEG, or WebP file.");
    };

    image.src = url;

    return () => {
      image.onload = null;
      image.onerror = null;
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const scheduleEvent = async () => {
  if (saving) return;

  const name = eventName.trim();
  if (!name || name.length > 120) {
    setMessage("Enter an event name of up to 120 characters.");
    return;
  }

  if (!file || !previewUrl || imageError) {
    setMessage("Choose a square image and wait for the preview to appear.");
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    setMessage("Choose an image that is 5 MB or smaller.");
    return;
  }

  if (!startsOn || !endsOn || endsOn < startsOn) {
    setMessage("Choose a start date and a last active date in Jamaica time.");
    return;
  }

  setSaving(true);
  setMessage("");

  try {
    let publicId = uploadedIcon?.file === file ? uploadedIcon.publicId : null;

    if (!publicId) {
      const body = new FormData();
      body.append("icon", file);

      const upload = await api.post("/api/settings/seasonal-branding/icon", body);
      publicId = upload.data?.data?.publicId;

      if (!publicId) {
        throw new Error("The icon upload could not be confirmed. Please try again.");
      }

      setUploadedIcon({ file, publicId });
    }

    const response = await api.post(
      "/api/settings/seasonal-branding/campaigns",
      { name, startsOn, endsOn, publicId }
    );

    if (!Array.isArray(response.data?.data)) {
      throw new Error("Reload Settings to check whether the event was saved.");
    }

    onScheduled(response.data.data);
    setMessage(`${name} scheduled. You can check the dates under Saved events.`);
  } catch (error) {
    setMessage(
      error.response?.data?.message ||
      error.message ||
      "The event could not be saved. Please try again."
    );
  } finally {
    setSaving(false);
  }
};

  return (
    <section
      aria-labelledby="seasonal-branding-title"
      style={{
        background: "white",
        padding: 20,
        marginBottom: 20,
        border: "1px solid #dbe3ef",
        borderRadius: 12,
      }}
    >
      <h2 id="seasonal-branding-title">Seasonal Branding</h2>
      <p>Preview a seasonal Home Screen icon for the Eltham Konnect customer portal.</p>

      <div style={{ display: "grid", gap: 14, maxWidth: 460 }}>
        <label>
          Event name
          <input
            type="text"
            value={eventName}
            onChange={(event) => setEventName(event.target.value)}
            placeholder="Black Friday"
            style={{ display: "block", width: "100%" }}
          />
        </label>

        <label>
          Square icon artwork
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) => setFile(event.target.files?.[0] || null)}
            style={{ display: "block" }}
          />
        </label>

        {imageError && <p role="alert">{imageError}</p>}

        {previewUrl && (
          <figure style={{ margin: 0 }}>
            <img
              src={previewUrl}
              alt={`${eventName.trim() || "Seasonal"} Home Screen icon preview`}
              width="64"
              height="64"
              style={{ display: "block", borderRadius: 14 }}
            />
            <figcaption>Eltham Konnect</figcaption>
          </figure>
        )}

        <label>
          Start date (Jamaica)
          <input
            type="date"
            value={startsOn}
            onChange={(event) => setStartsOn(event.target.value)}
            style={{ display: "block" }}
          />
        </label>

        <label>
          Last active date (Jamaica)
          <input
            type="date"
            value={endsOn}
            min={startsOn || undefined}
            onChange={(event) => setEndsOn(event.target.value)}
            style={{ display: "block" }}
          />
        </label>

        {startsOn && endsOn && endsOn < startsOn && (
          <p role="alert">The last active date must be on or after the start date.</p>
        )}

        <button
  type="button"
  onClick={scheduleEvent}
  disabled={saving || !previewUrl || !eventName.trim() || !startsOn || !endsOn || endsOn < startsOn}
>
  {saving ? "Saving event…" : "Schedule event"}
</button>

<p role="status" style={{ margin: 0 }}>{message}</p>

<h3 style={{ marginBottom: 0 }}>Saved events</h3>

{campaigns.length === 0 ? (
  <p style={{ margin: 0 }}>No seasonal events scheduled yet.</p>
) : (
  <ul>
    {[...campaigns]
      .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt))
      .map((campaign) => {
        const dateFormat = {
          timeZone: "America/Jamaica",
          year: "numeric",
          month: "short",
          day: "numeric",
        };

        const start = new Date(campaign.startsAt).toLocaleDateString("en-JM", dateFormat);

        // The backend stores the first instant after the final active day.
        const lastDay = new Date(new Date(campaign.endsAt).getTime() - 1)
          .toLocaleDateString("en-JM", dateFormat);

        return (
          <li key={campaign._id}>
            <strong>{campaign.name}</strong> — {start} to {lastDay}
          </li>
        );
      })}
  </ul>
)}
      </div>
    </section>
  );
}