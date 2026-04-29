import { useEffect, useState } from "react";
import api from "../api";

function RewardsHubAdmin() {
  const [posts, setPosts] = useState([]);
  const [entriesByPost, setEntriesByPost] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "Promotion",
    rewardText: "",
    externalLink: "",
    startDate: "",
    endDate: "",
    rewardPoints: "",
  });

  const API = "https://eltham-konnect-backend-c2sf.onrender.com";
  const ROYAL_BLUE = "#0B3D91";
  const GOLD = "#D4AF37";
  const WHITE = "#ffffff";
  const BORDER = "#dbe3ef";
  const MUTED = "#64748b";

  const fetchPosts = async () => {
    try {
      const res = await api.get("/api/rewards-hub");
      setPosts(res.data.data || []);
    } catch (error) {
      console.error("Error loading Rewards Hub posts:", error);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const createPost = async () => {
    try {
      if (!formData.title || !formData.description) {
        alert("Title and description are required.");
        return;
      }

      const payload = new FormData();
      payload.append("title", formData.title);
      payload.append("description", formData.description);
      payload.append("type", formData.type);
      payload.append("rewardText", formData.rewardText);
      payload.append("externalLink", formData.externalLink);
      payload.append("startDate", formData.startDate);
      payload.append("endDate", formData.endDate);
      payload.append("rewardPoints", formData.rewardPoints);

      if (selectedImage) {
        payload.append("hubImage", selectedImage);
      }

      await api.post("/api/rewards-hub", payload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setFormData({
        title: "",
        description: "",
        type: "Promotion",
        rewardText: "",
        externalLink: "",
        startDate: "",
        endDate: "",
        rewardPoints: "",
      });
      setSelectedImage(null);

      await fetchPosts();
      alert("Rewards Hub post created successfully.");
    } catch (error) {
      alert(error?.response?.data?.message || "Rewards Hub post could not be created.");
    }
  };

  const fetchEntriesForPost = async (postId) => {
  try {
    const res = await api.get(`/api/rewards-hub-entries/post/${postId}`);

    setEntriesByPost((prev) => ({
      ...prev,
      [postId]: res.data.data || [],
    }));
  } catch (error) {
    alert(error?.response?.data?.message || "Could not load entries.");
  }
};

const pickWinner = async (postId) => {
  if (!window.confirm("Pick a random winner for this post?")) return;

  try {
    const res = await api.post(`/api/rewards-hub-entries/pick-winner/${postId}`);

    alert(
      res.data?.data?.customerName
        ? `Winner selected: ${res.data.data.customerName} (${res.data.data.customerEkonId})`
        : "Winner selected successfully."
    );

    await fetchEntriesForPost(postId);
  } catch (error) {
    alert(error?.response?.data?.message || "Could not pick winner.");
  }
};

const rewardWinner = async (postId) => {
  if (!window.confirm("Reward the selected winner with EK Points?")) return;

  try {
    const res = await api.post(`/api/rewards-hub-entries/reward-winner/${postId}`);

    alert(
      res.data?.data?.customerName
        ? `${res.data.data.customerName} rewarded with ${res.data.data.pointsAdded} EK Points.`
        : "Winner rewarded successfully."
    );

    await fetchEntriesForPost(postId);
  } catch (error) {
    alert(error?.response?.data?.message || "Could not reward winner.");
  }
};

  const removePost = async (id) => {
    if (!window.confirm("Remove this Rewards Hub post?")) return;

    try {
      await api.delete(`/api/rewards-hub/${id}`);
      await fetchPosts();
    } catch (error) {
      alert(error?.response?.data?.message || "Rewards Hub post could not be removed.");
    }
  };

  const badgeStyle = (type) => ({
    backgroundColor:
      type === "Giveaway"
        ? "#16a34a"
        : type === "Gift Card"
        ? GOLD
        : type === "Amazon Link"
        ? "#f97316"
        : type === "Game"
        ? "#7c3aed"
        : type === "Customer Update"
        ? "#0f766e"
        : ROYAL_BLUE,
    color: type === "Gift Card" ? "black" : WHITE,
    padding: "5px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "bold",
    whiteSpace: "nowrap",
  });

  return (
    <div>
      <h1 style={{ marginTop: 0, color: "#0f172a" }}>EK Rewards Hub Admin</h1>
      <p style={{ color: MUTED }}>
        Post giveaways, gift cards, Amazon links, games, promotions, and customer engagement updates.
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
        <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>Create New Hub Post</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "12px",
          }}
        >
          <input
            name="title"
            placeholder="Post Title"
            value={formData.title}
            onChange={handleChange}
            style={{ padding: "10px", borderRadius: "8px", border: `1px solid ${BORDER}` }}
          />

          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            style={{ padding: "10px", borderRadius: "8px", border: `1px solid ${BORDER}` }}
          >
            <option>Giveaway</option>
            <option>Gift Card</option>
            <option>Amazon Link</option>
            <option>Game</option>
            <option>Promotion</option>
            <option>Customer Update</option>
          </select>

          <input
            name="rewardText"
            placeholder="Reward Text e.g. Win $1000 phone credit"
            value={formData.rewardText}
            onChange={handleChange}
            style={{ padding: "10px", borderRadius: "8px", border: `1px solid ${BORDER}` }}
          />

          <input
  type="number"
  name="rewardPoints"
  placeholder="EK Points Reward e.g. 100"
  value={formData.rewardPoints}
  onChange={handleChange}
  style={{ padding: "10px", borderRadius: "8px", border: `1px solid ${BORDER}` }}
/>

          <input
            name="externalLink"
            placeholder="External Link / Amazon Link / Form Link"
            value={formData.externalLink}
            onChange={handleChange}
            style={{ padding: "10px", borderRadius: "8px", border: `1px solid ${BORDER}` }}
          />

          <input
            type="date"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            style={{ padding: "10px", borderRadius: "8px", border: `1px solid ${BORDER}` }}
          />

          <input
            type="date"
            name="endDate"
            value={formData.endDate}
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
          name="description"
          placeholder="Write the details for this giveaway, promotion, game, or customer update..."
          value={formData.description}
          onChange={handleChange}
          rows="5"
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
          onClick={createPost}
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
          Publish to Rewards Hub
        </button>
      </div>

      <div style={{ display: "grid", gap: "14px" }}>
        {posts.length > 0 ? (
          posts.map((post) => (
            <div
              key={post._id}
              style={{
                backgroundColor: WHITE,
                border: `1px solid ${BORDER}`,
                borderRadius: "12px",
                padding: "16px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                <div>
                  <h2 style={{ margin: 0, color: ROYAL_BLUE }}>{post.title}</h2>
                  <p style={{ color: MUTED, margin: "6px 0" }}>
                    Posted by {post.postedByName || "System User"}
                  </p>
                </div>

                <span style={badgeStyle(post.type)}>{post.type}</span>
              </div>

              {post.imageFilePath ? (
                <img
                  src={`${API}${post.imageFilePath}`}
                  alt={post.title}
                  style={{
                    width: "100%",
                    maxWidth: "520px",
                    borderRadius: "12px",
                    border: `1px solid ${BORDER}`,
                    marginTop: "12px",
                    marginBottom: "10px",
                  }}
                />
              ) : null}

              <p style={{ lineHeight: 1.6 }}>{post.description}</p>

              {Number(post.rewardPoints || 0) > 0 ? (
  <p style={{ color: ROYAL_BLUE, fontWeight: "bold" }}>
    EK Points Reward: {Number(post.rewardPoints || 0).toLocaleString()}
  </p>
) : null}

              {post.rewardText ? (
                <p style={{ color: "#16a34a", fontWeight: "bold" }}>
                  Reward: {post.rewardText}
                </p>
              ) : null}

              {post.externalLink ? (
                <a
                  href={post.externalLink}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    color: ROYAL_BLUE,
                    fontWeight: "bold",
                    textDecoration: "none",
                  }}
                >
                  Open Link
                </a>
              ) : null}

              <div style={{ marginTop: "12px" }}>
                {post.startDate ? (
                  <span style={{ color: MUTED, marginRight: "12px" }}>
                    Start: {String(post.startDate).slice(0, 10)}
                  </span>
                ) : null}

                {post.endDate ? (
                  <span style={{ color: "#dc2626", fontWeight: "bold" }}>
                    Ends: {String(post.endDate).slice(0, 10)}
                  </span>
                ) : null}
              </div>

              {entriesByPost[post._id] ? (
  <div
    style={{
      marginTop: "14px",
      padding: "12px",
      backgroundColor: "#f8fafc",
      border: `1px solid ${BORDER}`,
      borderRadius: "10px",
    }}
  >
    <strong>Entries: {entriesByPost[post._id].length}</strong>

    {entriesByPost[post._id].length > 0 ? (
      <div style={{ marginTop: "10px", overflowX: "auto" }}>
        <table
          border="1"
          cellPadding="8"
          style={{
            width: "100%",
            borderCollapse: "collapse",
            borderColor: BORDER,
          }}
        >
          <thead style={{ backgroundColor: "#eef4ff" }}>
            <tr>
              <th>Customer</th>
              <th>EKON ID</th>
              <th>Action</th>
              <th>Winner</th>
              <th>Reward Given</th>
              <th>Entered At</th>
            </tr>
          </thead>
          <tbody>
            {entriesByPost[post._id].map((entry) => (
              <tr key={entry._id}>
                <td>{entry.customerName}</td>
                <td>{entry.customerEkonId}</td>
                <td>{entry.actionType}</td>
<td>
  {entry.isWinner || entry.hasWon ? (
    <span style={{ color: "#16a34a", fontWeight: "bold" }}>🏆 Winner</span>
  ) : (
    "-"
  )}
</td>
<td>

  <td>
  {entry.rewardGiven ? (
    <span style={{ color: "#16a34a", fontWeight: "bold" }}>YES</span>
  ) : (
    "-"
  )}
</td>

  {entry.createdAt
    ? new Date(entry.createdAt).toLocaleString()
    : "-"}
</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <p style={{ color: MUTED }}>No customer entries yet.</p>
    )}
  </div>
) : null}

              <button
  onClick={() => fetchEntriesForPost(post._id)}
  style={{
    marginTop: "12px",
    marginRight: "10px",
    backgroundColor: ROYAL_BLUE,
    color: WHITE,
    border: "none",
    padding: "8px 12px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
  }}
>
  View Entries
</button>

<button
  onClick={() => pickWinner(post._id)}
  style={{
    marginTop: "12px",
    marginRight: "10px",
    backgroundColor: GOLD,
    color: "black",
    border: "none",
    padding: "8px 12px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
  }}
>
  Pick Winner
</button>

<button
  onClick={() => rewardWinner(post._id)}
  style={{
    marginTop: "12px",
    marginRight: "10px",
    backgroundColor: "#16a34a",
    color: WHITE,
    border: "none",
    padding: "8px 12px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
  }}
>
  Reward Winner
</button>

              <button
                onClick={() => removePost(post._id)}
                style={{
                  marginTop: "12px",
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
            No active Rewards Hub posts.
          </div>
        )}
      </div>
    </div>
  );
}

export default RewardsHubAdmin;