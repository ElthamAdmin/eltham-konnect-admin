import { useEffect, useRef, useState } from "react";
import api from "../api";

const PORTALS = ["admin", "customer"];

const emptyAppearance = () => ({
  enabled: false,
  wallpaperUrl: "",
  wallpaperPublicId: "",
  wallpaperName: "",
  position: "center",
  overlayOpacity: 0.45,
  heading: "",
  message: "",
  startsAt: "",
  endsAt: "",
});

// Jamaica uses UTC-05:00 throughout the year.
// These conversions do not depend on the computer's time zone.
const toJamaicaInput = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";

  return new Date(date.getTime() - 5 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 16);
};

const toUtc = (value) => {
  if (!value) return null;

  const date = new Date(`${value}:00-05:00`);

  if (
    !Number.isFinite(date.getTime()) ||
    toJamaicaInput(date.toISOString()) !== value
  ) {
    throw new Error("Enter a valid Jamaica date and time.");
  }

  return date.toISOString();
};

const readAppearance = (value) => ({
  ...emptyAppearance(),
  enabled: value?.enabled === true,
  wallpaperUrl: value?.wallpaperUrl || "",
  wallpaperPublicId: value?.wallpaperPublicId || "",
  wallpaperName: value?.wallpaperName || "",
  position: value?.position || "center",
  overlayOpacity: value?.overlayOpacity ?? 0.45,
  heading: value?.heading || "",
  message: value?.message || "",
  startsAt: toJamaicaInput(value?.startsAt),
  endsAt: toJamaicaInput(value?.endsAt),
});

function WallpaperPreview({ appearance, portal }) {
  const [loadedUrl, setLoadedUrl] = useState("");
  const [failedUrl, setFailedUrl] = useState("");

  const url = appearance.wallpaperUrl;
  const imageReady = Boolean(url) && loadedUrl === url;
  const imageFailed = Boolean(url) && failedUrl === url;

  return (
    <>
      <p>
        <strong>Design preview</strong> — previews the design regardless
        of its enabled status or schedule.
      </p>

      <div
        style={{
          position: "relative",
          isolation: "isolate",
          overflow: "hidden",
          borderRadius: 14,
          background: "#0b3d91",
          padding: "28px 18px",
          minHeight: 300,
        }}
      >
        {url && (
          <img
            src={url}
            alt=""
            onLoad={() => {
              setLoadedUrl(url);
              setFailedUrl("");
            }}
            onError={() => {
              setLoadedUrl("");
              setFailedUrl(url);
            }}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: appearance.position,
              zIndex: -2,
              visibility: imageReady ? "visible" : "hidden",
            }}
          />
        )}

        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background: `rgba(0,0,0,${appearance.overlayOpacity})`,
            zIndex: -1,
          }}
        />

        {(appearance.heading || appearance.message) && (
          <div
            style={{
              color: "#fff",
              maxWidth: 500,
              margin: "0 auto 20px",
              overflowWrap: "anywhere",
            }}
          >
            {appearance.heading && (
              <h3 style={{ color: "#fff", marginTop: 0 }}>
                {appearance.heading}
              </h3>
            )}

            {appearance.message && (
              <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                {appearance.message}
              </p>
            )}
          </div>
        )}

        <div
          style={{
            maxWidth: 340,
            margin: "0 auto",
            borderRadius: 14,
            padding: 22,
            background: "#fff",
            color: "#0f172a",
            boxShadow: "0 8px 24px rgba(0,0,0,.15)",
          }}
        >
          <strong>
            {portal === "admin" ? "Admin Login" : "Customer Login"}
          </strong>

          <p style={{ color: "#475569", lineHeight: 1.5 }}>
            The login form remains on a solid, readable background.
          </p>

          <div
            aria-hidden="true"
            style={{
              height: 38,
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              marginBottom: 12,
            }}
          />

          <div
            aria-hidden="true"
            style={{
              height: 38,
              background: "#0b3d91",
              borderRadius: 8,
            }}
          />
        </div>
      </div>

      {url && !imageReady && !imageFailed && (
        <p role="status">Loading wallpaper preview…</p>
      )}

      {imageFailed && (
        <p role="alert" style={{ color: "#b91c1c" }}>
          The preview could not load. Check your connection or upload
          the wallpaper again before enabling it.
        </p>
      )}
    </>
  );
}

