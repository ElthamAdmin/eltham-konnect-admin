import { useEffect, useState } from "react";
import api from "../api";

function RewardsHubAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const ROYAL_BLUE = "#0B3D91";
  const GOLD = "#D4AF37";
  const WHITE = "#ffffff";
  const BORDER = "#dbe3ef";
  const MUTED = "#64748b";
  const TEXT = "#0f172a";

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/rewards-hub-analytics");
      setAnalytics(res.data.data);
    } catch (error) {
      console.error("Rewards Hub analytics error:", error);
      alert(error?.response?.data?.message || "Could not load analytics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const cardStyle = {
    backgroundColor: WHITE,
    border: `1px solid ${BORDER}`,
    borderRadius: "16px",
    padding: "18px",
    boxShadow: "0 6px 20px rgba(15,23,42,0.05)",
  };

  const metricCard = (label, value, color = ROYAL_BLUE) => (
    <div style={cardStyle}>
      <h2 style={{ margin: 0, color, fontSize: "32px" }}>
        {value}
      </h2>
      <p style={{ marginBottom: 0, color: TEXT, fontWeight: "bold" }}>
        {label}
      </p>
    </div>
  );

  if (loading) {
    return <div style={cardStyle}>Loading Rewards Hub analytics...</div>;
  }

  const totals = analytics?.totals || {};
  const dailyGameActivity = analytics?.dailyGameActivity || [];
  const topPlayers = analytics?.topPlayers || [];

  return (
    <div>
      <h1 style={{ marginTop: 0, color: TEXT }}>Rewards Hub Analytics</h1>
      <p style={{ color: MUTED }}>
        Track games, participation, rewards, and customer engagement.
      </p>

      <div className="analytics-grid">
        {metricCard("Games Played", totals.totalGamesPlayed || 0, ROYAL_BLUE)}
        {metricCard("Correct Answers", totals.totalCorrectAnswers || 0, "#16a34a")}
        {metricCard("Game Rewards Issued", totals.totalGameRewards || 0, GOLD)}
        {metricCard("Rewards Hub Entries", totals.totalEntries || 0, "#7c3aed")}
        {metricCard("Winners Selected", totals.totalWinners || 0, "#f97316")}
        {metricCard("Conversion Rate", `${totals.conversionRate || 0}%`, "#dc2626")}
      </div>

      <div style={{ ...cardStyle, marginTop: "22px" }}>
        <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>Daily Game Activity</h2>

        <table
          border="1"
          cellPadding="10"
          style={{ width: "100%", borderCollapse: "collapse", borderColor: BORDER }}
        >
          <thead style={{ backgroundColor: "#eef4ff" }}>
            <tr>
              <th>Date</th>
              <th>Plays</th>
              <th>Correct Answers</th>
            </tr>
          </thead>
          <tbody>
            {dailyGameActivity.length > 0 ? (
              dailyGameActivity.map((item) => (
                <tr key={item._id}>
                  <td>{item._id}</td>
                  <td>{item.plays}</td>
                  <td>{item.correct}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" style={{ textAlign: "center", color: MUTED }}>
                  No game activity yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ ...cardStyle, marginTop: "22px" }}>
        <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>Top Engaged Customers</h2>
        <p style={{ color: MUTED }}>Only EKON IDs are shown for privacy.</p>

        <table
          border="1"
          cellPadding="10"
          style={{ width: "100%", borderCollapse: "collapse", borderColor: BORDER }}
        >
          <thead style={{ backgroundColor: "#eef4ff" }}>
            <tr>
              <th>Rank</th>
              <th>EKON ID</th>
              <th>Total Games</th>
              <th>Correct Answers</th>
            </tr>
          </thead>
          <tbody>
            {topPlayers.length > 0 ? (
              topPlayers.map((item, index) => (
                <tr key={item._id}>
                  <td>{index + 1}</td>
                  <td style={{ fontWeight: "bold", color: ROYAL_BLUE }}>{item._id}</td>
                  <td>{item.totalGames}</td>
                  <td>{item.correctAnswers}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" style={{ textAlign: "center", color: MUTED }}>
                  No top players yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <button
        onClick={fetchAnalytics}
        style={{
          marginTop: "20px",
          backgroundColor: GOLD,
          color: "black",
          border: "none",
          padding: "10px 16px",
          borderRadius: "8px",
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        Refresh Analytics
      </button>

      <style>
        {`
          .analytics-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 18px;
          }

          @media (max-width: 900px) {
            .analytics-grid {
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>
    </div>
  );
}

export default RewardsHubAnalytics;