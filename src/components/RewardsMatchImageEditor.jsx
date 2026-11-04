import { useRef, useState } from "react";
import api from "../api";

const COLORS = [
  "#1d4ed8", "#c2410c", "#7c3aed", "#0f766e",
  "#be185d", "#4338ca", "#166534", "#a16207",
];

export const newImagePair = () => ({
  id: window.crypto.randomUUID(),
  imageUrl: "",
  publicId: "",
  label: "",
});

export default function RewardsMatchImageEditor({
  pairs,
  onChange,
  onBusyChange,
}) {
  const [files, setFiles] = useState({});
  const [messages, setMessages] = useState({});
  const [uploadingId, setUploadingId] = useState(null);
  const uploadBusyRef = useRef(false);

  const update = (id, changes) => {
    onChange((previous) =>
      previous.map((pair) =>
        pair.id === id ? { ...pair, ...changes } : pair
      )
    );
  };

  const chooseFile = (id, event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || uploadBusyRef.current) return;

    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 5 * 1024 * 1024
    ) {
      setMessages((previous) => ({
        ...previous,
        [id]: "Choose a JPG, PNG or WebP image up to 5 MB.",
      }));
      return;
    }

    setFiles((previous) => ({ ...previous, [id]: file }));
    setMessages((previous) => ({ ...previous, [id]: "" }));

    // A replacement must be uploaded before publishing.
    update(id, { imageUrl: "", publicId: "" });
  };

  const uploadImage = async (id) => {
    const file = files[id];

    if (!file || uploadBusyRef.current) return;

    uploadBusyRef.current = true;
    setUploadingId(id);
    onBusyChange(true);
    setMessages((previous) => ({
      ...previous,
      [id]: "Uploading image…",
    }));

    try {
      const body = new FormData();
      body.append("image", file);

      const response = await api.post(
        "/api/rewards-game-images",
        body
      );

      const uploaded = response.data?.data;
      let url;

      try {
        url = new URL(uploaded?.imageUrl);
      } catch {
        throw new Error("The upload response was incomplete.");
      }

      if (
        !response.data?.success ||
        url.protocol !== "https:" ||
        !uploaded?.publicId
      ) {
        throw new Error("The upload response was incomplete.");
      }

      update(id, {
        imageUrl: url.href,
        publicId: uploaded.publicId,
      });

      setFiles((previous) => {
        const next = { ...previous };
        delete next[id];
        return next;
      });

      setMessages((previous) => ({
        ...previous,
        [id]: "Uploaded. Check the preview below.",
      }));
    } catch (error) {
      setMessages((previous) => ({
        ...previous,
        [id]:
          error.response?.data?.message ||
          "The upload could not be confirmed. Try uploading again.",
      }));
    } finally {
      uploadBusyRef.current = false;
      setUploadingId(null);
      onBusyChange(false);
    }
  };

  const inputStyle = {
    width: "100%",
    minWidth: 0,
    boxSizing: "border-box",
    padding: "11px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    font: "inherit",
  };

  const buttonStyle = {
    minHeight: "44px",
    padding: "10px 14px",
    border: "1px solid #0B3D91",
    borderRadius: "8px",
    background: "#fff",
    color: "#0B3D91",
    fontWeight: "bold",
    cursor: "pointer",
  };

  return (
    <section
      style={{
        marginTop: "18px",
        padding: "18px",
        border: "1px solid #dbe3ef",
        borderRadius: "14px",
        background: "#f5f7ff",
        color: "#0B3D91",
      }}
    >
      <h3 style={{ marginTop: 0 }}>Build your Match Image game</h3>

      <p style={{ lineHeight: 1.7 }}>
        Add 3–8 different images. Upload each image and enter
        its correct label. Customers will match the images
        to shuffled label choices.
      </p>

      <p style={{ lineHeight: 1.7 }}>
        JPG, PNG or WebP · Maximum 5 MB per image.
        Images are stored in Cloudinary and are visible to customers.
      </p>

      <div style={{ display: "grid", gap: "14px" }}>
        {pairs.map((pair, index) => (
          <div
            key={pair.id}
            style={{
              padding: "16px",
              border: "1px solid #dbe3ef",
              borderTop: `5px solid ${COLORS[index]}`,
              borderRadius: "12px",
              background: "#fff",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "12px",
                flexWrap: "wrap",
                marginBottom: "14px",
              }}
            >
              <strong>Image {index + 1}</strong>

              <button
                type="button"
                disabled={Boolean(uploadingId) || pairs.length <= 3}
                onClick={() =>
                  onChange((previous) =>
                    previous.filter((item) => item.id !== pair.id)
                  )
                }
                style={buttonStyle}
              >
                Remove image
              </button>
            </div>

            <label style={{ display: "grid", gap: "8px" }}>
              Choose image
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={Boolean(uploadingId)}
                onChange={(event) => chooseFile(pair.id, event)}
                style={inputStyle}
              />
            </label>

            {files[pair.id] ? (
              <p style={{ overflowWrap: "anywhere" }}>
                Selected: {files[pair.id].name}
              </p>
            ) : null}

            <button
              type="button"
              disabled={Boolean(uploadingId) || !files[pair.id]}
              onClick={() => uploadImage(pair.id)}
              style={{ ...buttonStyle, marginTop: "10px" }}
            >
              {uploadingId === pair.id ? "Uploading…" : "Upload image"}
            </button>

            {messages[pair.id] ? (
              <p role="status" style={{ lineHeight: 1.6 }}>
                {messages[pair.id]}
              </p>
            ) : null}

            {pair.imageUrl ? (
              <img
                key={pair.imageUrl}
                src={pair.imageUrl}
                alt={`Preview of matching image ${index + 1}`}
                onError={() =>
                  setMessages((previous) => ({
                    ...previous,
                    [pair.id]:
                      "The uploaded image preview could not load. " +
                      "Check your connection or upload the image again.",
                  }))
                }
                style={{
                  width: "100%",
                  maxHeight: "220px",
                  objectFit: "contain",
                  margin: "12px 0",
                  borderRadius: "10px",
                  background: "#f8fafc",
                }}
              />
            ) : null}

            <label
              style={{
                display: "grid",
                gap: "8px",
                marginTop: "14px",
              }}
            >
              Correct matching label
              <input
                value={pair.label}
                maxLength={80}
                disabled={Boolean(uploadingId)}
                onChange={(event) =>
                  update(pair.id, { label: event.target.value })
                }
                placeholder="For example: Delivery truck"
                style={inputStyle}
              />
            </label>
          </div>
        ))}
      </div>

      <button
        type="button"
        disabled={Boolean(uploadingId) || pairs.length >= 8}
        onClick={() =>
          onChange((previous) =>
            previous.length >= 8
              ? previous
              : [...previous, newImagePair()]
          )
        }
        style={{ ...buttonStyle, marginTop: "14px" }}
      >
        Add image and label
      </button>

      <p style={{ marginBottom: 0, lineHeight: 1.7 }}>
        Use distinct labels and images. Avoid images with the
        answer printed on them. Uploading does not publish the game.
      </p>
    </section>
  );
}