export default function LoginAppearanceManager() {
  const [drafts, setDrafts] = useState({
    admin: emptyAppearance(),
    customer: emptyAppearance(),
  });
  const [portal, setPortal] = useState("admin");
  const [files, setFiles] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const actionRef = useRef(false);

  const current = drafts[portal];
  const otherPortal = portal === "admin" ? "customer" : "admin";

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await api.get("/api/settings");

        if (!response.data?.success || !response.data?.data) {
          throw new Error("Could not confirm the appearance settings.");
        }

        if (cancelled) return;

        const appearance = response.data.data.loginAppearance;

        setDrafts({
          admin: readAppearance(appearance?.admin),
          customer: readAppearance(appearance?.customer),
        });
        setLoaded(true);
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              err.message ||
              "Could not load login appearance. Reload Settings to retry."
          );
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const update = (changes) => {
    if (actionRef.current) return;

    setDrafts((previous) => ({
      ...previous,
      [portal]: { ...previous[portal], ...changes },
    }));
    setMessage("");
    setError("");
  };

  const chooseFile = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || actionRef.current) return;

    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 5 * 1024 * 1024
    ) {
      setError("Choose a JPG, PNG or WebP wallpaper up to 5 MB.");
      return;
    }

    setFiles((previous) => ({ ...previous, [portal]: file }));
    setMessage("File selected. Upload it before saving.");
    setError("");
  };

  const upload = async () => {
    if (actionRef.current || !loaded || !files[portal]) return;

    const target = portal;
    actionRef.current = true;
    setBusy("upload");
    setMessage("");
    setError("");

    try {
      const body = new FormData();
      body.append("wallpaper", files[target]);

      const response = await api.post(
        "/api/settings/login-appearance/wallpaper",
        body
      );

      const uploaded = response.data?.data;
      const url = new URL(uploaded?.wallpaperUrl);

      if (
        !response.data?.success ||
        url.protocol !== "https:" ||
        !uploaded?.wallpaperPublicId
      ) {
        throw new Error("The upload response was incomplete.");
      }

      setDrafts((previous) => ({
        ...previous,
        [target]: {
          ...previous[target],
          wallpaperUrl: url.href,
          wallpaperPublicId: uploaded.wallpaperPublicId,
          wallpaperName: uploaded.wallpaperName || "",
        },
      }));

      setFiles((previous) => {
        const next = { ...previous };
        delete next[target];
        return next;
      });

      setMessage(
        "Wallpaper uploaded. Review the preview, then save. " +
          "Uploading has not changed either login page."
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Could not confirm the upload. Try again."
      );
    } finally {
      actionRef.current = false;
      setBusy("");
    }
  };

  const save = async () => {
    if (actionRef.current || !loaded) return;

    setMessage("");
    setError("");

    let payload;

    try {
      if (PORTALS.some((name) => files[name])) {
        throw new Error(
          "Upload or discard each selected file before saving."
        );
      }

      payload = Object.fromEntries(
        PORTALS.map((name) => {
          const draft = drafts[name];
          const startsAt = toUtc(draft.startsAt);
          const endsAt = toUtc(draft.endsAt);

          if (draft.enabled && !draft.wallpaperUrl) {
            throw new Error(
              `Upload a wallpaper for the ${name} portal before enabling it.`
            );
          }

          if (
            startsAt &&
            endsAt &&
            new Date(endsAt) <= new Date(startsAt)
          ) {
            throw new Error(
              `The ${name} end time must be after its start time.`
            );
          }

          return [name, { ...draft, startsAt, endsAt }];
        })
      );
    } catch (err) {
      setError(err.message);
      return;
    }

    actionRef.current = true;
    setBusy("save");

    try {
      const response = await api.put(
        "/api/settings/login-appearance",
        payload
      );

      const saved = response.data?.data;

      if (
        !response.data?.success ||
        !saved?.admin ||
        !saved?.customer
      ) {
        throw new Error(
          "Could not confirm the save. Reload Settings to check before retrying."
        );
      }

      setDrafts({
        admin: readAppearance(saved.admin),
        customer: readAppearance(saved.customer),
      });

      setMessage(
        "Login appearance saved for both portals. " +
          "Enabled designs follow their saved schedules."
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Could not confirm the save. Reload Settings to check before retrying."
      );
    } finally {
      actionRef.current = false;
      setBusy("");
    }
  };

  const copyToOther = () => {
    if (actionRef.current) return;

    if (files[portal] || files[otherPortal]) {
      setError("Upload or discard selected files before copying.");
      return;
    }

    setDrafts((previous) => ({
      ...previous,
      [otherPortal]: { ...previous[portal] },
    }));
    setMessage(
      `Design and schedule copied to the ${otherPortal} draft. Save to apply.`
    );
    setError("");
  };

  return (
    <section className="ek-appearance">
      <style>{`
        .ek-appearance {
          background:#fff;
          color:#0f172a;
          padding:20px;
          margin-bottom:24px;
          border:1px solid #dbe3ef;
          border-radius:12px;
        }
        .ek-appearance p { line-height:1.6; }
        .ek-appearance fieldset {
          border:0;
          padding:0;
          margin:0;
          min-width:0;
        }
        .ek-appearance label {
          display:grid;
          gap:7px;
          margin-bottom:16px;
          font-weight:600;
        }
        .ek-appearance input,
        .ek-appearance select,
        .ek-appearance textarea {
          width:100%;
          min-width:0;
          box-sizing:border-box;
          padding:11px;
          font:inherit;
          border:1px solid #cbd5e1;
          border-radius:8px;
          background:#fff;
          color:#0f172a;
        }
        .ek-appearance input[type="checkbox"] {
          width:20px;
          height:20px;
        }
        .ek-appearance button {
          min-height:44px;
          padding:10px 15px;
          border:1px solid #0b3d91;
          border-radius:8px;
          background:#fff;
          color:#0b3d91;
          font:inherit;
          font-weight:bold;
          cursor:pointer;
        }
        .ek-appearance button:disabled {
          opacity:.55;
          cursor:default;
        }
        .ek-appearance button:focus-visible {
          outline:3px solid #f15a24;
          outline-offset:3px;
        }
        .ek-appearance .ek-appearance-save {
          background:#0b3d91;
          color:#fff;
        }
        .ek-appearance-row {
          display:flex;
          flex-wrap:wrap;
          gap:10px;
          margin-bottom:16px;
        }
        .ek-appearance-columns {
          display:grid;
          grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));
          gap:24px;
        }
      `}</style>

      <h2 style={{ marginTop: 0 }}>Login Appearance</h2>

      <p>
        Manage seasonal wallpapers and announcements for both login
        pages. This section has its own Save Login Appearance button.
      </p>

      {!loaded && !error && <p role="status">Loading appearance…</p>}

      <fieldset disabled={!loaded || Boolean(busy)}>
        <legend style={{ fontWeight: "bold", marginBottom: 12 }}>
          Choose the portal to edit
        </legend>

        <div className="ek-appearance-row">
          {PORTALS.map((name) => (
            <button
              key={name}
              type="button"
              aria-pressed={portal === name}
              onClick={() => {
                setPortal(name);
                setMessage("");
                setError("");
              }}
              style={{
                background: portal === name ? "#0b3d91" : "#fff",
                color: portal === name ? "#fff" : "#0b3d91",
              }}
            >
              {name === "admin" ? "Admin Portal" : "Customer Portal"}
            </button>
          ))}
        </div>

        <div className="ek-appearance-columns">
          <div>
            <label style={{ display: "flex", alignItems: "center" }}>
              <input
                type="checkbox"
                checked={current.enabled}
                onChange={(event) =>
                  update({ enabled: event.target.checked })
                }
              />
              Enable this portal's appearance
            </label>

            <label>
              Wallpaper — JPG, PNG or WebP, maximum 5 MB
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={chooseFile}
              />
            </label>

            {files[portal] && (
              <p style={{ overflowWrap: "anywhere" }}>
                Selected: {files[portal].name}
              </p>
            )}

            <div className="ek-appearance-row">
              <button
                type="button"
                disabled={!files[portal]}
                onClick={upload}
              >
                Upload wallpaper
              </button>

              {files[portal] && (
                <button
                  type="button"
                  onClick={() => {
                    setFiles((previous) => {
                      const next = { ...previous };
                      delete next[portal];
                      return next;
                    });
                    setMessage("Selected file discarded.");
                    setError("");
                  }}
                >
                  Discard selected file
                </button>
              )}

              {current.wallpaperUrl && (
                <button
                  type="button"
                  onClick={() =>
                    update({
                      enabled: false,
                      wallpaperUrl: "",
                      wallpaperPublicId: "",
                      wallpaperName: "",
                    })
                  }
                >
                  Remove wallpaper from draft
                </button>
              )}
            </div>

            {current.wallpaperName && (
              <p style={{ overflowWrap: "anywhere" }}>
                Uploaded: {current.wallpaperName}
              </p>
            )}

            <label>
              Image position
              <select
                value={current.position}
                onChange={(event) =>
                  update({ position: event.target.value })
                }
              >
                {["center", "top", "bottom", "left", "right"].map(
                  (position) => (
                    <option key={position} value={position}>
                      {position.charAt(0).toUpperCase() + position.slice(1)}
                    </option>
                  )
                )}
              </select>
            </label>

            <label>
              Dark overlay: {Math.round(current.overlayOpacity * 100)}%
              <input
                type="range"
                min="0"
                max="0.85"
                step="0.05"
                value={current.overlayOpacity}
                onChange={(event) =>
                  update({ overlayOpacity: Number(event.target.value) })
                }
              />
            </label>

            <label>
              Optional heading
              <input
                value={current.heading}
                maxLength={120}
                onChange={(event) =>
                  update({ heading: event.target.value })
                }
              />
            </label>

            <label>
              Optional message
              <textarea
                value={current.message}
                maxLength={500}
                rows={4}
                onChange={(event) =>
                  update({ message: event.target.value })
                }
              />
            </label>

            <label>
              Start — Jamaica time
              <input
                type="datetime-local"
                value={current.startsAt}
                onChange={(event) =>
                  update({ startsAt: event.target.value })
                }
              />
            </label>

            <label>
              End — Jamaica time
              <input
                type="datetime-local"
                value={current.endsAt}
                onChange={(event) =>
                  update({ endsAt: event.target.value })
                }
              />
            </label>

            <p>
              Leave Start empty to begin when enabled and saved.
              Leave End empty to continue until disabled. Outside the
              scheduled period, the normal login design is used.
            </p>

            <button type="button" onClick={copyToOther}>
              Copy this design and schedule to{" "}
              {otherPortal === "admin" ? "Admin Portal" : "Customer Portal"}
            </button>
          </div>

          <div>
            <WallpaperPreview
              appearance={current}
              portal={portal}
            />
          </div>
        </div>
      </fieldset>

      <div style={{ marginTop: 20 }}>
        <button
          type="button"
          className="ek-appearance-save"
          disabled={!loaded || Boolean(busy)}
          onClick={save}
        >
          {busy === "save" ? "Saving…" : "Save Login Appearance"}
        </button>
      </div>

      {busy === "upload" && <p role="status">Uploading wallpaper…</p>}

      {message && (
        <p role="status" style={{ color: "#166534" }}>
          {message}
        </p>
      )}

      {error && (
        <p role="alert" style={{ color: "#b91c1c" }}>
          {error}
        </p>
      )}
    </section>
  );
}