import {
  useEffect,
  useRef,
  useState,
} from "react";

import api from "../api";

const DOCUMENT_TYPES = [
  "Registration Certificate",
  "Tax Return",
  "Filing Confirmation",
  "Payment Receipt",
  "Payment Confirmation",
  "Assessment",
  "Notice",
  "Correspondence",
  "Supporting Schedule",
  "Supplier Tax Invoice",
  "Customer Tax Invoice",
  "Other",
];

const TAX_TYPES = [
  "GCT",
  "PAYE",
  "NIS",
  "NHT",
  "Education Tax",
  "HEART",
  "Pension",
  "Income Tax",
  "Company Tax",
  "Other",
];

const LINK_TYPES = [
  ["taxNumber", "Tax obligation"],
  ["estimateNumber", "Income-tax estimate"],
  ["filingNumber", "GCT filing"],
  ["transactionNumber", "Tax payment transaction"],
];

const dateToday = () => {
  const parts = new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: "America/Jamaica",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }
  ).formatToParts(new Date());

  return ["year", "month", "day"]
    .map(
      (key) =>
        parts.find(
          (part) => part.type === key
        ).value
    )
    .join("-");
};

const newUpload = (periodKey) => ({
  taxType: "Other",
  documentType: "Supporting Schedule",
  title: "",
  documentDate: dateToday(),
  periodKey,
  externalReference: "",
  receiptNumber: "",
  description: "",
  notes: "",
});

