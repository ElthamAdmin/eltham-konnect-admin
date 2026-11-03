import { useEffect, useState } from "react";
import api from "../api";
import RewardsWheelEditor from "../components/RewardsWheelEditor";

function RewardsHubAdmin() {
  const [posts, setPosts] = useState([]);
  const [entriesByPost, setEntriesByPost] = useState({});
  const [games, setGames] = useState([]);
  const [playsByGame, setPlaysByGame] = useState({});
    const [wheelSegments, setWheelSegments] = useState(
    Array.from({ length: 4 }, () => ({
      label: "",
      prizeType: "No Prize",
      points: "0",
    }))
  );
    const [crosswordMode, setCrosswordMode] = useState("custom");

  const [crosswordEntries, setCrosswordEntries] = useState([
    { answer: "", clue: "" },
    { answer: "", clue: "" },
    { answer: "", clue: "" },
  ]);

  const [answerKeys, setAnswerKeys] = useState({});
  const [answerKeyLoading, setAnswerKeyLoading] = useState(null);
  const [gameData, setGameData] = useState({
  title: "",
  instructions: "",
  gameType: "Trivia",
  question: "",
  correctAnswer: "",
  options: "",
  rewardText: "",
  rewardPoints: "",
  startDate: "",
  endDate: "",
});
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
    fetchGames();
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

const fetchGames = async () => {
  try {
    const res = await api.get("/api/rewards-hub-games");
    setGames(res.data.data || []);
  } catch (error) {
    console.error("Error loading Rewards Hub games:", error);
  }
};

const handleGameChange = (e) => {
  setGameData((prev) => ({
    ...prev,
    [e.target.name]: e.target.value,
  }));
};

const createGame = async () => {
  try {
    if (
      !gameData.title.trim() ||
      !gameData.instructions.trim() ||
      !gameData.gameType
    ) {
      alert("Title, instructions, and game type are required.");
      return;
    }

    const payload = {
      ...gameData,
      title: gameData.title.trim(),
      instructions: gameData.instructions.trim(),
    };

    if (gameData.gameType === "Crossword") {
      payload.question = "";
      payload.correctAnswer = "";
      payload.options = "";

      if (crosswordMode === "custom") {
        const entries = crosswordEntries.map((entry) => ({
          answer: entry.answer.trim().toUpperCase(),
          clue: entry.clue.trim(),
        }));

        if (
          entries.length < 3 ||
          entries.length > 8 ||
          entries.some(
            (entry) =>
              !/^[A-Z]{3,12}$/.test(entry.answer) ||
              !entry.clue ||
              entry.clue.length > 250
          )
        ) {
          alert(
            "Enter 3–8 answers with a clue for each. " +
            "Answers must contain 3–12 letters without spaces. " +
            "Clues must contain 1–250 characters."
          );
          return;
        }

        if (
          new Set(entries.map((entry) => entry.answer)).size !==
          entries.length
        ) {
          alert("Crossword answers must be distinct.");
          return;
        }

        payload.crosswordEntries = entries;
      }
    }

    if (gameData.gameType === "Find-a-Word") {
      const words = gameData.options
        .split(",")
        .map((word) => word.trim().toUpperCase())
        .filter(Boolean);

      if (
        words.length > 0 &&
        (
          words.length < 3 ||
          words.length > 10 ||
          words.some((word) => !/^[A-Z]{3,12}$/.test(word)) ||
          new Set(words).size !== words.length
        )
      ) {
        alert(
          "Enter 3–10 distinct words, separated by commas. " +
          "Each word must contain 3–12 letters without spaces. " +
          "Leave the list blank to use the default words."
        );
        return;
      }

      payload.options = words.join(",");
      payload.question = "";
      payload.correctAnswer = "";
    }

        if (gameData.gameType === "Spin Wheel") {
      const segments = wheelSegments.map((segment) => ({
        label: segment.label.trim(),
        prizeType: segment.prizeType,
        points:
          segment.prizeType === "Points"
            ? segment.points
            : "0",
      }));

      const validTypes = [
        "Points",
        "Gift Card",
        "Phone Credit",
        "Other",
        "No Prize",
      ];

      const invalid = segments.some((segment) => {
        if (
          !segment.label ||
          segment.label.length > 60 ||
          !validTypes.includes(segment.prizeType)
        ) {
          return true;
        }

        if (segment.prizeType === "Points") {
          const amount = Number(segment.points);

          return (
            !/^\d+$/.test(String(segment.points).trim()) ||
            !Number.isSafeInteger(amount) ||
            amount < 1 ||
            amount > 1500
          );
        }

        return false;
      });

      if (
        segments.length < 4 ||
        segments.length > 12 ||
        invalid
      ) {
        alert(
          "Enter 4–12 segments with a prize description and type. " +
          "EK Points prizes must contain 1–1,500 whole points."
        );
        return;
      }

      payload.wheelSegments = segments;
      payload.question = "";
      payload.correctAnswer = "";
      payload.options = "";
      payload.rewardPoints = "0";
    }

    await api.post("/api/rewards-hub-games", payload);

    setGameData({
      title: "",
      instructions: "",
      gameType: "Trivia",
      question: "",
      correctAnswer: "",
      options: "",
      rewardText: "",
      rewardPoints: "",
      startDate: "",
      endDate: "",
    });

        setWheelSegments(
      Array.from({ length: 4 }, () => ({
        label: "",
        prizeType: "No Prize",
        points: "0",
      }))
    );

    setCrosswordMode("custom");
    setCrosswordEntries([
      { answer: "", clue: "" },
      { answer: "", clue: "" },
      { answer: "", clue: "" },
    ]);

    await fetchGames();
    alert("Game created successfully.");
  } catch (error) {
    alert(
      error?.response?.data?.message ||
      "Game could not be created."
    );
  }
};

const updateCrosswordEntry = (index, field, value) => {
  setCrosswordEntries((previous) =>
    previous.map((entry, entryIndex) =>
      entryIndex === index
        ? {
            ...entry,
            [field]:
              field === "answer"
                ? value.toUpperCase()
                : value,
          }
        : entry
    )
  );
};

const toggleAnswerKey = async (gameId) => {
  if (answerKeyLoading) return;

  if (answerKeys[gameId]) {
    setAnswerKeys((previous) => {
      const next = { ...previous };
      delete next[gameId];
      return next;
    });
    return;
  }

  setAnswerKeyLoading(gameId);

  try {
    const response = await api.get(
      `/api/rewards-hub-games/${gameId}/answer-key`
    );

    setAnswerKeys((previous) => ({
      ...previous,
      [gameId]: response.data.data,
    }));
  } catch (error) {
    alert(
      error?.response?.data?.message ||
      "Could not load the answer key."
    );
  } finally {
    setAnswerKeyLoading(null);
  }
};

const fetchPlaysForGame = async (gameId) => {
  try {
    const res = await api.get(`/api/rewards-hub-games/${gameId}/plays`);

    setPlaysByGame((prev) => ({
      ...prev,
      [gameId]: res.data.data || [],
    }));
  } catch (error) {
    alert(error?.response?.data?.message || "Could not load game plays.");
  }
};

const removeGame = async (id) => {
  if (!window.confirm("Remove this game?")) return;

  try {
    await api.delete(`/api/rewards-hub-games/${id}`);
    await fetchGames();
  } catch (error) {
    alert(error?.response?.data?.message || "Game could not be removed.");
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
      
      <div
  style={{
    backgroundColor: WHITE,
    border: `1px solid ${BORDER}`,
    borderRadius: "12px",
    padding: "18px",
    marginBottom: "20px",
  }}
>
  <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>Create Rewards Hub Game</h2>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
      gap: "12px",
    }}
  >
    <input
      name="title"
      placeholder="Game Title"
      value={gameData.title}
      onChange={handleGameChange}
      style={{ padding: "10px", borderRadius: "8px", border: `1px solid ${BORDER}` }}
    />

    <select
      name="gameType"
      value={gameData.gameType}
      onChange={handleGameChange}
      style={{ padding: "10px", borderRadius: "8px", border: `1px solid ${BORDER}` }}
    >
      <option>Trivia</option>
      <option>Spin Wheel</option>
      <option>Scavenger Hunt</option>
      <option>Match Image</option>
      <option>Scratch Card</option>
      <option>Sudoku</option>
      <option>Find-a-Word</option>
      <option>Snake</option>
      <option>Chess</option>
      <option>Crossword</option>
    </select>

    <input
      name="question"
      placeholder="Question / Clue"
                  disabled={
        ["Sudoku", "Find-a-Word", "Snake", "Chess", "Crossword", "Spin Wheel"]
  .includes(gameData.gameType)
      }
      value={gameData.question}
      onChange={handleGameChange}
      style={{ padding: "10px", borderRadius: "8px", border: `1px solid ${BORDER}` }}
    />

    <input
      name="correctAnswer"
      placeholder="Correct Answer"
                        disabled={
        ["Sudoku", "Find-a-Word", "Snake", "Chess", "Crossword", "Spin Wheel"]
  .includes(gameData.gameType)
      }
      value={gameData.correctAnswer}
      onChange={handleGameChange}
      style={{ padding: "10px", borderRadius: "8px", border: `1px solid ${BORDER}` }}
    />

        <label
      style={{
        display: "grid",
        gap: "6px",
        color: ROYAL_BLUE,
        fontSize: "13px",
      }}
    >
      {gameData.gameType === "Find-a-Word"
        ? "Find-a-Word — custom word list"
        : "Answer options"}

      <input
        name="options"
        placeholder={
          gameData.gameType === "Find-a-Word"
            ? "ELTHAM, KONNECT, PACKAGE"
            : "Options separated by commas"
        }
        disabled={
          ["Sudoku", "Snake", "Chess", "Crossword", "Spin Wheel"]
            .includes(gameData.gameType)
        }
        value={gameData.options}
        onChange={handleGameChange}
        style={{
          width: "100%",
          minWidth: 0,
          boxSizing: "border-box",
          padding: "10px",
          borderRadius: "8px",
          border: `1px solid ${BORDER}`,
        }}
      />

      {gameData.gameType === "Find-a-Word" ? (
        <span style={{ color: MUTED, lineHeight: 1.5 }}>
          Enter 3–10 distinct words, separated by commas.
          Each word needs 3–12 letters without spaces.
          Leave blank to use the default words.
        </span>
      ) : null}
    </label>

    <input
      name="rewardText"
      placeholder="Reward Text"
      value={gameData.rewardText}
      onChange={handleGameChange}
      style={{ padding: "10px", borderRadius: "8px", border: `1px solid ${BORDER}` }}
    />

    <input
      type="number"
      name="rewardPoints"
            placeholder={
        gameData.gameType === "Spin Wheel"
          ? "Set points in each wheel segment below"
          : "EK Points Reward"
      }
      value={gameData.rewardPoints}
            disabled={gameData.gameType === "Spin Wheel"}
      onChange={handleGameChange}
      style={{ padding: "10px", borderRadius: "8px", border: `1px solid ${BORDER}` }}
    />

    <input
      type="date"
      name="startDate"
      value={gameData.startDate}
      onChange={handleGameChange}
      style={{ padding: "10px", borderRadius: "8px", border: `1px solid ${BORDER}` }}
    />

    <input
      type="date"
      name="endDate"
      value={gameData.endDate}
      onChange={handleGameChange}
      style={{ padding: "10px", borderRadius: "8px", border: `1px solid ${BORDER}` }}
    />
  </div>

    {gameData.gameType === "Spin Wheel" ? (
    <RewardsWheelEditor
      segments={wheelSegments}
      onChange={setWheelSegments}
    />
  ) : null}

    {gameData.gameType === "Crossword" ? (
    <div
      style={{
        marginTop: "16px",
        padding: "16px",
        border: `1px solid ${BORDER}`,
        borderRadius: "10px",
        backgroundColor: "#f8fafc",
      }}
    >
      <h3 style={{ marginTop: 0, color: ROYAL_BLUE }}>
        Crossword content
      </h3>

      <label
        style={{
          display: "grid",
          gap: "6px",
          maxWidth: "360px",
        }}
      >
        Puzzle content

        <select
          value={crosswordMode}
          onChange={(event) =>
            setCrosswordMode(event.target.value)
          }
          style={{
            padding: "10px",
            borderRadius: "8px",
            border: `1px solid ${BORDER}`,
          }}
        >
          <option value="custom">
            Use my own answers and clues
          </option>
          <option value="preset">
            Use a built-in shipping puzzle
          </option>
        </select>
      </label>

      {crosswordMode === "custom" ? (
        <>
          <p style={{ color: MUTED, lineHeight: 1.6 }}>
            Enter 3–8 distinct answers and their clues.
            Answers need 3–12 letters without spaces.
            Use words with shared letters so they can cross.
            Every answer must fit before the game can publish.
          </p>

          {crosswordEntries.map((entry, index) => (
            <div
              key={index}
              style={{
                padding: "12px",
                marginBottom: "10px",
                border: `1px solid ${BORDER}`,
                borderRadius: "8px",
                backgroundColor: WHITE,
              }}
            >
              <strong style={{ color: ROYAL_BLUE }}>
                Entry {index + 1}
              </strong>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "10px",
                  marginTop: "8px",
                }}
              >
                <label style={{ display: "grid", gap: "5px" }}>
                  Answer

                  <input
                    type="text"
                    value={entry.answer}
                    maxLength={12}
                    autoComplete="off"
                    spellCheck={false}
                    placeholder="PACKAGE"
                    onChange={(event) =>
                      updateCrosswordEntry(
                        index,
                        "answer",
                        event.target.value
                      )
                    }
                    style={{
                      width: "100%",
                      minWidth: 0,
                      boxSizing: "border-box",
                      padding: "10px",
                      borderRadius: "8px",
                      border: `1px solid ${BORDER}`,
                    }}
                  />
                </label>

                <label style={{ display: "grid", gap: "5px" }}>
                  Customer clue

                  <input
                    type="text"
                    value={entry.clue}
                    maxLength={250}
                    placeholder="An item boxed for transport"
                    onChange={(event) =>
                      updateCrosswordEntry(
                        index,
                        "clue",
                        event.target.value
                      )
                    }
                    style={{
                      width: "100%",
                      minWidth: 0,
                      boxSizing: "border-box",
                      padding: "10px",
                      borderRadius: "8px",
                      border: `1px solid ${BORDER}`,
                    }}
                  />
                </label>
              </div>

              <button
                type="button"
                disabled={crosswordEntries.length <= 3}
                onClick={() =>
                  setCrosswordEntries((previous) =>
                    previous.filter(
                      (_, entryIndex) => entryIndex !== index
                    )
                  )
                }
                style={{
                  marginTop: "10px",
                  padding: "8px 12px",
                  border: `1px solid ${BORDER}`,
                  borderRadius: "8px",
                  backgroundColor: WHITE,
                  color: "#b91c1c",
                  cursor:
                    crosswordEntries.length <= 3
                      ? "default"
                      : "pointer",
                  opacity:
                    crosswordEntries.length <= 3 ? 0.5 : 1,
                }}
              >
                Remove entry
              </button>
            </div>
          ))}

          <button
            type="button"
            disabled={crosswordEntries.length >= 8}
            onClick={() =>
              setCrosswordEntries((previous) =>
                previous.length >= 8
                  ? previous
                  : [...previous, { answer: "", clue: "" }]
              )
            }
            style={{
              padding: "10px 14px",
              border: `1px solid ${ROYAL_BLUE}`,
              borderRadius: "8px",
              backgroundColor: WHITE,
              color: ROYAL_BLUE,
              fontWeight: "bold",
              cursor:
                crosswordEntries.length >= 8
                  ? "default"
                  : "pointer",
              opacity:
                crosswordEntries.length >= 8 ? 0.5 : 1,
            }}
          >
            Add answer and clue
          </button>
        </>
      ) : (
        <p style={{ color: MUTED, lineHeight: 1.6 }}>
          A built-in shipping puzzle will be selected.
          You can view its answer key after publishing.
        </p>
      )}
    </div>
  ) : null}

  <textarea
    name="instructions"
    placeholder="Game instructions..."
    value={gameData.instructions}
    onChange={handleGameChange}
    rows="4"
    style={{
      width: "100%",
      marginTop: "12px",
      padding: "10px",
      borderRadius: "8px",
      border: `1px solid ${BORDER}`,
      boxSizing: "border-box",
    }}
  />

  <button
    onClick={createGame}
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
    Publish Game
  </button>
