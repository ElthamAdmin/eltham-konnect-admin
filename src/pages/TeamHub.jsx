import { useEffect, useMemo, useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";

function TeamHub() {
  const { user } = useAuth();

  const [channels, setChannels] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelDescription, setNewChannelDescription] = useState("");
  const [message, setMessage] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);

  const ROYAL_BLUE = "#0B3D91";
  const GOLD = "#D4AF37";
  const WHITE = "#ffffff";
  const LIGHT_BG = "#f4f7fb";
  const BORDER = "#dbe3ef";
  const MUTED = "#64748b";

  const initials = useMemo(() => {
    const name = user?.fullName || "EK";
    const parts = name.split(" ").filter(Boolean);
    return ((parts[0]?.[0] || "E") + (parts[1]?.[0] || "K")).toUpperCase();
  }, [user]);

  const fetchChannels = async () => {
    try {
      const res = await api.get("/api/team-hub/channels");
      const data = res.data.data || [];
      setChannels(data);

      if (!activeChannel && data.length > 0) {
        setActiveChannel(data[0]);
      }
    } catch (error) {
      console.error("Error loading channels:", error);
      alert("Unable to load Team Hub channels.");
    }
  };

  const fetchMessages = async (channelId) => {
    if (!channelId) return;

    try {
      setLoadingMessages(true);
      const res = await api.get(`/api/team-hub/messages/${channelId}`);
      setMessages(res.data.data || []);
    } catch (error) {
      console.error("Error loading messages:", error);
      alert("Unable to load messages.");
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchChannels();
  }, []);

  useEffect(() => {
  if (!activeChannel?._id) return;

  fetchMessages(activeChannel._id);

  const interval = setInterval(() => {
    fetchMessages(activeChannel._id);
  }, 5000);

  return () => clearInterval(interval);
}, [activeChannel]);

  const createChannel = async (e) => {
    e.preventDefault();

    if (!newChannelName.trim()) {
      alert("Please enter a channel name.");
      return;
    }

    try {
      const res = await api.post("/api/team-hub/channels", {
        name: newChannelName,
        description: newChannelDescription,
      });

      setChannels((prev) => [...prev, res.data.data]);
      setActiveChannel(res.data.data);
      setNewChannelName("");
      setNewChannelDescription("");
    } catch (error) {
      console.error("Error creating channel:", error);
      alert(error?.response?.data?.message || "Unable to create channel.");
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();

    if (!activeChannel?._id) {
      alert("Please select a channel first.");
      return;
    }

    if (!message.trim()) {
      return;
    }

    try {
      const res = await api.post("/api/team-hub/messages", {
        channelId: activeChannel._id,
        message,
      });

      setMessages((prev) => [...prev, res.data.data]);
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      alert(error?.response?.data?.message || "Unable to send message.");
    }
  };

  const formatDateTime = (dateValue) => {
    if (!dateValue) return "";
    return new Date(dateValue).toLocaleString("en-JM", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const getSenderLabel = (senderId) => {
    if (senderId === user?.userId) return `${user?.fullName || "You"} (You)`;
    return senderId;
  };

  return (
    <div
      style={{
        backgroundColor: LIGHT_BG,
        minHeight: "calc(100vh - 130px)",
        borderRadius: "16px",
        overflow: "hidden",
        border: `1px solid ${BORDER}`,
        display: "grid",
        gridTemplateColumns: "310px 1fr",
      }}
    >
      <aside
        style={{
          backgroundColor: WHITE,
          borderRight: `1px solid ${BORDER}`,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "22px",
            borderBottom: `1px solid ${BORDER}`,
            backgroundColor: ROYAL_BLUE,
            color: WHITE,
          }}
        >
          <h2 style={{ margin: 0, fontSize: "24px" }}>Team Hub</h2>
          <p style={{ margin: "8px 0 0", opacity: 0.9, fontSize: "14px" }}>
            Staff collaboration and internal chat
          </p>
        </div>

        <div style={{ padding: "18px", borderBottom: `1px solid ${BORDER}` }}>
          <form onSubmit={createChannel}>
            <label style={{ fontWeight: "bold", color: "#334155" }}>
              Create Channel
            </label>

            <input
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
              placeholder="Example: Warehouse Updates"
              style={{
                width: "100%",
                marginTop: "10px",
                padding: "11px",
                borderRadius: "10px",
                border: `1px solid ${BORDER}`,
                boxSizing: "border-box",
              }}
            />

            <input
              value={newChannelDescription}
              onChange={(e) => setNewChannelDescription(e.target.value)}
              placeholder="Short description"
              style={{
                width: "100%",
                marginTop: "10px",
                padding: "11px",
                borderRadius: "10px",
                border: `1px solid ${BORDER}`,
                boxSizing: "border-box",
              }}
            />

            <button
              type="submit"
              style={{
                width: "100%",
                marginTop: "10px",
                backgroundColor: GOLD,
                color: "#111827",
                border: "none",
                padding: "11px",
                borderRadius: "10px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              + Add Channel
            </button>
          </form>
        </div>

        <div style={{ padding: "14px", overflowY: "auto" }}>
          <div
            style={{
              fontSize: "13px",
              color: MUTED,
              fontWeight: "bold",
              marginBottom: "10px",
            }}
          >
            CHANNELS
          </div>

          {channels.length === 0 ? (
            <p style={{ color: MUTED, fontSize: "14px" }}>
              No channels yet. Create your first channel.
            </p>
          ) : (
            channels.map((channel) => {
              const active = activeChannel?._id === channel._id;

              return (
                <button
                  key={channel._id}
                  onClick={() => setActiveChannel(channel)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    border: `1px solid ${active ? ROYAL_BLUE : BORDER}`,
                    backgroundColor: active ? "#eef4ff" : WHITE,
                    color: active ? ROYAL_BLUE : "#334155",
                    padding: "13px",
                    borderRadius: "12px",
                    marginBottom: "10px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  # {channel.name}
                  {channel.description && (
                    <div
                      style={{
                        color: MUTED,
                        fontSize: "12px",
                        fontWeight: "normal",
                        marginTop: "4px",
                      }}
                    >
                      {channel.description}
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </aside>

      <main style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        <header
          style={{
            backgroundColor: WHITE,
            borderBottom: `1px solid ${BORDER}`,
            padding: "20px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div>
            <h1 style={{ margin: 0, color: "#1e293b", fontSize: "24px" }}>
              {activeChannel ? `# ${activeChannel.name}` : "Select a channel"}
            </h1>
            <p style={{ margin: "6px 0 0", color: MUTED }}>
              {activeChannel?.description || "Internal staff conversations"}
            </p>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              backgroundColor: "#f8fafc",
              padding: "10px 14px",
              borderRadius: "999px",
              border: `1px solid ${BORDER}`,
            }}
          >
            <div
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "50%",
                backgroundColor: ROYAL_BLUE,
                color: WHITE,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
              }}
            >
              {initials}
            </div>
            <span style={{ fontWeight: "bold", color: "#334155" }}>
              {user?.fullName}
            </span>
          </div>
        </header>

        <section
          style={{
            flex: 1,
            padding: "24px",
            overflowY: "auto",
            backgroundColor: "#f8fafc",
          }}
        >
          {!activeChannel ? (
            <div
              style={{
                backgroundColor: WHITE,
                border: `1px solid ${BORDER}`,
                borderRadius: "16px",
                padding: "30px",
                textAlign: "center",
                color: MUTED,
              }}
            >
              Select or create a channel to begin.
            </div>
          ) : loadingMessages ? (
            <p style={{ color: MUTED }}>Loading messages...</p>
          ) : messages.length === 0 ? (
            <div
              style={{
                backgroundColor: WHITE,
                border: `1px solid ${BORDER}`,
                borderRadius: "16px",
                padding: "30px",
                textAlign: "center",
                color: MUTED,
              }}
            >
              No messages yet. Start the conversation.
            </div>
          ) : (
            messages.map((item) => {
              const mine = item.senderId === user?.userId;

              return (
                <div
                  key={item._id}
                  style={{
                    display: "flex",
                    justifyContent: mine ? "flex-end" : "flex-start",
                    marginBottom: "14px",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "70%",
                      backgroundColor: mine ? ROYAL_BLUE : WHITE,
                      color: mine ? WHITE : "#334155",
                      border: `1px solid ${mine ? ROYAL_BLUE : BORDER}`,
                      borderRadius: "16px",
                      padding: "13px 15px",
                      boxShadow: "0 8px 18px rgba(15,23,42,0.06)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: "bold",
                        opacity: 0.85,
                        marginBottom: "6px",
                      }}
                    >
                      {getSenderLabel(item.senderId)}
                    </div>

                    <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
                      {item.message}
                    </div>

                    <div
                      style={{
                        fontSize: "11px",
                        opacity: 0.75,
                        marginTop: "8px",
                        textAlign: "right",
                      }}
                    >
                      {formatDateTime(item.createdAt)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </section>

        <form
          onSubmit={sendMessage}
          style={{
            backgroundColor: WHITE,
            borderTop: `1px solid ${BORDER}`,
            padding: "16px",
            display: "flex",
            gap: "12px",
          }}
        >
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={
              activeChannel
                ? `Message #${activeChannel.name}`
                : "Select a channel first"
            }
            disabled={!activeChannel}
            rows={2}
            style={{
              flex: 1,
              resize: "none",
              padding: "13px",
              borderRadius: "12px",
              border: `1px solid ${BORDER}`,
              fontFamily: "Arial, sans-serif",
              fontSize: "14px",
            }}
          />

          <button
            type="submit"
            disabled={!activeChannel || !message.trim()}
            style={{
              backgroundColor:
                activeChannel && message.trim() ? ROYAL_BLUE : "#cbd5e1",
              color: WHITE,
              border: "none",
              padding: "0 24px",
              borderRadius: "12px",
              fontWeight: "bold",
              cursor:
                activeChannel && message.trim() ? "pointer" : "not-allowed",
            }}
          >
            Send
          </button>
        </form>
      </main>
    </div>
  );
}

export default TeamHub;