function TaxDocumentsPanel({
  entityCode,
  periodKey,
}) {
  const [documents, setDocuments] =
    useState([]);

  const [allPeriods, setAllPeriods] =
    useState(false);

  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] =
    useState("");

  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [uploadOpen, setUploadOpen] =
    useState(false);

  const [upload, setUpload] = useState(
    () => newUpload(periodKey)
  );

  const [file, setFile] = useState(null);
  const fileInput = useRef(null);

  const [action, setAction] = useState(null);
  const [actionNotes, setActionNotes] =
    useState("");

  const [linkType, setLinkType] =
    useState("taxNumber");

  const [targetReference, setTargetReference] =
    useState("");

  const [relatedTaxNumber, setRelatedTaxNumber] =
    useState("");

  useEffect(() => {
    let active = true;

    setDocuments([]);
    setError("");

    if (!entityCode) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const params = {
      entityCode,
      ...(allPeriods ? {} : { periodKey }),
      ...(appliedSearch
        ? { search: appliedSearch }
        : {}),
    };

    api
      .get(
        "/api/tax-center/documents",
        { params }
      )
      .then((response) => {
        if (active) {
          setDocuments(
            response.data.data || []
          );
        }
      })
      .catch((requestError) => {
        if (active) {
          setError(
            requestError.response?.data?.message ||
              "Could not load documents."
          );
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [
    entityCode,
    periodKey,
    allPeriods,
    appliedSearch,
    revision,
  ]);

  const documentEndpoint = (document, suffix) =>
    `/api/tax-center/documents/${encodeURIComponent(
      document.documentNumber
    )}${suffix}`;

  const perform = async (work) => {
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const response = await work();

      setMessage(
        response.data.message ||
          "Document action completed."
      );

      setAction(null);
      setRevision((value) => value + 1);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Could not complete the document action."
      );
    } finally {
      setBusy(false);
    }
  };

  const uploadDocument = async (event) => {
    event.preventDefault();

    if (!file) {
      setError(
        "Select one document to upload."
      );
      return;
    }

    if (
      file.size === 0 ||
      file.size > 10 * 1024 * 1024
    ) {
      setError(
        "Choose a nonempty file no larger than 10 MB."
      );
      return;
    }

    await perform(async () => {
      const data = new FormData();

      data.append("document", file);
      data.append("entityCode", entityCode);
      data.append("confidential", "true");

      for (const [key, value] of
        Object.entries(upload)) {
        data.append(key, value);
      }

      const response = await api.post(
        "/api/tax-center/documents/upload",
        data
      );

      setUpload(newUpload(periodKey));
      setFile(null);
      setUploadOpen(false);

      if (fileInput.current) {
        fileInput.current.value = "";
      }

      return response;
    });
  };

  const openDocument = async (document) => {
    const tab = window.open(
      "about:blank",
      "_blank"
    );

    if (tab) {
      tab.opener = null;
    }

    setBusy(true);
    setError("");

    try {
      const response = await api.get(
        documentEndpoint(
          document,
          "/access"
        )
      );

      const accessUrl =
        response.data.data?.accessUrl;

      if (
        !accessUrl ||
        new URL(accessUrl).protocol !==
          "https:"
      ) {
        throw new Error(
          "A secure access link was not returned."
        );
      }

      if (!tab || tab.closed) {
        setError(
          "Your browser blocked the document tab. Allow pop-ups for this site and try Open again."
        );
        return;
      }

      tab.location.replace(accessUrl);
    } catch (requestError) {
      tab?.close();

      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Could not open the document."
      );
    } finally {
      setBusy(false);
    }
  };

  const startAction = (
    document,
    kind,
    verificationAction = ""
  ) => {
    setAction({
      document,
      kind,
      verificationAction,
    });

    setActionNotes("");
    setLinkType("taxNumber");
    setTargetReference("");
    setRelatedTaxNumber(
      document.taxNumber || ""
    );

    setError("");
    setMessage("");
  };

  const saveAction = async (event) => {
    event.preventDefault();

    await perform(() => {
      if (action.kind === "verification") {
        return api.post(
          documentEndpoint(
            action.document,
            "/verification"
          ),
          {
            action:
              action.verificationAction,

            notes:
              actionNotes.trim(),
          }
        );
      }

      const payload = {
        [linkType]:
          targetReference.trim(),

        notes:
          actionNotes.trim(),
      };

      if (
        linkType === "transactionNumber"
      ) {
        payload.taxNumber =
          relatedTaxNumber.trim();
      }

      return api.post(
        documentEndpoint(
          action.document,
          "/link"
        ),
        payload
      );
    });
  };

  const changeUpload = (field, value) =>
    setUpload((previous) => ({
      ...previous,
      [field]: value,
    }));

  return (
    <section style={panel}>
      <h2 style={{ marginTop: 0 }}>
        Preserved tax documents
      </h2>

      <p>
        Business: <strong>{entityCode}</strong>.
        Uploads use authenticated Cloudinary
        storage. Open generates a temporary
        access link.
      </p>

      <div style={row}>
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            setUploadOpen(
              (previous) => !previous
            )
          }
        >
          {uploadOpen
            ? "Close upload form"
            : "+ Upload document"}
        </button>

        <button
          type="button"
          disabled={busy || loading}
          onClick={() =>
            setRevision(
              (value) => value + 1
            )
          }
        >
          Refresh documents
        </button>

        <label
          style={{
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <input
            type="checkbox"
            style={{ width: "auto" }}
            checked={allPeriods}
            disabled={busy}
            onChange={(event) =>
              setAllPeriods(
                event.target.checked
              )
            }
          />
          Show all periods for this business
        </label>
      </div>

      <form
        style={row}
        onSubmit={(event) => {
          event.preventDefault();
          setAppliedSearch(search.trim());
        }}
      >
        <label style={{ flex: 1 }}>
          Search reference or title
          <input
            value={search}
            maxLength={120}
            disabled={busy}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </label>

        <button
          type="submit"
          disabled={busy}
        >
          Search
        </button>
      </form>

      {error && (
        <p role="alert" style={errorStyle}>
          {error}
        </p>
      )}

      {message && (
        <p role="status" style={successStyle}>
          {message}
        </p>
      )}

      {uploadOpen && (
        <form
          onSubmit={uploadDocument}
          style={subPanel}
        >
          <h3>Upload supporting document</h3>

          <fieldset disabled={busy}>
            <div style={grid}>
              <label>
                Tax type
                <select
                  value={upload.taxType}
                  onChange={(event) =>
                    changeUpload(
                      "taxType",
                      event.target.value
                    )
                  }
                >
                  {TAX_TYPES.map((type) => (
                    <option key={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Document type
                <select
                  value={
                    upload.documentType
                  }
                  onChange={(event) =>
                    changeUpload(
                      "documentType",
                      event.target.value
                    )
                  }
                >
                  {DOCUMENT_TYPES.map(
                    (type) => (
                      <option key={type}>
                        {type}
                      </option>
                    )
                  )}
                </select>
              </label>

              <label>
                Title
                <input
                  required
                  value={upload.title}
                  onChange={(event) =>
                    changeUpload(
                      "title",
                      event.target.value
                    )
                  }
                />
              </label>

              <label>
                Document date
                <input
                  type="date"
                  required
                  value={
                    upload.documentDate
                  }
                  onChange={(event) =>
                    changeUpload(
                      "documentDate",
                      event.target.value
                    )
                  }
                />
              </label>

              <label>
                Reporting period
                <input
                  placeholder="YYYY-MM or YYYY"
                  value={upload.periodKey}
                  onChange={(event) =>
                    changeUpload(
                      "periodKey",
                      event.target.value
                    )
                  }
                />
              </label>

              <label>
                External reference / supplier invoice
                <input
                  value={
                    upload.externalReference
                  }
                  onChange={(event) =>
                    changeUpload(
                      "externalReference",
                      event.target.value
                    )
                  }
                />
              </label>

              <label>
                Receipt number
                <input
                  value={
                    upload.receiptNumber
                  }
                  onChange={(event) =>
                    changeUpload(
                      "receiptNumber",
                      event.target.value
                    )
                  }
                />
              </label>

              <label>
                File — maximum 10 MB
                <input
                  ref={fileInput}
                  type="file"
                  required
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.xlsx,.xls,.csv"
                  onChange={(event) =>
                    setFile(
                      event.target.files?.[0] ||
                        null
                    )
                  }
                />
              </label>
            </div>

            <label>
              Description
              <textarea
                value={upload.description}
                onChange={(event) =>
                  changeUpload(
                    "description",
                    event.target.value
                  )
                }
              />
            </label>

            <label style={{ marginTop: 10 }}>
              Notes
              <textarea
                value={upload.notes}
                onChange={(event) =>
                  changeUpload(
                    "notes",
                    event.target.value
                  )
                }
              />
            </label>

            <p>
              Leave the reporting period blank
              for general registration evidence.
              Supplier tax invoices must use the
              supplier invoice number as their
              External reference.
            </p>

            <button type="submit">
              {busy
                ? "Uploading…"
                : "Upload to Cloudinary"}
            </button>
          </fieldset>
        </form>
      )}

      {loading ? (
        <p role="status">
          Loading documents…
        </p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Document</th>
                <th>Type / period</th>
                <th>Verification</th>
                <th>Linked references</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {documents.map((document) => (
                <tr
                  key={
                    document.documentNumber
                  }
                >
                  <td>
                    <strong>
                      {document.title}
                    </strong>
                    <br />
                    {document.documentNumber}
                    <br />
                    {document.fileName}
                  </td>

                  <td>
                    {document.taxType}
                    <br />
                    {document.documentType}
                    <br />
                    {document.periodKey ||
                      "General evidence"}
                  </td>

                  <td>
                    {document.verificationStatus}
                    <br />
                    {document.verifiedBy || ""}
                  </td>

                  <td>
                    {[
                      document.taxNumber,
                      document.estimateNumber,
                      document.filingNumber,
                      document.transactionNumber,
                    ]
                      .filter(Boolean)
                      .map((reference) => (
                        <div key={reference}>
                          {reference}
                        </div>
                      ))}
                  </td>

                  <td>
                    <div style={row}>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          openDocument(
                            document
                          )
                        }
                      >
                        Open
                      </button>

                      {![
                        "Rejected",
                        "Superseded",
                      ].includes(
                        document.verificationStatus
                      ) && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            startAction(
                              document,
                              "link"
                            )
                          }
                        >
                          Link
                        </button>
                      )}

                      {document.verificationStatus !==
                        "Superseded" && (
                        <>
                          <button
                            type="button"
                            disabled={
                              busy ||
                              document.verificationStatus ===
                                "Verified"
                            }
                            onClick={() =>
                              startAction(
                                document,
                                "verification",
                                "Verify"
                              )
                            }
                          >
                            Verify
                          </button>

                          <button
                            type="button"
                            disabled={
                              busy ||
                              document.verificationStatus ===
                                "Rejected"
                            }
                            onClick={() =>
                              startAction(
                                document,
                                "verification",
                                "Reject"
                              )
                            }
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {!documents.length && !error && (
                <tr>
                  <td colSpan={5}>
                    No documents match this selection.
                    Choose “Show all periods” to
                    include general registration
                    evidence.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {action && (
        <form
          onSubmit={saveAction}
          style={subPanel}
        >
          <h3>
            {action.kind === "link"
              ? "Link document"
              : `${action.verificationAction} document`}
          </h3>

          <p>
            {action.document.documentNumber}
            {" — "}
            {action.document.title}
          </p>

          <fieldset disabled={busy}>
            {action.kind === "link" && (
              <div style={grid}>
                <label>
                  Link to
                  <select
                    value={linkType}
                    onChange={(event) => {
                      setLinkType(
                        event.target.value
                      );
                      setTargetReference("");
                    }}
                  >
                    {LINK_TYPES.map(
                      ([value, label]) => (
                        <option
                          key={value}
                          value={value}
                        >
                          {label}
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label>
                  Exact target reference
                  <input
                    required
                    value={targetReference}
                    onChange={(event) =>
                      setTargetReference(
                        event.target.value
                      )
                    }
                  />
                </label>

                {linkType ===
                  "transactionNumber" && (
                  <label>
                    Related tax obligation number
                    <input
                      required
                      value={
                        relatedTaxNumber
                      }
                      onChange={(event) =>
                        setRelatedTaxNumber(
                          event.target.value
                        )
                      }
                    />
                  </label>
                )}
              </div>
            )}

            <label>
              {action.kind === "link"
                ? "Linkage notes"
                : "Verification notes / rejection reason"}
              <textarea
                required={
                  action.verificationAction ===
                  "Reject"
                }
                value={actionNotes}
                onChange={(event) =>
                  setActionNotes(
                    event.target.value
                  )
                }
              />
            </label>

            <p>
              {action.kind === "link"
                ? "The server checks business, period, tax type, and payment evidence. Existing links cannot be replaced here."
                : "Open and review the preserved document before verifying it. Verification does not replace or delete the file."}
            </p>

            <div style={row}>
              <button type="submit">
                {busy
                  ? "Saving…"
                  : action.kind === "link"
                    ? "Save link"
                    : `Confirm ${action.verificationAction}`}
              </button>

              <button
                type="button"
                onClick={() =>
                  setAction(null)
                }
              >
                Cancel
              </button>
            </div>
          </fieldset>
        </form>
      )}
    </section>
  );
}

const panel = {
  background: "white",
  border: "1px solid #dbe3ef",
  borderRadius: 12,
  padding: 18,
  marginBottom: 16,
};

const subPanel = {
  margin: "18px 0",
  padding: 16,
  border: "1px solid #dbe3ef",
  borderRadius: 10,
  background: "#f8fafc",
};

const grid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 12,
  marginBottom: 14,
};

const row = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  alignItems: "end",
  margin: "12px 0",
};

const errorStyle = {
  padding: 12,
  background: "#fef2f2",
  color: "#991b1b",
  borderRadius: 8,
};

const successStyle = {
  padding: 12,
  background: "#f0fdf4",
  color: "#166534",
  borderRadius: 8,
};

export default TaxDocumentsPanel;