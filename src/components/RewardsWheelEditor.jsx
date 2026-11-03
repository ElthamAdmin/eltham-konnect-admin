const COLORS = [
  "#1d4ed8", "#c2410c", "#7c3aed", "#0f766e",
  "#be185d", "#4338ca", "#166534", "#a16207",
  "#0369a1", "#a21caf", "#9f1239", "#374151",
];

const TYPES = [
  ["Points", "EK Points"],
  ["Gift Card", "Gift card"],
  ["Phone Credit", "Phone credit / phone card"],
  ["Other", "Other prize"],
  ["No Prize", "No prize"],
];

export default function RewardsWheelEditor({
  segments,
  onChange,
}) {
  const update = (index, field, value) => {
    onChange(
      segments.map((segment, segmentIndex) => {
        if (segmentIndex !== index) return segment;

        if (field === "prizeType") {
          return {
            ...segment,
            prizeType: value,
            points: value === "Points" ? "" : "0",
          };
        }

        return { ...segment, [field]: value };
      })
    );
  };

  const size = 100 / segments.length;

  const gradient = segments
    .map(
      (_, index) =>
        `${COLORS[index]} ${index * size}% ${(index + 1) * size}%`
    )
    .join(", ");

  return (
    <section className="ek-wheel-editor">
      <h3>Wheel prizes</h3>

      <p>
        Add 4–12 segments. Each segment has an equal chance.
        Enter the full prize description, including its value
        and currency where relevant.
      </p>

      <div className="ek-wheel-editor-preview">
        <div
          className="ek-wheel-editor-disc"
          style={{
            background: `conic-gradient(${gradient})`,
          }}
          aria-hidden="true"
        >
          <span>EK</span>
        </div>

        <div>
          <strong>{segments.length} equal-chance segments</strong>
          <p>
            Gift cards, phone credit and other prizes are saved
            as pending fulfilment. Only EK Points prizes change
            the customer's points balance.
          </p>
        </div>
      </div>

      {segments.map((segment, index) => (
        <div
          key={index}
          className="ek-wheel-editor-row"
          style={{ borderLeftColor: COLORS[index] }}
        >
          <div className="ek-wheel-editor-heading">
            <strong>Segment {index + 1}</strong>

            <button
              type="button"
              disabled={segments.length <= 4}
              onClick={() =>
                onChange(
                  segments.filter((_, itemIndex) => itemIndex !== index)
                )
              }
            >
              Remove
            </button>
          </div>

          <div className="ek-wheel-editor-fields">
            <label>
              Prize type

              <select
                value={segment.prizeType}
                onChange={(event) =>
                  update(index, "prizeType", event.target.value)
                }
              >
                {TYPES.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Prize description

              <input
                type="text"
                maxLength={60}
                value={segment.label}
                placeholder={
                  segment.prizeType === "Gift Card"
                    ? "US$10 Amazon gift card"
                    : segment.prizeType === "Phone Credit"
                      ? "J$500 Digicel phone credit"
                      : segment.prizeType === "Points"
                        ? "100 EK Points"
                        : segment.prizeType === "No Prize"
                          ? "No prize this time"
                          : "Describe the prize"
                }
                onChange={(event) =>
                  update(index, "label", event.target.value)
                }
              />
            </label>

            <label>
              EK Points amount

              <input
                type="number"
                min="1"
                max="1500"
                step="1"
                disabled={segment.prizeType !== "Points"}
                value={
                  segment.prizeType === "Points"
                    ? segment.points
                    : "0"
                }
                placeholder="1–1500"
                onChange={(event) =>
                  update(index, "points", event.target.value)
                }
              />
            </label>
          </div>

          <small>
            {segment.prizeType === "Points"
              ? "Credited automatically, subject to the balance limit."
              : segment.prizeType === "No Prize"
                ? "This segment does not award a prize."
                : "Recorded as a win awaiting fulfilment by your team."}
          </small>
        </div>
      ))}

      <button
        type="button"
        disabled={segments.length >= 12}
        onClick={() =>
          onChange([
            ...segments,
            {
              label: "",
              prizeType: "No Prize",
              points: "0",
            },
          ])
        }
      >
        Add segment
      </button>

      <p className="ek-wheel-editor-note">
        Use descriptions here, not gift-card redemption codes
        or phone-card PINs. These descriptions are visible to customers.
      </p>

      <style>{`
        .ek-wheel-editor {
          margin-top: 18px;
          padding: 18px;
          border: 1px solid #dbe3ef;
          border-radius: 14px;
          background: #f5f7ff;
          color: #0f172a;
        }

        .ek-wheel-editor h3 {
          margin-top: 0;
          color: #0B3D91;
        }

        .ek-wheel-editor p {
          line-height: 1.6;
        }

        .ek-wheel-editor-preview {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 20px;
          margin: 20px 0;
        }

        .ek-wheel-editor-preview > div:last-child {
          flex: 1 1 220px;
        }

        .ek-wheel-editor-disc {
          display: grid;
          place-items: center;
          flex: 0 0 150px;
          width: 150px;
          height: 150px;
          border: 6px solid #ffffff;
          border-radius: 50%;
          box-shadow: 0 5px 18px rgba(11,61,145,0.18);
        }

        .ek-wheel-editor-disc span {
          display: grid;
          place-items: center;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #ffffff;
          color: #0B3D91;
          font-weight: 900;
        }

        .ek-wheel-editor-row {
          margin-bottom: 12px;
          padding: 14px;
          border: 1px solid #dbe3ef;
          border-left: 6px solid;
          border-radius: 10px;
          background: #ffffff;
        }

        .ek-wheel-editor-heading {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }

        .ek-wheel-editor-fields {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 12px;
        }

        .ek-wheel-editor label {
          display: grid;
          gap: 6px;
          font-size: 13px;
          font-weight: bold;
        }

        .ek-wheel-editor input,
        .ek-wheel-editor select {
          width: 100%;
          min-width: 0;
          min-height: 44px;
          padding: 10px;
          box-sizing: border-box;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          background: #ffffff;
          color: #0f172a;
          font-size: 14px;
        }

        .ek-wheel-editor input:disabled {
          background: #f1f5f9;
          color: #64748b;
        }

        .ek-wheel-editor button {
          min-height: 44px;
          padding: 8px 12px;
          border: 1px solid #0B3D91;
          border-radius: 8px;
          background: #ffffff;
          color: #0B3D91;
          font-weight: bold;
          cursor: pointer;
          touch-action: manipulation;
        }

        .ek-wheel-editor button:disabled {
          opacity: 0.5;
          cursor: default;
        }

        .ek-wheel-editor small {
          display: block;
          margin-top: 10px;
          color: #475569;
          line-height: 1.5;
        }

        .ek-wheel-editor-note {
          margin-bottom: 0;
          color: #475569;
          font-size: 13px;
        }
      `}</style>
    </section>
  );
}