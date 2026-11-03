const COLORS = [
  "#1d4ed8",
  "#c2410c",
  "#7c3aed",
  "#0f766e",
  "#be185d",
  "#4338ca",
  "#166534",
  "#0369a1",
];

export default function RewardsHuntEditor({
  clues,
  onChange,
}) {
  const update = (index, field, value) => {
    onChange(
      clues.map((entry, entryIndex) =>
        entryIndex === index
          ? { ...entry, [field]: value }
          : entry
      )
    );
  };

  return (
    <section className="ek-hunt-editor">
      <div className="ek-hunt-editor-banner">
        <span aria-hidden="true">✦</span>
        <div>
          <h3>Build your Scavenger Hunt</h3>
          <p>Create clues for customers to explore and solve.</p>
        </div>
      </div>

      <p>
        Add 3–8 clues. Each needs an answer; hints are optional.
        Customers must answer every clue correctly to complete
        the hunt. Answers ignore letter case and extra spaces.
      </p>

      {clues.map((entry, index) => (
        <div
          key={index}
          className="ek-hunt-editor-card"
          style={{ borderTopColor: COLORS[index] }}
        >
          <div className="ek-hunt-editor-heading">
            <strong>Clue {index + 1}</strong>

            <button
              type="button"
              disabled={clues.length <= 3}
              onClick={() =>
                onChange(
                  clues.filter((_, itemIndex) => itemIndex !== index)
                )
              }
            >
              Remove clue
            </button>
          </div>

          <label>
            Customer clue
            <textarea
              rows={2}
              maxLength={300}
              value={entry.clue}
              placeholder="Which document lists the charges for your shipment?"
              onChange={(event) =>
                update(index, "clue", event.target.value)
              }
            />
          </label>

          <div className="ek-hunt-editor-fields">
            <label>
              Correct answer
              <input
                type="text"
                maxLength={100}
                value={entry.answer}
                placeholder="Invoice"
                autoComplete="off"
                onChange={(event) =>
                  update(index, "answer", event.target.value)
                }
              />
            </label>

            <label>
              Optional customer hint
              <input
                type="text"
                maxLength={160}
                value={entry.hint}
                placeholder="Look in the Invoices section"
                onChange={(event) =>
                  update(index, "hint", event.target.value)
                }
              />
            </label>
          </div>
        </div>
      ))}

      <button
        type="button"
        disabled={clues.length >= 8}
        onClick={() =>
          onChange([
            ...clues,
            { clue: "", answer: "", hint: "" },
          ])
        }
      >
        Add clue
      </button>

      <p className="ek-hunt-editor-note">
        Clues and hints are visible to customers. Correct
        answers are stored privately on the backend.
      </p>

      <style>{`
        .ek-hunt-editor {
          margin-top: 18px;
          padding: 18px;
          border: 1px solid #dbe3ef;
          border-radius: 14px;
          background: #f5f7ff;
          color: #0f172a;
        }

        .ek-hunt-editor-banner {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 18px;
          border-radius: 12px;
          background: linear-gradient(110deg, #0B3D91, #7c3aed);
          color: #ffffff;
        }

        .ek-hunt-editor-banner > span {
          color: #fde68a;
          font-size: 34px;
        }

        .ek-hunt-editor .ek-hunt-editor-banner h3 {
          margin: 0;
          color: #ffffff;
        }

        .ek-hunt-editor-banner p {
          margin: 6px 0 0;
          color: #ffffff;
        }

        .ek-hunt-editor p {
          line-height: 1.6;
        }

        .ek-hunt-editor-card {
          margin-bottom: 14px;
          padding: 14px;
          border: 1px solid #dbe3ef;
          border-top: 5px solid;
          border-radius: 10px;
          background: #ffffff;
        }

        .ek-hunt-editor-heading {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }

        .ek-hunt-editor label {
          display: grid;
          gap: 6px;
          font-size: 13px;
          font-weight: bold;
        }

        .ek-hunt-editor-fields {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 12px;
          margin-top: 12px;
        }

        .ek-hunt-editor input,
        .ek-hunt-editor textarea {
          width: 100%;
          min-width: 0;
          padding: 10px;
          box-sizing: border-box;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          background: #ffffff;
          color: #0f172a;
          font: inherit;
          font-weight: normal;
        }

        .ek-hunt-editor input {
          min-height: 44px;
        }

        .ek-hunt-editor button {
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

        .ek-hunt-editor button:disabled {
          opacity: 0.5;
          cursor: default;
        }

        .ek-hunt-editor-note {
          margin-bottom: 0;
          color: #475569;
          font-size: 13px;
        }
      `}</style>
    </section>
  );
}