const storageKey = (channel) => {
  if (!["POS", "Invoices"].includes(channel)) {
    throw new Error("Invalid payment channel.");
  }

  const token = localStorage.getItem("ek_token");

  if (!token) {
    throw new Error("Sign in before recording a payment.");
  }

  let claims;

  try {
    const part = token
      .split(".")[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    claims = JSON.parse(
      atob(
        part.padEnd(
          Math.ceil(part.length / 4) * 4,
          "="
        )
      )
    );
  } catch {
    throw new Error(
      "Could not identify the signed-in staff user. Sign in again before taking payment."
    );
  }

  const actorId =
    claims.userId ||
    claims.id ||
    claims._id ||
    claims.sub;

  if (!actorId || typeof actorId !== "string") {
    throw new Error(
      "The staff session has no user identifier. Payment was not submitted."
    );
  }

  return (
    `ekos.pendingPayment.v1.` +
    `${encodeURIComponent(actorId)}.${channel}`
  );
};

export const readPendingPayment = (channel) => {
  const key = storageKey(channel);
  const raw = localStorage.getItem(key);

  if (!raw) return null;

  let record;

  try {
    record = JSON.parse(raw);
  } catch {
    throw new Error(
      "The saved payment request could not be read. Check payment records before starting another payment."
    );
  }

  if (
    !record?.payload?.paymentRequestId ||
    !record.payload.invoiceNumber
  ) {
    throw new Error(
      "The saved payment request is incomplete. Check payment records before starting another payment."
    );
  }

  return record;
};

export const savePendingPayment = (channel, payload) => {
  const key = storageKey(channel);

  if (localStorage.getItem(key)) {
    throw new Error(
      "Resolve the saved payment before starting another payment in this section."
    );
  }

  const record = {
    createdAt: new Date().toISOString(),
    payload: JSON.parse(
      JSON.stringify({
        ...payload,
        paymentRequestId: crypto.randomUUID(),
      })
    ),
  };

  localStorage.setItem(key, JSON.stringify(record));

  return record;
};

export const clearPendingPayment = (
  channel,
  requestId
) => {
  const key = storageKey(channel);
  const record = readPendingPayment(channel);

  if (record?.payload.paymentRequestId === requestId) {
    localStorage.removeItem(key);
  }
};