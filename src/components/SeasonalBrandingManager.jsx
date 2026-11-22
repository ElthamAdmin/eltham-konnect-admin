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

    const savedEvents = [...campaigns].sort(
    (a, b) => new Date(a.startsAt) - new Date(b.startsAt)
  );

  const now = Date.now();
  const previewEvent =
    savedEvents.find(
      (item) => Date.parse(item.startsAt) <= now && now < Date.parse(item.endsAt)
    ) || savedEvents.find((item) => Date.parse(item.startsAt) > now);

  const previewImage = file ? previewUrl : previewEvent?.icons?.["192"];
  const previewLabel = file
    ? eventName.trim() || "Selected artwork"
    : previewEvent?.name || "";

  const jamaicaDate = (value) =>
    new Date(value).toLocaleDateString("en-JM", {
      timeZone: "America/Jamaica",
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return (
    <section className="ek-seasonal" aria-labelledby="seasonal-branding-title">
      <style>{`
        .ek-seasonal {
          --ek-blue: #0b3d91;
          --ek-orange: #f15a24;
          box-sizing: border-box;
          margin-bottom: 20px;
          padding: clamp(16px, 2vw, 26px);
          background: #fff;
          color: #172a44;
          border: 1px solid #d5e1f0;
          border-radius: 12px;
        }
        .ek-seasonal *, .ek-seasonal *::before, .ek-seasonal *::after {
          box-sizing: border-box;
        }
        .ek-seasonal h2, .ek-seasonal h3, .ek-seasonal p,
        .ek-seasonal figure { margin: 0; }
        .ek-seasonal h2 { color: #10294f; font-size: 23px; }
        .ek-seasonal h3 { color: #10294f; font-size: 16px; }
        .ek-seasonal .ek-intro {
          margin: 6px 0 20px;
          color: #475b76;
          line-height: 1.5;
        }
        .ek-seasonal .ek-columns {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
          gap: 24px;
          align-items: start;
        }
        .ek-seasonal .ek-fields { display: grid; gap: 16px; min-width: 0; }
        .ek-seasonal label {
          display: grid;
          gap: 6px;
          color: #172a44;
          font-size: 14px;
          font-weight: 650;
        }
        .ek-seasonal input {
          display: block;
          width: 100%;
          min-width: 0;
          min-height: 42px;
          padding: 9px 11px;
          background: #fff;
          color: #172a44;
          border: 1px solid #b4c5db;
          border-radius: 7px;
          font: inherit;
          font-weight: 400;
        }
        .ek-seasonal input[type=file] { padding: 5px; }
        .ek-seasonal input::file-selector-button {
          margin-right: 10px;
          padding: 7px 10px;
          border: 1px solid #b4c5db;
          border-radius: 4px;
          background: #edf3fc;
          color: var(--ek-blue);
          font-weight: 650;
          cursor: pointer;
        }
        .ek-seasonal .ek-dates {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 155px), 1fr));
          gap: 12px;
        }
        .ek-seasonal .ek-help { color: #475b76; font-size: 13px; }
        .ek-seasonal .ek-error { color: #9b2525; }
        .ek-seasonal button.ek-schedule {
          justify-self: start;
          min-height: 44px;
          padding: 10px 22px;
          background: var(--ek-blue);
          color: #fff;
          border: 1px solid var(--ek-blue);
          border-radius: 7px;
          font: inherit;
          font-weight: 700;
          cursor: pointer;
          opacity: 1;
        }
        .ek-seasonal button.ek-schedule:hover { background: #082f72; }
        .ek-seasonal button.ek-schedule:disabled {
          background: #425674;
          color: #fff;
          cursor: wait;
        }
        .ek-seasonal :is(input, button):focus-visible {
          outline: 3px solid #ce521e;
          outline-offset: 2px;
        }
        .ek-seasonal .ek-preview {
          margin-top: 9px;
          min-height: 245px;
          display: grid;
          place-content: center;
          justify-items: center;
          gap: 10px;
          padding: 28px;
          border-radius: 12px;
          border-bottom: 4px solid var(--ek-orange);
          background: linear-gradient(145deg, #082653, #0b3d91 65%, #1554ab);
          color: #fff;
          text-align: center;
        }
        .ek-seasonal .ek-preview img {
          display: block;
          width: 72px;
          height: 72px;
          object-fit: contain;
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 12px #00193766;
        }
        .ek-seasonal figcaption { margin-top: 9px; color: #475b76; font-size: 13px; }
        .ek-seasonal .ek-feedback {
          padding: 10px 12px;
          border-left: 3px solid var(--ek-blue);
          background: #edf3fc;
          color: #173962;
        }
        .ek-seasonal .ek-saved {
          margin-top: 22px;
          padding-top: 18px;
          border-top: 1px solid #d5e1f0;
        }
        .ek-seasonal .ek-saved ul { margin: 8px 0 0; padding: 0; list-style: none; }
        .ek-seasonal .ek-saved li {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 0;
          border-bottom: 1px solid #e5ecf5;
        }
        .ek-seasonal .ek-saved img {
          width: 42px;
          height: 42px;
          object-fit: contain;
          border: 1px solid #d5e1f0;
          border-radius: 9px;
        }
      `}</style>

      <h2 id="seasonal-branding-title">Seasonal Branding</h2>
      <p className="ek-intro">
        Schedule the icon customers see on their Home Screen and in the customer portal.
      </p>

      <div className="ek-columns">
        <div className="ek-fields">
          <label>
            Event name
            <input
              value={eventName}
              maxLength={120}
              placeholder="Enter an event name"
              disabled={saving}
              onChange={(e) => setEventName(e.target.value)}
            />
          </label>

          <label>
            Icon artwork
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              disabled={saving}
              aria-describedby="ek-artwork-help"
              onChange={(e) => {
                setPreviewUrl("");
                setMessage("");
                setFile(e.target.files?.[0] || null);
              }}
            />
            <span id="ek-artwork-help" className="ek-help">
              Square PNG, JPG or WebP · At least 512 × 512 pixels · Up to 5 MB
            </span>
          </label>

          {imageError && <p role="alert" className="ek-error">{imageError}</p>}

          <div className="ek-dates">
            <label>
              Start date
              <input type="date" value={startsOn} disabled={saving}
                onChange={(e) => setStartsOn(e.target.value)} />
            </label>
            <label>
              Last active date
              <input type="date" value={endsOn} min={startsOn || undefined}
                disabled={saving} onChange={(e) => setEndsOn(e.target.value)} />
            </label>
          </div>

          <p className="ek-help">
            Dates use Jamaica time. The icon stays active through the last day.
          </p>

          <button type="button" className="ek-schedule"
            disabled={saving} onClick={scheduleEvent}>
            {saving ? "Saving event…" : "Schedule event"}
          </button>

          {message && <p role="status" className="ek-feedback">{message}</p>}
        </div>

        <figure>
          <h3>Home Screen preview</h3>
          <div className="ek-preview">
            {previewImage ? (
              <>
                <img src={previewImage} alt={`${previewLabel} app icon`} />
                <strong>Eltham Konnect</strong>
              </>
            ) : (
              <span>Choose square artwork to preview the app icon.</span>
            )}
          </div>
          {previewImage && (
            <figcaption>
              {file ? "Selected artwork" : "Saved event"} · {previewLabel}
            </figcaption>
          )}
        </figure>
      </div>

      <div className="ek-saved">
        <h3>Saved events</h3>
        {savedEvents.length === 0 ? (
          <p className="ek-help">No seasonal events scheduled yet.</p>
        ) : (
          <ul>
            {savedEvents.map((item) => (
              <li key={item._id}>
                {item.icons?.["192"] && <img src={item.icons["192"]} alt="" />}
                <div>
                  <strong>{item.name}</strong>
                  <div className="ek-help">
                    {jamaicaDate(item.startsAt)} – {jamaicaDate(Date.parse(item.endsAt) - 1)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}