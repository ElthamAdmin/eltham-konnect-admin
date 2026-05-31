import { useCallback, useEffect, useMemo, useState } from "react";
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
  const [attachments, setAttachments] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [replyDrafts, setReplyDrafts] = useState({});
  const [replyFiles, setReplyFiles] = useState({});
  const [openReplyBox, setOpenReplyBox] = useState(null);
  const [expandedThreads, setExpandedThreads] = useState({});
  const [activeTab, setActiveTab] = useState("posts");
const [channelDocuments, setChannelDocuments] = useState([]);
const [channelMembers, setChannelMembers] = useState([]);
const [allUsers, setAllUsers] = useState([]);
const [selectedMember, setSelectedMember] = useState("");
const [documentTitle, setDocumentTitle] = useState("");
const [documentFolder, setDocumentFolder] = useState("General");
const [documentFile, setDocumentFile] = useState(null);
const [announcementTitle, setAnnouncementTitle] = useState("");
const [announcementMessage, setAnnouncementMessage] = useState("");
const [announcementPriority, setAnnouncementPriority] = useState("Important");
const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
const [notifications, setNotifications] = useState([]);
const [unreadNotifications, setUnreadNotifications] = useState(0);
const [showNotifications, setShowNotifications] = useState(false);
const [directConversations, setDirectConversations] = useState([]);
const [activeDirectConversation, setActiveDirectConversation] = useState(null);
const [directMessages, setDirectMessages] = useState([]);
const [directMessageText, setDirectMessageText] = useState("");
const [directMessageFiles, setDirectMessageFiles] = useState([]);
const [selectedDirectUser, setSelectedDirectUser] = useState("");
const [channelTasks, setChannelTasks] = useState([]);
const [taskTitle, setTaskTitle] = useState("");
const [taskDescription, setTaskDescription] = useState("");
const [taskAssignedTo, setTaskAssignedTo] = useState("");
const [taskPriority, setTaskPriority] = useState("Medium");
const [taskDueDate, setTaskDueDate] = useState("");

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

  const getSenderProfile = useCallback(
  (item) => {
    if (item?.senderProfile) return item.senderProfile;

    if (item?.senderId === user?.userId) {
      return {
        fullName: user?.fullName || "You",
        role: user?.role || "",
        branch: user?.branch || "",
        dutyStatus: user?.dutyStatus || "",
        jobTitle: user?.employeeSnapshot?.jobTitle || "",
        department: user?.employeeSnapshot?.department || "",
      };
    }

    return {
      fullName: item?.senderId || "Unknown User",
      role: "",
      branch: "",
      dutyStatus: "",
      jobTitle: "",
      department: "",
    };
  },
  [user]
);

const getProfileInitials = (profile) => {
  const name = profile?.fullName || "EK";
  const parts = name.split(" ").filter(Boolean);
  return ((parts[0]?.[0] || "E") + (parts[1]?.[0] || "K")).toUpperCase();
};

const getRoleLine = (profile) => {
  const parts = [];

  if (profile?.role) parts.push(profile.role);
  if (profile?.branch) parts.push(profile.branch);

  return parts.length ? parts.join(" • ") : "Team Member";
};