</div>

<div style={{ display: "grid", gap: "14px", marginBottom: "20px" }}>
  <h2 style={{ color: ROYAL_BLUE, marginBottom: 0 }}>Active Games</h2>

  {games.length > 0 ? (
    games.map((game) => (
      <div
        key={game._id}
        style={{
          backgroundColor: WHITE,
          border: `1px solid ${BORDER}`,
          borderRadius: "12px",
          padding: "16px",
        }}
      >
        <h3 style={{ marginTop: 0, color: ROYAL_BLUE }}>{game.title}</h3>
        <p style={{ color: MUTED }}>{game.gameType}</p>
        <p>{game.instructions}</p>

        {game.question ? <p><strong>Question/Clue:</strong> {game.question}</p> : null}
        {game.rewardText ? <p style={{ color: "#16a34a", fontWeight: "bold" }}>Reward: {game.rewardText}</p> : null}
        {Number(game.rewardPoints || 0) > 0 ? (
          <p style={{ color: ROYAL_BLUE, fontWeight: "bold" }}>
            EK Points: {Number(game.rewardPoints || 0).toLocaleString()}
          </p>
        ) : null}

                {game.gameType === "Find-a-Word" ? (
          <div
            style={{
              padding: "12px",
              marginTop: "12px",
              border: `1px solid ${BORDER}`,
              borderRadius: "8px",
              backgroundColor: "#f8fafc",
            }}
          >
            <strong>Published word list</strong>
            <p style={{ marginBottom: 0 }}>
              {(game.publicConfig?.words || []).join(", ") ||
                "No word list available."}
            </p>
          </div>
        ) : null}

        {game.gameType === "Crossword" ? (
          <div style={{ marginTop: "12px" }}>
            <button
              type="button"
              disabled={Boolean(answerKeyLoading)}
              onClick={() => toggleAnswerKey(game._id)}
              style={{
                padding: "9px 13px",
                border: `1px solid ${ROYAL_BLUE}`,
                borderRadius: "8px",
                backgroundColor: WHITE,
                color: ROYAL_BLUE,
                fontWeight: "bold",
                cursor: answerKeyLoading ? "default" : "pointer",
              }}
            >
              {answerKeyLoading === game._id
                ? "Loading answer key..."
                : answerKeys[game._id]
                  ? "Hide answer key"
                  : "View answer key"}
            </button>

            {answerKeys[game._id] ? (
              <div
                style={{
                  marginTop: "10px",
                  padding: "12px",
                  border: `1px solid ${BORDER}`,
                  borderRadius: "8px",
                  backgroundColor: "#f8fafc",
                  overflowX: "auto",
                }}
              >
                <strong>Staff answer key</strong>

                <table
                  style={{
                    width: "100%",
                    minWidth: "420px",
                    marginTop: "10px",
                    borderCollapse: "collapse",
                  }}
                >
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", padding: "8px" }}>
                        Clue
                      </th>
                      <th style={{ textAlign: "left", padding: "8px" }}>
                        Question
                      </th>
                      <th style={{ textAlign: "left", padding: "8px" }}>
                        Answer
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {answerKeys[game._id].entries.map((entry) => (
                      <tr
                        key={`${entry.direction}-${entry.number}`}
                      >
                        <td style={{ padding: "8px" }}>
                          {entry.number}{" "}
                          {entry.direction === "across"
                            ? "Across"
                            : "Down"}
                        </td>
                        <td style={{ padding: "8px" }}>
                          {entry.clue}
                        </td>
                        <td
                          style={{
                            padding: "8px",
                            fontWeight: "bold",
                            color: ROYAL_BLUE,
                          }}
                        >
                          {entry.answer}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        ) : null}

        {playsByGame[game._id] ? (
          <div
            style={{
              marginTop: "12px",
              padding: "12px",
              backgroundColor: "#f8fafc",
              border: `1px solid ${BORDER}`,
              borderRadius: "10px",
              overflowX: "auto",
            }}
          >
            <strong>Plays: {playsByGame[game._id].length}</strong>

            <table
              border="1"
              cellPadding="8"
              style={{
                width: "100%",
                marginTop: "10px",
                borderCollapse: "collapse",
                borderColor: BORDER,
              }}
            >
              <thead style={{ backgroundColor: "#eef4ff" }}>
                <tr>
                  <th>Customer</th>
                  <th>EKON ID</th>
                  <th>Answer</th>
                  <th>Correct</th>
                  <th>Points Credited</th>
                  <th>Prize</th>
                  <th>Fulfilment</th>
                  <th>Played At</th>
                </tr>
              </thead>
              <tbody>
                {playsByGame[game._id].map((play) => (
                  <tr key={play._id}>
                    <td>{play.customerName}</td>
                    <td>{play.customerEkonId}</td>
                    <td>{play.submittedAnswer || "-"}</td>
                    <td>{play.isCorrect ? "YES" : "NO"}</td>
                                        <td>
                      {play.pointsAwarded == null
                        ? "Not recorded"
                        : play.pointsAwarded}
                    </td>
                                        <td>
                      {play.outcome ? (
                        <>
                          <strong>{play.outcome.label}</strong>
                          <div>
                            {play.outcome.prizeType ||
                              (play.outcome.points > 0
                                ? "Points"
                                : "No Prize")}
                          </div>
                        </>
                      ) : (
                        "-"
                      )}
                    </td>

                    <td>
                      {play.outcome?.fulfilmentStatus === "Pending" ? (
                        <strong style={{ color: "#b45309" }}>
                          Pending delivery
                        </strong>
                      ) : (
                        play.outcome?.fulfilmentStatus || "-"
                      )}
                    </td>
                    <td>{play.createdAt ? new Date(play.createdAt).toLocaleString() : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        <button
          onClick={() => fetchPlaysForGame(game._id)}
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
          View Plays
        </button>

        <button
          onClick={() => removeGame(game._id)}
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
          Remove Game
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
      No active games.
    </div>
  )}
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
  {entry.rewardGiven ? (
    <span style={{ color: "#16a34a", fontWeight: "bold" }}>YES</span>
  ) : (
    "-"
  )}
</td>

<td>
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