const getPresenceColor = (status = "") => {
  switch (status) {
    case "Clocked In":
      return "#16a34a";

    case "At Lunch":
      return "#f59e0b";

    case "Vacation Leave":
    case "Sick Leave":
    case "Out of Office":
      return "#8b5cf6";

    case "Absent":
      return "#dc2626";

    case "Off Duty":
    default:
      return "#94a3b8";
  }
};

  const formatDateTime = (dateValue) => {
    if (!dateValue) return "";
    return new Date(dateValue).toLocaleString("en-JM", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const fetchChannels = useCallback(async () => {
    try {
      const res = await api.get("/api/team-hub/channels");
      const data = res.data.data || [];

      setChannels(data);

      setActiveChannel((prev) => {
        if (prev?._id) {
          return data.find((channel) => channel._id === prev._id) || prev;
        }

        return data[0] || null;
      });
    } catch (error) {
      console.error("Error loading channels:", error);
      alert("Unable to load Team Hub channels.");
    }
  }, []);

  const fetchMessages = useCallback(async (channelId, options = {}) => {
    if (!channelId) return;

    const showLoader = options.showLoader !== false;

    try {
      if (showLoader) setLoadingMessages(true);

      const res = await api.get(`/api/team-hub/messages/${channelId}`);
      setMessages(res.data.data || []);
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      if (showLoader) setLoadingMessages(false);
    }
  }, []);

  const fetchChannelDocuments = useCallback(async (channelId) => {
  if (!channelId) return;

  try {
    const res = await api.get(`/api/team-hub/documents/${channelId}`);
    setChannelDocuments(res.data.data || []);
  } catch (error) {
    console.error("Error loading channel documents:", error);
  }
}, []);

const fetchChannelMembers = useCallback(async (channelId) => {
  if (!channelId) return;

  try {
    const res = await api.get(`/api/team-hub/channels/${channelId}/members`);
    setChannelMembers(res.data.data || []);
  } catch (error) {
    console.error("Error loading channel members:", error);
  }
}, []);

const fetchChannelTasks = useCallback(async (channelId) => {
  if (!channelId) return;

  try {
    const res = await api.get(`/api/team-hub/tasks/${channelId}`);
    setChannelTasks(res.data.data || []);
  } catch (error) {
    console.error("Error loading channel tasks:", error);
  }
}, []);

const fetchSystemUsers = useCallback(async () => {
  try {
    const res = await api.get("/api/system-users");
    setAllUsers(res.data.data || []);
  } catch (error) {
    console.error("Error loading system users:", error);
  }
}, []);

const fetchNotifications = useCallback(async () => {
  try {
    const res = await api.get("/api/team-hub/notifications/me");
    setNotifications(res.data.data || []);
    setUnreadNotifications(res.data.unreadCount || 0);
  } catch (error) {
    console.error("Error loading Team Hub notifications:", error);
  }
}, []);

const fetchDirectConversations = useCallback(async () => {
  try {
    const res = await api.get("/api/team-hub/direct/conversations");
    setDirectConversations(res.data.data || []);
  } catch (error) {
    console.error("Error loading direct conversations:", error);
  }
}, []);

const fetchDirectMessages = useCallback(async (conversationId) => {
  if (!conversationId) return;

  try {
    const res = await api.get(
      `/api/team-hub/direct/conversations/${conversationId}/messages`
    );

    setDirectMessages(res.data.data || []);
    await fetchDirectConversations();
    await fetchNotifications();
  } catch (error) {
    console.error("Error loading direct messages:", error);
  }
}, [fetchDirectConversations, fetchNotifications]);

  useEffect(() => {
  fetchChannels();
  fetchSystemUsers();
  fetchNotifications();
  fetchDirectConversations();
}, [fetchChannels, fetchSystemUsers, fetchNotifications, fetchDirectConversations]);

  useEffect(() => {
    if (!activeChannel?._id) return;

    fetchMessages(activeChannel._id, { showLoader: true });

    fetchChannelDocuments(activeChannel._id);
fetchChannelMembers(activeChannel._id);
fetchChannelTasks(activeChannel._id);

    const interval = setInterval(() => {
      fetchMessages(activeChannel._id, { showLoader: false });
    }, 15000);

    return () => clearInterval(interval);
  }, [activeChannel?._id, fetchMessages, fetchChannelDocuments, fetchChannelMembers, fetchChannelTasks]);

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

    if (!message.trim() && attachments.length === 0) {
      return;
    }

    try {
      const formData = new FormData();
      formData.append("channelId", activeChannel._id);
      formData.append("message", message);

      attachments.forEach((file) => {
        formData.append("attachments", file);
      });

      const res = await api.post("/api/team-hub/messages", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMessages((prev) => [...prev, res.data.data]);
      setMessage("");
      setAttachments([]);
    } catch (error) {
      console.error("Error sending message:", error);
      alert(error?.response?.data?.message || "Unable to send message.");
    }
  };

  const sendReply = async (parentMessageId) => {
    if (!activeChannel?._id) return;

    const replyText = replyDrafts[parentMessageId] || "";
    const files = replyFiles[parentMessageId] || [];

    if (!replyText.trim() && files.length === 0) return;

    try {
      const formData = new FormData();
      formData.append("channelId", activeChannel._id);
      formData.append("parentMessageId", parentMessageId);
      formData.append("message", replyText);

      files.forEach((file) => {
        formData.append("attachments", file);
      });

      const res = await api.post("/api/team-hub/messages/reply", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMessages((prev) =>
        prev.map((item) =>
          item._id === parentMessageId
            ? { ...item, replies: [...(item.replies || []), res.data.data] }
            : item
        )
      );

      setReplyDrafts((prev) => ({ ...prev, [parentMessageId]: "" }));
      setReplyFiles((prev) => ({ ...prev, [parentMessageId]: [] }));
      setOpenReplyBox(null);
setExpandedThreads((prev) => ({ ...prev, [parentMessageId]: true }));
    } catch (error) {
      console.error("Error sending reply:", error);
      alert(error?.response?.data?.message || "Unable to send reply.");
    }
  };

  const addMemberToChannel = async () => {
  if (!activeChannel?._id || !selectedMember) return;

  try {
    await api.post(
      `/api/team-hub/channels/${activeChannel._id}/members`,
      {
        userId: selectedMember,
      }
    );

    await fetchChannelMembers(activeChannel._id);
    setSelectedMember("");
  } catch (error) {
    console.error(error);
    alert(
      error?.response?.data?.message ||
      "Unable to add member."
    );
  }
};

const removeMemberFromChannel = async (userId) => {
  if (!window.confirm("Remove member from this channel?")) {
    return;
  }

  try {
    await api.delete(
      `/api/team-hub/channels/${activeChannel._id}/members/${userId}`
    );

    await fetchChannelMembers(activeChannel._id);
  } catch (error) {
    console.error(error);
    alert(
      error?.response?.data?.message ||
      "Unable to remove member."
    );
  }
};

  const uploadChannelDocument = async (e) => {
  e.preventDefault();

  if (!activeChannel?._id) {
    alert("Please select a channel first.");
    return;
  }

  if (!documentFile) {
    alert("Please choose a file to upload.");
    return;
  }

  try {
    const formData = new FormData();
    formData.append("channelId", activeChannel._id);
    formData.append("title", documentTitle || documentFile.name);
    formData.append("folder", documentFolder || "General");
    formData.append("file", documentFile);

    const res = await api.post("/api/team-hub/documents", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    setChannelDocuments((prev) => [res.data.data, ...prev]);
    setDocumentTitle("");
    setDocumentFolder("General");
    setDocumentFile(null);
  } catch (error) {
    console.error("Error uploading channel document:", error);
    alert(error?.response?.data?.message || "Unable to upload document.");
  }
};

const sendAnnouncement = async (e) => {
  e.preventDefault();

  if (!activeChannel?._id) return;

  if (!announcementTitle.trim() || !announcementMessage.trim()) {
    alert("Announcement title and message are required.");
    return;
  }

  try {
    const formData = new FormData();
    formData.append("channelId", activeChannel._id);
    formData.append("announcementTitle", announcementTitle);
    formData.append("message", announcementMessage);
    formData.append("priority", announcementPriority);

    const res = await api.post("/api/team-hub/announcements", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    const newAnnouncement = res.data.data;

setMessages((prev) => [newAnnouncement, ...prev]);

setAnnouncementTitle("");
setAnnouncementMessage("");
setAnnouncementPriority("Important");
setShowAnnouncementForm(false);

setTimeout(() => {
  fetchMessages(activeChannel._id, { showLoader: false });
}, 500);

  } catch (error) {
    console.error("Error sending announcement:", error);
    alert(error?.response?.data?.message || "Unable to send announcement.");
  }
};

const createChannelTask = async (e) => {
  e.preventDefault();

  if (!activeChannel?._id) return;

  if (!taskTitle.trim()) {
    alert("Task title is required.");
    return;
  }

  try {
    await api.post("/api/team-hub/tasks", {
      channelId: activeChannel._id,
      title: taskTitle,
      description: taskDescription,
      assignedToUserId: taskAssignedTo,
      priority: taskPriority,
      dueDate: taskDueDate,
    });

    setTaskTitle("");
    setTaskDescription("");
    setTaskAssignedTo("");
    setTaskPriority("Medium");
    setTaskDueDate("");

    await fetchChannelTasks(activeChannel._id);
  } catch (error) {
    console.error("Error creating task:", error);
    alert(error?.response?.data?.message || "Unable to create task.");
  }
};

const updateChannelTask = async (taskId, updates) => {
  try {
    await api.put(`/api/team-hub/tasks/${taskId}`, updates);
    await fetchChannelTasks(activeChannel._id);
  } catch (error) {
    console.error("Error updating task:", error);
    alert(error?.response?.data?.message || "Unable to update task.");
  }
};

const deleteChannelTask = async (taskId) => {
  if (!window.confirm("Delete this task?")) return;

  try {
    await api.delete(`/api/team-hub/tasks/${taskId}`);
    await fetchChannelTasks(activeChannel._id);
  } catch (error) {
    console.error("Error deleting task:", error);
    alert(error?.response?.data?.message || "Unable to delete task.");
  }
};

const markNotificationRead = async (notificationId) => {
  try {
    await api.put(`/api/team-hub/notifications/${notificationId}/read`);
    await fetchNotifications();
  } catch (error) {
    console.error("Error marking notification read:", error);
  }
};

const markAllNotificationsRead = async () => {
  try {
    await api.put("/api/team-hub/notifications/read-all");
    await fetchNotifications();
  } catch (error) {
    console.error("Error marking all notifications read:", error);
  }
};

const startDirectConversation = async () => {
  if (!selectedDirectUser) return;

  try {
    const res = await api.post("/api/team-hub/direct/conversation", {
      targetUserId: selectedDirectUser,
    });

    setActiveDirectConversation(res.data.data);
    setSelectedDirectUser("");
    await fetchDirectConversations();
    await fetchDirectMessages(res.data.data._id);
    setActiveTab("direct");
  } catch (error) {
    console.error("Error starting direct conversation:", error);
    alert(error?.response?.data?.message || "Unable to start direct chat.");
  }
};

const openDirectConversation = async (conversation) => {
  setActiveDirectConversation(conversation);
  setActiveTab("direct");
  await fetchDirectMessages(conversation._id);
};

const sendDirectMessage = async (e) => {
  e.preventDefault();

  if (!activeDirectConversation?._id) {
    alert("Please select a direct conversation first.");
    return;
  }

  const receiverId =
    activeDirectConversation.otherUserId ||
    (activeDirectConversation.participants || []).find(
      (participantId) => participantId !== user?.userId
    );

  if (!receiverId) {
    alert("Unable to identify message receiver.");
    return;
  }

  if (!directMessageText.trim() && directMessageFiles.length === 0) return;

  try {
    const formData = new FormData();
    formData.append("conversationId", activeDirectConversation._id);
    formData.append("receiverId", receiverId);
    formData.append("message", directMessageText);

    directMessageFiles.forEach((file) => {
      formData.append("attachments", file);
    });

    const res = await api.post("/api/team-hub/direct/messages", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    setDirectMessages((prev) => [...prev, res.data.data]);
    setDirectMessageText("");
    setDirectMessageFiles([]);
    await fetchDirectConversations();
    await fetchNotifications();
  } catch (error) {
    console.error("Error sending direct message:", error);
    alert(error?.response?.data?.message || "Unable to send direct message.");
  }
};

const togglePinMessage = async (item) => {
  try {
    const endpoint = item.isPinned
      ? `/api/team-hub/messages/${item._id}/unpin`
      : `/api/team-hub/messages/${item._id}/pin`;

    const res = await api.put(endpoint);

    setMessages((prev) =>
      prev.map((msg) =>
        msg._id === item._id
          ? { ...msg, isPinned: res.data.data?.isPinned }
          : msg
      )
    );
  } catch (error) {
    console.error("Error updating pinned message:", error);
    alert(error?.response?.data?.message || "Unable to update pinned post.");
  }
};

const toggleReaction = async (messageId, emoji) => {
  try {
    const res = await api.put(
      `/api/team-hub/messages/${messageId}/reactions`,
      { emoji }
    );

    setMessages((prev) =>
      prev.map((msg) =>
        msg._id === messageId
          ? {
              ...msg,
              reactions: res.data.data?.reactions || [],
            }
          : msg
      )
    );
  } catch (error) {
    console.error("Error updating reaction:", error);
    alert(
      error?.response?.data?.message ||
      "Unable to update reaction."
    );
  }
};

  const renderAttachments = (item, mine) => {
    if (!item.attachments?.length) return null;

    return (
      <div style={{ marginTop: "10px", display: "grid", gap: "8px" }}>
        {item.attachments.map((file, index) => (
          <a
            key={`${file.fileUrl}-${index}`}
            href={`${api.defaults.baseURL}${file.fileUrl}`}
            target="_blank"
            rel="noreferrer"
            style={{
              color: mine ? "#fff7cc" : ROYAL_BLUE,
              fontWeight: "bold",
              textDecoration: "underline",
              wordBreak: "break-word",
            }}
          >
            📎 {file.originalName || file.fileName}
          </a>
        ))}
      </div>
    );
  };

  return (
    <div
      className="team-hub-shell"
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
      <style>
        {`
          @media (max-width: 768px) {
            .team-hub-shell {
              grid-template-columns: 1fr !important;
            }

            .team-hub-sidebar {
              max-height: 420px;
              border-right: none !important;
              border-bottom: 1px solid ${BORDER};
            }

            .team-hub-header {
              align-items: flex-start !important;
              flex-direction: column;
            }

            .team-hub-message-card {
              max-width: 100% !important;
            }

            .team-hub-compose {
              flex-direction: column;
            }

            .team-hub-file-input {
              max-width: 100% !important;
            }
          }
        `}
      </style>

      <aside
        className="team-hub-sidebar"
        style={{
          backgroundColor: WHITE,
          borderRight: `1px solid ${BORDER}`,
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
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
            Channels, files, replies, and staff collaboration
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
          className="team-hub-header"
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
            <div style={{ position: "relative" }}>
  <button
    type="button"
    onClick={() => setShowNotifications((prev) => !prev)}
    style={{
      border: `1px solid ${BORDER}`,
      backgroundColor: WHITE,
      color: ROYAL_BLUE,
      borderRadius: "999px",
      padding: "8px 11px",
      fontWeight: "bold",
      cursor: "pointer",
    }}
  >
    🔔 {unreadNotifications > 0 ? unreadNotifications : ""}
  </button>

  {showNotifications && (
    <div
      style={{
        position: "absolute",
        right: 0,
        top: "44px",
        width: "340px",
        maxHeight: "420px",
        overflowY: "auto",
        backgroundColor: WHITE,
        border: `1px solid ${BORDER}`,
        borderRadius: "14px",
        boxShadow: "0 12px 30px rgba(15,23,42,0.18)",
        zIndex: 20,
        padding: "12px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "10px",
          alignItems: "center",
          marginBottom: "10px",
        }}
      >
        <strong>Notifications</strong>

        <button
          type="button"
          onClick={markAllNotificationsRead}
          style={{
            border: "none",
            backgroundColor: "#eef4ff",
            color: ROYAL_BLUE,
            borderRadius: "8px",
            padding: "6px 8px",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: "bold",
          }}
        >
          Mark all read
        </button>
      </div>

      {notifications.length === 0 ? (
        <p style={{ color: MUTED, fontSize: "13px" }}>
          No notifications yet.
        </p>
      ) : (
        notifications.map((note) => (
          <button
            key={note._id}
            type="button"
            onClick={() => markNotificationRead(note._id)}
            style={{
              width: "100%",
              textAlign: "left",
              border: `1px solid ${note.isRead ? BORDER : GOLD}`,
              backgroundColor: note.isRead ? "#f8fafc" : "#fff7ed",
              borderRadius: "10px",
              padding: "10px",
              marginBottom: "8px",
              cursor: "pointer",
            }}
          >
            <div style={{ fontWeight: "bold", color: "#1e293b" }}>
              {note.type === "Mention" ? "💬 " : note.type === "Announcement" ? "📢 " : "👥 "}
              {note.title}
            </div>
            <div style={{ fontSize: "12px", color: MUTED, marginTop: "4px" }}>
              {note.body}
            </div>
            <div style={{ fontSize: "11px", color: MUTED, marginTop: "6px" }}>
              {formatDateTime(note.createdAt)}
            </div>
          </button>
        ))
      )}
    </div>
  )}
</div>
          </div>
        </header>

        {activeChannel && (
  <div
    style={{
      backgroundColor: WHITE,
      borderBottom: `1px solid ${BORDER}`,
      padding: "0 24px",
      display: "flex",
      gap: "8px",
    }}
  >
    {["posts", "files", "members", "direct", "tasks"].map((tab) => (
      <button
        key={tab}
        type="button"
        onClick={() => setActiveTab(tab)}
        style={{
          border: "none",
          borderBottom:
            activeTab === tab ? `3px solid ${ROYAL_BLUE}` : "3px solid transparent",
          backgroundColor: "transparent",
          padding: "14px 12px",
          fontWeight: "bold",
          color: activeTab === tab ? ROYAL_BLUE : MUTED,
          cursor: "pointer",
          textTransform: "capitalize",
        }}
      >
        {tab}
      </button>
    ))}
  </div>
)}

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
          ) : activeTab === "files" ? (
  <div
    style={{
      backgroundColor: WHITE,
      border: `1px solid ${BORDER}`,
      borderRadius: "16px",
      padding: "18px",
    }}
  >
    <h3 style={{ marginTop: 0, color: "#1e293b" }}>Channel Files</h3>

    <form
      onSubmit={uploadChannelDocument}
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 180px 1fr auto",
        gap: "10px",
        marginBottom: "18px",
      }}
    >
      <input
        value={documentTitle}
        onChange={(e) => setDocumentTitle(e.target.value)}
        placeholder="Document title"
        style={{
          padding: "11px",
          borderRadius: "10px",
          border: `1px solid ${BORDER}`,
        }}
      />

      <input
        value={documentFolder}
        onChange={(e) => setDocumentFolder(e.target.value)}
        placeholder="Folder"
        style={{
          padding: "11px",
          borderRadius: "10px",
          border: `1px solid ${BORDER}`,
        }}
      />

      <input
        type="file"
        onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
      />

      <button
        type="submit"
        style={{
          backgroundColor: ROYAL_BLUE,
          color: WHITE,
          border: "none",
          padding: "0 16px",
          borderRadius: "10px",
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        Upload
      </button>
    </form>

    {channelDocuments.length === 0 ? (
      <p style={{ color: MUTED }}>No files uploaded to this channel yet.</p>
    ) : (
      <div style={{ display: "grid", gap: "10px" }}>
        {channelDocuments.map((doc) => (
          <a
            key={doc._id}
            href={`${api.defaults.baseURL}${doc.fileUrl}`}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "12px",
              padding: "12px",
              border: `1px solid ${BORDER}`,
              borderRadius: "12px",
              color: "#1e293b",
              textDecoration: "none",
              backgroundColor: "#f8fafc",
            }}
          >
            <span>
              📄 <strong>{doc.title}</strong>
              <div style={{ fontSize: "12px", color: MUTED }}>
                Folder: {doc.folder || "General"}
              </div>
            </span>
            <span style={{ fontSize: "12px", color: MUTED }}>
              {formatDateTime(doc.createdAt)}
            </span>
          </a>
        ))}
      </div>
    )}
  </div>
) : activeTab === "members" ? (
  <div
    style={{
      backgroundColor: WHITE,
      border: `1px solid ${BORDER}`,
      borderRadius: "16px",
      padding: "18px",
    }}
  >
    <h3 style={{ marginTop: 0, color: "#1e293b" }}>Channel Members</h3>

    <div
  style={{
    display: "flex",
    gap: "10px",
    marginBottom: "16px",
    flexWrap: "wrap",
  }}
>
  <select
    value={selectedMember}
    onChange={(e) => setSelectedMember(e.target.value)}
    style={{
      padding: "10px",
      borderRadius: "10px",
      border: `1px solid ${BORDER}`,
      minWidth: "250px",
    }}
  >
    <option value="">Select Staff Member</option>

    {allUsers.map((u) => (
      <option key={u.userId} value={u.userId}>
        {u.fullName} ({u.role})
      </option>
    ))}
  </select>

  <button
    type="button"
    onClick={addMemberToChannel}
    disabled={!selectedMember}
    style={{
      backgroundColor: ROYAL_BLUE,
      color: WHITE,
      border: "none",
      padding: "10px 16px",
      borderRadius: "10px",
      fontWeight: "bold",
      cursor: selectedMember ? "pointer" : "not-allowed",
    }}
  >
    Add Member
  </button>
</div>

    {channelMembers.length === 0 ? (
      <p style={{ color: MUTED }}>No members assigned to this channel yet.</p>
    ) : (
      <div style={{ display: "grid", gap: "10px" }}>
        {channelMembers.map((member) => (
          <div
            key={member.userId}
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "12px",
              padding: "12px",
              border: `1px solid ${BORDER}`,
              borderRadius: "12px",
              backgroundColor: "#f8fafc",
            }}
          >
            <div>
              <strong>{member.fullName}</strong>
              <div style={{ fontSize: "12px", color: MUTED }}>
                {member.role} • {member.branch}
              </div>
            </div>
            <div
  style={{
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "6px",
  }}
>
  <span
    style={{
      fontSize: "12px",
      color: MUTED,
    }}
  >
    {member.dutyStatus}
  </span>

  {member.userId !== user?.userId && (
    <button
      type="button"
      onClick={() => removeMemberFromChannel(member.userId)}
      style={{
        backgroundColor: "#dc2626",
        color: WHITE,
        border: "none",
        borderRadius: "8px",
        padding: "4px 8px",
        cursor: "pointer",
        fontSize: "11px",
      }}
    >
      Remove
    </button>
  )}
</div>
          </div>
        ))}
      </div>
    )}
    </div>
    ) : activeTab === "tasks" ? (
  <div
    style={{
      backgroundColor: WHITE,
      border: `1px solid ${BORDER}`,
      borderRadius: "16px",
      padding: "18px",
    }}
  >
    <h3 style={{ marginTop: 0, color: "#1e293b" }}>Channel Tasks</h3>

    <form
      onSubmit={createChannelTask}
      style={{
        display: "grid",
        gap: "10px",
        backgroundColor: "#f8fafc",
        border: `1px solid ${BORDER}`,
        borderRadius: "14px",
        padding: "14px",
        marginBottom: "18px",
      }}
    >
      <input
        value={taskTitle}
        onChange={(e) => setTaskTitle(e.target.value)}
        placeholder="Task title"
        style={{
          padding: "11px",
          borderRadius: "10px",
          border: `1px solid ${BORDER}`,
        }}
      />

      <textarea
        value={taskDescription}
        onChange={(e) => setTaskDescription(e.target.value)}
        placeholder="Task description"
        rows={2}
        style={{
          resize: "none",
          padding: "11px",
          borderRadius: "10px",
          border: `1px solid ${BORDER}`,
          fontFamily: "Arial, sans-serif",
        }}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 160px 160px 140px",
          gap: "10px",
        }}
      >
        <select
          value={taskAssignedTo}
          onChange={(e) => setTaskAssignedTo(e.target.value)}
          style={{ padding: "10px", borderRadius: "10px", border: `1px solid ${BORDER}` }}
        >
          <option value="">Assign to...</option>
          {allUsers.map((staff) => (
            <option key={staff.userId} value={staff.userId}>
              {staff.fullName}
            </option>
          ))}
        </select>

        <select
          value={taskPriority}
          onChange={(e) => setTaskPriority(e.target.value)}
          style={{ padding: "10px", borderRadius: "10px", border: `1px solid ${BORDER}` }}
        >
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
          <option value="Critical">Critical</option>
        </select>

        <input
          type="date"
          value={taskDueDate}
          onChange={(e) => setTaskDueDate(e.target.value)}
          style={{ padding: "10px", borderRadius: "10px", border: `1px solid ${BORDER}` }}
        />

        <button
          type="submit"
          style={{
            backgroundColor: ROYAL_BLUE,
            color: WHITE,
            border: "none",
            borderRadius: "10px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Create Task
        </button>
      </div>
    </form>

    {channelTasks.length === 0 ? (
      <p style={{ color: MUTED }}>No tasks created for this channel yet.</p>
    ) : (
      <div style={{ display: "grid", gap: "12px" }}>
        {channelTasks.map((task) => (
          <div
            key={task._id}
            style={{
              border: `1px solid ${BORDER}`,
              borderRadius: "14px",
              padding: "14px",
              backgroundColor: task.status === "Completed" ? "#f0fdf4" : WHITE,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
              <div>
                <strong style={{ color: "#1e293b" }}>{task.title}</strong>
                <div style={{ fontSize: "13px", color: MUTED, marginTop: "4px" }}>
                  Assigned to: {task.assignedToName || "Unassigned"} • Priority: {task.priority}
                  {task.dueDate ? ` • Due: ${task.dueDate}` : ""}
                </div>
              </div>

              <button
                type="button"
                onClick={() => deleteChannelTask(task._id)}
                style={{
                  backgroundColor: "#dc2626",
                  color: WHITE,
                  border: "none",
                  borderRadius: "8px",
                  padding: "6px 10px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                Delete
              </button>
            </div>

            {task.description && (
              <p style={{ color: "#334155", marginBottom: "12px" }}>
                {task.description}
              </p>
            )}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "160px 1fr 160px",
                gap: "10px",
                alignItems: "center",
              }}
            >
              <select
                value={task.status}
                onChange={(e) =>
                  updateChannelTask(task._id, { status: e.target.value })
                }
                style={{ padding: "9px", borderRadius: "10px", border: `1px solid ${BORDER}` }}
              >
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>

              <input
                type="range"
                min="0"
                max="100"
                value={task.progress || 0}
                onChange={(e) =>
                  updateChannelTask(task._id, { progress: e.target.value })
                }
              />

              <strong style={{ color: ROYAL_BLUE }}>
                {task.progress || 0}% Complete
              </strong>
            </div>

            {task.completedAt && (
              <div style={{ fontSize: "12px", color: MUTED, marginTop: "10px" }}>
                Completed by {task.completedByName || "Staff"} on{" "}
                {formatDateTime(task.completedAt)}
              </div>
            )}
          </div>
        ))}
      </div>
    )}
  </div>
  
) : activeTab === "direct" ? (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "300px 1fr",
      gap: "16px",
      minHeight: "560px",
    }}
  >
    <div
      style={{
        backgroundColor: WHITE,
        border: `1px solid ${BORDER}`,
        borderRadius: "16px",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
      }}
    >
      <h3 style={{ margin: 0, color: "#1e293b" }}>Direct Messages</h3>

      <div style={{ display: "grid", gap: "8px" }}>
        <select
          value={selectedDirectUser}
          onChange={(e) => setSelectedDirectUser(e.target.value)}
          style={{
            padding: "10px",
            borderRadius: "10px",
            border: `1px solid ${BORDER}`,
          }}
        >
          <option value="">Start chat with staff...</option>
          {allUsers
            .filter((staff) => staff.userId !== user?.userId)
            .map((staff) => (
              <option key={staff.userId} value={staff.userId}>
                {staff.fullName} ({staff.role})
              </option>
            ))}
        </select>

        <button
          type="button"
          onClick={startDirectConversation}
          disabled={!selectedDirectUser}
          style={{
            backgroundColor: selectedDirectUser ? ROYAL_BLUE : "#cbd5e1",
            color: WHITE,
            border: "none",
            padding: "10px",
            borderRadius: "10px",
            fontWeight: "bold",
            cursor: selectedDirectUser ? "pointer" : "not-allowed",
          }}
        >
          Start Chat
        </button>
      </div>

      <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: "12px" }}>
        <strong style={{ fontSize: "13px", color: MUTED }}>
          RECENT CHATS
        </strong>

        <div style={{ display: "grid", gap: "8px", marginTop: "10px" }}>
          {directConversations.length === 0 ? (
            <p style={{ color: MUTED, fontSize: "13px" }}>
              No direct conversations yet.
            </p>
          ) : (
            directConversations.map((conversation) => {
              const active =
                activeDirectConversation?._id === conversation._id;
              const profile = conversation.otherUserProfile || {};

              return (
                <button
                  key={conversation._id}
                  type="button"
                  onClick={() => openDirectConversation(conversation)}
                  style={{
                    textAlign: "left",
                    border: `1px solid ${active ? ROYAL_BLUE : BORDER}`,
                    backgroundColor: active ? "#eef4ff" : "#f8fafc",
                    borderRadius: "12px",
                    padding: "10px",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "8px",
                    }}
                  >
                    <strong style={{ color: "#1e293b" }}>
                      {profile.fullName || conversation.otherUserId}
                    </strong>

                    {conversation.unreadCount > 0 && (
                      <span
                        style={{
                          backgroundColor: GOLD,
                          color: "#111827",
                          borderRadius: "999px",
                          padding: "2px 8px",
                          fontSize: "12px",
                          fontWeight: "bold",
                        }}
                      >
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>

                  <div
  style={{
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "12px",
    color: MUTED,
  }}
>
  <span
    style={{
      width: "10px",
      height: "10px",
      borderRadius: "50%",
      backgroundColor: getPresenceColor(
        profile.dutyStatus
      ),
    }}
  />

  {profile.role || "Team Member"} •{" "}
  {profile.dutyStatus || "Status unavailable"}
</div>

                  {conversation.lastMessage?.message && (
                    <div
                      style={{
                        fontSize: "12px",
                        color: MUTED,
                        marginTop: "4px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {conversation.lastMessage.message}
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>

    <div
      style={{
        backgroundColor: WHITE,
        border: `1px solid ${BORDER}`,
        borderRadius: "16px",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {!activeDirectConversation ? (
        <div
          style={{
            padding: "30px",
            color: MUTED,
            textAlign: "center",
          }}
        >
          Select or start a direct conversation.
        </div>
      ) : (
        <>
          <div
            style={{
              padding: "16px",
              borderBottom: `1px solid ${BORDER}`,
              backgroundColor: "#f8fafc",
            }}
          >
            <h3 style={{ margin: 0, color: "#1e293b" }}>
              {activeDirectConversation.otherUserProfile?.fullName ||
                "Direct Chat"}
            </h3>
            <div
  style={{
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
    color: MUTED,
    marginTop: "4px",
  }}
>
  <span
    style={{
      width: "10px",
      height: "10px",
      borderRadius: "50%",
      backgroundColor: getPresenceColor(
        activeDirectConversation.otherUserProfile?.dutyStatus
      ),
    }}
  />

  {activeDirectConversation.otherUserProfile?.role || "Team Member"} •{" "}
  {activeDirectConversation.otherUserProfile?.dutyStatus ||
    "Status unavailable"}
</div>
          </div>

          <div
            style={{
              flex: 1,
              padding: "16px",
              overflowY: "auto",
              backgroundColor: "#f8fafc",
              display: "grid",
              gap: "10px",
              alignContent: "start",
            }}
          >
            {directMessages.length === 0 ? (
              <p style={{ color: MUTED }}>No messages yet.</p>
            ) : (
              directMessages.map((dm) => {
                const mine = dm.senderId === user?.userId;

                return (
                  <div
                    key={dm._id}
                    style={{
                      justifySelf: mine ? "end" : "start",
                      maxWidth: "75%",
                      backgroundColor: mine ? ROYAL_BLUE : WHITE,
                      color: mine ? WHITE : "#334155",
                      border: `1px solid ${mine ? ROYAL_BLUE : BORDER}`,
                      borderRadius: "16px",
                      padding: "10px 12px",
                      boxShadow: "0 8px 18px rgba(15,23,42,0.05)",
                    }}
                  >
                    <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
                      {dm.message}
                    </div>

                    {renderAttachments(dm, mine)}

                    <div
                      style={{
                        fontSize: "11px",
                        opacity: 0.75,
                        marginTop: "6px",
                        textAlign: "right",
                      }}
                    >
                      {formatDateTime(dm.createdAt)}
                      {mine && dm.isRead ? " • Read" : ""}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <form
            onSubmit={sendDirectMessage}
            style={{
              borderTop: `1px solid ${BORDER}`,
              padding: "12px",
              display: "flex",
              gap: "10px",
            }}
          >
            <textarea
              value={directMessageText}
              onChange={(e) => setDirectMessageText(e.target.value)}
              rows={2}
              placeholder="Type a direct message..."
              style={{
                flex: 1,
                resize: "none",
                padding: "11px",
                borderRadius: "12px",
                border: `1px solid ${BORDER}`,
                fontFamily: "Arial, sans-serif",
              }}
            />

            <input
              type="file"
              multiple
              onChange={(e) =>
                setDirectMessageFiles(Array.from(e.target.files || []))
              }
              style={{ maxWidth: "190px", fontSize: "13px" }}
            />

            <button
              type="submit"
              disabled={
                !directMessageText.trim() && directMessageFiles.length === 0
              }
              style={{
                backgroundColor:
                  directMessageText.trim() || directMessageFiles.length > 0
                    ? ROYAL_BLUE
                    : "#cbd5e1",
                color: WHITE,
                border: "none",
                padding: "0 18px",
                borderRadius: "12px",
                fontWeight: "bold",
                cursor:
                  directMessageText.trim() || directMessageFiles.length > 0
                    ? "pointer"
                    : "not-allowed",
              }}
            >
              Send
            </button>
          </form>
        </>
      )}
    </div>
  </div>
) : activeTab === "posts" ? (
  <>
    <form
      onSubmit={sendAnnouncement}
      style={{
        backgroundColor: "#fff7ed",
        border: `1px solid ${GOLD}`,
        borderRadius: "16px",
        padding: "16px",
        marginBottom: "18px",
        display: "grid",
        gap: "10px",
      }}
    >
      <strong style={{ color: "#92400e" }}>📢 Channel Announcement</strong>

      <input
        value={announcementTitle}
        onChange={(e) => setAnnouncementTitle(e.target.value)}
        placeholder="Announcement title"
        style={{
          padding: "11px",
          borderRadius: "10px",
          border: `1px solid ${BORDER}`,
        }}
      />

      <textarea
        value={announcementMessage}
        onChange={(e) => setAnnouncementMessage(e.target.value)}
        placeholder="Write announcement..."
        rows={3}
        style={{
          resize: "none",
          padding: "11px",
          borderRadius: "10px",
          border: `1px solid ${BORDER}`,
          fontFamily: "Arial, sans-serif",
        }}
      />

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <select
          value={announcementPriority}
          onChange={(e) => setAnnouncementPriority(e.target.value)}
          style={{
            padding: "10px",
            borderRadius: "10px",
            border: `1px solid ${BORDER}`,
          }}
        >
          <option value="Normal">Normal</option>
          <option value="Important">Important</option>
          <option value="Urgent">Urgent</option>
        </select>

        <button
          type="submit"
          style={{
            backgroundColor: GOLD,
            color: "#111827",
            border: "none",
            padding: "10px 16px",
            borderRadius: "10px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Post Announcement
        </button>
      </div>
    </form>

{loadingMessages ? (
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
  const profile = getSenderProfile(item);
  const mine = item.senderId === user?.userId;
  const replies = item.replies || [];
  const expanded = expandedThreads[item._id] ?? true;

  return (
    <div
      key={item._id}
      style={{
        marginBottom: "18px",
        backgroundColor: item.isAnnouncement ? "#fff7ed" : WHITE,
border: `1px solid ${item.isAnnouncement ? GOLD : BORDER}`,
        borderRadius: "16px",
        padding: "16px",
        boxShadow: "0 8px 18px rgba(15,23,42,0.05)",
      }}
    >
      <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            backgroundColor: mine ? ROYAL_BLUE : "#e2e8f0",
            color: mine ? WHITE : "#334155",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "bold",
            flexShrink: 0,
          }}
        >
          <div
  style={{
    position: "relative",
  }}
>
  {getProfileInitials(profile)}

  <span
    style={{
      position: "absolute",
      bottom: "-2px",
      right: "-2px",
      width: "12px",
      height: "12px",
      borderRadius: "50%",
      backgroundColor: getPresenceColor(profile.dutyStatus),
      border: "2px solid white",
    }}
  />
</div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <div style={{ fontWeight: "bold", color: "#1e293b" }}>
                {profile.fullName}
                {mine ? " (You)" : ""}
              </div>
              <div style={{ fontSize: "12px", color: MUTED }}>
                {getRoleLine(profile)}
                {profile.dutyStatus ? ` • ${profile.dutyStatus}` : ""}
              </div>
            </div>

            <div style={{ fontSize: "12px", color: MUTED }}>
              {formatDateTime(item.createdAt)}
            </div>
          </div>

          {item.isPinned && (
  <div style={{ color: ROYAL_BLUE, fontWeight: "bold", marginTop: "10px" }}>
    📌 Pinned Post
  </div>
)}

{item.isAnnouncement && (
  <div
    style={{
      marginTop: "10px",
      backgroundColor: "#ffedd5",
      borderRadius: "10px",
      padding: "10px",
      color: "#92400e",
      fontWeight: "bold",
    }}
  >
    📢 {item.announcementTitle || "Announcement"} • {item.priority}
  </div>
)}

          <div
            style={{
              marginTop: "12px",
              whiteSpace: "pre-wrap",
              lineHeight: 1.55,
              color: "#334155",
            }}
          >
            {item.message}
          </div>

          {renderAttachments(item, false)}

          {item.reactions?.length > 0 && (
  <div
    style={{
      marginTop: "10px",
      display: "flex",
      gap: "8px",
      flexWrap: "wrap",
    }}
  >
    {[...new Set(item.reactions.map((r) => r.emoji))].map((emoji) => {
      const count = item.reactions.filter(
        (r) => r.emoji === emoji
      ).length;

      return (
        <span
          key={emoji}
          style={{
            backgroundColor: "#eef4ff",
            color: ROYAL_BLUE,
            borderRadius: "999px",
            padding: "4px 10px",
            fontWeight: "bold",
            fontSize: "13px",
          }}
        >
          {emoji} {count}
        </span>
      );
    })}
  </div>
)}

          <div
            style={{
              marginTop: "12px",
              display: "flex",
              gap: "10px",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={() =>
                setOpenReplyBox(openReplyBox === item._id ? null : item._id)
              }
              style={{
                border: "none",
                backgroundColor: "#eef4ff",
                color: ROYAL_BLUE,
                padding: "7px 12px",
                borderRadius: "999px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              Reply
            </button>

            <button
  type="button"
  onClick={() => togglePinMessage(item)}
  style={{
    border: "none",
    backgroundColor: item.isPinned ? "#dbeafe" : "#f1f5f9",
    color: ROYAL_BLUE,
    padding: "7px 12px",
    borderRadius: "999px",
    fontWeight: "bold",
    cursor: "pointer",
  }}
>
  {item.isPinned ? "Unpin" : "Pin"}
</button>

<button
  type="button"
  onClick={() => toggleReaction(item._id, "👍")}
  style={{
    border: "none",
    backgroundColor: "#f1f5f9",
    color: "#334155",
    padding: "7px 12px",
    borderRadius: "999px",
    fontWeight: "bold",
    cursor: "pointer",
  }}
>
  👍
</button>

<button
  type="button"
  onClick={() => toggleReaction(item._id, "❤️")}
  style={{
    border: "none",
    backgroundColor: "#f1f5f9",
    color: "#334155",
    padding: "7px 12px",
    borderRadius: "999px",
    fontWeight: "bold",
    cursor: "pointer",
  }}
>
  ❤️
</button>

<button
  type="button"
  onClick={() => toggleReaction(item._id, "🎉")}
  style={{
    border: "none",
    backgroundColor: "#f1f5f9",
    color: "#334155",
    padding: "7px 12px",
    borderRadius: "999px",
    fontWeight: "bold",
    cursor: "pointer",
  }}
>
  🎉
</button>

            {replies.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  setExpandedThreads((prev) => ({
                    ...prev,
                    [item._id]: !expanded,
                  }))
                }
                style={{
                  border: "none",
                  backgroundColor: "transparent",
                  color: ROYAL_BLUE,
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                {expanded ? "Hide" : "Show"} {replies.length}{" "}
                {replies.length === 1 ? "reply" : "replies"}
              </button>
            )}
          </div>

          {expanded && replies.length > 0 && (
            <div
              style={{
                marginTop: "14px",
                borderLeft: `3px solid ${BORDER}`,
                paddingLeft: "14px",
                display: "grid",
                gap: "10px",
              }}
            >
              {replies.map((reply) => {
                const replyProfile = getSenderProfile(reply);
                const replyMine = reply.senderId === user?.userId;

                return (
                  <div
                    key={reply._id}
                    style={{
                      display: "flex",
                      gap: "10px",
                      alignItems: "flex-start",
                    }}
                  >
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        backgroundColor: replyMine ? ROYAL_BLUE : "#e2e8f0",
                        color: replyMine ? WHITE : "#334155",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "bold",
                        fontSize: "12px",
                        flexShrink: 0,
                      }}
                    >
                      <div
  style={{
    position: "relative",
  }}
>
  {getProfileInitials(replyProfile)}

  <span
    style={{
      position: "absolute",
      bottom: "-2px",
      right: "-2px",
      width: "10px",
      height: "10px",
      borderRadius: "50%",
      backgroundColor: getPresenceColor(
        replyProfile.dutyStatus
      ),
      border: "2px solid white",
    }}
  />
</div>
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: "bold", color: "#1e293b" }}>
                        {replyProfile.fullName}
                        {replyMine ? " (You)" : ""}
                      </div>

                      <div style={{ fontSize: "12px", color: MUTED }}>
                        {getRoleLine(replyProfile)} •{" "}
                        {formatDateTime(reply.createdAt)}
                      </div>

                      <div
                        style={{
                          marginTop: "6px",
                          whiteSpace: "pre-wrap",
                          lineHeight: 1.5,
                          color: "#334155",
                        }}
                      >
                        {reply.message}
                      </div>

                      {renderAttachments(reply, false)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {openReplyBox === item._id && (
            <div
              style={{
                marginTop: "14px",
                backgroundColor: "#f8fafc",
                border: `1px solid ${BORDER}`,
                borderRadius: "12px",
                padding: "10px",
                display: "grid",
                gap: "8px",
              }}
            >
              <textarea
                value={replyDrafts[item._id] || ""}
                onChange={(e) =>
                  setReplyDrafts((prev) => ({
                    ...prev,
                    [item._id]: e.target.value,
                  }))
                }
                placeholder="Reply to this conversation..."
                rows={2}
                style={{
                  resize: "none",
                  padding: "10px",
                  borderRadius: "10px",
                  border: `1px solid ${BORDER}`,
                  fontFamily: "Arial, sans-serif",
                  fontSize: "13px",
                }}
              />

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                }}
              >
                <input
                  type="file"
                  multiple
                  onChange={(e) =>
                    setReplyFiles((prev) => ({
                      ...prev,
                      [item._id]: Array.from(e.target.files || []),
                    }))
                  }
                  style={{ fontSize: "12px" }}
                />

                <button
                  type="button"
                  onClick={() => sendReply(item._id)}
                  disabled={
                    !(replyDrafts[item._id] || "").trim() &&
                    !(replyFiles[item._id] || []).length
                  }
                  style={{
                    backgroundColor:
                      (replyDrafts[item._id] || "").trim() ||
                      (replyFiles[item._id] || []).length
                        ? GOLD
                        : "#cbd5e1",
                    color: "#111827",
                    border: "none",
                    padding: "9px 14px",
                    borderRadius: "10px",
                    fontWeight: "bold",
                    cursor:
                      (replyDrafts[item._id] || "").trim() ||
                      (replyFiles[item._id] || []).length
                        ? "pointer"
                        : "not-allowed",
                  }}
                >
                  Send Reply
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
                                );
              })
            )}
          </>
        ) : null}
        </section>

        {activeTab === "posts" && (

        <form
          className="team-hub-compose"
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

          <input
            className="team-hub-file-input"
            type="file"
            multiple
            onChange={(e) => setAttachments(Array.from(e.target.files || []))}
            disabled={!activeChannel}
            style={{
              maxWidth: "220px",
              fontSize: "13px",
            }}
          />

          <button
            type="submit"
            disabled={!activeChannel || (!message.trim() && attachments.length === 0)}
            style={{
              backgroundColor:
                activeChannel && (message.trim() || attachments.length > 0)
                  ? ROYAL_BLUE
                  : "#cbd5e1",
              color: WHITE,
              border: "none",
              padding: "0 24px",
              borderRadius: "12px",
              fontWeight: "bold",
              cursor:
                activeChannel && (message.trim() || attachments.length > 0)
                  ? "pointer"
                  : "not-allowed",
            }}
          >
            Send
          </button>
        </form>
        )}
      </main>
    </div>
  );
}

export default TeamHub;